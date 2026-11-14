const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox','--disable-dev-shm-usage']});
 const report={checks:[],errors:[]},check=(name,ok)=>{assert(ok,name);report.checks.push(name);console.log('PASS',name);};
 try{
  const p=await browser.newPage();await p.route('https://**/*',r=>r.abort());p.on('pageerror',e=>report.errors.push(e.message));
  await p.goto(process.env.ROADLORDS_TEST_URL||'http://127.0.0.1:4173/Roadlords/');await p.waitForFunction(()=>window.__ROADLORDS_RUNTIME__?.aiFindRedevelopment);
  await p.evaluate(()=>{
   const R=__ROADLORDS_RUNTIME__;
   window.rebuildReset=(race='orc',side='enemy')=>{
    R.MP.enabled=false;R.ROAD.test=false;R.spectator.active=true;R.aiDecisionCache=null;
    Object.assign(R.state,{running:false,time:600,units:[],startChoices:0,pregame:false,ended:false,modal:false});R.state.combatStep++;
    const c=R.cityForSide(side);R.roadResetCity(c,race);c.terrain.fill(null);c.unlocked=new Set(R.aiFactionBuildings(c));
    R.setBuildingLevel(c,'keep',4,race==='human'?'empire':race==='orc'?'orc_command':'dead_realm');c.resources={...c.caps};return c;
   };
   window.rebuildPut=(c,type,row,col,level=1)=>{
    c.levels[type]=level;for(const b of c.buildings)if(b.type===type)b.level=level;
    c.resources=R.C(1e6,1e6,1e6);const out=R.placeBuilding(c,type,row,col,0);if(!out.ok)throw Error(type+': '+out.reason);return out.building;
   };
   window.rebuildHistory=c=>{
    for(let i=0;i<=6;i++){R.state.time+=5;c.resources={...c.caps};R.aiObserveRedevelopment(c,R.aiPreview(c,()=>{}));}
   };
   window.campBoard=(side='enemy',victim='orc_work')=>{
    const c=rebuildReset('orc',side);c.terrain.fill({type:'forest'});
    for(const [r,k]of R.cityBuildingCells(c,c.buildings[0]))c.terrain[R.idx(r,k)]=null;
    for(let r=0;r<3;r++)for(let k=0;k<2;k++)c.terrain[R.idx(r,k)]=null;
    rebuildPut(c,victim,0,0);rebuildPut(c,victim,1,0);rebuildPut(c,'orc_war',2,0);
    c.levels.orc_arena=4;c.resources={...c.caps};return c;
   };
  });
  for(const side of ['player','enemy']){
   check(side+': one funded Arena replaces two Work Camps in a single real turn',await p.evaluate(side=>{
    const R=__ROADLORDS_RUNTIME__,c=campBoard(side);rebuildHistory(c);
    const plan=R.aiFindRedevelopment(c,{type:'orc_arena'});
    if(!plan)throw Error('No Arena replacement');
    const before=R.aiPreview(c,()=>{}),cash={...c.resources},capital=c.buildings.find(b=>b.type==='keep').id;
    if(plan.ids.length!==2||!R.aiExecuteRedevelopment(c,plan))throw Error(JSON.stringify(plan));
    const after=R.aiPreview(c,()=>{});
    return R.buildingOf(c,'orc_work').length===0&&R.buildingOf(c,'orc_arena').length===1&&R.getBuilding(c,capital)&&
     after.power>before.power&&R.RES.every(r=>after.gain[r]>=after.use[r]&&c.resources[r]>=0)&&c._matchStats.demolishedByType.orc_work===2&&c.resources.stone<cash.stone;
   },side));
  }
  check('Surplus storage buildings can be exchanged for combat support',await p.evaluate(()=>{
   const R=__ROADLORDS_RUNTIME__,c=campBoard('enemy','warehouse');rebuildHistory(c);
   const plan=R.aiFindRedevelopment(c,{type:'orc_arena'});return !!plan&&R.aiExecuteRedevelopment(c,plan)&&!R.hasBuilding(c,'warehouse')&&R.hasBuilding(c,'orc_arena');
  }));
  check('Obsolete military producers can be exchanged for support of the retained army',await p.evaluate(()=>{
   const R=__ROADLORDS_RUNTIME__,c=rebuildReset();c.terrain.fill({type:'forest'});
   for(const [r,k]of R.cityBuildingCells(c,c.buildings[0]))c.terrain[R.idx(r,k)]=null;
   for(let r=0;r<3;r++)for(let k=0;k<2;k++)c.terrain[R.idx(r,k)]=null;
   for(let row=0;row<2;row++)for(let col=0;col<2;col++)rebuildPut(c,'orc_gob',row,col).inactive=true;
   rebuildPut(c,'orc_war',2,0);c.levels.orc_arena=4;rebuildHistory(c);
   const plan=R.aiFindRedevelopment(c,{type:'orc_arena'});
   return plan?.ids.length===4&&R.aiExecuteRedevelopment(c,plan)&&!R.hasBuilding(c,'orc_gob')&&R.hasBuilding(c,'orc_war');
  }));
  check('Unused capacity can be exchanged without touching troops or the capital',await p.evaluate(()=>{
   const R=__ROADLORDS_RUNTIME__,c=rebuildReset();c.terrain.fill({type:'forest'});
   for(const [r,k]of R.cityBuildingCells(c,c.buildings[0]))c.terrain[R.idx(r,k)]=null;
   for(let r=0;r<4;r++)for(let k=0;k<2;k++)c.terrain[R.idx(r,k)]=null;
   rebuildPut(c,'orc_hut',0,0);rebuildPut(c,'orc_war',2,0);c.levels.orc_arena=4;rebuildHistory(c);
   const plan=R.aiFindRedevelopment(c,{type:'orc_arena'});return plan?.ids.some(id=>R.getBuilding(c,id)?.type==='orc_hut')&&R.aiExecuteRedevelopment(c,plan)&&!R.hasBuilding(c,'orc_hut');
  }));
  check('A misplaced nonstacking support relocates to cover the real producers',await p.evaluate(()=>{
   const R=__ROADLORDS_RUNTIME__,c=rebuildReset();
   rebuildPut(c,'orc_arena',0,0,4);for(const [row,col]of [[5,0],[6,0],[8,0],[9,0]])rebuildPut(c,'orc_war',row,col);
   rebuildHistory(c);const before=R.aiPreview(c,()=>{}).power,old=R.buildingOf(c,'orc_arena')[0].id;
   const diagnostics=[],plan=R.aiFindRedevelopment(c,{type:'orc_arena',diagnostics});
   if(!plan)throw Error(JSON.stringify({reason:'No Arena relocation',diagnostics}));
   const out=R.aiExecuteRedevelopment(c,plan),count=R.buildingOf(c,'orc_arena').length,after=R.aiPreview(c,()=>{}).power;
   if(!(plan.ids.includes(old)&&out&&count===1&&after>before))throw Error(JSON.stringify({plan,old,out,count,before,after}));return true;
  }));
  for(const race of ['human','undead']){
   check(race+': unique local support can relocate without being duplicated',await p.evaluate(race=>{
    const R=__ROADLORDS_RUNTIME__,c=rebuildReset(race),type=race==='human'?'armorsmith':'und_soul_anchor';
    const support=rebuildPut(c,type,0,8,4);
    if(race==='human')c.l4Branches.armorsmith='heavy_armor';
    if(race==='human')for(const [row,col]of [[5,0],[6,0],[8,0],[9,0]])rebuildPut(c,'barracks',row,col);
    else{R.setBuildingLevel(c,'keep',1);rebuildPut(c,'und_well',0,0);
      for(const [row,col]of [[5,0],[5,1],[6,0],[6,1],[8,0],[8,1],[9,0],[9,1]])rebuildPut(c,'und_dark_tower',row,col);
      rebuildPut(c,'und_graveyard',9,3);}
    rebuildHistory(c);const plan=R.aiFindRedevelopment(c,{type});
    if(!plan)throw Error('No relocation for '+type);
    return plan.ids.includes(support.id)&&R.aiExecuteRedevelopment(c,plan)&&R.buildingOf(c,type).length===1&&!R.getBuilding(c,support.id);
   },race));
  }
  check('A useless support can be replaced by an actual military producer',await p.evaluate(()=>{
   const R=__ROADLORDS_RUNTIME__,c=rebuildReset();c.terrain.fill({type:'forest'});
   for(const [r,k]of R.cityBuildingCells(c,c.buildings[0]))c.terrain[R.idx(r,k)]=null;
   for(let row=0;row<2;row++)for(let col=0;col<2;col++)c.terrain[R.idx(row,col)]=null;
   rebuildPut(c,'orc_arena',0,0);rebuildHistory(c);const plan=R.aiFindRedevelopment(c,{type:'orc_war'});
   return !!plan&&R.aiExecuteRedevelopment(c,plan)&&R.hasBuilding(c,'orc_war')&&!R.hasBuilding(c,'orc_arena');
  }));
  check('A unique military producer can move into effective armor support',await p.evaluate(()=>{
   // Match the old production value with an established producer after the slower training patch.
   const R=__ROADLORDS_RUNTIME__,c=rebuildReset('human'),old=rebuildPut(c,'magetower',0,0,3);
   rebuildPut(c,'armorsmith',5,0,4);c.l4Branches.armorsmith='heavy_armor';rebuildHistory(c);
   const plan=R.aiFindRedevelopment(c,{type:'magetower'});
   return plan?.ids.includes(old.id)&&R.aiExecuteRedevelopment(c,plan)&&R.buildingOf(c,'magetower').length===1&&R.armorSmithForSpawner(c,R.buildingOf(c,'magetower')[0]);
  }));
  check('A storage replacement can unlock an otherwise unaffordable construction goal',await p.evaluate(()=>{
   const R=__ROADLORDS_RUNTIME__,c=campBoard();R.setBuildingLevel(c,'keep',1);rebuildHistory(c);
   c._aiSaveType='orc_troll';c._aiSavePrice=R.C(500,500);c._aiSaveCapacityPrice={...c._aiSavePrice};
   const before=c.caps.wood,plan=R.aiFindRedevelopment(c,{type:'warehouse'});
   return !!plan&&R.aiExecuteRedevelopment(c,plan)&&c.caps.wood>before&&R.hasBuilding(c,'warehouse');
  }));
  check('A full field army can trade surplus economy for useful army capacity',await p.evaluate(()=>{
   const R=__ROADLORDS_RUNTIME__,c=campBoard();
   const cap=c.armyCap;for(let i=0;i<cap;i++)if(!R.releaseUnit(c,R.makeEntry(c,'orc_warrior')))return false;
   rebuildHistory(c);const count=R.fieldUnitCount(c),plan=R.aiFindRedevelopment(c,{type:'orc_hut'});
   return !!plan&&R.aiExecuteRedevelopment(c,plan)&&c.armyCap>cap&&R.fieldUnitCount(c)===count;
  }));
  check('An income repair can replace several redundant defensive buildings',await p.evaluate(()=>{
   const R=__ROADLORDS_RUNTIME__,c=rebuildReset('undead');R.setBuildingLevel(c,'keep',1);
   c.terrain.fill({type:'forest'});for(const [r,k]of R.cityBuildingCells(c,c.buildings[0]))c.terrain[R.idx(r,k)]=null;
   for(let row=0;row<2;row++)for(let col=0;col<2;col++){c.terrain[R.idx(row,col)]=null;rebuildPut(c,'und_dark_tower',row,col);}
   rebuildHistory(c);const before=R.aiPreview(c,()=>{}),plan=R.aiFindRedevelopment(c,{type:'und_well'});
   return plan?.ids.length===4&&R.aiExecuteRedevelopment(c,plan)&&R.productionRates(c).wood>before.gain.wood&&!R.hasBuilding(c,'und_dark_tower');
  }));
  check('Uncapped Souls and overflow-damage builds are never classified as wasted income',await p.evaluate(()=>{
   const R=__ROADLORDS_RUNTIME__;let c=rebuildReset('undead');rebuildPut(c,'und_well',0,0,4);rebuildHistory(c);
   if(R.aiObserveRedevelopment(c,R.aiPreview(c,()=>{})).surplus.wood!==0)return false;
   c=rebuildReset('human');rebuildPut(c,'lumber',0,0,4);c.legends.add('overproduction');rebuildHistory(c);
   return R.aiObserveRedevelopment(c,R.aiPreview(c,()=>{})).surplus.wood===0;
  }));
  check('Economic producers retain their free military role under civilian militia',await p.evaluate(()=>{
   const R=__ROADLORDS_RUNTIME__,c=rebuildReset('human');rebuildPut(c,'farm',0,0);c.legends.add('arm_the_people');
   const m=R.aiPreview(c,()=>{},R.aiRedevelopmentMeasure);
   return m.power>0&&m.units.swordsman?.rate>0;
  }));
  check('Market conversions count toward funding the army when a resource runs short',await p.evaluate(()=>{
   const R=__ROADLORDS_RUNTIME__,c=rebuildReset('human');R.setBuildingLevel(c,'keep',1);
   rebuildPut(c,'market',0,0,4);rebuildPut(c,'lumber',3,0,4);rebuildPut(c,'lumber',4,0,4);
   for(const [row,col]of [[6,0],[7,0],[8,0],[9,0]])rebuildPut(c,'barracks',row,col,4);
   c.resources={...c.caps};const plain=R.aiPreview(c,()=>{}),market=R.aiPreview(c,()=>{},R.aiRedevelopmentMeasure);
   return market.gain.stone>plain.gain.stone&&market.gain.food>plain.gain.food;
  }));
  check('Occupied garrison capacity and the last required economic source are protected',await p.evaluate(()=>{
   const R=__ROADLORDS_RUNTIME__,c=campBoard('enemy','warehouse');rebuildHistory(c);
   c.garrison=Array.from({length:c.garrisonCap},()=>R.makeEntry(c,'orc_warrior'));
   // Removing a reserve-providing hut must not shrink below the actual entries.
   const before=R.aiPreview(c,()=>{},R.aiRedevelopmentMeasure),after={...before,mainCap:before.mainCap-1};
   const state=R.aiObserveRedevelopment(c,before),plan={price:R.C(),cashLost:R.C(),ids:[],type:'orc_arena'};
   if(R.aiRedevelopmentSafe(c,before,after,plan,state))return false;
   const starving={...before,gain:R.C(0,0,0)};
   return !R.aiRedevelopmentSafe(c,before,starving,plan,state);
  }));
  check('Cooldown and type memory prevent an immediate reverse rebuild',await p.evaluate(()=>{
   const R=__ROADLORDS_RUNTIME__,c=campBoard();rebuildHistory(c);const plan=R.aiFindRedevelopment(c,{type:'orc_arena'});
   if(!plan||!R.aiExecuteRedevelopment(c,plan))return false;
   if(R.aiFindRedevelopment(c,{type:'orc_work'})||R.aiExecuteRedevelopment(c,plan))return false;
   R.state.time+=46;c.resources={...c.caps};
   return !R.aiFindRedevelopment(c,{type:'orc_work'});
  }));
  check('Paid previews neither mutate the cities/towers/units nor consume game RNG',await p.evaluate(()=>{
   const R=__ROADLORDS_RUNTIME__,c=campBoard();rebuildHistory(c);
   const snapshot=()=>JSON.stringify([R.P,R.E,R.towers,R.state.units,R.state.pendingChoices]),before=snapshot(),random=Math.random;
   Math.random=()=>{throw Error('Redevelopment preview used RNG');};
   try{const plan=R.aiFindRedevelopment(c,{type:'orc_arena'});return !!plan&&snapshot()===before;}
   finally{Math.random=random;}
  }));
  check('Construction preserves trained reserve entries including their veteran data',await p.evaluate(()=>{
   const R=__ROADLORDS_RUNTIME__,c=campBoard();c.garrison=[R.makeEntry(c,'orc_warrior',{veteran:true}),R.makeEntry(c,'orc_troll')];
   rebuildHistory(c);const before=JSON.stringify(c.garrison),plan=R.aiFindRedevelopment(c,{type:'orc_arena'});
   return !!plan&&R.aiExecuteRedevelopment(c,plan)&&JSON.stringify(c.garrison)===before;
  }));
  check('Unaffordable replacements never demolish buildings in expectation of refunds',await p.evaluate(()=>{
   const R=__ROADLORDS_RUNTIME__,c=campBoard();rebuildHistory(c);c.resources=R.C();const before=JSON.stringify(c.buildings);
   return !R.aiFindRedevelopment(c,{type:'orc_arena'})&&JSON.stringify(c.buildings)===before;
  }));
  check('A changed board invalidates a stale plan before any demolition',await p.evaluate(()=>{
   const R=__ROADLORDS_RUNTIME__,c=campBoard();rebuildHistory(c);const plan=R.aiFindRedevelopment(c,{type:'orc_arena'});if(!plan)return false;
   c.buildings=c.buildings.filter(b=>b.id!==plan.ids[0]);R.recomputeCity(c,true);const before=JSON.stringify(c);
   return !R.aiExecuteRedevelopment(c,plan)&&JSON.stringify(c)===before;
  }));
  check('Failed paid construction restores the complete original city and tower state',await p.evaluate(()=>{
   const R=__ROADLORDS_RUNTIME__,c=campBoard();rebuildHistory(c);const plan=R.aiFindRedevelopment(c,{type:'orc_arena'});if(!plan)return false;
   const before=JSON.stringify([c,R.towers]),place=R.placeBuilding;R.placeBuilding=()=>({ok:false});
   try{return !R.aiExecuteRedevelopment(c,plan)&&JSON.stringify([c,R.towers])===before;}
   finally{R.placeBuilding=place;}
  }));
  check('An invasion or multiplayer disables both planning and execution',await p.evaluate(()=>{
   const R=__ROADLORDS_RUNTIME__,c=campBoard();rebuildHistory(c);const plan=R.aiFindRedevelopment(c,{type:'orc_arena'});if(!plan)return false;
   const before=JSON.stringify(c),under=R.aiUnderAttack;R.aiUnderAttack=()=>true;
   try{if(R.aiFindRedevelopment(c,{type:'orc_arena'})||R.aiExecuteRedevelopment(c,plan))return false;}finally{R.aiUnderAttack=under;}
   R.MP.enabled=true;try{return !R.aiFindRedevelopment(c,{type:'orc_arena'})&&!R.aiExecuteRedevelopment(c,plan)&&JSON.stringify(c)===before;}finally{R.MP.enabled=false;}
  }));
  check('A new match has no inherited surplus, construction cooldown or replacement history',await p.evaluate(()=>{
   const R=__ROADLORDS_RUNTIME__;let c=campBoard();rebuildHistory(c);const p=R.aiFindRedevelopment(c,{type:'orc_arena'});if(!p||!R.aiExecuteRedevelopment(c,p))return false;
   c=campBoard();return R.aiObserveRedevelopment(c,R.aiPreview(c,()=>{})).surplus.wood===0&&!!R.aiFindRedevelopment(c,{type:'orc_arena'});
  }));
  check('Search obeys its projection budget even when many placements exist',await p.evaluate(()=>{
   const R=__ROADLORDS_RUNTIME__,c=campBoard();rebuildHistory(c);const project=R.aiProjectRedevelopment;let calls=0;
   R.aiProjectRedevelopment=(...args)=>{calls++;return project(...args);};
   try{const plan=R.aiFindRedevelopment(c,{type:'orc_arena',budget:1});return !!plan&&calls===1&&plan.previews===1;}
   finally{R.aiProjectRedevelopment=project;}
  }));
  check('Additional army capacity has no expansion reward at the actor ceiling',await p.evaluate(()=>{
   const R=__ROADLORDS_RUNTIME__,c=campBoard();rebuildHistory(c);
   const before=R.aiPreview(c,()=>{},R.aiRedevelopmentMeasure);before.passive=R.aiRedevelopmentPassive(c,before);
   const after={...before,armyCap:before.armyCap+100},plan={type:'orc_hut',ids:[],price:R.C(),cashLost:R.C()},history=R.aiObserveRedevelopment(c,before);
   const room=R.battlePopulationRoom;
   try{R.battlePopulationRoom=()=>0;const full=R.aiRedevelopmentValue(c,before,after,plan,history);
    R.battlePopulationRoom=()=>Infinity;return R.aiRedevelopmentValue(c,before,after,plan,history)>full+.1;
   }finally{R.battlePopulationRoom=room;}
  }));
  check('Efficient accumulated income is retained ahead of obsolete Work Camps',await p.evaluate(()=>{
   const R=__ROADLORDS_RUNTIME__,c=rebuildReset();c.terrain.fill({type:'forest'});
   for(const [r,k]of R.cityBuildingCells(c,c.buildings[0]))c.terrain[R.idx(r,k)]=null;
   for(let row=0;row<3;row++)for(let col=0;col<4;col++)c.terrain[R.idx(row,col)]=null;
   const slave=rebuildPut(c,'orc_slave',0,0,4);c.l4Branches.orc_slave='forced_labor';c.orcSupport={...c.orcSupport,slaveKills:2000};
   rebuildPut(c,'orc_work',0,2,4);rebuildPut(c,'orc_work',1,2,4);rebuildPut(c,'orc_war',2,1);
   c.levels.orc_arena=4;rebuildHistory(c);const plan=R.aiFindRedevelopment(c,{type:'orc_arena'});
   return !!plan&&!plan.ids.includes(slave.id)&&R.aiExecuteRedevelopment(c,plan)&&R.hasBuilding(c,'orc_slave')&&!R.hasBuilding(c,'orc_work')&&c.orcSupport.slaveKills===2000;
  }));
  check('Discarded high output does not hide obsolete producers behind useful troops',await p.evaluate(()=>{
   const R=__ROADLORDS_RUNTIME__,c=campBoard();
   for(let row=0;row<2;row++)for(let col=3;col<5;col++){
    c.terrain[R.idx(row,col)]=null;rebuildPut(c,'orc_gob',row,col);
   }
   rebuildHistory(c);const diagnostics=[],plan=R.aiFindRedevelopment(c,{type:'orc_arena',diagnostics}),first=diagnostics[0];
   // The economic trade still has to be profitable before it may execute.
   return first?.safe&&first.ids.length===2&&first.ids.every(id=>R.getBuilding(c,id)?.type==='orc_work')&&
    (!plan||R.aiExecuteRedevelopment(c,plan))&&R.buildingOf(c,'orc_gob').length===4;
  }));
  check('Global buildings never move just to create misleading empty-space profit',await p.evaluate(()=>{
   const R=__ROADLORDS_RUNTIME__,c=rebuildReset('human');rebuildPut(c,'mastersguild',0,0,4);
   for(let row=0;row<4;row++)rebuildPut(c,'barracks',row,3);rebuildHistory(c);
   return !R.aiFindRedevelopment(c,{type:'mastersguild'});
  }));
  check('A global support may relocate when Town Hall actually doubles its effect',await p.evaluate(()=>{
   const R=__ROADLORDS_RUNTIME__,c=rebuildReset('human'),old=rebuildPut(c,'mastersguild',0,0,4);
   rebuildPut(c,'townhall',6,0,2);
   for(let row=0;row<3;row++)for(let col=4;col<10;col++)if(R.canPlace(c,'farm',row,col,0))rebuildPut(c,'farm',row,col);
   rebuildHistory(c);const plan=R.aiFindRedevelopment(c,{type:'mastersguild'});
   return plan?.ids.includes(old.id)&&R.aiExecuteRedevelopment(c,plan)&&R.townhallPower(c,R.buildingOf(c,'mastersguild')[0])===2;
  }));
  check('The real shared AI proactively redesigns a full city without a manual request',await p.evaluate(()=>{
   const R=__ROADLORDS_RUNTIME__,c=rebuildReset();
   for(const [row,col]of [[2,0],[5,0],[8,0]])rebuildPut(c,'orc_war',row,col);
   for(let row=0;row<10;row++)for(let col=0;col<10;col++)if(R.canPlace(c,'orc_work',row,col,0))rebuildPut(c,'orc_work',row,col);
   for(let row=0;row<10;row++)for(let col=0;col<10;col++)if(R.canPlace(c,'orc_hunt',row,col,0))rebuildPut(c,'orc_hunt',row,col);
   c.levels.orc_arena=4;rebuildHistory(c);
   for(let n=0;n<60&&!c._aiRedevelopCount;n++){
    R.state.time+=5;R.state.combatStep++;c.resources={...c.caps};c.aiThink=0;R.aiStepCity(c,1);
   }
   return c._aiRedevelopCount>0&&c.buildings.some(b=>!['keep','orc_work','orc_hunt','orc_war'].includes(b.type))&&c.resources.wood>=0;
  }));
  check('No redevelopment runtime errors',report.errors.length===0);
 }finally{fs.mkdirSync('artifacts',{recursive:true});fs.writeFileSync('artifacts/ai-redevelopment.json',JSON.stringify(report,null,2));await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
