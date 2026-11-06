const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox','--disable-dev-shm-usage']});
 const report={checks:[],errors:[]};
 const check=(name,ok)=>{assert(ok,name);report.checks.push(name);console.log('PASS',name);};
 try{
  const p=await browser.newPage();await p.route('https://**/*',r=>r.abort());p.on('pageerror',e=>report.errors.push(e.message));
  await p.goto(process.env.ROADLORDS_TEST_URL||'http://127.0.0.1:4173/Roadlords/');await p.waitForFunction(()=>window.__ROADLORDS_RUNTIME__?.aiPreviewChoice);
  await p.evaluate(()=>{
   const R=__ROADLORDS_RUNTIME__;
   window.sharedReset=race=>{
    R.MP.enabled=false;R.ROAD.test=false;R.ROAD.paused=true;R.state.running=false;R.state.modal=false;R.state.pregame=false;R.state.ended=false;R.state.startChoices=0;R.state.time=180;R.state.units=[];R.aiDecisionCache=null;
    R.roadResetCity(R.P,'human');R.roadResetCity(R.E,race);const c=R.E;c.buildings=c.buildings.filter(b=>b.type==='keep');c.terrain.fill(null);
    c.unlocked=new Set(R.aiFactionBuildings(c));R.recomputeCity(c,false);return c;
   };
   window.sharedPut=type=>{const c=R.E;c.resources=R.C(100000,100000,100000);const cell=R.findCell(c,type);if(!cell)throw Error('No plot: '+type);const out=R.placeBuilding(c,type,...cell);if(!out.ok)throw Error(out.reason);return c.buildings.at(-1);};
   window.sharedTick=()=>{R.E.aiThink=0;R.enemyBuildAI(1);};
  });
  for(const race of ['human','orc','undead']){
   check(race+': previews are isolated and do not use RNG or mutate troops/towers/picks',await p.evaluate(race=>{
    const R=__ROADLORDS_RUNTIME__,c=sharedReset(race),producer={human:'barracks',orc:'orc_war',undead:'und_vampire_castle'}[race];sharedPut(producer);
    const snapshot=()=>JSON.stringify({c:R.E,p:R.P,towers:R.towers,units:R.state.units,pending:R.state.pendingChoices});
    const before=snapshot(),random=Math.random;Math.random=()=>{throw Error('AI preview consumed game RNG');};
    try{for(const o of [...R.eligibleNormal(c).map(o=>({...o,kind:'normal'})),...R.buildingUpgradePool(c),...R.eligibleLegendary(c).slice(0,8).map(o=>({...o,kind:'legendary'}))]){
     if(!Number.isFinite(R.scoreAiChoiceV17(o)))return false;
    }}finally{Math.random=random;}
    return R.E===c&&snapshot()===before;
   },race));
   check(race+': the opening invests in income before adding military producers',await p.evaluate(race=>{
    const R=__ROADLORDS_RUNTIME__,c=sharedReset(race);R.state.time=0;c.resources=race==='undead'?R.C(280,0,0):R.C(110,30,20);sharedTick();
    const built=c.buildings.filter(b=>b.type!=='keep');return built.length===1?!!R.aiBuildingMechanics(built[0].type).produces:built.length===0&&!!R.aiBuildingMechanics(c._aiSaveType).produces;
   },race));
   check(race+': the shared AI is inactive in multiplayer',await p.evaluate(race=>{
    const R=__ROADLORDS_RUNTIME__,c=sharedReset(race);c.resources=R.C(1e5,1e5,1e5);R.MP.enabled=true;const before=JSON.stringify(c);sharedTick();R.MP.enabled=false;return JSON.stringify(c)===before;
   },race));
  }
  check('Human ranged damage is valued over HP for an established archer army',await p.evaluate(()=>{
   const R=__ROADLORDS_RUNTIME__,c=sharedReset('human');for(const type of ['lumber','stonecutter','farm','archery','archery','archery'])sharedPut(type);c.resources=R.C(150,150,150);
   return R.scoreAiChoiceV17({kind:'normal',id:'archer_dmg'})>R.scoreAiChoiceV17({kind:'normal',id:'archer_hp'});
  }));
  check('A Vampire economy values Vampire buffs and infection above unrelated Skeleton buffs',await p.evaluate(()=>{
   const R=__ROADLORDS_RUNTIME__,c=sharedReset('undead');for(let n=0;n<4;n++)sharedPut('und_well');R.setBuildingLevel(c,'und_well',4);sharedPut('und_vampire_castle');sharedPut('und_garden_of_dead');c.resources=R.C(1200,0,0);
   const value=id=>R.scoreAiChoiceV17({kind:id.includes('_leg_')?'legendary':'normal',id});
   return value('vampire_common_damage')>value('skeleton_common_damage')&&value('vampire_leg_infection')>value('skeleton_leg_guard');
  }));
  check('The two Garden L4 paths respond to investment in their respective revived unit',await p.evaluate(()=>{
   const R=__ROADLORDS_RUNTIME__,c=sharedReset('undead');sharedPut('und_well');R.setBuildingLevel(c,'und_well',4);sharedPut('und_graveyard');sharedPut('und_garden_of_dead');R.setBuildingLevel(c,'und_garden_of_dead',3);c.resources=R.C(1000,0,0);
   const score=branch=>R.scoreAiChoiceV17({kind:'building_branch',id:'und_garden_of_dead',branch});
   const before=score('raise_vampire')-score('raise_lich');c.normal.vampire_common_damage=15;c.normal.vampire_common_hp=15;c.legends.add('vampire_leg_infection');
   return score('raise_vampire')-score('raise_lich')>before;
  }));
  check('Visible ranged enemies increase the value of a Warg producer',await p.evaluate(()=>{
   const R=__ROADLORDS_RUNTIME__,c=sharedReset('orc');sharedPut('orc_work');sharedPut('orc_hunt');sharedPut('orc_war');const before=R.aiMilitaryScore('orc_warg');
   R.state.units=Array.from({length:20},(_,id)=>({id,key:'archer',side:'player',alive:true,lane:100,tags:['ranged']}));return R.aiMilitaryScore('orc_warg')>before;
  }));
  check('The AI spends a reroll to search a much better available same-tier pool',await p.evaluate(()=>{
   const R=__ROADLORDS_RUNTIME__,c=sharedReset('human');for(const type of ['lumber','stonecutter','farm','archery','archery','archery'])sharedPut(type);
   const options=['priest_hp','catapult_hp','knight_hp','spear_hp'].map(id=>({...R.NORMAL.find(o=>o.id===id),kind:'normal'}));const n=c.rerolls=8;
   R.aiChooseOptions(options,{source:'timer',tier:'common',subtype:null});return c.rerolls===n-1;
  }));
  check('Undead training cannot consume the income reserved for a needed Well indefinitely',await p.evaluate(()=>{
   const R=__ROADLORDS_RUNTIME__,c=sharedReset('undead');
   c.unlocked=new Set(['keep','und_well','und_crypt','und_graveyard','und_vampire_castle']);
   for(const type of ['und_well','und_well','und_vampire_castle','und_graveyard'])sharedPut(type);
   c.resources=R.C(40,0,0);R.aiSaveForBuild('und_well',R.buildPrice(c,'und_well'),'economy');c.undSaveSouls=R.buildPrice(c,'und_well').wood;
   const before=R.buildingOf(c,'und_well').length;R.state.time=200;c.undeadState.lastPaidTraining=0;
   if(R.normalSpawn(c,R.buildingOf(c,'und_vampire_castle')[0]))return false;
   for(let n=0;n<90&&R.buildingOf(c,'und_well').length===before;n++){R.state.time++;R.produceResources(c,1);R.updateSpawners(c,1);sharedTick();R.releaseQueues(1);}
   return R.buildingOf(c,'und_well').length>before&&c.resources.wood>=0&&!c.buildings.some(b=>(b.undStarve||0)>0);
  }));
  check('No shared AI browser errors',report.errors.length===0);
 }finally{fs.mkdirSync('artifacts',{recursive:true});fs.writeFileSync('artifacts/shared-ai.json',JSON.stringify(report,null,2));await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
