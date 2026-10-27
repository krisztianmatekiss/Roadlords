const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
const URL=process.env.ROADLORDS_TEST_URL||'http://127.0.0.1:4173/Roadlords/';
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox','--disable-dev-shm-usage']});
 const report={checks:[],errors:[]},check=(name,ok)=>{assert(ok,name);report.checks.push(name);console.log('PASS',name)};
 try{
  const p=await browser.newPage({viewport:{width:1600,height:1000}});await p.route('https://**/*',r=>r.abort());p.on('pageerror',e=>report.errors.push(e.message));
  await p.goto(URL);await p.waitForFunction(()=>window.__ROADLORDS_RUNTIME__);
  const result=await p.evaluate(()=>{
   const R=__ROADLORDS_RUNTIME__,D=__ROADLORDS_UNDEAD__.buildings;
   R.state.running=false;R.state.modal=false;R.state.pregame=false;R.state.startChoices=0;
   window.balanceReset=(race='undead')=>{R.MP.enabled=false;R.MP.role=null;R.state.units=[];R.roadResetCity(R.P,race);R.P.terrain.fill(null);R.P.normal={};R.P.legends=new Set();R.P.legendaryStacks={};R.recomputeCity(R.P,true);return R.P;};
   const put=(type,row=0,col=0)=>{const b={id:type+Math.random(),type,row,col,rotation:0,level:1,progress:0};R.P.buildings.push(b);R.recomputeCity(R.P,true);return b;};
   let c=balanceReset();const start=c.resources.wood,prices=Object.fromEntries(Object.keys(__ROADLORDS_UNDEAD__.units).map(k=>[k,R.unitCost(c,k).wood]));
   const gone=['und_soul_burner','und_soul_overdrive'].every(k=>!D[k]&&!R.BUILDINGS[k]&&!R.buildingUnlockPool(c).some(o=>o.id===k));
   const defs={normal:R.NORMAL.filter(o=>o.race==='undead').map(o=>o.id),legend:R.LEGENDARY.filter(o=>o.race==='undead').map(o=>o.id)};
   const grave=put('und_graveyard'),well=put('und_well',0,1);c.resources.wood=1000;
   const ordinary={time:R.trainingTime(c,grave),upkeep:R.undEconomy(c).totalUpkeep};
   for(const id of ['gen_soul_frugal','gen_military_speed'])R.applyChoice(c,{...R.LEGENDARY.find(o=>o.id===id),kind:'legendary'},false);
   const boosted={time:R.trainingTime(c,grave),upkeep:R.undEconomy(c).totalUpkeep};
   const def=R.LEGENDARY.find(o=>o.id==='und_soul_might');for(let n=0;n<2;n++)R.applyChoice(c,{...def,kind:'legendary'},false);
   const soul=[];for(const n of [-1,999,1000,1999,2000,0]){c.resources.wood=n;soul.push(R.undSoulDamageMult(c));}
   const again=R.eligibleLegendary(c).some(o=>o.id==='und_soul_might'),preview=R.upgradeCopyPreview(c,{...def,kind:'legendary'});
   c=balanceReset();c.resources.wood=10000;put('und_soul_anchor');c.unlocked.add('und_soul_anchor');const unique=R.isUniqueBuilding(c,'und_soul_anchor')&&!R.placeBuilding(c,'und_soul_anchor',1,4,0).ok;
   const interest=[];for(let level=1;level<=4;level++){c=balanceReset();const bank=put('und_soul_bank');bank.level=level;c.normal.gen_soul_abundance=4;R.recomputeCity(c,true);c.resources.wood=10000;c.undeadState.bankClock=59;const base=10000+R.productionRates(c).wood-R.undEconomy(c).totalUpkeep;R.produceResources(c,1);interest.push({actual:c.resources.wood,expected:base*(1+[.05,.06,.08,.10][level-1])});}
   const clearing=[];const pricing=[];
   for(const race of ['human','orc','undead']){c=balanceReset(race);for(const type of ['ruin','ancient']){c.resources=R.C(10000,10000,10000);R.setTerrain(c,0,0,type);const price=R.terrainClearPrice(c,type),before={...c.resources};const queue=R.queueChoice;R.queueChoice=()=>{};const ok=R.clearTerrain(c,0,0,true);R.queueChoice=queue;clearing.push({race,type,price,paid:{wood:before.wood-c.resources.wood,stone:before.stone-c.resources.stone},ok,empty:!R.terrainAt(c,0,0)});}
    for(const type of Object.keys(R.BUILDINGS).filter(k=>k!=='keep'&&R.factionMatches(race,R.BUILDINGS[k],k))){const d=R.buildingDefinition(c,type),price=R.buildPrice(c,type),cells=d.shape.length;pricing.push({race,type,cells,price,perCell:price.wood/cells});}}
   c=balanceReset('undead');c.resources.wood=1000;const spawn=put('und_graveyard');const before=c.resources.wood,ok=R.normalSpawn(c,spawn);const paid=before-c.resources.wood;
   return {start,prices,gone,defs,ordinary,boosted,soul,again,preview,unique,interest,clearing,pricing,spawn:{ok,paid}};
  });report.economy=result;
  check('Undead start with 100 Souls and use all seven newly agreed training prices',result.start===100&&Object.values(result.prices).join()==='13,13,26,18,70,75,100');
  check('Retired buildings and investment are absent; mandatory damage and cemetery reserve remain',result.gone&&!result.defs.normal.includes('gen_build_discount')&&result.defs.normal.includes('necromancer_common_damage')&&result.defs.normal.includes('gen_graveyard_capacity')&&result.defs.normal.length===25&&result.defs.legend.length===23);
  check('The two economy legendaries apply exactly 40% upkeep savings and 25% training speed',Math.abs(result.boosted.upkeep/result.ordinary.upkeep-.6)<1e-9&&Math.abs(result.boosted.time/result.ordinary.time-.8)<1e-9);
  check('Soul Might repeats as a legendary, follows live full thousands and displays the next stack',result.again&&result.soul.every((n,i)=>Math.abs(n-[1,1,1.02,1.02,1.04,1][i])<1e-9)&&result.preview.rows[0].before==='+2%'&&result.preview.rows[0].after==='+3%');
  check('Soul Anchor is unique in actual placement',result.unique);
  check('All four bank rates ignore abundance and compound without an added cap',result.interest.every(x=>Math.abs(x.actual-x.expected)<1e-7));
  check('Every faction pays the exact displayed 4x / 10x ruin cost and clears the plot',result.clearing.every(x=>x.ok&&x.empty&&x.paid.wood===x.price.wood&&x.paid.stone===x.price.stone&&x.price.wood===(x.type==='ruin'?100:1000)));
  check('Actual skeleton training pays the new 13 Soul price once',result.spawn.ok&&result.spawn.paid===13);
  const sd=await p.evaluate(()=>{
   const R=__ROADLORDS_RUNTIME__;balanceReset('human');R.roadResetCity(R.E,'orc');R.state.suddenStarted=false;delete R.state.suddenSides;R.state.ended=false;
   for(const t of R.towers){t.alive=true;t.hp=t.maxHp;t.sdActive=false;}
   const hp=R.towers.map(t=>t.hp);R.state.time=1799.99;R.updateSuddenDeath(1);const untouched=R.towers.every((t,i)=>t.hp===hp[i])&&!R.state.suddenStarted;
   R.state.time=1800;R.updateSuddenDeath(.01);const exact=R.state.suddenStarted&&R.towers.every((t,i)=>t.hp===hp[i]);
   R.state.time=1801;R.updateSuddenDeath(1);R.updateHud();const first=R.towers.filter(t=>t.sdActive).map(t=>({tier:t.tier,gate:t.gateTower}));const capitalSafe=R.P.hp===R.P.maxHp&&R.E.hp===R.E.maxHp;
   const packet={enemy:R.mpCitySnapshot(R.P),player:R.mpCitySnapshot(R.E),shared:R.mpPack(R.mpSharedState()),units:[],towers:R.mpPack(R.towers),capitalTowers:R.mpPack(R.capitalTowers)};
   const snapshotStarted=R.mpRevive(packet.shared).suddenStarted;R.MP.enabled=true;R.MP.role='guest';R.state.suddenStarted=false;R.$('#suddenOverlay').classList.remove('show');R.mpApplySnapshot(packet);const guestPopup=R.$('#suddenOverlay').classList.contains('show');const before=R.towers.map(t=>t.hp);R.updateSuddenDeath(100);const guestNoDrain=R.towers.every((t,i)=>t.hp===before[i]);R.MP.enabled=false;R.MP.role=null;
   // Each side advances independently; surviving defenders shield its capital.
   for(const t of R.towers)if(t.side==='player'){t.alive=false;t.hp=0;}
   R.state.time=1802;R.updateSuddenDeath(1);R.updateHud();const phases={own:R.P.sdActive,enemy:R.E.sdActive,ownPulse:R.$('#playerHp').parentElement.classList.contains('suddenDeathHp')};
   return {untouched,exact,first,capitalSafe,snapshotStarted,guestPopup,guestNoDrain,phases,popup:getComputedStyle(R.$('#suddenOverlay')).position};
  });report.sudden=sd;
  check('Sudden death begins at 30:00 exactly and drains outer towers before capitals',sd.untouched&&sd.exact&&sd.first.length>0&&sd.first.every(t=>t.tier===1&&!t.gate)&&sd.capitalSafe);
  check('Each side advances separately and its currently draining capital pulses',sd.phases.own&&!sd.phases.enemy&&sd.phases.ownPulse);
  check('Guests receive the popup and authoritative tower states without draining twice',sd.snapshotStarted&&sd.guestPopup&&sd.guestNoDrain&&sd.popup==='fixed');
  // Compare every active Undead pick with the same Lexicon renderer used for owned cards.
  await p.locator('.menuBrand').click();await p.waitForTimeout(850);await p.locator('#rlOpenCodex').click();await p.locator('#codexRace').selectOption('undead');
  const references={};for(const tab of ['buildings','common','legendary']){await p.locator(`#rlCodexPanel [data-tab="${tab}"]`).click();Object.assign(references,await p.evaluate(()=>Object.fromEntries([...document.querySelectorAll('[data-codex-building],[data-codex-upgrade]')].map(c=>[c.dataset.codexBuilding||c.dataset.codexUpgrade,{frame:c.querySelector('.cardFrameImage')?.getAttribute('src'),scene:c.querySelector('[data-upgrade-art]')?.getAttribute('viewBox')||c.querySelector('[data-unit-art] image')?.getAttribute('href')||''}]))));}
  const art=await p.evaluate(async refs=>{const R=__ROADLORDS_RUNTIME__;balanceReset();R.MP.lobby.style.display='none';document.body.classList.remove('roadlords-menu-open');R.$('#rlCodexPanel').classList.remove('show');const bad=[];for(const [id,reference] of Object.entries(refs)){const def=[...R.NORMAL,...R.LEGENDARY].find(o=>o.id===id),o=def?{...def,kind:def.kind||'normal'}:R.makeBuildingChoice(R.P,id);R.renderChoice([o],'PRÓBA','Próba','',o.kind==='legendary');const card=R.$('#choiceList .choice'),scene=card.querySelector('[data-upgrade-art]')?.getAttribute('viewBox')||card.querySelector('[data-unit-art] image')?.getAttribute('href')||'';const image=card.querySelector('.cardFrameImage');await image.decode();if(!image.naturalWidth||image.getAttribute('src')!==reference.frame||scene!==reference.scene)bad.push(id);}return {bad,count:Object.keys(refs).length};},references);report.art=art;
  check('All 66 active Undead cards share the same frames and illustration viewports in picks and Lexicon',art.count===66&&art.bad.length===0);
  await p.evaluate(()=>{const R=__ROADLORDS_RUNTIME__;balanceReset();R.P.normal.gen_soul_abundance=3;R.P.legends.add('und_soul_might');R.P.legendaryStacks.und_soul_might=2;R.renderRelics();R.updateHud();R.$('#choiceOverlay').classList.add('hidden');R.$('#relicOverlay').classList.remove('hidden');});
  await p.evaluate(async()=>{document.querySelector('#suddenOverlay').classList.remove('show');await Promise.all([...document.querySelectorAll('#relicList img')].map(async i=>{i.loading='eager';await i.decode()}));});await p.waitForTimeout(100);await p.screenshot({path:'artifacts/active-relic-cards.png'});
  check('Active relics display actual cards, stack counts and owned effects rather than next-pick promises',await p.evaluate(()=>{const list=document.querySelector('#relicList');return list.querySelectorAll('.cardFace').length===2&&list.querySelector('[data-relic="gen_soul_abundance"] .relicOwnedCount').textContent==='×3'&&list.querySelector('[data-relic="und_soul_might"] .upgradeCurrent').textContent==='+2%'&&!list.querySelector('.upgradeAfter')&&[...list.querySelectorAll('.cardFace')].every(c=>c.getBoundingClientRect().height>300)}));
  check('No browser runtime errors',report.errors.length===0);
 }finally{fs.mkdirSync('artifacts',{recursive:true});fs.writeFileSync('artifacts/economy-update.json',JSON.stringify(report,null,2));await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
