import { WORLD_UNITS_PER_METRE } from '../world/measurements.js';

// A group never grows beyond 20 m by chaining nearby neighbours together.
// Different sides and unit types always keep their own portrait and count.
export function groupBattleUnits(units, span=20*WORLD_UNITS_PER_METRE) {
  const buckets=new Map(),groups=[];
  for(const u of units){
    if(!u.alive||!Number.isFinite(u.lane))continue;
    const key=u.side+':'+u.key;
    if(!buckets.has(key))buckets.set(key,[]);
    buckets.get(key).push(u);
  }
  for(const units of buckets.values()){
    units.sort((a,b)=>a.lane-b.lane);let group;
    for(const u of units){
      if(!group||u.lane-group.start>span){group={side:u.side,key:u.key,start:u.lane,end:u.lane,lane:0,count:0,hp:0,maxHp:0,id:`${u.side}:${u.key}:${u.id}`};groups.push(group);}
      group.end=u.lane;group.lane+=u.lane;group.count++;
      group.hp+=Math.max(0,u.hp||0);group.maxHp+=Math.max(0,u.maxHp||0);
    }
  }
  for(const group of groups)group.lane/=group.count;
  return groups.sort((a,b)=>a.lane-b.lane||a.side.localeCompare(b.side)||a.key.localeCompare(b.key));
}
