import { assetUrl } from '../assets/urls.js';
export function initializeAiPlacement(runtime) {
  runtime.v4916FindCell = runtime.findCell;
  runtime.findCell = function (c, type) {
    if (!c || !runtime.BUILDINGS[type]) return null;
    const occ = runtime.occupancy(c);
    const isProducer = ['lumber', 'stonecutter', 'farm'].includes(type);
    const rotations = runtime.rotationOptions(type).map(rot => ({
      rot,
      shape: runtime.rotatedShape(type, rot)
    }));
    const rallies = type === 'guardhouse' ? runtime.buildingOf(c, 'rally') : [];
    const spawners = type === 'rally' || type === 'tavern' ? runtime.spawnerBuildings(c) : [];
    const producers = type === 'guildhouse' ? c.buildings.filter(x => ['lumber', 'stonecutter', 'farm'].includes(x.type)) : [];
    const houses = type === 'townhall' ? runtime.buildingOf(c, 'house') : [];
    const halls = type === 'house' ? runtime.buildingOf(c, 'townhall') : [];
    const barracks = type === 'stable' && runtime.hasBranch(c, 'barracks', 'cavalry_barracks') ? runtime.buildingOf(c, 'barracks') : [];
    const stables = type === 'barracks' && runtime.hasBranch(c, 'barracks', 'cavalry_barracks') ? runtime.buildingOf(c, 'stable') : [];
    const candidates = [];
    let hasProducerBonus = false;
    for (const {
      rot,
      shape
    } of rotations) {
      for (let r = 0; r < runtime.GRID; r++) {
        for (let col = 0; col < runtime.GRID; col++) {
          let valid = true;
          const cells = [];
          for (const [dr, dc] of shape) {
            const rr = r + dr,
              cc = col + dc;
            if (rr < 0 || cc < 0 || rr >= runtime.GRID || cc >= runtime.GRID || occ.has(runtime.idx(rr, cc)) || runtime.terrainBlocks(c, rr, cc)) {
              valid = false;
              break;
            }
            cells.push([rr, cc]);
          }
          if (!valid) continue;
          const fake = {
            type,
            row: r,
            col,
            rotation: rot,
            id: 'preview'
          };
          let score = 0;
          const bonus = runtime.producerHasBonus(c, type, fake);
          if (bonus) {
            score += 1000;
            hasProducerBonus = true;
          }
          if (!isProducer) {
            if (cells.some(([rr, cc]) => runtime.terrainAt(c, rr, cc)?.type === 'fertile')) score -= 500;
            if (runtime.adjacentTerrain(c, fake, 'forest')) score -= 260;
            if (runtime.adjacentTerrain(c, fake, 'quarry')) score -= 260;
          }
          const near = other => runtime.inBuildingRange(fake, other, 1);
          if (type === 'guardhouse') {
            if (runtime.touchesWall(fake)) score += 90;
            if (rallies.some(near)) score += 100;
          }
          if (type === 'rally') score += spawners.filter(near).length * 65;
          if (type === 'tavern') score += spawners.filter(near).length * 55;
          if (type === 'guildhouse') score += producers.filter(x => runtime.inBuildingRange(fake, x, 2)).length * 55;
          if (type === 'townhall') score += houses.filter(h => runtime.inBuildingRange(fake, h, 2)).length * 45;
          if (type === 'house') score += halls.some(h => runtime.inBuildingRange(fake, h, 2)) ? 70 : 0;
          if (type === 'stable' && barracks.length) score += barracks.filter(near).length * 80;
          if (type === 'barracks' && stables.length) score += stables.filter(near).length * 80;
          if (cells.some(([rr, cc]) => runtime.terrainAt(c, rr, cc)?.type === 'foundation')) score += 35 + (runtime.BUILDINGS[type].cost.wood + runtime.BUILDINGS[type].cost.stone) * .08;
          score -= .5 * (Math.abs(r - runtime.CENTER.row) + Math.abs(col - runtime.CENTER.col));
          score += Math.random() * .5;
          candidates.push({
            cell: [r, col, rot],
            score,
            bonus
          });
        }
      }
    }
    if (!candidates.length) return null;
    if (isProducer && hasProducerBonus) for (const x of candidates) if (!x.bonus) x.score -= 1200;
    let best = candidates[0];
    for (let i = 1; i < candidates.length; i++) if (candidates[i].score > best.score) best = candidates[i];
    return best.cell;
  };
  runtime.v4916AiCtx = null;
  runtime.v4916ProductionRates = runtime.productionRates;
  runtime.v4916ConsumptionRates = runtime.consumptionRates;
  runtime.aiSwapSimulation = function (candidate, targetType) {
    const idx = runtime.E.buildings.findIndex(x => x.id === candidate.id);
    if (idx < 0) return null;
    if (candidate.type === targetType) return null;
    const refund = candidate.paidCost || runtime.adjustedCost(runtime.E, runtime.BUILDINGS[candidate.type].cost);
    runtime.E.buildings.splice(idx, 1);
    const oldSim = runtime.v4916AiCtx?.simulating;
    if (runtime.v4916AiCtx) runtime.v4916AiCtx.simulating = true;
    try {
      const cell = runtime.v4916FindAnyCell(runtime.E, targetType);
      if (!cell) return null;
      const rates = runtime.v4916ProductionRates(runtime.E),
        use = runtime.v4916ConsumptionRates(runtime.E);
      const add = runtime.BUILDINGS[targetType]?.unit ? runtime.projectedSpawnerNeed(targetType) : runtime.C();
      const minimum = {
        wood: 2.5,
        stone: 1,
        food: 2
      };
      const sustainable = runtime.RES.every(r => rates[r] >= Math.max(minimum[r], (use[r] + (add[r] || 0)) * 1.18 + .35));
      const price = runtime.buildPrice(runtime.E, targetType);
      const affordable = runtime.RES.every(r => (runtime.E.resources[r] || 0) + (refund[r] || 0) * .5 >= (price[r] || 0));
      return {
        cell,
        rates,
        use,
        add,
        sustainable,
        affordable
      };
    } finally {
      if (runtime.v4916AiCtx) runtime.v4916AiCtx.simulating = oldSim;
      runtime.E.buildings.splice(idx, 0, candidate);
    }
  };
  runtime.aiMakeRoomFor = function (type) {
    if (!type || runtime.findCell(runtime.E, type)) return false;
    const houseFloor = Math.max(2, Math.min(7, runtime.state.time < 90 ? 0 : 1 + Math.floor((runtime.state.time - 90) / 180)));
    const resourceFor = {
      lumber: 'wood',
      stonecutter: 'stone',
      farm: 'food'
    };
    const rates = runtime.productionRates(runtime.E),
      use = runtime.consumptionRates(runtime.E);
    const pre = [];
    const counts = {};
    for (const b of runtime.E.buildings) counts[b.type] = (counts[b.type] || 0) + 1;
    for (const b of runtime.E.buildings) {
      if (b.type === 'keep' || runtime.BUILDINGS[b.type]?.unit || runtime.isUniqueBuilding(runtime.E, b.type)) continue;
      let score = 0;
      if (b.type === 'warehouse' && (counts.warehouse || 0) > 2) score += 100;
      if (['lumber', 'stonecutter', 'farm'].includes(b.type)) {
        const r = resourceFor[b.type];
        const roughSurplus = rates[r] - use[r];
        if (roughSurplus <= 1.5) continue;
        score += 35 + Math.min(45, roughSurplus * 5) + (counts[b.type] || 0) * 1.5;
        if (runtime.producerHasBonus(runtime.E, b.type, b)) score -= 55;
      }
      if (b.type === 'guardhouse' && (counts.guardhouse || 0) > 2) score += 45;
      if (b.type === 'house' && (counts.house || 0) > houseFloor) score += 22;else if (b.type === 'house') score -= 100;
      if (b.type === 'guildhouse' || b.type === 'townhall' || b.type === 'rally' || b.type === 'tavern' || b.type === 'warcenter' || b.type === 'hospital' || b.type === 'armorsmith') score -= 80;
      if (score > 0) pre.push({
        b,
        score
      });
    }
    pre.sort((a, b) => b.score - a.score);
    const shortlist = pre.slice(0, 8);
    let best = null;
    for (const item of shortlist) {
      const sim = runtime.aiSwapSimulation(item.b, type);
      if (!sim || !sim.affordable || !sim.sustainable) continue;
      let score = item.score;
      if (['lumber', 'stonecutter', 'farm'].includes(item.b.type)) {
        const r = resourceFor[item.b.type];
        const afterSurplus = sim.rates[r] - (sim.use[r] + (sim.add[r] || 0));
        score += Math.min(35, Math.max(0, afterSurplus) * 6);
      }
      if (!best || score > best.score) best = {
        b: item.b,
        score
      };
    }
    if (!best) return false;
    if (!runtime.demolish(runtime.E, best.b.id)) return false;
    runtime.E.aiReservedBuild = {
      type,
      until: runtime.state.time + 10
    };
    return true;
  };
}
