import { assetUrl } from '../assets/urls.js';
import { ORC_EXPANSION } from '../data/orc-expansion.js';
export function initializeFactionsOrcSupport(runtime) {
  const O = window.__ROADLORDS_ORCS__,
    isOrc = O.isOrc;
  const authoritative = () => !runtime.MP.enabled || runtime.MP.role === 'host';
  const data = c => c.orcSupport || (c.orcSupport = {
    altarProgress: 0,
    totemProgress: 0,
    totemRewards: 0,
    slaveKills: 0,
    lifestealUntil: 0
  });
  const active = (c, type) => isOrc(c) ? runtime.buildingOf(c, type).find(b => !b.inactive) : null;
  const thresholds = {
    orc_altar: [100, 90, 75, 50],
    orc_totem: [500, 450, 400, 200]
  };
  const threshold = b => runtime.v4LevelValue(b.level, thresholds[b.type]);
  const defs = {
    orc_altar: ['Áldozati oltár', '♜', runtime.C(90, 100), 'A szomszédos katonai termelők kész egységeit automatikusan feláldozza, telt sereg mellett is. L1–4: 100/90/75/50 áldozat után minden saját egység +25 százalékpont életlopást kap 12 mp-re. Troll: 4 pont. Aktív hatás közben is gyűjt; új aktiválás frissít, nem halmoz. Az áldozat a Totembe is beleszámít.'],
    orc_totem: ['Ősök Toteme', '♟', runtime.C(100, 120), 'Saját harci halál és oltári áldozat után gyűjt. Troll: 4 pont. L1–4: 500/450/400/200 pont után legfeljebb 4 még választható legendásból 1 jutalom; a számláló nullázódik. Üres legendáskészletnél megőrzi a jutalmat, amíg új lehetőség nyílik.'],
    orc_slave: ['Rabszolgatábor', '⚒', runtime.C(80, 80), 'Minden 20 megölt ellenség után +0,1/0,2/0,4 Fa és Kő/mp L1/2/3-on, korlátlanul. A szintlépés a korábbi ölésekre is hat. A saját áldozatok nem számítanak ölésnek. L4/A: a fa és kő mellé +0,2 Élelem/mp minden 20 ölés után (tesztérték). L4/B: a szomszédos Munkatáborok és Vadászházak +50% termelést kapnak.']
  };
  for (const [key, [name, icon, cost, description]] of Object.entries(defs)) {
    O.defs[key] = defs[key];
    runtime.BUILDINGS[key] = {
      name,
      icon,
      cost,
      description: description + ' Egyedi, 2×2. Építési ár: próbaérték. A számlálók bontás után megmaradnak; csak álló, aktív épület gyűjt és termel.',
      shape: [[0, 0], [0, 1], [1, 0], [1, 1]],
      unique: true,
      race: 'orc',
      category: 'support'
    };
    runtime.BUILDING_IMAGE_META[key] = {
      w: 2,
      h: 2
    };
  }
  runtime.V4_SIMPLE_L4.add('orc_altar');
  runtime.V4_SIMPLE_L4.add('orc_totem');
  runtime.V4_BRANCHES.orc_slave = [{
    id: 'forced_labor',
    name: 'Kényszermunka',
    icon: '⚒',
    description: 'Megmarad az L3 fa- és kőhozam. Minden 20 korábbi és új ölés után +0,2 Élelem/mp (tesztérték).'
  }, {
    id: 'overseers',
    name: 'Kíméletlen hajcsárok',
    icon: '♜',
    description: 'Megmarad az L3 fa- és kőhozam. A szomszédos Munkatáborok és Vadászházak +50% termelést kapnak.'
  }];
  const newLegends = [['orc_ancient_deposits', 'Ősi lelőhelyek', 'A Munkatábor erdő- és kőlelőhely-szomszédsági szorzója külön-külön ×2 helyett ×3.', null, '⛏'], ['orc_bers_blood', 'Vérszagra gyűlnek', 'A Dühöngők +100% sebzést okoznak Vérző ellenségeknek.', 'orc_bers', '⚔'], ['orc_gob_blood', 'Vérszomjas lövedékek', 'A Goblinok minden teljes találata 1 Vérzést okoz, és +25% sebzést okoz a már Vérző célpontoknak.', 'orc_gob', '◉'], ['orc_warg_instinct', 'Halálos ösztön', 'A Warglovas közelharci támadásai egység ellen is megkapják a Kritikus lándzsák kritikus esélyét és többszörös duplázását.', 'orc_warg', '🐺']];
  for (const [id, name, description, building, icon] of newLegends) {
    runtime.LEGENDARY.push({
      id,
      name,
      description,
      icon,
      race: 'orc',
      eligible: c => isOrc(c) && (!building || runtime.hasBuilding(c, building))
    });
    if (building) runtime.PICK_UNIT_IMAGES[id] = runtime.BUILDINGS[building].unit;
  }
  function recordDeath(c, points) {
    const b = active(c, 'orc_totem');
    if (!b) return;
    const d = data(c);
    d.totemProgress += points;
    if (d.totemProgress >= threshold(b)) {
      d.totemProgress = 0;
      d.totemRewards++;
    }
  }
  const oldKill = runtime.killUnit;
  runtime.killUnit = function (u, combatDeath = true) {
    const alive = u?.alive;
    const out = oldKill(u, combatDeath);
    if (authoritative() && alive && !u.alive && combatDeath) {
      const own = runtime.cityForSide(u.side),
        enemy = u.side === 'player' ? runtime.E : runtime.P;
      recordDeath(own, O.deathWeight(u));
      if (runtime.hasLeg(enemy, 'orc_enemy_ancestors')) recordDeath(enemy, 1);
      if (active(enemy, 'orc_slave')) data(enemy).slaveKills++;
    }
    return out;
  };
  const altarFor = (c, b) => b && active(c, 'orc_altar') && runtime.adjacentBuildings(c, b).find(x => x.type === 'orc_altar' && !x.inactive);
  const oldRoom = runtime.productionRoomFor;
  runtime.productionRoomFor = (c, b) => altarFor(c, b) ? Infinity : oldRoom(c, b);
  const oldQueue = runtime.queueProduced;
  runtime.queueProduced = function (c, e, b = null) {
    const altar = altarFor(c, b);
    if (!altar || e.hospitalSaved) return oldQueue(c, e, b);
    if (!authoritative()) return false;
    const d = data(c),
      weight = O.deathWeight(e);
    d.altarProgress += weight;
    recordDeath(c, weight);
    if (d.altarProgress >= threshold(altar)) {
      d.altarProgress = 0;
      d.lifestealUntil = runtime.state.time + 12;
    }
    const st = window.__ROADLORDS_MATCH_STATS__.statsOf(c);
    st.unitProducedTotal++;
    st.unitProducedByType[e.key] = (st.unitProducedByType[e.key] || 0) + 1;
    st.orcSacrificedTotal = (st.orcSacrificedTotal || 0) + 1;
    return true;
  };
  const oldRates = runtime.productionRates;
  runtime.productionRates = function (c) {
    const r = oldRates(c);
    const b = active(c, 'orc_slave');
    if (b) {
      const bonus = Math.floor(data(c).slaveKills / 20) * runtime.v4LevelValue(b.level, [.1, .2, .4]);
      for (const k of ['wood', 'stone']) r[k] += bonus * (1 + .2 * runtime.countNormal(c, 'orc_' + k));
      if (runtime.hasBranch(c, 'orc_slave', 'forced_labor')) r.food += Math.floor(data(c).slaveKills / 20) * .2 * (1 + .2 * runtime.countNormal(c, 'orc_food'));
    }
    return r;
  };
  let source = null;
  const leech = (u, damage) => {
    if (!u?.alive || u.orcDeathDefiance || damage <= 0) return;
    const c = runtime.cityForSide(u.side);
    if (!isOrc(c)) return;
    const rate = ORC_EXPANSION.lifesteal * runtime.countNormal(c, 'orc_lifesteal') + ((c.orcSupport?.lifestealUntil || 0) > runtime.state.time ? .25 : 0) + (runtime.hasBranch(c, 'orc_overseer', 'blood_horde') && active(c, 'orc_overseer') ? .08 : 0);
    if (O.lifeSteal) O.lifeSteal(u, damage * rate);else u.hp = Math.min(u.maxHp, u.hp + damage * rate);
  };
  const oldDamage = runtime.damageUnit;
  runtime.damageUnit = function (t, amount, type) {
    const u = source,
      c = u && runtime.cityForSide(u.side),
      hostile = u && u.side !== t.side;
    if (hostile && t.orcBleed > 0) {
      if (u.key === 'orc_berserker' && runtime.hasLeg(c, 'orc_bers_blood')) amount *= 2;
      if (u.key === 'orc_goblin' && runtime.hasLeg(c, 'orc_gob_blood')) amount *= 1.25;
    }
    source = null;
    let actual;
    try {
      actual = oldDamage(t, amount, type);
    } finally {
      source = u;
    }
    if (hostile) {
      leech(u, actual);
      if (t.alive && !t.orcLastEvaded && u.key === 'orc_goblin' && runtime.hasLeg(c, 'orc_gob_blood')) t.orcBleed = (t.orcBleed || 0) + 1;
    }
    return actual;
  };
  const oldAttack = runtime.attackUnit;
  runtime.attackUnit = function (u, t, opts = {}) {
    const previous = source;
    source = u;
    try {
      if (u?.key === 'orc_warg' && !u.orcSpearReady && runtime.hasLeg(runtime.cityForSide(u.side), 'orc_warg_instinct')) opts = {
        ...opts,
        mult: (opts.mult || 1) * O.critMult(runtime.cityForSide(u.side))
      };
      return oldAttack(u, t, opts);
    } finally {
      source = previous;
    }
  };
  const oldStructure = runtime.attackStructure;
  runtime.attackStructure = function (u, s) {
    const target = s.capital ? runtime.cityForSide(s.side) : s,
      before = target.hp;
    const out = oldStructure(u, s);
    leech(u, Math.max(0, before - target.hp));
    return out;
  };
  const oldRoll = runtime.rollPickTier;
  runtime.rollPickTier = (c, source) => source === 'orc_totem' ? {
    tier: 'legendary',
    subtype: null
  } : oldRoll(c, source);
  const oldOptions = runtime.makeChoiceOptions;
  runtime.makeChoiceOptions = function (c, source, tier, subtype, exclude = []) {
    if (source !== 'orc_totem') return oldOptions(c, source, tier, subtype, exclude);
    const pool = runtime.eligibleLegendary(c).map(x => ({
        ...x,
        kind: 'legendary'
      })),
      fresh = pool.filter(x => !exclude.includes(runtime.choiceKey(x)));
    return runtime.shuffle(fresh.length ? fresh : pool).slice(0, 4);
  };
  const oldContext = runtime.choiceContextForPlayer;
  runtime.choiceContextForPlayer = function () {
    const context = oldContext();
    if (context.source === 'orc_totem') {
      context.kicker = 'ŐSÖK TOTEME · LEGENDÁS JUTALOM';
      context.desc = 'Válassz egyet a még elérhető legendások közül (legfeljebb 4 lehetőség).';
    }
    return context;
  };
  function dispatch(c) {
    const d = c.orcSupport;
    if (!d?.totemRewards || !runtime.eligibleLegendary(c).length) return;
    if (runtime.state.startChoices > 0 || runtime.state.modal || runtime.state.pendingChoices.length || runtime.MP.guestChoicePending) return;
    d.totemRewards--;
    if (c === runtime.P) runtime.queueChoice('orc_totem');else runtime.grantEnemyPick('orc_totem');
  }
  const oldTick = runtime.tick;
  runtime.tick = function (dt) {
    const out = oldTick(dt);
    if (authoritative() && runtime.state.running && !runtime.state.ended && !runtime.state.pregame) {
      dispatch(runtime.P);
      dispatch(runtime.E);
    }
    return out;
  };
  const oldGuest = runtime.mpApplyGuestStrategy;
  runtime.mpApplyGuestStrategy = function (payload, seq) {
    if (payload && Object.prototype.hasOwnProperty.call(payload, 'orcSupport')) {
      payload = {
        ...payload
      };
      delete payload.orcSupport;
    }
    return oldGuest(payload, seq);
  };
  const oldDetails = runtime.buildingUpgradeDetails;
  runtime.buildingUpgradeDetails = function (c, type) {
    if (!defs[type]) return oldDetails(c, type);
    const lv = runtime.levelOf(c, type);
    if (lv >= 4) return 'Elérte a legmagasabb szintet.';
    if (type === 'orc_slave') return lv === 3 ? 'Válassz: Kényszermunka vagy Kíméletlen hajcsárok.' : `Minden Rabszolgatábor L${lv + 1} lesz. A korábbi ölésekre is járó Fa- és Kőhozam: +${runtime.v4LevelValue(lv, [.1, .2, .4]).toFixed(1)} → +${runtime.v4LevelValue(lv + 1, [.1, .2, .4]).toFixed(1)} /mp minden 20 ölés után.`;
    return `Minden ${runtime.BUILDINGS[type].name} L${lv + 1} lesz. ${type === 'orc_altar' ? 'Áldozati küszöb' : 'Legendás jutalomhoz szükséges halálpont'}: ${runtime.v4LevelValue(lv, thresholds[type])} → ${runtime.v4LevelValue(lv + 1, thresholds[type])}.`;
  };
  const oldRows = runtime.buildingEffectRows;
  runtime.buildingEffectRows = function (c, b) {
    const rows = oldRows(c, b),
      d = c.orcSupport || {};
    if (b.type === 'orc_altar') rows.push(['Áldozatok', `${d.altarProgress || 0} / ${threshold(b)}`], ['Életlopás', Math.max(0, (d.lifestealUntil || 0) - runtime.state.time) > 0 ? `+25% · ${Math.max(0, d.lifestealUntil - runtime.state.time).toFixed(1)} mp` : 'Inaktív']);
    if (b.type === 'orc_totem') rows.push(['Halálpontok', `${d.totemProgress || 0} / ${threshold(b)}`], ['Függő legendás jutalom', String(d.totemRewards || 0)]);
    if (b.type === 'orc_slave') rows.push(['Ellenséges ölések', String(d.slaveKills || 0)], ['Termelés', `+${(Math.floor((d.slaveKills || 0) / 20) * runtime.v4LevelValue(b.level, [.1, .2, .4])).toFixed(1)} Fa és Kő/mp (globális bónusz előtt)`]);
    if (b.type === 'orc_slave' && runtime.hasBranch(c, 'orc_slave', 'forced_labor')) rows.push(['Élelem', `+${(Math.floor((d.slaveKills || 0) / 20) * .2).toFixed(1)} /mp (globális bónusz előtt)`]);
    return rows;
  };
  const oldFind = runtime.findCell;
  runtime.findCell = function (c, type) {
    if (type !== 'orc_altar' || !isOrc(c)) return oldFind(c, type);
    let best = null,
      bestScore = -Infinity;
    const spawners = runtime.activeSpawners(c);
    for (const rot of runtime.rotationOptions(type)) for (let row = 0; row < runtime.GRID; row++) for (let col = 0; col < runtime.GRID; col++) {
      if (!runtime.canPlace(c, type, row, col, rot)) continue;
      const b = {
          id: 'altar-preview',
          type,
          row,
          col,
          rotation: rot
        },
        near = runtime.adjacentBuildings(c, b).filter(x => runtime.BUILDINGS[x.type]?.unit && !x.inactive);
      if (near.length !== 1 || spawners.length - near.length < 2) continue;
      const score = near[0].type === 'orc_gob' ? 10 : near[0].type === 'orc_war' ? 5 : 0;
      if (score > bestScore) {
        bestScore = score;
        best = [row, col, rot];
      }
    }
    return best;
  };
  let aiWait = 0;
  const oldAI = runtime.enemyBuildAI;
  runtime.enemyBuildAI = function (dt) {
    if (!runtime.MP.enabled && isOrc(runtime.E) && !runtime.state.pregame && (aiWait -= dt) <= 0) {
      aiWait = 3;
      if (runtime.activeSpawners(runtime.E).length >= 3) for (const key of ['orc_totem', 'orc_slave', 'orc_altar']) if (runtime.E.unlocked.has(key) && !runtime.hasBuilding(runtime.E, key) && runtime.aiBuild(key)) return;
    }
    return oldAI(dt);
  };
  const oldScore = runtime.scoreAiChoiceV17;
  runtime.scoreAiChoiceV17 = o => isOrc(runtime.E) && o.kind === 'building' && defs[o.id] ? {
    orc_totem: 9,
    orc_slave: 9,
    orc_altar: 6
  }[o.id] : oldScore(o);
  O.supportData = data;
  O.supportThreshold = threshold;
  Object.assign(window.__ROADLORDS__, {
    killUnit: runtime.killUnit,
    queueProduced: runtime.queueProduced,
    damageUnit: runtime.damageUnit,
    productionRates: runtime.productionRates,
    makeChoiceOptions: runtime.makeChoiceOptions,
    rollPickTier: runtime.rollPickTier,
    tick: runtime.tick,
    enemyBuildAI: runtime.enemyBuildAI,
    buildingEffectRows: runtime.buildingEffectRows
  });
}
