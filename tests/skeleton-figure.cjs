const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto');
const URL=process.env.ROADLORDS_TEST_URL||'http://127.0.0.1:4173/Roadlords/';
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox','--disable-dev-shm-usage']});
 const report={checks:[],errors:[]},check=(name,ok)=>{assert(ok,name);report.checks.push(name);console.log('PASS',name)};
 try{
  fs.mkdirSync('artifacts',{recursive:true});
  const p=await browser.newPage({viewport:{width:1600,height:1000}});await p.route('https://**/*',r=>r.abort());p.on('pageerror',e=>report.errors.push(e.message));
  await p.goto(URL);await p.waitForFunction(()=>!!window.__ROADLORDS_RUNTIME__);
  check('Experimental skeleton texture does not load in the normal main menu',await p.evaluate(()=>!performance.getEntriesByType('resource').some(r=>r.name.includes('skeleton-parts'))));
  await p.locator('.menuBrand').click();await p.waitForTimeout(900);await p.locator('#roadTestsMenu').click();await p.locator('#roadSkeletonMenu').click();
  await p.waitForFunction(()=>__ROADLORDS_RUNTIME__.ROAD.testRoster==='skeleton');await p.evaluate(()=>__ROADLORDS_RUNTIME__.roadPause());
  check('One test-menu click starts exactly 50 Skeletons against 50 unchanged Swordsmen with no upgrades',await p.evaluate(()=>{const R=__ROADLORDS_RUNTIME__;return R.state.units.length===100&&R.state.units.filter(u=>u.key==='und_skeleton').length===50&&R.state.units.filter(u=>u.key==='swordsman').length===50&&R.state.units.every(u=>u.maxHp===(u.key==='und_skeleton'?85:100)&&u.damage===(u.key==='und_skeleton'?10:12))&&[R.P,R.E].every(c=>Object.keys(c.normal).length===0&&c.legends.size===0)&&R.ROAD.figureStyle==='skeleton'}));
  const poses=await p.evaluate(()=>{
   const R=__ROADLORDS_RUNTIME__,Q=R.ROAD,s=R.state.units.find(u=>u.key==='und_skeleton'),h=R.state.units.find(u=>u.key==='swordsman'),result={};
   const hash=canvas=>{const bytes=canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height).data;let n=0;for(let i=0;i<bytes.length;i++)n=(Math.imul(n,31)+bytes[i])>>>0;return n};
   const colors=['#579bdf','#df5b54'];const gallery=document.createElement('canvas');gallery.width=1200;gallery.height=480;const g=gallery.getContext('2d');g.fillStyle='#21342b';g.fillRect(0,0,1200,480);
   for(const [index,[state,count]] of [['idle',1],['walk',8],['attack',12],['death',6]].entries()){
    const hashes=[];
    for(let frame=0;frame<count;frame++){
     const u={...s,lane:Q.camera+300,offset:0,roadMoving:state==='walk',roadWalk:(frame+.1)/8*Math.PI*2-s.id*.73,roadAttack:null,death:10-(frame+.1)/6*.6};Q.clock=10;
     if(state==='attack'){const a={start:9,launch:10,hit:10,end:10.4,recovery:.4,to:u.lane+20},windEnd=a.launch-.085;Q.clock=frame<4?a.start+(frame+.1)/4*(windEnd-a.start):frame<7?windEnd+(frame-4+.1)/3*.085:a.launch+(frame-7+.1)/5*.4;u.roadAttack=a;}
     R.roadDrawUnit(u,state==='death');const pose=R.battleFigurePose(u,Q.clock,state==='death'),sprite=Q.sprites.get(`figure:und_skeleton:${R.unitTeamFill(u)}:${pose.state}:${pose.frame}:painted-skeleton`);
     if(!sprite)throw Error('Painted skeleton frame missing');hashes.push(hash(sprite));
     if(frame%Math.max(1,Math.floor(count/6))===0){const x=20+Math.floor(frame/Math.max(1,Math.floor(count/6)))*155;g.drawImage(sprite,x,index*115,115,115);}
    }
    result[state]={frames:count,unique:new Set(hashes).size};
   }
   const actor={...h,lane:Q.camera+300,offset:0,roadMoving:false,roadAttack:null};Q.clock=0;Q.figureStyle='skeleton';R.roadDrawUnit(actor);const key=`figure:swordsman:${R.unitTeamFill(actor)}:idle:0`,before=hash(Q.sprites.get(key));Q.figureStyle='simple';R.roadDrawUnit(actor);result.swordsmanUnchanged=before===hash(Q.sprites.get(key));Q.figureStyle='skeleton';
   result.cache=Q.sprites.size;result.gallery=gallery.toDataURL();return result;
  });fs.writeFileSync('artifacts/skeleton-poses.png',Buffer.from(poses.gallery.split(',')[1],'base64'));delete poses.gallery;report.poses=poses;
  check('Generated cutout rig has distinct idle, 8 walking, 12 attacking and 6 death poses',poses.idle.unique===1&&poses.walk.unique>=6&&poses.attack.unique>=9&&poses.death.unique===6);
  check('The swordsman renderer is byte-identical in new and current skeleton modes',poses.swordsmanUnchanged);
  check('All skeleton frames use the established bounded sprite cache',poses.cache<=768);
  await p.locator('#roadFigureToggle').click();check('A/B toggle changes only skeleton art without resetting armies',await p.evaluate(()=>__ROADLORDS_RUNTIME__.ROAD.figureStyle==='simple'&&__ROADLORDS_RUNTIME__.state.units.length===100));
  await p.locator('#roadFigureToggle').click();await p.locator('#roadRestart').click();await p.evaluate(()=>__ROADLORDS_RUNTIME__.roadPause());
  check('Restart retains the 50/50 skeleton roster and selected graphics',await p.evaluate(()=>{const R=__ROADLORDS_RUNTIME__;return R.ROAD.testRoster==='skeleton'&&R.ROAD.figureStyle==='skeleton'&&R.state.units.length===100}));
  await p.screenshot({path:'artifacts/skeleton-50v50-ready.png'});
  const battle=await p.evaluate(()=>{const R=__ROADLORDS_RUNTIME__;for(let i=0;i<900&&!R.state.ended;i++){R.updateBattle(1/30);R.renderBattle(1/30)}return {damage:R.ROAD.metrics.damage,attacks:R.ROAD.metrics.attacks,living:R.state.units.filter(u=>u.alive).length,cache:R.ROAD.sprites.size,finite:R.state.units.every(u=>Number.isFinite(u.hp)&&Number.isFinite(u.lane))}});report.battle=battle;
  check('The real 50/50 fight deals damage, kills units and keeps finite state with bounded textures',battle.damage>1000&&battle.attacks>20&&battle.living<100&&battle.finite&&battle.cache<=768);
  await p.screenshot({path:'artifacts/skeleton-50v50-combat.png'});
  const manifest=JSON.parse(fs.readFileSync('src/data/skeleton-art.json'));
  check('The generated transparent parts atlas preserves its original checksum and valid source rectangles',crypto.createHash('sha256').update(fs.readFileSync('public/'+manifest.file)).digest('hex')===manifest.sha256&&Object.values(manifest.parts).every(([x,y,w,h])=>x>=0&&y>=0&&x+w<=manifest.width&&y+h<=manifest.height));
  await Promise.all([p.waitForEvent('domcontentloaded'),p.locator('#roadMenu').click()]);await p.waitForFunction(()=>!!window.__ROADLORDS_RUNTIME__);
  check('The test can return to a fresh main menu',await p.evaluate(()=>!__ROADLORDS_RUNTIME__.ROAD.test&&getComputedStyle(document.querySelector('.mpLobby')).display!=='none'));
  check('No skeleton-rendering or combat runtime errors',report.errors.length===0);
 }finally{fs.mkdirSync('artifacts',{recursive:true});fs.writeFileSync('artifacts/skeleton-figure.json',JSON.stringify(report,null,2));await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
