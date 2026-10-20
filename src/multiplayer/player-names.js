import { assetUrl } from '../assets/urls.js';
export function initializeMultiplayerPlayerNames(runtime) {
  const cleanMpName = value => {
    const text = String(value ?? '').replace(/[<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, 18);
    return text || 'Játékos';
  };
  runtime.MP.playerName = cleanMpName(runtime.MP.playerName || 'Játékos');
  runtime.MP.opponentName = cleanMpName(runtime.MP.opponentName || 'Ellenfél');
  const style = document.createElement('style');
  style.textContent = "@import url(\"" + (assetUrl("styles/features/multiplayer-player-names-20.css") + "\");");
  document.head.appendChild(style);
  const multiMenu = runtime.MP.lobby?.querySelector('.menuMulti');
  if (multiMenu && !multiMenu.querySelector('#mpPlayerName')) {
    const wrap = document.createElement('div');
    wrap.className = 'mpNameEntry';
    wrap.innerHTML = '<label for="mpPlayerName">JÁTÉKOSNÉV</label><input id="mpPlayerName" maxlength="18" autocomplete="off" spellcheck="false" placeholder="Játékosnév">';
    multiMenu.prepend(wrap);
    wrap.querySelector('input').value = runtime.MP.playerName === 'Játékos' ? '' : runtime.MP.playerName;
  }
  const nameInput = () => runtime.MP.lobby?.querySelector('#mpPlayerName');
  const openMultiBtn = runtime.MP.lobby?.querySelector('#mpOpenMulti');
  if (openMultiBtn) openMultiBtn.onclick = () => {
    const main = runtime.MP.lobby.querySelector('.menuMain'),
      multi = runtime.MP.lobby.querySelector('.menuMulti');
    main.style.display = 'none';
    multi.style.display = 'grid';
    runtime.mpLobbyError('');
    setTimeout(() => nameInput()?.focus(), 0);
  };
  const captureName = () => {
    runtime.MP.playerName = cleanMpName(nameInput()?.value || runtime.MP.playerName);
    if (nameInput()) nameInput().value = runtime.MP.playerName;
    updateMpNameLabels();
    return runtime.MP.playerName;
  };
  function ensureMpNameTags() {
    const pHead = document.querySelector('.cityzone .cityhead:not(.enemy)');
    const eHead = document.querySelector('.cityhead.enemy');
    if (pHead && !runtime.$('#playerNameTag')) {
      const el = document.createElement('span');
      el.id = 'playerNameTag';
      el.className = 'mpNameTag player hidden';
      pHead.querySelector('.cityhp').appendChild(el);
    }
    if (eHead && !runtime.$('#enemyNameTag')) {
      const el = document.createElement('span');
      el.id = 'enemyNameTag';
      el.className = 'mpNameTag enemy hidden';
      eHead.querySelector('.cityhp').appendChild(el);
    }
  }
  function updateMpNameLabels() {
    ensureMpNameTags();
    const active = !!(runtime.MP.enabled && runtime.MP.role && runtime.MP.role !== 'solo');
    const p = runtime.$('#playerNameTag'),
      e = runtime.$('#enemyNameTag');
    if (p) {
      p.textContent = runtime.MP.playerName || 'Játékos';
      p.classList.toggle('hidden', !active);
    }
    if (e) {
      e.textContent = runtime.MP.opponentName || 'Ellenfél';
      e.classList.toggle('hidden', !active);
    }
  }
  window.__ROADLORDS_MP_NAMES__ = {
    update: updateMpNameLabels,
    capture: captureName
  };
  const mpSendV4945 = runtime.mpSend;
  runtime.mpSend = function (data) {
    if (data?.type === 'hello') data = {
      ...data,
      name: runtime.MP.playerName
    };
    return mpSendV4945(data);
  };
  const mpHandleV4945 = runtime.mpHandle;
  runtime.mpHandle = function (data) {
    if (data?.type === 'hello') {
      runtime.MP.opponentName = cleanMpName(data.name || 'Ellenfél');
      updateMpNameLabels();
      return;
    }
    const out = mpHandleV4945(data);
    updateMpNameLabels();
    return out;
  };
  const mpCreateRoomV4945 = runtime.mpCreateRoom;
  runtime.mpCreateRoom = function () {
    captureName();
    return mpCreateRoomV4945();
  };
  const mpJoinRoomV4945 = runtime.mpJoinRoom;
  runtime.mpJoinRoom = function (raw) {
    captureName();
    return mpJoinRoomV4945(raw);
  };
  const createBtn = runtime.MP.lobby?.querySelector('#mpCreateRoom');
  if (createBtn) createBtn.onclick = () => runtime.mpCreateRoom();
  const joinBtn = runtime.MP.lobby?.querySelector('#mpJoinRoom');
  if (joinBtn) joinBtn.onclick = () => runtime.mpJoinRoom(runtime.MP.lobby.querySelector('#mpJoinCode').value);
  const joinCode = runtime.MP.lobby?.querySelector('#mpJoinCode');
  if (joinCode) joinCode.onkeydown = e => {
    if (e.key === 'Enter') runtime.mpJoinRoom(e.currentTarget.value);
  };
  function decisionStats(c) {
    const st = c?._matchStats || {};
    return {
      builtTotal: st.builtTotal || 0,
      builtByType: {
        ...(st.builtByType || {})
      },
      demolishedTotal: st.demolishedTotal || 0,
      demolishedByType: {
        ...(st.demolishedByType || {})
      },
      buildingUnlocks: st.buildingUnlocks || 0,
      buildingUpgrades: st.buildingUpgrades || 0,
      commonPicks: st.commonPicks || 0,
      legendaryPicks: st.legendaryPicks || 0,
      resourcesSpent: {
        ...(st.resourcesSpent || runtime.C())
      }
    };
  }
  const mpStrategyV4945 = runtime.mpStrategy;
  runtime.mpStrategy = function (c) {
    const data = mpStrategyV4945(c);
    data._mpDecisionStats = runtime.mpPack(decisionStats(c));
    return data;
  };
  const mpApplyGuestStrategyV4945 = runtime.mpApplyGuestStrategy;
  runtime.mpApplyGuestStrategy = function (data, seq) {
    const out = mpApplyGuestStrategyV4945(data, seq);
    if (runtime.E._mpDecisionStats) runtime.E._remoteDecisionStats = runtime.mpRevive(runtime.E._mpDecisionStats);
    return out;
  };
  runtime.v490InstallToggle = function () {
    const feet = [...document.querySelectorAll('section.cityzone .cityfoot')];
    const multiActive = !!(runtime.MP.enabled && runtime.MP.role && runtime.MP.role !== 'solo');
    feet.forEach((foot, index) => {
      let btn = foot.querySelector('.visualHintsToggle');
      if (index === 1 && !multiActive) {
        btn?.remove();
        return;
      }
      if (!btn) {
        btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'visualHintsToggle';
        foot.appendChild(btn);
      }
      btn.onclick = () => {
        runtime.state.visualHints = !runtime.state.visualHints;
        runtime.clearPlacementPreview();
        runtime.renderStatic();
        runtime.toast(runtime.state.visualHints ? 'Ikonok bekapcsolva.' : 'Ikonok kikapcsolva.');
      };
      btn.className = `visualHintsToggle${runtime.state.visualHints ? '' : ' off'}`;
      btn.innerHTML = `<span class="toggleMark">${runtime.state.visualHints ? '◉' : '○'}</span><span class="toggleLabel">Ikonok be/ki</span>`;
      btn.title = runtime.state.visualHints ? 'Minden városi ikon kikapcsolása' : 'Minden városi ikon bekapcsolása';
      btn.setAttribute('aria-pressed', runtime.state.visualHints ? 'true' : 'false');
    });
  };
  runtime.v490InstallToggle();
  updateMpNameLabels();
  const renderStaticV4945 = runtime.renderStatic;
  runtime.renderStatic = function () {
    const out = renderStaticV4945();
    updateMpNameLabels();
    return out;
  };
  const brandSmall = document.querySelector('.brand small');
  if (brandSmall) brandSmall.textContent = 'V4.9.45 · P2P 1V1';
  if (runtime.MP?.lobby) {
    const ver = runtime.MP.lobby.querySelector('.menuVersion');
    if (ver) ver.textContent = 'V4.9.45 · P2P';
  }
  document.title = 'Roadlords V4.9.45 – Multiplayer nevek és HUD';
  window.__ROADLORDS_VERSION__ = '4.9.45-resource-flow-hud-stats';
}
