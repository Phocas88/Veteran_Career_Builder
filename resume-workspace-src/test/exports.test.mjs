import test from 'node:test';
import assert from 'node:assert/strict';
import { createResumeDocument, createPdfDefinition, exportFilename, federalChecks, designs, documentParts, plainTextForModel, normalizeExportSettings } from '../public/exports.js';
import { checkFederalDownload } from '../public/page-preview.js';

const text = 'JOSÉ MORGAN\r\njose@example.com · Portland, OR\r\n\r\nSummary\r\nA careful operations coordinator.\r\n\r\nEXPERIENCE\r\nCoordinator · Example Company · 2022–Present\r\n• Managed verified records.\r\n\r\nEducation\r\nBusiness Diploma · 2021\r\n\r\nSkills\r\nExcel · Scheduling\r\n\r\nSelected Projects\r\nVerified planning project.';

test('every resume design and section arrangement retains each supplied line exactly once', () => {
  const expected = text.split(/\r?\n/u).map(line => line.trim()).filter(Boolean).sort();
  for (const design of Object.keys(designs)) for (const arrangement of ['original', 'professional', 'skills', 'combination']) {
    const model = createResumeDocument(text, { design, arrangement });
    assert.deepEqual(model.nodes.filter(node => node.type !== 'space').map(node => node.text).sort(), expected);
    assert.equal(model.title, 'JOSÉ MORGAN');
  }
});

test('skills and combination arrangements reorder sections without inventing experience or changing dates', () => {
  for (const arrangement of ['skills', 'combination']) {
    const model = createResumeDocument(text, { arrangement });
    const headings = model.nodes.filter(node => node.type === 'heading').map(node => node.text);
    assert.ok(headings.indexOf('Skills') < headings.indexOf('EXPERIENCE'));
    if (arrangement === 'combination') assert.ok(headings.indexOf('Selected Projects') < headings.indexOf('EXPERIENCE'));
    assert.ok(model.nodes.some(node => node.text === 'Coordinator · Example Company · 2022–Present'));
  }
});

test('unstructured paragraphs, repeated headings, and HTML-like text survive formatting as literal content', () => {
  for (const source of ['A long paragraph without section headings that should remain intact.\nAnother line.', 'EXPERIENCE\nFirst job.\nEXPERIENCE\nSecond job.', '<img src=x onerror=alert(1)>\n\nSKILLS\n<script>literal text</script>']) {
    const model = createResumeDocument(source);
    assert.equal(model.nodes.filter(node => node.text).map(node => node.text).join(' ').replace(/\s+/gu, ' '), source.replace(/\s+/gu, ' '));
  }
});

test('PDF definitions retain literal text, selected paper dimensions, and readable typography', () => {
  const model = createResumeDocument(text, { design: 'compact', paper: 'a4' });
  const definition = createPdfDefinition(model);
  assert.equal(definition.pageSize.width, 595.28);
  assert.equal(definition.defaultStyle.fontSize, 10);
  const texts=nodes=>nodes.flatMap(node=>[node.text??'',...texts(node.stack??[]),...texts(node.columns??[]),...texts(node.table?.body?.flat()??[])]);
  assert.equal(texts(definition.content).filter(t=>t==='JOSÉ MORGAN').length,1);
  assert.equal(texts(definition.content).filter(value => value.includes('Managed verified records')).length, 1);
  assert.equal(definition.pageBreakBefore({ style: 'heading' }, { getFollowingNodesOnPage: () => [] }), true);
  assert.equal(definition.pageBreakBefore({ style: 'heading' }, { getFollowingNodesOnPage: () => [{}] }), false);
});

test('PDF-wrapped bullets reflow while job headers and extended section headings remain structured', () => {
  const source = 'ALEX MORGAN\nalex@example.com\n\nEXPERIENCE\nInventory Manager — Analytics Jan 2025 – Present\nExample Company · Anywhere, USA\n• Led verified cycle counts and\n\nreviewed inventory discrepancies.\n• Built Excel reports for\nteam planning.\n\nSELECTED PROJECTS – ANALYTICS & SYSTEMS\n• Built a verified dashboard.\n\nCERTIFICATIONS & CLEARANCE\nInactive Secret clearance';
  const model = createResumeDocument(source);
  assert.ok(model.nodes.some(x => x.type === 'job' && x.text.includes('Inventory Manager')));
  assert.ok(model.nodes.some(x => x.type === 'employer' && x.text.includes('Example Company')));
  assert.ok(model.nodes.some(x => x.type === 'heading' && x.text.includes('SELECTED PROJECTS')));
  assert.ok(model.nodes.some(x => x.type === 'heading' && x.text.includes('CLEARANCE')));
  assert.ok(model.nodes.some(x => x.type === 'bullet' && x.text === '• Led verified cycle counts and reviewed inventory discrepancies.'));
  assert.ok(model.nodes.some(x => x.type === 'bullet' && x.text === '• Built Excel reports for team planning.'));
  assert.equal(createResumeDocument(source, { reflow: false }).nodes.filter(x => x.type === 'bullet')[0].text, '• Led verified cycle counts and');
});

