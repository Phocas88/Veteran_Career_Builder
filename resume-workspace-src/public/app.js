import { setFlow, syncResumeEditor, setResumeFilename,currentFlow } from './guided-flow.js?v=20261025-standalone-app';
import {showAppView} from './app-shell.js?v=20261025-standalone-app';
import { initWorkspace, requestVeteranReview, draftOwnerId } from './workspace.js?v=20261026-profile-setup';
import { canApply, applyCorrections } from './corrections.js';
import { importResumeFile } from './imports.js';
import { createResumeDocument, renderResume, exportWord, exportFilename, designs, arrangements, papers, federalChecks } from './exports.js';
import { preparePdf, renderPdfPages, checkFederalDownload, pdfKey, clearPdfCache } from './page-preview.js';
import { hasPaidBuild, includedUpdateAvailable, refinePaidReview, careerBuildContext } from './payments.js?v=20261025-standalone-app';

const $ = id => document.getElementById(id);
const input = $('resume-input');
const roleInput = $('target-role');
const jobInput = $('job-description');
const applicationInput = $('application-type');
const detailsInput = $('additional-details');
const storageKey = 'resume-studio-draft-v1';
const state = { review: null, applied: new Set(), history: [], stale: false, controller: null };
let toastTimer;
let importing = false;
let exporting = false;
const pageBreaks = new Set();
let previewVersion = 0;
let previewTimer;
let previewKey = '';
let versionContext = {};

function currentDocument() {
  return createResumeDocument(input.value, { design: document.querySelector('[name="resume-design"]:checked').value, arrangement: $('resume-arrangement').value, paper: $('resume-paper').value, applicationType: applicationInput.value, reflow: $('reflow-lines').checked, pageBreaks: [...pageBreaks] });
}

function startPagePreview(model) {
  const key = pdfKey(model);
  if (previewKey === key) return;
  previewKey = key;
  const version = ++previewVersion;
  clearTimeout(previewTimer);
  $('page-preview-status').textContent = 'Preparing your PDF pages…';
  $('pdf-pages').setAttribute('aria-busy', 'true');
  $('page-limit-warning').hidden = true;
  previewTimer = setTimeout(async () => {
    try {
      const prepared = await renderPdfPages($('pdf-pages'), model, () => version === previewVersion);
      if (version !== previewVersion) return;
      $('page-preview-status').textContent = `${prepared.pageCount} ${prepared.pageCount === 1 ? 'page' : 'pages'} · PDF page preview`;
      if (model.applicationType === 'federal') {
        try { checkFederalDownload(model, prepared); }
        catch (error) { $('page-limit-warning').textContent = error.message; $('page-limit-warning').hidden = false; }
      }
    } catch {
      if (version !== previewVersion) return;
      previewKey = '';
      $('pdf-pages').replaceChildren();
      $('page-preview-status').textContent = 'Page preview could not load. Your text is safe; try downloading again or use Word / Print.';
    } finally {
      if (version === previewVersion) $('pdf-pages').removeAttribute('aria-busy');
    }
  }, 300);
}

function refreshExport() {
  if(!hasPaidBuild()){
    ++previewVersion;previewKey='';clearTimeout(previewTimer);clearPdfCache();
    $('export-preview').replaceChildren();$('pdf-pages').replaceChildren();$('print-content').replaceChildren();
    $('export-preview').hidden=true;$('preview-stage').hidden=true;$('export-empty').hidden=false;
    return;
  }
  const model = currentDocument();
  renderResume($('export-preview'), model);
  $('export-preview').hidden = !input.value.trim();
  $('preview-stage').hidden = !input.value.trim();
  $('export-empty').hidden = !!input.value.trim();
  $('arrangement-help').textContent = arrangements[model.arrangement].description;
  $('preview-label').textContent = `${designs[model.design].name} · ${arrangements[model.arrangement].name} · ${papers[model.paper].name}`;
  const previous = $('page-break-target').value;
  const candidates = model.nodes.filter(x => ['heading', 'job'].includes(x.type));
  $('page-break-target').replaceChildren(new Option('Choose a heading or job…', ''), ...candidates.map(x => new Option(x.text, x.id)));
  if (candidates.some(x => x.id === previous)) $('page-break-target').value = previous;
  $('page-break-list').replaceChildren(...candidates.filter(x => pageBreaks.has(x.id)).map(x => {
    const button = element('button', 'text-button break-remove', `Remove break: ${x.text}`);
    button.addEventListener('click', () => { pageBreaks.delete(x.id); refreshExport(); });
    return button;
  }));
  $('federal-checks').hidden = applicationInput.value !== 'federal';
  if (applicationInput.value === 'federal') listItems('federal-check-list', federalChecks(model, jobInput.value));
  if (input.value.trim() && !$('export-panel').hidden) startPagePreview(model);
  if (!input.value.trim()) { ++previewVersion; previewKey = ''; clearTimeout(previewTimer); $('pdf-pages').replaceChildren(); $('page-preview-status').textContent = ''; }
}

