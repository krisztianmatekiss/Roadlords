import { PICK_RULES, rareSubtypeForCounts } from '../progression/pick-rules.js';

const key = o => `${o.kind}:${o.id}:${o.branch||''}:${o.level||''}`;
export function installAiStrategyProjection(R) {
  // Probability of seeing the desired card in upcoming offers. No RNG calls,
  // hidden future cards or certainty about a particular L4/legendary draw.
  R.aiStrategyOffer = (c,o,elapsed=0) => {
    const legendary=o.kind==='legendary',unlock=o.kind==='building';
    const pool=legendary?R.eligibleLegendary(c):unlock?R.buildingUnlockPool(c):R.buildingUpgradePool(c);
    if(!pool.some(x=>x.id===o.id&&(!o.branch||x.branch===o.branch)))return {chance:0,wait:Infinity};
    const interval=R.PICK_BASE_SECONDS*Math.pow(R.PICK_GROWTH,c._aiTimedPicks??R.state.timedPickCount??0)/(R.hasBranch(c,'keep','empire')?2:1);
    const first=Math.max(1,(c._aiPickDue!=null?c._aiPickDue-R.state.time:R.state.nextPick)||interval);
    if(first>180)return {chance:0,wait:Infinity};
    const offers=Math.max(1,Math.min(5,1+Math.floor((180-first)/Math.max(1,interval))));
    const draw=Math.min(1,R.choiceCount(c)/Math.max(1,pool.length));
    let subtype=1;
    if(!legendary){
      const unlocked=R.buildingUnlockPool(c).length,upgraded=R.buildingUpgradePool(c).length,wanted=unlock?'unlock':'upgrade',count=R.choiceCount(c);
      subtype=(rareSubtypeForCounts(unlocked,upgraded,count,'unlock')===wanted?PICK_RULES.unlockPreference:0)+
        (rareSubtypeForCounts(unlocked,upgraded,count,'upgrade')===wanted?1-PICK_RULES.unlockPreference:0);
    }
    let distribution=new Map([[c.legendaryDrought||0,1]]);
    for(let n=0;n<offers;n++){
      const next=new Map(),add=(d,p)=>next.set(d,(next.get(d)||0)+p);
      for(const [drought,mass]of distribution){
        const legendRate=drought>=PICK_RULES.guaranteedOffer-1?1:R.hasLeg(c,'wide_choice')?PICK_RULES.wideLegendaryChance:PICK_RULES.legendaryChance;
        const buildingRate=(R.state.time+elapsed+n*interval<PICK_RULES.earlyUntil?PICK_RULES.earlyBuildingChance:PICK_RULES.buildingChance)*subtype;
        add(0,mass*legendRate*(legendary?1-draw:1));
        const desired=legendary?0:Math.min(1-legendRate,buildingRate)*draw;
        add(Math.min(PICK_RULES.guaranteedOffer-1,drought+1),mass*(1-legendRate-desired));
      }
      distribution=next;
    }
    return {chance:1-[...distribution.values()].reduce((n,x)=>n+x,0),wait:Math.min(180,first+Math.max(0,offers-1)*interval*.5)};
  };
  R.aiStrategyProject = (owner,plan,{budget,maxSteps=4,complementFirst=false}) => {
    let city=owner,metrics=R.aiPreview(owner,()=>{}),elapsed=0,confidence=1;
    const initial=metrics,actions=[],seen=new Set();let expectedGain=0;
    for(let depth=0;depth<maxSteps&&budget.remaining>0;depth++){
      const options=R.aiStrategySteps(city,plan,complementFirst,metrics),o=options.find(x=>!seen.has(key(x)));
      if(!o)break;seen.add(key(o));budget.remaining--;budget.used++;
      let transition;
      const result=R.aiPreview(city,shadow=>{
        if(o.kind==='construct'){
          const cell=R.findCell(shadow,o.id);if(!cell){transition={blocked:'space'};return;}
          const price=R.placementPrice(shadow,o.id,...cell),flow=R.resourceFlowRates(shadow);
          let wait=0;
          for(const r of R.aiResourceKeys(shadow)){
            if(price[r]>shadow.caps[r]){transition={blocked:'storage'};return;}
            const short=(price[r]||0)-shadow.resources[r],net=flow.gain[r]-flow.use[r];
            if(short>0&&net<=.01){transition={blocked:'income'};return;}
            if(short>0)wait=Math.max(wait,short/net);
          }
          if(wait>120){transition={blocked:'income'};return;}
          for(const r of R.RES)shadow.resources[r]=Math.min(shadow.caps[r],Math.max(0,shadow.resources[r]+(flow.gain[r]-flow.use[r])*wait))-(price[r]||0);
          shadow.buildings.push({id:'strategy:'+depth+':'+o.id,type:o.id,row:cell[0],col:cell[1],rotation:cell[2],level:R.levelOf(shadow,o.id),progress:0});
          transition={wait,chance:1,cell};
        }else{
          const offer=R.aiStrategyOffer(shadow,o,elapsed);
          if(!offer.chance){transition={blocked:'unavailable'};return;}
          const flow=R.resourceFlowRates(shadow);
          for(const r of R.RES)shadow.resources[r]=Math.min(shadow.caps[r],Math.max(0,shadow.resources[r]+(flow.gain[r]-flow.use[r])*offer.wait));
          // Speculative choices only change this isolated projected city.
          R.aiProjectChoice(shadow,o);transition=offer;
        }
      },shadow=>({city:shadow,metrics:R.aiCityMetrics(shadow)}),owner);
      if(transition.blocked){actions.push({...o,...transition});break;}
      const previousValue=R.aiMetricDelta(initial,metrics,owner);
      city=result.city;metrics=result.metrics;elapsed+=transition.wait;confidence*=transition.chance;
      expectedGain+=(R.aiMetricDelta(initial,metrics,owner)-previousValue)*confidence/(1+elapsed/150);
      actions.push({...o,wait:transition.wait,chance:transition.chance,cell:transition.cell});
    }
    const gain=R.aiMetricDelta(initial,metrics,owner);
    const deficit=R.aiResourceKeys(owner).reduce((n,r)=>n+Math.max(0,metrics.use[r]-metrics.gain[r])/Math.max(1,metrics.gain[r]),0);
    return {actions,elapsed,confidence,gain,score:expectedGain-Math.min(15,deficit*8),blocked:actions.at(-1)?.blocked||null};
  };
}
