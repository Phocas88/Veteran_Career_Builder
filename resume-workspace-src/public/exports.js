// One document model drives the preview and every formatted export.
const sectionNames = new Map();
for (const [kind, names] of Object.entries({
  summary: ['summary', 'professional summary', 'career summary', 'profile', 'professional profile', 'objective', 'career objective', 'about me'],
  experience: ['experience', 'work experience', 'professional experience', 'employment', 'employment history', 'work history', 'relevant experience', 'military experience', 'military service', 'civilian experience'],
  skills: ['skills', 'technical skills', 'core skills', 'key skills', 'core competencies', 'competencies', 'areas of expertise', 'qualifications', 'skills & qualifications', 'education & skills'],
  education: ['education', 'academic background', 'education & training', 'education and training', 'education & certifications'],
  certifications: ['certifications', 'certificates', 'licenses', 'licenses & certifications', 'certifications & licenses', 'certifications & clearance', 'training', 'professional development'],
  projects: ['projects', 'selected projects', 'key projects', 'achievements', 'accomplishments', 'career highlights', 'selected achievements'],
  other: ['volunteer experience', 'volunteering', 'community involvement', 'awards', 'honors', 'publications', 'languages', 'interests', 'references', 'additional information']
})) for (const name of names) sectionNames.set(name, kind);

export const designs = {
  classic: { name: 'Classic', fontSize: 10.5, lineHeight: 1.12, nameSize: 23, headingSize: 11, sectionGap: 11, paragraphGap: 4, margin: 44, color: '222222', alignment: 'center' },
  modern: { name: 'Modern', fontSize: 10.5, lineHeight: 1.14, nameSize: 26, headingSize: 11, sectionGap: 12, paragraphGap: 4, margin: 44, color: '245B6A', alignment: 'left' },
  compact: { name: 'Compact', fontSize: 10, lineHeight: 1.08, nameSize: 21, headingSize: 10.5, sectionGap: 8, paragraphGap: 3, margin: 38, color: '222222', alignment: 'left' },
  federal: { name: 'Federal', fontSize: 10, lineHeight: 1.1, nameSize: 19, headingSize: 10.5, sectionGap: 9, paragraphGap: 3, margin: 36, color: '182C43', alignment: 'left' }
};
export const arrangements = {
  original: { name: 'As written', description: 'Keep your current section order.' },
  professional: { name: 'Professional', description: 'Summary, experience, education, then skills.' },
  skills: { name: 'Skills-focused', description: 'Bring skills and qualifications ahead of work history.' },
  combination: { name: 'Combination', description: 'Lead with skills and achievements, followed by experience.' }
};
const orders = {
  professional: ['summary', 'experience', 'education', 'skills', 'certifications', 'projects', 'other'],
  skills: ['summary', 'skills', 'certifications', 'experience', 'education', 'projects', 'other'],
  combination: ['summary', 'skills', 'projects', 'experience', 'education', 'certifications', 'other']
};
export const papers = { letter: { name: 'US Letter', width: 612, height: 792 }, a4: { name: 'A4', width: 595.28, height: 841.89 } };

