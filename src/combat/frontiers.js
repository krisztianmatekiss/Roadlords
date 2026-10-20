// A tower remains a stage objective, with a local melee encounter pocket.
const STANDOFF = 18;
const POCKET = 108;
export function installTowerFrontiers(R) {
  for(const tower of R.towers)tower.roadRadius=tower.gateTower?40:34;
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
    const dy=(u.offset||0)-(target.lateral||0),dir=u.side==='player'?1:-1;
    const allowance=u.tags?.includes('melee')?Math.sqrt(Math.max(0,POCKET*POCKET-dy*dy)):0;
    const boundary=target.lane+dir*(allowance-STANDOFF);
    return dir===1?Math.min(lane,boundary):Math.max(lane,boundary);
  };
  R.roadShouldReturnTower = function shouldReturn(u){
    const tower=R.targetStructure(u.side);
    if(u.roadTowerObjective!==tower.id){u.roadTowerObjective=tower.id;u.roadTowerDiversionUntil=0;}
    return !tower.capital&&u.tags?.includes('melee')&&u.roadTowerDiversionUntil>0&&R.ROAD.clock>=u.roadTowerDiversionUntil;
  };
  R.roadTowerSlot = function slot(u,tower){
    if(tower.capital||!u.tags?.includes('melee'))return null;
    const radius=tower.roadRadius+Math.min(28,Math.max(8,u.range*.65));
    const angle=Math.PI+(u.id%8)*Math.PI/4,dir=u.side==='player'?1:-1;
    return {lane:tower.lane+dir*Math.cos(angle)*radius,offset:(tower.lateral||0)+Math.sin(angle)*radius,radius};
  };
  R.roadTowerPositionReady = function ready(u,tower){
    if(R.roadShouldReturnTower(u)&&R.roadDistance(u,tower)<=u.range)return true;
    const slot=R.roadTowerSlot(u,tower);
    return !slot||Math.hypot(u.lane-slot.lane,(u.offset||0)-slot.offset)<=18;
  };
  R.roadCanPursue = function reachable(u, target) {
    const structure = R.targetStructure(u.side);
    if(R.roadShouldReturnTower(u))return false;
    if(structure.capital)return true;
    const dir=u.side==='player'?1:-1;
    if(dir*(target.lane-structure.lane)<=0)return true;
    if(!u.tags?.includes('melee'))return false;
    const dy=(target.offset||0)-(structure.lateral||0);
    return dir*(target.lane-structure.lane)<=Math.sqrt(Math.max(0,POCKET*POCKET-dy*dy))-STANDOFF;
  };
  const setLane = R.setBattleLane;
  R.setBattleLane = function setBattleLane(u,lane) { return setLane(u,R.roadLimitLane(u,lane)); };
}