function toast(message) {
  clearTimeout(toastTimer);
  $('toast').textContent = message;
  $('toast').hidden = false;
  toastTimer = setTimeout(() => { $('toast').hidden = true; }, 4500);
}

function showError(message) {
  $('error-message').textContent = message;
  $('error-banner').hidden = false;
}

function saveDraft() {
  try {
    if ($('remember-draft').checked) localStorage.setItem(storageKey, JSON.stringify({ ownerUid: draftOwnerId(), resume: input.value, role: roleInput.value, jobDescription: jobInput.value, applicationType: applicationInput.value, additionalDetails: detailsInput.value }));
    else localStorage.removeItem(storageKey);
  } catch {
    $('remember-draft').checked = false;
    toast('This browser could not save the draft. Keep this tab open or download a copy.');
  }
}

function refreshDraft() {
  syncResumeEditor();
  const text = input.value;
  const words = text.trim() ? text.trim().split(/\s+/u).length : 0;
  $('word-count').textContent = `${words.toLocaleString()} ${words === 1 ? 'word' : 'words'}`;
  $('character-count').textContent = text.length.toLocaleString();
  refreshExport();
  const count = state.applied.size;
  $('edit-count').textContent = `${count} ${count === 1 ? 'edit' : 'edits'} applied`;
  const latest = state.history.at(-1);
  $('undo-last').disabled = !latest || latest.after !== text;
  $('undo-review').disabled = !latest || latest.after !== text;
  for (const id of ['download-pdf', 'download-word', 'download-resume', 'print-resume', 'copy-resume']) $(id).disabled = !hasPaidBuild() || !text.trim() || exporting;
  refreshFederalGuidance();
  $('resume-extras').hidden=!state.review;
  document.dispatchEvent(new Event('resume:draft-changed'));
  if (state.review) {
    const remaining = state.review.suggestions.filter(s => !state.applied.has(s.id) && canApply(text, s.original));
    $('sidebar-count').textContent = remaining.length;
    $('apply-all').disabled = remaining.length === 0;
    $('review-stale').hidden = !state.stale;
    $('apply-rewrite').disabled = !state.review.revisedResume || state.rewriteInvalid || text !== state.reviewSource || !$('rewrite-draft').value.trim();
    $('rewrite-state').textContent = state.rewriteInvalid ? 'Application details changed after this rewrite. Request a fresh review before applying it.' : text !== state.reviewSource ? 'Your draft changed after this rewrite was generated. Undo the changes or request a fresh review before applying it.' : 'Applying replaces the current draft. Undo remains available.';
  }
}

function setTab(tab, scroll = true) {
  if (!['resume', 'review', 'export'].includes(tab)) return;
  if(tab==='export'&&!hasPaidBuild()){setFlow('payment');return;}
  if (tab !== 'export') { ++previewVersion; clearTimeout(previewTimer); previewKey = ''; }
  for (const name of ['resume', 'review', 'export']) {
    $(`${name}-panel`).hidden = name !== tab;
    document.querySelector(`[data-step="${name}"]`).classList.toggle('current', name === tab);
  }
  document.querySelectorAll('nav [data-tab]').forEach(button => {
    button.classList.toggle('active', button.dataset.tab === tab);
    if (button.dataset.tab === tab) button.setAttribute('aria-current', 'page');
    else button.removeAttribute('aria-current');
  });
  $('breadcrumb-current').textContent = { resume: 'Your resume', review: 'Review & improve', export: 'Export resume' }[tab];
  showAppView(tab==='resume'&&currentFlow()==='start'?'home':'workspace',{scroll:false});
  document.querySelector('.steps').hidden=tab==='resume'&&currentFlow()==='payment';
  refreshDraft();
  if (scroll) window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
}

document.querySelectorAll('[data-tab]').forEach(button => button.addEventListener('click', () => setTab(button.dataset.tab)));

