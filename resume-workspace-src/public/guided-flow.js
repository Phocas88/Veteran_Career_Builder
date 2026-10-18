const $ = id => document.getElementById(id);
let current = 'start';
let adapter;
const labels = { start:'Choose how to start', build:'1 of 3 · Add your background', edit:'1 of 3 · Check your resume', job:'2 of 3 · Add job details', checkout:'3 of 3 · Review & checkout' };
export function setFlow(stage, scroll = true) {
  if (!Object.hasOwn(labels, stage)) return;
  current = stage;
  $('resume-start').hidden = stage !== 'start';
  for (const node of document.querySelectorAll('[data-flow]')) node.hidden = node.dataset.flow !== stage;
  $('flow-progress').textContent = labels[stage];
  $('flow-back').hidden = stage === 'start';
  if (stage === 'build') $('background-builder').open = true;
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
  $('choose-import').onclick = () => { setFlow('edit'); $('resume-input').focus(); };
  $('choose-build').onclick = () => { setFlow('build'); $('builder-name').focus(); };
  $('change-start').onclick = () => setFlow('start');
  $('flow-back').onclick = () => setFlow(({ build:'start', edit:'start', job:'edit', checkout:'job' })[current] || 'start');
  $('back-edit').onclick = () => setFlow('edit');
  $('checkout-back').onclick = () => setFlow('job');
  $('next-job').onclick = () => {
    if ($('resume-input').value.trim().length < 100) {
      $('flow-progress').textContent = 'Add at least 100 characters of resume text before continuing.';
      $('resume-input').focus(); return;
    }
    setFlow('job'); $('target-role').focus();
  };
  $('next-checkout').onclick = () => setFlow('checkout');
  $('start-saved').onclick = options.openAccount;
  $('save-progress').onclick = options.openAccount;
  $('account-new-resume').onclick = () => { $('account-dialog').close(); setFlow('start'); };
  document.addEventListener('resume:draft-ready', () => setFlow('edit'));
  for (const id of ['resume-input','target-role','application-type']) $(id).addEventListener('input', updateCheckoutSummary);
  setFlow($('resume-input').value.trim() ? 'edit' : 'start', false);
}
