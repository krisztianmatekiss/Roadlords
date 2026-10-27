const {chromium}=require('playwright'),fs=require('node:fs');
const URL=process.env.ROADLORDS_TEST_URL||'http://127.0.0.1:4173/Roadlords/';
(async()=>{const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox','--disable-dev-shm-usage']});const report={scope:'Ten-minute economic simulation, actual resources, prices, AI choices, building, training and wave release. Deployed troops retire after 45 seconds with no combat-death rewards; this models ongoing replacement demand, not combat or faction win rate.',cases:[],errors:[]};try{
 const p=await browser.newPage();await p.route('https://**/*',r=>r.abort());p.on('pageerror',e=>report.errors.push(e.message));await p.goto(URL);await p.waitForFunction(()=>window.__ROADLORDS_RUNTIME__);
 for(const race of ['human','orc','undead'])for(const seed of [42,137]){
  const data=await p.evaluate(({race,seed})=>{const R=__ROADLORDS_RUNTIME__,oldRandom=Math.random;let rng=seed;Math.random=()=>((rng=(Math.imul(rng,1664525)+1013904223)>>>0)/4294967296);R.MP.enabled=false;R.ROAD.test=false;R.ROAD.paused=true;R.state.running=false;R.state.modal=false;R.state.pregame=false;R.state.ended=false;R.state.startChoices=0;R.state.pendingChoices=[];R.state.time=0;R.state.units=[];R.ROAD.pending=[];R.ROAD.dead=[];R.aiDecisionCache=null;
   R.roadResetCity(R.P,'human');R.roadResetCity(R.E,race);R.generateTerrain(R.E,12);R.recomputeCity(R.E,false);for(let n=0;n<4;n++)R.grantEnemyPick('start');
   const c=R.E,rows=[],initial={...c.resources},times={firstBuilding:null,firstPaidUnit:null,firstWave:null},counts={trained:0,deployed:0},spawn=R.normalSpawn,release=R.releaseUnit;
   R.normalSpawn=(city,b)=>{const ok=spawn(city,b);if(ok&&city===c){counts.trained++;times.firstPaidUnit??=R.state.time;}return ok;};
   R.releaseUnit=(city,e)=>{const u=release(city,e);if(u&&city===c){counts.deployed++;times.firstWave??=R.state.time;u.auditReleasedAt=R.state.time;}return u;};
   let untilPick=R.PICK_BASE_SECONDS,picks=0,minSouls=initial.wood,lost=0,unfunded=0;
   try{for(let t=1;t<=600;t++){
    R.state.time=t;R.ROAD.clock=t;untilPick--;if(untilPick<=0){R.grantEnemyPick('timer');picks++;untilPick=R.PICK_BASE_SECONDS*Math.pow(R.PICK_GROWTH,picks);}
    R.produceResources(c,1);R.updateSpawners(c,1);R.enemyBuildAI(1);R.enemyGateAI();R.releaseQueues(1);
    if(c.buildings.length>1)times.firstBuilding??=t;
    R.state.units=R.state.units.filter(u=>u.side!=='enemy'||t-(u.auditReleasedAt??t)<45);
    if(R.state.units.length===0)R.roadReindex();minSouls=Math.min(minSouls,c.resources.wood);
    if(race==='undead'){lost=c.undeadState.lostBuildingIds.length;unfunded+=Number(c.buildings.some(b=>(b.undStarve||0)>0));}
    if(t%60===0){const flow=R.resourceFlowRates(c);rows.push({t,stock:{...c.resources},gain:flow.gain,use:flow.use,buildings:c.buildings.length,military:R.activeSpawners(c).length,trained:counts.trained,deployed:counts.deployed,army:R.fieldUnitCount(c),reserve:R.reserveCount(c),save:c.undSaveSouls||c._aiSaveType||null});}
   }}finally{R.normalSpawn=spawn;R.releaseUnit=release;Math.random=oldRandom;}
   return {race,seed,initial,times,counts,minSouls,lost,unfunded,redeveloped:c.undeadState?.aiRedeveloped||0,picks,normal:c.normal,legends:[...c.legends],unlocked:[...c.unlocked],buildings:c.buildings.map(b=>({type:b.type,level:b.level,row:b.row,col:b.col,rotation:b.rotation})),rows};
  },{race,seed});report.cases.push(data);fs.mkdirSync('artifacts',{recursive:true});fs.writeFileSync('artifacts/ai-economy-audit.json',JSON.stringify(report,null,2));console.log(JSON.stringify({race,seed,times:data.times,counts:data.counts,lost:data.lost,unfunded:data.unfunded,final:data.rows.at(-1)}));
 }
 if(report.errors.length)throw Error(report.errors.join(';'));
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
