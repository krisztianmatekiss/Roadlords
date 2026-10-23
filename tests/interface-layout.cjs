const { chromium } = require('playwright'), assert = require('node:assert/strict'), fs = require('node:fs');
const URL = process.env.ROADLORDS_TEST_URL || 'http://127.0.0.1:4173/Roadlords/';
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const report = { checks: [], errors: [], layouts: [] };
  const check = (name, value) => { assert(value, name); report.checks.push(name); console.log('PASS', name); };
  try {
    const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
    await page.route('https://**/*', r => r.abort());
    page.on('pageerror', e => report.errors.push(e.message));
    await page.goto(URL); await page.waitForFunction(() => !!window.__ROADLORDS_UI_SCALE__);
    await page.locator('.menuBrand').click(); await page.waitForTimeout(900);
    await page.locator('#rlOpenSettings').click();
    check('Settings offer Auto and four numeric percentages, with actual window dimensions',
      (await page.locator('.uiScaleBtn').allTextContents()).join() === 'Automatikus,75%,100%,125%,150%' &&
      (await page.locator('#uiViewportSize').textContent()).includes('1920 × 1080'));
    await page.locator('.uiScaleBtn[data-ui-scale="125"]').click();
    check('A percentage button changes the live scale and accessible selection', await page.evaluate(() =>
      __ROADLORDS_UI_SCALE__.effective() === 1.25 && document.querySelector('.uiScaleBtn[data-ui-scale="125"]').getAttribute('aria-pressed') === 'true'));
    await page.reload(); await page.waitForFunction(() => !!window.__ROADLORDS_RUNTIME__);
    check('The selected percentage survives reload', await page.evaluate(() => __ROADLORDS_UI_SCALE__.get() === '125'));
    await page.evaluate(() => {
      const R = __ROADLORDS_RUNTIME__;
      R.state.running = false; R.state.modal = true; R.MP.enabled = false;
      R.MP.lobby.style.display = 'none'; document.body.classList.remove('roadlords-menu-open');
      R.P.garrison = ['swordsman', 'archer', 'knight', 'mage', 'priest', 'spearman', 'catapult'].map(key => R.makeEntry(R.P, key));
      R.updateHud(); R.renderBuildList();
    });
    async function show(kind, count = 4) {
      await page.evaluate(({ kind, count }) => {
        const R = __ROADLORDS_RUNTIME__;
        let options;
        if (kind === 'mixed') {
          R.roadResetCity(R.P, 'undead');
          R.P.unlocked = new Set(Object.keys(__ROADLORDS_UNDEAD__.buildings));
          R.placeBuilding(R.P, 'und_well', 0, 0);
          options = [R.buildingUpgradePool(R.P).find(o => o.id === 'und_well'), R.makeBuildingChoice(R.P, 'und_morgue'), R.makeBuildingChoice(R.P, 'und_necro_spawner'), R.buildingUpgradePool(R.P).find(o => o.id === 'keep')];
        } else options = (kind === 'legendary' ? R.LEGENDARY : R.NORMAL).filter(o => o.race !== 'undead').slice(0, count).map(o => ({ ...o, kind }));
        R.state.choiceContext = { opts: options, legendary: kind === 'legendary', source: 'timer' };
        R.renderChoice(options, 'VÁLASZTÁS', 'Válassz épületet vagy fejlesztést', '', kind === 'legendary');
        R.$('#choiceOverlay').classList.remove('hidden');
      }, { kind, count });
      await page.waitForTimeout(80);
    }
    async function measure() {
      // ResizeObservers and the road's frame layout run after percentage changes.
      // Measure a rendered layout, rather than relying on an 80 ms wall-clock delay.
      await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      return page.evaluate(() => {
        const rect = e => e.getBoundingClientRect(), modal = document.querySelector('#choiceOverlay .modal');
        const m = rect(modal), list = document.querySelector('#choiceList'), cards = [...list.children];
        const inside = r => r.top >= -.5 && r.left >= -.5 && r.right <= innerWidth + .5 && r.bottom <= innerHeight + .5;
        const bodyOK = c => { const b = c.querySelector('.choiceBody'); return b.clientHeight >= 45 && b.scrollWidth <= b.clientWidth + 1 && getComputedStyle(b).overflowY === 'auto'; };
        const orderOK = c => { const r = selector => rect(c.querySelector(selector)); return r('h3').bottom <= r('.choiceArt').top + 1 && r('.choiceArt').bottom <= r('.choiceBody').top + 1 && r('.choiceBody').bottom <= r('.choiceFooter').top + 1 && r('.choiceFooter').bottom <= rect(c).bottom + 1; };
        const bar = rect(document.querySelector('.topbar')), roster = rect(document.querySelector('#roadRoster'));
        const catalog = rect(document.querySelector('.catalog')), map = rect(document.querySelector('#roadMinimap')), command = rect(document.querySelector('.command'));
        const menu = rect(document.querySelector('.rlGameMenuButton'));
        return { viewport: [innerWidth, innerHeight], mode: __ROADLORDS_UI_SCALE__.get(), count: cards.length,
          fits: inside(m) && m.top >= bar.bottom && rect(cards[0]).height <= list.clientHeight + 1 && inside(rect(document.querySelector('.choiceDockBar'))) && inside(rect(document.querySelector('#minimizeChoice'))),
          outerScroll: modal.scrollHeight - modal.clientHeight,
          equal: cards.every(c => Math.abs(rect(c).height - rect(cards[0]).height) < 1),
          text: cards.every(c => bodyOK(c) && orderOK(c)), deckWidth: list.scrollWidth - list.clientWidth,
          header: roster.top >= bar.top && roster.bottom <= bar.bottom + 1 && roster.right <= innerWidth + 1 && menu.top >= bar.top && menu.bottom <= bar.bottom + 1,
          dock: catalog.right <= map.left + 1 && catalog.bottom <= command.bottom + 1 && Math.abs(command.bottom - innerHeight) < 1,
          bounds: {bar:bar.toJSON(),roster:roster.toJSON(),menu:menu.toJSON(),catalog:catalog.toJSON(),map:map.toJSON(),command:command.toJSON()},
          font: parseFloat(getComputedStyle(cards[0].querySelector('h3')).fontSize), choiceWidth: rect(cards[0]).width, cardWidth: rect(document.querySelector('.buildcard')).width,
          windowLabel: document.querySelector('#uiViewportSize').textContent };
      });
    }
    for (const [width, height] of [[1366, 768], [1920, 1080], [2560, 1440], [3195, 1380], [3840, 2160], [800, 900]]) {
      await page.setViewportSize({ width, height });
      for (const mode of ['75', '100', '125', '150', 'auto']) {
        await page.evaluate(mode => __ROADLORDS_UI_SCALE__.set(mode), mode);
        await show('mixed'); const layout = await measure(); report.layouts.push(layout);
        check(`Mixed cards and fixed actions fit ${width}×${height} at ${mode}`, layout.fits && layout.equal && layout.text && layout.outerScroll <= 1 && layout.deckWidth <= 1);
        if (!layout.header || !layout.dock) console.error('Layout bounds:', JSON.stringify(layout));
        check(`Header and dock remain contained at ${width}×${height}, ${mode}`, layout.header && layout.dock && layout.windowLabel.includes(`${width} × ${height}`));
        if ((width === 3195 && mode === 'auto') || (width === 1366 && mode === '150')) await page.screenshot({ path: `artifacts/interface-${width}-${mode}.png` });
      }
    }
    const desktop = report.layouts.filter(l => l.viewport[0] === 1920 && l.mode !== 'auto');
    check('Percentages resize construction cards while choice text fits the fixed-ratio card boxes', desktop.every(l => l.font >= 10 && l.font <= l.choiceWidth * .072 + 1 && l.font >= l.choiceWidth * .045 - 1 && Math.abs(l.cardWidth - 310 * Number(l.mode) / 100) < 1));
    // Human and Orc HUDs show three resources, unlike the single Undead stock.
    for (const [width, height] of [[800, 900], [1366, 768], [1920, 1080], [3840, 2160]]) {
      await page.setViewportSize({ width, height });
      await page.evaluate(() => { const R = __ROADLORDS_RUNTIME__; R.roadResetCity(R.P, 'human'); R.updateHud(); });
      for (const mode of ['75', '100', '125', '150']) {
        await page.evaluate(mode => __ROADLORDS_UI_SCALE__.set(mode), mode); await page.waitForTimeout(40);
        check(`Three-resource HUD avoids overlaps at ${width}×${height}, ${mode}`, await page.evaluate(() => {
          const rect = s => document.querySelector(s).getBoundingClientRect(), stock = rect('.resources'), run = rect('.topbar > .run'), roster = rect('#roadRoster'), bar = rect('.topbar');
          const apart = (a, b) => a.right <= b.left || a.left >= b.right || a.bottom <= b.top || a.top >= b.bottom;
          return apart(stock, run) && apart(stock, roster) && apart(run, roster) && stock.right <= innerWidth && stock.bottom <= bar.bottom + 1 && run.right <= innerWidth;
        }));
      }
    }
    await page.setViewportSize({ width: 1366, height: 768 });
    await page.evaluate(() => __ROADLORDS_UI_SCALE__.set('100'));
    for (const kind of ['normal', 'legendary']) for (const count of [4, 5, 6]) {
      await show(kind, count); const layout = await measure(); report.layouts.push(layout);
      check(`${count} ${kind} cards keep readable text and reachable actions`, layout.fits && layout.equal && layout.text && layout.outerScroll <= 1 && layout.deckWidth <= 1);
      await page.locator('#choiceList .choice').last().scrollIntoViewIfNeeded();
      await page.evaluate(() => { const list = document.querySelector('#choiceList'); list.scrollTop = list.scrollHeight; });
      check(`The last of ${count} ${kind} cards remains reachable`, await page.evaluate(() => {
        const list = document.querySelector('#choiceList'), last = list.lastElementChild.getBoundingClientRect(), deck = list.getBoundingClientRect();
        return last.bottom <= deck.bottom + 1 && last.top >= deck.top - 1;
      }));
    }
    check('No runtime errors during resizing or selection previews', report.errors.length === 0);
  } finally {
    fs.mkdirSync('artifacts', { recursive: true }); fs.writeFileSync('artifacts/interface-layout.json', JSON.stringify(report, null, 2)); await browser.close();
  }
})().catch(e => { console.error(e); process.exitCode = 1; });
