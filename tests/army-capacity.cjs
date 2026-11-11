const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox','--disable-dev-shm-usage']});
 const report={checks:[],errors:[]},check=(name,ok)=>{assert(ok,name);report.checks.push(name);console.log('PASS',name);};
 try{
  const p=await browser.newPage();await p.route('https://**/*',r=>r.abort());p.on('pageerror',e=>report.errors.push(e.message));
  await p.goto(process.env.ROADLORDS_TEST_URL||'http://127.0.0.1:4173/Roadlords/');await p.waitForFunction(()=>window.__ROADLORDS_RUNTIME__?.armyCapacityState);
  await p.evaluate(()=>{
   const R=__ROADLORDS_RUNTIME__;
   window.capacityFixture=(race='human',side='player')=>{
    R.MP.enabled=false;R.spectator.active=true;R.ROAD.test=false;R.state.running=false;R.state.modal=false;R.state.pregame=false;R.state.ended=false;R.state.startChoices=0;R.state.selectedBuild=null;R.state.selectedBuilding=null;R.state.units=[];R.state.time=30;R.$('#pauseBtn').classList.add('on');
    const c=R.cityForSide(side);R.roadResetCity(c,race);c.terrain.fill(null);c.unlocked=new Set(R.aiFactionBuildings(c));R.recomputeCity(c,false);c.aiThink=0;return c;
   };
   window.capacityPut=(c,type)=>{c.resources=R.C(1e6,1e6,1e6);const cell=R.findCell(c,type);if(!cell)throw Error('No plot: '+type);const out=R.placeBuilding(c,type,...cell);if(!out.ok)throw Error(out.reason);return out.building;};
  });
  for(const [race,type]of [['human','house'],['undead','und_crypt'],['orc','orc_hut']])for(const side of ['player','enemy']){
   check(`${race} ${side}: real paid construction stops at 750 and never consumes money on rejected placement`,await p.evaluate(({race,type,side})=>{
    const R=__ROADLORDS_RUNTIME__,c=capacityFixture(race,side);R.setBuildingLevel(c,'keep',3);if(race==='orc'){c.legends.add('orc_united_huts');c.orcHutMode='army';}capacityPut(c,type);R.setBuildingLevel(c,type,4);
    for(let n=0;n<50&&c.armyCap<750;n++)capacityPut(c,type);
    const before=JSON.stringify({buildings:c.buildings,money:c.resources});
    const out=R.placeBuilding(c,type,0,0,0);const same=before===JSON.stringify({buildings:c.buildings,money:c.resources});
    const facts={cap:c.armyCap,canPlace:R.canPlace(c,type,0,0),out,same,ai:R.aiBuild(type,c),plan:R.aiBlockingPlan(c,type),score:R.scoreAiChoice({kind:'building_upgrade',id:type},c),count:c.buildings.length};if(!(facts.cap===750&&!facts.canPlace&&!out.ok&&out.reason.includes('750')&&same&&!facts.ai&&!facts.plan&&facts.score<0))throw Error(JSON.stringify(facts));return true;
   },{race,type,side}));
   check(`${race} ${side}: upgrade surplus has visible red crosses and recovers after demolition`,await p.evaluate(({race,type,side})=>{
    const R=__ROADLORDS_RUNTIME__,c=capacityFixture(race,side);R.setBuildingLevel(c,'keep',3);if(race==='orc'){c.legends.add('orc_united_huts');c.orcHutMode='army';}capacityPut(c,type);R.setBuildingLevel(c,type,3);
    for(let n=0;n<60&&c.armyCap<650;n++)capacityPut(c,type);
    R.setBuildingLevel(c,type,4);R.recomputeCity(c,true);
    const state=R.armyCapacityState(c),extra=[...state.buildings].filter(([,x])=>x.redundant);
    if(!extra.length||c.armyCap!==750)throw Error(JSON.stringify({stage:'upgrade',extra:extra.length,raw:state.raw,cap:c.armyCap}));
    const grid=R.$(side==='player'?'#playerGrid':'#enemyGrid');R.renderCity(grid,c,side==='player');
    if(grid.querySelectorAll('.capacitySurplusMark').length!==extra.length)throw Error(JSON.stringify({stage:'render',marks:grid.querySelectorAll('.capacitySurplusMark').length,expected:extra.length,html:grid.querySelector('.building')?.outerHTML}));
    const remaining=extra.at(-1)[0];
    for(const b of [...c.buildings])if(b.type===type&&b.id!==remaining)R.aiMutate(()=>R.demolish(c,b.id));
    R.renderCity(grid,c,side==='player');
    const facts={cap:c.armyCap,status:R.armyCapacityState(c).buildings.get(remaining),marks:grid.querySelectorAll('.capacitySurplusMark').length,canBuild:R.canBuildArmyCapacity(c,type),count:c.buildings.length};if(!(facts.cap<750&&!facts.status.redundant&&!facts.marks&&facts.canBuild))throw Error(JSON.stringify(facts));return true;
   },{race,type,side}));
  }
  check('A crowded AI reclaims a redundant House after upgrading, preserving useful capacity and reserves',await p.evaluate(()=>{
   const R=__ROADLORDS_RUNTIME__,c=capacityFixture('human','enemy');R.setBuildingLevel(c,'keep',3);capacityPut(c,'house');R.setBuildingLevel(c,'house',3);
   while(c.armyCap<650)capacityPut(c,'house');
   while(R.occupancy(c).size<80)capacityPut(c,'lumber');
   R.setBuildingLevel(c,'house',4);c.garrison=[R.makeEntry(c,'swordsman')];
   const before=c.buildings.length,keep=c.buildings.find(b=>b.type==='keep').id;
   c.aiThink=0;R.aiStepCity(c,1);
   return c.buildings.length===before-1&&c.armyCap===750&&c.garrison.length===1&&!!R.getBuilding(c,keep);
  }));
  check('Reserves-only Huts still provide their full garrison bonus',await p.evaluate(()=>{
   const R=__ROADLORDS_RUNTIME__,c=capacityFixture('orc');capacityPut(c,'orc_hut');R.setBuildingLevel(c,'orc_hut',4);c.legends.add('orc_united_huts');c.orcHutMode='reserve';
   for(let n=0;n<12;n++)capacityPut(c,'orc_hut');
   const facts={allowed:R.canBuildArmyCapacity(c,'orc_hut'),reserve:c.garrisonCap,cap:c.armyCap,level:R.levelOf(c,'orc_hut')};if(!(facts.allowed&&facts.reserve>750&&facts.cap===50))throw Error(JSON.stringify(facts));return true;
  }));
  for(const side of ['player','enemy'])check(`${side}: a level-2 human Keep and full stock do not replace the opening Lumber camp`,await p.evaluate(side=>{
   const R=__ROADLORDS_RUNTIME__,c=capacityFixture('human',side);R.setBuildingLevel(c,'keep',2);c.resources={...c.caps};
   const before=JSON.stringify(c),random=Math.random;let calls=0;Math.random=()=>{calls++;return .5};
   try{R.aiPreview(c,()=>{});}finally{Math.random=random;}
   if(JSON.stringify(c)!==before||calls)return false;
   R.aiStepCity(c,1);return R.hasBuilding(c,'lumber')||c._aiSaveType==='lumber';
  },side));
  check('Player build cards visibly lock at the capacity cap',await p.evaluate(()=>{
   const R=__ROADLORDS_RUNTIME__,c=capacityFixture();capacityPut(c,'house');R.setBuildingLevel(c,'house',4);
   while(c.armyCap<750)capacityPut(c,'house');R.spectator.active=false;R.state.category='all';R.renderStatic();
   const card=R.$('#buildList .buildcard[data-k="house"]');card.click();
   const facts={locked:card.classList.contains('capacityLocked'),aria:card.getAttribute('aria-disabled'),badge:!!card.querySelector('.capacityLimitBadge'),selected:R.state.selectedBuild,cap:c.armyCap};if(!(facts.locked&&facts.aria==='true'&&facts.badge&&!facts.selected))throw Error(JSON.stringify(facts));return true;
  }));
  check('Old multiplayer clients cannot mix uncapped capacity rules into the new game',await p.evaluate(()=>{
   const R=__ROADLORDS_RUNTIME__;let closed=false;R.MP.conn={open:true,send:()=>{},close:()=>closed=true};R.mpHandle({type:'hello',pathLength:R.PATH_LENGTH,gameRules:14});return closed&&R.gameRulesVersion===22;
  }));
  check('No capacity browser errors',report.errors.length===0);
 }finally{fs.mkdirSync('artifacts',{recursive:true});fs.writeFileSync('artifacts/army-capacity.json',JSON.stringify(report,null,2));await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
