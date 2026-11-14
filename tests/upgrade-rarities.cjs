const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox','--disable-dev-shm-usage']});
 const report={checks:[],errors:[]},check=(name,ok)=>{assert(ok,name);report.checks.push(name);console.log('PASS',name)};
 try{
  const p=await browser.newPage({viewport:{width:1920,height:1080}});await p.route('https://**/*',r=>r.abort());p.on('pageerror',e=>report.errors.push(e.message));
  await p.goto(process.env.ROADLORDS_TEST_URL||'http://127.0.0.1:4173/Roadlords/');await p.waitForFunction(()=>window.__ROADLORDS_RUNTIME__);
  const logic=await p.evaluate(()=>{
   const R=__ROADLORDS_RUNTIME__,catalog=R.upgradeCatalog,out={};
   R.state.running=false;R.state.modal=false;R.state.startChoices=0;R.state.pendingChoices=[];
   const reset=race=>{R.roadResetCity(R.P,race);R.P.legends=new Set();R.P.normal={};R.P.normalRarities={};R.recomputeCity(R.P,false);return R.P;};
   const add=(type,level)=>{const b={id:'rarity-'+type,type,row:0,col:0,rotation:0,level,progress:0};R.P.buildings.push(b);R.P.levels[type]=level;return b;};
   out.canonical=R.LEGENDARY.every(def=>R.upgradeCopyPreview(R.P,{...def,kind:'legendary'}).description===catalog.definition(def.id,'legendary').description);
   out.complete=R.NORMAL.length===85&&R.NORMAL.every(d=>Object.keys(catalog.editions(d.id)).length>0);
   out.upward=R.NORMAL.every(d=>{const keys=Object.keys(catalog.editions(d.id)),all=['common','uncommon','rare'];return keys.join()===all.slice(all.indexOf(keys[0])).join();});
   out.selective=Object.keys(catalog.editions('orc_lifesteal')).join()==='rare'&&Object.keys(catalog.editions('ghost_common_dodge')).join()==='common,uncommon,rare'&&Object.keys(catalog.editions('orc_bleed')).join()==='common,uncommon,rare';
   reset('human');add('barracks',1);
   out.levels=[];
   for(let level=1;level<=4;level++){
    R.P.levels.barracks=level;const b=R.P.buildings.find(b=>b.type==='barracks');b.level=level;
    out.levels.push(['common','uncommon','rare'].map(r=>R.normalRarityPool(R.P,r).some(o=>o.id==='swordsman_hp')));
    out.levels.at(-1).push(R.eligibleLegendary(R.P).some(o=>o.id==='sword_execute'));
   }
   reset('orc');const war=add('orc_war',3);
   const before=R.statsFor(R.P,{key:'orc_warrior'}).hp;
   const copies=['common','uncommon','rare'].map(r=>catalog.option('orc_warrior_hp',r));
   out.previews=copies.map(o=>R.upgradeCopyPreview(R.P,o).description);
   for(const o of copies)R.applyChoice(R.P,o);
   out.mixed={hp:R.statsFor(R.P,{key:'orc_warrior'}).hp,before,strength:R.P.normal.orc_warrior_hp,count:catalog.count(R.P),owned:catalog.owned(R.P).map(x=>[x.option.rarity,x.count]),events:R.P.pickEvents?.map(e=>e.rarity)};
   const stats=R.mpStrategy(R.P),snap=R.mpRevive(R.mpCitySnapshot(R.P));
   out.network=JSON.stringify(stats.normalRarities)===JSON.stringify(snap.normalRarities)&&catalog.count(snap)===3&&snap.normal.orc_warrior_hp===4.5&&R.gameRulesVersion===25;
   R.renderRelics();out.deck=[...R.$$('#relicList [data-relic="orc_warrior_hp"]')].map(c=>({rarity:c.querySelector('.cardFace').dataset.upgradeRarity,count:c.querySelector('.relicOwnedCount').textContent}));
   R.P.rerolls=2;const options=copies.map((o,i)=>catalog.option(['orc_warrior_hp','orc_warrior_dmg','orc_warrior_hp'][i],o.rarity));
   R.state.choiceContext={source:'timer',tier:'common',subtype:null,opts:options,remaining:1};
   R.rerollCurrentChoice();out.reroll=R.state.choiceContext.opts.slice(0,3).map(o=>o.rarity);
   // Restore actual prerequisites after each sample; no simulator-only grants.
   R.state.choiceContext.opts=[catalog.option('orc_warrior_hp','common'),catalog.option('orc_warrior_dmg','uncommon'),catalog.option('orc_lifesteal','rare')];
   R.P.bans=2;R.banChoiceAt(2);
   out.ban=R.P.banned.has('orc_lifesteal')&&R.state.choiceContext.opts[2]?.rarity==='rare'&&['common','uncommon','rare'].every(r=>!R.normalRarityPool(R.P,r).some(o=>o.id==='orc_lifesteal'));
   reset('undead');R.P.legends.add('specialization');
   const savedRandom=Math.random;Math.random=()=>0;
   try{R.applyChoice(R.P,catalog.option('und_spawn_ward','common'));R.applyChoice(R.P,catalog.option('und_spawn_ward','common'));}finally{Math.random=savedRandom;}
   out.specialization=R.P.normal.und_spawn_ward===1.5&&catalog.count(R.P)===3;
   reset('undead');out.early=R.makeChoiceOptions(R.P,'timer','common',null,[],['common','common','common','common']).map(o=>o.id);
   add('und_ghost_spawner',3);out.ghost=catalog.option('ghost_common_dodge','rare');out.ghostPreview=R.upgradeCopyPreview(R.P,out.ghost).rows;
   const old=Math.random;let seed=471;
   Math.random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
   try{out.distribution={common:0,uncommon:0,rare:0};for(let i=0;i<20000;i++)out.distribution[R.rollNormalRarity()]++;}finally{Math.random=old;}
   out.sampling=[];
   for(const race of ['human','orc','undead']){
    reset(race);for(let i=0;i<40;i++){const offer=R.makeChoiceOptions(R.P,'timer','common');if(new Set(offer.map(o=>o.id)).size!==offer.length||offer.some(o=>!catalog.requirements.allowed(R.P,o)||!R.NORMAL.find(d=>d.id===o.id).eligible(R.P)))out.sampling.push(race);}
   }
   out.newEditions={};
   reset('orc');
   for(const rarity of ['common','uncommon','rare']){
    const bleed=catalog.option('orc_bleed',rarity),cargo=catalog.option('orc_cargo',rarity);
    out.newEditions[rarity]={bleed:bleed.description,bleedAfter:R.upgradeCopyPreview(R.P,bleed).rows[0].after,cargo:cargo.description,cargoAfter:R.upgradeCopyPreview(R.P,cargo).rows[0].after};
   }
   out.newEditions.leech=catalog.option('orc_leech','rare').description;
   reset('human');R.applyChoice(R.P,catalog.option('gate_discipline','rare'));R.recomputeCity(R.P,false);
   out.newEditions.capacity=R.P.garrisonCap;
   reset('human');const frugal=catalog.option('frugal_training','rare');
   out.newEditions.frugal={description:frugal.description,after:R.upgradeCopyPreview(R.P,frugal).rows[0].after};
   for(let i=0;i<4;i++)R.applyChoice(R.P,catalog.option('building_discount','rare'));
   out.newEditions.discount={count:catalog.count(R.P),raw:R.P.normal.building_discount,eligible:R.eligibleNormal(R.P).some(o=>o.id==='building_discount')};
   reset('undead');for(const rarity of ['common','uncommon','rare']){
    const o=catalog.option('und_territory',rarity),before=R.undTerritoryAdvance(R.P)/10,preview=R.upgradeCopyPreview(R.P,o);
    R.applyChoice(R.P,o);out.newEditions[rarity].territory={description:o.description,preview:preview.rows[0].after,actual:R.undTerritoryAdvance(R.P)/10,delta:R.undTerritoryAdvance(R.P)/10-before};
   }
   reset('undead');out.vampire=R.statsFor(R.P,{key:'und_vampire'}).hp;
   out.soulWard=catalog.option('und_spawn_ward','common').description;
   add('und_well',3);out.wellBefore=R.eligibleLegendary(R.P).some(o=>o.id==='und_compact_wells');
   R.P.levels.und_well=4;R.P.buildings.find(b=>b.type==='und_well').level=4;out.wellAfter=R.eligibleLegendary(R.P).some(o=>o.id==='und_compact_wells');
   out.progression=R.LEGENDARY.find(o=>o.id==='high_keep').eligible({...R.P,race:'human',levels:{keep:2},buildings:[{type:'keep',level:2}]});
   reset('human');out.removed=['tower_crews','tower_regen'].every(id=>!catalog.definition(id)&&!R.NORMAL.some(o=>o.id===id)&&!R.eligibleNormal(R.P).some(o=>o.id===id));
   const towers=R.towers.filter(t=>t.side==='player'),saved=towers.map(t=>t.alive);towers.forEach(t=>t.alive=true);
   out.salvo=R.eligibleLegendary(R.P).some(o=>o.id==='tower_salvo');
   towers[0].alive=false;towers[1].alive=false;out.rebuild=R.eligibleLegendary(R.P).some(o=>o.id==='tower_rebuild');
   R.P.normal.tower_crews=10;R.P.normal.tower_regen=10;const st=R.towerStatsV496(towers[2]);R.refreshTowerHpFor(R.P,'player',true);
   out.retiredEffects=st.damage===towers[2].baseDamage&&st.range===towers[2].baseRange&&st.regen===0&&towers[2].maxHp===towers[2].baseHp;
   towers.forEach((t,i)=>t.alive=saved[i]);reset('undead');
   return out;
  });report.logic=logic;
  check('All 85 upgrades extend upward through Rare without adding editions below their minimum',logic.complete&&logic.upward&&logic.selective&&logic.ghost.description.includes('+10 százalékpont'));
  check('A real L1/L2/L3/L4 producer unlocks Common/Uncommon/Rare/unit relic respectively',JSON.stringify(logic.levels)===JSON.stringify([[true,false,false,false],[true,true,false,false],[true,true,true,false],[true,true,true,true]]));
  check('Mixed editions grant actual +10/+15/+20% HP while counting three acquired cards',logic.mixed.strength===4.5&&logic.mixed.count===3&&Math.abs(logic.mixed.hp/logic.mixed.before-1.45)<.01&&logic.mixed.owned.length===3);
  check('Deck variants, full snapshots, strategy messages and pick flights preserve rarity and real card counts',logic.network&&logic.deck.length===3&&logic.deck.every(x=>x.count==='×1')&&logic.mixed.events.join()==='common,uncommon,rare');
  check('Reroll keeps slot editions; banning removes every edition without promoting rarity',logic.reroll.join()==='common,uncommon,rare'&&logic.ban);
  check('Specialization duplicates the chosen strength, including a half-strength Common shield',logic.specialization);
  check('Early Undead can still receive four distinct general Common cards',logic.early.length===4&&new Set(logic.early).size===4&&logic.soulWard.includes('4%'));
  check('Offers honor real prerequisites without duplicate effects',!logic.sampling.length);
  check('New whole-number editions describe actual bleeding and cargo values',logic.newEditions.uncommon.bleed.includes('3 Vérzést')&&logic.newEditions.uncommon.bleedAfter==='3'&&logic.newEditions.rare.bleed.includes('4 Vérzést')&&logic.newEditions.rare.bleedAfter==='4'&&logic.newEditions.uncommon.cargo.includes('+6')&&logic.newEditions.uncommon.cargoAfter==='16'&&logic.newEditions.rare.cargo.includes('+8')&&logic.newEditions.rare.cargoAfter==='18'&&logic.newEditions.leech.includes('7%')&&logic.newEditions.capacity===45);
  check('Rare training discount is exactly 7.5%, and mixed rarity purchases respect the building discount cap',logic.newEditions.frugal.description.includes('7,5%')&&logic.newEditions.frugal.after==='92,5%'&&logic.newEditions.discount.count===4&&logic.newEditions.discount.raw===5&&!logic.newEditions.discount.eligible);
  check('Territory editions grant and preview 12/18/24 real metres', ['common','uncommon','rare'].every((r,i)=>{const t=logic.newEditions[r].territory;return t.delta===[12,18,24][i]&&t.preview===`+${t.actual} m`&&t.description.includes(String(t.delta));}));
  check('Normal rarity distribution is 70/25/5 without changing relic progression',Object.entries({common:.7,uncommon:.25,rare:.05}).every(([k,v])=>Math.abs(logic.distribution[k]/20000-v)<.012));
  check('Vampire base HP is 440; building relics require L4; level-granting progression cards remain obtainable',logic.vampire===440&&!logic.wellBefore&&logic.wellAfter&&logic.progression);
  check('Retired tower upgrades are absent and cannot affect tower stats; remaining relics are obtainable',logic.removed&&logic.retiredEffects&&logic.salvo&&logic.rebuild);
  await p.locator('.menuBrand').click();await p.waitForTimeout(500);await p.locator('#rlOpenCodex').click();
  await p.locator('#codexRace').selectOption('orc');await p.locator('#rlCodexPanel [data-tab="common"]').click();
  const hp=p.locator('#rlCodexPanel [data-codex-upgrade="orc_warrior_hp"]');await hp.locator('[data-codex-rarity="rare"]').click();
  check('Codex uses the same Rare +20% description, footer and L3 prerequisite',await hp.evaluate(c=>c.querySelector('.cardFace').dataset.upgradeRarity==='rare'&&c.querySelector('.rlCodexContent').textContent.includes('+20%')&&c.querySelector('.cardFooter').textContent==='EPIKUS'&&c.querySelector('.upgradeRequirement').textContent.includes('L3')));
  check('Every common-starting card offers all three editions in the codex',await p.locator('#rlCodexPanel [data-codex-upgrade="orc_bleed"]').evaluate(c=>[...c.querySelectorAll('[data-codex-rarity]')].map(b=>b.dataset.codexRarity).join()==='common,uncommon,rare'));
  check('Uncommon-starting cards offer both higher editions and no Common',await p.locator('#rlCodexPanel [data-codex-upgrade="orc_leech"]').evaluate(c=>[...c.querySelectorAll('[data-codex-rarity]')].map(b=>b.dataset.codexRarity).join()==='uncommon,rare'));
  check('Rare-only lifesteal has one visible edition at its actual +3-point strength',await p.locator('#rlCodexPanel [data-codex-upgrade="orc_lifesteal"]').evaluate(c=>c.querySelectorAll('[data-codex-rarity]').length===1&&c.querySelector('.rlCodexContent').textContent.includes('+3')&&c.querySelector('.cardFace').dataset.upgradeRarity==='rare'));
  const appearance=[];
  for(const [race,id]of [['human','swordsman_hp'],['orc','orc_warrior_hp'],['undead','skeleton_common_hp']]){
   await p.locator('#codexRace').selectOption(race);
   for(const rarity of ['common','uncommon','rare']){
    const article=p.locator(`#rlCodexPanel [data-codex-upgrade="${id}"]`);
    await article.locator(`[data-codex-rarity="${rarity}"]`).click();
    appearance.push(await article.evaluate((a,{race,rarity})=>{
     const face=a.querySelector('.cardFace'),mark=face.querySelector('.cardRarityMark');
     return {race,rarity,shadow:getComputedStyle(face).boxShadow,mark:mark?.textContent,footer:face.querySelector('.cardFooter').textContent,color:getComputedStyle(face.querySelector('.cardFooter')).color,frame:face.querySelector('.factionCardFrame')?.dataset.frameArt,source:face.querySelector('.factionFrameImage')?.getAttribute('src'),panels:[...face.querySelectorAll('.cardRarityPanels rect')].map(el=>({fill:getComputedStyle(el).fill,visible:getComputedStyle(el.parentElement).display!=='none'}))};
    },{race,rarity}));
   }
  }
  report.appearance=appearance;
  check('All factions show Gyakori / Ritka / Epikus in quiet coloured footers without glow or gem badges',appearance.every(a=>!a.mark&&a.shadow==='none'&&a.footer===({common:'GYAKORI',uncommon:'RITKA',rare:'EPIKUS'})[a.rarity])&&new Set(appearance.map(a=>a.color)).size===3);
  check('Orc and Undead use their own generated frame paintings with the approved panel layout',appearance.filter(a=>a.race!=='human').every(a=>a.frame===a.race&&a.source.endsWith(`/cards/frames/${a.race}.png`)));
  check('All three writing panels visibly distinguish each rarity in every faction',appearance.every(a=>a.panels.length===3&&a.panels.every(p=>p.visible))&&['human','orc','undead'].every(race=>[0,1,2].every(i=>new Set(appearance.filter(a=>a.race===race).map(a=>a.panels[i].fill)).size===3)));
  check('The shared simple faction frame decodes locally',await p.evaluate(async()=>{const img=document.querySelector('#rlCodexPanel .factionFrameImage');await img.decode();return img.naturalWidth>100&&Math.abs(img.naturalWidth/img.naturalHeight-2/3)<.01;}));
  const geometry=[];
  for(const race of ['orc','undead'])for(const size of [{width:1440,height:900},{width:2840,height:2180}]){
   await p.setViewportSize(size);await p.locator('#codexRace').selectOption(race);await p.waitForTimeout(150);
   const result=await p.evaluate(()=>[...document.querySelectorAll('#rlCodexPanel .cardFace')].map(c=>{
    const title=c.querySelector('.rlCodexTitle').getBoundingClientRect(),body=c.querySelector('.rlCodexContent'),b=body.getBoundingClientRect(),art=(c.querySelector('.cardScene')||c.querySelector('.factionArtwork')).getBoundingClientRect(),r=c.getBoundingClientRect();
    return {frame:!!c.querySelector('.factionCardFrame'),floating:getComputedStyle(c.querySelector('.cardTextBackdrop')).display,fit:body.scrollHeight<=body.clientHeight+2&&body.scrollWidth<=body.clientWidth+2,geometry:title.bottom<art.top+2&&art.bottom<b.top+2&&b.bottom<r.bottom-5};
   }));geometry.push({race,...size,results:result});
  }
  report.geometry=geometry;
  check('Orc and Undead titles, illustrations and live text fit their integrated frames at 1440 and 2840px',geometry.every(row=>row.results.length&&row.results.every(c=>c.frame&&c.floating==='none'&&c.fit&&c.geometry)));
  await p.setViewportSize({width:1920,height:1080});await p.locator('#codexRace').selectOption('orc');await hp.scrollIntoViewIfNeeded();await p.screenshot({path:'artifacts/rarities-orc.png'});
  await p.locator('#codexRace').selectOption('undead');await p.locator('#rlCodexPanel [data-codex-upgrade="ghost_common_dodge"] [data-codex-rarity="rare"]').click();await p.locator('#rlCodexPanel [data-codex-upgrade="ghost_common_dodge"]').scrollIntoViewIfNeeded();await p.screenshot({path:'artifacts/rarities-undead.png'});
  check('Relics also use canonical live descriptions in the codex and picks',logic.canonical);
  check('No runtime errors',!report.errors.length);
 }finally{fs.mkdirSync('artifacts',{recursive:true});fs.writeFileSync('artifacts/upgrade-rarities.json',JSON.stringify(report,null,2));await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
