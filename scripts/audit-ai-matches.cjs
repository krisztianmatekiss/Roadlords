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
    const builds=[],placements=[],excavations=[],portals=[],rows=[],redevelopments=[],demolitions=[],searchTimes=[],deadTowers=new Set(),towerEvents=[],ticks=[];
    const place=R.placeBuilding,clear=R.clearTerrain,demolish=R.demolish,execute=R.aiExecuteRedevelopment,search=R.aiFindRedevelopment;
    R.demolish=(c,id)=>{const type=R.getBuilding(c,id)?.type,ok=demolish(c,id);if(ok)demolitions.push({side:R.sideForCity(c),t:R.state.time,type});return ok;};
    if(search)R.aiFindRedevelopment=(...args)=>{const started=performance.now(),out=search(...args);searchTimes.push(performance.now()-started);return out;};
    if(execute)R.aiExecuteRedevelopment=(c,plan)=>{
     const removed=plan.ids.map(id=>R.getBuilding(c,id)?.type),ok=execute(c,plan);
     if(ok)redevelopments.push({side:R.sideForCity(c),t:R.state.time,type:plan.type,removed,cell:plan.cell,score:plan.score,previews:plan.previews});return ok;
    };
    const auditPlacement=(c,type,selected)=>{
     if(!R.aiBuildingMechanics(type).produces||c.race==='undead')return null;
     const side=R.sideForCity(c);
     return R.aiPreview(c,()=>{},shadow=>{
      const base=R.productionRates(shadow),original=shadow.buildings,options=[];
      const inspect=(row,col,rotation)=>{
       const b={id:'audit-producer',type,row,col,rotation,level:R.levelOf(shadow,type)};
       shadow.buildings=[...original,b];const rates=R.productionRates(shadow);shadow.buildings=original;
       const gain=Object.fromEntries(R.RES.map(r=>[r,rates[r]-base[r]]));
       const near=terrain=>{const seen=new Set();for(const [r,k]of R.cityBuildingCells(shadow,b))for(const [rr,kk]of R.orth(r,k))if(R.terrainAt(shadow,rr,kk)?.type===terrain)seen.add(R.idx(rr,kk));return seen.size;};
       return {cell:[row,col,rotation],gain,total:R.RES.reduce((n,r)=>n+gain[r],0),forest:near('forest'),quarry:near('quarry'),wall:R.touchesWall(b)};
      };
      for(const rotation of R.rotationOptions(type))for(let row=0;row<R.GRID;row++)for(let col=0;col<R.GRID;col++)if(R.canPlace(shadow,type,row,col,rotation))options.push(inspect(row,col,rotation));
      const chosen=inspect(...selected),best=options.sort((a,b)=>b.total-a.total)[0];
      return {side,t:R.state.time,type,chosen,best,options:options.length};
     });
    };
    R.placeBuilding=(c,type,...args)=>{const placement=auditPlacement(c,type,args.slice(0,3)),out=place(c,type,...args);if(out?.ok){builds.push({side:R.sideForCity(c),t:R.state.time,type});if(placement)placements.push(placement);}return out;};
    R.clearTerrain=(c,row,col,...args)=>{const type=R.terrainAt(c,row,col)?.type,out=clear(c,row,col,...args);if(out)excavations.push({side:R.sideForCity(c),t:R.state.time,type});return out;};
    const snapshot=()=>({t:R.state.time,cities:[R.P,R.E].map(c=>{
     const flow=R.aiPreview(c,()=>{},shadow=>R.resourceFlowRates(shadow));
     return {race:c.race,hp:c.hp/c.maxHp,buildings:c.buildings.length,plots:R.occupancy(c).size,spawners:R.activeSpawners(c).length,
      producers:c.buildings.filter(b=>R.aiBuildingMechanics(b.type).produces).length,warehouses:R.buildingOf(c,'warehouse').length,
      stock:{...c.resources},gain:flow.gain,use:flow.use,army:R.fieldUnitCount(c),reserve:R.reserveCount(c),
      produced:c._matchStats?.unitProducedTotal||0,saving:c._aiSaveType||null,portal:!!c.undPortalEnabled,redeveloped:c._aiRedevelopCount||0,
      roster:c.buildings.map(b=>({type:b.type,level:b.level,row:b.row,col:b.col,rotation:b.rotation}))};
    })});
    try{
     await R.startSpectator({left,right});
     const previous=[!!R.P.undPortalEnabled,!!R.E.undPortalEnabled];
     for(let n=1;n<=seconds*10&&!R.state.ended;n++){
      const start=performance.now();R.tick(.1);ticks.push(performance.now()-start);
      for(const [i,c]of [R.P,R.E].entries())if(!!c.undPortalEnabled!==previous[i]){previous[i]=!!c.undPortalEnabled;portals.push({side:R.sideForCity(c),t:R.state.time,enabled:previous[i]});}
      for(const t of R.towers)if(!t.alive&&!deadTowers.has(t.id)){deadTowers.add(t.id);towerEvents.push({id:t.id,side:t.side,t:R.state.time});}
      if(n%600===0){const row=snapshot();rows.push(row);console.log('AI-MINUTE '+JSON.stringify({left,right,seed,t:Math.round(row.t),cities:row.cities.map(c=>({race:c.race,buildings:c.buildings,plots:c.plots,hp:+c.hp.toFixed(3),redeveloped:c.redeveloped}))}));}
     }
     if(R.state.running)R.$('#pauseBtn').click();ticks.sort((a,b)=>a-b);
     searchTimes.sort((a,b)=>a-b);
     return {version:window.__ROADLORDS_VERSION__,left,right,seed,rows,final:snapshot(),builds,placements,excavations,portals,demolitions,redevelopments,
      searchP95:searchTimes[Math.floor(searchTimes.length*.95)]||0,searchMax:searchTimes.at(-1)||0,towerEvents,tickP95:ticks[Math.floor(ticks.length*.95)]||0,runtimeError:R.state.lastRuntimeErrorV4965||null};
    }finally{Math.random=random;R.placeBuilding=place;R.clearTerrain=clear;R.demolish=demolish;R.aiExecuteRedevelopment=execute;R.aiFindRedevelopment=search;}
   },{left,right,seed,seconds});
   report.cases.push(result);fs.mkdirSync('artifacts',{recursive:true});fs.writeFileSync(`artifacts/ai-matches-${tag}.json`,JSON.stringify(report,null,2));
   console.log(JSON.stringify({left,right,seed,final:result.final,towers:result.towerEvents.length,portalSwitches:result.portals.length,tickP95:result.tickP95}));await p.close();
  }
  if(report.errors.length||report.cases.some(c=>c.runtimeError))throw Error('AI match audit encountered a runtime error');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
