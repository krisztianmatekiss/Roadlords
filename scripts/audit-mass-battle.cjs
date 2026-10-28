const {chromium}=require('playwright');
const fs=require('node:fs');
const URL=process.env.ROADLORDS_TEST_URL||'http://127.0.0.1:4173/Roadlords/';
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox','--disable-dev-shm-usage']});
 const report={label:process.env.BATTLE_LABEL||'current',cases:[],errors:[]};
 try{
  const page=await browser.newPage({viewport:{width:1600,height:1000}});await page.route('https://**/*',r=>r.abort());page.on('pageerror',e=>report.errors.push(e.message));
  await page.goto(URL);await page.waitForFunction(()=>!!window.__ROADLORDS_RUNTIME__);
  await page.evaluate(async()=>{const R=__ROADLORDS_RUNTIME__;R.state.running=false;await R.loadProductionBattleArt(['human','orc','undead']);R.roadStartTest(42,{count:100,roster:'undead-orcs'});R.roadPause();});
  for(const count of [500,750,2000]){
   const result=await page.evaluate(count=>{
    const R=__ROADLORDS_RUNTIME__,Q=R.ROAD;R.state.running=false;Q.test=true;R.state.units=[];Q.pending=[];Q.dead=[];Q.clock=1201;R.state.time=1201;Q.sprites.clear();
    for(const [c,race]of [[R.P,'orc'],[R.E,'human']]){R.roadResetCity(c,race);c.normal={};c.legends=new Set(race==='orc'?['orc_gob_bow']:[]);c.levels={};c.l4Branches={};}
    for(const t of R.towers)t.alive=false;R.roadRefreshFrontiers();
    for(const [c,key,dir]of [[R.P,'orc_goblin',1],[R.E,'knight',-1]])for(let i=0;i<count;i++){
     const u=R.releaseUnit(c,R.makeEntry(c,key));u.lane=4800-dir*(65+(i%40)*7);u.offset=u.roadHomeOffset=(Math.floor(i/40)%20-9.5)*21;u.hp=u.maxHp=1e7;u.cooldown=(i%11)*.07;
    }
    R.roadReindex();const visits=R.roadVisit;let visited=0;R.roadVisit=(u,r,fn,...args)=>visits(u,r,v=>{visited++;fn(v)},...args);
    const times=[],render=[],stages={};const names=['roadSeparate','roadImpacts','roadOldBattle'];const old={};
    for(const name of names){old[name]=R[name];R[name]=function(...args){const t=performance.now();try{return old[name](...args)}finally{stages[name]=(stages[name]||0)+performance.now()-t}};}
    try{
     for(let i=0;i<90;i++){const t=performance.now();R.updateBattle(1/30);if(i>=30)times.push(performance.now()-t);}
     R.roadWar.scrollLeft=Q.city+4400;
     for(let i=0;i<45;i++){const t=performance.now();R.renderBattle(0);if(i>=15)render.push(performance.now()-t);}
     const mean=a=>a.reduce((n,v)=>n+v,0)/a.length,p95=a=>[...a].sort((a,b)=>a-b)[Math.floor(a.length*.95)];
     const saved={role:R.MP.role,peer:R.MP.peer,conn:R.MP.conn};let packet;
     R.MP.role='host';R.MP.peer=true;R.MP.conn={open:true,dataChannel:{bufferedAmount:0},send:data=>{if(data.type==='snapshot')packet=data;}};
     const packAt=performance.now();try{R.mpSendSnapshot(true);}finally{Object.assign(R.MP,saved);}
     const snapshotMs=performance.now()-packAt;if(!packet)throw Error('No real snapshot captured');
     return {perSide:count,alive:R.state.units.length,tickMean:mean(times),tickP95:p95(times),renderMean:mean(render),renderP95:p95(render),visitedPerTick:visited/90,stages,baseSnapshotBytes:window.__ROADLORDS_NET_V4974__.estimatedSnapshotBytes(),wireSnapshotBytes:new TextEncoder().encode(JSON.stringify(packet)).length,snapshotMs,sprites:Q.sprites.size,spriteMiB:(Q.spritePixels||0)*4/1048576};
    }finally{R.roadVisit=visits;for(const name of names)R[name]=old[name];}
   },count);report.cases.push(result);console.log('MASS',JSON.stringify(result));
  }
  report.soak=await page.evaluate(()=>{
   const R=__ROADLORDS_RUNTIME__,Q=R.ROAD;R.state.units=[];Q.pending=[];Q.dead=[];Q.clock=R.state.time=0;Q.test=true;
   for(const [c,race]of [[R.P,'orc'],[R.E,'human']]){R.roadResetCity(c,race);c.normal={};c.legends=new Set();c.levels={};c.l4Branches={};}
   for(const t of R.towers)t.alive=false;R.roadRefreshFrontiers();
   for(const [c,key,lane]of [[R.P,'orc_goblin',4700],[R.E,'knight',4850]])for(let i=0;i<64;i++){
    const u=R.releaseUnit(c,R.makeEntry(c,key));u.lane=lane+i%8*5;u.offset=u.roadHomeOffset=(Math.floor(i/8)-3.5)*30;u.hp=u.maxHp=1e8;
   }
   let maxPending=0,maxGrid=0,maxSpriteMiB=0;const start=performance.now();
   for(let i=0;i<7500;i++){
    R.updateBattle(.2);R.state.time=Q.clock;
    if(i%50===0)R.renderBattle(0);
    maxPending=Math.max(maxPending,Q.pending.length);maxGrid=Math.max(maxGrid,Q.grid.size);maxSpriteMiB=Math.max(maxSpriteMiB,(Q.spritePixels||0)*4/1048576);
   }
   return {simulatedMinutes:Q.clock/60,wallMs:performance.now()-start,alive:R.state.units.length,maxPending,maxGrid,maxSpriteMiB,attacks:Q.metrics.attacks,finite:R.state.units.every(u=>Number.isFinite(u.hp)&&Number.isFinite(u.lane))};
  });console.log('SOAK',JSON.stringify(report.soak));
  if(!report.soak.finite||report.soak.alive!==128||report.soak.maxPending>128||report.soak.maxSpriteMiB>64)throw Error('Long combat soak exceeded its bounds');
  if(report.errors.length)throw Error(report.errors.join('\n'));
 }finally{fs.mkdirSync('artifacts',{recursive:true});fs.writeFileSync(`artifacts/mass-battle-${report.label}.json`,JSON.stringify(report,null,2));await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
