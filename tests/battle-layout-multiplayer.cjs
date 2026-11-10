const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox','--disable-dev-shm-usage']});
 try{
  const context=await browser.newContext({viewport:{width:1920,height:1080}}),errors=[];
  await context.route('https://**/*',route=>route.abort());
  const host=await context.newPage(),guest=await context.newPage();
  for(const page of [host,guest]){
   page.on('pageerror',e=>errors.push(e.message));
   await page.goto(process.env.ROADLORDS_TEST_URL||'http://127.0.0.1:4173/Roadlords/');
   await page.waitForFunction(()=>window.__ROADLORDS_RUNTIME__?.battleLayout?.active);
  }
  const packet=await host.evaluate(()=>{
   const R=__ROADLORDS_RUNTIME__,sent=[];
   R.state.running=false;R.state.pregame=false;R.state.modal=false;R.state.startChoices=0;
   R.roadResetCity(R.P,'human');R.roadResetCity(R.E,'orc');R.P.hp=12345;
   R.state.units=[];for(let i=0;i<5;i++){const u=R.releaseUnit(R.P,{key:'swordsman'});u.lane=3000+i*10;}
   Object.assign(R.MP,{enabled:true,role:'host',started:true,peer:true});
   R.mpSend=p=>sent.push(p);R.mpSendSnapshot(true);return sent.findLast(p=>p.type==='snapshot');
  });
  assert(packet,'Host sends a real snapshot');
  await guest.evaluate(packet=>{
   const R=__ROADLORDS_RUNTIME__;Object.assign(R.MP,{enabled:true,role:'guest',started:true,peer:true});
   R.MP.lobby.style.display='none';R.mpApplySnapshot(packet);R.state.running=false;R.state.modal=false;
   document.body.classList.remove('roadlords-menu-open','pregame-active');R.renderStatic();R.updateHud();R.roadResize();R.battleLayout.line.draw(true);
  },packet);
  assert(await guest.evaluate(()=>{
   const R=__ROADLORDS_RUNTIME__,line=R.battleLayout.line;
   return R.battleLayout.active&&R.E.hp===12345&&line.structures.some(s=>s.capital&&s.side==='enemy'&&s.hp===12345)&&line.groups.reduce((n,g)=>n+g.count,0)===5&&R.$('#uiTrialOverview').contains(R.$('#playerArmy'));
  }),'Default guest layout shows mirrored live units, capital HP and rosters');
  console.log('PASS Default multiplayer layout reads real host snapshots with mirrored units and HP');
  await guest.evaluate(()=>{const R=__ROADLORDS_RUNTIME__;window.gatePackets=[];R.mpSend=p=>gatePackets.push(p);});
  await guest.locator('#gateControls [data-gate="closed"]').click();
  assert(await guest.evaluate(()=>__ROADLORDS_RUNTIME__.P.gateMode==='closed'&&gatePackets.some(p=>p.type==='strategy')),'Guest gate buttons still send actual strategy updates');
  assert.equal(errors.length,0,errors.join('\n'));console.log('PASS Default multiplayer gate controls send strategy updates without browser errors');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
