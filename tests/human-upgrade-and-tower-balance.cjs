const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox','--disable-dev-shm-usage']});
 const report={checks:[],errors:[]};
 try{
  const p=await browser.newPage({viewport:{width:1920,height:1080}});await p.route('https://**/*',r=>r.abort());p.on('pageerror',e=>report.errors.push(e.message));
  await p.goto(process.env.ROADLORDS_TEST_URL||'http://127.0.0.1:4173/Roadlords/');await p.waitForFunction(()=>window.__ROADLORDS_RUNTIME__?.upgradeCatalog);
  report.checks=await p.evaluate(()=>{
   const R=__ROADLORDS_RUNTIME__,out=[],close=(a,b)=>Math.abs(a-b)<1e-7,check=(name,ok,details)=>out.push({name,ok:!!ok,details});
   function reset(race='human'){
    Object.assign(R.state,{running:false,units:[],modal:false,pregame:false,startChoices:0,ended:false});R.state.combatStep++;
    Object.assign(R.ROAD,{test:false,paused:true,clock:20,pending:[],dead:[]});R.MP.enabled=false;
    for(const [c,r]of [[R.P,race],[R.E,'human']]){R.roadResetCity(c,r);c.terrain.fill(null);c.normal={};c.normalRarities={};c.legends=new Set();c.resources=R.C(1e6,1e6,1e6);R.recomputeCity(c,false);}
    for(const t of [...R.towers,...R.capitalTowers]){t.alive=false;t.cooldown=0;}
    return R.P;
   }
   const pick=(c,id,rarity='common')=>R.applyChoice(c,R.upgradeCatalog.option(id,rarity));
   for(const [rarity,speed,discount,slots]of [['common',.05,.1,10],['uncommon',.075,.15,15],['rare',.1,.2,20]]){
    const c=reset(),b={type:'barracks',level:1,row:0,col:0},time=R.trainingTime(c,b),cost=R.unitCost(c,'swordsman');
    pick(c,'spawn_speed',rarity);pick(c,'frugal_training',rarity);pick(c,'gate_discipline',rarity);pick(c,'building_discount',rarity);R.recomputeCity(c,false);
    const after=R.unitCost(c,'swordsman'),round=n=>Math.round(n*10)/10;
    check(`${rarity}: real training time, unit cost, construction cost and garrison match the card`,close(R.trainingTime(c,b),time/(1+speed))&&R.RES.every(r=>after[r]===round(cost[r]*(1-discount)))&&R.v4915ApplyBuildingDiscount(c,R.C(100,100,100)).wood===100*(1-discount)&&c.garrisonCap===30+slots,{time,after,slots:c.garrisonCap});
   }
   let c=reset();for(let i=0;i<12;i++){pick(c,'spawn_speed');pick(c,'frugal_training');pick(c,'building_discount');}
   const b={type:'barracks',level:1,row:0,col:0};
   check('Forced repeated choices cannot exceed any of the three 50% caps',close(R.trainingSpeedBonus(c,b,'swordsman'),1.5)&&R.v4915ApplyBuildingDiscount(c,R.C(100,100,100)).wood===50&&R.RES.every(r=>R.unitCost(c,'swordsman')[r]===Math.round((R.UNITS.swordsman.cost[r]||0)*5)/10));
   check('Capped effects disappear from offers and the deck displays their effective capped values',['spawn_speed','frugal_training','building_discount'].every(id=>!R.NORMAL.find(o=>o.id===id).eligible(c)&&R.upgradeCatalog.summary(c,{id,kind:'normal'}).rows.every(row=>row.before===row.after)));
   c=reset();pick(c,'frugal_training');pick(c,'frugal_training');
   check('Training discounts preserve compounding and the preview shows the next real step',R.upgradeCopyPreview(c,{id:'frugal_training',kind:'normal',rarity:'common'}).rows[0].before==='81%');
   c=reset();c.normal.spawn_speed=9.5;c.normal.frugal_training=6;c.legends.add('specialization');const random=Math.random;Math.random=()=>0;
   try{pick(c,'spawn_speed');pick(c,'frugal_training');}finally{Math.random=random;}
   check('Specialization doubles acquired cards without bypassing effect caps',close(R.trainingSpeedBonus(c,b,'swordsman'),1.5)&&!R.NORMAL.find(o=>o.id==='frugal_training').eligible(c)&&R.upgradeCatalog.count(c,'spawn_speed')===11.5);
   for(const [race,key,expected]of [['human','swordsman',10],['human','archer',10],['human','knight',10],['human','catapult',300],['orc','orc_ram',300],['orc','orc_troll',300]]){
    for(const gate of [false,true]){
     c=reset(race);const t=[...R.towers,...R.capitalTowers].find(t=>t.side==='enemy'&&!!t.gateTower===gate);t.alive=true;t.hp=10000;
     const u=R.releaseUnit(c,R.makeEntry(c,key));Object.assign(u,{lane:t.lane-(key==='archer'?100:10),offset:t.lateral||0,damage:100,buildingDamage:300,chargeReady:false,firstHits:0,blessingTime:0});R.roadReindex();
     R.attackStructure(u,t);const shot=R.ROAD.pending[0];if(shot){R.ROAD.clock=shot.a.hit+.001;R.roadImpacts();}
     check(`${key} deals ${expected} to ${gate?'gate':'road'} tower through the real impact pipeline`,close(10000-t.hp,expected),{damage:10000-t.hp,cat:u.cat});
    }
   }
   check('Both sides and both tower classes use a 50-metre range',[...R.towers,...R.capitalTowers].every(t=>R.towerStatsV496(t).range===500));
   c=reset();const u=R.releaseUnit(c,R.makeEntry(c,'swordsman'));Object.assign(u,{damage:100,lane:R.PATH_LENGTH-10,chargeReady:false,firstHits:0});const before=R.E.hp;
   R.attackStructure(u,{capital:true,side:'enemy',lane:R.PATH_LENGTH});const shot=R.ROAD.pending[0];if(shot){R.ROAD.clock=shot.a.hit+.001;R.roadImpacts();}
   check('Capital mitigation remains unchanged',close(before-R.E.hp,100/3),{damage:before-R.E.hp});
   R.renderChoice([R.upgradeCatalog.option('spear_range','common')],'PRÓBA','Próba','',false);
   const card=R.$('#choiceList .choice');
   check('Spear damage reduction has no red benefit values on its real pick card',!card.querySelector('.choiceBody .effect-negative')&&!!card.querySelector('.effect-positive'));
   return out;
  });
  await p.waitForFunction(()=>__ROADLORDS_RUNTIME__.menuOpening.ready);await p.locator('.menuBrand').click();await p.locator('#rlOpenCodex').click();await p.selectOption('#codexRace','human');await p.locator('#rlCodexPanel [data-tab="common"]').click();
  for(const rarity of ['common','uncommon','rare']){
   const card=p.locator('#rlCodexPanel [data-codex-upgrade="spear_range"]');await card.locator(`[data-codex-rarity="${rarity}"]`).click();
   const green=await card.evaluate(el=>!el.querySelector('.rlCodexContent .effect-negative')&&!!el.querySelector('.upgradeAfter.effect-positive'));
   report.checks.push({name:`${rarity}: beneficial Spearman damage reductions stay green in the actual codex`,ok:green});
  }
  for(const c of report.checks){console.log(c.ok?'PASS':'FAIL',c.name);if(!c.ok)console.log(JSON.stringify(c.details));}
  assert(report.checks.every(c=>c.ok),'Human upgrade/tower balance regression');assert.deepEqual(report.errors,[]);
 }finally{fs.mkdirSync('artifacts',{recursive:true});fs.writeFileSync('artifacts/human-upgrade-and-tower-balance.json',JSON.stringify(report,null,2));await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
