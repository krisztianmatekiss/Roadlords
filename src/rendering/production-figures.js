// Decode only the factions taking part, before the player leaves setup.
const LOADERS={
  human:['loadHumanInfantryArt','loadArcherArt','loadKnightArt','loadCatapultArt','loadHumanCastersArt'],
  orc:['loadOrcWarriorArt','loadOrcRaidersArt','loadOrcMysticsArt','loadOrcSiegeArt'],
  undead:['loadUndeadArt','loadSkeletonArt','loadArcherArt'],
};
export function installProductionFigures(R){
  const loads=new Map();
  R.loadProductionBattleArt=(races=[R.P.race,R.E.race])=>Promise.all([...new Set(races)].map(race=>{
    if(!loads.has(race))loads.set(race,Promise.all((LOADERS[race]||LOADERS.human).map(name=>R[name]())).then(result=>result.every(Boolean)));
    return loads.get(race);
  })).then(result=>result.every(Boolean));
  for(const [selector,races]of [['#raceContinue',()=>[R.$('#soloRace').value,R.$('#aiRace').value]],['#pregameReady',()=>[R.P.race,R.E.race]]]){
    const button=R.$(selector),action=button?.onclick;if(!action)continue;
    button.onclick=async function(event){
      if(button.disabled)return;button.disabled=true;
      const ready=await R.loadProductionBattleArt(races());button.disabled=false;
      if(!ready){R.toast('Az egységek képei nem töltődtek be. Frissítsd az oldalt.');return;}
      return action.call(this,event);
    };
  }
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
