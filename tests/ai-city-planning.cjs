const { chromium } = require('playwright'), assert = require('node:assert/strict'), fs = require('node:fs');
const URL = process.env.ROADLORDS_TEST_URL || 'http://127.0.0.1:4173/Roadlords/';
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const report = { checks: [], errors: [] }, check = (name, value) => { assert(value, name); report.checks.push(name); console.log('PASS', name); };
  try {
    const page = await browser.newPage(); await page.route('https://**/*', r => r.abort()); page.on('pageerror', e => report.errors.push(e.message));
    await page.goto(URL); await page.waitForFunction(() => !!window.__ROADLORDS_RUNTIME__?.aiLayoutPlan);
    await page.evaluate(() => {
      const R = __ROADLORDS_RUNTIME__;
      window.aiFixture = race => {
        R.MP.enabled = false; R.ROAD.test = false; R.state.running = false; R.aiDecisionCache = null;
        R.roadResetCity(R.E, race); const c = R.E;
        c.unlocked = new Set(Object.keys(R.BUILDINGS).filter(k => k === 'keep' || k === 'warehouse' || (race === 'orc' ? k.startsWith('orc_') : !k.startsWith('orc_'))));
        c.resources = R.C(1e6, 1e6, 1e6); return c;
      };
      window.aiPut = (type, row, col, rotation = 0) => {
        const c = R.E; c.resources = R.C(1e6, 1e6, 1e6);
        const out = R.placeBuilding(c, type, row, col, rotation); if (!out.ok) throw Error(type + ': ' + out.reason);
        return c.buildings.at(-1);
      };
    });
    check('Diagonal proximity is not mistaken for a functioning rally connection', await page.evaluate(() => {
      const R = __ROADLORDS_RUNTIME__, c = aiFixture('human'), hub = aiPut('rally', 2, 2), sp = aiPut('barracks', 1, 1);
      return R.inBuildingRange(hub, sp, 1) && !R.aiSupportAffects(c, hub, sp) && !R.rallyAccepts(c, sp);
    }));
    check('The L4 rally range is recognized by both planner and actual production routing', await page.evaluate(() => {
      const R = __ROADLORDS_RUNTIME__, c = R.E; c.levels.rally = 4; c.l4Branches.rally = 'war_rally';
      const hub = R.buildingOf(c, 'rally')[0], sp = R.buildingOf(c, 'barracks')[0];
      return R.aiSupportAffects(c, hub, sp) && R.rallyAccepts(c, sp);
    }));
    const housing = await page.evaluate(() => {
      const R = __ROADLORDS_RUNTIME__, c = aiFixture('human');
      aiPut('rally', 2, 4); aiPut('barracks', 2, 3); aiPut('archery', 3, 3); aiPut('spearhall', 0, 0);
      const hub = R.buildingOf(c, 'rally')[0];
      for (let i = 0; i < 10; i++) { c.resources = R.C(1e6, 1e6, 1e6); if (!R.aiBuild('house')) throw Error('House construction failed'); }
      const houses = R.adjacentBuildings(c, hub).filter(b => b.type === 'house').length;
      c.resources = R.C(1e6, 1e6, 1e6); const built = R.aiBuild('barracks'), sp = c.buildings.at(-1);
      return { houses, built, connected: R.rallyAccepts(c, sp), destination: R.productionDestination(c, sp), totalHouses: R.buildingOf(c, 'house').length };
    }); report.housing = housing;
    check('Ten later houses leave expansion room beside an underused rally', housing.houses === 0 && housing.totalHouses === 10);
    check('A later barracks uses that space and sends actual recruits to the rally', housing.built && housing.connected && housing.destination === 'rally');
    check('The planner never buys an adjacency-only support building with zero affected producers', await page.evaluate(() => {
      const R = __ROADLORDS_RUNTIME__, c = aiFixture('human'), before = JSON.stringify(c.resources);
      return R.findCell(c, 'rally') === null && R.findCell(c, 'armorsmith') === null && !R.aiBuild('academy') && JSON.stringify(c.resources) === before;
    }));
    check('Normal taverns remain usable without adjacent producers because their wave buff is global', await page.evaluate(() => {
      const R = __ROADLORDS_RUNTIME__, c = R.E; const cell = R.findCell(c, 'tavern');
      return cell && R.canPlace(c, 'tavern', ...cell);
    }));
    check('Global benefits remain buildable even when their optional adjacency bonus has no target', await page.evaluate(() => {
      const R = __ROADLORDS_RUNTIME__, c = R.E; c.legends.add('supply_hub'); c.levels.tavern = 4; c.l4Branches.tavern = 'regulars';
      return !!R.findCell(c, 'warehouse') && !!R.findCell(c, 'tavern');
    }));
    check('Reservations are soft: the final legal house plot remains buildable in a full city', await page.evaluate(() => {
      const R = __ROADLORDS_RUNTIME__, c = aiFixture('human'); aiPut('rally', 2, 4);
      const occupied = R.occupancy(c);
      for (let r = 0; r < 10; r++) for (let col = 0; col < 10; col++) if (!(r === 1 && col === 4) && !occupied.has(R.idx(r, col))) c.buildings.push({ id: 'fill-' + r + '-' + col, type: 'house', level: 1, row: r, col, rotation: 0, progress: 0 });
      const cell = R.findCell(c, 'house'); return cell?.[0] === 1 && cell?.[1] === 4;
    }));
    check('Extended armor range follows the actual armor application helper', await page.evaluate(() => {
      const R = __ROADLORDS_RUNTIME__, c = aiFixture('human'), hub = aiPut('armorsmith', 1, 1), sp = aiPut('barracks', 0, 0);
      const before = !R.aiSupportAffects(c, hub, sp) && !R.armorSmithForSpawner(c, sp);
      c.legends.add('armor_extended_range'); return before && R.aiSupportAffects(c, hub, sp) && !!R.armorSmithForSpawner(c, sp);
    }));
    check('Orc huts preserve expansion room around an arena', await page.evaluate(() => {
      const R = __ROADLORDS_RUNTIME__, c = aiFixture('orc'); aiPut('orc_arena', 2, 4); aiPut('orc_war', 2, 2);
      const hub = R.buildingOf(c, 'orc_arena')[0];
      for (let i = 0; i < 4; i++) { c.resources = R.C(1e6, 1e6, 1e6); if (!R.aiBuild('orc_hut')) return false; }
      return R.adjacentBuildings(c, hub).every(b => b.type !== 'orc_hut');
    }));
    check('An orc support building without affected recruits is deferred', await page.evaluate(() => {
      const R = __ROADLORDS_RUNTIME__, c = aiFixture('orc');
      return R.findCell(c, 'orc_arena') === null && R.findCell(c, 'orc_overseer') === null;
    }));
    check('Preview footprints use the correct city for crowded huts and troll breeding', await page.evaluate(() => {
      const R = __ROADLORDS_RUNTIME__, c = aiFixture('orc'), fake = { type: 'orc_hut', row: 0, col: 0, rotation: 0 };
      R.P.legends.add('orc_crowded_huts'); if (R.cityBuildingCells(c, fake).length !== 4) return false;
      R.P.legends.delete('orc_crowded_huts'); c.legends.add('orc_crowded_huts'); if (R.cityBuildingCells(c, fake).length !== 1) return false;
      c.levels.orc_troll = 4; c.l4Branches.orc_troll = 'breeding';
      return R.cityBuildingCells(c, { ...fake, type: 'orc_troll' }).length === 4 && R.cityBuildingCells(R.P, { ...fake, type: 'orc_troll' }).length === 9;
    }));
    check('Layout memoization tracks temporary building removals during AI swap evaluation', await page.evaluate(() => {
      const R = __ROADLORDS_RUNTIME__, c = aiFixture('human'); const sp = aiPut('barracks', 1, 1), occupied = R.occupancy(c);
      for (let r = 0; r < 10; r++) for (let col = 0; col < 10; col++) if (!occupied.has(R.idx(r, col))) c.buildings.push({ id: 'cache-fill-' + r + '-' + col, type: 'house', level: 1, row: r, col, rotation: 0 });
      R.aiDecisionCache = new Map();
      try {
        const before = R.aiLayoutPlan(c).producers.length; if (R.findCell(c, 'house') !== null) return false;
        c.buildings = c.buildings.filter(b => b.id !== sp.id);
        const cell = R.findCell(c, 'house');
        return before === 1 && R.aiLayoutPlan(c).producers.length === 0 && cell?.[0] === 1 && cell?.[1] === 1;
      } finally { R.aiDecisionCache = null; }
    }));
    check('Human AI recognizes every orc role, counts trolls as four slots and ignores dead units', await page.evaluate(() => {
      const R = __ROADLORDS_RUNTIME__; aiFixture('human');
      R.state.units = Object.keys(R.UNITS).filter(k => k.startsWith('orc_')).map(key => ({ key, alive: true, side: 'player' }));
      R.state.units.push({ key: 'orc_troll', alive: false, side: 'player' });
      R.P.garrison = []; R.P.releaseQueue = []; R.P.rallyReserve = [];
      const mix = __ROADLORDS_AI_V4980__.observed();
      return mix.swordsman === 2 && mix.archer === 1 && mix.knight === 5 && mix.mage === 1 && mix.catapult === 1 && __ROADLORDS_AI_V4980__.counter('spearman') > 0;
    }));
    check('Optimized orc search agrees with legal placement across terrain, rotations and changed footprints', await page.evaluate(() => {
      const R = __ROADLORDS_RUNTIME__, c = aiFixture('orc');
      for (let i = 0; i < 100; i++) if (i % 7 === 0 && !R.occupancy(c).has(i)) c.terrain[i] = { type: 'ruin' };
      for (const changed of [false, true]) {
        c.legends = new Set(changed ? ['orc_crowded_huts'] : []);
        c.levels.orc_troll = changed ? 4 : 1; c.l4Branches.orc_troll = changed ? 'breeding' : null;
        for (const type of ['orc_work', 'orc_hunt', 'orc_hut', 'orc_war', 'orc_warg', 'orc_shaman', 'orc_ram', 'orc_troll']) {
          const selected = R.findCell(c, type); let exists = false;
          for (const rotation of R.rotationOptions(type)) for (let r = 0; r < 10; r++) for (let col = 0; col < 10; col++) if (R.canPlace(c, type, r, col, rotation)) exists = true;
          if (!!selected !== exists || selected && !R.canPlace(c, type, ...selected)) return false;
        }
      }
      return true;
    }));
    const redevelopment = await page.evaluate(() => {
      const R=__ROADLORDS_RUNTIME__;
      const fullWells=()=>{
        R.MP.enabled=false;R.roadResetCity(R.E,'undead');const c=R.E;
        c.terrain.fill(null);c.unlocked=new Set(Object.keys(__ROADLORDS_UNDEAD__.buildings));c.resources=R.C(100000,0,0);
        for(let row=0;row<10;row++)for(let col=0;col<10;col++)if(!R.occupancy(c).has(R.idx(row,col))){const out=R.placeBuilding(c,'und_well',row,col,0,true);if(!out.ok)throw Error(out.reason);}
        R.setBuildingLevel(c,'und_well',4);return c;
      };
      let c=fullWells();const before=R.buildingOf(c,'und_well').length;
      const madeRoom=R.aiMakeRoomFor('und_graveyard'),built=R.aiBuild('und_graveyard');
      const funded={madeRoom,built,wells:R.buildingOf(c,'und_well').length,before,gain:R.productionRates(c).wood,use:R.resourceFlowRates(c).use.wood,replaced:c.undeadState.aiRedeveloped};
      c.resources.wood=0;const unchanged=JSON.stringify(c.buildings);const noCash=!R.aiMakeRoomFor('und_graveyard')&&JSON.stringify(c.buildings)===unchanged;
      c=fullWells();R.setBuildingLevel(c,'und_well',1);for(const [i,b]of R.buildingOf(c,'und_well').entries())b.inactive=i>=4;R.recomputeCity(c,true);
      const leanBefore=JSON.stringify(c.buildings),noSupply=!R.aiMakeRoomFor('und_graveyard')&&JSON.stringify(c.buildings)===leanBefore;
      return {funded,noCash,noSupply};
    });report.redevelopment=redevelopment;
    check('Undead AI reuses one redundant upgraded Well only when a real, fully funded military building can replace it',redevelopment.funded.madeRoom&&redevelopment.funded.built&&redevelopment.funded.wells===redevelopment.funded.before-1&&redevelopment.funded.replaced===1&&redevelopment.funded.gain>redevelopment.funded.use*1.15);
    check('Undead redevelopment leaves the city intact when construction is unaffordable or would underfund training',redevelopment.noCash&&redevelopment.noSupply);
    check('No AI city-planning runtime errors', report.errors.length === 0);
  } finally { fs.mkdirSync('artifacts', { recursive: true }); fs.writeFileSync('artifacts/ai-city-planning.json', JSON.stringify(report, null, 2)); await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
