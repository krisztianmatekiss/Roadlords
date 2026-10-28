import { WARG_THROW_RANGE } from '../data/ranged-balance.js';
import { assetUrl } from '../assets/urls.js';
import { ORC_BALANCE } from '../data/combat-balance.js';
export function initializeFactionsOrcRelics(runtime) {
  const O = window.__ROADLORDS_ORCS__,
    orc = O.isOrc,
    own = u => runtime.cityForSide(u.side),
    leg = (c, k) => orc(c) && runtime.hasLeg(c, 'orc_' + k),
    has = (c, b) => c.buildings.some(x => x.type === b);
  const positive = {
    power: 'Erő',
    haste: 'Fürgeség',
    stride: 'Lendület',
    vitality: 'Életerő',
    resistance: 'Ellenállás',
    regen: 'Regeneráció'
  };
  const active = (u, k) => (u.orcPositive?.[k] || 0) > 0;
  function near(u, side, range = 80) {
    const buckets = runtime.battleSearch?.sides[side];
    let list = runtime.state.units;
    if (buckets) {
      list = [];
      for (let k = Math.floor((u.lane - range) / runtime.BATTLE_BUCKET_SIZE); k <= Math.floor((u.lane + range) / runtime.BATTLE_BUCKET_SIZE); k++) if (buckets.has(k)) list.push(...buckets.get(k));
    }
    return list.filter(v => v !== u && v.alive && v.side === side && runtime.roadDistance(v, u) <= range).sort((a, b) => runtime.roadDistance(a, u) - runtime.roadDistance(b, u) || a.id - b.id);
  }
  const gain = (c, n) => {
    for (const r of runtime.RES) c.resources[r] = Math.min(c.caps[r], c.resources[r] + (n[r] || 0));
  };
  const sourceFor = {
    orc_warrior: 'orc_war',
    orc_berserker: 'orc_bers',
    orc_goblin: 'orc_gob',
    orc_warg: 'orc_warg',
    orc_shaman: 'orc_shaman',
    orc_ram: 'orc_ram',
    orc_troll: 'orc_troll'
  };
  const extras = [['crit', 'Kritikus csapások', 'Minden egységed +4 százalékpont kritikus esélyt kap. A kritikus találat dupla sebzést okoz; 100% fölött további duplázás is lehetséges.'], ['blessing', 'Véletlen áldás', 'Az új egységeid +2,5 százalékpont eséllyel kapnak 40 másodperces áldást: +20% sebzést, támadási sebességet, mozgást vagy életerőt; −20% kapott sebzést; vagy fokozatosan gyengülő regenerációt.'], ['refund', 'Kontár építkezés', 'Az új épületek +12 százalékpont eséllyel visszaadják teljes építési árukat. Legfeljebb 60% esély.'], ['loot', 'Hadizsákmány', 'Ellenséges egység halálakor +10 százalékpont eséllyel kapsz 2 fát, 2 követ és 2 élelmet. Legfeljebb 100% esély.'], ['cargo', 'Tágasabb ostromgépek', 'A Trójai kos további 4 gyalogost szállíthat.']];
  for (const [id, name, description] of extras) runtime.NORMAL.push({
    id: 'orc_' + id,
    name,
    description,
    race: 'orc',
    icon: id === 'cargo' ? '⚒' : '✦',
    eligible: c => orc(c) && (id !== 'cargo' || has(c, 'orc_ram') && leg(c, 'trojan')) && (id !== 'refund' || runtime.countNormal(c, 'orc_refund') < 5) && (id !== 'loot' || runtime.countNormal(c, 'orc_loot') < 10) && (id !== 'blessing' || runtime.countNormal(c, 'orc_blessing') < 40)
  });
  const relics = [['last_blood', 'Utolsó vérig', 'A Harcos halálakor sebzése kétszeresével sújtja a közeli ellenfeleket.', 'orc_war'], ['horde_heart', 'Hordaszív', 'A Harcos minden másik Harcos után +3% maximális életerőt kap 80 távolságon belül. A bónusz a közelségükkel együtt változik.', 'orc_war'], ['volley', 'Goblin össztűz', 'A Goblin sebző találatakor minden másik közeli Goblin 3% eséllyel ingyen támadja ugyanazt a célpontot. Ez a támadás duplázódhat, de új össztüzet nem indít.', 'orc_gob'], ['hunt', 'Vérszomjas vadászat', 'A Warglovas minden ölése után ingyen lándzsát dob egy hatótávon belüli ellenfélre.', 'orc_warg'], ['predator', 'Ragadozóösztön', 'A Warglovas a közelben észlelt távolsági ellenfélhez rohan. A Falanxon továbbra sem jut át.', 'orc_warg'], ['curse_master', 'Átokmester', 'A Sámántábor paneljén kiválaszthatod az engedélyezett átkokat. A beállítás minden saját Sámánra érvényes.', 'orc_shaman'], ['curse_spread', 'Átokterjesztés', 'Elátkozott ellenség halálakor negatív állapotai a legközelebbi közeli ellenfélre szállnak. A hátralévő idő nem indul újra.', 'orc_shaman'], ['dispel', 'Átoktörés', 'A Sámán találata eltávolít egy pozitív állapotot. A végleges fejlesztések megmaradnak.', 'orc_shaman'], ['siege_shield', 'Élő ostrompajzs', 'A kos +100% életerőt és −50% sebzést kap. A közeli szövetségesekre érkező sebzés felét átveszi.', 'orc_ram'], ['trojan', 'Trójai kos', 'A helyőrségből legfeljebb 10 gyalogos beszáll a kosba. Toronyhoz érve vagy a kos halálakor kiszállnak. Az utasok is foglalnak sereghelyet.', 'orc_ram'], ['glutton', 'Falánk óriások', 'A Troll minden öléssel +5% maximális életerőt és sebzést szerez haláláig.', 'orc_troll'], ['last_rampage', 'Utolsó tombolás', 'A Troll halálakor maximális életereje 25%-ával sebzi a közeli ellenségeket.', 'orc_troll'], ['united_huts', 'Hordák egyesítése', 'A Kunyhók összes kapacitását a sereghez vagy a helyőrséghez rendelheted. A közös beállítást bármely Kunyhó paneljén módosíthatod.', 'orc_hut'], ['crowded_huts', 'Zsúfolt kunyhók', 'A Kunyhók 1×1 mezősre zsugorodnak. Sereg- és helyőrségbónuszuk megfeleződik.', 'orc_hut'], ['revenge', 'Bosszúhadjárat', 'Minden elvesztett saját torony +10% katonai képzési sebességet ad.'], ['momentum', 'Harci lendület', 'Az egység sebzését növelő fejlesztései a sebzésbónusz felének megfelelő támadási sebességet is adnak. A korábbi fejlesztésekkel is működik.'], ['inherit', 'Örökölt vérszomj', 'Elesett egységed pozitív állapotait a legközelebbi közeli szövetséges örökli. Időtartamuk nem indul újra, azonos hatásaik nem erősítik egymást.'], ['veteran_kills', 'Harcedzett gyilkosok', 'Minden Veteránod ölésenként +10% sebzést kap haláláig.'], ['transfusion', 'Vérátömlesztés', 'Az életlopásból megmaradó felesleges gyógyítás 30%-át a legközelebbi sérült szövetséges kapja.'], ['siege_loot', 'Ostromzsákmány', 'Minden lerombolt ellenséges toronyért ingyen fejleszthetsz egy saját épülettípust. A korábban lerombolt tornyokért is jár.']];
  function buffSource(c) {
    return c.buildings.some(b => ['tavern', 'temple', 'armorsmith', 'alchemist', 'orc_altar', 'orc_overseer'].includes(b.type)) || Object.keys(c.normal || {}).some(k => k === 'orc_blessing' && c.normal[k] > 0) || runtime.state.units.some(u => u.alive && u.side === runtime.sideForCity(c) && (u.key === 'priest' || Object.values(u.orcPositive || {}).some(v => v > 0)));
  }
  function leechSource(c) {
    return runtime.countNormal(c, 'orc_leech') > 0 || runtime.countNormal(c, 'orc_lifesteal') > 0 || has(c, 'orc_altar') || runtime.hasBranch(c, 'orc_overseer', 'blood_horde');
  }
  for (const [id, name, description, building] of relics) {
    runtime.LEGENDARY.push({
      id: 'orc_' + id,
      name,
      description,
      race: 'orc',
      icon: building ? runtime.BUILDINGS[building].icon : '✦',
      eligible: c => orc(c) && (!building || has(c, building)) && (id !== 'dispel' || buffSource(runtime.otherCity(c))) && (id !== 'transfusion' || leechSource(c))
    });
    if (building && runtime.BUILDINGS[building].unit) runtime.PICK_UNIT_IMAGES['orc_' + id] = runtime.BUILDINGS[building].unit;
  }
  runtime.PICK_UNIT_IMAGES.orc_cargo = 'orc_ram';
  const crit = c => {
    const chance = runtime.countNormal(c, 'orc_crit') * .04,
      n = Math.floor(chance + 1e-9);
    return 2 ** (n + (Math.random() < chance - n ? 1 : 0));
  };
  function refresh(u) {
    const hp = u.maxHp ? u.hp / u.maxHp : 1,
      s = runtime.statsFor(own(u), u);
    u.maxHp = s.hp;
    u.hp = Math.min(s.hp, Math.max(0, hp * s.hp));
    u.damage = s.dmg;
    u.buildingDamage = s.buildingDamage;
    u.baseCooldownTime = s.cooldown;
    u.baseSpeed = s.speed;
  }
  function positiveApply(u, key, duration) {
    u.orcPositive ||= {};
    u.orcPositive[key] = key === 'regen' ? (u.orcPositive[key] || 0) + duration : Math.max(u.orcPositive[key] || 0, duration);
    if (key === 'vitality') refresh(u);
  }
  const oldStats = runtime.statsFor;
  runtime.statsFor = function (c, e) {
    const s = oldStats(c, e);
    if (orc(c)) {
      if (e.key === 'orc_ram' && leg(c, 'siege_shield')) {
        s.hp *= 2;
        s.dmg *= .5;
        s.buildingDamage *= .5;
      }
      const kills = 1 + (e.orcFeasts || 0) * .05;
      s.hp *= kills * (e.orcHeart || 1);
      s.dmg *= kills * (1 + (e.orcVeteranKills || 0) * .1);
      s.buildingDamage *= kills * (1 + (e.orcVeteranKills || 0) * .1);
      if (leg(c, 'momentum')) {
        let bonus = .1 * runtime.countNormal(c, e.key + '_dmg');
        if (e.key === 'orc_goblin' && runtime.hasLeg(c, 'orc_gob_bow')) bonus = (1 + bonus) * ORC_BALANCE.goblinBowDamageMultiplier - 1;
        if (e.key === 'orc_ram' && runtime.hasBranch(c, 'orc_ram', 'crusher')) bonus = (1 + bonus) * 7 - 1;
        s.cooldown /= 1 + Math.max(0, bonus) * .5;
      }
    }
    if (active(e, 'vitality')) s.hp *= Math.max(1.2, e.alchemyHpMult || 1) / (e.alchemyHpMult || 1);
    return s;
  };
  const oldSpeed = runtime.effectiveMoveSpeed;
  runtime.effectiveMoveSpeed = (u, c) => oldSpeed(u, c) * (active(u, 'stride') ? Math.max(1.2, u.alchemyMoveMult || 1) / (u.alchemyMoveMult || 1) : 1);
  const oldAS = runtime.orcAttackSpeedMult13;
  runtime.orcAttackSpeedMult13 = function (u) {
    const c = own(u);
    let m = 1;
    if (leg(c, 'momentum')) {
      let base = 1 + .1 * runtime.countNormal(c, u.key + '_dmg');
      if (u.key === 'orc_goblin' && runtime.hasLeg(c, 'orc_gob_bow')) base *= ORC_BALANCE.goblinBowDamageMultiplier;
      if (u.key === 'orc_ram' && runtime.hasBranch(c, 'orc_ram', 'crusher')) base *= 7;
      let extra = (1 + (u.orcFeasts || 0) * .05) * (1 + (u.orcVeteranKills || 0) * .1);
      if (u.key === 'orc_berserker' && runtime.hasLeg(c, 'orc_bers_rage')) extra *= 2 - u.hp / u.maxHp;
      if (u.orcTargetBleeding) {
        if (u.key === 'orc_berserker' && runtime.hasLeg(c, 'orc_bers_blood')) extra *= 2;
        if (u.key === 'orc_goblin' && runtime.hasLeg(c, 'orc_gob_blood')) extra *= 1.25;
      }
      m = (1 + Math.max(0, base * extra - 1) * .5) / (1 + Math.max(0, base - 1) * .5);
    }
    return oldAS(u) * (active(u, 'haste') ? Math.max(1.2, u.alchemyAttackSpeedMult || 1) / (u.alchemyAttackSpeedMult || 1) : 1) * m;
  };
  const oldTime = runtime.trainingTime;
  runtime.trainingTime = (c, b) => oldTime(c, b) / (leg(c, 'revenge') && runtime.BUILDINGS[b.type]?.unit ? 1 + .1 * runtime.towers.filter(t => t.side === runtime.sideForCity(c) && !t.alive).length : 1);
  O.lifeSteal = function (u, amount) {
    if (!u?.alive || u.orcDeathDefiance || amount <= 0) return;
    const c = own(u),
      missing = Math.max(0, u.maxHp - u.hp),
      effective = amount * (u.orcPoison > 0 ? .7 : 1);
    runtime.healUnit(u, amount);
    const excess = Math.max(0, effective - missing);
    if (excess && leg(c, 'transfusion')) {
      const v = runtime.state.units.filter(v => v.alive && v.side === u.side && v !== u && !v.orcDeathDefiance && v.hp < v.maxHp && runtime.roadDistance(v, u) <= 80).sort((a, b) => runtime.roadDistance(a, u) - runtime.roadDistance(b, u))[0];
      if (v) runtime.healUnit(v, excess * .3);
    }
  };
  const oldHeal = runtime.healUnit;
  runtime.healUnit = (u, n) => oldHeal(u, n * (u.orcPoison > 0 ? .7 : 1));
  const oldEntry = runtime.makeEntry;
  runtime.makeEntry = function (c, k, x = {}) {
    const e = oldEntry(c, k, x);
    if (orc(c) && Math.random() < Math.min(1, .025 * runtime.countNormal(c, 'orc_blessing'))) {
      const key = runtime.pick(Object.keys(positive));
      if (key === 'regen') e.orcRegenBlessingTime = 40;else e.orcPositive = {
        [key]: 40
      };
    }
    return e;
  };
  const oldRelease = runtime.releaseUnit;
  runtime.releaseUnit = function (c, e) {
    const u = oldRelease(c, e);
    if (u) {
      u.orcPositive = {
        ...(e.orcPositive || {})
      };
      u.orcRegenBlessingTime = e.orcRegenBlessingTime || 0;
      u.orcCargo = e.orcCargo || [];
      if (active(u, 'vitality')) refresh(u);
    }
    return u;
  };
  const oldPlace = runtime.placeBuilding;
  runtime.placeBuilding = function (c, ...args) {
    const out = oldPlace(c, ...args);
    if (out?.ok && orc(c) && Math.random() < Math.min(ORC_BALANCE.buildingRefundMaximum, ORC_BALANCE.buildingRefundPerStack * runtime.countNormal(c, 'orc_refund'))) {
      gain(c, out.price || out.building.paidCost);
      out.building.paidCost = runtime.C();
      if (c === runtime.P) runtime.toast('Kontár építkezés: az építési ár visszajárt.');
    }
    return out;
  };
  let source = null,
    freeVolley = false,
    draining = false,
    redirecting = false;
  const reactions = [];
  function drain() {
    if (draining) return;
    draining = true;
    try {
      while (reactions.length) reactions.shift()();
    } finally {
      draining = false;
    }
  }
  const oldBaseDamage = runtime.attackBaseDamage;
  runtime.attackBaseDamage = function (u, t, m = 1) {
    return oldBaseDamage(u, t, m) * (active(u, 'power') ? Math.max(1.2, u.alchemyDamageMult || 1) / (u.alchemyDamageMult || 1) : 1) * (orc(own(u)) && !(u.key === 'orc_warg' && (u.orcUsingSpear || runtime.hasLeg(own(u), 'orc_warg_instinct'))) ? crit(own(u)) : 1);
  };
  const potionFields = {
    damage: 'alchemyDamageMult',
    hp: 'alchemyHpMult',
    attack_speed: 'alchemyAttackSpeedMult',
    movement: 'alchemyMoveMult',
    regen: 'alchemyRegen'
  };
  function dispel(t) {
    const key = Object.keys(t.orcPositive || {}).find(k => active(t, k));
    if (key) {
      delete t.orcPositive[key];
      if (key === 'regen') t.orcRegenBlessingTime = 0;
      const potion = {
        power: 'damage',
        vitality: 'hp',
        haste: 'attack_speed',
        stride: 'movement',
        regen: 'regen'
      }[key];
      if (potion) {
        t[potionFields[potion]] = potion === 'regen' ? 0 : 1;
        t.alchemyEffects = (t.alchemyEffects || []).filter(k => k !== potion);
        t.alchemyEffect = t.alchemyEffects[0] || null;
      }
      refresh(t);
      return;
    }
    if (t.orcRegenBlessingTime > 0) {
      t.orcRegenBlessingTime = 0;
      t.alchemyRegen = 0;
      t.alchemyEffects = (t.alchemyEffects || []).filter(k => k !== 'regen');
      t.alchemyEffect = t.alchemyEffects[0] || null;
      return;
    }
    const potion = (t.alchemyEffects || []).find(k => potionFields[k]);
    if (potion) {
      t[potionFields[potion]] = potion === 'regen' ? 0 : 1;
      t.alchemyEffects = t.alchemyEffects.filter(k => k !== potion);
      t.alchemyEffect = t.alchemyEffects[0] || null;
      refresh(t);
      return;
    }
    for (const [field, reset] of [['blessingTime', () => {}], ['attackSpeedBuffTime', () => t.attackSpeedMult = 1], ['speedBuffTime', () => {
      t.speedMult = 1;
      t.rallySpeedReady = false;
    }], ['tempShieldTime', () => t.tempShield = 0]]) if (t[field] > 0) {
      t[field] = 0;
      reset();
      return;
    }
    if (t.firstHitsRemaining > 0) {
      t.firstHitsRemaining = 0;
      return;
    }
    if (t.shield > 0) {
      t.shield = 0;
      return;
    }
    if (t.permanentTavern) {
      t.permanentTavern = false;
      refresh(t);
    }
  }
  function killCredit(u) {
    if (!u?.alive) return;
    const c = own(u);
    let changed = false;
    if (u.key === 'orc_troll' && leg(c, 'glutton')) {
      u.orcFeasts = (u.orcFeasts || 0) + 1;
      changed = true;
    }
    if (u.veteran && leg(c, 'veteran_kills')) {
      u.orcVeteranKills = (u.orcVeteranKills || 0) + 1;
      changed = true;
    }
    if (changed) refresh(u);
    if (u.key === 'orc_warg' && leg(c, 'hunt') && !u.orcSpearRainActive) reactions.push(() => {
      if (!u.alive) return;
      const t = near(u, u.side === 'player' ? 'enemy' : 'player', WARG_THROW_RANGE)[0];
      if (t) {
        u.orcSpearReady = true;
        runtime.attackUnit(u, t, {
          orcHunt: true
        });
        u.orcSpearReady = false;
      }
    });
  }
  const oldDamage = runtime.damageUnit;
  runtime.damageUnit = function (t, amount, type) {
    const attacker = source,
      was = t.alive;
    let moved = 0;
    if (!redirecting && t.alive && t.key !== 'orc_ram' && leg(own(t), 'siege_shield')) {
      const ram = near(t, t.side, 80).find(v => v.key === 'orc_ram');
      if (ram) {
        redirecting = true;
        try {
          moved = runtime.damageUnit(ram, amount * .5, type);
        } finally {
          redirecting = false;
        }
        amount *= .5;
      }
    }
    source = null;
    let actual;
    try {
      actual = oldDamage(t, amount * (active(t, 'resistance') ? .8 : 1), type);
    } finally {
      source = attacker;
    }
    if (attacker && attacker.side !== t.side) {
      if (was && !t.alive) killCredit(attacker);
      if (actual > 0 && attacker.key === 'orc_goblin' && !freeVolley && leg(own(attacker), 'volley')) for (const g of near(attacker, attacker.side, 115)) if (g.key === 'orc_goblin' && runtime.roadDistance(g, t) <= g.range && Math.random() < .03) reactions.push(() => {
        if (g.alive && t.alive) runtime.attackUnit(g, t, {
          orcVolley: true
        });
      });
      if (attacker.key === 'orc_shaman' && t.alive && !t.orcLastEvaded && leg(own(attacker), 'dispel')) dispel(t);
    }
    return actual;
  };
  const oldAttack = runtime.attackUnit;
  runtime.attackUnit = function (u, t, opts = {}) {
    const before = source,
      volley = freeVolley,
      spear = u?.orcUsingSpear;
    source = u;
    u.orcTargetBleeding = (t?.orcBleed || 0) > 0;
    freeVolley = !!opts.orcVolley;
    u.orcUsingSpear = !!u.orcSpearReady;
    try {
      return oldAttack(u, t, opts);
    } finally {
      source = before;
      freeVolley = volley;
      u.orcUsingSpear = spear;
      if (!source) drain();
    }
  };
  const oldStructure = runtime.attackStructure;
  runtime.attackStructure = function (u, t) {
    const wasAlive = !t.capital && t.alive,
      d = u.damage,
      b = u.buildingDamage,
      m = (active(u, 'power') ? Math.max(1.2, u.alchemyDamageMult || 1) / (u.alchemyDamageMult || 1) : 1) * (orc(own(u)) ? crit(own(u)) : 1);
    u.damage *= m;
    u.buildingDamage *= m;
    try {
      return oldStructure(u, t);
    } finally {
      u.damage = d;
      u.buildingDamage = b;
      if (wasAlive && !t.alive) t.orcKillerSide = u.side;
    }
  };
  function unload(u) {
    const cargo = u.orcCargo || [];
    u.orcCargo = [];
    const c = own(u);
    for (const e of cargo) {
      const v = runtime.releaseUnit(c, {
        ...e,
        orcDisembarking: true
      });
      if(!v)continue;
      v.lane = u.lane;
      v.cooldown = Math.max(v.cooldown, .2);
    }
  }
  const oldKill = runtime.killUnit;
  runtime.killUnit = function (u, combat = true) {
    if (!u?.alive) return;
    const savedCurseSources = runtime.auditCurseCopy(u),
      savedBurns = runtime.auditBurnCopy(u),
      savedCurses = {
        ...u.orcCurses
      },
      savedPower = {
        ...u.orcCursePower
      },
      savedPositive = {
        ...u.orcPositive
      },
      burn = [u.burnTime, u.burnDps],
      bleed = u.orcBleed,
      poison = u.orcPoison;
    const result = oldKill(u, combat);
    if (u.alive || !combat) return result;
    const c = own(u),
      opponent = runtime.otherCity(c);
    if (orc(opponent) && Math.random() < Math.min(1, .1 * runtime.countNormal(opponent, 'orc_loot'))) gain(opponent, runtime.C(2, 2, 2));
    if (u.orcCargo?.length) unload(u);
    if (leg(c, 'inherit')) {
      const v = near(u, u.side, 80)[0];
      if (v) {
        for (const [k, time] of Object.entries(savedPositive)) if (time > 0) positiveApply(v, k, time);
        for (const [timer, value] of [['blessingTime', null], ['attackSpeedBuffTime', 'attackSpeedMult'], ['speedBuffTime', 'speedMult']]) if (u[timer] > 0) {
          v[timer] = Math.max(v[timer] || 0, u[timer]);
          if (value) v[value] = Math.max(v[value] || 1, u[value] || 1);
        }
        for (const k of u.alchemyEffects || []) if (potionFields[k]) {
          v.alchemyEffects ||= [];
          if (!v.alchemyEffects.includes(k)) v.alchemyEffects.push(k);
          v[potionFields[k]] = k === 'regen' ? (v.alchemyRegen || 0) + (u.alchemyRegen || 0) : Math.max(v[potionFields[k]] || 1, u[potionFields[k]] || 1);
        }
        v.alchemyEffect = v.alchemyEffects?.[0] || v.alchemyEffect;
        runtime.auditInheritExtras(u, v);
        refresh(v);
      }
    }
    if (leg(opponent, 'curse_spread') && Object.values(savedCurses).some(v => v > 0)) {
      const v = near(u, u.side, 80)[0];
      if (v) {
        for (const [k, sources] of Object.entries(savedCurseSources)) for (const [power, time] of Object.entries(sources)) if (time > 0) O.applyCurse(v, k, time, +power);
        v.orcBleed = (v.orcBleed || 0) + (bleed || 0);
        v.orcPoison = (v.orcPoison || 0) + (poison || 0);
        if (savedBurns.length) runtime.auditTransferBurn(v, savedBurns);
        v.stunTime = Math.max(v.stunTime || 0, u.stunTime || 0);
        v.freezeFollow = Math.max(v.freezeFollow || 0, u.freezeFollow || 0);
        v.freezeImmunity = Math.max(v.freezeImmunity || 0, u.freezeImmunity || 0);
        v.slowTime = Math.max(v.slowTime || 0, u.slowTime || 0);
        v.slowMult = Math.min(v.slowMult || 1, u.slowMult || 1);
      }
    }
    const amount = u.key === 'orc_warrior' && leg(c, 'last_blood') ? u.damage * 2 : u.key === 'orc_troll' && leg(c, 'last_rampage') ? u.maxHp * .25 : 0;
    if (amount) reactions.push(() => {
      for (const v of near(u, u.side === 'player' ? 'enemy' : 'player', u.key === 'orc_warrior' ? u.range : 80)) runtime.damageUnit(v, amount, 'physical');
      runtime.addImpactFx(u.lane, u.offset, 'boom');
    });
    if (!source) drain();
    return result;
  };
  const oldStatus = runtime.updateUnitStatuses;
  runtime.updateUnitStatuses = function (u, dt) {
    const vitality = active(u, 'vitality');
    for (const k of Object.keys(u.orcPositive || {})) if (k !== 'regen') u.orcPositive[k] = Math.max(0, u.orcPositive[k] - dt);
    if (vitality && !active(u, 'vitality')) refresh(u);
    if ((u.orcPositive?.regen || 0) + (u.alchemyRegen || 0) > 0) {
      u.orcRegenClock = (u.orcRegenClock || 0) + dt;
      while (u.orcRegenClock >= 1 && u.alive) {
        u.orcRegenClock--;
        const stacks = (u.orcPositive?.regen || 0) + (u.alchemyRegen || 0);
        if (stacks <= 0) break;
        runtime.healUnit(u, stacks);
        if (u.alchemyRegen > 0) u.alchemyRegen = Math.max(0, u.alchemyRegen - 1);else u.orcPositive.regen = Math.max(0, u.orcPositive.regen - 1);
      }
      if (!u.alchemyRegen) {
        u.alchemyEffects = (u.alchemyEffects || []).filter(k => k !== 'regen');
        u.alchemyEffect = u.alchemyEffects[0] || null;
      }
    } else u.orcRegenClock = 0;
    if (u.orcPoison > 0) {
      u.orcPoisonClock = (u.orcPoisonClock || 0) + dt;
      while (u.orcPoisonClock >= 1 && u.orcPoison > 0 && u.alive) {
        u.orcPoisonClock--;
        u.hp = Math.max(1, u.hp - u.orcPoison);
        u.orcPoison--;
      }
    }
    oldStatus(u, dt);
    if (u.alive && u.orcCargo?.length) {
      const t = runtime.targetStructure(u.side);
      if (runtime.roadDistance(u, t) <= u.range + 10) unload(u);
    }
  };
  const oldBattle = runtime.updateBattle;
  runtime.updateBattle = function (dt) {
    for (const side of ['player', 'enemy']) {
      const c = runtime.cityForSide(side),
        list = runtime.state.units.filter(u => u.alive && u.side === side && u.key === 'orc_warrior').sort((a, b) => a.lane - b.lane);
      let l = 0,
        r = 0;
      for (let i = 0; i < list.length; i++) {
        while (list[l].lane < list[i].lane - 80) l++;
        while (r < list.length && list[r].lane <= list[i].lane + 80) r++;
        const m = leg(c, 'horde_heart') ? 1 + .03 * (r - l - 1) : 1;
        if ((list[i].orcHeart || 1) !== m) {
          list[i].orcHeart = m;
          refresh(list[i]);
        }
      }
    }
    return oldBattle(dt);
  };
  const oldBefore = runtime.orcBeforeCombat13;
  runtime.orcBeforeCombat13 = function (u, opps, dt) {
    u.orcPredatorMoved = false;
    oldBefore(u, opps, dt);
    if (!u.alive || u.key !== 'orc_warg' || !leg(own(u), 'predator')) return;
    const t = near(u, u.side === 'player' ? 'enemy' : 'player', 160).find(v => v.tags?.includes('ranged') && (!runtime.roadCanPursue || runtime.roadCanPursue(u,v)));
    if (!t) return;
    u.orcPredatorTarget = t.id;
    if (runtime.roadDistance(t, u) > u.range) {
      const dir = Math.sign(t.lane - u.lane);
      let next = u.lane + dir * runtime.effectiveMoveSpeed(u, own(u)) * dt;
      for (const v of opps) if (v.alive && v.phalanx && Math.sign(v.lane - u.lane) === dir && runtime.roadDistance(v, u) < Math.abs(next - u.lane) + 20) next = u.lane;
      runtime.setBattleLane(u, next);
      u.orcPredatorMoved = true;
    }
  };
  const oldTarget = runtime.preferredTarget;
  runtime.preferredTarget = function (u, opps) {
    if (u.key === 'orc_warg' && leg(own(u), 'predator')) {
      const t = opps.find(v => v.id === u.orcPredatorTarget && v.alive && runtime.roadDistance(v, u) <= u.range);
      if (t) return t;
    }
    return oldTarget(u, opps);
  };
  const oldWave = runtime.openWave;
  runtime.openWave = function (c) {
    if (leg(c, 'trojan')) {
      for (const ram of c.garrison.filter(e => e.key === 'orc_ram')) {
        ram.orcCargo ||= [];
        const cap = 10 + 4 * runtime.countNormal(c, 'orc_cargo');
        let slots = ram.orcCargo.reduce((n, e) => n + runtime.orcArmyWeight(e, c), 0);
        for (let i = 0; i < c.garrison.length && ram.orcCargo.length < cap;) {
          const e = c.garrison[i],
            weight = runtime.orcArmyWeight(e, c);
          if (e !== ram && ['infantry', 'magic'].includes(runtime.UNITS[e.key]?.cat) && 1 + slots + weight <= c.armyCap) {
            ram.orcCargo.push(...c.garrison.splice(i, 1));
            slots += weight;
          } else i++;
        }
      }
    }
    return oldWave(c);
  };
  const oldWeight = runtime.orcArmyWeight;
  runtime.orcArmyWeight = function (e, c = null) {
    return oldWeight(e, c) + (e?.orcCargoWeight || 0) + (e?.orcCargo || []).reduce((n, v) => n + oldWeight(v, c), 0);
  };
  const oldReserve = runtime.orcReserveWeight;
  runtime.orcReserveWeight = (e, c) => oldReserve(e, c) + (e?.orcCargo || []).reduce((n, v) => n + oldReserve(v, c), 0);
  for (const k of ['orcCurseSelection', 'orcHutMode']) if (!runtime.MP_STRATEGY_KEYS.includes(k)) runtime.MP_STRATEGY_KEYS.push(k);
  O.curseSelection = c => {
    const keys = Object.keys(O.curses),
      allowed = Array.isArray(c.orcCurseSelection) ? c.orcCurseSelection.filter(k => keys.includes(k)) : keys;
    if (leg(c, 'curse_master') && allowed.length) {
      if (runtime.hasBranch(c, 'orc_shaman', 'double_curse') && allowed.length === 1) allowed.push(keys.find(k => k !== allowed[0]));
      return allowed;
    }
    return keys;
  };
  const oldRecompute = runtime.recomputeCity;
  runtime.recomputeCity = function (c, preserve = true) {
    const out = oldRecompute(c, preserve);
    if (!orc(c)) return out;
    let army = 0,
      reserve = 0;
    for (const b of runtime.buildingOf(c, 'orc_hut')) {
      army += runtime.v4LevelValue(b.level, [20, 30, 40, 60]);
      reserve += runtime.v4LevelValue(b.level, [20, 30, 60, 60]);
    }
    const half = leg(c, 'crowded_huts') ? .5 : 1,
      command = runtime.hasBranch(c, 'keep', 'orc_command') ? 2 : 1;
    c.armyCap -= army;
    c.garrisonCap -= reserve * command;
    if (leg(c, 'united_huts')) {
      if (c.orcHutMode === 'reserve') c.garrisonCap += (army + reserve) * half * command;else c.armyCap += (army + reserve) * half;
    } else {
      c.armyCap += army * half;
      c.garrisonCap += reserve * half * command;
    }
    return out;
  };
  function installControls() {
    for (const win of document.querySelectorAll('.buildingInspectorWindow')) {
      const b = runtime.getBuilding(runtime.P, win.dataset.id),
        el = win.querySelector('.inspectorCard');
      if (!b || !el) continue;
      el.querySelector('.orcControls')?.remove();
      const block = document.createElement('div');
      block.className = 'orcControls';
      if (b.type === 'orc_shaman' && leg(runtime.P, 'curse_master')) {
        block.innerHTML = '<b>Használható átkok</b><p>Minden saját Sámán ezt a beállítást használja.</p>' + Object.entries(O.curses).map(([k, n]) => `<label><input type="checkbox" data-curse="${k}" ${O.curseSelection(runtime.P).includes(k) ? 'checked' : ''}> ${n}</label>`).join('');
        block.onchange = e => {
          const keys = [...block.querySelectorAll('input:checked')].map(x => x.dataset.curse),
            min = runtime.hasBranch(runtime.P, 'orc_shaman', 'double_curse') ? 2 : 1;
          if (keys.length < min) {
            e.target.checked = true;
            runtime.toast(`Legalább ${min} átkot engedélyezz.`);
            return;
          }
          runtime.P.orcCurseSelection = keys;
          runtime.mpSendStrategy(true);
          runtime.renderStatic();
        };
      }
      if (b.type === 'orc_hut' && leg(runtime.P, 'united_huts')) {
        block.innerHTML = '<b>Kunyhók közös kapacitása</b><select><option value="army">Teljes bónusz a sereghez</option><option value="reserve">Teljes bónusz a helyőrséghez</option></select>';
        block.querySelector('select').value = runtime.P.orcHutMode || 'army';
        block.onchange = e => {
          runtime.P.orcHutMode = e.target.value;
          runtime.recomputeCity(runtime.P, true);
          runtime.mpSendStrategy(true);
          runtime.renderStatic();
        };
      }
      if (block.innerHTML) el.insertBefore(block, el.querySelector('.spawnCompact') || el.querySelector('.iactions'));
    }
  }
  const oldInspector = runtime.renderInspector;
  runtime.renderInspector = function () {
    oldInspector();
    installControls();
  };
  const oldStatic = runtime.renderStatic;
  runtime.renderStatic = function () {
    const result = oldStatic();
    installControls();
    return result;
  };
  const style = document.createElement('style');
  style.textContent = "@import url(\"" + (assetUrl("styles/features/factions-orc-relics-40.css") + "\");");
  document.head.appendChild(style);
  const oldRoll = runtime.rollPickTier;
  runtime.rollPickTier = (c, s) => s === 'orc_siege_reward' ? {
    tier: 'rare',
    subtype: 'upgrade'
  } : oldRoll(c, s);
  const oldOptions = runtime.makeChoiceOptions;
  runtime.makeChoiceOptions = function (c, s, ...args) {
    if (s === 'orc_siege_reward') return runtime.buildingUpgradePool(c).sort(() => Math.random() - .5).slice(0, 4);
    return oldOptions(c, s, ...args);
  };
  const oldContext = runtime.choiceContextForPlayer;
  runtime.choiceContextForPlayer = function () {
    const x = oldContext();
    if (x.source === 'orc_siege_reward') {
      x.doubleTake = false;
      x.remaining = 1;
      x.kicker = 'OSTROMZSÁKMÁNY';
      x.title = 'Válassz ingyenes épületfejlesztést';
      x.desc = 'Egy meglévő épülettípusod egy szintet fejlődik.';
    }
    return x;
  };
  const oldTick = runtime.tick;
  runtime.tick = function (dt) {
    const out = oldTick(dt);
    if ((!runtime.MP.enabled || runtime.MP.role === 'host') && runtime.state.running && !runtime.state.ended && !runtime.state.pregame && !runtime.state.modal && !runtime.state.startChoices && !runtime.state.pendingChoices.length && !runtime.MP.guestChoicePending) for (const c of [runtime.P, runtime.E]) if (leg(c, 'siege_loot')) {
      const count = runtime.towers.filter(t => t.orcKillerSide === runtime.sideForCity(c) && !t.alive).length,
        used = c.orcSiegeRewards || 0;
      if (count > used && runtime.buildingUpgradePool(c).length) {
        c.orcSiegeRewards = used + 1;
        if (c === runtime.P) runtime.queueChoice('orc_siege_reward');else runtime.grantEnemyPick('orc_siege_reward');
        break;
      }
    }
    return out;
  };
  const oldGuest = runtime.mpApplyGuestStrategy;
  runtime.mpApplyGuestStrategy = function (data, seq) {
    if (data) {
      data = {
        ...data
      };
      delete data.orcSiegeRewards;
      if (Array.isArray(data.orcCurseSelection)) data.orcCurseSelection = data.orcCurseSelection.filter(k => Object.hasOwn(O.curses, k));
      if (!['army', 'reserve'].includes(data.orcHutMode)) data.orcHutMode = 'army';
    }
    return oldGuest(data, seq);
  };
  const oldClear = runtime.clearTerrain;
  runtime.clearTerrain = function (c, row, col, ai = false) {
    const t = runtime.terrainAt(c, row, col);
    if (!['forest', 'quarry'].includes(t?.type)) return oldClear(c, row, col, ai);
    const price = t.type === 'forest' ? runtime.C(20, 0, 0) : runtime.C(0, 20, 0);
    if (!runtime.canPay(c, price)) {
      if (!ai) runtime.toast('Nincs elég nyersanyag a bontáshoz.');
      return false;
    }
    runtime.pay(c, price);
    runtime.setTerrain(c, row, col, null);
    if (!ai) {
      runtime.renderStatic();
      runtime.mpSendStrategy(true);
    }
    return true;
  };
  const oldRender = runtime.renderCity;
  runtime.renderCity = function (container, c, interactive) {
    oldRender(container, c, interactive);
    if (!interactive) return;
    for (const plot of container.querySelectorAll('.plot.forest,.plot.quarry')) plot.onclick = () => {
      if (runtime.state.selectedBuild) {
        runtime.toast('Előbb bontsd el a tereptárgyat.');
        return;
      }
      const row = +plot.dataset.r,
        col = +plot.dataset.c,
        t = runtime.terrainAt(c, row, col);
      if (!t) return;
      document.querySelector('#orcTerrainDialog')?.remove();
      const el = document.createElement('section');
      el.id = 'orcTerrainDialog';
      el.className = 'orcTerrainDialog';
      el.innerHTML = `<div class="inspectorCard"><h3>${t.type === 'forest' ? 'Erdő' : 'Kőlelőhely'}</h3><p>A bontás után a mező beépíthető. A szomszédos termelők elveszítik az innen kapott bónuszt.</p><button id="orcTerrainClear">Bontás · 20 ${t.type === 'forest' ? 'fa' : 'kő'}</button><button id="orcTerrainCancel">Mégse</button></div>`;
      document.body.appendChild(el);
      el.querySelector('#orcTerrainClear').onclick = () => {
        if (runtime.clearTerrain(c, row, col)) el.remove();
      };
      el.querySelector('#orcTerrainCancel').onclick = () => el.remove();
    };
  };
  const oldTargets = runtime.mpApplyUnitTargets;
  runtime.mpApplyUnitTargets = function (packed) {
    const rows = runtime.mpRevive(packed),
      out = oldTargets(packed),
      map = new Map(runtime.state.units.map(u => [u.id, u]));
    for (const row of rows || []) {
      if (!Array.isArray(row)) continue;
      const u = map.get(row[0]),
        extra = row[17] || {};
      if (u) {
        u.orcPositive = extra.positive || {};
        u.orcCargoWeight = extra.cargo || 0;
        u.orcCargoCount = extra.passengers || 0;
        u.orcFeasts = extra.feasts || 0;
        u.syncedStatusBadges = extra.statuses || [];
      }
    }
    return out;
  };
  const oldDraw = runtime.drawUnit;
  runtime.drawUnit = function (u) {
    oldDraw(u);
    if (!u.alive) return;
    const p = runtime.pointAt(u.lane, u.offset || 0);
    runtime.ctx.save();
    const cargo = u.orcCargoCount || u.orcCargo?.length || 0;
    if (cargo) {
      runtime.ctx.fillStyle = '#f5d78e';
      runtime.ctx.font = 'bold 10px system-ui';
      runtime.ctx.textAlign = 'center';
      runtime.ctx.fillText(String(cargo), p.x, p.y - 19);
    }
    runtime.ctx.restore();
  };
  const oldRows = runtime.buildingEffectRows;
  runtime.buildingEffectRows = function (c, b) {
    const rows = oldRows(c, b);
    if (b.type === 'orc_hut') {
      const half = leg(c, 'crowded_huts') ? .5 : 1,
        a = runtime.v4LevelValue(b.level, [20, 30, 40, 60]) * half,
        r = runtime.v4LevelValue(b.level, [20, 30, 60, 60]) * half;
      for (const row of rows) {
        if (row[0] === 'Sereglimit') row[1] = '+' + (leg(c, 'united_huts') ? c.orcHutMode === 'reserve' ? 0 : a + r : a);
        if (row[0] === 'Helyőrséglimit') row[1] = '+' + (leg(c, 'united_huts') ? c.orcHutMode === 'reserve' ? a + r : 0 : r);
      }
    }
    if (b.type === 'orc_shaman' && leg(c, 'curse_master')) rows.push(['Engedélyezett átkok', O.curseSelection(c).map(k => O.curses[k]).join(', ')]);
    if (b.type === 'orc_hut' && leg(c, 'united_huts')) rows.push(['Összevont kapacitás', c.orcHutMode === 'reserve' ? 'Helyőrség' : 'Sereg']);
    if (b.type === 'orc_ram' && leg(c, 'trojan')) rows.push(['Szállítókapacitás', String(10 + 4 * runtime.countNormal(c, 'orc_cargo'))]);
    return rows;
  };
  O.positive = positive;
  O.positiveApply = positiveApply;
  O.unload = unload;
  O.dispel = dispel;
  O.refresh = refresh;
  Object.assign(window.__ROADLORDS__, {
    statsFor: runtime.statsFor,
    makeEntry: runtime.makeEntry,
    releaseUnit: runtime.releaseUnit,
    damageUnit: runtime.damageUnit,
    attackUnit: runtime.attackUnit,
    killUnit: runtime.killUnit,
    updateBattle: runtime.updateBattle,
    trainingTime: runtime.trainingTime,
    placeBuilding: runtime.placeBuilding,
    recomputeCity: runtime.recomputeCity,
    renderInspector: runtime.renderInspector,
    renderCity: runtime.renderCity,
    buildingEffectRows: runtime.buildingEffectRows,
    clearTerrain: runtime.clearTerrain
  });
}
