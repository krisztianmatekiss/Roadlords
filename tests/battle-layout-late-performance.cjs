const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{
 const {advanceSimulation}=await import('data:text/javascript,'+encodeURIComponent(fs.readFileSync('src/core/simulation-budget.js','utf8')));
 let time=0,calls=0;const runtime={acc:8/30};
 const slice=advanceSimulation(runtime,dt=>{assert.equal(dt,1/30);calls++;time+=6;},()=>time);
 assert.equal(calls,2);assert(runtime.acc>5/30);assert.equal(slice.elapsed,12);
 const fast={acc:4/30+1e-9};let completed=0;advanceSimulation(fast,()=>{completed++;},()=>0);assert.equal(completed,4);
 const resumed={acc:50};const bounded=advanceSimulation(resumed,()=>{},()=>0);assert.equal(bounded.steps,8);assert(resumed.acc<1/30);
 console.log('PASS Fixed combat steps yield after the frame budget; fast frames run normally and long backlogs stay bounded');
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox','--disable-dev-shm-usage']}),errors=[];
 try{
  const page=await browser.newPage();await page.route('https://**/*',r=>r.abort());page.on('pageerror',e=>errors.push(e.message));await page.goto(process.env.ROADLORDS_TEST_URL||'http://127.0.0.1:4173/Roadlords/');await page.waitForFunction(()=>window.__ROADLORDS_RUNTIME__?.aiGate);
  const result=await page.evaluate(()=>{
   const R=__ROADLORDS_RUNTIME__;R.MP.enabled=false;R.ROAD.test=false;R.spectator.active=true;Object.assign(R.state,{running:false,ended:false,pregame:false,modal:false,time:600,units:[]});
   const reset=()=>{R.state.units=[];R.ROAD.pending=[];R.ROAD.clock=600;R.roadResetCity(R.P,'human');R.roadResetCity(R.E,'orc');for(const t of R.towers)t.alive=false;R.roadRefreshFrontiers();R.roadReindex();};reset();
   const c=R.E;c.garrison=Array.from({length:200},()=>({key:'orc_warrior'}));
   const stats=R.statsFor,room=R.fieldQueueRoom,population=R.battlePopulationRoom,market=R.updateEnemyMarket;let queries=0,markets=0,fieldRoom=0,actorRoom=750;
   R.statsFor=(...a)=>{queries++;return stats(...a);};R.fieldQueueRoom=()=>fieldRoom;R.battlePopulationRoom=()=>actorRoom;R.updateEnemyMarket=()=>{markets++;};
   try{for(let i=0;i<30;i++){if(i===15){fieldRoom=100;actorRoom=0;}R.aiGate(c);}}finally{R.statsFor=stats;R.fieldQueueRoom=room;R.battlePopulationRoom=population;R.updateEnemyMarket=market;}
   const saturated={queries,markets,waiting:c.garrison.length,releasing:c.releaseQueue.length};
   reset();R.P.armyCap=200;const marcher=R.releaseUnit(R.P,{key:'swordsman'});marcher.lane=2000;R.roadReindex();
   const visit=R.roadVisit;let searches=0;R.roadVisit=(u,range,...a)=>{if(range>=340)searches++;return visit(u,range,...a);};
   let emptySearches,target;
   try{R.roadAdvance(marcher,[],1/30);for(let i=0;i<5;i++){R.ROAD.clock+=.03;R.roadAdvance(marcher,[],1/30);}emptySearches=searches;
    const enemy=R.releaseUnit(R.E,{key:'orc_warrior'});enemy.lane=marcher.lane+100;enemy.offset=marcher.offset;R.roadReindex();R.roadAdvance(marcher,[enemy],1/30);target=marcher.roadSeek===enemy;
   }finally{R.roadVisit=visit;}
   reset();const priest=R.releaseUnit(R.P,{key:'priest'}),allies=[priest];for(let i=0;i<100;i++)allies.push({id:1000+i,alive:true,hp:100,maxHp:100,lane:priest.lane,offset:0});
   const distance=R.roadDistance;let distances=0;R.roadDistance=(...a)=>{distances++;return distance(...a);};let healed;
   try{R.lowestAlly(priest,allies,200);allies.at(-1).hp=50;healed=R.lowestAlly(priest,allies,200)===allies.at(-1);}finally{R.roadDistance=distance;}
   reset();const attacker=R.releaseUnit(R.P,{key:'archer'}),warrior=R.releaseUnit(R.E,{key:'orc_warrior'});attacker.lane=1000;warrior.lane=1100;attacker.offset=warrior.offset=0;
   let candidateQueries=0;const candidates=R.battleCandidates;R.battleCandidates=(...a)=>{candidateQueries++;return candidates(...a);};
   try{R.roadOldPreferred(attacker,[warrior]);}finally{R.battleCandidates=candidates;}
   R.E.levels.orc_war=4;R.E.l4Branches.orc_war='meat_shield';
   const closer=R.releaseUnit(R.E,{key:'orc_goblin'});closer.lane=1010;closer.offset=0;R.roadReindex();
   const taunt=R.roadOldPreferred(attacker,[closer,warrior])===warrior;
   reset();R.roadResetCity(R.E,'undead');R.E.buildings.push({id:'idle-portal',type:'und_otherworld_portal',row:0,col:0,rotation:0,level:1});R.recomputeCity(R.E,false);
   const preview=R.aiPreview;let previews=0;R.aiPreview=(...a)=>{previews++;return preview(...a);};
   try{R.aiUpdateBuildingControls(R.E,{battle:R.aiBattleState(R.E),growth:{growing:false},resources:['wood']});}finally{R.aiPreview=preview;}
   return{saturated,emptySearches,searches,target,distances,healed,candidateQueries,taunt,idlePreviews:previews};
  });
  assert.deepEqual(result.saturated,{queries:0,markets:30,waiting:200,releasing:0});console.log('PASS A full AI army keeps all 200 recruits and market updates without repeated recruit-stat calculations');
  assert.equal(result.emptySearches,1);assert.equal(result.searches,2);assert(result.target);console.log('PASS Marchers reuse empty searches briefly; the first arriving opponent immediately invalidates an empty result');
  assert.equal(result.distances,1);assert(result.healed);console.log('PASS Full-health allies cost no healing-distance queries; the injured target is still selected');
  assert.equal(result.candidateQueries,1);assert(result.taunt);console.log('PASS Absent taunt branches add no enemy scan; an active taunt retains its real targeting priority');
  assert.equal(result.idlePreviews,0);console.log('PASS An idle portal without other adjustable buildings performs no cloned-city control previews');
  assert.deepEqual(errors,[]);
  fs.mkdirSync('artifacts',{recursive:true});fs.writeFileSync('artifacts/late-performance-485.json',JSON.stringify(result,null,2));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
