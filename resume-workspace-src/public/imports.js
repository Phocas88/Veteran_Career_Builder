import {cleanResumeText} from './resume-text.js?v=20261028-guided';
export const MAX_FILE_BYTES = 10 * 1024 * 1024;
export const MAX_TEXT_LENGTH = 20000;
const MAX_PDF_PAGES = 20;

export function validateFile(file) {
  if (!file || typeof file.name !== 'string') throw new Error('Choose a resume to import.');
  const extension = file.name.split('.').at(-1).toLowerCase();
  if (extension === 'doc') throw new Error('For older Word .doc files, save a copy as .docx and import that copy.');
  if (!['pdf', 'docx', 'txt', 'md'].includes(extension)) throw new Error('Choose a PDF, Word (.docx), or TXT file.');
  if (!file.size) throw new Error('That file is empty. Choose a resume with readable text.');
  if (file.size > MAX_FILE_BYTES) throw new Error('That file is larger than 10 MB. Choose a smaller copy of the resume.');
  return extension;
}

export function normalizeImportedText(value) {
  const text = cleanResumeText(value).replace(/\r\n?/g, '\n').replace(/\u00a0/g, ' ').replace(/\u200b/g, '').replace(/[ \t]+\n/g, '\n').replace(/\n{4,}/g, '\n\n\n').trim();
  if (!text) throw new Error('No readable text was found. For scanned PDFs, use a text-based PDF, Word document, or TXT file.');
  if (text.includes('\u0000') || /[\u0001-\u0008\u000b\u000c\u000e-\u001f]/.test(text)) throw new Error('That file does not contain readable resume text. Choose a PDF, Word (.docx), or TXT file.');
  if (text.length > MAX_TEXT_LENGTH) throw new Error('This resume contains more than 20,000 characters. Shorten it and import it again. Your current draft has not been replaced.');
  return text;
}

export function decodeText(bytes) {
  if (bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46 || bytes[0] === 0x50 && bytes[1] === 0x4b || bytes[0] === 0xd0 && bytes[1] === 0xcf) {
    throw new Error('The file extension does not match its content. Use the original PDF or Word file.');
  }
  if (bytes[0] === 0xff && bytes[1] === 0xfe) return new TextDecoder('utf-16le').decode(bytes);
  if (bytes[0] === 0xfe && bytes[1] === 0xff) return new TextDecoder('utf-16be').decode(bytes);
  try { return new TextDecoder('utf-8', { fatal: true }).decode(bytes); }
  catch { return new TextDecoder('windows-1252').decode(bytes); }
}

export function validateDocxArchive(bytes) {
  if (bytes.length < 22 || bytes[0] !== 0x50 || bytes[1] !== 0x4b) throw new Error('This is not a readable Word .docx file. Save a fresh .docx copy and try again.');
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let end = -1;
  for (let i = bytes.length - 22; i >= Math.max(0, bytes.length - 65557); i--) {
    if (view.getUint32(i, true) === 0x06054b50 && i + 22 + view.getUint16(i + 20, true) === bytes.length) { end = i; break; }
  }
  if (end < 0) throw new Error('The Word file appears incomplete or damaged. Save a fresh .docx copy and try again.');
  const count = view.getUint16(end + 10, true);
  const directorySize = view.getUint32(end + 12, true);
  let offset = view.getUint32(end + 16, true);
  const directoryEnd = offset + directorySize;
  if (!count || count > 1000 || directoryEnd > end || view.getUint16(end + 4, true) || view.getUint16(end + 6, true)) throw new Error('That Word file is too complex to import. Save a simpler .docx copy.');
  let total = 0; let hasDocument = false;
  for (let i = 0; i < count; i++) {
    if (offset + 46 > directoryEnd || view.getUint32(offset, true) !== 0x02014b50) throw new Error('The Word file appears damaged. Save a fresh .docx copy.');
    const flags = view.getUint16(offset + 8, true);
    const size = view.getUint32(offset + 24, true);
    const nameSize = view.getUint16(offset + 28, true);
    const extraSize = view.getUint16(offset + 30, true);
    const commentSize = view.getUint16(offset + 32, true);
    const next = offset + 46 + nameSize + extraSize + commentSize;
    if (next > directoryEnd || flags & 1) throw new Error('This Word file is encrypted or damaged. Import an unlocked .docx copy.');
    const name = new TextDecoder().decode(bytes.subarray(offset + 46, offset + 46 + nameSize));
    total += size;
    if (total > 30 * 1024 * 1024 || size > 20 * 1024 * 1024) throw new Error('The expanded Word file is too large. Save a smaller .docx copy.');
    if (name === 'word/document.xml') {
      if (size > 2 * 1024 * 1024) throw new Error('The Word document contains too much text or markup. Save a shorter copy.');
      hasDocument = true;
    }
    offset = next;
  }
  if (!hasDocument) throw new Error('This archive does not contain a Word document. Choose the original .docx file.');
}

