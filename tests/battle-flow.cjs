const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
const URL=process.env.ROADLORDS_TEST_URL||'http://127.0.0.1:4173/Roadlords/';
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
 const report={checks:[],runs:[],errors:[]};
 const check=(name,result)=>{assert(result,name);report.checks.push(name);console.log('PASS',name);};
 try{
  const context=await browser.newContext({viewport:{width:1440,height:960}});await context.route('https://**/*',r=>r.abort());
  const page=await context.newPage();page.on('pageerror',e=>report.errors.push(e.message));
  await page.goto(URL);await page.waitForFunction(()=>!!window.__ROADLORDS_ROAD__);
  await page.locator('.menuBrand').click();await page.waitForTimeout(900);
  await page.locator('#roadTestsMenu').click();
  check('TESZTEK keeps exactly two current experiments',await page.locator('.roadTestsList button').count()===2&&await page.locator('#roadInfantryMenu').isVisible()&&await page.locator('#roadCatapultMenu').isVisible());
  await page.locator('#roadTestsBack').click();await page.evaluate(()=>__ROADLORDS_RUNTIME__.roadStartTest(42,{count:50}));await page.evaluate(()=>__ROADLORDS_ROAD__.pause());
  check('Diagnostic fixture creates exactly 50/50 with all 14 roster types',await page.evaluate(()=>{const Q=__ROADLORDS_ROAD__;return Q.state.testCount===50&&Q.snapshot().counts.every(n=>n===50)&&Q.state.initial.keys.length===14;}));
  const beforeZoom=await page.evaluate(()=>({zoom:__ROADLORDS_ROAD__.state.zoom,time:__ROADLORDS__.state.time}));await page.locator('#roadZoomIn').click();
  check('Battle zoom control enlarges figures without changing simulation',await page.evaluate(b=>__ROADLORDS_ROAD__.state.zoom>b.zoom&&__ROADLORDS__.state.time===b.time,beforeZoom));
  await page.locator('#roadRestart').click();await page.evaluate(()=>__ROADLORDS_ROAD__.pause());
  check('Restart retains 50/50 mode',await page.evaluate(()=>__ROADLORDS_ROAD__.snapshot().counts.every(n=>n===50)));
  await page.screenshot({path:'artifacts/battle-flow-ready.png'});
  for(const seed of [42,7,98765]){
   // Give each deterministic battle a fresh runtime rather than inheriting
   // caches and frame callbacks from the preceding battle and its screenshot.
   await page.reload();await page.waitForFunction(()=>!!window.__ROADLORDS_ROAD__);
   const result=await page.evaluate(seed=>{
    const R=__ROADLORDS__,Q=__ROADLORDS_ROAD__;Q.startTest(seed,{count:50});Q.pause();
    let random=seed;Math.random=()=>((random=(Math.imul(random,1664525)+1013904223)>>>0)/4294967296);
    R.state.running=true;
    const units=[...R.state.units],positions=new Map(units.map(u=>[u.id,[u.lane,u.offset]]));
    // Recruitment/combat balance can prolong a legitimate fight. Guard
    // movement and continuing damage independently of the victory deadline.
    let frames=0,maxIdle=0,aliveAt30=0,minDistance=Infinity,lastDamage=0,damageStall=0,maxDamageStall=0;const times=[];
    for(let i=0;i<5400;i++){
     const t=performance.now();Q.state.paused=false;Q.step(1/30);Q.state.paused=true;times.push(performance.now()-t);frames++;
     if(Q.state.metrics.damage>lastDamage){lastDamage=Q.state.metrics.damage;damageStall=0;}
     else if(lastDamage>0){damageStall+=1/30;maxDamageStall=Math.max(maxDamageStall,damageStall);}
     if(i>60)maxIdle=Math.max(maxIdle,Q.state.metrics.idleMelee||0);
     if(i===299){for(const u of R.state.units)for(const v of R.state.units)if(v.id>u.id)minDistance=Math.min(minDistance,Q.distance(u,v));}
     if(i===899)aliveAt30=R.state.units.length;
     if(R.state.ended)break;
    }
    R.state.running=false;
    const moved=units.filter(u=>{const p=positions.get(u.id);return Math.hypot(u.lane-p[0],u.offset-p[1])>4||(u.roadTravel||0)>12;}).length;
    times.sort((a,b)=>a-b);
    const active=units.filter(u=>(u.roadTravel||0)>12||(u.roadAttacks||0)>0).length;
    const melee=units.filter(u=>u.tags.includes("melee"));
    const meleeMoved=melee.filter(u=>(u.roadTravel||0)>12||(u.roadAttacks||0)>0).length;
    return {active,melee:melee.length,meleeMoved,seed,steps:frames,ended:R.state.ended,result:Q.state.result,counts:Q.snapshot().counts,attacks:Q.state.metrics.attacks,damage:Q.state.metrics.damage,moved,maxIdle,maxDamageStall,minDistance,aliveAt30,tickP95:times[Math.floor(times.length*.95)],pending:Q.state.pending.length,sprites:Q.state.sprites.size};
   },seed);report.runs.push(result);console.log('FLOW',JSON.stringify(result));
   check('50/50 seed '+seed+' advances rear melee ranks and engages ranged units from their proper range',result.active>=98&&result.meleeMoved>=result.melee-1&&result.attacks>50&&result.damage>0);
   check('50/50 seed '+seed+' keeps dealing damage after contact without a stationary melee deadlock',result.maxIdle<=3&&result.maxDamageStall<10);
   check('50/50 seed '+seed+' reaches a real victory within 180 simulation seconds',result.ended&&result.steps<=5400);
   if(seed===42)await page.screenshot({path:'artifacts/battle-flow-victory.png'});
  }
  await page.evaluate(()=>{const R=__ROADLORDS__,Q=__ROADLORDS_ROAD__;Q.startTest(42,{count:50});Q.pause();for(let i=0;i<180;i++)R.updateBattle(1/30);Q.render(0);});
  await page.screenshot({path:'artifacts/battle-flow-contact.png'});
  const bypass=await page.evaluate(()=>{
    const R=__ROADLORDS__,Q=__ROADLORDS_ROAD__;R.state.units=[];Q.state.pending=[];
    for(const c of [R.P,R.E]){c.race='human';c.normal={};c.legends=new Set();c.l4Branches={};}
    for(const t of R.towers)t.alive=false;
    const rear=R.releaseUnit(R.P,{key:'swordsman'}),blocker=R.releaseUnit(R.P,{key:'swordsman'}),enemy=R.releaseUnit(R.E,{key:'swordsman'});
    rear.lane=1500;blocker.lane=1522;enemy.lane=1710;rear.offset=blocker.offset=enemy.offset=0;
    blocker.stunTime=enemy.stunTime=100;for(const u of R.state.units)u.cooldown=999;
    let maxY=0,minGap=Infinity;
    for(let i=0;i<150;i++){R.updateBattle(1/30);maxY=Math.max(maxY,Math.abs(rear.offset));minGap=Math.min(minGap,Q.distance(rear,blocker));}
    return {advance:rear.lane-1500,maxY,minGap};
  });report.bypass=bypass;
  check('A rear melee soldier can pass through a stationary friendly body',bypass.advance>60&&bypass.minGap<17);
  const spear=await page.evaluate(()=>{
    const R=__ROADLORDS_RUNTIME__,Q=__ROADLORDS_ROAD__;
    R.P.race='orc';R.E.race='human';R.state.units=[];Q.state.pending=[];
    const u=R.releaseUnit(R.P,{key:'orc_warg'}),t=R.releaseUnit(R.E,{key:'swordsman'});
    u.lane=1500;t.lane=1600;u.offset=t.offset=0;u.firstAttacks=0;u.cooldown=0;t.hp=t.maxHp=10000;t.shield=t.tempShield=0;
    const originalU=structuredClone(u),originalT=structuredClone(t);R.roadResolving=true;
    try{R.roadRealAttack(u,t,{});}finally{R.roadResolving=false;}
    const expected=10000-t.hp;
    for(const key of Object.keys(u))delete u[key];Object.assign(u,originalU);
    for(const key of Object.keys(t))delete t[key];Object.assign(t,originalT);
    R.roadReindex();R.orcBeforeCombat13(u,[t],0);
    const a=u.roadAttack,queued=!!a?.ranged&&a.orcSpear&&!u.orcSpearReady;
    if(!a)return {queued:false};
    Q.state.clock=a.hit-.001;Q.impact();const early=t.hp===10000;
    Q.state.clock=a.hit+.001;Q.impact();
    return {queued,early,damage:10000-t.hp,expected,consumed:!u.orcSpearReady};
  });report.spear=spear;console.log("SPEAR",JSON.stringify(spear));
  check('Warg opening spear remains ranged, resolves at impact and preserves the original bonus damage',spear.queued&&spear.early&&spear.consumed&&spear.damage>0&&Math.abs(spear.damage-spear.expected)<.001);
  const figures=await page.evaluate(()=>{
    const R=__ROADLORDS_RUNTIME__,Q=__ROADLORDS_ROAD__,u=R.state.units[0],clock=Q.state.clock;
    for(const key of Object.keys(R.UNITS)){
      const actor={...u,key,lane:Q.state.camera+200,offset:0,roadMoving:false,roadAttack:null};
      R.roadDrawUnit(actor);R.roadDrawUnit({...actor,roadMoving:true});
      R.roadDrawUnit({...actor,roadAttack:{start:clock-.04,launch:clock+.2,hit:clock+.2,end:clock+.44}});
      R.roadDrawUnit({...actor,death:clock-.3},true);
    }
    const keys=[...Q.state.sprites.keys()];return {count:keys.length,valid:Object.keys(R.UNITS).every(k=>['idle','walk','attack','death'].every(state=>keys.some(id=>id.startsWith('figure:'+k+':')&&id.includes(':'+state+':'))))};
  });
  check('All 21 unit models render idle, walking, attack and death poses with a bounded cache',figures.valid&&figures.count<=768);
  const poses=await page.evaluate(()=>{
   const Q=__ROADLORDS_ROAD__,u=__ROADLORDS__.state.units[0],a={start:10,launch:10.24,hit:10.24,end:10.48};
   const subject={...u,roadAttack:a,roadMoving:false};
   return {wind:Q.pose(subject,10.05),strike:Q.pose(subject,10.23),recovery:Q.pose(subject,10.3),idle:Q.pose(subject,10.5),dead:Q.pose({...subject,death:10},10.5,true)};
  });
  check('Animation has distinct wind-up, strike, recovery, idle and death poses',poses.wind.frame<poses.strike.frame&&poses.strike.frame<poses.recovery.frame&&poses.idle.state==='idle'&&poses.dead.state==='death');
  await page.evaluate(()=>{__ROADLORDS_ROAD__.startTest(42,{count:50});});
  await page.evaluate(()=>{window.flowPerf={at:performance.now(),frames:0,active:true};function frame(){if(!flowPerf.active)return;flowPerf.frames++;requestAnimationFrame(frame);}requestAnimationFrame(frame);});
  await page.waitForTimeout(6000);await page.evaluate(()=>__ROADLORDS_ROAD__.pause());
  report.realtime=await page.evaluate(()=>{flowPerf.active=false;return {...__ROADLORDS_ROAD__.snapshot(),averageFPS:flowPerf.frames*1000/(performance.now()-flowPerf.at)};});
  check('50/50 battle advances in real time with visible attacks and damage',report.realtime.time>3&&report.realtime.metrics.attacks>0&&report.realtime.metrics.damage>0);
  await page.screenshot({path:'artifacts/battle-flow-realtime.png'});
  check('No battle-flow runtime errors',report.errors.length===0);
  fs.writeFileSync('artifacts/battle-flow-results.json',JSON.stringify(report,null,2));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
