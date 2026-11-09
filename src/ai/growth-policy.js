import { BUILDING_MECHANICS } from './mechanics.js';

export function installAiGrowthPolicy(R) {
  const recruitment=new WeakMap();
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
  R.aiGrowthTargets=(c,metrics,battle,military,intent=null,strategy=null)=>
    R.aiInvestmentDemand(c,metrics,battle,intent||R.aiArmyIntent(c,{metrics,battle,strategy}),strategy);
  const spawn=R.normalSpawn;
  R.normalSpawn=(c,b)=>{
    if(R.aiControlsCity(c)){
      R.aiProtectPortal(c);
      const plan=c._aiGrowthPlan;
      if(plan&&R.state.time-plan.time<5&&!R.aiUnderAttack(c)){
        const reserve=c._aiSaveReason==='economy'&&c._aiSavePrice?c._aiSavePrice:plan.growing?plan.reserve:null;
        if(reserve){
          const cost=R.primarySpawnCost(c,R.effectiveUnitKey(c,b),b);
          const keys=R.aiResourceKeys(c),capital=c.buildings.find(x=>x.type==='keep');
          let budget=recruitment.get(c);
          if(!budget||budget.capital!==capital||budget.at>R.state.time){budget={capital,at:R.state.time,credit:R.C()};recruitment.set(c,budget);}
          const flow=R.resourceFlowRates(c),elapsed=Math.min(5,Math.max(0,R.state.time-budget.at));budget.at=R.state.time;
          // Construction savings must not silence an already funded army
          // indefinitely. Reserve 80% of operating surplus for construction;
          // periodic recruitment can spend the remaining 20%, at real prices.
          for(const r of keys){const operating=Math.max(0,flow.use[r]-(flow.sources.production?.[r]||0));
            budget.credit[r]=Math.min(Math.max(1,cost[r]||0)*2,budget.credit[r]+Math.max(0,flow.gain[r]-operating)*elapsed*.2);}
          const held=keys.some(r=>(cost[r]||0)>0&&c.resources[r]-(cost[r]||0)<Math.min(c.caps[r],reserve[r]||0));
          if(held){
            if(keys.some(r=>(cost[r]||0)>budget.credit[r]+1e-9||c.resources[r]-(cost[r]||0)<Math.max(0,flow.use[r]-(flow.sources.production?.[r]||0))*4))return false;
            const ok=spawn(c,b);if(ok)for(const r of keys)budget.credit[r]-=cost[r]||0;return ok;
          }
          budget.credit=R.C();
        }
      }
    }
    return spawn(c,b);
  };
}