function listItems(id, values) {
  const list = $(id);
  list.replaceChildren(...values.map(value => {
    const item = document.createElement('li');
    item.textContent = value;
    return item;
  }));
}

function element(tag, className, text) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (text !== undefined) el.textContent = text;
  return el;
}

function renderSuggestions() {
  const list = $('suggestion-list');
  list.replaceChildren();
  if (!state.review.suggestions.length) {
    const empty = element('div', 'card suggestion');
    empty.append(element('h3', '', 'No direct text corrections in this review.'), element('p', '', 'Read the summary and next steps for ways to strengthen your resume.'));
    list.append(empty);
  }
  state.review.suggestions.forEach((suggestion, index) => {
    const applied = state.applied.has(suggestion.id);
    const available = canApply(input.value, suggestion.original);
    const card = element('article', `card suggestion${applied ? ' applied' : ''}`);
    const top = element('div', 'suggestion-top');
    top.append(element('span', 'category-tag', suggestion.category), element('span', `priority${suggestion.priority === 'High' ? ' high' : ''}`, `${suggestion.priority} priority`), element('span', 'suggestion-number', `${String(index + 1).padStart(2, '0')}`));
    const changes = element('div', 'change-grid');
    for (const [className, label, text] of [['', 'BEFORE', suggestion.original], [' after', 'SUGGESTED', suggestion.replacement]]) {
      const block = element('div', `change-block${className}`);
      block.append(element('span', 'change-label', label), element('p', '', text));
      changes.append(block);
    }
    const bottom = element('div', 'suggestion-bottom');
    const button = element('button', 'button button-secondary', applied ? 'Applied ✓' : available ? 'Apply edit ↗' : 'Text has changed');
    button.disabled = applied || !available;
    button.setAttribute('aria-label', `${applied ? 'Applied' : 'Apply'} ${suggestion.category.toLowerCase()} suggestion ${index + 1}`);
    button.addEventListener('click', () => applyEdits([suggestion]));
    bottom.append(element('p', '', suggestion.explanation), button);
    card.append(top, changes, bottom);
    list.append(card);
  });
  refreshDraft();
}

function showReview(review, submittedSource) {
  state.review = review;
  state.applied.clear();
  state.history = [];
  state.stale = false;
  state.reviewSource = input.value;
  state.rewriteInvalid = false;
  $('review-empty').hidden = true;
  $('review-results').hidden = false;
  $('review-score').textContent = review.score;
  $('score-title').textContent = review.score >= 85 ? 'Strong foundations.' : review.score >= 65 ? 'Room to shine.' : 'Let’s build on this.';
  $('review-summary').textContent = review.summary;
  listItems('strength-list', review.strengths);
  $('strength-list').closest('.strengths-card').hidden = !review.strengths.length;
  renderReviewQuestions(review);
  const findings = review.findings ?? [];
  $('findings-card').hidden = !findings.length;
  $('review-findings').replaceChildren(...findings.map(item => {
    const card = element('article', 'review-finding');
    card.append(element('span', 'category-tag', `${item.priority} priority`), element('h3', '', item.title), element('p', 'finding-evidence', item.evidence), element('p', '', item.action), answerField(`finding-${findings.indexOf(item)}`, 'Your answer or clarification'));
    return card;
  }));
  const notes = review.rewriteNotes ?? [];
  $('rewrite-card').hidden = !review.revisedResume && !notes.length;
  state.submittedResume=review.submittedResume || submittedSource || input.value;
  $('rewrite-original').value = state.submittedResume;
  $('rewrite-proposed').value = review.revisedResume || '';
  $('rewrite-draft').value = review.revisedResume ?? '';
  $('rewrite-draft').hidden = !review.revisedResume;
  listItems('rewrite-notes', notes);
  renderSuggestions();
  syncAnswerAction();
  setTab('review');
}

