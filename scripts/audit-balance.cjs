// Diagnostic samples, not a claim of faction win rates. Run via npm run audit:balance.
const { chromium } = require('playwright'), fs = require('node:fs');
const URL = process.env.ROADLORDS_TEST_URL || 'http://127.0.0.1:4173/Roadlords/';
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  try {
    const page = await browser.newPage(); await page.route('https://**/*', r => r.abort());
    await page.goto(URL); await page.waitForFunction(() => !!window.__ROADLORDS_RUNTIME__);
    const report = await page.evaluate(() => {
      const R = __ROADLORDS_RUNTIME__;
      R.MP.enabled = false; R.MP.role = 'solo'; R.state.running = false; R.ROAD.test = true; R.ROAD.paused = true;
      const units = Object.entries(R.UNITS).map(([key, base]) => {
        const city = { ...R.P, race: key.startsWith('orc_') ? 'orc' : 'human', normal: {}, legends: new Set(), levels: {}, l4Branches: {}, buildings: [] };
        const building = Object.keys(R.BUILDINGS).find(t => R.BUILDINGS[t].unit === key);
        return { key, name: base.name, stats: R.statsFor(city, { key }), cost: R.unitCost(city, key), training: [1, 2, 3].map(level => R.previewTrainingTime(city, building, level)), weight: R.orcArmyWeight({ key }, city), footprint: R.BUILDINGS[building].shape.length, unique: R.isUniqueBuilding(city, building) };
      });
      window.balanceUnits = units;
      window.runBalanceSample = function (a, b, mirror, seed = 42) {
        const oldRandom = Math.random; let rng = seed;
        Math.random = () => ((rng = (Math.imul(rng, 1664525) + 1013904223) >>> 0) / 4294967296);
        try {
          R.roadResetCity(R.P, mirror ? 'orc' : 'human'); R.roadResetCity(R.E, mirror ? 'human' : 'orc');
          R.state.units = []; R.state.unitSerial = 1; R.state.time = 0; R.state.ended = false;
          R.ROAD.pending = []; R.ROAD.dead = []; R.ROAD.clock = 0; R.projectiles.length = R.combatFx.length = 0;
          for (const t of R.towers) t.alive = false;
          for (const [city, roster, dir] of [[R.P, mirror ? b : a, -1], [R.E, mirror ? a : b, 1]]) {
            if (roster.normal) city.normal = { ...roster.normal };
            if (roster.legends) city.legends = new Set(roster.legends);
            const entries = roster.entries || [[roster.key, roster.count]];
            let index = 0;
            for (const [key, count] of entries) for (let j = 0; j < count; j++, index++) {
              const u = R.releaseUnit(city, { key, veteran: false });
              u.lane = 2400 + dir * (220 + Math.floor(index / 8) * 30); u.offset = ((index % 8) - 3.5) * 26;
              u.cooldown = 0; u.firstAttacks = 0;
            }
          }
          R.roadReindex();
          const start = [...R.state.units]; let elapsed = 0;
          for (let tick = 0; tick < 1800; tick++) {
            R.updateBattle(1 / 20); elapsed += 1 / 20;
            if (tick % 100 === 0) { R.projectiles.length = R.combatFx.length = 0; }
            if (!R.state.units.some(u => u.alive && u.side === 'player') || !R.state.units.some(u => u.alive && u.side === 'enemy')) break;
          }
          const left = start.filter(u => u.alive && u.side === 'player'), right = start.filter(u => u.alive && u.side === 'enemy');
          const human = mirror ? right : left, orc = mirror ? left : right;
          return { mirror, seed, winner: human.length && !orc.length ? 'human' : orc.length && !human.length ? 'orc' : 'timeout', seconds: Math.round(elapsed * 20) / 20, human: human.length, orc: orc.length, humanHP: Math.round(human.reduce((n, u) => n + u.hp, 0)), orcHP: Math.round(orc.reduce((n, u) => n + u.hp, 0)) };
        } finally { Math.random = oldRandom; }
      };
      return { version: window.__ROADLORDS_VERSION__, units, duels: [], mixes: [], assumptions: ['No combat upgrades or building buffs unless explicitly listed; no towers or reinforcements.', '90-second limit, 20 simulation steps/second; mirrored deployment and side order.', 'Cost budget sums wood/stone/food equally; this is not a real economic model.', 'Time samples use 60 seconds of one L1 or L3 producer. Area-time-L3 uses 9 military cells, unique-building limits and a 48-slot cap, without construction/economy costs.', 'Pure support duels are included for completeness, not a rating of their utility.'] };
    });
    const humans = report.units.filter(u => !u.key.startsWith('orc_')), orcs = report.units.filter(u => u.key.startsWith('orc_'));
    for (const h of humans) {
      for (const o of orcs) for (const mode of ['count', 'cost', 'time', 'time-L3', 'area-time-L3']) {
        const count = u => {
          if (mode === 'count') return 12;
          if (mode === 'cost') return Math.max(1, Math.floor(192 / Object.values(u.cost).reduce((n, x) => n + x, 0)));
          const producers = mode === 'area-time-L3' ? u.unique ? 1 : Math.floor(9 / u.footprint) : 1;
          return Math.min(Math.floor(48 / u.weight), Math.max(1, Math.floor(60 / u.training[mode.includes('L3') ? 2 : 0]) * producers));
        };
        const a = { key: h.key, count: count(h) }, b = { key: o.key, count: count(o) };
        const results = await page.evaluate(({ a, b }) => [runBalanceSample(a, b, false), runBalanceSample(a, b, true)], { a, b });
        report.duels.push({ human: h.key, orc: o.key, mode, counts: [a.count, b.count], results });
      }
      console.log('AUDIT', h.key, report.duels.length * 2, 'mirrored battles complete');
    }
    const scenarios = [
      ['line', { entries: [['swordsman', 12]] }, { entries: [['orc_warrior', 8]] }],
      ['line+human-healer', { entries: [['swordsman', 9], ['priest', 1]] }, { entries: [['orc_warrior', 8]] }],
      ['line+orc-shaman', { entries: [['swordsman', 12]] }, { entries: [['orc_warrior', 6], ['orc_shaman', 1]] }],
      ['bleed-1', { entries: [['swordsman', 12]] }, { entries: [['orc_warrior', 8]], normal: { orc_bleed: 1 } }],
      ['human-unit-damage-1', { entries: [['swordsman', 12]], normal: { swordsman_dmg: 1 } }, { entries: [['orc_warrior', 8]] }],
      ['human-execution', { entries: [['swordsman', 12]], legends: ['sword_execute'] }, { entries: [['orc_warrior', 8]] }],
      ['mixed', { entries: [['swordsman', 6], ['spearman', 3], ['archer', 4], ['priest', 1], ['mage', 1]] }, { entries: [['orc_warrior', 4], ['orc_berserker', 2], ['orc_goblin', 5], ['orc_shaman', 1], ['orc_warg', 1]] }]
    ];
    for (const [name, a, b] of scenarios) {
      const results = await page.evaluate(({ a, b }) => [11, 29, 73].flatMap(seed => [runBalanceSample(a, b, false, seed), runBalanceSample(a, b, true, seed)]), { a, b });
      report.mixes.push({ name, a, b, results }); console.log('AUDIT', name, results.map(r => r.winner).join('/'));
    }
    fs.mkdirSync('artifacts', { recursive: true }); fs.writeFileSync('artifacts/balance-audit.json', JSON.stringify(report, null, 2));
    console.log('Saved artifacts/balance-audit.json:', report.duels.length * 2 + report.mixes.length * 6, 'battle samples');
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
