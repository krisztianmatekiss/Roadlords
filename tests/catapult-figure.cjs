const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto');
const URL=process.env.ROADLORDS_TEST_URL||'http://127.0.0.1:4173/Roadlords/';
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox','--disable-dev-shm-usage']});
 const report={checks:[],errors:[]},check=(name,ok)=>{assert(ok,name);report.checks.push(name);console.log('PASS',name)};fs.mkdirSync('artifacts',{recursive:true});
 try{
  const page=await browser.newPage({viewport:{width:1600,height:1000}});await page.route('https://**/*',r=>r.abort());page.on('pageerror',e=>report.errors.push(e.message));
  await page.goto(URL);await page.waitForFunction(()=>!!window.__ROADLORDS_RUNTIME__);
  check('Catapult atlas stays unloaded in the normal main menu',await page.evaluate(()=>!performance.getEntriesByType('resource').some(r=>r.name.includes('catapult-heroes-parts'))));
  await page.locator('.menuBrand').click();await page.waitForTimeout(900);await page.locator('#roadTestsMenu').click();
  check('Only Knight and Catapult trials remain visible',await page.locator('.roadTestsList button').count()===2&&await page.locator('#roadKnightMenu').isVisible()&&await page.locator('#roadCatapultMenu').isVisible()&&await page.locator('#roadOrcSkeletonMenu').count()===0);
  await page.locator('#roadCatapultMenu').click();await page.waitForFunction(()=>__ROADLORDS_RUNTIME__.ROAD.testRoster==='catapult');await page.evaluate(()=>__ROADLORDS_RUNTIME__.roadPause());
  check('One click starts exactly five base Catapults against five base Orc Warriors',await page.evaluate(()=>{const R=__ROADLORDS_RUNTIME__;return R.state.units.length===10&&['catapult','orc_warrior'].every(key=>R.state.units.filter(u=>u.key===key).length===5)&&R.state.units.every(u=>u.maxHp===R.UNITS[u.key].hp&&u.damage===R.UNITS[u.key].damage)&&R.catapultTexture.naturalWidth>0&&[R.P,R.E].every(c=>!Object.keys(c.normal).length&&!c.legends.size)}));
  const poses=await page.evaluate(()=>{
   const R=__ROADLORDS_RUNTIME__,Q=R.ROAD,unit=R.state.units.find(u=>u.key==='catapult'),orc=R.state.units.find(u=>u.key==='orc_warrior');
   const hash=c=>{let n=0;for(const b of c.getContext('2d').getImageData(0,0,c.width,c.height).data)n=(Math.imul(n,31)+b)>>>0;return n};
   const sprite=(u,state,frame)=>{
    const actor={...u,lane:Q.camera+350,offset:0,roadFace:1,roadMoving:state==='walk',roadWalk:(frame+.1)/8*Math.PI*2-u.id*.73,roadAttack:null,death:10-(frame+.1)/6*.6};Q.clock=10;
    if(state==='attack'){actor.roadAttack={start:9,launch:10,hit:10.4,end:10.64,recovery:.24,to:actor.lane+250};Q.clock=frame<4?9+(frame+.1)/4*.915:frame<7?9.915+(frame-4+.1)/3*.085:10+(frame-7+.1)/5*.24;}
    R.roadDrawUnit(actor,state==='death');const p=R.battleFigurePose(actor,Q.clock,state==='death');return Q.sprites.get(`figure:${u.key}:${R.unitTeamFill(actor)}:${p.state}:${p.frame}:painted-${u.key==='catapult'?'catapult':'orc'}${u.veteran?':elite':''}`);
   };
   const result={},gallery=document.createElement('canvas');gallery.width=1400;gallery.height=680;const g=gallery.getContext('2d');g.fillStyle='#21352a';g.fillRect(0,0,1400,680);g.fillStyle='#eedbab';g.font='17px Arial';
   for(const [row,[state,count]]of [['idle',1],['walk',8],['attack',12],['death',6]].entries()){
    const hashes=[];g.fillText(state,12,row*165+24);
    for(let i=0;i<count;i++){const s=sprite(unit,state,i);hashes.push(hash(s));if(i%Math.max(1,Math.floor(count/6))===0)g.drawImage(s,100+Math.floor(i/Math.max(1,Math.floor(count/6)))*155,row*165,165,165);}
    result[state]=new Set(hashes).size;
   }
   result.gallery=gallery.toDataURL();result.loaded=sprite(unit,'attack',6).figureRig;result.released=sprite(unit,'attack',7).figureRig;result.launch=R.catapultLaunchPoint();
   const idle=sprite(unit,'idle',0),original=hash(idle);result.eliteChanges=hash(sprite({...unit,veteran:true},'idle',0))!==original;
   let wood;result.materialStable=true;result.colours=[];
   for(const [color]of __ROADLORDS_UNIT_COLORS__.palette){R.P.unitColor=color;const s=sprite(unit,'idle',0),b=s.figureBounds,k=s.width/b[2],pixels=s.getContext('2d').getImageData(Math.round((-13-b[0])*k),Math.round((-19-b[1])*k),Math.round(9*k),Math.round(4*k)).data;
    const value=Array.from(pixels).join(',');wood??=value;result.materialStable&&=wood===value&&pixels.some((v,i)=>i%4===3&&v>100);result.colours.push(hash(s));
   }
   result.bannerCache=R.catapultBannerCache.size;R.P.unitColor='blue';
   const preview=document.createElement('canvas');preview.width=1080;preview.height=760;const c=preview.getContext('2d');c.fillStyle='#14231c';c.fillRect(0,0,1080,760);c.textAlign='center';c.fillStyle='#f1dca8';c.font='bold 28px Arial';c.fillText('KATAPULT — ÚJ JÁTÉKBELI MODELL',540,47);c.fillStyle='#bbcabd';c.font='17px Arial';c.fillText('Tényleges modellek · azonos lépték, nagyítva és kis méretben',540,80);
   for(const [i,u]of [unit,orc].entries()){
    const x=270+i*540,s=sprite(u,'idle',0),b=s.figureBounds;c.fillStyle='#22382b';c.beginPath();c.roundRect(25+i*540,110,490,610,18);c.fill();c.fillStyle='#edd7a3';c.font='bold 23px Arial';c.fillText(i?'Ork Harcos':'Katapult',x,149);c.drawImage(s,x+b[0]*4,480+b[1]*4,b[2]*4,b[3]*4);c.drawImage(s,x+b[0]*1.15,655+b[1]*1.15,b[2]*1.15,b[3]*1.15);
   }
   result.preview=preview.toDataURL();result.cache=Q.sprites.size;return result;
  });
  for(const [field,name]of [['gallery','catapult-poses.png'],['preview','catapult-orc-in-game.png']]){fs.writeFileSync('artifacts/'+name,Buffer.from(poses[field].split(',')[1],'base64'));delete poses[field];}report.poses=poses;
  check('Moving wheels, throwing arm and disassembly have distinct cached animation frames',poses.idle===1&&poses.walk>=6&&poses.attack>=9&&poses.death===6&&poses.cache<=768);
  check('The last loaded cup pose and first released pose share the projectile launch point',poses.loaded.stoneLoaded&&!poses.released.stoneLoaded&&poses.launch.every((n,i)=>Math.abs(n-poses.loaded.cup[i])<1e-8&&Math.abs(n-poses.released.cup[i])<1e-8));
  check('Eight banner colours preserve visible wood, distinguish elites and keep bounded recolours',new Set(poses.colours).size===8&&poses.materialStable&&poses.eliteChanges&&poses.bannerCache<=8);
  const timing=await page.evaluate(()=>{
   const R=__ROADLORDS_RUNTIME__,Q=R.ROAD,u=R.state.units.find(u=>u.key==='catapult'),target=R.state.units.find(u=>u.key==='orc_warrior');Q.clock=0;u.lane=4700;u.offset=0;target.lane=4950;target.offset=0;target.hp=target.maxHp=10000;target.shield=target.tempShield=0;R.roadReindex();R.attackUnit(u,target);const a=u.roadAttack;
   Q.clock=a.launch+.001;R.roadImpacts();const noLaunchDamage=target.hp===10000;
   const flightCanvas=document.createElement('canvas');flightCanvas.width=Q.w;flightCanvas.height=Q.h;const old=R.ctx;R.ctx=flightCanvas.getContext('2d');R.roadDrawShots();R.ctx=old;
   const pos=R.catapultProjectilePoint(a,.001/(a.hit-a.launch)),origin=R.pointAt(a.lane,a.offset),scale=Q.h/600*Q.zoom;
   const alpha=(x,y)=>{const bytes=flightCanvas.getContext('2d').getImageData(Math.round(x-6*scale),Math.round(y-6*scale),Math.round(12*scale),Math.round(12*scale)).data;return bytes.filter((v,i)=>i%4===3&&v>50).length};
   const releasePixels=alpha(pos.x,pos.y),phantomPixels=alpha(origin.x,origin.y-19*scale);
   const paths=[1,-1].map(face=>{const shot={...a,catapultFace:face},p0=R.catapultProjectilePoint(shot,0),pm=R.catapultProjectilePoint(shot,.5),p1=R.catapultProjectilePoint(shot,1),cup=R.catapultLaunchPoint(),to=R.pointAt(a.to,a.toOffset);return Math.abs(p0.x-origin.x-cup[0]*scale*face)<1e-7&&Math.abs(p0.y-origin.y-cup[1]*scale)<1e-7&&Math.abs(p1.x-to.x)<1e-7&&Math.abs(p1.y-to.y+13*scale)<1e-7&&pm.y<Math.min(p0.y,p1.y)});
   Q.clock=a.hit-.001;R.roadImpacts();const early=target.hp===10000;Q.clock=a.hit+.001;R.roadImpacts();const hp=target.hp;R.roadImpacts();return {noLaunchDamage,early,damage:10000-hp,expected:u.damage,once:target.hp===hp,releasePixels,phantomPixels,paths,impact:R.roadEffects.impacts.some(f=>f.kind==='rock'&&f.start===a.hit&&f.lane===target.lane)};
  });report.timing=timing;
  check('The drawn rock starts at the cup with no duplicate generic projectile on either facing',timing.releasePixels>10&&timing.phantomPixels===0&&timing.paths.every(Boolean));
  check('Flight deals no early damage and impact resolves real damage exactly once with a rock effect',timing.noLaunchDamage&&timing.early&&timing.damage===timing.expected&&timing.once&&timing.impact);
  await page.locator('#roadFigureToggle').click();check('A/B comparison preserves the same ten units',await page.evaluate(()=>__ROADLORDS_RUNTIME__.ROAD.figureStyle==='simple'&&__ROADLORDS_RUNTIME__.state.units.length===10));
  await page.locator('#roadFigureToggle').click();await page.locator('#roadRestart').click();await page.evaluate(()=>__ROADLORDS_RUNTIME__.roadPause());
  check('Restart retains the new roster and graphics',await page.evaluate(()=>__ROADLORDS_RUNTIME__.ROAD.testRoster==='catapult'&&__ROADLORDS_RUNTIME__.ROAD.figureStyle==='painted'&&__ROADLORDS_RUNTIME__.state.units.length===10));
  await page.evaluate(()=>{const R=__ROADLORDS_RUNTIME__;for(let i=0;i<180&&!R.state.ended;i++){R.updateBattle(1/30);R.renderBattle(1/30)}R.roadFocusFront();R.updateHud();R.renderBattle(0)});await page.screenshot({path:'artifacts/catapult-orc-combat.png'});
  const battle=await page.evaluate(()=>{const R=__ROADLORDS_RUNTIME__;for(let i=0;i<1620&&!R.state.ended;i++){R.updateBattle(1/30);R.renderBattle(1/30)}return {damage:R.ROAD.metrics.damage,attacks:R.ROAD.metrics.attacks,living:R.state.units.filter(u=>u.alive).length,cache:R.ROAD.sprites.size,finite:R.state.units.every(u=>Number.isFinite(u.hp)&&Number.isFinite(u.lane))}});report.battle=battle;
  check('The real ranged battle deals damage and kills units without invalid state or unbounded sprites',battle.damage>500&&battle.attacks>20&&battle.living<10&&battle.finite&&battle.cache<=768);
  const m=JSON.parse(fs.readFileSync('src/data/catapult-art.json'));check('Transparent source atlas is preserved and all part rectangles are valid',crypto.createHash('sha256').update(fs.readFileSync('public/'+m.file)).digest('hex')===m.sha256&&Object.values(m.parts).every(([x,y,w,h])=>x>=0&&y>=0&&x+w<=m.width&&y+h<=m.height));
  await page.setViewportSize({width:1280,height:800});await page.waitForTimeout(150);await page.locator('#roadRestart').click();await page.evaluate(()=>__ROADLORDS_RUNTIME__.roadPause());
  check('A smaller 1280 by 800 viewport starts with both armies and rear cups inside the free road',await page.evaluate(()=>{const R=__ROADLORDS_RUNTIME__,Q=R.ROAD;R.renderBattle(0);const scale=Q.h/600*Q.zoom,free=R.roadWar.clientWidth-(Q.enemyPinned?Q.city+24:0);return Q.zoom<=1&&R.state.units.every(u=>{const p=R.pointAt(u.lane,u.offset);return p.x-(u.key==='catapult'?35:25)*scale>=0&&p.x+25*scale<=free})}));
  await Promise.all([page.waitForEvent('domcontentloaded'),page.locator('#roadMenu').click()]);await page.waitForFunction(()=>!!window.__ROADLORDS_RUNTIME__);check('Returning to main menu works',await page.evaluate(()=>!__ROADLORDS_RUNTIME__.ROAD.test));check('No browser errors',!report.errors.length);
 }finally{fs.writeFileSync('artifacts/catapult-figure.json',JSON.stringify(report,null,2));await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
