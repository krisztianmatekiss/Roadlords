const { chromium } = require('playwright'),
  assert = require('node:assert/strict'),
  fs = require('node:fs');
const URL = process.env.ROADLORDS_TEST_URL || 'http://127.0.0.1:4173/Roadlords/';
(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium',
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  });
  const report = {
    checks: [],
    errors: [],
    transport:
      'Two independent browser pages exchange JSON through the real snapshot, strategy and hello handlers; not an Internet WebRTC connectivity test.',
  };
  const check = (name, value) => {
    assert(value, name);
    report.checks.push(name);
    console.log('PASS', name);
  };
  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 960 } });
    await context.route('https://**/*', (r) => r.abort());
    const host = await context.newPage(),
      guest = await context.newPage();
    for (const [page, role] of [
      [host, 'host'],
      [guest, 'guest'],
    ]) {
      page.on('pageerror', (e) => report.errors.push(e.message));
      await page.goto(URL);
      await page.waitForFunction(() => !!window.__ROADLORDS_UNDEAD__);
      await page.evaluate((role) => {
        const R = __ROADLORDS_RUNTIME__;
        R.state.running = false;
        R.state.modal = false;
        R.state.pregame = false;
        R.state.startChoices = 0;
        R.MP.enabled = true;
        R.MP.role = role;
        R.MP.peer = true;
        R.MP.started = true;
        R.MP.guestChoicePending = false;
        window.packets = [];
        R.MP.conn = {
          open: true,
          dataChannel: { bufferedAmount: 0 },
          send: (p) => packets.push(JSON.parse(JSON.stringify(p))),
          close: () => (window.connectionClosed = true),
        };
      }, role);
    }
    await host.evaluate(() => {
      const R = __ROADLORDS_RUNTIME__;
      R.roadResetCity(R.P, 'undead');
      R.roadResetCity(R.E, 'human');
      R.state.units = [];
      R.ROAD.clock = 20;
      R.ROAD.pending = [];
      for (const t of R.towers) t.alive = false;
      R.roadRefreshFrontiers();
      const lich = R.releaseUnit(R.P, R.makeEntry(R.P, 'und_lich', { undElite: true })),
        target = R.releaseUnit(R.E, R.makeEntry(R.E, 'swordsman'));
      lich.lane = 2400;
      lich.offset = 20;
      target.lane = 2450;
      target.offset = 25;
      lich.undBeams = [{ id: target.id, age: 7.5 }];
      target.orcPoison = 4;
      const clone = R.undSpawn(R.P, 'und_ghost', 2380, -10, {
        undMirror: true,
        undSummoned: true,
        undNoArmySlot: true,
      });
      clone.temporary = 10;
      R.P.resources = R.C(12345, 0, 0);
      R.roadReindex();
    });
    const snapshot = async () => {
      const packet = await host.evaluate(() => {
        const R = __ROADLORDS_RUNTIME__;
        R.mpSendSnapshot(true);
        return packets.filter((p) => p.type === 'snapshot').at(-1);
      });
      await guest.evaluate((p) => {
        const R = __ROADLORDS_RUNTIME__;
        R.MP.pendingStrategy = null;
        R.mpHandle(p);
      }, packet);
      return packet;
    };
    const first = await snapshot();
    report.firstPacketBytes = JSON.stringify(first).length;
    check(
      'Undead rows append their faction payload; unchanged Human rows retain the 20-column protocol',
      first.units.filter((r) => r[2].startsWith('und_')).every((r) => r.length === 21) &&
        first.units.find((r) => r[2] === 'swordsman').length === 20,
    );
    const mirrored = await guest.evaluate(() => {
      const R = __ROADLORDS_RUNTIME__,
        lich = R.state.units.find((u) => u.key === 'und_lich'),
        clone = R.state.units.find((u) => u.undMirror);
      R.renderStatic();
      return {
        races: [R.P.race, R.E.race],
        hp: R.E.hp,
        souls: R.E.resources.wood,
        lich: {
          side: lich.side,
          lane: lich.lane,
          offset: lich.offset,
          elite: lich.undElite,
          beams: lich.undBeams,
        },
        clone: { noSlot: clone.undNoArmySlot, summoned: clone.undSummoned, mirror: clone.undMirror },
        L: R.PATH_LENGTH,
      };
    });
    check(
      'Guest mirrors ownership and both axes while preserving undead city stock and capital HP',
      mirrored.races.join() === 'human,undead' &&
        mirrored.hp === 2000 &&
        mirrored.souls === 12345 &&
        mirrored.lich.side === 'enemy' &&
        mirrored.lich.lane === mirrored.L - 2400 &&
        mirrored.lich.offset === -20,
    );
    check(
      'Beam target IDs/age, Elite state and no-slot mirror summons survive snapshots',
      mirrored.lich.elite &&
        mirrored.lich.beams[0].age === 7.5 &&
        mirrored.clone.noSlot &&
        mirrored.clone.summoned &&
        mirrored.clone.mirror,
    );
    await host.evaluate(() => {
      const R = __ROADLORDS_RUNTIME__;
      R.roadResetCity(R.P, 'human');
      R.roadResetCity(R.E, 'undead');
      R.E.unlocked = new Set(Object.keys(__ROADLORDS_UNDEAD__.buildings));
      R.E.resources = R.C(10000, 0, 0);
      R.state.units = [];
      for (const [type, r, c] of [
        ['und_soul_bank', 0, 0],
        ['und_soul_burner', 0, 3],
        ['und_graveyard', 0, 4],
      ]) {
        const out = R.placeBuilding(R.E, type, r, c);
        if (!out.ok) throw Error(out.reason);
      }
      R.E.resources.wood = -80;
      R.E.buildings.find((b) => b.type === 'und_soul_burner').undHp = 51;
      R.E.buildings.find((b) => b.type === 'und_graveyard').undStarve = 4;
    });
    await snapshot();
    check(
      'An Undead guest sees its own Soul debt and training pause through the real HUD',
      await guest.evaluate(() => {
        const R = __ROADLORDS_RUNTIME__;
        R.updateHud();
        return (
          (R.P.race === 'undead' &&
            R.P.resources.wood === -80 &&
            document.querySelector('#woodStock').textContent.includes('−')) ||
          (R.P.race === 'undead' &&
            R.P.resources.wood === -80 &&
            document.querySelector('#woodStock').textContent.includes('-80'))
        );
      }),
    );
    const strategy = await guest.evaluate(() => {
      const R = __ROADLORDS_RUNTIME__;
      R.P.resources.wood = 100;
      const b = R.P.buildings.find((b) => b.type === 'und_soul_burner');
      b.undHp = 100;
      R.P.buildings.find((b) => b.type === 'und_graveyard').undStarve = 0;
      return R.mpStrategy(R.P);
    });
    await host.evaluate(
      (data) => __ROADLORDS_RUNTIME__.mpHandle({ type: 'strategy', seq: 50, data }),
      strategy,
    );
    check(
      'Guest strategy cannot reset authoritative building burn HP or unpaid duration',
      await host.evaluate(() => {
        const R = __ROADLORDS_RUNTIME__;
        return (
          R.E.buildings.find((b) => b.type === 'und_soul_burner').undHp === 51 &&
          R.E.buildings.find((b) => b.type === 'und_graveyard').undStarve === 4
        );
      }),
    );
    const afterLoss = await host.evaluate((data) => {
      const R = __ROADLORDS_RUNTIME__,
        b = R.E.buildings.find((b) => b.type === 'und_soul_burner');
      R.E.buildings = R.E.buildings.filter((x) => x.id !== b.id);
      R.undBuildingLost(R.E, b.id);
      R.mpApplyGuestStrategy(data, 51);
      return !R.E.buildings.some((x) => x.id === b.id);
    }, strategy);
    check(
      'A stale guest command cannot recreate a building already destroyed by upkeep or burning',
      afterLoss,
    );
    check(
      'Hello advertises faction protocol 2 and refuses old clients only when Undead is involved',
      await guest.evaluate(() => {
        const R = __ROADLORDS_RUNTIME__;
        R.mpSend({ type: 'hello' });
        const hello = packets.at(-1);
        R.mpHandle({ type: 'hello', race: 'undead', orcProtocol: 1 });
        return hello.race === 'undead' && hello.factionProtocol === 2 && window.connectionClosed;
      }),
    );
    check('No Undead multiplayer runtime errors', report.errors.length === 0);
  } finally {
    fs.mkdirSync('artifacts', { recursive: true });
    fs.writeFileSync('artifacts/undead-multiplayer.json', JSON.stringify(report, null, 2));
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
