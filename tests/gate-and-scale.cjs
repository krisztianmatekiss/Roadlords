const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
const URL=process.env.ROADLORDS_TEST_URL||'http://127.0.0.1:4173/Roadlords/';
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
 const report={checks:[],errors:[]},check=(name,ok)=>{assert(ok,name);report.checks.push(name);console.log('PASS',name);};
 try{
  const page=await browser.newPage({viewport:{width:1920,height:1080}});await page.route('https://**/*',r=>r.abort());page.on('pageerror',e=>report.errors.push(e.message));
  await page.goto(URL);await page.waitForFunction(()=>!!window.__ROADLORDS_ROAD__);await page.evaluate(()=>__ROADLORDS_ROAD__.artReady);
  await page.locator('.menuBrand').click();await page.waitForTimeout(900);await page.locator('#roadTestsMenu').click();await page.locator('#roadTestMenu').click();
  await page.evaluate(()=>{__ROADLORDS_ROAD__.startTest(42,{count:50});__ROADLORDS_ROAD__.pause();});
  check('Both gate openings are 50% wider across the road, with their previous wall thickness',await page.evaluate(()=>[...document.querySelectorAll('.roadWorld .gate')].every(g=>{const r=g.getBoundingClientRect();return Math.abs(r.height-Math.max(104,Math.min(208,innerWidth*.0542))*1.5)<.1&&Math.abs(r.width-Math.max(34,Math.min(68,innerWidth*.0177)))<.1;})));
  const releases=await page.evaluate(()=>{
   const R=__ROADLORDS_RUNTIME__,Q=__ROADLORDS_ROAD__;Q.state.zoom=1;R.state.units=[];Q.state.pending=[];Q.state.dead=[];
   const results=[];
   for(const [city,keys,id] of [[R.P,Object.keys(R.UNITS).filter(k=>!k.startsWith('orc_')),'playerGate'],[R.E,Object.keys(R.UNITS).filter(k=>k.startsWith('orc_')),'enemyGate']]){
    const gate=R.$('#'+id).getBoundingClientRect(),war=R.roadWar.getBoundingClientRect(),scale=Q.state.h/600;
    for(let i=0;i<keys.length*5;i++){
     const u=R.releaseUnit(city,R.makeEntry(city,keys[i%keys.length])),y=war.top+R.pointAt(u.lane,u.offset).y;
     results.push({key:u.key,length:R.PATH_LENGTH,lane:u.lane,top:y-64*scale,bottom:y+8*scale,gateTop:gate.top,gateBottom:gate.bottom,offset:u.offset,home:u.roadHomeOffset});
    }
   }
   return results;
  });report.releases=releases;
  check('All 21 registered unit types emerge only inside the correct gate opening',releases.length===105&&releases.every(u=>(u.lane===6||u.lane===u.length-6)&&u.top>=u.gateTop-.1&&u.bottom<=u.gateBottom+.1));
  check('Gate release preserves a wider destination formation without spawning on that formation',releases.some(u=>Math.abs(u.home)>200)&&releases.every(u=>Math.abs(u.offset)<100));
  const queue=await page.evaluate(()=>{
   const R=__ROADLORDS_RUNTIME__,Q=__ROADLORDS_ROAD__;Q.state.test=false;R.state.units=[];Q.state.pending=[];for(const c of [R.P,R.E]){c.releaseQueue=[];c.garrison=[];c.releaseAcc=0;c.gateMode='closed';c.autoReleasing=false;}
   R.P.releaseQueue=[R.makeEntry(R.P,'swordsman'),R.makeEntry(R.P,'knight')];R.releaseQueues(1);const closed=R.state.units.length;
   R.P.gateMode='open';R.releaseQueues(1);const queued=R.state.units.map(u=>({lane:u.lane,offset:u.offset}));
   R.P.rallyReserve=[R.makeEntry(R.P,'swordsman')];R.releaseRally(R.P);const rally=R.state.units.at(-1);
   const gate=R.$('#playerGate').getBoundingClientRect(),war=R.roadWar.getBoundingClientRect();
   Q.state.test=true;return {closed,queued,rally:{lane:rally.lane,y:war.top+R.pointAt(rally.lane,rally.offset).y},gate:{top:gate.top,bottom:gate.bottom}};
  });report.queues=queue;
  check('Closed gates retain queued troops; normal and rally releases use the same gate exit',queue.closed===0&&queue.queued.length===2&&queue.queued.every(u=>u.lane===6&&Math.abs(u.offset)<100)&&queue.rally.lane===6&&queue.rally.y>queue.gate.top&&queue.rally.y<queue.gate.bottom);
  const movement=await page.evaluate(()=>{
   const R=__ROADLORDS_RUNTIME__,Q=__ROADLORDS_ROAD__;R.state.units=[];Q.state.pending=[];Q.state.dead=[];const u=R.releaseUnit(R.P,R.makeEntry(R.P,'swordsman'));u.roadHomeOffset=200;u.cooldown=999;
   R.updateBattle(1/30);const start={lane:u.lane,offset:u.offset};let maxRatio=0;
   for(let i=0;i<90;i++){const prev={lane:u.lane,offset:u.offset},speed=R.effectiveMoveSpeed(u,R.P);R.updateBattle(1/30);maxRatio=Math.max(maxRatio,Math.hypot(u.lane-prev.lane,u.offset-prev.offset)/(speed/30));}
   return {forward:u.lane-start.lane,side:u.offset-start.offset,maxRatio};
  });report.movement=movement;
  check('Units advance and fan out continuously after the gate without teleporting into road-wide rows',movement.forward>50&&movement.side>1&&movement.maxRatio<=1.001);
  const scales=await page.evaluate(()=>{
   const R=__ROADLORDS_RUNTIME__,Q=__ROADLORDS_ROAD__;R.state.units=[];Q.state.pending=[];Q.state.dead=[];Q.state.zoom=1;
   const keys=Object.keys(R.UNITS),units=[];
   for(let i=0;i<241;i++){const u=R.releaseUnit(i%2?R.E:R.P,{key:keys[i%keys.length]});u.lane=2400+(i%7)*5;u.offset=(i%16-8)*20;u.roadMoving=false;units.push(u);}
   R.roadFocusFront();
   function scaleOf(u){const original=R.ctx.drawImage;let value;R.ctx.drawImage=function(...a){if(a[0].figureBounds){const t=this.getTransform();value=[Math.abs(t.a),t.d,a.slice(-4)];}return original.apply(this,a);};try{R.roadDrawUnit(u);}finally{R.ctx.drawImage=original;}return value;}
   const results=[];
   for(const style of ['simple','refined']){
    Q.state.figureStyle=style;const samples=[];
    for(const count of [240,241,240]){R.state.units=units.slice(0,count);Q.render(0);samples.push({low:Q.state.lowDetail,scale:units.slice(0,21).map(scaleOf)});}
    results.push({style,samples});
   }
   const before=scaleOf(units[0])[0],time=R.state.time;Q.state.zoom=1.25;Q.render(0);const after=scaleOf(units[0])[0];
   return {results,zoomRatio:after/before,sameTime:R.state.time===time};
  });report.scales=scales;
  check('All 21 models retain their drawn size across 240/241/240 visible troops in both graphics modes',scales.results.every(r=>JSON.stringify(r.samples.map(s=>s.low))==='[false,true,false]'&&JSON.stringify(r.samples[0].scale)===JSON.stringify(r.samples[1].scale)&&JSON.stringify(r.samples[0].scale)===JSON.stringify(r.samples[2].scale)));
  check('Intentional zoom still enlarges figures independently of the detail threshold and simulation',Math.abs(scales.zoomRatio-1.25)<.001&&scales.sameTime);
  await page.evaluate(()=>{const R=__ROADLORDS_RUNTIME__,Q=__ROADLORDS_ROAD__;Q.state.zoom=1;R.state.units=[];Q.state.pending=[];Q.state.dead=[];for(let i=0;i<10;i++)R.releaseUnit(R.P,{key:'swordsman'});R.roadWar.scrollLeft=0;});await page.waitForTimeout(100);
  await page.screenshot({path:'artifacts/gate-exit.png'});
  await page.setViewportSize({width:1440,height:960});await page.waitForTimeout(100);
  check('Responsive gate exits recompute from the current opening after resize',await page.evaluate(()=>{const R=__ROADLORDS_RUNTIME__,u=R.releaseUnit(R.E,{key:'orc_troll'}),gate=R.$('#enemyGate').getBoundingClientRect(),war=R.roadWar.getBoundingClientRect(),y=war.top+R.pointAt(u.lane,u.offset).y,s=R.ROAD.h/600;return y-64*s>=gate.top-.1&&y+8*s<=gate.bottom+.1;}));
  check('Gate release and density transitions produce no runtime errors',!report.errors.length&&!await page.evaluate(()=>__ROADLORDS__.state.lastRuntimeErrorV4965));
 }finally{fs.mkdirSync('artifacts',{recursive:true});fs.writeFileSync('artifacts/gate-and-scale.json',JSON.stringify(report,null,2));await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
