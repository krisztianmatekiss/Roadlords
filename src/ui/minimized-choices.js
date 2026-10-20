import { assetUrl } from '../assets/urls.js';
export function initializeUiMinimizedChoices(runtime) {
  function choiceIsMinimizedV4964() {
    const overlay = runtime.$('#choiceOverlay'),
      reminder = runtime.$('#pickReminder');
    return !!runtime.state.choiceContext && !!overlay?.classList.contains('hidden') && !!reminder && !reminder.classList.contains('hidden');
  }
  runtime.$('#minimizeChoice').onclick = function () {
    if (!runtime.state.choiceContext) return;
    runtime.$('#choiceOverlay').classList.add('hidden');
    runtime.updatePickReminder();
    runtime.$('#pickReminder').classList.remove('hidden');
    if (runtime.state.startChoices <= 0) runtime.toast('Választás elrejtve · a játék tovább fut.');
  };
  runtime.$('#pickReminder').onclick = function () {
    if (!runtime.state.choiceContext) return;
    runtime.$('#pickReminder').classList.add('hidden');
    runtime.$('#choiceOverlay').classList.remove('hidden');
    runtime.state.modal = true;
  };
  const oldQueueChoiceV4964 = runtime.queueChoice;
  runtime.queueChoice = function (source = 'timer') {
    if (runtime.state.choiceContext) {
      runtime.state.pendingChoices.push(source);
      runtime.updatePickReminder();
      return;
    }
    return oldQueueChoiceV4964(source);
  };
  const oldTickV4964 = runtime.tick;
  runtime.tick = function (dt) {
    const resumeBehindChoice = runtime.state.startChoices <= 0 && runtime.state.running && !runtime.state.ended && choiceIsMinimizedV4964();
    if (!resumeBehindChoice) return oldTickV4964(dt);
    const wasModal = runtime.state.modal;
    runtime.state.modal = false;
    try {
      return oldTickV4964(dt);
    } finally {
      if (runtime.state.choiceContext && choiceIsMinimizedV4964()) runtime.state.modal = true;else runtime.state.modal = wasModal;
    }
  };
  const brandSmall = document.querySelector('.brand small');
  if (brandSmall) brandSmall.textContent = 'V4.9.64 · P2P 1V1';
  if (runtime.MP?.lobby) {
    const ver = runtime.MP.lobby.querySelector('.menuVersion');
    if (ver) ver.textContent = 'V4.9.64 · P2P';
  }
  document.title = 'Roadlords V4.9.64 – Pick resume fix';
  window.__ROADLORDS_VERSION__ = '4.9.64-choice-resume-fix';
}
