// Placement quality follows the same edge/range rules as the real building effects.
export function initializeAiCityPlanning(R) {
  const cells = (c, b) => R.cityBuildingCells(c, b);
  R.aiBuildingsTouch = (c, a, b) => {
    const aa = cells(c, a), bb = cells(c, b);
    return aa.some(([r, col]) => bb.some(([rr, cc]) => Math.abs(r - rr) + Math.abs(col - cc) === 1));
  };
  const inRange = (c, a, b, distance) => {
    const aa = cells(c, a), bb = cells(c, b);
    return aa.some(([r, col]) => bb.some(([rr, cc]) => Math.max(Math.abs(r - rr), Math.abs(col - cc)) <= distance));
  };
  function effect(c, hub) {
    if (hub.inactive) return null;
    if (hub.type === 'rally') return R.hasBranch(c, 'rally', 'war_rally') ? 2 : 'edge';
    if (hub.type === 'armorsmith') return R.hasLeg(c, 'armor_extended_range') ? 2 : 'edge';
    if (hub.type === 'academy') return R.hasBranch(c, 'academy', 'war_academy') ? null : 'edge';
    if (['alchemist', 'orc_arena', 'orc_overseer'].includes(hub.type)) return 'edge';
    if (hub.type === 'warehouse' && R.hasLeg(c, 'supply_hub')) return 'edge';
    if (hub.type === 'tavern') return 'edge';
    if (hub.type === 'townhall') return 'city-support';
    return null;
  }
  R.aiSupportAffects = function (c, hub, target) {
    const distance = effect(c, hub);
    if(distance==='city-support')return !['keep','townhall','warcenter'].includes(target.type)&&!R.BUILDINGS[target.type]?.unit&&inRange(c,hub,target,(hub.level||R.levelOf(c,'townhall'))>=4?20:hub.level||R.levelOf(c,'townhall'));
    return distance === 'edge' ? R.aiBuildingsTouch(c, hub, target) : typeof distance === 'number' && inRange(c, hub, target, distance);
  };
  R.aiLayoutPlan = function (c) {
    return R.aiMemo('layout:' + (c === R.E ? 'enemy:' : 'player:') + c.buildings.map(b => b.id).join(','), () => {
      const producers = R.activeSpawners(c).filter(b => !b.inactive);
      const hubs = c.buildings.filter(b => effect(c, b) !== null).map(hub => ({ hub, covered: (hub.type==='townhall'?c.buildings:producers).filter(b => R.aiSupportAffects(c, hub, b)).length }));
      return { producers, hubs };
    });
  };
  R.aiSupportCoverage = function (c, candidate, plan = R.aiLayoutPlan(c)) {
    if (effect(c, candidate) === null) return null;
    return (candidate.type==='townhall'?c.buildings:plan.producers).filter(b => R.aiSupportAffects(c, candidate, b)).length;
  };
  R.aiRequiresLocalTargets = (c, b) => ['rally', 'armorsmith', 'academy', 'alchemist', 'orc_arena', 'orc_overseer','tavern','townhall'].includes(b.type)
    && effect(c, b) !== null && !(b.type === 'orc_overseer' && R.hasBranch(c, 'orc_overseer', 'blood_horde'));
  R.aiLayoutAdjustment = function (c, candidate, plan = R.aiLayoutPlan(c)) {
    if (R.BUILDINGS[candidate.type]?.unit) return 0;
    let score = 0;
    for (const { hub, covered } of plan.hubs) {
      if(hub.type==='townhall'){if(R.aiSupportAffects(c,hub,candidate))score+=100;continue;}
      // A soft reservation: existing useful hubs keep room for up to 3 producers.
      // A full city can still use these plots; no valid placement is prohibited.
      if (covered < 3 && R.aiSupportAffects(c, hub, candidate)) score -= (3 - covered) * 150;
    }
    return score;
  };
}
