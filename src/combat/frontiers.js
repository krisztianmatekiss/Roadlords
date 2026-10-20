// A live tower owns the whole cross-section of its road stage.
// Enforce this below all movement abilities, including knockbacks and separation.
const STANDOFF = 18;
export function installTowerFrontiers(R) {
  const capitals = {
    player: {capital:true,side:'enemy',lane:R.PATH_LENGTH},
    enemy: {capital:true,side:'player',lane:0},
  };
  R.roadRefreshFrontiers = function refresh() {
    let player = capitals.player, enemy = capitals.enemy;
    for (const tower of R.towers) {
      if (!tower.alive) continue;
      if (tower.side === 'enemy' && tower.lane < player.lane) player = tower;
      if (tower.side === 'player' && tower.lane > enemy.lane) enemy = tower;
    }
    R.ROAD.frontiers = {player,enemy};
    R.ROAD.frontiersAt = R.ROAD.clock;
    return R.ROAD.frontiers;
  };
  R.targetStructure = function targetStructure(side) {
    const fronts = R.ROAD.frontiers;
    if (!fronts || R.ROAD.frontiersAt !== R.ROAD.clock || !fronts[side].capital && !fronts[side].alive) R.roadRefreshFrontiers();
    return R.ROAD.frontiers[side];
  };
  R.roadLimitLane = function limit(u, lane) {
    const target = R.targetStructure(u.side);
    if (target.capital) return lane;
    return u.side === 'player' ? Math.min(lane,target.lane-STANDOFF) : Math.max(lane,target.lane+STANDOFF);
  };
  R.roadCanPursue = function reachable(u, target) {
    const structure = R.targetStructure(u.side);
    return structure.capital || (u.side === 'player' ? target.lane <= structure.lane : target.lane >= structure.lane);
  };
  const setLane = R.setBattleLane;
  R.setBattleLane = function setBattleLane(u,lane) { return setLane(u,R.roadLimitLane(u,lane)); };
}
