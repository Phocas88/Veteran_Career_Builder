import { exportPdf } from './exports.js?v=20261027-resume-studio';

let cache;
export function clearPdfCache() { cache = null; }
export const pdfKey = model => JSON.stringify(model);
async function openPdf(blob) {
  const pdfjs = await import('./vendor/pdf.mjs');
  pdfjs.GlobalWorkerOptions.workerSrc = new URL('./vendor/pdf.worker.mjs', import.meta.url).href;
  return pdfjs.getDocument({ data: new Uint8Array(await blob.arrayBuffer()), isEvalSupported: false, cMapUrl: new URL('./vendor/cmaps/', import.meta.url).href, standardFontDataUrl: new URL('./vendor/standard_fonts/', import.meta.url).href, wasmUrl: new URL('./vendor/wasm/', import.meta.url).href });
}

export async function preparePdf(model) {
  const key = pdfKey(model);
  if (cache?.key === key) return cache.promise;
  const promise = (async () => {
    const blob = await exportPdf(model);
    const task = await openPdf(blob);
    try { return { blob, pageCount: (await task.promise).numPages }; }
    finally { await task.destroy(); }
  })();
  cache = { key, promise };
  try { return await promise; }
  catch (error) { if (cache?.key === key) cache = null; throw error; }
}

export function checkFederalDownload(model, prepared) {
  if (model.applicationType !== 'federal') return;
  if (model.paper !== 'letter') throw new Error('Federal USAJOBS resumes should use US Letter paper. Select US Letter, then check the page preview.');
  if (prepared.pageCount > 2) throw new Error(`This federal resume is ${prepared.pageCount} pages. USAJOBS requires two pages or fewer. Use the rewritten draft or shorten less relevant details, then check the page preview. Nothing has been cut automatically.`);
  if (prepared.blob.size > 5 * 1024 * 1024) throw new Error('This federal PDF exceeds the USAJOBS 5 MB file limit. Shorten the resume and generate it again.');
}

export async function renderPdfPages(container, model, isCurrent) {
  const prepared = await preparePdf(model);
  if (!isCurrent()) return prepared;
  const task = await openPdf(prepared.blob);
  try {
    const pdf = await task.promise;
    const fragment = document.createDocumentFragment();
    for (let number = 1; number <= pdf.numPages; number++) {
      if (!isCurrent()) return prepared;
      const page = await pdf.getPage(number);
      const viewport = page.getViewport({ scale: 1.25 });
      const canvas = document.createElement('canvas');
      canvas.width = Math.ceil(viewport.width); canvas.height = Math.ceil(viewport.height);
      canvas.setAttribute('role', 'img');
      canvas.setAttribute('aria-label', `Resume page ${number} of ${pdf.numPages}`);
      await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
      const wrapper = document.createElement('div');
      wrapper.className = 'pdf-page';
      const label = document.createElement('p'); label.className = 'pdf-page-label'; label.textContent = `PAGE ${number} OF ${pdf.numPages}`;
      wrapper.append(label, canvas); fragment.append(wrapper);
      page.cleanup();
    }
    if (isCurrent()) container.replaceChildren(fragment);
  } finally { await task.destroy(); }
  return prepared;
}