function answerField(id,label){
  const group=element('div','review-answer');
  const name=element('label','field-label',label);name.htmlFor=`answer-${id}`;
  const field=element('textarea','answer-input');field.id=`answer-${id}`;field.dataset.answerId=id;field.maxLength=1000;field.rows=3;
  field.placeholder='Add only facts you can verify. Include the related job or dates where needed.';
  field.addEventListener('input',syncAnswerAction);group.append(name,field);return group;
}
function addReviewFact(){
  const index=$('additional-facts').children.length;if(index>=3)return;
  const group=element('div','extra-fact');
  const label=element('label','field-label','Job, school or section');label.htmlFor=`context-extra-${index}`;
  const context=element('input','field-input');context.id=`context-extra-${index}`;context.maxLength=160;context.placeholder='e.g. Supply specialist · Navy · 2020–2024';context.addEventListener('input',syncAnswerAction);
  group.append(label,context,answerField(`extra-${index}`,'Verified detail to include'));$('additional-facts').append(group);
  $('add-review-fact').disabled=index>=2;
}
function renderReviewQuestions(review){
  $('next-steps-card').hidden=false;$('answers-consent').checked=false;
  $('next-steps').replaceChildren(...review.nextSteps.map((question,index)=>{
    const item=element('li','review-question');item.append(element('h3','',question),answerField(`step-${index}`,'Your answer'));return item;
  }));
  $('additional-facts').replaceChildren();addReviewFact();
  $('answers-status').textContent=(review.refinementCount||0)>=1?'Your included AI update has been used. You can keep editing the revised draft and download it at no extra charge.':'One AI clarification update is included in your paid build. Answers stay in this tab until you submit them.';
  syncAnswerAction();
}
function collectAnswers(){
  return [...document.querySelectorAll('[data-answer-id]')].filter(field=>field.value.trim()).map(field=>{
    const id=field.dataset.answerId;return {id,answer:field.value.trim(),...(id.startsWith('extra-')?{context:$(`context-${id}`).value.trim()}: {})};
  });
}
function syncAnswerAction(){
  const answers=collectAnswers();
  const size=answers.reduce((n,a)=>n+a.answer.length,0);
  $('answer-budget').textContent=`${answers.length} answered · ${size.toLocaleString()} answer characters. Keep answers concise; combined verified details have a 4,000-character limit.`;
  $('apply-answers').disabled=!answers.length||!$('answers-consent').checked||!includedUpdateAvailable()||!!state.controller||state.rewriteInvalid||answers.some(a=>a.id.startsWith('extra-')&&!a.context);
  if(state.rewriteInvalid)$('answers-status').textContent='The job details changed after this review. Reopen this purchase to answer questions for its original job details, or start a new AI build for a different target.';
}
$('answers-consent').addEventListener('change',syncAnswerAction);
$('add-review-fact').addEventListener('click',addReviewFact);
$('apply-answers').addEventListener('click',async()=>{
  const answers=collectAnswers();if(!answers.length||!$('answers-consent').checked||!includedUpdateAvailable()||state.controller||state.rewriteInvalid)return;
  if(input.value!==state.submittedResume&&!confirm('This AI update uses your submitted resume and these answers. Save any manual edits first; you can inspect the new draft before applying it. Continue?'))return;
  const controller=new AbortController();state.controller=controller;syncAnswerAction();
  $('loading-message').textContent='Updating your resume with your verified answers. This update is included in your purchase.';$('loading').hidden=false;
  const timeout=setTimeout(()=>controller.abort('timeout'),240000),source=state.submittedResume;
  try{const review=await refinePaidReview(answers,controller.signal);if(controller.signal.aborted)return;showReview(review,source);toast('Your answers are incorporated. Compare and apply the updated draft.');}
  catch(error){if(!controller.signal.aborted)showError(error.message);else if(controller.signal.reason==='timeout')showError('The update is taking longer than expected. Recover this build from purchase history; do not pay again.');}
  finally{clearTimeout(timeout);if(state.controller===controller)state.controller=null;$('loading').hidden=true;syncAnswerAction();}
});

function refreshFederalGuidance(){
  const federal=applicationInput.value==='federal';$('federal-input-checks').hidden=!federal;
  if(!federal)return;
  const checks=federalChecks(currentDocument(),jobInput.value);listItems('federal-input-check-list',checks);
  $('federal-readiness-summary').textContent='Check these details now. Missing information will be flagged rather than guessed. USAJOBS generally requires two pages or fewer; the formatted page count is checked before download.';
}

function applyEdits(suggestions) {
  const before = input.value;
  const changes = applyCorrections(before, suggestions.filter(item => !state.applied.has(item.id)));
  if (!changes.applied.length) return toast('These edits no longer match your draft. Request a fresh review.');
  if (changes.text.length > 20000) return showError('These edits would exceed 20,000 characters. Shorten the draft before applying them.');
  state.history.push({ before, after: changes.text, ids: changes.applied, appliedBefore: [...state.applied] });
  input.value = changes.text;
  changes.applied.forEach(id => state.applied.add(id));
  saveDraft();
  renderSuggestions();
  toast(`${changes.applied.length === 1 ? 'Edit' : `${changes.applied.length} edits`} applied. You can undo it on the Export tab.`);
}

