const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto');
const URL=process.env.ROADLORDS_TEST_URL||'http://127.0.0.1:4173/Roadlords/';
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox','--disable-dev-shm-usage']});
 const report={checks:[],errors:[]},check=(name,ok)=>{assert(ok,name);report.checks.push(name);console.log('PASS',name)};fs.mkdirSync('artifacts',{recursive:true});
 try{
  const page=await browser.newPage({viewport:{width:1600,height:1000}});await page.route('https://**/*',r=>r.abort());page.on('pageerror',e=>report.errors.push(e.message));
  await page.goto(URL);await page.waitForFunction(()=>!!window.__ROADLORDS_RUNTIME__);
  check('Caster atlas is lazy and normal menu does not load it',await page.evaluate(()=>!performance.getEntriesByType('resource').some(r=>r.name.includes('human-casters-heroes-parts'))));
  await page.locator('.menuBrand').click();await page.waitForTimeout(900);await page.locator('#roadTestsMenu').click();
  check('Only the two current mixed trials remain visible',await page.locator('.roadTestsList button').count()===2&&await page.locator('#roadOrcsHumansMenu').isVisible()&&await page.locator('#roadUndeadOrcsMenu').isVisible()&&await page.locator('#roadInfantryMenu').count()===0);
  await page.evaluate(async()=>{const R=__ROADLORDS_RUNTIME__;await Promise.all([R.loadHumanInfantryArt(),R.loadOrcWarriorArt(),R.loadHumanCastersArt()]);R.roadStartTest(42,{count:10,roster:'casters'})});await page.waitForFunction(()=>__ROADLORDS_RUNTIME__.ROAD.testRoster==='casters');await page.evaluate(()=>__ROADLORDS_RUNTIME__.roadPause());
  check('One click starts four Swordsmen, three Priests and three Mages against ten base Orcs',await page.evaluate(()=>{const R=__ROADLORDS_RUNTIME__;return R.state.units.length===20&&Object.entries({swordsman:4,priest:3,mage:3,orc_warrior:10}).every(([key,n])=>R.state.units.filter(u=>u.key===key).length===n)&&R.state.units.every(u=>u.maxHp===R.UNITS[u.key].hp&&u.damage===R.UNITS[u.key].damage)&&[R.P,R.E].every(c=>!Object.keys(c.normal).length&&!c.legends.size)}));
  const poses=await page.evaluate(()=>{
   const R=__ROADLORDS_RUNTIME__,Q=R.ROAD,units=['priest','mage'].map(key=>R.state.units.find(u=>u.key===key));
   const hash=c=>{let n=0;for(const b of c.getContext('2d').getImageData(0,0,c.width,c.height).data)n=(Math.imul(n,31)+b)>>>0;return n};
   const sprite=(u,state,frame)=>{
    const actor={...u,lane:Q.camera+350,offset:0,roadFace:1,roadMoving:state==='walk',roadWalk:(frame+.1)/8*Math.PI*2-u.id*.73,roadAttack:null,roadHeal:null,death:10-(frame+.1)/6*.6};Q.clock=10;
    if(state==='attack'){actor.roadAttack={start:9,launch:10,hit:10.3,end:10.54,recovery:.24,to:actor.lane+150};Q.clock=frame<4?9+(frame+.1)/4*.915:frame<7?9.915+(frame-4+.1)/3*.085:10+(frame-7+.1)/5*.24;}
    if(state==='heal'){actor.roadHeal={start:9,end:9.6};Q.clock=9+(frame+.1)/6*.6;}
    R.roadDrawUnit(actor,state==='death');const p=R.battleFigurePose(actor,Q.clock,state==='death'),kind=u.key==='priest'?'holy':'fire';
    return Q.sprites.get(`figure:${u.key}:${R.unitTeamFill(actor)}:${p.state}:${p.frame}:painted-caster:${kind}${u.veteran?':elite':''}${Number.isInteger(p.healFrame)?':healing:'+p.healFrame:''}`);
   };
   const result={units:{}},gallery=document.createElement('canvas');gallery.width=1440;gallery.height=1330;const g=gallery.getContext('2d');g.fillStyle='#21352a';g.fillRect(0,0,1440,1330);g.fillStyle='#eedbaa';g.font='16px Arial';
   for(const [ui,u]of units.entries()){
    const checks={};
    for(const [row,[state,count]]of [['idle',1],['walk',8],['attack',12],['death',6],...(u.key==='priest'?[['heal',6]]:[])].entries()){
     const hashes=[];g.fillText(u.key+' / '+state,12,ui*680+row*130+23);
     for(let i=0;i<count;i++){const s=sprite(u,state,i);hashes.push(hash(s));if(i%Math.max(1,Math.floor(count/6))===0)g.drawImage(s,170+Math.floor(i/Math.max(1,Math.floor(count/6)))*150,ui*680+row*130,165,165);}
     checks[state]=new Set(hashes).size;
     checks.rolesStable??=true;checks.jointsAligned??=true;checks.wristNatural??=true;
     for(let i=0;i<count;i++){const rig=sprite(u,state,i).figureRig,staff=u.key==='priest'?'far':'near',spell=u.key==='priest'?'near':'far';if(u.key==='mage'){const a=rig.arms.far,dx=a.wrist[0]-a.elbow[0],dy=a.wrist[1]-a.elbow[1],hx=rig.palm[0]-a.wrist[0],hy=rig.palm[1]-a.wrist[1];checks.wristNatural&&=dx*hx+dy*hy>0;}checks.rolesStable&&=rig.handRoles.staff===staff&&rig.handRoles.spell===spell&&rig.arms[staff].wrist.every((v,j)=>Math.abs(v-rig.staffWrist[j])<1e-8)&&rig.arms[spell].wrist.every((v,j)=>Math.abs(v-rig.hands[1][j])<1e-8);checks.jointsAligned&&=rig.neck.every((v,j)=>Math.abs(v-rig.collar[j])<1e-8)&&Object.values(rig.arms).every(arm=>Math.abs(Math.hypot(arm.elbow[0]-arm.shoulder[0],arm.elbow[1]-arm.shoulder[1])-Math.hypot(arm.wrist[0]-arm.elbow[0],arm.wrist[1]-arm.elbow[1]))<1e-6);}

    }
    checks.eliteChanges=hash(sprite({...u,veteran:true},'idle',0))!==hash(sprite(u,'idle',0));
    let material;checks.materialStable=true;checks.colours=[];
    for(const [color]of __ROADLORDS_UNIT_COLORS__.palette){R.P.unitColor=color;const s=sprite(u,'idle',0),b=s.figureBounds,k=s.width/b[2],pixels=s.getContext('2d').getImageData(Math.round((4.5-b[0])*k),Math.round((.2-b[1])*k),Math.round(1.2*k),Math.round(1.2*k)).data,value=Array.from(pixels).join(',');material??=value;checks.materialStable&&=material===value&&pixels.some((v,i)=>i%4===3&&v>100);checks.colours.push(hash(s));}R.P.unitColor='blue';result.units[u.key]=checks;
    const rig=sprite(u,'attack',6).figureRig,release=R.casterLaunchPoint(u.key),point=u.key==='priest'?rig.staffTip:rig.palm;checks.releaseMatches=point.every((n,i)=>Math.abs(n-release[i])<1e-8);checks.release=release;
   }
   result.gallery=gallery.toDataURL();result.mageLoaded=sprite(units[1],'attack',6).figureRig.orbLoaded;result.mageReleased=sprite(units[1],'attack',7).figureRig.orbLoaded;
   const preview=document.createElement('canvas');preview.width=1600;preview.height=760;const c=preview.getContext('2d');c.fillStyle='#14231c';c.fillRect(0,0,1600,760);c.textAlign='center';c.fillStyle='#f1dca8';c.font='bold 28px Arial';c.fillText('PAP ÉS MÁGUS — JÁTÉKBELI MODELLEK',800,47);c.fillStyle='#bbcabd';c.font='17px Arial';c.fillText('Tényleges modellek · azonos lépték, nagyítva és kis méretben',800,80);
   for(const [i,[u,state,frame]]of [[units[0],'idle',0],[units[0],'heal',0],[units[1],'idle',0],[units[1],'attack',6]].entries()){
    const x=200+i*400,s=sprite(u,state,frame),b=s.figureBounds;c.fillStyle='#22382b';c.beginPath();c.roundRect(15+i*400,110,370,610,18);c.fill();c.fillStyle='#edd7a3';c.font='bold 23px Arial';c.fillText(['Pap · alapállás','Pap · gyógyítás','Mágus · alapállás','Mágus · varázslás'][i],x,149);c.drawImage(s,x+b[0]*5.3,490+b[1]*5.3,b[2]*5.3,b[3]*5.3);c.drawImage(s,x+b[0]*1.15,655+b[1]*1.15,b[2]*1.15,b[3]*1.15);
   }
   result.preview=preview.toDataURL();result.cache=Q.sprites.size;result.clothCache=R.casterClothCache.size;return result;
  });
  for(const [field,name]of [['gallery','human-casters-poses.png'],['preview','human-casters-in-game.png']]){fs.writeFileSync('artifacts/'+name,Buffer.from(poses[field].split(',')[1],'base64'));delete poses[field];}report.poses=poses;
  check('Both casters walk, cast and fall with distinct bounded poses; Priest has six healing poses',Object.values(poses.units).every(u=>u.walk>=6&&u.attack>=9&&u.death===6)&&poses.units.priest.heal===6&&poses.cache<=768);
  check('Eight team colours and elite trims are distinct while leather stays intact',Object.values(poses.units).every(u=>new Set(u.colours).size===8&&u.materialStable&&u.eliteChanges)&&poses.clothCache<=8);
  check('Staff and spell stay in the concept-approved arms through every pose, with aligned wrists and necks',Object.values(poses.units).every(u=>u.rolesStable&&u.jointsAligned&&u.wristNatural));
  check('Release positions match the staff sun and free palm, and Mage releases the held orb',Object.values(poses.units).every(u=>u.releaseMatches)&&poses.mageLoaded&&!poses.mageReleased);
  const timing=await page.evaluate(()=>{
   const R=__ROADLORDS_RUNTIME__,Q=R.ROAD,results=[];
   for(const key of ['priest','mage']){
    for(const actor of R.state.units){actor.roadAttack=null;actor.roadPending=false;}Q.pending=[];Q.clock=20;
    // The fixture may pause just after a movement tick. Ranged units cannot
    // shoot in that same tick; advance to the next tick for this stationary hit.
    R.state.combatStep=(R.state.combatStep||0)+1;
    const u=R.state.units.find(u=>u.key===key),victim=R.state.units.find(u=>u.key==='orc_warrior'),splash=R.state.units.filter(u=>u.key==='orc_warrior')[1];u.lane=4700;u.offset=0;victim.lane=4820;victim.offset=0;splash.lane=4830;splash.offset=0;victim.hp=victim.maxHp=10000;splash.hp=splash.maxHp=10000;victim.shield=victim.tempShield=0;splash.shield=splash.tempShield=0;R.roadReindex();R.attackUnit(u,victim);const a=u.roadAttack;
    Q.clock=a.launch+.001;R.roadImpacts();const noLaunchDamage=victim.hp===10000;
    const canvas=document.createElement('canvas');canvas.width=Q.w;canvas.height=Q.h;const old=R.ctx;R.ctx=canvas.getContext('2d');R.roadDrawShots();R.ctx=old;
    const pos=R.casterProjectilePoint(a,.001/(a.hit-a.launch)),s=pos.scale,pixels=canvas.getContext('2d').getImageData(Math.round(pos.x-8*s),Math.round(pos.y-8*s),Math.round(16*s),Math.round(16*s)).data.filter((v,i)=>i%4===3&&v>50).length;
    const paths=[1,-1].every(face=>{const b={...a,casterFace:face},p0=R.casterProjectilePoint(b,0),p1=R.casterProjectilePoint(b,1),from=R.pointAt(a.lane,a.offset),to=R.pointAt(a.to,a.toOffset),start=R.casterLaunchPoint(key);return Math.abs(p0.x-from.x-start[0]*s*face)<1e-8&&Math.abs(p0.y-from.y-start[1]*s)<1e-8&&Math.abs(p1.x-to.x)<1e-8&&Math.abs(p1.y-to.y+13*s)<1e-8});
    Q.clock=a.hit-.001;R.roadImpacts();const early=victim.hp===10000;Q.clock=a.hit+.001;R.roadImpacts();const hp=victim.hp;R.roadImpacts();results.push({key,noLaunchDamage,early,damage:10000-hp,expected:u.damage,splash:10000-splash.hp,once:victim.hp===hp,pixels,paths,impact:R.roadEffects.impacts.some(f=>f.start===a.hit&&f.kind===(key==='priest'?'holy':'fire')),flames:key==='priest'||R.roadEffects.impacts.some(f=>f.start===a.hit&&f.casterFire)});
   }return results;
  });report.timing=timing;
  check('Staff light and fireball use their real launch points and impact exactly once with real damage: '+JSON.stringify(timing),timing.every(t=>t.noLaunchDamage&&t.early&&t.damage===t.expected&&t.once&&t.pixels>10&&t.paths&&t.impact&&t.flames)&&timing.find(t=>t.key==='mage').splash>0);
  const healing=await page.evaluate(()=>{
   const R=__ROADLORDS_RUNTIME__,Q=R.ROAD;R.roadStartTest(42,{count:10,roster:'casters'});R.roadPause();Q.clock=30;const u=R.state.units.find(u=>u.key==='priest'),allies=R.state.units.filter(v=>v.side===u.side),ally=allies.find(v=>v.key==='swordsman');u.lane=4700;u.offset=0;ally.lane=4730;ally.offset=0;ally.hp=35;const before=ally.hp,projectiles=R.projectiles.length;R.roadReindex();const acted=R.priestAction(u,allies),pose=R.battleFigurePose(u,30);const immediate=acted&&ally.hp-before===u.heal&&pose.state==='heal'&&Q.clock===u.roadHeal.start&&R.casterHeals.some(f=>f.target===ally&&f.start===30)&&R.projectiles.length===projectiles;
   const hp=ally.hp;R.renderBattle(0);R.renderBattle(0);const paused=ally.hp===hp&&Q.clock===30;
   const enemy=R.state.units.find(v=>v.side!==u.side);enemy.lane=4800;enemy.offset=0;R.attackUnit(u,enemy);const combined=R.battleFigurePose(u,30.01);const independent=combined.state==='attack'&&Number.isInteger(combined.healFrame)&&u.roadPending;
   Q.clock=31;R.drawCasterHealing();const expires=R.casterHeals.length===0;
   R.P.levels.temple=4;R.P.l4Branches.temple='high_priests';for(const v of allies){v.lane=4700+v.id;v.offset=0;v.hp=v.maxHp;}const targets=allies.filter(v=>v.id!==u.id).slice(0,4);for(const v of targets)v.hp=v.maxHp/2;
   R.roadReindex();const original=targets.map(v=>v.hp);R.priestAction(u,allies);const four=targets.every((v,i)=>v.hp>original[i])&&R.casterHeals.length===4;
   for(let i=0;i<150;i++)R.roadPriestHealEffect(u,ally);const bounded=R.casterHeals.length===128;
   Q.test=false;const inactive=R.roadPriestHealEffect(u,ally)===false;Q.test=true;return {immediate,paused,independent,expires,four,bounded,inactive};
  });report.healing=healing;
  check('Real Priest healing raises the palm and marks recipients immediately, without duplicate healing or a delayed heal projectile',healing.immediate&&healing.paused);
  check('Independent attack and heal animations coexist, four-target healing works, effects expire and remain bounded',healing.independent&&healing.four&&healing.expires&&healing.bounded&&healing.inactive);
  check('Frost specialisation changes the held spell and projectile while preserving real impact',await page.evaluate(()=>{const R=__ROADLORDS_RUNTIME__,Q=R.ROAD;R.roadStartTest(42,{count:10,roster:'casters'});R.roadPause();Q.clock=40;R.P.levels.magetower=4;R.P.l4Branches.magetower='frost_mages';const u=R.state.units.find(u=>u.key==='mage'),v=R.state.units.find(u=>u.key==='orc_warrior');u.lane=4700;u.offset=0;v.lane=4820;v.offset=0;R.attackUnit(u,v);const a=u.roadAttack;Q.clock=a.launch-.001;R.roadDrawUnit(u);const loaded=[...Q.sprites.keys()].some(k=>k.startsWith('figure:mage:')&&k.includes(':painted-caster:frost'));const hp=v.hp;Q.clock=a.hit+.001;R.roadImpacts();return loaded&&a.effect==='frost'&&v.hp<hp&&R.roadEffects.impacts.some(f=>f.kind==='frost')}));
  await page.locator('#roadFigureToggle').click();check('A/B graphics preserves the same twenty units',await page.evaluate(()=>__ROADLORDS_RUNTIME__.ROAD.figureStyle==='simple'&&__ROADLORDS_RUNTIME__.state.units.length===20));await page.locator('#roadFigureToggle').click();await page.locator('#roadRestart').click();await page.evaluate(()=>__ROADLORDS_RUNTIME__.roadPause());
  check('Restart retains Casters and clears transient healing effects',await page.evaluate(()=>__ROADLORDS_RUNTIME__.ROAD.testRoster==='casters'&&__ROADLORDS_RUNTIME__.ROAD.figureStyle==='painted'&&__ROADLORDS_RUNTIME__.casterHeals.length===0));
  await page.evaluate(()=>{const R=__ROADLORDS_RUNTIME__;for(let i=0;i<240;i++){R.updateBattle(1/30);R.renderBattle(1/30)}R.roadFocusFront();R.updateHud();R.renderBattle(0)});await page.screenshot({path:'artifacts/human-casters-combat.png'});
  const battle=await page.evaluate(()=>{const R=__ROADLORDS_RUNTIME__;for(let i=0;i<660;i++){R.updateBattle(1/30);R.renderBattle(1/30)}return {damage:R.ROAD.metrics.damage,attacks:R.ROAD.metrics.attacks,living:R.state.units.filter(u=>u.alive).length,cache:R.ROAD.sprites.size,finite:R.state.units.every(u=>Number.isFinite(u.hp)&&Number.isFinite(u.lane))}});report.battle=battle;
  check('Mixed real combat deals damage and kills units without invalid values or unbounded sprites',battle.damage>500&&battle.attacks>20&&battle.living<20&&battle.finite&&battle.cache<=768);
  const m=JSON.parse(fs.readFileSync('src/data/human-casters-art.json'));check('Original caster atlas is preserved with valid part rectangles',crypto.createHash('sha256').update(fs.readFileSync('public/'+m.file)).digest('hex')===m.sha256&&Object.values(m.parts).every(([x,y,w,h])=>x>=0&&y>=0&&x+w<=m.width&&y+h<=m.height));
  await page.setViewportSize({width:1280,height:800});await page.waitForTimeout(150);await page.locator('#roadRestart').click();await page.evaluate(()=>__ROADLORDS_RUNTIME__.roadPause());
  check('Both armies and caster equipment fit the smaller 1280 by 800 viewport',await page.evaluate(()=>{const R=__ROADLORDS_RUNTIME__,Q=R.ROAD;R.renderBattle(0);const s=Q.h/600*Q.zoom,free=R.roadWar.clientWidth-(Q.enemyPinned?Q.city+24:0);return R.state.units.every(u=>{const p=R.pointAt(u.lane,u.offset);return p.x-25*s>=0&&p.x+35*s<=free&&p.y-55*s>=0&&p.y+5*s<=Q.h})}));
  await Promise.all([page.waitForEvent('domcontentloaded'),page.locator('#roadMenu').click()]);await page.waitForFunction(()=>!!window.__ROADLORDS_RUNTIME__);check('Return to main menu works and browser has no errors',await page.evaluate(()=>!__ROADLORDS_RUNTIME__.ROAD.test)&&!report.errors.length);
 }finally{fs.writeFileSync('artifacts/human-casters-figures.json',JSON.stringify(report,null,2));await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
