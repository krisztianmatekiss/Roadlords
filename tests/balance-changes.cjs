const { chromium } = require('playwright'), assert = require('node:assert/strict'), fs = require('node:fs');
const URL = process.env.ROADLORDS_TEST_URL || 'http://127.0.0.1:4173/Roadlords/';
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const report = { checks: [], errors: [] }, check = (name, value) => { assert(value, name); report.checks.push(name); console.log('PASS', name); };
  try {
    const page = await browser.newPage(); await page.route('https://**/*', r => r.abort()); page.on('pageerror', e => report.errors.push(e.message));
    await page.goto(URL); await page.waitForFunction(() => !!window.__ROADLORDS_RUNTIME__);
    const result = await page.evaluate(() => {
      const R = __ROADLORDS_RUNTIME__;
      R.MP.enabled = false; R.state.running = false; R.ROAD.test = true; R.ROAD.paused = true;
      function reset() {
        R.roadResetCity(R.P, 'orc'); R.roadResetCity(R.E, 'human'); R.state.units = []; R.ROAD.pending = []; R.ROAD.clock = 0;
        for (const t of R.towers) t.alive = false;
      }
      reset();
      const warrior = R.statsFor(R.P, { key: 'orc_warrior' });
      R.P.normal = { orc_hp: 1, orc_warrior_hp: 1 };
      const veteran = R.statsFor(R.P, { key: 'orc_warrior', veteran: true });
      reset();
      const plainGoblin = R.statsFor(R.P, { key: 'orc_goblin' });
      R.P.legends.add('orc_gob_bow');
      const bow = R.statsFor(R.P, { key: 'orc_goblin' });
      R.P.legends.add('orc_momentum');
      const momentum = R.statsFor(R.P, { key: 'orc_goblin' });
      R.P.normal.orc_goblin_dmg = 2; R.P.legends.add('orc_gob_blood');
      const invested = R.statsFor(R.P, { key: 'orc_goblin' });
      const goblin = R.releaseUnit(R.P, { key: 'orc_goblin' }); goblin.orcTargetBleeding = true;
      const dynamicAS = R.orcAttackSpeedMult13(goblin);
      function trollHit({ normal = {}, veteran = false, branch, third = false } = {}) {
        reset(); R.P.normal = normal;
        if (branch) { R.P.levels.orc_troll = 4; R.P.l4Branches.orc_troll = branch; }
        const u = R.releaseUnit(R.P, { key: 'orc_troll', veteran });
        u.lane = 2300; u.offset = 0; u.firstAttacks = 0; u.attackCount = third ? 2 : 0;
        const targets = [0, 20, 90].map(offset => {
          const v = R.releaseUnit(R.E, { key: 'swordsman' }); v.lane = 2330; v.offset = offset; v.hp = v.maxHp = 10000; v.shield = v.tempShield = 0; return v;
        });
        R.roadReindex(); R.attackUnit(u, targets[0]);
        const attack = u.roadAttack;
        if (!attack) throw Error('Missing real queued attack');
        R.ROAD.clock = attack.hit - .001; R.roadImpacts();
        const early = targets.every(v => v.hp === 10000);
        R.ROAD.clock = attack.hit + .001; R.roadImpacts();
        const damage = targets.map(v => 10000 - v.hp);
        R.roadImpacts();
        return { early, damage, once: targets.every((v, i) => Math.abs(10000 - v.hp - damage[i]) < 1e-6), stun: targets.map(v => v.stunTime), hp: u.maxHp };
      }
      const plain = trollHit(), upgraded = trollHit({ normal: { orc_troll_dmg: 2 }, veteran: true }), breeding = trollHit({ branch: 'breeding' }), quake = trollHit({ branch: 'earthshaker', third: true });
      const copy = { goblin: R.LEGENDARY.find(o => o.id === 'orc_gob_bow').description, troll: R.UNITS.orc_troll.description };
      return { warrior, veteran, plainGoblin, bow, momentum, invested, dynamicAS, plain, upgraded, breeding, quake, copy };
    }); report.result = result;
    const near = (a, b) => Math.abs(a - b) < 1e-6;
    check('Orc Warrior starts at 300 HP and existing HP upgrades/veterancy scale from that base', result.warrior.hp === 300 && near(result.veteran.hp, 517.5));
    check('Goblin Archers gives 50% damage and preserves its 50% range bonus', near(result.bow.dmg, result.plainGoblin.dmg * 1.5) && near(result.bow.buildingDamage, result.plainGoblin.buildingDamage * 1.5) && near(result.bow.range, result.plainGoblin.range * 1.5));
    check('Goblin momentum uses the reduced relic bonus in both base and temporary attack-speed calculations', near(result.momentum.cooldown, result.plainGoblin.cooldown / 1.25) && near(result.invested.cooldown, result.plainGoblin.cooldown / 1.4) && near(result.dynamicAS, 1.625 / 1.4));
    check('Troll damage still resolves once at the actual attack impact', result.plain.early && result.plain.once);
    check('A normal Troll hit deals 110 to its target, 35 nearby and nothing beyond the 55-unit radius', result.plain.damage.join() === '110,35,0' && result.plain.hp === 3200);
    check('Troll damage upgrades and veterancy scale primary and secondary damage together', near(result.upgraded.damage[0], 198) && near(result.upgraded.damage[1], 63));
    check('Troll breeding still halves both primary and secondary damage', near(result.breeding.damage[0], 55) && near(result.breeding.damage[1], 17.5));
    check('The separate Earthshaker third hit retains full damage, expanded radius and stun', result.quake.damage.join() === '110,110,110' && result.quake.stun.every(t => near(t, 1)));
    check('Player-facing descriptions match the new 35 splash and 50% Goblin bonus', result.copy.troll.includes('35-öt') && result.copy.goblin.includes('+50% sebzést') && !result.copy.goblin.includes('+100%'));
    const refunds=await page.evaluate(()=>{
      const R=__ROADLORDS_RUNTIME__,results=[];
      for(const [stacks,roll] of [[1,.119],[1,.121],[5,.599],[5,.601],[20,.65]]){
        R.roadResetCity(R.P,'orc');R.P.buildings=R.P.buildings.filter(b=>b.type==='keep');R.P.buildings[0].row=R.P.buildings[0].col=0;R.P.terrain.fill(null);R.P.normal.orc_refund=stacks;R.P.resources=R.C(180,180,180);R.P.unlocked.add('orc_work');
        const oldRandom=Math.random;Math.random=()=>roll;let built;try{built=R.placeBuilding(R.P,'orc_work',3,3,0)}finally{Math.random=oldRandom}
        results.push({stacks,roll,ok:built.ok,refunded:built.ok&&Object.values(built.building.paidCost).every(n=>n===0)});
      }
      const def=R.NORMAL.find(o=>o.id==='orc_refund');R.P.normal.orc_refund=4;const preview=R.upgradeCopyPreview(R.P,{...def,kind:'normal'});R.P.normal.orc_refund=5;
      return {results,preview,ineligible:!def.eligible(R.P)};
    });report.refunds=refunds;
    check('Kontár építkezés refunds the real construction price at 12% per stack and stops at 60%',refunds.results.every(x=>x.ok)&&refunds.results.map(x=>x.refunded).join()==='true,false,true,false,false');
    check('Refund text, 48% to 60% preview and five-pick limit agree with the buff',refunds.preview.description.includes('+12')&&refunds.preview.description.includes('60%')&&refunds.preview.rows[0].before==='48%'&&refunds.preview.rows[0].after==='60%'&&refunds.ineligible);
    check('No balance-change runtime errors', report.errors.length === 0);
  } finally { fs.mkdirSync('artifacts', { recursive: true }); fs.writeFileSync('artifacts/balance-changes.json', JSON.stringify(report, null, 2)); await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