$('apply-all').addEventListener('click', () => {
  if (state.review) applyEdits(state.review.suggestions);
});

function undoDraft() {
  const last = state.history.at(-1);
  if (!last || last.after !== input.value) return toast('The draft has changed. Edit the current text directly.');
  state.history.pop();
  input.value = last.before;
  if (last.appliedBefore) state.applied = new Set(last.appliedBefore);
  else last.ids.forEach(id => state.applied.delete(id));
  state.stale = !!state.review && input.value !== state.reviewSource;
  saveDraft();
  if (state.review) renderSuggestions();
  refreshDraft();
  toast('Last edit undone.');
}
$('undo-last').addEventListener('click', undoDraft);
$('undo-review').addEventListener('click', undoDraft);
$('rewrite-draft').addEventListener('input', () => {$('rewrite-proposed').value=$('rewrite-draft').value;refreshDraft();});
$('apply-rewrite').addEventListener('click', () => {
  if (!state.review?.revisedResume || state.rewriteInvalid || input.value !== state.reviewSource) return;
  const after = $('rewrite-draft').value.trim();
  if (!after || after.length > 20000) return showError('Keep the rewritten draft between 1 and 20,000 characters.');
  state.history.push({ before: input.value, after, ids: ['rewrite'], appliedBefore: [...state.applied] });
  input.value = after;
  state.applied = new Set(['rewrite']); state.stale = true;
  saveDraft(); renderSuggestions(); setTab('export');
  toast('Rewritten draft applied. Check the PDF pages; Undo restores the original.');
});

input.addEventListener('input', () => {
  if (state.review) {
    state.stale = true;
    // A manual edit may change an already applied replacement. Do not offer unsafe undo.
    state.history = [];
    state.applied = new Set(state.review.suggestions.filter(s => !canApply(input.value, s.original) && canApply(input.value, s.replacement)).map(s => s.id));
    renderSuggestions();
  }
  refreshDraft();
  saveDraft();
});
for (const field of [roleInput, jobInput, detailsInput]) field.addEventListener('input', () => {
  if (state.review) { state.stale = true; state.rewriteInvalid = true; refreshDraft(); }
  refreshFederalGuidance();
  syncAnswerAction();
  saveDraft();
});

function syncApplicationType() {
  $('application-help').textContent = applicationInput.value === 'federal' ? 'U.S. federal: generally two pages maximum. Include verified hours/week and month/year dates for each relevant job. Paste the announcement above.' : applicationInput.value === 'government' ? 'State/local requirements vary. Paste the announcement, qualifications, and any required resume details.' : 'Review and rewrite for a conventional professional resume.';
  if (applicationInput.value === 'federal') {
    document.querySelector('[name="resume-design"][value="federal"]').checked = true;
    $('resume-paper').value = 'letter';
    $('resume-arrangement').value = 'professional';
  }
  if (state.review) { state.stale = true; state.rewriteInvalid = true; }
  syncAnswerAction();
  refreshDraft(); saveDraft();
}
applicationInput.addEventListener('change', syncApplicationType);

$('remember-draft').addEventListener('change', () => {
  saveDraft();
  toast($('remember-draft').checked ? 'Your draft will be saved in this browser on this device.' : 'Saved draft removed from this browser. Your current tab is unchanged.');
});

