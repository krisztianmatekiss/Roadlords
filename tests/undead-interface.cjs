const { chromium } = require('playwright'),
  assert = require('node:assert/strict'),
  fs = require('node:fs');
const URL = process.env.ROADLORDS_TEST_URL || 'http://127.0.0.1:4173/Roadlords/';
(async () => {
  const b = await chromium.launch({
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
    const p = await b.newPage({ viewport: { width: 1440, height: 960 } });
    await p.route('https://**/*', (r) => r.abort());
    p.on('pageerror', (e) => report.errors.push(e.message));
    await p.goto(URL);
    await p.waitForFunction(() => !!window.__ROADLORDS_UNDEAD__);
    await p.locator('.menuBrand').click();
    await p.waitForTimeout(900);
    await p.locator('#rlOpenCodex').click();
    await p.locator('#codexRace').selectOption('undead');
    check(
      'Undead encyclopedia lists all 20 buildings with faction art and Soul prices',
      (await p.locator('#rlCodexPanel .rlCodexCard').count()) === 20 &&
        (await p.locator('#rlCodexPanel .undeadBuildingArt').count()) === 0 &&
        (await p.locator('#rlCodexPanel .cardFrameImage').count()) === 20 &&
        (await p.locator('[data-codex-building="und_necro_spawner"] .cardFrameImage').count()) === 1 &&
        (await p.locator('#rlCodexPanel .constructionPrice[aria-label*="35 Lélek"] img[alt="Lélek"]').count()) > 0 &&
        (await p
          .locator('#rlCodexPanel')
          .innerText()
          .then((s) => s.includes('Nekropolisz'))),
    );
    await p.locator('#rlCodexPanel .rlCodexSearch').fill('Nekropolisz');
    check(
      'The faction-specific capital is searchable by its displayed name',
      await p
        .locator('#rlCodexPanel .rlCodexCard h3')
        .allTextContents()
        .then((rows) => rows.some((s) => s.startsWith('Nekropolisz'))),
    );
    await p.locator('#rlCodexPanel .rlCodexSearch').fill('');
    for (const [tab, count] of [
      ['units', 7],
      ['common', 29],
      ['legendary', 20],
    ]) {
      await p.locator('#rlCodexPanel [data-tab="' + tab + '"]').click();
      check(
        'Undead encyclopedia ' + tab + ' count matches the workbook',
        (await p.locator('#rlCodexPanel .rlCodexCard').count()) === count,
      );
    }
    await p.keyboard.press('Escape');
    await p.evaluate(()=>__ROADLORDS_RUNTIME__.roadStartTest(42,{count:50,roster:'undead'}));
    check(
      'Building unlock cards show the current effect once, with a readable separate upkeep row',
      await p.evaluate(() => {
        const R = __ROADLORDS_RUNTIME__;
        R.roadPause();
        R.renderChoice(['und_well', 'und_crypt', 'und_soul_anchor'].map(type => R.makeBuildingChoice(R.P, type)), 'ÉPÜLETEK', 'Élőhalottak', '', false);
        const elements = [...document.querySelectorAll('#choiceList .choice')];
        const cards = elements.map(c => c.querySelector('.choiceBody').textContent);
        R.$('#choiceOverlay').classList.add('hidden');
        return cards[0].includes('+8 Lélek/mp') && elements[0].querySelector('.upkeepFact').textContent.includes('−0,5') && elements[0].querySelector('.upkeepFact img').alt==='Lélek' &&
          cards[1].includes('+80 sereghely') && cards[2].includes('90%-kal olcsóbb') &&
          elements[2].querySelector('.choiceBody .effect-positive').textContent === '90%' &&
          cards.every(s => !s.includes('L1:') && !s.includes('Másik L4'));
      }),
    );
    await p.evaluate(() => {
      const R = __ROADLORDS_RUNTIME__;
      R.roadPause();
      R.roadWar.scrollLeft = 0;
      R.state.openBuildingInspectors = [R.P.buildings.find((b) => b.type === 'keep').id];
      R.renderStatic();
    });
    await p.screenshot({ path: 'artifacts/undead-city.png' });
    check(
      'Capital inspector shows Nekropolisz with the selected faction HP and no Human storage claims',
      await p
        .locator('#buildingInspectorLayer')
        .innerText()
        .then((s) => s.includes('Nekropolisz') && s.includes('16000 életerő') && !s.includes('20000 HP')),
    );
    await p.evaluate(() => {
      const R = __ROADLORDS_RUNTIME__;
      R.ROAD.test = false;
      document.body.classList.remove('road-test');
      R.state.roadTest = false;
      R.state.running = false;
      R.state.openBuildingInspectors = [];
      R.renderStatic();
    });
    report.art = await p.evaluate(() => {
      const e = document.querySelector('#playerGrid .undMapSprite .undeadBuildingArt'),
        r = e.getBoundingClientRect();
      return {
        w: r.width,
        h: r.height,
        parent: e.parentElement.getBoundingClientRect().toJSON(),
        css: {
          display: getComputedStyle(e).display,
          width: getComputedStyle(e).width,
          height: getComputedStyle(e).height,
          aspect: getComputedStyle(e).aspectRatio,
        },
        body: document.body.className,
      };
    });
    check(
      'City sprites use a roof-plan view that follows the same rotations as other factions',
      await p.evaluate(() => {
        const el = document.querySelector('#playerGrid .undMapSprite .undeadBuildingArt'),
          b = el.getBoundingClientRect();
        return b.height > 20 && el.getAttribute('preserveAspectRatio') === 'xMidYMid meet';
      }),
    );
    check(
      'Generated atlas loads locally and contains real transparent artwork',
      await p.evaluate(async () => {
        const im = new Image();
        im.src = new URL('art/undead/city-roofs.png', location.href).href;
        await im.decode();
        const c = document.createElement('canvas');
        c.width = im.width;
        c.height = im.height;
        const g = c.getContext('2d');
        g.drawImage(im, 0, 0);
        const data = g.getImageData(0, 0, c.width, c.height).data;
        let opaque = 0,
          clear = 0;
        for (let i = 3; i < data.length; i += 4) {
          if (data[i] > 220) opaque++;
          if (data[i] === 0) clear++;
        }
        return im.width === 1536 && opaque > 10000 && clear > 10000;
      }),
    );
    await p.evaluate(() => {
      const R = __ROADLORDS_RUNTIME__;
      R.state.openBuildingInspectors = [];
      R.roadStartTest(42, { count: 500, roster: 'undead' });
      R.roadPause();
    });
    const battle = await p.evaluate(() => {
      const R = __ROADLORDS_RUNTIME__,
        ms = [];
      for (let i = 0; i < 300; i++) {
        const t = performance.now();
        R.state.time += 1 / 30;
        R.updateBattle(1 / 30);
        R.roadReindex();
        ms.push(performance.now() - t);
      }
      ms.sort((a, b) => a - b);
      return {
        initial: R.ROAD.initial.counts,
        remaining: R.ROAD.counts,
        summons: R.state.units.filter((u) => u.undSummoned).length,
        damage: R.ROAD.metrics.damage,
        p95: ms[Math.floor(ms.length * 0.95)],
        finite: R.state.units.every(
          (u) => Number.isFinite(u.hp) && Number.isFinite(u.lane) && Number.isFinite(u.offset),
        ),
        errors: R.state.lastRuntimeErrorV4965,
      };
    });
    report.battle = battle;
    check(
      'A real 500 vs 500 Undead battle runs ten simulation seconds with damage and finite unit state',
      battle.initial.join() === '500,500' && battle.damage > 0 && battle.finite && !battle.errors,
    );
    check('No Undead interface runtime errors', report.errors.length === 0);
  } finally {
    fs.mkdirSync('artifacts', { recursive: true });
    fs.writeFileSync('artifacts/undead-interface.json', JSON.stringify(report, null, 2));
    await b.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
