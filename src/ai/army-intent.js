import { cardTargets, UNIT_FEATURES } from './mechanics.js';
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
  R.aiArmyIntent=(c,{metrics,battle,strategy})=>{
    const types=R.aiFactionBuildings(c).filter(t=>c.unlocked.has(t)&&R.BUILDINGS[t]?.unit);
    const foe=battle.foes||[],features=u=>UNIT_FEATURES[u.key]||[],ranged=foe.filter(e=>features(e.u).includes('ranged')).length/Math.max(1,foe.length);
    const heavy=foe.filter(e=>['cavalry','siege'].includes(R.UNITS[e.u.key]?.cat)).length/Math.max(1,foe.length);
    const p=strategy?.primary,capital=c.buildings.find(b=>b.type==='keep');
    const options=types.map(type=>{
      const placed=R.buildingOf(c,type).find(b=>!b.inactive),cell=placed?null:R.findCell(c,type);
      const b=placed?{...placed}:{type,id:'intent-preview',level:R.levelOf(c,type),row:cell?.[0]||0,col:cell?.[1]||0,rotation:cell?.[2]||0},key=R.effectiveUnitKey(c,b);
      const tags=[...new Set([...(UNIT_FEATURES[key]||[]),...(R.UNITS[key]?.tags||[])])],quality=R.aiUnitQuality(c,key),time=R.trainingTime(c,b),price=R.primarySpawnCost(c,key,b);
      const cost=R.aiResourceKeys(c).reduce((n,r)=>n+(price[r]||0),0),area=R.cityBuildingCells(c,b).length;
      const throughput=quality*R.productionBatchSize(c,b)/Math.max(1,time);
      const technology=R.factionBasics(c.race).includes(type)?0:5;
      let value=8*Math.log1p(throughput/(1+cost/30+area*.12))+R.aiIntentUnitInvestment(c,key)+Math.max(0,b.level-1)*2+technology;
      if(p?.units.includes(key)&&p.units.length<=2)value+=12*p.confidence;
      if(tags.includes('charge'))value+=ranged*10;
      if(tags.includes('counter'))value+=heavy*12;
      if(tags.includes('heal')||tags.includes('curse'))value-=12;
      if(tags.includes('siege')&&!tags.includes('melee')&&R.state.time<180)value-=8;
      return {type,key,value,quality,throughput,tags};
    }).sort((a,b)=>b.value-a.value||a.type.localeCompare(b.type));
    let main=options[0];const previous=memory.get(c);
    if(previous?.capital===capital&&R.state.time>=previous.at){
      const retained=options.find(o=>o.key===previous.key);
      if(retained&&main&&main.value<retained.value*1.12+1.5)main=retained;
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
    const purposes=new Map();
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
      }
      const count=metrics.units[o.key]?.count||0;
      // Completing one absent role is useful; five different units filling the
      // same role are not five independent benefits.
      const satisfied=role==='frontline'&&has('melee')&&!count||role==='healing'&&has('heal')&&!count||role==='curse'&&has('curse')&&!count;
      const desired=role==='core'?Infinity:Math.max(1,Math.floor((total+1)*share));
      const weightedRate=(metrics.units[main?.key]?.rate||0)*R.orcArmyWeight({key:main?.key},c);
      const coreNeeded=weightedRate<c.armyCap/(battle.urgent?60:120)&&(!R.isUniqueBuilding(c,o.type)||!R.hasBuilding(c,o.type));
      purposes.set(o.type,{...o,role:!satisfied?role:null,share,desired,needed:!!role&&!satisfied&&(role==='core'?coreNeeded:role==='reinforcement'?rate<neededRate:count<desired)});
    }
    return {main:main||null,purposes,total,confidence:clamp((main?.value||0)/20,.2,1)};
  };
  R.aiMilitaryPurpose=(type,ctx)=>ctx.intent?.purposes.get(type)||null;
}