export function pdfItemsToText(items) {
  let result = ''; let previous = null;
  for (const item of items) {
    if (typeof item.str !== 'string') continue;
    if (previous && result && !result.endsWith('\n')) {
      const newLine = Math.abs((item.transform?.[5] ?? 0) - (previous.transform?.[5] ?? 0)) > 2;
      if (newLine) result += '\n';
      else if (!/\s$/.test(result) && !/^\s/.test(item.str)) result += ' ';
    }
    result += item.str;
    if (item.hasEOL) result += '\n';
    previous = item;
  }
  return result;
}

export async function importResumeFile(file, onProgress = () => {}) {
  const extension = validateFile(file);
  onProgress('Reading your file…');
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (bytes.length > MAX_FILE_BYTES) throw new Error('That file is larger than 10 MB. Choose a smaller copy.');
  let value;
  if (extension === 'txt' || extension === 'md') value = decodeText(bytes);
  else if (extension === 'docx') {
    validateDocxArchive(bytes);
    onProgress('Reading your Word document…');
    const { extractRawText } = await import('./vendor/mammoth.mjs');
    try { value = (await extractRawText({ arrayBuffer: bytes.buffer })).value; }
    catch { throw new Error('We could not read this Word file. Save an unlocked .docx copy and try again.'); }
  } else {
    const header = new TextDecoder().decode(bytes.subarray(0, 1024));
    if (!header.includes('%PDF-')) throw new Error('This does not look like a PDF file. Choose the original PDF.');
    onProgress('Opening your PDF…');
    const pdfjs = await import('./vendor/pdf.mjs');
    pdfjs.GlobalWorkerOptions.workerSrc = new URL('./vendor/pdf.worker.mjs', import.meta.url).href;
    let task;
    try {
      task = pdfjs.getDocument({ data: bytes, isEvalSupported: false, stopAtErrors: true, cMapUrl: new URL('./vendor/cmaps/', import.meta.url).href, cMapPacked: true, standardFontDataUrl: new URL('./vendor/standard_fonts/', import.meta.url).href, wasmUrl: new URL('./vendor/wasm/', import.meta.url).href });
      const needsPassword = new Promise((_, reject) => {
        task.onPassword = () => { const error = new Error('This PDF needs a password.'); error.name = 'PasswordException'; reject(error); };
      });
      const document = await Promise.race([task.promise, needsPassword]);
      if (document.numPages > MAX_PDF_PAGES) throw new Error('Choose a resume PDF with 20 pages or fewer. Your current draft is unchanged.');
      const pages = [];
      for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber++) {
        onProgress(`Reading PDF page ${pageNumber} of ${document.numPages}…`);
        const page = await document.getPage(pageNumber);
        const content = await page.getTextContent();
        pages.push(pdfItemsToText(content.items));
        page.cleanup();
        if (pages.join('\n\n').length > MAX_TEXT_LENGTH) throw new Error('This PDF contains more than 20,000 characters. Shorten it and try again.');
      }
      value = pages.join('\n\n');
    } catch (error) {
      if (error?.name === 'PasswordException' || /password|destroyed/i.test(error?.message ?? '')) throw new Error('This PDF is password protected. Import an unlocked copy.');
      if (/20 pages|20,000 characters/.test(error?.message ?? '')) throw error;
      throw new Error('We could not read this PDF. It may be damaged or locked. Save a fresh PDF copy and try again.');
    } finally { if (task) { try { await task.destroy(); } catch {} } }
  }
  return normalizeImportedText(value);
}
