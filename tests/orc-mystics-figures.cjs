const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto');
const URL=process.env.ROADLORDS_TEST_URL||'http://127.0.0.1:4173/Roadlords/';
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox','--disable-dev-shm-usage']});
 const report={checks:[],errors:[]},check=(name,ok)=>{assert(ok,name);report.checks.push(name);console.log('PASS',name)};fs.mkdirSync('artifacts',{recursive:true});
 try{
  const page=await browser.newPage({viewport:{width:1600,height:1000}});await page.route('https://**/*',r=>r.abort());page.on('pageerror',e=>report.errors.push(e.message));
  await page.goto(URL);await page.waitForFunction(()=>!!window.__ROADLORDS_RUNTIME__);
  check('Shaman and Troll atlas stays unloaded in the normal menu',await page.evaluate(()=>!performance.getEntriesByType('resource').some(r=>r.name.includes('orc-mystics-heroes-parts'))));
  await page.locator('.menuBrand').click();await page.waitForTimeout(900);await page.locator('#roadTestsMenu').click();
  check('Only the two current Orc trials remain visible',await page.locator('.roadTestsList button').count()===2&&await page.locator('#roadOrcMysticsMenu').isVisible()&&await page.locator('#roadOrcRaidersMenu').isVisible()&&await page.locator('#roadCastersMenu').count()===0);
  await page.locator('#roadOrcMysticsMenu').click();await page.waitForFunction(()=>__ROADLORDS_RUNTIME__.ROAD.testRoster==='orc-mystics');await page.evaluate(()=>__ROADLORDS_RUNTIME__.roadPause());
  check('One click starts five Trolls and five Shamans against five Swordsmen and five Spearmen with base stats',await page.evaluate(()=>{const R=__ROADLORDS_RUNTIME__;return R.state.units.length===20&&Object.entries({orc_shaman:5,orc_troll:5,swordsman:5,spearman:5}).every(([key,n])=>R.state.units.filter(u=>u.key===key).length===n)&&R.state.units.every(u=>u.maxHp===R.UNITS[u.key].hp&&u.damage===R.UNITS[u.key].damage)&&[R.P,R.E].every(c=>!Object.keys(c.normal).length&&!c.legends.size)}));
  const poses=await page.evaluate((armManifest)=>{
   const R=__ROADLORDS_RUNTIME__,Q=R.ROAD,units=['orc_shaman','orc_troll'].map(key=>R.state.units.find(u=>u.key===key));
   const hash=c=>{let n=0;for(const b of c.getContext('2d').getImageData(0,0,c.width,c.height).data)n=(Math.imul(n,31)+b)>>>0;return n};
   const sprite=(u,state,frame)=>{
    const actor={...u,lane:Q.camera+350,offset:0,roadFace:1,roadMoving:state==='walk',roadWalk:(frame+.1)/8*Math.PI*2-u.id*.73,roadAttack:null,death:10-(frame+.1)/6*.6};Q.clock=10;
    if(state==='attack'){actor.roadAttack={start:9,launch:10,hit:10.3,end:10.54,recovery:.24,to:actor.lane+150};Q.clock=frame<4?9+(frame+.1)/4*.915:frame<7?9.915+(frame-4+.1)/3*.085:10+(frame-7+.1)/5*.24;}
    R.roadDrawUnit(actor,state==='death');const p=R.battleFigurePose(actor,Q.clock,state==='death');return Q.sprites.get(`figure:${u.key}:${R.unitTeamFill(actor)}:${p.state}:${p.frame}:painted-mystic${u.veteran?':elite':''}`);
   };
   const result={units:{}},gallery=document.createElement('canvas');gallery.width=1600;gallery.height=1250;const g=gallery.getContext('2d');g.fillStyle='#21352a';g.fillRect(0,0,1600,1250);g.fillStyle='#eedbaa';g.font='16px Arial';
   for(const [ui,u]of units.entries()){
    const checks={aligned:true,reachable:true,finite:true,bounds:true};
    for(const [row,[state,count]]of [['idle',1],['walk',8],['attack',12],['death',6]].entries()){
     const hashes=[];g.fillText(u.key+' / '+state,12,ui*620+row*150+23);
     for(let i=0;i<count;i++){
      const s=sprite(u,state,i),r=s.figureRig;hashes.push(hash(s));if(i%Math.max(1,Math.floor(count/6))===0)g.drawImage(s,180+Math.floor(i/Math.max(1,Math.floor(count/6)))*200,ui*620+row*150,190,190);
      checks.aligned&&=r.neck.every((v,j)=>Math.abs(v-r.collar[j])<1e-8)&&r.waist.every((v,j)=>Math.abs(v-r.pelvis[j])<1e-8)&&r.hips[0].every((v,j)=>Math.abs((v+r.hips[1][j])/2-r.pelvis[j])<1e-8)&&Math.abs((r.feet[0][0]+r.feet[1][0])/2-r.pelvis[0])<1e-8;
      checks.reachable&&=Object.values(r.arms).every(a=>Math.abs(Math.hypot(a.elbow[0]-a.shoulder[0],a.elbow[1]-a.shoulder[1])-r.armLengths[0])<1e-5&&Math.abs(Math.hypot(a.wrist[0]-a.elbow[0],a.wrist[1]-a.elbow[1])-r.armLengths[1])<1e-5);
      checks.finite&&=Object.values(r.arms).every(a=>Object.values(a).flat().every(Number.isFinite));checks.roles=r.handRoles.weapon===(u.key==='orc_troll'?'far':'near')&&r.handRoles.free===(u.key==='orc_troll'?'near':'far');
      checks.shouldersAligned??=true;if(u.key==='orc_shaman')checks.shouldersAligned&&=r.torsoShoulders.every((p,i)=>p.every((v,j)=>Math.abs(v-r.arms[i?'near':'far'].shoulder[j])<1e-8));
      checks.grounded??=true;if(u.key==='orc_troll'&&(state==='idle'||state==='walk'||state==='attack'&&(i===6||i===7)))checks.grounded&&=Math.abs(r.groundContact[1]-1.5)<1e-8;
      const pixels=s.getContext('2d').getImageData(0,0,s.width,s.height).data;
      for(let k=0;k<s.width;k++)for(const at of [k,k*s.width,k*s.width+s.width-1,(s.height-1)*s.width+k])if(pixels[at*4+3]>50)checks.bounds=false;
     }checks[state]=new Set(hashes).size;
    }
    // Compare actual pixels with a diagnostic atlas that hides both arm parts.
    // Joint metadata alone cannot detect a forearm covered by the torso.
    checks.visibleArmPixels=[];
    const source=R.orcMysticsTexture,blank=document.createElement('canvas');blank.width=source.naturalWidth;blank.height=source.naturalHeight;blank.naturalWidth=blank.width;const bg=blank.getContext('2d');bg.drawImage(source,0,0);const prefix=u.key==='orc_troll'?'tr':'sh';for(const name of [prefix+'Upper',prefix+'Fore'])bg.clearRect(...armManifest.parts[name]);
    for(const [state,frame]of [['idle',0],['attack',6]]){
     R.orcMysticsTexture=blank;Q.sprites.clear();const without=sprite(u,state,frame);R.orcMysticsTexture=source;Q.sprites.clear();const full=sprite(u,state,frame),rig=full.figureRig;
     for(const arm of Object.values(rig.arms))for(const [a,b]of [[arm.shoulder,arm.elbow],[arm.elbow,arm.wrist]]){
      const factor=rig.modelScale,bounds=full.figureBounds,k=full.width/bounds[2],x=((a[0]+b[0])/2*factor-bounds[0])*k,y=((a[1]+b[1])/2*factor-bounds[1])*k,r=2.5*factor*k,rect=[Math.round(x-r),Math.round(y-r),Math.round(r*2),Math.round(r*2)],p=full.getContext('2d').getImageData(...rect).data,q=without.getContext('2d').getImageData(...rect).data;let changed=0;for(let j=0;j<p.length;j+=4)if(Math.abs(p[j]-q[j])+Math.abs(p[j+1]-q[j+1])+Math.abs(p[j+2]-q[j+2])+Math.abs(p[j+3]-q[j+3])>40)changed++;checks.visibleArmPixels.push(changed);
     }
    }
    checks.elite=hash(sprite({...u,veteran:true},'idle',0))!==hash(sprite(u,'idle',0));checks.colors=[];checks.skinStable=true;let skin;
    for(const [color]of __ROADLORDS_UNIT_COLORS__.palette){R.P.unitColor=color;const s=sprite(u,'idle',0),b=s.figureBounds,k=s.width/b[2],x=(u.key==='orc_troll'?7:6)*s.figureRig.modelScale,y=(u.key==='orc_troll'?-35:-34)*s.figureRig.modelScale,px=s.getContext('2d').getImageData(Math.round((x-b[0])*k),Math.round((y-b[1])*k),2,2).data,value=Array.from(px).join(',');skin??=value;checks.skinStable&&=skin===value;checks.colors.push(hash(s));}R.P.unitColor='blue';result.units[u.key]=checks;
   }
   result.launch=sprite(units[0],'attack',6).figureRig.weaponTip;result.expectedLaunch=R.shamanLaunchPoint();result.loaded=sprite(units[0],'attack',6).figureRig.loaded;result.released=sprite(units[0],'attack',7).figureRig.loaded;result.clubContact=sprite(units[1],'attack',7).figureRig.weaponAngle;
   const preview=document.createElement('canvas');preview.width=2000;preview.height=760;const c=preview.getContext('2d');c.fillStyle='#14231c';c.fillRect(0,0,2000,760);c.textAlign='center';c.fillStyle='#f1dca8';c.font='bold 28px Arial';c.fillText('SÁMÁN ÉS TROLL — JÁTÉKBELI MODELLEK',1000,47);c.fillStyle='#bbcabd';c.font='17px Arial';c.fillText('Tényleges modellek · azonos lépték, nagyítva és kis méretben',1000,80);
   for(const [i,[u,state,frame]]of [[units[0],'idle',0],[units[0],'attack',6],[units[1],'idle',0],[units[1],'attack',3],[units[1],'attack',6]].entries()){
    const x=200+i*400+(i===2?95:i===3?20:i===4?-70:0),s=sprite(u,state,frame),b=s.figureBounds;c.fillStyle='#22382b';c.beginPath();c.roundRect(15+i*400,110,370,610,18);c.fill();c.fillStyle='#edd7a3';c.font='bold 23px Arial';c.fillText(['Sámán · alapállás','Sámán · átok','Troll · húzás','Troll · lendítés','Troll · becsapódás'][i],200+i*400,149);c.drawImage(s,x+b[0]*3.5,515+b[1]*3.5,b[2]*3.5,b[3]*3.5);c.drawImage(s,x+b[0]*1.15,660+b[1]*1.15,b[2]*1.15,b[3]*1.15);
   }
   result.gallery=gallery.toDataURL();result.preview=preview.toDataURL();result.cache=Q.sprites.size;result.clothCache=R.orcMysticsClothCache.size;return result;
  },JSON.parse(fs.readFileSync('src/data/orc-mystics-art.json')));
  for(const [field,name]of [['gallery','orc-mystics-poses.png'],['preview','orc-mystics-in-game.png']]){fs.writeFileSync('artifacts/'+name,Buffer.from(poses[field].split(',')[1],'base64'));delete poses[field];}report.poses=poses;
  check('Both units have distinct walking, attack and death poses within sprite bounds',Object.values(poses.units).every(u=>u.walk>=6&&u.attack>=8&&u.death===6&&u.bounds)&&poses.cache<=768);
  check('Torso, hips, feet, neck and arm joints remain connected in every pose',Object.values(poses.units).every(u=>u.aligned&&u.reachable&&u.finite&&u.roles&&u.shouldersAligned&&u.grounded));
  check('Both upper arms and forearms remain visible in idle and impact poses',Object.values(poses.units).every(u=>u.visibleArmPixels.every(n=>n>4)));
  check('Eight team colors and elite trim remain distinct without changing skin materials',Object.values(poses.units).every(u=>new Set(u.colors).size===8&&u.skinStable&&u.elite)&&poses.clothCache<=8);
  check('Shaman releases from the loaded staff gem and Troll holds the impact pose at the damage frame',poses.launch.every((v,i)=>Math.abs(v-poses.expectedLaunch[i])<1e-8)&&poses.loaded&&!poses.released&&Math.abs(poses.clubContact-2.35)<1e-8);
  const timing=await page.evaluate(()=>{
   const R=__ROADLORDS_RUNTIME__,Q=R.ROAD,results=[];
   for(const key of ['orc_shaman','orc_troll']){
    R.roadStartTest(42,{count:10,roster:'orc-mystics'});R.roadPause();Q.clock=20;const u=R.state.units.find(u=>u.key===key),v=R.state.units.find(u=>u.key==='swordsman'),other=R.state.units.filter(u=>u.key==='swordsman')[1];
    for(const actor of R.state.units){actor.lane=6000;actor.offset=200;actor.roadAttack=null;actor.roadPending=false;}u.lane=4700;u.offset=0;v.lane=4700+(key==='orc_troll'?25:120);v.offset=0;other.lane=v.lane+8;other.offset=8;v.hp=other.hp=10000;v.maxHp=other.maxHp=100000;v.shield=v.tempShield=other.shield=other.tempShield=0;R.roadReindex();R.attackUnit(u,v);const a=u.roadAttack;
    Q.clock=a.hit-.001;R.roadImpacts();const early=v.hp===10000;let pixels=0,paths=true;
    if(key==='orc_shaman'){
     Q.clock=a.launch+.001;const canvas=document.createElement('canvas');canvas.width=Q.w;canvas.height=Q.h;const old=R.ctx;R.ctx=canvas.getContext('2d');R.roadDrawShots();R.ctx=old;const pos=R.shamanProjectilePoint(a,.001/(a.hit-a.launch)),s=pos.scale;pixels=canvas.getContext('2d').getImageData(Math.round(pos.x-8*s),Math.round(pos.y-8*s),Math.round(16*s),Math.round(16*s)).data.filter((v,i)=>i%4===3&&v>50).length;
     paths=[1,-1].every(face=>{const b={...a,shamanFace:face},p0=R.shamanProjectilePoint(b,0),p1=R.shamanProjectilePoint(b,1),from=R.pointAt(a.lane,a.offset),to=R.pointAt(a.to,a.toOffset),start=R.shamanLaunchPoint();return Math.abs(p0.x-from.x-start[0]*s*face)<1e-8&&Math.abs(p0.y-from.y-start[1]*s)<1e-8&&Math.abs(p1.x-to.x)<1e-8&&Math.abs(p1.y-to.y+13*s)<1e-8});
    }
    Q.clock=a.hit+.001;R.roadImpacts();const hp=v.hp;R.roadImpacts();results.push({key,early,damage:10000-hp,splash:10000-other.hp,once:hp===v.hp,cursed:Object.values(v.orcCurses||{}).some(n=>n>0),pixels,paths,impact:R.roadEffects.impacts.some(f=>f.start===a.hit&&f.kind===(key==='orc_troll'?'slam':'curse'))});
   }return results;
  });report.timing=timing;
  check('Shaman projectile deals eight damage once at impact and applies a real curse',timing[0].early&&timing[0].damage===8&&timing[0].once&&timing[0].cursed&&timing[0].pixels>10&&timing[0].paths&&timing[0].impact);
  check('Troll impact deals 110 primary and 35 splash damage once, with synchronized ground dust',timing[1].early&&timing[1].damage===110&&timing[1].splash===35&&timing[1].once&&timing[1].impact);
  const cracks=await page.evaluate(()=>{
   const R=__ROADLORDS_RUNTIME__,Q=R.ROAD,f=R.roadEffects.impacts.find(f=>f.kind==='slam'),canvas=document.createElement('canvas');canvas.width=Q.w;canvas.height=Q.h;const g=canvas.getContext('2d'),old=R.ctx;R.ctx=g;
   const count=()=>g.getImageData(0,0,canvas.width,canvas.height).data.filter((v,i)=>i%4===3&&v>30).length;
   Q.clock=f.start+1.5;R.roadDrawEffects();R.roadDrawGroundEffects();const persistent=count()>20&&R.roadEffects.impacts.includes(f);const saved=Q.clock;g.clearRect(0,0,canvas.width,canvas.height);R.roadDrawGroundEffects();const paused=count()>20&&Q.clock===saved;
   const u=R.state.units.find(u=>u.key==='orc_troll'),a=u.roadAttack,ground=R.trollGroundPoint(),aligned=Math.abs(f.lane-a.lane-ground[0]*Q.h/600)<1e-8;
   Q.clock=f.start+3.1;g.clearRect(0,0,canvas.width,canvas.height);R.roadDrawGroundEffects();R.roadDrawEffects();const expires=count()===0&&!R.roadEffects.impacts.includes(f);R.ctx=old;return {persistent,paused,expires,aligned};
  });report.cracks=cracks;
  check('Ground cracks follow the real club contact, persist while paused and expire after three seconds',cracks.persistent&&cracks.paused&&cracks.expires&&cracks.aligned);
  const quake=await page.evaluate(()=>{const R=__ROADLORDS_RUNTIME__,Q=R.ROAD;Q.clock=30;const u=R.state.units.find(u=>u.key==='orc_troll'),v=R.state.units.find(u=>u.key==='swordsman'),other=R.state.units.filter(u=>u.key==='swordsman')[1];R.P.levels.orc_troll=4;R.P.l4Branches.orc_troll='earthshaker';u.attackCount=2;u.roadAttack=null;u.roadPending=false;Q.pending=[];v.hp=other.hp=10000;other.lane=v.lane+100;other.offset=0;R.roadReindex();R.attackUnit(u,v);Q.clock=u.roadAttack.hit+.001;R.roadImpacts();return 10000-v.hp===110&&10000-other.hp===110&&v.stunTime>=1&&other.stunTime>=1&&R.roadEffects.impacts.some(f=>f.quake&&f.radius===137.5)});
  check('Earthshaker uses the existing every-third-hit splash radius and stun',quake);
  await page.locator('#roadFigureToggle').click();check('A/B graphics retains the same armies',await page.evaluate(()=>__ROADLORDS_RUNTIME__.ROAD.figureStyle==='simple'&&__ROADLORDS_RUNTIME__.state.units.length===20));await page.locator('#roadFigureToggle').click();await page.locator('#roadRestart').click();await page.evaluate(()=>__ROADLORDS_RUNTIME__.roadPause());
  check('Restart restores base stats and the selected trial style',await page.evaluate(()=>__ROADLORDS_RUNTIME__.ROAD.testRoster==='orc-mystics'&&__ROADLORDS_RUNTIME__.ROAD.figureStyle==='painted'&&Object.keys(__ROADLORDS_RUNTIME__.P.l4Branches).length===0));
  await page.evaluate(()=>{const R=__ROADLORDS_RUNTIME__;for(let i=0;i<240;i++){R.updateBattle(1/30);R.renderBattle(1/30)}R.roadFocusFront();R.updateHud();R.renderBattle(0)});await page.screenshot({path:'artifacts/orc-mystics-combat.png'});
  const battle=await page.evaluate(()=>{const R=__ROADLORDS_RUNTIME__;for(let i=0;i<660;i++){R.updateBattle(1/30);R.renderBattle(1/30)}return {damage:R.ROAD.metrics.damage,attacks:R.ROAD.metrics.attacks,living:R.state.units.filter(u=>u.alive).length,cache:R.ROAD.sprites.size,finite:R.state.units.every(u=>Number.isFinite(u.hp)&&Number.isFinite(u.lane))}});report.battle=battle;
  check('Real mixed combat deals damage and kills units with bounded sprite storage',battle.damage>500&&battle.attacks>20&&battle.living<20&&battle.finite&&battle.cache<=768);
  const m=JSON.parse(fs.readFileSync('src/data/orc-mystics-art.json'));check('Original atlas is preserved and rectangles are valid',crypto.createHash('sha256').update(fs.readFileSync('public/'+m.file)).digest('hex')===m.sha256&&Object.values(m.parts).every(([x,y,w,h])=>x>=0&&y>=0&&x+w<=m.width&&y+h<=m.height));
  await page.setViewportSize({width:1280,height:800});await page.waitForTimeout(150);await page.locator('#roadRestart').click();await page.evaluate(()=>__ROADLORDS_RUNTIME__.roadPause());
  check('Both armies and equipment fit a 1280 by 800 viewport',await page.evaluate(()=>{const R=__ROADLORDS_RUNTIME__,Q=R.ROAD;R.renderBattle(0);const s=Q.h/600*Q.zoom,free=R.roadWar.clientWidth-(Q.enemyPinned?Q.city+24:0);return R.state.units.every(u=>{const p=R.pointAt(u.lane,u.offset);return p.x-65*s>=0&&p.x+55*s<=free&&p.y-70*s>=0&&p.y+7*s<=Q.h})}));
  await Promise.all([page.waitForEvent('domcontentloaded'),page.locator('#roadMenu').click()]);await page.waitForFunction(()=>!!window.__ROADLORDS_RUNTIME__);check('Return to main menu works without browser errors',await page.evaluate(()=>!__ROADLORDS_RUNTIME__.ROAD.test)&&!report.errors.length);
 }finally{fs.writeFileSync('artifacts/orc-mystics-figures.json',JSON.stringify(report,null,2));await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
