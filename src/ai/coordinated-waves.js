import { assetUrl } from '../assets/urls.js';
export function initializeAiCoordinatedWaves(runtime) {
  const orc = () => window.__ROADLORDS_ORCS__.isOrc(runtime.E);
  const econTypes = () => orc() ? {
    wood: 'orc_work',
    stone: 'orc_work',
    food: 'orc_hunt'
  } : {
    wood: 'lumber',
    stone: 'stonecutter',
    food: 'farm'
  };
  const danger = () => runtime.state.units.some(u => u.alive && u.side === 'player' && u.lane > runtime.PATH_LENGTH * .92);
  function desired(extra = runtime.C()) {
    const use = runtime.consumptionRates(runtime.E),
      sp = runtime.activeSpawners(runtime.E).length;
    const fill = runtime.occupancy(runtime.E).size / (runtime.GRID * runtime.GRID),
      space = fill < .72 ? 1 : fill < .88 ? .6 : .18;
    const growth = Math.min(15, 3.8 + runtime.state.time / 95 + sp * .45) * space;
    return runtime.C((use.wood + (extra.wood || 0)) * 1.20 + growth, (use.stone + (extra.stone || 0)) * 1.20 + growth * .55, (use.food + (extra.food || 0)) * 1.25 + (sp ? Math.max(.6, Math.min(2, sp * .20)) : 0));
  }
  runtime.aiResourceTargets = desired;
  function save(type, price) {
    if (runtime.E._aiSaveType !== type) {
      runtime.E._aiSaveSince = runtime.state.time;
      runtime.E._aiSaveType = type;
    }
    runtime.E._aiSavePrice = {
      ...price
    };
  }
  function clearSave() {
    runtime.E._aiSavePrice = null;
    runtime.E._aiSaveType = null;
    runtime.E._aiSaveSince = 0;
  }
  const oldSpawn = runtime.normalSpawn;
  runtime.normalSpawn = function (c, b) {
    if (c === runtime.E && !runtime.MP.enabled && c._aiSavePrice && !danger() && runtime.state.time - c._aiSaveSince < 35) {
      const key = runtime.effectiveUnitKey(c, b),
        cost = runtime.primarySpawnCost(c, key, b);
      if (runtime.RES.some(r => (c._aiSavePrice[r] || 0) > 0 && (cost[r] || 0) > 0 && c.resources[r] - (cost[r] || 0) < c._aiSavePrice[r])) return false;
    }
    return oldSpawn(c, b);
  };
  const oldScore = runtime.scoreAiChoiceV17;
  runtime.scoreAiChoiceV17 = function (o) {
    let score = oldScore(o);
    if (!o || !orc()) return score;
    if (o.kind === 'building' && o.id === 'orc_hut' && !runtime.hasBuilding(runtime.E, 'orc_hut')) score += 18;
    if (o.kind === 'building_upgrade' && ['orc_work', 'orc_hunt'].includes(o.id)) score += Math.min(22, runtime.buildingOf(runtime.E, o.id).length * 1.2);
    if (o.kind === 'building_upgrade' && o.id === 'keep' && runtime.E.armyCap < 100) score += 14;
    return score;
  };
  const oldAI = runtime.enemyBuildAI;
  let think = 0;
  runtime.enemyBuildAI = function (dt) {
    if (runtime.MP.enabled || runtime.state.pregame || runtime.state.ended) return;
    think -= Math.max(0, dt || 0);
    if (think > 0) return;
    think = .65;
    runtime.enemyGateAI();
    const prior = runtime.aiDecisionCache;
    runtime.aiDecisionCache = new Map();
    try {
      const sp = runtime.activeSpawners(runtime.E).length,
        types = econTypes(),
        rates = runtime.productionRates(runtime.E),
        targets = desired();
      const count = k => runtime.buildingOf(runtime.E, k).length;
      let type = null;
      if (!orc() && count('lumber') < 3) type = 'lumber';else if (!orc() && !count('stonecutter')) type = 'stonecutter';else if (orc() && !count('orc_work')) type = 'orc_work';else if (!sp && runtime.state.startChoices <= 0) {
        const starter = orc() ? 'orc_war' : 'barracks';
        if (runtime.E.unlocked.has(starter)) type = starter;
      }
      if (!type && sp >= 2) {
        const capacityType = orc() ? 'orc_hut' : 'house';
        const committed = runtime.fieldUnitCount(runtime.E) + runtime.E.releaseQueue.reduce((n, e) => n + runtime.orcArmyWeight(e, runtime.E), 0) + Math.min(20, runtime.reserveCount(runtime.E));
        if (runtime.E.unlocked.has(capacityType) && committed > runtime.E.armyCap * .78) type = capacityType;
      }
      if (!type) {
        const needs = runtime.RES.map(r => ({
          r,
          ratio: targets[r] / Math.max(.1, rates[r]),
          gap: targets[r] - rates[r]
        })).filter(n => n.r !== 'food' || sp > 0).filter(n => n.gap > .25 && n.ratio > 1.08).sort((a, b) => b.ratio - a.ratio);
        for (const n of needs) {
          const candidate = types[n.r];
          if (runtime.E.unlocked.has(candidate) && runtime.findCell(runtime.E, candidate)) {
            type = candidate;
            break;
          }
        }
      }
      if (!type && runtime.fieldUnitCount(runtime.E) > runtime.E.armyCap * .82) type = orc() ? 'orc_hut' : 'house';
      if (type && runtime.E.unlocked.has(type)) {
        let cell = runtime.findCell(runtime.E, type),
          price = cell ? runtime.placementPrice(runtime.E, type, ...cell) : runtime.buildPrice(runtime.E, type);
        if (runtime.RES.some(r => price[r] > runtime.E.caps[r])) {
          type = 'warehouse';
          cell = runtime.findCell(runtime.E, type);
          price = cell ? runtime.placementPrice(runtime.E, type, ...cell) : runtime.buildPrice(runtime.E, type);
        }
        if (cell) {
          if (runtime.aiBuild(type)) {
            clearSave();
            runtime.E._aiGrowthLast = {
              time: runtime.state.time,
              type
            };
            return;
          }
          save(type, price);
          return;
        }
      }
      clearSave();
      runtime.E.aiThink = 0;
      oldAI(.7);
    } finally {
      runtime.aiDecisionCache = prior;
    }
  };
  runtime.enemyGateAI = function () {
    if (runtime.MP.enabled || runtime.state.pregame) return;
    if (orc() && runtime.hasBranch(runtime.E, 'keep', 'orc_conquest')) {
      runtime.E.gateMode = 'open';
      runtime.E.autoReleasing = false;
      return;
    }
    if (runtime.E.gateMode === 'open' && !runtime.E.releaseQueue.length) {
      runtime.E.gateMode = 'closed';
      runtime.E.autoReleasing = false;
    }
    const weight = e => runtime.orcArmyWeight(e, runtime.E),
      main = runtime.E.garrison.reduce((n, e) => n + weight(e), 0),
      rally = runtime.E.rallyReserve.reduce((n, e) => n + weight(e), 0);
    const total = main + rally,
      cap = Math.max(1, runtime.E.garrisonCap + (runtime.hasBuilding(runtime.E, 'rally') ? runtime.E.rallyCap : 0)),
      sp = runtime.activeSpawners(runtime.E).length;
    const room = runtime.fieldQueueRoom(runtime.E),
      deep = danger();
    const target = Math.min(cap, Math.max(26, 22 + sp * 3 + Math.min(20, Math.floor(runtime.state.time / 90) * 2)));
    const entries = [...runtime.E.garrison, ...runtime.E.rallyReserve];
    let hp = 0;
    for (const e of entries) hp += runtime.statsFor(runtime.E, e).hp;
    const mainProducers = runtime.activeSpawners(runtime.E).filter(b => runtime.productionDestination(runtime.E, b) !== 'rally');
    const mainWeights = mainProducers.map(b => weight({
      key: runtime.effectiveUnitKey(runtime.E, b)
    }));
    const smallest = mainWeights.length ? Math.min(...mainWeights) : Math.min(...runtime.E.garrison.map(weight), 1e9);
    const mainBlocked = main > 0 && runtime.E.garrisonCap - main < smallest;
    const rallyProducers = runtime.activeSpawners(runtime.E).filter(b => runtime.productionDestination(runtime.E, b) === 'rally');
    const rallyMin = rallyProducers.length ? Math.min(...rallyProducers.map(b => weight({
      key: runtime.effectiveUnitKey(runtime.E, b)
    }))) : 1;
    const full = mainBlocked || rally > 0 && runtime.E.rallyCap - rally < rallyMin && !mainProducers.length;
    const strong = entries.length >= 12 && hp >= target * 170;
    const launch = (total >= target || full || strong) && room >= Math.min(20, target * .65);
    const defend = deep && total >= Math.min(8, target) && room >= Math.min(4, total);
    runtime.E._aiWaveTarget = target;
    if (runtime.E.gateMode === 'closed' && (launch || defend)) {
      if (runtime.E.rallyReserve.length) runtime.releaseRally(runtime.E);
      runtime.openWave(runtime.E);
      runtime.E.gateMode = 'open';
      runtime.E.autoReleasing = false;
      runtime.E._aiLastWave = {
        time: runtime.state.time,
        weight: total,
        count: entries.length,
        hp,
        emergency: defend && !launch
      };
    }
    if (runtime.hasBuilding(runtime.E, 'rally')) runtime.E.rallyMode = 'closed';
    runtime.updateEnemyMarket();
  };
  const oldRelease = runtime.releaseQueues;
  runtime.releaseQueues = function (dt) {
    const out = oldRelease(dt);
    if (!runtime.MP.enabled && runtime.E.gateMode === 'open' && !runtime.E.releaseQueue.length && !(orc() && runtime.hasBranch(runtime.E, 'keep', 'orc_conquest'))) {
      runtime.E.gateMode = 'closed';
      runtime.E.autoReleasing = false;
    }
    return out;
  };
  window.__ROADLORDS_AI_GROWTH__ = {
    targets: desired,
    step: dt => runtime.enemyBuildAI(dt),
    gate: () => runtime.enemyGateAI(),
    diagnostics: () => ({
      rates: runtime.productionRates(runtime.E),
      use: runtime.consumptionRates(runtime.E),
      target: desired(),
      saving: runtime.E._aiSaveType,
      waveTarget: runtime.E._aiWaveTarget,
      lastWave: runtime.E._aiLastWave
    })
  };
  Object.assign(window.__ROADLORDS__, {
    enemyBuildAI: runtime.enemyBuildAI,
    enemyGateAI: runtime.enemyGateAI,
    aiResourceTargets: runtime.aiResourceTargets,
    normalSpawn: runtime.normalSpawn,
    releaseQueues: runtime.releaseQueues
  });
}
