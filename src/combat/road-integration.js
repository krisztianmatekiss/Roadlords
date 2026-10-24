import { installTowerFrontiers } from './frontiers.js';
import { drawBattleGround } from '../rendering/battle-ground.js';
import { installTestMenu } from '../ui/test-menu.js';
import { installRoadNavigation } from '../ui/road-navigation.js';
import { gateExitOffset } from '../world/gate-exits.js';
import { installRoadCities } from '../ui/road-cities.js';
import { installBuildingFootprints } from '../ui/building-footprints.js';
import { installRoadMinimap } from '../ui/road-minimap.js';
import { drawRoadScale } from '../rendering/road-scale.js';
export function initializeCombatRoadIntegration(runtime) {
  runtime.ROAD = {
    city: 440,
    width: runtime.PATH_LENGTH,
    half: 228,
    camera: 0,
    zoom: 1,
    testCount: 500,
    w: 1200,
    h: 650,
    clock: 0,
    pending: [],
    dead: [],
    grid: new Map(),
    counts: [0, 0],
    metrics: {
      steps: 0,
      damage: 0,
      attacks: 0,
      tickMs: 0,
      renderMs: 0,
      fps: 0
    },
    sprites: new Map(),
    test: false,
    paused: false,
    result: '',
    seed: 0,
    initial: null
  };
  installTowerFrontiers(runtime);
  runtime.roadCell = (x, y) => Math.floor(x / 64) * 32 + Math.floor((y + 512) / 64);
  runtime.roadOldPreferred = runtime.preferredTarget;
  runtime.preferredTarget = function (u, opps) {
    const range = u.spearVolleyReady ? Math.max(190, u.range) : u.range;
    if (u.roadAim?.alive && runtime.roadDistance(u, u.roadAim) <= range) return u.roadAim;
    if ((u.roadAimAt || 0) > runtime.ROAD.clock) return null;
    u.roadAimAt = runtime.ROAD.clock + .16 + u.id % 5 * .013;
    const candidates = [];
    runtime.roadVisit(u, range, v => {
      if (v.side !== u.side) {
        const dx = v.lane - u.lane,
          dy = (v.offset || 0) - (u.offset || 0);
        if (dx * dx + dy * dy <= range * range) candidates.push(v);
      }
    });
    const t = runtime.roadOldPreferred(u, candidates);
    u.roadAim = t;
    if (t) {
      u.roadTarget = t.id;
    }
    return t;
  };
  runtime.roadRealAttack = runtime.attackUnit;
  runtime.roadRealStructure = runtime.attackStructure;
  runtime.roadResolving = false;
  runtime.attackUnit = function (u, t, opts = {}) {
    if (runtime.roadResolving) return runtime.roadRealAttack(u, t, opts);
    return runtime.roadQueueAttack(u, t, false, opts);
  };
  runtime.attackStructure = function (u, t) {
    if (runtime.roadResolving) return runtime.roadRealStructure(u, t);
    return runtime.roadQueueAttack(u, t, true, {});
  };
  runtime.roadOldProjectile = runtime.addProjectile;
  runtime.roadOldMelee = runtime.addMeleeFx;
  runtime.addProjectile = function (...a) {
    if (!runtime.roadResolving) {
      const before = runtime.projectiles.length,
        out = runtime.roadOldProjectile(...a);
      if (runtime.projectiles.length > before) {
        const p = runtime.projectiles[runtime.projectiles.length - 1];
        p.roadStartLane = a[0].lane;
        p.roadStartOffset = a[0].offset || 0;
      }
      return out;
    }
  };
  runtime.addMeleeFx = function (...a) {
    if (!runtime.roadResolving) return runtime.roadOldMelee(...a);
  };
  runtime.roadOldDamage = runtime.damageUnit;
  runtime.damageUnit = function (t, amount, type) {
    const before = t.hp,
      out = runtime.roadOldDamage(t, amount, type);
    runtime.ROAD.metrics.damage += Math.max(0, before - t.hp);
    if (t.hp < before) t.roadHurtAt = runtime.ROAD.clock;
    return out;
  };
  runtime.roadOldKill = runtime.killUnit;
  runtime.killUnit = function (u, combat = true) {
    const was = u?.alive,
      out = runtime.roadOldKill(u, combat);
    if (was && !u.alive) {
      runtime.ROAD.dead.push({
        key: u.key,
        side: u.side,
        lane: u.lane,
        offset: u.offset || 0,
        veteran: u.veteran,
        undElite: u.undElite,
        eliteVisual: u.eliteVisual,
        warEliteMult: u.warEliteMult,
        roadFace: u.roadFace,
        death: runtime.ROAD.clock
      });
      if (runtime.ROAD.dead.length > 220) runtime.ROAD.dead.shift();
    }
    return out;
  };
  runtime.roadOldRelease = runtime.releaseUnit;
  runtime.releaseUnit = function (c, entry) {
    const u = runtime.roadOldRelease(c, entry);
    if (u) {
      u.offset = gateExitOffset(runtime, u);
      u.roadPrev = u.lane;
      // Fan out gradually after leaving the gate; do not spawn across the road.
      u.roadHomeOffset = ((u.id - 1) % 20 - 9.5) * 24;
      u.roadWalk = 0;
      u.roadTarget = null;
    }
    return u;
  };
  runtime.roadOldBattle = runtime.updateBattle;
  runtime.updateBattle = function (dt) {
    const begin = performance.now();
    runtime.ROAD.clock += dt;
    runtime.roadRefreshFrontiers();
    for (const u of runtime.state.units) {
      runtime.setBattleLane(u, u.lane);
      u.roadPrev = u.lane;
      u.roadPrevOffset = u.offset || 0;
      u.roadEngaged = 0;
    }
    for (const u of runtime.state.units) if (u.alive && u.roadSeek?.alive) u.roadSeek.roadEngaged++;
    runtime.roadReindex();
    runtime.roadImpacts();
    runtime.roadOldBattle(dt);
    runtime.roadRefreshFrontiers();
    for (const u of runtime.state.units) runtime.setBattleLane(u, u.lane);
    runtime.roadSeparate();
    runtime.roadReindex();
    let idleMelee = 0;
    for (const u of runtime.state.units) {
      const distance = Math.hypot(u.lane - u.roadPrev, (u.offset || 0) - u.roadPrevOffset);
      u.roadMoving = distance > .08;
      // Facing follows actual travel, rather than an old navigation target.
      if (Math.abs(u.lane-u.roadPrev)>.08) u.roadFace=Math.sign(u.lane-u.roadPrev);
      u.roadWalk = (u.roadWalk || 0) + distance * .17;
      u.roadTravel = (u.roadTravel || 0) + distance;
      const engaged = u.roadAim?.alive && runtime.roadDistance(u, u.roadAim) <= u.range + 1;
      u.roadIdleFor = u.roadMoving || engaged || u.roadPending || u.stunTime > 0 ? 0 : (u.roadIdleFor || 0) + dt;
      if (u.tags.includes('melee') && u.roadIdleFor > 2) idleMelee++;
    }
    runtime.ROAD.metrics.idleMelee = idleMelee;
    runtime.ROAD.metrics.steps++;
    runtime.ROAD.metrics.tickMs = performance.now() - begin;
  };
  runtime.roadOldTick = runtime.tick;
  runtime.tick = function (dt) {
    if (!runtime.ROAD.test) return runtime.roadOldTick(dt);
    if (runtime.ROAD.paused || runtime.state.ended) return;
    runtime.roadOldTick(dt);
    if (!runtime.ROAD.counts[0] || !runtime.ROAD.counts[1]) {
      runtime.state.ended = true;
      runtime.state.running = false;
      runtime.ROAD.result = runtime.ROAD.counts[0] ? 'SAJÁT GYŐZELEM' : runtime.ROAD.counts[1] ? 'AZ ELLENFÉL GYŐZÖTT' : 'DÖNTETLEN';
    }
  };
  runtime.roadResources = runtime.produceResources;
  runtime.produceResources = (...a) => runtime.ROAD.test ? undefined : runtime.roadResources(...a);
  runtime.roadSpawners = runtime.updateSpawners;
  runtime.updateSpawners = (...a) => runtime.ROAD.test ? undefined : runtime.roadSpawners(...a);
  runtime.roadAI = runtime.enemyBuildAI;
  runtime.enemyBuildAI = (...a) => runtime.ROAD.test ? undefined : runtime.roadAI(...a);
  runtime.roadGateAI = runtime.enemyGateAI;
  runtime.enemyGateAI = (...a) => runtime.ROAD.test ? undefined : runtime.roadGateAI(...a);
  runtime.roadQueues = runtime.releaseQueues;
  runtime.releaseQueues = (...a) => runtime.ROAD.test ? undefined : runtime.roadQueues(...a);
  runtime.roadChoices = runtime.queueChoice;
  runtime.queueChoice = (...a) => runtime.ROAD.test ? undefined : runtime.roadChoices(...a);
  runtime.roadEnemyChoices = runtime.grantEnemyPick;
  runtime.grantEnemyPick = (...a) => runtime.ROAD.test ? undefined : runtime.roadEnemyChoices(...a);
  runtime.roadOldFinish = runtime.finish;
  runtime.finish = function (win) {
    if (!runtime.ROAD.test) return runtime.roadOldFinish(win);
    runtime.state.ended = true;
    runtime.state.running = false;
    runtime.ROAD.result = win ? 'SAJÁT GYŐZELEM' : 'ELLENFÉL GYŐZELEM';
  };
  runtime.roadWar = runtime.$('.war');
  runtime.roadBattle = runtime.$('.battle');
  runtime.roadWorld = document.createElement('div');
  runtime.roadWorld.className = 'roadWorld';
  runtime.roadWorld.style.width = runtime.PATH_LENGTH + runtime.ROAD.city * 2 + 'px';
  for (const el of [...runtime.roadWar.children]) runtime.roadWorld.appendChild(el);
  runtime.roadWar.appendChild(runtime.roadWorld);
  runtime.roadBattle.style.setProperty('width', runtime.PATH_LENGTH + 'px', 'important');
  runtime.roadHud = document.createElement('div');
  runtime.roadHud.id = 'roadHud';
  runtime.roadHud.innerHTML = '<span id="roadCounts"></span><span id="roadFps"></span><span id="roadStatus"></span><button data-camera="0">Saját város</button><button data-camera="1">Csata</button><button data-camera="2">Ellenfél</button><button id="roadZoomOut" aria-label="Kicsinyítés">−</button><span id="roadZoom">100%</span><button id="roadZoomIn" aria-label="Nagyítás">+</button><button id="roadFigureToggle" hidden aria-pressed="true">Grafika: Új</button><button data-test id="roadPause">Szünet</button><button data-test id="roadRestart">Újraindítás</button><button data-test id="roadMenu">Főmenü</button>';
  runtime.$('.command').appendChild(runtime.roadHud);
  installRoadCities(runtime);
  installBuildingFootprints(runtime);
  installRoadMinimap(runtime);
  installRoadNavigation(runtime);
  runtime.roadHud.querySelectorAll('[data-camera]').forEach(b => b.onclick = () => {
    const v = +b.dataset.camera;
    if (v === 1) runtime.roadFocusFront();
    else runtime.roadWar.scrollLeft = v === 0 ? 0 : runtime.roadWorld.offsetWidth;
  });
  new ResizeObserver(runtime.roadResize).observe(runtime.roadWar);
  runtime.roadResize();
  runtime.pointAt = function (distance, lateral = 0) {
    return {
      x: (runtime.clamp(distance, 0, runtime.PATH_LENGTH) - runtime.ROAD.camera) * runtime.ROAD.zoom,
      y: runtime.ROAD.h / 2 + lateral * runtime.ROAD.h / 600 * runtime.ROAD.zoom
    };
  };
  runtime.ROAD.art = new Map();
  const originalArt = Promise.all(Object.entries(runtime.UNIT_IMAGES).filter(([k]) => runtime.UNITS[k]).map(async ([key, src]) => {
    const image = new Image();
    image.src = src;
    await image.decode();
    runtime.ROAD.art.set(key, image);
  }));
  runtime.roadArtReady = originalArt;
  runtime.renderBattle = function (raw) {
    const begin = performance.now();
    runtime.roadUpdateNavigation(raw);
    const guest=runtime.MP.enabled&&runtime.MP.role==='guest';
    if(guest)for(const u of runtime.state.units)u.roadRenderPrev=u.lane;
    runtime.mpInterpolateUnits(raw);
    if(guest)for(const u of runtime.state.units){
      const dx=u.lane-u.roadRenderPrev;
      if(Math.abs(dx)>.08)u.roadFace=Math.sign(dx);
      u.roadWalk=(u.roadWalk||0)+Math.abs(dx)*.17;
    }
    if (runtime.MP.enabled && runtime.MP.role === 'guest') {
      runtime.ROAD.clock = runtime.state.time;
      const previous = runtime.ROAD.guestPrevious || new Map(),
        next = new Map();
      for (const u of runtime.state.units) next.set(u.id, {
        key: u.key,
        side: u.side,
        lane: u.lane,
        offset: u.offset,
        veteran: u.veteran,
        undElite: u.undElite,
        eliteVisual: u.eliteVisual,
        warEliteMult: u.warEliteMult
      });
      for (const [id, u] of previous) if (!next.has(id)) runtime.ROAD.dead.push({
        ...u,
        death: runtime.ROAD.clock
      });
      runtime.ROAD.guestPrevious = next;
      if (runtime.ROAD.dead.length > 220) runtime.ROAD.dead.splice(0, runtime.ROAD.dead.length - 220);
    }
    const viewportX = runtime.clamp(runtime.roadWar.scrollLeft - runtime.ROAD.city, 0, runtime.PATH_LENGTH - runtime.ROAD.w);
    runtime.ROAD.camera = viewportX + (runtime.ROAD.w - runtime.ROAD.w / runtime.ROAD.zoom) / 2;
    runtime.canvas.style.transform = 'translateX(' + viewportX + 'px)';
    drawBattleGround(runtime);
    drawRoadScale(runtime);
    runtime.drawTowerRangeV496();
    for (const t of runtime.towers) {
      const x = runtime.pointAt(t.lane).x;
      if (x > -150 && x < runtime.ROAD.w + 150) runtime.drawTower(t);
    }
    let n = 0;
    for (const d of runtime.ROAD.dead) {
      if (runtime.ROAD.clock - d.death < 2.5) {
        runtime.ROAD.dead[n++] = d;
        runtime.roadDrawUnit(d, true);
      }
    }
    runtime.ROAD.dead.length = n;
    const visible = runtime.state.units.filter(u => u.alive && u.lane >= runtime.ROAD.camera - 40 && u.lane <= runtime.ROAD.camera + runtime.ROAD.w / runtime.ROAD.zoom + 60);
    runtime.ROAD.lowDetail = visible.length > 240 && runtime.ROAD.zoom <= 1.25;
    visible.sort((a, b) => (a.offset || 0) - (b.offset || 0) || a.id - b.id);
    runtime.roadBeginUnitEffects?.();
    for (const u of visible) runtime.roadDrawUnit(u);
    runtime.roadFlushUnitEffects?.();
    runtime.roadDrawShots();
    runtime.roadDrawEffects?.();
    if (runtime.projectiles.length > 180) runtime.projectiles.splice(0, runtime.projectiles.length - 180);
    if (runtime.combatFx.length > 180) runtime.combatFx.splice(0, runtime.combatFx.length - 180);
    const dt = runtime.state.running && !runtime.state.modal && !runtime.ROAD.paused && !runtime.state.ended ? raw * runtime.state.speed : 0;
    for (const p of runtime.projectiles) if (Number.isFinite(p.roadStartLane)) {
      const from = runtime.pointAt(p.roadStartLane, p.roadStartOffset),
        to = runtime.pointAt(p.endLane, p.endOffset);
      p.x0 = from.x;
      p.y0 = from.y;
      p.x1 = to.x;
      p.y1 = to.y;
    }
    runtime.drawProjectiles(dt);
    runtime.drawCombatFx(dt);
    runtime.particles.length = 0;
    runtime.roadDrawMinimap();
    runtime.ROAD.metrics.renderMs = performance.now() - begin;
    const now = performance.now();
    if (!runtime.ROAD.fpsAt) runtime.ROAD.fpsAt = now;
    runtime.ROAD.frames = (runtime.ROAD.frames || 0) + 1;
    if (now - runtime.ROAD.fpsAt >= 500) {
      runtime.ROAD.metrics.fps = runtime.ROAD.frames * 1000 / (now - runtime.ROAD.fpsAt);
      runtime.ROAD.frames = 0;
      runtime.ROAD.fpsAt = now;
      let p = 0,
        e = 0;
      for (const u of runtime.state.units) if (u.alive) u.side === 'player' ? p++ : e++;
      runtime.$('#roadCounts').textContent = `SAJÁT ${p} / ELLENFÉL ${e}`;
      runtime.$('#roadFps').textContent = `${runtime.ROAD.metrics.fps.toFixed(0)} FPS`;
      runtime.$('#roadStatus').textContent = runtime.ROAD.test ? runtime.ROAD.result || `${runtime.factionName(runtime.P.race)} vs ${runtime.factionName(runtime.E.race)} · ${runtime.ROAD.paused ? 'SZÜNET' : runtime.fmt(runtime.state.time)}` : 'HOSSZÚ ÚT';
    }
  };
  runtime.ROAD.templates = [structuredClone(runtime.P), structuredClone(runtime.E)];
  installTestMenu(runtime);
  runtime.roadTestSummary = document.createElement('p');
  runtime.roadTestSummary.id = 'roadTestSummary';
  runtime.$('.command').appendChild(runtime.roadTestSummary);
  runtime.$('#roadPause').onclick = runtime.roadPause;
  runtime.$('#roadFigureToggle').onclick=()=>{
    runtime.ROAD.figureStyle=runtime.ROAD.figureStyle!=='simple'?'simple':runtime.ROAD.testRoster==='skeleton'?'skeleton':'refined';
    runtime.$('#roadFigureToggle').textContent=runtime.ROAD.figureStyle!=='simple'?'Grafika: Új':'Grafika: Jelenlegi';
    runtime.$('#roadFigureToggle').setAttribute('aria-pressed',String(runtime.ROAD.figureStyle!=='simple'));
  };
  runtime.$('#roadRestart').onclick = () => runtime.roadStartTest(runtime.ROAD.seed, {count: runtime.ROAD.testCount, roster: runtime.ROAD.testRoster, figureStyle: runtime.ROAD.figureStyle});
  const setZoom = value => {runtime.ROAD.zoom = runtime.clamp(value, .75, 2); runtime.$('#roadZoom').textContent = Math.round(runtime.ROAD.zoom * 100) + '%';};
  runtime.$('#roadZoomOut').onclick = () => setZoom(runtime.ROAD.zoom - .25);
  runtime.$('#roadZoomIn').onclick = () => setZoom(runtime.ROAD.zoom + .25);
  runtime.$('#roadMenu').onclick = () => location.reload();
  document.addEventListener('keydown', e => {
    if (!runtime.ROAD.test || e.target.closest('input,select,textarea')) return;
    if (e.code === 'Space') {
      e.preventDefault();
      e.stopImmediatePropagation();
      runtime.roadPause();
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopImmediatePropagation();
      runtime.roadPause();
    }
  }, true);
  runtime.roadMirror = runtime.mpMirrorUnit;
  runtime.mpMirrorUnit = function (u) {
    const out = runtime.roadMirror(u);
    if (out.roadAttack) {
      out.roadAttack = {
        ...out.roadAttack,
        lane: runtime.PATH_LENGTH - out.roadAttack.lane,
        to: runtime.PATH_LENGTH - out.roadAttack.to,
        offset: -out.roadAttack.offset,
        toOffset: -out.roadAttack.toOffset
      };
    }
    return out;
  };
  Object.assign(window.__ROADLORDS__, {
    tick: runtime.tick,
    updateBattle: runtime.updateBattle,
    releaseUnit: runtime.releaseUnit,
    killUnit: runtime.killUnit,
    damageUnit: runtime.damageUnit,
    preferredTarget: runtime.preferredTarget,
    pointAt: runtime.pointAt,
    attackUnit: runtime.attackUnit,
    attackStructure: runtime.attackStructure
  });
  window.__ROADLORDS_ROAD__ = {
    state: runtime.ROAD,
    startTest: runtime.roadStartTest,
    pause: runtime.roadPause,
    step: dt => runtime.tick(dt),
    impact: runtime.roadImpacts,
    reindex: runtime.roadReindex,
    distance: runtime.roadDistance,
    MP: runtime.MP,
    artReady: runtime.roadArtReady,
    render: runtime.renderBattle,
    pose: runtime.battleFigurePose,
    attach: runtime.mpAttachConnection,
    applySnapshot: runtime.mpApplySnapshot,
    sendSnapshot: runtime.mpSendSnapshot,
    handle: runtime.mpHandle,
    pack: runtime.mpPack,
    mirror: runtime.mpMirrorUnit,
    snapshot: () => ({
      testCount: runtime.ROAD.testCount,
      seed: runtime.ROAD.seed,
      combatTime: runtime.ROAD.clock,
      time: runtime.state.time,
      counts: [...runtime.ROAD.counts],
      pending: runtime.ROAD.pending.length,
      corpses: runtime.ROAD.dead.length,
      metrics: {
        ...runtime.ROAD.metrics
      },
      initial: runtime.ROAD.initial,
      error: runtime.state.lastRuntimeErrorV4965 || null
    })
  };
  runtime.roadOldRenderCity = runtime.renderCity;
  runtime.roadRendered = new WeakMap();
  runtime.renderCity = function (el, c, interactive) {
    if (runtime.ROAD.test && runtime.roadRendered.get(el) === runtime.ROAD.initial) return;
    const out = runtime.roadOldRenderCity(el, c, interactive);
    if (runtime.ROAD.test) runtime.roadRendered.set(el, runtime.ROAD.initial);
    return out;
  };
  runtime.roadOldHud = runtime.updateHud;
  runtime.updateHud = function () {
    if (!runtime.ROAD.test) return runtime.roadOldHud();
    for (const [id, c] of [['playerHp', runtime.P], ['enemyHp', runtime.E]]) {
      const el = runtime.$('#' + id);
      if (el) el.textContent = Math.ceil(c.hp);
    }
    const timer = runtime.$('#timer');
    if (timer) timer.textContent = runtime.fmt(runtime.state.time);
    for (const r of runtime.RES) {
      const value = runtime.$('#' + r + 'Stock');
      if (value) value.textContent = Math.floor(runtime.P.resources[r]) + ' / ' + Math.floor(runtime.P.caps[r]);
    }
    runtime.roadUpdateCityHud();
  };
}
