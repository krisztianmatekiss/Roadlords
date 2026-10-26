// Decode only the factions taking part, before the player leaves setup.
const LOADERS={
  human:['loadHumanMapArt','loadHumanInfantryArt','loadArcherArt','loadKnightArt','loadCatapultArt','loadHumanCastersArt'],
  orc:['loadOrcWarriorArt','loadOrcRaidersArt','loadOrcMysticsArt','loadOrcSiegeArt'],
  undead:['loadUndeadArt','loadSkeletonArt','loadArcherArt'],
};
export function installProductionFigures(R){
  const loads=new Map();
  const readyKeys={loadHumanMapArt:'humanMapArtReady',loadHumanInfantryArt:'humanInfantryArtReady',loadArcherArt:'archerArtReady',loadKnightArt:'knightArtReady',loadCatapultArt:'catapultArtReady',loadHumanCastersArt:'humanCastersArtReady',loadOrcWarriorArt:'orcWarriorArtReady',loadOrcRaidersArt:'orcRaidersArtReady',loadOrcMysticsArt:'orcMysticsArtReady',loadOrcSiegeArt:'orcSiegeArtReady',loadUndeadArt:'undeadArtReady',loadSkeletonArt:'skeletonArtReady'};
  R.loadProductionBattleArt=(races=[R.P.race,R.E.race])=>Promise.all([...new Set(races)].map(race=>{
    if(!loads.has(race)) {
      const names=LOADERS[race]||LOADERS.human;
      loads.set(race,Promise.all(names.map(name=>Promise.resolve().then(()=>R[name]()).catch(()=>false))).then(result=>{
        const ok=result.every(Boolean);
        if(!ok){loads.delete(race);names.forEach((name,i)=>{if(!result[i])R[readyKeys[name]]=null;});}
        return ok;
      }));
    }
    return loads.get(race);
  })).then(result=>result.every(Boolean));
  for(const [selector,races]of [['#raceContinue',()=>[R.$('#soloRace').value,R.$('#aiRace').value]],['#pregameReady',()=>[R.P.race,R.E.race]]]){
    const button=R.$(selector),action=button?.onclick;if(!action)continue;
    button.onclick=async function(event){
      if(button.disabled)return;
      const label=button.textContent;button.disabled=true;button.setAttribute('aria-busy','true');button.textContent='KÉPEK BETÖLTÉSE…';
      let ready=false;
      try{ready=await R.loadProductionBattleArt(races());}
      finally{button.disabled=false;button.removeAttribute('aria-busy');button.textContent=label;}
      if(!ready){R.toast('Nem sikerült betölteni az egységképeket. Próbáld újra.');return;}
      return action.call(this,event);
    };
  }
  const warmSolo=()=>R.loadProductionBattleArt([R.$('#soloRace').value,R.$('#aiRace').value]);
  R.$('#mpSolo')?.addEventListener('click',warmSolo);
  for(const selector of ['#soloRace','#aiRace'])R.$(selector)?.addEventListener('change',warmSolo);
  // Reuse the optional faction metadata column for transient cast poses.
  const factionPayload=R.mpFactionUnitPayload;
  R.mpFactionUnitPayload=u=>{
    const payload=factionPayload?.(u),heal=u?.roadHeal?.end>R.ROAD.clock?u.roadHeal:null,summon=u?.roadUndSummon?.end>R.ROAD.clock?u.roadUndSummon:null;
    if(!heal&&!summon)return payload;
    return {...payload,...(heal?{roadHeal:heal}:{}),...(summon?{roadUndSummon:summon}:{})};
  };
  R.roadRemoteUnitEffects=(u,payload,byId)=>{
    const heal=payload.roadHeal;if(!heal||u.roadHealSeen===heal.start)return;
    const target=byId.get(heal.targetId);if(!target)return;
    u.roadHealSeen=heal.start;
    if(R.casterHeals.length>=128)R.casterHeals.shift();
    R.casterHeals.push({target,start:heal.start});
  };
  const handle=R.mpHandle;
  R.mpHandle=data=>{const result=handle(data);if(data?.type==='hello'||data?.type==='start')R.loadProductionBattleArt();return result;};
}
