import { assetUrl } from '../assets/urls.js';
export function initializeCityMercenaryNetwork(runtime) {
  const MERC = 'merc_tent';
  const MERC_NETWORK = 'mercenary_network';
  const DIRS = ['up', 'stay', 'down'];
  const LABEL = {
    up: 'Felfelé',
    stay: 'Tartás',
    down: 'Lefelé'
  };
  const ICON = {
    up: '⬆',
    stay: '—',
    down: '⬇'
  };
  const COLOR = {
    up: '#7ddc8b',
    stay: '#d8c98a',
    down: '#f08d86'
  };
  const RUNTIME_KEYS = ['mercLevel', 'mercCooldown', 'mercOffers'];
  if (!runtime.LEGENDARY.some(x => x.id === MERC_NETWORK)) runtime.LEGENDARY.push({
    id: MERC_NETWORK,
    icon: '🏕️',
    name: 'Zsoldoshálózat',
    description: 'A Zsoldos sátor elveszíti az Egyedi korlátozását: bármennyi építhető. Minden sátor saját zsoldosszinttel, ajánlatokkal, cooldownnal és automatával működik.',
    eligible: s => runtime.hasBuilding(s, MERC)
  });
  runtime.PICK_IMAGES[MERC_NETWORK] = runtime.PICK_IMAGES[MERC] || runtime.CARD_IMAGES[MERC] || runtime.BUILDING_IMAGES[MERC] || runtime.PICK_IMAGES.production;
  const oldIsUniqueV4994 = runtime.isUniqueBuilding;
  runtime.isUniqueBuilding = function (c, type) {
    if (type === MERC && runtime.hasLeg(c, MERC_NETWORK)) return false;
    return oldIsUniqueV4994(c, type);
  };
  function tents(c) {
    return runtime.buildingOf(c, MERC);
  }
  function normalCount(c, id) {
    return Math.max(0, Number(c?.normal?.[id]) || 0);
  }
  function sizeFor(c, level) {
    return Math.max(1, 10 + (Math.max(1, level) - 1) * 2 + normalCount(c, 'merc_size'));
  }
  function powerMult(c) {
    return 1 + .10 * normalCount(c, 'merc_power');
  }
  function costMult(c) {
    return Math.max(.4, 1 - .10 * normalCount(c, 'merc_cost'));
  }
  function cooldownFor(c, level) {
    return Math.max(6, (20 + (Math.max(1, level) - 1) * 5) * Math.max(.4, 1 - .10 * normalCount(c, 'merc_cd')));
  }
  function dirDelta(dir) {
    return dir === 'up' ? 1 : dir === 'down' ? -1 : 0;
  }
  function nextLevel(b, dir) {
    return Math.max(1, (Number(b?.mercLevel) || 1) + dirDelta(dir));
  }
  function weightedPick(list) {
    const total = list.reduce((sum, x) => sum + Math.max(0, Number(x[1]) || 0), 0);
    let roll = Math.random() * Math.max(.0001, total);
    for (const [key, wRaw] of list) {
      roll -= Math.max(0, Number(wRaw) || 0);
      if (roll <= 0) return key;
    }
    return list[0]?.[0] || 'swordsman';
  }
  function weights(level, dir) {
    const elite = Math.max(0, level - 1),
      upper = dir === 'up',
      lower = dir === 'down';
    return [['swordsman', Math.max(1, 6 - elite + (lower ? 2 : 0))], ['spearman', Math.max(1, 5 - elite + (lower ? 1 : 0))], ['archer', Math.max(1, 5 - elite)], ['priest', level >= 2 ? Math.max(1, 1 + elite + (upper ? 1 : 0)) : 0], ['knight', level >= 2 ? Math.max(1, 1 + elite + (upper ? 2 : 0)) : 0], ['mage', level >= 3 ? Math.max(1, elite + (upper ? 2 : 0)) : 0], ['catapult', level >= 4 ? Math.max(1, elite - 1 + (upper ? 1 : 0)) : 0]].filter(x => x[1] > 0);
  }
  function unitsText(units) {
    return (units || []).map(u => `${u.count}× ${runtime.UNITS[u.key]?.name || u.key}`).join(', ');
  }
  function company(c, level, dir) {
    const counts = {},
      size = sizeFor(c, level),
      pool = weights(level, dir);
    for (let i = 0; i < size; i++) {
      const key = weightedPick(pool);
      counts[key] = (counts[key] || 0) + 1;
    }
    const units = runtime.UNIT_ORDER.filter(k => counts[k]).map(k => ({
      key: k,
      count: counts[k]
    }));
    const price = runtime.C();
    for (const u of units) {
      const base = runtime.unitCost(c, u.key);
      for (const r of runtime.RES) price[r] += (base[r] || 0) * u.count;
    }
    for (const r of runtime.RES) price[r] = Math.max(0, Math.ceil((price[r] || 0) * 1.5 * costMult(c)));
    return {
      level,
      dir,
      size,
      units,
      price
    };
  }
  function initTent(c, b, legacy = false) {
    if (!b || b.type !== MERC) return null;
    if (!Number.isFinite(Number(b.mercLevel)) || Number(b.mercLevel) < 1) b.mercLevel = legacy && Number.isFinite(Number(c.mercLevel)) ? Math.max(1, Math.floor(Number(c.mercLevel))) : 1;
    if (!Number.isFinite(Number(b.mercCooldown)) || Number(b.mercCooldown) < 0) b.mercCooldown = legacy && Number.isFinite(Number(c.mercCooldown)) && Number(c.mercCooldown) < 1e8 ? Math.max(0, Number(c.mercCooldown)) : 0;
    if (!DIRS.includes(b.mercAuto)) b.mercAuto = legacy && DIRS.includes(c.mercAuto) ? c.mercAuto : null;
    if (!Array.isArray(b.mercOffers) || b.mercOffers.length !== 3) {
      if (legacy && Array.isArray(c.mercOffers) && c.mercOffers.length === 3) b.mercOffers = runtime.mpPack(c.mercOffers);else b.mercOffers = DIRS.map(dir => company(c, b.mercLevel, dir));
    }
    return b;
  }
  function ensureAll(c) {
    const list = tents(c);
    list.forEach((b, i) => initTent(c, b, i === 0));
    return list;
  }
  function resolveTent(c, ref = null) {
    const list = ensureAll(c);
    if (ref && typeof ref === 'object' && ref.type === MERC) return initTent(c, ref);
    if (ref != null) {
      const id = String(ref),
        found = list.find(b => String(b.id) === id);
      if (found) return found;
    }
    if (c === runtime.P) {
      const open = [...(runtime.state.openBuildingInspectors || [])].reverse().map(id => runtime.getBuilding(runtime.P, id)).find(b => b?.type === MERC);
      if (open) return initTent(c, open);
      const selected = runtime.getBuilding(runtime.P, runtime.state.selectedBuilding);
      if (selected?.type === MERC) return initTent(c, selected);
    }
    return list[0] || null;
  }
  function offerIndex(dir) {
    return dir === 'up' ? 0 : dir === 'down' ? 2 : 1;
  }
  function currentOffer(c, b, dir) {
    initTent(c, b);
    return b?.mercOffers?.[offerIndex(dir)] || null;
  }
  function reroll(c, b) {
    b.mercOffers = DIRS.map(dir => company(c, b.mercLevel, dir));
    return b.mercOffers;
  }
  function affordable(c, offer) {
    return !!offer && runtime.canPay(c, offer.price) && runtime.totalProductionRoom(c) >= offer.size;
  }
  function tentNumber(c, b) {
    const list = tents(c);
    const i = list.findIndex(x => x.id === b?.id);
    return i >= 0 ? i + 1 : 1;
  }
  function controlsHTML(c, bRef = null) {
    const b = resolveTent(c, bRef);
    if (!b) return '<div class="mercBox"><div class="mercFoot">Nincs Zsoldos sátor.</div></div>';
    initTent(c, b);
    const cd = Math.max(0, Number(b.mercCooldown) || 0),
      n = tentNumber(c, b),
      count = tents(c).length;
    return `<div class="mercBox" data-merc-box="${b.id}" data-merc-building="${b.id}"><div class="mercHeader"><div><div class="boxlabel">ZSOLDOS SZERZŐDÉSEK · SÁTOR ${n}/${count}</div><b>Aktuális zsoldosszint: ${b.mercLevel}</b></div><div>Cooldown: <b data-merc-cd="${b.id}">${cd > 0 ? cd.toFixed(1) + ' mp' : 'Kész'}</b></div></div><div class="mercRows">${DIRS.map(dir => {
      const offer = currentOffer(c, b, dir),
        next = nextLevel(b, dir),
        auto = b.mercAuto === dir,
        ready = affordable(c, offer) && cd <= 0;
      return `<div class="mercRow"><div class="mercDir" style="color:${COLOR[dir]};border-color:${COLOR[dir]}66">${ICON[dir]}</div><div class="mercMid"><div class="mercTitle"><b>${LABEL[dir]}</b><span>Következő zsoldosszint: ${next}</span><span>${offer.size} egység</span></div><div class="mercComp">${unitsText(offer.units)}</div><div class="mercPrice">Ár: ${runtime.costText(offer.price)}</div></div><div class="mercBtns"><button type="button" data-merc-hire="${dir}" data-merc-building="${b.id}" ${ready ? '' : 'disabled'}>BÉRLÉS</button><button type="button" data-merc-auto="${dir}" data-merc-building="${b.id}" class="${auto ? 'active' : ''}">AUTO ${auto ? 'BE' : 'KI'}</button></div></div>`;
    }).join('')}</div><div class="mercFoot">Minden Zsoldos sátor saját szinttel, ajánlatokkal, cooldownnal és automatával fut.${runtime.hasLeg(c, MERC_NETWORK) ? ' · 🏕️ Zsoldoshálózat aktív.' : ''}</div></div>`;
  }
  function hire(c, dir, byAuto = false, bRef = null) {
    if (!DIRS.includes(dir)) return false;
    const b = resolveTent(c, bRef);
    if (!b) return false;
    if ((Number(b.mercCooldown) || 0) > 0) return false;
    const offer = currentOffer(c, b, dir) || company(c, b.mercLevel, dir);
    if (runtime.totalProductionRoom(c) < offer.size) {
      if (c === runtime.P && !byAuto) runtime.toast('Nincs elég hely a helyőrségben / a pályán a teljes zsoldoscsapathoz.');
      return false;
    }
    if (!runtime.pay(c, offer.price)) {
      if (c === runtime.P && !byAuto) runtime.toast(`Nincs elég nyersanyag a zsoldoscsapathoz. (${runtime.costText(offer.price)})`);
      return false;
    }
    if (byAuto) runtime.recordResourceSpend38(c, offer.price);
    const power = powerMult(c);
    for (const u of offer.units) for (let i = 0; i < u.count; i++) runtime.queueProduced(c, runtime.makeEntry(c, u.key, {
      mercenary: true,
      mercPowerMult: power,
      originBuildingId: b.id
    }), b);
    b.mercLevel = nextLevel(b, dir);
    b.mercCooldown = cooldownFor(c, b.mercLevel);
    reroll(c, b);
    if (c === runtime.P && !byAuto) {
      runtime.toast(`Zsoldos sátor ${tentNumber(c, b)}: ${unitsText(offer.units)} · következő szint: ${b.mercLevel}`);
      runtime.updateHud();
      runtime.renderStatic();
      if (runtime.MP?.enabled && runtime.MP.role === 'guest' && typeof runtime.mpSendStrategy === 'function') queueMicrotask(() => runtime.mpSendStrategy(true));
    }
    return true;
  }
  function toggleAuto(c, bRef, dir) {
    const b = resolveTent(c, bRef);
    if (!b || !DIRS.includes(dir)) return false;
    b.mercAuto = b.mercAuto === dir ? null : dir;
    if (c === runtime.P) {
      runtime.toast(`Zsoldos sátor ${tentNumber(c, b)} automata: ${b.mercAuto ? LABEL[b.mercAuto] : 'KI'}.`);
      runtime.renderStatic();
      runtime.updateHud();
      if (runtime.MP?.enabled && runtime.MP.role === 'guest' && typeof runtime.mpSendStrategy === 'function') queueMicrotask(() => runtime.mpSendStrategy(true));
    }
    return true;
  }
  runtime.mercenaryDemandRates = function (c) {
    const out = runtime.C();
    for (const b of tents(c)) {
      if (!b.mercAuto) continue;
      const offer = b.mercOffers?.[offerIndex(b.mercAuto)];
      if (!offer) continue;
      const cycle = Math.max(1, cooldownFor(c, nextLevel(b, b.mercAuto)));
      for (const r of runtime.RES) out[r] += (offer.price[r] || 0) / cycle;
    }
    return out;
  };
  function aiDir(c, b) {
    const total = runtime.RES.reduce((sum, r) => sum + (Number(c.resources?.[r]) || 0), 0);
    if (total > 900 && affordable(c, currentOffer(c, b, 'up'))) return 'up';
    if (total > 550 && affordable(c, currentOffer(c, b, 'stay'))) return 'stay';
    if (total > 320 && affordable(c, currentOffer(c, b, 'down'))) return 'down';
    return null;
  }
  function silenceLegacy(c) {
    c.mercAuto = null;
    c.mercCooldown = 1e9;
    c.mercOffers = [];
  }
  for (const c of [runtime.P, runtime.E]) {
    ensureAll(c);
    silenceLegacy(c);
  }
  const oldPlaceV4994 = runtime.placeBuilding;
  runtime.placeBuilding = function (c, type, row, col, rotation = 0) {
    const res = oldPlaceV4994(c, type, row, col, rotation);
    if (res?.ok && type === MERC) initTent(c, res.building);
    return res;
  };
  const oldTickV4994 = runtime.tick;
  runtime.tick = function (dt) {
    silenceLegacy(runtime.P);
    silenceLegacy(runtime.E);
    const out = oldTickV4994(dt);
    const active = runtime.state.running && !runtime.state.ended && !runtime.state.modal;
    if (!active) return out;
    const playerTents = ensureAll(runtime.P),
      enemyTents = ensureAll(runtime.E);
    for (const b of [...playerTents, ...enemyTents]) if ((Number(b.mercCooldown) || 0) > 0) b.mercCooldown = Math.max(0, b.mercCooldown - dt);
    if (runtime.MP?.enabled && runtime.MP.role === 'guest') {
      updateMercCdDom();
      return out;
    }
    let playerChanged = false,
      remoteChanged = false;
    for (const b of playerTents) if (b.mercAuto && hire(runtime.P, b.mercAuto, true, b.id)) playerChanged = true;
    if (runtime.MP?.enabled && runtime.MP.role === 'host') {
      for (const b of enemyTents) if (b.mercAuto && hire(runtime.E, b.mercAuto, true, b.id)) remoteChanged = true;
    } else if (!runtime.MP?.enabled) {
      for (const b of enemyTents) {
        if ((Number(b.mercCooldown) || 0) > 0) continue;
        const dir = aiDir(runtime.E, b);
        if (dir && hire(runtime.E, dir, true, b.id)) remoteChanged = true;
      }
    }
    if (playerChanged) {
      runtime.renderStatic();
      runtime.updateHud();
    }
    if (remoteChanged && runtime.MP?.enabled && runtime.MP.role === 'host') queueMicrotask(() => runtime.mpSendSnapshot(true));
    updateMercCdDom();
    return out;
  };
  function updateMercCdDom() {
    document.querySelectorAll('[data-merc-cd]').forEach(el => {
      const b = runtime.getBuilding(runtime.P, el.dataset.mercCd);
      if (!b || b.type !== MERC) return;
      const cd = Math.max(0, Number(b.mercCooldown) || 0);
      el.textContent = cd > 0 ? `${cd.toFixed(1)} mp` : 'Kész';
    });
  }
  const oldUpdateHudV4994 = runtime.updateHud;
  runtime.updateHud = function () {
    const out = oldUpdateHudV4994();
    updateMercCdDom();
    return out;
  };
  if (window.__ROADLORDS_V4956__) {
    window.__ROADLORDS_V4956__.hireMercs = hire;
    window.__ROADLORDS_V4956__.mercControlsHTML = controlsHTML;
    window.__ROADLORDS_V4956__.toggleMercAuto = toggleAuto;
    window.__ROADLORDS_V4956__.MERC_LABEL = LABEL;
  }
  document.addEventListener('click', e => {
    const hireBtn = e.target?.closest?.('[data-merc-hire]'),
      autoBtn = e.target?.closest?.('[data-merc-auto]');
    if (!hireBtn && !autoBtn) return;
    if (runtime.MP?.enabled && runtime.MP.role === 'guest' && hireBtn) return;
    const btn = hireBtn || autoBtn,
      buildingId = btn.dataset.mercBuilding || btn.closest?.('.buildingInspectorWindow')?.dataset.id || null;
    e.preventDefault();
    e.stopImmediatePropagation();
    if (hireBtn) hire(runtime.P, hireBtn.dataset.mercHire, false, buildingId);else toggleAuto(runtime.P, buildingId, autoBtn.dataset.mercAuto);
  }, true);
  const oldRowsV4994 = runtime.buildingEffectRows;
  runtime.buildingEffectRows = function (c, b) {
    const rows = oldRowsV4994(c, b) || [];
    if (b?.type === MERC) {
      initTent(c, b);
      rows.unshift(['Saját zsoldosszint', String(b.mercLevel)], ['Saját cooldown', (b.mercCooldown || 0) > 0 ? `${b.mercCooldown.toFixed(1)} mp` : 'Kész']);
      if (runtime.hasLeg(c, MERC_NETWORK)) rows.unshift(['Zsoldoshálózat', `${tents(c).length} önálló sátor`]);
    }
    return rows;
  };
  if (typeof runtime.mpStrategy === 'function') {
    const oldMpStrategyV4994 = runtime.mpStrategy;
    runtime.mpStrategy = function (c) {
      const data = oldMpStrategyV4994(c);
      if (Array.isArray(data?.buildings)) for (const b of data.buildings) if (b?.type === MERC) for (const key of RUNTIME_KEYS) delete b[key];
      return data;
    };
  }
  if (typeof runtime.mpApplyGuestStrategy === 'function') {
    const oldApplyGuestV4994 = runtime.mpApplyGuestStrategy;
    runtime.mpApplyGuestStrategy = function (data, seq) {
      if (runtime.MP.role === 'host' && Array.isArray(data?.buildings)) {
        const oldById = new Map(tents(runtime.E).map(b => [String(b.id), b]));
        for (const incoming of data.buildings) {
          if (incoming?.type !== MERC) continue;
          const old = oldById.get(String(incoming.id));
          if (old) {
            incoming.mercLevel = old.mercLevel;
            incoming.mercCooldown = old.mercCooldown;
            incoming.mercOffers = runtime.mpPack(old.mercOffers || []);
          } else {
            incoming.mercLevel = 1;
            incoming.mercCooldown = 0;
            incoming.mercOffers = DIRS.map(dir => company(runtime.E, 1, dir));
          }
        }
      }
      return oldApplyGuestV4994(data, seq);
    };
  }
  if (typeof runtime.mpUiCitySignature === 'function') {
    const oldUiSigV4994 = runtime.mpUiCitySignature;
    runtime.mpUiCitySignature = function (c) {
      const base = oldUiSigV4994(c),
        merc = tents(c).map(b => [b.id, b.mercLevel, b.mercAuto, (b.mercOffers || []).map(o => [o.dir, o.level, o.size, (o.units || []).map(u => [u.key, u.count]), runtime.RES.map(r => o.price?.[r] || 0)])]);
      return base + '§merc:' + JSON.stringify(merc);
    };
  }
  if (typeof runtime.mpHandle === 'function') {
    const oldMpHandleV4994 = runtime.mpHandle;
    runtime.mpHandle = function (data) {
      if (data?.type === 'merc_hire_request_v4971' && runtime.MP.role === 'host') {
        const dir = data.dir,
          ok = DIRS.includes(dir) && hire(runtime.E, dir, false, data.buildingId || null);
        runtime.mpSend({
          type: 'merc_hire_result_v4971',
          ok,
          dir,
          buildingId: data.buildingId || null
        });
        queueMicrotask(() => runtime.mpSendSnapshot(true));
        return;
      }
      return oldMpHandleV4994(data);
    };
  }
  if (typeof runtime.scoreAiChoice === 'function') {
    const oldScoreV4994 = runtime.scoreAiChoice;
    runtime.scoreAiChoice = function (o) {
      let s = oldScoreV4994(o);
      if (o?.kind === 'legendary' && o.id === MERC_NETWORK) s += 6 + Math.min(5, tents(runtime.E).length * 1.5);
      return s;
    };
  }
  const style = document.createElement('style');
  style.textContent = "@import url(\"" + (assetUrl("styles/features/city-mercenary-network-36.css") + "\");");
  document.head.appendChild(style);
  function compactEnd() {
    const modal = document.querySelector('#endOverlay .end');
    if (!modal) return;
    modal.classList.add('v4994CompactEnd');
    for (const panel of modal.querySelectorAll('.endPlayerPanel')) {
      const body = panel.querySelector('.endPlayerBody'),
        grid = body?.querySelector(':scope > .endCompareGrid');
      if (!body || !grid || body.querySelector(':scope > .endMoreV4994')) continue;
      const stats = [...grid.children],
        keep = new Set([0, 1, 2, 3, 6, 8, 12, 13]);
      const moreStats = document.createElement('div');
      moreStats.className = 'endMoreStatsV4994';
      stats.forEach((el, i) => {
        if (!keep.has(i)) moreStats.appendChild(el);
      });
      const details = document.createElement('details');
      details.className = 'endMoreV4994';
      const summary = document.createElement('summary');
      summary.textContent = 'RÉSZLETES STATISZTIKA · EGYSÉGEK · ÉPÜLETEK · FEJLESZTÉSEK';
      details.appendChild(summary);
      const inner = document.createElement('div');
      inner.className = 'endMoreInnerV4994';
      inner.appendChild(moreStats);
      const sections = document.createElement('div');
      sections.className = 'endDetailsSectionsV4994';
      [...body.querySelectorAll(':scope > .endSection')].forEach(sec => sections.appendChild(sec));
      inner.appendChild(sections);
      details.appendChild(inner);
      body.appendChild(details);
    }
  }
  const oldFinishV4994 = runtime.finish;
  runtime.finish = function (win) {
    const out = oldFinishV4994(win);
    compactEnd();
    return out;
  };
  if (typeof runtime.mpShowEnd === 'function') {
    const oldMpShowEndV4994 = runtime.mpShowEnd;
    runtime.mpShowEnd = function () {
      const out = oldMpShowEndV4994();
      compactEnd();
      return out;
    };
  }
  const oldStatsRenderer = window.__ROADLORDS_MATCH_STATS__?.renderMatchSummary;
  if (window.__ROADLORDS_MATCH_STATS__ && typeof oldStatsRenderer === 'function') window.__ROADLORDS_MATCH_STATS__.renderMatchSummary = function (...args) {
    const out = oldStatsRenderer(...args);
    compactEnd();
    return out;
  };
  window.__ROADLORDS_V4994__ = {
    MERC_NETWORK,
    hireMercs: hire,
    toggleMercAuto: toggleAuto,
    controlsHTML,
    compactEnd,
    ensureAllMercTents: ensureAll,
    placeBuilding: (...a) => runtime.placeBuilding(...a),
    isUniqueBuilding: (...a) => runtime.isUniqueBuilding(...a),
    renderStatic: () => runtime.renderStatic(),
    forceEnd: win => {
      runtime.state.ended = false;
      return runtime.finish(!!win);
    },
    mpState: () => ({
      enabled: runtime.MP.enabled,
      role: runtime.MP.role,
      started: runtime.MP.started
    })
  };
  const menuVer = document.querySelector('.menuVersion');
  if (menuVer) menuVer.textContent = 'V4.9.94 · P2P';
  document.title = 'Roadlords V4.9.94 – Zsoldoshálózat + kompakt meccsvége';
  window.__ROADLORDS_VERSION__ = '4.9.94-mercenary-network-compact-end';
}
