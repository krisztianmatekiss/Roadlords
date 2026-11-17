// Developer-only 1000-actor fixture: shared AI ticks, full reserves, HUD and unit valuations.
// Run: node scripts/test.cjs scripts/audit-late-performance.cjs
// BASELINE_FILE may point to a previously published bundle for paired local measurements.
const {chromium}=require('playwright');
const fs=require('node:fs');
(async()=>{const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--disable-dev-shm-usage']});try{
 const page=await browser.newPage({viewport:{width:1920,height:1080}});await page.route('https://**/*',r=>r.abort());if(process.env.BASELINE_FILE)await page.route('**/assets/index-*.js',r=>r.fulfill({path:process.env.BASELINE_FILE,contentType:'text/javascript'}));const url=new URL(process.env.ROADLORDS_TEST_URL||'http://127.0.0.1:4173/Roadlords/');url.searchParams.delete('layout');await page.goto(url.href);await page.waitForFunction(()=>window.__ROADLORDS_RUNTIME__?.aiStepCity);
 const report=await page.evaluate(()=>{const R=__ROADLORDS_RUNTIME__,results=[];
  const profile=(fn,iterations=30)=>{const stages={},original={},names=['produceResources','updateSpawners','enemyBuildAI','aiGate','statsFor','resourceFlowRates','releaseQueues','garrisonFire','updateBattle','roadSeparate','roadOldBattle','updateEnemyWarModeV45','aiBattleState','aiCombatContext','aiPreview','recomputeCity','updateHud','updateProgress','renderCity','aiStrategyContext'];
   for(const name of names)if(typeof R[name]==='function'){original[name]=R[name];R[name]=function(...args){const t=performance.now(),s=stages[name]||={calls:0,ms:0};s.calls++;try{return original[name](...args);}finally{s.ms+=performance.now()-t;}};}
   const samples=[];try{for(let i=0;i<iterations;i++){const t=performance.now();fn();samples.push(performance.now()-t);}}finally{for(const [key,value]of Object.entries(original))R[key]=value;}
   samples.sort((a,b)=>a-b);return{mean:samples.reduce((a,b)=>a+b)/samples.length,median:samples[Math.floor(samples.length/2)],max:samples.at(-1),stages};};
  for(const reserve of [0,200]){R.roadStartTest(42,{count:500});R.roadPause();R.ROAD.test=false;R.MP.enabled=false;R.spectator.active=true;Object.assign(R.state,{time:1100,running:true,modal:false,pregame:false,startChoices:0,nextPick:1e6});R.ROAD.clock=1100;
   for(const c of [R.P,R.E]){c.aiThink=10000;c._aiPickDue=1e6;c.aiDecisionSeed=42;c.armyCap=400;c.garrisonCap=250;c.rallyReserve=[];c.releaseQueue=[];c.garrison=Array.from({length:reserve},()=>({key:c.race==='orc'?'orc_warrior':'swordsman',veteran:false}));}
   for(const u of R.state.units){u.hp=u.maxHp=1e7;u.lane=4800+(u.side==='player'?-200:200)+(u.id%10)*2;u.offset=(u.id%20-9.5)*20;}
   R.roadReindex();for(let i=0;i<5;i++)R.tick(1/30);
   const ticks=profile(()=>R.tick(1/30));R.state.running=false;const hud=profile(()=>{R.updateHud();R.updateProgress();},10);
   const decisions=profile(()=>{R.state.time+=4;for(const c of [R.P,R.E]){c.aiThink=0;R.aiStepCity(c,1);}},2);
   results.push({reserve,actors:R.state.units.length,races:[R.P.race,R.E.race],ticks,hud,decisions});
  }
  R.roadResetCity(R.P,'human');R.P.terrain.fill(null);R.P.unlocked=new Set(R.aiFactionBuildings(R.P));R.P.normal={};R.P.legends=new Set();R.state.units=[];R.recomputeCity(R.P,false);const units=[];
  for(const type of R.aiFactionBuildings(R.P).filter(t=>R.BUILDINGS[t].unit)){const b={type,id:'profile-'+type,level:1,row:0,col:0,rotation:0},key=R.effectiveUnitKey(R.P,b),stats=R.statsFor(R.P,{key});units.push({type,key,quality:R.aiUnitQuality(R.P,key),time:R.trainingTime(R.P,b),cost:R.primarySpawnCost(R.P,key,b),area:R.cityBuildingCells(R.P,b).length,hp:stats.hp,dmg:stats.dmg,range:stats.range,speed:stats.speed});}
  const humanIntent=[];for(const focus of [null,'archer','swordsman','mage','catapult']){R.P.normal=focus?{[focus+'_dmg']:8}:{};R.recomputeCity(R.P,false);const intent=R.aiArmyIntent(R.P,{metrics:R.aiCityMetrics(R.P),battle:{foes:[],urgent:false},strategy:null});humanIntent.push({focus,main:intent.main?.key,scores:[...intent.purposes.values()].map(x=>({key:x.key,score:x.value}))});}return{results,humanUnits:units,humanIntent};
 });console.log(JSON.stringify(report.results.map(x=>({reserve:x.reserve,tickMean:x.ticks.mean,tickMedian:x.ticks.median,tickMax:x.ticks.max,stats:x.ticks.stages.statsFor?.calls,controls:x.ticks.stages.updateEnemyWarModeV45})),null,2));fs.mkdirSync('artifacts',{recursive:true});fs.writeFileSync('artifacts/late-battle-profile.json',JSON.stringify(report,null,2));
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
