const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
const URL=process.env.ROADLORDS_TEST_URL||'http://127.0.0.1:4173/Roadlords/';
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
 const report={checks:[],errors:[]};const check=(name,value)=>{assert(value,name);report.checks.push(name);console.log('PASS',name);};
 try{
  const context=await browser.newContext({viewport:{width:1440,height:960}});await context.route('https://**/*',r=>r.abort());
  const page=await context.newPage();page.on('pageerror',e=>report.errors.push(e.message));
  await page.goto(URL);await page.waitForFunction(()=>!!window.__ROADLORDS_ROAD__);await page.evaluate(()=>__ROADLORDS_ROAD__.artReady);
  await page.locator('.menuBrand').click();await page.waitForTimeout(900);
  check('Main menu exposes only TESZTEK while all three battle entries stay hidden',await page.locator('#roadTestsMenu').isVisible()&&await page.locator('.menuMain #roadTestMenu,.menuMain #roadStressMenu,.menuMain #roadArtMenu').count()===0&&!await page.locator('#roadArtMenu').isVisible());
  await page.locator('#roadTestsMenu').click();
  check('TESZTEK opens all three experiments in a separate panel',await page.locator('#roadTestsPanel').isVisible()&&await page.locator('#roadArtMenu').isVisible()&&await page.locator('#roadTestMenu').isVisible()&&await page.locator('#roadStressMenu').isVisible());
  await page.screenshot({path:'artifacts/test-submenu.png'});
  await page.keyboard.press('Escape');
  check('Escape returns to main menu and restores keyboard focus',!await page.locator('#roadTestsPanel').isVisible()&&await page.locator('#roadTestsMenu').evaluate(e=>document.activeElement===e));
  await page.locator('#roadTestsMenu').click();await page.locator('#roadTestsBack').click();
  check('VISSZA closes the test submenu without starting a game',!await page.locator('#roadTestsPanel').isVisible()&&!await page.evaluate(()=>__ROADLORDS_ROAD__.state.test));
  await page.locator('#mpOpenMulti').click();
  check('Multiplayer submenu remains reachable after closing tests',await page.locator('#mpCreateRoom').isVisible());
  await page.locator('#mpMenuBack').click();await page.locator('#roadTestsMenu').click();
  await page.locator('#roadArtMenu').click();await page.evaluate(()=>__ROADLORDS_ROAD__.pause());
  const initial=await page.evaluate(()=>({snapshot:__ROADLORDS_ROAD__.snapshot(),roster:__ROADLORDS_ROAD__.state.testRoster,art:__ROADLORDS_ROAD__.state.detailedArt?.ready}));
  check('Art sample loads 20/20 human swordsmen and orc warriors using the real cities and battle system',initial.art&&initial.roster==='art'&&initial.snapshot.counts.every(n=>n===20)&&initial.snapshot.initial.keys.join(',')==='swordsman,orc_warrior');
  await page.screenshot({path:'artifacts/detailed-art-ready.png'});
  await page.locator('#roadRestart').click();await page.evaluate(()=>__ROADLORDS_ROAD__.pause());
  check('Restart retains the art roster, count and city seed',await page.evaluate(seed=>__ROADLORDS_ROAD__.state.testRoster==='art'&&__ROADLORDS_ROAD__.snapshot().counts.every(n=>n===20)&&__ROADLORDS_ROAD__.state.seed===seed,initial.snapshot.seed));
  const textures=await page.evaluate(()=>{
   const R=__ROADLORDS_RUNTIME__,Q=__ROADLORDS_ROAD__,out={};
   for(const key of ['swordsman','orc_warrior']){
    const unit=R.state.units.find(u=>u.key===key),side=unit.side,city=side==='player'?R.P:R.E,savedColor=city.unitColor;
    const variants={};
    for(const [color] of window.__ROADLORDS_UNIT_COLORS__.palette){
     city.unitColor=color;
     for(const pose of ['idle','walk','attack','death']){
      const actor={...unit,lane:Q.state.camera+300,offset:0,roadMoving:pose==='walk',roadAttack:pose==='attack'?{start:Q.state.clock-.1,launch:Q.state.clock+.14,hit:Q.state.clock+.14,end:Q.state.clock+.38}:null,death:Q.state.clock-.3};
      R.roadDrawUnit(actor,pose==='death');
     }
     const hex=R.unitTeamFill(unit),sprite=[...Q.state.sprites].find(([name])=>name.startsWith('figure:'+key+':'+hex+':idle:0')&&name.endsWith(':painted'))?.[1];
     if(!sprite)throw Error('Detailed sprite not rendered: '+key+' '+color);
     const data=sprite.getContext('2d').getImageData(0,0,sprite.width,sprite.height).data;let painted=0,gold=0,green=0;
     for(let i=0;i<data.length;i+=4){if(data[i+3]<80)continue;const r=data[i],g=data[i+1],b=data[i+2];if(color==='blue'?b>r*1.3&&b>g*1.1:r>g*1.3&&r>b*1.3)painted++;if(r>g&&g>b*1.5&&r>80)gold++;if(g>r*1.02&&g>b*1.4)green++;}
     const base=Q.state.detailedArt.base.get(key).torso,dyed=Q.state.detailedArt.colored.get(key+hex).torso;
     const source=base.getContext('2d').getImageData(0,0,base.width,base.height).data,changed=dyed.getContext('2d').getImageData(0,0,base.width,base.height).data;
     let skin=0,preservedSkin=0;
     if(key==='orc_warrior')for(let i=0;i<source.length;i+=4){const r=source[i],g=source[i+1],b=source[i+2];if(source[i+3]<200||r<60||g<60||r/g<.8||r/g>1.25||b>Math.min(r,g)*.75)continue;skin++;if(Math.abs(changed[i]-r)<=4&&Math.abs(changed[i+1]-g)<=4&&Math.abs(changed[i+2]-b)<=4)preservedSkin++;}
     variants[color]={painted,gold,skin,preservedSkin,resolution:sprite.width};
    }
    city.unitColor=savedColor;out[key]=variants;
   }
   return {models:out,parts:[...Q.state.detailedArt.base.values()].map(p=>Object.keys(p).length),sprites:Q.state.sprites.size,colorCache:Q.state.detailedArt.colored.size};
  });report.textures=textures;
  check('Both sample characters have five separate art pieces and painted animation frames',textures.parts.length===2&&textures.parts.every(n=>n===5)&&Object.values(textures.models).every(v=>v.blue.resolution===192&&v.red.resolution===192));
  check('Blue/red cloth remains identifiable while gold armor and green orc skin survive recoloring',Object.values(textures.models).every(v=>v.blue.painted>50&&v.red.painted>50)&&textures.models.swordsman.blue.gold>50&&textures.models.orc_warrior.red.skin>1000&&textures.models.orc_warrior.red.preservedSkin/textures.models.orc_warrior.red.skin>.98);
  check('Detailed textures retain bounded sprite and color caches',textures.sprites<=768&&textures.colorCache===16);
  const beforeStyle=await page.evaluate(()=>({time:__ROADLORDS_ROAD__.snapshot().time,units:__ROADLORDS__.state.units.map(u=>[u.id,u.hp,u.lane,u.offset])}));
  await page.locator('#roadArtToggle').click();
  check('Graphics comparison changes only rendering while the same paused battle is preserved',await page.evaluate(before=>{const Q=__ROADLORDS_ROAD__,R=__ROADLORDS_RUNTIME__;Q.render(0);return Q.state.figureStyle==='simple'&&Q.snapshot().time===before.time&&JSON.stringify(R.state.units.map(u=>[u.id,u.hp,u.lane,u.offset]))===JSON.stringify(before.units)&&[...Q.state.sprites].some(([k])=>k.startsWith('figure:swordsman:')&&!k.endsWith(':painted'));},beforeStyle));
  await page.screenshot({path:'artifacts/art-comparison-simple.png'});
  await page.locator('#roadRestart').click();await page.evaluate(()=>__ROADLORDS_ROAD__.pause());
  check('Restart preserves the selected comparison graphics',await page.evaluate(()=>__ROADLORDS_ROAD__.state.figureStyle==='simple'));
  await page.locator('#roadArtToggle').click();
  const facing=await page.evaluate(()=>{
    const R=__ROADLORDS_RUNTIME__,Q=__ROADLORDS_ROAD__,results=[];
    for(const t of R.towers)t.alive=false;R.roadRefreshFrontiers();
    for(const c of [R.P,R.E]){c.race='human';c.normal={};c.legends=new Set();c.l4Branches={};}
    function drawSign(u){
      const draw=R.ctx.drawImage;let sign;
      R.ctx.drawImage=function(...args){sign=Math.sign(this.getTransform().a);return draw.apply(this,args);};
      try{R.roadDrawUnit(u);}finally{R.ctx.drawImage=draw;}return sign;
    }
    for(const style of ['simple','painted'])for(const side of ['player','enemy']){
      Q.state.figureStyle=style;R.state.units=[];Q.state.pending=[];
      const dir=side==='player'?1:-1,u=R.releaseUnit(side==='player'?R.P:R.E,{key:'swordsman'});
      u.lane=Q.state.camera+300;u.offset=u.roadHomeOffset=0;u.cooldown=999;u.roadFace=-dir;
      u.roadAttack={start:Q.state.clock-2,launch:Q.state.clock-1.8,hit:Q.state.clock-1.8,end:Q.state.clock-1,to:u.lane-dir*100};
      const start=u.lane;R.updateBattle(.1);
      const forward=u.lane-start,forwardDraw=drawSign(u);
      const v=R.releaseUnit(side==='player'?R.E:R.P,{key:'swordsman'});
      v.lane=u.lane-dir*100;v.offset=0;v.cooldown=999;v.stunTime=100;
      const turn=u.lane;R.updateBattle(.1);
      const backward=u.lane-turn,turnDraw=drawSign(u);
      v.lane=u.lane+dir*25;u.cooldown=0;R.attackUnit(u,v);u.roadFace=-dir;
      const attackDraw=drawSign(u);
      results.push({style,side,forward,forwardDraw,backward,turnDraw,attackDraw,dir});
    }
    Q.state.figureStyle='painted';return results;
  });report.facing=facing;
  check('Both renderers face actual forward travel despite a stale opposite target',facing.every(x=>x.forward*x.dir>0&&x.forwardDraw===x.dir));
  check('Both renderers turn toward reverse travel on either team',facing.every(x=>x.backward*x.dir<0&&x.turnDraw===-x.dir));
  check('Active attacks face their impact target instead of stale movement',facing.every(x=>x.attackDraw===x.dir));
  const mobility=await page.evaluate(()=>{
   const R=__ROADLORDS_RUNTIME__,Q=__ROADLORDS_ROAD__;
   for(const t of R.towers)t.alive=false;R.roadRefreshFrontiers();
   for(const c of [R.P,R.E]){c.race='human';c.normal={};c.legends=new Set();c.l4Branches={};}
   function trial(friendly){
    R.state.units=[];Q.state.pending=[];Q.state.dead=[];
    const rear=R.releaseUnit(R.P,{key:'swordsman'});rear.lane=1500;rear.offset=rear.roadHomeOffset=0;rear.cooldown=999;
    const obstacles=[];
    if(friendly)for(const lane of [1522,1537,1552])for(const offset of [-24,0,24]){
     const u=R.releaseUnit(R.P,{key:'swordsman'});u.lane=lane;u.offset=offset;u.cooldown=999;u.stunTime=100;obstacles.push(u);
    }
    let closest=Infinity;
    for(let i=0;i<60;i++){R.updateBattle(1/30);for(const u of obstacles)closest=Math.min(closest,Q.distance(rear,u));}
    return {advance:rear.lane-1500,closest:Number.isFinite(closest)?closest:null};
   }
   return {free:trial(false),crowded:trial(true)};
  });report.mobility=mobility;
  check('Three stationary friendly ranks permit forward travel without a traffic jam',mobility.crowded.advance>=mobility.free.advance*.9&&mobility.crowded.advance>60&&mobility.crowded.closest<10);
  const frontiers=await page.evaluate(()=>{
   const R=__ROADLORDS_RUNTIME__,Q=__ROADLORDS_ROAD__;R.state.units=[];Q.state.pending=[];
   for(const t of R.towers){t.alive=false;t.cooldown=9999;}
   const positions=R.towers.map(t=>[t,t.lane,t.lateral]);
   const first=R.towers.find(t=>t.id==='e1'),next=R.towers.find(t=>t.id==='e2'),own=R.towers.find(t=>t.id==='p1');
   first.lane=2000;first.lateral=-57;next.lane=2300;own.lane=2800;first.alive=next.alive=own.alive=true;first.hp=next.hp=own.hp=10000;R.roadRefreshFrontiers();
   const checks=[];
   for(const side of ['player','enemy'])for(const offset of [-228,0,228]){
    const u=R.releaseUnit(side==='player'?R.P:R.E,{key:'swordsman'});u.offset=offset;u.hp=u.maxHp=1e6;u.cooldown=999;
    u.lane=side==='player'?1900:2900;R.setBattleLane(u,side==='player'?2200:2600);
    const advance=(u.lane-(side==='player'?2000:2800))*(side==='player'?1:-1);
    checks.push({side,offset,lane:u.lane,pass:offset===0?advance>0&&advance<108:advance<=-18});
   }
   const u=R.state.units[0];u.lane=2150;u.stunTime=1;R.updateBattle(.01);const directPlacementCorrected=u.lane<=1982;
   const unreachable=!R.roadCanPursue(u,{lane:2100});
   const savedRace=R.P.race;R.P.race='orc';R.P.legends.add('orc_predator');
   const hunter=R.releaseUnit(R.P,{key:'orc_warg'}),prey=R.releaseUnit(R.E,{key:'archer'});
   hunter.lane=1982;prey.lane=2100;hunter.offset=prey.offset=0;hunter.orcSpearReady=false;hunter.cooldown=999;
   R.orcBeforeCombat13(hunter,[prey],1/30);
   const predatorBlocked=!hunter.orcPredatorMoved&&hunter.lane===1982;
   R.state.units=R.state.units.filter(x=>x!==hunter&&x!==prey);R.P.legends.delete('orc_predator');R.P.race=savedRace;
   first.hp=1;u.stunTime=0;u.lane=1950;u.offset=-57;
   const offsetTowerInRange=Math.abs(R.roadDistance(u,first)-16)<1e-8;
   R.attackStructure(u,first);const a=u.roadAttack;
   if(!a)throw Error('Tower attack was not queued');
   Q.state.clock=a.hit+.001;Q.impact();
   const destroyed=!first.alive;R.setBattleLane(u,2100);
   const opened=u.lane===2100&&R.targetStructure('player')===next;
   R.setBattleLane(u,2500);const nextBlocks=u.lane<2408;
   next.alive=false;R.roadRefreshFrontiers();R.setBattleLane(u,2500);const capitalOpen=u.lane===2500&&R.targetStructure('player').capital;
   for(const [tower,lane,lateral] of positions){tower.lane=lane;tower.lateral=lateral;}
   return {checks,directPlacementCorrected,unreachable,predatorBlocked,offsetTowerInRange,destroyed,opened,nextBlocks,capitalOpen};
  });report.frontiers=frontiers;
  check('Melee can enter the rear tower pocket while road edges and further stages stay closed',frontiers.checks.every(x=>x.pass));
  check('Directly placed units are corrected and distant targets cannot pull melee past the tower pocket',frontiers.directPlacementCorrected&&frontiers.unreachable&&frontiers.predatorBlocked);
  check('A real delayed attack reaches an offset tower and opens only the next stage',frontiers.offsetTowerInRange&&frontiers.destroyed&&frontiers.opened&&frontiers.nextBlocks&&frontiers.capitalOpen);
  await page.evaluate(()=>{__ROADLORDS_ROAD__.startTest(42,{count:20,roster:'art'});});await page.waitForTimeout(6000);await page.evaluate(()=>__ROADLORDS_ROAD__.pause());
  const live=await page.evaluate(()=>__ROADLORDS_ROAD__.snapshot());
  check('Painted sample battle advances and deals real damage',live.metrics.attacks>0&&live.metrics.damage>0&&live.time>3);
  await page.screenshot({path:'artifacts/detailed-art-contact.png'});
  check('No application errors in the art, passage or tower scenarios',report.errors.length===0&&!live.error);
  await page.evaluate(()=>{__ROADLORDS_ROAD__.startTest(42,{count:50});__ROADLORDS_ROAD__.pause();});
  check('Mixed battles use the established simple figures and hide the experimental toggle',await page.evaluate(()=>__ROADLORDS_ROAD__.state.figureStyle==='simple')&&!await page.locator('#roadArtToggle').isVisible());
  fs.writeFileSync('artifacts/passage-and-art-results.json',JSON.stringify(report,null,2));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