$('import-resume').addEventListener('click', () => $('resume-file').click());
$('resume-file').addEventListener('change', async event => {
  const file = event.target.files?.[0];
  if (!file) return;
  if (importing || state.controller) { event.target.value = ''; return; }
  if (input.value.trim() && !window.confirm('Replace the resume currently in the editor with this file? Your draft will stay unchanged if the import fails.')) { event.target.value = ''; return; }
  importing = true;
  const importAccount = draftOwnerId();
  $('error-banner').hidden = true;
  for (const id of ['import-resume', 'replace-resume', 'resume-upload-mode', 'resume-paste-mode', 'resume-file', 'next-job', 'review-button', 'clear-resume']) $(id).disabled = true;
  input.readOnly = true;
  $('import-resume').setAttribute('aria-busy', 'true');
  $('import-status').hidden = false;
  try {
    const text = await importResumeFile(file, message => { if (importAccount === draftOwnerId()) $('import-status').textContent = message; });
    if (importAccount !== draftOwnerId()) return;
    state.review = null; state.applied.clear(); state.history = []; state.stale = false;
    $('review-empty').hidden = false;
    $('review-results').hidden = true;
    $('sidebar-count').textContent = '0';
    input.value = text;
    setResumeFilename(file.name);
    input.dispatchEvent(new Event('input'));
    document.dispatchEvent(new Event('resume:draft-ready'));
    $('import-status').textContent = `Imported ${file.name}. Check the extracted text below before requesting a review.`;
    setTab('resume', false);
    toast('Resume imported. You can edit the text before reviewing it.');
  } catch (error) {
    if (importAccount !== draftOwnerId()) return;
    $('import-status').textContent = 'Import failed. Your current draft is unchanged.';
    showError(error.message || 'We could not open that file. Choose a fresh PDF, Word, or TXT copy.');
  } finally {
    importing = false;
    input.readOnly = false;
    $('import-resume').removeAttribute('aria-busy');
    for (const id of ['import-resume', 'replace-resume', 'resume-upload-mode', 'resume-paste-mode', 'resume-file', 'clear-resume']) $(id).disabled = false;
    $('review-button').disabled = !!state.controller;
    syncResumeEditor();
    event.target.value = '';
  }
});

async function requestReview(recover) {
  if (importing) return;
  $('error-banner').hidden = true;
  if (input.value.trim().length < 100) {
    setFlow('edit');
    showError('Add at least 100 characters of resume text so we have enough to review.');
    input.focus();
    return;
  }
  const controller = new AbortController();
  state.controller = controller;
  $('loading-message').textContent = 'Reviewing and rewriting your resume. This can take a couple of minutes. Your result will be saved with this build.';
  $('loading').hidden = false;
  $('review-button').disabled = true;
  const submitted = input.value;
  const timeout = setTimeout(() => controller.abort('timeout'), 240000);
  const context = { role: roleInput.value, jobDescription: jobInput.value, applicationType: applicationInput.value, additionalDetails: detailsInput.value };
  try {
    const data = typeof recover === 'function' ? await recover(controller.signal) : await requestVeteranReview({ resume: submitted, ...context }, controller.signal);
    if (controller.signal.aborted) return;
    if (!Number.isFinite(data.score) || !Array.isArray(data.suggestions)) throw new Error('The review could not be read. Please try again.');
    if (submitted !== input.value || JSON.stringify(context) !== JSON.stringify({ role: roleInput.value, jobDescription: jobInput.value, applicationType: applicationInput.value, additionalDetails: detailsInput.value })) return toast('Your draft or application details changed during the review. Request a new review.');
    showReview(data,submitted);
    toast('Your review is ready. Every edit is your decision.');
  } catch (error) {
    if (controller.signal.aborted) {
      if (controller.signal.reason === 'timeout') showError('The review is taking longer than expected. Reopen this build from purchase history to recover the result; no second payment is needed.');
      else toast('Review canceled. Your draft is unchanged.');
    } else if (!error.handled) showError(error.message || 'The review could not complete. Please try again.');
  } finally {
    clearTimeout(timeout);
    state.controller = null;
    $('loading').hidden = true;
    $('review-button').disabled = false;
  }
}

$('review-button').addEventListener('click', requestReview);
$('cancel-review').addEventListener('click', () => state.controller?.abort('user'));
$('error-dismiss').addEventListener('click', () => { $('error-banner').hidden = true; });

function saveDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}

$('download-resume').addEventListener('click', () => {
  if (!hasPaidBuild() || !input.value.trim()) return;
  saveDownload(new Blob([input.value], { type: 'text/plain;charset=utf-8' }), exportFilename(currentDocument(), 'txt'));
  toast('Your resume download is ready.');
});

for (const [id, extension, generate] of [['download-pdf', 'pdf', async model => {
  const prepared = await preparePdf(model); checkFederalDownload(model, prepared); return prepared.blob;
}], ['download-word', 'docx', async model => {
  if (model.applicationType === 'federal') checkFederalDownload(model, await preparePdf(model));
  return exportWord(model);
}]]) {
  $(id).addEventListener('click', async () => {
    if (!hasPaidBuild() || exporting || !input.value.trim()) return;
    const model = currentDocument();
    const exportAccount = draftOwnerId();
    exporting = true;
    $(id).setAttribute('aria-busy', 'true');
    refreshDraft();
    toast(`Preparing your ${extension === 'pdf' ? 'PDF' : 'Word document'}…`);
    try {
      const blob = await generate(model);
      if (exportAccount !== draftOwnerId()) return;
      saveDownload(blob, exportFilename(model, extension));
      toast('Your formatted resume download is ready.');
    } catch (error) {
      if (exportAccount !== draftOwnerId()) return;
      showError(model.applicationType === 'federal' && /^This federal|^Federal USAJOBS/iu.test(error.message) ? error.message : 'The formatted download could not be created. Your draft is safe. Try again, or use Print resume or Download plain text.');
    } finally {
      exporting = false;
      $(id).removeAttribute('aria-busy');
      refreshDraft();
    }
  });
}

