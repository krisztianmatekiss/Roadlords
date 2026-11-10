// Shared receding-horizon construction plan. The same goals fund the economy,
// admit recruitment lines and guide picks; forecasts use paid legal placements.
export function installAiInvestmentPlan(R){
  const cache=new WeakMap();
  const eligible=(c,t)=>c.unlocked.has(t)&&R.canBuildArmyCapacity(c,t)&&(!R.isUniqueBuilding(c,t)||!R.hasBuilding(c,t));
  R.aiInvestmentDemand=(c,metrics,battle,intent,strategy)=>{
    const sources=R.aiFactionBuildings(c).filter(t=>c.unlocked.has(t)&&R.aiBuildingMechanics(t).produces),goals=[];
    const room=metrics.slots<80?1:metrics.slots<95?.35:0,expanding=battle.safeOpening&&metrics.slots<60;
    const military=[...intent.purposes.values()].filter(p=>p.needed&&eligible(c,p.type));
    military.sort((a,b)=>(b.role==='core')-(a.role==='core')||b.value-a.value);
    if(room)for(const p of military){goals.push(p.type);if(goals.length===2)break;}
    if(goals.length===1&&military[0]?.role==='core'&&!R.isUniqueBuilding(c,goals[0]))goals.push(goals[0]);
    const required=new Set(strategy?.primary?R.aiStrategyDescriptor(c,strategy.primary.anchor).needs:[]);
    for(const t of strategy?.primary?.goals||[]){
      if(R.hasBuilding(c,t)||!eligible(c,t)||R.aiBuildingMechanics(t).produces||R.BUILDINGS[t]?.unit&&!intent.purposes.get(t)?.needed&&!required.has(t))continue;
      if(!goals.includes(t)&&goals.length<3)goals.push(t);
    }
    const committed=R.fieldUnitCount(c)+c.releaseQueue.reduce((n,e)=>n+R.orcArmyWeight(e,c),0)+Math.min(30,R.reserveCount(c));
    if(committed>=c.armyCap*.85&&c.armyCap<R.armyCapacityLimit&&(R.battlePopulationRoom?.(c)??Infinity)>0){
      const capacity=R.aiFactionBuildings(c).find(t=>{if(!R.aiBuildingMechanics(t).capacity||!eligible(c,t))return false;
        const cell=R.findCell(c,t);return cell&&R.armyCapacityBonus(c,{type:t,level:R.levelOf(c,t),row:cell[0],col:cell[1],rotation:cell[2]})>0;});
      if(capacity)goals.unshift(capacity);
    }
    const budget=R.C(),future=R.C();
    for(const type of goals){
      const cell=R.findCell(c,type),price=cell?R.placementPrice(c,type,...cell):R.buildPrice(c,type);
      const land=cell?null:R.aiBlockingPlan(c,type,{affordableOnly:false});
      for(const r of R.RES)budget[r]+=(price[r]||0)+(land?.cost[r]||0);
      if(R.BUILDINGS[type]?.unit){const b={type,level:R.levelOf(c,type),row:cell?.[0]||0,col:cell?.[1]||0,rotation:cell?.[2]||0},seconds=R.trainingTime(c,b),cost=R.primarySpawnCost(c,R.effectiveUnitKey(c,b),b);
        if(Number.isFinite(seconds))for(const r of R.RES)future[r]+=(cost[r]||0)*R.productionBatchSize(c,b)/Math.max(1,seconds);}
    }
    // Expanding the economy also costs wood/stone. Count each full price
    // vector, including the wood price of a stone-producing building.
    for(const type of sources){
      const cell=R.findCell(c,type),land=cell?null:R.aiBlockingPlan(c,type,{affordableOnly:false});
      if(!cell&&!land)continue;
      const price=R.buildPrice(c,type);for(const r of R.RES)budget[r]+=((price[r]||0)+(land?.cost[r]||0))*(expanding?2:1)*room;
    }
    const target=R.C(),period=expanding?60:90;
    for(const r of R.aiResourceKeys(c))target[r]=metrics.use[r]*1.15+(budget[r]/period+future[r]*.8)*room;
    const stores=R.aiFactionBuildings(c).filter(t=>R.aiBuildingMechanics(t).storage&&eligible(c,t));
    let landStorageRequired=R.RES.some(r=>(c._aiAncientPrice?.[r]||0)>c.caps[r]&&(c._aiAncientPrice?.[r]||0)>c.resources[r]);
    const needsStorage=goals.map(t=>{
      const price={...R.buildPrice(c,t)},land=R.findCell(c,t)?null:R.aiBlockingPlan(c,t,{affordableOnly:false});
      for(const [row,col]of land?.ruins||[]){const cost=R.terrainClearPrice(c,R.terrainAt(c,row,col).type);for(const r of R.RES){price[r]=Math.max(price[r]||0,cost[r]||0);if(cost[r]>c.caps[r]&&cost[r]>c.resources[r])landStorageRequired=true;}}
      return R.RES.some(r=>price[r]>c.caps[r]&&price[r]>c.resources[r]);
    });
    const storageIndex=needsStorage.indexOf(true);
    if(storageIndex>=0&&stores[0])goals.splice(storageIndex,0,stores[0]);
    if(R.aiStoragePressure(c,metrics)&&stores[0]&&!goals.includes(stores[0]))goals.unshift(stores[0]);
    return {target,budget,future,goals:[...new Set(goals)].slice(0,4),sources,expanding,landStorageRequired,growing:room>0&&R.aiResourceKeys(c).some(r=>metrics.gain[r]+.01<target[r])};
  };
  const operational=(c,ctx)=>{
    const flow=R.resourceFlowRates(c),use={...flow.use};
    // Actual recruitment uses the same savings reserve during expansion. Its
    // *full* cost remains in the long-term demand; only near-term cash is held.
    if(ctx.growth.growing&&!ctx.pressure)for(const r of R.RES)use[r]-=(flow.sources.production?.[r]||0)*.8;
    return {gain:flow.gain,use};
  };
  function bridge(c,type,ctx){
    if(R.aiBuildingMechanics(type).produces||R.aiBuildingMechanics(type).storage)return null;
    const cell=R.findCell(c,type);if(!cell)return null;
    const goal=R.placementPrice(c,type,...cell),flow=R.resourceFlowRates(c),need={...flow.use};
    const b={type,row:cell[0],col:cell[1],rotation:cell[2],level:R.levelOf(c,type)};
    if(R.BUILDINGS[type].unit){const cost=R.primarySpawnCost(c,R.effectiveUnitKey(c,b),b),time=R.trainingTime(c,b);
      for(const r of R.RES)need[r]+=(cost[r]||0)*R.productionBatchSize(c,b)/Math.max(1,time);}
    const shortage=R.C();
    for(const r of R.aiResourceKeys(c)){
      const deficit=Math.max(0,need[r]*1.1-flow.gain[r]);
      const operating=deficit>0&&c.resources[r]<(goal[r]||0)+deficit*90?deficit:0;
      const wait=Math.max(0,(goal[r]||0)-c.resources[r])/Math.max(.1,flow.gain[r]-flow.use[r]*.2);
      shortage[r]=operating+Math.max(0,wait-25)*.1;
    }
    let best=null,value=0;
    for(const source of ctx.growth.sources){
      if(!eligible(c,source))continue;const cell=R.findCell(c,source);if(!cell)continue;
      const b={id:'bridge-preview',type:source,row:cell[0],col:cell[1],rotation:cell[2],level:R.levelOf(c,source)},original=c.buildings;
      c.buildings=[...original,b];let gain;try{gain=R.productionRates(c);}finally{c.buildings=original;}
      const price=R.placementPrice(c,source,...cell),time=R.aiResourceKeys(c).reduce((n,r)=>Math.max(n,(price[r]||0)/Math.max(1,flow.gain[r])),0);
      const score=R.aiResourceKeys(c).reduce((n,r)=>n+shortage[r]*Math.max(0,gain[r]-flow.gain[r])/Math.max(1,flow.gain[r]),0)/(1+time/30);
      if(score>value+.01){value=score;best=source;}
    }
    return best;
  }
  R.aiForecastInvestment=(owner,first,ctx,reinvest=false)=>{
    const basePassive=R.aiPassiveValue(owner,ctx.metrics);
    const wave=Math.max(10,Math.min(30,R.reserveCount(owner))),wanted=Math.min(R.armyCapacityLimit,R.fieldUnitCount(owner)+owner.releaseQueue.reduce((n,e)=>n+R.orcArmyWeight(e,owner),0)+wave),actorRoom=R.battlePopulationRoom(owner);
    return R.aiPreview(owner,shadow=>{
    const horizon=120,steps=[],queue=[...(first?[first]:[]),...(reinvest&&first&&R.aiBuildingMechanics(first).produces?[first]:[])];
    const goals=ctx.growth.goals.slice(),consumed=goals.indexOf(first);if(consumed>=0)goals.splice(consumed,1);queue.push(...goals);
    let elapsed=0,completed=0,firstWait=0,blocked=null,unfunded=0;
    const advance=dt=>{if(dt<=0)return;const flow=operational(shadow,ctx);for(const r of R.RES){const next=shadow.resources[r]+(flow.gain[r]-flow.use[r])*dt;
      // Soul upkeep is compulsory: an insolvent intermediate city loses its
      // buildings before a later Well can rescue the paper itinerary.
      if(shadow.race==='undead'&&r==='wood')unfunded=Math.max(unfunded,-(R.undCredit?.(shadow)||0)-next);
      shadow.resources[r]=Math.min(shadow.caps[r],shadow.race==='undead'&&r==='wood'?next:Math.max(0,next));}elapsed+=dt;};
    for(let index=0;index<queue.length&&steps.length<4&&elapsed<horizon;index++){
      if(index>0){const source=bridge(shadow,queue[index],ctx);if(source)queue.splice(index,0,source);}
      const type=queue[index];
      if(!eligible(shadow,type))continue;
      let cell=R.findCell(shadow,type),land=null;
      if(!cell){
        land=R.aiBlockingPlan(shadow,type,{affordableOnly:false});
        if(!land){blocked='space';break;}
        // Forecast paid preparation one tile at a time, with real caps and
        // income after every removal. Never call clearTerrain on a preview:
        // ancient ruins would otherwise award picks during decision making.
        for(const [row,col]of land.ruins){
          const price=R.terrainClearPrice(shadow,R.terrainAt(shadow,row,col).type),flow=operational(shadow,ctx);let wait=0;
          for(const r of R.aiResourceKeys(shadow)){
            if(price[r]>shadow.caps[r]&&price[r]>shadow.resources[r]){blocked='storage';break;}
            const short=(price[r]||0)-shadow.resources[r],net=flow.gain[r]-flow.use[r];
            if(short>0&&net<=.01){blocked='income';break;}
            if(short>0)wait=Math.max(wait,short/net);
          }
          if(blocked||elapsed+wait+.8>horizon){blocked||='time';break;}
          advance(wait);for(const r of R.RES)shadow.resources[r]-=price[r]||0;
          R.setTerrain(shadow,row,col,null);R.recomputeCity(shadow,true);advance(.8);
        }
        if(blocked)break;
        cell=land.cell;
      }
      const price=R.placementPrice(shadow,type,...cell),flow=operational(shadow,ctx);let wait=0;
      for(const r of R.aiResourceKeys(shadow)){
        if(price[r]>shadow.caps[r]&&price[r]>shadow.resources[r]){blocked='storage';break;}
        const short=(price[r]||0)-shadow.resources[r],net=flow.gain[r]-flow.use[r];
        if(short>0&&net<=.01){blocked='income';break;}
        if(short>0)wait=Math.max(wait,short/net);
      }
      if(blocked||elapsed+wait>horizon){blocked||='time';break;}
      if(!steps.length)firstWait=wait;advance(wait);
      for(const r of R.RES)shadow.resources[r]-=price[r]||0;
      for(const [row,col]of R.placementFoundationCells(shadow,type,...cell))shadow.terrain[R.idx(row,col)]=null;
      const [row,col,rotation]=cell;
      shadow.buildings.push({id:'investment:'+steps.length,type,row,col,rotation,level:R.levelOf(shadow,type),progress:0});R.recomputeCity(shadow,true);
      const purpose=ctx.intent.purposes.get(type);
      if(ctx.growth.goals.includes(type)&&!R.aiBuildingMechanics(type).storage)completed+=(purpose?.role==='core'?2:1)/(1+elapsed/70);
      steps.push({type,at:elapsed,cell,price,preparation:land?.ruins.length||0});advance(Math.min(horizon-elapsed,shadow.buildings.length>=80?2.4:.8));
    }
    advance(Math.max(0,horizon-elapsed));
    shadow._forecast={steps,completed,firstWait,blocked,unfunded};
  },shadow=>{
    const m=R.aiCityMetrics(shadow),f=shadow._forecast,keys=R.aiResourceKeys(owner),budget=ctx.growth.budget;
    let income=0,stock=0,deficit=0;const coverage=[];
    for(const r of keys){
      const need=Math.max(1,ctx.target[r]),ratio=Math.max(0,Math.min(1,(m.gain[r]-m.use[r]*.35)/need));income+=ratio;coverage.push(ratio);
      stock+=Math.min(shadow.resources[r],Math.max(30,budget[r]))/Math.max(30,budget[r]);
      deficit+=Math.max(0,m.use[r]-m.gain[r])/Math.max(1,m.gain[r]);
    }
    // State quality uses the same scale for waiting, economy and military.
    // Income saturates at the actual itinerary demand, rather than valuing
    // infinite production. Training must be sustainable by the end of the plan.
    const sustainable=Math.min(1,...keys.map(r=>m.use[r]>0?m.gain[r]/m.use[r]:1));
    const power=Math.log1p(m.power*sustainable)*(ctx.battle.safeOpening?3:8);
    const passive=R.aiPassiveValue(shadow,m)-basePassive;
    const capacity=(actorRoom>0?12:0)*(Math.min(m.armyCap,wanted)-Math.min(ctx.metrics.armyCap,wanted))/wave;
    const land=Math.max(0,m.slots-ctx.metrics.slots)*(.15+.35*Math.pow(ctx.metrics.slots/(R.GRID*R.GRID),2));
    const capital=f.steps.reduce((n,s)=>n+keys.reduce((total,r)=>total+(s.price[r]||0)/Math.max(1,ctx.metrics.gain[r],ctx.target[r]),0),0)*.02;
    return {...f,score:Math.min(...coverage)*(ctx.battle.safeOpening?75:45)+income*6/Math.max(1,keys.length)+stock*4/Math.max(1,keys.length)+f.completed*(ctx.battle.safeOpening?3:8)+power+passive+capacity-land-capital-deficit*18-f.firstWait*.025-Math.min(120,f.unfunded*2),
      gain:m.gain,use:m.use,power:m.power};
  });};
  R.aiPlanInvestment=(c,ctx)=>{
    const stamp=JSON.stringify([Math.floor(R.state.time/6),c.buildings.map(b=>[b.id,b.type,b.level,b.inactive]),c.terrain,c.normal,[...c.legends],c.l4Branches,ctx.intent.main?.key,ctx.strategy?.primary?.key,ctx.pressure]);
    const old=cache.get(c);if(old?.capital===c.buildings[0]&&old.stamp===stamp)return old.value;
    const supports=R.aiFactionBuildings(c).filter(t=>{const m=R.aiBuildingMechanics(t);return !R.BUILDINGS[t]?.unit&&!m.produces&&!m.capacity&&!m.storage&&eligible(c,t)&&R.findCell(c,t);});
    const extra=supports.length?[supports[Math.floor(R.state.time/6)%supports.length]]:[];
    const types=[...new Set([...ctx.producers,...ctx.growth.goals,...ctx.military.filter(t=>ctx.intent.purposes.get(t)?.needed),...extra])].filter(t=>eligible(c,t)&&!(R.aiRedevelopmentTypePenalty(c,t,ctx)>0)&&(R.findCell(c,t)||R.aiBlockingPlan(c,t,{affordableOnly:false})));
    const waiting=R.aiForecastInvestment(c,null,{...ctx,growth:{...ctx.growth,goals:[]}});let best={type:null,score:waiting.score,steps:[],forecasts:1};
    let forecasts=1;
    for(const type of types.slice(0,8)){
      const projected=R.aiForecastInvestment(c,type,ctx,R.aiBuildingMechanics(type).produces&&ctx.growth.expanding);forecasts++;
      if(projected.steps[0]?.type===type&&projected.score>waiting.score+.5&&projected.score>best.score+.001)best={...projected,type};
    }
    best.forecasts=forecasts;best.goals=ctx.growth.goals;
    cache.set(c,{capital:c.buildings[0],stamp,value:best});return best;
  };
}
