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
   R.towers.find(t=>t.side==='player'&&t.forecourtTower).hp=4567;
   R.state.units=[];for(let i=0;i<5;i++){const u=R.releaseUnit(R.P,{key:'swordsman'});u.lane=3000+i*10;}
   Object.assign(R.MP,{enabled:true,role:'host',started:true,peer:true});
   R.mpSend=p=>sent.push(p);R.mpSendSnapshot(true);return sent.findLast(p=>p.type==='snapshot');
  });
  assert(packet,'Host sends a real snapshot');
  await guest.evaluate(async packet=>{
   const R=__ROADLORDS_RUNTIME__;Object.assign(R.MP,{enabled:true,role:'guest',started:true,peer:true});
   R.MP.lobby.style.display='none';R.mpApplySnapshot(packet);R.state.running=false;R.state.modal=false;
   document.body.classList.remove('roadlords-menu-open','pregame-active');await R.loadChronicleArt();R.renderStatic();R.updateHud();R.roadResize();R.roadFocusLane(R.territoryBoundary());R.renderBattle(0);R.battleLayout.line.draw(true);
  },packet);
  assert(await guest.evaluate(()=>{
   const R=__ROADLORDS_RUNTIME__,line=R.battleLayout.line;
   return R.battleLayout.active&&R.E.hp===12345&&line.structures.some(s=>s.capital&&s.side==='enemy'&&s.hp===12345)&&line.groups.reduce((n,g)=>n+g.count,0)===5&&R.$('#uiTrialOverview').contains(R.$('#playerArmy'));
  }),'Default guest layout shows mirrored live units, capital HP and rosters');
  console.log('PASS Default multiplayer layout reads real host snapshots with mirrored units and HP');
  assert(await guest.evaluate(()=>{const R=__ROADLORDS_RUNTIME__;return R.chronicle.active()&&R.P.race==='orc'&&R.E.race==='human'&&R.chronicle.segments.length===2&&R.chronicle.segments[0].race==='orc'&&R.chronicle.segments[1].race==='human';}),'The guest paints mirrored faction territory through the shared renderer');
  console.log('PASS Multiplayer terrain follows the local player and mirrored opponent races');
  assert(await guest.evaluate(()=>{const R=__ROADLORDS_RUNTIME__;return R.towers.filter(t=>t.forecourtTower).length===4&&R.towers.filter(t=>t.forecourtTower).every(t=>R.battleLayout.line.structures.includes(t))&&R.towers.some(t=>t.side==='enemy'&&t.forecourtTower&&t.hp===4567)&&!R.$('.chronicleGateTower,.chronicleTowerHealth');}),'Both detached tower pairs mirror their actual HP, without wall-tower health');
  console.log('PASS Guest renders both detached tower pairs and mirrored HP; the wall remains decorative');
  const originalOffsets=await host.evaluate(()=>__ROADLORDS_RUNTIME__.towers.filter(t=>t.gateTower).map(t=>({id:t.id,lateral:t.lateral})));assert(await guest.evaluate(rows=>rows.every(t=>__ROADLORDS_RUNTIME__.towers.find(v=>v.id===t.id).lateral===-t.lateral),originalOffsets),'Both tower axes mirror along with the units');console.log('PASS Detached towers mirror vertically as well as horizontally with their projectiles');
  await guest.evaluate(()=>{window.speedPackets=[];__ROADLORDS_RUNTIME__.mpSend=p=>speedPackets.push(p);});
  await guest.locator('#speedBtn').click();assert.deepEqual(await guest.locator('#mpSpeedMenuV4971 [data-speed]').evaluateAll(items=>items.map(b=>Number(b.dataset.speed))),[1,2,3]);await guest.locator('#mpSpeedMenuV4971 [data-speed="3"]').click();
  const request=await guest.evaluate(()=>speedPackets.find(p=>p.type==='speed_request_v4971'));assert(request&&request.speed===3);
  await host.evaluate(data=>{const R=__ROADLORDS_RUNTIME__;window.speedReplies=[];R.mpSend=p=>speedReplies.push(p);R.mpHandle(data);},request);
  assert(await host.evaluate(()=>__ROADLORDS_RUNTIME__.state.speed===1&&document.querySelector('#mpSpeedPromptV4971').textContent.includes('3×')));
  const replies=await host.evaluate(()=>{document.querySelector('#mpSpeedPromptV4971 .accept').click();return speedReplies.filter(p=>p.type.startsWith('speed_'));});
  await guest.evaluate(replies=>replies.forEach(p=>__ROADLORDS_RUNTIME__.mpHandle(p)),replies);assert.equal(await host.evaluate(()=>__ROADLORDS_RUNTIME__.state.speed),3);assert.equal(await guest.evaluate(()=>__ROADLORDS_RUNTIME__.state.speed),3);
  console.log('PASS Multiplayer offers only 1×/2×/3× and requires the opponent to accept 3×');
  await guest.evaluate(()=>{const R=__ROADLORDS_RUNTIME__;window.gatePackets=[];R.mpSend=p=>gatePackets.push(p);});
  await guest.locator('#gateControls [data-gate="closed"]').click();
  assert(await guest.evaluate(()=>__ROADLORDS_RUNTIME__.P.gateMode==='closed'&&gatePackets.some(p=>p.type==='strategy')),'Guest gate buttons still send actual strategy updates');
  const changed=await host.evaluate(()=>{const R=__ROADLORDS_RUNTIME__,sent=[];R.roadResetCity(R.P,'undead');R.roadResetCity(R.E,'orc');R.P.normal.und_territory=3;R.mpSend=p=>sent.push(p);R.mpSendSnapshot(true);return{packet:sent.findLast(p=>p.type==='snapshot'),boundary:R.territoryBoundary()};});
  await guest.evaluate(async packet=>{const R=__ROADLORDS_RUNTIME__;R.mpApplySnapshot(packet);await R.loadChronicleArt();R.roadFocusLane(R.territoryBoundary());R.renderBattle(0);},changed.packet);
  assert(await guest.evaluate(boundary=>{const R=__ROADLORDS_RUNTIME__;return R.territoryBoundary()===R.PATH_LENGTH-boundary&&R.chronicle.boundary===R.territoryBoundary()&&R.chronicle.segments.some(s=>s.race==='undead');},changed.boundary),'Real snapshots mirror the advancing Undead terrain boundary');
  console.log('PASS The advancing Undead terrain cut mirrors correctly through real host snapshots');
  const cityArt=await guest.evaluate(async()=>{
   const R=__ROADLORDS_RUNTIME__;const loaded=await R.loadUndeadCityArt();
   const enemy=R.$('#enemyGrid .undMapSprite[data-undead-map="keep"]'),own=R.$('#playerGrid .orcMapSprite[data-orc-map="keep"]');
   return {loaded,own:!!own,rotation:enemy?.dataset.artRotation,source:enemy?.querySelector('image').getAttribute('href')};
  });
  assert(cityArt.loaded&&cityArt.own&&cityArt.rotation==='0'&&cityArt.source?.endsWith('art/undead/map-chronicle-core.webp'),'Mirrored capitals retain their separate Orc and new Undead city artwork: '+JSON.stringify(cityArt));
  console.log('PASS Real multiplayer snapshots use the new Undead city art without leaking it into the Orc city');
  assert.equal(errors.length,0,errors.join('\n'));console.log('PASS Default multiplayer gate controls send strategy updates without browser errors');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
