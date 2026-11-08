import { BUILDING_MECHANICS } from './mechanics.js';

export function installAiGrowthPolicy(R) {
  // A distant unlocked luxury is not a reason to spend the opening on stores.
  R.aiStoragePressure=(c,metrics)=>{
    const goal=c._aiSaveType&&!BUILDING_MECHANICS[c._aiSaveType]?.storage?(c._aiSaveCapacityPrice||c._aiSavePrice):null;
    return R.aiResourceKeys(c).some(r=>{
      const cap=c.caps[r];if(!Number.isFinite(cap)||cap>=1e10)return false;
      const needed=Math.max(goal?.[r]||0,c._aiAncientPrice?.[r]||0);
      if(needed>cap&&c.resources[r]<needed)return true;
      const net=metrics.gain[r]-metrics.use[r],stock=c.resources[r];
      if(stock>cap+Math.max(1,net*10))return false;
      const usefulBuffer=metrics.use[r]*8+(metrics.constructionReserve?.[r]||0);
      return cap<usefulBuffer&&net>.1&&stock>=cap*.82&&stock+net*10>=cap&&(r==='wood'||metrics.use[r]>.1);
    });
  };
  R.aiGrowthTargets=(c,metrics,battle,military)=>{
    const resources=R.aiResourceKeys(c),target=R.C(),budget=R.C(),future=R.C();
    const sources=R.aiFactionBuildings(c).filter(type=>c.unlocked.has(type)&&BUILDING_MECHANICS[type]?.produces);
    const next=military.slice().sort((a,b)=>{
      const price=type=>R.RES.reduce((n,r)=>n+(R.buildPrice(c,type)[r]||0),0);
      return price(a)-price(b);
    })[0];
    const b=next?{type:next,id:'growth-budget',level:R.levelOf(c,next),row:0,col:0,rotation:0}:null;
    const cost=b?R.primarySpawnCost(c,R.effectiveUnitKey(c,b),b):R.C(),seconds=b?R.trainingTime(c,b):Infinity;
    const room=metrics.slots<R.GRID*R.GRID*.8?1:metrics.slots<R.GRID*R.GRID*.95?.45:0;
    // Healthy road defenses buy time to reinvest. A full starting stockpile
    // must not masquerade as sustainable construction income after one mill.
    const expanding=battle.safeOpening&&metrics.slots<R.GRID*R.GRID*.6;
    for(const r of resources){
      const prices=sources.filter(type=>BUILDING_MECHANICS[type].produces.includes(r)).map(type=>R.buildPrice(c,type)[r]||0);
      budget[r]=prices.length?Math.min(...prices):0;
      future[r]=Number.isFinite(seconds)?(cost[r]||0)/Math.max(1,seconds):0;
      const stock=c.resources[r],full=Number.isFinite(c.caps[r])&&c.caps[r]<1e10&&stock>=c.caps[r]*.75;
      const established=sources.some(type=>BUILDING_MECHANICS[type].produces.includes(r)&&R.hasBuilding(c,type));
      const surplus=expanding? .85:battle.safeOpening&&!established?1:full||stock>Math.max(100,budget[r]*4)? .2:stock>Math.max(100,budget[r]*2)?.55:1;
      const construction=r==='food'?.45:Math.max(r==='wood'?2:1,budget[r]/(expanding?12:battle.safeOpening?22:28),b?(R.buildPrice(c,next)[r]||0)/(expanding?18:55):0);
      target[r]=metrics.use[r]*1.18+(construction*surplus+future[r]*.8)*room;
    }
    return {target,budget,expanding,growing:room>0&&resources.some(r=>metrics.gain[r]+.01<target[r])};
  };
  const spawn=R.normalSpawn;
  R.normalSpawn=(c,b)=>{
    if(R.aiControlsCity(c)){
      R.aiProtectPortal(c);
      const plan=c._aiGrowthPlan;
      if(plan&&R.state.time-plan.time<5&&!R.aiUnderAttack(c)){
        const reserve=c._aiSaveReason==='economy'&&c._aiSavePrice?c._aiSavePrice:plan.growing?plan.reserve:null;
        if(reserve){
          const cost=R.primarySpawnCost(c,R.effectiveUnitKey(c,b),b);
          if(R.aiResourceKeys(c).some(r=>(cost[r]||0)>0&&c.resources[r]-(cost[r]||0)<Math.min(c.caps[r],reserve[r]||0)))return false;
        }
      }
    }
    return spawn(c,b);
  };
}
