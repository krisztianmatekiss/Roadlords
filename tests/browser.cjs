const BASE_URL=process.env.ROADLORDS_TEST_URL||'http://127.0.0.1:4173/Roadlords/';
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {spawn}=require('node:child_process');
const report={checks:[],benchmarks:[],errors:[]};
const check=(name,result=true)=>{assert(result,name);report.checks.push(name);console.log('PASS',name)};
let server,browser;
async function main(){
  fs.mkdirSync('artifacts',{recursive:true});
  browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--autoplay-policy=user-gesture-required']});
  const context=await browser.newContext({viewport:{width:1440,height:960}});
  // Validate the deliverable without CDN, music, or signaling service dependencies.
  await context.route('https://**/*',r=>r.abort());
  const page=await context.newPage();page.on('pageerror',e=>report.errors.push(e.message));
  page.on('console',m=>{if(m.type()==='error'&&m.text().includes('Roadlords V4.9.65'))report.errors.push(m.text())});
  await page.goto(BASE_URL,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>!!window.__ROADLORDS_ROAD__);await page.evaluate(()=>__ROADLORDS_ROAD__.artReady);
  check('Production modules load all 14 unit sprites without an external CDN',await page.evaluate(()=>__ROADLORDS_ROAD__.state.art.size===14&&typeof Peer==='function'));
  await page.locator('.menuBrand').click();await page.waitForTimeout(1000);
  await page.screenshot({path:'artifacts/menu.png'});
  check('TESZTEK groups battle tests behind one main menu entry',await page.locator('.menuMain #roadTestsMenu').isVisible()&&!await page.locator('#roadTestMenu').isVisible());
  await page.locator('#roadTestsMenu').click();
  await page.locator('#roadTestMenu').click();await page.evaluate(()=>__ROADLORDS_ROAD__.pause());
  let initial=await page.evaluate(()=>__ROADLORDS_ROAD__.snapshot());
  check('One menu click generates exactly 50 units per side and all 14 types',initial.initial.counts.every(n=>n===50)&&initial.initial.keys.length===14);
  report.randomFixture=initial.initial;
  // Keep performance and casualty checks reproducible; the menu's random generation is checked above.
  await page.evaluate(()=>{__ROADLORDS_ROAD__.startTest(42);__ROADLORDS_ROAD__.pause();});
  initial=await page.evaluate(()=>__ROADLORDS_ROAD__.snapshot());report.initial=initial;
  async function validateCities(){return page.evaluate(()=>{
    const R=__ROADLORDS__,out=[];
    for(const c of [R.P,R.E]){
      const cells=new Set(),bad=[];
      for(const b of c.buildings){for(const [dr,dc] of R.rotatedShape(b.type,b.rotation||0)){const r=b.row+dr,col=b.col+dc,k=r*R.GRID+col;if(r<0||col<0||r>=R.GRID||col>=R.GRID||cells.has(k))bad.push(k);cells.add(k);}
        if(b.level!==__ROADLORDS_ORCS__.maxLevel(b.type)&&c.race==='orc')bad.push('level:'+b.type);
        const branch=c.l4Branches[b.type],branches=(c.race==='orc'&&b.type==='keep'?__ROADLORDS_ORCS__.keepBranches:R.V4_BRANCHES[b.type]);if(b.level===4&&branches?.length&&!branches.some(x=>x.id===branch))bad.push('branch:'+b.type);
      }
      for(const id of Object.keys(c.normal))if(!R.NORMAL.some(o=>o.id===id&&(c.race==='orc'?o.race==='orc':o.race!=='orc')))bad.push('normal:'+id);
      for(const id of c.legends)if(!R.LEGENDARY.some(o=>o.id===id&&(c.race==='orc'?o.race==='orc':o.race!=='orc')))bad.push('legend:'+id);
      out.push({race:c.race,cells:cells.size,buildings:c.buildings.length,military:[...new Set(c.buildings.map(b=>R.BUILDINGS[b.type].unit).filter(Boolean))].length,bad});
    }return out;
  });}
  const cities=await validateCities();report.cities=cities;
  check('Endgame cities have nonoverlapping legal footprints, one legal branch per type and faction-correct upgrades',cities.every(c=>!c.bad.length&&c.military===7&&c.cells>=90));
  const hudBefore=await page.locator('#roadHud').boundingBox();
  await page.locator('[data-camera="0"]').click();await page.screenshot({path:'artifacts/own-city.png'});
  const scroll0=await page.locator('.war').evaluate(e=>e.scrollLeft);
  await page.locator('[data-camera="2"]').click();const scroll1=await page.locator('.war').evaluate(e=>e.scrollLeft);
  const hudAfter=await page.locator('#roadHud').boundingBox();
  check('Map scrolls across several screens and HUD stays fixed',scroll0===0&&scroll1>2000&&Math.abs(hudBefore.x+hudBefore.width/2-hudAfter.x-hudAfter.width/2)<1);
  await page.locator('[data-camera="1"]').click();
  const t0=await page.evaluate(()=>__ROADLORDS__.state.time);await page.waitForTimeout(600);
  check('Pause freezes simulation and damage',await page.evaluate(t=>__ROADLORDS__.state.time===t,t0));
  await page.locator('#roadPause').click();
  await page.evaluate(()=>{window.testFrames={at:performance.now(),count:0,done:false};function frame(){if(testFrames.done)return;testFrames.count++;requestAnimationFrame(frame)}requestAnimationFrame(frame);});
  await page.waitForTimeout(12000);await page.locator('#roadPause').click();
  const fps=await page.evaluate(()=>{testFrames.done=true;const ms=performance.now()-testFrames.at;return {frames:testFrames.count,wallMs:ms,averageFPS:testFrames.count*1000/ms};});
  const after=await page.evaluate(()=>__ROADLORDS_ROAD__.snapshot());
  report.benchmarks.push({mode:'headless Chromium 1440x960, 12 seconds wall time, seed 42',...fps,...after});
  check('Real-time 1000-unit battle progresses, damages and kills units without runtime errors',after.time>5&&after.metrics.damage>0&&after.counts[0]+after.counts[1]<1000&&!after.error);
  await page.screenshot({path:'artifacts/battle.png'});
  // Deterministic restart reproduces cities/factions/composition while combat may roll new random outcomes.
  const seed=after.seed;await page.locator('#roadRestart').click();await page.evaluate(()=>__ROADLORDS_ROAD__.pause());
  const restarted=await page.evaluate(()=>__ROADLORDS_ROAD__.snapshot());
  check('Restart restores 500/500 using the same city and army seed',restarted.seed===seed&&restarted.initial.counts.every(n=>n===500)&&JSON.stringify(restarted.initial)===JSON.stringify(initial.initial));
  // Vary layouts/builds, rather than proving only a single lucky random seed.
  for(const seed of [1,7,42,2026]){
    await page.evaluate(seed=>{__ROADLORDS_ROAD__.startTest(seed);__ROADLORDS_ROAD__.pause();},seed);
    const c=await validateCities();check('Legal full endgame fixture seed '+seed,c.every(x=>!x.bad.length&&x.military===7&&x.cells>=90));
  }
  // Isolate two genuine units; invoke the same live combat functions used by the game.
  const timing=await page.evaluate(()=>{
    const R=__ROADLORDS__,Q=__ROADLORDS_ROAD__,road=Q.state;
    function setup(a='swordsman',b='swordsman'){
      R.state.units=[];road.pending=[];road.dead=[];
      for(const c of [R.P,R.E]){c.race='human';c.normal={};c.legends=new Set();c.l4Branches={};}
      for(const t of R.towers)t.alive=false;
      const u=R.releaseUnit(R.P,{key:a}),v=R.releaseUnit(R.E,{key:b});
      u.lane=1500;v.lane=1526;u.offset=v.offset=0;u.cooldown=v.cooldown=100;Q.reindex();return [u,v];
    }
    let [u,v]=setup(),hp=v.hp;R.attackUnit(u,v);let instant=v.hp===hp;R.updateBattle(.05);let windup=v.hp===hp;R.updateBattle(.2);let melee=v.hp<hp;
    [u,v]=setup('archer');v.lane=1630;Q.reindex();hp=v.hp;R.attackUnit(u,v);R.updateBattle(.1);let flying=v.hp===hp;R.updateBattle(.4);let arrow=v.hp<hp;
    [u,v]=setup();v.offset=160;Q.reindex();let far=!R.preferredTarget(u,[v]);v.offset=0;u.roadAimAt=0;Q.reindex();let near=R.preferredTarget(u,[v])===v;
    R.killUnit(v,true);let death=road.dead.some(d=>d.key===v.key);
    road.paused=false;R.state.running=true;R.state.ended=false;Q.step(1/30);const victory=R.state.ended&&!!road.result;road.paused=true;
    return {instant,windup,melee,flying,arrow,far,near,death,victory};
  });
  for(const [k,v] of Object.entries(timing))check('Combat timing / geometry: '+k,v);
  // Sustain 30 simulated seconds and measure tick costs after warmup; chunks allow rendering.
  await page.evaluate(()=>{__ROADLORDS_ROAD__.startTest(42);__ROADLORDS_ROAD__.pause();});
  const times=[];
  for(let part=0;part<15;part++){
    const sample=await page.evaluate(()=>{const a=[];for(let i=0;i<60;i++){const t=performance.now();__ROADLORDS__.updateBattle(1/30);a.push(performance.now()-t);}return a;});times.push(...sample);
  }
  times.sort((a,b)=>a-b);const long=await page.evaluate(()=>__ROADLORDS_ROAD__.snapshot());
  report.benchmarks.push({mode:'900 real combat steps = 30 simulation seconds, seed 42',p50TickMs:times[450],p95TickMs:times[855],p99TickMs:times[891],...long});
  check('Sustained battle remains finite with bounded pending attacks and corpse cache',long.counts.every(n=>Number.isFinite(n)&&n>=0)&&long.pending<=1000&&long.corpses<=220&&!long.error);
  const crowd=await page.evaluate(()=>{const R=__ROADLORDS__,units=R.state.units.filter(u=>u.alive);let close=0,friendly=0;for(let i=0;i<units.length;i++)for(let j=i+1;j<units.length;j++)if(__ROADLORDS_ROAD__.distance(units[i],units[j])<10){if(units[i].side===units[j].side)friendly++;else close++;}return {units:units.length,opposingOverlaps:close,friendlyOverlaps:friendly};});
  report.crowding=crowd;check('Opposing units remain separated; friendly overlap is intentional',crowd.opposingOverlaps===0);
  const cdp=await context.newCDPSession(page);await cdp.send('HeapProfiler.collectGarbage');report.heap=await cdp.send('Runtime.getHeapUsage');
  // The return button performs a clean reload; no battle state leaks into solo/multiplayer.
  await Promise.all([page.waitForEvent('domcontentloaded'),page.locator('#roadMenu').click()]);await page.waitForFunction(()=>!!window.__ROADLORDS_ROAD__);
  check('Return to main menu restores a fresh game',await page.evaluate(()=>!__ROADLORDS_ROAD__.state.test&&__ROADLORDS__.state.time===0&&getComputedStyle(document.querySelector('.mpLobby')).display!=='none'));
  await page.locator('.menuBrand').click();await page.waitForTimeout(900);await page.locator('#mpSolo').click();await page.locator('#soloRace').selectOption('human');await page.locator('#aiRace').selectOption('orc');await page.locator('#raceContinue').click();await page.locator('#pregameReady').click();
  // Complete real offered starter choices, advancing only the waiting interval.
  for(let i=0;i<4;i++){
    await page.waitForFunction(()=>!!__ROADLORDS__.state.choiceContext);
    await page.evaluate(()=>{const R=__ROADLORDS__;R.choose(R.state.choiceContext.opts[0],0);});
    await page.evaluate(()=>{const R=__ROADLORDS__;for(let j=0;j<160&&!R.state.modal;j++)R.tick(1/30);});
  }
  const solo=await page.evaluate(()=>{const R=__ROADLORDS__;R.state.modal=false;R.state.running=true;const before=R.P.resources.wood;for(let i=0;i<60;i++)R.tick(1/30);return {time:R.state.time,starters:R.state.startChoices,race:R.E.race,gain:R.P.resources.wood-before,test:__ROADLORDS_ROAD__.state.test,error:R.state.lastRuntimeErrorV4965};});
  check('Normal solo still selects races, completes four starter choices, runs economy and AI',solo.time>0&&solo.starters===0&&solo.race==='orc'&&!solo.test&&!solo.error);
  await page.locator('.war').evaluate(e=>e.scrollLeft=1000);
  await page.keyboard.press('d');
  const normalCamera=await page.locator('.war').evaluate(e=>e.scrollLeft);
  check('Normal solo uses the new camera keys and pinned city without the floating road panel',normalCamera>1000&&!await page.locator('#roadHud').isVisible()&&await page.locator('#enemyCityPin').getAttribute('aria-pressed')==='true');
  await page.evaluate(()=>{const R=__ROADLORDS_RUNTIME__;R.state.running=false;R.state.modal=false;R.P.resources={...R.P.caps};R.roadWar.scrollLeft=0;R.renderStatic();});
  await page.locator('.tab[data-cat="all"]').click();await page.locator('#buildList .buildcard[data-k="lumber"]').click();
  const placement=await page.evaluate(()=>{const R=__ROADLORDS_RUNTIME__;for(let r=0;r<R.GRID;r++)for(let c=0;c<R.GRID;c++){
    const o=R.placementOrigin('lumber',R.state.buildRotation,r,c);
    if(R.canPlace(R.P,'lumber',o.row,o.col,R.state.buildRotation)&&R.$(`#playerGrid .plot[data-r="${r}"][data-c="${c}"]`))return {r,c,before:R.P.buildings.length};
  }});
  assert(placement,'An empty build location must remain available');
  await page.locator(`#playerGrid .plot[data-r="${placement.r}"][data-c="${placement.c}"]`).click();
  await page.waitForTimeout(100);
  check('Normal build cards place a real building while build hints and notices remain below the city',await page.evaluate(before=>{const city=document.querySelector('.playerframe').getBoundingClientRect(),toast=document.querySelector('#toast').getBoundingClientRect(),hint=document.querySelector('#placementHint').getBoundingClientRect();return __ROADLORDS__.P.buildings.length===before+1&&toast.top>=city.bottom&&hint.top>=city.bottom&&getComputedStyle(document.querySelector('#placementHint')).pointerEvents==='none';},placement.before));
  report.solo=solo;
  await page.screenshot({path:'artifacts/solo.png'});
  check('No application page errors',report.errors.length===0);
  fs.writeFileSync('artifacts/test-results.json',JSON.stringify(report,null,2));
  console.log('DONE',report.checks.length,'checks');
}
main().catch(e=>{console.error(e);report.failure=String(e.stack||e);fs.mkdirSync('artifacts',{recursive:true});fs.writeFileSync('artifacts/test-results.json',JSON.stringify(report,null,2));process.exitCode=1;}).finally(async()=>{await browser?.close();server?.kill();});
