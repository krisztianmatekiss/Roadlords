const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox','--disable-dev-shm-usage']});
 const report={checks:[],errors:[],encounters:[]},check=(name,ok,data)=>{assert(ok,name+(data?' '+JSON.stringify(data):''));report.checks.push(name);console.log('PASS',name);};
 try{
  const p=await browser.newPage({viewport:{width:1920,height:1080}});await p.route('https://**/*',r=>r.abort());p.on('pageerror',e=>report.errors.push(e.message));
  await p.goto(process.env.ROADLORDS_TEST_URL||'http://127.0.0.1:4173/Roadlords/');await p.waitForFunction(()=>window.__ROADLORDS_RUNTIME__?.menuOpening.ready);
  await p.locator('.menuBrand').click();await p.locator('#campaignBtn').click();await p.selectOption('#campaignRace','undead');await p.locator('[data-campaign-action="new"]').click();
  await p.evaluate(()=>{const C=__ROADLORDS_RUNTIME__.campaign;C.run.seed=42;C.save();C.view.render();});
  check('Campaign and Quick Game remain separate menu entries',await p.locator('#mpSolo').textContent()==='GYORS JÁTÉK'&&await p.locator('#campaignOverlay').isVisible());
  for(let stage=0;stage<5;stage++){
   await p.locator('[data-campaign-action="battle"]').click();await p.waitForFunction(()=>!__ROADLORDS_RUNTIME__.campaign.loading);
   const setup=await p.evaluate(()=>{const R=__ROADLORDS_RUNTIME__,C=R.campaign;return {stage:C.run.stage,pregame:R.state.pregame,entry:C.encounter(),permanent:structuredClone(C.run.permanent),unlocked:[...R.P.unlocked],levels:structuredClone(R.P.levels),normal:structuredClone(R.P.normal),legends:[...R.P.legends],buildings:R.P.buildings.map(b=>[b.type,b.level]),enemy:R.E.buildings.map(b=>[b.type,b.level,b.campaignProtected]),income:R.productionRates(R.E).wood,use:R.resourceFlowRates(R.E).use.wood,test:R.ROAD.test,spectator:R.spectator.active,multi:R.MP.enabled};});report.encounters.push(setup);
   check(`Stage ${stage+1} starts a real fresh match with no free player buildings`,setup.stage===stage&&setup.pregame&&!setup.test&&!setup.spectator&&!setup.multi&&setup.buildings.length===1&&setup.buildings[0][0]==='keep',setup);
   if(stage===0)check('The first enemy has no extra buildings or legendaries',setup.entry.level===0&&setup.entry.legendaries.length===0&&setup.enemy.length===1);
   if(stage>=2)check('The rewarded capital starter begins at L2',setup.buildings[0][1]===2&&setup.levels.keep===2);
   if(stage>=3)check('The selected three normal copies are active from the next battle',setup.normal.und_home_march===3);
   if(stage===4)check('The boss starts with L3 capital, L4 Well and Vampire Castle and real upkeep',setup.entry.boss&&[['keep',3],['und_vampire_castle',4],['und_well',4]].every(([id,lv])=>setup.enemy.some(b=>b[0]===id&&b[1]===lv))&&setup.income>setup.use&&setup.legends.includes('und_first_guard'),setup);
   await p.locator('#pregameReady').click();
   for(let n=0;n<4;n++){
    await p.waitForFunction(()=>{const R=__ROADLORDS_RUNTIME__;return R.state.choiceContext?.source==='start'&&performance.now()>=R.pickInputGuard.until;});await p.locator('#choiceList .choice').first().click();
   }
   await p.evaluate(()=>{const R=__ROADLORDS_RUNTIME__;R.state.running=false;R.$('#pauseBtn').classList.add('on');});
   check(`Stage ${stage+1} retains four normal starter choices`,await p.evaluate(()=>__ROADLORDS_RUNTIME__.state.startChoices===0));
   if(stage===2)await p.evaluate(()=>{const R=__ROADLORDS_RUNTIME__;for(let n=0;n<5;n++)R.applyChoice(R.P,R.upgradeCatalog.option('und_home_march','common'));});
   if(stage===3)await p.evaluate(()=>{const R=__ROADLORDS_RUNTIME__;R.applyChoice(R.P,{...R.upgradeCatalog.definition('und_first_guard','legendary'),kind:'legendary'});});
   if(stage===4){
    const live=await p.evaluate(()=>{const R=__ROADLORDS_RUNTIME__;R.state.running=true;for(let n=0;n<2400&&R.state.time<60&&!R.state.ended;n++){const ctx=R.state.choiceContext;if(ctx?.opts.length)R.choose(ctx.opts[0],0);else if(ctx)R.$('#skipChoice').onclick();R.tick(.1);}R.state.running=false;return {time:R.state.time,trained:R.E._matchStats?.unitProducedTotal||0,error:R.state.lastRuntimeErrorV4965,ended:R.state.ended};});
    check('The Vampire boss still builds and trains through a real minute of the ordinary simulation',live.time>=60&&live.trained>0&&!live.error&&!live.ended,live);
   }
   await p.evaluate(()=>{const R=__ROADLORDS_RUNTIME__;R.E.hp=0;R.finish(true);R.finish(true);});
   if(stage<4){
    check(`Victory ${stage+1} offers exactly the four reward types`,await p.locator('[data-campaign-reward-type]').count()===4);
    if(stage===0){
     check('Without earned upgrades, normal and legendary rewards are visibly unavailable',await p.locator('[data-campaign-reward-type="normal"]').isDisabled()&&await p.locator('[data-campaign-reward-type="legendary"]').isDisabled());
     await p.screenshot({path:'artifacts/campaign-reward.png'});
     await p.locator('[data-campaign-reward-type="starter"]').click();const id=await p.locator('[data-campaign-building]').first().getAttribute('data-campaign-building');await p.locator('[data-campaign-building]').first().click();
     check('The new starter comes from this battle and starts at L1',await p.evaluate(id=>{const C=__ROADLORDS_RUNTIME__.campaign;return C.run.starters[id]?.level===1&&C.run.rewards.length===1;},id));
    }else if(stage===1){await p.locator('[data-campaign-reward-type="level"]').click();await p.locator('[data-campaign-building="keep"]').click();}
    else if(stage===2){await p.locator('[data-campaign-reward-type="normal"]').click();for(let n=0;n<3;n++)await p.locator('[data-campaign-card="normal:und_home_march:common"]').click();await p.locator('[data-campaign-action="confirm-reward"]').click();}
    else{await p.locator('[data-campaign-reward-type="legendary"]').click();await p.locator('[data-campaign-card="legendary:und_first_guard:"]').click();await p.locator('[data-campaign-action="confirm-reward"]').click();}
    check(`Reward ${stage+1} commits one option and advances exactly once`,await p.evaluate(stage=>{const C=__ROADLORDS_RUNTIME__.campaign;return C.run.status==='ready'&&C.run.stage===stage+1&&C.run.rewards.length===stage+1&&C.run.loot===null&&!C.chooseReward({type:'level',id:'keep'});},stage));
   }
  }
  check('The fifth victory completes the five-fight campaign without a sixth reward',await p.evaluate(()=>{const run=__ROADLORDS_RUNTIME__.campaign.run;return run.status==='complete'&&run.stage===4&&run.rewards.length===4&&run.results.length===5&&run.permanent.reduce((n,c)=>n+c.count,0)===4;}));
  await p.screenshot({path:'artifacts/campaign-complete.png'});
  await p.locator('[data-campaign-action="menu"]').click();await p.waitForFunction(()=>window.__ROADLORDS_RUNTIME__?.menuOpening.ready&&!__ROADLORDS_RUNTIME__.campaign.active);
  check('Completed campaign reloads without applying its permanent cards to Quick Game',await p.evaluate(()=>{const R=__ROADLORDS_RUNTIME__;return R.campaign.run?.status==='complete'&&R.P.legends.size===0&&R.upgradeCatalog.count(R.P)===0&&!R.campaign.active;}));
  check('Campaign rewards, real starter selections and boss simulation have no browser errors',report.errors.length===0,report.errors);
 }finally{fs.mkdirSync('artifacts',{recursive:true});fs.writeFileSync('artifacts/campaign.json',JSON.stringify(report,null,2));await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
