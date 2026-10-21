export function register(runtime) {
  runtime.roadResetCity = function roadResetCity(c, race) {
    for (const k of Object.keys(c)) delete c[k];
    Object.assign(c, structuredClone(runtime.ROAD.templates[c === runtime.E ? 1 : 0]));
    c.race = race;
    c.l4Branches = {};
    c.terrain = Array(runtime.GRID * runtime.GRID).fill(null);
    c.unlocked = new Set(race === 'orc' ? window.__ROADLORDS_ORCS__.basic : runtime.BASIC);
    c.unitColor = c === runtime.P ? 'blue' : 'red';
  };
  runtime.roadEndgame = function roadEndgame(c) {
    const orc = c.race === 'orc',
      allowed = Object.keys(runtime.BUILDINGS).filter(k => k === 'keep' || (orc ? k.startsWith('orc_') || k === 'warehouse' : !k.startsWith('orc_')));
    c.unlocked = new Set(allowed);
    c.resources = runtime.C(1e8, 1e8, 1e8);
    const types = allowed.filter(k => k !== 'keep').sort((a, b) => runtime.BUILDINGS[b].shape.length - runtime.BUILDINGS[a].shape.length);
    const put = type => {
      for (const rot of runtime.rotationOptions(type)) for (let r = 0; r < runtime.GRID; r++) for (let col = 0; col < runtime.GRID; col++) if (runtime.canPlace(c, type, r, col, rot)) {
        c.resources = runtime.C(1e8, 1e8, 1e8);
        const out = runtime.placeBuilding(c, type, r, col, rot);
        if (out.ok) return true;
      }
      return false;
    };
    for (const type of types.filter(t => runtime.BUILDINGS[t].unit)) put(type);
    for (const type of types.filter(t => !runtime.BUILDINGS[t].unit)) put(type);
    for (let i = 0; i < 100; i++) if (!put(orc ? 'orc_hut' : 'house')) {
      if (!put(orc ? 'orc_hunt' : 'farm')) break;
    }
    for (let guard = 0; guard < 250; guard++) {
      const pool = runtime.buildingUpgradePool(c);
      if (!pool.length) break;
      const option = pool[Math.floor(Math.random() * pool.length)];
      runtime.applyChoice(c, option, false);
    }
    const upgrades = [];
    for (let i = 0; i < 35; i++) {
      const pool = runtime.eligibleNormal(c);
      if (!pool.length) break;
      const o = pool[Math.floor(Math.random() * pool.length)];
      runtime.applyChoice(c, {
        ...o,
        kind: 'normal'
      }, false);
      upgrades.push(o.id);
    }
    const spawnRelics = new Set(['double_assault', 'knight_dismount', 'mage_proliferation', 'orc_trojan', 'orc_horde_heart', 'orc_revenge', 'orc_crowded_huts']);
    for (let i = 0; i < 4; i++) {
      const pool = runtime.eligibleLegendary(c).filter(o => !spawnRelics.has(o.id));
      if (!pool.length) break;
      const o = pool[Math.floor(Math.random() * pool.length)];
      runtime.applyChoice(c, {
        ...o,
        kind: 'legendary'
      }, false);
    }
    runtime.recomputeCity(c, false);
    c.hp = c.maxHp;
    c.resources = {
      ...c.caps
    };
    c.gateMode = 'open';
    c.roadBuild = {
      upgrades,
      buildings: c.buildings.length,
      branches: {
        ...c.l4Branches
      }
    };
  };
  runtime.roadStartTest = function roadStartTest(seed, {count = 500, roster = 'mixed', figureStyle} = {}) {
    if (!(roster === 'art' && count === 20 || roster === 'mixed' && [50,500].includes(count))) throw new RangeError('Unsupported test roster or size');
    runtime.ROAD.testRoster = roster;
    runtime.ROAD.testCount = count;
    runtime.ROAD.figureStyle=roster==='art'?(figureStyle==='simple'?'simple':'painted'):'simple';
    runtime.$('#roadArtToggle').hidden=roster!=='art';
    runtime.$('#roadArtToggle').textContent=runtime.ROAD.figureStyle==='painted'?'Grafika: Részletes':'Grafika: Egyszerű';
    runtime.$('#roadArtToggle').setAttribute('aria-pressed',String(runtime.ROAD.figureStyle==='painted'));
    runtime.ROAD.zoom = roster === 'art' ? 1.75 : count === 50 ? 1.25 : 1;
    runtime.$("#roadZoom").textContent = Math.round(runtime.ROAD.zoom * 100) + "%";
    seed = Number.isInteger(seed) ? seed : crypto.getRandomValues(new Uint32Array(1))[0];
    runtime.ROAD.seed = seed;
    const savedRandom = Math.random;
    let rng = seed >>> 0;
    Math.random = () => {
      rng = Math.imul(rng, 1664525) + 1013904223 >>> 0;
      return rng / 4294967296;
    };
    try {
      runtime.MP.conn?.close();
      runtime.MP.peerClient?.destroy();
      clearInterval(runtime.MP.snapshotTimer);
      runtime.MP.enabled = false;
      runtime.MP.role = 'solo';
      runtime.MP.started = false;
      runtime.state.time = 0;
      runtime.state.running = false;
      const races = roster === 'art' ? ['human','orc'] : runtime.shuffle(['human', 'orc']);
      runtime.roadResetCity(runtime.P, races[0]);
      runtime.roadResetCity(runtime.E, races[1]);
      runtime.state.units = [];
      runtime.state.unitSerial = 1;
      runtime.state.ended = false;
      runtime.state.modal = false;
      runtime.state.pregame = false;
      runtime.state.startChoices = 0;
      runtime.state.pendingChoices = [];
      runtime.state.choiceContext = null;
      runtime.state.nextPick = 1e9;
      runtime.state.speed = 1;
      runtime.ROAD.test = true;
      runtime.state.roadTest = true;
      runtime.ROAD.paused = false;
      runtime.ROAD.result = '';
      runtime.ROAD.clock = 0;
      runtime.ROAD.pending = [];
      runtime.ROAD.dead = [];
      runtime.ROAD.metrics = {
        steps: 0,
        damage: 0,
        attacks: 0,
        tickMs: 0,
        renderMs: 0,
        fps: 0
      };
      runtime.roadEndgame(runtime.P);
      runtime.roadEndgame(runtime.E);
      for (const t of runtime.towers) {
        t.alive = true;
        t.hp = t.maxHp;
        t.cooldown = 1;
      }
      runtime.roadRefreshFrontiers();
      for (const c of [runtime.P, runtime.E]) {
        const keys = roster === 'art' ? [c.race === 'human' ? 'swordsman' : 'orc_warrior'] : Object.keys(runtime.UNITS).filter(k => c.race === 'orc' === k.startsWith('orc_'));
        const entries = Array.from({
          length: count
        }, (_, i) => ({
          key: keys[i % keys.length],
          i
        }));
        entries.sort((a, b) => Number(runtime.UNITS[a.key].tags.includes('ranged')) - Number(runtime.UNITS[b.key].tags.includes('ranged')) || a.i - b.i);
        const dir = c === runtime.P ? 1 : -1;
        for (let i = 0; i < count; i++) {
          const origin = c.buildings.find(b => runtime.BUILDINGS[b.type].unit === entries[i].key);
          const u = runtime.releaseUnit(c, runtime.makeEntry(c, entries[i].key, {
            originBuildingId: origin?.id
          }));
          const rows = roster === 'art' ? 5 : count === 50 ? 8 : 20, spacing = roster === 'art' ? 48 : count === 50 ? 36 : 24;
          u.offset = (i % rows - (rows - 1) / 2) * spacing + (roster === 'art' ? 20 : 0);
          u.roadHomeOffset = u.offset;
          u.lane = runtime.PATH_LENGTH / 2 - dir * (100 + Math.floor(i / rows) * (roster === 'art' ? 48 : count === 50 ? 42 : 32));
          u.cooldown = .1 + i % 13 * .025;
        }
      }
      runtime.roadReindex();
      runtime.ROAD.initial = {
        races: [runtime.P.race, runtime.E.race],
        counts: [...runtime.ROAD.counts],
        keys: [...new Set(runtime.state.units.map(u => u.key))],
        cities: [runtime.P.roadBuild, runtime.E.roadBuild]
      };
      runtime.MP.started = true;
      runtime.MP.lobby.style.display = 'none';
      runtime.MP.status.style.display = 'none';
      document.querySelectorAll('.overlay').forEach(e => e.classList.add('hidden'));
      runtime.$('#pickReminder').classList.add('hidden');
      document.body.classList.add('road-test');
      document.body.classList.remove('roadlords-multi-active');
      runtime.renderStatic();
      runtime.updateHud();
      runtime.state.running = true;
      runtime.acc = 0;
      runtime.last = performance.now();
      runtime.roadFocusFront();
      runtime.$('#roadPause').textContent = 'Szünet';
      runtime.roadTestSummary.textContent = `${count} × ${count} · ${runtime.P.race === 'orc' ? 'Orkok' : 'Emberek'}: ${runtime.P.buildings.length} épület, ${runtime.P.legends.size} relic · ${runtime.E.race === 'orc' ? 'Orkok' : 'Emberek'}: ${runtime.E.buildings.length} épület, ${runtime.E.legends.size} relic. ${roster === 'art' ? 'Részletes kardosok és ork harcosok' : 'Minden egységtípus'}, végső épületszintek, szabályos fejlesztések. A városok nem gyártanak utánpótlást; a harc és a képességek az eredeti játékszabályokat használják. Pályamozgatás: A / D vagy görgő, dupla leütés: pálya széle, F: harci front. Az ellenfél városát az idő melletti ikon rögzíti / oldja fel. Szünet: szóköz.`;
    } finally {
      Math.random = savedRandom;
    }
  };
  runtime.roadPause = function roadPause() {
    if (!runtime.ROAD.test || runtime.state.ended) return;
    runtime.ROAD.paused = !runtime.ROAD.paused;
    runtime.state.running = !runtime.ROAD.paused;
    runtime.$('#roadPause').textContent = runtime.ROAD.paused ? 'Folytatás' : 'Szünet';
    runtime.$('#pauseBtn').textContent = runtime.ROAD.paused ? '▶' : 'Ⅱ';
    runtime.$('#pauseBtn').classList.toggle('on', runtime.ROAD.paused);
    runtime.acc = 0;
  };
}
