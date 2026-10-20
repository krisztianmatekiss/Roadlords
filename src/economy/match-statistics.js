import { assetUrl } from '../assets/urls.js';
export function initializeEconomyMatchStatistics(runtime) {
  const PRODUCER_LEVELS = [1, 2, 3, 6];
  const makeStats = () => ({
    builtTotal: 0,
    builtByType: {},
    demolishedTotal: 0,
    demolishedByType: {},
    unitProducedTotal: 0,
    unitProducedByType: {},
    unitDeathsTotal: 0,
    unitDeathsByType: {},
    unitKillsTotal: 0,
    unitKillsByType: {},
    towerKills: 0,
    buildingUnlocks: 0,
    buildingUpgrades: 0,
    commonPicks: 0,
    legendaryPicks: 0,
    resourcesProduced: runtime.C(),
    resourcesSpent: runtime.C(),
    maxField: 0,
    maxGarrison: 0
  });
  const statsOf = c => c._matchStats || (c._matchStats = makeStats());
  statsOf(runtime.P);
  statsOf(runtime.E);
  runtime.P.resources = runtime.C(90, 20, 10);
  runtime.E.resources = runtime.C(90, 20, 10);
  const style = document.createElement('style');
  style.textContent = "@import url(\"" + (assetUrl("styles/features/economy-match-statistics-13.css") + "\");");
  document.head.appendChild(style);
  function addCount(obj, key, n = 1) {
    obj[key] = (obj[key] || 0) + n;
  }
  function decorateBuildCounts() {
    runtime.$$('#buildList .buildcard').forEach(card => {
      const type = card.dataset.k;
      if (!type) return;
      card.querySelector('.buildCountBadge')?.remove();
      const badgeHost = card.closest('.buildSlot')?.querySelector('.buildSlotBadges') || card;
      badgeHost.querySelector('.buildCountBadge')?.remove();
      const n = runtime.buildingOf(runtime.P, type).length,
        b = document.createElement('span');
      b.className = 'buildCountBadge' + (n ? '' : ' zero');
      b.textContent = `×${n}`;
      b.title = `Jelenleg felépítve: ${n}`;
      badgeHost.appendChild(b);
    });
  }
  const v4924RenderBuildList = runtime.renderBuildList;
  runtime.renderBuildList = function () {
    const out = v4924RenderBuildList();
    decorateBuildCounts();
    return out;
  };
  const v4924BuildingEffectRows = runtime.buildingEffectRows;
  runtime.buildingEffectRows = function (c, b) {
    if (['lumber', 'stonecutter', 'farm'].includes(b.type)) {
      const base = runtime.v4LevelValue(b.level, PRODUCER_LEVELS),
        bonus = b.type === 'lumber' ? runtime.adjacentTerrain(c, b, 'forest') : b.type === 'stonecutter' ? runtime.adjacentTerrain(c, b, 'quarry') : runtime.buildingOnTerrain(c, b, 'fertile'),
        gm = runtime.guildMultiplier(c, b),
        name = b.type === 'lumber' ? 'Fa' : b.type === 'stonecutter' ? 'Kő' : 'Élelem';
      const rows = [];
      if (b.level >= 4 && runtime.branchLabel(c, b.type)) rows.push(['L4 specializáció', runtime.branchLabel(c, b.type)]);
      rows.push(['Alaptermelés', `${base} ${name} /mp`], ['Terepbónusz', bonus ? 'AKTÍV · ×2' : 'Nincs'], ['Tényleges termelés', `${(base * (bonus ? 2 : 1) * gm).toFixed(2).replace(/\.00$/, '')} ${name} /mp`]);
      return rows;
    }
    return v4924BuildingEffectRows(c, b);
  };
  const v4924PlaceBuilding = runtime.placeBuilding;
  runtime.placeBuilding = function (c, type, row, col, rotation = 0) {
    const res = v4924PlaceBuilding(c, type, row, col, rotation);
    if (res?.ok) {
      const st = statsOf(c);
      st.builtTotal++;
      addCount(st.builtByType, type);
    }
    return res;
  };
  const v4924Demolish = runtime.demolish;
  runtime.demolish = function (c, id) {
    const b = runtime.getBuilding(c, id),
      type = b?.type;
    const ok = v4924Demolish(c, id);
    if (ok && type) {
      const st = statsOf(c);
      st.demolishedTotal++;
      addCount(st.demolishedByType, type);
    }
    return ok;
  };
  const v4924QueueProduced = runtime.queueProduced;
  runtime.queueProduced = function (c, entry, b = null) {
    const ok = v4924QueueProduced(c, entry, b);
    if (ok && entry && !entry.hospitalSaved) {
      const st = statsOf(c);
      st.unitProducedTotal++;
      addCount(st.unitProducedByType, entry.key);
    }
    return ok;
  };
  const v4924KillUnit = runtime.killUnit;
  runtime.killUnit = function (target, combatDeath = true) {
    if (!target?.alive) return;
    const side = target.side,
      key = target.key;
    v4924KillUnit(target, combatDeath);
    if (combatDeath && !target.alive) {
      const victim = side === 'player' ? runtime.P : runtime.E,
        attacker = side === 'player' ? runtime.E : runtime.P,
        vs = statsOf(victim),
        as = statsOf(attacker);
      vs.unitDeathsTotal++;
      addCount(vs.unitDeathsByType, key);
      as.unitKillsTotal++;
      addCount(as.unitKillsByType, key);
    }
  };
  const v4924ApplyChoice = runtime.applyChoice;
  runtime.applyChoice = function (c, o, countEvent = true) {
    const out = v4924ApplyChoice(c, o, countEvent),
      st = statsOf(c);
    if (o?.kind === 'building') st.buildingUnlocks++;else if (o?.kind === 'building_upgrade' || o?.kind === 'building_branch') st.buildingUpgrades++;else if (o?.kind === 'normal') st.commonPicks++;else if (o?.kind === 'legendary') st.legendaryPicks++;
    return out;
  };
  const v4924RewardTowerKill = runtime.rewardTowerKill;
  runtime.rewardTowerKill = function (attackerSide, tier) {
    const c = runtime.cityForSide(attackerSide),
      had = c.towerReward?.has(tier);
    const out = v4924RewardTowerKill(attackerSide, tier);
    if (!had && c.towerReward?.has(tier)) statsOf(c).towerKills++;
    return out;
  };
  const v4924ProduceResources = runtime.produceResources;
  runtime.produceResources = function (c, dt) {
    const rates = runtime.productionRates(c),
      st = statsOf(c);
    for (const r of runtime.RES) st.resourcesProduced[r] += (rates[r] || 0) * dt;
    return v4924ProduceResources(c, dt);
  };
  const v4924Pay = runtime.pay;
  runtime.pay = function (c, price) {
    const ok = v4924Pay(c, price);
    if (ok) {
      const st = statsOf(c);
      for (const r of runtime.RES) st.resourcesSpent[r] += price[r] || 0;
    }
    return ok;
  };
  const v4924UpdateHud = runtime.updateHud;
  runtime.updateHud = function () {
    const out = v4924UpdateHud();
    for (const c of [runtime.P, runtime.E]) {
      const st = statsOf(c);
      st.maxField = Math.max(st.maxField, runtime.fieldUnitCount(c));
      st.maxGarrison = Math.max(st.maxGarrison, runtime.reserveCount(c));
    }
    return out;
  };
  function topEntry(obj, names) {
    let key = null,
      val = 0;
    for (const [k, v] of Object.entries(obj || {})) if (v > val) {
      key = k;
      val = v;
    }
    return key ? {
      key,
      val,
      name: names[key] || key
    } : null;
  }
  function resTotal(x) {
    return Math.round(runtime.RES.reduce((sum, r) => sum + (x?.[r] || 0), 0));
  }
  function miniRows(obj, names, icons = {}) {
    const rows = Object.entries(obj || {}).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]);
    return rows.length ? rows.map(([k, v]) => `<span class="endMini">${icons[k] || ''} ${names[k] || k} <b>×${v}</b></span>`).join('') : '<span class="endMini">—</span>';
  }
  function renderMatchSummary(win) {
    const st = statsOf(runtime.P),
      topUnit = topEntry(st.unitProducedByType, Object.fromEntries(Object.entries(runtime.UNITS).map(([k, v]) => [k, v.name]))),
      topBuilding = topEntry(st.builtByType, Object.fromEntries(Object.entries(runtime.BUILDINGS).map(([k, v]) => [k, v.name]))),
      taken = st.commonPicks + st.legendaryPicks + st.buildingUpgrades;
    runtime.$('#endIcon').textContent = win ? '♛' : '☠';
    runtime.$('#endTitle').textContent = win ? 'Győzelem!' : 'A főváros elesett';
    runtime.$('#endText').textContent = `${runtime.fmt(runtime.state.time)} · ${runtime.P.pickCount} választás · ${st.unitProducedTotal} legyártott egység`;
    let box = runtime.$('#endStats');
    if (!box) {
      box = document.createElement('div');
      box.id = 'endStats';
      box.className = 'endStats';
      runtime.$('#restartBtn').before(box);
    }
    box.innerHTML = `
      <div class="endHero">
        <div class="endHeroCard"><small>MECCSIDŐ</small><b>${runtime.fmt(runtime.state.time)}</b></div>
        <div class="endHeroCard"><small>LEGYÁRTOTT EGYSÉG</small><b>${st.unitProducedTotal}</b></div>
        <div class="endHeroCard"><small>MEGÖLT EGYSÉG</small><b>${st.unitKillsTotal}</b></div>
        <div class="endHeroCard"><small>ÉPÍTETT ÉPÜLET</small><b>${st.builtTotal}</b></div>
      </div>
      <div class="endStatGrid">
        <div class="endStat"><span>ELVESZTETT EGYSÉG</span><b>${st.unitDeathsTotal}</b></div>
        <div class="endStat"><span>LEBONTOTT ÉPÜLET</span><b>${st.demolishedTotal}</b></div>
        <div class="endStat"><span>LEDÖNTÖTT ÚTTORONY</span><b>${st.towerKills}</b></div>
        <div class="endStat"><span>MAX. PÁLYÁN LÉVŐ SEREG</span><b>${st.maxField}</b></div>
        <div class="endStat"><span>FELOLDOTT ÉPÜLETEK</span><b>${st.buildingUnlocks}</b></div>
        <div class="endStat"><span>ÉPÜLETFEJLESZTÉS</span><b>${st.buildingUpgrades}</b></div>
        <div class="endStat"><span>COMMON / LEGENDARY</span><b>${st.commonPicks} / ${st.legendaryPicks}</b></div>
        <div class="endStat"><span>ELHOZOTT FEJLESZTÉS</span><b>${taken}</b></div>
        <div class="endStat"><span>MEGTERMELT NYERSANYAG</span><b>${resTotal(st.resourcesProduced)}</b></div>
        <div class="endStat"><span>ELKÖLTÖTT NYERSANYAG</span><b>${resTotal(st.resourcesSpent)}</b></div>
        <div class="endStat"><span>MAX. HELYŐRSÉG</span><b>${st.maxGarrison}</b></div>
        <div class="endStat"><span>PICKEK</span><b>${runtime.P.pickCount}</b></div>
      </div>
      <div class="endDetailGrid">
        <div class="endDetail"><h3>${topUnit ? `⚔ Legtöbbet gyártott: ${topUnit.name} ×${topUnit.val}` : '⚔ Egységgyártás'}</h3><div class="endMiniRows">${miniRows(st.unitProducedByType, Object.fromEntries(Object.entries(runtime.UNITS).map(([k, v]) => [k, v.name])), Object.fromEntries(Object.entries(runtime.UNITS).map(([k, v]) => [k, v.icon])))}</div></div>
        <div class="endDetail"><h3>${topBuilding ? `🏗 Legtöbbet épített: ${topBuilding.name} ×${topBuilding.val}` : '🏗 Építkezés'}</h3><div class="endMiniRows">${miniRows(st.builtByType, Object.fromEntries(Object.entries(runtime.BUILDINGS).map(([k, v]) => [k, v.name])), Object.fromEntries(Object.entries(runtime.BUILDINGS).map(([k, v]) => [k, v.icon])))}</div></div>
      </div>`;
  }
  runtime.finish = function (win) {
    if (runtime.state.ended) return;
    runtime.state.ended = true;
    runtime.state.running = false;
    runtime.state.modal = true;
    renderMatchSummary(!!win);
    runtime.$('#endOverlay').classList.remove('hidden');
  };
  if (typeof runtime.mpShowEnd === 'function') runtime.mpShowEnd = function () {
    if (!runtime.state.ended) return;
    renderMatchSummary(runtime.P.hp > 0 && runtime.E.hp <= 0);
    runtime.$('#endOverlay').classList.remove('hidden');
  };
  window.__ROADLORDS_MATCH_STATS__ = {
    statsOf,
    renderMatchSummary
  };
}
