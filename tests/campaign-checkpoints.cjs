const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{
 const D=await import('data:text/javascript;base64,'+fs.readFileSync('src/campaign/definitions.js').toString('base64'));
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox','--disable-dev-shm-usage']});
 const report={checks:[],errors:[]},check=(name,ok,data)=>{assert(ok,name+(data?' '+JSON.stringify(data):''));report.checks.push(name);console.log('PASS',name);};
 try{
  const p=await browser.newPage({viewport:{width:1920,height:1080}});await p.route('https://**/*',r=>r.abort());p.on('pageerror',e=>report.errors.push(e.message));
  const url=process.env.ROADLORDS_TEST_URL||'http://127.0.0.1:4173/Roadlords/';await p.goto(url);await p.waitForFunction(()=>window.__ROADLORDS_RUNTIME__?.menuOpening.ready);
  const catalog=await p.evaluate(()=>__ROADLORDS_RUNTIME__.campaign.catalog),valid=D.newCampaignRun('human',42,catalog.human.basics);
  check('New checkpoints roundtrip with their actual faction starter set',JSON.stringify(D.readCampaignRun(JSON.stringify(valid),catalog))===JSON.stringify(valid));
  const corrupt=['{',JSON.stringify({...valid,stage:5}),JSON.stringify({...valid,race:'unknown'}),JSON.stringify({...valid,starters:{keep:{level:1,branch:null}}}),JSON.stringify({...valid,starters:{...valid.starters,keep:{level:4,branch:'wrong'}}}),JSON.stringify({...valid,stage:1,permanent:[{id:'und_first_guard',kind:'legendary',count:1}]}),JSON.stringify({...valid,status:'reward',loot:{unlocked:['keep'],cards:[{id:'all_damage',kind:'normal',rarity:'bad',count:3}]}}),JSON.stringify({...valid,status:'reward',loot:null})];
  check('Malformed, foreign-card, missing-starter and invalid L4/rarity checkpoints are rejected',corrupt.every(raw=>D.readCampaignRun(raw,catalog)===null));
  for(const race of D.CAMPAIGN_RACES){
   for(const schema of [1,2]){
    const relics=schema===1?['specialization','wide_choice']:race==='human'?['specialization','campaign_blueprints']:race==='orc'?['orc_momentum','orc_war_banner']:['und_elite_birth','gen_soul_frugal'];
    const old={schema,race,seed:42,stage:2,status:'reward',relics,offers:['unused'],results:[{time:50},{time:60},{time:70}]};
    const run=D.readCampaignRun(JSON.stringify(old),catalog);
    check(`${race}: schema ${schema} campaign migrates seed, stage, pending reward and permanent advantages`,run?.schema===3&&run.stage===2&&run.seed===42&&run.status==='reward'&&run.permanent.length===2&&run.permanent.every(c=>c.kind==='legendary'&&catalog[race].legends.includes(c.id))&&run.results.length===3&&run.loot&&D.readCampaignRun(JSON.stringify(run),catalog)?.stage===2,run);
   }
  }
  await p.locator('.menuBrand').click();await p.locator('#campaignBtn').click();
  for(const race of D.CAMPAIGN_RACES){
   await p.evaluate(async race=>{const R=__ROADLORDS_RUNTIME__,C=R.campaign;C.newRun(race);C.run.stage=2;C.run.starters.keep.level=3;C.run.rewards=[{type:'level'},{type:'level'}];await C.startBattle();R.finish(true);},race);
   const branches=await p.evaluate(()=>{const C=__ROADLORDS_RUNTIME__.campaign;return C.branches(C.run.race,'keep').map(b=>b.id);});
   check(`${race}: branched L4 cannot be granted without selecting a real branch`,await p.evaluate(()=>!__ROADLORDS_RUNTIME__.campaign.chooseReward({type:'level',id:'keep'})));
   await p.locator('[data-campaign-reward-type="level"]').click();await p.locator('[data-campaign-building="keep"]').click();
   check(`${race}: the capital reward shows exactly its own actual L4 branches`,await p.locator('[data-campaign-branch]').count()===branches.length);
   await p.locator('[data-campaign-branch]').first().click();
   const actual=await p.evaluate(async()=>{const R=__ROADLORDS_RUNTIME__,C=R.campaign;await C.startBattle();await C.startBattle();R.$('#pregameRefreshLeft').click();return {level:R.levelOf(R.P,'keep'),branch:R.branchOf(R.P,'keep'),buildings:R.P.buildings.map(b=>[b.type,b.level]),hp:R.P.hp,max:R.P.maxHp,starter:C.run.starters.keep};});
   check(`${race}: L4 capital survives restart and terrain reroll without free extra buildings`,actual.level===4&&actual.branch===branches[0]&&actual.buildings.length===1&&actual.buildings[0][1]===4&&actual.hp===actual.max&&actual.starter.branch===branches[0],actual);
  }
  for(const race of D.CAMPAIGN_RACES){
   const placed=await p.evaluate(async race=>{const R=__ROADLORDS_RUNTIME__,C=R.campaign;C.newRun(race);await C.startBattle();R.finish(true);const id=C.catalog[race].basics.find(id=>R.BUILDINGS[id]?.unit);const claimed=C.chooseReward({type:'level',id});await C.startBattle();const free=R.P.buildings.filter(b=>b.type===id).length;window.__ROADLORDS_PREGAME__.setPregame(false);R.P.terrain.fill(null);const price=R.buildPrice(R.P,id);R.P.resources={...price};const b=R.placeBuilding(R.P,id,...R.findCell(R.P,id));return {claimed,free,ok:b.ok,reason:b.reason,level:b.building?.level,typeLevel:R.levelOf(R.P,id),paid:Object.keys(price).every(k=>Math.abs(R.P.resources[k])<.001)};},race);
   check(`${race}: an upgraded military starter is unlocked at L2 but must still be paid for and built`,placed.claimed&&placed.free===0&&placed.ok&&placed.level===2&&placed.typeLevel===2&&placed.paid,placed);
  }
  const inherited=await p.evaluate(async()=>{const R=__ROADLORDS_RUNTIME__,C=R.campaign;C.newRun('human');C.run.stage=2;C.run.permanent=[{id:'specialization',kind:'legendary',count:1},{id:'all_damage',kind:'normal',rarity:'rare',count:2}];const random=Math.random;Math.random=()=>0;try{await C.startBattle();await C.startBattle();}finally{Math.random=random;}return {power:R.P.normal.all_damage,copies:R.upgradeCatalog.count(R.P,'all_damage'),loot:C.battleCards.length,legend:R.P.legends.has('specialization')};});
  check('Specialization cannot duplicate inherited normal cards when loading or restarting',inherited.power===4&&inherited.copies===2&&inherited.loot===0&&inherited.legend,inherited);
  await p.evaluate(()=>{const R=__ROADLORDS_RUNTIME__,C=R.campaign;R.applyChoice(R.P,R.upgradeCatalog.option('all_damage','common'));R.applyChoice(R.P,R.upgradeCatalog.option('all_damage','common'));R.applyChoice(R.P,R.upgradeCatalog.option('all_damage','common'));R.applyChoice(R.P,{...R.upgradeCatalog.definition('wide_choice','legendary'),kind:'legendary'});R.finish(true);});
  const snapshot=await p.evaluate(()=>structuredClone(__ROADLORDS_RUNTIME__.campaign.run));
  for(const viewport of [{width:1267,height:587},{width:800,height:900},{width:1920,height:1080}]){
   await p.setViewportSize(viewport);
   check(`${viewport.width}px: four reward choices fit the viewport with reachable controls`,await p.locator('.campaignPanel').evaluate(e=>{const b=e.getBoundingClientRect();return b.left>=0&&b.right<=innerWidth&&b.top>=0&&b.bottom<=innerHeight&&e.scrollWidth<=e.clientWidth+1;}));
  }
  await p.screenshot({path:'artifacts/campaign-four-rewards.png'});
  await p.reload();await p.waitForFunction(()=>window.__ROADLORDS_RUNTIME__?.menuOpening.ready);await p.locator('.menuBrand').click();await p.locator('#campaignBtn').click();
  check('Reload keeps the exact unclaimed battle loot and permanent checkpoint',await p.evaluate(old=>JSON.stringify(__ROADLORDS_RUNTIME__.campaign.run)===JSON.stringify(old),snapshot));
  await p.locator('[data-campaign-reward-type="legendary"]').click();await p.locator('[data-campaign-card]').first().click();await p.locator('[data-campaign-action="confirm-reward"]').click();
  check('A restored reward commits once and clears its saved battle loot',await p.evaluate(()=>{const C=__ROADLORDS_RUNTIME__.campaign;return C.run.stage===3&&C.run.status==='ready'&&C.run.loot===null&&C.run.permanent.some(c=>c.id==='wide_choice');}));
  await p.locator('[data-campaign-action="battle"]').click();await p.waitForFunction(()=>!__ROADLORDS_RUNTIME__.campaign.loading);
  await p.evaluate(()=>{const R=__ROADLORDS_RUNTIME__;R.P.hp=0;R.finish(false);});const lost=await p.evaluate(()=>structuredClone(__ROADLORDS_RUNTIME__.campaign.run));
  await p.reload();await p.waitForFunction(()=>window.__ROADLORDS_RUNTIME__?.menuOpening.ready);await p.locator('.menuBrand').click();await p.locator('#campaignBtn').click();
  check('Defeat and reload retain the opponent, starters and permanent copies without a reward',await p.evaluate(old=>JSON.stringify(__ROADLORDS_RUNTIME__.campaign.run)===JSON.stringify(old)&&old.status==='defeated'&&old.loot===null,lost));
  check('Save migration, L4 choices and checkpoint UI have no browser errors',report.errors.length===0,report.errors);
 }finally{fs.mkdirSync('artifacts',{recursive:true});fs.writeFileSync('artifacts/campaign-checkpoints.json',JSON.stringify(report,null,2));await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
