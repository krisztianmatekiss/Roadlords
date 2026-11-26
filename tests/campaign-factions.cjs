const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{
 const D=await import('data:text/javascript;base64,'+fs.readFileSync('src/campaign/definitions.js').toString('base64'));
 const ids=D.CAMPAIGN_RACES.flatMap(D.relicIdsForRace),report={checks:[],errors:[]};
 const check=(name,ok,data)=>{assert(ok,name+(data?' '+JSON.stringify(data):''));report.checks.push(name);console.log('PASS',name);};
 check('Each faction owns eight relics and all 24 identities are disjoint',ids.length===24&&new Set(ids).size===24&&D.CAMPAIGN_RACES.every(r=>D.relicIdsForRace(r).length===8));
 for(const race of D.CAMPAIGN_RACES){
  const old={...D.newCampaignRun(race,42),schema:1,stage:1,status:'reward',relics:['specialization'],offers:['wide_choice','double_choice','campaign_pathfinder'],results:[{time:60},{time:80}]};
  const restored=D.readCampaignRun(JSON.stringify(old),ids);
  check(`${race}: old shared-relic saves migrate without losing seed, stage or pending reward`,restored?.schema===2&&restored.seed===42&&restored.stage===1&&restored.status==='reward'&&restored.relics.length===1&&restored.offers.length===3&&restored.results.length===2&&[...restored.relics,...restored.offers].every(id=>D.relicIdsForRace(race).includes(id)));
  const bad={...D.newCampaignRun(race,42),stage:1,relics:[D.relicIdsForRace(race==='human'?'orc':'human')[0]]};
  check(`${race}: new saves reject another faction's relic`,D.readCampaignRun(JSON.stringify(bad),ids)===null);
 }
 check('Random enemies and the Vampire boss always use their own faction relics',Array.from({length:200},(_,i)=>D.campaignEncounters(i)).flat().every(e=>e.relics.every(id=>D.relicIdsForRace(e.race).includes(id))));
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox','--disable-dev-shm-usage']});
 try{
  const p=await browser.newPage({viewport:{width:1920,height:1080}});await p.route('https://**/*',r=>r.abort());p.on('pageerror',e=>report.errors.push(e.message));
  await p.goto(process.env.ROADLORDS_TEST_URL||'http://127.0.0.1:4173/Roadlords/');await p.waitForFunction(()=>window.__ROADLORDS_RUNTIME__?.menuOpening.ready);
  await p.locator('.menuBrand').click();await p.locator('#campaignBtn').click();
  for(const race of D.CAMPAIGN_RACES){
   await p.evaluate(async race=>{const R=__ROADLORDS_RUNTIME__;R.campaign.newRun(race);if(!await R.campaign.startBattle())throw Error(R.campaign.message);},race);
   const draft=await p.evaluate(()=>{const R=__ROADLORDS_RUNTIME__;R.state.startChoices=0;const all=[];for(let n=0;n<80;n++){R.P.legendaryDrought=19;const roll=R.rollPickTier(R.P,'timer');all.push(...R.makeChoiceOptions(R.P,'timer',roll.tier,roll.subtype));}return all.every(o=>!R.isRelic(o.id));});
   check(`${race}: every in-battle upgrade offer excludes all faction relics`,draft);
   check(`${race}: AI plans do not chase relics unavailable during the battle`,await p.evaluate(()=>{const R=__ROADLORDS_RUNTIME__;return R.aiStrategyAnchors(R.P).every(p=>p.anchor.kind!=='legendary'||!R.isRelic(p.anchor.id)||R.P.legends.has(p.anchor.id));}));
   for(let stage=0;stage<4;stage++){
    await p.evaluate(()=>{const R=__ROADLORDS_RUNTIME__;R.state.ended=false;R.campaign.run.status='battle';R.finish(true);});
    check(`${race}, reward ${stage+1}: distinct new relics all belong to the player faction`,await p.evaluate(()=>{const R=__ROADLORDS_RUNTIME__,C=R.campaign,n=C.run.relics.includes('campaign_pathfinder')?4:3;return C.run.offers.length===n&&new Set(C.run.offers).size===n&&C.run.offers.every(id=>!C.run.relics.includes(id)&&R.relicPool(C.run.race).some(d=>d.id===id));}));
    check(`${race}: a forged reward cannot award a foreign relic`,await p.evaluate(()=>{const R=__ROADLORDS_RUNTIME__,C=R.campaign,id=R.relicPool(C.run.race==='human'?'orc':'human')[0].id;C.run.offers.push(id);const ok=C.chooseReward(id);C.run.offers.pop();return !ok&&C.run.stage===C.run.relics.length;}));
    await p.locator('[data-campaign-reward]').first().click();
   }
  }
  await p.evaluate(()=>{const R=__ROADLORDS_RUNTIME__;R.campaign.view.hide();R.$('#endOverlay').classList.add('hidden');R.$('#rlOpenCodex').click();});
  for(const race of D.CAMPAIGN_RACES){
   await p.selectOption('#codexRace',race);await p.locator('[data-tab="relics"]').click();
   const gallery=await p.locator('#rlCodexPanel [data-codex-upgrade]').evaluateAll((cards,race)=>cards.map(c=>({id:c.dataset.codexUpgrade,art:c.querySelector('.cardScene')?.dataset.upgradeArt,image:c.querySelector('.factionArtwork .cardIllustration')?.src,footer:c.querySelector('.cardFooter').textContent,race:c.querySelector('.cardFace').dataset.race})),race);
   const owned=D.relicIdsForRace(race);
   check(`${race}: the codex shows only its eight relics with its own illustrated artwork`,gallery.length===8&&gallery.every(c=>{
    const source=D.EXTRA_RELICS.find(d=>d.id===c.id)?.art||c.id;
    const art=race==='human'?c.art?.startsWith('human-legendary:'):race==='orc'?c.art===source||c.image?.endsWith('/cards/orc/upgrades/'+source+'.webp'):c.art===c.id;
    return owned.includes(c.id)&&c.footer==='EREKLYE'&&c.race===race&&art;
   }),gallery);
   if(race==='orc')await p.locator('#rlCodexPanel').screenshot({path:'artifacts/orc-campaign-relics.png'});
   await p.locator('[data-tab="legendary"]').click();
   check(`${race}: relics are absent from the separate battle-legendary tab`,await p.locator('#rlCodexPanel [data-codex-upgrade]').evaluateAll(cards=>cards.every(c=>!__ROADLORDS_RUNTIME__.isRelic(c.dataset.codexUpgrade))));
  }
  await p.keyboard.press('Escape');
  const orc=await p.evaluate(async()=>{
   const R=__ROADLORDS_RUNTIME__,C=R.campaign;C.newRun('orc');Object.assign(C.run,{stage:4,relics:['orc_war_banner','orc_wandering_camp','orc_revenge','orc_veteran_kills']});
   await C.startBattle();const first=R.P.garrison.map(e=>[e.key,e.veteran]);await C.startBattle();const second=R.P.garrison.length;
   window.__ROADLORDS_PREGAME__.setPregame(false);R.state.startChoices=0;R.P.terrain.fill(null);R.P.unlocked.add('orc_hut');const price=R.buildPrice(R.P,'orc_hut'),rows=[];
   for(const active of [true,false,true]){
    C.active=active;R.P.resources={...price};const b=R.placeBuilding(R.P,'orc_hut',...R.findCell(R.P,'orc_hut'));if(!b.ok)throw Error(JSON.stringify(b));
    if(rows.length===2)b.building.paidCost=R.C();R.demolish(R.P,b.building.id);rows.push({...R.P.resources});
   }
   return {first,second,price,rows};
  });report.orc=orc;
  check('Orc War Banner gives exactly six real elite warriors once per fresh battle',orc.first.length===6&&orc.first.every(([key,elite])=>key==='orc_warrior'&&elite)&&orc.second===6,orc);
  check('Wandering Camp refunds the real paid price, stays inactive in Quick Game and cannot refund a free building',Object.keys(orc.price).every(k=>Math.abs(orc.rows[0][k]-orc.price[k])<.001&&Math.abs(orc.rows[1][k]-orc.price[k]*.5)<.001&&orc.rows[2][k]===0),orc);
  const undead=await p.evaluate(async()=>{
   const R=__ROADLORDS_RUNTIME__,C=R.campaign;C.newRun('undead');Object.assign(C.run,{stage:4,relics:['gen_soul_frugal','und_soul_might','und_first_guard','und_elite_birth']});await C.startBattle();
   window.__ROADLORDS_PREGAME__.setPregame(false);R.state.startChoices=0;R.P.terrain.fill(null);R.P.unlocked.add('und_well');R.P.resources=R.buildPrice(R.P,'und_well');const b=R.placeBuilding(R.P,'und_well',...R.findCell(R.P,'und_well'));if(!b.ok)throw Error(JSON.stringify(b));
   const cheap=R.undEconomy(R.P).totalUpkeep;R.P.legends.delete('gen_soul_frugal');R.recomputeCity(R.P,false);const ordinary=R.undEconomy(R.P).totalUpkeep;
   R.P.resources.wood=2000;const damage=R.undSoulDamageMult(R.P),old=Math.random;Math.random=()=>.1;let entry;try{entry=R.makeEntry(R.P,'und_skeleton');}finally{Math.random=old;}
   const unit=R.releaseUnit(R.P,entry);return {cheap,ordinary,damage,stack:R.undLegendStacks(R.P,'und_soul_might'),elite:entry.veteran,guard:R.undHasFirstWard(unit),foreign:[...R.P.legends].some(id=>R.isRelic(id)&&!R.relicPool('undead').some(d=>d.id===id))};
  });report.undead=undead;
  check('Undead relics really reduce Soul upkeep and give the stockpile damage, first-hit ward and elite chance',Math.abs(undead.cheap-undead.ordinary*.6)<.0001&&Math.abs(undead.damage-1.02)<.0001&&undead.stack===1&&undead.elite&&undead.guard&&!undead.foreign,undead);
  check('Faction rewards, migration, artwork and mechanics produce no browser errors',report.errors.length===0,report.errors);
 }finally{fs.mkdirSync('artifacts',{recursive:true});fs.writeFileSync('artifacts/campaign-factions.json',JSON.stringify(report,null,2));await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
