const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox','--disable-dev-shm-usage']});
const report={checks:[],errors:[]},check=(name,ok)=>{assert(ok,name);report.checks.push(name);console.log('PASS',name);};
try{const p=await browser.newPage();await p.route('https://**/*',r=>r.abort());p.on('pageerror',e=>report.errors.push(e.message));
await p.goto(process.env.ROADLORDS_TEST_URL||'http://127.0.0.1:4173/Roadlords/');await p.waitForFunction(()=>window.__ROADLORDS_RUNTIME__?.aiPlannedInvestment);
await p.evaluate(()=>{const R=__ROADLORDS_RUNTIME__,towers=structuredClone(R.towers);
 window.policyReset=(race='human',side='enemy')=>{
  Object.assign(R.state,{running:false,time:0,units:[],startChoices:0,pregame:false,ended:false,modal:false});R.state.combatStep++;
  R.MP.enabled=false;R.ROAD.test=false;R.spectator.active=true;R.aiDecisionCache=null;
  R.towers.forEach((t,i)=>Object.assign(t,structuredClone(towers[i])));
  for(const [which,r]of [[side,race],[side==='player'?'enemy':'player','human']]){const city=R.cityForSide(which);R.roadResetCity(city,r);city.terrain.fill(null);R.recomputeCity(city,false);}
  const c=R.cityForSide(side);c.unlocked=new Set(R.aiFactionBuildings(c));return c;
 };
 window.policyPut=(c,type,level=1,row=null,col=null)=>{c.resources=R.C(1e6,1e6,1e6);R.setBuildingLevel(c,type,level);const cell=row==null?R.findCell(c,type):[row,col,0];
  const out=R.placeBuilding(c,type,...cell);if(!out.ok)throw Error(type+': '+out.reason);return out.building;};
 window.policyThought=c=>{const metrics=R.aiPreview(c,()=>{}),battle=R.aiBattleState(c),strategy=R.aiStrategy(c,{metrics,battle,pressure:battle.urgent}),intent=R.aiArmyIntent(c,{metrics,battle,strategy});
  const military=R.aiFactionBuildings(c).filter(t=>c.unlocked.has(t)&&R.BUILDINGS[t]?.unit),growth=R.aiGrowthTargets(c,metrics,battle,military,intent,strategy);
  return {c,metrics,battle,strategy,intent,military,growth,target:growth.target,pressure:battle.urgent,resources:R.aiResourceKeys(c),producers:growth.sources};};
 window.policyFighter=(c,key,d)=>{const u=R.releaseUnit(c,R.makeEntry(c,key));if(!u)throw Error('No fighter '+key);u.lane=R.sideForCity(c)==='player'?d:R.PATH_LENGTH-d;u.roadPrev=u.lane;return u;};
});
check('Shared race reset gives Humans 110 wood and preserves Orc and Undead starts',await p.evaluate(()=>{const R=__ROADLORDS_RUNTIME__;
 return policyReset('human').resources.wood===110&&policyReset('orc').resources.wood===90&&policyReset('undead').resources.wood===280&&R.gameRulesVersion===20;
}));
check('Soul Rift is absent from definitions, unlocks, upgrades and strategic anchors',await p.evaluate(()=>{const R=__ROADLORDS_RUNTIME__,c=policyReset('undead');
 return !R.BUILDINGS.und_soul_rift&&!R.UNLOCKABLE.includes('und_soul_rift')&&![...R.buildingUnlockPool(c),...R.buildingUpgradePool(c)].some(o=>o.id==='und_soul_rift')&&!R.aiStrategyAnchors(c).some(p=>p.anchor.id==='und_soul_rift');
}));
for(const side of ['player','enemy']){
 check(side+': a supplied Vampire build does not recruit Skeletons just because Graveyard is available',await p.evaluate(side=>{
  const R=__ROADLORDS_RUNTIME__,c=policyReset('undead',side);for(let n=0;n<4;n++)policyPut(c,'und_well',4);
  for(let n=0;n<5;n++)policyPut(c,'und_morgue',3);
  policyPut(c,'und_vampire_castle',3);c.normal.vampire_common_damage=10;c.normal.vampire_common_hp=10;c.legends.add('vampire_leg_infection');R.recomputeCity(c,true);
  const ctx=policyThought(c);return ctx.intent.main.key==='und_vampire'&&!ctx.intent.purposes.get('und_graveyard').needed&&!R.aiMilitaryPool(c).includes('und_graveyard');
 },side));
 check(side+': paid forecasts preserve cities, troops, towers, choices and RNG',await p.evaluate(side=>{
  const R=__ROADLORDS_RUNTIME__,c=policyReset('human',side),ctx=policyThought(c),snapshot=()=>JSON.stringify({p:R.P,e:R.E,t:R.towers,u:R.state.units,picks:R.state.pendingChoices}),before=snapshot(),random=Math.random;
  Math.random=()=>{throw Error('Forecast consumed game RNG');};
  try{for(const type of ['lumber','stonecutter','barracks']){const out=R.aiForecastInvestment(c,type,ctx,true);if(out.steps.some(s=>Object.values(s.price).some(x=>x<0)))return false;}}
  finally{Math.random=random;}
  return before===snapshot()&&R.cityForSide(side)===c;
 },side));
}
check('Chosen advanced technology can seed one direction without forcing every available unit',await p.evaluate(()=>{
 const R=__ROADLORDS_RUNTIME__,c=policyReset('orc'),intent=policyThought(c).intent;
 return !R.factionBasics(c.race).includes(intent.main.type)&&[...intent.purposes.values()].filter(p=>p.role==='core').length===1&&[...intent.purposes.values()].filter(p=>p.needed).length===1;
}));
check('The construction budget includes wood needed to build stone and food income',await p.evaluate(()=>{
 const R=__ROADLORDS_RUNTIME__,c=policyReset();c.unlocked=new Set(['keep','lumber','stonecutter','farm','barracks']);const ctx=policyThought(c);
 return ctx.growth.budget.wood>=2*(R.buildPrice(c,'lumber').wood+R.buildPrice(c,'stonecutter').wood+R.buildPrice(c,'farm').wood)&&ctx.growth.goals.includes('barracks');
}));
check('An occupied unique core producer receives one scalable companion when army supply is insufficient',await p.evaluate(()=>{
 const R=__ROADLORDS_RUNTIME__,c=policyReset('undead');policyPut(c,'und_vampire_castle',3);
 c.normal.vampire_common_damage=10;c.normal.vampire_common_hp=10;c.legends.add('vampire_leg_infection');R.recomputeCity(c,true);
 const intent=policyThought(c).intent,companions=[...intent.purposes.values()].filter(o=>o.role==='reinforcement'&&o.needed);
 if(intent.main.key!=='und_vampire'||companions.length!==1||R.isUniqueBuilding(c,companions[0].type))return false;
 for(let n=0;n<5;n++)policyPut(c,companions[0].type,3);
 return ![...policyThought(c).intent.purposes.values()].some(o=>o.role==='reinforcement'&&o.needed);
}));
check('A funded safe opening selects a productive investment rather than obligatory military',await p.evaluate(()=>{
 const R=__ROADLORDS_RUNTIME__,c=policyReset();c.aiThink=0;R.aiStepCity(c,1);
 const built=c.buildings.find(b=>b.type!=='keep')?.type||c._aiSaveType;
 return !!R.aiBuildingMechanics(built).produces&&c._aiInvestment.forecasts<=9;
}));
check('The forecast inserts funding/operating income between economy and its military goal',await p.evaluate(()=>{
 const R=__ROADLORDS_RUNTIME__,c=policyReset();c.unlocked=new Set(['keep','lumber','stonecutter','farm','barracks']);const ctx=policyThought(c),out=R.aiForecastInvestment(c,'lumber',ctx,true);
 return out.steps.length>2&&out.steps.some((s,i)=>i>1&&R.aiBuildingMechanics(s.type).produces)&&out.steps.every(s=>s.at>=0&&s.at<=120);
}));
check('Abundant income cannot justify an extra Well before a funded useful support',await p.evaluate(()=>{
 const R=__ROADLORDS_RUNTIME__,c=policyReset('undead');R.state.time=180;
 c.unlocked=new Set(['keep','und_well','und_graveyard','und_bone_forge','und_crypt']);
 for(let n=0;n<5;n++)policyPut(c,'und_well',4);for(let n=0;n<3;n++)policyPut(c,'und_graveyard');c.resources.wood=10000;
 const plan=R.aiPlanInvestment(c,policyThought(c));if(plan.type!=='und_bone_forge')throw Error(JSON.stringify(plan));
 c.aiThink=0;R.aiStepCity(c,1);const next=R.aiPlanInvestment(c,policyThought(c));
 return R.buildingOf(c,'und_bone_forge').length===1&&!next.goals.includes('und_bone_forge')&&next.type!=='und_well'&&next.type!=='und_bone_forge';
}));
check('Recruitment saturation does not force another core production line',await p.evaluate(()=>{
 const R=__ROADLORDS_RUNTIME__,c=policyReset();for(let n=0;n<8;n++)policyPut(c,'barracks',3);c.normal.swordsman_dmg=12;R.recomputeCity(c,true);
 const intent=policyThought(c).intent;return intent.main.key==='swordsman'&&!intent.purposes.get('barracks').needed;
}));
for(const side of ['player','enemy'])check(side+': a real nearly full army adds field capacity before recruitment gets stuck',await p.evaluate(side=>{
 const R=__ROADLORDS_RUNTIME__,c=policyReset('human',side);R.state.time=240;
 for(const type of ['lumber','stonecutter','farm'])policyPut(c,type,4);policyPut(c,'barracks',3);
 for(let n=0;n<45;n++)policyFighter(c,'swordsman',1200);
 c.garrison=Array.from({length:10},()=>R.makeEntry(c,'swordsman'));c.resources={...c.caps};
 const before=c.armyCap;for(let n=0;n<30&&c.armyCap===before;n++){R.produceResources(c,1);R.state.time++;c.aiThink=0;R.aiStepCity(c,1);}
 return c.armyCap>before&&R.hasBuilding(c,'house');
},side));
check('Waiting is a legal decision when there is no useful legal construction',await p.evaluate(()=>{
 const R=__ROADLORDS_RUNTIME__,c=policyReset();c.terrain.fill({type:'forest'});for(const [r,k]of R.cityBuildingCells(c,c.buildings[0]))c.terrain[R.idx(r,k)]=null;
 return R.aiPlanInvestment(c,policyThought(c)).type===null;
}));
for(const race of ['human','undead'])check(race+': construction savings allow periodic paid recruits without spending the entire income',await p.evaluate(race=>{
 const R=__ROADLORDS_RUNTIME__,c=policyReset(race);R.state.time=240;
 if(race==='human')for(const t of ['lumber','stonecutter','farm'])policyPut(c,t,3);
 else for(let n=0;n<3;n++)policyPut(c,'und_well',3);
 const b=policyPut(c,race==='human'?'barracks':'und_vampire_castle');c.resources=R.C(30,30,30);
 c._aiSaveReason='economy';c._aiSavePrice=R.C(1e6,1e6,1e6);c.undSaveSouls=1e6;
 let recruits=0,paid=0;
 for(let n=0;n<120;n++){R.state.time++;R.produceResources(c,1);c._aiGrowthPlan={time:R.state.time,growing:true,reserve:R.C(1e6,1e6,1e6)};
  const before={...c.resources};if(R.normalSpawn(c,b)){recruits++;paid+=R.RES.reduce((v,r)=>v+before[r]-c.resources[r],0);}}
 return recruits>0&&paid>0&&c.resources.wood>0&&(!c.undeadState||!c.undeadState.lostBuildingIds.length);
},race));
check('An invasion does not award a flat defense-tag bonus to duplicate towers',await p.evaluate(()=>{
 const R=__ROADLORDS_RUNTIME__,c=policyReset('undead');R.state.time=240;
 for(let n=0;n<4;n++)policyPut(c,'und_well',4);policyPut(c,'und_vampire_castle',3);
 for(let n=0;n<10;n++)policyFighter(R.P,'archer',R.PATH_LENGTH-150);
 c.resources.wood=10000;R.state.combatStep++;
 const battle=R.aiBattleState(c);if(!battle.urgent)return false;
 const score=R.aiConstructionOpportunities(c).find(o=>o.type==='und_dark_tower').score;
 // Keep the same city and army, changing only the pressure signal.
 const awareness=R.aiBattleState;
 try{R.aiBattleState=city=>({...awareness(city),urgent:false});
  const calm=R.aiConstructionOpportunities(c).find(o=>o.type==='und_dark_tower').score;
  return Number.isFinite(score)&&score-calm<=25+1e-7;
 }finally{R.aiBattleState=awareness;}
}));
check('A disconnected support is actually demolished after sustained lack of utility',await p.evaluate(()=>{
 const R=__ROADLORDS_RUNTIME__,c=policyReset('orc');R.state.time=600;
 const arena=policyPut(c,'orc_arena',1,0,0);policyPut(c,'orc_work',4,7,0);policyPut(c,'orc_hunt',4,9,0);
 // Useful production away from the Arena makes land scarce; no hypothetical
 // or free replacement is needed for the existing disconnected support.
 for(let row=3;row<9;row++)for(let col=3;col<10;col++)if(R.canPlace(c,'orc_war',row,col,0))policyPut(c,'orc_war',1,row,col);
 c.resources={...c.caps};const ctx={pressure:false,target:R.C()};
 for(let n=0;n<12&&R.getBuilding(c,arena.id);n++){R.state.time+=16;R.aiObserveRedevelopment(c,R.aiPreview(c,()=>{}));R.aiTrimUnproductive(c,ctx);}
 return !R.getBuilding(c,arena.id)&&c._aiTrimmedCount>0;
}));
for(const side of ['player','enemy']){
 check(side+': a funded portal exploits a defended backline opportunity, then ends its pulse',await p.evaluate(side=>{
  const R=__ROADLORDS_RUNTIME__,c=policyReset('undead',side);R.state.time=600;policyPut(c,'und_well',4);policyPut(c,'und_otherworld_portal');c.resources.wood=10000;
  const enemy=R.cityForSide(side==='player'?'enemy':'player'),border=R.PATH_LENGTH/2;
  policyFighter(enemy,'archer',R.PATH_LENGTH-border+50);policyFighter(enemy,'swordsman',R.PATH_LENGTH-border+600);
  for(let n=0;n<8;n++)policyFighter(c,'und_vampire',border-600);
  c.garrison=Array.from({length:12},()=>R.makeEntry(c,'und_vampire'));c.gateMode='closed';
  let ctx=policyThought(c),t=R.aiPortalTactics(c,ctx.battle);if(!t.flank||!t.safe)throw Error(JSON.stringify(t));
  R.aiUpdateBuildingControls(c,ctx);if(!c.undPortalEnabled)return false;
  const u=R.releaseUnit(c,R.makeEntry(c,'und_vampire'));if(u.lane!==R.territoryBoundary())return false;
  R.state.time+=9;R.aiUpdateBuildingControls(c,policyThought(c));return !c.undPortalEnabled&&c._aiPortalOffUntil>R.state.time;
 },side));
}
check('Idle and unaffordable portals stay off; a deep invasion overrides an active pulse',await p.evaluate(()=>{
 const R=__ROADLORDS_RUNTIME__,c=policyReset('undead');R.state.time=600;policyPut(c,'und_otherworld_portal');c.resources.wood=10000;
 R.aiUpdateBuildingControls(c,policyThought(c));if(c.undPortalEnabled)return false;
 c.garrison=Array.from({length:12},()=>R.makeEntry(c,'und_skeleton'));c.resources.wood=0;R.state.time++;
 R.aiUpdateBuildingControls(c,policyThought(c));if(c.undPortalEnabled)return false;
 c.undPortalEnabled=true;policyFighter(R.P,'knight',R.PATH_LENGTH-10);R.state.combatStep++;
 return R.aiProtectPortal(c)&&!c.undPortalEnabled;
}));
check('The investment and control layers never perform AI actions in multiplayer',await p.evaluate(()=>{
 const R=__ROADLORDS_RUNTIME__,c=policyReset('undead');policyPut(c,'und_otherworld_portal');c.garrison=Array.from({length:12},()=>R.makeEntry(c,'und_skeleton'));
 const ctx=policyThought(c);c.aiThink=0;R.MP.enabled=true;const before=JSON.stringify(c);R.aiStepCity(c,1);R.aiUpdateBuildingControls(c,ctx);R.aiTrimUnproductive(c,ctx);R.MP.enabled=false;
 return before===JSON.stringify(c);
}));
check('No investment/control browser errors',report.errors.length===0);
}finally{fs.mkdirSync('artifacts',{recursive:true});fs.writeFileSync('artifacts/ai-investment-policy.json',JSON.stringify(report,null,2));await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
