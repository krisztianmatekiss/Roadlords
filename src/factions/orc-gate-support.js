import { assetUrl } from '../assets/urls.js';
export function initializeFactionsOrcGateSupport(runtime) {
  const O = window.__ROADLORDS_ORCS__,
    active = (c, k) => O.isOrc(c) ? runtime.buildingOf(c, k).find(b => !b.inactive) : null;
  const authority = () => !runtime.MP.enabled || runtime.MP.role === 'host';
  for (const [key, name, icon, cost, description] of [['orc_raider', 'Fosztogatók tábora', '⚔', runtime.C(85, 65), 'Nyitott kapunál minden elkészült katonád eséllyel ingyenes erősítést hív. Az ingyenes egységek nem hívnak további erősítést.'], ['orc_tunnel', 'Rohamalagút', '◉', runtime.C(100, 120), 'A közeli táborok egységei a legelőrébb álló saját toronynál jelennek meg, zárt kapunál is. A sereglimit továbbra is érvényes. Ha minden tornyod elpusztult, az egységek a szokásos úton érkeznek.']]) {
    O.defs[key] = true;
    runtime.BUILDINGS[key] = {
      name,
      icon,
      cost,
      description,
      shape: [[0, 0], [0, 1], [1, 0], [1, 1]],
      race: 'orc',
      category: 'support',
      unique: true
    };
    runtime.BUILDING_IMAGE_META[key] = {
      w: 2,
      h: 2
    };
  }
  runtime.V4_SIMPLE_L4.add('orc_tunnel');
  runtime.V4_BRANCHES.orc_raider = [{
    id: 'monsters',
    name: 'Szörnyhorda',
    icon: '♟',
    description: 'Az erősítés 8% eséllyel Troll. A többi esetben Harcos, Dühöngő vagy Warglovas érkezik.'
  }, {
    id: 'horde',
    name: 'Hordaözön',
    icon: '⚔',
    description: 'Sikeres híváskor 2 azonos egység érkezik 1 helyett.'
  }];
  runtime.V4_BRANCHES.orc_overseer = [{
    id: 'ruthless',
    name: 'Könyörtelen hajszolás',
    icon: '⚒',
    description: 'A szomszédos táborok képzési ideje 80%-kal csökken. Az egységek 25% életerővel indulnak.'
  }, {
    id: 'blood_horde',
    name: 'Vérszívó horda',
    icon: '♥',
    description: 'Megmarad a 40%-kal rövidebb képzés és a 80%-os induló életerő. Minden saját egység az okozott sebzés 8%-át visszagyógyítja. Több tábor nem növeli az életlopást.'
  }];
  runtime.V4_BRANCHES.orc_arena = [{
    id: 'veteran_army',
    name: 'Veteránok serege',
    icon: '★',
    description: 'A szomszédos táborok 40% eséllyel képeznek veteránokat.'
  }, {
    id: 'academies',
    name: 'Harci akadémiák',
    icon: '★',
    description: 'Minden szomszédos Aréna +25% veterán esélyt ad ugyanannak a tábornak, legfeljebb 100%-ig.'
  }];
  const altarFor = (c, b) => b && runtime.adjacentBuildings(c, b).some(x => x.type === 'orc_altar' && !x.inactive);
  function frontTower(c) {
    const side = runtime.sideForCity(c);
    return runtime.towers.filter(t => t.side === side && t.alive && t.hp > 0).sort((a, b) => side === 'player' ? b.lane - a.lane : a.lane - b.lane)[0] || null;
  }
  function tunnelRoom(c) {
    const reserved = runtime.gateActuallyOpen(c) && c.garrison.length ? runtime.orcArmyWeight(c.garrison[0], c) : 0;
    return Math.max(0, runtime.fieldQueueRoom(c) - reserved);
  }
  function destination(c, b) {
    const t = active(c, 'orc_tunnel');
    return b && t && (t.level >= 4 || runtime.inBuildingRange(t, b, t.level)) && !altarFor(c, b) ? frontTower(c) : null;
  }
  runtime.fieldUnitCount = c => {
    const side = runtime.sideForCity(c);
    return runtime.state.units.reduce((sum, u) => sum + (u.alive && u.side === side ? runtime.orcArmyWeight(u) : 0), 0);
  };
  runtime.fieldQueueRoom = c => Math.max(0, c.armyCap - runtime.fieldUnitCount(c) - c.releaseQueue.reduce((sum, e) => sum + runtime.orcArmyWeight(e), 0));
  const oldOpen = runtime.openWave;
  runtime.openWave = function (c) {
    if (!O.isOrc(c)) return oldOpen(c);
    const wave = runtime.orcTakeArmyRoom(c.garrison, runtime.fieldQueueRoom(c), true);
    if (!wave.length) return;
    runtime.waveBuffs(c, wave);
    c.releaseQueue.push(...wave);
  };
  const oldRoom = runtime.productionRoomFor;
  runtime.productionRoomFor = function (c, b) {
    const key = runtime.effectiveUnitKey(c, b),
      weight = runtime.orcArmyWeight({
        key
      }, c),
      reserveWeight = runtime.orcReserveWeight({
        key
      }, c),
      reserve = reserveWeight ? Math.floor(Math.max(0, c.garrisonCap - runtime.reserveCount(c)) / reserveWeight) : Infinity;
    if (destination(c, b)) return Math.floor(tunnelRoom(c) / weight);
    if (altarFor(c, b)) return oldRoom(c, b);
    if (runtime.gateActuallyOpen(c) && c.garrison.length) return reserve;
    if (weight === 1 && reserveWeight === 1) return oldRoom(c, b);
    return runtime.gateActuallyOpen(c) ? Math.max(Math.floor(runtime.fieldQueueRoom(c) / weight), reserve) : reserve;
  };
  const oldQueue = runtime.queueProduced;
  let production = null;
  function raid(c) {
    const r = active(c, 'orc_raider');
    if (!r || !runtime.orcGateBonuses(c) || Math.random() >= runtime.v4LevelValue(r.level, [.05, .08, .12])) return;
    let key = 'orc_warrior';
    if (r.level >= 4 && runtime.hasBranch(c, r.type, 'monsters') && Math.random() < .08) key = 'orc_troll';else if (r.level >= 2) {
      const n = Math.random();
      key = r.level === 2 ? n < .65 ? 'orc_warrior' : 'orc_berserker' : n < .55 ? 'orc_warrior' : n < .85 ? 'orc_berserker' : 'orc_warg';
    }
    const count = runtime.hasBranch(c, r.type, 'horde') ? 2 : 1;
    for (let i = 0; i < count; i++) {
      const e = runtime.makeEntry(c, key, {
        orcRaider: true,
        freeCopy: true
      });
      if (!oldQueue(c, e, null)) break;
    }
  }
  runtime.queueProduced = function (c, e, b = null) {
    if (!authority() && O.isOrc(c)) return false;
    const t = !e.hospitalSaved && destination(c, b);
    let ok;
    if (t) {
      if (tunnelRoom(c) < runtime.orcArmyWeight(e, c)) return false;
      const u = runtime.releaseUnit(c, e);
      u.lane = t.lane;
      u.cooldown = Math.max(u.cooldown, .2);
      const st = window.__ROADLORDS_MATCH_STATS__.statsOf(c);
      if (!e.hospitalSaved) {
        st.unitProducedTotal++;
        st.unitProducedByType[e.key] = (st.unitProducedByType[e.key] || 0) + 1;
      }
      ok = true;
    } else ok = oldQueue(c, e, b);
    if (ok && production && production.c === c && production.b === b && production.left > 0 && !e.freeCopy && !e.tempClone && !e.hospitalSaved && !e.orcRaider) {
      production.left--;
      raid(c);
    }
    return ok;
  };
  const oldSpawn = runtime.normalSpawn;
  runtime.normalSpawn = function (c, b) {
    if (O.isOrc(c) && !authority()) return false;
    const previous = production;
    production = {
      c,
      b,
      left: runtime.productionBatchSize(c, b)
    };
    try {
      return oldSpawn(c, b);
    } finally {
      production = previous;
    }
  };
  const oldFind = runtime.findCell;
  runtime.findCell = function (c, key) {
    if (key !== 'orc_tunnel' || !O.isOrc(c)) return oldFind(c, key);
    let best = null,
      score = -Infinity;
    for (const rot of runtime.rotationOptions(key)) for (let row = 0; row < runtime.GRID; row++) for (let col = 0; col < runtime.GRID; col++) {
      if (!runtime.canPlace(c, key, row, col, rot)) continue;
      const b = {
          id: 'tunnel-preview',
          type: key,
          row,
          col,
          rotation: rot,
          level: runtime.levelOf(c, key)
        },
        covered = runtime.activeSpawners(c).filter(s => (b.level >= 4 || runtime.inBuildingRange(b, s, b.level)) && !altarFor(c, s)).length;
      if (covered > score) {
        score = covered;
        best = [row, col, rot];
      }
    }
    return score > 0 ? best : null;
  };
  let wait = 0;
  const oldAI = runtime.enemyBuildAI;
  runtime.enemyBuildAI = function (dt) {
    if (!runtime.MP.enabled && O.isOrc(runtime.E) && !runtime.state.pregame && (wait -= dt) <= 0) {
      wait = 3;
      if (runtime.activeSpawners(runtime.E).length >= 3) for (const key of ['orc_raider', 'orc_tunnel']) if (runtime.E.unlocked.has(key) && !runtime.hasBuilding(runtime.E, key) && runtime.aiBuild(key)) return;
    }
    return oldAI(dt);
  };
  const oldScore = runtime.scoreAiChoiceV17;
  runtime.scoreAiChoiceV17 = o => O.isOrc(runtime.E) && o.kind === 'building' && ['orc_raider', 'orc_tunnel'].includes(o.id) ? 10 : oldScore(o);
  const oldRows = runtime.buildingEffectRows;
  runtime.buildingEffectRows = function (c, b) {
    if (b.type === 'orc_raider') return [['Erősítés esélye', `${runtime.v4LevelValue(b.level, [5, 8, 12])}%`], ['Kapu', runtime.orcGateBonuses(c) ? 'Erősítés aktív' : 'Az erősítéshez nyisd ki'], ['Érkező egységek', runtime.hasBranch(c, b.type, 'horde') ? '2 azonos egység' : '1 egység']];
    if (b.type === 'orc_tunnel') {
      const t = frontTower(c);
      return [['Hatótáv', b.level >= 4 ? 'Minden katonai tábor' : `${b.level} mező`], ['Kijárat', t ? 'Legelőrébb álló saját torony' : 'Nincs torony – szokásos egységküldés'], ['Érintett táborok', String(runtime.activeSpawners(c).filter(s => destination(c, s)).length)]];
    }
    return oldRows(c, b);
  };
  O.armyWeight = runtime.orcArmyWeight;
  O.tunnelDestination = destination;
  O.frontTower = frontTower;
  Object.assign(window.__ROADLORDS__, {
    normalSpawn: runtime.normalSpawn,
    queueProduced: runtime.queueProduced,
    enemyBuildAI: runtime.enemyBuildAI,
    buildingEffectRows: runtime.buildingEffectRows
  });
}
