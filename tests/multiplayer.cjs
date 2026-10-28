const BASE_URL=process.env.ROADLORDS_TEST_URL||'http://127.0.0.1:4173/Roadlords/';
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{
  const b=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
  const context=await b.newContext({viewport:{width:1280,height:900}});await context.route('https://**/*',r=>r.abort());
  const host=await context.newPage(),guest=await context.newPage(),errors=[];for(const p of [host,guest])p.on('pageerror',e=>errors.push(e.message));
  try{
    for(const p of [host,guest]){await p.goto(BASE_URL,{waitUntil:'domcontentloaded'});await p.waitForFunction(()=>!!window.__ROADLORDS_ROAD__);}
    await host.evaluate(()=>{__ROADLORDS_ROAD__.startTest(42);__ROADLORDS_ROAD__.pause();});
    for(const [page,role] of [[host,'host'],[guest,'guest']])await page.evaluate(role=>{
      const Q=__ROADLORDS_ROAD__,R=__ROADLORDS__;window.packets=[];Q.MP.enabled=true;Q.MP.role=role;Q.MP.peer=true;Q.MP.started=true;Q.MP.guestChoicePending=false;
      R.state.running=false;R.state.modal=false;R.state.pregame=false;R.state.startChoices=0;
      Q.MP.conn={open:true,dataChannel:{bufferedAmount:0},send:data=>packets.push(JSON.parse(JSON.stringify(data)))};
    },role);
    async function transferSnapshot(){
      const packet=await host.evaluate(()=>{__ROADLORDS_ROAD__.sendSnapshot(true);return packets.filter(p=>p.type==='snapshot').at(-1);});
      await guest.evaluate(packet=>{__ROADLORDS_ROAD__.MP.pendingStrategy=null;__ROADLORDS_ROAD__.handle(packet);},packet);return packet;
    }
    const first=await transferSnapshot();assert.equal(first.units.length,1000);assert.equal(first.units[0].length,20);assert(Array.isArray(first.units[0][13]));assert.equal(typeof first.units[0][17],'object');
    console.log('PASS Authoritative snapshot serializes 1000 units with original status columns intact');
    const mirroring=await guest.evaluate(()=>{const R=__ROADLORDS__,u=R.state.units[0];return {n:R.state.units.length,L:R.PATH_LENGTH,lane:u.lane,offset:u.offset,side:u.side,races:[R.P.race,R.E.race]};});
    assert.equal(mirroring.n,1000);assert(Math.abs(mirroring.lane-(mirroring.L-first.units[0][3]))<.2);assert(Math.abs(mirroring.offset+first.units[0][4])<.2);assert.equal(mirroring.side,'enemy');console.log('PASS Guest applies real snapshot handler and mirrors both axes and ownership');
    await host.evaluate(()=>{const R=__ROADLORDS__,u=R.state.units[0],v=R.state.units.find(v=>v.side!==u.side);R.attackUnit(u,v);});
    const second=await transferSnapshot();const row=second.units.find(r=>r[18]);assert(row);
    const anim=await guest.evaluate(id=>__ROADLORDS__.state.units.find(u=>u.id===id)?.roadAttack,row[0]);
    assert(Array.isArray(row[18])&&anim&&Number.isFinite(anim.hit));assert(Math.abs(anim.lane-(mirroring.L-row[18][5]))<.2);assert.equal(anim.hit,row[18][2]);console.log('PASS Compact attack timing and projectile coordinates survive snapshot and mirroring');
    await host.evaluate(()=>__ROADLORDS_ROAD__.handle({type:'strategy',seq:999,data:{gateMode:'closed',race:__ROADLORDS__.E.race,unitColor:__ROADLORDS__.E.unitColor}}));
    assert.equal(await host.evaluate(()=>__ROADLORDS_ROAD__.MP.lastGuestSeq),999);console.log('PASS Existing host strategy handler accepts guest commands');
    assert.equal(errors.length,0);console.log('PASS No multiplayer protocol runtime errors');
    fs.writeFileSync('artifacts/multiplayer-results.json',JSON.stringify({status:'passed',checks:5,transport:'Two independent browser pages; JSON serialized packet transfer through the existing send/snapshot/handle functions. Transport is an explicit test harness, not a WebRTC connectivity test.',units:first.units.length,columns:first.units[0].length,errors},null,2));
  }finally{await b.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
