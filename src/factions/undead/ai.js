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
      if (!cell) {
        if (R.aiMakeRoomFor(type)) return true;
        const plan = R.v4918BlockingRuinPlan(type, { affordableOnly: false });
        if (!plan) return false;
        // Reserve for the whole footprint and the building; training must not
        // spend every earned Soul while the AI waits to excavate its next plot.
        c.undSaveSouls = plan.ruins.reduce((sum, [row,col]) =>
          sum + R.terrainClearPrice(c, R.terrainAt(c,row,col).type).wood, R.buildPrice(c,type).wood);
        return true;
      }
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
    if (R.aiExcavateAncient()) return;
    if (R.activeSpawners(c).length>=3 && R.state.time-(c.undeadState.aiLastSupportAt ?? -999)>=45) {
      for (const type of ['und_soul_anchor','und_bone_forge','und_corrupted_hatchery','und_plague_chamber','und_rebirth_tomb']) {
        if (!c.unlocked.has(type)||num(type)||gain<=demand+D[type].upkeep+2) continue;
        const cell=R.findCell(c,type);if(!cell)continue;
        if(type==='und_corrupted_hatchery') {
          const preview={type,row:cell[0],col:cell[1],rotation:cell[2],level:R.levelOf(c,type)};
          if(!R.activeSpawners(c).some(b=>b.type!=='und_graveyard'&&R.undInRange(c,preview,b,1)))continue;
        }
        const before=num(type);
        if(tryBuild(type)){if(num(type)>before)c.undeadState.aiLastSupportAt=R.state.time;return;}
      }
    }
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
      if (o.id === 'keep') {
        if(o.branch==='elite_dominion')return R.productionRates(c).wood>=R.resourceFlowRates(c).use.wood+R.undEconomy(c).totalUpkeep?30:8;
        if(o.branch==='dead_realm')return 20+Math.min(12,R.countNormal(c,'und_territory')+R.buildingOf(c,'und_dark_tower').length*2+R.buildingOf(c,'und_garden_of_dead').length*3);
        return 28;
      }
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
