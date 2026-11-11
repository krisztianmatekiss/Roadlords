import { UNDEAD_CONVERGENCE as B } from '../../data/undead-convergence.js';
import { UNDEAD_UNITS as U } from '../../data/undead.js';
import { territoryPower, levelValue as at } from '../../data/faction-redesign.js';
import { installConvergenceEffects } from '../../rendering/undead-convergence-effects.js';

export function initializeUndeadConvergence(R) {
  const own=u=>R.cityForSide(u.side),undead=c=>c?.race==='undead';
  const active=(c,type)=>c.buildings.filter(b=>b.type===type&&!b.inactive);
  const clock=()=>R.ROAD.clock;
  const authoritative=()=>!(R.MP.enabled&&R.MP.role==='guest');
  const shadowQueue=[],territoryProfiles=new WeakMap();
  R.undConvergenceFx=(c,kind,lane,offset=0,duration=.7)=>{
    if(!c.undeadState)return;
    const side=R.sideForCity(c),state=c.undeadState;
    state.convergenceFx=(state.convergenceFx||[]).filter(f=>f.end>R.state.time).slice(-63);
    state.convergenceFx.push({kind,distance:side==='player'?lane:R.PATH_LENGTH-lane,
      offset:side==='player'?offset:-offset,start:R.state.time,end:R.state.time+duration});
  };
  R.undNightProtected=u=>!!u?.alive&&u.key==='und_vampire'&&undead(own(u))&&
    R.hasLeg(own(u),'vampire_leg_night_predator')&&!u.undNightSpent&&(u.attackCount||0)===0;
  const move=R.effectiveMoveSpeed;
  R.effectiveMoveSpeed=(u,c)=>move(u,c)*(u.key==='und_vampire'&&undead(c)&&R.hasLeg(c,'vampire_leg_night_predator')?1.2:1);
  R.undClaimInfection=(dead,killer)=>{
    if(!killer||killer.side===dead.side||killer.key!=='und_vampire'||!undead(own(killer))||
      !R.hasLeg(own(killer),'vampire_leg_infection')||R.battlePopulationRoom(own(killer))<1)return;
    dead.undCorpseClaim={kind:'vampire_infection',side:killer.side};
  };
  R.undResolveInfection=(dead,killer)=>{
    if(dead.undCorpseClaim?.kind!=='vampire_infection'||!killer)return;
    const extra={undSpawnHp:.25};
    // Temporary sources spread infection without laundering summons into permanent troops.
    if(killer.temporary>0)Object.assign(extra,{undSummoned:true,undNoArmySlot:!!killer.undNoArmySlot,undLifetime:killer.temporary});
    const born=R.undSpawn(own(killer),'und_vampire',dead.lane,dead.offset||0,extra);
    if(born)R.undConvergenceFx(own(killer),'infection',born.lane,born.offset);
  };
  const combatDeath=R.undOnCombatDeath;
  R.undOnCombatDeath=dead=>{
    if((dead.orcPoison||0)>0&&!dead.undPlagueTransferred){
      const c=R.cityForSide(dead.side==='player'?'enemy':'player');
      if(undead(c)&&R.hasLeg(c,'und_wandering_plague')){
        let nearest=null,distance=Infinity;
        for(const u of R.state.units){
          if(!u.alive||u===dead||u.side!==dead.side)continue;
          const d=(u.lane-dead.lane)**2+((u.offset||0)-(dead.offset||0))**2;
          if(d<distance||d===distance&&u.id<nearest.id){nearest=u;distance=d;}
        }
        dead.undPlagueTransferred=true;
        if(nearest){
          const wasEmpty=!(nearest.orcPoison>0),amount=dead.orcPoison;
          R.undPoison(nearest,amount,c);
          if(wasEmpty)nearest.orcPoisonClock=dead.orcPoisonClock||0;
          dead.orcPoison=0;R.undConvergenceFx(c,'plague',nearest.lane,nearest.offset);
        }
      }
    }
    return combatDeath?.(dead);
  };
  R.undOnGhostEvade=(u,attacker)=>{
    if(!authoritative()||!u.alive||!attacker?.alive||u.side===attacker.side||
      !undead(own(u))||!R.hasLeg(own(u),'ghost_leg_shadow_leap')||
      (u.undShadowReadyAt||0)>clock()||!R.roadCanPursue(u,attacker))return;
    u.undShadowReadyAt=clock()+B.shadowCooldown;
    if(shadowQueue.length<128)shadowQueue.push({u,attacker,facing:attacker.roadFace||(attacker.side==='player'?1:-1)});
  };
  function flushShadow(){
    for(const {u,attacker,facing} of shadowQueue.splice(0)){
      if(!u.alive||!attacker.alive||!R.roadCanPursue(u,attacker))continue;
      const c=own(u);R.undConvergenceFx(c,'shadow',u.lane,u.offset);
      R.ROAD.pending=R.ROAD.pending.filter(p=>{if(p.u!==u)return true;R.roadReleaseReservation(p);return false;});
      u.roadPending=false;u.roadAttack=null;u.cooldown=0;
      R.setBattleLane(u,attacker.lane-facing*22);u.offset=attacker.offset||0;
      u.roadFace=facing;u.roadHomeOffset=u.offset;
      R.roadReindex();R.undConvergenceFx(c,'shadow',u.lane,u.offset);
      R.attackUnit(u,attacker,{free:true,shadowCounter:true});
    }
  }
  const realAttack=R.roadRealAttack;
  R.roadRealAttack=(u,t,opts)=>{
    if(u?.alive&&t?.alive&&u.key==='und_vampire'&&u.stunTime<=0)u.undNightSpent=true;
    return realAttack(u,t,opts);
  };
  const structure=R.roadRealStructure;
  R.roadRealStructure=(u,t)=>{
    if(!u.alive||u.stunTime>0||!(t?.alive||t?.capital))return structure(u,t);
    if(u.key==='und_vampire')u.undNightSpent=true;
    return structure(u,t);
  };
  const status=R.updateUnitStatuses;
  R.updateUnitStatuses=(u,dt)=>{
    const protectedBefore=R.undNightProtected(u),hp=u.hp,out=status(u,dt);
    if(protectedBefore&&u.alive)u.hp=Math.max(u.hp,hp);
    return out;
  };
  const payload=R.mpFactionUnitPayload;
  R.mpFactionUnitPayload=u=>{
    const data=payload(u);
    return data?{...data,temporary:u.temporary||0,undNightSpent:!!u.undNightSpent,undShadowReadyAt:u.undShadowReadyAt||0}:data;
  };
  // Ownership is queried for many actors each frame; scan city buildings only
  // when a placement, level or multiplayer city snapshot changes its revision.
  const territoryProfile=c=>{
    const old=territoryProfiles.get(c),revision=c.undRevision||0;
    if(old?.revision===revision&&old.buildings===c.buildings)return old;
    let metres=0,amplification=1;
    if(undead(c))for(const b of c.buildings)if(b.type==='und_border_obelisk'&&!b.inactive){
      metres+=at(b.level,B.borderMetres);amplification+=at(b.level,B.borderAmplification);
    }
    const value={revision,buildings:c.buildings,metres,amplification};territoryProfiles.set(c,value);return value;
  };
  R.undTerritoryAmplification=c=>territoryProfile(c).amplification;
  R.undTerritoryScale=c=>territoryPower(c)*R.undTerritoryAmplification(c);
  R.undTerritoryAdvance=c=>{
    if(!undead(c))return 0;
    const metres=12*R.countNormal(c,'und_territory')+territoryProfile(c).metres;
    return Math.min(Math.max(0,R.PATH_LENGTH/2-20),metres*10*R.undTerritoryScale(c));
  };
  const preview=R.upgradeCopyPreview;
  R.upgradeCopyPreview=(c,o)=>o.id==='und_territory'?{
    description:R.NORMAL.find(d=>d.id===o.id).description,context:'A jelenlegi területnövelésekkel.',stacking:'Halmozható.',
    rows:[{label:'Saját térfélnövelés',before:`+${(R.undTerritoryAdvance(c)/10).toLocaleString('hu-HU')} m`,after:`+${(Math.min(R.PATH_LENGTH/2-20,R.undTerritoryAdvance(c)+120*(R.normalOptionPower?.(o)||1)*R.undTerritoryScale(c))/10).toLocaleString('hu-HU')} m`}],
  }:preview(c,o);
  R.undPortalOperational=c=>undead(c)&&!!c.undPortalEnabled&&active(c,'und_otherworld_portal').some(b=>!(b.undStarve>0))&&c.resources.wood>=0;
  const release=R.releaseUnit;
  R.releaseUnit=(c,e)=>{
    const u=release(c,e);
    if(u&&!e.undFieldSpawn&&R.undPortalOperational(c)){
      R.setBattleLane(u,R.territoryBoundary());u.roadPrev=u.lane;u.offset=0;u.roadHomeOffset=0;
      R.undConvergenceFx(c,'portal',u.lane,u.offset);
    }
    return u;
  };
  const produce=R.produceResources;
  R.produceResources=(c,dt)=>{
    const enabled=R.undPortalOperational(c),out=produce(c,dt);
    if(undead(c)&&c.undeadState){
      if(enabled)c.undeadState.portalUptime=(c.undeadState.portalUptime||0)+dt;
      if(c.undPortalEnabled&&(c.resources.wood<0||active(c,'und_otherworld_portal').some(b=>b.undStarve>0)))c.undPortalEnabled=false;
    }
    return out;
  };
  const battle=R.updateBattle;
  R.updateBattle=dt=>{
    const result=battle(dt);
    if(authoritative()){
      flushShadow();
    }
    return result;
  };
  R.MP_STRATEGY_KEYS.push('undPortalEnabled');
  const initialize=R.initializeFactionCity;
  R.initializeFactionCity=c=>{initialize(c);if(undead(c))c.undPortalEnabled=false;};
  const controls=R.redesignBuildingControls;
  R.redesignBuildingControls=(c,b)=>b.type==='und_otherworld_portal'
    ?`<button type="button" data-und-portal-toggle>${c.undPortalEnabled?'Portál kikapcsolása':'Portál bekapcsolása'}</button>`:controls?.(c,b)||'';
  document.addEventListener('click',event=>{
    if(!event.target.closest?.('[data-und-portal-toggle]')||!R.hasBuilding(R.P,'und_otherworld_portal'))return;
    R.P.undPortalEnabled=!R.P.undPortalEnabled;R.recomputeCity(R.P,true);R.renderStatic();
    if(R.MP.enabled){if(R.MP.role==='guest')R.mpSendStrategy(true);else R.mpSendSnapshot(true);}
  });
  const definition=R.buildingDefinition;
  R.buildingDefinition=(c,type)=>{
    const d=definition(c,type);
    if(type!=='und_well'||!undead(c)||!R.hasLeg(c,'und_compact_wells'))return d;
    return {...d,shape:[[0,0]],upkeep:d.upkeep*.5,levels:B.wellIncome.map(n=>`+${n*.5} Lélek/mp.`)};
  };
  const rows=R.buildingEffectRows;
  R.buildingEffectRows=(c,b)=>{
    if(!undead(c))return rows(c,b);
    const upkeep=(R.undEconomy(c).upkeep.get(b.id)||0).toLocaleString('hu-HU',{maximumFractionDigits:2});
    if(b.type==='und_well')return [['Termelés',`${at(b.level,B.wellIncome)*(R.hasLeg(c,'und_compact_wells') ? .5 : 1)} Lélek/mp`],['Fenntartás',`${upkeep} Lélek/mp`]];
    if(b.type==='und_otherworld_portal')return [['Állapot',c.undPortalEnabled?'Bekapcsolva':'Kikapcsolva'],['Aktív működés',`${Math.floor(c.undeadState?.portalUptime||0)} mp`],['Fenntartás',`${upkeep} Lélek/mp`],['Növekedés',`+${B.portalIncrease} Lélek/mp minden ${B.portalIncreaseEvery} aktív mp után`]];
    return rows(c,b);
  };
  const short=R.buildCardShortDescV41004;
  R.buildCardShortDescV41004=type=>type==='und_well'&&undead(R.P)
    ?`+${at(R.levelOf(R.P,type),B.wellIncome)*(R.hasLeg(R.P,'und_compact_wells') ? .5 : 1)} Lélek/mp. Fenntartás: ${B.wellUpkeep*(R.hasLeg(R.P,'und_compact_wells') ? .5 : 1)} Lélek/mp.`:short(type);
  const description=R.v4UpgradeDescription,details=R.buildingUpgradeDetails;
  const wellUpgrade=(c,type)=>type==='und_well'&&undead(c)?`+${at(Math.min(4,R.levelOf(c,type)+1),B.wellIncome)*(R.hasLeg(c,'und_compact_wells') ? .5 : 1)} Lélek/mp.`:null;
  R.v4UpgradeDescription=(c,type,...args)=>wellUpgrade(c,type)||description(c,type,...args);
  R.buildingUpgradeDetails=(c,type,...args)=>wellUpgrade(c,type)||details(c,type,...args);
  installConvergenceEffects(R);
}
