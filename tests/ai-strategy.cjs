const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox','--disable-dev-shm-usage']});
 const report={checks:[],errors:[]},check=(name,value)=>{assert(value,name);report.checks.push(name);console.log('PASS',name);};
 try {
  const p=await browser.newPage();await p.route('https://**/*',r=>r.abort());p.on('pageerror',e=>report.errors.push(e.message));
  await p.goto(process.env.ROADLORDS_TEST_URL||'http://127.0.0.1:4173/Roadlords/');await p.waitForFunction(()=>window.__ROADLORDS_RUNTIME__?.aiSaveForBuild);
  await p.evaluate(()=>{
   const R=__ROADLORDS_RUNTIME__;
   window.strategyReset=race=>{R.MP.enabled=false;R.state.running=false;R.state.units=[];R.state.time=180;R.state.pregame=false;R.state.ended=false;R.state.startChoices=0;R.aiDecisionCache=null;R.roadResetCity(R.E,race);const c=R.E;c.buildings=c.buildings.filter(b=>b.type==='keep');c.terrain.fill(null);R.recomputeCity(c,true);return c;};
   window.strategyPut=type=>{const c=R.E;c.resources=R.C(1e6,1e6,1e6);const cell=R.findCell(c,type);if(!cell)throw Error('No placement: '+type);const out=R.placeBuilding(c,type,...cell,true);if(!out.ok)throw Error(out.reason);return c.buildings.at(-1);};
   window.strategyTick=()=>{R.E.aiThink=0;R.enemyBuildAI(1);};
   window.strategyOrc=()=>{const c=strategyReset('orc');c.unlocked=new Set(['keep','orc_work','orc_hunt','warehouse','orc_war','orc_hut','orc_warg']);for(const type of ['orc_work','orc_work','orc_hunt','orc_hunt','orc_hunt','warehouse','warehouse','warehouse','warehouse','orc_war','orc_war','orc_war'])strategyPut(type);R.setBuildingLevel(c,'orc_work',4);R.setBuildingLevel(c,'orc_hunt',4);return c;};
  });
  check('Orc AI saves for an unlocked Warg producer instead of buying another affordable Warrior camp',await p.evaluate(()=>{
   const R=__ROADLORDS_RUNTIME__,c=strategyOrc();c.resources=R.C(50,50,100);const n=c.buildings.length;strategyTick();
   return c.buildings.length===n&&c._aiSaveType==='orc_warg'&&c._aiSaveReason==='military';
  }));
  check('The investment survives a growth tick and produces the selected Warg camp once funded',await p.evaluate(()=>{
   const R=__ROADLORDS_RUNTIME__,c=R.E,since=c._aiSaveSince;R.state.time++;strategyTick();
   if(c._aiSaveType!=='orc_warg'||c._aiSaveSince!==since)return false;
   c.resources=R.C(10000,10000,10000);strategyTick();return R.buildingOf(c,'orc_warg').length===1&&!c._aiSavePrice;
  }));
  check('Saving for military investment slows existing training without stopping it indefinitely',await p.evaluate(()=>{
   const R=__ROADLORDS_RUNTIME__,c=strategyOrc(),b=R.buildingOf(c,'orc_war')[0];c.resources=R.C(100,100,100);R.aiSaveForBuild('orc_warg',R.C(300,300),'military');
   const first=R.normalSpawn(c,b),blocked=!R.normalSpawn(c,b);R.state.time+=Math.max(8,R.trainingTime(c,b)*2)+.01;
   return first&&blocked&&R.normalSpawn(c,b);
  }));
  check('Orc Arena receives a purchase turn and actually touches existing producers',await p.evaluate(()=>{
   const R=__ROADLORDS_RUNTIME__,c=strategyOrc();c.unlocked.add('orc_arena');c.resources=R.C(10000,10000,10000);strategyTick();
   const arena=R.buildingOf(c,'orc_arena')[0];return !!arena&&R.activeSpawners(c).some(b=>R.aiSupportAffects(c,arena,b));
  }));
  check('Visible ranged enemies increase investment in Warg riders through a real AI decision',await p.evaluate(()=>{
   const R=__ROADLORDS_RUNTIME__,c=strategyOrc();strategyPut('orc_warg');c.resources=R.C(10000,10000,10000);
   R.state.units=Array.from({length:20},(_,id)=>({id,key:'archer',alive:true,side:'player',lane:100,tags:['ranged']}));strategyTick();return R.buildingOf(c,'orc_warg').length===2;
  }));
  check('The opening attack leaves with a useful smaller army rather than waiting for 30 recruits',await p.evaluate(()=>{
   const R=__ROADLORDS_RUNTIME__,c=strategyReset('human');strategyPut('barracks');c.garrison=Array.from({length:12},()=>R.makeEntry(c,'swordsman'));c.gateMode='closed';R.enemyGateAI();return c.gateMode==='open'&&c.releaseQueue.length===12;
  }));
  check('Existing front-line troops receive a reinforcement group after 25 seconds',await p.evaluate(()=>{
   const R=__ROADLORDS_RUNTIME__,c=strategyReset('human');strategyPut('barracks');c._aiLastWave={time:R.state.time-26};
   R.state.units=Array.from({length:8},(_,id)=>({id,key:'swordsman',alive:true,side:'enemy',lane:1000}));c.garrison=Array.from({length:6},()=>R.makeEntry(c,'swordsman'));c.gateMode='closed';R.enemyGateAI();return c.gateMode==='open'&&c.releaseQueue.length===6;
  }));
  check('Undead support investment is considered before another duplicate military producer',await p.evaluate(()=>{
   const R=__ROADLORDS_RUNTIME__,c=strategyReset('undead');c.unlocked.add('und_bone_forge');for(let n=0;n<5;n++)strategyPut('und_well');R.setBuildingLevel(c,'und_well',4);for(let n=0;n<3;n++)strategyPut('und_graveyard');c.resources=R.C(10000,0,0);strategyTick();
   return R.buildingOf(c,'und_bone_forge').length===1&&R.buildingOf(c,'und_graveyard').length===3;
  }));
  check('Undead AI does not buy a Hatchery that would affect only excluded Graveyards',await p.evaluate(()=>{
   const R=__ROADLORDS_RUNTIME__,c=strategyReset('undead');c.unlocked.add('und_corrupted_hatchery');for(let n=0;n<5;n++)strategyPut('und_well');R.setBuildingLevel(c,'und_well',4);for(let n=0;n<3;n++)strategyPut('und_graveyard');c.resources=R.C(10000,0,0);strategyTick();return !R.hasBuilding(c,'und_corrupted_hatchery');
  }));
  check('Undead redevelopment has a real cooldown and cannot demolish Wells on consecutive turns',await p.evaluate(()=>{
   const R=__ROADLORDS_RUNTIME__,c=strategyReset('undead');for(let row=0;row<R.GRID;row++)for(let col=0;col<R.GRID;col++)if(!R.occupancy(c).has(R.idx(row,col))){c.resources=R.C(1e6,0,0);if(!R.placeBuilding(c,'und_well',row,col,0,true).ok)return false;}R.setBuildingLevel(c,'und_well',4);c.resources=R.C(1e6,0,0);
   if(!R.aiMakeRoomFor('und_graveyard')||!R.aiBuild('und_graveyard'))return false;
   if(R.aiMakeRoomFor('und_graveyard')||c.undeadState.aiRedeveloped!==1)return false;
   R.state.time+=15;return R.aiMakeRoomFor('und_graveyard')&&c.undeadState.aiRedeveloped===2;
  }));
  check('Full warehouses reduce expansion demand while preserving current training coverage',await p.evaluate(()=>{
   const R=__ROADLORDS_RUNTIME__,c=strategyReset('human');strategyPut('barracks');const use=R.consumptionRates(c);c.resources=R.C();const low=R.aiResourceTargets();c.resources={...c.caps};const full=R.aiResourceTargets();return R.RES.every(k=>full[k]<low[k]&&full[k]>=use[k]);
  }));
  check('The AI does not spend or place buildings in multiplayer',await p.evaluate(()=>{const R=__ROADLORDS_RUNTIME__,c=strategyOrc();c.resources=R.C(10000,10000,10000);const before=JSON.stringify([c.resources,c.buildings]);R.MP.enabled=true;strategyTick();const same=JSON.stringify([c.resources,c.buildings])===before;R.MP.enabled=false;return same;}));
  check('No AI strategy runtime errors',!report.errors.length);
 } finally {fs.mkdirSync('artifacts',{recursive:true});fs.writeFileSync('artifacts/ai-strategy.json',JSON.stringify(report,null,2));await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
