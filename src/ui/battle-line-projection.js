// Screen-space formations prevent an overview from becoming a row of overlapping
// portraits. The 20 m combat groups remain intact; only their presentation merges.
export function projectBattleGroups(groups,{width,pad,pathLength}){
  const result=[],usable=Math.max(1,width-pad*2),x=lane=>pad+lane/pathLength*usable;
  for(const side of ['player','enemy']){
    let current;
    for(const source of groups.filter(g=>g.side===side)){
      const px=x(source.lane);
      if(!current||px-current.firstX>64||px-current.lastX>48){current={side,firstX:px,lastX:px,lane:0,count:0,hp:0,maxHp:0,start:source.start,end:source.end,types:new Map(),sourceIds:[]};result.push(current);}
      current.lastX=px;current.lane+=source.lane*source.count;current.count+=source.count;current.hp+=source.hp;current.maxHp+=source.maxHp;current.end=source.end;current.sourceIds.push(source.id);
      current.types.set(source.key,(current.types.get(source.key)||0)+source.count);
    }
  }
  for(const formation of result){formation.lane/=formation.count;formation.key=[...formation.types].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0]))[0][0];formation.id=formation.side+':'+formation.sourceIds[0];formation.types=[...formation.types].map(([key,count])=>({key,count}));}
  return result;
}
