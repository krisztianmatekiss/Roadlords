import { ORC_REDESIGN } from '../data/faction-redesign.js';

export function adjacentTerrainCount(R, c, b, type) {
  const seen = new Set();
  for (const [row, col] of R.cityBuildingCells(c, b)) {
    for (const [r, k] of R.orth(row, col)) {
      if (R.terrainAt(c, r, k)?.type === type) seen.add(R.idx(r, k));
    }
  }
  return seen.size;
}

// Per-building output before city-wide multipliers. Gameplay and AI placement
// share the same terrain, level and local-support rules; no simulated training.
export function producerBaseOutput(R, c, b) {
  const out = R.C();
  if (['lumber', 'stonecutter', 'farm'].includes(b.type)) {
    const value = ([1, 2, 3, 6][b.level - 1] || 6) * R.guildMultiplier(c, b);
    if (b.type === 'lumber') out.wood = value * (1 + adjacentTerrainCount(R, c, b, 'forest'));
    if (b.type === 'stonecutter') out.stone = value * (1 + adjacentTerrainCount(R, c, b, 'quarry'));
    if (b.type === 'farm') out.food = value * (R.buildingOnTerrain(c, b, 'fertile') ? 2 : 1);
  } else if (b.type === 'orc_work' || b.type === 'orc_hunt') {
    const slave = R.hasBranch(c, 'orc_slave', 'overseers') &&
      R.adjacentBuildings(c, b).some(x => x.type === 'orc_slave' && !x.inactive) ? 1.5 : 1;
    if (b.type === 'orc_work') {
      const stone = R.branchOf(c, b.type) === 'stone';
      const terrain = type => R.adjacentTerrain(c, b, type) ? R.hasLeg(c, 'orc_ancient_deposits') ? 3 : 2 : 1;
      out.wood = slave * (b.level === 4 ? stone ? 4 : 6 : Math.min(b.level, 3)) * terrain('forest');
      out.stone = slave * (b.level === 4 ? stone ? 6 : 4 : Math.min(b.level, 3)) * terrain('quarry');
    } else {
      out.food = slave * R.v4LevelValue(b.level, ORC_REDESIGN.hunt) *
        (1 + (R.touchesWall(b) ? .5 : 0) + (R.orcGateBonuses(c) ? .5 : 0));
    }
  }
  return out;
}
