export const BATTLE_UNIT_LIMIT = 750;

// Army weight remains a balance rule (Troll 4, swarm Goblin .5, etc.).
// This separate ceiling counts actors, including summons and embarked troops.
export function installBattlePopulation(R) {
  R.battleEntrySeats = e => 1+(e.orcCargo?.length||0);
  R.battlePopulation = c => {
    const side=R.sideForCity(c);
    let count=0;
    for(const u of R.state.units)if(u.alive&&u.side===side)count+=1+(u.orcCargo?.length||0);
    return count;
  };
  R.battlePopulationRoom = c => R.ROAD.test ? Infinity : Math.max(0,BATTLE_UNIT_LIMIT-R.battlePopulation(c));
  let training=null;
  const queuedSeats=c=>c.releaseQueue.reduce((n,e)=>n+R.battleEntrySeats(e),0);
  R.battleCanQueue=(c,e)=>R.battlePopulationRoom(c)-queuedSeats(c)-(training?.c===c?training.remaining:0)>=R.battleEntrySeats(e);
  const release=R.releaseUnit,spawn=R.normalSpawn,queue=R.queueProduced;
  R.releaseUnit=(c,e)=>{
    if(R.battlePopulationRoom(c)<R.battleEntrySeats(e))return null;
    return release(c,e);
  };
  R.normalSpawn=(c,b)=>{
    const batch=R.productionBatchSize(c,b);
    if(R.battlePopulationRoom(c)-queuedSeats(c)<batch)return false;
    const previous=training;training={c,b,remaining:batch};
    try{return spawn(c,b);}finally{training=previous;}
  };
  R.queueProduced=(c,e,b=null)=>{
    const primary=training?.c===c&&training.b===b&&training.remaining>0&&!e.freeCopy&&!e.tempClone&&!e.hospitalSaved&&!e.orcRaider;
    if(primary)training.remaining--;
    // Reserve the rest of a paid batch before allowing any free reinforcements.
    if(!R.battleCanQueue(c,e)){if(primary)training.remaining++;return false;}
    const result=queue(c,e,b);if(!result&&primary)training.remaining++;
    return result;
  };
  Object.assign(window.__ROADLORDS__,{releaseUnit:R.releaseUnit,normalSpawn:R.normalSpawn});
}
