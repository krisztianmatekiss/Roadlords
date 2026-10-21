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
  assert.equal(results[1].units.length,results[0].units.length);
  for(let i=0;i<results[0].units.length;i++){
   const expected={...results[0].units[i]},actual=results[1].units[i],city=results[0].cities[expected.side==='player'?0:1];
   const scale=(key,factor)=>{if(expected[key]!==undefined){assert(Math.abs(actual[key]-expected[key]*factor)<1e-5,`${expected.key} ${key}: approved balance delta`);expected[key]=actual[key];}};
   // Only the explicitly approved balance changes may differ from the archive.
   if(expected.key==='orc_warrior'){scale('hp',250/300);scale('maxHp',250/300);}
   if(expected.key==='orc_goblin'&&city.legends.includes('orc_gob_bow')){
    scale('damage',1.5/2);scale('buildingDamage',1.5/2);
    if(city.legends.includes('orc_momentum')){
     const damage=1+.1*(city.normal.orc_goblin_dmg||0);
     scale('cooldownTime',(1+(damage*2-1)*.5)/(1+(damage*1.5-1)*.5));
    }
   }
   assert.deepEqual(actual,expected);
  }
  assert.deepEqual(results[1].counts,results[0].counts);
  console.log('PASS All 1000 initial units preserve positions and stats except the explicitly approved balance deltas');
  fs.mkdirSync('artifacts',{recursive:true});fs.writeFileSync('artifacts/refactor-parity.json',JSON.stringify({passed:2,seed:42,units:1000,scope:"City and unit preservation with approved V4.24 balance deltas; movement and splash damage validated separately"},null,2));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
