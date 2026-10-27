import { rangedRange } from '../data/ranged-balance.js';
import { MOVEMENT_BALANCE } from '../data/movement-balance.js';
import { assetUrl } from '../assets/urls.js';
import { ORC_BALANCE, GOBLIN_BOW_COPY } from '../data/combat-balance.js';
import { ORC_TRAINING, trainingPrice } from '../data/unit-balance.js';
export function initializeFactionsOrcFoundation(runtime) {
  const isOrc = c => c?.race === 'orc',
    orcKey = k => String(k).startsWith('orc_');
  const rect = (w, h) => Array.from({
    length: h
  }, (_, r) => Array.from({
    length: w
  }, (_, c) => [r, c])).flat();
  const basic = ['orc_work', 'orc_hunt', 'warehouse', 'orc_war', 'orc_hut'];
  const defs = {
    orc_work: ['Munkatábor', '🪓', 'economy', 2, 1, runtime.C(40, 10), 'Fa és Kő: 1/2/3 másodpercenként. Erdő mellett a Fa, Kőlelőhely mellett a Kő ×2. L4: 6 Fa + 4 Kő vagy 4 Fa + 6 Kő.'],
    orc_hunt: ['Vadászház', '🏹', 'economy', 1, 1, runtime.C(25), 'Élelem: 0,5/1/1,5/3 másodpercenként. Városfal mellett +50%, nyitott kapunál +50%; összeadódnak.'],
    orc_hut: ['Kunyhó', '🛖', 'support', 2, 2, runtime.C(35, 20), 'Úti sereg / helyőrség: +20/+20, +30/+30, +40/+60, +60/+60.'],
    orc_war: ['Harci tábor', '🪓', 'military', 2, 1, runtime.C(30, 20), 'Ork Harcost gyárt 8,5/7,5/6,5 másodpercenként.', 'orc_warrior'],
    orc_bers: ['Dühöngők tábora', '⚔️', 'military', 2, 1, runtime.C(45, 30), 'Dühöngőt gyárt 8/7/6 másodpercenként.', 'orc_berserker'],
    orc_gob: ['Goblin-tábor', '🪨', 'military', 1, 1, runtime.C(35, 20), 'Goblint gyárt 3,5/2,75/2 másodpercenként.', 'orc_goblin'],
    orc_arena: ['Aréna', '🏟️', 'support', 2, 2, runtime.C(65, 50), 'Szomszédos katonai termelők: 10/15/25% veterán esély. Veterán: +50% HP és sebzés. Több Aréna közül a legerősebb hat.'],
    orc_overseer: ['Hajcsárok tábora', '⛓️', 'support', 2, 1, runtime.C(50, 35), 'Szomszédos katonai termelők gyártási ideje −20/30/40%. Egységeik 80% HP-val születnek; maximális HP-juk nem csökken. Több tábor közül a legerősebb hat.']
  };
  for (const [key, [name, icon, category, w, h, cost, description, unit]] of Object.entries(defs)) {
    runtime.BUILDINGS[key] = {
      name,
      icon,
      category,
      shape: rect(w, h),
      cost,
      description: description + ' Építési ár: próbaérték.',
      race: 'orc',
      unit
    };
    runtime.BUILDING_IMAGE_META[key] = {
      w,
      h
    };
  }
  const oldBasePrice = runtime.v4915UndiscountedBuildPrice;
  runtime.v4915UndiscountedBuildPrice = (c, type) => oldBasePrice(c, type);
  const units = {
    orc_warrior: {
      name: 'Ork Harcos',
      icon: '🪓',
      battleIcon: '⚒',
      hp: ORC_BALANCE.warriorHp,
      damage: 20,
      cooldown: 1.25,
      speed: 34,
      range: 30,
      train: 8.5,
      cost: runtime.C(0, 7, 9),
      tags: ['melee']
    },
    orc_berserker: {
      name: 'Dühöngő',
      icon: '⚔️',
      battleIcon: '⚔',
      hp: 180,
      damage: 16,
      cooldown: .65,
      speed: 42,
      range: 30,
      train: 8,
      cost: runtime.C(4, 6, 8),
      tags: ['melee'],
      description: 'Minden 2% hiányzó HP után +1% támadási sebesség.'
    },
    orc_goblin: {
      name: 'Goblin',
      icon: '🪨',
      battleIcon: '●',
      hp: 30,
      damage: 3.5,
      cooldown: .55,
      speed: MOVEMENT_BALANCE.orc_goblin,
      range: rangedRange(115),
      train: 3.5,
      cost: runtime.C(3, 1, 4),
      tags: ['ranged']
    }
  };
  for (const [key, d] of Object.entries(units)) runtime.UNITS[key] = {
    ...d,
    cost: trainingPrice(d.cost),
    cat: 'infantry',
    damageType: 'physical',
    race: 'orc'
  };
  runtime.UNIT_ORDER.push(...Object.keys(units));
  const maxLevel = type => ['warehouse', 'orc_work', 'orc_hunt', 'orc_hut', 'orc_altar', 'orc_totem', 'orc_slave', 'orc_raider', 'orc_tunnel', 'orc_arena', 'orc_overseer', 'keep', 'orc_war', 'orc_warg', 'orc_ram', 'orc_bers', 'orc_gob', 'orc_shaman', 'orc_troll'].includes(type) ? 4 : 3;
  runtime.V4_BRANCHES.orc_work = [{
    id: 'wood',
    name: 'Erdőirtó munkatábor',
    icon: '🪓',
    description: 'Alaptermelés: 6 Fa és 4 Kő/mp.'
  }, {
    id: 'stone',
    name: 'Kőfejtő munkatábor',
    icon: '⛏️',
    description: 'Alaptermelés: 4 Fa és 6 Kő/mp.'
  }];
  for (const k of ['orc_hunt', 'orc_hut']) runtime.V4_SIMPLE_L4.add(k);
  const available = (c, key) => c.buildings.some(b => runtime.BUILDINGS[b.type]?.unit === key);
  const common = (id, name, description, eligible = () => true) => runtime.NORMAL.push({
    id,
    name,
    description,
    icon: '✦',
    race: 'orc',
    eligible: c => isOrc(c) && eligible(c)
  });
  for (const [key, d] of Object.entries(units)) {
    common(key + '_hp', d.name + ' · Életerő', '+10% maximális HP. Halmozható.', c => available(c, key));
    common(key + '_dmg', d.name + ' · Sebzés', '+10% sebzés. Halmozható.', c => available(c, key));
    runtime.PICK_UNIT_IMAGES[key + '_hp'] = key;
    runtime.PICK_UNIT_IMAGES[key + '_dmg'] = key;
  }
  common('orc_bleed', 'Vérző sebek', 'Harcos találata: először 2 vérzés, további felvételek +1. A vérzés másodpercenként a stackek számával sebez, majd 1-gyel csökken.', c => available(c, 'orc_warrior'));
  common('orc_leech', 'Vérivás', 'Dühöngő: először 5%, majd felvételenként +2 százalékpont életlopás a ténylegesen okozott HP-sebzésből.', c => available(c, 'orc_berserker'));
  common('orc_double', 'Kettős parittya', 'Goblin: +5 százalékpont esély egy második, teljes erejű találatra. Legfeljebb 100%.', c => available(c, 'orc_goblin') && runtime.countNormal(c, 'orc_double') < 20);
  for (const r of runtime.RES) common('orc_' + r, runtime.RESOURCE_NAMES[r] + ' · Termelés', '+20% ' + runtime.RESOURCE_NAMES[r] + '-termelés. A felvételek bónuszai összeadódnak.');
  common('orc_as', 'Ork harci tempó', 'Minden ork egység +5% támadási sebesség.');
  common('orc_hp', 'Szívós horda', 'Minden ork egység +5% maximális HP.');
  runtime.LEGENDARY.push({
    id: 'orc_bers_rage',
    name: 'Fájdalomból erő',
    icon: '⚔️',
    race: 'orc',
    description: 'Dühöngő: minden 1% hiányzó HP után +1% sebzés.',
    eligible: c => isOrc(c) && available(c, 'orc_berserker')
  }, {
    id: 'orc_gob_bow',
    name: 'Goblin íjászok',
    icon: '🏹',
    race: 'orc',
    description: GOBLIN_BOW_COPY,
    eligible: c => isOrc(c) && available(c, 'orc_goblin')
  });
  const oldNormal = runtime.eligibleNormal,
    oldLegend = runtime.eligibleLegendary,
    oldUnlock = runtime.buildingUnlockPool,
    oldUpgrade = runtime.buildingUpgradePool;
  runtime.eligibleNormal = c => oldNormal(c).filter(x => isOrc(c) ? x.race === 'orc' : x.race !== 'orc');
  runtime.eligibleLegendary = c => oldLegend(c).filter(x => isOrc(c) ? x.race === 'orc' : x.race !== 'orc');
  runtime.buildingUnlockPool = c => isOrc(c) ? Object.keys(defs).filter(k => !c.unlocked.has(k)).map(k => runtime.makeBuildingChoice(c, k)) : oldUnlock(c).filter(x => !orcKey(x.id));
  runtime.buildingUpgradePool = c => oldUpgrade(c).filter(x => !isOrc(c) || runtime.levelOf(c, x.id) < maxLevel(x.id));
  const oldDetails = runtime.buildingUpgradeDetails;
  runtime.buildingUpgradeDetails = function (c, type) {
    if (!isOrc(c) && !orcKey(type)) return oldDetails(c, type);
    if (runtime.levelOf(c, type) >= maxLevel(type)) return 'Ez a jelenlegi legmagasabb elérhető szint.';
    if (!orcKey(type)) return oldDetails(c, type);
    return `Minden jelenlegi és későbbi ${runtime.BUILDINGS[type].name} L${runtime.levelOf(c, type) + 1} lesz.<br>${runtime.BUILDINGS[type].description}`;
  };
  const oldSetLevel = runtime.setBuildingLevel;
  runtime.setBuildingLevel = (c, type, target, branch = null) => oldSetLevel(c, type, isOrc(c) ? Math.min(maxLevel(type), target) : target, branch);
  const oldRecompute = runtime.recomputeCity;
  runtime.recomputeCity = function (c, preserve = true) {
    oldRecompute(c, preserve);
    if (!isOrc(c)) return;
    for (const b of runtime.buildingOf(c, 'orc_hut')) {
      c.armyCap += runtime.v4LevelValue(b.level, [20, 30, 40, 60]);
      c.garrisonCap += runtime.v4LevelValue(b.level, [20, 30, 60, 60]);
    }
  };
  function slaveWorkMult(c, b) {
    return runtime.hasBranch(c, 'orc_slave', 'overseers') && runtime.adjacentBuildings(c, b).some(x => x.type === 'orc_slave' && !x.inactive) ? 1.5 : 1;
  }
  function workRates(c, b) {
    const lv = Math.min(b.level, 3);
    return runtime.C(slaveWorkMult(c, b) * (b.level === 4 ? runtime.branchOf(c, b.type) === 'stone' ? 4 : 6 : lv) * (runtime.adjacentTerrain(c, b, 'forest') ? runtime.hasLeg(c, 'orc_ancient_deposits') ? 3 : 2 : 1), slaveWorkMult(c, b) * (b.level === 4 ? runtime.branchOf(c, b.type) === 'stone' ? 6 : 4 : lv) * (runtime.adjacentTerrain(c, b, 'quarry') ? runtime.hasLeg(c, 'orc_ancient_deposits') ? 3 : 2 : 1));
  }
  function huntRate(c, b) {
    return slaveWorkMult(c, b) * runtime.v4LevelValue(b.level, [.5, 1, 1.5, 3]) * (1 + (runtime.touchesWall(b) ? .5 : 0) + (runtime.orcGateBonuses(c) ? .5 : 0));
  }
  const oldRates = runtime.productionRates;
  runtime.productionRates = function (c) {
    if (!isOrc(c)) return oldRates(c);
    const k = runtime.v4LevelValue(runtime.levelOf(c, 'keep'), [1, 2, 4, 8]),
      out = runtime.C(k, k, k);
    for (const b of c.buildings) {
      if (b.type === 'orc_work') {
        const r = workRates(c, b);
        out.wood += r.wood;
        out.stone += r.stone;
      }
      if (b.type === 'orc_hunt') out.food += huntRate(c, b);
    }
    for (const r of runtime.RES) out[r] *= 1 + .2 * runtime.countNormal(c, 'orc_' + r);
    return out;
  };
  const oldTime = runtime.trainingTime;
  function supportLevel(c, b, type) {
    return Math.max(0, ...runtime.adjacentBuildings(c, b).filter(x => x.type === type && !x.inactive).map(x => x.level));
  }
  runtime.trainingTime = function (c, b) {
    if (!isOrc(c) || !orcKey(b.type)) return oldTime(c, b);
    if (b.inactive) return Infinity;
    const times = ORC_TRAINING,
      lv = supportLevel(c, b, 'orc_overseer');
    return runtime.v4LevelValue(b.level, times[b.type] || [10]) * (lv ? 1 - runtime.v4LevelValue(lv, [.2, .3, .4, runtime.hasBranch(c, 'orc_overseer', 'ruthless') ? .8 : .4]) : 1);
  };
  const oldStats = runtime.statsFor;
  runtime.statsFor = function (c, e) {
    const s = oldStats(c, e);
    if (!orcKey(e.key)) return s;
    const hp = 1 + .1 * runtime.countNormal(c, e.key + '_hp') + .05 * runtime.countNormal(c, 'orc_hp'),
      dmg = 1 + .1 * runtime.countNormal(c, e.key + '_dmg');
    s.hp *= hp;
    s.dmg *= dmg;
    s.buildingDamage *= dmg;
    s.cooldown /= 1 + .05 * runtime.countNormal(c, 'orc_as');
    if (e.key === 'orc_goblin' && runtime.hasLeg(c, 'orc_gob_bow')) {
      s.dmg *= ORC_BALANCE.goblinBowDamageMultiplier;
      s.buildingDamage *= ORC_BALANCE.goblinBowDamageMultiplier;
      s.cooldown /= ORC_BALANCE.goblinBowAttackSpeedMultiplier;
      s.range *= ORC_BALANCE.goblinBowRangeMultiplier;
    }
    return s;
  };
  const oldEntry = runtime.makeEntry;
  runtime.makeEntry = function (c, key, extra = {}) {
    const e = oldEntry(c, key, extra);
    if (!isOrc(c)) return e;
    const b = c.buildings.find(x => x.id === extra.originBuildingId);
    if (b) {
      const arenas = runtime.adjacentBuildings(c, b).filter(x => x.type === 'orc_arena' && !x.inactive),
        chance = runtime.hasBranch(c, 'orc_arena', 'academies') ? Math.min(1, arenas.length * .25) : Math.max(0, ...arenas.map(x => runtime.v4LevelValue(x.level, [.1, .15, .25, .4])));
      if (chance && Math.random() < chance) e.veteran = true;
      if (supportLevel(c, b, 'orc_overseer')) e.orcBirthHp = runtime.hasBranch(c, 'orc_overseer', 'ruthless') ? .25 : .8;
    }
    return e;
  };
  const oldRelease = runtime.releaseUnit;
  runtime.releaseUnit = function (c, e) {
    const u = oldRelease(c, e);
    if (u && e.orcBirthHp) u.hp = u.maxHp * e.orcBirthHp;
    return u;
  };
  const oldStatus = runtime.updateUnitStatuses;
  runtime.updateUnitStatuses = function (u, dt) {
    oldStatus(u, dt);
    if (!u.alive) return;
    if (u.orcBleed > 0) {
      u.orcBleedClock = (u.orcBleedClock || 0) + dt;
      while (u.orcBleedClock >= 1 && u.orcBleed > 0 && u.alive) {
        u.orcBleedClock--;
        const d = u.orcBleed--;
        runtime.damageUnit(u, d, 'pure');
      }
    }
    if (u.key === 'orc_berserker') {
      const missing = 1 - Math.max(0, u.hp) / u.maxHp;
      u.cooldownTime = u.baseCooldownTime / (1 + Math.floor(missing * 50 + 1e-8) / 100);
    }
  };
  const oldAttack = runtime.attackUnit;
  runtime.attackUnit = function (u, t, opts = {}) {
    if (!orcKey(u.key)) return oldAttack(u, t, opts);
    if (!u.alive || !t?.alive) return;
    const c = runtime.cityForSide(u.side);
    u.attackCount = (u.attackCount || 0) + 1;
    const bloodbath = u.key === 'orc_berserker' && runtime.hasBranch(c, 'orc_bers', 'bloodbath') && u.hp < u.maxHp * .5;
    const opening = runtime.consumeOpeningAttack(u);
    let mult = (opts.mult || 1) * opening;
    if (u.key === 'orc_berserker' && runtime.hasLeg(c, 'orc_bers_rage')) mult *= 1 + (1 - u.hp / u.maxHp);
    const hits = u.key === 'orc_goblin' && Math.random() < Math.min(1, .05 * runtime.countNormal(c, 'orc_double')) ? 2 : 1;
    for (let i = 0; i < hits && t.alive; i++) {
      if (u.key === 'orc_goblin') runtime.addProjectile(u, t, runtime.hasLeg(c, 'orc_gob_bow') ? 'arrow' : 'rock');else runtime.addMeleeFx(u, t, 'slash');
      const actual = runtime.damageUnit(t, runtime.attackBaseDamage(u, t, mult), u.damageType);
      if (u.key === 'orc_warrior' && runtime.countNormal(c, 'orc_bleed') && t.alive && !t.orcLastEvaded) t.orcBleed = (t.orcBleed || 0) + 1 + runtime.countNormal(c, 'orc_bleed');
      if (u.key === 'orc_berserker' && !u.orcDeathDefiance && runtime.countNormal(c, 'orc_leech')) window.__ROADLORDS_ORCS__.lifeSteal ? window.__ROADLORDS_ORCS__.lifeSteal(u, actual * (.03 + .02 * runtime.countNormal(c, 'orc_leech'))) : u.hp = Math.min(u.maxHp, u.hp + actual * (.03 + .02 * runtime.countNormal(c, 'orc_leech')));
    }
    if (bloodbath) {
      const v = runtime.state.units.filter(v => v.alive && v.side !== u.side && v !== t && runtime.roadDistance(v, u) <= u.range).sort((a, b) => runtime.roadDistance(a, u) - runtime.roadDistance(b, u))[0];
      if (v) {
        runtime.addMeleeFx(u, v, 'slash');
        const actual = runtime.damageUnit(v, runtime.attackBaseDamage(u, v, mult * .5), u.damageType);
        if (!u.orcDeathDefiance && runtime.countNormal(c, 'orc_leech')) window.__ROADLORDS_ORCS__.lifeSteal ? window.__ROADLORDS_ORCS__.lifeSteal(u, actual * (.03 + .02 * runtime.countNormal(c, 'orc_leech'))) : u.hp = Math.min(u.maxHp, u.hp + actual * (.03 + .02 * runtime.countNormal(c, 'orc_leech')));
      }
    }
    runtime.afterFirstAttack(u);
  };
  const oldStructure = runtime.attackStructure;
  runtime.attackStructure = function (u, s) {
    if (u.key !== 'orc_berserker') return oldStructure(u, s);
    const c = runtime.cityForSide(u.side),
      target = s.capital ? runtime.cityForSide(s.side) : s,
      before = target.hp,
      dmg = u.damage;
    if (runtime.hasLeg(c, 'orc_bers_rage')) u.damage *= 1 + (1 - u.hp / u.maxHp);
    try {
      const out = oldStructure(u, s);
      if (u.alive && !u.orcDeathDefiance && runtime.countNormal(c, 'orc_leech')) window.__ROADLORDS_ORCS__.lifeSteal(u, Math.max(0, before - Math.max(0, target.hp)) * (.03 + .02 * runtime.countNormal(c, 'orc_leech')));
      return out;
    } finally {
      u.damage = dmg;
    }
  };
  const oldRows = runtime.buildingEffectRows;
  runtime.buildingEffectRows = function (c, b) {
    if (!orcKey(b.type)) return oldRows(c, b);
    const rows = [['Építési ár', 'Próbaérték · balance később']];
    if (b.type === 'orc_work') {
      const r = workRates(c, b);
      rows.push(['Termelés', `${r.wood} Fa + ${r.stone} Kő/mp (globális bónusz előtt)`]);
    } else if (b.type === 'orc_hunt') rows.push(['Élelem', `${huntRate(c, b)} /mp (globális bónusz előtt)`]);else if (runtime.BUILDINGS[b.type].unit) rows.push(['Gyártási idő', `${runtime.trainingTime(c, b).toFixed(2)} mp`]);else rows.push(['Hatás', runtime.BUILDINGS[b.type].description]);
    return rows;
  };
  const oldTerrain = runtime.generateTerrain;
  runtime.generateTerrain = function (c, n) {
    const out = oldTerrain(c, n);
    if (isOrc(c)) c.terrain = c.terrain.map(t => t?.type === 'fertile' ? null : t);
    return out;
  };
  function setRace(c, race) {
    if (runtime.state.time > 0 || runtime.MP.started) return false;
    race = ['human','orc','undead'].includes(race) ? race : 'human';
    if (c.race === race) return true;
    c.orcSupport = null;
    c.orcSiegeRewards = 0;
    c.orcCurseSelection = null;
    c.orcHutMode = 'army';
    c.race = race;
    c.unlocked = new Set(runtime.factionBasics?.(race) || (isOrc(c) ? basic : runtime.BASIC));
    c.buildings = c.buildings.filter(b => b.type === 'keep');
    c.buildings[0].level = 1;
    c.levels = {
      keep: 1
    };
    c.l4Branches = {};
    c.normal = {};
    c.legends = new Set();
    c.garrison = [];
    c.releaseQueue = [];
    c.rallyReserve = [];
    c.resources = runtime.C(150, 75, 40);
    c.aiThink = 0;
    runtime.initializeFactionCity?.(c);
    runtime.generateTerrain(c, 10 + Math.floor(Math.random() * 6));
    runtime.recomputeCity(c, false);
    return true;
  }
  runtime.P.race = 'human';
  runtime.E.race = 'human';
  const oldFind = runtime.findCell;
  runtime.findCell = function (c, type) {
    if (!isOrc(c) || !orcKey(type)) return oldFind(c, type);
    const choose = () => {
      const layout = c === runtime.E && !runtime.MP.enabled ? runtime.aiLayoutPlan?.(c) : null;
      const occupied = runtime.occupancy(c),
        producers = runtime.spawnerBuildings(c),
        supports = c.buildings.filter(b => ['orc_arena', 'orc_overseer'].includes(b.type));
      const touches = (a, b) => runtime.aiBuildingsTouch
        ? runtime.aiBuildingsTouch(c, a, b)
        : runtime.adjacentBuildings(c, a).some(x => x.id === b.id);
      let best = null, score = -Infinity;
      for (const rot of runtime.rotationOptions(type)) {
        const shape = runtime.rotatedShape(type, rot);
        for (let row = 0; row < runtime.GRID; row++) for (let col = 0; col < runtime.GRID; col++) {
          if (shape.some(([dr, dc]) => row + dr < 0 || col + dc < 0 || row + dr >= runtime.GRID || col + dc >= runtime.GRID || occupied.has(runtime.idx(row + dr, col + dc)) || runtime.terrainBlocks(c, row + dr, col + dc))) continue;
          const b = { id: 'orc-preview', type, row, col, rotation: rot };
          let n = 0;
          if (layout) {
            if (runtime.aiSupportCoverage(c, b, layout) === 0 && runtime.aiRequiresLocalTargets(c, b)) continue;
            n += runtime.aiLayoutAdjustment(c, b, layout);
          }
          if (type === 'orc_work') n += 100 * (Number(runtime.adjacentTerrain(c, b, 'forest')) + Number(runtime.adjacentTerrain(c, b, 'quarry')));
          if (type === 'orc_hunt' && runtime.touchesWall(b)) n += 100;
          if (type === 'orc_arena' || type === 'orc_overseer') n += 50 * producers.filter(x => touches(b, x)).length;
          if (runtime.BUILDINGS[type].unit) n += 30 * supports.filter(x => touches(b, x)).length;
          n -= Math.abs(row - runtime.CENTER.row) * .1 + Math.abs(col - runtime.CENTER.col) * .1;
          if (n > score) { score = n; best = [row, col, rot]; }
        }
      }
      return best;
    };
    return c === runtime.E ? runtime.aiMemo('orc-cell:' + type + ':' + c.buildings.map(b => b.id).join(','), choose) : choose();
  };
  const oldAI = runtime.enemyBuildAI;
  runtime.enemyBuildAI = function (dt) {
    if (!isOrc(runtime.E)) return oldAI(dt);
    if (runtime.MP.enabled || runtime.state.pregame) return;
    runtime.E.aiThink -= dt;
    if (runtime.E.aiThink > 0) return;
    runtime.E.aiThink = .8;
    runtime.enemyGateAI();
    const num = k => runtime.buildingOf(runtime.E, k).length;
    if (!num('orc_work')) {
      runtime.aiBuild('orc_work');
      return;
    }
    if (!num('orc_hunt')) {
      runtime.aiBuild('orc_hunt');
      return;
    }
    if (!num('warehouse') && Math.min(runtime.E.resources.wood, runtime.E.resources.stone) > 55) {
      runtime.aiBuild('warehouse');
      return;
    }
    if (runtime.state.startChoices > 0) return;
    const ancient = runtime.terrainCellsOfType(runtime.E, 'ancient');
    if (ancient.length && runtime.E.resources.wood >= 145 && runtime.E.resources.stone >= 145) {
      if (runtime.clearTerrain(runtime.E, ...ancient[0], true)) return;
    }
    if (runtime.fieldUnitCount(runtime.E) + runtime.E.releaseQueue.length > runtime.E.armyCap * .75 || runtime.reserveCount(runtime.E) > runtime.E.garrisonCap * .7) {
      if (runtime.aiBuild('orc_hut')) return;
    }
    const rates = runtime.productionRates(runtime.E),
      need = runtime.C(.5, .5, .5);
    for (const b of runtime.activeSpawners(runtime.E)) {
      const key = runtime.effectiveUnitKey(runtime.E, b),
        t = runtime.trainingTime(runtime.E, b);
      for (const r of runtime.RES) need[r] += runtime.UNITS[key].cost[r] / t;
    }
    if (rates.food < need.food * 1.2 && runtime.aiBuild('orc_hunt')) return;
    if ((rates.wood < need.wood * 1.2 || rates.stone < need.stone * 1.2) && runtime.aiBuild('orc_work')) return;
    if (runtime.RES.some(r => runtime.E.resources[r] > runtime.E.caps[r] * .9) && num('warehouse') < 4 && runtime.aiBuild('warehouse')) return;
    const military = ['orc_war', 'orc_bers', 'orc_gob', 'orc_warg', 'orc_shaman', 'orc_ram', 'orc_troll'].filter(k => runtime.E.unlocked.has(k)).sort((a, b) => num(a) - num(b));
    if (runtime.activeSpawners(runtime.E).length < 2 || runtime.E.resources.food > 30) {
      for (const k of military) if (runtime.aiBuild(k)) return;
    }
    for (const k of ['orc_arena', 'orc_overseer']) if (!num(k) && runtime.aiBuild(k)) return;
  };
  const oldScore = runtime.scoreAiChoiceV17;
  runtime.scoreAiChoiceV17 = function (o) {
    if (!isOrc(runtime.E)) return oldScore(o);
    if (o.kind === 'building') return {
      orc_hut: 8,
      orc_bers: 12,
      orc_gob: 13,
      orc_arena: 7,
      orc_overseer: 6
    }[o.id] || 4;
    if (o.kind === 'building_upgrade' || o.kind === 'building_branch') return 8 + runtime.buildingOf(runtime.E, o.id).length;
    if (o.kind === 'legendary') return 14;
    return 6 + Math.random() * 2;
  };
  runtime.MP_STRATEGY_KEYS.push('race');
  const oldSend = runtime.mpSend;
  runtime.mpSend = function (data) {
    if (data?.type === 'hello') data = {
      ...data,
      race: runtime.P.race,
      orcProtocol: 1
    };
    return oldSend(data);
  };
  const oldHandle = runtime.mpHandle;
  runtime.mpHandle = function (data) {
    if (data?.type === 'hello' && !runtime.MP.started) {
      setRace(runtime.E, data.race);
      if (runtime.MP.role === 'guest') runtime.mpSendStrategy(true);
    }
    return oldHandle(data);
  };
  const oldApplyGuest = runtime.mpApplyGuestStrategy;
  runtime.mpApplyGuestStrategy = function (data, seq) {
    if (data && runtime.MP.started) data = {
      ...data,
      race: runtime.E.race || 'human'
    };
    return oldApplyGuest(data, seq);
  };
  const oldReplace = runtime.mpReplaceCity;
  runtime.mpReplaceCity = function (target, packed, enemy) {
    const localRace = target === runtime.P && !runtime.MP.started ? runtime.P.race : null;
    oldReplace(target, packed, enemy);
    if (localRace && target.race !== localRace) setRace(target, localRace);
  };
  const oldUiSig = runtime.mpUiCitySignature;
  runtime.mpUiCitySignature = c => oldUiSig(c) + '|race:' + c.race;
  const style = document.createElement('style');
  style.textContent = "@import url(\"" + (assetUrl("styles/features/factions-orc-foundation-38.css") + "\");");
  document.head.appendChild(style);
  const options = '<option value="human">Emberek</option><option value="orc">Orkok</option>';
  const lobby = runtime.MP.lobby,
    solo = lobby.querySelector('#mpSolo'),
    oldSolo = solo.onclick;
  const panel = document.createElement('section');
  panel.className = 'orcSoloPanel';
  panel.hidden = true;
  panel.innerHTML = `<div class="orcSoloCard"><h2>FAJVÁLASZTÁS</h2><label class="raceField">Saját faj<select id="soloRace">${options}</select></label><label class="raceField">AI faja<select id="aiRace">${options}</select></label><p class="orcNote">Orkok: mind a 7 egység, 17 épület, 25 common és 6 legendás. Az építési árak próbaértékek; a további épületek, legendások és L4 ágak később érkeznek.</p><button id="raceContinue" class="menuButton primary">PÁLYAVÁLASZTÁS</button><button id="raceBack" class="menuButton">VISSZA</button></div>`;
  lobby.appendChild(panel);
  solo.onclick = () => {
    panel.hidden = false;
  };
  panel.querySelector('#raceBack').onclick = () => panel.hidden = true;
  panel.querySelector('#raceContinue').onclick = () => {
    setRace(runtime.P, panel.querySelector('#soloRace').value);
    setRace(runtime.E, panel.querySelector('#aiRace').value);
    panel.hidden = true;
    oldSolo();
  };
  const field = document.createElement('label');
  field.className = 'raceField';
  field.innerHTML = `Faj<select id="mpRace">${options}</select>`;
  lobby.querySelector('.mpNameEntry').appendChild(field);
  const oldCreate = runtime.mpCreateRoom,
    oldJoin = runtime.mpJoinRoom;
  runtime.mpCreateRoom = function () {
    setRace(runtime.P, field.querySelector('select').value);
    return oldCreate();
  };
  runtime.mpJoinRoom = function (code) {
    setRace(runtime.P, field.querySelector('select').value);
    return oldJoin(code);
  };
  window.__ROADLORDS_ORCS__ = {
    isOrc,
    setRace,
    maxLevel,
    defs,
    basic
  };
  Object.assign(window.__ROADLORDS__, {
    productionRates: runtime.productionRates,
    trainingTime: runtime.trainingTime,
    statsFor: runtime.statsFor,
    makeEntry: runtime.makeEntry,
    releaseUnit: runtime.releaseUnit,
    eligibleNormal: runtime.eligibleNormal,
    eligibleLegendary: runtime.eligibleLegendary,
    buildingUnlockPool: runtime.buildingUnlockPool,
    buildingUpgradePool: runtime.buildingUpgradePool,
    recomputeCity: runtime.recomputeCity,
    enemyBuildAI: runtime.enemyBuildAI,
    generateTerrain: runtime.generateTerrain,
    setBuildingLevel: runtime.setBuildingLevel,
    buildingEffectRows: runtime.buildingEffectRows
  });
}
