import { CIVILIAN_MILITIA_INTERVAL } from '../data/economy-balance.js';
import { producerBaseOutput } from '../economy/producer-output.js';
// Read-only whole-city comparisons. Overflow income has no marginal value once
// it has been sustained; training, operating costs and useful reserves still do.
export function installRedevelopmentValue(R) {
  const townhallReceivers=new Set(['warehouse','market','house','guardhouse','rally','tavern','armorsmith','guildhouse','library','mastersguild']);
  R.aiRedevelopmentPosition=(c,b)=>{
    const role=R.aiBuildingMechanics(b.type),unit=!!R.BUILDINGS[b.type]?.unit;
    const incoming=c.buildings.filter(h=>{
      if(h.id===b.id||h.inactive)return false;
      const m=R.aiBuildingMechanics(h.type);
      if(h.type==='townhall'&&!townhallReceivers.has(b.type))return false;
      return (m.localUpkeep||m.localSupport||unit&&(m.local||m.storage))&&R.aiSupportAffects(c,h,b);
    }).map(h=>[h.type,h.type==='townhall'?2:h.level*(R.townhallPower?.(c,h)||1)]);
    let outgoing=[];
    if(role.local||role.localSupport||role.localUpkeep)outgoing=(role.local?R.activeSpawners(c):c.buildings)
      .filter(p=>p.id!==b.id&&R.aiSupportAffects(c,b,p)).map(p=>p.id);
    if(b.type==='guildhouse')outgoing=c.buildings.filter(p=>['lumber','stonecutter','farm'].includes(p.type)&&R.inBuildingRange(b,p,R.hasBranch(c,'guildhouse','guild_network')?3:2)).map(p=>p.id);
    if(b.type==='orc_slave'&&R.hasBranch(c,b.type,'overseers'))outgoing=R.adjacentBuildings(c,b).filter(p=>['orc_work','orc_hunt'].includes(p.type)).map(p=>p.id);
    if(unit&&c.race==='human'&&R.hasLeg(c,'royal_district')){
      const keep=R.buildingOf(c,'keep')[0];if(keep&&R.aiBuildingsTouch(c,keep,b))incoming.push(['royal-keep',1]);
    }
    return JSON.stringify([incoming,outgoing.sort(),role.produces?producerBaseOutput(R,c,b):null,unit?R.effectiveUnitKey(c,b):null]);
  };
  R.aiRedevelopmentHasPurpose=(c,plan,after)=>plan.ids.every(id=>{
    const old=R.getBuilding(c,id);if(old?.type!==plan.type)return true;
    const [incoming,targets,output,key]=JSON.parse(after.position);
    const [wasIncoming,wasTargets,wasOutput,wasKey]=JSON.parse(R.aiRedevelopmentPosition(c,old));
    return key!==wasKey||targets.some(target=>!wasTargets.includes(target))||
      incoming.some(([type,strength])=>strength>Math.max(0,...wasIncoming.filter(([t])=>t===type).map(([,v])=>v)))||
      R.RES.some(r=>(output?.[r]||0)>(wasOutput?.[r]||0)+.01);
  });
  R.aiEnrichRedevelopmentMeasure=(c,metrics)=>{
   const m={...metrics,gain:{...metrics.gain},rawGain:{...metrics.gain},units:Object.fromEntries(Object.entries(metrics.units).map(([k,u])=>[k,{...u}])),stock:{...c.resources},
    mainCap:c.garrisonCap, rallyCap:c.rallyCap,
    mainUsed:c.garrison.reduce((n,e)=>n+R.orcReserveWeight(e,c),0),
    rallyUsed:c.rallyReserve.reduce((n,e)=>n+R.orcReserveWeight(e,c),0),
    passive:0,
   };
   if(R.hasLeg(c,'arm_the_people')){
     const count=c.buildings.filter(b=>!b.inactive&&['lumber','stonecutter','farm'].includes(b.type)).length;
     const rate=count/CIVILIAN_MILITIA_INTERVAL,quality=R.aiUnitQuality(c,'swordsman');
     const u=m.units.swordsman||(m.units.swordsman={rate:0,power:0,count:0,quality});
     u.rate+=rate;u.power+=rate*quality;m.power+=rate*quality;
   }
   // A Market can pay a resource deficit from another resource's overflow.
   // Converted output never feeds back into the conversion source.
   const efficiency=c.race==='human'?R.marketConversionEfficiency(c):0,raw={...m.gain};
   if(efficiency)for(const from of R.RES){
     const net=Math.max(0,raw[from]-m.use[from]);
     if(!net||(c.caps[from]-c.resources[from])/net>15)continue;
     let available=net*efficiency;
     const targets=R.RES.filter(r=>r!==from).sort((a,b)=>(m.use[b]-m.gain[b])-(m.use[a]-m.gain[a]));
     for(const to of targets){const gain=Math.min(available,Math.max(0,m.use[to]*1.12-m.gain[to]));m.gain[to]+=gain;available-=gain;}
   }
   return m;
  };
  R.aiRedevelopmentMeasure=c=>R.aiEnrichRedevelopmentMeasure(c,R.aiCityMetrics(c));
  R.aiRedevelopmentPassive=(c,m)=>{
    let value=R.aiPassiveValue(c,m);
    // The Slave Camp's accumulated income is already in the economic model.
    for(const b of c.buildings)if(!b.inactive&&b.type==='orc_slave')value-=Math.min(6,m.power*.25)*b.level;
    if(R.hasBuilding(c,'towercommand'))value+=R.towers.filter(t=>t.alive&&t.side===R.sideForCity(c)).length*3;
    return value;
  };
  R.aiRedevelopmentSafe=(c,before,after,plan,history)=>{
    const weight=e=>R.orcReserveWeight(e,c);
    const main=c.garrison.reduce((n,e)=>n+weight(e),0),rally=c.rallyReserve.reduce((n,e)=>n+weight(e),0);
    const field=R.fieldUnitCount(c)+c.releaseQueue.reduce((n,e)=>n+R.orcArmyWeight(e,c),0);
    if(after.armyCap<Math.min(before.armyCap,field)||after.mainCap<main||after.rallyCap<rally)return false;
    if(after.mainCap<(after.mainUsed||0)||after.rallyCap<(after.rallyUsed||0))return false;
    if(after.maxHp<before.maxHp*.95)return false;
    for(const r of R.aiResourceKeys(c)){
      const net=before.gain[r]-before.use[r],post=after.gain[r]-after.use[r];
      const demand=Math.max(after.use[r],history.peak[r]||0);
      if(post+ .01<Math.min(net,demand*.12))return false;
      if(after.stock[r]<Math.min(15,after.use[r]*2)-.01)return false;
      const relevant=Math.max(before.constructionReserve[r]||0,(c._aiSaveCapacityPrice||c._aiSavePrice)?.[r]||0);
      if(after.caps[r]<Math.min(before.caps[r],relevant))return false;
    }
    const focus=R.aiStrategyFor(c)?.primary?.units||[];
    if(focus.some(key=>before.units[key]&&!after.units[key]))return false;
    return true;
  };
  R.aiRedevelopmentValue=(c,before,after,plan,history)=>{
    const a={...before,gain:{...before.gain}},b={...after,gain:{...after.gain}};
    const actorsFull=(R.battlePopulationRoom?.(c)??Infinity)<=0;
    if(actorsFull)b.armyCap=Math.min(b.armyCap,a.armyCap);
    for(const r of R.aiResourceKeys(c)){
      if((history.surplus[r]||0)<20)continue;
      const need=Math.max(before.use[r],after.use[r],history.peak[r]||0)*1.2+
        Math.max(before.constructionReserve[r]||0,plan.price[r]||0)/30;
      a.gain[r]=Math.min(a.gain[r],need);b.gain[r]=Math.min(b.gain[r],need);
    }
    // Once recruitment can replace the observed losses and refill a field army
    // in 90 s, compare quality too instead of rewarding unlimited extra queues.
    const effective=m=>{
      const rate=Object.entries(m.units).reduce((n,[key,u])=>n+u.rate*Math.max(1,R.orcArmyWeight({key},c)),0);
      const needed=Math.max(1,(actorsFull?Math.min(m.armyCap,before.armyCap):m.armyCap)/90,history.deathRate*1.3);
      return m.power*Math.min(1,needed/Math.max(.01,rate));
    };
    a.power=effective(a);b.power=effective(b);
    let score=R.aiMetricDelta(a,b,c)+after.passive-before.passive;
    const freed=before.slots-after.slots,space=.7+2*Math.pow(before.slots/(R.GRID*R.GRID),2);
    // Ordinary construction also consumes scarce land. Without this symmetric
    // cost, another duplicate always beats moving an existing useless support.
    score+=freed*space-Math.max(0,freed)*.7;
    const rate=Object.entries(before.units).reduce((n,[key,u])=>n+u.rate*Math.max(1,R.orcArmyWeight({key},c)),0);
    const wave=Math.max(8,Math.min(before.reserveCap,rate*20));
    const wanted=Math.min(R.armyCapacityLimit,R.fieldUnitCount(c)+(actorsFull?0:R.reserveCount(c)+wave));
    score+=12*Math.max(-1,Math.min(1,(Math.min(after.armyCap,wanted)-Math.min(before.armyCap,wanted))/wave));
    for(const r of R.aiResourceKeys(c)){
      const needed=Math.max(before.constructionReserve[r]||0,(c._aiSaveCapacityPrice||c._aiSavePrice)?.[r]||0);
      score+=20*(Math.min(after.caps[r],needed)-Math.min(before.caps[r],needed))/Math.max(100,needed);
    }
    const goal=R.aiStrategyFor(c)?.primary;
    if(goal?.goals.includes(plan.type)&&!R.hasBuilding(c,plan.type))score+=4*goal.confidence;
    const field=R.fieldUnitCount(c)+R.reserveCount(c);
    score-=20*Math.max(0,Math.min(before.armyCap,field+20)-after.armyCap)/Math.max(50,before.armyCap);
    for(const r of R.aiResourceKeys(c)){
      score-=Math.min(8,(plan.cashLost[r]||0)/Math.max(10,before.gain[r])* .15);
      score-=Math.min(4,(plan.price[r]||0)/Math.max(1,before.gain[r])*.08);
    }
    score-=1+plan.ids.length*.4;
    return score;
  };
  // This mirrors paid demolition/placement on an isolated city. Never call
  // those real actions here: they have statistics, tower and RNG side effects.
  R.aiProjectRedevelopment=(c,plan)=>R.aiPreview(c,shadow=>{
    plan.cashLost=R.C();plan.affordable=false;plan.legal=false;
    for(const id of plan.ids){
      const b=R.getBuilding(shadow,id);if(!b||b.type==='keep')return;
      const refund=b.paidCost||R.adjustedCost(shadow,R.BUILDINGS[b.type].cost);
      shadow.buildings=shadow.buildings.filter(x=>x.id!==id);
      if(b.type==='warcenter')for(const sp of R.activeSpawners(shadow))sp.inactive=false;
      for(const r of R.RES){
        const available=shadow.resources[r]+(refund[r]||0)*.5;
        shadow.resources[r]=Math.min(shadow.caps[r],available);
        // A discarded refund is not an additional loss of existing savings.
        // The full new construction price is already charged below.
      }
      const stock={...shadow.resources};R.recomputeCity(shadow,true);
      for(const r of R.RES)plan.cashLost[r]+=Math.max(0,stock[r]-shadow.resources[r]);
    }
    if(!R.canPlace(shadow,plan.type,...plan.cell)||
       R.isUniqueBuilding(shadow,plan.type)&&R.hasBuilding(shadow,plan.type))return;
    const [row,col,rotation]=plan.cell,b={id:'redevelopment-preview',type:plan.type,row,col,rotation,level:R.levelOf(shadow,plan.type),progress:0};
    if(R.aiRequiresLocalTargets(shadow,b)){
      const targets=R.aiBuildingMechanics(b.type).localSupport?shadow.buildings:R.activeSpawners(shadow);
      if(!R.aiMarginalSupportTargets(shadow,b,targets.filter(p=>R.aiSupportAffects(shadow,b,p))).length)return;
    }
    plan.legal=true;plan.price=R.placementPrice(shadow,plan.type,...plan.cell);
    // Refunds are modeled, but cannot be the funding source for the project.
    plan.affordable=R.canPay(c,plan.price)&&R.canPay(shadow,plan.price);
    if(!plan.affordable)return;
    for(const r of R.RES)shadow.resources[r]-=plan.price[r]||0;
    for(const [r,k]of R.placementFoundationCells(shadow,plan.type,...plan.cell))shadow.terrain[R.idx(r,k)]=null;
    shadow.buildings.push(b);
  },shadow=>{
    const m=R.aiRedevelopmentMeasure(shadow);m.passive=R.aiRedevelopmentPassive(shadow,m);
    const created=R.getBuilding(shadow,'redevelopment-preview');if(created)m.position=R.aiRedevelopmentPosition(shadow,created);return m;
  });
}
