// Tower arrows use the battle clock, like unit projectiles. They share the
// incoming-damage budget, but are never actors or unit-ability sources.
export function installTowerProjectiles(R) {
  R.towerProjectileTargets = (tower, range, count) => {
    const out=[];
    for (const u of R.state.units) {
      if (!u.alive || u.side===tower.side || Math.abs(u.lane-tower.lane)>range) continue;
      if ((u.roadIncomingDamage||0)>=u.hp+(u.shield||0)+(u.tempShield||0)) continue;
      const d=Math.abs(u.lane-tower.lane);let i=out.length;
      while(i>0&&d<Math.abs(out[i-1].lane-tower.lane))i--;
      if(i<count){out.splice(i,0,u);if(out.length>count)out.pop();}
    }
    return out;
  };
  R.queueTowerProjectile = (tower,target,damage,offset=0) => {
    if(R.MP.enabled&&R.MP.role==='guest'||!tower.alive||!target?.alive)return false;
    const start=R.ROAD.clock, side=tower.side, victim=R.cityForSide(target.side);
    const source={id:`tower:${tower.id}`,key:'tower_arrow',side,lane:tower.lane,offset:(tower.lateral||0)+offset,alive:true};
    const a={start,launch:start,hit:start+.22,end:start+.22,recovery:0,lane:source.lane,offset:source.offset,to:target.lane,toOffset:target.offset||0,ranged:true,key:'tower_arrow',originHeight:42*(tower.gateTower?1.18:1)};
    let reserved=damage*(1+.25*R.orcCursePower(target,'curse'));
    if(target.key==='orc_ram'||target.key==='knight'&&R.hasBranch(victim,'stable','armored_knights'))reserved*=.5;
    if(target.key.startsWith('und_skeleton'))reserved*=1-Math.min(.9,.25+.05*R.countNormal(victim,'skeleton_common_ranged_res'));
    target.roadIncomingDamage=(target.roadIncomingDamage||0)+reserved;
    R.ROAD.pending.push({u:source,t:target,a,structure:false,towerShot:true,damage,reserved});
    return true;
  };
}
