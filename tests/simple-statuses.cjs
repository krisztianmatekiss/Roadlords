const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox','--disable-dev-shm-usage']});
 const report={checks:[],errors:[]};
 try{
  const page=await browser.newPage({viewport:{width:1600,height:1000}});await page.route('https://**/*',r=>r.abort());page.on('pageerror',e=>report.errors.push(e.message));
  await page.goto(process.env.ROADLORDS_TEST_URL||'http://127.0.0.1:4173/Roadlords/');await page.waitForFunction(()=>window.__ROADLORDS_RUNTIME__?.unitPoisonDamage);
  await page.evaluate(()=>__ROADLORDS_RUNTIME__.loadProductionBattleArt(['human','orc','undead']));
  report.checks=await page.evaluate(()=>{
   const R=__ROADLORDS_RUNTIME__,checks=[],near=(a,b)=>Math.abs(a-b)<1e-6,check=(name,ok,details)=>checks.push({name,ok:!!ok,details});
   const early=['und_home_march','und_spawn_ward','und_death_mend','und_siege_force'];
   function reset(race='human',enemy='undead'){
    R.MP.enabled=false;R.state.running=false;R.state.time=R.ROAD.clock=20;R.state.units=[];R.ROAD.pending=[];R.ROAD.paused=true;R.ROAD.test=false;R.state.combatStep++;R.battleSearch=null;
    for(const [c,r]of [[R.P,race],[R.E,enemy]]){R.roadResetCity(c,r);c.terrain.fill(null);c.resources=R.C(1e6,1e6,1e6);}
    for(const t of R.towers)t.alive=false;R.roadRefreshFrontiers();R.ROAD.camera=3800;R.ROAD.figureStyle='painted';return R.P;
   }
   function unit(c=R.P){const u=R.releaseUnit(c,R.makeEntry(c,'swordsman'));u.lane=4000;u.offset=0;u.hp=u.maxHp=100;u.shield=u.tempShield=0;return u;}
   function ticks(u,n,dt=1){for(let i=0;i<n;i++){R.ROAD.clock+=dt;R.updateUnitStatuses(u,dt);}}
   let c=reset('undead'),pool=R.eligibleNormal(c).map(x=>x.id);
   check('All four agreed general commons are eligible before any military producer exists',!c.buildings.some(b=>R.BUILDINGS[b.type]?.unit)&&early.every(id=>pool.includes(id)),pool);
   check('Unit-specific commons and new legendary effects remain gated',!pool.includes('zombie_common_poison')&&!R.eligibleLegendary(c).some(o=>o.id==='und_twin_training'));
   check('The four early commons retain their own faction and stacking behaviour',early.every(id=>{const o=R.NORMAL.find(x=>x.id===id);c.normal[id]=1;return o.eligible(c)&&!o.eligible(R.E.race==='human'?R.E:{...R.E,race:'human'})}));
   check('No new legendary cards were introduced',R.LEGENDARY.filter(x=>x.race==='orc').length===24&&R.LEGENDARY.filter(x=>x.race==='undead').length===34);
   reset();let u=unit();u.orcPoison=5;u.shield=50;window.__ROADLORDS_ORCS__.applyCurse(u,'curse',10);const predicted=R.unitPoisonDamage(u);ticks(u,5);
   check('Poison forecasts the declining stack sum and matches actual ticks, bypassing shield and Curse',predicted===15&&near(u.hp,85)&&u.shield===50,{predicted,hp:u.hp});
   reset();u=unit();u.orcPoison=3.5;const fractional=R.unitPoisonDamage(u);ticks(u,4);check('Fractional poison includes its final partial stack',fractional===8&&u.hp===92);
   reset();u=unit();u.orcPoison=100;const lethal=R.unitPoisonDamage(u);ticks(u,1);check('The forecast preserves the existing nonlethal poison rule',lethal===99&&u.hp===1&&R.unitPoisonDamage(u)===0);
   reset();R.E.unlocked.add('und_plague_chamber');const chamber=R.placeBuilding(R.E,'und_plague_chamber',0,0,0).building;chamber.level=4;u=unit();u.orcPoison=5;u.undPoisonSource='enemy';const boosted=R.unitPoisonDamage(u);R.E.legends.add('und_fast_poison');const fast=R.unitPoisonDamage(u);ticks(u,5,.5);
   check('Plague damage multipliers affect the forecast; faster ticks change time, not total damage',near(boosted,21)&&near(fast,21)&&near(u.hp,79),{boosted,fast,hp:u.hp});
   reset();u=unit();u.orcPoison=5;u.shield=30;const fills=[],g=R.ctx,fill=g.fillRect;
   g.fillRect=function(...args){fills.push({color:this.fillStyle,args});return fill.apply(this,args)};
   try{R.roadDrawUnit(u);}finally{g.fillRect=fill;}
   const red=fills.find(x=>x.color==='#e65050'),green=fills.find(x=>x.color==='#a4ed65'),blue=fills.find(x=>x.color==='#66cbff');
   check('A full-health poisoned figure shows green future damage at the right of HP, below the blue shield',red&&green&&blue&&near(green.args[2],red.args[2]*.15)&&near(green.args[0]+green.args[2],red.args[0]+red.args[2])&&blue.args[1]<red.args[1],fills);
   function capture(u){let image;const draw=R.ctx.drawImage;R.ctx.drawImage=function(source,...args){if(source.figureBounds)image=source;return draw.call(this,source,...args)};try{R.roadDrawUnit(u);}finally{R.ctx.drawImage=draw;}if(!image)throw Error('No real figure sprite');return image;}
   function pixels(image){return image.getContext('2d').getImageData(0,0,image.width,image.height).data;}
   reset();u=unit();const clean=capture(u),baseline=pixels(clean);u.orcPoison=5;const poisoned=capture(u),tinted=pixels(poisoned);let greenShift=0,opaque=0;
   for(let i=0;i<tinted.length;i+=4)if(baseline[i+3]>100){opaque++;greenShift+=(tinted[i+1]-tinted[i])>(baseline[i+1]-baseline[i])+10;}
   check('Poison recolours the actual whole-body sprite while retaining its silhouette and cached pose',greenShift>opaque*.8&&capture(u)===poisoned&&u.hp===100&&u.orcPoison===5,{greenShift,opaque});
   window.__ROADLORDS_ORCS__.applyCurse(u,'curse',10);u.veteran=true;const cursed=capture(u),outlined=pixels(cursed);let purple=0;
   for(let i=0;i<outlined.length;i+=4)if(outlined[i]>140&&outlined[i+2]>140&&outlined[i+1]<190&&outlined[i+3]>80)purple++;
   check('Poison, Curse and elite rank coexist on the real figure without changing combat stats',purple>20&&[...R.ROAD.sprites].some(([k,v])=>v===cursed&&k.includes(':elite')&&k.endsWith(':status:5'))&&u.maxHp===100,{purple});
   reset();u=unit();u.orcPoison=5;u.orcBleed=2;ticks(u,1);const bleeding=capture(u);check('A real bleed tick produces a short red flash even over poison',u.statusBleedFlashAt===R.ROAD.clock&&[...R.ROAD.sprites].some(([k,v])=>v===bleeding&&k.endsWith(':status:2')));
   R.ROAD.clock+=.2;const settled=capture(u);check('The damage flash ends and returns to poison green',settled!==bleeding&&[...R.ROAD.sprites].some(([k,v])=>v===settled&&k.endsWith(':status:1')));
   reset();u=unit();R.applyBurn(u,8);ticks(u,1,.1);const burning=capture(u);check('Real burn damage produces the orange flash',u.statusBurnFlashAt===R.ROAD.clock&&[...R.ROAD.sprites].some(([k,v])=>v===burning&&k.endsWith(':status:3')));
   reset();u=unit();u.veteran=true;u.slowTime=u.stunTime=2;R.roadBeginUnitEffects();for(let i=0;i<100;i++){u.lane=3900+i*4;R.roadDrawUnit(u);}let markerImages=0,markerStrokes=0;const drawImage=g.drawImage,stroke=g.stroke;g.drawImage=function(...args){markerImages++;return drawImage.apply(this,args)};g.stroke=function(...args){markerStrokes++;return stroke.apply(this,args)};try{R.roadFlushUnitEffects();}finally{g.drawImage=drawImage;g.stroke=stroke;}
   check('Crowded elite, slow and stun markers render in one batch without per-unit image copies',R.roadEffects.queueCount===100&&markerImages===0&&markerStrokes<=4,{markerImages,markerStrokes});
   reset();u=unit();u.orcPoison=5;u.orcBleed=2;ticks(u,1);window.__ROADLORDS_ORCS__.applyCurse(u,'curse',10);u.slowTime=2;u.stunTime=2;u.veteran=true;u.shield=30;
   R.state.time=R.ROAD.clock;R.MP.enabled=true;R.MP.role='host';R.MP.peer=true;R.MP.conn={open:true,send:p=>{if(p.type==='snapshot')window.__simpleStatusPacket=JSON.parse(JSON.stringify(p))}};R.mpSendSnapshot(true);R.MP.enabled=false;
   const snapshot=window.__simpleStatusPacket.units[0];check('The real snapshot includes the host forecast and tick flash in existing status metadata',snapshot[17].poisonDamage===R.unitPoisonDamage(u)&&snapshot[17].statusFlash[1]===u.statusBleedFlashAt);
   // A fixed screenshot of the same game sprites, not substitute concept art.
   const board=document.createElement('canvas');board.id='statusShowcase';board.width=1000;board.height=420;board.style.cssText='position:fixed;inset:0;z-index:2147483647';document.body.append(board);const b=board.getContext('2d');b.fillStyle='#17291f';b.fillRect(0,0,1000,420);b.textAlign='center';b.font='bold 18px sans-serif';
   const examples=[['Alap',{}],['Méreg',{orcPoison:5}],['Átok',{orcCurses:{curse:10}}],['Elit',{veteran:true}],['Együtt',{orcPoison:5,orcCurses:{curse:10},veteran:true,shield:30}]];
   examples.forEach(([name,extra],i)=>{reset();const figure=unit();Object.assign(figure,extra);b.fillStyle='#f2dfa1';b.fillText(name,100+i*200,45);const oldCtx=R.ctx,oldPoint=R.pointAt,oldHeight=R.ROAD.h;R.ctx=b;R.pointAt=()=>({x:100+i*200,y:310});R.ROAD.h=1200;try{R.roadDrawUnit(figure);}finally{R.ctx=oldCtx;R.pointAt=oldPoint;R.ROAD.h=oldHeight;}});
   return checks;
  });
  await page.locator('#statusShowcase').screenshot({path:'artifacts/simple-status-showcase.png'});
  const packet=await page.evaluate(()=>window.__simpleStatusPacket),guest=await browser.newPage();await guest.route('https://**/*',r=>r.abort());guest.on('pageerror',e=>report.errors.push(e.message));await guest.goto(process.env.ROADLORDS_TEST_URL||'http://127.0.0.1:4173/Roadlords/');await guest.waitForFunction(()=>window.__ROADLORDS_RUNTIME__?.unitPoisonDamage);
  const peer=await guest.evaluate(packet=>{const R=__ROADLORDS_RUNTIME__;R.state.running=false;R.MP.enabled=true;R.MP.role='guest';R.MP.started=true;R.mpHandle(packet);const u=R.state.units[0];R.roadWar.scrollLeft=R.ROAD.city+u.lane-100;R.renderBattle(0);R.ROAD.lowDetail=true;R.ROAD.camera=u.lane-100;R.roadDrawUnit(u);return{forecast:R.unitPoisonDamage(u),flash:u.statusBleedFlashAt,poison:u.syncedStatusBadges.some(([k])=>k==='poison'),curse:u.syncedStatusBadges.some(([k])=>k==='curse'),elite:u.eliteVisual,body:[...R.ROAD.sprites.keys()].some(k=>k.includes(':elite')&&k.endsWith(':status:6')),markers:R.roadEffects.statusSprites,clock:R.ROAD.clock,keys:[...R.ROAD.sprites.keys()].slice(-4)};},packet);
  report.checks.push({name:'A real mirrored guest renders the same poison forecast, red tick flash, purple outline and elite rank in crowd mode',ok:peer.forecast===packet.units[0][17].poisonDamage&&peer.flash===packet.units[0][17].statusFlash[1]&&peer.poison&&peer.curse&&peer.elite&&peer.body&&peer.markers<=8,details:peer});
  for(const c of report.checks){console.log(c.ok?'PASS':'FAIL',c.name);if(!c.ok)console.log(JSON.stringify(c.details));}assert(report.checks.every(x=>x.ok),'Simple status checks failed');assert.equal(report.errors.length,0,report.errors.join('\n'));
 }finally{fs.mkdirSync('artifacts',{recursive:true});fs.writeFileSync('artifacts/simple-statuses.json',JSON.stringify(report,null,2));await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
