const $ = id => document.getElementById(id);
let current = 'start';
let adapter;
let sourceMode = 'upload';
let importedName = '';
export const currentFlow=()=>current;
export function syncResumeEditor() {
  const hasText = !!$('resume-input').value.trim();
  if (!hasText) importedName = '';
  $('resume-upload-mode').setAttribute('aria-pressed', String(sourceMode === 'upload'));
  $('resume-paste-mode').setAttribute('aria-pressed', String(sourceMode === 'paste'));
  $('resume-upload-area').hidden = sourceMode !== 'upload' || hasText;
  $('resume-text-editor').hidden = sourceMode !== 'paste' && !hasText;
  $('resume-file-summary').hidden = !hasText || sourceMode !== 'upload';
  $('resume-file-name').textContent = importedName || 'Your resume text';
  $('resume-heading').textContent = hasText ? 'Check your resume' : 'Add your resume';
  $('resume-text-label').textContent = hasText ? 'Review & edit your resume text' : 'Paste your resume';
  $('resume-text-help').textContent = importedName ? 'Check that names, dates, and bullet points were read correctly. You can edit the text below.' : 'Include your experience, education, and skills. You can make changes here.';
  $('manual-finish').hidden=!hasText;
  $('manual-finish').disabled=$('resume-input').value.trim().length<100;
  $('next-job').disabled = $('resume-input').value.trim().length < 100 || $('resume-input').readOnly;
  $('save-progress').hidden = !hasText;
}
export function setResumeFilename(value) { importedName = value; if (value) sourceMode = 'upload'; syncResumeEditor(); }
function sourceModeTo(mode, focus = false) {
  sourceMode = mode; syncResumeEditor();
  if (focus) $('resume-input').focus({preventScroll:true});
}

const labels = { start:'Choose how to start', payment:'Unlock your resume build', build:'Add your background', edit:'Check your resume', job:'Add job details', checkout:'Confirm AI review' };
export function setFlow(stage, scroll = true) {
  if (!Object.hasOwn(labels, stage)) return;
  if (!['start','payment'].includes(stage) && adapter && !adapter.canUse()) stage='payment';
  current = stage;
  $('resume-start').hidden = false;
  $('opsec-notice').hidden = ['start','payment'].includes(stage);
  for (const node of document.querySelectorAll('[data-flow]')) node.hidden = node.dataset.flow !== stage;
  const numbers={payment:0,build:1,edit:1,job:2,checkout:2};
  $('flow-progress').textContent = (numbers[stage]?'Step '+numbers[stage]+' of 3 · ':'')+labels[stage];
  $('flow-back').hidden = stage === 'start';
  if (stage === 'build') $('background-builder').open = true;
  syncResumeEditor();
  updateCheckoutSummary();
  adapter?.showResume();
  if (scroll) $('resume-panel').scrollIntoView({ block:'start', behavior:'instant' });
}
function updateCheckoutSummary() {
  const count = $('resume-input').value.trim().split(/\s+/).filter(Boolean).length;
  const type = $('application-type').selectedOptions[0]?.textContent || 'Private sector';
  const role = $('target-role').value.trim();
  $('checkout-summary').textContent = `${count} words · ${type}${role ? ' · ' + role : ''}`;
}
export function initGuidedFlow(options) {
  adapter = options;
  $('choose-import').onclick = () => { sourceModeTo('upload'); options.startEntry('edit'); };
  $('resume-upload-mode').onclick = () => sourceModeTo('upload');
  $('resume-paste-mode').onclick = () => sourceModeTo('paste', true);
  $('replace-resume').onclick = () => $('resume-file').click();
  $('choose-build').onclick = () => options.startEntry('build');
  $('change-start').onclick = () => setFlow('start');
  $('flow-back').onclick = () => setFlow(({ payment:'start',build:'start', edit:'start', job:'edit', checkout:'job' })[current] || 'start');
  $('back-edit').onclick = () => setFlow('edit');
  $('checkout-back').onclick = () => setFlow('job');
  $('next-job').onclick = () => {
    if ($('resume-input').value.trim().length < 100) {
      $('flow-progress').textContent = 'Add at least 100 characters of resume text before continuing.';
      $('resume-input').focus(); return;
    }
    setFlow('job'); $('target-role').focus();
  };
  $('manual-finish').onclick=()=>{if($('resume-input').value.trim().length>=100)options.manualFinish();};
  $('next-checkout').onclick = () => setFlow('checkout');
  $('save-progress').onclick = ()=>document.dispatchEvent(new CustomEvent('app:open-career',{detail:'versions'}));
  $('account-new-resume').onclick = () => { if(!options.newResume())return; $('account-dialog').close(); setFlow('start'); };
  document.addEventListener('resume:draft-ready', () => setFlow('edit'));
  for (const id of ['resume-input','target-role','application-type']) $(id).addEventListener('input', updateCheckoutSummary);
  setFlow($('resume-input').value.trim() ? 'edit' : 'start', false);
}