document.querySelectorAll('[name="resume-design"], #resume-arrangement, #resume-paper').forEach(control => control.addEventListener('change', () => {
  if(control.name==='resume-design'&&control.value==='federal'&&applicationInput.value!=='federal'){applicationInput.value='federal';syncApplicationType();}
  refreshExport();
}));
$('reflow-lines').addEventListener('change', refreshExport);
$('add-page-break').addEventListener('click', () => {
  const id = $('page-break-target').value;
  if (!id) return toast('Choose a heading or job first.');
  pageBreaks.add(id); refreshExport();
});

$('copy-resume').addEventListener('click', async () => {
  if (!hasPaidBuild() || !input.value.trim()) return;
  try { await navigator.clipboard.writeText(input.value); toast('Resume copied.'); }
  catch { showError('Clipboard access is unavailable. Download the .txt file or copy the text directly from the editor.'); }
});

function preparePrint() {
  if(!hasPaidBuild()){$('print-content').replaceChildren();return;}
  const model = currentDocument();
  const content = document.createElement('article');
  renderResume(content, model);
  $('print-content').replaceChildren(content);
  $('print-content').className = `print-${model.paper}${model.design === 'federal' ? '-federal' : model.design === 'compact' ? '-compact' : ''}`;
}

window.addEventListener('beforeprint', preparePrint);
$('print-resume').addEventListener('click', () => {
  if (!hasPaidBuild() || !input.value.trim()) return;
  preparePrint();
  window.print();
});

$('privacy-open').addEventListener('click', () => $('privacy-dialog').showModal());
$('privacy-close').addEventListener('click', () => $('privacy-dialog').close());
$('clear-resume').addEventListener('click', () => {
  if (input.value || roleInput.value || jobInput.value) $('clear-dialog').showModal();
});
$('clear-cancel').addEventListener('click', () => $('clear-dialog').close());
$('clear-confirm').addEventListener('click', () => {
  input.value = ''; roleInput.value = ''; jobInput.value = '';
  detailsInput.value = ''; applicationInput.value = 'private'; pageBreaks.clear();
  state.review = null; state.applied.clear(); state.history = []; state.stale = false;
  $('review-empty').hidden = false;
  $('review-results').hidden = true;
  $('sidebar-count').textContent = '0';
  $('remember-draft').checked = false;
  saveDraft();
  $('clear-dialog').close();
  refreshDraft();
  input.focus();
  toast('Draft cleared, including any copy saved in this browser.');
});

try {
  const saved = JSON.parse(localStorage.getItem(storageKey) || 'null');
  if (saved && !saved.ownerUid && typeof saved.resume === 'string' && saved.resume.length <= 20000) {
    input.value = saved.resume;
    roleInput.value = typeof saved.role === 'string' ? saved.role.slice(0, 200) : '';
    jobInput.value = typeof saved.jobDescription === 'string' ? saved.jobDescription.slice(0, 8000) : '';
    applicationInput.value = ['private', 'federal', 'government'].includes(saved.applicationType) ? saved.applicationType : 'private';
    detailsInput.value = typeof saved.additionalDetails === 'string' ? saved.additionalDetails.slice(0, 4000) : '';
    $('remember-draft').checked = true;
  }
} catch { /* Private browsing or unavailable storage still permits a session-only draft. */ }
setTab('resume', false);

