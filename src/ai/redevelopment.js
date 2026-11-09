import { installRedevelopmentValue } from './redevelopment-value.js';
import { producerBaseOutput } from '../economy/producer-output.js';

export function installAiRedevelopment(R) {
  installRedevelopmentValue(R);
  const memories=new WeakMap();
  const stateFor=c=>{
    const capital=c.buildings.find(b=>b.type==='keep');let s=memories.get(c);
    if(!s||s.capital!==capital||R.state.time<s.at){
      s={capital,at:R.state.time,samples:[],peak:R.C(),surplus:R.C(),deathRate:0,next:0,cursor:0,recent:new Map(),removed:new Map()};memories.set(c,s);
    }
    return s;
  };
  R.aiObserveRedevelopment=(c,metrics)=>{
    const s=stateFor(c),now=R.state.time;
    if(s.samples.length&&now-s.at<4)return s;
    const elapsed=Math.min(8,Math.max(0,now-s.at));s.at=now;
    const deaths=Object.entries(c._matchStats?.unitDeathsByType||{}).reduce((n,[key,count])=>n+count*Math.max(1,R.orcArmyWeight({key},c)),0);
    s.samples.push({at:now,use:{...metrics.use},deaths});s.samples=s.samples.filter(x=>now-x.at<=90);
    for(const r of R.aiResourceKeys(c)){
      s.peak[r]=Math.max(metrics.use[r],...s.samples.map(x=>x.use[r]||0));
      const stocked=c.resources[r]>=Math.min(c.caps[r]*.8,Math.max(100,(metrics.constructionReserve[r]||0)*3));
      const capped=Number.isFinite(c.caps[r])&&c.caps[r]<1e10;
      const marketNeeds=R.hasBuilding(c,'market')&&R.aiResourceKeys(c).some(key=>metrics.gain[key]<metrics.use[key]*1.2||c.resources[key]<c.caps[key]*.5);
      const excess=capped&&!marketNeeds&&!R.hasLeg(c,'overproduction')&&metrics.gain[r]>s.peak[r]*1.35+2&&stocked;
      s.surplus[r]=excess?s.surplus[r]+elapsed:0;
    }
    const first=s.samples[0];s.deathRate=first&&now>first.at?(deaths-first.deaths)/(now-first.at):0;
    return s;
  };
  function importance(c,b,m,s){
    const role=R.aiBuildingMechanics(b.type),copies=c.buildings.filter(x=>x.type===b.type).length;
    let value=2+b.level*.5;
    if(role.produces){
      const output=producerBaseOutput(R,c,b);
      // Do not let a large *discarded* output hide this plot behind useful
      // troops in the short candidate list. Full-city safety still checks the
      // income remaining after every proposed removal.
      if(role.produces.every(r=>s.surplus[r]>=20))value=.25;
      value+=role.produces.reduce((n,r)=>n+(s.surplus[r]>=20?.005:12)*(output[r]||m.gain[r]/Math.max(1,copies)),0);
    }
    if(!role.produces&&role.features?.includes('economy')){
      const without=R.aiPreview(c,shadow=>{shadow.buildings=shadow.buildings.filter(p=>p.id!==b.id);},shadow=>R.productionRates(shadow));
      const output=R.RES.reduce((n,r)=>n+Math.max(0,(m.rawGain||m.gain)[r]-without[r]),0);
      value+=output/Math.max(1,R.cityBuildingCells(c,b).length)*2;
    }
    if(R.BUILDINGS[b.type]?.unit){
      const u=m.units[R.effectiveUnitKey(c,b)];value+=15*(u?.power||0)/Math.max(1,copies*m.power);
      if(R.aiStrategyFor(c)?.primary?.units.includes(R.effectiveUnitKey(c,b)))value+=8;
    }
    if(role.local||role.localSupport||role.localUpkeep){
      const targets=(role.localSupport||role.localUpkeep?c.buildings:R.activeSpawners(c)).filter(p=>p.id!==b.id&&R.aiSupportAffects(c,b,p));
      const others=role.nonstacking?{...c,buildings:c.buildings.filter(p=>p.id!==b.id)}:c;
      value+=R.aiMarginalSupportTargets(others,b,targets).length*3;
    }
    if(role.capacity||role.reserve)value+=R.armyCapacityState(c)?.buildings.get(b.id)?.redundant?0:6;
    if(role.storage)value+=6;
    if(R.isUniqueBuilding(c,b.type))value+=6;
    if(b.inactive)value*=.1;
    return value;
  }
  function candidates(c,types,before,s){
    const occupied=R.occupancy(c),byId=new Map(c.buildings.map(b=>[b.id,b]));
    const values=new Map(c.buildings.filter(b=>b.type!=='keep').map(b=>[b.id,importance(c,b,before,s)]));
    const extras=[...values].sort((a,b)=>a[1]-b[1]).slice(0,3).map(([id])=>id),all=[];
    const spawners=R.activeSpawners(c),hubs=c.buildings.filter(b=>{
      const m=R.aiBuildingMechanics(b.type);return m.local||m.localSupport||m.localUpkeep;
    });
    for(const type of types){
      if(s.removed.get(type)>R.state.time)continue;
      const role=R.aiBuildingMechanics(type);
      const own=c.buildings.filter(b=>b.type===type),unique=R.isUniqueBuilding(c,type);
      const moves=own.slice().sort((a,b)=>values.get(a.id)-values.get(b.id)).slice(0,2).map(b=>b.id);
      const variants=unique&&own.length?[own[0].id]:[null,...moves];
      const options=[],seen=new Set();
      for(const rotation of R.rotationOptions(type)){
        const offsets=R.cityBuildingCells(c,{type,row:0,col:0,rotation});
        for(let row=0;row<R.GRID;row++)for(let col=0;col<R.GRID;col++){
          const blockers=new Set();let legal=true;
          for(const [dr,dc]of offsets){
            const r=row+dr,k=col+dc;
            if(r<0||k<0||r>=R.GRID||k>=R.GRID||R.terrainBlocks(c,r,k)){legal=false;break;}
            const v=occupied.get(R.idx(r,k)),id=typeof v==='object'?v.id:v;
            if(id){if(byId.get(id)?.type==='keep'){legal=false;break;}blockers.add(id);}
          }
          if(!legal)continue;
          const target={id:'candidate',type,row,col,rotation,level:R.levelOf(c,type)};
          const supported=role.local?spawners.filter(p=>R.aiSupportAffects(c,target,p)):[];
          const supportBuildings=role.localSupport||role.localUpkeep?c.buildings.filter(p=>R.aiSupportAffects(c,target,p)):[];
          const incoming=hubs.filter(h=>{
            const m=R.aiBuildingMechanics(h.type);
            return (R.BUILDINGS[type].unit||m.localSupport||m.localUpkeep)&&R.aiSupportAffects(c,h,target);
          });
          for(const move of variants){
            const ids=new Set(blockers);if(move)ids.add(move);
            const versions=ids.size?[ids]:extras.map(id=>new Set([id]));
            for(const removed of versions){
              if(!removed.size||removed.size>9)continue;
              if([...removed].some(id=>s.recent.get(byId.get(id)?.type)>R.state.time))continue;
              if(removed.size===1){const b=byId.get([...removed][0]);if(b?.type===type&&b.row===row&&b.col===col&&(b.rotation||0)===rotation)continue;}
              const key=[row,col,rotation,[...removed].sort().join(',')].join(':');if(seen.has(key))continue;seen.add(key);
              let rank=[...removed].reduce((n,id)=>n+values.get(id),0)+removed.size;
              rank-=supported.filter(p=>!removed.has(p.id)).length*8;
              if(role.localSupport)rank-=supportBuildings.filter(p=>!removed.has(p.id)).length*5;
              if(role.localUpkeep)rank-=supportBuildings.filter(p=>!removed.has(p.id)).reduce((n,p)=>n+(R.buildingDefinition(c,p.type).upkeep||0),0)*2;
              rank-=incoming.filter(p=>!removed.has(p.id)).length*4;
              options.push({type,cell:[row,col,rotation],ids:[...removed],rank});
            }
          }
        }
      }
      options.sort((a,b)=>a.rank-b.rank);
      // Retain different footprints/removal sets, not four rotations of one plot.
      const sets=new Set();let kept=0;
      for(const p of options){const key=p.ids.slice().sort().join(',')+':'+p.cell.slice(0,2).join(',');if(sets.has(key))continue;sets.add(key);all.push(p);if(++kept===2)break;}
    }
    return all;
  }
  R.aiFindRedevelopment=(c,{type=null,types=null,budget=12,history=null,metrics=null,diagnostics=null}={})=>{
    if(!R.aiControlsCity(c)||R.aiUnderAttack(c)||R.state.time<(c._aiRedevelopAfter||0))return null;
    const before=metrics?R.aiEnrichRedevelopmentMeasure(c,metrics):R.aiPreview(c,()=>{},R.aiRedevelopmentMeasure);
    before.passive=R.aiRedevelopmentPassive(c,before);
    const s=history||R.aiObserveRedevelopment(c,before);
    const available=(type?[type]:types||R.aiFactionBuildings(c)).filter(t=>t!=='keep'&&c.unlocked.has(t)&&R.aiFactionBuildings(c).includes(t));
    const plans=candidates(c,available,before,s),free=new Map();let best=null,used=0;
    // Each considered role gets one preview before its second candidate.
    plans.sort((a,b)=>plans.filter(x=>x.type===a.type).indexOf(a)-plans.filter(x=>x.type===b.type).indexOf(b)||available.indexOf(a.type)-available.indexOf(b.type));
    for(const p of plans){
      if(used>=budget)break;used++;
      const after=R.aiProjectRedevelopment(c,p);
      const safe=p.legal&&p.affordable&&R.aiRedevelopmentSafe(c,before,after,p,s)&&R.aiRedevelopmentHasPurpose(c,p,after);
      const diagnostic={type:p.type,cell:p.cell,ids:p.ids,rank:p.rank,legal:p.legal,affordable:p.affordable,safe,before:before.power,after:after.power};diagnostics?.push(diagnostic);
      if(!safe)continue;
      p.score=R.aiRedevelopmentValue(c,before,after,p,s);p.previews=used;
      diagnostic.score=p.score;
      if(p.score<5)continue;
      if(!free.has(p.type)){
        const cell=R.findCell(c,p.type);let score=0;
        if(cell){if(used>=budget)continue;used++;
          const f={type:p.type,cell,ids:[]},m=R.aiProjectRedevelopment(c,f);
          if(f.affordable&&R.aiRedevelopmentSafe(c,before,m,f,s))score=R.aiRedevelopmentValue(c,before,m,f,s);}
        free.set(p.type,score);
      }
      diagnostic.free=free.get(p.type);
      const relocation=p.ids.length===1&&R.getBuilding(c,p.ids[0])?.type===p.type;
      if(p.score<free.get(p.type)+(relocation?0:3))continue;
      p.afterPower=after.power;if(!best||p.score>best.score)best=p;
    }
    if(best){best.previews=used;best.beforePower=before.power;}
    return best;
  };
  R.aiExecuteRedevelopment=(c,plan)=>{
    if(!plan||!R.aiControlsCity(c)||R.aiUnderAttack(c)||R.state.time<(c._aiRedevelopAfter||0))return false;
    const before=R.aiPreview(c,()=>{},R.aiRedevelopmentMeasure),s=R.aiObserveRedevelopment(c,before);
    before.passive=R.aiRedevelopmentPassive(c,before);
    const after=R.aiProjectRedevelopment(c,plan);
    if(!plan.legal||!plan.affordable||!R.aiRedevelopmentSafe(c,before,after,plan,s)||!R.aiRedevelopmentHasPurpose(c,plan,after)||R.aiRedevelopmentValue(c,before,after,plan,s)<5)return false;
    const snapshot=structuredClone(c),capital=c.buildings.find(b=>b.type==='keep'),towers=structuredClone(R.towers);let ok=false;
    try{ok=R.aiMutate(()=>{
      for(const id of plan.ids)if(!R.demolish(c,id))return false;
      return !!R.placeBuilding(c,plan.type,...plan.cell)?.ok;
    });}finally{
      if(!ok){for(const key of Object.keys(c))delete c[key];Object.assign(c,snapshot);
        const restored=c.buildings.find(b=>b.type==='keep');Object.assign(capital,restored);
        c.buildings=c.buildings.map(b=>b.type==='keep'?capital:b);
        R.towers.forEach((t,i)=>Object.assign(t,towers[i]));R.recomputeCity(c,true);
        if(snapshot.undRevision!=null)c.undRevision=snapshot.undRevision;}
    }
    if(!ok)return false;
    c._aiRedevelopAfter=R.state.time+45;s.next=R.state.time+45;
    for(const b of snapshot.buildings.filter(b=>plan.ids.includes(b.id))){s.recent.set(b.type,R.state.time+90);if(b.type!==plan.type)s.removed.set(b.type,R.state.time+90);}
    s.recent.set(plan.type,R.state.time+90);
    c._aiRedevelopCount=(c._aiRedevelopCount||0)+1;
    if(c.undeadState)c.undeadState.aiRedeveloped=(c.undeadState.aiRedeveloped||0)+1;
    R.aiClearBuildSavings(c);
    return true;
  };
  R.aiRedevelopmentTypePenalty=(c,type,ctx)=>{
    if(!(stateFor(c).removed.get(type)>R.state.time)||ctx.pressure)return 0;
    const m=R.aiBuildingMechanics(type);
    if(m.produces?.some(r=>ctx.metrics.gain[r]<ctx.metrics.use[r]))return 0;
    if(m.capacity&&R.fieldUnitCount(c)>=c.armyCap)return 0;
    return 25;
  };
  R.aiTryRedevelopment=(c,ctx)=>{
    const s=R.aiObserveRedevelopment(c,ctx.metrics),now=R.state.time;
    if(ctx.pressure||now<s.next||now<(c._aiRedevelopAfter||0)||ctx.metrics.slots<65||now<180)return false;
    s.next=now+6;
    const all=R.aiFactionBuildings(c).filter(t=>t!=='keep'&&c.unlocked.has(t));
    const chosen=all.slice(s.cursor,s.cursor+3);s.cursor=(s.cursor+3)%Math.max(1,all.length);
    for(const t of ctx.strategy?.primary?.goals||[])if(all.includes(t)&&!chosen.includes(t)&&chosen.length<4)chosen.push(t);
    const plan=R.aiFindRedevelopment(c,{types:chosen,budget:4,history:s,metrics:ctx.metrics});
    return plan?R.aiExecuteRedevelopment(c,plan):false;
  };
}
