const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox','--disable-dev-shm-usage']});
 const report={checks:[],errors:[]},check=(name,ok,data)=>{assert(ok,`${name}${data?' '+JSON.stringify(data):''}`);report.checks.push(name);console.log('PASS',name);};
 try{
  const p=await browser.newPage({viewport:{width:1920,height:1080}});await p.route('https://**/*',r=>r.abort());p.on('pageerror',e=>report.errors.push(e.message));
  await p.goto(process.env.ROADLORDS_TEST_URL||'http://127.0.0.1:4173/Roadlords/');await p.waitForFunction(()=>window.__ROADLORDS_RUNTIME__?.menuOpening.ready);await p.locator('.menuBrand').click();await p.locator('#mpSolo').click();await p.locator('#soloRace').selectOption('human');await p.locator('#aiRace').selectOption('orc');await p.locator('#raceContinue').click();await p.waitForFunction(()=>__ROADLORDS_RUNTIME__.state.pregame);await p.locator('#pregameReady').click();await p.waitForFunction(()=>__ROADLORDS_RUNTIME__.state.choiceContext);
  await p.evaluate(()=>{const R=__ROADLORDS_RUNTIME__;Object.assign(R.state,{running:false,modal:false,pregame:false,startChoices:0,choiceContext:null});R.$('#choiceOverlay').classList.add('hidden');R.$('#pickReminder').classList.add('hidden');R.updateHud();R.roadResize();});
  check('Each city has exactly two detached defensive towers; wall towers remain purely painted decoration',await p.evaluate(()=>{const R=__ROADLORDS_RUNTIME__;return R.towers.length===10&&['player','enemy'].every(side=>{const towers=R.towers.filter(t=>t.side===side),final=towers.filter(t=>t.forecourtTower);return towers.length===5&&final.length===2&&final.every(t=>t.gateTower&&t.hp===27000&&t.alive&&t.lane===(side==='player'?.018:.982)*R.PATH_LENGTH)&&final.map(t=>t.lateral).sort((a,b)=>a-b).join(',')==='-57,40'&&!R.$(side==='player'?'.playerframe':'.enemyframe').querySelector('.chronicleGateTower,.chronicleTowerHealth')&&!!R.$(side==='player'?'.playerframe .chronicleWalls':'.enemyframe .chronicleWalls');});}));
  check('Destroying both forecourt towers exposes the capital without hidden wall-tower HP',await p.evaluate(()=>{const R=__ROADLORDS_RUNTIME__,saved=R.towers.map(t=>t.alive);try{for(const t of R.towers)t.alive=!!t.gateTower;R.roadRefreshFrontiers();const first=['player','enemy'].every(side=>R.targetStructure(side).forecourtTower);for(const side of ['player','enemy'])R.towers.find(t=>t.side===side&&t.gateTower).alive=false;R.roadRefreshFrontiers();const second=['player','enemy'].every(side=>R.targetStructure(side).forecourtTower);for(const t of R.towers)t.alive=false;R.roadRefreshFrontiers();return first&&second&&['player','enemy'].every(side=>R.targetStructure(side).capital);}finally{R.towers.forEach((t,i)=>t.alive=saved[i]);R.roadRefreshFrontiers();}}));
  const tower=await p.evaluate(()=>{const R=__ROADLORDS_RUNTIME__,t=R.towers.find(t=>t.forecourtTower&&t.side==='player');R.roadFocusLane(t.lane);R.renderBattle(0);return{id:t.id,...R.towerVisualBounds(t)};});
  const canvas=await p.locator('#battlefield').boundingBox();await p.mouse.click(canvas.x+tower.x+tower.width/2,canvas.y+tower.y+tower.height/2);
  check('The visible forecourt tower opens its own real inspector and range',await p.evaluate(id=>{const R=__ROADLORDS_RUNTIME__;return R.state.selectedTowerId===id&&R.towerNameV496(R.selectedTowerV496())==='Előtorony'&&R.canvas.dataset.towerRange?.includes('m');},tower.id));
  check('The new towers are part of the existing final tower phase of sudden death',await p.evaluate(()=>{const R=__ROADLORDS_RUNTIME__,groups=R.suddenGroupsV495();return R.towers.filter(t=>t.forecourtTower).every(t=>groups.some(g=>g.key==='gate'&&g.targets.includes(t)));}));
  const speeds=[];for(let i=0;i<3;i++){await p.locator('#speedBtn').click();speeds.push(await p.evaluate(()=>__ROADLORDS_RUNTIME__.state.speed));}
  check('Solo speed cycles through 2×, 3× and 1× with no 4× option',speeds.join(',')==='2,3,1',speeds);
  const combat=await p.evaluate(()=>{
   const R=__ROADLORDS_RUNTIME__,saved=R.towers.map(t=>[t,t.alive]),rows=[];R.towers.forEach(t=>t.alive=false);R.P.armyCap=R.E.armyCap=1000;R.state.selectedTowerId=null;R.$('#inspector').classList.remove('show');
   for(const side of ['player','enemy'])for(const offset of [-190,0,190])for(const key of ['swordsman','archer','orc_troll']){
    R.state.units=[];R.ROAD.pending=[];R.ROAD.clock+=2;R.roadRefreshFrontiers();
    const u=R.releaseUnit(R.cityForSide(side),{key}),city=side==='player'?R.E:R.P,target=R.targetStructure(side),dir=side==='player'?1:-1;
    u.offset=offset;u.lane=target.lane-dir*300;u.roadHomeOffset=0;u.roadAttack=null;u.stunTime=0;R.roadReindex();const before=u.offset;R.roadAdvance(u,[],.1);const held=Math.abs(u.offset-before)<.001;
    u.lane=target.lane-dir*Math.min(18,u.range*.8);u.cooldown=0;R.roadReindex();const hp=city.hp;R.updateBattle(0);const queued=R.ROAD.pending.find(p=>p.u===u),contact=queued?.a.toOffset;
    if(queued){R.ROAD.clock=queued.a.hit+.001;R.roadImpacts();}
    rows.push({side,key,offset,held,contact,damage:hp-city.hp});
   }
   for(const [t,alive]of saved)t.alive=alive;R.state.units=[];R.ROAD.pending=[];R.roadRefreshFrontiers();return rows;
  });report.combat=combat;
  check('Both cities take real melee, ranged and siege damage across their frontage without funneling attackers into the gate',combat.every(r=>r.held&&r.contact===r.offset&&r.damage>0),combat);
  const formations=await p.evaluate(()=>{
   const R=__ROADLORDS_RUNTIME__;R.state.units=[];R.state.selectedTowerId=null;R.P.garrison=[{key:'swordsman'},{key:'archer'}];R.E.garrison=[{key:'orc_warrior'}];
   for(const [side,key,lane]of [['player','swordsman',2600],['enemy','orc_warrior',6500]])for(let i=0;i<80;i++){const u=R.releaseUnit(R.cityForSide(side),{key});u.lane=lane+i;u.offset=(i%8-4)*20;}
   R.renderStatic();R.updateHud();R.roadFocusLane(4800);R.renderBattle(0);R.battleLayout.line.resize();R.battleLayout.line.draw(true);const line=R.battleLayout.line;return{height:line.geometry.height,placements:line.placements,hits:line.hits};
  });
  check('The unboxed event line has larger readable portraits, structure markers and full troop counts',formations.height>=150&&formations.placements.every(g=>g.r>=30)&&formations.placements.reduce((n,g)=>n+g.count,0)===160&&formations.hits.some(h=>h.capital&&h.r>=34),formations);
  await p.screenshot({path:'artifacts/frontage-478-overview.png'});
  for(const [width,height]of [[1267,587],[800,900],[2840,2180]]){await p.setViewportSize({width,height});await p.waitForTimeout(100);check(`Larger event line and demolition tool fit ${width}×${height}`,await p.evaluate(()=>{const R=__ROADLORDS_RUNTIME__,b=R.$('#uiTrialOverview').getBoundingClientRect(),hammer=R.$('#demolitionTool').getBoundingClientRect();return b.bottom<=innerHeight&&b.left>=0&&b.right<=innerWidth&&hammer.bottom<b.top&&R.battleLayout.line.placements.every(g=>g.x-g.r>=0&&g.x+g.r<=b.width&&g.y-g.r>=0&&g.y+g.r<=b.height);}));}
  await p.setViewportSize({width:1920,height:1080});
  for(const race of ['human','orc','undead']){
   const tiles=await p.evaluate(async race=>{const R=__ROADLORDS_RUNTIME__;R.roadResetCity(R.P,race);await R.loadChronicleArt([race]);R.P.terrain.fill(null);Object.keys(R.TERRAIN).forEach((type,i)=>R.P.terrain[R.idx(1+Math.floor(i/3),2+i%3)]={type});R.renderStatic();R.updateHud();R.roadResize();R.roadWar.scrollLeft=0;R.renderBattle(0);await R.chronicle.tile(race).cssReady;const plots=[...R.$$('#playerGrid .plot.terrain')];await Promise.all(plots.map(p=>p.querySelector('img').decode()));return plots.map(p=>{const img=p.querySelector('img'),a=p.getBoundingClientRect(),b=img.getBoundingClientRect(),css=getComputedStyle(img);return{src:img.src,width:img.naturalWidth,height:img.naturalHeight,fits:b.left>=a.left&&b.top>=a.top&&b.right<=a.right+1&&b.bottom<=a.bottom+1,transform:css.transform,filter:css.filter};});},race);
   check(`All six transparent terrain objects fit their own cells with no legacy zoom or negative offset for ${race}`,tiles.length===6&&tiles.every(t=>t.src.includes('/art/terrain/chronicle/')&&t.width===256&&t.height===256&&t.fits&&t.transform==='none'&&t.filter==='none'),tiles);
   await p.screenshot({path:`artifacts/frontage-478-${race}-terrain.png`});
  }
  check('No combat or interface errors',!report.errors.length,report.errors);
 }finally{fs.mkdirSync('artifacts',{recursive:true});fs.writeFileSync('artifacts/frontage-478.json',JSON.stringify(report,null,2));await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