initWorkspace({
  showResume() { setTab('resume', false); },
  showReviewTab() { setTab('review', false); },
  continueResume() {if(state.review)setTab('review');else setFlow(currentFlow()==='start'?'edit':currentFlow());},
  showPayment() { setFlow('payment'); },
  openEntry(mode) { setFlow(mode==='build'?'build':'edit'); },
  showCheckout() { setFlow('checkout', false); },
  recoverReview(run) { setFlow('checkout', false); return requestReview(run); },
  getDraft: () => ({ ...versionContext, buildId:careerBuildContext()?.id || '', resume: input.value, role: roleInput.value, jobDescription: jobInput.value, applicationType: applicationInput.value, additionalDetails: detailsInput.value,
    design: document.querySelector('[name="resume-design"]:checked').value, arrangement: $('resume-arrangement').value, paper: $('resume-paper').value, reflow: $('reflow-lines').checked, pageBreaks: [...pageBreaks] }),
  restoreDeviceDraft(uid) {
    try { const saved = JSON.parse(localStorage.getItem(storageKey) || 'null');
      if (saved?.ownerUid === uid && !input.value.trim()) { this.loadDraft(saved); $('remember-draft').checked = true; saveDraft(); }
    } catch { /* Ignore unavailable or malformed device copies. */ }
  },
  loadDraft(draft) {
    versionContext = {versionFamily:draft.versionFamily || '',versionId:draft.versionId || '',versionTitle:draft.versionTitle || ''};
    setResumeFilename('');
    state.controller?.abort('draft-change');
    input.value = typeof draft.resume === 'string' ? draft.resume.slice(0, 20000) : '';
    roleInput.value = typeof draft.role === 'string' ? draft.role.slice(0, 200) : '';
    jobInput.value = typeof draft.jobDescription === 'string' ? draft.jobDescription.slice(0, 8000) : '';
    detailsInput.value = typeof draft.additionalDetails === 'string' ? draft.additionalDetails.slice(0, 4000) : '';
    applicationInput.value = ['private','federal','government'].includes(draft.applicationType) ? draft.applicationType : 'private';
    if (Object.hasOwn(designs, draft.design)) document.querySelector(`[name="resume-design"][value="${draft.design}"]`).checked = true;
    if (Object.hasOwn(arrangements, draft.arrangement)) $('resume-arrangement').value = draft.arrangement;
    if (Object.hasOwn(papers, draft.paper)) $('resume-paper').value = draft.paper;
    $('reflow-lines').checked = draft.reflow !== false;
    pageBreaks.clear(); if (Array.isArray(draft.pageBreaks)) for (const id of draft.pageBreaks.slice(0,100)) if (typeof id === 'string') pageBreaks.add(id);
    state.review = null; state.applied.clear(); state.history = []; state.stale = false;
    $('review-empty').hidden = false; $('review-results').hidden = true; $('sidebar-count').textContent = '0';
    syncApplicationType(); setTab('resume', false); refreshDraft(); saveDraft(); setFlow('edit', false);
  },
  loadReview(review,source) { showReview(review,source); },
  markVersion(item) {versionContext={versionFamily:item.familyId || item.id,versionId:item.id,versionTitle:item.title};},
  setJob(job) {roleInput.value=job.role;jobInput.value=job.description;applicationInput.value=job.applicationType;syncApplicationType();if(state.review){state.stale=true;state.rewriteInvalid=true;}refreshDraft();saveDraft();},
  clearAccountDraft() {
    versionContext = {};
    setResumeFilename('');
    state.controller?.abort('account-change'); input.value = ''; roleInput.value = ''; jobInput.value = ''; detailsInput.value = '';
    applicationInput.value = 'private'; pageBreaks.clear(); state.review = null; state.history = []; state.applied.clear(); state.stale = false;
    $('review-empty').hidden = false; $('review-results').hidden = true; $('sidebar-count').textContent = '0';
    state.reviewSource = ''; state.rewriteInvalid = true; clearPdfCache(); $('print-content').replaceChildren();
    $('rewrite-draft').value = ''; $('rewrite-original').value = ''; $('rewrite-proposed').value='';$('review-summary').textContent = '';state.submittedResume='';$('answers-consent').checked=false;
    $('remember-draft').checked = false; saveDraft(); setTab('resume', false); refreshDraft();
    $('import-status').textContent = ''; $('import-status').hidden = true;
    $('error-message').textContent = ''; $('error-banner').hidden = true;
    $('toast').textContent = ''; $('toast').hidden = true; clearTimeout(toastTimer);
    $('builder-status').textContent = ''; setFlow('start', false);
    for (const id of ['review-findings','suggestion-list','strength-list','next-steps','rewrite-notes','additional-facts']) if ($(id)) $(id).replaceChildren();
  }
});
document.addEventListener('resume:payment-changed',()=>{refreshDraft();syncAnswerAction();});
$('purchase-history-open').addEventListener('click',()=>{$('account-open').click();$('purchase-history').open=true;});