function headingKind(line) {
  const label = line.trim().replace(/^#{1,6}\s+/u, '').replace(/:$/u, '').replace(/\s+and\s+/giu, ' & ').toLowerCase();
  return sectionNames.get(label) ?? sectionNames.get(label.split(/\s+[–—-]\s+/u)[0]);
}

const bulletPattern = /^[•●▪◦*\-–]\s+/u;
const datePattern = /\b(?:(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\.?\s+(?:19|20)\d{2}|(?:0?[1-9]|1[0-2])\/(?:19|20)\d{2}|(?:19|20)\d{2})\s*(?:–|—|-|to)\s*(?:Present|Current|Now|(?:(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\.?\s+)?(?:19|20)\d{2}|(?:0?[1-9]|1[0-2])\/(?:19|20)\d{2})\b/iu;
const monthYear = /\b(?:(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\.?\s+(?:19|20)\d{2}|(?:0?[1-9]|1[0-2])\/(?:19|20)\d{2})\b/giu;
function keyFor(type, text, index) {
  let hash = 2166136261;
  for (const char of type + text) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
  return `${type}-${(hash >>> 0).toString(36)}-${index}`;
}

export function createResumeDocument(text, options = {}) {
  const design = Object.hasOwn(designs, options.design) ? options.design : 'classic';
  const arrangement = Object.hasOwn(arrangements, options.arrangement) ? options.arrangement : 'original';
  const paper = Object.hasOwn(papers, options.paper) ? options.paper : 'letter';
  const lines = String(text).replace(/\r\n?/gu, '\n').split('\n');
  const prefix = [];
  const sections = [];
  let current;
  for (const raw of lines) {
    const value = raw.trim();
    const kind = headingKind(value);
    if (kind) {
      current = { kind, heading: value.replace(/^#{1,6}\s+/u, ''), lines: [] };
      sections.push(current);
    } else (current ? current.lines : prefix).push(value);
  }
  if (orders[arrangement]) {
    const order = orders[arrangement];
    // Stable section ordering; dates and employment entries are never guessed or reordered.
    sections.sort((a, b) => order.indexOf(a.kind) - order.indexOf(b.kind));
  }
  const nodes = [];
  function addLines(values, header = false, kind = '') {
    let contact = header;
    let blank = false;
    for (let i = 0; i < values.length; i++) {
      const value = values[i];
      if (!value) { contact = false; blank = true; continue; }
      if (/^\[PAGE BREAK\]$/iu.test(value)) { nodes.push({ type: 'break', text: '' }); blank = false; continue; }
      const next = values.slice(i + 1).find(Boolean) ?? '';
      const previous = nodes.at(-1);
      const dated = datePattern.test(value);
      let type = bulletPattern.test(value) ? 'bullet' : contact ? 'contact' : 'body';
      if (kind === 'experience' && type === 'body') {
        if (dated && value.length < 200 && !/[.!?]$/u.test(value)) type = datePattern.exec(value)?.index === 0 ? 'metadata' : 'job';
        else if (value.length < 160 && datePattern.exec(next)?.index === 0) type = 'job';
        else if (previous && ['job', 'metadata'].includes(previous.type) && value.length < 180) type = 'employer';
      }
      if (/^(?:Hours(?: worked)?(?: per week)?|Hours\/week|Series|Grade|Pay plan|Dates|Employer)\s*:/iu.test(value)) type = 'metadata';
      const mayJoin = options.reflow !== false && previous && ['body', 'bullet'].includes(previous.type) && type === 'body' && (!blank || /^[a-z(]/u.test(value) && !/[.!?]$/u.test(previous.text));
      if (mayJoin) previous.text += ' ' + value;
      else {
        if (blank && previous && !['heading', 'break'].includes(previous.type)) nodes.push({ type: 'space', text: '' });
        nodes.push({ type, text: value });
      }
      blank = false;
    }
  }
  while (prefix.length && !prefix[0]) prefix.shift();
  const title = prefix[0] && prefix[0].length <= 100 && !/^[•●▪◦*\-–]\s/u.test(prefix[0]) && (sections.length || prefix.slice(1, 4).some(line => /@/u.test(line))) ? prefix.shift() : '';
  if (title) nodes.push({ type: 'name', text: title });
  addLines(prefix, !!title);
  for (const section of sections) {
    nodes.push({ type: 'heading', text: section.heading });
    addLines(section.lines, false, section.kind);
  }
  while (nodes.at(-1)?.type === 'space') nodes.pop();
  const counts = new Map();
  for (const node of nodes) {
    const key = node.type + node.text;
    const index = counts.get(key) ?? 0; counts.set(key, index + 1);
    node.id = keyFor(node.type, node.text, index);
    node.pageBreak = (options.pageBreaks ?? []).includes(node.id);
  }
  return { design, arrangement, paper, title, nodes, applicationType: options.applicationType ?? 'private', style: designs[design], page: papers[paper] };
}

export function federalChecks(model, announcement = '') {
  const all = model.nodes.map(x => x.text).join('\n');
  const jobs = model.nodes.map((node, index) => ({ node, index })).filter(x => x.node.type === 'job');
  const checks = [];
  const contact = model.nodes.filter(x => ['name', 'contact'].includes(x.type)).map(x => x.text).join('\n');
  if (!/@/u.test(contact) || !/(?:\+?\d{1,3}[ .-]?)?(?:\(\d{3}\)|\d{3})[ .-]?\d{3}[ .-]?\d{4}/u.test(contact)) checks.push('Confirm your name, email address, and phone number are present.');
  if (!announcement.trim()) checks.push('Paste the job announcement so specialized experience and required qualifications can be reviewed.');
  if (/\b(?:degree|education|transcripts?|bachelor|master)\b/iu.test(announcement) && !model.nodes.some(x=>x.type==='heading'&&/education|academic/iu.test(x.text))) checks.push('The announcement mentions education. Add the relevant school, degree or coursework, completion status, and dates if required.');
  if (/\b(?:certification|certified|license|licensure)\b/iu.test(announcement) && !/certification|certified|licen[cs]e|credential/iu.test(all)) checks.push('The announcement mentions a credential. Identify any required license or certification you hold, its issuer and current status. Do not claim a credential you do not have.');
  if (!jobs.length) checks.push('Check each relevant job for title, employer, start/end month and year, and hours per week.');
  for (let i = 0; i < jobs.length; i++) {
    const { node, index } = jobs[i];
    const nextSection = model.nodes.findIndex((x, candidate) => candidate > index && x.type === 'heading');
    const body = model.nodes.slice(index, Math.min(jobs[i + 1]?.index ?? model.nodes.length, nextSection < 0 ? model.nodes.length : nextSection)).map(x => x.text).join('\n');
    if (!/(?:\d+(?:\.\d+)?\s*(?:hours|hrs)\s*(?:per|\/)\s*(?:week|wk)|hours(?: worked)?(?: per week|\/week)?\s*:\s*\d+)/iu.test(body)) checks.push(`${node.text}: add verified hours per week.`);
    const dates = node.text + '\n' + model.nodes.slice(index + 1, index + 4).filter(x => x.type === 'metadata').map(x => x.text).join('\n');
    const matches = dates.match(monthYear) ?? [];
    if (matches.length < (/\b(?:Present|Current|Now)\b/iu.test(dates) ? 1 : 2)) checks.push(`${node.text}: confirm both start/end month and year (or Present).`);
  }
  checks.push('For civilian federal jobs, verify pay plan, series, and grade when applicable. Military rank is not a GS grade.');
  checks.push('Match the announcement’s education, certification, specialized-experience, and supporting-document requirements. This checklist does not establish eligibility.');
  return checks;
}

export function renderResume(container, documentModel) {
  const { style, nodes, design, page } = documentModel;
  container.className = `resume-document design-${design}`;
  for (const [key, value] of Object.entries({ 'body-size': `${style.fontSize}pt`, 'line-height': style.lineHeight, 'name-size': `${style.nameSize}pt`, 'heading-size': `${style.headingSize}pt`, 'section-gap': `${style.sectionGap}pt`, 'paragraph-gap': `${style.paragraphGap}pt`, 'page-margin': `${style.margin}pt`, 'accent': `#${style.color}`, 'paper-width': `${page.width}pt`, 'paper-height': `${page.height}pt`, 'name-align': style.alignment })) container.style.setProperty(`--${key}`, value);
  const fragment = document.createDocumentFragment();
  for (const node of nodes) {
    const el = document.createElement(node.type === 'name' ? 'h2' : node.type === 'heading' ? 'h3' : 'p');
    el.className = `resume-${node.type}${node.pageBreak ? ' force-page-break' : ''}`;
    el.textContent = node.text;
    if (node.type === 'space') el.setAttribute('aria-hidden', 'true');
    fragment.append(el);
  }
  container.replaceChildren(fragment);
}

export function createPdfDefinition(model) {
  const { style: s, nodes, page } = model;
  const width = page.width - s.margin * 2;
  const format = node => {
    const pageBreak = node.pageBreak || node.type === 'break' ? 'before' : undefined;
    if (node.type === 'break') return { text: '', pageBreak };
    if (node.type === 'name') return { text: node.text, style: 'name', margin: [0, 0, 0, 5] };
    if (node.type === 'heading') return { stack: [{ text: node.text, style: 'heading' }, { canvas: [{ type: 'line', x1: 0, y1: 3, x2: width, y2: 3, lineWidth: model.design === 'modern' ? 1 : 0.5, lineColor: `#${s.color}` }] }], pageBreak, margin: [0, s.sectionGap, 0, 7] };
    if (node.type === 'space') return { text: ' ', fontSize: 1, margin: [0, 0, 0, 2] };
    return { text: node.text, pageBreak, ...(node.type === 'job' ? { bold: true, fontSize: s.fontSize + 0.5, margin: [0, 5, 0, 3] } : {}), ...(node.type === 'employer' ? { italics: true, color: '#444444' } : {}), ...(node.type === 'metadata' ? { fontSize: Math.max(9.5, s.fontSize - 0.5), color: '#444444' } : {}), ...(node.type === 'contact' ? { fontSize: 9.5, alignment: s.alignment, color: '#52525b' } : {}), ...(node.type === 'bullet' ? { margin: [10, 0, 0, s.paragraphGap], unbreakable: node.text.length < 1200 } : node.type !== 'job' ? { margin: [0, 0, 0, s.paragraphGap] } : {}) };
  };
  const content = [];
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    if (['heading', 'job'].includes(node.type)) {
      const group = [node];
      let cursor = i + 1;
      while (cursor < nodes.length && group.length < 8) {
        const next = nodes[cursor];
        if (next.pageBreak || next.type === 'break' || next.type === 'heading') break;
        group.push(next); cursor++;
        if (['body', 'bullet'].includes(next.type)) break;
      }
      const size = group.reduce((sum, x) => sum + x.text.length, 0);
      if (size < 1700) {
        content.push({ stack: group.map((x, index) => ({ ...format(x), ...(index === 0 ? { pageBreak: undefined } : {}) })), unbreakable: true, pageBreak: node.pageBreak ? 'before' : undefined });
        i = cursor - 1; continue;
      }
    }
    content.push(format(node));
  }
  return {
    info: { title: model.title ? `${model.title} — Resume` : 'Resume', creator: 'Resume Studio' },
    pageSize: { width: page.width, height: page.height }, pageMargins: [s.margin, s.margin, s.margin, s.margin],
    defaultStyle: { font: 'Roboto', fontSize: s.fontSize, lineHeight: s.lineHeight, color: '#222222' },
    styles: { name: { fontSize: s.nameSize, bold: true, color: `#${s.color}`, alignment: s.alignment }, heading: { fontSize: s.headingSize, bold: true, color: `#${s.color}` } },
    content,
    footer: (current, total) => total > 1 ? { columns: [{ text: model.title || '' }, { text: `${current} / ${total}`, alignment: 'right' }], fontSize: 8, color: '#666666', margin: [s.margin, 12, s.margin, 0] } : null,
    pageBreakBefore: (node, following) => node.style === 'heading' && following.getFollowingNodesOnPage().length === 0
  };
}

export async function exportPdf(model) {
  const { pdfMake } = await import('./vendor/pdf-export.mjs');
  return pdfMake.createPdf(createPdfDefinition(model)).getBlob();
}

export async function exportWord(model) {
  const { Document, Paragraph, TextRun, Packer, HeadingLevel, AlignmentType } = await import('./vendor/word-export.mjs');
  const { style: s, page } = model;
  const alignment = s.alignment === 'center' ? AlignmentType.CENTER : AlignmentType.LEFT;
  const children = model.nodes.map(node => new Paragraph({
    ...(node.type === 'name' ? { heading: HeadingLevel.TITLE, alignment, keepNext: true } : {}),
    ...(node.type === 'heading' ? { heading: HeadingLevel.HEADING_1, keepNext: true } : {}),
    ...(node.type === 'heading' ? { border: { bottom: { color: s.color, size: 6, space: 4, style: 'single' } } } : {}),
    ...(['job', 'employer', 'metadata'].includes(node.type) ? { keepNext: true } : {}),
    ...(node.pageBreak || node.type === 'break' ? { pageBreakBefore: true } : {}),
    ...(node.type === 'contact' ? { alignment } : {}),
    ...(node.type === 'bullet' ? { indent: { left: 200, hanging: 160 } } : {}),
    widowControl: true,
    keepLines: node.type === 'bullet' && node.text.length < 1200,
    spacing: { before: node.type === 'heading' ? s.sectionGap * 20 : 0, after: node.type === 'space' ? s.paragraphGap * 20 : node.type === 'name' || node.type === 'heading' ? 100 : s.paragraphGap * 20, line: Math.round(s.lineHeight * 240) },
    children: [new TextRun({ text: node.text, font: 'Arial', size: node.type === 'name' ? s.nameSize * 2 : node.type === 'heading' ? s.headingSize * 2 : node.type === 'contact' ? 19 : s.fontSize * 2, bold: ['name', 'heading', 'job'].includes(node.type), italics: node.type === 'employer', color: ['name', 'heading'].includes(node.type) ? s.color : '222222' })]
  }));
  const document = new Document({ title: model.title ? `${model.title} — Resume` : 'Resume', creator: 'Resume Studio', styles: { default: { document: { run: { font: 'Arial', size: s.fontSize * 2 } } } }, sections: [{ properties: { page: { size: { width: Math.round(page.width * 20), height: Math.round(page.height * 20) }, margin: { top: s.margin * 20, right: s.margin * 20, bottom: s.margin * 20, left: s.margin * 20 } } }, children }] });
  return Packer.toBlob(document);
}

export function exportFilename(model, extension) {
  const title = (model.title || 'resume').normalize('NFKD').replace(/\p{M}/gu, '').replace(/[^a-z0-9]+/giu, '-').replace(/^-|-$/gu, '').slice(0, 65) || 'resume';
  return `${title.toLowerCase()}-${model.design}-${model.arrangement}.${extension}`;
}
