const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto');
const URL=process.env.ROADLORDS_TEST_URL||'http://127.0.0.1:4173/Roadlords/';
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox','--disable-dev-shm-usage']});
 const report={checks:[],errors:[]},check=(name,ok)=>{assert(ok,name);report.checks.push(name);console.log('PASS',name)};fs.mkdirSync('artifacts',{recursive:true});
 try{
  const page=await browser.newPage({viewport:{width:1600,height:1000}});await page.route('https://**/*',r=>r.abort());page.on('pageerror',e=>report.errors.push(e.message));
  await page.goto(URL);await page.waitForFunction(()=>!!window.__ROADLORDS_RUNTIME__);
  check('New Orc atlas stays unloaded in the normal menu',await page.evaluate(()=>!performance.getEntriesByType('resource').some(r=>r.name.includes('orc-raiders-heroes-parts'))));
  await page.locator('.menuBrand').click();await page.waitForTimeout(900);await page.locator('#roadTestsMenu').click();
  check('Only Casters and Orc Raiders trials remain visible',await page.locator('.roadTestsList button').count()===2&&await page.locator('#roadCastersMenu').isVisible()&&await page.locator('#roadOrcRaidersMenu').isVisible()&&await page.locator('#roadArcherMenu').count()===0);
  await page.locator('#roadOrcRaidersMenu').click();await page.waitForFunction(()=>__ROADLORDS_RUNTIME__.ROAD.testRoster==='orc-raiders');await page.evaluate(()=>__ROADLORDS_RUNTIME__.roadPause());
  check('One click starts five base Berserkers and five Goblins against five Swordsmen and five Spearmen',await page.evaluate(()=>{const R=__ROADLORDS_RUNTIME__;return R.P.race==='orc'&&R.E.race==='human'&&R.state.units.length===20&&['orc_berserker','orc_goblin','swordsman','spearman'].every(key=>R.state.units.filter(u=>u.key===key).length===5)&&R.state.units.every(u=>u.maxHp===R.UNITS[u.key].hp&&u.damage===R.UNITS[u.key].damage)&&[R.P,R.E].every(c=>!Object.keys(c.normal).length&&!c.legends.size)}));
  const poses=await page.evaluate(()=>{
   const R=__ROADLORDS_RUNTIME__,Q=R.ROAD,bers=R.state.units.find(u=>u.key==='orc_berserker'),gob=R.state.units.find(u=>u.key==='orc_goblin');
   const hash=c=>{let n=0;for(const b of c.getContext('2d').getImageData(0,0,c.width,c.height).data)n=(Math.imul(n,31)+b)>>>0;return n};
   const sprite=(u,state,frame,variant)=>{
    if(variant==='bow')R.P.legends.add('orc_gob_bow');else R.P.legends.delete('orc_gob_bow');
    const actor={...u,lane:Q.camera+350,offset:0,roadFace:1,roadMoving:state==='walk',roadWalk:(frame+.1)/8*Math.PI*2-u.id*.73,roadAttack:null,roadAttacks:variant==='near'?1:2,death:10-(frame+.1)/6*.6};Q.clock=10;
    if(state==='attack'){actor.roadAttack={start:9,launch:10,hit:u.key==='orc_goblin'?10.2:10,end:10.44,recovery:.24,to:actor.lane+150};Q.clock=frame<4?9+(frame+.1)/4*.915:frame<7?9.915+(frame-4+.1)/3*.085:10+(frame-7+.1)/5*.24;}
    R.roadDrawUnit(actor,state==='death');const p=R.battleFigurePose(actor,Q.clock,state==='death');return Q.sprites.get(`figure:${u.key}:${R.unitTeamFill(actor)}:${p.state}:${p.frame}:painted-raider:${variant}${u.veteran?':elite':''}`);
   };
   const result={units:{}},gallery=document.createElement('canvas');gallery.width=1500;gallery.height=1320;const g=gallery.getContext('2d');g.fillStyle='#21352a';g.fillRect(0,0,1500,1320);g.fillStyle='#eedbaa';g.font='16px Arial';
   for(const [ui,[u,variant]]of [[bers,'near'],[gob,'sling']].entries()){
    const checks={neckAligned:true,armsReach:true};
    for(const [row,[state,count]]of [['idle',1],['walk',8],['attack',12],['death',6]].entries()){
     const hashes=[];g.fillText(u.key+' / '+state,12,ui*660+row*150+24);
     for(let i=0;i<count;i++){const s=sprite(u,state,i,variant),rig=s.figureRig;hashes.push(hash(s));checks.neckAligned&&=rig.neck.every((v,j)=>Math.abs(v-rig.collar[j])<1e-8);checks.armsReach&&=Object.entries(rig.arms).every(([side,a])=>Math.hypot(a.wrist[0]-a.shoulder[0],a.wrist[1]-a.shoulder[1])<=(side==='far'?15.9:14.4)+1e-6);
      if(i%Math.max(1,Math.floor(count/6))===0)g.drawImage(s,190+Math.floor(i/Math.max(1,Math.floor(count/6)))*170,ui*660+row*150,180,180);
     }checks[state]=new Set(hashes).size;
    }
    checks.eliteChanges=hash(sprite({...u,veteran:true},'idle',0,variant))!==hash(sprite(u,'idle',0,variant));
    checks.colours=[];let face;checks.skinStable=true;
    for(const [color]of __ROADLORDS_UNIT_COLORS__.palette){R.P.unitColor=color;const s=sprite(u,'idle',0,variant),b=s.figureBounds,k=s.width/b[2],factor=rigScale(u.key),pixels=s.getContext('2d').getImageData(Math.round((0*factor-b[0])*k),Math.round((-39*factor-b[1])*k),Math.round(3*factor*k),Math.round(3*factor*k)).data,value=Array.from(pixels).join(',');face??=value;checks.skinStable&&=face===value&&pixels.some((v,i)=>i%4===3&&v>100);checks.colours.push(hash(s));}R.P.unitColor='blue';result.units[u.key]=checks;
   }
   function rigScale(key){return key==='orc_goblin'?.78:1}
   result.twoAxes=true;for(const variant of ['near','far'])for(let i=0;i<12;i++){const rig=sprite(bers,'attack',i,variant).figureRig;result.twoAxes&&=rig.axes.length===2&&rig.handRoles.near==='axe'&&rig.handRoles.far==='axe'&&rig.axes.every((a,j)=>a.hand.every((n,k)=>Math.abs(n-rig.hands[j][k])<1e-8));}
   result.leadsDiffer=hash(sprite(bers,'attack',3,'near'))!==hash(sprite(bers,'attack',3,'far'));
   result.slingLoaded=sprite(gob,'attack',6,'sling').figureRig;result.slingReleased=sprite(gob,'attack',7,'sling').figureRig;result.slingLaunch=R.goblinLaunchPoint(false);
   result.bowLoaded=sprite(gob,'attack',6,'bow').figureRig;result.bowReleased=sprite(gob,'attack',7,'bow').figureRig;result.bowLaunch=R.goblinLaunchPoint(true);R.P.legends.delete('orc_gob_bow');
   const preview=document.createElement('canvas');preview.width=1600;preview.height=760;const c=preview.getContext('2d');c.fillStyle='#14231c';c.fillRect(0,0,1600,760);c.textAlign='center';c.fillStyle='#f1dca8';c.font='bold 28px Arial';c.fillText('DÜHÖNGŐ ÉS GOBLIN — JÁTÉKBELI MODELLEK',800,47);c.fillStyle='#bbcabd';c.font='17px Arial';c.fillText('Tényleges figurák · azonos lépték, nagyítva és kis méretben',800,80);
   for(const [i,[u,state,frame,variant]]of [[bers,'idle',0,'near'],[bers,'attack',6,'near'],[gob,'idle',0,'sling'],[gob,'attack',6,'bow']].entries()){
    const x=200+i*400,s=sprite(u,state,frame,variant),b=s.figureBounds;c.fillStyle='#22382b';c.beginPath();c.roundRect(15+i*400,110,370,610,18);c.fill();c.fillStyle='#edd7a3';c.font='bold 23px Arial';c.fillText(['Dühöngő · alapállás','Dühöngő · támadás','Goblin · parittya','Goblin · íjfejlesztés'][i],x,149);c.drawImage(s,x+b[0]*5.3,500+b[1]*5.3,b[2]*5.3,b[3]*5.3);c.drawImage(s,x+b[0]*1.2,655+b[1]*1.2,b[2]*1.2,b[3]*1.2);
   }
   R.P.legends.delete('orc_gob_bow');result.gallery=gallery.toDataURL();result.preview=preview.toDataURL();result.cache=Q.sprites.size;result.clothCache=R.orcRaidersClothCache.size;return result;
  });
  for(const [field,name]of [['gallery','orc-raiders-poses.png'],['preview','orc-raiders-in-game.png']]){fs.writeFileSync('artifacts/'+name,Buffer.from(poses[field].split(',')[1],'base64'));delete poses[field];}report.poses=poses;
  check('Both Orcs have distinct walk, attack and death poses with aligned necks and bounded caches',Object.values(poses.units).every(u=>u.walk>=6&&u.attack>=9&&u.death===6&&u.neckAligned&&u.armsReach)&&poses.cache<=768);
  check('All eight team colours preserve visible skin and distinguish elites',Object.values(poses.units).every(u=>new Set(u.colours).size===8&&u.skinStable&&u.eliteChanges)&&poses.clothCache<=8);
  check('Both axes stay attached to their own hands and alternating strikes have distinct poses',poses.twoAxes&&poses.leadsDiffer);
  check('Sling and bow release from their actual last loaded payload positions at the smaller Goblin scale',[['sling','slingLaunch'],['bow','bowLaunch']].every(([key,launch])=>poses[key+'Loaded'].loaded&&!poses[key+'Released'].loaded&&poses[key+'Loaded'].payload.every((n,i)=>Math.abs(n*.78-poses[launch][i])<1e-7)));
  const melee=await page.evaluate(()=>{
   const R=__ROADLORDS_RUNTIME__,Q=R.ROAD,u=R.state.units.find(u=>u.key==='orc_berserker'),target=R.state.units.find(u=>u.key==='swordsman');u.roadAttacks=0;u.lane=4700;u.offset=0;target.lane=4730;target.offset=0;target.hp=target.maxHp=10000;target.shield=target.tempShield=0;const results=[];R.roadReindex();
   for(let i=0;i<2;i++){Q.clock=20+i*2;u.roadPending=false;R.attackUnit(u,target);const a=u.roadAttack,before=target.hp;Q.clock=a.hit-.001;R.roadImpacts();const early=target.hp===before;Q.clock=a.hit+.001;R.roadImpacts();const hp=target.hp;R.roadImpacts();R.roadDrawUnit(u);const pose=R.battleFigurePose(u,Q.clock),variant=u.roadAttacks%2?'near':'far',rig=Q.sprites.get(`figure:${u.key}:${R.unitTeamFill(u)}:attack:${pose.frame}:painted-raider:${variant}`).figureRig;results.push({early,damage:before-hp,expected:u.damage,once:target.hp===hp,variant,contact:pose.contact,angle:rig.axes[variant==='near'?1:0].angle});}return results;
  });report.melee=melee;
  check('Alternating axes keep one real damage event per attack, exactly on contact',melee.every(m=>m.early&&m.once&&m.damage===m.expected&&m.contact&&m.angle>1.3)&&melee[0].variant!==melee[1].variant);
  const shots=await page.evaluate(()=>{
   const R=__ROADLORDS_RUNTIME__,Q=R.ROAD,results=[];for(const bow of [false,true]){
    R.roadStartTest(42,{count:10,roster:'orc-raiders'});R.roadPause();if(bow){R.P.legends.add('orc_gob_bow');R.refreshExistingUnitsForCity(R.P);}const u=R.state.units.find(u=>u.key==='orc_goblin'),v=R.state.units.find(u=>u.key==='swordsman');Q.clock=20;u.lane=4700;u.offset=0;v.lane=4800;v.offset=0;v.hp=v.maxHp=10000;v.shield=v.tempShield=0;R.roadReindex();R.attackUnit(u,v);const a=u.roadAttack;
    Q.clock=a.launch+.001;R.roadImpacts();const noLaunchDamage=v.hp===10000;const canvas=document.createElement('canvas');canvas.width=Q.w;canvas.height=Q.h;const old=R.ctx;R.ctx=canvas.getContext('2d');R.roadDrawShots();R.ctx=old;const pos=R.goblinProjectilePoint(a,.001/(a.hit-a.launch)),s=pos.scale,pixels=canvas.getContext('2d').getImageData(Math.round(pos.x-7*s),Math.round(pos.y-7*s),Math.round(14*s),Math.round(14*s)).data.filter((v,i)=>i%4===3&&v>50).length;
    const paths=[1,-1].every(face=>{const b={...a,goblinFace:face},p0=R.goblinProjectilePoint(b,0),p1=R.goblinProjectilePoint(b,1),from=R.pointAt(a.lane,a.offset),to=R.pointAt(a.to,a.toOffset),start=R.goblinLaunchPoint(bow);return Math.abs(p0.x-from.x-start[0]*s*face)<1e-8&&Math.abs(p0.y-from.y-start[1]*s)<1e-8&&Math.abs(p1.x-to.x)<1e-8&&Math.abs(p1.y-to.y+13*s)<1e-8});
    Q.clock=a.hit-.001;R.roadImpacts();const early=v.hp===10000;Q.clock=a.hit+.001;R.roadImpacts();const hp=v.hp;R.roadImpacts();results.push({bow,noLaunchDamage,early,damage:10000-hp,expected:u.damage,once:v.hp===hp,pixels,paths,visualBow:a.goblinBow,range:u.range});
   }return results;
  });report.shots=shots;
  check('Goblin stones and upgraded arrows fly from the weapon and deal original damage once at impact',shots.every(s=>s.noLaunchDamage&&s.early&&s.damage===s.expected&&s.once&&s.pixels>5&&s.paths&&s.visualBow===s.bow)&&shots[1].damage>shots[0].damage&&shots[1].range>shots[0].range);
  await page.locator('#roadFigureToggle').click();check('A/B graphics preserves twenty units',await page.evaluate(()=>__ROADLORDS_RUNTIME__.ROAD.figureStyle==='simple'&&__ROADLORDS_RUNTIME__.state.units.length===20));await page.locator('#roadFigureToggle').click();await page.locator('#roadRestart').click();await page.evaluate(()=>__ROADLORDS_RUNTIME__.roadPause());
  check('Restart restores the base Orc pair and selected graphics',await page.evaluate(()=>__ROADLORDS_RUNTIME__.ROAD.testRoster==='orc-raiders'&&__ROADLORDS_RUNTIME__.ROAD.figureStyle==='painted'&&!__ROADLORDS_RUNTIME__.P.legends.size));
  const frenzy=await page.evaluate(()=>{const R=__ROADLORDS_RUNTIME__,Q=R.ROAD,u=R.state.units.find(u=>u.key==='orc_berserker');u.hp=u.maxHp*.5;u.cooldown=100;R.updateBattle(.01);const wounded=u.cooldownTime;u.hp=u.maxHp;R.updateBattle(.01);return {wounded,healthy:u.cooldownTime}});report.frenzy=frenzy;check('Existing wounded Berserker attack-speed acceleration is preserved',frenzy.wounded<frenzy.healthy);
  await page.evaluate(()=>{const R=__ROADLORDS_RUNTIME__;R.roadStartTest(42,{count:10,roster:'orc-raiders'});R.roadPause();for(let i=0;i<240;i++){R.updateBattle(1/30);R.renderBattle(1/30)}R.roadFocusFront();R.updateHud();R.renderBattle(0)});await page.screenshot({path:'artifacts/orc-raiders-combat.png'});
  const battle=await page.evaluate(()=>{const R=__ROADLORDS_RUNTIME__;for(let i=0;i<660;i++){R.updateBattle(1/30);R.renderBattle(1/30)}return {damage:R.ROAD.metrics.damage,attacks:R.ROAD.metrics.attacks,living:R.state.units.filter(u=>u.alive).length,cache:R.ROAD.sprites.size,finite:R.state.units.every(u=>Number.isFinite(u.hp)&&Number.isFinite(u.lane))}});report.battle=battle;
  check('Mixed real combat deals damage and kills units without invalid values or unbounded sprites',battle.damage>500&&battle.attacks>20&&battle.living<20&&battle.finite&&battle.cache<=768);
  const m=JSON.parse(fs.readFileSync('src/data/orc-raiders-art.json'));check('Original Orc atlas is unchanged and part rectangles are valid',crypto.createHash('sha256').update(fs.readFileSync('public/'+m.file)).digest('hex')===m.sha256&&Object.values(m.parts).every(([x,y,w,h])=>x>=0&&y>=0&&x+w<=m.width&&y+h<=m.height));
  await page.setViewportSize({width:1280,height:800});await page.waitForTimeout(150);await page.locator('#roadRestart').click();await page.evaluate(()=>__ROADLORDS_RUNTIME__.roadPause());
  check('Both armies fit the smaller 1280 by 800 viewport',await page.evaluate(()=>{const R=__ROADLORDS_RUNTIME__,Q=R.ROAD;R.renderBattle(0);const s=Q.h/600*Q.zoom,free=R.roadWar.clientWidth-(Q.enemyPinned?Q.city+24:0);return R.state.units.every(u=>{const p=R.pointAt(u.lane,u.offset);return p.x-30*s>=0&&p.x+35*s<=free&&p.y-55*s>=0&&p.y+5*s<=Q.h})}));
  await Promise.all([page.waitForEvent('domcontentloaded'),page.locator('#roadMenu').click()]);await page.waitForFunction(()=>!!window.__ROADLORDS_RUNTIME__);check('Return to main menu works and no browser errors',await page.evaluate(()=>!__ROADLORDS_RUNTIME__.ROAD.test)&&!report.errors.length);
 }finally{fs.writeFileSync('artifacts/orc-raiders-figures.json',JSON.stringify(report,null,2));await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
