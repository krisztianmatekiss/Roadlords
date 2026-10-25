const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto');
const URL=process.env.ROADLORDS_TEST_URL||'http://127.0.0.1:4173/Roadlords/';
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox','--disable-dev-shm-usage']});
 const report={checks:[],errors:[]},check=(name,ok)=>{assert(ok,name);report.checks.push(name);console.log('PASS',name)};fs.mkdirSync('artifacts',{recursive:true});
 try{
  const page=await browser.newPage({viewport:{width:1600,height:1000}});await page.route('https://**/*',r=>r.abort());page.on('pageerror',e=>report.errors.push(e.message));await page.goto(URL);await page.waitForFunction(()=>!!window.__ROADLORDS_RUNTIME__);
  check('Undead atlases stay unloaded in normal play',await page.evaluate(()=>!performance.getEntriesByType('resource').some(r=>r.name.includes('undead-fighters-heroes')||r.name.includes('undead-casters-heroes'))));
  await page.locator('.menuBrand').click();await page.waitForTimeout(900);await page.locator('#roadTestsMenu').click();
  check('Only the current Undead comparison and stress trial are visible',await page.locator('.roadTestsList button').count()===2&&await page.locator('#roadUndeadFiguresMenu').isVisible()&&await page.locator('#roadUndeadStressMenu').isVisible());
  await page.locator('#roadUndeadFiguresMenu').click();await page.waitForFunction(()=>__ROADLORDS_RUNTIME__.ROAD.testRoster==='undead-figures');await page.evaluate(()=>__ROADLORDS_RUNTIME__.roadPause());
  check('One click starts four of every Undead and Human type with unchanged base stats',await page.evaluate(()=>{const R=__ROADLORDS_RUNTIME__;return R.state.units.length===56&&new Set(R.state.units.map(u=>u.key)).size===14&&R.state.units.every(u=>R.state.units.filter(v=>v.key===u.key).length===4&&u.maxHp===R.UNITS[u.key].hp&&u.damage===R.UNITS[u.key].damage)&&R.P.race==='undead'&&R.E.race==='human'&&[R.P,R.E].every(c=>!c.legends.size&&!Object.keys(c.normal).length)}));
  const poses=await page.evaluate((manifests)=>{
   const R=__ROADLORDS_RUNTIME__,Q=R.ROAD,units=R.state.units.filter(u=>u.side==='player').filter((u,i,a)=>a.findIndex(v=>v.key===u.key)===i),hash=c=>{let n=0;for(const b of c.getContext('2d').getImageData(0,0,c.width,c.height).data)n=(Math.imul(n,31)+b)>>>0;return n};
   const sprite=(u,state,frame)=>{
    const actor={...u,lane:Q.camera+350,offset:0,roadFace:1,roadMoving:state==='walk',roadWalk:(frame+.1)/8*Math.PI*2-u.id*.73,roadAttack:null,roadUndSummon:null,undBeams:[],death:10-(frame+.1)/6*.6};Q.clock=10;
    if(state==='attack'){actor.roadAttack={start:9,launch:10,hit:10.3,end:10.54,recovery:.24,to:actor.lane+150};Q.clock=frame<4?9+(frame+.1)/4*.915:frame<7?9.915+(frame-4+.1)/3*.085:10+(frame-7+.1)/5*.24;}
    if(state==='hover')Q.clock=(frame+.1-u.id*.31)/4;
    if(state==='summon'){Q.clock=10;actor.roadUndSummon={start:10-(frame+.1)/6*.75,end:10.75};}
    R.roadDrawUnit(actor,state==='death');const p=R.battleFigurePose(actor,Q.clock,state==='death'),suffix=u.key==='und_skeleton'?':painted-skeleton':':painted-undead',key=`figure:${u.key}:${R.unitTeamFill(actor)}:${p.state}:${p.frame}${suffix}${u.veteran?':elite':''}${Number.isInteger(p.summonFrame)?':summon:'+p.summonFrame:''}`;const s=Q.sprites.get(key);if(!s)throw Error('Missing painted sprite: '+key);return s;
   };
   const result={units:{}},gallery=document.createElement('canvas');gallery.width=2100;gallery.height=7*430;const g=gallery.getContext('2d');g.fillStyle='#21352a';g.fillRect(0,0,gallery.width,gallery.height);g.fillStyle='#f1dba7';g.font='18px Arial';
   for(const [ui,u]of units.entries()){
    const c={bounds:true,finite:true,aligned:true,wristNatural:true};for(const [ri,[state,count]]of [['idle',1],['walk',8],['attack',12],['death',6]].entries()){
     const hashes=[];g.fillText(u.key+' / '+state,8,ui*430+ri*105+23);
     for(let i=0;i<count;i++){const s=sprite(u,state,i),rig=s.figureRig;hashes.push(hash(s));if(i%2===0)g.drawImage(s,220+i/2*300,ui*430+ri*105-20,220,220);
      const px=s.getContext('2d').getImageData(0,0,s.width,s.height).data;for(let k=0;k<s.width;k++)for(const at of [k,k*s.width,k*s.width+s.width-1,(s.height-1)*s.width+k])if(px[at*4+3]>80)c.bounds=false;
      c.finite&&=!JSON.stringify(rig).includes('null');if(u.key==='und_vampire'){const e=rig.elbows[1],w=rig.wrists[1],h=rig.hands[1],fx=w[0]-e[0],fy=w[1]-e[1],hx=h[0]-w[0],hy=h[1]-w[1];c.wristNatural&&=(fx*hx+fy*hy)/(Math.hypot(fx,fy)*Math.hypot(hx,hy))>.69;}if(rig.palm){const e=rig.elbows[0],w=rig.hands[0],h=rig.palm;c.wristNatural&&=(w[0]-e[0])*(h[0]-w[0])+(w[1]-e[1])*(h[1]-w[1])>0;}if(rig.hands&&rig.elbows&&rig.shoulders)c.aligned&&=rig.elbows.every((e,j)=>Math.hypot(e[0]-rig.shoulders[j][0],e[1]-rig.shoulders[j][1])<13);
     }c[state]=new Set(hashes).size;
    }
    if(u.key!=='und_skeleton'){
     c.visibleArms=[];const originals={},blanks={};
     for(const [m,texture,names]of [[manifests.f,'undeadFightersTexture',['zUpper','zFore','vUpper','vFore','vForeBare','vHand','gUpper','gFore']],[manifests.c,'undeadCastersTexture',['nUpper','nFore','lUpper','lFore','nPalm','lPalm']],[manifests.s,'skeletonTexture',['upperArm','forearmBare','hand','gripFingers']]]){
      const source=R[texture],blank=document.createElement('canvas');blank.width=source.naturalWidth;blank.height=source.naturalHeight;blank.naturalWidth=blank.width;const bg=blank.getContext('2d');bg.drawImage(source,0,0);for(const name of names)bg.clearRect(...m.parts[name]);originals[texture]=source;blanks[texture]=blank;
     }
     for(const [state,frame]of [['idle',0],['attack',3],['attack',6]]){
      Q.sprites.clear();R.undeadClothCache.clear();const full=sprite(u,state,frame),rig=full.figureRig;
      Object.assign(R,blanks);Q.sprites.clear();R.undeadClothCache.clear();const without=sprite(u,state,frame);Object.assign(R,originals);Q.sprites.clear();R.undeadClothCache.clear();
      for(let j=0;j<2;j++)for(const [a,b]of [[rig.shoulders[j],rig.elbows[j]],[rig.elbows[j],(rig.wrists||rig.hands)[j]]]){
       const bounds=full.figureBounds,k=full.width/bounds[2],size=u.key==='und_skeleton_archer'?.95:u.key==='und_zombie'?1.05:1,bob=u.key==='und_ghost'?rig.bob:0,x=(((a[0]+b[0])/2)*size-bounds[0])*k,y=(((a[1]+b[1])/2+bob)*size-bounds[1])*k,r=2.4*k,rect=[Math.round(x-r),Math.round(y-r),Math.round(r*2),Math.round(r*2)],p=full.getContext('2d').getImageData(...rect).data,q=without.getContext('2d').getImageData(...rect).data;let changed=0;for(let z=0;z<p.length;z+=4)if(Math.abs(p[z]-q[z])+Math.abs(p[z+1]-q[z+1])+Math.abs(p[z+2]-q[z+2])+Math.abs(p[z+3]-q[z+3])>30)changed++;c.visibleArms.push(changed);
      }
     }
    }
    c.elite=hash(sprite({...u,veteran:true},'idle',0))!==hash(sprite(u,'idle',0));c.colors=[];for(const [color]of __ROADLORDS_UNIT_COLORS__.palette){R.P.unitColor=color;c.colors.push(hash(sprite(u,'idle',0)));}R.P.unitColor='blue';result.units[u.key]=c;
   }
   const ghost=units.find(u=>u.key==='und_ghost'),necro=units.find(u=>u.key==='und_necromancer'),lich=units.find(u=>u.key==='und_lich'),bow=units.find(u=>u.key==='und_skeleton_archer');
   result.ghost={hover:new Set(Array.from({length:8},(_,i)=>hash(sprite(ghost,'hover',i)))).size,legs:sprite(ghost,'idle',0).figureRig.legs};result.summon=sprite(necro,'summon',2).figureRig.summoning;
   result.bowLoaded=sprite(bow,'attack',6).figureRig;result.bowReleased=sprite(bow,'attack',7).figureRig;result.necroRelease=sprite(necro,'attack',6).figureRig;result.lichRelease=sprite(lich,'attack',6).figureRig;result.necroLaunch=R.undeadLaunchPoint(necro.key);result.lichLaunch=R.undeadLaunchPoint(lich.key);
   const preview=document.createElement('canvas');preview.width=1800;preview.height=1120;const c=preview.getContext('2d');c.fillStyle='#14231c';c.fillRect(0,0,1800,1120);c.fillStyle='#f1dca8';c.textAlign='center';c.font='bold 28px Arial';c.fillText('ÉLŐHALOTTAK — TÉNYLEGES JÁTÉKBELI MODELLEK',900,43);c.font='17px Arial';c.fillStyle='#bdcabc';c.fillText('Mind a hét típus · nagyítva és játékbeli méretben',900,73);
   const names={und_skeleton:'Csontváz',und_skeleton_archer:'Csontvázíjász',und_zombie:'Zombi',und_ghost:'Szellem',und_necromancer:'Nekromanta',und_vampire:'Vámpír',und_lich:'Lich'},order=['und_skeleton','und_skeleton_archer','und_zombie','und_ghost','und_necromancer','und_vampire','und_lich'];
   for(const [i,key]of order.entries()){const col=i%4,row=Math.floor(i/4),x=col*450+225,y=100+row*500,s=sprite(units.find(u=>u.key===key),'idle',0),b=s.figureBounds;c.fillStyle='#21372a';c.beginPath();c.roundRect(col*450+12,y,426,470,15);c.fill();c.fillStyle='#eed8a4';c.font='bold 25px Arial';c.fillText(names[key],x,y+39);c.drawImage(s,x+b[0]*4,y+333+b[1]*4,b[2]*4,b[3]*4);c.drawImage(s,x+b[0],y+433+b[1],b[2],b[3]);}
   result.gallery=gallery.toDataURL();result.preview=preview.toDataURL();result.cache=Q.sprites.size;result.clothCache=R.undeadClothCache.size;return result;
  },{f:JSON.parse(fs.readFileSync('src/data/undead-fighters-art.json')),c:JSON.parse(fs.readFileSync('src/data/undead-casters-art.json')),s:JSON.parse(fs.readFileSync('src/data/skeleton-art.json'))});
  for(const [field,name]of [['gallery','undead-poses.png'],['preview','undead-in-game.png']]){fs.writeFileSync('artifacts/'+name,Buffer.from(poses[field].split(',')[1],'base64'));delete poses[field];}report.poses=poses;
  check('All seven types have visible distinct walk, attack and death poses within their sprite bounds',Object.values(poses.units).every(c=>c.walk>=6&&c.attack>=7&&c.death>=5&&c.bounds&&c.finite&&c.aligned));
  check('Both upper arms and forearms remain visibly painted in idle, draw and impact poses',Object.values(poses.units).filter(c=>c.visibleArms).every(c=>c.visibleArms.every(n=>n>4)));
  check('Weapon and spell hands retain natural wrists throughout every animation',Object.values(poses.units).every(c=>c.wristNatural));
  check('Every type supports eight team colors and an elite marker with bounded caches',Object.values(poses.units).every(c=>new Set(c.colors).size===8&&c.elite)&&poses.cache<=768&&poses.clothCache<=24);
  check('Ghost floats without legs and Necromancer has a separate summoning pose',poses.ghost.legs===0&&poses.ghost.hover>=6&&poses.summon);
  check('Nocked arrow and both spell origins match the release poses',poses.bowLoaded.arrowLoaded&&!poses.bowReleased.arrowLoaded&&poses.bowLoaded.arrowCenter.every((v,i)=>Math.abs(v-[11,-33][i])<1e-8)&&poses.necroLaunch.every((v,i)=>Math.abs(v-poses.necroRelease.staffTip[i])<1e-8)&&poses.lichLaunch.every((v,i)=>Math.abs(v-poses.lichRelease.staffTip[i])<1e-8));
  const combat=await page.evaluate(()=>{
   const R=__ROADLORDS_RUNTIME__,Q=R.ROAD,fixture=()=>{R.roadStartTest(42,{count:28,roster:'undead-figures'});R.roadPause();Q.clock=20;R.state.combatStep=(R.state.combatStep||0)+1;for(const u of R.state.units){u.lane=6000;u.offset=200;}},out=[];
   for(const key of ['und_skeleton_archer','und_necromancer','und_vampire','und_lich']){
    fixture();const u=R.state.units.find(u=>u.key===key),v=R.state.units.find(u=>u.key==='swordsman');u.lane=4700;u.offset=0;u.hp=20;v.lane=key==='und_vampire'?4725:4810;v.offset=0;v.hp=v.maxHp=10000;v.shield=v.tempShield=0;R.roadReindex();R.attackUnit(u,v);const a=u.roadAttack;if(!a)throw Error('No real attack '+key);Q.clock=a.hit-.001;R.roadImpacts();const early=v.hp===10000;Q.clock=a.hit+.001;R.roadImpacts();const hp=v.hp,heal=u.hp-20;R.roadImpacts();
    const result={key,early,damage:10000-hp,once:hp===v.hp,heal};if(key==='und_lich'){const origin=R.undeadBeamOrigin(u),at=R.pointAt(u.lane,u.offset),s=Q.h/600*Q.zoom,tip=R.undeadLaunchPoint(key);result.origin=Math.abs(origin.x-at.x-tip[0]*s)<1e-8&&Math.abs(origin.y-at.y-tip[1]*s)<1e-8;result.beams=u.undBeams.length;R.updateBattle(.1);result.beamDamage=10000-v.hp;}
    if(key==='und_skeleton_archer'||key==='und_necromancer'){const at=R.undeadProjectilePoint(a,0),from=R.pointAt(a.lane,a.offset),s=Q.h/600*Q.zoom,tip=R.undeadLaunchPoint(key);result.origin=Math.abs(at.x-from.x-tip[0]*s)<1e-8&&Math.abs(at.y-from.y-tip[1]*s)<1e-8;}
    out.push(result);
   }
   fixture();const necro=R.state.units.find(u=>u.key==='und_necromancer');R.state.units=[necro];necro.lane=4700;necro.offset=0;necro.undSummonClock=14.99;R.roadReindex();R.updateBattle(.02);const summons=R.state.units.filter(u=>u.undSummoned),summon={count:summons.length,keys:summons.every(u=>u.key==='und_skeleton'&&u.undNoArmySlot&&u.temporary>9.9),visual:!!necro.roadUndSummon};
   return {attacks:out,summon};
  });report.combat=combat;
  check('Real arrow, spell and Vampire hits resolve once at their original damage timing',combat.attacks.slice(0,3).every(a=>a.early&&a.once)&&combat.attacks[0].damage===8&&combat.attacks[0].origin&&combat.attacks[1].damage===5&&combat.attacks[1].origin&&combat.attacks[2].damage===45&&Math.abs(combat.attacks[2].heal-13.5)<1e-8);
  check('Lich keeps its real beam from the staff, and real summons use the painted plain Skeleton',combat.attacks[3].origin&&combat.attacks[3].beams===1&&combat.attacks[3].beamDamage>0&&combat.summon.count===3&&combat.summon.keys&&combat.summon.visual);
  await page.locator('#roadRestart').click();await page.evaluate(()=>__ROADLORDS_RUNTIME__.roadPause());await page.locator('#roadFigureToggle').click();check('A/B graphics preserves all 56 actors',await page.evaluate(()=>__ROADLORDS_RUNTIME__.state.units.length===56&&__ROADLORDS_RUNTIME__.ROAD.figureStyle==='simple'));await page.locator('#roadFigureToggle').click();
  const battle=await page.evaluate(()=>{const R=__ROADLORDS_RUNTIME__;for(let i=0;i<1500;i++){R.updateBattle(1/30);if(i%5===0)R.renderBattle(1/30)}R.roadFocusFront();R.updateHud();R.renderBattle(0);return {damage:R.ROAD.metrics.damage,attacks:R.ROAD.metrics.attacks,cache:R.ROAD.sprites.size,finite:R.state.units.every(u=>Number.isFinite(u.hp)&&Number.isFinite(u.lane))}});report.battle=battle;await page.screenshot({path:'artifacts/undead-combat.png'});
  check('Mixed real combat stays finite and deals damage with bounded sprite storage',battle.damage>500&&battle.attacks>30&&battle.finite&&battle.cache<=768);
  for(const name of ['fighters','casters']){const m=JSON.parse(fs.readFileSync(`src/data/undead-${name}-art.json`));check(`Original ${name} atlas is preserved and all crop rectangles are valid`,crypto.createHash('sha256').update(fs.readFileSync('public/'+m.file)).digest('hex')===m.sha256&&Object.values(m.parts).every(([x,y,w,h])=>x>=0&&y>=0&&x+w<=m.width&&y+h<=m.height));}
  await page.setViewportSize({width:1280,height:800});await page.waitForTimeout(150);await page.locator('#roadRestart').click();await page.evaluate(()=>__ROADLORDS_RUNTIME__.roadPause());
  check('Initial armies fit the 1280 by 800 viewport',await page.evaluate(()=>{const R=__ROADLORDS_RUNTIME__,Q=R.ROAD,s=Q.h/600*Q.zoom,free=R.roadWar.clientWidth-(Q.enemyPinned?Q.city+24:0);return R.state.units.every(u=>{const p=R.pointAt(u.lane,u.offset);return p.x-45*s>=0&&p.x+50*s<=free&&p.y-70*s>=0&&p.y+7*s<=Q.h})}));
  await Promise.all([page.waitForEvent('domcontentloaded'),page.locator('#roadMenu').click()]);await page.waitForFunction(()=>!!window.__ROADLORDS_RUNTIME__);await page.locator('.menuBrand').click();await page.waitForTimeout(900);await page.locator('#roadTestsMenu').click();await page.locator('#roadUndeadStressMenu').click();await page.waitForFunction(()=>{const R=__ROADLORDS_RUNTIME__;return R.ROAD.test&&R.ROAD.testRoster==='undead-figures'&&R.ROAD.initial?.counts.every(n=>n===500)});await page.evaluate(()=>__ROADLORDS_RUNTIME__.roadPause());
  check('One click starts exactly 500 versus 500 with all fourteen types',await page.evaluate(()=>{const R=__ROADLORDS_RUNTIME__;return R.ROAD.initial.counts.every(n=>n===500)&&R.ROAD.initial.keys.length===14&&R.state.units.length===1000}));
  const stress=await page.evaluate(()=>{const R=__ROADLORDS_RUNTIME__;for(let i=0;i<180;i++){R.updateBattle(1/30);if(i%5===0)R.renderBattle(1/30)}return {finite:R.state.units.every(u=>Number.isFinite(u.hp)&&Number.isFinite(u.lane)),cache:R.ROAD.sprites.size,damage:R.ROAD.metrics.damage}});report.stress=stress;
  check('Thousand-actor battle runs with bounded sprite memory and no browser errors',stress.finite&&stress.cache<=768&&!report.errors.length);
 }finally{fs.writeFileSync('artifacts/undead-figures.json',JSON.stringify(report,null,2));await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
