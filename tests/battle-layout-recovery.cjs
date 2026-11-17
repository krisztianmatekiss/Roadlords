const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox','--disable-dev-shm-usage']}),report={checks:[],errors:[]};
 const check=(name,ok,data)=>{assert(ok,name+' '+JSON.stringify(data||''));report.checks.push(name);console.log('PASS',name);};
 try{
  const {rankAiAlternatives}=await import('data:text/javascript,'+encodeURIComponent(fs.readFileSync('src/ai/variety.js','utf8')));
  const options=[{id:'a',score:10},{id:'b',score:9.5},{id:'bad',score:2}],selections=new Set();
  for(let seed=1;seed<=64;seed++){const c={aiDecisionSeed:seed},a=rankAiAlternatives(c,options,x=>x.id);selections.add(a[0].id);assert.equal(a[0].id,rankAiAlternatives(c,options,x=>x.id)[0].id);}
  check('Near-equal alternatives vary between matches but stay stable within one; clearly worse choices remain excluded',selections.size===2&&!selections.has('bad'));
  const p=await browser.newPage({viewport:{width:1920,height:1080}});await p.route('https://**/*',r=>r.abort());p.on('pageerror',e=>report.errors.push(e.message));
  await p.goto(process.env.ROADLORDS_TEST_URL||'http://127.0.0.1:4173/Roadlords/');await p.waitForFunction(()=>window.__ROADLORDS_RUNTIME__?.aiCanFundRecovery);
  await p.evaluate(()=>{
   const R=__ROADLORDS_RUNTIME__;
   window.recoveryReset=(race='human',side='enemy')=>{
    R.MP.enabled=false;R.ROAD.test=false;R.spectator.active=true;R.aiDecisionCache=null;Object.assign(R.state,{running:false,modal:false,ended:false,pregame:false,startChoices:0,time:600,units:[]});Object.assign(R.ROAD,{pending:[],clock:600});
    for(const [s,r]of [[side,race],[side==='player'?'enemy':'player','human']]){const c=R.cityForSide(s);R.roadResetCity(c,r);c.terrain.fill(null);c.unlocked=new Set(R.aiFactionBuildings(c));R.recomputeCity(c,false);}
    for(const t of R.towers)t.alive=false;R.roadRefreshFrontiers();R.roadReindex();return R.cityForSide(side);
   };
   window.recoveryPut=(c,type,level=1)=>{c.resources=R.C(1e6,1e6,1e6);R.setBuildingLevel(c,type,level);const cell=R.findCell(c,type);if(!cell)throw Error('No plot '+type);const result=R.placeBuilding(c,type,...cell);if(!result.ok)throw Error(result.reason);return result.building;};
   window.recoveryEnemy=(c,hp=20000)=>{c.hp=c.maxHp=hp;const other=c===R.P?R.E:R.P,u=R.releaseUnit(other,{key:'knight'});u.lane=c===R.P?150:R.PATH_LENGTH-150;u.offset=0;R.state.combatStep++;R.roadReindex();return u;};
  });
  for(const race of ['human','orc','undead'])for(const side of ['player','enemy']){
   const recovery=await p.evaluate(({race,side})=>{
    const R=__ROADLORDS_RUNTIME__,c=recoveryReset(race,side),type=race==='human'?'archery':race==='orc'?'orc_gob':'und_graveyard';
    for(let i=0;i<4;i++)recoveryPut(c,type,3);
    c.resources=R.C(600,600,600);recoveryEnemy(c);const battle=R.aiBattleState(c),before=R.resourceFlowRates(c),count=c.buildings.length;c.aiThink=0;R.aiStepCity(c,1);
    const added=c.buildings.slice(count),after=R.resourceFlowRates(c);
    return{urgent:battle.urgent,window:battle.survivalTime,added:added.map(b=>b.type),economic:added.some(b=>R.aiBuildingMechanics(b.type).produces),improves:R.aiResourceKeys(c).some(r=>after.gain[r]-after.use[r]>before.gain[r]-before.use[r]),saved:c._aiSaveReason};
   },{race,side});
   check(`${side} ${race}: a pressured city with time to recover builds real income instead of only more consumers`,recovery.urgent&&recovery.window>18&&recovery.economic&&recovery.improves,recovery);
  }
  const critical=await p.evaluate(()=>{const R=__ROADLORDS_RUNTIME__,c=recoveryReset();recoveryPut(c,'barracks');recoveryEnemy(c,1);const battle=R.aiBattleState(c);return{urgent:battle.urgent,window:battle.survivalTime,allowed:R.aiCanFundRecovery(c,battle)};});
  check('Imminent capital loss overrides construction savings',critical.urgent&&critical.window<18&&!critical.allowed,critical);
  const controls=await p.evaluate(()=>{
   const R=__ROADLORDS_RUNTIME__,c=recoveryReset();R.spectator.active=false;recoveryPut(c,'warcenter');const fn=R.aiPreview,control=R.aiUpdateBuildingControls;let previews=0,updates=0;R.aiPreview=(...a)=>{previews++;return fn(...a);};R.aiUpdateBuildingControls=(...a)=>{updates++;return control(...a);};
   try{R.updateEnemyWarModeV45();previews=updates=0;for(let i=0;i<29;i++){R.state.time+=1/30;R.updateEnemyWarModeV45();}const within=updates;R.state.time+=.1;R.updateEnemyWarModeV45();return{within,after:updates,previews};}finally{R.aiPreview=fn;R.aiUpdateBuildingControls=control;}
  });check('Tactical checks run once per second without rebuilding construction forecasts between control evaluations',controls.within===0&&controls.after===1&&controls.previews===0,controls);
  const spread=await p.evaluate(()=>{
   const R=__ROADLORDS_RUNTIME__,c=recoveryReset('human','player');R.spectator.active=false;
   for(let i=0;i<40;i++){const u=R.releaseUnit(c,{key:'swordsman'});u.lane=2000;u.offset=0;u.roadHomeOffset=((i%20)-9.5)*22;}
   R.roadReindex();for(let i=0;i<120;i++)R.updateBattle(1/30);
   const units=R.state.units;return{count:units.length,width:Math.max(...units.map(u=>u.offset))-Math.min(...units.map(u=>u.offset)),progress:Math.min(...units.map(u=>u.lane))-2000,finite:units.every(u=>Number.isFinite(u.lane)&&Math.abs(u.offset)<=R.ROAD.half)};
  });check('Overlapping friendly marchers fan out into available road space while continuing forward',spread.count===40&&spread.width>100&&spread.progress>80&&spread.finite,spread);
  await p.evaluate(async()=>{const R=__ROADLORDS_RUNTIME__;R.MP.lobby.style.display='none';document.body.classList.remove('roadlords-menu-open');await R.loadChronicleArt(['human','orc','undead']);R.state.units=[];R.roadFocusLane(4800);});
  const ground=await p.evaluate(()=>{
   const R=__ROADLORDS_RUNTIME__,view=R.chronicle;view.drawGround();const a=view.groundCache.painted;
   for(let i=0;i<10;i++)view.drawGround();const reused=view.groundCache.painted===a&&view.groundCache.reused>=10;
   R.ROAD.camera+=50;view.drawGround();const moved=view.groundCache.painted===a+1;return{reused,moved};
  });check('The terrain reuses its painted viewport until camera or world geometry changes',ground.reused&&ground.moved,ground);
  for(const race of ['human','orc','undead']){
   await p.evaluate(race=>{const R=__ROADLORDS_RUNTIME__;R.roadResetCity(R.P,race);R.roadResetCity(R.E,race);R.P.gateMode=R.E.gateMode='closed';R.renderStatic();R.updateHud();R.roadWar.scrollLeft=0;R.renderBattle(0);},race);await p.waitForTimeout(250);
   check(`${race}: both painted gates themselves are rotated 90 degrees inside their original openings`,await p.evaluate(()=>[...document.querySelectorAll('.chronicleDoorArt')].length===4&&[...document.querySelectorAll('.chronicleDoorArt')].every(el=>el.getAttribute('transform').includes('rotate(90)'))));
   await p.screenshot({path:`artifacts/recovery-${race}-closed.png`});
   await p.evaluate(()=>{const R=__ROADLORDS_RUNTIME__;R.P.gateMode=R.E.gateMode='open';R.updateHud();});await p.waitForTimeout(250);
   const opened=await p.evaluate(()=>[...document.querySelectorAll('.chronicleGateLeaf')].map(el=>{const m=new DOMMatrix(getComputedStyle(el).transform);return{upper:el.classList.contains('upper'),x:m.e,y:m.f};}));
   check(`${race}: upper/lower leaves open vertically, on both sides`,opened.length===4&&opened.every(l=>Math.abs(l.x)<.01&&(l.upper?l.y<0:l.y>0)),opened);
  }
  const line=await p.evaluate(()=>{const R=__ROADLORDS_RUNTIME__;R.battleLayout.line.resize();const line=R.battleLayout.line,b=R.$('#uiTrialOverview').getBoundingClientRect();return{g:line.geometry,bottom:innerHeight-b.bottom,edges:line.hits.filter(h=>h.garrison&&!h.key).map(h=>h.x)};});
  check('Overview track is narrower and lower, with reserve counters at both outer edges',line.g.pad>104&&line.g.y>line.g.height*.5&&line.bottom<=3&&line.edges[0]<line.g.pad&&line.edges[1]>line.g.width-line.g.pad,line);
  check('No recovery, navigation or gate runtime errors',report.errors.length===0,report.errors);
 }finally{fs.mkdirSync('artifacts',{recursive:true});fs.writeFileSync('artifacts/recovery-484.json',JSON.stringify(report,null,2));await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
