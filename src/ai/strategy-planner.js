import { installAiStrategyModel } from './strategy-model.js';
import { installAiStrategyProjection } from './strategy-projection.js';
import { cardTargets, UNIT_FEATURES } from './mechanics.js';

const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const sum=values=>values.reduce((n,x)=>n+x,0);
const same=(a,b)=>a.kind===b.kind&&a.id===b.id&&a.branch===b.branch;

export function installAiStrategyPlanner(R) {
  installAiStrategyModel(R);installAiStrategyProjection(R);
  const memory=new WeakMap();
  const stateFor=c=>{
    const state=memory.get(c);
    return state?.capital===c.buildings.find(b=>b.type==='keep')?state:null;
  };
  const producer=(c,key)=>R.aiFactionBuildings(c).find(type=>R.BUILDINGS[type]?.unit===key||key==='und_skeleton_archer'&&type==='und_graveyard');
  const owned=(c,o)=>o.kind==='legendary'?R.hasLeg(c,o.id):R.levelOf(c,o.id)>=4&&(!o.branch||c.l4Branches[o.id]===o.branch);
  const signature=c=>JSON.stringify([c.race,c.normal,[...c.legends],c.legendaryStacks,c.levels,c.l4Branches]);
  const progress=(c,p)=>JSON.stringify([
    owned(c,p.anchor),c.buildings.filter(b=>b.type===p.producer||b.type===p.anchor.id||p.complements?.includes(b.type)).map(b=>[b.id,b.level]),
    Object.entries(c.normal).filter(([id])=>cardTargets(R,{kind:'normal',id}).some(k=>p.units.includes(k))),
  ]);

  function candidates(c,metrics){
    const normals=Object.entries(c.normal).map(([id,n])=>({n,description:R.aiStrategyDescriptor(c,{kind:'normal',id})}));
    const legends=[...c.legends].map(id=>R.aiStrategyDescriptor(c,{kind:'legendary',id}));
    const out=[];
    for(const endpoint of R.aiStrategyAnchors(c)){
      const units=endpoint.units.filter(key=>R.factionUnitMatches(c.race,R.UNITS[key]));
      const mechanism=R.aiBuildingMechanics(endpoint.anchor.id);
      if(!units.length&&(mechanism.local||mechanism.localSupport))units.push(...Object.keys(metrics.units));
      if(!units.length)for(const [key,u]of Object.entries(R.UNITS))if(R.factionUnitMatches(c.race,u)&&
        (UNIT_FEATURES[key]||[]).some(f=>endpoint.features.includes(f)))units.push(key);
      const plan={...endpoint,units,features:[...new Set([...endpoint.features,...units.flatMap(k=>UNIT_FEATURES[k]||[])])]};
      const related=d=>R.aiStrategyRelated(plan,d);
      const investment=sum(normals.map(({n,description})=>{const r=related(description);return Math.sqrt(n)*(r.direct?1.2:r.shared?Math.min(.5,r.shared*.2):0);}));
      const links=sum(legends.map(d=>{const r=related(d);return r.direct?3:r.shared?Math.min(2,r.shared):0;}));
      const production=sum(units.map(k=>metrics.units[k]?.count||0));
      const featureHosts=sum(c.buildings.map(b=>R.aiStrategyRelated(plan,R.aiStrategyDescriptor(c,{kind:'building',id:b.type})).shared>0?1:0));
      const progress=endpoint.anchor.kind==='building_branch'&&R.hasBuilding(c,endpoint.anchor.id)?R.levelOf(c,endpoint.anchor.id):0;
      const isOwned=owned(c,endpoint.anchor);
      plan.evidence=clamp(investment+links+Math.min(6,production*2)+Math.min(3,featureHosts*.5)+progress+(isOwned?7:0),0,35);
      plan.commitment=investment+links+(isOwned?7:0)+(progress>=3?3:0);
      plan.owned=isOwned;
      plan.producer=units.map(k=>producer(c,k)).find(type=>type&&R.hasBuilding(c,type))||units.map(k=>producer(c,k)).find(Boolean)||null;
      if(plan.producer&&c.unlocked.has(plan.producer)&&!R.factionBasics(c.race).includes(plan.producer)){plan.evidence+=2;plan.commitment+=2;}
      // Unavailable cards can be a future possibility, never a reason to
      // abandon an already functioning economy for a guaranteed imaginary draw.
      plan.initial=plan.evidence+(isOwned?4:0)-(plan.producer&&!c.unlocked.has(plan.producer)?3:0);
      out.push(plan);
    }
    return out.sort((a,b)=>b.initial-a.initial||a.key.localeCompare(b.key));
  }
  function complements(c,plan){
    return R.aiFactionBuildings(c).filter(type=>{
      const m=R.aiBuildingMechanics(type);
      if(type==='keep'||type===plan.producer||type===plan.anchor.id||m.produces||m.capacity||m.storage||R.hasBuilding(c,type)||!R.canBuildArmyCapacity(c,type))return false;
      const d=R.aiStrategyDescriptor(c,{kind:'building',id:type}),r=R.aiStrategyRelated(plan,d);
      if(R.BUILDINGS[type]?.unit&&!plan.units.includes(R.BUILDINGS[type].unit))return false;
      if(d.needsUnits?.length&&!d.needsUnits.some(key=>plan.units.includes(key)||R.activeSpawners(c).some(b=>R.effectiveUnitKey(c,b)===key)))return false;
      return r.direct||r.shared>0||m.local&&plan.producer&&!m.exclude?.includes(plan.producer);
    }).map(type=>{
      const d=R.aiStrategyDescriptor(c,{kind:'building',id:type}),r=R.aiStrategyRelated(plan,d);
      return {type,rank:(c.unlocked.has(type)?4:0)+(r.direct?3:0)+r.shared*2+(R.aiBuildingMechanics(type).local?1:0)};
    }).sort((a,b)=>b.rank-a.rank||a.type.localeCompare(b.type)).slice(0,2).map(x=>x.type);
  }
  R.aiStrategySteps=(c,plan,complementFirst=false,flow=null)=>{
    const out=[];
    const building=type=>{
      if(!type||R.hasBuilding(c,type))return;
      if(c.unlocked.has(type)){
        const price=R.buildPrice(c,type),resources=R.aiResourceKeys(c);
        flow||=R.aiPreview(c,()=>{},shadow=>R.resourceFlowRates(shadow));
        if(resources.some(r=>price[r]>c.caps[r])){
          const store=R.aiFactionBuildings(c).find(t=>t!==type&&R.aiBuildingMechanics(t).storage&&c.unlocked.has(t));
          if(store)out.push({kind:'construct',id:store,repair:'storage'});
        }
        const short=resources.find(r=>price[r]>c.resources[r]&&(flow.gain[r]<=flow.use[r]||(price[r]-c.resources[r])/Math.max(.01,flow.gain[r]-flow.use[r])>120));
        if(short){
          const source=R.aiFactionBuildings(c).find(t=>t!==type&&c.unlocked.has(t)&&R.aiBuildingMechanics(t).produces?.includes(short));
          if(source)out.push({kind:'construct',id:source,repair:'income'});
        }
      }
      out.push({kind:c.unlocked.has(type)?'construct':'building',id:type});
    };
    building(plan.producer);
    for(const type of R.aiStrategyDescriptor(c,plan.anchor).needs)building(type);
    const extra=plan.complements||complements(c,plan);
    if(complementFirst&&extra[0])building(extra[0]);
    const a=plan.anchor;
    if(a.kind==='building_branch'){
      building(a.id);
      if(R.hasBuilding(c,a.id)&&R.levelOf(c,a.id)<4){
        const option=R.buildingUpgradePool(c).find(o=>o.id===a.id&&(R.levelOf(c,a.id)<3||!a.branch||o.branch===a.branch));
        if(option)out.push({...option,level:R.upgradeTargetLevel(c,a.id)});
      }
    }else if(!owned(c,a)){
      const gate=R.upgradeCatalog?.requirements.path(c,a);
      if(gate&&!R.upgradeCatalog.requirements.allowed(c,a)){
        building(gate.type);
        if(R.hasBuilding(c,gate.type)&&R.levelOf(c,gate.type)<gate.level){
          const options=R.buildingUpgradePool(c).filter(o=>o.id===gate.type);
          const relevance=o=>{const r=R.aiStrategyRelated(plan,R.aiStrategyDescriptor(c,o));return (r.direct?3:0)+r.shared;};
          options.sort((a,b)=>relevance(b)-relevance(a)||String(a.branch||'').localeCompare(String(b.branch||'')));
          if(options[0])out.push({...options[0],level:R.upgradeTargetLevel(c,gate.type)});
        }
      }else out.push({...a});
    }
    for(const type of extra)building(type);
    return out;
  };

  R.aiStrategyFor=c=>stateFor(c)?.value||null;
  R.aiStrategy=(c,ctx)=>{
    if(!R.aiControlsCity(c))return null;
    const now=R.state.time,stamp=signature(c),capital=c.buildings.find(b=>b.type==='keep'),previous=memory.get(c);
    if(previous&&previous.capital===capital&&previous.stamp===stamp&&now>=previous.time&&now<previous.next){
      previous.value.pressure=ctx.pressure;
      const p=previous.value.primary;if(p)p.goals=R.aiStrategySteps(c,p,false,ctx.metrics).filter(o=>o.kind==='construct').map(o=>o.id);
      return previous.value;
    }
    const ranked=candidates(c,ctx.metrics),short=[],themes=new Set();
    for(const p of ranked){
      const theme=p.units.slice().sort().join(',')||p.features.slice().sort().join(',');
      if(themes.has(theme))continue;themes.add(theme);short.push(p);if(short.length===3)break;
    }
    const old=previous?.capital===capital?previous.value.primary:null;
    if(old&&!short.some(p=>p.key===old.key)){
      const current=ranked.find(p=>p.key===old.key);if(current&&current.evidence>0)short[short.length-1]=current;
    }
    const limit=c.buildings.length>=40?8:16;
    const depth=Math.min(4,Math.max(1,Math.floor(limit/Math.max(1,short.length))));
    const budget={remaining:limit,used:0},plans=[];
    for(const p of short){
      p.complements=complements(c,p);
      const projection=R.aiStrategyProject(c,p,{budget,maxSteps:depth});
      plans.push({...p,projection,score:p.evidence+(p.owned?6:0)+clamp(projection.score,-12,18)});
    }
    plans.sort((a,b)=>b.score-a.score);
    if(plans[0]&&budget.remaining>=4){
      const alternate=R.aiStrategyProject(c,plans[0],{budget,maxSteps:4,complementFirst:true});
      if(alternate.score>plans[0].projection.score+1){plans[0].score+=clamp(alternate.score,-12,18)-clamp(plans[0].projection.score,-12,18);plans[0].projection=alternate;}
    }
    plans.sort((a,b)=>b.score-a.score);
    let primary=plans[0]||null;
    const retained=old&&plans.find(p=>p.key===old.key);
    const oldProgress=old&&progress(c,old);
    const stalled=previous&&oldProgress===previous.progressStamp&&now-previous.progressAt>=90;
    if(retained&&!stalled&&primary.key!==retained.key&&primary.score<retained.score*1.15+2)primary=retained;
    if(primary){
      primary.confidence=clamp(primary.evidence/16,.1,1)*Math.min(1,.2+primary.commitment/6)*
        (primary.projection.blocked==='income'||primary.projection.blocked==='storage'?.55:1);
      primary.goals=R.aiStrategySteps(c,primary,false,ctx.metrics).filter(o=>o.kind==='construct').map(o=>o.id);
    }
    const value={primary,alternatives:plans.filter(p=>p!==primary),projections:budget.used,at:now,reservation:null,pressure:ctx.pressure};
    const progressStamp=primary?progress(c,primary):'';
    const progressAt=previous&&old?.key===primary?.key&&previous.progressStamp===progressStamp?previous.progressAt:now;
    const continuing=previous?.capital===capital&&now>=previous.time;
    memory.set(c,{capital,stamp,time:now,next:now+(ctx.metrics.slots>=80?12:8),value,
      heldAt:continuing?previous.heldAt??null:null,formingSince:continuing?previous.formingSince??null:null,progressStamp,progressAt});
    if(primary&&primary.evidence>=3&&!ctx.pressure){
      const type=R.aiStrategySteps(c,primary,false,ctx.metrics).filter(o=>o.kind==='construct'||o.kind==='building').map(o=>o.id)
        .find(type=>!R.aiBuildingMechanics(type).produces&&R.cityBuildingCells(c,{type,row:0,col:0,rotation:0}).length>1);
      const cell=type&&R.findCell(c,type);
      if(cell)value.reservation={type,cell,cells:R.cityBuildingCells(c,{type,row:cell[0],col:cell[1],rotation:cell[2]})};
    }
    return value;
  };
  R.aiStrategyChoiceBonus=(c,o,strategy)=>{
    const p=strategy?.primary;if(!p)return 0;
    let bonus=0;
    if(same(o,p.anchor))bonus+=20;
    if(['building_upgrade','building_branch'].includes(o.kind)&&p.anchor.kind==='building_branch'&&o.id===p.anchor.id){
      bonus+=o.kind==='building_branch'&&o.branch!==p.anchor.branch?-16:10;
    }
    if(o.kind==='building'&&(o.id===p.producer||o.id===p.anchor.id||p.goals.includes(o.id)))bonus+=12;
    const d=R.aiStrategyDescriptor(c,o),r=R.aiStrategyRelated(p,d);
    if(o.kind==='normal'){
      const planned=R.activeSpawners(c).filter(b=>p.units.includes(R.effectiveUnitKey(c,b)));
      const relevant=planned.filter(b=>d.units.includes(R.effectiveUnitKey(c,b))).length/Math.max(1,planned.length);
      bonus+=r.direct?2*relevant:Math.min(2,r.shared);
    }else bonus+=r.direct?7:Math.min(5,r.shared*2);
    return bonus*p.confidence;
  };
  R.aiStrategyBuildBonus=(c,type,ctx)=>{
    const p=ctx.strategy?.primary;
    if(!p||ctx.pressure||ctx.growth.growing&&!R.aiBuildingMechanics(type).produces)return 0;
    const m=R.aiBuildingMechanics(type);
    const unfinished=!R.hasBuilding(c,type)||m.produces&&ctx.growth.growing||m.storage&&R.aiStoragePressure(c,ctx.metrics);
    return p.goals.includes(type)&&unfinished?14*p.confidence:0;
  };
  R.aiStrategyMilitaryBonus=(key,ctx)=>{
    const p=ctx.strategy?.primary;if(!p?.units.includes(key))return 0;
    const total=sum(Object.values(ctx.metrics.units).map(u=>u.count));
    const focus=sum(p.units.map(k=>ctx.metrics.units[k]?.count||0));
    return 3*p.confidence*(focus>=total*.7?.35:1);
  };
  R.aiStrategyLayoutKey=c=>{
    const s=R.aiStrategyFor(c);
    return JSON.stringify([s?.reservation,s?.pressure,s?.primary?.units,s?.primary?.confidence]);
  };
  R.aiStrategyPlacementPenalty=(c,type,cells)=>{
    const state=R.aiStrategyFor(c),reservation=!state?.pressure&&state?.reservation;
    if(!reservation||R.hasBuilding(c,reservation.type)||reservation.type===type||!cells.some(([r,k])=>reservation.cells.some(([rr,kk])=>r===rr&&k===kk)))return 0;
    return R.aiBuildingMechanics(type).produces?15:100;
  };
  R.aiStrategySupportPlacement=(c,targets)=>{
    const p=R.aiStrategyFor(c)?.primary;if(!p)return 0;
    return targets.filter(b=>p.units.includes(R.effectiveUnitKey(c,b))).length*60*p.confidence;
  };
  R.aiStrategyGatePolicy=(c,{entries,total,target,cap,full})=>{
    const state=stateFor(c),p=state?.value.primary;
    if(state&&(!entries.length||c.gateMode==='open'))state.formingSince=null;
    if(state&&entries.length)state.formingSince??=R.state.time;
    if(state?.formingSince!=null&&R.state.time-state.formingSince>=45){
      state.heldAt=null;return {target:Math.min(target,Math.max(1,total)),hold:false};
    }
    if(!p||p.confidence<.35||R.aiUnderAttack(c)){if(state)state.heldAt=null;return {target,hold:false};}
    const focused=entries.filter(e=>p.units.includes(e.key)).length>=entries.length*.5&&entries.length>0;
    const wanted=focused?Math.min(cap,Math.max(target,Math.floor(cap*.75))):target;
    const due=c._aiPickDue!=null?c._aiPickDue-R.state.time:R.state.nextPick;
    const wait=focused&&!full&&total>=target&&due>0&&due<=10&&
      R.buildingUpgradePool(c).some(o=>R.aiStrategyChoiceBonus(c,o,state.value)>5);
    if(!wait){state.heldAt=null;return {target:wanted,hold:false};}
    state.heldAt??=R.state.time;
    return {target:wanted,hold:R.state.time-state.heldAt<12};
  };
}
