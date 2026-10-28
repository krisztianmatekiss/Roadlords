import { rangedRange, WARG_THROW_RANGE } from '../data/ranged-balance.js';
import { assetUrl } from '../assets/urls.js';
import { ORC_BALANCE } from '../data/combat-balance.js';
import { ORC_TRAINING, trainingPrice } from '../data/unit-balance.js';
import { MOVEMENT_BALANCE } from '../data/movement-balance.js';
import { attackSourceCanResolve } from '../combat/target-budget.js';
import { packBattleAttack } from '../multiplayer/attack-codec.js';
export function initializeFactionsOrcRoster(runtime) {
  const O = window.__ROADLORDS_ORCS__,
    isOrc = O.isOrc;
  const rectangle = (w, h) => Array.from({
    length: h
  }, (_, r) => Array.from({
    length: w
  }, (_, c) => [r, c])).flat();
  const newBuildings = {
    orc_warg: ['Wargkarám', '🐺', 2, 1, runtime.C(70, 60), 'orc_warg', 'Warglovast gyárt 11/10/9 másodpercenként.'],
    orc_shaman: ['Sámántábor', '☠', 2, 1, runtime.C(60, 65), 'orc_shaman', 'Sámánt gyárt 9/7,2/5,4 másodpercenként.'],
    orc_ram: ['Faltörő műhely', '⚒', 2, 1, runtime.C(80, 100), 'orc_ram', 'Faltörő kost gyárt 12/11/10 másodpercenként.'],
    orc_troll: ['Trollverem', '♟', 3, 3, runtime.C(120, 140), 'orc_troll', 'Trollt gyárt 24/19,2/14,4 másodpercenként. Egyedi: legfeljebb egy építhető.']
  };
  for (const [key, [name, icon, w, h, cost, unit, description]] of Object.entries(newBuildings)) {
    O.defs[key] = newBuildings[key];
    runtime.BUILDINGS[key] = {
      name,
      icon,
      shape: rectangle(w, h),
      cost,
      unit,
      description: description + ' Építési ár: próbaérték.',
      category: 'military',
      race: 'orc',
      unique: key === 'orc_troll'
    };
    runtime.BUILDING_IMAGE_META[key] = {
      w,
      h
    };
  }
  const units = {
    orc_warg: {
      name: 'Warglovas',
      icon: '🐺',
      battleIcon: 'W',
      cat: 'cavalry',
      tags: ['melee'],
      hp: 400,
      damage: 30,
      cooldown: 1.5,
      speed: MOVEMENT_BALANCE.orc_warg,
      range: 30,
      train: 11,
      cost: runtime.C(5, 16, 18),
      description: 'Első támadás: 60 sebzésű lándzsadobás 230 hatótávból, mozgás közben; utána közelharc. Próbaszabály: épületre a dobás normál közelharci épületszorzót kap, kritikus találat nélkül.'
    },
    orc_shaman: {
      name: 'Sámán',
      icon: '☠',
      battleIcon: 'S',
      cat: 'magic',
      tags: ['ranged'],
      hp: 100,
      damage: 8,
      cooldown: 2.5,
      speed: 38,
      range: rangedRange(150),
      train: ORC_TRAINING.orc_shaman[0],
      cost: runtime.C(10, 8, 12),
      damageType: 'magic',
      description: 'Találatonként 1 véletlen átok 4 mp-re. Előnyben részesíti az átok nélküli ellenfelet. Gyengeség: −20% sebzés; Sorvadás: −20% Max HP; Kimerültség: −25% támadási sebesség; Sebezhetőség: +20% kapott sebzés; Vakság: 25% melléütés. Azonos átok nem erősödik, időtartama frissül. Sorvadás próbaszabálya: a jelenlegi HP legfeljebb az új maximumra csökken, lejáratkor nem gyógyít.'
    },
    orc_ram: {
      name: 'Faltörő kos',
      icon: '⚒',
      battleIcon: 'R',
      cat: 'siege',
      tags: ['melee', 'heavy', 'armored'],
      hp: 1100,
      damage: 8,
      buildingDamage: 130,
      cooldown: 2,
      speed: 20,
      range: 30,
      train: 12,
      cost: runtime.C(18, 22, 10),
      description: '130 alapsebzés tornyokra és fővárosra; 8 egységek ellen. Páncél próbaértéke: −50% fizikai sebzés; mágikus sebzésre nem hat.'
    },
    orc_troll: {
      name: 'Troll',
      icon: '♟',
      battleIcon: 'T',
      cat: 'siege',
      tags: ['melee', 'heavy'],
      hp: 3200,
      damage: 110,
      buildingDamage: 110,
      cooldown: 2,
      speed: 26,
      range: 30,
      aoe: 55,
      train: ORC_TRAINING.orc_troll[0],
      cost: runtime.C(25, 60, 60),
      description: `110 alapsebzés a célpontra, ${ORC_BALANCE.trollSecondaryDamage} a körülötte álló ellenségekre. Területi sugár: 55 útegység a célpont körül. Ostromegység: 110 alapsebzést okoz tornyoknak és a fővárosnak. Az Ősök Totemének és az Áldozati oltárnak 4 pontot ér.`
    }
  };
  for (const [key, d] of Object.entries(units)) {
    runtime.UNITS[key] = {
      damageType: 'physical',
      ...d,
      train:ORC_TRAINING[key][0],
      cost: trainingPrice(d.cost),
      race: 'orc'
    };
    runtime.UNIT_ORDER.push(key);
  }
  const times = Object.fromEntries(['orc_warg', 'orc_shaman', 'orc_ram', 'orc_troll'].map(key => [key, ORC_TRAINING[key]]));
  const oldTime = runtime.trainingTime;
  runtime.trainingTime = function (c, b) {
    if (!times[b.type]) return oldTime(c, b);
    if (b.inactive) return Infinity;
    const lv = Math.max(0, ...runtime.adjacentBuildings(c, b).filter(x => x.type === 'orc_overseer' && !x.inactive).map(x => x.level));
    return runtime.v4LevelValue(b.level, times[b.type]) * (lv ? 1 - runtime.v4LevelValue(lv, [.2, .3, .4, runtime.hasBranch(c, 'orc_overseer', 'ruthless') ? .8 : .4]) : 1);
  };
  const oldPreview = runtime.previewTrainingTime;
  runtime.previewTrainingTime = (c, type, level = runtime.levelOf(c, type)) => isOrc(c) && type.startsWith('orc_') && runtime.BUILDINGS[type]?.unit ? runtime.trainingTime(c, {
    type,
    level,
    id: 'preview',
    row: -20,
    col: -20,
    rotation: 0
  }) : oldPreview(c, type, level);
  const unlocked = (c, k) => c.buildings.some(b => runtime.BUILDINGS[b.type]?.unit === k);
  function common(id, name, description, key) {
    runtime.NORMAL.push({
      id,
      name,
      description,
      race: 'orc',
      icon: runtime.UNITS[key].icon,
      eligible: c => isOrc(c) && unlocked(c, key)
    });
    runtime.PICK_UNIT_IMAGES[id] = key;
  }
  for (const [key, u] of Object.entries(units)) {
    common(key + '_hp', u.name + ' · Életerő', '+10% maximális HP. Halmozható.', key);
    common(key + '_dmg', u.name + ' · Sebzés', '+10% sebzés, a képességekre és épületsebzésre is. Halmozható.', key);
  }
  common('orc_spear_crit', 'Kritikus lándzsák', 'Warglovas lándzsadobása egység ellen: +10 százalékpont kritikus esély. Minden teljes 100% garantált további duplázás; a maradék újabb duplázás esélye.', 'orc_warg');
  common('orc_curse_duration', 'Tartós rontás', 'A Sámán újonnan kiosztott átkai +1 másodpercig tartanak. Halmozható.', 'orc_shaman');
  common('orc_troll_regen', 'Trollregeneráció', 'A Trollok másodpercenként +5 HP-t gyógyulnak. Halmozható.', 'orc_troll');
  const curseNames = {
    weakness: 'Gyengeség',
    atrophy: 'Sorvadás',
    exhaustion: 'Kimerültség',
    vulnerability: 'Sebezhetőség',
    blindness: 'Vakság'
  };
  const cursed = (u, key) => (u.orcCurses?.[key] || 0) > 0;
  const hasCurse = u => Object.values(u.orcCurses || {}).some(t => t > 0);
  function applyCurse(u, key, duration, power = 1) {
    if (!u?.alive || !curseNames[key]) return false;
    runtime.auditApplyCurse(u, key, duration, power);
    runtime.spark(u.lane, curseNames[key], '#cf95ee');
    return true;
  }
  const oldStats = runtime.statsFor;
  runtime.statsFor = function (c, e) {
    const s = oldStats(c, e);
    s.hp *= 1 - .2 * runtime.orcCursePower(e, 'atrophy');
    return s;
  };
  const oldDamage = runtime.damageUnit;
  runtime.damageUnit = function (u, amount, type) {
    amount *= 1 + .2 * runtime.orcCursePower(u, 'vulnerability');
    if (u.key === 'orc_ram' && type === 'physical') amount *= .5;
    return oldDamage(u, amount, type);
  };
  const oldRetaliation = runtime.holyRetaliation;
  runtime.holyRetaliation = function (c, u, healed) {
    const power = u.heal;
    u.heal *= 1 - .2 * runtime.orcCursePower(u, 'weakness');
    try {
      return oldRetaliation(c, u, healed);
    } finally {
      u.heal = power;
    }
  };
  const oldStatus = runtime.updateUnitStatuses;
  runtime.updateUnitStatuses = function (u, dt) {
    runtime.auditTickCurses(u, dt);
    oldStatus(u, dt);
    if (u.alive && u.key === 'orc_troll') runtime.healUnit(u, 5 * runtime.countNormal(runtime.cityForSide(u.side), 'orc_troll_regen') * dt);
  };
  const oldTarget = runtime.preferredTarget;
  runtime.preferredTarget = function (u, opps) {
    if (u.key !== 'orc_shaman') return oldTarget(u, opps);
    let best = null,
      rank = Infinity,
      dist = Infinity;
    for (const t of runtime.battleCandidates(opps, u.lane, u.range)) {
      if (!t.alive) continue;
      const d = runtime.roadDistance(t, u);
      if (d > u.range) continue;
      const allowed = O.curseSelection ? O.curseSelection(runtime.cityForSide(u.side)) : Object.keys(curseNames),
        r = allowed.filter(k => cursed(t, k)).length / allowed.length;
      if (r < rank || r === rank && d < dist) {
        best = t;
        rank = r;
        dist = d;
      }
    }
    return best;
  };
  const oldRelease = runtime.releaseUnit;
  runtime.releaseUnit = function (c, e) {
    const u = oldRelease(c, e);
    if (u && u.key === 'orc_warg') u.orcSpearReady = true;
    if (u && u.key === 'orc_troll') u.orcDeathWeight = 4;
    return u;
  };
  const critMult = c => {
    const chance = runtime.countNormal(c, 'orc_spear_crit') * .1 + runtime.countNormal(c, 'orc_crit') * .04,
      n = Math.floor(chance + 1e-9),
      rest = Math.max(0, chance - n);
    return 2 ** (n + (rest > 0 && Math.random() < rest ? 1 : 0));
  };
  const oldAttack = runtime.attackUnit;
  runtime.attackUnit = function (u, t, opts = {}) {
    if (!attackSourceCanResolve(runtime,u) || !t?.alive) return;
    if (Math.random() < .25 * runtime.orcCursePower(u, 'blindness')) {
      u.attackCount = (u.attackCount || 0) + 1;
      runtime.consumeOpeningAttack(u);
      runtime.afterFirstAttack(u);
      runtime.spark(u.lane, 'MELLÉ', '#b8a0c6');
      return;
    }
    const c = runtime.cityForSide(u.side),
      weak = 1 - .2 * runtime.orcCursePower(u, 'weakness'),
      scale = (opts.mult || 1) * weak;
    if (!units[u.key]) return oldAttack(u, t, {
      ...opts,
      mult: scale
    });
    u.attackCount = (u.attackCount || 0) + 1;
    const opening = runtime.consumeOpeningAttack(u);
    let mult = scale * opening;
    if (u.key === 'orc_warg' && u.orcSpearReady) {
      u.orcSpearReady = false;
      mult *= 2 * critMult(c);
      runtime.addProjectile(u, t, 'arrow');
    } else if (u.key === 'orc_shaman') runtime.addProjectile(u, t, 'holy');else runtime.addMeleeFx(u, t, 'slash');
    const dmg = runtime.attackBaseDamage(u, t, mult);
    if (u.key === 'orc_troll') {
      const quake = runtime.hasBranch(c, 'orc_troll', 'earthshaker') && u.attackCount % 3 === 0,
        radius = u.aoe * (quake ? 2.5 : 1),
        enemies = runtime.state.units.filter(x => x.side !== u.side),
        victims = runtime.battleCandidates(enemies, t.lane, radius).filter(x => x.alive && x.id !== t.id && runtime.roadDistance(x, t) <= radius);
      for (const v of [t, ...victims]) {
        const secondaryRatio = ORC_BALANCE.trollSecondaryDamage / units.orc_troll.damage;
        runtime.damageUnit(v, runtime.attackBaseDamage(u, v, mult * (v === t || quake ? 1 : secondaryRatio)), u.damageType);
        if (quake && v.alive && !v.orcLastEvaded) v.stunTime = Math.max(v.stunTime || 0, 1);
      }
      if (quake) runtime.spark(t.lane, 'FÖLDRENGETŐ', '#e6c17a');
    } else {
      runtime.damageUnit(t, dmg, u.damageType);
      if (u.key === 'orc_shaman' && t.alive && !t.orcLastEvaded) {
        const keys = (O.curseSelection ? O.curseSelection(c) : Object.keys(curseNames)).map(k => [Math.random(), k]).sort((a, b) => a[0] - b[0]).map(x => x[1]),
          count = runtime.hasBranch(c, 'orc_shaman', 'double_curse') ? 2 : 1;
        for (const key of keys.slice(0, count)) applyCurse(t, key, 4 + runtime.countNormal(c, 'orc_curse_duration'), runtime.hasBranch(c, 'orc_shaman', 'strong_curses') ? 2 : 1);
      }
    }
    runtime.afterFirstAttack(u);
  };
  const oldStructure = runtime.attackStructure;
  runtime.attackStructure = function (u, s) {
    if (Math.random() < .25 * runtime.orcCursePower(u, 'blindness')) {
      runtime.consumeOpeningAttack(u);
      runtime.afterFirstAttack(u);
      runtime.spark(u.lane, 'MELLÉ', '#b8a0c6');
      return;
    }
    const dmg = u.damage,
      building = u.buildingDamage,
      weak = 1 - .2 * runtime.orcCursePower(u, 'weakness');
    if (u.key === 'orc_warg' && u.orcSpearReady) {
      u.orcSpearReady = false;
      u.damage *= 2;
      runtime.projectileToStructure(u, s);
    }
    u.damage *= weak;
    u.buildingDamage *= weak;
    try {
      return oldStructure(u, s);
    } finally {
      u.damage = dmg;
      u.buildingDamage = building;
    }
  };
  runtime.orcBeforeCombat13 = function (u, opps) {
    if (u.key !== 'orc_warg' || !u.orcSpearReady || u.cooldown > 0 || !u.alive) return;
    let target = null,
      distance = WARG_THROW_RANGE + 1;
    for (const t of runtime.battleCandidates(opps, u.lane, WARG_THROW_RANGE)) {
      const d = runtime.roadDistance(t, u);
      if (t.alive && d <= WARG_THROW_RANGE && d < distance) {
        target = t;
        distance = d;
      }
    }
    if (target) {
      runtime.attackUnit(u, target);
      u.orcSpearReady = false;
      u.cooldown = u.cooldownTime;
      return;
    }
    const s = runtime.targetStructure(u.side);
    if (runtime.roadDistance(s, u) <= WARG_THROW_RANGE) {
      runtime.attackStructure(u, s);
      u.orcSpearReady = false;
      u.cooldown = u.cooldownTime;
    }
  };
  const oldRadius = runtime.unitDrawRadius;
  runtime.unitDrawRadius = k => k === 'orc_troll' ? 23 : k === 'orc_ram' ? 20 : k === 'orc_warg' ? 17 : oldRadius(k);
  const oldSend = runtime.mpSend;
  runtime.mpSend = function (data) {
    if (data?.type === 'snapshot' && Array.isArray(data.units) && data.units.length && Array.isArray(data.units[0])) {
      const byId = new Map(runtime.state.units.map(u => [u.id, u]));
      data = {
        ...data,
        units: data.units.map(row => {
          const u = byId.get(row[0]);
          const extra={
            positive: u?.orcPositive || {},
            cargo: (u?.orcCargo || []).reduce((n, e) => n + runtime.orcArmyWeight(e, runtime.cityForSide(u.side)), 0),
            feasts: u?.orcFeasts || 0,
            passengers: u?.orcCargo?.length || 0,
            statuses: runtime.unitStatusBadges(u)
          };
          const metadata=extra.cargo||extra.feasts||extra.passengers||extra.statuses.length||Object.values(extra.positive).some(v=>v>0)?extra:null;
          const packed = [...row.slice(0, 13), u?.orcCurses ? Object.keys(u.orcCurses).filter(k => cursed(u, k)) : [], !!u?.orcSpearReady, u?.orcDefianceTime || 0, u?.orcCursePower || {}, metadata, packBattleAttack(u?.roadAttack,runtime.ROAD.clock), !!u?.roadMoving];
          const faction = runtime.mpFactionUnitPayload?.(u);
          if(faction)packed.push(faction);
          return packed;
        })
      };
    }
    return oldSend(data);
  };
  const oldApplyTargets = runtime.mpApplyUnitTargets;
  runtime.mpApplyUnitTargets = function (packed) {
    const raw = runtime.mpRevive(packed),
      out = oldApplyTargets(packed);
    if (Array.isArray(raw) && Array.isArray(raw[0])) {
      const byId = new Map(runtime.state.units.map(u => [u.id, u]));
      for (const row of raw) {
        const u = byId.get(row[0]);
        if (u) {
          u.orcCurses = Object.fromEntries((Array.isArray(row[13]) ? row[13] : []).filter(k => curseNames[k]).map(k => [k, 1]));
          u.orcCursePower = Object.fromEntries(Object.keys(u.orcCurses).map(k => [k, row[16]?.[k] === 2 ? 2 : 1]));
          u.orcSpearReady = !!row[14];
          u.orcDefianceTime = Number(row[15]) || 0;
          u.orcDeathDefiance = u.orcDefianceTime > 0;
          if (u.orcDeathDefiance) u.hp = 0;
        }
      }
    }
    return out;
  };
  const oldScore = runtime.scoreAiChoiceV17;
  runtime.scoreAiChoiceV17 = function (o) {
    if (isOrc(runtime.E) && o.kind === 'building' && newBuildings[o.id]) return {
      orc_warg: 11,
      orc_shaman: 10,
      orc_ram: 9,
      orc_troll: 10
    }[o.id];
    return oldScore(o);
  };
  O.curses = curseNames;
  O.applyCurse = applyCurse;
  O.critMult = critMult;
  O.deathWeight = u => u?.key === 'orc_troll' ? 4 : 1;
  Object.assign(window.__ROADLORDS__, {
    trainingTime: runtime.trainingTime,
    statsFor: runtime.statsFor,
    releaseUnit: runtime.releaseUnit,
    damageUnit: runtime.damageUnit,
    preferredTarget: runtime.preferredTarget,
    unitDrawRadius: runtime.unitDrawRadius
  });
}
