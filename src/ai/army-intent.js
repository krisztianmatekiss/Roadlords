import { cardTargets, UNIT_FEATURES } from './mechanics.js';
import { rankAiAlternatives } from './variety.js';
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));

// A production line needs a job. Having unlocked it is not itself a job.
export function installAiArmyIntent(R){
  const memory=new WeakMap();
  R.aiIntentUnitInvestment=(c,key)=>{
    let value=0;
    for(const [id,n]of Object.entries(c.normal))if(cardTargets(R,{kind:'normal',id}).includes(key))value+=Math.sqrt(n)*1.8;
    for(const id of c.legends)if(cardTargets(R,{kind:'legendary',id}).includes(key))value+=8;
    return value;
  };
  R.aiRecruitmentOptions=(c,metrics,battle,onlyType=null)=>{
    const types=R.aiFactionBuildings(c).filter(t=>(!onlyType||t===onlyType)&&c.unlocked.has(t)&&R.BUILDINGS[t]?.unit);
    const combat=R.aiCombatContext(c),matchup=combat.matchup,resources=R.aiResourceKeys(c);
    const income=resources.reduce((n,r)=>n+Math.max(1,metrics.gain[r]),0)/Math.max(1,resources.length);
    return types.map(type=>{
      const placed=R.buildingOf(c,type).find(b=>!b.inactive),cell=placed?null:R.findCell(c,type);
      const b=placed?{...placed}:{type,id:'intent-preview',level:R.levelOf(c,type),row:cell?.[0]||0,col:cell?.[1]||0,rotation:cell?.[2]||0},key=R.effectiveUnitKey(c,b);
      const tags=[...new Set([...(UNIT_FEATURES[key]||[]),...(R.UNITS[key]?.tags||[])])],quality=R.aiUnitQuality(c,key,b,combat),time=R.trainingTime(c,b),price=R.primarySpawnCost(c,key,b);
      const scarcity=r=>clamp(income/Math.max(1,metrics.gain[r]),.5,2);
      const cost=resources.reduce((n,r)=>n+(price[r]||0)*scarcity(r),0),area=R.cityBuildingCells(c,b).length;
      const facility=R.buildPrice(c,type),capital=resources.reduce((n,r)=>n+(facility[r]||0)*scarcity(r),0)*Math.min(1,time/180);
      const throughput=quality*R.productionBatchSize(c,b)/Math.max(1,time);
      let value=8*Math.log1p(throughput/(1+(cost+capital*.5)/30+area*.18))+R.aiIntentUnitInvestment(c,key);
      // A producer deliberately drafted is a real investment. Preserve it
      // after construction too; removing it then makes the AI immediately
      // abandon its freshly built line for the starting unit. Merely
      // belonging to the non-starting roster grants no special preference.
      if(c._aiDraftProducers?.[type]||c._aiSharedPreferred===type)value+=3;
      if(tags.includes('heal')||tags.includes('curse'))value-=4;
      if(tags.includes('siege')&&!tags.includes('melee')&&R.state.time<180)value-=8;
      return {type,key,value,quality,throughput,tags,matchup};
    }).sort((a,b)=>b.value-a.value||a.type.localeCompare(b.type));
  };
  R.aiArmyIntent=(c,{metrics,battle,strategy})=>{
    const p=strategy?.primary,capital=c.buildings.find(b=>b.type==='keep');
    const options=R.aiRecruitmentOptions(c,metrics,battle).map(o=>({...o,value:o.value+(p?.units.includes(o.key)&&p.units.length<=2?3*p.confidence:0)})).sort((a,b)=>b.value-a.value);
    const {ranged=0,heavy=0}=options[0]?.matchup||{};
    const margin=Math.max(.35,Math.min(1,(options[0]?.value||0)*.08));
    let main=rankAiAlternatives(c,options.map(o=>({...o,score:o.value})),o=>o.key,margin)[0];const previous=memory.get(c);
    const selected=options.find(o=>o.type===c._aiSharedPreferred&&!R.hasBuilding(c,o.type));
    if(selected&&main&&selected.value>=main.value-.5&&R.aiIntentUnitInvestment(c,main.key)<2)main=selected;
    if(previous?.capital===capital&&R.state.time>=previous.at){
      const retained=options.find(o=>o.key===previous.key);
      if(retained&&main&&main!==selected&&main.value<retained.value+Math.max(.6,retained.value*.08))main=retained;
    }
    if(main)memory.set(c,{capital,key:main.key,at:R.state.time});
    const total=Object.values(metrics.units).reduce((n,u)=>n+u.count,0);
    const has=tag=>Object.keys(metrics.units).some(key=>(UNIT_FEATURES[key]||[]).includes(tag));
    const rate=Object.entries(metrics.units).reduce((n,[key,u])=>n+u.rate*R.orcArmyWeight({key},c),0),neededRate=c.armyCap/(battle.urgent?60:120);
    // An irreplaceable elite producer can define the build without being able
    // to supply its whole army. Choose one scalable companion for the missing
    // throughput, rather than unlocking every type or buying endless supports.
    const companion=main&&R.isUniqueBuilding(c,main.type)&&R.hasBuilding(c,main.type)&&rate<neededRate
      ? options.find(o=>o.key!==main.key&&!R.isUniqueBuilding(c,o.type)&&!o.tags.includes('heal')&&!o.tags.includes('curse')&&!(o.tags.includes('siege')&&!o.tags.includes('melee')&&R.state.time<180)):null;
    const purposes=new Map(),roleWinners=new Map();
    for(const o of options){
      let role=null,share=0;
      if(o.key===main?.key){role='core';share=1;}
      else if(o===companion){role='reinforcement';share=1;}
      else if(total>0){
        if(o.tags.includes('counter')&&heavy>=.2){role='counter';share=.3;}
        else if(o.tags.includes('charge')&&ranged>=.35){role='counter';share=.3;}
        else if(o.tags.includes('melee')&&!main.tags.includes('melee')&&!main.tags.includes('summon')){role='frontline';share=.25;}
        else if(o.tags.includes('heal')&&!main.tags.includes('heal')){role='healing';share=.15;}
        else if(o.tags.includes('curse')&&!main.tags.includes('curse')){role='curse';share=.15;}
        else if(o.tags.includes('ranged')&&!o.tags.includes('siege')&&!main.tags.includes('ranged')&&o.throughput>=main.throughput*.15){role='fire_support';share=.25;}
        else if(o.tags.includes('siege')&&!o.tags.includes('melee')&&R.state.time>=180&&total>=3&&battle.front?.hp>0){role='siege';share=.15;}
      }
      const count=metrics.units[o.key]?.count||0;
      // Completing one absent role is useful; five different units filling the
      // same role are not five independent benefits.
      const roleTag={frontline:'melee',healing:'heal',curse:'curse',fire_support:'ranged',siege:'siege'}[role];
      const existing=roleTag&&has(roleTag),winner=roleWinners.get(role);
      const satisfied=roleTag&&(existing&&!count||!existing&&winner&&winner!==o.key);
      if(roleTag&&!satisfied&&!winner)roleWinners.set(role,o.key);
      const desired=role==='core'?Infinity:Math.max(1,Math.floor((total+1)*share));
      const weightedRate=(metrics.units[main?.key]?.rate||0)*R.orcArmyWeight({key:main?.key},c);
      const coreNeeded=weightedRate<c.armyCap/(battle.urgent?60:120)&&(!R.isUniqueBuilding(c,o.type)||!R.hasBuilding(c,o.type));
      purposes.set(o.type,{...o,role:!satisfied?role:null,share,desired,needed:!!role&&!satisfied&&(role==='core'?coreNeeded:role==='reinforcement'?rate<neededRate:count<desired)});
    }
    return {main:main||null,purposes,total,confidence:clamp((main?.value||0)/20,.2,1)};
  };
  R.aiMilitaryPurpose=(type,ctx)=>ctx.intent?.purposes.get(type)||null;
}