test('manual page breaks persist by content anchor and federal limits never silently truncate', () => {
  const base = createResumeDocument(text);
  const target = base.nodes.find(x => x.type === 'heading' && x.text === 'Education');
  const model = createResumeDocument(text, { pageBreaks: [target.id], applicationType: 'federal', design: 'federal' });
  assert.equal(model.nodes.find(x => x.id === target.id).pageBreak, true);
  assert.equal(model.style.margin, 36);
  assert.equal(model.style.fontSize, 10);
  assert.throws(() => checkFederalDownload(model, { pageCount: 3, blob: { size: 1000 } }), /3 pages/);
  assert.throws(() => checkFederalDownload(model, { pageCount: 2, blob: { size: 6 * 1024 * 1024 } }), /5 MB/);
  assert.doesNotThrow(() => checkFederalDownload(model, { pageCount: 2, blob: { size: 1000 } }));
  assert.throws(() => checkFederalDownload({ ...model, paper: 'a4' }, { pageCount: 2, blob: { size: 1000 } }), /US Letter/);
  assert.ok(federalChecks(model).some(x => /hours per week/iu.test(x)));
  assert.ok(federalChecks(model).some(x => /announcement/iu.test(x)));
  assert.equal(model.nodes.map(x => x.text).filter(Boolean).length, base.nodes.map(x => x.text).filter(Boolean).length);
});

test('unknown design options use safe defaults and filenames cannot contain paths', () => {
  const model = createResumeDocument('../../Résumé <script>', { design: '__proto__', arrangement: 'unknown', paper: 'constructor' });
  assert.equal(model.design, 'classic');
  assert.equal(model.arrangement, 'original');
  assert.equal(model.paper, 'letter');
  assert.match(exportFilename(model, 'pdf'), /^[a-z0-9-]+\.pdf$/u);
});

test('federal presets enforce readable single-column exports even with incompatible saved settings',()=>{
 for(const design of Object.keys(designs)){
  const model=createResumeDocument(text,{design,applicationType:'federal',paper:'a4',exportSettings:{font:'SourceSerif',fontSize:9,headingSize:11,margins:{top:25,right:25,bottom:25,left:25},photo:'data:image/png;base64,AAAA',color:'62416A'}});
  assert.equal(model.paper,'letter');assert.equal(model.style.layout,'single');assert.equal(model.style.header,'plain');assert.notEqual(model.style.font,'SourceSerif');assert.equal(model.photo,null);assert.ok(model.style.fontSize>=10);assert.ok(model.style.headingSize>=14);assert.ok(Object.values(model.style.margins).every(v=>v>=36));
 }
});
test('renaming, ordering and explicit exclusion are reversible and leave source facts intact',()=>{
 const source=createResumeDocument(text),education=source.sections.find(s=>s.kind==='education'),experience=source.sections.find(s=>s.kind==='experience');
 const model=createResumeDocument(text,{exportSettings:{sectionOrder:[education.id,experience.id],headings:{[education.id]:'ACADEMIC QUALIFICATIONS'},hiddenSections:[experience.id]}});
 assert.equal(model.sections[0].heading,'ACADEMIC QUALIFICATIONS');assert.ok(!plainTextForModel(model).includes('Managed verified records'));assert.ok(plainTextForModel(model).includes('Business Diploma'));assert.ok(plainTextForModel(createResumeDocument(text)).includes('Managed verified records'));assert.ok(education.id===model.sections[0].id);
});
test('full recorded month/year dates are recognized and hours are checked separately for each relevant job',()=>{
 const source='EXAMPLE VETERAN\nexample@example.com · 202-555-0144\nEXPERIENCE\nDriver · 2020-01 – 2024-12\nArmy\nHours per week: 40\n• Operated assigned vehicles.\nPlanner | Example employer | Jan 2025 – Present\n• Maintained schedules.';
 const model=createResumeDocument(source,{applicationType:'federal'}),checks=federalChecks(model,'Scheduling experience required.');
 assert.equal(model.nodes.filter(n=>n.type==='job').length,2);assert.ok(!checks.some(c=>c.includes('Driver')&&/month and year|hours per week/.test(c)));assert.ok(checks.some(c=>c.includes('Planner')&&/hours per week/.test(c)));
});
test('custom sections and untrusted design settings remain literal, bounded and free of hidden claims',()=>{
 const model=createResumeDocument(text+'\n\n## Community leadership\nOrganized verified volunteer schedules.');assert.ok(model.sections.some(s=>s.heading==='Community leadership'));assert.ok(plainTextForModel(model).includes('Organized verified volunteer schedules.'));
 const settings=normalizeExportSettings({font:'__proto__',fontSize:-200,headings:{'section-valid':'<img onerror=alert(1)>','__proto__':'bad'},margins:{top:-2,right:999,left:36,bottom:36},photo:'javascript:alert(1)'});assert.equal(settings.font,undefined);assert.equal(settings.fontSize,9);assert.equal(settings.margins.top,25);assert.equal(settings.margins.right,72);assert.equal(settings.photo,undefined);assert.equal(settings.headings['section-valid'],'<img onerror=alert(1)>');
});
test('two-column layouts retain every section while keeping federal content in a single flow',()=>{
 const model=createResumeDocument(text,{design:'atlas'}),parts=documentParts(model);assert.equal(parts.layout,'left');assert.ok(parts.side.some(n=>n.kind==='skills'));assert.ok(parts.main.some(n=>n.kind==='experience'));assert.equal([...parts.header,...parts.main,...parts.side].filter(n=>n.text).length,model.nodes.filter(n=>n.text).length);
});
