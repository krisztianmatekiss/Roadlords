const{chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox','--disable-dev-shm-usage']});try{
 const page=await browser.newPage({viewport:{width:1600,height:1000}});await page.route('https://**/*',r=>r.abort());await page.goto(process.env.ROADLORDS_TEST_URL||'http://127.0.0.1:4173/Roadlords/');
 const result=await page.evaluate(async()=>{const R=__ROADLORDS_RUNTIME__;await Promise.all([R.loadOrcRaidersArt(),R.loadOrcMysticsArt()]);R.roadStartTest(42,{count:10,roster:'orc-raiders'});R.roadPause();const Q=R.ROAD;Q.figureStyle='painted';Q.lowDetail=false;
  const result=[],gallery=document.createElement('canvas');gallery.width=1600;gallery.height=1030;const g=gallery.getContext('2d');g.fillStyle='#15271e';g.fillRect(0,0,1600,1030);g.fillStyle='#f3dfad';g.font='bold 25px Georgia';g.fillText('Goblin, Dühöngő és Troll – tényleges járásképek',30,38);
  for(const [row,key]of ['orc_goblin','orc_berserker','orc_troll'].entries()){
   Q.testRoster=key==='orc_troll'?'orc-mystics':'orc-raiders';const u=R.releaseUnit(R.P,{key}),frames=[];
   for(let frame=0;frame<8;frame++){
    Q.clock=10;Q.sprites.clear();const actor={...u,lane:Q.camera+300,offset:0,roadFace:1,roadMoving:true,roadWalk:(frame+.1)/8*Math.PI*2-u.id*.73,roadAttack:null};R.roadDrawUnit(actor);
    const sprite=[...Q.sprites.values()][0],rig=sprite.figureRig,bounds=sprite.figureBounds,footHeight=key==='orc_troll'?5.8:4.6,ankle=key==='orc_troll'?.1896551724137931:key==='orc_goblin'?.11538461538461539:.11971830985915492;
    const soles=rig.feet.map(p=>p[1]+footHeight*(1-ankle)),lengths=rig.hips.map((hip,i)=>[Math.hypot(hip[0]-rig.knees[i][0],hip[1]-rig.knees[i][1]),Math.hypot(rig.feet[i][0]-rig.knees[i][0],rig.feet[i][1]-rig.knees[i][1])]);
    frames.push({soles,lengths});const x=100+frame*200,y=320+row*330,scale=2.7;
    g.fillStyle='#f3dfad';g.font='16px Georgia';g.fillText(({orc_goblin:'Goblin',orc_troll:'Troll',orc_berserker:'Dühöngő'}[key])+' · '+frame,x-65,y-238);g.strokeStyle='#71866f';g.beginPath();g.moveTo(x-55,y+4);g.lineTo(x+55,y+4);g.stroke();g.drawImage(sprite,x+bounds[0]*scale,y+bounds[1]*scale,bounds[2]*scale,bounds[3]*scale);
   }
   Q.sprites.clear();R.roadDrawUnit({...u,lane:Q.camera+300,offset:0,roadMoving:false,roadAttack:null});const rig=[...Q.sprites.values()][0].figureRig;
   const angles=rig.hips.map((hip,i)=>{const k=rig.knees[i],f=rig.feet[i],a=[hip[0]-k[0],hip[1]-k[1]],b=[f[0]-k[0],f[1]-k[1]];return Math.acos((a[0]*b[0]+a[1]*b[1])/Math.hypot(...a)/Math.hypot(...b));});result.push({key,frames,angles});
  }
  return{units:result,png:gallery.toDataURL()};
 });
 for(const u of result.units){assert(u.angles.every(a=>a>2.3&&a<Math.PI),u.key+' stands without a deep squat or reversed knees');const expected=u.key==='orc_troll'?[7.6,7.1]:u.key==='orc_goblin'?[7.3,6.9]:[7,6.65];
  assert(u.frames.every(f=>f.soles.every(y=>y<=1.50001)&&f.soles.some(y=>Math.abs(y-1.5)<1e-5)),u.key+' always keeps a planted foot on the ground');
  assert(u.frames.every(f=>f.lengths.every(pair=>pair.every((x,i)=>Math.abs(x-expected[i])<1e-4))),u.key+' never stretches its thigh or shin during a step');console.log('PASS',u.key+': natural standing knees, alternating planted feet and constant leg lengths across the complete real walk cycle');
 }
 fs.mkdirSync('artifacts',{recursive:true});fs.writeFileSync('artifacts/orc-grounded-stride-486.png',Buffer.from(result.png.split(',')[1],'base64'));delete result.png;fs.writeFileSync('artifacts/orc-grounded-stride-486.json',JSON.stringify(result,null,2));
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
