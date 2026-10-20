import { assetUrl } from '../assets/urls.js';
export function initializeProgressionStarterChoices(runtime) {
  runtime.v499QueueChoice = runtime.queueChoice;
  runtime.queueChoice = function (source = 'timer') {
    if (source === 'start') {
      runtime.state.pendingChoices.push(source);
      if (!runtime.state.modal) runtime.showChoice();
      return;
    }
    if (runtime.state.startChoices > 0) {
      runtime.state.pendingChoices.push(source);
      return;
    }
    return runtime.v499QueueChoice(source);
  };
  runtime.v499Tick = runtime.tick;
  runtime.tick = function (dt) {
    if (runtime.state.startChoices > 0) {
      if (runtime.MP.enabled && runtime.MP.role === 'guest') return runtime.v499Tick(dt);
      if (runtime.MP.enabled && (!runtime.MP.started || runtime.MP.guestChoicePending)) return runtime.v499Tick(dt);
      if (!runtime.state.running || runtime.state.ended || runtime.state.modal) return;
      const keepNext = runtime.state.nextPick;
      runtime.state.nextPick = 1e9;
      const out = runtime.v499Tick(dt);
      runtime.state.nextPick = keepNext;
      if (!runtime.state.running || runtime.state.ended || runtime.state.modal) return out;
      runtime.state.startPickTimer = Math.max(0, (runtime.state.startPickTimer ?? 0) - dt);
      if (runtime.state.startPickTimer <= 0) {
        runtime.state.startPickTimer = 0;
        if (runtime.MP.enabled && runtime.MP.role === 'host') {
          runtime.MP.guestChoicePending = true;
          runtime.mpSend({
            type: 'event',
            event: 'choice',
            source: 'start'
          });
          runtime.mpSetStatus(`Kezdő épületválasztás ${5 - runtime.state.startChoices}/4 · mindkét játékos választ`, 'wait');
        } else if (!runtime.MP.enabled) runtime.grantEnemyStarterPickV499();
        runtime.queueChoice('start');
      }
      return out;
    }
    return runtime.v499Tick(dt);
  };
  runtime.v499FinalizeChoiceEvent = runtime.finalizeChoiceEvent;
  runtime.finalizeChoiceEvent = function () {
    if (runtime.state.startChoices > 0) {
      runtime.$('#choiceOverlay').classList.add('hidden');
      runtime.$('#pickReminder').classList.add('hidden');
      runtime.state.modal = false;
      runtime.state.choiceContext = null;
      runtime.state.banMode = false;
      if (runtime.state.pendingChoices[0] === 'start') runtime.state.pendingChoices.shift();
      runtime.state.startChoices--;
      if (runtime.state.startChoices > 0) {
        runtime.state.startPickTimer = 0;
        runtime.message('Következő kezdő épületválasztás.', 2.5);
      } else {
        runtime.state.startPickTimer = 0;
        runtime.state.nextPick = runtime.PICK_BASE_SECONDS;
        runtime.message('A négy kezdő épületválasztás kész. Innentől a normál választások jönnek.', 3.5);
      }
      if (runtime.MP.enabled && runtime.MP.role === 'guest') {
        runtime.mpSendStrategy(true);
        runtime.mpSend({
          type: 'choice_done'
        });
        runtime.mpSetStatus(runtime.state.startChoices > 0 ? 'Következő kezdő választás' : 'Kezdő választások kész · indul a normál menet', 'ok');
      }
      runtime.renderStatic();
      runtime.updateHud();
      if (!runtime.MP.enabled && runtime.state.startChoices <= 0 && runtime.state.pendingChoices.length) runtime.showChoice();
      return;
    }
    return runtime.v499FinalizeChoiceEvent();
  };
  if (runtime.MP?.lobby) {
    const solo = runtime.MP.lobby.querySelector('#mpSolo');
    if (solo) solo.onclick = () => {
      runtime.MP.enabled = false;
      runtime.MP.role = 'solo';
      runtime.MP.started = true;
      runtime.MP.lobby.style.display = 'none';
      runtime.MP.status.style.display = 'none';
      runtime.$('#choiceOverlay').classList.add('hidden');
      runtime.$('#pickReminder').classList.add('hidden');
      runtime.state.modal = false;
      runtime.state.choiceContext = null;
      runtime.state.banMode = false;
      runtime.state.running = true;
      runtime.state.startChoices = 4;
      runtime.state.startPickTimer = 0;
      runtime.state.nextPick = runtime.PICK_BASE_SECONDS;
      runtime.$('#pauseBtn').classList.remove('on');
      runtime.$('#pauseBtn').textContent = 'Ⅱ';
      runtime.renderStatic();
      runtime.updateHud();
      runtime.message('Egyjátékos mód · kezdő épületválasztások.', 3.5);
    };
  }
  if (runtime.MP?.lobby && !runtime.MP.role) {
    runtime.$('#choiceOverlay').classList.add('hidden');
    runtime.$('#pickReminder').classList.add('hidden');
    runtime.state.modal = false;
    runtime.state.choiceContext = null;
    runtime.state.banMode = false;
    runtime.state.running = false;
    runtime.state.startChoices = 4;
    runtime.state.startPickTimer = 0;
    runtime.state.nextPick = runtime.PICK_BASE_SECONDS;
  }
  runtime.v499UpdateHud = runtime.updateHud;
  runtime.updateHud = function () {
    runtime.v499UpdateHud();
    if (runtime.state.startChoices > 0 && (!runtime.MP.enabled || runtime.MP.started)) runtime.$('#nextPick').textContent = runtime.state.modal ? 'VÁLASZTÁS' : runtime.fmt(Math.max(0, runtime.state.startPickTimer ?? 0));
  };
  runtime.$('#pauseBtn').onclick = () => {
    if (runtime.state.ended) return;
    if (runtime.MP.enabled && runtime.state.startChoices > 0) return;
    if (runtime.state.modal) {
      runtime.toast('Előbb válassz, vagy rejtsd el a várakozó választást.');
      return;
    }
    runtime.state.running = !runtime.state.running;
    runtime.$('#pauseBtn').classList.toggle('on', !runtime.state.running);
    runtime.$('#pauseBtn').textContent = runtime.state.running ? 'Ⅱ' : '▶';
  };
  runtime.v499ChoiceContextForPlayer = runtime.choiceContextForPlayer;
  runtime.choiceContextForPlayer = function () {
    const c = runtime.v499ChoiceContextForPlayer();
    if (c?.source === 'start') c.desc = 'Az első négy választás kizárólag új épületet old fel. A következő kezdő választás mindig 5 játék-másodperc múlva érkezik.';
    return c;
  };
}
