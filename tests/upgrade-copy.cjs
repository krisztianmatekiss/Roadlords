const { chromium } = require('playwright'), assert = require('node:assert/strict'), fs = require('node:fs');
const URL = process.env.ROADLORDS_TEST_URL || 'http://127.0.0.1:4173/Roadlords/';
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const report = { checks: [], errors: [] };
  const check = (name, ok) => { assert(ok, name); report.checks.push(name); console.log('PASS', name); };
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 960 } });
    await page.route('https://**/*', r => r.abort());
    page.on('pageerror', e => report.errors.push(e.message));
    await page.goto(URL); await page.waitForFunction(() => !!window.__ROADLORDS_RUNTIME__?.upgradeCopyPreview);
    await page.locator('.menuBrand').click(); await page.waitForTimeout(900);
    await page.evaluate(()=>__ROADLORDS_RUNTIME__.roadStartTest(42,{count:50}));
    await page.evaluate(() => { __ROADLORDS_ROAD__.pause(); });
    const audit = await page.evaluate(() => {
      const R = __ROADLORDS_RUNTIME__, city = { ...R.P, race: 'human', normal: {}, legends: new Set(), legendaryStacks: {}, levels: {}, l4Branches: {} };
      const preview = (id, n = 0, kind = 'normal') => R.upgradeCopyPreview({ ...city, race: id.startsWith('orc_') ? 'orc' : 'human', normal: { [id]: n }, legendaryStacks: { [id]: n }, legends: new Set(n && kind === 'legendary' ? [id] : []) }, { id, kind });
      const normal = R.NORMAL.filter(o => o.race !== 'undead'), legendary = R.LEGENDARY.filter(o => o.race !== 'undead');
      const all = [...normal.map(x => ({ ...x, kind: 'normal' })), ...legendary.map(x => ({ ...x, kind: 'legendary' }))];
      const snapshot = () => {
        const seen = new WeakSet();
        return JSON.stringify({ p: R.P, e: R.E, units: R.state.units, towers: R.towers, pending: R.state.pendingChoices }, (_k, v) => {
          if (v instanceof Set) return [...v];
          if (v && typeof v === 'object') { if (seen.has(v)) return '[reference]'; seen.add(v); }
          return v;
        });
      };
      const before = snapshot(), oldRandom = Math.random; let randomCalls = 0;
      Math.random = () => { randomCalls++; return .5; };
      let entries;
      try { entries = all.map(o => R.upgradeCopyPreview(city, o)); } finally { Math.random = oldRandom; }
      return {
        coverage: [normal.length, legendary.length, entries.length], pure: before === snapshot() && randomCalls === 0,
        rows: normal.every(o => preview(o.id).rows.length > 0), text: entries.every(p => p.description.length > 10 && p.description.length <= 240 && !/\b(spawner|cooldown|stack|pick|Heavy|Magic|Shield|NaN|Infinity)\b/i.test(p.description)),
        conciseBuildings: Object.values(R.BUILDINGS).every(d => d.description.length > 10 && d.description.length <= 240 && !/L1:|Másik L4 ág|spawner|stack|pool/i.test(d.description)),
        conciseBranches: Object.values(R.V4_BRANCHES).flat().every(d => d.description.length > 10 && d.description.length <= 240 && !/spawner|stack|pool|Shield/i.test(d.description)),
        undeadCopy: Object.values(__ROADLORDS_UNDEAD__.buildings).every(d => d.levels.length === 4 && d.levels.every(x => x.length > 5 && x.length <= 150)) && [...R.NORMAL, ...R.LEGENDARY].filter(o => o.race === 'undead').every(o => o.description.length > 10 && o.description.length <= 240 && !/spawner|stack|pool|Shield|Halmozható\./i.test(o.description)),
        sword: preview('swordsman_dmg'), priest: preview('priest_dmg'), speed: preview('sword_as'), orc: preview('orc_warrior_dmg'),
        bleed: [preview('orc_bleed'), preview('orc_bleed', 1)], leech: [preview('orc_leech'), preview('orc_leech', 1)],
        discount: preview('building_discount', 4), frugal: preview('frugal_training', 1), crit: preview('orc_crit', 25), blessing: preview('orc_blessing', 39),
        repeats: ['sword_execute', 'magic_order', 'tavern_chain', 'strategic_superiority', 'glass_cannon'].map(id => preview(id, 0, 'legendary')),
        specialization: R.upgradeCopyPreview({ ...city, normal: { swordsman_dmg: 1 }, legends: new Set(['specialization']) }, { id: 'swordsman_dmg', kind: 'normal' }),
        noFood: R.LEGENDARY.find(x => x.id === 'no_food').description,
        factory: R.LEGENDARY.find(x => x.id === 'factory_network').description
      };
    }); report.audit = audit;
    check('All 63 common and 87 legendary descriptions have final, jargon-free copy', audit.coverage.join() === '63,87,150' && audit.text);
    check('All faction building roles, branches and Undead levels use concise text without workbook dumps or internal jargon', audit.conciseBuildings && audit.conciseBranches && audit.undeadCopy);
    check('All common cards provide a numeric preview without changing cities, units, towers or RNG', audit.pure && audit.rows);
    check('Human damage and priest healing previews use actual unit stats', audit.sword.rows.some(r => r.before === '12' && r.after === '13,2') && audit.priest.rows.some(r => r.before === '30' && r.after === '33'));
    check('Attack-speed preview shows a shorter attack interval, not a false additive reduction', audit.speed.rows.some(r => r.before === '1 mp' && r.after === '0,87 mp'));
    check('Orc unit preview uses the orc stat chain', audit.orc.rows.some(r => r.before === '20' && r.after === '22'));
    check('Bleed and lifesteal correctly distinguish first and subsequent pickups', audit.bleed[0].rows[0].after === '2' && audit.bleed[1].rows[0].after === '3' && audit.leech[0].rows[0].after === '5%' && audit.leech[1].rows[0].after === '7%');
    check('Building discount caps at 50%; repeated training discounts multiply', audit.discount.rows[0].after === '50%' && audit.discount.stacking.includes('5×') && audit.frugal.rows[0].after === '90,25%');
    check('Critical chance above 100% remains visible; blessing shows its 100% cap', audit.crit.rows[0].after === '104%' && audit.blessing.rows[0].after === '100%' && audit.blessing.stacking.includes('40×'));
    check('Legendary cards distinguish one-time effects, repeatable relics and 5/4-stack limits', audit.repeats[0].stacking.includes('5×') && audit.repeats[1].stacking.includes('4×') && audit.repeats[2].stacking.includes('Korlátlanul') && audit.repeats[3].stacking.includes('Korlátlanul') && audit.repeats[4].stacking.includes('Egyszer'));
    check('Specialization preview explains the extra chance without rolling it', audit.specialization.specialization.includes('50%') && audit.specialization.rows[0].after === '14,4');
    check('Conscription and factory-chain descriptions match implemented 25% / 15-point effects', audit.noFood.includes('25%') && audit.factory.includes('15 százalékpont'));
    // Compare preview against the real choice application, including existing upgrades and relics.
    check('Previewed values match actual choices for upgraded, specialized human and orc cities', await page.evaluate(() => {
      const R = __ROADLORDS_RUNTIME__, original = R.P;
      const cases = [['swordsman_dmg', 'swordsman', 'dmg', 'human'], ['priest_dmg', 'priest', 'heal', 'human'], ['sword_as', 'swordsman', 'cooldown', 'human'], ['cat_build', 'catapult', 'buildingDamage', 'human'], ['orc_warrior_hp', 'orc_warrior', 'hp', 'orc'], ['orc_warrior_dmg', 'orc_warrior', 'dmg', 'orc']];
      const format = x => new Intl.NumberFormat('hu-HU', { maximumFractionDigits: 2 }).format(x);
      try {
        return cases.every(([id, key, metric, race]) => {
          const c = R.makeCity('player'); c.race = race; c.normal = { [id]: 2, all_damage: 3, orc_hp: 2 }; c.legends = new Set(['glass_cannon', ...(race === 'orc' ? ['orc_momentum'] : [])]); R.P = c;
          const choice = { ...R.NORMAL.find(x => x.id === id), kind: 'normal' };
          const p = R.upgradeCopyPreview(c, choice); R.applyChoice(c, choice);
          const actual = R.statsFor(c, { key, veteran: false })[metric];
          return p.rows.some(row => row.after === format(actual) + (metric === 'cooldown' ? ' mp' : ''));
        });
      } finally { R.P = original; }
    }));
    async function show(ids, kind = 'normal') {
      await page.evaluate(({ ids, kind }) => {
        const R = __ROADLORDS_RUNTIME__, defs = kind === 'legendary' ? R.LEGENDARY : R.NORMAL;
        // Deliberately stale option text must never override the canonical copy.
        R.renderChoice(ids.map(id => ({ ...defs.find(o => o.id === id), kind, description: 'ELAVULT SZÖVEG' })), 'FEJLESZTÉSEK', 'Válassz fejlesztést!', '', kind === 'legendary');
        R.$('#choiceOverlay').classList.remove('hidden');
      }, { ids, kind });
      await page.waitForTimeout(100);
    }
    await show(['swordsman_dmg', 'priest_dmg', 'frugal_training', 'building_discount']);
    check('Choice cards render canonical text and comparisons without repeated headings or stacking paragraphs', await page.evaluate(() => [...document.querySelectorAll('#choiceList .choice')].every(c => !c.textContent.includes('ELAVULT') && c.querySelector('.upgradeComparison') && !c.querySelector('.upgradeStacking,.upgradeHeading,.upgradeContext') && c.title.includes('Felvéve'))));
    await page.screenshot({ path: 'artifacts/upgrade-copy-human.png' });
    check('Card titles, art, text and footer do not overlap', await page.evaluate(() => [...document.querySelectorAll('#choiceList .choice')].every(c => {
      const rect = selector => c.querySelector(selector).getBoundingClientRect();
      return rect('h3').bottom <= rect('.choiceArt').top + 1 && rect('.choiceArt').bottom <= rect('.choiceBody').top + 1 && rect('.choiceBody').bottom <= rect('.choiceFooter').top + 1;
    })));
    await page.evaluate(()=>{for(const id of ['orc_as','orc_hp','all_damage'])__ROADLORDS_RUNTIME__.P.normal[id]=0});
    await show(['orc_as', 'orc_hp', 'all_damage']);
    check('Army-wide upgrades compare cumulative percentages without an arbitrary unit stat or interval', await page.evaluate(() => [...document.querySelectorAll('#choiceList .choiceBody')].every(b => b.querySelector('.upgradeBefore')?.textContent==='+0%' && b.querySelector('.upgradeAfter')?.textContent==='+5%' && !/\bmp\b/.test(b.textContent))));
    await page.evaluate(() => document.fonts.ready);
    check('Fantasy titles load locally with Hungarian accents, and single-unit comparisons have visible labels', await page.evaluate(() => document.fonts.check('16px "Roadlords Display"', 'ÁÉÍÓÖŐÚÜŰ')));
    await show(['sword_as']);
    check('Single-unit attack intervals retain their explicit visible metric label', await page.locator('.upgradeMetric').evaluate(e => e.textContent === 'Két támadás között' && !e.classList.contains('sr-only') && e.clientHeight > 0));
    await show(['orc_blessing', 'orc_bleed', 'orc_leech', 'orc_crit']);
    check('Long descriptions remain complete and scroll to the final comparison', await page.evaluate(() => [...document.querySelectorAll('#choiceList .choiceBody')].every(b => {
      const p = b.querySelector('p'), s = getComputedStyle(p); b.scrollTop = b.scrollHeight;
      return getComputedStyle(b).overflowY === 'auto' && s.webkitLineClamp === 'none' && s.whiteSpace === 'normal' && b.querySelector('.upgradeComparison').getBoundingClientRect().bottom <= b.getBoundingClientRect().bottom + 1;
    })));
    await show(['sword_execute', 'magic_order', 'tavern_chain', 'strategic_superiority'], 'legendary');
    await page.screenshot({ path: 'artifacts/upgrade-copy-legends.png' });
    await page.setViewportSize({ width: 800, height: 900 });
    await show(['orc_blessing', 'orc_bleed', 'orc_leech', 'orc_crit']);
    check('At 800px all text remains reachable without horizontal scrolling inside cards', await page.evaluate(() => [...document.querySelectorAll('#choiceList .choiceBody')].every(b => b.clientHeight >= 45 && b.scrollWidth <= b.clientWidth + 1 && getComputedStyle(b).overflowY === 'auto')));
    await page.screenshot({ path: 'artifacts/upgrade-copy-800.png' });
    await page.setViewportSize({ width: 1440, height: 960 });
    check('Building upgrades retain current-to-next values and city-wide scope', await page.evaluate(() => {
      const R = __ROADLORDS_RUNTIME__, c = { ...R.P, levels: {}, legends: new Set(['instant_l3']) };
      return R.upgradeTargetLevel(c, 'lumber') === 3 && R.buildingUpgradeDetails(c, 'lumber').includes('1 → 3') && R.buildingUpgradeDetails(c, 'lumber').includes('Minden jelenlegi és későbbi');
    }));
    await show(['swordsman_dmg']);
    await page.evaluate(() => { const R = __ROADLORDS_RUNTIME__; window.__copyClicked = null; R.choose = (o, i) => { window.__copyClicked = [o.id, i]; }; });
    await page.locator('#choiceList .choice').click();
    check('Rendering enhanced copy preserves the card choice handler', await page.evaluate(() => __copyClicked?.[0] === 'swordsman_dmg' && __copyClicked[1] === 0));
    check('No browser runtime errors', report.errors.length === 0);
  } finally { fs.mkdirSync('artifacts', { recursive: true }); fs.writeFileSync('artifacts/upgrade-copy.json', JSON.stringify(report, null, 2)); await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
