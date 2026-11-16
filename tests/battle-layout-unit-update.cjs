const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox','--disable-dev-shm-usage']}),report={checks:[],errors:[]};
 const check=(name,ok,data)=>{assert(ok,name+' '+JSON.stringify(data||''));report.checks.push(name);console.log('PASS',name);};
 try{
  const p=await browser.newPage({viewport:{width:1920,height:1080}});await p.route('https://**/*',r=>r.abort());p.on('pageerror',e=>report.errors.push(e.message));
  await p.goto(process.env.ROADLORDS_TEST_URL||'http://127.0.0.1:4173/Roadlords/');await p.waitForFunction(()=>window.__ROADLORDS_RUNTIME__?.upgradeCatalog);
  const result=await p.evaluate(()=>{
   const R=__ROADLORDS_RUNTIME__,out={},random=Math.random;
   const reset=race=>{
    R.MP.enabled=false;R.spectator.active=false;Object.assign(R.state,{units:[],running:false,modal:false,pregame:false,ended:false,startChoices:0,time:0});
    Object.assign(R.ROAD,{pending:[],clock:0,test:false,paused:true});
    for(const [c,r]of [[R.P,race],[R.E,'human']]){R.roadResetCity(c,r);c.terrain.fill(null);c.resources=R.C(1e6,1e6,1e6);c.armyCap=c.garrisonCap=1000;}
    for(const t of [...R.towers,...R.capitalTowers])t.alive=false;
    R.roadReindex();
   };
   const unit=(c,key,lane=4000)=>{const u=R.releaseUnit(c,{key});u.lane=lane;u.offset=0;u.cooldown=99;R.roadReindex();return u;};
   const impact=()=>{R.ROAD.clock=Math.max(...R.ROAD.pending.map(p=>p.a.hit))+.001;R.roadImpacts();};
   try{
    Math.random=()=>.99;reset('human');out.base={knight:R.statsFor(R.P,{key:'knight'}).dmg,skeleton:R.UNITS.und_skeleton_archer.damage,range:R.UNITS.und_skeleton_archer.range};
    out.cadences=[];
    for(const all of [false,true]){
     reset('orc');if(all)R.P.legends.add('orc_warg_all_spears');const w=unit(R.P,'orc_warg'),t=unit(R.E,'swordsman',4010);t.hp=t.maxHp=100000;const shots=[];
     for(let i=0;i<12;i++){const before=t.hp;R.attackUnit(w,t);const a=w.roadAttack;shots.push({spear:a.orcSpear,early:t.hp===before,count:w.orcWargAttackCount});impact();shots.at(-1).damage=before-t.hp;R.roadImpacts();shots.at(-1).once=t.hp===before-shots.at(-1).damage;}
     out.cadences.push(shots);
    }
    reset('orc');R.P.legends.add('orc_warg_all_spears');let w=unit(R.P,'orc_warg'),t=unit(R.E,'swordsman',4150);w.cooldown=0;R.orcBeforeCombat13(w,[t]);const first=w.roadAttack?.orcSpear;impact();w.cooldown=0;R.orcBeforeCombat13(w,[t]);out.range=first&&w.roadAttack?.orcSpear&&w.orcWargAttackCount===2;impact();
    // Free hunt attacks retain their own effect and do not consume the next regular attack.
    reset('orc');R.P.legends.add('orc_warg_hunt');w=unit(R.P,'orc_warg');t=unit(R.E,'swordsman',4010);t.hp=1;const next=unit(R.E,'swordsman',4020);next.hp=next.maxHp=10000;R.attackUnit(w,t);impact();out.hunt={count:w.orcWargAttackCount,damage:10000-next.hp};
    reset('orc');w=unit(R.P,'orc_warg');const tower=R.towers.find(t=>t.side==='enemy');tower.alive=true;w.lane=tower.lane-10;w.offset=tower.lateral||0;R.roadReindex();const hp=tower.hp;R.attackStructure(w,tower);out.structure={count:w.orcWargAttackCount,spear:w.roadAttack?.orcSpear,early:tower.hp===hp};impact();out.structure.damage=hp-tower.hp;
    out.summons=[];
    for(const quick of [false,true]){
     reset('undead');if(quick)R.P.legends.add('necro_leg_quickening');const n=unit(R.P,'und_necromancer');n.undSummonClock=(quick?10:20)-.01;
     R.updateBattle(.009);const before=R.state.units.filter(u=>u.undSummoned).length;R.updateBattle(.002);const spawned=R.state.units.filter(u=>u.undSummoned);
     out.summons.push({before,count:spawned.length,lifetime:spawned.every(u=>u.temporary===10&&u.undNoArmySlot)});
    }
    out.unlocks=[];
    for(const [race,type,id]of [['orc','orc_warg','orc_warg_all_spears'],['undead','und_necro_spawner','necro_leg_quickening']]){
     reset(race);R.P.unlocked.add(type);R.placeBuilding(R.P,type,0,0,0);const available=()=>R.eligibleLegendary(R.P).some(o=>o.id===id);
     R.setBuildingLevel(R.P,type,3);const before=available();R.setBuildingLevel(R.P,type,4);out.unlocks.push({before,after:available()});
    }
    reset('orc');R.P.legends.add('orc_warg_all_spears');w=unit(R.P,'orc_warg');t=unit(R.E,'swordsman',4150);R.attackUnit(w,t);let packet;R.MP.enabled=true;R.MP.role='host';R.MP.peer=true;R.MP.conn={open:true,send:p=>{if(p.type==='snapshot')packet=p;}};R.mpSendSnapshot(true);R.MP.enabled=false;out.packet=packet;
   }finally{Math.random=random;R.MP.enabled=false;}
   return out;
  });report.logic=result;
  check('Knight damage is 24; Skeleton Archer deals 4 at unchanged 26 metres',result.base.knight===24&&result.base.skeleton===4&&result.base.range===260,result.base);
  check('Warg throws on attacks 1, 4, 8 and 12, with no early or repeated impact',result.cadences[0].every((s,i)=>s.spear===[0,3,7,11].includes(i)&&s.count===i+1&&s.early&&s.once&&s.damage===(s.spear?60:30)),result.cadences[0]);
  check('The legendary makes every attack a throw and reacquires distant targets',result.range&&result.cadences[1].every(s=>s.spear&&s.damage===60&&s.early&&s.once),result.cadences[1]);
  check('Free hunt reactions preserve damage and do not advance regular cadence',result.hunt.count===1&&result.hunt.damage===60,result.hunt);
  check('Building attacks share the cadence and wait for their actual impact',result.structure.count===1&&result.structure.spear&&result.structure.early&&result.structure.damage>0,result.structure);
  check('Necromancer summons after exactly 20 / 10 seconds without changing count, lifetime or army slots',result.summons.every(s=>s.before===0&&s.count===3&&s.lifetime),result.summons);
  check('Both unit legends unlock only at the corresponding producer L4',result.unlocks.every(u=>!u.before&&u.after),result.unlocks);
  const guest=await browser.newPage();await guest.route('https://**/*',r=>r.abort());guest.on('pageerror',e=>report.errors.push(e.message));await guest.goto(process.env.ROADLORDS_TEST_URL||'http://127.0.0.1:4173/Roadlords/');await guest.waitForFunction(()=>window.__ROADLORDS_RUNTIME__);
  const mirror=await guest.evaluate(packet=>{const R=__ROADLORDS_RUNTIME__;R.state.running=false;R.MP.enabled=true;R.MP.role='guest';R.MP.started=true;R.mpHandle(packet);const w=R.state.units.find(u=>u.key==='orc_warg');return{count:w?.orcWargAttackCount,spear:w?.roadAttack?.orcSpear,lane:w?.lane,legend:R.hasLeg(R.E,'orc_warg_all_spears'),length:R.PATH_LENGTH};},result.packet);
  check('Actual guest snapshot preserves the relic, cadence counter and mirrored throw',mirror.count===1&&mirror.spear&&mirror.legend&&mirror.lane===mirror.length-4000,mirror);await guest.close();
  await p.evaluate(async()=>{const R=__ROADLORDS_RUNTIME__;R.MP.enabled=false;R.MP.lobby.style.display='none';document.body.classList.remove('roadlords-menu-open');await R.loadChronicleArt(['human','orc','undead']);R.state.units=[];});
  for(const race of ['human','orc','undead'])for(const size of [{width:1920,height:1080},{width:1267,height:587}]){
   await p.setViewportSize(size);await p.evaluate(race=>{const R=__ROADLORDS_RUNTIME__;R.roadResetCity(R.P,race);R.roadResetCity(R.E,race);R.P.gateMode=R.E.gateMode='closed';R.renderStatic();R.updateHud();R.roadResize();},race);await p.waitForTimeout(250);
   const gates=await p.evaluate(()=>[...document.querySelectorAll('.cityframe')].map(frame=>{const wall=frame.querySelector('.chronicleWalls'),door=frame.querySelector(':scope > .chronicleDoor');return{side:wall.dataset.side,view:door.getAttribute('viewBox'),same:['a','b','c','d','e','f'].every(k=>Math.abs(wall.getScreenCTM()[k]-door.getScreenCTM()[k])<.01),closed:frame.dataset.gateOpen==='false',leaf:getComputedStyle(door.querySelector('.chronicleGateLeaf')).transform};}));
   check(`${race} gates share the wall's exact screen transform at ${size.width}`,gates.length===2&&gates.every(g=>g.same&&g.closed&&g.view==='0 0 1000 1000'&&g.leaf==='none'),gates);
   if(size.width===1920)await p.screenshot({path:`artifacts/unit-update-${race}-closed.png`});
   const opened=await p.evaluate(()=>{const R=__ROADLORDS_RUNTIME__;R.P.gateMode=R.E.gateMode='auto';R.P.autoReleasing=R.E.autoReleasing=true;R.updateHud();return [...document.querySelectorAll('.cityframe')].every(f=>f.dataset.gateOpen==='true');});check(`${race} automatic doors follow actual release state at ${size.width}`,opened);
  }
  check('No gameplay or gate runtime errors',report.errors.length===0,report.errors);
 }finally{fs.mkdirSync('artifacts',{recursive:true});fs.writeFileSync('artifacts/unit-update-483.json',JSON.stringify(report,null,2));await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
