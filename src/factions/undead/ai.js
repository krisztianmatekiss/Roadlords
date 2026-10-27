import { UNDEAD_BUILDINGS as D, UNDEAD_UNITS as U } from '../../data/undead.js';
import { isUndead } from './foundation.js';
export function initializeUndeadAi(R) {
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
      const shape = R.rotatedShape(type, rotation);
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
            value += existing.filter((x) => D[x.type].unit && R.undInRange(c, b, x, 1)).length * 25;
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
  const buildAi = R.enemyBuildAI;
  R.enemyBuildAI = (dt) => {
    const c = R.E;
    if (!isUndead(c)) return buildAi(dt);
    if (R.MP.enabled || R.state.pregame || R.state.ended) return;
    c.aiThink -= dt;
    if (c.aiThink > 0) return;
    c.aiThink = 0.8;
    R.enemyGateAI();
    const num = (type) => R.buildingOf(c, type).length,
      gain = R.productionRates(c).wood,
      demand = R.resourceFlowRates(c).use.wood;
    const tryBuild = (type) => {
      if (!c.unlocked.has(type)) return false;
      const cell = R.findCell(c, type);
      if (!cell) return false;
      const price = R.placementPrice(c, type, ...cell).wood;
      if (c.resources.wood < price) {
        c.undSaveSouls = price;
        return true;
      }
      c.undSaveSouls = 0;
      return R.aiBuild(type);
    };
    c.undSaveSouls = 0;
    if (!num('und_well') && tryBuild('und_well')) return;
    if (R.state.startChoices > 0) return;
    if (!num('und_graveyard') && tryBuild('und_graveyard')) return;
    const committed = R.fieldUnitCount(c) + R.reserveCount(c);
    if (committed > c.armyCap * 0.75 && tryBuild('und_crypt')) return;
    if (gain < demand + Math.max(1, demand * 0.2) && tryBuild('und_well')) return;
    const military = Object.keys(D)
      .filter((k) => D[k].unit && c.unlocked.has(k) && (!D[k].unique || !num(k)))
      .sort((a, b) => num(a) - num(b) || D[a].souls - D[b].souls);
    for (const type of military) {
      if (
        gain <
        demand + U[D[type].unit].souls / D[type].times[R.levelOf(c, type) - 1] + D[type].upkeep + 1
      ) {
        if (tryBuild('und_well')) return;
        continue;
      }
      if (tryBuild(type)) return;
    }
    if (num('und_graveyard') >= 3) {
      for (const type of [
        'und_soul_harvester',
        'und_bone_forge',
        'und_soul_anchor',
        'und_plague_chamber',
        'und_rebirth_tomb',
      ]) {
        if (!num(type) && c.unlocked.has(type) && gain > demand + D[type].upkeep + 2 && tryBuild(type))
          return;
      }
    }
  };
  const score = R.scoreAiChoiceV17;
  R.scoreAiChoiceV17 = (o) => {
    if (!isUndead(R.E)) return score(o);
    const c = R.E;
    if (o.kind === 'building_upgrade' || o.kind === 'building_branch') {
      if (o.id === 'keep') return 28;
      if (o.id === 'und_well') return 20 + R.buildingOf(c, 'und_well').length * 3;
      if (o.id === 'und_graveyard') return 16 + R.buildingOf(c, 'und_graveyard').length * 2;
      return 12 + R.buildingOf(c, o.id).length;
    }
    if (o.kind === 'building')
      return (
        {
          und_morgue: 20,
          und_ghost_spawner: 19,
          und_necro_spawner: 18,
          und_soul_harvester: 17,
          und_vampire_castle: 14,
          und_soul_anchor: 12,
          und_lich_spawner: 13,
          und_rebirth_tomb: 12,
        }[o.id] || 9
      );
    if (o.kind === 'legendary') return 15;
    return (
      { gen_soul_abundance: 20, gen_soul_frugal: 18, gen_military_speed: 12 }[o.id] ||
      8
    );
  };
}
