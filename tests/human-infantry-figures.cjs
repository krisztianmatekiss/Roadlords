const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto');
const URL=process.env.ROADLORDS_TEST_URL||'http://127.0.0.1:4173/Roadlords/';
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox','--disable-dev-shm-usage']});
 const report={checks:[],errors:[]},check=(name,ok)=>{assert(ok,name);report.checks.push(name);console.log('PASS',name)};fs.mkdirSync('artifacts',{recursive:true});
 try{
  const page=await browser.newPage({viewport:{width:1600,height:1000}});await page.route('https://**/*',r=>r.abort());page.on('pageerror',e=>report.errors.push(e.message));
  await page.goto(URL);await page.waitForFunction(()=>!!window.__ROADLORDS_RUNTIME__);
  check('Shared human atlas is not downloaded by the normal menu',await page.evaluate(()=>!performance.getEntriesByType('resource').some(r=>r.name.includes('human-infantry-heroes-parts'))));
  await page.locator('.menuBrand').click();await page.waitForTimeout(900);await page.locator('#roadTestsMenu').click();
  check('Only Orc Mystics and Orc Raiders trials remain in the menu',await page.locator('.roadTestsList button').count()===2&&await page.locator('#roadOrcMysticsMenu').isVisible()&&await page.locator('#roadOrcRaidersMenu').isVisible()&&await page.locator('#roadKnightMenu,#roadOrcSkeletonMenu').count()===0);
  await page.locator('#roadTestsBack').click();await page.evaluate(async()=>{const R=__ROADLORDS_RUNTIME__;await Promise.all([R.loadHumanInfantryArt(),R.loadOrcWarriorArt()]);R.roadStartTest(42,{count:10,roster:'infantry'})});await page.evaluate(()=>__ROADLORDS_RUNTIME__.roadPause());
  check('Retired fixture starts five base Swordsmen and five base Spearmen against ten base Orc Warriors',await page.evaluate(()=>{const R=__ROADLORDS_RUNTIME__;return R.state.units.length===20&&R.state.units.filter(u=>u.key==='swordsman').length===5&&R.state.units.filter(u=>u.key==='spearman').length===5&&R.state.units.filter(u=>u.key==='orc_warrior').length===10&&R.state.units.every(u=>u.maxHp===R.UNITS[u.key].hp&&u.damage===R.UNITS[u.key].damage&&u.range===R.UNITS[u.key].range)&&[R.P,R.E].every(c=>!Object.keys(c.normal).length&&!c.legends.size)}));
  const poses=await page.evaluate(()=>{
   const R=__ROADLORDS_RUNTIME__,Q=R.ROAD,units=['swordsman','spearman','orc_warrior'].map(key=>R.state.units.find(u=>u.key===key));
   const hash=c=>{let n=0;for(const b of c.getContext('2d').getImageData(0,0,c.width,c.height).data)n=(Math.imul(n,31)+b)>>>0;return n};
   const sprite=(u,state,frame)=>{
    const actor={...u,lane:Q.camera+350,offset:0,roadFace:1,roadMoving:state==='walk',roadWalk:(frame+.1)/8*Math.PI*2-u.id*.73,roadAttack:null,death:10-(frame+.1)/6*.6};Q.clock=10;
    if(state==='attack'){actor.roadAttack={start:9,launch:10,hit:10,end:10.4,recovery:.4,to:actor.lane+u.range};Q.clock=frame<4?9+(frame+.1)/4*.915:frame<7?9.915+(frame-4+.1)/3*.085:10+(frame-7+.1)/5*.4;}
    R.roadDrawUnit(actor,state==='death');const p=R.battleFigurePose(actor,Q.clock,state==='death');return Q.sprites.get(`figure:${u.key}:${R.unitTeamFill(actor)}:${p.state}:${p.frame}:painted-${u.key==='orc_warrior'?'orc':'human'}${u.veteran?':elite':''}`);
   };
   const result={units:{}},gallery=document.createElement('canvas');gallery.width=1440;gallery.height=1100;const g=gallery.getContext('2d');g.fillStyle='#21352a';g.fillRect(0,0,1440,1100);g.fillStyle='#eedbaa';g.font='16px Arial';
   for(const [ui,u]of units.slice(0,2).entries()){
    const checks={};
    for(const [row,[state,count]]of [['idle',1],['walk',8],['attack',12],['death',6]].entries()){
     const hashes=[];g.fillText(u.key+' / '+state,12,ui*550+row*135+23);
     for(let i=0;i<count;i++){const s=sprite(u,state,i);hashes.push(hash(s));if(i%Math.max(1,Math.floor(count/6))===0)g.drawImage(s,170+Math.floor(i/Math.max(1,Math.floor(count/6)))*150,ui*550+row*135,150,150);}
     checks[state]=new Set(hashes).size;
    }
    checks.eliteChanges=hash(sprite({...u,veteran:true},'idle',0))!==hash(sprite(u,'idle',0));
    checks.shield=sprite(u,'idle',0).figureRig.shield;
    let face;checks.facesStable=true;checks.colors=[];
    for(const [color]of __ROADLORDS_UNIT_COLORS__.palette){R.P.unitColor=color;const s=sprite(u,'idle',0),b=s.figureBounds,k=s.width/b[2],pixels=s.getContext('2d').getImageData(Math.round((1-b[0])*k),Math.round((-38-b[1])*k),Math.round(4*k),Math.round(5*k)).data,value=Array.from(pixels).join(',');face??=value;checks.facesStable&&=face===value&&pixels.some((v,i)=>i%4===3&&v>100);checks.colors.push(hash(s));}R.P.unitColor='blue';result.units[u.key]=checks;
   }
   result.gallery=gallery.toDataURL();
   const spearman=units[1];result.twoHands=true;
   for(let frame=0;frame<12;frame++){const rig=sprite(spearman,'attack',frame).figureRig,[a,b]=rig.hands,angle=rig.weapon[2],dx=b[0]-a[0],dy=b[1]-a[1];result.twoHands&&=!rig.shield&&rig.hands.length===2&&Math.abs(dx*Math.cos(angle)+dy*Math.sin(angle))<1e-7&&Math.abs(Math.hypot(dx,dy)-13.92)<1e-7;}
   const preview=document.createElement('canvas');preview.width=1440;preview.height=760;const c=preview.getContext('2d');c.fillStyle='#14231c';c.fillRect(0,0,1440,760);c.textAlign='center';c.fillStyle='#f1dca8';c.font='bold 29px Arial';c.fillText('KARDOS ÉS LÁNDZSÁS — JÁTÉKBELI MODELLEK',720,47);c.fillStyle='#bbcabd';c.font='17px Arial';c.fillText('Tényleges modellek · azonos lépték, nagyítva és kis méretben',720,80);
   for(const [i,u]of units.entries()){
    const x=240+i*480,s=sprite(u,'idle',0),b=s.figureBounds;c.fillStyle='#22382b';c.beginPath();c.roundRect(20+i*480,110,440,610,18);c.fill();c.fillStyle='#edd7a3';c.font='bold 23px Arial';c.fillText(['Kardos','Lándzsás · pajzs nélkül','Ork Harcos'][i],x,149);c.drawImage(s,x+b[0]*3.8,480+b[1]*3.8,b[2]*3.8,b[3]*3.8);c.drawImage(s,x+b[0]*1.15,655+b[1]*1.15,b[2]*1.15,b[3]*1.15);
   }
   result.preview=preview.toDataURL();result.cache=Q.sprites.size;result.clothCache=R.humanInfantryClothCache.size;return result;
  });
  for(const [field,name]of [['gallery','human-infantry-poses.png'],['preview','human-infantry-in-game.png']]){fs.writeFileSync('artifacts/'+name,Buffer.from(poses[field].split(',')[1],'base64'));delete poses[field];}report.poses=poses;
  check('Both figures have distinct moving, attacking and death poses in the bounded sprite cache',Object.values(poses.units).every(u=>u.idle===1&&u.walk>=6&&u.attack>=9&&u.death===6)&&poses.cache<=768);
  check('The Spearman uses two hands aligned with the shaft throughout the thrust and has no shield',poses.twoHands&&!poses.units.spearman.shield&&poses.units.swordsman.shield);
  check('All eight team colours preserve visible faces, distinguish elites and use one bounded cloth cache',Object.values(poses.units).every(u=>new Set(u.colors).size===8&&u.facesStable&&u.eliteChanges)&&poses.clothCache<=8);
  const hits=await page.evaluate(()=>{
   const R=__ROADLORDS_RUNTIME__,Q=R.ROAD,results=[];
   for(const key of ['swordsman','spearman']){const u=R.state.units.find(u=>u.key===key),target=R.state.units.find(u=>u.key==='orc_warrior');Q.clock=0;u.lane=4700;u.offset=0;target.lane=4700+u.range;target.offset=0;target.hp=target.maxHp=10000;target.shield=target.tempShield=0;R.roadReindex();R.attackUnit(u,target);const a=u.roadAttack;Q.clock=a.hit-.001;R.roadImpacts();const early=target.hp===10000;Q.clock=a.hit+.001;R.roadImpacts();const hp=target.hp;R.roadDrawUnit(u);const p=R.battleFigurePose(u,Q.clock),rig=Q.sprites.get(`figure:${key}:${R.unitTeamFill(u)}:attack:${p.frame}:painted-human`).figureRig;R.roadImpacts();results.push({key,early,once:target.hp===hp,damage:10000-hp,expected:u.damage,contact:p.contact,angle:rig.weapon[2]});}return results;
  });report.hits=hits;
  check('Sword and spear contact resolve the original real damage once, without early hits',hits.every(h=>h.early&&h.once&&h.damage===h.expected&&h.contact&&h.angle>1.3));
  await page.locator('#roadFigureToggle').click();check('A/B comparison preserves twenty units and the simpler Spearman also has no shield',await page.evaluate(()=>{const R=__ROADLORDS_RUNTIME__,Q=R.ROAD,u={...R.state.units.find(u=>u.key==='spearman'),lane:Q.camera+300,offset:0,roadAttack:null,roadMoving:false};R.roadDrawUnit(u);return Q.figureStyle==='simple'&&R.state.units.length===20&&Q.sprites.get('figure:spearman:'+R.unitTeamFill(u)+':idle:0').figureRig.shield===null}));
  await page.locator('#roadFigureToggle').click();await page.locator('#roadRestart').click();await page.evaluate(()=>__ROADLORDS_RUNTIME__.roadPause());
  check('Restart retains the mixed infantry roster and selected graphics',await page.evaluate(()=>__ROADLORDS_RUNTIME__.ROAD.testRoster==='infantry'&&__ROADLORDS_RUNTIME__.ROAD.figureStyle==='painted'&&__ROADLORDS_RUNTIME__.state.units.filter(u=>u.key==='spearman').length===5));
  await page.evaluate(()=>{const R=__ROADLORDS_RUNTIME__;for(let i=0;i<180&&!R.state.ended;i++){R.updateBattle(1/30);R.renderBattle(1/30)}R.roadFocusFront();R.updateHud();R.renderBattle(0)});await page.screenshot({path:'artifacts/human-infantry-combat.png'});
  const battle=await page.evaluate(()=>{const R=__ROADLORDS_RUNTIME__;for(let i=0;i<720&&!R.state.ended;i++){R.updateBattle(1/30);R.renderBattle(1/30)}return {damage:R.ROAD.metrics.damage,attacks:R.ROAD.metrics.attacks,living:R.state.units.filter(u=>u.alive).length,cache:R.ROAD.sprites.size,finite:R.state.units.every(u=>Number.isFinite(u.hp)&&Number.isFinite(u.lane))}});report.battle=battle;
  check('Real mixed infantry combat deals damage and kills units without invalid state or unbounded sprites',battle.damage>1000&&battle.attacks>20&&battle.living<20&&battle.finite&&battle.cache<=768);
  const m=JSON.parse(fs.readFileSync('src/data/human-infantry-art.json'));check('Original shared atlas is preserved with valid part rectangles',crypto.createHash('sha256').update(fs.readFileSync('public/'+m.file)).digest('hex')===m.sha256&&Object.values(m.parts).every(([x,y,w,h])=>x>=0&&y>=0&&x+w<=m.width&&y+h<=m.height)&&m.spearmanShield===false);
  await Promise.all([page.waitForEvent('domcontentloaded'),page.locator('#roadMenu').click()]);await page.waitForFunction(()=>!!window.__ROADLORDS_RUNTIME__);check('Return to main menu works',await page.evaluate(()=>!__ROADLORDS_RUNTIME__.ROAD.test));check('No browser errors',!report.errors.length);
 }finally{fs.writeFileSync('artifacts/human-infantry-figures.json',JSON.stringify(report,null,2));await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
