const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox','--disable-dev-shm-usage']});
 const report={checks:[],errors:[]},check=(name,ok)=>{assert(ok,name);report.checks.push(name);console.log('PASS',name);};
 try{
  const p=await browser.newPage({viewport:{width:1920,height:1080}});await p.route('https://**/*',r=>r.abort());p.on('pageerror',e=>report.errors.push(e.message));
  await p.goto(process.env.ROADLORDS_TEST_URL||'http://127.0.0.1:4173/Roadlords/');await p.waitForFunction(()=>window.__ROADLORDS_RUNTIME__?.startSpectator);
  await p.locator('.menuBrand').click();await p.waitForTimeout(900);await p.locator('#roadTestsMenu').click();
  check('Both spectator faction selectors offer all three factions independently',await p.evaluate(()=>['spectatorLeftRace','spectatorRightRace'].every(id=>[...document.getElementById(id).options].map(o=>o.value).join(',')==='human,orc,undead')));
  check('AI vs AI is the only battle mode left in the test menu',await p.locator('.roadTestsList button').count()===1&&await p.locator('#roadAiVsAiMenu').isVisible());
  await p.selectOption('#spectatorLeftRace','undead');await p.selectOption('#spectatorRightRace','orc');
  await p.route('**/art/battle/orc-warrior-heroes-parts.png',r=>r.abort(),{times:1});
  await p.evaluate(async()=>{await document.getElementById('roadAiVsAiMenu').onclick();});
  check('A failed model download keeps setup open rather than starting with old graphics',await p.evaluate(()=>!__ROADLORDS_RUNTIME__.spectator.active&&!document.querySelector('#roadTestsPanel').hidden&&!document.querySelector('#roadAiVsAiMenu').disabled));
  await p.evaluate(async()=>{await document.getElementById('roadAiVsAiMenu').onclick();__ROADLORDS_RUNTIME__.$('#pauseBtn').click();});
  check('A cold start retries the failed download and decodes only the two selected factions',await p.evaluate(()=>{const R=__ROADLORDS_RUNTIME__;return R.orcWarriorTexture?.naturalWidth>0&&R.orcSiegeTexture?.naturalWidth>0&&R.undeadCastersTexture?.naturalWidth>0&&R.skeletonTexture?.naturalWidth>0&&R.archerTexture?.naturalWidth>0&&!R.humanInfantryTexture;}));
  check('The menu starts the selected full game with normal starting resources, four building picks each, no free army and no legendary drought',await p.evaluate(()=>{
   const R=__ROADLORDS_RUNTIME__;return R.spectator.active&&!R.ROAD.test&&!R.MP.enabled&&!R.state.modal&&R.P.race==='undead'&&R.E.race==='orc'&&R.P.pickCount===4&&R.E.pickCount===4&&!(R.P.legendaryDrought||R.E.legendaryDrought)&&!R.state.units.length&&R.P.resources.wood===280&&R.P.buildings.length===1&&R.E.buildings.length===1;
  }));
  check('Each AI receives its own bonus choices without changing the other AI state',await p.evaluate(()=>{
   const R=__ROADLORDS_RUNTIME__,a=R.P.pickCount,b=R.E.pickCount;R.aiGrantPick(R.P,'ancient');const first=R.P.pickCount===a+1&&R.E.pickCount===b;R.aiGrantPick(R.E,'ancient');return first&&R.P.pickCount===a+1&&R.E.pickCount===b+1;
  }));
  check('Only the normal controls remain; the left deck is visible at the bottom left',await p.evaluate(()=>{
   const deck=document.querySelector('#relicBtn'),a=deck.getBoundingClientRect(),b=document.querySelector('.command').getBoundingClientRect();
   return !document.querySelector('#spectatorControls')&&getComputedStyle(deck).visibility==='visible'&&a.width>30&&a.left<200&&a.top>=b.top&&a.bottom<=b.bottom+1&&getComputedStyle(document.querySelector('.commandRail .tabs')).visibility==='hidden';
  }));
  await p.locator('#relicBtn').click();
  check('The left AI deck is inspectable without controlling its choices',await p.locator('#relicOverlay').getAttribute('data-deck-side')==='player');await p.keyboard.press('Escape');
  await p.locator('#enemyDeckBtn').click();
  check('The right AI deck is independently inspectable',await p.locator('#relicOverlay').getAttribute('data-deck-side')==='enemy');await p.keyboard.press('Escape');
  await p.evaluate(()=>{
   const R=__ROADLORDS_RUNTIME__;document.body.classList.add('roadlords-menu-open');R.updateHud();document.body.classList.remove('roadlords-menu-open');
   if(!R.ROAD.enemyPinned)R.$('#enemyCityPin').click();R.roadWar.scrollLeft=0;R.roadPositionPinnedCity();
   R.aiGrantPick(R.P,'ancient');R.aiGrantPick(R.E,'ancient');
  });
  check('Both AIs reveal their own real picked card independently at their visible cities',await p.locator('#playerPickReveal .cardFace').count()===1&&await p.locator('#enemyPickReveal .cardFace').count()===1);
  await p.waitForTimeout(3100);
  check('The left card flips to its own faction back and flies toward the bottom-left deck',await p.evaluate(()=>{
   const e=document.querySelector('#playerPickReveal'),deck=document.querySelector('#relicBtn').getBoundingClientRect(),flight=e?.getAnimations()[0];
   if(!e?.querySelector('.deckFlightBack [data-deck-race="undead"]')||!e.querySelector('.deckFlipInner').getAnimations().length||!flight)return false;
   const transform=new DOMMatrix(flight.effect.getKeyframes().at(-1).transform);
   const x=parseFloat(e.style.left)+parseFloat(e.style.width)/2+transform.m41,y=parseFloat(e.style.top)+parseFloat(e.style.height)/2+transform.m42;
   return Math.abs(x-deck.left-deck.width/2)<1&&Math.abs(y-deck.top-deck.height/2)<1&&transform.a<.1;
  }));
  await p.waitForTimeout(650);
  check('Both flights clean up and the left deck records its acquired cards',await p.locator('#playerPickReveal,#enemyPickReveal').count()===0&&await p.evaluate(()=>Number(document.querySelector('#relicCount').textContent)===__ROADLORDS_RUNTIME__.P.pickSerial));
  await p.evaluate(()=>{
   const R=__ROADLORDS_RUNTIME__;R.roadWar.scrollLeft=R.roadWorld.offsetWidth;R.aiGrantPick(R.P,'ancient');
  });
  check('Offscreen left-city choices are not shown or replayed on returning',await p.locator('#playerPickReveal').count()===0);
  await p.evaluate(()=>{const R=__ROADLORDS_RUNTIME__;R.roadWar.scrollLeft=0;});await p.waitForTimeout(80);
  check('Returning to the left city does not replay a hidden pick',await p.locator('#playerPickReveal').count()===0);
  const game=await p.evaluate(async()=>{
   const R=__ROADLORDS_RUNTIME__,random=Math.random;let seed=7;
   Math.random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
   try{await R.startSpectator({left:'undead',right:'orc'});R.state.running=true;
    // Economic openings and the long road do not promise contact by minute
    // four. Keep real deployment, then wait for actual combat with a hard bound.
    for(let n=0;n<6000&&!R.state.ended&&(n<2400||R.ROAD.metrics.damage<=0);n++)R.tick(.1);
   }finally{Math.random=random;}
   if(R.state.running)R.$('#pauseBtn').click();R.updateHud();R.renderBattle(0);
   const visibleBuildings=[...document.querySelectorAll('#playerGrid .building')];
   const leftRendered=visibleBuildings.length===R.P.buildings.length&&R.P.buildings.every(b=>visibleBuildings.some(el=>el.dataset.id===b.id&&el.querySelector('.blv')?.textContent===`L${b.level}`&&el.style.gridRowStart===String(b.row+1)&&el.style.gridColumnStart===String(b.col+1)));
   const first=visibleBuildings[0];R.updateHud();R.updateHud();
   return {leftRendered,stableDom:first===document.querySelector('#playerGrid .building'),time:R.state.time,left:{buildings:R.P.buildings.length,picks:R.P.pickCount,trained:R.P._matchStats?.unitProducedTotal||0,deployed:R.state.units.filter(u=>u.side==='player'&&u.alive).length},right:{buildings:R.E.buildings.length,picks:R.E.pickCount,trained:R.E._matchStats?.unitProducedTotal||0,deployed:R.state.units.filter(u=>u.side==='enemy'&&u.alive).length},damage:R.ROAD.metrics.damage,error:R.state.lastRuntimeErrorV4965};
  });report.game=game;
  check('Both independent AIs actually build, choose, train and deploy through the real game loop',game.time>180&&[game.left,game.right].every(c=>c.buildings>=4&&c.picks>4&&c.trained>0&&c.deployed>0)&&!game.error);
  check('Left AI buildings, positions and levels appear without a manual full redraw',game.leftRendered);
  check('Unchanged HUD updates preserve existing city DOM instead of rebuilding it',game.stableDom);
  check('The two armies fight with actual timed attack damage',game.damage>0);
  check('Spectator cannot place, demolish or change the left AI gate',await p.evaluate(()=>{
   const R=__ROADLORDS_RUNTIME__,before=JSON.stringify([R.P.buildings,R.P.resources,R.P.gateMode]);R.tryPlace(0,0);R.demolish(R.P,R.P.buildings.find(b=>b.type!=='keep').id);R.setGate('open');return JSON.stringify([R.P.buildings,R.P.resources,R.P.gateMode])===before;
  }));
  await p.screenshot({path:'artifacts/ai-spectator-city.png'});
  await p.evaluate(async()=>{const R=__ROADLORDS_RUNTIME__;await R.$('#restartBtn').onclick();if(R.state.running)R.$('#pauseBtn').click();});
  check('Restart retains the selected factions and resets choices, troops and timers',await p.evaluate(()=>{const R=__ROADLORDS_RUNTIME__;return R.P.race==='undead'&&R.E.race==='orc'&&R.state.time<1&&R.P.pickCount===4&&R.E.pickCount===4&&!R.state.units.length&&R.state.timedPickCount===0;}));
  await p.locator('#speedBtn').click();check('The normal speed control works without a multiplayer vote',await p.evaluate(()=>__ROADLORDS_RUNTIME__.state.speed===2&&!__ROADLORDS_RUNTIME__.MP.enabled));
  await p.locator('#pauseBtn').click();check('The normal pause control can resume the game',await p.evaluate(()=>__ROADLORDS_RUNTIME__.state.running));await p.keyboard.press('Space');
  check('Space pauses through the standard control',await p.evaluate(()=>!__ROADLORDS_RUNTIME__.state.running));
  check('Each controller has an independent pick timer, including the Human Empire branch',await p.evaluate(async()=>{
   const R=__ROADLORDS_RUNTIME__;await R.startSpectator({left:'human',right:'human'});R.$('#pauseBtn').click();R.P._aiPickDue=30;R.E._aiPickDue=30;R.applyChoice(R.P,{kind:'building_branch',id:'keep',branch:'empire'});return R.P._aiPickDue===15&&R.E._aiPickDue===30&&R.state.nextPick===15;
  }));
  for(const [left,right]of [['human','human'],['orc','undead'],['undead','undead']])check(left+' vs '+right+': independent cities start legally',await p.evaluate(async({left,right})=>{const R=__ROADLORDS_RUNTIME__;await R.startSpectator({left,right});R.$('#pauseBtn').click();return R.P.race===left&&R.E.race===right&&R.P.pickCount===4&&R.E.pickCount===4&&R.P.unlocked!==R.E.unlocked&&R.P.normal!==R.E.normal;},{left,right}));
  const models=await p.evaluate(()=>{
   const R=__ROADLORDS_RUNTIME__,models={};R.state.units=[];
   for(const race of ['human','orc','undead']){
    R.roadResetCity(R.P,race);
    for(const key of Object.keys(R.UNITS).filter(key=>R.factionUnitMatches(race,R.UNITS[key]))){
     R.ROAD.sprites.clear();const u=R.releaseUnit(R.P,{key});u.lane=R.ROAD.camera+350;u.offset=0;u.roadMoving=false;R.roadDrawUnit(u);
     models[key]=[...R.ROAD.sprites.values()].at(-1)?.figureRig?.painted===true;
    }
   }
   R.state.units=[];return models;
  });report.models=models;
  check('All 21 units use the approved new models in the real spectator renderer',Object.keys(models).length===21&&Object.values(models).every(Boolean));
  check('Both AIs obey the city army capacity below the separate global ceiling',await p.evaluate(async()=>{
   const R=__ROADLORDS_RUNTIME__;await R.startSpectator({left:'human',right:'orc'});R.$('#pauseBtn').click();R.state.units=[];
   return [R.P,R.E].every(c=>{
    const key=c===R.P?'swordsman':'orc_goblin';c.armyCap=3;c.garrisonCap=30;c.gateMode='closed';
    for(let i=0;i<3;i++)R.releaseUnit(c,R.makeEntry(c,key));
    c.garrison=[R.makeEntry(c,key)];R.aiGate(c);const waits=c.gateMode==='closed';
    c.garrison=[];c.releaseQueue=[R.makeEntry(c,key)];c.gateMode='open';R.releaseQueues(1);
    const blocked=R.fieldUnitCount(c)===3&&c.releaseQueue.length===1;
    R.state.units.find(u=>u.alive&&u.side===R.sideForCity(c)).alive=false;R.releaseQueues(1);
    return waits&&blocked&&R.fieldUnitCount(c)===3&&!c.releaseQueue.length;
   });
  }));
  for(const race of ['human','orc','undead']){
   const limits=await p.evaluate(async race=>{
    const R=__ROADLORDS_RUNTIME__;await R.startSpectator({left:race,right:race});R.$('#pauseBtn').click();R.state.units=[];
    const key={human:'swordsman',orc:'orc_goblin',undead:'und_skeleton'}[race],type={human:'barracks',orc:'orc_gob',undead:'und_graveyard'}[race],out=[];
    for(const c of [R.P,R.E]){
     c.armyCap=2000;c.garrisonCap=1000;c.resources=R.C(1e6,1e6,1e6);c.caps=R.C(1e9,1e9,1e9);c.gateMode='open';
     for(let i=0;i<750;i++)R.releaseUnit(c,R.makeEntry(c,key));
     const before={...c.resources},b={id:'ai-cap-spawner',type,level:1,row:0,col:0,rotation:0,progress:1};
     c.releaseQueue=[R.makeEntry(c,key)];R.releaseQueues(1);
     const blocked=!R.releaseUnit(c,R.makeEntry(c,key))&&!R.normalSpawn(c,b);
     const summons=race!=='undead'||!R.undSpawn(c,'und_ghost',1000,0,{undNoArmySlot:true,undSummoned:true});
     const full=R.battlePopulation(c)===750&&c.releaseQueue.length===1&&R.RES.every(r=>before[r]===c.resources[r]);
     R.state.units.find(u=>u.alive&&u.side===R.sideForCity(c)).alive=false;R.releaseQueues(1);
     out.push(R.aiControlsCity(c)&&blocked&&summons&&full&&R.battlePopulation(c)===750&&c.releaseQueue.length===0);
    }
    return !R.ROAD.test&&out.every(Boolean);
   },race);
   check(race+': both real AIs respect 750 actors, preserve resources/queued units and resume after a casualty',limits);
  }
  await p.evaluate(async()=>{
   const R=__ROADLORDS_RUNTIME__;R.roadStartTest(42,{count:5,roster:'figures',figureStyle:'simple'});
   await R.startSpectator({left:'human',right:'orc'});R.$('#pauseBtn').click();
  });
  check('An old diagnostic fixture cannot leak old graphics, free armies, levels or limit bypasses into AI vs AI',await p.evaluate(()=>{
   const R=__ROADLORDS_RUNTIME__;return !R.ROAD.test&&!R.state.roadTest&&R.ROAD.testRoster===null&&R.ROAD.testCount===0&&!R.ROAD.initial&&R.ROAD.figureStyle==='painted'&&!R.state.units.length&&[R.P,R.E].every(c=>c.buildings.length===1&&R.levelOf(c,'keep')===1&&c.pickCount===4&&R.battlePopulationRoom(c)===750);
  }));
  await p.locator('#ownCityPin').click();
  check('The new own-city pin also works in the full AI spectator match',await p.locator('#ownCityPin').getAttribute('aria-pressed')==='true');
  await p.locator('#ownCityPin').click();
  await p.screenshot({path:'artifacts/ai-spectator.png'});
  check('Leaving spectator mode restores a fresh normal game with only the opponent under AI control',await p.evaluate(()=>{
   const R=__ROADLORDS_RUNTIME__;R.stopSpectator();return !R.spectator.active&&!R.aiControlsCity(R.P)&&R.aiControlsCity(R.E)&&R.state.time===0&&R.state.startChoices===4&&!R.state.units.length&&R.P.buildings.length===1;
  }));
  await p.locator('#ownCityPin').click();
  await p.evaluate(()=>{const R=__ROADLORDS_RUNTIME__;R.roadWar.scrollLeft=2000;R.roadPositionPinnedCity();});
  check('Own-city pin remains functional in normal play outside spectator and diagnostic modes',await p.evaluate(()=>{
   const R=__ROADLORDS_RUNTIME__,a=document.querySelector('.roadOwnCity').getBoundingClientRect(),w=R.roadWar.getBoundingClientRect();return !R.spectator.active&&!R.ROAD.test&&R.ROAD.ownPinned&&Math.abs(a.left-w.left)<2;
  }));
  check('No spectator browser errors',report.errors.length===0);
 }finally{fs.mkdirSync('artifacts',{recursive:true});fs.writeFileSync('artifacts/ai-spectator.json',JSON.stringify(report,null,2));await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
