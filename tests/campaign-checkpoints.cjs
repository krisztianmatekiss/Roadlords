const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{
 const defs=await import('data:text/javascript;base64,'+fs.readFileSync('src/campaign/definitions.js').toString('base64'));
 const report={checks:[],errors:[]},check=(name,ok,data)=>{assert(ok,name+(data?' '+JSON.stringify(data):''));report.checks.push(name);console.log('PASS',name);};
 const valid=defs.newCampaignRun('human',42),ids=[...defs.LEGACY_RELIC_IDS,...defs.EXTRA_RELICS.map(d=>d.id)];
 check('Corrupt, unknown-card and duplicate-relic saves cannot become playable runs',[
  '{',JSON.stringify({...valid,stage:5}),JSON.stringify({...valid,race:'unknown'}),JSON.stringify({...valid,stage:1,relics:['unknown']}),JSON.stringify({...valid,stage:2,relics:['wide_choice','wide_choice']}),JSON.stringify({...valid,status:'reward',offers:[]}),
 ].every(text=>defs.readCampaignRun(text,ids)===null));
 check('A valid checkpoint keeps its encounter seed and relics',defs.readCampaignRun(JSON.stringify(valid),ids).seed===42);
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox','--disable-dev-shm-usage']});
 try{
  const p=await browser.newPage({viewport:{width:1920,height:1080}});await p.route('https://**/*',r=>r.abort());p.on('pageerror',e=>report.errors.push(e.message));
  const url=process.env.ROADLORDS_TEST_URL||'http://127.0.0.1:4173/Roadlords/';
  await p.goto(url);await p.waitForFunction(()=>window.__ROADLORDS_RUNTIME__?.menuOpening.ready);
  const profiles=Object.entries(defs.CAMPAIGN_PROFILES).flatMap(([race,items])=>items.map(d=>({...d,race})));
  check('Every random enemy profile uses an existing faction building and real L4 branch',await p.evaluate(profiles=>{const R=__ROADLORDS_RUNTIME__;return profiles.every(d=>R.BUILDINGS[d.building]&&R.factionMatches(d.race,R.BUILDINGS[d.building],d.building)&&R.V4_BRANCHES[d.building]?.length&&(!d.branch||R.V4_BRANCHES[d.building].some(b=>b.id===d.branch)));},profiles));
  await p.locator('.menuBrand').click();await p.locator('#campaignBtn').click();
  for(const viewport of [{width:1267,height:587},{width:800,height:900},{width:1920,height:1080}]){
   await p.setViewportSize(viewport);
   check(`${viewport.width}px: campaign fits the viewport and keeps its actions reachable`,await p.locator('.campaignPanel').evaluate(e=>{const b=e.getBoundingClientRect();return b.left>=0&&b.right<=innerWidth&&b.top>=0&&b.bottom<=innerHeight&&e.scrollWidth<=e.clientWidth+1;}));
  }
  const effects=await p.evaluate(async()=>{
   const R=__ROADLORDS_RUNTIME__,C=R.campaign,out=[];
   for(const race of ['human']){
    C.newRun(race);R.roadResetCity(R.P,race);R.recomputeCity(R.P,false);const base=R.P.resources.wood;
    Object.assign(C.run,{stage:4,relics:['campaign_supplies','campaign_blueprints','full_garrison_economy','specialization']});
    if(!await C.startBattle())throw Error(C.message);
    const resources=R.P.resources.wood,startCount=R.choiceCount(R.P);
    const entries=Array.from({length:R.P.garrisonCap},()=>R.makeEntry(R.P,race==='human'?'swordsman':race==='orc'?'orc_warrior':'und_skeleton'));
    R.P.garrison=entries;R.recomputeCity(R.P,false);
    // Use the actual reserve collection used by each faction, rather than a
    // synthetic garrison count, then compare the same city's rates.
    const reserveBefore=R.reserveCount(R.P);
    const boosted=R.productionRates(R.P).wood;
    R.P.legends.delete('full_garrison_economy');const ordinary=R.productionRates(R.P).wood;
    const previous=Math.random;Math.random=()=>0;
    try{const id=race==='human'?'global_damage':race==='orc'?'orc_warrior_hp':'und_spawn_ward',normal=R.NORMAL.find(d=>d.id===id)||R.eligibleNormal(R.P)[0];
     R.applyChoice(R.P,R.upgradeCatalog.option(normal.id,'common'));R.applyChoice(R.P,R.upgradeCatalog.option(normal.id,'common'));
    }finally{Math.random=previous;}
    out.push({race,base,resources,startCount,reserveBefore,cap:R.P.garrisonCap,boosted,ordinary,picks:R.upgradeCatalog.count(R.P)});
   }return out;
  });report.effects=effects;
  for(const row of effects)check(`${row.race}: campaign relics really grant supplies, starter choices, filled-garrison income and specialization`,row.resources===row.base*1.5&&row.startCount===6&&row.reserveBefore>=row.cap&&row.boosted===row.ordinary*2&&row.picks===3,row);
  const mixed=await p.evaluate(async()=>{
   const R=__ROADLORDS_RUNTIME__,C=R.campaign;C.newRun('human');Object.assign(C.run,{stage:2,relics:['double_choice','strategic_superiority']});
   await C.startBattle();const bonus={rerolls:R.P.rerolls,bans:R.P.bans,pending:R.state.pendingChoices.filter(s=>s==='strategic_superiority_bonus').length};
   window.__ROADLORDS_PREGAME__.setPregame(false);R.state.startChoices=0;R.state.pendingChoices=['timer'];R.P.nonLegendaryPicks=2;
   R.P.unlocked.add('barracks');R.P.terrain.fill(null);const stock=R.P.resources;R.P.resources=R.C(1e6,1e6,1e6);const placed=R.placeBuilding(R.P,'barracks',...R.findCell(R.P,'barracks'));if(!placed.ok)throw Error(JSON.stringify(placed));R.setBuildingLevel(R.P,'barracks',4,'conscription');R.P.resources=stock;
   R.P.legendaryDrought=19;const choice=R.choiceContextForPlayer(),allowed=choice.opts.every(o=>o.kind==='legendary'?R.eligibleLegendary(R.P).some(d=>d.id===o.id):R.upgradeCatalog.requirements.allowed(R.P,o));
   const blocked=R.applyChoice(R.P,{...R.RELICS.find(d=>d.id==='wide_choice'),kind:'legendary'});
   const ai=R.aiChooseOptions(choice.opts,{source:'timer',tier:choice.tier,subtype:choice.subtype,city:R.P});
   const beforeCycle=R.P.nonLegendaryPicks,selected=choice.opts.find(o=>o.kind==='legendary');R.applyChoice(R.P,selected,true);const afterLegend=R.P.nonLegendaryPicks;R.applyChoice(R.P,choice.opts.find(o=>o.kind==='normal'),false);
   return {bonus,tier:choice.tier,normal:choice.opts.some(o=>o.kind==='normal'),legendary:choice.opts.some(o=>o.kind==='legendary'),relic:choice.opts.some(o=>R.isRelic(o.id)),allowed,double:choice.doubleTake,blocked:blocked===false&&!R.P.legends.has('wide_choice'),ai:ai.length>0&&ai.every(o=>['normal','legendary'].includes(o.kind)),cycle:R.P.nonLegendaryPicks===3,cycleDetail:{beforeCycle,afterLegend,after:R.P.nonLegendaryPicks,selected:selected.id,active:C.active,owned:R.P.legends.has('double_choice')}};
  });report.mixed=mixed;
  check('Strategic Superiority restores its three choices and reroll/ban allowances each battle',mixed.bonus.pending===3&&mixed.bonus.rerolls>=5&&mixed.bonus.bans>=3,mixed);
  check('Campaign upgrade drafts mix normal and real prerequisite-checked legendaries, never relics',mixed.tier==='common'&&mixed.normal&&mixed.legendary&&!mixed.relic&&mixed.allowed&&mixed.double&&mixed.blocked,mixed);
  check('The shared AI evaluates and rerolls mixed upgrade offers without treating legendaries as normal rarity cards',mixed.ai,mixed);
  check('Taking a legendary first consumes exactly one double-choice cycle instead of granting another double next time',mixed.cycle,mixed);
  await p.evaluate(()=>{const R=__ROADLORDS_RUNTIME__;R.P.hp=0;R.finish(false);});
  const lost=await p.evaluate(()=>{const C=__ROADLORDS_RUNTIME__.campaign;return {status:C.run.status,seed:C.run.seed,stage:C.run.stage,relics:C.run.relics,entry:C.encounter()};});
  check('Defeat preserves the current opponent and owned relics without granting a reward',lost.status==='defeated'&&lost.stage===2&&lost.relics.length===2);
  await p.reload();await p.waitForFunction(()=>window.__ROADLORDS_RUNTIME__?.menuOpening.ready);
  await p.locator('.menuBrand').click();await p.locator('#campaignBtn').click();
  check('Reload restores the defeated checkpoint with exactly the same opponent and relics',await p.evaluate(saved=>{const C=__ROADLORDS_RUNTIME__.campaign;return C.run.seed===saved.seed&&C.run.status===saved.status&&JSON.stringify(C.encounter())===JSON.stringify(saved.entry)&&JSON.stringify(C.run.relics)===JSON.stringify(saved.relics);},lost));
  await p.locator('[data-campaign-action="battle"]').click();await p.waitForFunction(()=>!__ROADLORDS_RUNTIME__.campaign.loading);
  check('Retry rebuilds a clean battle and reapplies permanent effects only once',await p.evaluate(()=>{const R=__ROADLORDS_RUNTIME__;return R.state.pregame&&R.campaign.run.status==='battle'&&R.P.hp===R.P.maxHp&&R.P.buildings.length===1&&R.upgradeCatalog.count(R.P)===0&&R.P.legendaryStacks.strategic_superiority===1&&R.state.pendingChoices.filter(s=>s==='strategic_superiority_bonus').length===3;}));
  await p.evaluate(()=>{const R=__ROADLORDS_RUNTIME__;R.E.hp=0;R.finish(true);});
  const reward=await p.evaluate(()=>[...__ROADLORDS_RUNTIME__.campaign.run.offers]);
  await p.reload();await p.waitForFunction(()=>window.__ROADLORDS_RUNTIME__?.menuOpening.ready);
  await p.locator('.menuBrand').click();await p.locator('#campaignBtn').click();
  check('Reload keeps an unclaimed reward offer without rerolling or losing progress',await p.evaluate(ids=>{const C=__ROADLORDS_RUNTIME__.campaign;return C.run.status==='reward'&&JSON.stringify(C.run.offers)===JSON.stringify(ids)&&C.run.relics.length===2;},reward));
  await p.locator('[data-campaign-reward]').first().click();
  check('Restored reward can be claimed normally',await p.evaluate(()=>__ROADLORDS_RUNTIME__.campaign.run.status==='ready'&&__ROADLORDS_RUNTIME__.campaign.run.stage===3));
  check('Checkpoint, retry, Human relics and mixed drafts have no browser errors',report.errors.length===0,report.errors);
 }finally{fs.mkdirSync('artifacts',{recursive:true});fs.writeFileSync('artifacts/campaign-checkpoints.json',JSON.stringify(report,null,2));await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
