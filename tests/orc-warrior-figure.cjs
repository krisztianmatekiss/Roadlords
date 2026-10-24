const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto');
const URL=process.env.ROADLORDS_TEST_URL||'http://127.0.0.1:4173/Roadlords/';
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox','--disable-dev-shm-usage']});
 const report={checks:[],errors:[]},check=(name,ok)=>{assert(ok,name);report.checks.push(name);console.log('PASS',name)};
 fs.mkdirSync('artifacts',{recursive:true});
 try{
  const page=await browser.newPage({viewport:{width:1600,height:1000}});await page.route('https://**/*',r=>r.abort());page.on('pageerror',e=>report.errors.push(e.message));
  await page.goto(URL);await page.waitForFunction(()=>!!window.__ROADLORDS_RUNTIME__);
  check('Orc atlas stays unloaded in normal game menu',await page.evaluate(()=>!performance.getEntriesByType('resource').some(r=>r.name.includes('orc-warrior-heroes-parts'))));
  await page.locator('.menuBrand').click();await page.waitForTimeout(900);await page.evaluate(async()=>{const R=__ROADLORDS_RUNTIME__;await Promise.all([R.loadOrcWarriorArt(),R.loadSkeletonArt()]);R.roadStartTest(42,{count:50,roster:'orc-skeleton'})});
  await page.waitForFunction(()=>__ROADLORDS_RUNTIME__.ROAD.testRoster==='orc-skeleton');await page.evaluate(()=>__ROADLORDS_RUNTIME__.roadPause());
  check('Retired diagnostic fixture starts 50 base Orc Warriors and 50 base Skeletons with both atlases ready',await page.evaluate(()=>{const R=__ROADLORDS_RUNTIME__;return R.state.units.length===100&&['orc_warrior','und_skeleton'].every(key=>R.state.units.filter(u=>u.key===key).length===50)&&R.state.units.every(u=>u.maxHp===R.UNITS[u.key].hp&&u.damage===R.UNITS[u.key].damage)&&[R.P,R.E].every(c=>!Object.keys(c.normal).length&&!c.legends.size)&&R.orcWarriorTexture.naturalWidth>0&&R.skeletonTexture.naturalWidth>0&&R.ROAD.figureStyle==='painted'}));
  const poses=await page.evaluate(()=>{
   const R=__ROADLORDS_RUNTIME__,Q=R.ROAD,orc=R.state.units.find(u=>u.key==='orc_warrior'),bone=R.state.units.find(u=>u.key==='und_skeleton');
   const hash=canvas=>{let n=0;for(const b of canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height).data)n=(Math.imul(n,31)+b)>>>0;return n};
   const sprite=(u,state,frame)=>{
    const a={start:9,launch:10,hit:10,end:10.4,recovery:.4,to:u.lane+30};
    const actor={...u,lane:Q.camera+300,offset:0,roadFace:1,roadMoving:state==='walk',roadWalk:(frame+.1)/8*Math.PI*2-u.id*.73,roadAttack:state==='attack'?a:null,death:10-(frame+.1)/6*.6};
    a.to=actor.lane+30;const windEnd=9.915;Q.clock=state==='attack'?(frame<4?9+(frame+.1)/4*.915:frame<7?windEnd+(frame-4+.1)/3*.085:10+(frame-7+.1)/5*.4):10;
    R.roadDrawUnit(actor,state==='death');const pose=R.battleFigurePose(actor,Q.clock,state==='death');return Q.sprites.get(`figure:${u.key}:${R.unitTeamFill(actor)}:${pose.state}:${pose.frame}:painted-${u.key==='orc_warrior'?'orc':'skeleton'}${u.veteran?':elite':''}`);
   };
   const gallery=document.createElement('canvas');gallery.width=1200;gallery.height=600;const g=gallery.getContext('2d');g.fillStyle='#1e3028';g.fillRect(0,0,1200,600);g.font='16px Arial';g.fillStyle='#eee3bd';const result={};
   for(const [row,[state,count]]of [['idle',1],['walk',8],['attack',12],['death',6]].entries()){
    const hashes=[];g.fillText(state,12,row*145+22);
    for(let i=0;i<count;i++){const s=sprite(orc,state,i);hashes.push(hash(s));if(i%Math.max(1,Math.floor(count/6))===0)g.drawImage(s,90+Math.floor(i/Math.max(1,Math.floor(count/6)))*135,row*145,140,140);}
    result[state]=new Set(hashes).size;
   }
   result.gallery=gallery.toDataURL();
   const preview=document.createElement('canvas');preview.width=1080;preview.height=720;const h=preview.getContext('2d');h.fillStyle='#14231c';h.fillRect(0,0,1080,720);h.textAlign='center';h.fillStyle='#f3dfaa';h.font='bold 28px Arial';h.fillText('ORK HARCOS vs CSONTVÁZ',540,48);h.fillStyle='#bccbbd';h.font='17px Arial';h.fillText('Tényleges játékbeli modellek · nagyítva és kis méretben',540,82);
   for(const [i,u]of [orc,bone].entries()){
    const x=270+i*540,s=sprite(u,'idle',0);h.fillStyle='#22392b';h.beginPath();h.roundRect(30+i*540,110,480,570,20);h.fill();h.fillStyle='#efd8a5';h.font='bold 23px Arial';h.fillText(i?'Csontváz':'Ork Harcos',x,150);
    const bounds=s.figureBounds;h.drawImage(s,x+bounds[0]*4,450+bounds[1]*4,bounds[2]*4,bounds[3]*4);h.drawImage(s,x+bounds[0]*1.1,610+bounds[1]*1.1,bounds[2]*1.1,bounds[3]*1.1);
   }
   result.preview=preview.toDataURL();
   const pixels=sprite(orc,'idle',0),ctx=pixels.getContext('2d');let blue=0;
   for(let i=0,data=ctx.getImageData(0,0,pixels.width,pixels.height).data;i<data.length;i+=4)if(data[i+3]>100&&data[i+2]>data[i]*1.3&&data[i+2]>data[i+1]*1.1)blue++;
   result.blue=blue;const idle=pixels.figureRig;result.kneeAngles=idle.hips.map((hip,i)=>{const knee=idle.knees[i],ankle=idle.ankles[i],a=[hip[0]-knee[0],hip[1]-knee[1]],b=[ankle[0]-knee[0],ankle[1]-knee[1]];return Math.acos((a[0]*b[0]+a[1]*b[1])/Math.hypot(...a)/Math.hypot(...b))*180/Math.PI});
   const original=hash(pixels);R.P.unitColor='red';const red=sprite(orc,'idle',0);result.teamChanges=hash(red)!==original;R.P.unitColor='blue';
   result.eliteChanges=hash(sprite({...orc,veteran:true},'idle',0))!==original;
   let face;result.facesStable=true;
   for(const [color]of __ROADLORDS_UNIT_COLORS__.palette){
    R.P.unitColor=color;const s=sprite(orc,'idle',0),b=s.figureBounds,scale=s.width/b[2];
    const data=s.getContext('2d').getImageData(Math.round((-6-b[0])*scale),Math.round((-47-b[1])*scale),Math.round(13*scale),Math.round(13*scale)).data;
    const value=Array.from(data).join(',');face??=value;result.facesStable&&=face===value;
   }
   result.clothCache=R.orcWarriorClothCache.size;R.P.unitColor='blue';
   result.cache=Q.sprites.size;return result;
  });
  for(const [field,name]of [['gallery','orc-warrior-poses.png'],['preview','orc-skeleton-in-game.png']]){fs.writeFileSync('artifacts/'+name,Buffer.from(poses[field].split(',')[1],'base64'));delete poses[field];}report.poses=poses;
  check('Orc has distinct walking, attacking and death frames',poses.idle===1&&poses.walk>=6&&poses.attack>=9&&poses.death===6);
  check('Orc idle knees are upright and team paint is visible',poses.kneeAngles.every(n=>n>120)&&poses.blue>45&&poses.teamChanges);
  check('All eight team colours preserve the face, use bounded cloth cache and distinguish elites',poses.facesStable&&poses.clothCache<=8&&poses.eliteChanges);
  const hit=await page.evaluate(()=>{const R=__ROADLORDS_RUNTIME__,Q=R.ROAD,u=R.state.units.find(u=>u.key==='orc_warrior'),t=R.state.units.find(u=>u.key==='und_skeleton');u.lane=4700;u.offset=0;t.lane=4730;t.offset=0;t.hp=t.maxHp=10000;t.shield=t.tempShield=0;R.roadReindex();R.attackUnit(u,t);const a=u.roadAttack;Q.clock=a.hit-.001;R.roadImpacts();const before=t.hp;Q.clock=a.hit+.001;R.roadImpacts();const after=t.hp;R.roadDrawUnit(u);const pose=R.battleFigurePose(u,Q.clock),rig=Q.sprites.get(`figure:orc_warrior:${R.unitTeamFill(u)}:attack:${pose.frame}:painted-orc`).figureRig;R.roadImpacts();return {early:before===10000,damage:before-after,expected:u.damage,once:t.hp===after,contact:pose.contact,weapon:rig.weapon}});report.hit=hit;
  check('Axe contact and real damage coincide once, without changing damage values',hit.early&&hit.once&&hit.damage===hit.expected&&hit.contact&&hit.weapon[0]>15&&hit.weapon[2]>1.3);
  await page.locator('#roadFigureToggle').click();check('A/B toggle preserves armies',await page.evaluate(()=>__ROADLORDS_RUNTIME__.ROAD.figureStyle==='simple'&&__ROADLORDS_RUNTIME__.state.units.length===100));
  await page.locator('#roadFigureToggle').click();await page.locator('#roadRestart').click();await page.evaluate(()=>__ROADLORDS_RUNTIME__.roadPause());
  check('Restart preserves the new roster and painted mode',await page.evaluate(()=>__ROADLORDS_RUNTIME__.ROAD.testRoster==='orc-skeleton'&&__ROADLORDS_RUNTIME__.ROAD.figureStyle==='painted'&&__ROADLORDS_RUNTIME__.state.units.length===100));
  await page.evaluate(()=>{const R=__ROADLORDS_RUNTIME__;for(let i=0;i<240&&!R.state.ended;i++){R.updateBattle(1/30);R.renderBattle(1/30)}R.roadFocusFront();R.renderBattle(0)});
  await page.screenshot({path:'artifacts/orc-skeleton-50v50-combat.png'});
  const battle=await page.evaluate(()=>{const R=__ROADLORDS_RUNTIME__;for(let i=0;i<660&&!R.state.ended;i++){R.updateBattle(1/30);R.renderBattle(1/30)}return {damage:R.ROAD.metrics.damage,attacks:R.ROAD.metrics.attacks,living:R.state.units.filter(u=>u.alive).length,cache:R.ROAD.sprites.size,finite:R.state.units.every(u=>Number.isFinite(u.hp)&&Number.isFinite(u.lane))}});report.battle=battle;
  check('Real 50v50 battle deals damage and kills units with finite state and bounded cache',battle.damage>1000&&battle.attacks>20&&battle.living<100&&battle.finite&&battle.cache<=768);
  const m=JSON.parse(fs.readFileSync('src/data/orc-warrior-art.json'));
  check('Transparent source atlas is unchanged and all cutout rectangles are valid',crypto.createHash('sha256').update(fs.readFileSync('public/'+m.file)).digest('hex')===m.sha256&&Object.values(m.parts).every(([x,y,w,h])=>x>=0&&y>=0&&x+w<=m.width&&y+h<=m.height));
  await Promise.all([page.waitForEvent('domcontentloaded'),page.locator('#roadMenu').click()]);await page.waitForFunction(()=>!!window.__ROADLORDS_RUNTIME__);
  check('Return to main menu works',await page.evaluate(()=>!__ROADLORDS_RUNTIME__.ROAD.test));check('No browser errors',!report.errors.length);
 }finally{fs.writeFileSync('artifacts/orc-warrior-figure.json',JSON.stringify(report,null,2));await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
