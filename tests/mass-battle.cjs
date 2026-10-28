const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
const URL=process.env.ROADLORDS_TEST_URL||'http://127.0.0.1:4173/Roadlords/';
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox','--disable-dev-shm-usage']});
 const report={checks:[],errors:[]};
 try{
  const context=await browser.newContext({viewport:{width:1600,height:1000}});await context.route('https://**/*',r=>r.abort());const p=await context.newPage();p.on('pageerror',e=>report.errors.push(e.message));await p.goto(URL);await p.waitForFunction(()=>!!window.__ROADLORDS_RUNTIME__);
  report.cases=await p.evaluate(()=>{
   const R=__ROADLORDS_RUNTIME__,Q=R.ROAD,out=[],check=(name,ok,details)=>out.push({name,ok:!!ok,details});
   function reset(player='orc',enemy='human'){
    R.MP.enabled=false;R.state.running=false;R.state.modal=false;R.state.pregame=false;R.state.units=[];Q.pending=[];Q.dead=[];Q.test=false;Q.paused=true;Q.clock=100;R.battleSearch=null;
    for(const [c,race]of [[R.P,player],[R.E,enemy]]){R.roadResetCity(c,race);c.normal={};c.legends=new Set();c.legendaryStacks={};c.levels={};c.l4Branches={};c.releaseQueue=[];c.garrison=[];c.rallyReserve=[];c.armyCap=10000;c.garrisonCap=30;c.resources=R.C(1e6,1e6,1e6);c.gateMode='open';}
    for(const t of R.towers)t.alive=false;R.roadRefreshFrontiers();
   }
   function unit(c,key,lane,offset=0){const u=R.releaseUnit(c,R.makeEntry(c,key));if(!u)throw Error('Unexpected spawn rejection: '+key);u.lane=lane;u.offset=u.roadHomeOffset=offset;u.cooldown=0;return u;}
   reset();const foes=[];for(let i=0;i<36;i++){const v=unit(R.E,i<6?'knight':'swordsman',4650+(i<6?0:40),(i%6-2.5)*12);v.hp=v.maxHp=25;v.shield=v.tempShield=0;foes.push(v);}
   const goblins=[];for(let i=0;i<120;i++)goblins.push(unit(R.P,'orc_goblin',4500,(i%6-2.5)*12));R.roadReindex();
   for(const u of goblins){const v=R.preferredTarget(u,foes);if(v)R.attackUnit(u,v);}
   const distribution=foes.map(v=>Q.pending.filter(p=>p.t===v).length);
   check('120 Goblins distribute their first volley beyond six approaching Knights',distribution.filter(n=>n>0).length>6&&Math.max(...distribution)<=8,distribution);
   check('Selection does not consume opening hits, create marks or damage targets',goblins.every(u=>!u.attackCount)&&foes.every(v=>v.hp===25&&!v.rangedMarkTime));
   const pending=Q.pending[0],before=pending.t.roadIncomingDamage;Q.clock=pending.a.launch-.01;R.killUnit(pending.u,false);R.roadImpacts();
   check('A cancelled windup releases its target damage reservation',pending.t.roadIncomingDamage<before&&pending.reserved===0);
   reset();for(let i=0;i<6;i++){const v=unit(R.E,'knight',4650,(i-2.5)*12);v.hp=v.maxHp=25;v.shield=v.tempShield=0;v.stunTime=100;}
   for(let i=0;i<120;i++)unit(R.P,'orc_goblin',4500,(i%6-2.5)*12);R.updateBattle(1/30);
   check('With only six targets, excess shooters hold fire without consuming their cooldown',Q.pending.length<=48&&Q.pending.length>0&&R.state.units.some(u=>u.side==='player'&&u.roadHoldFire&&u.cooldown===0),Q.pending.length);
   reset();R.E.levels.stable=4;R.E.l4Branches.stable='armored_knights';const armored=unit(R.E,'knight',4650);armored.hp=20;armored.shield=100;
   for(let i=0;i<20;i++)unit(R.P,'orc_goblin',4500);R.roadReindex();for(const u of R.state.units.filter(u=>u.side==='player'))R.attackUnit(u,armored);
   check('Reservations include shields and physical armour rather than treating them as missing HP',armored.roadIncomingDamage===35&&!R.roadTargetCovered(R.state.units.at(-1),armored),armored.roadIncomingDamage);
   for(const [race,key]of [['human','archer'],['human','mage'],['orc','orc_goblin'],['orc','orc_warg'],['undead','und_skeleton_archer']]){
    reset(race);const u=unit(R.P,key,4500),v=unit(R.E,'swordsman',4650);v.hp=v.maxHp=10000;v.shield=v.tempShield=0;R.roadReindex();R.attackUnit(u,v);const a=u.roadAttack;
    Q.clock=a.launch+.001;R.killUnit(u,false);R.state.units=R.state.units.filter(u=>u.alive);R.roadImpacts();const flying=[...R.roadFlyingShots()].some(p=>p.u===u&&p.a===a);
    Q.clock=a.hit-.001;R.roadImpacts();const early=v.hp===10000;Q.clock=a.hit+.001;R.roadImpacts();const hp=v.hp;R.roadImpacts();
    check(key+': launched projectile survives shooter death and hits once at impact',flying&&early&&hp<10000&&v.hp===hp&&!u.alive&&!R.state.units.includes(u)&&v.roadIncomingDamage<1e-8,{hp,early,flying});
   }
   reset('human');const sword=unit(R.P,'swordsman',4500),victim=unit(R.E,'swordsman',4525);R.attackUnit(sword,victim);R.killUnit(sword,false);Q.clock=sword.roadAttack.hit+.01;R.roadImpacts();check('A dead melee attacker does not gain a posthumous strike',victim.hp===victim.maxHp);
   reset('undead');const lich=unit(R.P,'und_lich',4320),linked=unit(R.E,'swordsman',4500,-150),fresh=unit(R.E,'swordsman',4800);
   for(const v of [linked,fresh]){v.hp=v.maxHp=1e8;v.cooldown=999;v.stunTime=100;}
   lich.undBeams=[{id:linked.id,age:0}];lich.roadSeek=linked;lich.roadSeekAt=Q.clock+100;
   for(let i=0;i<150;i++){const n=unit(R.P,'und_necromancer',4340+(i%10)*13,(Math.floor(i/10)-7)*18);n.stunTime=100;n.cooldown=999;}
   const start=lich.lane;for(let i=0;i<300;i++)R.updateBattle(1/30);
   check('Lich walks through 150 friendly Necromancers and connects to a fresh enemy',lich.lane>start+100&&(lich.undBeams||[]).some(b=>b.id===fresh.id),{advance:lich.lane-start,beams:lich.undBeams});
   reset('undead');const mover=unit(R.P,'und_lich',4500);for(let i=0;i<400;i++){const n=unit(R.P,'und_necromancer',4505+(i%10)*12,(Math.floor(i/10)-20)*8);n.stunTime=100;}
   R.roadReindex();const oldVisit=R.roadVisit;let friendlyVisits=0;R.roadVisit=(u,range,fn,...args)=>oldVisit(u,range,v=>{if(v.side===u.side)friendlyVisits++;fn(v)},...args);R.roadSeparate();R.roadVisit=oldVisit;
   const from=mover.lane;for(let i=0;i<60;i++){R.roadReindex();R.roadAdvance(mover,[],1/30);}
   check('Friendly bodies are never processed as collision pairs, even in a dense mass',friendlyVisits===0&&mover.lane-from>mover.speed*2*.9,{friendlyVisits,advance:mover.lane-from});
   for(const race of ['human','orc','undead']){
    reset(race);const key={human:'swordsman',orc:'orc_goblin',undead:'und_skeleton'}[race];for(let i=0;i<750;i++)unit(R.P,key,1000+i*.1);const price={...R.P.resources};
    const type={human:'barracks',orc:'orc_gob',undead:'und_graveyard'}[race],b={id:'cap-spawner',type,level:1,row:0,col:0,rotation:0,progress:1};R.P.buildings.push(b);
    R.P.releaseQueue.push(R.makeEntry(R.P,key));R.releaseQueues(1);
    const rejected=!R.releaseUnit(R.P,R.makeEntry(R.P,key))&&!R.normalSpawn(R.P,b);
    check(race+': 750 actors stop recruitment and gate release without spending or losing queued units',rejected&&R.battlePopulation(R.P)===750&&R.P.releaseQueue.length===1&&R.RES.every(k=>price[k]===R.P.resources[k]));
    R.killUnit(R.state.units.find(u=>u.side==='player'),false);R.releaseQueues(1);
    check(race+': one casualty opens exactly one actor slot and resumes the existing queue',R.battlePopulation(R.P)===750&&R.P.releaseQueue.length===0);
   }
   reset('undead');for(let i=0;i<750;i++)unit(R.P,'und_skeleton',1000);check('Summons and converted troops cannot bypass the global actor ceiling',!R.undSpawn(R.P,'und_ghost',1000,0,{undNoArmySlot:true,undSummoned:true})&&!R.undSpawn(R.P,'swordsman',1000,0,{undConverted:true}));
   reset('undead');R.P.levels.und_graveyard=4;R.P.l4Branches.und_graveyard='double_summon';R.P.legends.add('und_twin_training');for(let i=0;i<748;i++)unit(R.P,'und_skeleton',1000);
   const double={id:'double-at-cap',type:'und_graveyard',level:4,row:0,col:0,rotation:0};R.P.buildings.push(double);const random=Math.random;let recruited;try{Math.random=()=>0;recruited=R.normalSpawn(R.P,double);}finally{Math.random=random;}
   check('Free copies cannot take the last slots reserved for a paid two-unit batch',recruited&&R.P.releaseQueue.length===2&&R.P.undeadState.freeQueue.length===2,{queued:R.P.releaseQueue.length,free:R.P.undeadState.freeQueue.length});
   reset('orc');R.P.levels.orc_gob=4;R.P.l4Branches.orc_gob='swarm';for(let i=0;i<750;i++)unit(R.P,'orc_goblin',1000);check('Half-slot Goblins retain their army weight but cannot exceed 750 actors',R.fieldUnitCount(R.P)===375&&!R.releaseUnit(R.P,R.makeEntry(R.P,'orc_goblin')));
   reset('orc');for(let i=0;i<747;i++)unit(R.P,'orc_warrior',1000);const carrier=R.makeEntry(R.P,'orc_ram');carrier.orcCargo=[R.makeEntry(R.P,'orc_warrior'),R.makeEntry(R.P,'orc_warrior')];const ram=R.releaseUnit(R.P,carrier);
   check('A transport reserves actor slots for its passengers before deployment',ram&&R.battlePopulation(R.P)===750&&!R.releaseUnit(R.P,R.makeEntry(R.P,'orc_goblin')));
   R.killUnit(ram,true);check('Transport passengers disembark without exceeding the actor ceiling',R.battlePopulation(R.P)===749&&R.state.units.filter(u=>u.alive&&u.id>ram.id&&u.key==='orc_warrior').length===2,R.battlePopulation(R.P));
   reset('undead');Q.test=true;for(let i=0;i<1000;i++)unit(R.P,'und_skeleton',1000);check('Diagnostic stress fixtures can still measure loads beyond the normal game limit',R.battlePopulation(R.P)===1000);
   return out;
  });
  for(const c of report.cases){if(!c.ok)console.error(JSON.stringify(c));assert(c.ok,c.name);report.checks.push(c.name);console.log('PASS',c.name);}
  // Real snapshot transport of a shot whose shooter is no longer in units[].
  const packet=await p.evaluate(()=>{const R=__ROADLORDS_RUNTIME__,Q=R.ROAD;R.MP.enabled=false;Q.test=false;R.state.units=[];Q.pending=[];R.roadResetCity(R.P,'human');R.roadResetCity(R.E,'orc');R.P.legends=new Set();R.E.legends=new Set();Q.clock=R.state.time=10;const u=R.releaseUnit(R.P,{key:'archer'}),v=R.releaseUnit(R.E,{key:'orc_warrior'});u.lane=4500;v.lane=4700;u.offset=v.offset=0;R.attackUnit(u,v);Q.clock=R.state.time=u.roadAttack.launch+.02;R.killUnit(u,false);R.state.units=R.state.units.filter(u=>u.alive);R.MP.role='host';R.MP.enabled=true;R.MP.peer=true;R.MP.started=true;let packet;R.MP.conn={open:true,dataChannel:{bufferedAmount:0},send:data=>{if(data.type==='snapshot')packet=JSON.parse(JSON.stringify(data));}};R.mpSendSnapshot(true);return packet;});
  const guest=await context.newPage();guest.on('pageerror',e=>report.errors.push(e.message));await guest.goto(URL);await guest.waitForFunction(()=>!!window.__ROADLORDS_RUNTIME__);
  const mirrored=await guest.evaluate(packet=>{const R=__ROADLORDS_RUNTIME__;R.state.running=false;R.MP.enabled=true;R.MP.role='guest';R.MP.started=true;R.mpHandle(packet);const u=R.ROAD.remoteShots[0];return {count:R.ROAD.remoteShots.length,lane:u?.roadAttack.lane,expected:R.PATH_LENGTH-packet.flyingShots[0].roadAttack.lane,actors:R.state.units.length};},packet);
  assert(mirrored.count===1&&mirrored.lane===mirrored.expected&&mirrored.actors===1);report.checks.push('Multiplayer mirrors the orphan projectile without resurrecting its shooter');console.log('PASS',report.checks.at(-1));assert.equal(report.errors.length,0);
  const packets=await p.evaluate(()=>{
   const R=__ROADLORDS_RUNTIME__,Q=R.ROAD,u=R.releaseUnit(R.P,{key:'archer'}),packets=[];u.lane=4500;u.offset=0;u.orcPositive={power:2};u.roadAttack={...Q.pending[0].a,end:Q.clock+.5,archerFace:1};R.MP.conn.send=data=>{if(data.type==='snapshot')packets.push(JSON.parse(JSON.stringify(data)));};R.mpSendSnapshot(true);
   u.orcPositive={};u.roadAttack.end=u.roadAttack.hit=Q.clock-1;R.mpSendSnapshot(true);return {packets,id:u.id};
  });
  const compact=await guest.evaluate(({packets,id})=>{const R=__ROADLORDS_RUNTIME__;R.mpHandle(packets[0]);let u=R.state.units.find(u=>u.id===id);const first=u.orcPositive.power===2&&u.roadAttack.archerFace===-1&&Number.isFinite(u.roadAttack.launch);R.mpHandle(packets[1]);u=R.state.units.find(u=>u.id===id);return first&&!Object.keys(u.orcPositive).length&&!u.roadAttack;},packets);
  const row=packets.packets[0].units.find(row=>row[0]===packets.id),expired=packets.packets[1].units.find(row=>row[0]===packets.id);
  assert(compact&&Array.isArray(row[18])&&expired[17]===null&&expired[18]===null);report.checks.push('Compact attacks preserve mirrored timing and clear expired animations and status metadata');console.log('PASS',report.checks.at(-1));
  assert.equal(report.errors.length,0);
 }finally{fs.mkdirSync('artifacts',{recursive:true});fs.writeFileSync('artifacts/mass-battle-tests.json',JSON.stringify(report,null,2));await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
