import { assetUrl } from '../assets/urls.js';
export function initializeMultiplayerSpeedConsensus(runtime) {
  const V4971_SPEEDS = [1, 2, 4];
  const V4971_ALCHEMY_FOLLOWUPS = new Set(['alc_replace_movement', 'alc_replace_regen', 'alc_recipe_twist']);
  for (const key of ['mercAuto', 'alchemyRecipeSlots', 'alchemyPotionUnlocks', 'alchemySlotLegendStacks']) {
    if (!runtime.MP_STRATEGY_KEYS.includes(key)) runtime.MP_STRATEGY_KEYS.push(key);
  }
  const isMulti = () => !!(runtime.MP.enabled && (runtime.MP.role === 'host' || runtime.MP.role === 'guest'));
  const validSpeed = v => V4971_SPEEDS.includes(Number(v)) ? Number(v) : 1;
  const updateSpeedLabel = () => {
    const b = runtime.$('#speedBtn');
    if (b) b.textContent = validSpeed(runtime.state.speed) + '×';
  };
  const style = document.createElement('style');
  style.textContent = "@import url(\"" + (assetUrl("styles/features/multiplayer-speed-consensus-33.css") + "\");");
  document.head.appendChild(style);
  const speedMenu = document.createElement('div');
  speedMenu.id = 'mpSpeedMenuV4971';
  speedMenu.className = 'mpSpeedMenuV4971';
  speedMenu.innerHTML = V4971_SPEEDS.map(v => `<button type="button" data-speed="${v}">${v}×</button>`).join('');
  document.body.appendChild(speedMenu);
  const speedPrompt = document.createElement('div');
  speedPrompt.id = 'mpSpeedPromptV4971';
  speedPrompt.className = 'mpSpeedPromptV4971';
  speedPrompt.innerHTML = '<b>Gyorsítási kérés</b><p></p><div class="actions"><button type="button" class="accept">ELFOGADOM</button><button type="button" class="decline">MARADJON</button></div>';
  document.body.appendChild(speedPrompt);
  function syncMultiControls() {
    const multi = isMulti();
    document.body.classList.toggle('roadlords-multi-active', multi);
    const pause = runtime.$('#pauseBtn');
    if (pause) {
      pause.setAttribute('aria-hidden', multi ? 'true' : 'false');
      pause.tabIndex = multi ? -1 : 0;
    }
    const speed = runtime.$('#speedBtn');
    if (speed) speed.title = multi ? 'Sebesség · gyorsításhoz mindkét játékos beleegyezése kell; lassítás azonnali' : 'T · Sebesség váltása';
    if (!multi) {
      speedMenu.classList.remove('show');
      speedPrompt.classList.remove('show');
    }
    updateSpeedLabel();
  }
  const pause = runtime.$('#pauseBtn'),
    oldPauseClick = pause?.onclick;
  if (pause) pause.onclick = function (ev) {
    if (isMulti()) return;
    return oldPauseClick?.call(this, ev);
  };
  function positionSpeedMenu() {
    const b = runtime.$('#speedBtn');
    if (!b) return;
    const r = b.getBoundingClientRect(),
      w = speedMenu.offsetWidth || 210;
    speedMenu.style.top = Math.round(r.bottom + 7) + 'px';
    speedMenu.style.left = Math.round(runtime.clamp(r.right - w, 8, window.innerWidth - w - 8)) + 'px';
  }
  function updateSpeedMenu() {
    speedMenu.querySelectorAll('[data-speed]').forEach(b => b.classList.toggle('active', Number(b.dataset.speed) === validSpeed(runtime.state.speed)));
  }
  function toggleSpeedMenu() {
    if (!runtime.MP.started || runtime.state.ended) {
      runtime.toast('A sebesség a meccs indulása után állítható.');
      return;
    }
    updateSpeedMenu();
    speedMenu.classList.toggle('show');
    if (speedMenu.classList.contains('show')) positionSpeedMenu();
  }
  let speedReqCounter = 0;
  const speedRequestId = () => `${runtime.MP.role || 'p'}-${++speedReqCounter}-${Math.floor(performance.now())}`;
  function applySpeed(speed, notify = true) {
    speed = validSpeed(speed);
    runtime.state.speed = speed;
    updateSpeedLabel();
    updateSpeedMenu();
    if (notify) runtime.toast(`Sebesség: ${speed}×`);
  }
  function authoritativeSpeed(speed, notify = true) {
    speed = validSpeed(speed);
    applySpeed(speed, notify);
    runtime.mpSend({
      type: 'speed_set_v4971',
      speed
    });
    if (runtime.MP.role === 'host') queueMicrotask(() => runtime.mpSendSnapshot());
  }
  function requestSpeed(speed) {
    speed = validSpeed(speed);
    if (speed <= runtime.state.speed) return;
    if (runtime.MP.speedRequestOutV4971) {
      runtime.toast('Már vársz egy gyorsítási válaszra.');
      return;
    }
    const id = speedRequestId();
    runtime.MP.speedRequestOutV4971 = {
      id,
      speed
    };
    runtime.mpSend({
      type: 'speed_request_v4971',
      id,
      speed
    });
    runtime.toast(`${speed}× gyorsítási kérés elküldve.`);
  }
  function chooseSpeed(speed) {
    speed = validSpeed(speed);
    const cur = validSpeed(runtime.state.speed);
    speedMenu.classList.remove('show');
    if (speed === cur) return;
    if (!isMulti()) {
      applySpeed(speed);
      return;
    }
    if (speed < cur) {
      applySpeed(speed, false);
      if (runtime.MP.role === 'host') authoritativeSpeed(speed, true);else {
        runtime.mpSend({
          type: 'speed_down_v4971',
          speed
        });
        runtime.toast(`Lassítás: ${speed}×`);
      }
      return;
    }
    requestSpeed(speed);
  }
  speedMenu.querySelectorAll('[data-speed]').forEach(b => b.onclick = () => chooseSpeed(Number(b.dataset.speed)));
  const speedBtn = runtime.$('#speedBtn'),
    oldSpeedClick = speedBtn?.onclick;
  if (speedBtn) speedBtn.onclick = function (ev) {
    if (isMulti()) {
      toggleSpeedMenu();
      return;
    }
    return oldSpeedClick?.call(this, ev);
  };
  document.addEventListener('pointerdown', e => {
    if (speedMenu.classList.contains('show') && !speedMenu.contains(e.target) && e.target !== speedBtn) speedMenu.classList.remove('show');
  }, true);
  window.addEventListener('resize', () => {
    if (speedMenu.classList.contains('show')) positionSpeedMenu();
  });
  function showSpeedPrompt(data) {
    const speed = validSpeed(data.speed),
      name = runtime.MP.opponentName || 'Az ellenfél';
    runtime.MP.speedRequestInV4971 = {
      id: String(data.id || ''),
      speed
    };
    speedPrompt.querySelector('b').textContent = `${speed}× gyorsítás?`;
    speedPrompt.querySelector('p').textContent = `${name} gyorsítani szeretné a játékot ${speed}× sebességre. Elfogadod?`;
    speedPrompt.classList.add('show');
  }
  function closeSpeedPrompt() {
    speedPrompt.classList.remove('show');
    runtime.MP.speedRequestInV4971 = null;
  }
  speedPrompt.querySelector('.accept').onclick = () => {
    const req = runtime.MP.speedRequestInV4971;
    if (!req) return closeSpeedPrompt();
    closeSpeedPrompt();
    if (runtime.MP.role === 'host') {
      authoritativeSpeed(req.speed, true);
      runtime.mpSend({
        type: 'speed_response_v4971',
        id: req.id,
        speed: req.speed,
        accepted: true
      });
    } else {
      runtime.mpSend({
        type: 'speed_response_v4971',
        id: req.id,
        speed: req.speed,
        accepted: true
      });
      runtime.toast(`${req.speed}× gyorsítás elfogadva.`);
    }
  };
  speedPrompt.querySelector('.decline').onclick = () => {
    const req = runtime.MP.speedRequestInV4971;
    if (!req) return closeSpeedPrompt();
    closeSpeedPrompt();
    runtime.mpSend({
      type: 'speed_response_v4971',
      id: req.id,
      speed: req.speed,
      accepted: false
    });
    runtime.toast('Gyorsítás elutasítva.');
  };
  const alchemyVisible = () => {
    const el = document.getElementById('alchemyRecipeModalV4961');
    return !!(el && !el.classList.contains('hidden') && getComputedStyle(el).display !== 'none');
  };
  const guestDecisionActive = () => !!(runtime.state.choiceContext || runtime.state.pendingChoices && runtime.state.pendingChoices.length || alchemyVisible() || runtime.MP.alchemyHoldV4971);
  const mpSendV4971 = runtime.mpSend;
  runtime.mpSend = function (data) {
    if (data?.type === 'choice_done' && runtime.MP.role === 'guest') {
      if (guestDecisionActive()) {
        runtime.MP.deferredChoiceDoneV4971 = true;
        return;
      }
      runtime.MP.deferredChoiceDoneV4971 = false;
    }
    return mpSendV4971(data);
  };
  function releaseDeferredChoiceDone() {
    if (runtime.MP.role !== 'guest' || !runtime.MP.deferredChoiceDoneV4971 || guestDecisionActive()) return;
    runtime.MP.deferredChoiceDoneV4971 = false;
    mpSendV4971({
      type: 'choice_done'
    });
  }
  const chooseV4971 = runtime.choose;
  runtime.choose = function (o, index = -1) {
    const follow = runtime.MP.enabled && runtime.MP.role === 'guest' && !!(o && V4971_ALCHEMY_FOLLOWUPS.has(o.id));
    if (follow) {
      runtime.MP.alchemyHoldV4971 = true;
      runtime.MP.alchemySeenV4971 = false;
    }
    const out = chooseV4971(o, index);
    setTimeout(releaseDeferredChoiceDone, 0);
    return out;
  };
  setInterval(() => {
    if (runtime.MP.alchemyHoldV4971) {
      const visible = alchemyVisible();
      if (visible) runtime.MP.alchemySeenV4971 = true;else if (runtime.MP.alchemySeenV4971) {
        runtime.MP.alchemyHoldV4971 = false;
        runtime.MP.alchemySeenV4971 = false;
        releaseDeferredChoiceDone();
      }
    } else releaseDeferredChoiceDone();
  }, 80);
  document.addEventListener('click', e => {
    if (!(runtime.MP.enabled && runtime.MP.role === 'guest' && runtime.MP.started)) return;
    const btn = e.target?.closest?.('[data-merc-hire]');
    if (!btn) return;
    const dir = btn.dataset.mercHire;
    if (!['up', 'stay', 'down'].includes(dir)) return;
    const buildingId = btn.dataset.mercBuilding || btn.closest?.('.buildingInspectorWindow')?.dataset.id || null;
    e.preventDefault();
    e.stopImmediatePropagation();
    runtime.mpSendStrategy(true);
    runtime.mpSend({
      type: 'merc_hire_request_v4971',
      dir,
      buildingId
    });
    runtime.toast('Zsoldosbérlés elküldve a hostnak…');
  }, true);
  const tickV4971 = runtime.tick;
  runtime.tick = function (dt) {
    if (runtime.MP.enabled && runtime.MP.role === 'guest') {
      const auto = runtime.P.mercAuto,
        pcd = runtime.P.mercCooldown,
        ecd = runtime.E.mercCooldown;
      if (auto) runtime.P.mercAuto = null;
      try {
        return tickV4971(dt);
      } finally {
        runtime.P.mercAuto = auto;
        if (Number.isFinite(pcd)) runtime.P.mercCooldown = pcd;
        if (Number.isFinite(ecd)) runtime.E.mercCooldown = ecd;
      }
    }
    const out = tickV4971(dt);
    if (runtime.MP.enabled && runtime.MP.role === 'host' && runtime.MP.started && !runtime.MP.guestChoicePending && runtime.state.running && !runtime.state.ended && !runtime.state.modal && runtime.E.mercAuto && !(runtime.E.mercCooldown > 0)) {
      const hire = window.__ROADLORDS_V4956__?.hireMercs;
      if (typeof hire === 'function' && hire(runtime.E, runtime.E.mercAuto, true)) queueMicrotask(() => runtime.mpSendSnapshot());
    }
    return out;
  };
  const mpHandleV4971 = runtime.mpHandle;
  runtime.mpHandle = function (data) {
    if (data?.type === 'merc_hire_request_v4971' && runtime.MP.role === 'host') {
      const dir = data.dir,
        hire = window.__ROADLORDS_V4956__?.hireMercs;
      const ok = ['up', 'stay', 'down'].includes(dir) && typeof hire === 'function' && !!hire(runtime.E, dir, false, data.buildingId || null);
      runtime.mpSend({
        type: 'merc_hire_result_v4971',
        ok,
        dir,
        buildingId: data.buildingId || null
      });
      queueMicrotask(() => runtime.mpSendSnapshot(true));
      return;
    }
    if (data?.type === 'merc_hire_result_v4971' && runtime.MP.role === 'guest') {
      runtime.toast(data.ok ? 'Zsoldoscsapat sikeresen kibérelve.' : 'A zsoldosbérlés már nem volt végrehajtható.');
      return;
    }
    if (data?.type === 'speed_down_v4971' && runtime.MP.role === 'host') {
      const speed = validSpeed(data.speed);
      if (speed <= validSpeed(runtime.state.speed)) authoritativeSpeed(speed, true);
      return;
    }
    if (data?.type === 'speed_set_v4971') {
      applySpeed(data.speed, false);
      runtime.MP.speedRequestOutV4971 = null;
      closeSpeedPrompt();
      return;
    }
    if (data?.type === 'speed_request_v4971') {
      const speed = validSpeed(data.speed);
      if (speed <= validSpeed(runtime.state.speed)) {
        if (runtime.MP.role === 'host') authoritativeSpeed(speed, false);else runtime.mpSend({
          type: 'speed_down_v4971',
          speed
        });
        return;
      }
      const own = runtime.MP.speedRequestOutV4971;
      if (own && own.speed === speed) {
        if (runtime.MP.role === 'host') {
          runtime.MP.speedRequestOutV4971 = null;
          authoritativeSpeed(speed, true);
          runtime.mpSend({
            type: 'speed_response_v4971',
            id: data.id,
            speed,
            accepted: true
          });
        } else {
          runtime.MP.speedRequestOutV4971 = null;
          runtime.mpSend({
            type: 'speed_response_v4971',
            id: data.id,
            speed,
            accepted: true
          });
        }
        return;
      }
      showSpeedPrompt({
        ...data,
        speed
      });
      return;
    }
    if (data?.type === 'speed_response_v4971') {
      const req = runtime.MP.speedRequestOutV4971;
      if (!req || String(req.id) !== String(data.id)) return;
      runtime.MP.speedRequestOutV4971 = null;
      if (!data.accepted) {
        runtime.toast('Az ellenfél nem fogadta el a gyorsítást.');
        return;
      }
      if (runtime.MP.role === 'host') authoritativeSpeed(req.speed, true);else runtime.toast(`${req.speed}× gyorsítás elfogadva.`);
      return;
    }
    const out = mpHandleV4971(data);
    if (data?.type === 'start' && isMulti()) {
      runtime.MP.speedRequestOutV4971 = null;
      runtime.MP.speedRequestInV4971 = null;
      speedPrompt.classList.remove('show');
      speedMenu.classList.remove('show');
      applySpeed(1, false);
    }
    return out;
  };
  const mpApplySnapshotV4971 = runtime.mpApplySnapshot;
  runtime.mpApplySnapshot = function (data) {
    const out = mpApplySnapshotV4971(data);
    updateSpeedLabel();
    syncMultiControls();
    return out;
  };
  setInterval(syncMultiControls, 250);
  syncMultiControls();
}
