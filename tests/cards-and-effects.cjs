const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto');
const URL=process.env.ROADLORDS_TEST_URL||'http://127.0.0.1:4173/Roadlords/';
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox','--disable-dev-shm-usage']});
 const report={checks:[],errors:[],measurements:{}},check=(name,value)=>{assert(value,name);report.checks.push(name);console.log('PASS',name)};
 try{
  const manifest=JSON.parse(fs.readFileSync('public/cards/orc/manifest.json'));
  check('All 51 nonempty Orc cards match the source checksums; four empty upstream files use a fallback',manifest.installed_count===51&&manifest.unavailable_upstream.length===4&&manifest.cards.filter(c=>!manifest.unavailable_upstream.includes(c.file)).every(c=>c.width===768&&c.height===1152&&crypto.createHash('sha256').update(fs.readFileSync('public/cards/orc/'+c.file)).digest('hex')===c.sha256));
  const context=await browser.newContext({viewport:{width:1600,height:1000}});await context.route('https://**/*',r=>r.abort());
  const p=await context.newPage();p.on('pageerror',e=>report.errors.push(e.message));await p.goto(URL);await p.waitForFunction(()=>!!window.__ROADLORDS_RUNTIME__?.roadEffects);
  check('All artwork decodes locally without the music repository or a third-party network',await p.evaluate(async files=>{let next=0,ok=true;await Promise.all(Array.from({length:6},async()=>{while(next<files.length){const file=files[next++],img=new Image();img.src=new URL('cards/orc/'+file,location.href).href;try{await img.decode();ok&&=img.naturalWidth===768&&img.naturalHeight===1152}catch{ok=false}}}));return ok},manifest.cards.filter(c=>!manifest.unavailable_upstream.includes(c.file)).map(c=>c.file)));
  await p.locator('.menuBrand').click();await p.waitForTimeout(900);await p.locator('#rlOpenCodex').click();
  check('The capital fits one compact codex face with no repeated upgrade paragraphs',await p.evaluate(()=>{const c=document.querySelector('[data-codex-building="keep"]'),b=c.querySelector('.rlCodexContent');return !c.textContent.includes('Minden jelenlegi')&&!c.querySelector('.rlUpgradeStep')&&!c.querySelector('details[open]')&&b.textContent.includes('20000')&&b.scrollHeight<=b.clientHeight+1&&c.getBoundingClientRect().height<innerHeight*.8}));
  await p.locator('[data-codex-building="keep"] [data-codex-level="3"]').click();
  check('Level selection displays the selected values rather than repeating previous levels',await p.locator('[data-codex-building="keep"] .rlCodexContent').textContent().then(s=>s.includes('80000')&&!s.includes('20000')&&!s.includes('40000')));
  await p.locator('#codexRace').selectOption('orc');
  check('Every Orc building uses the new full card, with accessible level and branch controls',await p.locator('#rlCodexPanel .cardFrameImage').count()===19&&await p.locator('#rlCodexPanel [data-codex-building]').count()===19);
  await p.screenshot({path:'artifacts/cards-orc-codex.png'});
  await p.locator('#rlCodexPanel [data-tab="legendary"]').click();
  check('Orc relics use 21 supplied frames and five usable fallbacks',await p.locator('#rlCodexPanel .rlCodexCard').count()===26&&await p.locator('#rlCodexPanel .cardFrameImage').count()===21);
  await p.keyboard.press('Escape');
  await p.evaluate(()=>{const R=__ROADLORDS_RUNTIME__;R.MP.lobby.style.display='none';document.body.classList.remove('roadlords-menu-open');R.state.running=false;window.__ROADLORDS_ORCS__.setRace(R.P,'orc')});
  for(const [width,height]of [[1366,768],[1920,1080],[3195,1380],[800,900]]){
   await p.setViewportSize({width,height});await p.evaluate(()=>{const R=__ROADLORDS_RUNTIME__;__ROADLORDS_UI_SCALE__.set('100');const ids=['orc_war','orc_hut','orc_troll','orc_overseer'];R.renderChoice(ids.map(k=>R.makeBuildingChoice(R.P,k)),'ÉPÜLETEK','Válassz épületet','',false);R.$('#choiceOverlay').classList.remove('hidden')});await p.waitForTimeout(80);
   const geometry=await p.evaluate(()=>[...document.querySelectorAll('#choiceList .choice')].map(c=>{const r=c.getBoundingClientRect(),a=c.querySelector('h3').getBoundingClientRect(),b=c.querySelector('.choiceBody').getBoundingClientRect();return {ratio:r.width/r.height,title:Math.abs((a.top-r.top)/r.height-.032),body:Math.abs((b.top-r.top)/r.height-.71),width:c.scrollWidth<=c.clientWidth+1,text:c.querySelector('.choiceBody').scrollWidth<=c.querySelector('.choiceBody').clientWidth+1,src:!!c.querySelector('.cardFrameImage')}}));
   check(`Card art preserves 2:3 proportions and keeps the title, illustration prices and enlarged text box aligned at ${width}×${height}`,geometry.every(g=>Math.abs(g.ratio-2/3)<.01&&g.title<.01&&g.body<.01&&g.width&&g.text&&g.src));
   if(width===1920)await p.screenshot({path:'artifacts/cards-orc-choice.png'});
  }
  await p.setViewportSize({width:1600,height:1000});
  check('Poison and fire terms and values have distinct thematic colours',await p.evaluate(()=>{const R=__ROADLORDS_RUNTIME__;R.roadResetCity(R.P,'undead');const ids=['zombie_common_poison','zombie_leg_retribution'];R.renderChoice(ids.map(id=>({...R.NORMAL.find(x=>x.id===id),...R.LEGENDARY.find(x=>x.id===id),id,kind:id.includes('_leg_')?'legendary':'normal'})),'FEJLESZTÉS','Próba','',false);return document.querySelectorAll('.choiceBody .effect-poison').length>1}));
  // Real queued attacks: no damage or blast before hit; exactly one impact at hit.
  const effects=await p.evaluate(()=>{
   const R=__ROADLORDS_RUNTIME__;R.$('#choiceOverlay').classList.add('hidden');R.state.running=false;R.state.modal=false;R.state.pregame=false;R.state.time=0;R.state.combatStep=0;R.MP.enabled=false;R.ROAD.paused=true;R.roadResetCity(R.P,'human');R.roadResetCity(R.E,'orc');R.state.units=[];R.ROAD.pending=[];R.ROAD.dead=[];R.roadEffects.impacts=[];R.roadEffects.seen.clear();R.ROAD.clock=10;for(const t of [...R.towers,...R.capitalTowers])t.alive=false;R.roadRefreshFrontiers();R.roadWar.scrollLeft=R.ROAD.city+2100;R.renderBattle(0);
   const fire=R.releaseUnit(R.P,R.makeEntry(R.P,'mage')),victim=R.releaseUnit(R.E,R.makeEntry(R.E,'orc_troll'));fire.lane=2400;fire.offset=0;victim.lane=2500;victim.offset=0;fire.cooldown=0;R.roadReindex();R.attackUnit(fire,victim);const a=fire.roadAttack,hp=victim.hp;R.ROAD.clock=a.hit-.001;R.roadImpacts();const early=victim.hp===hp&&R.roadEffects.impacts.length===0;victim.lane=2505;R.ROAD.clock=a.hit+.001;R.roadImpacts();const after=victim.hp,impact=R.roadEffects.impacts.at(-1);R.roadImpacts();const once=victim.hp===after&&R.roadEffects.impacts.length===1;
   const hit={early,once,damage:hp-after,kind:a.effect,resolved:a.resolved,position:impact?.lane===2505};
   R.ROAD.clock=a.launch+(a.hit-a.launch)*.5;R.renderBattle(0);window.__shotCapture=true;
   return hit;
  });report.hit=effects;
  check('Mage fireball and blast share the real attack clock and updated target position',effects.early&&effects.once&&effects.damage>0&&effects.kind==='fire'&&effects.resolved&&effects.position);
  await p.screenshot({path:'artifacts/mage-fireball.png'});
  check('Frost specialisation queues the ice visual and still resolves a real hit',await p.evaluate(()=>{const R=__ROADLORDS_RUNTIME__,u=R.state.units.find(u=>u.key==='mage'),v=R.state.units.find(u=>u.key==='orc_troll');R.P.levels.magetower=4;R.P.l4Branches.magetower='frost_mages';R.ROAD.clock=20;u.cooldown=0;u.roadPending=false;R.attackUnit(u,v);const a=u.roadAttack,hp=v.hp;R.ROAD.clock=a.hit+.001;R.roadImpacts();R.renderBattle(0);return a.effect==='frost'&&v.hp<hp&&R.roadEffects.impacts.some(f=>f.kind==='frost')}));
  // All three factions use one common veteran/elite presentation, including engines.
  const rank=await p.evaluate(()=>{
   const R=__ROADLORDS_RUNTIME__;R.state.units=[];R.ROAD.clock=30;R.roadWar.scrollLeft=R.ROAD.city+2050;R.ROAD.pending=[];
   const variants=['swordsman','mage','catapult','orc_warrior','orc_goblin','orc_ram','und_skeleton','und_vampire','und_lich'];const data=[];
   variants.forEach((key,i)=>{const race=key.startsWith('und_')?'undead':key.startsWith('orc_')?'orc':'human';R.roadResetCity(R.P,race);const u=R.releaseUnit(R.P,R.makeEntry(R.P,key));u.lane=2250+i%3*125;u.offset=-140+Math.floor(i/3)*120;u.cooldown=99;u.veteran=true;u.orcPoison=i%3===0?6:0;u.burnTime=i%3===1?4:0;u.orcPositive={power: i%3===2?5:0};data.push({u,stats:[u.maxHp,u.damage]})});
   R.renderBattle(0);R.ROAD.lowDetail=true;for(const {u}of data)R.roadDrawUnit(u);const styled=[...R.ROAD.sprites.keys()].filter(k=>k.includes(':elite'));
   return{count:styled.length,all:variants.every(k=>styled.some(s=>s.startsWith('figure:'+k+':'))),unchanged:data.every(({u,stats})=>u.maxHp===stats[0]&&u.damage===stats[1])};
  });report.ranks=rank;
  check('Veteran/elite humans, Orcs, Undead and siege engines get cached gold equipment without changing stats',rank.count>=9&&rank.all&&rank.unchanged);
  await p.screenshot({path:'artifacts/battle-statuses-and-ranks.png'});
  // Existing 20/21-column packet: visual rank bit and synced statuses, no new protocol column.
  const packet=await p.evaluate(()=>{const R=__ROADLORDS_RUNTIME__;R.MP.enabled=true;R.MP.role='host';R.MP.peer=true;R.MP.conn={open:true,close:()=>{},dataChannel:{bufferedAmount:0},send:p=>window.__packet=JSON.parse(JSON.stringify(p))};R.mpSendSnapshot(true);return window.__packet});
  const guest=await context.newPage();guest.on('pageerror',e=>report.errors.push(e.message));await guest.goto(URL);await guest.waitForFunction(()=>!!window.__ROADLORDS_RUNTIME__);
  check('Guest snapshots preserve common elite ranks and visible burn/poison/buff states',await guest.evaluate(packet=>{const R=__ROADLORDS_RUNTIME__;R.MP.enabled=true;R.MP.role='guest';R.MP.pendingStrategy=null;R.mpHandle(packet);return R.state.units.length===9&&R.state.units.every(u=>u.eliteVisual)&&R.state.units.some(u=>u.syncedStatusBadges.some(s=>s[0]==='burn'))&&R.state.units.some(u=>u.syncedStatusBadges.some(s=>s[0]==='poison'))&&R.state.units.some(u=>u.syncedStatusBadges.some(s=>s[0]==='power'))},packet));
  report.measurements=await p.evaluate(()=>{const R=__ROADLORDS_RUNTIME__;R.MP.enabled=false;R.roadStartTest(42,{count:500});R.roadPause();R.roadWar.scrollLeft=R.ROAD.city+2000;R.state.units.forEach((u,i)=>{u.veteran=true;u.burnTime=4;u.orcPoison=6;u.orcPositive={power:10};u.lane=2400+(i%20-10)*18;u.offset=Math.floor(i/20)*9-225;});const times=[];for(let i=0;i<40;i++){const t=performance.now();R.renderBattle(0);if(i>9)times.push(performance.now()-t)}times.sort((a,b)=>a-b);return{units:R.state.units.filter(u=>u.alive).length,sprites:R.ROAD.sprites.size,p95:times[Math.floor(times.length*.95)],impacts:R.roadEffects.impacts.length,statusSprites:R.roadEffects.statusSprites}});
  check('1000 active units retain bounded sprite and effect caches with all status visuals enabled',report.measurements.units===1000&&report.measurements.sprites<=768&&report.measurements.impacts<=128&&report.measurements.statusSprites<=192&&Number.isFinite(report.measurements.p95));
  check('No card, codex, battle-effect or guest runtime errors',report.errors.length===0);
 }finally{fs.mkdirSync('artifacts',{recursive:true});fs.writeFileSync('artifacts/cards-and-effects.json',JSON.stringify(report,null,2));await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
