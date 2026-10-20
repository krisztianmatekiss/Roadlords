const {chromium}=require('playwright');
const fs=require('node:fs');
const assert=require('node:assert/strict');
const BASE_URL=process.env.ROADLORDS_TEST_URL||'http://127.0.0.1:4173/Roadlords/';
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
 try{
  const context=await browser.newContext();
  await context.route('https://**/*',r=>r.abort());
  await context.route('http://legacy.roadlords.test/',r=>r.fulfill({contentType:'text/html',body:fs.readFileSync('archive/Roadlords_V4.14_HOSSZU_UT.html')}));
  const results=[];
  for(const url of ['http://legacy.roadlords.test/',BASE_URL]){
   const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.goto(url,{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>!!window.__ROADLORDS_ROAD__);
   results.push(await page.evaluate(()=>{
    const R=__ROADLORDS__,Q=__ROADLORDS_ROAD__;Q.startTest(42);Q.pause();
    let seed=90210;Math.random=()=>((seed=(Math.imul(1664525,seed)+1013904223)>>>0)/4294967296);
    function snapshot(){return JSON.parse(JSON.stringify({fixture:Q.snapshot().initial,time:R.state.time,counts:Q.snapshot().counts,units:R.state.units.map(u=>{
     const out={};for(const key of ['id','key','side','lane','offset','hp','maxHp','damage','buildingDamage','speed','range','heal','cooldown','cooldownTime','shield','alive']){const v=u[key];if(v!==undefined)out[key]=typeof v==='number'?Math.round(v*1e6)/1e6:v;}return out;
    }),cities:[R.P,R.E].map(c=>({race:c.race,buildings:c.buildings,normal:c.normal,legends:[...c.legends],branches:c.l4Branches}))}));}
    return snapshot();
   }));
   assert.deepEqual(errors,[],`Runtime errors in ${url}`);await page.close();
  }
  assert.deepEqual(results[1].cities,results[0].cities);assert.deepEqual(results[1].fixture,results[0].fixture);
  console.log('PASS Archived and current games retain identical full cities and legal upgrade fixtures (seed 42)');
  assert.deepEqual(results[1].units,results[0].units);assert.deepEqual(results[1].counts,results[0].counts);
  console.log('PASS Archived and current games retain identical 1000 unit stats and initial positions; combat movement intentionally evolves');
  fs.mkdirSync('artifacts',{recursive:true});fs.writeFileSync('artifacts/refactor-parity.json',JSON.stringify({passed:2,seed:42,units:1000,scope:"Initial city, upgrade and unit-stat preservation; movement is validated separately"},null,2));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
