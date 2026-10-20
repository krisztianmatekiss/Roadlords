import { assetUrl } from '../assets/urls.js';
export function initializeMultiplayerPregame(runtime) {
  const style = document.createElement('style');
  style.textContent = "@import url(\"" + (assetUrl("styles/features/multiplayer-pregame-14.css") + "\");");
  document.head.appendChild(style);
  const ui = document.createElement('div');
  ui.id = 'pregameSetup';
  ui.className = 'pregameSetup';
  ui.innerHTML = `
    <button id="pregameRefreshLeft" class="pregameBtn refresh" type="button" title="Saját város újragenerálása">↻</button>
    <button id="pregameReady" class="pregameBtn ready" type="button" title="Kész, indulhat">✓</button>
    <button id="pregameRefreshRight" class="pregameBtn refresh" type="button" title="Ellenfél városának újragenerálása">↻</button>
    <span class="pregameSideLabel">SAJÁT VÁROS</span><span id="pregameReadyText" class="pregameReadyText">VÁLASSZ PÁLYÁT · AZTÁN ✓</span><span class="pregameSideLabel">ELLENFÉL</span>`;
  document.body.appendChild(ui);
  const left = ui.querySelector('#pregameRefreshLeft'),
    right = ui.querySelector('#pregameRefreshRight'),
    ready = ui.querySelector('#pregameReady'),
    readyText = ui.querySelector('#pregameReadyText');
  function setPregame(active) {
    runtime.state.pregame = !!active;
    ui.classList.toggle('show', !!active);
    document.body.classList.toggle('pregame-active', !!active);
    if (active) {
      runtime.state.running = false;
      runtime.state.modal = false;
      runtime.state.choiceContext = null;
      runtime.state.banMode = false;
      runtime.$('#choiceOverlay').classList.add('hidden');
      runtime.$('#pickReminder').classList.add('hidden');
      runtime.$('#pauseBtn').classList.add('on');
      runtime.$('#pauseBtn').textContent = '▶';
    }
    updatePregameUi();
    runtime.updateHud();
  }
  function updatePregameUi() {
    if (!runtime.state.pregame) return;
    const multi = runtime.MP.enabled && runtime.MP.role !== 'solo';
    left.disabled = !!runtime.MP.readySent;
    right.disabled = multi || !!runtime.MP.readySent;
    right.title = multi ? 'Multiplayerben csak a saját városodat generálhatod újra.' : 'Ellenfél városának újragenerálása';
    ready.disabled = !!runtime.MP.readySent;
    ready.classList.toggle('locked', !!runtime.MP.readySent);
    if (!multi) {
      readyText.textContent = '↻ SAJÁT · ✓ INDÍTÁS · ↻ ELLENFÉL';
      return;
    }
    if (runtime.MP.readySent && runtime.MP.opponentReady) readyText.textContent = 'MINDKÉT JÁTÉKOS KÉSZ · INDULÁS…';else if (runtime.MP.readySent) readyText.textContent = 'TE KÉSZ VAGY · VÁRAKOZÁS AZ ELLENFÉLRE';else if (runtime.MP.opponentReady) readyText.textContent = 'ELLENFÉL KÉSZ · HA JÓ A PÁLYÁD, NYOMD MEG A ✓-T';else readyText.textContent = 'MINDKÉT JÁTÉKOS VÁROST VÁLASZT';
  }
  function rerollCity(c) {
    if (!runtime.state.pregame || runtime.MP.readySent) return;
    runtime.generateTerrain(c, 10 + Math.floor(Math.random() * 6));
    runtime.state.selectedBuild = null;
    runtime.state.selectedBuilding = null;
    runtime.state.buildRotation = 0;
    runtime.renderStatic();
    runtime.updateHud();
  }
  left.onclick = () => {
    rerollCity(runtime.P);
    if (runtime.MP.enabled && runtime.MP.role === 'guest') runtime.mpSendStrategy(true);else if (runtime.MP.enabled && runtime.MP.role === 'host') runtime.mpSendSnapshot(true);
    runtime.message('Saját város újragenerálva.', 1.4);
  };
  right.onclick = () => {
    if (runtime.MP.enabled) return;
    rerollCity(runtime.E);
    runtime.message('Ellenséges város újragenerálva.', 1.4);
  };
  ready.onclick = () => {
    if (!runtime.state.pregame || runtime.MP.readySent) return;
    if (!runtime.MP.enabled) {
      runtime.MP.readySent = true;
      runtime.MP.started = true;
      setPregame(false);
      runtime.state.running = true;
      runtime.state.startChoices = 4;
      runtime.state.startPickTimer = 0;
      runtime.state.nextPick = runtime.PICK_BASE_SECONDS;
      runtime.$('#pauseBtn').classList.remove('on');
      runtime.$('#pauseBtn').textContent = 'Ⅱ';
      runtime.message('Pálya elfogadva · kezdő épületválasztások.', 3);
      return;
    }
    if (!runtime.MP.peer) {
      runtime.toast('Várd meg, amíg az ellenfél csatlakozik.');
      return;
    }
    runtime.MP.readySent = true;
    runtime.state.running = false;
    runtime.mpSendStrategy(true);
    runtime.mpSend({
      type: 'ready'
    });
    runtime.mpSetStatus(`Szoba ${runtime.MP.room} · te készen állsz, várakozás az ellenfélre`, 'wait');
    updatePregameUi();
    if (runtime.MP.role === 'host' && runtime.MP.opponentReady) runtime.mpStartMatch();
  };
  const oldMpHandle = runtime.mpHandle;
  runtime.mpHandle = function (data) {
    const out = oldMpHandle(data);
    if (data?.type === 'ready') updatePregameUi();
    if (data?.type === 'start') {
      setPregame(false);
      updatePregameUi();
    }
    return out;
  };
  runtime.mpBeginPregame = function () {
    if (runtime.MP.started) return;
    runtime.MP.readySent = false;
    runtime.MP.opponentReady = false;
    runtime.state.running = false;
    runtime.state.startChoices = 4;
    runtime.state.startPickTimer = 0;
    runtime.state.nextPick = runtime.PICK_BASE_SECONDS;
    setPregame(true);
    runtime.mpSetStatus(`Szoba ${runtime.MP.room} · válassz várost, majd nyomd meg a zöld pipát`, 'wait');
  };
  if (runtime.MP?.lobby) {
    const solo = runtime.MP.lobby.querySelector('#mpSolo');
    if (solo) solo.onclick = () => {
      runtime.MP.enabled = false;
      runtime.MP.role = 'solo';
      runtime.MP.started = false;
      runtime.MP.readySent = false;
      runtime.MP.opponentReady = false;
      runtime.MP.lobby.style.display = 'none';
      runtime.MP.status.style.display = 'none';
      runtime.state.running = false;
      runtime.state.startChoices = 4;
      runtime.state.startPickTimer = 0;
      runtime.state.nextPick = runtime.PICK_BASE_SECONDS;
      runtime.$('#choiceOverlay').classList.add('hidden');
      runtime.$('#pickReminder').classList.add('hidden');
      runtime.state.modal = false;
      runtime.state.choiceContext = null;
      runtime.state.banMode = false;
      runtime.renderStatic();
      setPregame(true);
      runtime.message('Válassz kezdőpályát · a két ↻ külön-külön újragenerálja a városokat.', 3.5);
    };
  }
  const oldUpdateHudPregame = runtime.updateHud;
  runtime.updateHud = function () {
    const out = oldUpdateHudPregame();
    if (runtime.state.pregame) runtime.$('#nextPick').textContent = 'PÁLYAVÁLASZTÁS';
    return out;
  };
  const oldPlaceBuildingPregame = runtime.placeBuilding;
  runtime.placeBuilding = function (c, type, row, col, rotation = 0) {
    if (runtime.state.pregame && c === runtime.P) return {
      ok: false,
      reason: 'pregame'
    };
    return oldPlaceBuildingPregame(c, type, row, col, rotation);
  };
  window.__ROADLORDS_PREGAME__ = {
    setPregame,
    updatePregameUi,
    rerollCity
  };
  if (runtime.MP?.lobby) {
    const ver = runtime.MP.lobby.querySelector('.menuVersion');
    if (ver) ver.textContent = 'V4.9.26 · P2P';
  }
}
