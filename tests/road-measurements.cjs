const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
const URL=process.env.ROADLORDS_TEST_URL||'http://127.0.0.1:4173/Roadlords/';
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox','--disable-dev-shm-usage']});
 const report={checks:[],errors:[],towers:[]},check=(name,ok)=>{assert(ok,name);report.checks.push(name);console.log('PASS',name)};
 try{
  const p=await browser.newPage({viewport:{width:1600,height:1000}});await p.route('https://**/*',r=>r.abort());p.on('pageerror',e=>report.errors.push(e.message));await p.goto(URL);await p.waitForFunction(()=>window.__ROADLORDS_RUNTIME__);
  check('The road is doubled to 9600 coordinates / 960 m while base speeds and ranged attack ranges use the approved doubled values',await p.evaluate(()=>{const R=__ROADLORDS_RUNTIME__;return R.PATH_LENGTH===9600&&R.UNITS.swordsman.speed===52.5&&R.UNITS.archer.range===300&&R.UNITS.knight.speed===147&&R.$('#roadMinimap').title.includes('960 m')}));
  await p.locator('.menuBrand').click();await p.waitForTimeout(900);await p.locator('#rlOpenCodex').click();await p.locator('#rlCodexPanel [data-tab="units"]').click();
  for(const race of ['human','orc','undead']){
   await p.locator('#codexRace').selectOption(race);
   check(`${race} unit ranges use metres and movement uses m/s throughout the encyclopedia`,await p.evaluate(()=>{const cards=[...document.querySelectorAll('[data-codex-unit]')];return cards.length===7&&cards.every(c=>{const stat=name=>[...c.querySelectorAll('.lexUnitStats>div')].find(e=>e.firstElementChild.textContent===name)?.lastElementChild.textContent;return / m$/.test(stat('Hatótáv'))&&/ m\/s$/.test(stat('Mozgás'))})}));
  }
  await p.keyboard.press('Escape');
  check('Range and movement upgrade previews use the same scale without changing the actual units',await p.evaluate(()=>{const R=__ROADLORDS_RUNTIME__;R.roadResetCity(R.P,'human');R.renderChoice(['archer_range','knight_move'].map(id=>({...R.NORMAL.find(x=>x.id===id),kind:'normal'})),'PRÓBA','Próba','',false);const cards=R.$$('#choiceList .choice');return cards[0].querySelector('.upgradeBefore').textContent==='30 m'&&cards[0].querySelector('.upgradeAfter').textContent==='33 m'&&cards[1].querySelector('.upgradeBefore').textContent==='14,7 m/s'&&cards[1].querySelector('.upgradeAfter').textContent==='16,91 m/s'}));
  const charge=await p.evaluate(()=>{
   const R=__ROADLORDS_RUNTIME__;R.state.running=false;R.roadResetCity(R.P,'human');R.P.legends.add('cavalry_charge');
   const u=R.releaseUnit(R.P,{key:'knight'}),target=R.releaseUnit(R.E,{key:'swordsman'}),rows=[];
   for(const distance of [50,999.999,1000,1999.999,2000,8000,20000]){
    u.chargeDist=distance;const unitDamage=R.attackBaseDamage(u,target)/u.damage,unitReset=u.chargeDist===0;
    const tower={id:'charge-proof',side:'enemy',tier:1,lane:u.lane+20,hp:1e9,alive:true};u.chargeDist=distance;R.roadRealStructure(u,tower);
    rows.push({distance,unitDamage,structureDamage:(1e9-tower.hp)/(u.damage*.25),reset:unitReset&&u.chargeDist===0});
   }
   const description=R.upgradeCopyPreview(R.P,{...R.LEGENDARY.find(x=>x.id==='cavalry_charge'),kind:'legendary'}).description;
   R.state.units=[];return {rows,description};
  });
  check('Cavalry charge advances at each full 100 metres against units and towers, caps at 200 percent and consumes the charge',charge.rows.every((r,i)=>Math.abs(r.unitDamage-[1,1,1.25,1.25,1.5,3,3][i])<1e-6&&Math.abs(r.structureDamage-r.unitDamage)<1e-6&&r.reset)&&charge.description.includes('100 m'));
  check('Castle Defenders requires all three own road towers and ignores both castle towers',await p.evaluate(()=>{
   const R=__ROADLORDS_RUNTIME__,alive=R.towers.map(t=>t.alive);R.roadResetCity(R.P,'human');R.P.legends.add('castle_defenders');
   const own=R.towers.filter(t=>t.side==='player'),road=own.filter(t=>!t.gateTower),gate=own.filter(t=>t.gateTower),wave=()=>{const e={key:'swordsman'};R.waveBuffs(R.P,[e]);return !!e.veteran;};
   try{own.forEach(t=>t.alive=true);const all=wave();gate.forEach(t=>t.alive=false);const noGate=wave();road[0].alive=false;gate.forEach(t=>t.alive=true);return road.length===3&&gate.length===2&&all&&noGate&&!wave()&&R.LEGENDARY.find(x=>x.id==='castle_defenders').description.includes('2 vártorony');}
   finally{R.towers.forEach((t,i)=>t.alive=alive[i]);}
  }));
  check('Actual unit inspectors include metres and m/s for both normal and Undead units',await p.evaluate(()=>{const R=__ROADLORDS_RUNTIME__;const normal=R.unitStatsHTML(R.P,'archer');R.roadResetCity(R.P,'undead');const undead=R.unitStatsHTML(R.P,'und_ghost');return normal.includes('30 m')&&normal.includes('5,25 m/s')&&undead.includes('3 m')&&undead.includes('5,75 m/s')}));
  check('Battle descriptions convert distances once and leave city-grid cells and percentage bonuses intact',await p.evaluate(()=>{const R=__ROADLORDS_RUNTIME__;R.renderChoice([{id:'metric-copy-proof',kind:'legendary',name:'Próba',description:'Hatótáv: 82,5. +75 hatótáv. A 2 mezőn belüli épületek +20% termelést kapnak.'}],'PRÓBA','Próba','',false);const c=R.$('#choiceList .choiceBody');return c.textContent.includes('8,25 m')&&c.textContent.includes('+7,5 m')&&c.textContent.includes('2 mezőn')&&c.textContent.includes('+20%')}));
  const travel=await p.evaluate(()=>{const R=__ROADLORDS_RUNTIME__;R.MP.enabled=false;R.MP.lobby.style.display='none';document.body.classList.remove('roadlords-menu-open');R.state.running=false;R.state.pregame=false;R.state.modal=false;R.$('#choiceOverlay').classList.add('hidden');R.state.units=[];R.roadResetCity(R.P,'human');R.roadResetCity(R.E,'orc');for(const t of R.towers)t.alive=false;R.roadRefreshFrontiers();const u=R.releaseUnit(R.P,R.makeEntry(R.P,'swordsman'));u.lane=R.PATH_LENGTH/2;u.offset=u.roadHomeOffset=0;R.state.units=[u];R.roadReindex();const start=u.lane;R.roadAdvance(u,[],1);R.state.units=[];return u.lane-start});
  check('One real second of unobstructed swordsman movement still advances 52.5 coordinates = 5.25 metres',Math.abs(travel-52.5)<1e-6);
  await p.evaluate(()=>{const R=__ROADLORDS_RUNTIME__;if(R.ROAD.enemyPinned)R.$('#enemyCityPin').click();for(const t of R.towers)t.alive=true;R.P.normal={};R.state.units=[];R.state.selectedBuild=null;R.state.selectedBuilding=null;R.state.selectedTowerId=null;R.renderStatic()});
  for(const zoom of [1,.75,1.5]){
   const target=await p.evaluate(zoom=>{const R=__ROADLORDS_RUNTIME__;R.state.selectedTowerId=null;R.$('#inspector').classList.remove('show');R.ROAD.zoom=zoom;const t=R.towers.find(t=>t.id==='p2');R.roadWar.scrollLeft=R.ROAD.city+t.lane-R.ROAD.w/2;R.renderBattle(0);const s=R.towerVisualScale(t),point=R.pointAt(t.lane,t.lateral||0),rect=R.canvas.getBoundingClientRect();return {x:rect.left+point.x+12*s,y:rect.top+point.y-23*s,id:t.id,scale:s}},zoom);
   await p.mouse.click(target.x,target.y);await p.waitForTimeout(60);
   const measured=await p.evaluate(()=>{const R=__ROADLORDS_RUNTIME__,t=R.selectedTowerV496();if(!t)return null;R.renderBattle(0);const band=R.roadTowerRangeGeometry(t),ctx=R.ctx;let yellow=0,samples=0;const x=Math.max(1,Math.round(band.left));for(let y=Math.ceil(band.top)+30;y<band.bottom-10;y+=8){const pixel=ctx.getImageData(x,y,1,1).data;yellow+=pixel[0]>210&&pixel[1]>170&&pixel[2]<190;samples++}return {id:t.id,range:band.range,readout:R.canvas.dataset.towerRange,inspector:R.$('#towerRangeStat')?.textContent,yellow,samples,bounds:R.towerVisualBounds(t)}});report.towers.push({zoom,...measured});
   check(`Clicking the enlarged tower roof selects the real range band and metre readout at ${zoom*100}% zoom`,measured?.id===target.id&&measured.range===330&&measured.readout==='Hatótáv: 33 m'&&measured.inspector==='33 m'&&measured.yellow>measured.samples*.65);
  }
  check('Road and castle tower ranges double on both sides; damage, cadence and real targeting boundaries remain consistent',await p.evaluate(()=>{
   const R=__ROADLORDS_RUNTIME__;R.state.units=[];
   return R.towers.every(t=>{
    const range=R.towerStatsV496(t).range,inside=R.releaseUnit(R.cityForSide(t.side==='player'?'enemy':'player'),{key:'swordsman'}),outside=R.releaseUnit(R.cityForSide(t.side==='player'?'enemy':'player'),{key:'swordsman'}),dir=t.side==='player'?1:-1;
    inside.lane=t.lane+dir*range;inside.offset=R.ROAD.half;outside.lane=t.lane+dir*(range+.01);
    const targets=R.nearestTowerTargets(t.side,t.lane,range,10),st=R.towerStatsV496(t);
    const ok=range===(t.gateTower?380:330)&&st.damage===(t.gateTower?120:96)&&st.cooldown===(t.gateTower?.85:1)&&targets.includes(inside)&&!targets.includes(outside);
    R.state.units=[];return ok;
   });
  }));
  check('Removed tower training cannot change the live range band or inspector',await p.evaluate(()=>{const R=__ROADLORDS_RUNTIME__,t=R.selectedTowerV496();R.P.normal.tower_crews=1;R.renderTowerInspectorV496(t);R.renderBattle(0);return Math.abs(R.roadTowerRangeGeometry(t).range-330)<1e-6&&R.$('#towerRangeStat').textContent==='33 m'&&R.canvas.dataset.towerRange==='Hatótáv: 33 m'}));
  await p.screenshot({path:'artifacts/enlarged-tower-metres.png'});
  check('Closing the tower inspector removes the selected range overlay',await p.evaluate(()=>{const R=__ROADLORDS_RUNTIME__;R.$('#closeInspector').click();R.renderBattle(0);return !R.state.selectedTowerId&&!R.canvas.dataset.towerRange}));
  check('Both peers advertise the doubled path length and reject a mismatched old map',await p.evaluate(()=>{const R=__ROADLORDS_RUNTIME__,sent=[];let closed=false;R.MP.conn={open:true,send:p=>sent.push(p),close:()=>closed=true};R.mpSend({type:'hello'});R.mpHandle({type:'hello',pathLength:9600,gameRules:R.gameRulesVersion,race:'human',name:'Új játékos',factionProtocol:2});const accepted=!closed;R.mpHandle({type:'hello',race:'human',name:'Régi játékos',factionProtocol:2});return sent[0].pathLength===9600&&accepted&&closed&&R.MP.lobby.querySelector('.mpLobbyError').textContent.includes('pályaverzió')}));
  check('No map, measurement, tower selection or multiplayer-version runtime errors',report.errors.length===0);
 }finally{fs.mkdirSync('artifacts',{recursive:true});fs.writeFileSync('artifacts/road-measurements.json',JSON.stringify(report,null,2));await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
