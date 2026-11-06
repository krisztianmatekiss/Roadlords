const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox','--disable-dev-shm-usage']});
 const report={checks:[],errors:[]},check=(name,ok)=>{assert(ok,name);report.checks.push(name);console.log('PASS',name);};
 try{
  const p=await browser.newPage({viewport:{width:1920,height:1080}});await p.route('https://**/*',r=>r.abort());p.on('pageerror',e=>report.errors.push(e.message));
  await p.goto(process.env.ROADLORDS_TEST_URL||'http://127.0.0.1:4173/Roadlords/');await p.waitForFunction(()=>window.__ROADLORDS_RUNTIME__?.startSpectator);
  await p.locator('.menuBrand').click();await p.waitForTimeout(900);await p.locator('#roadTestsMenu').click();
  check('Both spectator faction selectors offer all three factions independently',await p.evaluate(()=>['spectatorLeftRace','spectatorRightRace'].every(id=>[...document.getElementById(id).options].map(o=>o.value).join(',')==='human,orc,undead')));
  await p.selectOption('#spectatorLeftRace','undead');await p.selectOption('#spectatorRightRace','orc');
  await p.evaluate(()=>{document.getElementById('roadAiVsAiMenu').click();__ROADLORDS_RUNTIME__.$('#pauseBtn').click();});
  check('The menu starts the selected full game with normal starting resources, four building picks each, no free army and no legendary drought',await p.evaluate(()=>{
   const R=__ROADLORDS_RUNTIME__;return R.spectator.active&&!R.ROAD.test&&!R.MP.enabled&&!R.state.modal&&R.P.race==='undead'&&R.E.race==='orc'&&R.P.pickCount===4&&R.E.pickCount===4&&!(R.P.legendaryDrought||R.E.legendaryDrought)&&!R.state.units.length&&R.P.resources.wood===280&&R.P.buildings.length===1&&R.E.buildings.length===1;
  }));
  check('Each AI receives its own bonus choices without changing the other AI state',await p.evaluate(()=>{
   const R=__ROADLORDS_RUNTIME__,a=R.P.pickCount,b=R.E.pickCount;R.aiGrantPick(R.P,'ancient');const first=R.P.pickCount===a+1&&R.E.pickCount===b;R.aiGrantPick(R.E,'ancient');return first&&R.P.pickCount===a+1&&R.E.pickCount===b+1;
  }));
  await p.locator('#spectatorLeftDeck').click();
  check('The left AI deck is inspectable without controlling its choices',await p.locator('#relicOverlay').getAttribute('data-deck-side')==='player');await p.keyboard.press('Escape');
  await p.locator('#spectatorRightDeck').click();
  check('The right AI deck is independently inspectable',await p.locator('#relicOverlay').getAttribute('data-deck-side')==='enemy');await p.keyboard.press('Escape');
  const game=await p.evaluate(()=>{
   const R=__ROADLORDS_RUNTIME__;R.startSpectator({left:'undead',right:'orc'});R.state.running=true;
   for(let n=0;n<2400&&!R.state.ended;n++)R.tick(.1);
   if(R.state.running)R.$('#pauseBtn').click();R.updateHud();R.renderStatic();R.renderBattle(0);
   return {time:R.state.time,left:{buildings:R.P.buildings.length,picks:R.P.pickCount,trained:R.P._matchStats?.unitProducedTotal||0,deployed:R.state.units.filter(u=>u.side==='player'&&u.alive).length},right:{buildings:R.E.buildings.length,picks:R.E.pickCount,trained:R.E._matchStats?.unitProducedTotal||0,deployed:R.state.units.filter(u=>u.side==='enemy'&&u.alive).length},damage:R.ROAD.metrics.damage,error:R.state.lastRuntimeErrorV4965};
  });report.game=game;
  check('Both independent AIs actually build, choose, train and deploy through the real game loop',game.time>180&&[game.left,game.right].every(c=>c.buildings>=4&&c.picks>4&&c.trained>0&&c.deployed>0)&&!game.error);
  check('The two armies fight with actual timed attack damage',game.damage>0);
  check('Spectator cannot place, demolish or change the left AI gate',await p.evaluate(()=>{
   const R=__ROADLORDS_RUNTIME__,before=JSON.stringify([R.P.buildings,R.P.resources,R.P.gateMode]);R.tryPlace(0,0);R.demolish(R.P,R.P.buildings.find(b=>b.type!=='keep').id);R.setGate('open');return JSON.stringify([R.P.buildings,R.P.resources,R.P.gateMode])===before;
  }));
  await p.locator('#spectatorRestart').click();await p.evaluate(()=>{const R=__ROADLORDS_RUNTIME__;if(R.state.running)R.$('#pauseBtn').click();});
  check('Restart retains the selected factions and resets choices, troops and timers',await p.evaluate(()=>{const R=__ROADLORDS_RUNTIME__;return R.P.race==='undead'&&R.E.race==='orc'&&R.state.time<1&&R.P.pickCount===4&&R.E.pickCount===4&&!R.state.units.length&&R.state.timedPickCount===0;}));
  await p.locator('#spectatorSpeed').click();check('Spectator speed changes without opening a multiplayer vote',await p.evaluate(()=>__ROADLORDS_RUNTIME__.state.speed===2&&!__ROADLORDS_RUNTIME__.MP.enabled));
  await p.locator('#spectatorPause').click();check('Pause control can resume the game',await p.evaluate(()=>__ROADLORDS_RUNTIME__.state.running));await p.locator('#spectatorPause').click();
  check('Each controller has an independent pick timer, including the Human Empire branch',await p.evaluate(()=>{
   const R=__ROADLORDS_RUNTIME__;R.startSpectator({left:'human',right:'human'});R.$('#pauseBtn').click();R.P._aiPickDue=30;R.E._aiPickDue=30;R.applyChoice(R.P,{kind:'building_branch',id:'keep',branch:'empire'});return R.P._aiPickDue===15&&R.E._aiPickDue===30&&R.state.nextPick===15;
  }));
  for(const [left,right]of [['human','human'],['orc','undead'],['undead','undead']])check(left+' vs '+right+': independent cities start legally',await p.evaluate(({left,right})=>{const R=__ROADLORDS_RUNTIME__;R.startSpectator({left,right});R.$('#pauseBtn').click();return R.P.race===left&&R.E.race===right&&R.P.pickCount===4&&R.E.pickCount===4&&R.P.unlocked!==R.E.unlocked&&R.P.normal!==R.E.normal;},{left,right}));
  await p.screenshot({path:'artifacts/ai-spectator.png'});
  check('Leaving spectator mode restores a fresh normal game with only the opponent under AI control',await p.evaluate(()=>{
   const R=__ROADLORDS_RUNTIME__;R.stopSpectator();return !R.spectator.active&&!R.aiControlsCity(R.P)&&R.aiControlsCity(R.E)&&R.state.time===0&&R.state.startChoices===4&&!R.state.units.length&&R.P.buildings.length===1;
  }));
  check('No spectator browser errors',report.errors.length===0);
 }finally{fs.mkdirSync('artifacts',{recursive:true});fs.writeFileSync('artifacts/ai-spectator.json',JSON.stringify(report,null,2));await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
