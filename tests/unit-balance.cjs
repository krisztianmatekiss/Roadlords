const { chromium } = require('playwright'), assert = require('node:assert/strict'), fs = require('node:fs');
const URL = process.env.ROADLORDS_TEST_URL || 'http://127.0.0.1:4173/Roadlords/';
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const report = { checks: [], errors: [] }, check = (name, ok) => { assert(ok, name); report.checks.push(name); console.log('PASS', name); };
  try {
    const page = await browser.newPage(); await page.route('https://**/*', r => r.abort()); page.on('pageerror', e => report.errors.push(e.message));
    await page.goto(URL); await page.waitForFunction(() => !!window.__ROADLORDS_RUNTIME__);
    const result = await page.evaluate(() => {
      const R = __ROADLORDS_RUNTIME__; R.state.running = false; R.MP.enabled = false; R.ROAD.test = false; R.state.pregame = false;
      const reset = race => {
        R.roadResetCity(R.P, race); R.state.units = []; R.ROAD.pending = []; R.ROAD.clock = 0;
        R.P.terrain.fill(null); R.P.unlocked = new Set(Object.keys(R.BUILDINGS)); R.P.resources = R.C(1e6, 1e6, 1e6);
        R.P.gateMode = 'closed'; return R.P;
      };
      const put = type => { for (let r = 0; r < R.GRID; r++) for (let col = 0; col < R.GRID; col++) if (R.canPlace(R.P, type, r, col, 0)) { const out = R.placeBuilding(R.P, type, r, col, 0); if (out.ok) return out.building; } throw Error('Cannot place ' + type); };
      const profiles = Object.entries(R.UNITS).map(([key, u]) => {
        const c = reset(u.race || 'human'), type = key === 'und_skeleton_archer' ? 'und_graveyard' : Object.keys(R.BUILDINGS).find(t => R.BUILDINGS[t].unit === key);
        return { key, cost: R.unitCost(c, key), stats: R.statsFor(c, { key }), times: [1, 2, 3].map(level => R.previewTrainingTime(c, type, level)), cells: R.BUILDINGS[type].shape.length, unique: R.isUniqueBuilding(c, type), slots: R.orcArmyWeight({ key }, c) };
      });
      const training = [];
      for (const race of ['human', 'orc', 'undead']) for (const type of Object.keys(R.BUILDINGS).filter(t => R.BUILDINGS[t].unit && R.factionMatches(race, R.BUILDINGS[t], t))) for (const level of [1, 3]) {
        const c = reset(race), b = put(type); R.setBuildingLevel(c, type, level); R.recomputeCity(c, true);
        c.garrisonCap = c.armyCap = 10000; c.resources = R.C(1e6, 1e6, 1e6);
        const price = R.unitCost(c, R.BUILDINGS[type].unit), before = { ...c.resources }, time = R.trainingTime(c, b), preview = R.previewTrainingTime(c, type, level);
        const flow = R.resourceFlowRates(c), upkeep = race === 'undead' ? R.undEconomy(c).totalUpkeep : 0;
        R.updateSpawners(c, time - .001); const early = R.reserveCount(c);
        R.updateSpawners(c, .002);
        training.push({ race, type, level, time, preview, early, count: c.garrison.length + c.releaseQueue.length, price,
          paid: Object.fromEntries(R.RES.map(key => [key, before[key] - c.resources[key]])), flow: flow.sources.production, upkeep,
          fullFlow: flow.use });
      }
      let c = reset('human'); c.normal.frugal_training = 2; const discounted = R.unitCost(c, 'swordsman'); c.legends.add('no_food'); const noFood = R.unitCost(c, 'swordsman');
      c = reset('orc'); put('orc_troll'); R.setBuildingLevel(c, 'orc_troll', 4, 'breeding'); const breeding = { price: R.unitCost(c, 'orc_troll'), hp: R.statsFor(c, { key: 'orc_troll' }).hp, cells: R.cityBuildingCells(c, { type: 'orc_troll', row: 0, col: 0, rotation: 0 }).length, unique: R.isUniqueBuilding(c, 'orc_troll'), slots: R.orcArmyWeight({ key: 'orc_troll' }, c) };
      c = reset('orc'); const shaman = R.releaseUnit(c, { key: 'orc_shaman' }); R.roadResetCity(R.E, 'human');
      const target = R.releaseUnit(R.E, { key: 'swordsman' }); shaman.lane = 2400; target.lane = 2545; shaman.offset = target.offset = 0; target.hp = target.maxHp = 10000;
      R.roadReindex(); R.attackUnit(shaman, target); const hit = shaman.roadAttack.hit;
      R.ROAD.clock = hit - .001; R.roadImpacts(); const earlyHit = target.hp === 10000 && !Object.keys(target.orcCurses || {}).length;
      R.ROAD.clock = hit + .001; R.roadImpacts(); const damage = 10000 - target.hp, curses = Object.values(target.orcCurses || {});
      const shamanResult={earlyHit,damage,curses,interval:shaman.cooldownTime,range:shaman.range};
      c=reset('human');R.roadResetCity(R.E,'human');c.levels.magetower=4;c.l4Branches.magetower='fire_mages';
      const mage=R.releaseUnit(c,{key:'mage'});mage.lane=4500;mage.offset=0;
      const victims=[0,10,200].map(offset=>{const u=R.releaseUnit(R.E,{key:'swordsman'});u.lane=4600;u.offset=offset;u.hp=u.maxHp=10000;u.shield=u.tempShield=0;return u;});
      R.roadReindex();R.attackUnit(mage,victims[0]);const hitAt=mage.roadAttack.hit;R.ROAD.clock=hitAt-.001;R.roadImpacts();const mageEarly=victims.every(u=>u.hp===10000);R.ROAD.clock=hitAt+.001;R.roadImpacts();
      const magic={early:mageEarly,damage:victims.map(u=>10000-u.hp),burn:victims.map(u=>u.burnDps)};
      c=reset('undead');const necro=R.releaseUnit(c,{key:'und_necromancer'});R.updateBattle(15);const oldBoundary=R.state.units.length;R.updateBattle(3.749);const earlySummons=R.state.units.length;R.updateBattle(.002);const summons=R.state.units.filter(u=>u.undSummoned);
      const summonCadence={oldBoundary,earlySummons,count:summons.length,temporary:summons.every(u=>u.temporary===10&&u.undNoArmySlot)};
      return { profiles, training, discounted, noFood, breeding, shaman: shamanResult, magic, summonCadence };
    }); report.result = result;
    const costs = {"swordsman":[0,8,10],"spearman":[8,0,10],"archer":[11,0,9],"knight":[0,25,24],"priest":[16,15,19],"catapult":[41,33,14],"mage":[25,25,19],"orc_warrior":[0,11,14],"orc_berserker":[6,10,13],"orc_goblin":[5,2,6],"orc_warg":[7,25,29],"orc_shaman":[16,13,19],"orc_ram":[29,35,15],"orc_troll":[39,94,93],"und_skeleton":[16,0,0],"und_skeleton_archer":[16,0,0],"und_zombie":[33,0,0],"und_ghost":[23,0,0],"und_necromancer":[88,0,0],"und_vampire":[94,0,0],"und_lich":[125,0,0]};
    const profile = key => result.profiles.find(p => p.key === key), near = (a, b) => Math.abs(a - b) < 1e-6;
    check('All 21 units use the balanced prices with the global 25% increase applied once and zero-cost resources preserved', result.profiles.length === 21 && result.profiles.every(p => ['wood','stone','food'].every((r, i) => p.cost[r] === costs[p.key][i])));
    check('Human unit stats and training remain the reference; their prices increase too', profile('mage').stats.hp === 75 && profile('mage').times.every((x, i) => near(x, [15,12,9][i])) && profile('swordsman').stats.dmg === 12);
    check('Troll training slows by 25% at every level while its 9 cells, unique limit, 4 slots and 3200 HP remain meaningful costs', profile('orc_troll').times.join() === '30,24,18' && profile('orc_troll').cells === 9 && profile('orc_troll').unique && profile('orc_troll').slots === 4 && profile('orc_troll').stats.hp === 3200);
    check('Undead unique casters use four cells and 17.5/20/22.5-second L1 training, within 1.5x Human Mage cadence at all levels', ['und_necromancer','und_vampire','und_lich'].every(key => { const p = profile(key); return p.cells === 4 && p.unique && p.times.every((t, i) => t <= profile('mage').times[i] * 1.5 + 1e-6); }));
    check('Skeletons, Zombies and Ghosts receive role-appropriate base durability and damage rather than unchanged placeholder stats', profile('und_skeleton').stats.hp === 85 && profile('und_skeleton').stats.dmg === 10 && profile('und_skeleton_archer').stats.hp === 85 && profile('und_zombie').stats.hp === 280 && profile('und_zombie').stats.dmg === 12 && profile('und_ghost').stats.hp === 75 && profile('und_ghost').stats.dmg === 8);
    check('Every real producer at L1/L3 waits for the full cycle, then charges exactly once and creates one recruit', result.training.length === 40 && result.training.every(t => near(t.time, t.preview) && t.early === 0 && t.count === 1 && ['wood','stone','food'].every(r => near(t.paid[r], t.price[r]))));
    check('All production budgets use the actual new price and training time, including separate Undead upkeep', result.training.every(t => ['wood','stone','food'].every(r => near(t.flow[r], t.price[r] / t.time) && near(t.fullFlow[r], t.flow[r] + (r === 'wood' ? t.upkeep : 0)))));
    check('Existing discounts and the no-food relic apply after base repricing', near(result.discounted.stone,7.2) && near(result.discounted.food,9) && result.noFood.food === 0 && near(result.noFood.stone,7.2));
    check('Troll Breeding keeps its half-price/half-HP and 2x2 non-unique tradeoff without losing the 4-slot cost', near(result.breeding.price.wood,19.5) && near(result.breeding.price.stone,47) && near(result.breeding.price.food,46.5) && result.breeding.hp === 1600 && result.breeding.cells === 4 && !result.breeding.unique && result.breeding.slots === 4);
    check('Shaman damage and four-second curse resolve at the real impact, with useful range and a 2.5-second attack interval', result.shaman.earlyHit && result.shaman.curses.length === 1 && near(result.shaman.curses[0],4) && result.shaman.damage >= 8 && near(result.shaman.interval,2.5) && result.shaman.range === 300);
    check('Mage keeps 24 primary damage but secondary victims and their burns use 45%, exactly at impact',result.magic.early&&near(result.magic.damage[0],24)&&near(result.magic.damage[1],10.8)&&result.magic.damage[2]===0&&near(result.magic.burn[0],6)&&near(result.magic.burn[1],2.7));
    check('Necromancer waits past the old 15-second interval and summons exactly at 18.75 seconds with unchanged count/lifetime',result.summonCadence.oldBoundary===1&&result.summonCadence.earlySummons===1&&result.summonCadence.count===3&&result.summonCadence.temporary);
    check('Balance changes introduce no runtime errors', !report.errors.length);
  } finally { fs.mkdirSync('artifacts',{recursive:true}); fs.writeFileSync('artifacts/unit-balance.json',JSON.stringify(report,null,2)); await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
