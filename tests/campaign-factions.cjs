const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox','--disable-dev-shm-usage']});
 const report={checks:[],errors:[]},check=(name,ok,data)=>{assert(ok,name+(data?' '+JSON.stringify(data):''));report.checks.push(name);console.log('PASS',name);};
 try{
  const p=await browser.newPage({viewport:{width:1920,height:1080}});await p.route('https://**/*',r=>r.abort());p.on('pageerror',e=>report.errors.push(e.message));
  await p.goto(process.env.ROADLORDS_TEST_URL||'http://127.0.0.1:4173/Roadlords/');await p.waitForFunction(()=>window.__ROADLORDS_RUNTIME__?.menuOpening.ready);
  await p.locator('.menuBrand').click();await p.locator('#campaignBtn').click();
  for(const race of ['human','orc','undead']){
   const result=await p.evaluate(async race=>{
    const R=__ROADLORDS_RUNTIME__,C=R.campaign;C.newRun(race);if(!await C.startBattle())throw Error(C.message);
    const out={basics:[...R.P.unlocked].sort(),expected:['keep',...C.catalog[race].basics].sort(),buildings:R.P.buildings.length};
    R.state.startChoices=0;out.rolls=[];
    for(let n=0;n<40;n++){R.P.legendaryDrought=19;const roll=R.rollPickTier(R.P,'timer'),opts=R.makeChoiceOptions(R.P,'timer',roll.tier,roll.subtype);out.rolls.push({tier:roll.tier,kinds:opts.map(o=>o.kind)});}
    const context=R.choiceContextForPlayer;R.P.legendaryDrought=19;R.state.pendingChoices=['timer'];R.state.choiceContext=R.choiceContextForPlayer();R.P.rerolls=20;R.P.bans=20;
    R.rerollCurrentChoice();out.reroll=R.state.choiceContext.opts.map(o=>o.kind);
    const id={human:'all_damage',orc:'orc_move',undead:'und_home_march'}[race];
    for(const rarity of ['common','uncommon','rare'])for(let n=0;n<2;n++)R.applyChoice(R.P,R.upgradeCatalog.option(id,rarity));
    const leg={human:'wide_choice',orc:'orc_momentum',undead:'und_first_guard'}[race];
    R.applyChoice(R.P,{...R.upgradeCatalog.definition(leg,'legendary'),kind:'legendary'});
    R.finish(true);out.types=C.rewardOptions().map(o=>[o.type,o.enabled]);
    out.loot=structuredClone(C.run.loot);out.foreign=C.chooseReward({type:'normal',cards:[{id:'foreign',kind:'normal',rarity:'common',count:3}]});
    out.pick=C.chooseReward({type:'normal',cards:['common','uncommon','rare'].map(rarity=>({id,kind:'normal',rarity,count:1}))});
    out.saved=structuredClone(C.run.permanent);out.double=C.chooseReward({type:'legendary',cards:[{id:leg,kind:'legendary',count:1}]});
    await C.startBattle();out.power=R.P.normal[id];out.copies=R.upgradeCatalog.count(R.P,id);out.inheritedLoot=structuredClone(C.battleCards);out.freshLegend=!R.P.legends.has(leg);out.replay=R.P.pickCount;out.serial=R.P.pickSerial;
    R.applyChoice(R.P,R.upgradeCatalog.option(id,'common'));R.finish(true);out.newLoot=structuredClone(C.run.loot.cards);out.disabled=C.rewardOptions().find(o=>o.type==='normal').enabled;
    return out;
   },race);report[race]=result;
   check(`${race}: all current starter types are available and only the capital is prebuilt`,JSON.stringify(result.basics)===JSON.stringify(result.expected)&&result.buildings===1,result);
   check(`${race}: every guaranteed legendary offer contains only legendary cards`,result.rolls.every(r=>r.tier==='legendary'&&r.kinds.length>=3&&r.kinds.every(k=>k==='legendary'))&&result.reroll.every(k=>k==='legendary'),result.rolls[0]);
   check(`${race}: the four reward categories are distinct and foreign picks cannot be kept`,result.types.length===4&&result.foreign===false&&result.pick===true&&result.double===false,result.types);
   check(`${race}: three chosen editions keep exactly three copies and 4.5 base strength, not the whole six-pick stack`,result.saved.length===3&&result.saved.every(c=>c.count===1)&&result.power===4.5&&result.copies===3,result);
   check(`${race}: inheritance is neither a fresh pick nor fresh reward loot`,result.inheritedLoot.length===0&&result.freshLegend&&result.replay===0&&result.serial===0,result);
   check(`${race}: only this battle's one new copy can be kept; inherited copies cannot fill three slots`,result.newLoot.length===1&&result.newLoot[0].count===1&&!result.disabled,result.newLoot);
   // Keep one real legendary and make sure restart applies it exactly once.
   const legendary=await p.evaluate(async race=>{const R=__ROADLORDS_RUNTIME__,C=R.campaign;C.newRun(race);await C.startBattle();const id={human:'specialization',orc:'orc_momentum',undead:'und_first_guard'}[race];R.applyChoice(R.P,{...R.upgradeCatalog.definition(id,'legendary'),kind:'legendary'});R.finish(true);const claimed=C.chooseReward({type:'legendary',cards:[{id,kind:'legendary',count:1}]});await C.startBattle();await C.startBattle();return {claimed,owned:R.P.legends.has(id),count:C.run.permanent[0].count,loot:C.battleCards.length};},race);
   check(`${race}: a legendary can be made permanent and survives clean restarts exactly once`,legendary.claimed&&legendary.owned&&legendary.count===1&&legendary.loot===0,legendary);
  }
  await p.evaluate(()=>{const R=__ROADLORDS_RUNTIME__;R.campaign.active=false;R.campaign.view.hide();R.$('#rlOpenCodex').click();});
  check('The separate relic tab is removed',await p.locator('[data-tab="relics"]').count()===0);
  for(const [race,count]of [['human',55],['orc',25],['undead',34]]){
   await p.selectOption('#codexRace',race);await p.locator('[data-tab="legendary"]').click();
   check(`${race}: all former relics are ordinary illustrated legendary cards in the codex`,await p.locator('#rlCodexPanel [data-codex-upgrade]').count()===count&&await p.locator('#rlCodexPanel [data-codex-upgrade]').evaluateAll(cs=>cs.every(c=>c.dataset.cardType==='legendary'&&c.querySelector('.cardFooter').textContent==='LEGENDÁS'&&c.querySelector('.cardFrameImage'))));
  }
  check('All faction reward and legendary flows have no browser errors',report.errors.length===0,report.errors);
 }finally{fs.mkdirSync('artifacts',{recursive:true});fs.writeFileSync('artifacts/campaign-factions.json',JSON.stringify(report,null,2));await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
