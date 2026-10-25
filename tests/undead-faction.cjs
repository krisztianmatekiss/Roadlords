const { chromium } = require('playwright'),
  assert = require('node:assert/strict'),
  fs = require('node:fs');
const URL = process.env.ROADLORDS_TEST_URL || 'http://127.0.0.1:4173/Roadlords/';
(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium',
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  });
  const report = { checks: [], errors: [] };
  const check = (name, value) => {
    assert(value, name);
    report.checks.push(name);
    console.log('PASS', name);
  };
  try {
    const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
    await page.route('https://**/*', (r) => r.abort());
    page.on('pageerror', (e) => report.errors.push(e.message));
    await page.goto(URL);
    await page.waitForFunction(() => !!window.__ROADLORDS_UNDEAD__);
    await page.locator('.menuBrand').click();
    await page.waitForTimeout(900);
    await page.locator('#mpSolo').click();
    await page.locator('#soloRace').selectOption('undead');
    await page.locator('#aiRace').selectOption('orc');
    await page.locator('#raceContinue').click();
    await page.waitForFunction(()=>__ROADLORDS_RUNTIME__.state.pregame);
    check(
      'The real solo race selector initializes Undead against Orcs with 140 Souls and 2000 capital HP',
      await page.evaluate(() => {
        const R = __ROADLORDS_RUNTIME__;
        return (
          R.P.race === 'undead' &&
          R.E.race === 'orc' &&
          R.P.hp === 2000 &&
          R.P.resources.wood === 140 &&
          R.P.resources.stone === 0 &&
          R.P.resources.food === 0
        );
      }),
    );
    const resourceFree = () => page.evaluate(() =>
      !__ROADLORDS_RUNTIME__.P.terrain.some((t) =>
        ['forest', 'quarry', 'fertile'].includes(t?.type)),
    );
    check('Undead solo cities start without forest, quarry or fertile terrain', await resourceFree());
    await page.locator('#pregameRefreshLeft').click();
    check('Undead city rerolls also exclude resource terrain', await resourceFree());
    check(
      'Undead generation handles enemy cities and the fallback layout while preserving ruins',
      await page.evaluate(() => {
        const R = __ROADLORDS_RUNTIME__;
        const city = { ...R.E, race: 'undead' };
        const valid = () =>
          !city.terrain.some((t) => ['forest', 'quarry', 'fertile'].includes(t?.type)) &&
          city.terrain.filter((t) => t?.type === 'ruin').length === 10;
        R.generateTerrain(city, 10);
        const normal = valid();
        const oldValid = R.terrainLayoutValid;
        try {
          R.terrainLayoutValid = () => false;
          R.generateTerrain(city, 10);
          return normal && valid() &&
            city.terrain.some((t) => t?.type === 'foundation') &&
            city.terrain.some((t) => t?.type === 'ancient');
        } finally {
          R.terrainLayoutValid = oldValid;
        }
      }),
    );
    await page.locator('#pregameReady').click();
    for (let i = 0; i < 4; i++) {
      await page.waitForFunction(() => !!__ROADLORDS_RUNTIME__.state.choiceContext);
      await page.evaluate(() => {
        const R = __ROADLORDS_RUNTIME__;
        R.choose(R.state.choiceContext.opts[0], 0);
        for (let j = 0; j < 160 && !R.state.modal; j++) R.tick(1 / 30);
      });
    }
    check(
      'All four starter choices finish and the HUD displays Souls without a storage cap',
      await page.evaluate(() => {
        const R = __ROADLORDS_RUNTIME__;
        R.state.running = false;
        R.renderStatic();
        return (
          R.state.startChoices === 0 &&
          document.body.classList.contains('undead-player') &&
          document.querySelector('#woodStock').closest('.res').querySelector('.resourceIcon').alt==='Lélek' &&
          !document.querySelector('#woodStock').textContent.includes('/')
        );
      }),
    );
    await page.evaluate(() => {
      const R = __ROADLORDS_RUNTIME__;
      window.undReset = (race = 'undead') => {
        R.MP.enabled = false;
        R.ROAD.test = false;
        R.ROAD.paused = true;
        R.state.running = false;
        R.state.modal = false;
        R.state.pregame = false;
        R.state.ended = false;
        R.state.startChoices = 0;
        R.state.time = 0;
        R.state.combatStep = 0;
        R.state.pendingChoices = [];
        R.roadResetCity(R.P, race);
        R.roadResetCity(R.E, 'human');
        R.state.units = [];
        R.ROAD.pending = [];
        R.ROAD.dead = [];
        R.ROAD.clock = 0;
        for (const t of [...R.towers, ...R.capitalTowers]) t.alive = false;
        R.roadRefreshFrontiers();
        R.P.gateMode = 'closed';
        R.P.unlocked = new Set(Object.keys(__ROADLORDS_UNDEAD__.buildings));
        R.P.resources = R.C(10000, 0, 0);
        return R.P;
      };
      window.undPut = (type, row, col, rotation = 0) => {
        const out = R.placeBuilding(R.P, type, row, col, rotation);
        if (!out.ok) throw Error(type + ': ' + out.reason);
        return R.P.buildings.at(-1);
      };
      window.undUnit = (key, side = 'player', lane = 2400, offset = 0, extra = {}) => {
        const c = side === 'player' ? R.P : R.E,
          u = R.releaseUnit(c, R.makeEntry(c, key, extra));
        R.setBattleLane(u, lane);
        u.offset = offset;
        u.cooldown = 99;
        u.baseSpeed = u.speed = 0.0001;
        R.roadReindex();
        return u;
      };
      window.undHit = (u, v) => {
        u.cooldown = 0;
        R.attackUnit(u, v);
        const a = u.roadAttack;
        if (!a) throw Error('Attack was not queued');
        const hp = v.hp;
        R.ROAD.clock = a.hit - 0.001;
        R.roadImpacts();
        const early = v.hp === hp;
        R.ROAD.clock = a.hit + 0.001;
        R.roadImpacts();
        return {
          early,
          damage: hp - v.hp,
          source: u.key,
          target: v.key,
          sourceDamage: u.damage,
          meta: { ...a },
          tags: u.tags,
          alive: [u.alive, v.alive],
          distance: R.roadDistance(u, v),
          range: u.range,
          shield: v.shield,
          pending: R.ROAD.pending.length,
          attackCount: u.attackCount,
          evaded: v.orcLastEvaded,
        };
      };
    });
    const data = await page.evaluate(() => {
      const R = __ROADLORDS_RUNTIME__,
        c = undReset(),
        B = __ROADLORDS_UNDEAD__.buildings;
      const total = Object.keys(B).length,
        units = Object.keys(__ROADLORDS_UNDEAD__.units).length;
      const normals = R.NORMAL.filter((o) => o.race === 'undead'),
        legends = R.LEGENDARY.filter((o) => o.race === 'undead');
      const previews = normals.map((o) => R.upgradeCopyPreview(c, { ...o, kind: 'normal' }));
      const noLeaks =
        R.buildingUnlockPool(c).every((o) => B[o.id]) &&
        R.eligibleNormal(c).every((o) => o.race === 'undead') &&
        R.eligibleLegendary(c).every((o) => o.race === 'undead');
      const capital = [];
      for (let level = 1; level <= 4; level++) {
        R.setBuildingLevel(c, 'keep', level, level === 4 ? 'dead_realm' : null);
        R.recomputeCity(c, false);
        capital.push([c.hp, c.armyCap, R.productionRates(c).wood, R.gateReleaseRate(c)]);
      }
      c.normal = { skeleton_common_hp: 2, skeleton_common_damage: 1 };
      const base = R.statsFor(c, { key: 'und_skeleton' }),
        archer = R.statsFor(c, { key: 'und_skeleton_archer' }),
        elite = R.statsFor(c, { key: 'und_skeleton', undElite: true });
      return {
        total,
        units,
        normal: normals.length,
        legend: legends.length,
        previews: previews.every((p) => p.description?.length > 10 && p.rows.length > 0),
        noLeaks,
        capital,
        base,
        archer,
        elite,
      };
    });
    report.data = data;
    check(
      'The workbook registers exactly 20 buildings, 7 unit variants, 29 common and 20 legendary upgrades',
      data.total === 20 && data.units === 7 && data.normal === 29 && data.legend === 20,
    );
    check(
      'Faction-specific draft pools do not leak Human or Orc cards; every common has a numeric preview',
      data.noLeaks && data.previews,
    );
    check(
      'All four capital levels use the workbook HP, income, army capacity and gate throughput',
      JSON.stringify(data.capital) ===
        JSON.stringify([
          [2000, 50, 3, 5],
          [4000, 100, 6, 10],
          [8000, 200, 12, 20],
          [16000, 400, 24, 40],
        ]),
    );
    check(
      'Skeleton upgrades also affect archers, while Elite is a separate 50% multiplier',
      Math.abs(data.base.hp - 102) < 1e-6 &&
        Math.abs(data.archer.hp - 102) < 1e-6 &&
        Math.abs(data.elite.hp - 153) < 1e-6 &&
        Math.abs(data.base.dmg - 11) < 1e-6,
    );
    const economy = await page.evaluate(() => {
      const R = __ROADLORDS_RUNTIME__,
        c = undReset(),
        well = undPut('und_well', 0, 0),
        grave = undPut('und_graveyard', 0, 1);
      const price = R.placementPrice(c, 'und_well', 0, 2).wood;
      c.normal.gen_build_discount = 2;
      R.recomputeCity(c, true);
      const discount = R.placementPrice(c, 'und_well', 0, 2).wood;
      c.normal = {};
      R.recomputeCity(c, true);
      const flow = R.resourceFlowRates(c),
        before = c.resources.wood;
      R.produceResources(c, 1);
      const net = c.resources.wood - before;
      c.resources.wood = 100;
      const stock = c.resources.wood;
      R.normalSpawn(c, grave);
      const cost = stock - c.resources.wood;
      c.resources.wood = 10000;
      const anchor = undPut('und_soul_anchor', 1, 0);
      const anchorCost = R.undEconomy(c).upkeep.get(well.id);
      undPut('und_soul_anchor', 0, 3);
      const strongest = R.undEconomy(c).upkeep.get(well.id);
      R.setBuildingLevel(c, 'und_soul_anchor', 4);
      R.recomputeCity(c, true);
      const reduced = R.undEconomy(c).upkeep.get(well.id);
      undPut('und_corrupted_hatchery', 3, 2);
      const producer = undPut('und_graveyard', 3, 1);
      const time = R.trainingTime(c, producer);
      c.resources.wood = 500;
      R.normalSpawn(c, producer);
      const hurtEntry = c.garrison.at(-1),
        unit = R.releaseUnit(c, hurtEntry);
      const over = undPut('und_soul_overdrive', 6, 0);
      R.recomputeCity(c, true);
      const overIncome = R.productionRates(c).wood,
        overTime = R.trainingTime(c, producer);
      return {
        price,
        discount,
        flow,
        net,
        cost,
        anchorCost,
        strongest,
        reduced,
        time,
        spawnRatio: unit.hp / unit.maxHp,
        overIncome,
        overTime,
      };
    });
    report.economy = economy;
    check(
      'Actual placement uses the same Soul prices and multiplicative discounts as cards',
      economy.price === 35 && economy.discount === 32,
    );
    check(
      'The HUD budgets full training demand while actual upkeep is charged separately',
      Math.abs(economy.flow.gain.wood - 4) < 1e-6 &&
        Math.abs(economy.flow.use.wood - 2.85) < 1e-6 &&
        Math.abs(economy.net - 3.15) < 1e-6 &&
        economy.cost === 10,
    );
    check(
      'Anchors apply the strongest local reduction without stacking',
      economy.anchorCost === 0.25 && economy.strongest === 0.25 && Math.abs(economy.reduced - 0.05) < 1e-6,
    );
    check(
      'Hatchery recruits start at half HP with unchanged max HP; Overdrive doubles non-capital production only',
      Math.abs(economy.time - 5 / 1.4) < 1e-6 &&
        economy.spawnRatio === 0.5 &&
        economy.overIncome === 5 &&
        Math.abs(economy.overTime - 5 / 2.8) < 1e-6,
    );
    const deaths = await page.evaluate(() => {
      const R = __ROADLORDS_RUNTIME__,
        c = undReset();
      const bank = undPut('und_soul_bank', 0, 0);
      c.resources.wood = 0;
      const credit = R.pay(c, R.C(200, 0, 0)),
        floor = c.resources.wood,
        denied = !R.pay(c, R.C(1, 0, 0));
      c.resources.wood = 10000;
      const g = undPut('und_graveyard', 0, 3);
      c.resources.wood = -10;
      const stopped = !Number.isFinite(R.trainingTime(c, g)) && !R.normalSpawn(c, g);
      c.resources.wood = 1000;
      c.undeadState.bankClock = 59;
      R.produceResources(c, 1);
      const interest = c.resources.wood;
      undReset();
      const burner = undPut('und_soul_burner', 0, 0);
      for (let i = 0; i < 100; i++) {
        R.state.time++;
        R.produceResources(R.P, 1);
      }
      const burned = !R.P.buildings.some((b) => b.id === burner.id);
      undReset();
      const starving = undPut('und_plague_chamber', 0, 0);
      for (let i = 0; i < 9; i++) {
        R.P.resources.wood = -100;
        R.state.time++;
        R.produceResources(R.P, 1);
      }
      const survivesNine = !!R.P.buildings.find((b) => b.id === starving.id);
      R.P.resources.wood = -100;
      R.state.time++;
      R.produceResources(R.P, 1);
      const starved = !R.P.buildings.some((b) => b.id === starving.id);
      undReset();
      R.setBuildingLevel(R.P, 'keep', 4, 'death_squad');
      const well = undPut('und_well', 0, 0);
      R.demolish(R.P, well.id);
      const free = R.reserveCount(R.P) + R.P.undeadState.freeQueue.length;
      return { credit, floor, denied, stopped, interest, burned, survivesNine, starved, free };
    });
    report.deaths = deaths;
    check(
      'The Soul Bank respects its debt floor and stops training at negative stock',
      deaths.credit && deaths.floor === -200 && deaths.denied && deaths.stopped,
    );
    check(
      'Bank interest is applied at 60 seconds; unpaid buildings survive 9 seconds and disappear at 10',
      Math.abs(deaths.interest - 1101.595) < 0.001 && deaths.survivesNine && deaths.starved,
    );
    check(
      'Soul Burners expire and Death Squad creates exactly ten free recruits',
      deaths.burned && deaths.free === 10,
    );
    const hit = await page.evaluate(() => {
      const R = __ROADLORDS_RUNTIME__;
      undReset();
      const s = undUnit('und_skeleton'),
        a = undUnit('archer', 'enemy', 2440);
      const resisted = undHit(a, s);
      undReset();
      R.P.legends.add('skeleton_leg_guard');
      const target = undUnit('und_necromancer'),
        guard = undUnit('und_skeleton', 'player', 2400, 20),
        shooter = undUnit('archer', 'enemy', 2440);
      const hp = guard.hp,
        redirect = undHit(shooter, target),
        guardLoss = hp - guard.hp;
      undReset();
      R.P.legends.add('vampire_leg_dual');
      R.P.legends.add('vampire_leg_shield');
      const v = undUnit('und_vampire'),
        e = undUnit('swordsman', 'enemy', 2420),
        e2 = undUnit('swordsman', 'enemy', 2420, 20);
      v.hp = 200;
      const dual = undHit(v, e);
      const healed = v.hp;
      v.hp = v.maxHp;
      v.cooldown = 0;
      v.roadPending = false;
      undHit(v, e2);
      const shield = v.shield;
      undReset();
      undPut('und_plague_chamber', 0, 0);
      const skeleton = undUnit('und_skeleton'),
        foe = undUnit('swordsman', 'enemy', 2420);
      undHit(skeleton, foe);
      const stacks = foe.orcPoison,
        poisonHp = foe.hp;
      R.updateUnitStatuses(foe, 1);
      const poisonLoss = poisonHp - foe.hp;
      foe.hp = 1;
      foe.orcPoison = 100;
      R.updateUnitStatuses(foe, 1);
      const nonlethal = foe.hp === 1;
      return {
        resisted,
        archerDamage: R.UNITS.archer.damage,
        redirect,
        guardLoss,
        dual,
        healed,
        shield,
        stacks,
        poisonLoss,
        nonlethal,
      };
    });
    report.hit = hit;
    check(
      'Skeleton ranged resistance and guard redirection resolve at the real attack impact',
      hit.resisted.early &&
        Math.abs(hit.resisted.damage - hit.archerDamage * 0.75) < 1e-6 &&
        hit.redirect.damage === 0 &&
        hit.guardLoss > 0,
    );
    check(
      'Vampire dual hits steal life from both targets and overhealing creates shields',
      hit.dual.early && hit.dual.damage === 45 && hit.healed === 227 && hit.shield > 0,
    );
    check(
      'Plague adds poison on hits, amplifies its ticks and never kills by poison alone',
      hit.stacks === 1 && Math.abs(hit.poisonLoss - 1.1) < 1e-6 && hit.nonlethal,
    );
    const abilities = await page.evaluate(() => {
      const R = __ROADLORDS_RUNTIME__;
      undReset();
      R.P.legends.add('ghost_leg_mirror');
      undPut('und_ghost_spawner', 0, 0);
      R.setBuildingLevel(R.P, 'und_ghost_spawner', 4, 'revenant');
      const ghost = undUnit('und_ghost'),
        foe = undUnit('swordsman', 'enemy', 2420);
      const rand = Math.random;
      Math.random = () => 0;
      let dodge;
      try {
        dodge = undHit(foe, ghost);
      } finally {
        Math.random = rand;
      }
      const clones = R.state.units.filter((u) => u.undMirror),
        slots = R.fieldUnitCount(R.P),
        reflected = R.UNITS.swordsman.hp - foe.hp;
      undReset();
      const n = undUnit('und_necromancer', 'player', 2200);
      n.undSummonClock = 14.9;
      R.updateBattle(0.1);
      const summons = R.state.units.filter((u) => u.undSummoned),
        summonInfo = {
          count: summons.length,
          slots: R.fieldUnitCount(R.P),
          temporary: summons.every((u) => u.temporary === 10),
        };
      for (let i = 0; i < 102; i++) R.updateBattle(0.1);
      const expired = R.state.units.every((u) => !u.undSummoned);
      undReset();
      undPut('und_necro_spawner', 0, 0);
      R.setBuildingLevel(R.P, 'und_necro_spawner', 4, 'eternal_army');
      R.P.legends.add('necro_leg_spirits');
      const eternal = undUnit('und_necromancer', 'player', 2200);
      eternal.undSummonClock = 14.9;
      R.updateBattle(0.1);
      const permanent =
        R.state.units.filter((u) => u.undSummoned).every((u) => u.key === 'und_ghost' && !u.temporary) &&
        R.state.units.length === 5;
      undReset();
      undPut('und_lich_spawner', 0, 0);
      R.P.legends.add('lich_leg_greedy');
      const l = undUnit('und_lich'),
        v1 = undUnit('swordsman', 'enemy', 2460),
        v2 = undUnit('swordsman', 'enemy', 2460, 25),
        v3 = undUnit('swordsman', 'enemy', 2460, -25);
      undHit(l, v1);
      const beams = l.undBeams.length,
        next = R.preferredTarget(l, [v1, v2, v3])?.id,
        nextExpected = [v1, v2, v3].find((v) => !l.undBeams.some((b) => b.id === v.id)).id;
      l.hp = 100;
      R.updateBattle(1);
      const beamDamage = R.UNITS.swordsman.hp - v1.hp,
        heal = l.hp;
      R.setBuildingLevel(R.P, 'und_lich_spawner', 4, 'endless_hunger');
      v1.hp = 0.1;
      R.updateBattle(0.1);
      const jumped = l.undBeams.some((b) => b.id === nextExpected && b.age > 1);
      return {
        dodge,
        clones: clones.length,
        cloneDuration: clones[0]?.temporary,
        slots,
        reflected,
        summonInfo,
        expired,
        permanent,
        beams,
        next,
        nextExpected,
        beamDamage,
        heal,
        jumped,
      };
    });
    report.abilities = abilities;
    check(
      'Ghost dodges reflect damage and create 10-second clones without occupying army slots',
      abilities.dodge.damage === 0 &&
        abilities.clones === 1 &&
        abilities.cloneDuration === 10 &&
        abilities.slots === 1 &&
        abilities.reflected > 0,
    );
    check(
      'Necromancers summon three temporary no-slot skeletons; Eternal Army also keeps summoned Ghosts',
      abilities.summonInfo.count === 3 &&
        abilities.summonInfo.slots === 1 &&
        abilities.summonInfo.temporary &&
        abilities.expired &&
        abilities.permanent,
    );
    check(
      'Liches attach two independent beams, seek fresh targets, ramp damage and heal',
      abilities.beams === 2 &&
        abilities.next === abilities.nextExpected &&
        Math.abs(abilities.beamDamage - 6) < 1e-6 &&
        Math.abs(abilities.heal - 112) < 1e-6,
    );
    check('Endless Hunger carries the beam age to a new target when its own damage kills', abilities.jumped);
    const recovery = await page.evaluate(() => {
      const R = __ROADLORDS_RUNTIME__;
      undReset();
      undPut('und_bone_forge', 0, 0);
      for (let i = 0; i < 10; i++)
        R.killUnit(undUnit('und_skeleton', 'player', 2400, 0, { undSummoned: i % 2 === 0 }), true);
      const forged = R.P.garrison.filter((e) => e.key === 'und_zombie').length;
      for (let i = 0; i < 10; i++) R.killUnit(undUnit('und_skeleton'), false);
      const noExpiryCredit = R.P.garrison.filter((e) => e.key === 'und_zombie').length === forged;
      undReset();
      undPut('und_rebirth_tomb', 0, 0);
      const s = undUnit('und_skeleton'),
        rand = Math.random;
      Math.random = () => 0;
      let revived, once;
      try {
        R.killUnit(s, true);
        const entry = R.P.garrison.pop();
        revived = R.releaseUnit(R.P, entry);
        R.killUnit(revived, true);
        once = R.P.garrison.length === 0;
      } finally {
        Math.random = rand;
      }
      const ratio = revived.undSpawnHp;
      undReset();
      undPut('und_soul_harvester', 0, 0);
      undPut('und_garden_of_dead', 0, 2);
      const victim = undUnit('swordsman', 'enemy', 1200),
        stock = R.P.resources.wood;
      Math.random = () => 0;
      try {
        R.killUnit(victim, true);
      } finally {
        Math.random = rand;
      }
      const harvested = R.P.resources.wood - stock,
        conversion = R.state.units.find((u) => u.alive && u.side === 'player');
      R.setBuildingLevel(R.P, 'keep', 4, 'dead_realm');
      R.P.resources.wood = 10000;
      const expanded = R.isOwnHalf({ side: 'player', lane: R.PATH_LENGTH - 1 });
      R.P.resources.wood = 0;
      const contracted = !R.isOwnHalf({ side: 'player', lane: R.PATH_LENGTH * 0.75 });
      return {
        forged,
        noExpiryCredit,
        ratio,
        once,
        harvested,
        converted: conversion?.key,
        lane: conversion?.lane,
        expanded,
        contracted,
      };
    });
    report.recovery = recovery;
    check(
      'Bone Forge counts combat deaths including summons, without credit for expiration',
      recovery.forged === 1 && recovery.noExpiryCredit,
    );
    check('Rebirth Tomb revives at half HP once per actor', recovery.ratio === 0.5 && recovery.once);
    check(
      'Harvesters earn on enemy deaths; Garden converts the corpse in place; Dead Realm follows stored Souls',
      recovery.harvested === 1 &&
        recovery.converted === 'und_skeleton' &&
        recovery.lane === 1200 &&
        recovery.expanded &&
        recovery.contracted,
    );
    const branches = await page.evaluate(() => {
      const R = __ROADLORDS_RUNTIME__;
      undReset();
      const grave = undPut('und_graveyard', 0, 1);
      for (const [r, c] of [
        [0, 0],
        [0, 2],
        [1, 1],
      ])
        undPut('und_graveyard', r, c);
      R.setBuildingLevel(R.P, 'und_graveyard', 4, 'elite_skeletons');
      R.normalSpawn(R.P, grave);
      const elite = R.P.garrison.at(-1).undElite;
      R.setBuildingLevel(R.P, 'und_graveyard', 4, 'double_summon');
      const before = R.P.resources.wood,
        n = R.P.garrison.length;
      R.normalSpawn(R.P, grave);
      const double = [R.P.garrison.length - n, before - R.P.resources.wood];
      undReset();
      undPut('und_morgue', 0, 0);
      R.setBuildingLevel(R.P, 'und_morgue', 4, 'epidemic');
      const z = undUnit('und_zombie'),
        enemy = undUnit('swordsman', 'enemy', 2420);
      R.updateBattle(1);
      const aura = enemy.orcPoison;
      R.P.normal.zombie_common_poison = 1;
      R.killUnit(z, true);
      const burst = enemy.orcPoison - aura;
      undReset();
      undPut('und_morgue', 0, 0);
      R.setBuildingLevel(R.P, 'und_morgue', 4, 'dismantling');
      const dying = undUnit('und_zombie', 'player', 2100, 50);
      R.killUnit(dying, true);
      const bones = R.state.units.find((u) => u.alive && u.key === 'und_skeleton');
      undReset();
      undPut('und_ghost_spawner', 0, 0);
      R.setBuildingLevel(R.P, 'und_ghost_spawner', 4, 'phasewalker');
      const ghost = undUnit('und_ghost', 'player', 2300),
        front = undUnit('swordsman', 'enemy', 2322),
        back = undUnit('archer', 'enemy', 2390);
      ghost.baseSpeed = ghost.speed = 46;
      R.roadAdvance(ghost, [front, back], 1);
      R.roadReindex();
      const crossed = ghost.lane > front.lane;
      const chosen = ghost.undPhaseTargetId || R.preferredTarget(ghost, [front, back])?.id;
      R.preferredTarget(ghost, [front, back]);
      const rear = ghost.roadAim === back;
      const tower = R.towers.find((t) => t.side === 'enemy');
      tower.lane = 2350;
      tower.alive = true;
      R.roadRefreshFrontiers();
      R.setBattleLane(ghost, 2300);
      for (let i = 0; i < 60; i++) {
        R.roadAdvance(ghost, [front, back], 0.1);
        R.roadReindex();
      }
      const blocked = ghost.lane <= tower.lane - 18;
      undReset();
      undPut('und_dark_tower', 0, 0);
      const lead = undUnit('swordsman', 'enemy', 1000),
        tail = undUnit('swordsman', 'enemy', 2000);
      lead.hp = lead.maxHp = 1000;
      tail.hp = tail.maxHp = 1000;
      R.updateBattle(1);
      const towerDamage = [1000 - lead.hp, 1000 - tail.hp];
      undReset();
      undPut('und_lich_spawner', 0, 0);
      R.setBuildingLevel(R.P, 'und_lich_spawner', 4, 'wither_bond');
      R.P.legends.add('lich_leg_shield');
      const lich = undUnit('und_lich'),
        bound = undUnit('swordsman', 'enemy', 2450);
      undHit(lich, bound);
      R.updateBattle(1);
      const slowed = bound.undWitherSlow;
      const hp = lich.hp,
        foeHp = bound.hp;
      R.damageUnit(lich, 20, 'magic');
      const shield = [hp - lich.hp, foeHp - bound.hp];
      R.killUnit(lich, true);
      R.updateBattle(0.1);
      const cleared = !bound.undWitherSlow;
      undReset();
      const g1 = undUnit('und_ghost'),
        g2 = undUnit('und_ghost', 'player', 2400, 20),
        mage = undUnit('mage', 'enemy', 2450);
      R.E.levels.magetower = 4;
      R.E.l4Branches.magetower = 'frost_mages';
      const random = Math.random;
      Math.random = () => 0;
      try {
        undHit(mage, g1);
      } finally {
        Math.random = random;
      }
      const frostDodged = [g1, g2].every(
        (u) => u.hp === u.maxHp && !u.stunTime && !u.freezeFollow && !u.freezeImmunity,
      );
      R.E.legends.add('marking_arrow');
      const archer = undUnit('archer', 'enemy', 2450);
      Math.random = () => 0;
      try {
        undHit(archer, g1);
      } finally {
        Math.random = random;
      }
      const markDodged = !g1.rangedMarkTime;
      return {
        elite,
        double,
        aura,
        burst,
        bones: bones && [bones.lane, bones.offset],
        crossed,
        rear,
        blocked,
        towerDamage,
        slowed,
        shield,
        cleared,
        frostDodged,
        markDodged,
      };
    });
    report.branches = branches;
    check(
      'Both Graveyard branches produce Elite or two-for-one recruits through actual training',
      branches.elite && branches.double.join() === '2,10',
    );
    check(
      'Morgue branches provide periodic poison, upgraded death poison, or a skeleton at the corpse',
      branches.aura === 2 && branches.burst === 5 && branches.bones.join() === '2100,50',
    );
    check(
      'Phasewalker crosses enemies and prefers rear ranged units, while live towers still stop it',
      branches.crossed && branches.rear && branches.blocked,
    );
    check(
      'Dark Towers hit the most advanced enemy on their own half for percentage max-HP damage',
      branches.towerDamage.join() === '10,0',
    );
    check(
      'Lich shield shares incoming damage and Wither ends when the beam owner dies',
      branches.slowed === 0.05 && branches.shield.join() === '10,10' && branches.cleared,
    );
    check(
      'Ghost dodging also rejects area freezing and the pre-hit marking-arrow status',
      branches.frostDodged && branches.markDodged,
    );
    const ai = await page.evaluate(() => {
      const R = __ROADLORDS_RUNTIME__;
      undReset('human');
      R.roadResetCity(R.E, 'undead');
      R.E.unlocked = new Set(Object.keys(__ROADLORDS_UNDEAD__.buildings));
      R.E.gateMode = 'open';
      for (let i = 0; i < 240; i++) {
        R.state.time = i;
        R.produceResources(R.E, 1);
        R.updateSpawners(R.E, 1);
        R.releaseQueues(1);
        R.enemyBuildAI(1);
      }
      const c = R.E;
      return {
        buildings: c.buildings.map((b) => b.type),
        souls: c.resources.wood,
        units: R.fieldUnitCount(c),
        lost: c.undeadState.lostBuildingIds,
        flow: R.resourceFlowRates(c),
      };
    });
    report.ai = ai;
    check(
      'Undead AI builds a funded economy, legal mixed army and releases recruits over four simulated minutes',
      ai.buildings.filter((k) => k === 'und_well').length >= 3 &&
        ai.buildings.includes('und_morgue') &&
        ai.units > 0 &&
        ai.souls >= 0 &&
        ai.lost.length === 0 &&
        ai.buildings.every((k) => k === 'keep' || k.startsWith('und_')),
    );
    await page.evaluate(() => {
      const R = __ROADLORDS_RUNTIME__;
      R.roadStartTest(42, { count: 50, roster: 'undead' });
      R.roadPause();
      R.renderStatic();
    });
    check(
      'The Undead test uses all seven variants and leaves a readable Soul HUD',
      await page.evaluate(() => {
        const R = __ROADLORDS_RUNTIME__;
        return (
          R.ROAD.counts.join() === '50,50' &&
          new Set(R.state.units.filter((u) => u.side === 'player').map((u) => u.key)).size === 7 &&
          document.querySelector('#woodStock').closest('.res').querySelector('.resourceIcon').alt==='Lélek'
        );
      }),
    );
    await page.screenshot({ path: 'artifacts/undead-faction-battle.png' });
    check('No Undead runtime errors', report.errors.length === 0);
  } finally {
    fs.mkdirSync('artifacts', { recursive: true });
    fs.writeFileSync('artifacts/undead-faction.json', JSON.stringify(report, null, 2));
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
