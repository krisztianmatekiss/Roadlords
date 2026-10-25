import { UNDEAD_UNITS as U, UNDEAD_RULES } from '../../data/undead.js';
import { isUndead } from './foundation.js';

export function initializeUndeadExpansion(R){
  const own=u=>R.cityForSide(u.side);
  R.undFactionUnit=u=>!!u&&isUndead(own(u))&&!!(U[u.key]||u.undConverted);
  R.undSoulDamageMult=c=>1+Math.floor(Math.max(0,c.resources.wood)/100)*.01*R.countNormal(c,'und_soul_might');
  R.undGlobalLifeSteal=u=>R.undFactionUnit(u)&&R.hasLeg(own(u),'und_army_leech') ? .2 : 0;
  R.undHasFirstWard=u=>R.undFactionUnit(u)&&!u.undFirstGuardUsed&&R.hasLeg(own(u),'und_first_guard');
  R.undConsumeFirstWard=u=>{if(!R.undHasFirstWard(u))return false;u.undFirstGuardUsed=true;return true;};
  R.undDamageMultiplier=(u,ctx)=>R.undFactionUnit(u)&&(ctx.attack||ctx.kind==='beam')?R.undSoulDamageMult(own(u)):1;
  R.undAfterDamage=(u,actual,ctx)=>{
    if(u?.alive&&u.key!=='und_vampire'&&(ctx.attack||ctx.kind==='beam')){
      const rate=R.undGlobalLifeSteal(u);if(rate)R.healUnit(u,actual*rate);
    }
  };
  const release=R.releaseUnit;
  R.releaseUnit=(c,entry)=>{
    const u=release(c,entry);
    if(u&&R.undFactionUnit(u))u.shield=(u.shield||0)+u.maxHp*.08*R.countNormal(c,'und_spawn_ward');
    return u;
  };
  const move=R.effectiveMoveSpeed;
  R.effectiveMoveSpeed=(u,c)=>move(u,c)*(R.undFactionUnit(u)&&R.isOwnHalf(u)?1+.1*R.countNormal(c,'und_home_march'):1);
  const structure=R.roadRealStructure;
  R.roadRealStructure=(u,target)=>{
    if(!R.undFactionUnit(u))return structure(u,target);
    const factor=R.undSoulDamageMult(own(u))*(1+.1*R.countNormal(own(u),'und_siege_force')),damage=u.damage,building=u.buildingDamage;
    u.damage*=factor;u.buildingDamage*=factor;
    try{return structure(u,target);}finally{u.damage=damage;u.buildingDamage=building;}
  };
  const nearest=(at,predicate)=>{
    let found=null,best=Infinity;
    for(const u of R.state.units){if(!u.alive||u===at||!predicate(u))continue;const dx=u.lane-at.lane,dy=(u.offset||0)-(at.offset||0),d=dx*dx+dy*dy;
      if(d<best||d===best&&u.id<found.id){best=d;found=u;}}
    return found;
  };
  const spawn=(c,key,dead,extra={})=>{
    const side=R.sideForCity(c);
    if(R.state.units.reduce((n,u)=>n+Number(u.alive&&u.side===side),0)>=UNDEAD_RULES.technicalSummonLimit)return null;
    return R.undSpawn(c,key,dead.lane,dead.offset||0,extra);
  };
  // The queue keeps death cascades iterative, including collateral deaths.
  const queue=[];let processing=false;
  R.undOnCombatDeath=dead=>{
    queue.push(dead);if(processing)return;processing=true;
    try{
      for(let at=0;at<queue.length;at++){
        const u=queue[at],c=own(u);
        if(isUndead(c)){
          const stacks=R.countNormal(c,'und_death_mend');
          if(stacks){const ally=nearest(u,v=>v.side===u.side&&R.undFactionUnit(v));if(ally)R.healUnit(ally,ally.maxHp*.05*stacks);}
          if(R.undFactionUnit(u))for(const [id,key]of [['und_rise_skeleton','und_skeleton'],['und_rise_archer','und_skeleton_archer']]){
            if(R.hasLeg(c,id)&&Math.random()<.25)spawn(c,key,u,{undSummoned:!!u.undSummoned,undNoArmySlot:!!u.undNoArmySlot});
          }
        }
        for(const enemy of [R.P,R.E])if(isUndead(enemy)&&R.sideForCity(enemy)!==u.side){
          if(R.hasLeg(enemy,'und_raise_enemy')&&R.UNITS[u.key]&&Math.random()<.2)spawn(enemy,u.key,u,{undConverted:true,undSpawnHp:.5});
          if(R.hasLeg(enemy,'und_death_chain')){
            const target=nearest(u,v=>v.side===u.side);
            if(target)R.undDeathChainHit(target,target.maxHp*.2);
          }
        }
      }
    }finally{queue.length=0;processing=false;}
  };
}
