const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox','--disable-dev-shm-usage']});
 const errors=[];
 try{
  const p=await browser.newPage({viewport:{width:1920,height:1080}});await p.route('https://**/*',r=>r.abort());p.on('pageerror',e=>errors.push(e.message));
  await p.goto(process.env.ROADLORDS_TEST_URL||'http://127.0.0.1:4173/Roadlords/');await p.waitForFunction(()=>!!window.__ROADLORDS_RUNTIME__);
  await p.locator('.menuBrand').click();await p.waitForTimeout(900);
  await p.evaluate(()=>{
   const R=__ROADLORDS_RUNTIME__;R.roadStartTest(42,{count:50});R.ROAD.paused=true;R.state.units=[];R.ROAD.dead=[];
   R.roadResetCity(R.P,'undead');R.roadResetCity(R.E,'orc');R.P.unitColor='green';R.E.unitColor='purple';R.P.normal.und_territory=4;
   R.renderStatic();R.roadWar.scrollLeft=R.ROAD.city+R.territoryBoundary()-R.ROAD.w/2;
  });await p.waitForTimeout(100);
  const boundary=await p.evaluate(()=>{
   const R=__ROADLORDS_RUNTIME__;R.renderBattle(0);const x=R.pointAt(R.territoryBoundary(),0).x;
   return {x,width:R.ROAD.w,left:[...R.ctx.getImageData(Math.round(x-2),20,1,1).data],right:[...R.ctx.getImageData(Math.round(x+2),20,1,1).data]};
  });
  assert(boundary.x>10&&boundary.x<boundary.width-10,'Expanded border must be on screen');
  assert.deepEqual(boundary.left.slice(0,3),[57,139,89]);assert.deepEqual(boundary.right.slice(0,3),[138,91,188]);
  console.log('PASS The actual expanded battlefield border paints two adjacent lines in the selected green and purple team colours');
  fs.mkdirSync('artifacts',{recursive:true});await p.screenshot({path:'artifacts/territory-border-4.58.png'});
  await p.evaluate(()=>{
   const R=__ROADLORDS_RUNTIME__;R.roadResetCity(R.P,'orc');R.P.terrain.fill(null);R.P.buildings=R.P.buildings.filter(b=>b.type==='keep');
   const b={id:'overseer-ui',type:'orc_overseer',row:3,col:3,rotation:0,level:4,progress:0};R.P.buildings.push(b);R.P.levels.orc_overseer=4;R.P.l4Branches.orc_overseer='ruthless';
   R.state.openBuildingInspectors=[b.id];R.roadWar.scrollLeft=0;R.renderStatic();
  });
  const slider=p.locator('[data-overseer="overseer-ui"]');await slider.focus();await slider.press('End');
  assert(await p.evaluate(()=>{const R=__ROADLORDS_RUNTIME__;return R.P.orcHasteSettings['overseer-ui']===1&&R.mpStrategy(R.P).orcHasteSettings['overseer-ui']===1;}));
  assert((await slider.locator('..').textContent()).includes('25%'));
  console.log('PASS The real L4 inspector slider updates birth HP and serializes its setting through the multiplayer strategy contract');
  await p.screenshot({path:'artifacts/overseer-slider-4.58.png'});
  assert.equal(errors.length,0,errors.join('\n'));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
