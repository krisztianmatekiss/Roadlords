const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox','--disable-dev-shm-usage']});
 const report={checks:[],errors:[]};
 try{
  const p=await browser.newPage();await p.route('https://**/*',r=>r.abort());p.on('pageerror',e=>report.errors.push(e.message));
  await p.goto(process.env.ROADLORDS_TEST_URL||'http://127.0.0.1:4173/Roadlords/');await p.waitForFunction(()=>window.__ROADLORDS_RUNTIME__?.aiCardReadiness);
  report.checks=await p.evaluate(()=>{
   const R=__ROADLORDS_RUNTIME__,checks=[],close=(a,b)=>Math.abs(a-b)<1e-7,check=(name,ok,details)=>checks.push({name,ok:!!ok,details});
   function reset(race='human',enemy='human'){
    R.MP.enabled=false;R.spectator.active=false;Object.assign(R.state,{running:false,units:[],time:240,startChoices:0,modal:false,pregame:false,ended:false});R.state.combatStep++;R.battleSearch=null;R.aiDecisionCache=null;
    Object.assign(R.ROAD,{test:false,paused:true,clock:20,pending:[],dead:[]});
    for(const [c,r]of [[R.P,race],[R.E,enemy]]){R.roadResetCity(c,r);c.terrain.fill(null);c.unlocked=new Set(R.aiFactionBuildings(c));c.resources=R.C(1e6,1e6,1e6);c.armyCap=c.garrisonCap=1000;}
    for(const t of [...R.towers,...R.capitalTowers]){t.alive=false;t.cooldown=0;t.guardCooldowns=[0,0,0];}R.roadRefreshFrontiers();return R.P;
   }
   function unit(c,key,lane=4000){const u=R.releaseUnit(c,R.makeEntry(c,key));u.lane=lane;u.offset=0;u.cooldown=99;R.roadReindex();return u;}
   function put(c,type,row=0,col=0){const placed=R.placeBuilding(c,type,row,col,0);if(!placed.ok)throw Error(type+': '+placed.reason);return placed.building;}
   function impact(){R.ROAD.clock=Math.max(...R.ROAD.pending.map(p=>p.a.hit))+.001;R.roadImpacts();}
   function tower(){const t=R.towers.find(t=>t.side==='player'&&!t.gateTower);t.alive=true;return t;}
   const random=Math.random;
   try{
    Math.random=()=>.99;
    let c=reset('orc'),legend=R.LEGENDARY.find(x=>x.id==='orc_warg_hunt');
    check('No new legendary: the existing Warg card is separate from the Hunting Lodge',R.LEGENDARY.filter(x=>x.race==='orc').length===24&&R.LEGENDARY.filter(x=>x.race==='undead').length===34&&R.LEGENDARY.filter(x=>!x.race||x.race==='human').length===55&&legend?.name==='Vérszomjas vadászat'&&!R.LEGENDARY.some(x=>x.id==='orc_hunt')&&R.BUILDINGS.orc_hunt.name==='Vadászház');
    const copy=R.upgradeCopyPreview(c,{...legend,kind:'legendary'}).description;
    check('Both the real legendary and its preview describe a Warg throw instead of food production',copy.includes('Warglovas')&&legend.description.includes('lándzs')&&!/élelem|termelés/.test(copy)&&R.PICK_UNIT_IMAGES.orc_warg_hunt==='orc_warg');
    for(const [hunt,rain,spear,expected]of [[true,false,false,60],[false,true,false,0],[true,true,false,120],[true,true,true,120]]){
     c=reset('orc');if(hunt)c.legends.add('orc_warg_hunt');if(rain){c.levels.orc_warg=4;c.l4Branches.orc_warg='spear_rain';}
     const u=unit(c,'orc_warg'),first=unit(R.E,'swordsman',4010),next=unit(R.E,'swordsman',4020);u.orcSpearReady=spear;first.hp=1;next.hp=next.maxHp=10000;
     R.attackUnit(u,first);impact();
     check(`Warg kill reaction: hunt=${hunt}, L4=${rain}, spear=${spear} gives one correct follow-up`,close(10000-next.hp,expected),{damage:10000-next.hp});
    }
    c=reset();let t=tower(),v=unit(R.E,'swordsman',t.lane+100);v.hp=v.maxHp=1000;R.updateTowers(0);let shot=R.ROAD.pending[0];
    check('A tower launches one visible shot without applying damage early',v.hp===1000&&R.ROAD.pending.length===1&&shot.towerShot&&[...R.roadFlyingShots()].some(p=>p===shot));
    R.ROAD.clock=shot.a.hit-.001;R.roadImpacts();check('A tower arrow cannot hit before its visual arrival',v.hp===1000);
    v.lane+=25;t.alive=false;impact();const hitHp=v.hp;R.roadImpacts();
    check('Launched arrows track movement, survive tower destruction, hit once and release their reservation',close(hitHp,904)&&v.hp===hitHp&&shot.a.to===v.lane&&!v.roadIncomingDamage);
    c=reset();t=tower();v=unit(R.E,'swordsman',t.lane+100);v.hp=v.maxHp=1000;v.shield=50;R.updateTowers(0);impact();check('Tower impact consumes shields before HP',v.shield===0&&v.hp===954);
    c=reset();t=tower();v=unit(R.E,'knight',t.lane+100);R.E.levels.stable=4;R.E.l4Branches.stable='armored_knights';v.hp=v.maxHp=1000;R.updateTowers(0);impact();check('Tower arrows preserve physical armour mitigation',v.hp===952);
    c=reset('human','undead');t=tower();v=unit(R.E,'und_skeleton',t.lane+100);v.hp=v.maxHp=1000;R.updateTowers(0);impact();check('Skeleton ranged resistance applies to real tower projectiles',v.hp===928);
    c=reset('human','undead');t=tower();v=unit(R.E,'und_ghost',t.lane+100);const hp=v.hp;Math.random=()=>0;R.updateTowers(0);impact();Math.random=()=>.99;check('Tower impacts remain dodgeable',v.hp===hp&&v.orcLastEvaded);
    c=reset('human','undead');R.E.legends.add('und_first_guard');t=tower();v=unit(R.E,'und_skeleton',t.lane+100);v.hp=v.maxHp=1000;R.updateTowers(0);impact();check('The first-attack ward is consumed at impact and prevents damage',v.hp===1000&&v.undFirstGuardUsed);
    c=reset();t=tower();v=unit(R.E,'swordsman',t.lane+100);R.updateTowers(0);R.killUnit(v,false);impact();check('An arrow whose target dies leaves no stale reservation or queued damage',R.ROAD.pending.length===0&&!v.roadIncomingDamage);
    c=reset();t=tower();v=unit(R.E,'swordsman',t.lane+100);v.hp=50;const other=R.towers.find(x=>x.side==='player'&&x.gateTower);other.alive=true;other.lane=t.lane;R.updateTowers(0);check('Different towers share the lethal incoming-damage budget',R.ROAD.pending.length===1);
    c=reset();t=tower();put(c,'archery');c.normal.tower_crews=1;c.normal.tower_guard=1;v=unit(R.E,'swordsman',t.lane+100);v.hp=v.maxHp=1000;R.updateTowers(0);const guardDamage=R.towerStatsV496(t).damage+R.statsFor(c,{key:'archer'}).dmg;
    check('Tower guards also queue their arrows without early damage',R.ROAD.pending.length===2&&v.hp===1000);impact();check('Guard and main arrows each deal their own damage exactly once',close(1000-v.hp,guardDamage));
    c=reset();t=tower();put(c,'archery');c.normal.tower_crews=1;c.normal.tower_guard=3;v=unit(R.E,'swordsman',t.lane+100);v.hp=R.towerStatsV496(t).damage+.1;R.updateTowers(0);
    check('Guards hold unused shots when already launched arrows cover the target',R.ROAD.pending.length===2&&t.guardCooldowns[0]>0&&t.guardCooldowns[1]===0&&t.guardCooldowns[2]===0);
    c=reset();t=tower();c.legends.add('tower_salvo');v=unit(R.E,'swordsman',t.lane+100);const second=unit(R.E,'swordsman',t.lane+110);v.hp=v.maxHp=second.hp=second.maxHp=1000;R.updateTowers(0);impact();check('Tower Salvo retains two full-damage projectiles',v.hp===904&&second.hp===904);
    c=reset();R.state.time=R.ROAD.clock;t=tower();v=unit(R.E,'swordsman',t.lane+100);R.updateTowers(0);let packet;R.MP.enabled=true;R.MP.role='host';R.MP.peer=true;R.MP.conn={open:true,send:p=>{if(p.type==='snapshot')packet=p;}};R.mpSendSnapshot(true);R.MP.enabled=false;window.__repairTowerPacket=packet;
    check('The real multiplayer packet includes tower arrows without adding an actor',packet.flyingShots.length===1&&packet.flyingShots[0].key==='tower_arrow'&&packet.units.length===1);
    const mirrored=R.mpMirrorUnit(packet.flyingShots[0]);check('Guest visual coordinates mirror both ends of a tower arrow',mirrored.roadAttack.lane===R.PATH_LENGTH-packet.flyingShots[0].roadAttack.lane&&mirrored.roadAttack.to===R.PATH_LENGTH-packet.flyingShots[0].roadAttack.to);
    const oldHp=v.hp,oldPending=R.ROAD.pending.length;R.MP.enabled=true;R.MP.role='guest';R.updateTowers(1);impact();R.MP.enabled=false;check('Guests cannot launch or resolve extra tower damage',v.hp===oldHp&&oldPending===1);
    c=reset('orc');put(c,'orc_bers',0,0);put(c,'orc_war',2,0);const candidate={...R.LEGENDARY.find(x=>x.id==='orc_bers_blood'),kind:'legendary'};
    const baseQuality=R.aiUnitQuality(c,'orc_berserker');c.legends.add(candidate.id);const noSource=R.aiUnitQuality(c,'orc_berserker');c.legends.delete(candidate.id);const unreadyScore=R.scoreAiChoice(candidate,c),future=R.aiCardReadiness(c,candidate);
    c.normal.orc_bleed=1;const readyScore=R.scoreAiChoice(candidate,c);c.legends.add(candidate.id);
    check('Bleed-dependent damage is not credited before a real bleed source exists',close(baseQuality,noSource)&&R.aiUnitQuality(c,'orc_berserker')>noSource);
    check('The actual pick evaluator values a supported bleed combo above a merely possible one',future>0&&future<1&&R.aiCardReadiness(c,candidate)===1&&readyScore>unreadyScore,{readyScore,unreadyScore});
    c=reset('undead');put(c,'und_vampire_castle');const q=R.aiUnitQuality(c,'und_vampire');c.legends.add('und_fast_poison');check('An unrelated poison legendary does not inflate a Vampire army without poison',close(q,R.aiUnitQuality(c,'und_vampire')));
    const plague=put(c,'und_plague_chamber',3,0);check('A functioning Plague Chamber makes a poison legendary useful to that same army',R.aiUnitQuality(c,'und_vampire')>q);plague.inactive=true;check('Inactive support is not counted as a functioning effect source',close(q,R.aiUnitQuality(c,'und_vampire')));
    c=reset('orc');const qualities=[];for(const [hunt,rain]of [[false,false],[true,false],[false,true],[true,true]]){c.legends=new Set(hunt?['orc_warg_hunt']:[]);c.levels.orc_warg=rain?4:1;c.l4Branches.orc_warg=rain?'spear_rain':null;qualities.push(R.aiUnitQuality(c,'orc_warg'));}
    check('AI values the two useful Warg paths and their marginal combination',qualities[1]>qualities[0]&&qualities[2]>qualities[0]&&qualities[3]>Math.max(qualities[1],qualities[2]),qualities);
   }finally{Math.random=random;R.MP.enabled=false;}
   return checks;
  });
  const visual=await p.evaluate(async()=>{const R=__ROADLORDS_RUNTIME__;R.renderChoice([{...R.LEGENDARY.find(x=>x.id==='orc_warg_hunt'),kind:'legendary'}],'PRÓBA','Próba','',false);const card=R.$('#choiceList .choice'),image=card.querySelector('.cardFrameImage');await image.decode();return {art:image.getAttribute('src'),text:card.querySelector('.choiceBody').textContent};});
  report.checks.push({name:'The actual Warg pick decodes its original legendary artwork and shows only its own effect',ok:visual.art.endsWith('/cards/orc/upgrades/orc_hunt.webp')&&visual.text.includes('Warglovas')&&!/élelem|termelés/.test(visual.text),details:visual});
  const packet=await p.evaluate(()=>window.__repairTowerPacket),guest=await browser.newPage();guest.on('pageerror',e=>report.errors.push(e.message));await guest.route('https://**/*',r=>r.abort());await guest.goto(process.env.ROADLORDS_TEST_URL||'http://127.0.0.1:4173/Roadlords/');await guest.waitForFunction(()=>window.__ROADLORDS_RUNTIME__);
  const guestResult=await guest.evaluate(packet=>{const R=__ROADLORDS_RUNTIME__;R.state.running=false;R.MP.enabled=true;R.MP.role='guest';R.MP.started=true;R.mpHandle(packet);R.roadDrawShots();const shots=[...R.roadFlyingShots()].filter(p=>p.u.key==='tower_arrow');return {actors:R.state.units.length,shots:shots.length,originHeight:shots[0]?.a.originHeight,beforeHit:R.ROAD.clock<shots[0]?.a.hit};},packet);
  report.checks.push({name:'A real guest snapshot renders the airborne tower arrow without creating a fake soldier',ok:guestResult.actors===1&&guestResult.shots===1&&guestResult.originHeight===42&&guestResult.beforeHit,details:guestResult});
  for(const c of report.checks){console.log(c.ok?'PASS':'FAIL',c.name);if(!c.ok)console.log(JSON.stringify(c.details));}
  assert(report.checks.every(c=>c.ok),'Combat repair checks failed');assert.equal(report.errors.length,0,'No runtime errors');
 }finally{fs.mkdirSync('artifacts',{recursive:true});fs.writeFileSync('artifacts/combat-repairs.json',JSON.stringify(report,null,2));await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
