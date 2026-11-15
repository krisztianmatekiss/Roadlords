const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('fs');
(async()=>{const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox','--disable-dev-shm-usage']}),report={checks:[],errors:[]};
const check=(name,ok,data)=>{assert(ok,name+(data?' '+JSON.stringify(data):''));report.checks.push(name);console.log('PASS',name)};
try{
 const p=await browser.newPage({viewport:{width:1920,height:1080}});await p.route('https://**/*',r=>r.abort());p.on('pageerror',e=>report.errors.push(e.message));
 await p.goto(process.env.ROADLORDS_TEST_URL||'http://127.0.0.1:4173/Roadlords/');await p.waitForFunction(()=>window.__ROADLORDS_RUNTIME__);
 const result=await p.evaluate(()=>{
  const R=__ROADLORDS_RUNTIME__,C=R.upgradeCatalog,out={};R.MP.enabled=false;R.state.running=false;R.state.modal=false;
  const reset=race=>{R.state.units=[];R.roadResetCity(R.P,race);R.roadResetCity(R.E,race==='undead'?'human':'undead');R.recomputeCity(R.P,false);R.recomputeCity(R.E,false);R.P.normal={};R.P.normalRarities={};R.P.legends=new Set();R.roadReindex();};
  const pick=(id,rarity='rare')=>R.applyChoice(R.P,C.option(id,rarity));
  reset('human');out.human=['spawn_speed','all_damage','frugal_training','building_discount'].every(id=>['common','uncommon','rare'].every(r=>R.normalRarityPool(R.P,r).some(o=>o.id===id)));
  reset('orc');out.orc=['orc_move','orc_siege_damage','orc_food_discount','orc_as','orc_hp'].every(id=>R.normalRarityPool(R.P,'common').some(o=>o.id===id))&&!R.normalRarityPool(R.P,'common').some(o=>o.id==='orc_cursed_damage');
  out.life=['orc_leech','orc_lifesteal','vampire_common_lifesteal'].every(id=>Object.keys(C.editions(id)).join()==='rare');
  const base=R.statsFor(R.P,{key:'orc_warrior'}).hp;for(const rarity of ['common','uncommon','rare'])pick('orc_warrior_hp',rarity);
  R.renderRelics();out.deck={ratio:R.statsFor(R.P,{key:'orc_warrior'}).hp/base,count:C.count(R.P),groups:C.grouped(R.P).length,articles:R.$$('#relicList [data-relic="orc_warrior_hp"]').length,badge:R.$('#relicList .relicOwnedCount').textContent,body:R.$('#relicList .rlCodexContent').textContent,rarities:[...R.$$('#relicList .relicRarityCounts span')].map(n=>[n.dataset.rarity,n.textContent])};
  const snap=R.mpRevive(R.mpCitySnapshot(R.P));out.snapshot=C.grouped(snap)[0].count===3&&snap.normal.orc_warrior_hp===7&&JSON.stringify(snap.normalRarities)===JSON.stringify(R.P.normalRarities);
  R.E.normal={orc_move:7};R.E.normalRarities={orc_move:{common:1,uncommon:1,rare:1}};R.E.race='orc';R.renderRelics(R.E);out.enemy=R.$$('#relicList [data-relic="orc_move"]').length===1&&R.$('#relicList .relicOwnedCount').textContent==='×3'&&R.$('#relicList .rlCodexContent').textContent.includes('35%');
  reset('orc');pick('orc_leech');pick('orc_leech');const a=R.releaseUnit(R.P,{key:'orc_berserker'}),b=R.releaseUnit(R.E,{key:'swordsman'});a.lane=1000;b.lane=1010;a.offset=b.offset=0;a.hp=a.maxHp/2;b.hp=b.maxHp=10000;const hp=a.hp;R.roadReindex();R.roadRealAttack(a,b);out.leech={damage:10000-b.hp,heal:a.hp-hp};
  reset('orc');R.P.normal.orc_bleed=2;const w=R.releaseUnit(R.P,{key:'orc_warrior'}),v=R.releaseUnit(R.E,{key:'swordsman'});w.lane=1000;v.lane=1010;w.offset=v.offset=0;v.hp=v.maxHp=10000;R.roadReindex();R.roadRealAttack(w,v);out.bleed=v.orcBleed;
  reset('undead');out.legends=!R.LEGENDARY.some(o=>o.id==='lich_leg_greedy');
  const producer={id:'lich-producer',type:'und_lich_spawner',row:0,col:0,level:2,rotation:0};R.P.buildings.push(producer);R.P.levels.und_lich_spawner=2;
  out.levelBefore=!R.normalRarityPool(R.P,'rare').some(o=>o.id==='lich_leg_greedy');producer.level=R.P.levels.und_lich_spawner=3;out.levelAfter=R.normalRarityPool(R.P,'rare').some(o=>o.id==='lich_leg_greedy');
  out.links=[];out.damage=[];
  for(let n=0;n<3;n++){
   reset('undead');for(let i=0;i<n;i++){pick('lich_leg_greedy');pick('lich_common_growth');}
   const lich=R.releaseUnit(R.P,{key:'und_lich'});lich.lane=1000;lich.offset=0;lich.cooldown=100;
   const enemies=Array.from({length:5},(_,i)=>{const e=R.releaseUnit(R.E,{key:'swordsman'});e.lane=1100;e.offset=i*20;e.hp=e.maxHp=10000;e.cooldown=100;return e;});R.roadReindex();R.roadRealAttack(lich,enemies[0]);out.links.push(lich.undBeams.length);
   lich.undBeams=[{id:enemies[0].id,age:10}];R.updateBattle(.1);out.damage.push(10000-enemies[0].hp);
  }
  out.radius=[];
  for(let n=0;n<3;n++){
   reset('undead');for(let i=0;i<n;i++)pick('zombie_common_burst_radius');
   const z=R.releaseUnit(R.P,{key:'und_zombie'});z.lane=1000;z.offset=0;
   const enemies=[29,35,45].map(d=>{const e=R.releaseUnit(R.E,{key:'swordsman'});e.lane=1000+d;e.offset=0;return e;});R.roadReindex();R.undZombiePoisonBurst(z);
   out.radius.push({poison:enemies.map(e=>e.orcPoison||0),visual:R.undVisiblePoisonBursts().at(-1)?.radius});
  }
  R.renderStatic();return out;
 });report.logic=result;
 check('General Human and Orc cards are available before a producer; curse damage still requires a Shaman',result.human&&result.orc);
 check('All three lifesteal upgrades are Epic-only',result.life);
 check('Mixed rarities display one owned card, three picks, a real +70% effect and each rarity count',Math.abs(result.deck.ratio-1.7)<1e-8&&result.deck.count===3&&result.deck.groups===1&&result.deck.articles===1&&result.deck.badge==='×3'&&result.deck.body.includes('+70%')&&result.deck.rarities.length===3,result.deck);
 check('Opponent decks and multiplayer snapshots retain grouped counts and actual summed strength',result.enemy&&result.snapshot);
 check('Two Berserker picks heal exactly 10% of actual HP damage; Warrior bleeding stacks linearly',result.leech.damage>0&&Math.abs(result.leech.heal-result.leech.damage*.1)<1e-7&&result.bleed===2,result.leech);
 check('The old Lich relic is replaced by an Epic unlocked at producer L3',result.legends&&result.levelBefore&&result.levelAfter);
 check('Repeated Lich Epics attach 1/2/3 distinct targets and increase only the beam ramp by 0/50/100%',result.links.join()==='1,2,3'&&result.damage.every((n,i)=>Math.abs(n-(.5+2*(1+.5*i)*1.005))<1e-6),{links:result.links,damage:result.damage});
 check('Zombie burst radius affects real targets and the matching visible ring at 3/4/5 metres',JSON.stringify(result.radius.map(r=>r.poison))===JSON.stringify([[4,0,0],[4,4,0],[4,4,4]])&&result.radius.every((r,i)=>r.visual===30+10*i),result.radius);
 await p.waitForFunction(()=>__ROADLORDS_RUNTIME__.menuOpening.ready);await p.locator('.menuBrand').click();
 await p.evaluate(()=>{const R=__ROADLORDS_RUNTIME__;R.MP.lobby.style.display='none';document.body.classList.remove('roadlords-menu-open');R.state.running=false;});
 await p.locator('#rlGameMenuButton').click();await p.locator('#rlIngameMenu [data-action="main"]').click();await Promise.all([p.waitForNavigation(),p.locator('#rlIngameMenu [data-action="main"]').click()]);
 await p.waitForFunction(()=>window.__ROADLORDS_RUNTIME__?.menuOpening?.entered);
 check('Leaving a match opens the ready main menu directly and consumes its one-use return flag',await p.evaluate(()=>{const R=__ROADLORDS_RUNTIME__;return R.MP.lobby.classList.contains('menu-ready')&&!R.MP.lobby.classList.contains('menu-loading')&&!R.MP.lobby.querySelector('.mpLobbyGrid').inert&&!sessionStorage.getItem('roadlords:return-to-menu');}));
 await p.waitForFunction(()=>__ROADLORDS_RUNTIME__.menuOpening.ready);await p.screenshot({path:'artifacts/upgrade-patch-return-menu.png'});
 check('No runtime errors',!report.errors.length,report.errors);
}finally{fs.mkdirSync('artifacts',{recursive:true});fs.writeFileSync('artifacts/upgrade-patch.json',JSON.stringify(report,null,2));await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1});
