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
  check('Main menu groups the new experiments and removes the retired art entry',await page.locator('#roadArtMenu,#roadArtToggle').count()===0&&await page.locator('#roadTestsMenu').isVisible()&&await page.locator('.menuMain #roadTestMenu,.menuMain #roadStressMenu,.menuMain #roadFigureMenu').count()===0&&!await page.locator('#roadFigureMenu').isVisible());
  await page.locator('#roadTestsMenu').click();
  check('TESZTEK opens all three experiments in a separate panel',await page.locator('#roadTestsPanel').isVisible()&&await page.locator('#roadFigureMenu').isVisible()&&await page.locator('#roadTestMenu').isVisible()&&await page.locator('#roadStressMenu').isVisible());
  await page.screenshot({path:'artifacts/test-submenu.png'});
  await page.keyboard.press('Escape');
  check('Escape returns to main menu and restores keyboard focus',!await page.locator('#roadTestsPanel').isVisible()&&await page.locator('#roadTestsMenu').evaluate(e=>document.activeElement===e));
  await page.locator('#roadTestsMenu').click();await page.locator('#roadTestsBack').click();
  check('VISSZA closes the test submenu without starting a game',!await page.locator('#roadTestsPanel').isVisible()&&!await page.evaluate(()=>__ROADLORDS_ROAD__.state.test));
  await page.locator('#mpOpenMulti').click();
  check('Multiplayer submenu remains reachable after closing tests',await page.locator('#mpCreateRoom').isVisible());
  await page.locator('#mpMenuBack').click();await page.locator('#roadTestsMenu').click();
  await page.locator('#roadFigureMenu').click();await page.evaluate(()=>__ROADLORDS_ROAD__.pause());
  const initial=await page.evaluate(()=>({snapshot:__ROADLORDS_ROAD__.snapshot(),roster:__ROADLORDS_ROAD__.state.testRoster,art:__ROADLORDS_ROAD__.state.figureStyle==='refined'}));
  check('New figure sample loads 5/5 human swordsmen and orc warriors using the real cities and battle system',initial.art&&initial.roster==='figures'&&initial.snapshot.counts.every(n=>n===5)&&initial.snapshot.initial.keys.join(',')==='swordsman,orc_warrior');
  await page.screenshot({path:'artifacts/new-figures-ready.png'});
  await page.locator('#roadRestart').click();await page.evaluate(()=>__ROADLORDS_ROAD__.pause());
  check('Restart retains the new figure roster, count and city seed',await page.evaluate(seed=>__ROADLORDS_ROAD__.state.testRoster==='figures'&&__ROADLORDS_ROAD__.snapshot().counts.every(n=>n===5)&&__ROADLORDS_ROAD__.state.seed===seed,initial.snapshot.seed));
  const textures=await page.evaluate(()=>{
   const R=__ROADLORDS_RUNTIME__,Q=__ROADLORDS_ROAD__,out={};
   Q.state.figureStyle='refined';
   for(const key of ['swordsman','orc_warrior']){
    const unit=R.state.units.find(u=>u.key===key),city=unit.side==='player'?R.P:R.E,savedColor=city.unitColor,variants={};let skinReference,metalReference;
    for(const [color] of window.__ROADLORDS_UNIT_COLORS__.palette){
     city.unitColor=color;
     const actor={...unit,lane:Q.state.camera+300,offset:0,roadMoving:false,roadAttack:null};R.roadDrawUnit(actor);
     const hex=R.unitTeamFill(unit),sprite=Q.state.sprites.get(`figure:${key}:${hex}:idle:0:refined`);
     if(!sprite)throw Error('New sprite missing: '+key+' '+color);
     const data=sprite.getContext('2d').getImageData(0,0,sprite.width,sprite.height).data;let team=0,gold=0,green=0;
     for(let i=0;i<data.length;i+=4){if(data[i+3]<80)continue;const r=data[i],g=data[i+1],b=data[i+2];if(color==='blue'?b>r*1.3&&b>g*1.1:r>g*1.3&&r>b*1.3)team++;if(r>g&&g>b*1.5&&r>80)gold++;if(g>r*1.02&&g>b*1.4)green++;}
     const pixel=(x,y)=>{const i=(Math.floor((y+66)*2.4)*192+Math.floor((x+40)*2.4))*4;return [...data.slice(i,i+4)];};
     const skin=[];for(let y=-38;y<-29;y+=.5)for(let x=-4;x<7;x+=.5)skin.push(...pixel(x,y));
     const steel=pixel(-2,-36);
     skinReference??=skin;metalReference??=steel;
     variants[color]={team,gold,green,resolution:sprite.width,skinStable:JSON.stringify(skin)===JSON.stringify(skinReference),steelStable:JSON.stringify(steel)===JSON.stringify(metalReference)};
    }
    city.unitColor=savedColor;out[key]=variants;
   }
   return {models:out,sprites:Q.state.sprites.size,noAtlas:!Q.state.detailedArt&&!performance.getEntriesByType('resource').some(r=>r.name.includes('battle-parts-human-orc'))};
  });report.textures=textures;
  check('Both new figures render crisp 192px cached sprites and the retired atlas is no longer loaded',textures.noAtlas&&Object.values(textures.models).every(v=>Object.values(v).every(c=>c.resolution===192)));
  check('All eight team colors preserve orc skin and steel while blue/red cloth stays readable',Object.values(textures.models).every(v=>v.blue.team>50&&v.red.team>50)&&Object.values(textures.models.orc_warrior).every(v=>v.skinStable&&v.green>100)&&Object.values(textures.models.swordsman).every(v=>v.steelStable)&&textures.models.swordsman.blue.gold>50);
  check('New graphics use the existing bounded sprite cache without a second recolored texture cache',textures.sprites<=768);
  const rig=await page.evaluate(()=>{
   const R=__ROADLORDS_RUNTIME__,Q=__ROADLORDS_ROAD__,results=[];
   for(const key of ['swordsman','orc_warrior']){
    const unit=R.state.units.find(u=>u.key===key);
    for(const [state,count] of [['idle',1],['walk',8],['attack',12],['death',6]])for(let frame=0;frame<count;frame++){
     Q.state.clock=10;
     const u={...unit,lane:Q.state.camera+300,offset:0,roadFace:1,roadMoving:state==='walk',roadWalk:(frame+.1)/8*Math.PI*2-unit.id*.73,roadAttack:null,death:10-(frame+.1)/6*.6};
     if(state==='attack'){
      const a={start:9,launch:10,hit:10,end:10.4,recovery:.4,to:u.lane+20},windEnd=a.launch-.085;
      Q.state.clock=frame<4?a.start+(frame+.1)/4*(windEnd-a.start):frame<7?windEnd+(frame-4+.1)/3*.085:a.launch+(frame-7+.1)/5*.4;
      u.roadAttack=a;
     }
     const variants=[];
     for(const style of ['simple','refined']){
      Q.state.figureStyle=style;R.roadDrawUnit(u,state==='death');
      const pose=R.battleFigurePose(u,Q.state.clock,state==='death');
      const name=`figure:${key}:${R.unitTeamFill(u)}:${pose.state}:${pose.frame}${style==='refined'?':refined':''}`;
      const sprite=Q.state.sprites.get(name);if(!sprite)throw Error('Pose not drawn: '+name);
      variants.push({rig:sprite.figureRig,bounds:sprite.figureBounds,pose});
     }
     results.push({key,state,frame,same:JSON.stringify(variants[0])===JSON.stringify(variants[1]),actual:variants[1].pose.frame});
    }
   }
   Q.state.figureStyle='refined';return results;
  });report.rig=rig;
  check('Every idle, walk, attack and death frame shares the established rig and physical scale',rig.length===54&&rig.every(v=>v.same&&v.frame===v.actual));
  const beforeStyle=await page.evaluate(()=>({time:__ROADLORDS_ROAD__.snapshot().time,units:__ROADLORDS__.state.units.map(u=>[u.id,u.hp,u.lane,u.offset])}));
  await page.locator('#roadFigureToggle').click();
  check('Graphics comparison changes only rendering while the same paused battle is preserved',await page.evaluate(before=>{const Q=__ROADLORDS_ROAD__,R=__ROADLORDS_RUNTIME__;Q.render(0);return Q.state.figureStyle==='simple'&&Q.snapshot().time===before.time&&JSON.stringify(R.state.units.map(u=>[u.id,u.hp,u.lane,u.offset]))===JSON.stringify(before.units)&&[...Q.state.sprites].some(([k])=>k.startsWith('figure:swordsman:')&&!k.endsWith(':refined'));},beforeStyle));
  await page.screenshot({path:'artifacts/figure-comparison-current.png'});
  await page.locator('#roadRestart').click();await page.evaluate(()=>__ROADLORDS_ROAD__.pause());
  check('Restart preserves the selected comparison graphics',await page.evaluate(()=>__ROADLORDS_ROAD__.state.figureStyle==='simple'));
  await page.locator('#roadFigureToggle').click();
  const facing=await page.evaluate(()=>{
    const R=__ROADLORDS_RUNTIME__,Q=__ROADLORDS_ROAD__,results=[];
    for(const t of R.towers)t.alive=false;R.roadRefreshFrontiers();
    for(const c of [R.P,R.E]){c.race='human';c.normal={};c.legends=new Set();c.l4Branches={};}
    function drawSign(u){
      const draw=R.ctx.drawImage;let sign;
      R.ctx.drawImage=function(...args){sign=Math.sign(this.getTransform().a);return draw.apply(this,args);};
      try{R.roadDrawUnit(u);}finally{R.ctx.drawImage=draw;}return sign;
    }
    for(const style of ['simple','refined'])for(const side of ['player','enemy']){
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
    Q.state.figureStyle='refined';return results;
  });report.facing=facing;
  check('Current and new graphics face actual forward travel despite a stale opposite target',facing.every(x=>x.forward*x.dir>0&&x.forwardDraw===x.dir));
  check('Current and new graphics turn toward reverse travel on either team',facing.every(x=>x.backward*x.dir<0&&x.turnDraw===-x.dir));
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
    checks.push({side,offset,lane:u.lane,pass:side==='player'?u.lane<=1982:u.lane>=2818});
   }
   const u=R.state.units[0];u.lane=2150;u.stunTime=1;R.updateBattle(.01);const directPlacementCorrected=u.lane<=1982;
   const unreachable=!R.roadCanPursue(u,{lane:2100});
   const savedRace=R.P.race;R.P.race='orc';R.P.legends.add('orc_predator');
   const hunter=R.releaseUnit(R.P,{key:'orc_warg'}),prey=R.releaseUnit(R.E,{key:'archer'});
   hunter.lane=1982;prey.lane=2070;hunter.offset=prey.offset=0;hunter.orcSpearReady=false;hunter.cooldown=999;
   R.orcBeforeCombat13(hunter,[prey],1/30);
   const predatorBlocked=!hunter.orcPredatorMoved&&hunter.lane===1982;
   R.state.units=R.state.units.filter(x=>x!==hunter&&x!==prey);R.P.legends.delete('orc_predator');R.P.race=savedRace;
   first.hp=1;u.stunTime=0;u.lane=1980;u.offset=-57;
   const offsetTowerInRange=Math.abs(R.roadDistance(u,first)-20)<1e-8;
   R.attackStructure(u,first);const a=u.roadAttack;
   if(!a)throw Error('Tower attack was not queued');
   Q.state.clock=a.hit+.001;Q.impact();
   const destroyed=!first.alive;R.setBattleLane(u,2100);
   const opened=u.lane===2100&&R.targetStructure('player')===next;
   R.setBattleLane(u,2500);const nextBlocks=u.lane<=2282;
   next.alive=false;R.roadRefreshFrontiers();R.setBattleLane(u,2500);const capitalOpen=u.lane===2500&&R.targetStructure('player').capital;
   for(const [tower,lane,lateral] of positions){tower.lane=lane;tower.lateral=lateral;}
   return {checks,directPlacementCorrected,unreachable,predatorBlocked,offsetTowerInRange,destroyed,opened,nextBlocks,capitalOpen};
  });report.frontiers=frontiers;
  check('Live towers block both teams across the center and both road edges, including ability movement',frontiers.checks.every(x=>x.pass));
  check('Directly placed units are corrected before combat and cannot chase through a live tower',frontiers.directPlacementCorrected&&frontiers.unreachable&&frontiers.predatorBlocked);
  check('A real delayed attack reaches an offset tower and opens only the next stage',frontiers.offsetTowerInRange&&frontiers.destroyed&&frontiers.opened&&frontiers.nextBlocks&&frontiers.capitalOpen);
  await page.evaluate(()=>{__ROADLORDS_ROAD__.startTest(42,{count:5,roster:'figures'});});await page.waitForTimeout(6000);await page.evaluate(()=>__ROADLORDS_ROAD__.pause());
  const live=await page.evaluate(()=>__ROADLORDS_ROAD__.snapshot());
  check('New figure sample advances and deals real damage',live.metrics.attacks>0&&live.metrics.damage>0&&live.time>3);
  await page.screenshot({path:'artifacts/new-figures-contact.png'});
  check('No application errors in the art, passage or tower scenarios',report.errors.length===0&&!live.error);
  await page.evaluate(()=>{__ROADLORDS_ROAD__.startTest(42,{count:50});__ROADLORDS_ROAD__.pause();});
  check('Mixed battles keep the established figures and hide the experimental toggle',await page.evaluate(()=>__ROADLORDS_ROAD__.state.figureStyle==='simple')&&!await page.locator('#roadFigureToggle').isVisible());
  fs.writeFileSync('artifacts/passage-and-art-results.json',JSON.stringify(report,null,2));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
