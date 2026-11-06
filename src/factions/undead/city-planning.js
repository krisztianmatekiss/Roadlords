import { UNDEAD_BUILDINGS as D } from '../../data/undead.js';
import { isUndead } from './foundation.js';
export function initializeUndeadCityPlanning(R) {
  const find = R.findCell;
  R.findCell = (c, type) => {
    if (!isUndead(c)) return find(c, type);
    const d = D[type];
    if (!d || (d.unique && R.hasBuilding(c, type))) return null;
    const occupied = R.occupancy(c),
      existing = c.buildings.filter((b) => b.type !== 'keep');
    let best = null,
      score = -Infinity;
    for (const rotation of R.rotationOptions(type)) {
      const shape = R.cityBuildingCells(c, {type, row:0, col:0, rotation});
      for (let row = 0; row < R.GRID; row++)
        for (let col = 0; col < R.GRID; col++) {
          if (
            shape.some(
              ([r, k]) =>
                row + r < 0 ||
                col + k < 0 ||
                row + r >= R.GRID ||
                col + k >= R.GRID ||
                occupied.has(R.idx(row + r, col + k)) ||
                R.terrainBlocks(c, row + r, col + k),
            )
          )
            continue;
          const b = { id: 'und-ai-preview', type, row, col, rotation, level: R.levelOf(c, type) };
          let value = -0.2 * (Math.abs(row - R.CENTER.row) + Math.abs(col - R.CENTER.col));
          if (type === 'und_soul_anchor')
            value +=
              existing
                .filter((x) => R.undInRange(c, b, x, b.level === 1 ? 1 : b.level === 2 ? 2 : 3))
                .reduce((n, x) => n + D[x.type].upkeep, 0) * 30;
          if (type === 'und_corrupted_hatchery')
            value += existing.filter((x) => x.type!=='und_graveyard' && D[x.type].unit && R.undInRange(c, b, x, 1)).length * 25;
          if (d.unit)
            value +=
              existing.filter(
                (x) =>
                  ['und_soul_anchor', 'und_corrupted_hatchery'].includes(x.type) &&
                  R.undInRange(
                    c,
                    x,
                    b,
                    x.type === 'und_soul_anchor' ? (x.level === 1 ? 1 : x.level === 2 ? 2 : 3) : 1,
                  ),
              ).length * 10;
          if (type === 'und_graveyard')
            value += existing.filter((x) => x.type === type && R.aiBuildingsTouch(c, b, x)).length * 12;
          if (value > score) {
            score = value;
            best = [row, col, rotation];
          }
        }
    }
    return best;
  };
  const makeRoom = R.aiMakeRoomFor;
  R.aiMakeRoomFor = (type) => {
    const c = R.E;
    if (!isUndead(c)) return makeRoom(type);
    const d = D[type];
    if (!d || type === 'keep' || !c.unlocked.has(type) ||
        (d.unique && R.hasBuilding(c,type)) || R.findCell(c,type)) return false;
    // Free terrain before considering demolition, including room for new Wells.
    if (R.aiMutate(() => R.aiClearBlockingRuin(type))) return true;
    // An intact excavation plot is a saving goal, not a reason to destroy a
    // working Well just because clearing is temporarily unaffordable.
    if (R.v4918BlockingRuinPlan(type, { affordableOnly: false })) return false;
    if (type === 'und_well' || c.resources.wood < R.buildPrice(c,type).wood) return false;
    if (R.state.time < (c.undeadState.aiRedevelopAfter || 0)) return false;
    const wells = R.buildingOf(c,'und_well').filter(b=>!b.inactive);
    if (wells.length <= 2) return false;
    // A well upgrade can leave many old plots redundant. Reuse one only when
    // the new building fits and its full training + upkeep remains funded.
    for (const well of wells) {
      const original = c.buildings;
      let fits = false;
      c.buildings = original.filter(b=>b.id!==well.id);
      try {
        const cell = R.findCell(c,type);
        if (cell) {
          c.buildings.push({id:'ai-room-preview:'+well.id,type,row:cell[0],col:cell[1],rotation:cell[2],level:R.levelOf(c,type),progress:0});
          // Keep more headroom than the normal Well-building threshold (20%).
          // Otherwise the next turn rebuilds the Well this turn just removed.
          fits = R.productionRates(c).wood >= R.resourceFlowRates(c).use.wood * 1.25 + 2;
        }
      } finally {
        c.buildings = original;
      }
      if (fits && R.demolish(c,well.id)) {
        c.undeadState.aiRedeveloped = (c.undeadState.aiRedeveloped || 0) + 1;
        c.undeadState.aiRedevelopAfter = R.state.time + 15;
        return true;
      }
    }
    return false;
  };
}
