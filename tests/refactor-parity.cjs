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
    const R=__ROADLORDS__,Q=__ROADLORDS_ROAD__;
    // Compare the same content pool with the archive. New V4.35 cards have dedicated live-combat tests.
    const additions=new Set(['orc_cursed_damage','orc_move','orc_siege_damage','orc_lifesteal','orc_food_discount','orc_skip_power','orc_enemy_ancestors']);
    for(const pool of [R.NORMAL,R.LEGENDARY])for(let i=pool.length-1;i>=0;i--)if(additions.has(pool[i].id))pool.splice(i,1);
    Q.startTest(42);Q.pause();
    let seed=90210;Math.random=()=>((seed=(Math.imul(1664525,seed)+1013904223)>>>0)/4294967296);
    function snapshot(){return JSON.parse(JSON.stringify({pathLength:R.PATH_LENGTH,fixture:Q.snapshot().initial,time:R.state.time,counts:Q.snapshot().counts,units:R.state.units.map(u=>{
     const out={};for(const key of ['id','key','side','lane','offset','hp','maxHp','damage','buildingDamage','speed','range','heal','cooldown','cooldownTime','shield','alive']){const v=u[key];if(v!==undefined)out[key]=typeof v==='number'?Math.round(v*1e6)/1e6:v;}return out;
    }),cities:[R.P,R.E].map(c=>({race:c.race,buildings:c.buildings,normal:c.normal,legends:[...c.legends],branches:c.l4Branches}))}));}
    return snapshot();
   }));
   assert.deepEqual(errors,[],`Runtime errors in ${url}`);await page.close();
  }
  // The 4.58 redesign intentionally changes the draft pool, L4s and generated cities.
  // Exact pre-redesign upgrade/stat snapshots would assert obsolete game rules.
  assert.equal(results[1].units.length,results[0].units.length);
  assert.equal(results[1].units.length,1000);
  assert.equal(results[1].pathLength,results[0].pathLength*2);
  for(const result of results){
   assert.equal(new Set(result.units.map(u=>u.id)).size,1000);
   for(const side of ['player','enemy']){
    const army=result.units.filter(u=>u.side===side);assert.equal(army.length,500);
    assert(army.every(u=>u.alive&&u.hp>0&&u.maxHp>=u.hp&&u.damage>=0&&u.speed>0&&u.range>0&&u.lane>=0&&u.lane<=result.pathLength));
   }
  }
  console.log('PASS Archive and redesigned game both start real 500-vs-500 battles with unique, live actors on their respective roads');
  const retired=new Set(['hospital','towercommand','alchemist','academy','orc_altar','und_soul_harvester']);
  for(const city of results[1].cities){
   assert(city.buildings.every(b=>!retired.has(b.type)),'Endgame fixture must not restore retired buildings');
   assert(!city.legends.includes('tavern_chain')&&!city.legends.includes('orc_enemy_ancestors'));
  }
  console.log('PASS Redesigned full endgame cities and legal upgrade pools exclude retired buildings and obsolete relics');
  fs.mkdirSync('artifacts',{recursive:true});fs.writeFileSync('artifacts/refactor-parity.json',JSON.stringify({passed:2,seed:42,units:1000,scope:'Archive startup and army-size contract; new endgame fixture legality. Intentional balance changes are checked by faction-redesign, movement, combat and economy tests.'},null,2));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
