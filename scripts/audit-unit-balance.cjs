// Production/footprint samples using the live combat engine, not faction win rates.
const { chromium } = require('playwright'), fs = require('node:fs');
const URL = process.env.ROADLORDS_TEST_URL || 'http://127.0.0.1:4173/Roadlords/';
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  try {
    const page = await browser.newPage(); await page.route('https://**/*', r => r.abort());
    await page.goto(URL); await page.waitForFunction(() => !!window.__ROADLORDS_RUNTIME__);
    const report = await page.evaluate(() => {
      const R = __ROADLORDS_RUNTIME__;
      R.state.running = false; R.ROAD.paused = true; R.ROAD.test = true; R.MP.enabled = false;
      const cities = {};
      for (const race of ['human', 'orc', 'undead']) { const c = R.makeCity('player'); c.race = race; c.resources.wood = 1e6; cities[race] = c; }
      const profiles = Object.entries(R.UNITS).map(([key, d]) => {
        const race = d.race || 'human', c = cities[race];
        const type = key === 'und_skeleton_archer' ? 'und_graveyard' : Object.keys(R.BUILDINGS).find(t => R.BUILDINGS[t].unit === key);
        const b = R.BUILDINGS[type];
        return { key, race, name: d.name, type, hp: d.hp, damage: d.damage, cooldown: d.cooldown, slots: R.orcArmyWeight({ key }, c),
          cells: b.shape.length, unique: !!b.unique, buildCost: R.buildPrice(c, type), unitCost: R.unitCost(c, key), upkeep: b.upkeep || 0,
          seconds: [1, 2, 3].map(level => R.previewTrainingTime(c, type, level)) };
      });
      window.unitBalanceProfiles = profiles;
      window.unitBalanceSample = function (roster, level, mirror, seed) {
        const random = Math.random; let rng = seed;
        Math.random = () => ((rng = (Math.imul(rng, 1664525) + 1013904223) >>> 0) / 4294967296);
        try {
          const human = [['barracks', 4], ['archery', 2], ['stable', 2], ['temple', 2], ['magetower', 1]]; // 18 cells.
          R.roadResetCity(R.P, mirror ? roster.race : 'human'); R.roadResetCity(R.E, mirror ? 'human' : roster.race);
          R.state.units = []; R.state.unitSerial = 1; R.state.time = 0; R.state.ended = false;
          R.ROAD.clock = 0; R.ROAD.pending = []; R.ROAD.dead = [];
          R.projectiles.length = R.combatFx.length = 0;
          for (const t of R.towers) t.alive = false;
          const starts = [];
          for (const [c, producers, dir] of [[R.P, mirror ? roster.producers : human, -1], [R.E, mirror ? human : roster.producers, 1]]) {
            c.resources.wood = 1e6;
            let index = 0, units = 0; const cost = R.C(), economy = R.C(); let upkeep = 0, cells = 0;
            for (const [type, buildings] of producers) {
              const d = R.BUILDINGS[type], key = d.unit;
              const count = Math.floor(60 / R.previewTrainingTime(c, type, level) + 1e-8) * buildings;
              const unitCost = R.unitCost(c, key); cells += d.shape.length * buildings; upkeep += (d.upkeep || 0) * buildings;
              for (const res of R.RES) cost[res] += unitCost[res] * count;
              for (let i = 0; i < count; i++, index++) {
                const u = R.releaseUnit(c, { key, veteran: false });
                u.cooldown = 0; u.firstAttacks = 0; units++;
              }
            }
            for (const res of R.RES) economy[res] = cost[res] / 60 + (res === 'wood' ? upkeep : 0);
            // Put melee in front for every faction; producer iteration order
            // must not expose Undead casters while protecting Human casters.
            const army = R.state.units.filter(u => u.side === R.sideForCity(c)).sort((a, b) => Number(a.tags.includes('ranged')) - Number(b.tags.includes('ranged')));
            army.forEach((u, i) => { u.lane = 2400 + dir * (230 + Math.floor(i / 12) * 22); u.offset = ((i % 12) - 5.5) * 25; });
            starts.push({ race: c.race, units, cells, cost, upkeep, requiredIncomePerSecond: economy });
          }
          R.roadReindex(); let elapsed = 0;
          for (let tick = 0; tick < 1800; tick++) {
            R.updateBattle(.05); elapsed += .05;
            if (tick % 100 === 0) { R.projectiles.length = R.combatFx.length = 0; }
            const p = R.state.units.some(u => u.alive && u.side === 'player'), e = R.state.units.some(u => u.alive && u.side === 'enemy');
            if (!p || !e) break;
          }
          const survivors = side => R.state.units.filter(u => u.alive && u.side === side);
          const humanSide = mirror ? 'enemy' : 'player', otherSide = mirror ? 'player' : 'enemy';
          const h = survivors(humanSide), o = survivors(otherSide);
          return { seed, mirror, level, starts, seconds: Math.round(elapsed), winner: !h.length && o.length ? roster.race : h.length && !o.length ? 'human' : 'timeout', human: h.length, other: o.length,
            humanHP: Math.round(h.reduce((n, u) => n + u.hp, 0)), otherHP: Math.round(o.reduce((n, u) => n + u.hp, 0)) };
        } finally { Math.random = random; }
      };
      return { version: __ROADLORDS_VERSION__, profiles, samples: [], limits: ['18 military cells per side; 60 seconds of production, deployed together; no reinforcements or towers.', 'No upgrades, relics, construction times or economic buildings. L3 means producer levels only.', 'Income requirements include unit prices and Undead upkeep; currency totals are not treated as equivalent.', 'Two seeds, mirrored sides, 90 seconds per fight. These samples do not establish general faction win rates.'] };
    });
    const rosters = [
      { name: 'orc-troll', race: 'orc', producers: [['orc_troll', 1], ['orc_war', 2], ['orc_gob', 3], ['orc_shaman', 1]] },
      { name: 'orc-shaman', race: 'orc', producers: [['orc_war', 3], ['orc_gob', 4], ['orc_shaman', 2], ['orc_warg', 2]] },
      ...['und_necro_spawner', 'und_vampire_castle', 'und_lich_spawner'].map(type => ({ name: type, race: 'undead', producers: [[type, 1], ['und_graveyard', 6], ['und_morgue', 3], ['und_ghost_spawner', 2]] })),
      { name: 'undead-elites', race: 'undead', producers: [['und_necro_spawner', 1], ['und_vampire_castle', 1], ['und_lich_spawner', 1], ['und_graveyard', 4], ['und_morgue', 1]] }
    ];
    for (const roster of rosters) {
      for (const level of [1, 3]) {
        const results = await page.evaluate(({ roster, level }) => [11, 73].flatMap(seed => [unitBalanceSample(roster, level, false, seed), unitBalanceSample(roster, level, true, seed)]), { roster, level });
        report.samples.push({ name: roster.name, level, results });
        console.log(roster.name, 'L' + level, results.map(r => `${r.winner}:${r.human}/${r.other}`).join(' '));
      }
    }
    fs.mkdirSync('artifacts', { recursive: true }); const path = `artifacts/unit-balance-${process.env.BALANCE_LABEL || 'current'}.json`;
    fs.writeFileSync(path, JSON.stringify(report, null, 2)); console.log('Saved', path);
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
