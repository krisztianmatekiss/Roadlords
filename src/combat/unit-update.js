import { ARMY_TEMPO } from '../data/unit-balance.js';

export const necromancerSummonInterval=(R,c)=>ARMY_TEMPO.necroSummonInterval*(R.hasLeg(c,'necro_leg_quickening')?.5:1);
export const wargSpearAttackDue=(R,u)=>{
  const next=(u.orcWargAttackCount||0)+1;
  return R.hasLeg(R.cityForSide(u.side),'orc_warg_all_spears')||next===1||next%4===0;
};

export function installUnitCombatUpdate(R){
  // Count committed normal attacks, independent of impact-time attackCount and
  // the free kill reactions / chained hits of existing Warg upgrades.
  const prepare=u=>{if(u?.key==='orc_warg'&&!u.roadPending&&wargSpearAttackDue(R,u))u.orcSpearReady=true;};
  const before=R.orcBeforeCombat13;
  R.orcBeforeCombat13=(u,...args)=>{prepare(u);return before(u,...args);};
  const queue=R.roadQueueAttack;
  R.roadQueueAttack=(u,t,structure,opts)=>{
    const pending=u?.roadPending;prepare(u);
    const result=queue(u,t,structure,opts);
    if(u?.key==='orc_warg'&&!pending&&u.roadPending&&!opts?.orcHunt&&!u.orcSpearRainActive)u.orcWargAttackCount=(u.orcWargAttackCount||0)+1;
    return result;
  };
  const payload=R.mpFactionUnitPayload;
  R.mpFactionUnitPayload=u=>u?.key==='orc_warg'?{...payload(u),orcWargAttackCount:u.orcWargAttackCount||0}:payload(u);
}
