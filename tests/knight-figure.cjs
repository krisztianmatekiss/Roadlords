const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto');
const URL=process.env.ROADLORDS_TEST_URL||'http://127.0.0.1:4173/Roadlords/';
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox','--disable-dev-shm-usage']});
 const report={checks:[],errors:[]},check=(name,ok)=>{assert(ok,name);report.checks.push(name);console.log('PASS',name)};
 fs.mkdirSync('artifacts',{recursive:true});
 try{
  const page=await browser.newPage({viewport:{width:1600,height:1000}});await page.route('https://**/*',r=>r.abort());page.on('pageerror',e=>report.errors.push(e.message));
  await page.goto(URL);await page.waitForFunction(()=>!!window.__ROADLORDS_RUNTIME__);
  check('Knight art is not downloaded by the normal main menu',await page.evaluate(()=>!performance.getEntriesByType('resource').some(r=>r.name.includes('knight-heroes-parts'))));
  await page.locator('.menuBrand').click();await page.waitForTimeout(900);await page.locator('#roadTestsMenu').click();
  check('Only Infantry and Catapult experiments remain in the test submenu',await page.locator('.roadTestsList button').count()===2&&await page.locator('#roadInfantryMenu').isVisible()&&await page.locator('#roadCatapultMenu').isVisible()&&await page.locator('#roadTestMenu,#roadStressMenu,#roadUndeadMenu,#roadSkeletonMenu,#roadFigureMenu,#roadOrcSkeletonMenu,#roadKnightMenu').count()===0);
  await page.locator('#roadTestsBack').click();await page.evaluate(async()=>{const R=__ROADLORDS_RUNTIME__;await Promise.all([R.loadKnightArt(),R.loadOrcWarriorArt()]);R.roadStartTest(42,{count:10,roster:'knight'})});await page.waitForFunction(()=>__ROADLORDS_RUNTIME__.ROAD.testRoster==='knight');await page.evaluate(()=>__ROADLORDS_RUNTIME__.roadPause());
  check('Retired fixture starts 10 base Knights against 10 base Orc Warriors with both atlases ready',await page.evaluate(()=>{const R=__ROADLORDS_RUNTIME__;return R.state.units.length===20&&['knight','orc_warrior'].every(key=>R.state.units.filter(u=>u.key===key).length===10)&&R.state.units.every(u=>u.maxHp===R.UNITS[u.key].hp&&u.damage===R.UNITS[u.key].damage)&&R.knightTexture.naturalWidth>0&&R.orcWarriorTexture.naturalWidth>0&&[R.P,R.E].every(c=>!Object.keys(c.normal).length&&!c.legends.size)}));
  check('Default zoom keeps every rider and plume inside the battlefield height',await page.evaluate(()=>{const R=__ROADLORDS_RUNTIME__,scale=R.ROAD.h/600*R.ROAD.zoom;return R.state.units.every(u=>{const p=R.pointAt(u.lane,u.offset);return p.y-(u.key==='knight'?70:51)*scale>=0&&p.y+4*scale<=R.ROAD.h})}));
  const poses=await page.evaluate(()=>{
   const R=__ROADLORDS_RUNTIME__,Q=R.ROAD,knight=R.state.units.find(u=>u.key==='knight'),orc=R.state.units.find(u=>u.key==='orc_warrior');
   const hash=canvas=>{let n=0;for(const b of canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height).data)n=(Math.imul(n,31)+b)>>>0;return n};
   const sprite=(u,state,frame)=>{
    const actor={...u,lane:Q.camera+300,offset:0,roadFace:1,roadMoving:state==='walk',roadWalk:(frame+.1)/8*Math.PI*2-u.id*.73,roadAttack:null,death:10-(frame+.1)/6*.6};Q.clock=10;
    if(state==='attack'){actor.roadAttack={start:9,launch:10,hit:10,end:10.4,recovery:.4,to:actor.lane+35};Q.clock=frame<4?9+(frame+.1)/4*.915:frame<7?9.915+(frame-4+.1)/3*.085:10+(frame-7+.1)/5*.4;}
    R.roadDrawUnit(actor,state==='death');const p=R.battleFigurePose(actor,Q.clock,state==='death');return Q.sprites.get(`figure:${u.key}:${R.unitTeamFill(actor)}:${p.state}:${p.frame}:painted-${u.key==='knight'?'knight':'orc'}${u.veteran?':elite':''}`);
   };
   const result={},gallery=document.createElement('canvas');gallery.width=1400;gallery.height=680;const g=gallery.getContext('2d');g.fillStyle='#203329';g.fillRect(0,0,1400,680);g.font='17px Arial';g.fillStyle='#eedbaa';
   for(const [row,[state,count]]of [['idle',1],['walk',8],['attack',12],['death',6]].entries()){
    const hashes=[];g.fillText(state,12,row*165+24);
    for(let i=0;i<count;i++){const s=sprite(knight,state,i);hashes.push(hash(s));if(i%Math.max(1,Math.floor(count/6))===0)g.drawImage(s,100+Math.floor(i/Math.max(1,Math.floor(count/6)))*155,row*165,165,165);}
    result[state]=new Set(hashes).size;
   }
   result.gallery=gallery.toDataURL();
   result.hoofs=Array.from({length:8},(_,i)=>sprite(knight,'walk',i).figureRig.hoofs);
   const idle=sprite(knight,'idle',0);result.eliteChanges=hash(sprite({...knight,veteran:true},'idle',0))!==hash(idle);
   const area=(s,x,y,w,h)=>{const b=s.figureBounds,k=s.width/b[2];return Array.from(s.getContext('2d').getImageData(Math.round((x-b[0])*k),Math.round((y-b[1])*k),Math.round(w*k),Math.round(h*k)).data).join(',')};
   let head,horse;result.teamHashes=[];result.materialStable=true;
   for(const [color]of __ROADLORDS_UNIT_COLORS__.palette){R.P.unitColor=color;const s=sprite(knight,'idle',0),a=area(s,2,-45,3,6),b=area(s,14,-36,6,8);head??=a;horse??=b;result.materialStable&&=a===head&&b===horse&&a.split(',').some((v,i)=>i%4===3&&Number(v)>100)&&b.split(',').some((v,i)=>i%4===3&&Number(v)>100);result.teamHashes.push(hash(s));}
   result.clothCache=R.knightClothCache.size;R.P.unitColor='blue';
   const preview=document.createElement('canvas');preview.width=1080;preview.height=760;const c=preview.getContext('2d');c.fillStyle='#14231c';c.fillRect(0,0,1080,760);c.textAlign='center';c.fillStyle='#f0dba7';c.font='bold 28px Arial';c.fillText('LOVAG — ÚJ JÁTÉKBELI MODELL',540,47);c.font='17px Arial';c.fillStyle='#bacbb9';c.fillText('Tényleges modellek · egységes lépték, nagyítva és kis méretben',540,79);
   for(const [i,u]of [knight,orc].entries()){
    const x=270+i*540,s=sprite(u,'idle',0),b=s.figureBounds;c.fillStyle='#22392c';c.beginPath();c.roundRect(25+i*540,110,490,610,18);c.fill();c.font='bold 23px Arial';c.fillStyle='#eed8a5';c.fillText(i?'Ork Harcos':'Lovag',x,147);c.drawImage(s,x+b[0]*4,470+b[1]*4,b[2]*4,b[3]*4);c.drawImage(s,x+b[0]*1.15,655+b[1]*1.15,b[2]*1.15,b[3]*1.15);
   }
   result.preview=preview.toDataURL();result.cache=Q.sprites.size;return result;
  });
  for(const [field,name]of [['gallery','knight-poses.png'],['preview','knight-orc-in-game.png']]){fs.writeFileSync('artifacts/'+name,Buffer.from(poses[field].split(',')[1],'base64'));delete poses[field];}report.poses=poses;
  check('Mounted rig has distinct idle, eight moving, twelve attack and six death frames',poses.idle===1&&poses.walk>=6&&poses.attack>=9&&poses.death===6);
  check('All four horse legs move and each gait frame retains ground contact',poses.hoofs.every(frame=>frame.length===4&&frame.some(h=>h[1]>-1.3)&&frame.every(h=>h[1]<=-1.19))&&[0,1,2,3].every(i=>new Set(poses.hoofs.map(f=>f[i].join(','))).size>=6));
  check('Grounded hooves move backwards relative to the forward-moving horse',[[0,5],[3,5],[1,1],[2,1]].every(([leg,frame])=>poses.hoofs[frame][leg][1]>-1.3&&poses.hoofs[frame][leg][0]>poses.hoofs[frame+1][leg][0]&&poses.hoofs[frame+1][leg][0]>poses.hoofs[frame+2][leg][0]));
  check('Eight team colours preserve horse and helmet paint, distinguish elites and use bounded cloth cache',new Set(poses.teamHashes).size===8&&poses.materialStable&&poses.eliteChanges&&poses.clothCache<=8&&poses.cache<=768);
  const hit=await page.evaluate(()=>{const R=__ROADLORDS_RUNTIME__,Q=R.ROAD,u=R.state.units.find(u=>u.key==='knight'),t=R.state.units.find(u=>u.key==='orc_warrior');u.lane=4700;u.offset=0;t.lane=4730;t.offset=0;t.hp=t.maxHp=10000;t.shield=t.tempShield=0;R.roadReindex();R.attackUnit(u,t);const a=u.roadAttack;Q.clock=a.hit-.001;R.roadImpacts();const before=t.hp;Q.clock=a.hit+.001;R.roadImpacts();const after=t.hp;R.roadDrawUnit(u);const pose=R.battleFigurePose(u,Q.clock),rig=Q.sprites.get(`figure:knight:${R.unitTeamFill(u)}:attack:${pose.frame}:painted-knight`).figureRig;R.roadImpacts();return {early:before===10000,damage:before-after,expected:u.damage,once:t.hp===after,contact:pose.contact,weapon:rig.weapon}});report.hit=hit;
  check('Lance contact matches the real hit once, with unchanged damage',hit.early&&hit.once&&hit.damage===hit.expected&&hit.contact&&hit.weapon[2]>1.6);
  await page.locator('#roadFigureToggle').click();check('A/B comparison preserves the 20 units',await page.evaluate(()=>__ROADLORDS_RUNTIME__.ROAD.figureStyle==='simple'&&__ROADLORDS_RUNTIME__.state.units.length===20));
  await page.locator('#roadFigureToggle').click();await page.locator('#roadRestart').click();await page.evaluate(()=>__ROADLORDS_RUNTIME__.roadPause());
  check('Restart preserves the Knight roster, count and selected graphics',await page.evaluate(()=>__ROADLORDS_RUNTIME__.ROAD.testRoster==='knight'&&__ROADLORDS_RUNTIME__.ROAD.testCount===10&&__ROADLORDS_RUNTIME__.ROAD.figureStyle==='painted'&&__ROADLORDS_RUNTIME__.state.units.length===20));
  await page.evaluate(()=>{const R=__ROADLORDS_RUNTIME__;for(let i=0;i<210&&!R.state.ended;i++){R.updateBattle(1/30);R.renderBattle(1/30)}R.roadFocusFront();R.updateHud();R.renderBattle(0)});await page.screenshot({path:'artifacts/knight-orc-combat.png'});
  const battle=await page.evaluate(()=>{const R=__ROADLORDS_RUNTIME__;for(let i=0;i<690&&!R.state.ended;i++){R.updateBattle(1/30);R.renderBattle(1/30)}return {damage:R.ROAD.metrics.damage,attacks:R.ROAD.metrics.attacks,living:R.state.units.filter(u=>u.alive).length,finite:R.state.units.every(u=>Number.isFinite(u.hp)&&Number.isFinite(u.lane)),cache:R.ROAD.sprites.size}});report.battle=battle;
  check('Real cavalry battle deals damage and kills units without invalid state or unbounded cache',battle.damage>500&&battle.attacks>20&&battle.living<20&&battle.finite&&battle.cache<=768);
  const m=JSON.parse(fs.readFileSync('src/data/knight-art.json'));check('Original transparent atlas is unchanged and all source rectangles are valid',crypto.createHash('sha256').update(fs.readFileSync('public/'+m.file)).digest('hex')===m.sha256&&Object.values(m.parts).every(([x,y,w,h])=>x>=0&&y>=0&&x+w<=m.width&&y+h<=m.height));
  await Promise.all([page.waitForEvent('domcontentloaded'),page.locator('#roadMenu').click()]);await page.waitForFunction(()=>!!window.__ROADLORDS_RUNTIME__);check('Return to main menu works',await page.evaluate(()=>!__ROADLORDS_RUNTIME__.ROAD.test));check('No browser errors',!report.errors.length);
 }finally{fs.writeFileSync('artifacts/knight-figure.json',JSON.stringify(report,null,2));await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
