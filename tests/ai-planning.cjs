const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox','--disable-dev-shm-usage']});
 const report={checks:[],errors:[],plans:[]},check=(name,ok)=>{assert(ok,name);report.checks.push(name);console.log('PASS',name);};
 try{
  const p=await browser.newPage();await p.route('https://**/*',r=>r.abort());p.on('pageerror',e=>report.errors.push(e.message));
  await p.goto(process.env.ROADLORDS_TEST_URL||'http://127.0.0.1:4173/Roadlords/');await p.waitForFunction(()=>window.__ROADLORDS_RUNTIME__?.aiStrategy);
  await p.evaluate(()=>{
   const R=__ROADLORDS_RUNTIME__,towers=structuredClone(R.towers);
   window.planReset=(race,side='enemy')=>{
    R.MP.enabled=false;R.ROAD.test=false;R.ROAD.paused=true;R.spectator.active=true;R.state.running=false;R.$('#pauseBtn').classList.add('on');
    Object.assign(R.state,{modal:false,pregame:false,ended:false,startChoices:0,time:240,units:[],nextPick:20,timedPickCount:4});R.ROAD.clock=240;R.aiDecisionCache=null;
    for(const [c,r]of [[R.P,side==='player'?race:'human'],[R.E,side==='enemy'?race:'human']]){R.roadResetCity(c,r);c.terrain.fill(null);c.unlocked=new Set(R.aiFactionBuildings(c));R.recomputeCity(c,false);}
    R.towers.forEach((t,i)=>Object.assign(t,structuredClone(towers[i])));R.roadRefreshFrontiers();const c=R.cityForSide(side);c.aiThink=0;return c;
   };
   window.planPut=(c,type)=>{c.resources=R.C(1e6,1e6,1e6);const cell=R.findCell(c,type);if(!cell)throw Error('No plot: '+type);const out=R.placeBuilding(c,type,...cell);if(!out.ok)throw Error(out.reason);return out.building;};
   window.planContext=c=>({metrics:R.aiPreview(c,()=>{}),battle:R.aiBattleState(c),pressure:R.aiUnderAttack(c)});
   window.vampirePlan=side=>{
    const c=planReset('undead',side);for(let n=0;n<4;n++)planPut(c,'und_well');R.setBuildingLevel(c,'und_well',4);
    planPut(c,'und_vampire_castle');planPut(c,'und_garden_of_dead');R.setBuildingLevel(c,'und_garden_of_dead',3);
    c.normal.vampire_common_damage=8;c.normal.vampire_common_hp=8;c.normal.garden_chance=4;c.legends.add('vampire_leg_infection');R.recomputeCity(c,true);c.resources=R.C(1500,0,0);return c;
   };
  });
  for(const side of ['player','enemy']){
   check(side+': Vampire investment links common buffs, infection and the actual Vampire Garden branch',await p.evaluate(side=>{
    const R=__ROADLORDS_RUNTIME__,c=vampirePlan(side),s=R.aiStrategy(c,planContext(c));
    if(!s.primary?.units.includes('und_vampire'))throw Error(JSON.stringify(s.primary));
    return s.projections<=16&&R.scoreAiChoice({kind:'building_branch',id:'und_garden_of_dead',branch:'raise_vampire'},c)>
      R.scoreAiChoice({kind:'building_branch',id:'und_garden_of_dead',branch:'raise_lich'},c)&&
      R.scoreAiChoice({kind:'normal',id:'vampire_common_damage'},c)>R.scoreAiChoice({kind:'normal',id:'skeleton_common_damage'},c);
   },side));
   check(side+': multi-step planning is isolated, deterministic and consumes no game RNG',await p.evaluate(side=>{
    const R=__ROADLORDS_RUNTIME__,c=vampirePlan(side),snapshot=()=>JSON.stringify({p:R.P,e:R.E,units:R.state.units,towers:R.towers,picks:R.state.pendingChoices}),before=snapshot(),random=Math.random;
    Math.random=()=>{throw Error('Planning consumed game RNG');};
    try{const s=R.aiStrategy(c,planContext(c));for(const q of s.alternatives)R.aiStrategyProject(c,q,{budget:{remaining:4,used:0}});}
    finally{Math.random=random;}
    return before===snapshot()&&R.cityForSide(side)===c;
   },side));
   check(side+': the projection pays for a Garden and advances through three distinct upgrade offers',await p.evaluate(side=>{
    const R=__ROADLORDS_RUNTIME__,c=planReset('undead',side);for(let n=0;n<4;n++)planPut(c,'und_well');R.setBuildingLevel(c,'und_well',4);planPut(c,'und_vampire_castle');c.resources=R.C(1500,0,0);
    const endpoint=R.aiStrategyAnchors(c).find(p=>p.anchor.id==='und_garden_of_dead'&&p.anchor.branch==='raise_vampire');
    const plan={...endpoint,producer:'und_vampire_castle'},before=JSON.stringify(c),budget={remaining:4,used:0};
    const out=R.aiStrategyProject(c,plan,{budget});
    if(out.actions.length!==4)throw Error(JSON.stringify(out));
    return out.actions[0].kind==='construct'&&out.actions[0].id==='und_garden_of_dead'&&out.actions.slice(1).map(o=>o.level).join(',')==='2,3,4'&&out.confidence>0&&out.confidence<1&&before===JSON.stringify(c);
   },side));
  }
  check('The legendary guarantee does not guarantee a specific desired card',await p.evaluate(()=>{
   const R=__ROADLORDS_RUNTIME__,c=vampirePlan('enemy');c.legends.delete('vampire_leg_infection');c.legendaryDrought=19;
   const p=R.aiStrategyOffer(c,{kind:'legendary',id:'vampire_leg_infection'});return p.chance>0&&p.chance<1&&p.wait>0;
  }));
  check('A card outside the forecast window is not treated as an imminent draw',await p.evaluate(()=>{
   const R=__ROADLORDS_RUNTIME__,c=vampirePlan('enemy');c.legends.delete('vampire_leg_infection');c._aiPickDue=R.state.time+240;
   return R.aiStrategyOffer(c,{kind:'legendary',id:'vampire_leg_infection'}).chance===0;
  }));
  check('An unfunded plan cannot fabricate a producer or spend future income that does not exist',await p.evaluate(()=>{
   const R=__ROADLORDS_RUNTIME__,c=planReset('undead');planPut(c,'und_vampire_castle');c.resources=R.C();
   const endpoint=R.aiStrategyAnchors(c).find(p=>p.anchor.id==='und_soul_rift'),before=JSON.stringify(c);
   const out=R.aiStrategyProject(c,{...endpoint,producer:null},{budget:{remaining:4,used:0}});return out.blocked==='income'&&out.actions.length===1&&before===JSON.stringify(c);
  }));
  check('A chosen L4 branch excludes incompatible future branches from planning',await p.evaluate(()=>{
   const R=__ROADLORDS_RUNTIME__,c=vampirePlan('enemy');R.setBuildingLevel(c,'und_garden_of_dead',4,'raise_lich');
   return !R.aiStrategyAnchors(c).some(p=>p.anchor.id==='und_garden_of_dead'&&p.anchor.branch==='raise_vampire');
  }));
  check('A strong poison investment can replace the earlier Vampire direction',await p.evaluate(()=>{
   const R=__ROADLORDS_RUNTIME__,c=vampirePlan('enemy'),before=R.aiStrategy(c,planContext(c)).primary;
   for(let n=0;n<3;n++)planPut(c,'und_morgue');R.setBuildingLevel(c,'und_morgue',3);planPut(c,'und_plague_chamber');R.setBuildingLevel(c,'und_plague_chamber',3);
   c.normal.zombie_common_poison=20;c.legends.add('und_fast_poison');c.legends.add('und_wandering_plague');R.recomputeCity(c,true);
   R.aiStrategy(c,planContext(c));R.state.time+=100;
   const after=R.aiStrategy(c,planContext(c)).primary;
   if(!after.features.includes('poison')||before.key===after.key)throw Error(JSON.stringify({before,after,alternatives:R.aiStrategyFor(c).alternatives.map(p=>({key:p.key,features:p.features,score:p.score,evidence:p.evidence}))}));return true;
  }));
  check('A human cavalry Barracks plan builds a real adjacent Stable to activate its L4',await p.evaluate(()=>{
   const R=__ROADLORDS_RUNTIME__,c=planReset('human');for(const type of ['lumber','stonecutter','farm']){planPut(c,type);R.setBuildingLevel(c,type,4);}
   const barracks=planPut(c,'barracks');R.setBuildingLevel(c,'barracks',4,'cavalry_barracks');c.normal.knight_dmg=6;c.legends.add('cavalry_charge');c.resources=R.C(1500,1500,1500);
   const s=R.aiStrategy(c,planContext(c));if(!s.primary?.units.includes('knight'))throw Error(JSON.stringify(s.primary));
   for(let n=0;n<5&&!R.hasBuilding(c,'stable');n++){c.aiThink=0;R.aiStepCity(c,1);R.state.time++;}
   return R.buildingOf(c,'stable').some(b=>R.aiBuildingsTouch(c,b,barracks))&&R.effectiveUnitKey(c,barracks)==='knight';
  }));
  check('Orc Warg upgrades and legendary effects produce a cavalry-focused plan',await p.evaluate(()=>{
   const R=__ROADLORDS_RUNTIME__,c=planReset('orc');planPut(c,'orc_work');planPut(c,'orc_hunt');planPut(c,'orc_warg');R.setBuildingLevel(c,'orc_warg',3);c.normal.orc_warg_dmg=8;c.legends.add('orc_predator');
   return R.aiStrategy(c,planContext(c)).primary.units.includes('orc_warg');
  }));
  check('A known cavalry combo can softly reserve the footprint of its still-locked Stable',await p.evaluate(()=>{
   const R=__ROADLORDS_RUNTIME__,c=planReset('human');planPut(c,'barracks');R.setBuildingLevel(c,'barracks',4,'cavalry_barracks');c.unlocked.delete('stable');c.normal.knight_dmg=8;c.legends.add('cavalry_charge');
   const s=R.aiStrategy(c,planContext(c)),reserved=s.reservation,cell=R.findCell(c,'house');
   if(reserved?.type!=='stable'||!cell)throw Error(JSON.stringify(s));
   const cells=R.cityBuildingCells(c,{type:'house',row:cell[0],col:cell[1],rotation:cell[2]});
   return !cells.some(([r,k])=>reserved.cells.some(([rr,kk])=>r===rr&&k===kk));
  }));
  check('A fresh match has no gate hold or reserved plots inherited from the previous faction',await p.evaluate(()=>{
   const R=__ROADLORDS_RUNTIME__;vampirePlan('enemy');R.aiStrategy(R.E,planContext(R.E));const c=planReset('orc');
   const gate=R.aiStrategyGatePolicy(c,{entries:[],total:0,target:10,cap:30,full:false});
   return R.aiStrategyFor(c)===null&&!gate.hold&&gate.target===10;
  }));
  check('Own-territory investment creates a plan connected to territory buildings',await p.evaluate(()=>{
   const R=__ROADLORDS_RUNTIME__,c=planReset('undead');planPut(c,'und_well');R.setBuildingLevel(c,'und_well',4);planPut(c,'und_graveyard');R.setBuildingLevel(c,'keep',4,'dead_realm');c.normal.und_territory=12;c.normal.und_home_march=8;
   const p=R.aiStrategy(c,planContext(c)).primary;return p.features.includes('territory')&&p.goals.some(type=>R.aiBuildingMechanics(type).features?.includes('territory'));
  }));
  check('A near-term useful upgrade can delay a focused wave, with a strict deadline and emergency override',await p.evaluate(()=>{
   const R=__ROADLORDS_RUNTIME__,c=vampirePlan('enemy');R.aiStrategy(c,planContext(c));c._aiPickDue=R.state.time+5;
   const entries=Array.from({length:15},()=>R.makeEntry(c,'und_vampire')),args={entries,total:15,target:10,cap:30,full:false};
   const first=R.aiStrategyGatePolicy(c,args);R.state.time+=13;c._aiPickDue=R.state.time+5;const expired=R.aiStrategyGatePolicy(c,args);
   const other=R.P;for(let n=0;n<15;n++){const u=R.releaseUnit(other,R.makeEntry(other,'catapult'));u.lane=R.PATH_LENGTH-30;}
   R.state.time++;const emergency=R.aiStrategyGatePolicy(c,args);return first.hold&&!expired.hold&&!emergency.hold;
  }));
  check('A slowly formed strategic wave is actually released after the formation deadline',await p.evaluate(()=>{
   const R=__ROADLORDS_RUNTIME__,c=planReset('undead');planPut(c,'und_graveyard');c.legends.add('skeleton_leg_guard');R.recomputeCity(c,true);
   R.aiStrategy(c,planContext(c));c.garrison=Array.from({length:2},()=>R.makeEntry(c,'und_skeleton'));c.gateMode='closed';c._aiPickDue=R.state.time+60;
   R.aiGate(c);if(c.gateMode!=='closed')return false;
   R.state.time+=46;R.aiGate(c);return c.gateMode==='open'&&c.releaseQueue.length===2;
  }));
  check('Strategic planning remains inactive in multiplayer',await p.evaluate(()=>{
   const R=__ROADLORDS_RUNTIME__,c=vampirePlan('enemy');R.MP.enabled=true;const before=JSON.stringify(c),out=R.aiStrategy(c,planContext(c));R.aiStepCity(c,1);R.MP.enabled=false;return out===null&&before===JSON.stringify(c);
  }));
  check('No strategy-planning runtime errors',report.errors.length===0);
 }finally{fs.mkdirSync('artifacts',{recursive:true});fs.writeFileSync('artifacts/ai-planning.json',JSON.stringify(report,null,2));await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
