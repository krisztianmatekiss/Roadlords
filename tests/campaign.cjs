const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox','--disable-dev-shm-usage']});
 const report={checks:[],errors:[],encounters:[]},check=(name,ok,data)=>{assert(ok,name+(data?' '+JSON.stringify(data):''));report.checks.push(name);console.log('PASS',name);};
 try{
  const p=await browser.newPage({viewport:{width:1920,height:1080}});await p.route('https://**/*',r=>r.abort());p.on('pageerror',e=>report.errors.push(e.message));
  await p.goto(process.env.ROADLORDS_TEST_URL||'http://127.0.0.1:4173/Roadlords/');await p.waitForFunction(()=>window.__ROADLORDS_RUNTIME__?.menuOpening.ready);
  await p.locator('.menuBrand').click();await p.locator('#campaignBtn').click();
  await p.selectOption('#campaignRace','undead');await p.locator('[data-campaign-action="new"]').click();
  await p.evaluate(()=>{const C=__ROADLORDS_RUNTIME__.campaign;C.run.seed=42;C.save();C.view.render();});
  check('Campaign and Quick Game are separate playable menu entries',await p.locator('#mpSolo').textContent()==='GYORS JÁTÉK'&&await p.locator('#campaignOverlay').isVisible());
  await p.screenshot({path:'artifacts/campaign-start.png'});
  for(let stage=0;stage<5;stage++){
   await p.locator('[data-campaign-action="battle"]').click();await p.waitForFunction(()=>!__ROADLORDS_RUNTIME__.campaign.loading);
   check(`Stage ${stage+1} finishes loading and prepares the battlefield`,await p.evaluate(()=>__ROADLORDS_RUNTIME__.state.pregame),await p.evaluate(()=>__ROADLORDS_RUNTIME__.campaign.message));
   const setup=await p.evaluate(()=>{const R=__ROADLORDS_RUNTIME__,C=R.campaign,e=C.encounter();return {stage:C.run.stage,entry:e,normal:R.P.normal,carry:C.run.relics,actual:[...R.P.legends],units:R.state.units.length,test:R.ROAD.test,spectator:R.spectator.active,multi:R.MP.enabled,buildings:R.E.buildings.map(b=>({type:b.type,level:b.level,branch:R.E.l4Branches[b.type],protected:b.campaignProtected})),income:R.productionRates(R.E).wood,use:R.resourceFlowRates(R.E).use.wood,blocked:R.$('#pregameRefreshRight').disabled};});report.encounters.push(setup);
   check(`Stage ${stage+1} uses a fresh real match and carries only campaign relics`,setup.stage===stage&&!setup.test&&!setup.spectator&&!setup.multi&&setup.units===0&&Object.keys(setup.normal).length===0&&setup.carry.length===stage&&setup.carry.every(id=>setup.actual.includes(id))&&setup.blocked,setup);
   if(stage===0)check('The first enemy has no free buildings, relics or army',setup.entry.level===0&&setup.entry.relics.length===0&&setup.buildings.length===1);
   if(stage===2||stage===3)check(`Stage ${stage+1} really owns its advertised upgraded military building`,setup.buildings.some(b=>b.type===setup.entry.building&&b.level===setup.entry.level&&b.protected&&(b.level!==4||b.branch===setup.entry.branch)),setup);
   if(stage===4)check('The fifth enemy is the sustainable Vampire boss with actual L3/L4/L4 buildings',setup.entry.boss&&setup.entry.race==='undead'&&[['keep',3],['und_vampire_castle',4],['und_well',4]].every(([type,level])=>setup.buildings.some(b=>b.type===type&&b.level===level))&&setup.income>setup.use,setup);
   await p.locator('#pregameReady').click();
   for(let n=0;n<4;n++){
    await p.waitForFunction(()=>{const R=__ROADLORDS_RUNTIME__;return R.state.choiceContext?.source==='start'&&performance.now()>=R.pickInputGuard.until;});
    await p.locator('#choiceList .choice').first().click();
   }
   await p.evaluate(()=>{const R=__ROADLORDS_RUNTIME__;R.state.running=false;R.$('#pauseBtn').classList.add('on');R.$('#pauseBtn').textContent='▶';});
   check(`Stage ${stage+1} completes all four real starter selections`,await p.evaluate(()=>__ROADLORDS_RUNTIME__.state.startChoices===0));
   const pools=await p.evaluate(()=>{const R=__ROADLORDS_RUNTIME__;return {relic:R.eligibleLegendary(R.P).some(d=>R.isRelic(d.id)),all:R.LEGENDARY.length,definitions:R.RELICS.length};});
   check(`Stage ${stage+1} excludes relics from battle drafts while keeping canonical definitions`,!pools.relic&&pools.all===114&&pools.definitions===8);
   if(stage===4){
    const live=await p.evaluate(()=>{const R=__ROADLORDS_RUNTIME__;R.state.running=true;
     for(let n=0;n<1200&&!R.state.ended;n++){
      const ctx=R.state.choiceContext;if(ctx?.opts.length)R.choose(ctx.opts[0],0);
      R.tick(.1);
     }
     R.state.running=false;R.$('#pauseBtn').classList.add('on');R.$('#pauseBtn').textContent='▶';
     return {time:R.state.time,trained:R.E._matchStats?.unitProducedTotal||0,buildings:R.E.buildings.map(b=>[b.type,b.level,b.campaignProtected]),error:R.state.lastRuntimeErrorV4965,ended:R.state.ended};
    });report.liveBoss=live;
    check('The boss builds and trains real units through two minutes of the normal campaign loop',live.time>110&&live.trained>0&&!live.error&&!live.ended&&[['keep',3],['und_well',4],['und_vampire_castle',4]].every(([type,level])=>live.buildings.some(b=>b[0]===type&&b[1]>=level)),live);
   }
   await p.evaluate(()=>{const R=__ROADLORDS_RUNTIME__;R.P.normal.frugal_training=2;R.E.hp=0;R.finish(true);R.finish(true);});
   if(stage<4){
    check(`Victory ${stage+1} offers three distinct persistent relics`,await p.evaluate(()=>{const C=__ROADLORDS_RUNTIME__.campaign;return C.run.status==='reward'&&C.run.offers.length>=3&&new Set(C.run.offers).size===C.run.offers.length&&C.run.offers.every(id=>!C.run.relics.includes(id));}));
    if(stage===0){
     check('Reward card descriptions stay light and readable on their dark card panels',await p.locator('.campaignReward .rlCodexContent p').evaluateAll(es=>es.length===3&&es.every(e=>{const rgb=getComputedStyle(e).color.match(/\d+/g).map(Number);return rgb.slice(0,3).reduce((a,b)=>a+b,0)>500;})));
     await p.screenshot({path:'artifacts/campaign-reward.png'});
    }
    const choice=await p.locator('[data-campaign-reward]').first().getAttribute('data-campaign-reward');
    await p.locator('[data-campaign-reward]').first().click();
    check(`Reward ${stage+1} advances exactly once and cannot be claimed twice`,await p.evaluate(id=>{const C=__ROADLORDS_RUNTIME__.campaign,n=C.run.stage;return !C.chooseReward(id)&&C.run.stage===n&&C.run.relics.length===n&&C.run.results.length===n;},choice));
   }
  }
  check('The fifth victory completes the campaign with four carried relics and five results',await p.evaluate(()=>{const C=__ROADLORDS_RUNTIME__.campaign;return C.run.status==='complete'&&C.run.stage===4&&C.run.relics.length===4&&C.run.results.length===5;}));
  await p.screenshot({path:'artifacts/campaign-complete.png'});
  await p.locator('[data-campaign-action="menu"]').click();await p.waitForFunction(()=>window.__ROADLORDS_RUNTIME__?.menuOpening.ready&&!__ROADLORDS_RUNTIME__.campaign.active);
  check('Reload preserves completed progression without applying campaign effects to Quick Game',await p.evaluate(()=>{const R=__ROADLORDS_RUNTIME__;return R.campaign.run.status==='complete'&&R.P.legends.size===0&&!R.campaign.active&&R.eligibleLegendary(R.P).some(d=>R.isRelic(d.id));}));
  await p.locator('#rlOpenCodex').click();await p.locator('[data-tab="relics"]').click();
  check('The codex uses the same eight relic definitions and clearly marks their card type',await p.locator('#rlCodexPanel [data-codex-upgrade]').count()===8&&await p.locator('#rlCodexPanel .cardFooter').evaluateAll(es=>es.every(e=>e.textContent==='EREKLYE')));
  check('Campaign, reward, reload and codex have no browser errors',report.errors.length===0,report.errors);
 }finally{fs.mkdirSync('artifacts',{recursive:true});fs.writeFileSync('artifacts/campaign.json',JSON.stringify(report,null,2));await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
