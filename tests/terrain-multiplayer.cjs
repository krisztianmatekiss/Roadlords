const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox','--disable-dev-shm-usage']});
 const report={checks:[],errors:[]},check=(name,ok,details)=>{if(!ok)console.log(details);assert(ok,name);report.checks.push(name);console.log('PASS',name);};
 try{
  const context=await browser.newContext({viewport:{width:1920,height:1080}});await context.route('https://**/*',r=>r.abort());
  const host=await context.newPage(),guest=await context.newPage();
  for(const p of [host,guest]){p.on('pageerror',e=>report.errors.push(e.message));await p.goto(process.env.ROADLORDS_TEST_URL||'http://127.0.0.1:4173/Roadlords/');await p.waitForFunction(()=>window.__ROADLORDS_RUNTIME__?.battleLayout);}
  for(const race of ['human','orc','undead']){
   const initial=await host.evaluate(race=>{
    const R=__ROADLORDS_RUNTIME__;Object.assign(R.state,{running:false,pregame:false,modal:false,startChoices:0,units:[],pendingChoices:[]});
    R.roadResetCity(R.P,'human');R.roadResetCity(R.E,race);R.E.terrain.fill(null);
    ['ruin','ancient','forest','quarry'].forEach((type,col)=>R.setTerrain(R.E,0,col,type));
    if(race!=='undead'){R.setBuildingLevel(R.E,'keep',4);R.E.unlocked.add('warehouse');for(const col of [0,2,4]){R.E.resources=R.C(5000,5000,5000);const out=R.placeBuilding(R.E,'warehouse',8,col,0);if(!out.ok)throw Error(out.reason);}}
    R.recomputeCity(R.E,true);R.E.resources=race==='undead'?R.C(5000):{...R.E.caps};
    window.packets=[];Object.assign(R.MP,{enabled:true,role:'host',started:true,peer:true,lastGuestSeq:0});
    R.MP.conn={open:true,dataChannel:{bufferedAmount:0},send:p=>packets.push(R.mpPack(p)),close(){}};
    R.mpSendSnapshot(true);return packets.findLast(p=>p.type==='snapshot');
   },race);
   await guest.evaluate(packet=>{
    const R=__ROADLORDS_RUNTIME__;window.packets=[];
    Object.assign(R.MP,{enabled:true,role:'guest',started:true,peer:true,strategySeq:0,pendingStrategy:null});
    R.MP.conn={open:true,dataChannel:{bufferedAmount:0},send:p=>packets.push(R.mpPack(p)),close(){}};
    R.mpApplySnapshot(packet);R.state.running=false;R.state.modal=false;R.state.startChoices=0;R.state.pendingChoices=[];
    R.$('#choiceOverlay').classList.add('hidden');R.$('#pickReminder').classList.add('hidden');R.MP.lobby.style.display='none';
    document.body.classList.remove('roadlords-menu-open','pregame-active');R.renderStatic();R.roadResize();
   },initial);
   let snapshot=initial;const sent=[];
   for(const [col,type]of ['ruin','ancient','forest','quarry'].entries()){
    const action=await guest.evaluate(({packet,col,type})=>{
     const R=__ROADLORDS_RUNTIME__;packets.length=0;
     const before={...R.P.resources},price=R.terrainClearPrice(R.P,type),choices=R.state.pendingChoices.filter(x=>x==='ancient').length;
     // Dispatch the actual plot button and deliver an old snapshot in the
     // same JS task, before the periodic 100 ms strategy sender can rescue it.
     R.$(`#playerGrid .plot[data-r="0"][data-c="${col}"]`).click();
     // Resource terrain uses the existing confirmation dialog.
     R.$('#orcTerrainClear')?.click();
     const strategy=packets.findLast(p=>p.type==='strategy'),after={...R.P.resources};
     const rewarded=R.state.pendingChoices.filter(x=>x==='ancient').length-choices;
     R.state.modal=false;R.$('#choiceOverlay').classList.add('hidden');
     R.mpApplySnapshot(packet);
     return {strategy,before,after,price,rewarded,terrain:R.terrainAt(R.P,0,col),retained:R.P.resources,visible:!!R.$(`#playerGrid .plot.${type}[data-r="0"][data-c="${col}"]`)};
    },{packet:snapshot,col,type});
    check(`${race}: ${type} clearing is transmitted immediately and survives a snapshot already in flight`,!!action.strategy&&!action.terrain&&!action.visible,action);
    check(`${race}: ${type} charges exactly once and grants an ancient choice only when appropriate`,['wood','stone','food'].every(k=>Math.abs(action.before[k]-action.after[k]-(action.price[k]||0))<1e-8&&Math.abs(action.retained[k]-action.after[k])<1e-8)&&action.rewarded===(type==='ancient'?1:0),action);
    sent.push(action.strategy);
    snapshot=await host.evaluate(message=>{const R=__ROADLORDS_RUNTIME__;R.mpHandle(message);R.mpSendSnapshot(true);return packets.findLast(p=>p.type==='snapshot');},action.strategy);
    await guest.evaluate(packet=>__ROADLORDS_RUNTIME__.mpApplySnapshot(packet),snapshot);
    check(`${race}: ${type} remains cleared on both peers after acknowledgment`,await host.evaluate(col=>!__ROADLORDS_RUNTIME__.terrainAt(__ROADLORDS_RUNTIME__.E,0,col),col)&&await guest.evaluate(col=>{const R=__ROADLORDS_RUNTIME__;return !R.terrainAt(R.P,0,col)&&!R.MP.pendingStrategy;},col));
   }
   const replay=await host.evaluate(({old,newest})=>{
    const R=__ROADLORDS_RUNTIME__;R.E.resources.wood+=13;const before=R.E.resources.wood;
    R.mpHandle(old);R.mpHandle(newest);
    return {clear:[0,1,2,3].every(col=>!R.terrainAt(R.E,0,col)),before,after:R.E.resources.wood};
   },{old:sent[0],newest:sent.at(-1)});
   check(`${race}: repeated or older strategy packets cannot restore terrain or overwrite later income`,replay.clear&&replay.before===replay.after,replay);
   const failed=await guest.evaluate(()=>{
    const R=__ROADLORDS_RUNTIME__;R.setTerrain(R.P,1,0,'ruin');R.P.resources=R.C();R.MP.lastStrategySignature=R.mpStrategySignature(R.mpStrategy(R.P));packets.length=0;
    const ok=R.clearTerrain(R.P,1,0);return !ok&&R.terrainAt(R.P,1,0)?.type==='ruin'&&!packets.some(p=>p.type==='strategy');
   });
   check(`${race}: an unaffordable clearing leaves terrain and sends no false edit`,failed);
  }
  check('Host clearing immediately publishes its changed terrain and paid stock',await host.evaluate(()=>{
   const R=__ROADLORDS_RUNTIME__;R.setTerrain(R.P,0,0,'ruin');R.P.resources={...R.P.caps};packets.length=0;
   const before=R.P.resources.wood,price=R.terrainClearPrice(R.P,'ruin').wood,ok=R.clearTerrain(R.P,0,0);
   const packet=packets.findLast(p=>p.type==='snapshot'),city=packet&&R.mpRevive(packet.player);
   return ok&&city&&!city.terrain[0]&&city.resources.wood===before-price;
  }));
  check('Solo clearing keeps the local behavior without sending network edits',await host.evaluate(()=>{
   const R=__ROADLORDS_RUNTIME__;R.MP.enabled=false;R.setTerrain(R.P,0,0,'ruin');R.P.resources={...R.P.caps};packets.length=0;
   return R.clearTerrain(R.P,0,0)&&!R.terrainAt(R.P,0,0)&&packets.length===0;
  }));
  check('No terrain synchronization browser errors',!report.errors.length,report.errors);
 }finally{fs.mkdirSync('artifacts',{recursive:true});fs.writeFileSync('artifacts/terrain-multiplayer.json',JSON.stringify(report,null,2));await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
