const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
const crypto=require('node:crypto');
const URL=process.env.ROADLORDS_TEST_URL||'http://127.0.0.1:4173/Roadlords/';
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox','--disable-dev-shm-usage']});
 const report={checks:[],errors:[],coverage:[],overflow:[]},check=(name,ok)=>{assert(ok,name);report.checks.push(name);console.log('PASS',name)};
 try{
  const p=await browser.newPage({viewport:{width:1600,height:1000}});await p.route('https://**/*',r=>r.abort());p.on('pageerror',e=>report.errors.push(e.message));
  await p.goto(URL);await p.waitForFunction(()=>!!window.__ROADLORDS_RUNTIME__?.cardBuildingCopy);await p.locator('.menuBrand').click();await p.waitForTimeout(900);await p.locator('#rlOpenCodex').click();
  await p.locator('#codexRace').selectOption('orc');
  for(const[level,speed]of[[1,'25%'],[2,'42,9%'],[3,'66,7%']]){
   await p.locator(`[data-codex-building="orc_overseer"] [data-codex-level="${level}"]`).click();
   check(`Overseer L${level}: correct speed conversion, green benefit, red initial HP, no duplicated rows`,await p.locator('[data-codex-building="orc_overseer"]').evaluate((c,speed)=>{const b=c.querySelector('.rlCodexContent');return b.textContent.includes(speed)&&b.textContent.includes('80% HP-val indulnak')&&b.querySelector('.effect-positive')?.textContent===speed&&b.querySelector('.effect-negative')?.textContent==='80%'&&!b.querySelector('.lexEffectRows')&&b.scrollHeight<=b.clientHeight+1&&c.querySelector('details')},speed));
  }
  await p.locator('[data-codex-building="orc_overseer"] [data-codex-level="1"]').click();await p.locator('[data-codex-building="orc_overseer"]').screenshot({path:'artifacts/overseer-clear-copy.png'});
  for(const[width,height]of[[1366,768],[1920,1080],[800,900]]){
   await p.setViewportSize({width,height});await p.evaluate(()=>__ROADLORDS_UI_SCALE__.set('100'));
   for(const race of['human','orc','undead']){
    await p.locator('#codexRace').selectOption(race);
    for(const tab of['buildings','common','legendary']){
     await p.locator(`#rlCodexPanel [data-tab="${tab}"]`).click();
     const result=await p.evaluate(()=>[...document.querySelectorAll('#rlCodexPanel .rlCodexCard')].map(c=>{const b=c.querySelector('.rlCodexContent');return{name:c.querySelector('h3').textContent,text:b.textContent,over:b.scrollHeight-b.clientHeight,horizontal:b.scrollWidth-b.clientWidth}}));
     report.coverage.push({width,race,tab,count:result.length});report.overflow.push(...result.filter(r=>r.over>1||r.horizontal>1).map(r=>({width,race,tab,...r})));
     check(`All ${race} ${tab} faces fit their text boxes at ${width}px`,result.length>0&&result.every(r=>r.over<=1&&r.horizontal<=1&&!/NaN|undefined|\+\+/.test(r.text)));
    }
   }
  }
  const models=await p.evaluate(()=>{const R=__ROADLORDS_RUNTIME__,out=[];for(const race of['human','orc','undead']){const defs=race==='undead'?__ROADLORDS_UNDEAD__.buildings:R.BUILDINGS;for(const[type,d]of Object.entries(defs)){if(race==='human'&&(type.startsWith('orc_')||type.startsWith('und_')))continue;if(race==='orc'&&!type.startsWith('orc_')&&type!=='keep'&&type!=='warehouse')continue;for(let level=1;level<=3;level++)out.push({race,type,level,description:R.cardBuildingCopy.metrics(race,type,level).description})}}return out});
  check('All 66 buildings have valid selected-level copy at L1–L3',models.length===198&&models.every(x=>x.description.length>10&&!/NaN|undefined|\+\+/.test(x.description)));
  check('Selected support values change with the actual level',models.some(x=>x.type==='orc_hut'&&x.level===3&&x.description.includes('40 sereghely')&&x.description.includes('60 helyőrségi'))&&models.some(x=>x.type==='guildhouse'&&x.level===3&&x.description.includes('75%')));
  await p.locator('#rlCodexPanel [data-tab="buildings"]').click();
  await p.locator('[data-codex-building="und_necro_spawner"]').scrollIntoViewIfNeeded();
  check('Necromancer Sanctuary uses the new local image and keeps all numeric details inside the text box',await p.evaluate(async()=>{const c=document.querySelector('[data-codex-building="und_necro_spawner"]'),img=c.querySelector('.cardFrameImage');await img.decode();return img.naturalWidth===1024&&img.naturalHeight===1536&&!c.querySelector('.cardFace>.rlCodexMeta')&&c.querySelector('.rlCodexContent .productionFacts')&&c.querySelector('.rlCodexContent .productionMeta')}));
  await p.locator('[data-codex-building="und_necro_spawner"]').screenshot({path:'artifacts/necromancer-sanctuary-card.png'});
  const imageManifest=JSON.parse(fs.readFileSync('src/data/undead-card-manifest.json'));
  check('Generated Sanctuary image matches its recorded checksum',crypto.createHash('sha256').update(fs.readFileSync('public/cards/undead/buildings/und_necro_spawner.png')).digest('hex')===imageManifest.sha256);
  await p.keyboard.press('Escape');
  const semantic=await p.evaluate(()=>{const R=__ROADLORDS_RUNTIME__;R.MP.lobby.style.display='none';R.state.running=false;R.P.race='human';const texts=['Egységképzési költség: −5%.','Egységeid +100% sebzést, de −50% életerőt kapnak.','A katonaképzés nem fogyaszt élelmet, de 25%-kal tovább tart.','+100% termelés, de 3× épületfenntartás.'];R.renderChoice(texts.map((description,i)=>({id:'copy-proof-'+i,name:'Próba',kind:'legendary',description})),'PRÓBA','Próba','',false);return [...document.querySelectorAll('#choiceList .choiceBody')].map(b=>({positive:[...b.querySelectorAll('.effect-positive')].map(n=>n.textContent),negative:[...b.querySelectorAll('.effect-negative')].map(n=>n.textContent)}))});
  check('Savings are green; HP loss, longer training and extra upkeep are red',semantic[0].positive.includes('−5%')&&semantic[1].positive.includes('+100%')&&semantic[1].negative.includes('−50%')&&semantic[2].negative.includes('25%')&&semantic[3].negative.includes('3×'));
  // Exercise the actual pick renderer for every faction, including building upgrades and L4 branches.
  report.pickAudit=await p.evaluate(()=>{const R=__ROADLORDS_RUNTIME__,out=[];for(const race of['human','orc','undead']){R.roadResetCity(R.P,race);const defs=race==='undead'?__ROADLORDS_UNDEAD__.buildings:R.BUILDINGS;let options=[];for(const[type,d]of Object.entries(defs)){if(race==='human'&&(type.startsWith('orc_')||type.startsWith('und_')))continue;if(race==='orc'&&!type.startsWith('orc_')&&type!=='keep'&&type!=='warehouse')continue;options.push(R.makeBuildingChoice(R.P,type));options.push({id:type,name:d.name,kind:'building_upgrade'});const branches=race==='undead'?d.branches:race==='orc'&&type==='keep'?__ROADLORDS_ORCS__.keepBranches:R.V4_BRANCHES[type]||[];options.push(...branches.map(b=>({id:type,branch:b.id,name:b.name,kind:'building_branch',description:b.description})));}for(const[kind,list]of[['normal',R.NORMAL],['legendary',R.LEGENDARY]])options.push(...list.filter(o=>race==='human'?!o.race||o.race==='human':o.race===race).map(o=>({...o,kind})));const bad=[];for(let i=0;i<options.length;i+=4){const batch=options.slice(i,i+4);R.renderChoice(batch,'PRÓBA','Próba','',false);R.$('#choiceOverlay').classList.remove('hidden');document.querySelectorAll('#choiceList .choiceBody').forEach((b,j)=>{const option=batch[j],producer=['building','building_upgrade','building_branch'].includes(option.kind)&&R.BUILDINGS[option.id]?.unit;const art=b.parentElement.querySelector('.choiceArt');if(/NaN|undefined|\+\+|ELAVULT/.test(b.textContent)||b.scrollWidth>b.clientWidth+1||producer&&(!b.querySelector('.productionFacts')||art.querySelector('.pickCD,.pickUnitCost,.pickFootprint'))||option.kind==='building'&&producer&&/Sebesülten|Trollonként|4 helyet|Területen sebző/.test(b.textContent))bad.push({id:option.id,text:b.textContent})})}out.push({race,count:options.length,bad})}return out});
  check('Every building, upgrade, branch and relic renders valid picks for all three factions',report.pickAudit.every(r=>r.count>50&&r.bad.length===0));
  check('Troll Breeding previews the actual half-price and four-cell shape without changing the current city',await p.evaluate(()=>{const R=__ROADLORDS_RUNTIME__;R.roadResetCity(R.P,'orc');R.renderChoice([{id:'orc_troll',branch:'breeding',kind:'building_branch',name:'Szaporítás'}],'PRÓBA','Próba','',false);const b=R.$('#choiceList .choiceBody');return b.textContent.includes('15,5 fa')&&b.textContent.includes('37,5 kő')&&b.querySelectorAll('.pickFootprint .on').length===4&&!R.hasBranch(R.P,'orc_troll','breeding')}));
  check('Construction-card numbers stay below the illustration, including the new Sanctuary artwork',await p.evaluate(()=>{const R=__ROADLORDS_RUNTIME__;R.roadResetCity(R.P,'undead');R.P.unlocked.add('und_necro_spawner');R.renderBuildList();const c=R.$('#buildList [data-k="und_necro_spawner"] .buildcard');return !!c.querySelector('.cardFrameImage')&&!c.querySelector('.cardart .pickCD,.cardart .pickUnitCost,.cardart .pickFootprint,.cardart .undeadBuildingArt')&&!!c.querySelector('.productionMini .pickCD')&&!!c.querySelector('.cardcosts .pickFootprint')}));
  check('No browser errors',report.errors.length===0);
 }finally{fs.mkdirSync('artifacts',{recursive:true});fs.writeFileSync('artifacts/card-copy-clarity.json',JSON.stringify(report,null,2));await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
