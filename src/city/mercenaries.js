import { assetUrl } from '../assets/urls.js';
export function initializeCityMercenaries(runtime) {
  const MERC = 'merc_tent';
  const MERC_DIRS = ['up', 'stay', 'down'];
  const MERC_LABEL = {
    up: 'Felfelé',
    stay: 'Tartás',
    down: 'Lefelé'
  };
  const MERC_ICON = {
    up: '⬆',
    stay: '—',
    down: '⬇'
  };
  const MERC_COLOR = {
    up: '#7ddc8b',
    stay: '#d8c98a',
    down: '#f08d86'
  };
  const MERC_NORMALS = [{
    id: 'merc_cost',
    icon: '💰',
    name: 'Olcsó szerződések',
    description: 'Zsoldoscsapatok ára −10%.',
    eligible: s => runtime.hasBuilding(s, MERC)
  }, {
    id: 'merc_cd',
    icon: '⏳',
    name: 'Gyors toborzás',
    description: 'Zsoldos sátor cooldown −10%.',
    eligible: s => runtime.hasBuilding(s, MERC)
  }, {
    id: 'merc_power',
    icon: '🎖️',
    name: 'Veterán zsoldosok',
    description: 'A Zsoldos sátorból vásárolt egységek +10% Max HP és +10% sebzés.',
    eligible: s => runtime.hasBuilding(s, MERC)
  }, {
    id: 'merc_size',
    icon: '🧑‍🤝‍🧑',
    name: 'Nagyobb társaság',
    description: 'Minden zsoldoscsapat +1 egységet kap.',
    eligible: s => runtime.hasBuilding(s, MERC)
  }];
  const mercImage = runtime.BUILDING_IMAGES.stable || runtime.BUILDING_IMAGES.tavern || runtime.BUILDING_IMAGES.house || runtime.BUILDING_IMAGES.archery || '';
  runtime.BUILDINGS[MERC] = {
    name: 'Zsoldos sátor',
    icon: '⛺',
    category: 'military',
    unique: true,
    shape: [[0, 0], [0, 1], [1, 0], [1, 1]],
    cost: runtime.C(80, 70, 30),
    description: 'Unique 2×2 épület. Három véletlenszerű zsoldoscsapat közül bérelhetsz. A felső sor után a következő kör csapatai erősebbek lesznek, a középső tartja az aktuális szintet, az alsó visszalép egyet. Automata módba is állítható.'
  };
  if (!runtime.UNLOCKABLE.includes(MERC)) runtime.UNLOCKABLE.push(MERC);
  runtime.BUILDING_IMAGES[MERC] = mercImage;
  runtime.CARD_IMAGES[MERC] = runtime.CARD_IMAGES.stable || runtime.CARD_IMAGES.tavern || mercImage;
  runtime.PICK_IMAGES[MERC] = runtime.CARD_IMAGES[MERC] || mercImage;
  for (const n of MERC_NORMALS) if (!runtime.NORMAL.some(x => x.id === n.id)) runtime.NORMAL.push(n);
  const style = document.createElement('style');
  style.textContent = "@import url(\"" + (assetUrl("styles/features/city-mercenaries-26.css") + "\");");
  document.head.appendChild(style);
  function initMercState(c) {
    c.mercLevel = Math.max(1, Math.floor(c.mercLevel || 1));
    c.mercCooldown = Math.max(0, Number(c.mercCooldown) || 0);
    c.mercAuto = MERC_DIRS.includes(c.mercAuto) ? c.mercAuto : null;
    if (!Array.isArray(c.mercOffers)) c.mercOffers = [];
    return c;
  }
  function mercBuilding(c) {
    return runtime.buildingOf(c, MERC)[0] || null;
  }
  function mercSize(c, level) {
    return Math.max(1, 10 + (Math.max(1, level) - 1) * 2 + runtime.countNormal(c, 'merc_size'));
  }
  function mercPowerMult(c) {
    return 1 + 0.10 * runtime.countNormal(c, 'merc_power');
  }
  function mercCostMult(c) {
    return Math.max(0.4, 1 - 0.10 * runtime.countNormal(c, 'merc_cost'));
  }
  function mercCooldownForLevel(c, level) {
    return Math.max(6, (20 + (Math.max(1, level) - 1) * 5) * Math.max(0.4, 1 - 0.10 * runtime.countNormal(c, 'merc_cd')));
  }
  function mercDirDelta(dir) {
    return dir === 'up' ? 1 : dir === 'down' ? -1 : 0;
  }
  function projectedMercLevel(c, dir) {
    return Math.max(1, (c.mercLevel || 1) + mercDirDelta(dir));
  }
  function weightedPick(list) {
    const total = list.reduce((s, x) => s + Math.max(0, x[1] || 0), 0);
    let roll = Math.random() * Math.max(.0001, total);
    for (const [key, w] of list) {
      roll -= Math.max(0, w || 0);
      if (roll <= 0) return key;
    }
    return list[0]?.[0] || 'swordsman';
  }
  function mercWeights(level, dir) {
    const elite = Math.max(0, level - 1),
      upper = dir === 'up',
      lower = dir === 'down';
    return [['swordsman', Math.max(1, 6 - elite + (lower ? 2 : 0))], ['spearman', Math.max(1, 5 - elite + (lower ? 1 : 0))], ['archer', Math.max(1, 5 - elite)], ['priest', level >= 2 ? Math.max(1, 1 + elite + (upper ? 1 : 0)) : 0], ['knight', level >= 2 ? Math.max(1, 1 + elite + (upper ? 2 : 0)) : 0], ['mage', level >= 3 ? Math.max(1, elite + (upper ? 2 : 0)) : 0], ['catapult', level >= 4 ? Math.max(1, elite - 1 + (upper ? 1 : 0)) : 0]].filter(x => x[1] > 0);
  }
  function mercUnitsText(units) {
    return units.map(u => `${u.count}× ${runtime.UNITS[u.key]?.name || u.key}`).join(', ');
  }
  function mercCompany(c, level, dir) {
    const counts = {},
      size = mercSize(c, level),
      weights = mercWeights(level, dir);
    for (let i = 0; i < size; i++) {
      const pickKey = weightedPick(weights);
      counts[pickKey] = (counts[pickKey] || 0) + 1;
    }
    const keys = Object.keys(counts);
    let current = keys.reduce((s, k) => s + counts[k], 0);
    while (current > size) {
      const k = keys.find(x => counts[x] > 1) || keys[0];
      counts[k]--;
      current--;
    }
    while (current < size) {
      const k = weightedPick(weights);
      counts[k] = (counts[k] || 0) + 1;
      current++;
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
    for (const r of runtime.RES) price[r] = Math.max(0, Math.ceil((price[r] || 0) * 1.5 * mercCostMult(c)));
    return {
      level,
      dir,
      size,
      units,
      price
    };
  }
  function ensureMercOffers(c) {
    initMercState(c);
    if (!Array.isArray(c.mercOffers) || c.mercOffers.length !== 3) c.mercOffers = MERC_DIRS.map(dir => mercCompany(c, c.mercLevel, dir));
    return c.mercOffers;
  }
  function rollMercOffers(c) {
    initMercState(c);
    c.mercOffers = MERC_DIRS.map(dir => mercCompany(c, c.mercLevel, dir));
    return c.mercOffers;
  }
  function mercOfferIndex(dir) {
    return dir === 'up' ? 0 : dir === 'down' ? 2 : 1;
  }
  function currentMercOffer(c, dir) {
    ensureMercOffers(c);
    return c.mercOffers?.[mercOfferIndex(dir)] || null;
  }
  function mercOfferAffordable(c, offer) {
    return !!offer && runtime.canPay(c, offer.price) && runtime.totalProductionRoom(c) >= offer.size;
  }
  function hireMercs(c, dir, byAuto = false) {
    const b = mercBuilding(c);
    if (!b) return false;
    initMercState(c);
    if ((c.mercCooldown || 0) > 0) return false;
    const offer = currentMercOffer(c, dir) || mercCompany(c, c.mercLevel, dir);
    if (runtime.totalProductionRoom(c) < offer.size) {
      if (c === runtime.P && !byAuto) runtime.toast('Nincs elég hely a helyőrségben / a pályán a teljes zsoldoscsapathoz.');
      return false;
    }
    if (!runtime.pay(c, offer.price)) {
      if (c === runtime.P && !byAuto) runtime.toast(`Nincs elég nyersanyag a zsoldoscsapathoz. (${runtime.costText(offer.price)})`);
      return false;
    }
    const power = mercPowerMult(c);
    for (const u of offer.units) {
      for (let i = 0; i < u.count; i++) runtime.queueProduced(c, runtime.makeEntry(c, u.key, {
        mercenary: true,
        mercPowerMult: power
      }), b);
    }
    c.mercLevel = projectedMercLevel(c, dir);
    c.mercCooldown = mercCooldownForLevel(c, c.mercLevel);
    rollMercOffers(c);
    if (c === runtime.P) {
      const msg = `Zsoldosok bérelve: ${mercUnitsText(offer.units)} · következő zsoldosszint: ${c.mercLevel}`;
      runtime.toast(msg);
      runtime.updateHud();
      runtime.renderInspector();
      runtime.renderStatic();
      if (typeof syncLocalStrategyV4953 === 'function') syncLocalStrategyV4953();
    }
    return true;
  }
  function mercAutoProjectedUse(c) {
    const out = runtime.C();
    initMercState(c);
    if (!mercBuilding(c) || !c.mercAuto) return out;
    const offer = currentMercOffer(c, c.mercAuto);
    if (!offer) return out;
    const cycle = Math.max(1, mercCooldownForLevel(c, projectedMercLevel(c, c.mercAuto)));
    for (const r of runtime.RES) out[r] = (offer.price[r] || 0) / cycle;
    return out;
  }
  function mercControlsHTML(c) {
    initMercState(c);
    const cd = c.mercCooldown || 0;
    return `<div class="mercBox"><div class="mercHeader"><div><div class="boxlabel">ZSOLDOS SZERZŐDÉSEK</div><b>Aktuális zsoldosszint: ${c.mercLevel}</b></div><div>Cooldown: <b id="mercCooldownValue">${cd > 0 ? cd.toFixed(1) + ' mp' : 'Kész'}</b></div></div><div class="mercRows">${MERC_DIRS.map(dir => {
      const offer = currentMercOffer(c, dir),
        next = projectedMercLevel(c, dir),
        auto = c.mercAuto === dir,
        ready = mercOfferAffordable(c, offer) && cd <= 0;
      return `<div class="mercRow"><div class="mercDir" style="color:${MERC_COLOR[dir]};border-color:${MERC_COLOR[dir]}66">${MERC_ICON[dir]}</div><div class="mercMid"><div class="mercTitle"><b>${MERC_LABEL[dir]}</b><span>Következő zsoldosszint: ${next}</span><span>${offer.size} egység</span></div><div class="mercComp">${mercUnitsText(offer.units)}</div><div class="mercPrice">Ár: ${runtime.costText(offer.price)}</div></div><div class="mercBtns"><button type="button" data-merc-hire="${dir}" ${ready ? '' : 'disabled'}>BÉRLÉS</button><button type="button" data-merc-auto="${dir}" class="${auto ? 'active' : ''}">AUTO ${auto ? 'BE' : 'KI'}</button></div></div>`;
    }).join('')}</div><div class="mercFoot">⬆ erősebb következő kör · — ugyanazon a szinten marad · ⬇ egy szintet visszalép. Az automata a választott sort próbálja minden cooldown után megvenni.</div></div>`;
  }
  for (const c of [runtime.P, runtime.E]) {
    initMercState(c);
    ensureMercOffers(c);
  }
  const oldStatsForV4956 = runtime.statsFor;
  runtime.statsFor = function (c, entry) {
    const s = oldStatsForV4956(c, entry);
    const m = Math.max(1, Number(entry?.mercPowerMult) || 1);
    if (entry?.mercenary && m !== 1) {
      s.hp *= m;
      s.dmg *= m;
      s.buildingDamage *= m;
    }
    return s;
  };
  const oldReleaseUnitV4956 = runtime.releaseUnit;
  runtime.releaseUnit = function (c, entry) {
    const u = oldReleaseUnitV4956(c, entry);
    if (!u) return u;
    u.mercenary = !!entry.mercenary;
    u.mercPowerMult = entry.mercPowerMult || 1;
    return u;
  };
  const oldRenderInspectorV4956 = runtime.renderInspector;
  runtime.renderInspector = function () {
    const out = oldRenderInspectorV4956();
    const b = runtime.getBuilding(runtime.P, runtime.state.selectedBuilding),
      card = runtime.$('#inspector .inspectorCard');
    if (!b || b.type !== MERC || !card) return out;
    const actions = card.querySelector('.iactions');
    const holder = document.createElement('div');
    holder.innerHTML = mercControlsHTML(runtime.P);
    actions?.parentNode?.insertBefore(holder.firstElementChild, actions);
    const note = card.querySelector('.upgradeNote');
    if (note) note.innerHTML = 'A <b>Zsoldos sátor</b> nem épületszintekkel fejlődik. A bérelt csapatok minőségét a fenti szerződések mozgatják fel vagy le.';
    card.querySelectorAll('[data-merc-hire]').forEach(btn => btn.onclick = () => hireMercs(runtime.P, btn.dataset.mercHire, false));
    card.querySelectorAll('[data-merc-auto]').forEach(btn => btn.onclick = () => {
      const dir = btn.dataset.mercAuto;
      runtime.P.mercAuto = runtime.P.mercAuto === dir ? null : dir;
      runtime.toast(`Zsoldos automata: ${runtime.P.mercAuto ? MERC_LABEL[runtime.P.mercAuto] : 'KI'}.`);
      if (typeof syncLocalStrategyV4953 === 'function') syncLocalStrategyV4953();
      runtime.renderInspector();
      runtime.updateHud();
    });
    return out;
  };
  const oldBuildingUpgradePoolV4956 = runtime.buildingUpgradePool;
  runtime.buildingUpgradePool = function (c) {
    return oldBuildingUpgradePoolV4956(c).filter(o => o.id !== MERC);
  };
  const oldTickV4956 = runtime.tick;
  runtime.tick = function (dt) {
    for (const c of [runtime.P, runtime.E]) if (c?.mercCooldown > 0) c.mercCooldown = Math.max(0, c.mercCooldown - dt);
    const out = oldTickV4956(dt);
    if (runtime.state.running && !runtime.state.ended && !runtime.state.modal) {
      if (runtime.P.mercAuto) hireMercs(runtime.P, runtime.P.mercAuto, true);
      if (!runtime.MP?.enabled && mercBuilding(runtime.E) && !(runtime.E.mercCooldown > 0)) {
        const total = (runtime.E.resources.wood || 0) + (runtime.E.resources.stone || 0) + (runtime.E.resources.food || 0);
        let dir = null;
        if (total > 900 && currentMercOffer(runtime.E, 'up') && mercOfferAffordable(runtime.E, currentMercOffer(runtime.E, 'up'))) dir = 'up';else if (total > 550 && currentMercOffer(runtime.E, 'stay') && mercOfferAffordable(runtime.E, currentMercOffer(runtime.E, 'stay'))) dir = 'stay';else if (total > 320 && currentMercOffer(runtime.E, 'down') && mercOfferAffordable(runtime.E, currentMercOffer(runtime.E, 'down'))) dir = 'down';
        if (dir) hireMercs(runtime.E, dir, true);
      }
      const cdEl = document.getElementById('mercCooldownValue');
      if (cdEl && runtime.getBuilding(runtime.P, runtime.state.selectedBuilding)?.type === MERC) cdEl.textContent = (runtime.P.mercCooldown || 0) > 0 ? `${runtime.P.mercCooldown.toFixed(1)} mp` : 'Kész';
    }
    return out;
  };
  const oldAiScoreV4956 = runtime.scoreAiChoice;
  if (typeof oldAiScoreV4956 === 'function') runtime.scoreAiChoice = function (o) {
    let s = oldAiScoreV4956(o);
    if (!o) return s;
    if (o.kind === 'building' && o.id === MERC) s += 4.5;
    if (o.kind === 'normal' && ['merc_cost', 'merc_cd', 'merc_power', 'merc_size'].includes(o.id)) s += 2.5;
    return s;
  };
  const brandSmall = document.querySelector('.brand small');
  if (brandSmall) brandSmall.textContent = 'V4.9.56 · P2P 1V1';
  if (runtime.MP?.lobby) {
    const ver = runtime.MP.lobby.querySelector('.menuVersion');
    if (ver) ver.textContent = 'V4.9.56 · P2P';
  }
  document.title = 'Roadlords V4.9.56 – Zsoldos sátor';
  window.__ROADLORDS_VERSION__ = '4.9.56-mercenary-tent';
  window.__ROADLORDS_V4956__ = {
    hireMercs,
    mercControlsHTML,
    MERC_LABEL
  };
}
