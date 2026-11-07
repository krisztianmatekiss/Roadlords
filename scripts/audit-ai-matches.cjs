// Developer-only measurement of full AI matches, using the normal tick and
// legal starting picks/resources. No fixture armies or automatic in-game logs.
const {chromium}=require('playwright'),fs=require('node:fs');
const URL=process.env.ROADLORDS_TEST_URL||'http://127.0.0.1:4173/Roadlords/';
const tag=(process.env.ROADLORDS_AI_TAG||'current').replace(/[^a-z0-9-]/gi,'-');
const seeds=(process.env.ROADLORDS_AI_SEEDS||'42').split(',').map(Number);
const seconds=Number(process.env.ROADLORDS_AI_SECONDS||600);
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox','--disable-dev-shm-usage']});
 const report={scope:'Full normal AI vs AI matches; seeded starts, real economy, choices, training and combat. Not human win rates.',cases:[],errors:[]};
 try{
  for(const [left,right]of [['human','undead'],['orc','human'],['undead','orc']])for(const seed of seeds){
   const p=await browser.newPage();await p.route('https://**/*',r=>r.abort());p.on('pageerror',e=>report.errors.push(e.message));p.on('console',m=>{if(m.text().startsWith('AI-MINUTE '))console.log(m.text());});
   await p.goto(URL);await p.waitForFunction(()=>window.__ROADLORDS_RUNTIME__?.startSpectator);
   const result=await p.evaluate(async({left,right,seed,seconds})=>{
    const R=__ROADLORDS_RUNTIME__,random=Math.random;let rng=seed;
    Math.random=()=>((rng=(Math.imul(rng,1664525)+1013904223)>>>0)/4294967296);
    const builds=[],excavations=[],portals=[],rows=[],deadTowers=new Set(),towerEvents=[],ticks=[];
    const place=R.placeBuilding,clear=R.clearTerrain;
    R.placeBuilding=(c,type,...args)=>{const out=place(c,type,...args);if(out?.ok)builds.push({side:R.sideForCity(c),t:R.state.time,type});return out;};
    R.clearTerrain=(c,row,col,...args)=>{const type=R.terrainAt(c,row,col)?.type,out=clear(c,row,col,...args);if(out)excavations.push({side:R.sideForCity(c),t:R.state.time,type});return out;};
    const snapshot=()=>({t:R.state.time,cities:[R.P,R.E].map(c=>{
     const flow=R.resourceFlowRates(c);
     return {race:c.race,hp:c.hp/c.maxHp,buildings:c.buildings.length,plots:R.occupancy(c).size,spawners:R.activeSpawners(c).length,
      producers:c.buildings.filter(b=>R.aiBuildingMechanics(b.type).produces).length,warehouses:R.buildingOf(c,'warehouse').length,
      stock:{...c.resources},gain:flow.gain,use:flow.use,army:R.fieldUnitCount(c),reserve:R.reserveCount(c),
      produced:c._matchStats?.unitProducedTotal||0,saving:c._aiSaveType||null,portal:!!c.undPortalEnabled};
    })});
    try{
     await R.startSpectator({left,right});
     const previous=[!!R.P.undPortalEnabled,!!R.E.undPortalEnabled];
     for(let n=1;n<=seconds*10&&!R.state.ended;n++){
      const start=performance.now();R.tick(.1);ticks.push(performance.now()-start);
      for(const [i,c]of [R.P,R.E].entries())if(!!c.undPortalEnabled!==previous[i]){previous[i]=!!c.undPortalEnabled;portals.push({side:R.sideForCity(c),t:R.state.time,enabled:previous[i]});}
      for(const t of R.towers)if(!t.alive&&!deadTowers.has(t.id)){deadTowers.add(t.id);towerEvents.push({id:t.id,side:t.side,t:R.state.time});}
      if(n%600===0){const row=snapshot();rows.push(row);console.log('AI-MINUTE '+JSON.stringify({left,right,seed,t:Math.round(row.t),cities:row.cities.map(c=>({race:c.race,buildings:c.buildings,plots:c.plots,hp:+c.hp.toFixed(3)}))}));}
     }
     if(R.state.running)R.$('#pauseBtn').click();ticks.sort((a,b)=>a-b);
     return {version:window.__ROADLORDS_VERSION__,left,right,seed,rows,final:snapshot(),builds,excavations,portals,towerEvents,tickP95:ticks[Math.floor(ticks.length*.95)]||0,runtimeError:R.state.lastRuntimeErrorV4965||null};
    }finally{Math.random=random;R.placeBuilding=place;R.clearTerrain=clear;}
   },{left,right,seed,seconds});
   report.cases.push(result);fs.mkdirSync('artifacts',{recursive:true});fs.writeFileSync(`artifacts/ai-matches-${tag}.json`,JSON.stringify(report,null,2));
   console.log(JSON.stringify({left,right,seed,final:result.final,towers:result.towerEvents.length,portalSwitches:result.portals.length,tickP95:result.tickP95}));await p.close();
  }
  if(report.errors.length||report.cases.some(c=>c.runtimeError))throw Error('AI match audit encountered a runtime error');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
