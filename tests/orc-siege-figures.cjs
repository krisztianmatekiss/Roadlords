const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto');
const URL=process.env.ROADLORDS_TEST_URL||'http://127.0.0.1:4173/Roadlords/';
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox','--disable-dev-shm-usage']});
 const report={checks:[],errors:[]},check=(name,ok)=>{assert(ok,name);report.checks.push(name);console.log('PASS',name)};fs.mkdirSync('artifacts',{recursive:true});
 try{
  const page=await browser.newPage({viewport:{width:1600,height:1000}});await page.route('https://**/*',r=>r.abort());page.on('pageerror',e=>report.errors.push(e.message));await page.goto(URL);await page.waitForFunction(()=>!!window.__ROADLORDS_RUNTIME__);
  check('Siege atlas stays unloaded in the normal menu',await page.evaluate(()=>!performance.getEntriesByType('resource').some(r=>r.name.includes('orc-siege-heroes-parts'))));
  await page.locator('.menuBrand').click();await page.waitForTimeout(900);await page.locator('#roadTestsMenu').click();check('Only the two current mixed trials remain visible',await page.locator('.roadTestsList button').count()===2&&await page.locator('#roadOrcsHumansMenu').isVisible()&&await page.locator('#roadUndeadOrcsMenu').isVisible()&&await page.locator('#roadOrcRaidersMenu').count()===0);
  await page.evaluate(async()=>{const R=__ROADLORDS_RUNTIME__;await Promise.all([R.loadHumanInfantryArt(),R.loadOrcSiegeArt()]);R.roadStartTest(42,{count:10,roster:'orc-siege'})});await page.waitForFunction(()=>__ROADLORDS_RUNTIME__.ROAD.testRoster==='orc-siege');await page.evaluate(()=>__ROADLORDS_RUNTIME__.roadPause());
  check('One click starts five base Warg Riders and five Rams against five Swordsmen and five Spearmen',await page.evaluate(()=>{const R=__ROADLORDS_RUNTIME__;return R.state.units.length===20&&Object.entries({orc_warg:5,orc_ram:5,swordsman:5,spearman:5}).every(([key,n])=>R.state.units.filter(u=>u.key===key).length===n)&&R.state.units.every(u=>u.maxHp===R.UNITS[u.key].hp&&u.damage===R.UNITS[u.key].damage)&&[R.P,R.E].every(c=>!Object.keys(c.normal).length&&!c.legends.size)}));
  const poses=await page.evaluate((armManifest)=>{
   const R=__ROADLORDS_RUNTIME__,Q=R.ROAD,units=['orc_warg','orc_ram'].map(key=>R.state.units.find(u=>u.key===key));
   const hash=c=>{let n=0;for(const b of c.getContext('2d').getImageData(0,0,c.width,c.height).data)n=(Math.imul(n,31)+b)>>>0;return n};
   const sprite=(u,state,frame,variant='melee')=>{
    const actor={...u,lane:Q.camera+350,offset:0,roadFace:1,roadMoving:state==='walk',roadWalk:(frame+.1)/8*Math.PI*2-u.id*.73,roadAttack:null,death:10-(frame+.1)/6*.6};Q.clock=10;
    if(state==='attack'){actor.roadAttack={start:9,launch:10,hit:10.3,end:10.54,recovery:.24,to:actor.lane+150,orcSpear:variant==='throw'};Q.clock=frame<4?9+(frame+.1)/4*.915:frame<7?9.915+(frame-4+.1)/3*.085:10+(frame-7+.1)/5*.24;}
    R.roadDrawUnit(actor,state==='death');const p=R.battleFigurePose(actor,Q.clock,state==='death');return Q.sprites.get(`figure:${u.key}:${R.unitTeamFill(actor)}:${p.state}:${p.frame}:painted-siege:${u.key==='orc_warg'&&state==='attack'&&variant==='throw'?'throw':'melee'}${u.veteran?':elite':''}`);
   };
   const result={units:{}},gallery=document.createElement('canvas');gallery.width=1600;gallery.height=1450;const g=gallery.getContext('2d');g.fillStyle='#21352a';g.fillRect(0,0,1600,1450);g.fillStyle='#eedbaa';g.font='16px Arial';
   for(const [ui,u]of units.entries()){
    const checks={bounds:true,aligned:true,wristNatural:true,seat:true};
    for(const [row,[state,count,variant]]of [['idle',1],['walk',8],['attack',12],['death',6],...(u.key==='orc_warg'?[['attack',12,'throw']]:[])].entries()){
     const hashes=[];g.fillText(u.key+' / '+state+' '+(variant||''),12,ui*750+row*140+22);
     for(let i=0;i<count;i++){
      const s=sprite(u,state,i,variant),r=s.figureRig;hashes.push(hash(s));if(i%Math.max(1,Math.floor(count/6))===0)g.drawImage(s,180+Math.floor(i/Math.max(1,Math.floor(count/6)))*195,ui*750+row*140,190,190);
      if(u.key==='orc_warg'){
       checks.highGuard??=true;if(state==='idle'||state==='walk')checks.highGuard&&=r.hand[1]<r.headTop-1.5&&Math.abs(r.weaponAngle)<.15;
       checks.aligned&&=r.neck.every((v,j)=>Math.abs(v-r.collar[j])<1e-8);checks.seat&&=Math.abs(r.riderHip[1]-r.saddle[1])<1e-8&&Math.abs(r.riderHip[0]-r.saddle[0])<2;
       for(const a of [r.arm,r.reinsArm]){const dx=a.grip[0]-a.wrist[0],dy=a.grip[1]-a.wrist[1],fx=a.wrist[0]-a.elbow[0],fy=a.wrist[1]-a.elbow[1];checks.wristNatural&&=Math.abs(dx*fy-dy*fx)<1e-6&&dx*fx+dy*fy>0&&Math.abs(Math.hypot(a.elbow[0]-a.shoulder[0],a.elbow[1]-a.shoulder[1])-6.5)<1e-5;}
      }
      const px=s.getContext('2d').getImageData(0,0,s.width,s.height).data;for(let k=0;k<s.width;k++)for(const at of [k,k*s.width,k*s.width+s.width-1,(s.height-1)*s.width+k])if(px[at*4+3]>80)checks.bounds=false;
     }checks[state+(variant||'')]=new Set(hashes).size;
    }
    if(u.key==='orc_warg'){
     checks.visibleArms=[];
     const source=R.orcSiegeTexture,blank=document.createElement('canvas');blank.width=source.naturalWidth;blank.height=source.naturalHeight;blank.naturalWidth=blank.width;const bg=blank.getContext('2d');bg.drawImage(source,0,0);for(const name of ['upper','fore'])bg.clearRect(...armManifest.parts[name]);
     for(const [state,frame,variant]of [['idle',0,'melee'],['attack',6,'melee'],['attack',3,'throw'],['attack',6,'throw']]){
      R.orcSiegeTexture=blank;Q.sprites.clear();const without=sprite(u,state,frame,variant);R.orcSiegeTexture=source;Q.sprites.clear();const full=sprite(u,state,frame,variant),rig=full.figureRig;
      for(const arm of [rig.reinsArm,rig.arm])for(const [a,b]of [[arm.shoulder,arm.elbow],[arm.elbow,arm.wrist]]){
       const bounds=full.figureBounds,k=full.width/bounds[2],x=((a[0]+b[0])/2-bounds[0])*k,y=((a[1]+b[1])/2-bounds[1])*k,r=2.2*k,rect=[Math.round(x-r),Math.round(y-r),Math.round(r*2),Math.round(r*2)],p=full.getContext('2d').getImageData(...rect).data,q=without.getContext('2d').getImageData(...rect).data;let changed=0;for(let j=0;j<p.length;j+=4)if(Math.abs(p[j]-q[j])+Math.abs(p[j+1]-q[j+1])+Math.abs(p[j+2]-q[j+2])+Math.abs(p[j+3]-q[j+3])>40)changed++;checks.visibleArms.push(changed);
      }
     }
     checks.distinctAttacks=hash(sprite(u,'attack',6,'melee'))!==hash(sprite(u,'attack',6,'throw'));const wind=sprite(u,'attack',3,'melee').figureRig,hit=sprite(u,'attack',6,'melee').figureRig;checks.overarmStab=wind.hand[1]<wind.headTop-1.5&&hit.hand[1]>wind.hand[1]+8&&hit.weaponAngle>.6;checks.meleeSpearRetained=Array.from({length:12},(_,i)=>sprite(u,'attack',i,'melee').figureRig.loaded).every(Boolean);
    }
    checks.elite=hash(sprite({...u,veteran:true},'idle',0))!==hash(sprite(u,'idle',0));checks.colors=[];checks.materialStable=true;let skin;
    for(const [color]of __ROADLORDS_UNIT_COLORS__.palette){R.P.unitColor=color;const s=sprite(u,'idle',0),b=s.figureBounds,k=s.width/b[2],x=u.key==='orc_warg'?23:12,y=u.key==='orc_warg'?-33:-29,px=s.getContext('2d').getImageData(Math.round((x-b[0])*k),Math.round((y-b[1])*k),3,3).data,value=Array.from(px).join(',');skin??=value;checks.materialStable&&=skin===value;checks.colors.push(hash(s));}R.P.unitColor='blue';result.units[u.key]=checks;
   }
   result.hoofs=Array.from({length:8},(_,i)=>sprite(units[0],'walk',i).figureRig.hoofs);result.wheels=Array.from({length:8},(_,i)=>sprite(units[1],'walk',i).figureRig.wheels);
   result.loaded=sprite(units[0],'attack',6,'throw').figureRig;result.released=sprite(units[0],'attack',7,'throw').figureRig;result.launch=R.wargLaunchPoint();result.ramShift=sprite(units[1],'attack',7).figureRig.beamShift;
   const preview=document.createElement('canvas');preview.width=2000;preview.height=760;const c=preview.getContext('2d');c.fillStyle='#14231c';c.fillRect(0,0,2000,760);c.textAlign='center';c.fillStyle='#f1dca8';c.font='bold 28px Arial';c.fillText('WARGLOVAS — FELSŐ FOGÁSÚ DOBÁS ÉS SZÚRÁS',1000,47);c.fillStyle='#bbcabd';c.font='17px Arial';c.fillText('Tényleges modellek · azonos lépték, nagyítva és kis méretben',1000,80);
   for(const [i,[u,state,frame,variant]]of [[units[0],'idle',0],[units[0],'attack',3,'throw'],[units[0],'attack',6,'throw'],[units[0],'attack',7,'throw'],[units[0],'attack',6,'melee']].entries()){
    const x=200+i*400,s=sprite(u,state,frame,variant),b=s.figureBounds;c.fillStyle='#22382b';c.beginPath();c.roundRect(15+i*400,110,370,610,18);c.fill();c.fillStyle='#edd7a3';c.font='bold 23px Arial';c.fillText(['Fej fölötti tartás','Dobás · hátralendítés','Dobás · elengedés előtt','Dobás · elengedés után','Közelharci leszúrás'][i],x,149);c.drawImage(s,x+b[0]*3.6,490+b[1]*3.6,b[2]*3.6,b[3]*3.6);c.drawImage(s,x+b[0]*1.05,655+b[1]*1.05,b[2]*1.05,b[3]*1.05);
   }
   result.gallery=gallery.toDataURL();result.preview=preview.toDataURL();result.cache=Q.sprites.size;result.clothCache=R.orcSiegeClothCache.size;return result;
  },JSON.parse(fs.readFileSync('src/data/orc-siege-art.json')));
  for(const [field,name]of [['gallery','orc-siege-poses.png'],['preview','orc-siege-in-game.png']]){fs.writeFileSync('artifacts/'+name,Buffer.from(poses[field].split(',')[1],'base64'));delete poses[field];}report.poses=poses;
  check('Walk, melee, throw and death frames remain distinct inside sprite bounds',Object.values(poses.units).every(u=>u.walk>=6&&u.attack>=8&&u.death===6&&u.bounds)&&poses.units.orc_warg.attackthrow>=8);
  check('Rider stays seated and both wrists follow their forearms through every pose',Object.values(poses.units).every(u=>u.aligned&&u.seat&&u.wristNatural));
  check('Both upper arms and forearms remain visible in idle, throw and melee poses',poses.units.orc_warg.visibleArms.every(n=>n>4));
  check('Overhead ready pose leads into separate throws and descending spear thrusts',poses.units.orc_warg.distinctAttacks&&poses.units.orc_warg.meleeSpearRetained&&poses.units.orc_warg.highGuard&&poses.units.orc_warg.overarmStab);
  check('Eight team colors preserve fur and wood while distinguishing elite trim',Object.values(poses.units).every(u=>new Set(u.colors).size===8&&u.elite&&u.materialStable)&&poses.clothCache<=8&&poses.cache<=768);
  check('All four paws animate with a grounded stance and all four wheels rotate',poses.hoofs.every(f=>f.length===4&&f.some(p=>p[1]>=-2.01))&&[0,1,2,3].every(i=>new Set(poses.hoofs.map(f=>f[i].join(','))).size>=6)&&poses.wheels.every(f=>f.length===4)&&new Set(poses.wheels.map(f=>f[0][2])).size===8);
  check('Spear leaves its last loaded position at launch and the Ram reaches maximum extension at impact',poses.loaded.loaded&&!poses.released.loaded&&poses.loaded.payload.every((v,i)=>Math.abs(v-poses.launch[i])<1e-8)&&poses.released.payload.every((v,i)=>Math.abs(v-poses.launch[i])<1e-8)&&Math.abs(poses.ramShift-9)<1e-8);
  const timing=await page.evaluate(()=>{
   const R=__ROADLORDS_RUNTIME__,Q=R.ROAD,out=[];
   for(const [key,kind]of [['orc_warg','throw'],['orc_warg','melee'],['orc_ram','melee']]){
    R.roadStartTest(42,{count:10,roster:'orc-siege'});R.roadPause();Q.clock=20;const u=R.state.units.find(u=>u.key===key),v=R.state.units.find(u=>u.key==='swordsman');for(const a of R.state.units){a.lane=6000;a.offset=200;}u.lane=4700;u.offset=0;v.lane=4700+(kind==='throw'?110:25);v.offset=0;v.hp=v.maxHp=10000;v.shield=v.tempShield=0;u.orcSpearReady=kind==='throw';R.roadReindex();R.state.combatStep=(R.state.combatStep||0)+1;R.attackUnit(u,v);const a=u.roadAttack;let pixels=0,paths=true;
    if(kind==='throw'){Q.clock=a.launch+.001;const canvas=document.createElement('canvas');canvas.width=Q.w;canvas.height=Q.h;const old=R.ctx;R.ctx=canvas.getContext('2d');R.roadDrawShots();R.ctx=old;const p=R.wargProjectilePoint(a,.001/(a.hit-a.launch)),s=p.scale;pixels=canvas.getContext('2d').getImageData(Math.round(p.x-12*s),Math.round(p.y-5*s),Math.round(24*s),Math.round(10*s)).data.filter((v,i)=>i%4===3&&v>50).length;
     paths=[1,-1].every(face=>{const b={...a,wargFace:face},p0=R.wargProjectilePoint(b,0),p1=R.wargProjectilePoint(b,1),from=R.pointAt(a.lane,a.offset),to=R.pointAt(a.to,a.toOffset),start=R.wargLaunchPoint();return Math.abs(p0.x-from.x-start[0]*s*face)<1e-8&&Math.abs(p0.y-from.y-start[1]*s)<1e-8&&Math.abs(p1.x-to.x)<1e-8&&Math.abs(p1.y-to.y+13*s)<1e-8});
    }
    Q.clock=a.hit-.001;R.roadImpacts();const early=v.hp===10000;Q.clock=a.hit+.001;R.roadImpacts();const hp=v.hp;R.roadImpacts();out.push({key,kind,early,damage:10000-hp,once:v.hp===hp,pixels,paths,spearConsumed:!u.orcSpearReady});
   }return out;
  });report.timing=timing;
  check('Opening spear flies from the hand and deals sixty damage once at impact',timing[0].early&&timing[0].damage===60&&timing[0].once&&timing[0].pixels>10&&timing[0].paths&&timing[0].spearConsumed);
  check('Follow-up Warg melee and Ram strikes keep their original damage and timing',timing[1].early&&timing[1].damage===30&&timing[1].once&&timing[2].early&&timing[2].damage===8&&timing[2].once);
  const transition=await page.evaluate(()=>{
   const R=__ROADLORDS_RUNTIME__,Q=R.ROAD;R.roadStartTest(42,{count:10,roster:'orc-siege'});R.roadPause();Q.clock=20;
   const u=R.state.units.find(u=>u.key==='orc_warg'),v=R.state.units.find(u=>u.key==='swordsman');for(const actor of R.state.units){actor.lane=6000;actor.offset=200;}u.lane=4700;u.offset=0;v.lane=4810;v.offset=0;v.hp=v.maxHp=10000;v.shield=v.tempShield=0;R.roadReindex();R.attackUnit(u,v);const first=u.roadAttack;Q.clock=first.hit+.001;R.roadImpacts();const thrown=first.orcSpear&&first.ranged&&!u.orcSpearReady&&v.hp===9940;
   Q.clock=first.end+.01;v.lane=4725;R.roadReindex();R.attackUnit(u,v);const next=u.roadAttack;Q.clock=next.hit+.001;R.roadImpacts();R.roadDrawUnit(u);const pose=R.battleFigurePose(u,Q.clock),sprite=Q.sprites.get(`figure:orc_warg:${R.unitTeamFill(u)}:${pose.state}:${pose.frame}:painted-siege:melee`);return thrown&&!next.orcSpear&&!next.ranged&&v.hp===9910&&sprite?.figureRig.variant==='melee';
  });
  check('The same Rider consumes its opening throw and then uses real melee without resetting its spear state',transition);
  const structure=await page.evaluate(()=>{const R=__ROADLORDS_RUNTIME__,Q=R.ROAD;R.roadStartTest(42,{count:10,roster:'orc-siege'});R.roadPause();Q.clock=30;const u=R.state.units.find(u=>u.key==='orc_ram'),tower=R.targetStructure('player'),lane=tower.lane;u.lane=tower.lane-25;u.offset=tower.offset??tower.lateral??0;R.roadReindex();const before=tower.hp;R.attackStructure(u,tower);const a=u.roadAttack;Q.clock=a.hit-.001;R.roadImpacts();const early=tower.hp===before;Q.clock=a.hit+.001;R.roadImpacts();const hp=tower.hp;R.roadImpacts();return {early,damage:before-hp,once:hp===tower.hp,laneRestored:tower.lane===lane}});report.structure=structure;
  check('Ram also attacks real towers with unchanged structure damage',structure.early&&structure.damage===130&&structure.once&&structure.laneRestored);
  await page.locator('#roadFigureToggle').click();check('A/B graphics preserves the same twenty units',await page.evaluate(()=>__ROADLORDS_RUNTIME__.ROAD.figureStyle==='simple'&&__ROADLORDS_RUNTIME__.state.units.length===20));await page.locator('#roadFigureToggle').click();await page.locator('#roadRestart').click();await page.evaluate(()=>__ROADLORDS_RUNTIME__.roadPause());check('Restart retains the Siege roster and base armies',await page.evaluate(()=>__ROADLORDS_RUNTIME__.ROAD.testRoster==='orc-siege'&&__ROADLORDS_RUNTIME__.ROAD.figureStyle==='painted'&&__ROADLORDS_RUNTIME__.state.units.filter(u=>u.key==='orc_warg'&&u.orcSpearReady).length===5));
  await page.evaluate(()=>{const R=__ROADLORDS_RUNTIME__;for(let i=0;i<240;i++){R.updateBattle(1/30);R.renderBattle(1/30)}R.roadFocusFront();R.updateHud();R.renderBattle(0)});await page.screenshot({path:'artifacts/orc-siege-combat.png'});
  const battle=await page.evaluate(()=>{const R=__ROADLORDS_RUNTIME__;for(let i=0;i<1260;i++){R.updateBattle(1/30);R.renderBattle(1/30)}return {damage:R.ROAD.metrics.damage,attacks:R.ROAD.metrics.attacks,living:R.state.units.filter(u=>u.alive).length,cache:R.ROAD.sprites.size,finite:R.state.units.every(u=>Number.isFinite(u.hp)&&Number.isFinite(u.lane))}});report.battle=battle;
  check('Real mixed combat deals damage and kills units with bounded sprite storage',battle.damage>500&&battle.attacks>20&&battle.living<20&&battle.finite&&battle.cache<=768);
  const m=JSON.parse(fs.readFileSync('src/data/orc-siege-art.json'));check('Original atlas is preserved with valid part rectangles',crypto.createHash('sha256').update(fs.readFileSync('public/'+m.file)).digest('hex')===m.sha256&&Object.values(m.parts).every(([x,y,w,h])=>x>=0&&y>=0&&x+w<=m.width&&y+h<=m.height));
  await page.setViewportSize({width:1280,height:800});await page.waitForTimeout(150);await page.locator('#roadRestart').click();await page.evaluate(()=>__ROADLORDS_RUNTIME__.roadPause());check('Armies and long equipment fit the 1280 by 800 viewport',await page.evaluate(()=>{const R=__ROADLORDS_RUNTIME__,Q=R.ROAD;R.renderBattle(0);const s=Q.h/600*Q.zoom,free=R.roadWar.clientWidth-(Q.enemyPinned?Q.city+24:0);return R.state.units.every(u=>{const p=R.pointAt(u.lane,u.offset);return p.x-50*s>=0&&p.x+65*s<=free&&p.y-70*s>=0&&p.y+7*s<=Q.h})}));
  await Promise.all([page.waitForEvent('domcontentloaded'),page.locator('#roadMenu').click()]);await page.waitForFunction(()=>!!window.__ROADLORDS_RUNTIME__);check('Return to main menu works without browser errors',await page.evaluate(()=>!__ROADLORDS_RUNTIME__.ROAD.test)&&!report.errors.length);
 }finally{fs.writeFileSync('artifacts/orc-siege-figures.json',JSON.stringify(report,null,2));await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
