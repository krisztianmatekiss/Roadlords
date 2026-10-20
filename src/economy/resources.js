import { assetUrl } from '../assets/urls.js';
export function register(runtime) {
  runtime.resourceIconTag = function resourceIconTag(type, mini = false) {
    return `<img class="costIcon${mini ? ' mini' : ''}" src="${runtime.RESOURCE_IMAGES[type]}" alt="${runtime.RESOURCE_NAMES[type]}">`;
  };
  runtime.resourceCostHTML = function resourceCostHTML(cost, mini = false, zeroDash = false) {
    return runtime.RES.map(r => {
      const value = Math.ceil(cost?.[r] || 0);
      if (!value && !zeroDash) return '';
      return `<span class="resourceCost ${r}">${runtime.resourceIconTag(r, mini)}${value || (zeroDash ? '—' : 0)}</span>`;
    }).join('');
  };
  runtime.placementPrice = function placementPrice(c, type, row, col, rotation = 0) {
    const base = runtime.buildPrice(c, type),
      hasFoundation = runtime.placementFoundationCells(c, type, row, col, rotation).length > 0;
    return hasFoundation ? runtime.C(runtime.cleanCostStep(base.wood * .5), runtime.cleanCostStep(base.stone * .5), runtime.cleanCostStep(base.food * .5)) : base;
  };
  runtime.adjustedCost = function adjustedCost(c, base) {
    const d = runtime.buildersDiscount(c);
    return runtime.C((base.wood || 0) * (1 - d), (base.stone || 0) * (1 - d), base.food || 0);
  };
  runtime.canPay = function canPay(c, price) {
    return runtime.RES.every(r => c.resources[r] + 1e-9 >= (price[r] || 0));
  };
  runtime.pay = function pay(c, price) {
    if (!runtime.canPay(c, price)) return false;
    runtime.RES.forEach(r => c.resources[r] -= price[r] || 0);
    return true;
  };
  runtime.cleanCostStep = function cleanCostStep(value) {
    if (value <= 0) return 0;
    return Math.max(5, Math.floor((value + 2.499999) / 5) * 5);
  };
  runtime.buildPrice = function buildPrice(c, type) {
    const x = runtime.adjustedCost(c, runtime.BUILDINGS[type].cost);
    return runtime.C(runtime.cleanCostStep(x.wood * 1.5), runtime.cleanCostStep(x.stone * 1.5), runtime.cleanCostStep(x.food * 1.5));
  };
  runtime.producerHasBonus = function producerHasBonus(c, type, b) {
    return type === 'lumber' ? runtime.adjacentTerrain(c, b, 'forest') : type === 'stonecutter' ? runtime.adjacentTerrain(c, b, 'quarry') : type === 'farm' ? runtime.buildingOnTerrain(c, b, 'fertile') : false;
  };
  runtime.productionRates = function productionRates(c) {
    const k = runtime.hasBranch(c, 'keep', 'empire') ? 16 : runtime.v4LevelValue(runtime.levelOf(c, 'keep'), [1, 2, 4, 8]),
      global = 1 + .10 * runtime.countNormal(c, 'production'),
      rates = runtime.C(k * global, k * global, k * global),
      lv = [1, 2, 3, 6];
    for (const b of c.buildings) {
      const val = (lv[b.level - 1] || lv[3]) * runtime.guildMultiplier(c, b) * global;
      if (b.type === 'lumber') rates.wood += val * (runtime.adjacentTerrain(c, b, 'forest') ? 2 : 1);
      if (b.type === 'stonecutter') rates.stone += val * (runtime.adjacentTerrain(c, b, 'quarry') ? 2 : 1);
      if (b.type === 'farm') rates.food += val * (runtime.buildingOnTerrain(c, b, 'fertile') ? 2 : 1);
    }
    if (runtime.hasLeg(c, 'full_garrison_economy') && runtime.reserveCount(c) >= c.garrisonCap && c.garrisonCap > 0) runtime.RES.forEach(r => rates[r] *= 2);
    return rates;
  };
  runtime.updateMarketRoutes = function updateMarketRoutes(c, dt) {
    const flow = runtime.marketTransfer(c, dt);
    for (const r of runtime.RES) c.resources[r] = flow.stock[r];
    runtime.recordResourceSpend38(c, runtime.C(flow.use.wood * dt, flow.use.stone * dt, flow.use.food * dt));
  };
  runtime.resourceFlowRates = function resourceFlowRates(c) {
    const gain = {
        ...runtime.productionRates(c)
      },
      use = runtime.productionDemandRates(c),
      stock = {
        ...c.resources
      };
    for (const r of runtime.RES) stock[r] = Math.min(c.caps[r], stock[r] + gain[r]);
    const market = runtime.marketTransfer(c, 1, stock);
    for (const r of runtime.RES) {
      gain[r] += market.gain[r];
      use[r] += market.use[r];
    }
    return {
      gain,
      use
    };
  };
  runtime.produceResources = function produceResources(c, dt) {
    runtime.beginResourceSample38(c, dt);
    const rates = runtime.productionRates(c);
    for (const r of runtime.RES) {
      const add = rates[r] * dt,
        room = Math.max(0, c.caps[r] - c.resources[r]);
      c.resources[r] += Math.min(add, room);
      const overflow = Math.max(0, add - room);
      if (overflow && runtime.hasLeg(c, 'overproduction')) {
        c.overflowProgress = (c.overflowProgress || 0) + overflow;
        const n = Math.floor(c.overflowProgress / 500);
        if (n) {
          c.overflowProgress -= n * 500;
          runtime.onOverflowStack(c, n);
        }
      }
    }
    runtime.updateMarketRoutes(c, dt);
  };
  runtime.importedResources = function importedResources(c) {
    if (!runtime.hasBranch(c, 'market', 'war_suppliers')) return new Set();
    const count = runtime.hasBranch(c, 'market', 'wholesalers') ? 2 : 1;
    return new Set(c.marketRoutes.slice(0, count).map(x => x.to));
  };
  runtime.productionBatchSize = function productionBatchSize(c, b) {
    const key = runtime.effectiveUnitKey(c, b);
    return (key === 'swordsman' && runtime.hasLeg(c, 'swordsman_triple') ? 3 : 1) * (b.type === 'barracks' && key === 'swordsman' && runtime.hasBranch(c, 'barracks', 'conscription') ? 2 : 1);
  };
  runtime.productionLines = function productionLines(c, b) {
    const key = runtime.effectiveUnitKey(c, b),
      lines = [{
        key,
        field: 'progress',
        time: runtime.trainingTime(c, b),
        cost: runtime.primarySpawnCost(c, key, b),
        batch: runtime.productionBatchSize(c, b)
      }];
    if (b.type === 'barracks') for (const [legend, key, field] of [['barracks_spear', 'spearman', 'spearProgress'], ['barracks_archer', 'archer', 'archerProgress']]) if (runtime.hasLeg(c, legend)) lines.push({
      key,
      field,
      time: runtime.extraBarracksTime(c, b, key),
      cost: runtime.unitCost(c, key),
      batch: 1
    });
    return lines;
  };
  runtime.productionLineReady = function productionLineReady(c, b, line) {
    return Number.isFinite(line.time) && line.time > 0 && runtime.productionRoomFor(c, b) >= line.batch && runtime.canPay(c, line.cost);
  };
  runtime.productionDemandRates = function productionDemandRates(c) {
    const out = runtime.C();
    for (const b of runtime.activeSpawners(c)) for (const line of runtime.productionLines(c, b)) {
      if (!Number.isFinite(line.time) || line.time <= 0 || runtime.productionRoomFor(c, b) < line.batch) continue;
      for (const r of runtime.RES) out[r] += (line.cost[r] || 0) / line.time;
    }
    return out;
  };
  runtime.consumptionRates = function consumptionRates(c, availableOnly = false) {
    const out = runtime.C();
    for (const b of runtime.activeSpawners(c)) for (const line of runtime.productionLines(c, b)) {
      if (!Number.isFinite(line.time) || line.time <= 0 || availableOnly && !runtime.productionLineReady(c, b, line)) continue;
      for (const r of runtime.RES) out[r] += (line.cost[r] || 0) / line.time;
    }
    return out;
  };
  runtime.productionDestination = function productionDestination(c, b) {
    return runtime.rallyAccepts(c, b) ? 'rally' : 'main';
  };
  runtime.productionRoomFor = function productionRoomFor(c, b) {
    if (runtime.productionDestination(c, b) === 'rally') return Math.max(0, c.rallyCap - c.rallyReserve.length) + (c.rallyMode === 'open' ? runtime.fieldQueueRoom(c) : 0);
    return runtime.totalProductionRoom(c);
  };
  runtime.queueProduced = function queueProduced(c, entry, b = null) {
    entry.waitTime = entry.waitTime || 0;
    entry.originBuildingId = b?.id || entry.originBuildingId || null;
    if (b && runtime.rallyAccepts(c, b)) {
      runtime.applyTavernOriginBuff(c, b, entry);
      if (c.rallyMode === 'open' && runtime.fieldQueueRoom(c) >= runtime.orcArmyWeight(entry)) {
        runtime.rallyWaveBuffs(c, [entry]);
        runtime.waveBuffs(c, [entry]);
        runtime.releaseUnit(c, entry);
        return true;
      }
      if (c.rallyReserve.length >= c.rallyCap) return false;
      c.rallyReserve.push(entry);
      return true;
    }
    if (b) runtime.applyTavernOriginBuff(c, b, entry);
    if (runtime.gateActuallyOpen(c) && runtime.fieldQueueRoom(c) >= runtime.orcArmyWeight(entry) && (c.race !== 'orc' || !c.garrison.length)) {
      runtime.waveBuffs(c, [entry]);
      c.releaseQueue.push(entry);
      return true;
    }
    if (runtime.reserveCount(c) + runtime.orcReserveWeight(entry, c) > c.garrisonCap) return false;
    c.garrison.push(entry);
    return true;
  };
  runtime.totalProductionRoom = function totalProductionRoom(c) {
    const reserveRoom = Math.max(0, c.garrisonCap - runtime.reserveCount(c));
    return runtime.gateActuallyOpen(c) ? Math.max(runtime.fieldQueueRoom(c), reserveRoom) : reserveRoom;
  };
  runtime.resourceOptions = function resourceOptions(selected) {
    return runtime.RES.map(r => `<option value="${r}" ${r === selected ? 'selected' : ''}>${runtime.RESOURCE_NAMES[r]}</option>`).join('');
  };
  runtime.updateEnemyMarket = function updateEnemyMarket() {
    const m = runtime.buildingOf(runtime.E, 'market')[0];
    if (!m || runtime.state.time - runtime.E.marketSwitchAt < 20) return;
    const rates = runtime.productionRates(runtime.E),
      use = runtime.consumptionRates(runtime.E),
      need = [...runtime.RES].sort((a, b) => use[b] - rates[b] - (use[a] - rates[a])),
      abundant = [...runtime.RES].sort((a, b) => runtime.E.resources[b] / runtime.E.caps[b] + rates[b] / 20 - (runtime.E.resources[a] / runtime.E.caps[a] + rates[a] / 20));
    let to = need[0],
      from = abundant.find(r => r !== to) || abundant[0];
    runtime.E.marketRoutes[0] = {
      from,
      to
    };
    if (runtime.hasBranch(runtime.E, 'market', 'wholesalers')) {
      const to2 = need.find(r => r !== to) || need[1],
        from2 = abundant.find(r => r !== to2 && r !== from) || abundant.find(r => r !== to2);
      runtime.E.marketRoutes[1] = {
        from: from2,
        to: to2
      };
    }
    runtime.E.marketSwitchAt = runtime.state.time;
  };
  runtime.primarySpawnCost = function primarySpawnCost(c, key, b = null) {
    const co = runtime.unitCost(c, key);
    let mult = 1;
    if (b?.type === 'barracks' && key === 'swordsman' && runtime.hasBranch(c, 'barracks', 'conscription')) mult *= 2;
    if (b && runtime.hasLeg(c, 'supply_hub') && runtime.adjacentBuildings(c, b).some(x => x.type === 'warehouse')) mult *= .7;
    return runtime.C(Math.round(co.wood * mult * 10) / 10, Math.round(co.stone * mult * 10) / 10, Math.round(co.food * mult * 10) / 10);
  };
  runtime.producerNeededForSpawner = function producerNeededForSpawner(type) {
    const need = runtime.aiResourceNeeds(runtime.projectedSpawnerNeed(type))[0];
    return need && need.score > 1.02 ? {
      wood: 'lumber',
      stone: 'stonecutter',
      food: 'farm'
    }[need.r] : null;
  };
  runtime.updateBuildAffordabilityV497 = function updateBuildAffordabilityV497() {
    runtime.$$('#buildList [data-cost-resource]').forEach(el => {
      const r = el.dataset.costResource,
        amount = Number(el.dataset.costAmount) || 0,
        missing = amount > 0 && (runtime.P.resources[r] || 0) + 1e-9 < amount;
      el.classList.toggle('unaffordable', missing);
      el.classList.toggle('affordable', !missing);
      el.title = missing ? `Hiányzik még ${Math.max(0, Math.ceil(amount - (runtime.P.resources[r] || 0)))} ${r === 'wood' ? 'Fa' : 'Kő'}.` : '';
    });
  };
  runtime.v4915BaseCostStep = function v4915BaseCostStep(value) {
    const stepped = runtime.cleanCostStep(value);
    if (stepped <= 0) return 0;
    return Math.round(stepped) % 10 === 5 ? stepped + 5 : stepped;
  };
  runtime.v4915UndiscountedBuildPrice = function v4915UndiscountedBuildPrice(c, type) {
    const x = runtime.adjustedCost(c, runtime.BUILDINGS[type].cost);
    return runtime.C(runtime.v4915BaseCostStep((x.wood || 0) * 3), runtime.v4915BaseCostStep((x.stone || 0) * 3), runtime.v4915BaseCostStep((x.food || 0) * 3));
  };
  runtime.resourceSpendHistoryFor38 = function resourceSpendHistoryFor38(c) {
    runtime.resourceSpendHistory38 = runtime.resourceSpendHistory38 || new WeakMap();
    let h = runtime.resourceSpendHistory38.get(c),
      now = Math.max(0, Number(runtime.state.time) || 0);
    if (!h || now < h.last) {
      h = {
        start: now,
        last: now,
        buckets: []
      };
      runtime.resourceSpendHistory38.set(c, h);
    }
    h.last = now;
    while (h.buckets.length && h.buckets[0].second <= now - 30 + 1e-9) h.buckets.shift();
    return h;
  };
  runtime.beginResourceSample38 = function beginResourceSample38(c, dt) {
    if (runtime.MP.enabled && runtime.MP.role === 'guest') return;
    const existed = runtime.resourceSpendHistory38?.has(c),
      h = runtime.resourceSpendHistoryFor38(c);
    if (!existed) h.start = Math.max(0, runtime.state.time - Math.max(0, dt));
  };
  runtime.recordResourceSpend38 = function recordResourceSpend38(c, price) {
    if (runtime.MP.enabled && runtime.MP.role === 'guest') return;
    const h = runtime.resourceSpendHistoryFor38(c),
      second = runtime.state.time;
    let b = h.buckets[h.buckets.length - 1];
    if (!b || b.second !== second) {
      b = {
        second,
        wood: 0,
        stone: 0,
        food: 0
      };
      h.buckets.push(b);
    }
    for (const r of runtime.RES) b[r] += Math.max(0, Number(price[r]) || 0);
  };
  runtime.measuredResourceUse38 = function measuredResourceUse38(c) {
    if (runtime.MP.enabled && runtime.MP.role === 'guest') return {
      ...runtime.C(),
      ...(c.resourceUse38 || {})
    };
    const h = runtime.resourceSpendHistoryFor38(c),
      seconds = Math.max(1, Math.min(30, runtime.state.time - h.start)),
      out = runtime.C();
    for (const b of h.buckets) for (const r of runtime.RES) out[r] += b[r] / seconds;
    return out;
  };
}
