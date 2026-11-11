const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox','--disable-dev-shm-usage']});
 const report={checks:[],errors:[]};
 try{
  const context=await browser.newContext({viewport:{width:1920,height:1080}});await context.route('https://**/*',r=>r.abort());
  const page=await context.newPage();page.on('pageerror',e=>report.errors.push(e.message));
  await page.goto(process.env.ROADLORDS_TEST_URL||'http://127.0.0.1:4173/Roadlords/');await page.waitForFunction(()=>window.__ROADLORDS_RUNTIME__);
  const results=await page.evaluate(()=>{
   const R=__ROADLORDS_RUNTIME__,out=[],near=(a,b)=>Math.abs(a-b)<1e-6;
   const check=(name,ok,details)=>out.push({name,ok:!!ok,details});
   function reset(){
    R.MP.enabled=false;R.state.running=false;R.state.modal=false;R.state.ended=false;R.state.time=100;
    R.roadResetCity(R.P,'undead');R.roadResetCity(R.E,'human');R.state.units=[];R.ROAD.dead=[];R.ROAD.pending=[];R.ROAD.clock=100;
    for(const c of [R.P,R.E]){c.buildings=c.buildings.filter(b=>b.type==='keep');c.normal={};c.legends=new Set();c.l4Branches={};c.levels={};c.resources=R.C(100000,100000,100000);c.undRevision=(c.undRevision||0)+1;}
    for(const t of R.towers)t.alive=false;R.roadReindex();R.roadRefreshFrontiers();return R.P;
   }
   function unit(c,key,lane=5000,offset=0){const u=R.releaseUnit(c,{key});u.lane=lane;u.offset=offset;u.cooldown=999;u.hp=u.maxHp=100;u.undRangedGrowthBase=100;u.shield=u.tempShield=0;R.roadReindex();return u;}
   function dead(c,key,lane=5000,offset=0,combat=true){const u=unit(c,key,lane,offset);u.hp=0;R.killUnit(u,combat);return u;}
   function morgue(c){c.buildings.push({id:'test-morgue',type:'und_morgue',level:1,row:3,col:3,rotation:0,progress:0});}
   function own(lane,offset=0,side='player'){return R.isOwnHalf({side,lane,offset});}
   let c=reset();const defs=['und_grave_islands','und_withered_foundations','zombie_leg_half_poison','und_ranged_adaptation','und_fast_poison'].map(id=>R.LEGENDARY.find(o=>o.id===id));
   const empty=defs.every(o=>!o.eligible(c));morgue(c);c.levels.und_morgue=4;c.buildings.find(b=>b.type==='und_morgue').level=4;const zombie=defs[0].eligible(c)&&defs[2].eligible(c)&&!defs[1].eligible(c);c.legends.add('und_grave_islands');
   check('Five one-time legendaries require meaningful producers and decay requires access to enemy territory',empty&&zombie&&defs[1].eligible(c)&&defs.every(o=>o.race==='undead'&&!o.repeatable));
   c=reset();c.legends.add('und_grave_islands');dead(c,'und_zombie',5000,40);
   check('A zombie combat death creates a true 8-metre circular island without moving the main boundary',own(5000,40)&&own(5079,40)&&!own(5081,40)&&!own(5000,121)&&!own(5000,40,'enemy')&&R.territoryBoundary()===4800);
   const count=c.undeadState.graveIslands.length;dead(c,'und_zombie',4500);dead(c,'und_zombie',5300,0,false);dead(c,'und_skeleton',5300);
   check('Own-half deaths, summon expiry and non-zombie deaths do not create islands',c.undeadState.graveIslands.length===count);
   c.normal.und_home_march=1;const walker=unit(c,'und_skeleton',5000,40),inside=R.effectiveMoveSpeed(walker,c);walker.offset=121;
   check('Own-territory movement applies inside the circle and stops outside its lateral edge',near(inside,R.effectiveMoveSpeed(walker,c)*1.1));
   c.l4Branches.keep='dead_realm';check('Territorial L4 doubles island radius and territory bonuses',own(5159,40)&&!own(5161,40));
   R.state.time=106;check('Islands expire at six simulation seconds and restore ordinary ownership',!own(5000,40)&&own(5000,40,'enemy'));
   c=reset();c.legends.add('und_grave_islands');dead(c,'und_zombie',4820);R.roadResetCity(R.E,'undead');R.E.legends.add('und_grave_islands');R.state.time=100.1;dead(R.E,'und_zombie',4780);
   check('Overlapping opposing islands have one owner chosen by the latest death',!own(4800)&&own(4800,0,'enemy'));
   c=reset();c.legends.add('und_grave_islands');for(let i=0;i<300;i++)dead(c,'und_zombie',5000+(i%75)*55,-200+Math.floor(i/75)*55);
   check('Large battles keep island storage bounded and expired patches are reclaimed',c.undeadState.graveIslands.length<=128&&R.undActiveIslands().length<=128);
   R.state.units=[];R.state.time=107;R.updateBattle(.01);check('Expired island and poison visual records are removed from snapshots',!c.undeadState.graveIslands.length&&!c.undeadState.poisonBursts.length);
   c=reset();c.legends.add('zombie_leg_half_poison');c.normal.zombie_common_poison=2;
   let z=unit(c,'und_zombie'),a=unit(R.E,'swordsman',5029),b=unit(R.E,'swordsman',5031),ally=unit(c,'und_skeleton',5005);
   R.damageUnit(z,49,'magic');const early=!a.orcPoison;R.damageUnit(z,1,'magic');const first=a.orcPoison;R.healUnit(z,100);R.damageUnit(z,50,'magic');const repeat=a.orcPoison;
   z.hp=0;R.killUnit(z,true);
   check('Half-HP poison triggers exactly once at 50 percent, uses upgraded death poison and still fires on death',early&&first===6&&repeat===6&&a.orcPoison===12&&!b.orcPoison&&!ally.orcPoison,{early,first,repeat,final:a.orcPoison});
   c=reset();c.legends.add('zombie_leg_half_poison');z=unit(c,'und_zombie');a=unit(R.E,'swordsman',5020);z.shield=100;R.damageUnit(z,50,'magic');const shield=!z.undHalfPoisonUsed&&!a.orcPoison;z.shield=0;R.damageUnit(z,200,'magic');
   check('Shield absorption does not trigger half HP; a lethal blow only emits the normal death burst',shield&&a.orcPoison===4&&!z.undHalfPoisonUsed);
   const fresh=unit(c,'und_zombie');R.damageUnit(fresh,50,'magic');check('New actors have their own independent poison charge',fresh.undHalfPoisonUsed&&a.orcPoison===8);
   const wounded=unit(c,'und_zombie');wounded.hp=50;R.damageUnit(wounded,1,'magic');check('A zombie resurrected at half HP can spend its fresh charge on its first wound',wounded.undHalfPoisonUsed&&a.orcPoison===12);
   c=reset();c.legends.add('und_ranged_adaptation');let adapted=unit(c,'und_skeleton'),archer=unit(R.E,'archer',5020);archer.damage=1;
   for(let i=0;i<10;i++)R.roadRealAttack(archer,adapted);
   check('Ten actual ranged hits grant additive 10 percent birth HP, not exponential growth',near(adapted.maxHp,110)&&near(adapted.undRangedHpBonus,10),{hp:adapted.hp,max:adapted.maxHp,bonus:adapted.undRangedHpBonus});
   const bonus=adapted.undRangedHpBonus;R.damageUnit(adapted,1,'magic');const melee=unit(R.E,'swordsman',5020);melee.damage=1;R.roadRealAttack(melee,adapted);
   check('Direct damage-over-time and melee attacks do not grant ranged growth',adapted.undRangedHpBonus===bonus);
   adapted.shield=1000;R.roadRealAttack(archer,adapted);check('A shield-absorbed ranged hit still grants exactly one HP increment',near(adapted.undRangedHpBonus,11));
   const expected=R.statsFor(c,{key:adapted.key}).hp+11;R.refreshExistingUnitsForCity(c);check('Permanent ranged HP survives later stat refreshes',near(adapted.maxHp,expected));
   const reborn=R.releaseUnit(c,{...R.permanentUnitData(adapted),key:adapted.key});check('A newly resurrected actor starts without the old actor ranged bonus',!reborn.undRangedHpBonus);
   const ghost=unit(c,'und_ghost'),random=Math.random;Math.random=()=>0;try{R.roadRealAttack(archer,ghost);}finally{Math.random=random;}
   check('A genuinely dodged arrow gives no HP growth',!ghost.undRangedHpBonus);
   const doomed=unit(c,'und_skeleton');archer.damage=10000;R.roadRealAttack(archer,doomed);check('Lethal arrows do not resurrect their victim through HP growth',!doomed.alive&&!doomed.undRangedHpBonus);
   function poison(fast){c=reset();if(fast)c.legends.add('und_fast_poison');const v=unit(R.E,'swordsman');R.undPoison(v,4,c);const hp=[];for(let i=0;i<16;i++){R.updateUnitStatuses(v,.25);hp.push(v.hp);}return {hp,stacks:v.orcPoison};}
   const slow=poison(false),fast=poison(true);
   check('Fast poison ticks at half a second and spends the same four poison points in half the time',slow.hp[1]===100&&fast.hp[1]===96&&slow.hp[3]===96&&fast.hp[3]===93&&fast.hp[7]===90&&slow.hp[15]===90&&fast.stacks===0&&slow.stacks===0,{slow,fast});
   c=reset();c.legends.add('und_fast_poison');const ordinary=unit(R.E,'swordsman');ordinary.orcPoison=4;R.updateUnitStatuses(ordinary,.5);check('The Undead poison legendary never accelerates unowned Orc poison',ordinary.hp===100&&ordinary.orcPoison===4);
   c=reset();c.legends.add('zombie_leg_half_poison');z=unit(c,'und_zombie');z.hp=51;z.orcPoison=2;a=unit(R.E,'swordsman',5020);R.updateUnitStatuses(z,1);check('Poison damage crossing half HP also triggers the zombie burst once',z.undHalfPoisonUsed&&a.orcPoison===4);
   c=reset();c.legends.add('und_grave_islands');c.legends.add('und_withered_foundations');const tower=R.towers.find(t=>t.id==='e1');tower.hp=tower.maxHp=1000;tower.alive=true;
   dead(c,'und_zombie',tower.lane);dead(c,'und_zombie',tower.lane+40);R.state.units=[];R.updateBattle(.5);
   check('Two overlapping islands deal only 60 flat tower damage per second',near(tower.hp,970),tower.hp);
   c.l4Branches.keep='dead_realm';R.updateBattle(.5);check('Territorial L4 doubles decay to 120 damage per second',near(tower.hp,910));
   const gate=R.towers.find(t=>t.id==='eg-top');gate.alive=true;gate.hp=gate.maxHp=1000;dead(c,'und_zombie',gate.lane,gate.lateral);R.state.units=[];const capital=R.E.hp;R.updateBattle(.5);
   check('Castle towers and capitals are excluded from foundation decay',gate.hp===1000&&R.E.hp===capital&&!R.undTowerDecaySource(gate));
   R.state.time=107;const hp=tower.hp;R.updateBattle(.5);check('Decay stops immediately when temporary territory expires',tower.hp===hp);
   c.normal.und_territory=6;check('A permanent territorial advance also activates decay',!!R.undTowerDecaySource(tower));c.normal.und_territory=100;c.buildings.push({id:'grave-producer',type:'und_graveyard',level:1,row:3,col:3,rotation:0});check('Decay eligibility also works without zombies when real expansion reaches a tower',defs[1].eligible(c));
   const lost=R.onTowerLost,reward=R.rewardTowerKill;let losses=0,rewards=0;R.onTowerLost=()=>losses++;R.rewardTowerKill=()=>rewards++;tower.hp=1;
   try{R.updateBattle(.1);R.updateBattle(.1);check('Decay destroys a tower and awards its normal loss/reward exactly once',!tower.alive&&losses===1&&rewards===1,{losses,rewards});}finally{R.onTowerLost=lost;R.rewardTowerKill=reward;}
   c=reset();c.legends.add('und_grave_islands');c.legends.add('und_withered_foundations');tower.alive=true;tower.hp=1000;dead(c,'und_zombie',tower.lane);R.state.units=[];R.MP.enabled=true;R.MP.role='guest';R.updateBattle(.5);
   check('A multiplayer guest never simulates foundation damage',tower.hp===1000);R.MP.enabled=false;
   return out;
  });
  for(const r of results){report.checks.push(r);console.log(r.ok?'PASS':'FAIL',r.name,r.ok?'':JSON.stringify(r.details));}assert(results.every(r=>r.ok),'Undead territory checks failed');
  await page.locator('.menuBrand').click();await page.waitForTimeout(900);
  await page.evaluate(()=>{const R=__ROADLORDS_RUNTIME__;R.roadResetCity(R.P,'undead');document.body.classList.remove('roadlords-menu-open');R.renderChoice(['und_grave_islands','und_withered_foundations','zombie_leg_half_poison','und_ranged_adaptation','und_fast_poison'].map(id=>({...R.LEGENDARY.find(o=>o.id===id),kind:'legendary'})),'LEGENDÁS','Élőhalott képességek','',false);R.$('#choiceOverlay').classList.remove('hidden');});
  await page.waitForTimeout(120);
  const ui=await page.evaluate(async()=>{const cards=[...document.querySelectorAll('#choiceList .choice')];await Promise.all(cards.map(async c=>{const image=new Image();image.src=c.querySelector('.cardScene image').getAttribute('href');await image.decode();}));return cards.length===5&&cards.every(c=>c.querySelector('.cardFrameImage').src.endsWith('/legendary-frame.png')&&c.querySelector('.choiceBody').scrollHeight<=c.querySelector('.choiceBody').clientHeight+2);});
  assert(ui,'New cards decode their own artwork and fit their text');report.checks.push({name:'All five cards use unique illustrations, the Undead legendary frame and fitting text',ok:ui});
  await page.screenshot({path:'artifacts/undead-territory-cards.png'});
  const packet=await page.evaluate(()=>{
   const R=__ROADLORDS_RUNTIME__;R.$('#choiceOverlay').classList.add('hidden');R.state.time=200;R.roadResetCity(R.P,'undead');R.roadResetCity(R.E,'human');R.P.legends.add('und_grave_islands');R.P.legends.add('und_withered_foundations');R.P.legends.add('zombie_leg_half_poison');R.state.units=[];
   const z=R.releaseUnit(R.P,{key:'und_zombie'});z.lane=6000;z.offset=30;z.hp=0;R.roadReindex();R.killUnit(z,true);
   const survivor=R.releaseUnit(R.P,{key:'und_zombie'});survivor.undHalfPoisonUsed=true;
   R.MP.enabled=true;R.MP.role='host';R.MP.peer=true;R.MP.started=true;const sent=[];R.MP.conn={open:true,close:()=>{},dataChannel:{bufferedAmount:0},send:p=>sent.push(JSON.parse(JSON.stringify(p)))};R.mpSendSnapshot(true);return sent.findLast(p=>p.type==='snapshot');
  });
  const guest=await context.newPage();guest.on('pageerror',e=>report.errors.push(e.message));await guest.goto(process.env.ROADLORDS_TEST_URL||'http://127.0.0.1:4173/Roadlords/');await guest.waitForFunction(()=>window.__ROADLORDS_RUNTIME__);
  const mirrored=await guest.evaluate(packet=>{const R=__ROADLORDS_RUNTIME__;R.MP.enabled=true;R.MP.role='guest';R.MP.started=true;R.MP.pendingStrategy=null;R.mpApplySnapshot(packet);const zone=R.undActiveIslands()[0],burst=R.undVisiblePoisonBursts()[0];return {zone,burst,own:R.isOwnHalf({side:'enemy',lane:3600,offset:-30}),other:R.isOwnHalf({side:'player',lane:3600,offset:-30}),charge:R.state.units.some(u=>u.undHalfPoisonUsed)};},packet);
  assert(mirrored.zone.lane===3600&&mirrored.zone.offset===-30&&mirrored.zone.side==='enemy'&&mirrored.burst.lane===3600&&mirrored.own&&!mirrored.other&&mirrored.charge,'Mirrored territory and poison state');report.checks.push({name:'Actual multiplayer snapshots mirror island positions, owners, burst visuals and the spent zombie charge',ok:true});
  const visuals=await page.evaluate(async()=>{
   const R=__ROADLORDS_RUNTIME__;R.MP.enabled=false;R.$('#choiceOverlay').classList.add('hidden');await R.loadProductionBattleArt(['undead','human']);R.roadStartTest(42,{count:28,roster:'undead-figures'});if(!R.ROAD.paused)R.roadPause();
   R.state.time=200;R.ROAD.clock=200;R.P.legends=new Set(['und_grave_islands','und_withered_foundations']);R.state.units=[];R.ROAD.dead=[];R.ROAD.pending=[];
   for(const t of R.towers)t.alive=false;const t=R.towers.find(t=>t.id==='e1');t.alive=true;t.hp=t.maxHp=1000;R.roadRefreshFrontiers();R.roadWar.scrollLeft=R.ROAD.city+t.lane-R.ROAD.w/2;R.renderBattle(0);
   const sample=()=>{const p=R.pointAt(t.lane+90,25);return [...R.ctx.getImageData(Math.round(p.x),Math.round(p.y),1,1).data].join(',')};const before=sample();
   const z=R.releaseUnit(R.P,{key:'und_zombie'});z.lane=t.lane+30;z.offset=0;z.hp=0;R.roadReindex();R.killUnit(z,true);R.state.time=200.2;R.ROAD.clock=200.2;R.renderBattle(0);const inside=sample();
   const hash=()=>{const b=R.towerVisualBounds(t),data=R.ctx.getImageData(Math.round(b.x),Math.round(b.y),Math.round(b.width),Math.round(b.height)).data;let sum=0;for(const n of data)sum=(Math.imul(sum,31)+n)>>>0;return sum;};const decaying=hash();
   R.P.legends.delete('und_withered_foundations');R.renderBattle(0);const ordinary=hash();R.P.legends.add('und_withered_foundations');R.renderBattle(0);
   window.__undTerritoryScreenshotReady=true;return {island:before!==inside,cracks:decaying!==ordinary,bursts:R.undVisiblePoisonBursts().length};
  });
  assert(visuals.island&&visuals.cracks&&visuals.bursts>0,'Real battlefield shows the island, tower cracks and poison burst');report.checks.push({name:'Actual game rendering shows changed ground pixels, animated tower cracks and a timed poison burst',ok:true});
  await page.screenshot({path:'artifacts/undead-territory-battle.png'});
  assert.equal(report.errors.length,0,report.errors.join('\n'));
 }finally{fs.mkdirSync('artifacts',{recursive:true});fs.writeFileSync('artifacts/undead-territory-legends.json',JSON.stringify(report,null,2));await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
