const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
const URL=process.env.ROADLORDS_TEST_URL||'http://127.0.0.1:4173/Roadlords/';
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
 const report={checks:[],errors:[]},check=(name,result)=>{assert(result,name);report.checks.push(name);console.log('PASS',name);};
 try{
  fs.mkdirSync('artifacts',{recursive:true});
  const context=await browser.newContext({viewport:{width:1440,height:960}});await context.route('https://**/*',r=>r.abort());
  const page=await context.newPage();page.on('pageerror',e=>report.errors.push(e.message));
  await page.goto(URL);await page.waitForFunction(()=>!!window.__ROADLORDS_ROAD__);await page.evaluate(()=>__ROADLORDS_ROAD__.artReady);
  await page.evaluate(()=>{__ROADLORDS_ROAD__.startTest(42,{count:50});__ROADLORDS_ROAD__.pause();});
  await page.locator('[data-camera="0"]').click();await page.waitForTimeout(150);
  for(const viewport of [{width:1440,height:960},{width:1920,height:1080},{width:900,height:768}]){
   await page.setViewportSize(viewport);await page.waitForTimeout(150);
   const layout=await page.evaluate(()=>{
    const rect=s=>{const b=document.querySelector(s).getBoundingClientRect();return {x:b.x,y:b.y,w:b.width,h:b.height,bottom:b.bottom};};
    return {frame:rect('.playerframe'),grid:rect('#playerGrid'),war:rect('.war'),height:document.querySelector('.war').clientHeight,dock:rect('#armyDock'),command:rect('.command'),tools:rect('#roadHud'),reserve:rect('.armyDockTeam[data-side="player"] .reserveGroup'),army:rect('.armyDockTeam[data-side="player"] .fieldGroup'),health:rect('.playerframe .capitalHealth'),gate:rect('#playerGate')};
   });report['layout'+viewport.width]=layout;
   check('Full-height square city and bottom dock fit '+viewport.width+'px viewport',Math.abs(layout.frame.h-layout.height)<2&&Math.abs(layout.frame.w-layout.frame.h)<2&&layout.grid.h>layout.frame.h*.8&&layout.reserve.x<layout.army.x&&layout.dock.y>=layout.war.bottom-1&&layout.dock.bottom<=layout.command.y+1&&layout.tools.y>=layout.war.bottom-1&&layout.health.y>=layout.gate.bottom);
   if(viewport.width===1920)await page.screenshot({path:'artifacts/city-full-height.png'});
  }
  await page.setViewportSize({width:1440,height:960});await page.waitForTimeout(150);
  const stats=await page.evaluate(()=>{
   const R=__ROADLORDS_RUNTIME__;R.P.hp=R.P.maxHp/2;R.updateBattleDock();
   R.MP.enabled=true;R.MP.role='host';R.MP.playerName='Várkapitány';R.MP.opponentName='Ostromló';__ROADLORDS_MP_NAMES__.update();
   const health=document.querySelector('.playerframe .capitalHealth');
   return {army:document.querySelector('#playerArmy').textContent,expectedArmy:R.fieldUnitCount(R.P)+' / '+R.P.armyCap,portraits:document.querySelectorAll('#playerArmyMix .unitchip').length,hp:Number(health.getAttribute('aria-valuenow')),max:R.P.maxHp,bar:health.querySelector('i').style.width,name:document.querySelector('.capitalIdentity #playerNameTag').textContent,nameVisible:!document.querySelector('#playerNameTag').classList.contains('hidden'),ids:['playerHp','enemyHp','playerArmy','garrisonCount','playerNameTag','enemyNameTag'].every(id=>document.querySelectorAll('#'+id).length===1)};
  });report.stats=stats;
  check('Dock retains live counts and all portraits, capital HP bar and multiplayer identity',stats.army===stats.expectedArmy&&stats.portraits===7&&stats.hp===Math.ceil(stats.max/2)&&stats.bar==='50%'&&stats.name==='Várkapitány'&&stats.nameVisible&&stats.ids);
  await page.locator('[data-army-view="enemy"]').click();
  check('Enemy dock can be inspected without duplicating counters',await page.locator('.armyDockTeam[data-side="enemy"]').isVisible()&&!await page.locator('.armyDockTeam[data-side="player"]').isVisible());
  await page.locator('[data-army-view="player"]').click();
  const cameraEdges=[];
  for(const target of [0,2]){await page.locator(`[data-camera="${target}"]`).click();await page.evaluate(()=>__ROADLORDS_ROAD__.render(0));cameraEdges.push(await page.evaluate(target=>{const R=__ROADLORDS_RUNTIME__;return target===0?Math.abs(R.pointAt(0).x)<1:Math.abs(R.pointAt(R.PATH_LENGTH).x-R.ROAD.w)<1;},target));}
  check('Zoom keeps both city walls aligned with their battlefield edges',cameraEdges.every(Boolean));
  await page.evaluate(()=>{
   const R=__ROADLORDS_RUNTIME__,Q=__ROADLORDS_ROAD__;R.MP.enabled=false;R.MP.role='solo';
   window.siegeFixture=()=>{
    Q.startTest(42,{count:20,roster:'art'});Q.pause();R.state.units=[];Q.state.pending=[];Q.state.dead=[];
    for(const c of [R.P,R.E]){c.race='human';c.normal={};c.legends=new Set();c.l4Branches={};c.hp=c.maxHp=1e6;}
    for(const t of R.towers){t.alive=false;t.cooldown=9999;}
    for(const t of R.capitalTowers)t.cooldown=9999;
    R.roadRefreshFrontiers();
   };
  });
  const encirclement=await page.evaluate(()=>{
   const R=__ROADLORDS_RUNTIME__,Q=__ROADLORDS_ROAD__,runs=[];
   for(const side of ['player','enemy']){
    siegeFixture();const dir=side==='player'?1:-1,t=R.towers.find(t=>t.id===(dir===1?'e1':'p1')),next=R.towers.find(t=>t.id===(dir===1?'e2':'p2'));
    t.lane=2400;t.lateral=0;t.alive=true;t.hp=t.maxHp=1e6;next.lane=2400+dir*400;next.alive=true;R.roadRefreshFrontiers();
    for(let i=0;i<8;i++){const u=R.releaseUnit(dir===1?R.P:R.E,{key:'swordsman'});u.lane=2400-dir*(160+i%2*22);u.offset=u.roadHomeOffset=(i-3.5)*16;u.hp=u.maxHp=1e6;u.cooldown=.1;}
    const hits=[],real=R.roadRealStructure;let minRadius=Infinity,maxAdvance=-Infinity;
    R.roadRealStructure=function(u,s){const hp=s.hp;const out=real(u,s);if(s===t&&s.hp<hp)hits.push({id:u.id,rear:dir*(u.lane-t.lane)>15});return out;};
    try{for(let i=0;i<600;i++){R.updateBattle(1/30);for(const u of R.state.units){minRadius=Math.min(minRadius,Math.hypot(u.lane-t.lane,u.offset));maxAdvance=Math.max(maxAdvance,dir*(u.lane-t.lane));}}}finally{R.roadRealStructure=real;}
    runs.push({side,hits:hits.length,rearHits:hits.filter(h=>h.rear).length,attackers:new Set(hits.map(h=>h.id)).size,minRadius,maxAdvance,damage:1e6-t.hp,firstStillTarget:R.targetStructure(side)===t});
   }return runs;
  });report.encirclement=encirclement;console.log('SIEGE',JSON.stringify(encirclement));
  check('Both teams actually circle and damage a living tower from its far side',encirclement.every(r=>r.rearHits>0&&r.attackers===8&&r.damage>0));
  check('Melee respects the tower body and cannot advance to the next stage',encirclement.every(r=>r.minRadius>=41&&r.maxAdvance<108&&r.firstStillTarget));
  await page.locator('[data-camera="1"]').click();await page.evaluate(()=>__ROADLORDS_ROAD__.render(0));await page.screenshot({path:'artifacts/tower-encirclement.png'});
  const towerClick=await page.evaluate(()=>{const R=__ROADLORDS_RUNTIME__,t=R.towers.find(t=>t.id==='p1'),p=R.pointAt(t.lane,t.lateral||0),s=2.4*R.ROAD.h/600*R.ROAD.zoom,b=R.canvas.getBoundingClientRect();return {id:t.id,x:b.x+p.x+15*s,y:b.y+p.y+8*s};});
  await page.mouse.click(towerClick.x,towerClick.y);
  check('Enlarged tower body remains clickable away from the old small hit area',await page.evaluate(id=>__ROADLORDS__.state.selectedTowerId===id,towerClick.id));
  await page.evaluate(()=>{__ROADLORDS__.state.selectedTowerId=null;__ROADLORDS_RUNTIME__.renderInspector();});
  const diversion=await page.evaluate(()=>{
   siegeFixture();const R=__ROADLORDS_RUNTIME__,Q=__ROADLORDS_ROAD__,t=R.towers.find(t=>t.id==='e1');t.lane=2400;t.lateral=0;t.alive=true;t.hp=t.maxHp=1e6;R.roadRefreshFrontiers();
   let u;for(let i=0;i<4;i++)u=R.releaseUnit(R.P,{key:'swordsman'});R.state.units=[u];u.lane=2454;u.offset=0;u.hp=u.maxHp=1e6;u.cooldown=0;
   const v=R.releaseUnit(R.E,{key:'swordsman'});v.lane=2481;v.offset=0;v.hp=v.maxHp=1e6;v.stunTime=100;
   const nearby=R.roadCanPursue(u,v),far=!R.roadCanPursue(u,{lane:2700,offset:0});R.attackUnit(u,v);
   const deadline=u.roadTowerDiversionUntil,events=[],real=R.roadRealStructure;
   R.roadRealStructure=function(a,s){const hp=s.hp,out=real(a,s);if(a===u&&s===t&&hp>s.hp)events.push({clock:Q.state.clock,defenderAlive:v.alive});return out;};
   try{for(let i=0;i<300;i++)R.updateBattle(1/30);}finally{R.roadRealStructure=real;}
   return {nearby,far,defenderDamage:1e6-v.hp,towerDamage:1e6-t.hp,deadline,events};
  });report.diversion=diversion;console.log('DIVERSION',JSON.stringify(diversion));
  check('A melee defender detour returns to real tower damage while that defender is still alive',diversion.nearby&&diversion.far&&diversion.defenderDamage>0&&diversion.towerDamage>0&&diversion.events.some(e=>e.defenderAlive&&e.clock>=diversion.deadline));
  const capitals=await page.evaluate(()=>{
   const R=__ROADLORDS_RUNTIME__,Q=__ROADLORDS_ROAD__,out=[];
   for(const side of ['player','enemy'])for(const key of ['swordsman','archer'])for(const offset of [-228,0,228]){
    siegeFixture();const dir=side==='player'?1:-1,u=R.releaseUnit(dir===1?R.P:R.E,{key}),city=dir===1?R.E:R.P;
    u.lane=dir===1?R.PATH_LENGTH-120:120;u.offset=u.roadHomeOffset=offset;u.hp=u.maxHp=1e6;u.cooldown=0;
    for(let i=0;i<150;i++)R.updateBattle(1/30);
    out.push({side,key,offset,after:u.offset,damage:1e6-city.hp,impact:u.roadAttack?.toOffset,distance:R.roadDistance(R.targetStructure(side),u)});
   }return out;
  });report.capitals=capitals;
  check('Melee and ranged troops damage either capital at the center and both road edges',capitals.every(r=>r.damage>0&&r.impact===r.offset));
  check('Capital attackers retain their lateral position instead of converging on the gate',capitals.every(r=>Math.abs(r.after-r.offset)<.01));
  await page.reload();await page.waitForFunction(()=>!!window.__ROADLORDS_ROAD__);await page.locator('.menuBrand').click();await page.waitForTimeout(900);await page.locator('#mpSolo').click();await page.locator('#soloRace').selectOption('human');await page.locator('#raceContinue').click();await page.locator('#pregameReady').click();
  for(let i=0;i<4;i++){await page.waitForFunction(()=>!!__ROADLORDS__.state.choiceContext);await page.evaluate(()=>{const R=__ROADLORDS__;R.choose(R.state.choiceContext.opts[0],0);for(let j=0;j<160&&!R.state.modal;j++)R.tick(1/30);});}
  await page.evaluate(()=>{const R=__ROADLORDS_RUNTIME__;R.state.running=false;R.state.modal=false;R.$('#choiceOverlay').classList.add('hidden');R.P.unlocked.add('house');R.P.resources=R.C(1e6,1e6,1e6);R.state.selectedBuild='house';R.state.buildRotation=0;R.renderStatic();});
  check('Normal play removes the floating panel and keeps the portrait dock above building controls',!await page.locator('#roadHud').isVisible()&&await page.locator('#armyDock').isVisible());
  const place=await page.evaluate(()=>{const R=__ROADLORDS__;for(let r=0;r<R.GRID;r++)for(let c=0;c<R.GRID;c++)if(R.canPlace(R.P,'house',r,c,0))return {r,c,before:R.P.buildings.length};});assert(place);
  await page.locator(`#playerGrid .plot[data-r="${place.r}"][data-c="${place.c}"]`).click();
  check('Real pointer placement still reaches the correct cell in the enlarged city',await page.evaluate(p=>__ROADLORDS__.P.buildings.length===p.before+1&&__ROADLORDS__.P.buildings.some(b=>b.type==='house'&&b.row===p.r&&b.col===p.c),place));
  await page.screenshot({path:'artifacts/city-normal-layout.png'});
  check('No runtime errors in the new city and siege scenarios',report.errors.length===0);
 }catch(error){report.failure=String(error.stack||error);throw error;}finally{fs.writeFileSync('artifacts/city-and-siege-results.json',JSON.stringify(report,null,2));await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
