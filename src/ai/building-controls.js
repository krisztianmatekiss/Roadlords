// Tactical controls are separate from construction. A portal is an arrival
// route, not a permanent throughput bonus; ongoing training profiles stay locked.
export function installAiBuildingControls(R){
  const clocks=new WeakMap();
  const stateFor=c=>{let s=clocks.get(c),capital=c.buildings.find(b=>b.type==='keep');
    if(!s||s.capital!==capital||R.state.time<s.at){s={capital,at:R.state.time,next:0,pulseEnd:0};clocks.set(c,s);}s.at=R.state.time;return s;};
  const release=R.releaseUnit;
  R.releaseUnit=(c,e)=>{const u=release(c,e);if(u&&!e.undFieldSpawn&&R.undPortalOperational(c))stateFor(c).lastUse=R.state.time;return u;};
  R.aiPortalUtility=(c,metrics)=>{
    const s=stateFor(c),t=R.aiPortalTactics(c),traffic=c.releaseQueue.length+R.reserveCount(c);
    if(!traffic||(R.battlePopulationRoom?.(c)??Infinity)<=0)return 0;
    return t.safe&&t.worthwhile?Math.min(8,metrics.power*.25)*(t.flank||t.split?1:Math.min(1,t.saved/30))+(R.state.time-(s.lastUse??-Infinity)<30?2:0):0;
  };
  R.aiPortalTactics=(c,battle=R.aiBattleState(c))=>{
    const entries=[...c.releaseQueue,...c.garrison,...c.rallyReserve],side=R.sideForCity(c);
    const speeds=entries.slice(0,12).map(e=>R.statsFor(c,e).speed),speed=speeds.length?Math.max(1,speeds.reduce((a,b)=>a+b,0)/speeds.length):30;
    const backline=battle.foes.filter(e=>(R.UNITS[e.u.key]?.tags||[]).includes('ranged')&&e.d<battle.border&&battle.border-e.d<Math.max(200,speed*6));
    const split=battle.foes.some(e=>e.d<battle.border-100)&&battle.foes.some(e=>e.d>battle.border+100);
    const flank=backline.length>0&&battle.foes.some(e=>e.d<Math.min(...backline.map(e=>e.d))-100);
    const defended=battle.front?.hp>battle.front?.maxHp*.5&&battle.breach>45&&battle.hostilePower<battle.defendingPower*1.2+25;
    const safe=!battle.urgent&&(!battle.portalUnsafe||(flank||split)&&defended);
    const destination=battle.foes.length?Math.min(...battle.foes.map(e=>e.d)):R.PATH_LENGTH-battle.frontDistance;
    const saved=(Math.abs(destination)-Math.abs(destination-battle.border))/speed;
    return {side,safe,flank,split,saved,worthwhile:flank||split||saved>=8};
  };
  function portal(c,ctx,s){
    if(!c.undeadState||!R.hasBuilding(c,'und_otherworld_portal'))return;
    const now=R.state.time,tactics=R.aiPortalTactics(c,ctx.battle),reserve=R.reserveCount(c);
    const room=R.fieldUnitCount(c)<c.armyCap&&(R.battlePopulationRoom?.(c)??Infinity)>0;
    const deploying=room&&(c.releaseQueue.length>0||c.gateMode==='open'&&reserve>0||reserve>=Math.min(c._aiWaveTarget||10,c.garrisonCap));
    const on=c.undPortalEnabled?{flow:R.resourceFlowRates(c),upkeep:R.undEconomy(c).totalUpkeep}:
      R.aiPreview(c,shadow=>{shadow.undPortalEnabled=true;},shadow=>({flow:R.resourceFlowRates(shadow),upkeep:R.undEconomy(shadow).totalUpkeep}));
    const savings=c._aiSaveReason==='economy'?(c._aiSavePrice?.wood||0):0;
    const needed=Math.max(0,on.flow.use.wood-on.flow.gain.wood)*45+on.upkeep*12+savings;
    let enabled=deploying&&tactics.safe&&tactics.worthwhile&&c.resources.wood>Math.max(30,needed)&&now>=(c._aiPortalOffUntil||0);
    if(c.undPortalEnabled&&now>=s.pulseEnd)enabled=false;
    if(enabled!==!!c.undPortalEnabled){
      c.undPortalEnabled=enabled;
      if(enabled)s.pulseEnd=now+(tactics.flank||tactics.split?8:12);
      else c._aiPortalOffUntil=now+8;
      R.recomputeCity(c,true);
    }
  }
  R.aiUpdateBuildingControls=(c,ctx)=>{
    if(!R.aiControlsCity(c))return;
    const s=stateFor(c);portal(c,ctx,s);
    if(R.state.time<s.next)return;s.next=R.state.time+20;
    const before=R.aiPreview(c,()=>{}),candidates=[];
    if(R.hasBuilding(c,'warcenter')&&R.state.time-(c.warModeChangedAt??-30)>=30)
      for(const mode of ['mass','economy','elite'])if(mode!==c.warMode)candidates.push({kind:'war',mode,change:shadow=>{shadow.warMode=mode;}});
    if(c.race==='orc'&&R.hasLeg(c,'orc_united_huts'))for(const mode of ['army','reserve'])if(mode!==(c.orcHutMode||'army'))
      candidates.push({kind:'hut',mode,change:shadow=>{shadow.orcHutMode=mode;}});
    for(const b of c.buildings.filter(b=>b.type==='orc_overseer'&&b.level===4&&!b.inactive).slice(0,2))
      for(const setting of [0,.5,1])if(setting!==(c.orcHasteSettings?.[b.id]||0))candidates.push({kind:'haste',id:b.id,setting,change:shadow=>{(shadow.orcHasteSettings||={})[b.id]=setting;}});
    const value=city=>{
      if(city.race==='orc')for(const b of R.activeSpawners(city)){b.progress=0;delete b.orcTrainingProfile;}
      const m=R.aiCityMetrics(city);let qualityPower=m.power;
      // Born wounded is a real cost. Estimate how much of an encounter these
      // recruits survive, with exposure derived from the observed enemy army.
      if(city.race==='orc'){
        const foes=ctx.battle.foes,exposure=foes.filter(e=>(R.UNITS[e.u.key]?.tags||[]).includes('ranged')).length/Math.max(1,foes.length);
        qualityPower=0;
        for(const b of R.activeSpawners(city)){
          b.progress=0;delete b.orcTrainingProfile;
          const profile=R.orcHasteProfile(city,b),key=R.effectiveUnitKey(city,b),fraction=profile.hp;
          const survival=Math.max(.05,fraction-(1-fraction)*(.15+exposure*.35));
          qualityPower+=R.aiUnitQuality(city,key,b)*R.productionBatchSize(city,b)/Math.max(1,R.trainingTime(city,b))*survival;
        }
      }
      m.power=qualityPower;return m;
    };
    const baseline=R.aiPreview(c,()=>{},value);let best=null,bestScore=2;
    for(const candidate of candidates){
      const after=R.aiPreview(c,candidate.change,value),used=R.fieldUnitCount(c),reserved=R.reserveCount(c);
      if(after.armyCap<Math.min(before.armyCap,used)||after.reserveCap<reserved)continue;
      let score=R.aiMetricDelta(baseline,after,c);
      if(ctx.growth.growing)for(const r of ctx.resources)score+=12*(before.use[r]-after.use[r])/Math.max(1,before.use[r]);
      if(score>bestScore){best=candidate;bestScore=score;}
    }
    if(best){if(best.kind==='war')R.setWarMode(c,best.mode,true);else{best.change(c);R.recomputeCity(c,true);}}
  };
}
