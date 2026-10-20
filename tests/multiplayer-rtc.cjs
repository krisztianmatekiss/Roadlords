const BASE_URL=process.env.ROADLORDS_TEST_URL||'http://127.0.0.1:4173/Roadlords/';
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{
  const b=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--disable-features=WebRtcHideLocalIpsWithMdns','--allow-loopback-in-peer-connection','--force-webrtc-ip-handling-policy=default']});
  const c=await b.newContext({viewport:{width:1280,height:900}});await c.route('https://**/*',r=>r.abort());
  const pages=[await c.newPage(),await c.newPage()],errors=[];for(const p of pages)p.on('pageerror',e=>errors.push(e.message));
  try{
    for(const p of pages){await p.goto(BASE_URL,{waitUntil:'domcontentloaded'});await p.waitForFunction(()=>!!window.__ROADLORDS_ROAD__);}
    await pages[0].evaluate(()=>{__ROADLORDS_ROAD__.startTest(42);__ROADLORDS_ROAD__.pause();});
    for(let i=0;i<2;i++)await pages[i].evaluate(role=>{
      const Q=__ROADLORDS_ROAD__,R=__ROADLORDS__,pc=new RTCPeerConnection({iceServers:[]});
      window.rtcTest={pc,received:[],sent:[]};Q.MP.enabled=true;Q.MP.role=role;Q.MP.room='LOCAL';Q.MP.started=true;R.state.startChoices=0;R.state.modal=false;R.state.pregame=false;R.state.running=false;
      const wrap=dc=>{
        const callbacks={},conn={peer:'local-'+role,connectionId:'local-test',dataChannel:dc,open:false,
          on:(event,fn)=>{(callbacks[event]||=[]).push(fn);return conn;},
          send:data=>{rtcTest.sent.push(data.type);dc.send(JSON.stringify(data));},close:()=>dc.close()};
        dc.onopen=()=>{conn.open=true;for(const fn of callbacks.open||[])fn();};
        dc.onmessage=e=>{const data=JSON.parse(e.data);rtcTest.received.push({type:data.type,rows:data.type==='snapshot'?data.units:null});for(const fn of callbacks.data||[])fn(data);};
        Q.attach(conn);rtcTest.conn=conn;
      };
      if(role==='host')wrap(pc.createDataChannel('roadlords',{ordered:true}));else pc.ondatachannel=e=>wrap(e.channel);
      rtcTest.gather=()=>new Promise(resolve=>{if(pc.iceGatheringState==='complete')return resolve();const fn=()=>{if(pc.iceGatheringState==='complete'){pc.removeEventListener('icegatheringstatechange',fn);resolve();}};pc.addEventListener('icegatheringstatechange',fn);});
    },i===0?'host':'guest');
    const offer=await pages[0].evaluate(async()=>{const p=rtcTest.pc;await p.setLocalDescription(await p.createOffer());await rtcTest.gather();return p.localDescription.toJSON();});
    console.log('ICE offer candidates',offer.sdp.split('\n').filter(l=>l.startsWith('a=candidate')).length);
    if(!offer.sdp.includes('a=candidate:')){const result={status:'blocked',reason:'Chromium provides zero local ICE candidates in this cloud machine; RTCDataChannel cannot establish a connection.',publicSignaling:'Not tested',checksPassed:0};fs.writeFileSync('artifacts/multiplayer-rtc-results.json',JSON.stringify(result,null,2));console.log('SKIP real WebRTC: no ICE candidates supplied by this machine');return;}
    const answer=await pages[1].evaluate(async offer=>{const p=rtcTest.pc;await p.setRemoteDescription(offer);await p.setLocalDescription(await p.createAnswer());await rtcTest.gather();return p.localDescription.toJSON();},offer);
    await pages[0].evaluate(a=>rtcTest.pc.setRemoteDescription(a),answer);
    await pages[1].waitForFunction(()=>rtcTest.conn?.open&&rtcTest.received.some(m=>m.type==='snapshot'),null,{timeout:15000}).catch(async e=>{for(const p of pages)console.log(await p.evaluate(()=>({pc:rtcTest.pc.connectionState,ice:rtcTest.pc.iceConnectionState,channel:rtcTest.conn?.dataChannel.readyState,open:rtcTest.conn?.open,received:rtcTest.received.map(m=>m.type),sent:rtcTest.sent,error:__ROADLORDS__.state.lastRuntimeErrorV4965})));throw e;});
    const snapshot=await pages[1].evaluate(()=>{const R=__ROADLORDS__,last=rtcTest.received.filter(m=>m.type==='snapshot').at(-1);return {count:R.state.units.length,races:[R.P.race,R.E.race],columns:last.rows[0].length,first:{side:R.state.units[0].side,lane:R.state.units[0].lane,offset:R.state.units[0].offset},time:R.state.time};});
    assert.equal(snapshot.count,1000);assert.equal(snapshot.columns,20);console.log('PASS Real local WebRTC channel transfers all 1000 units with original status columns and appended animations');
    const original=await pages[0].evaluate(()=>{const u=__ROADLORDS__.state.units[0];return {lane:u.lane,offset:u.offset,L:__ROADLORDS__.PATH_LENGTH};});
    assert(Math.abs(snapshot.first.lane-(original.L-original.lane))<.2);assert(Math.abs(snapshot.first.offset+original.offset)<.2);assert.equal(snapshot.first.side,'enemy');console.log('PASS Guest mirrors both road coordinates and ownership');
    await pages[0].evaluate(()=>{const R=__ROADLORDS__,Q=__ROADLORDS_ROAD__,u=R.state.units[0],v=R.state.units.find(v=>v.side!==u.side);R.attackUnit(u,v);Q.sendSnapshot(true);});
    await pages[1].waitForFunction(()=>__ROADLORDS__.state.units.some(u=>u.roadAttack));
    const anim=await pages[1].evaluate(()=>{const a=__ROADLORDS__.state.units.find(u=>u.roadAttack).roadAttack;return {valid:Number.isFinite(a.hit)&&Number.isFinite(a.to),curses:__ROADLORDS__.state.units.every(u=>!Array.isArray(u.orcCurses))};});assert(anim.valid&&anim.curses);console.log('PASS Attack timing survives snapshot serialization without corrupting orc curse data');
    await pages[1].evaluate(()=>rtcTest.conn.send({type:'speed_down_v4971',speed:.5}));
    // A supported strategy message must still reach the authority through the existing handler.
    await pages[1].evaluate(()=>{const Q=__ROADLORDS_ROAD__,R=__ROADLORDS__;rtcTest.conn.send({type:'strategy',seq:999,data:{gateMode:'closed',race:R.P.race,unitColor:R.P.unitColor}});});
    await pages[0].waitForFunction(()=>__ROADLORDS_ROAD__.MP.lastGuestSeq===999);
    console.log('PASS Guest strategy reaches authoritative host');
    assert.equal(errors.length,0);fs.writeFileSync('artifacts/multiplayer-rtc-results.json',JSON.stringify({checks:5,transport:'Two Chromium pages, real RTCPeerConnection and RTCDataChannel; local SDP exchange; existing game attach/send/handle/snapshot functions',snapshot,errors,limitation:'Public PeerJS signaling, remote STUN/TURN and cross-network connectivity were not tested.'},null,2));
  }finally{await b.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
