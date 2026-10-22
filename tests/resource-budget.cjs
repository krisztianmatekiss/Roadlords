const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
const URL=process.env.ROADLORDS_TEST_URL||'http://127.0.0.1:4173/Roadlords/';
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox','--disable-dev-shm-usage']});
 const report={checks:[],errors:[]},check=(name,ok)=>{assert(ok,name);report.checks.push(name);console.log('PASS',name);};
 try{
  const page=await browser.newPage();await page.route('https://**/*',r=>r.abort());page.on('pageerror',e=>report.errors.push(e.message));
  await page.goto(URL);await page.waitForFunction(()=>!!window.__ROADLORDS_RUNTIME__);
  const result=await page.evaluate(()=>{
   const R=__ROADLORDS_RUNTIME__;R.MP.enabled=false;R.state.running=false;R.state.pregame=false;R.ROAD.test=false;
   function reset(race='human'){
    R.roadResetCity(R.P,race);R.state.units=[];R.P.terrain.fill(null);R.P.unlocked=new Set(Object.keys(R.BUILDINGS));
    R.P.resources=R.C(1e6,1e6,1e6);return R.P;
   }
   function put(type){const c=R.P;c.resources=R.C(1e6,1e6,1e6);for(let r=0;r<R.GRID;r++)for(let col=0;col<R.GRID;col++)if(R.canPlace(c,type,r,col,0)){const v=R.placeBuilding(c,type,r,col,0);if(v.ok)return v.building;}throw Error('No place for '+type);}
   const flow=()=>R.resourceFlowRates(R.P);
   let c=reset();put('barracks');put('barracks');
   const full=flow();c.resources=R.C();const empty=flow();
   c.garrison=Array.from({length:c.garrisonCap},()=>R.makeEntry(c,'swordsman'));c.gateMode='closed';const blocked=flow();
   R.state.time=120;R.recordResourceSpend38(c,R.C(800,300,900));R.updateHud();
   const hud={food:R.$('#foodUse').textContent,tip:R.$('#foodUse').title};
   c.garrison=[];c.gateMode='open';c.legends.add('factory_network');const network=flow();
   c.resources=R.C(1e6,1e6,1e6);c.armyCap=c.garrisonCap=10000;
   const foodBefore=c.resources.food;for(let i=0;i<6000;i++)R.updateSpawners(c,1/30);
   const networkActual=(foodBefore-c.resources.food)/200;
   c.releaseQueue=[];c.garrison=[];c.legends.delete('factory_network');
   c.garrison=[];c.normal.spawn_speed=1;const faster=flow();
   c.legends.add('no_food');const noFood=flow();
   c=reset();put('barracks');c.legends.add('barracks_spear');c.legends.add('barracks_archer');const parallel=flow();
   c=reset();put('barracks');c.normal.frugal_training=2;const discounted=flow();
   const beforePurchase=flow();c.resources=R.C(1e6,1e6,1e6);R.pay(c,R.C(500,300,200));const afterPurchase=flow();
   c=reset();put('market');c.marketRoutes=[{from:'food',to:'wood'}];c.resources=R.C();const marketEmpty=flow();c.resources={...c.caps};const marketFull=flow();
   const actualMarket=R.marketTransfer(c,1);
   c=reset();put('market');c.levels.market=4;R.buildingOf(c,'market')[0].level=4;c.l4Branches.market='wholesalers';c.marketRoutes=[{from:'food',to:'wood'},{from:'food',to:'stone'}];const twoRoutes=flow();
   // Legacy automatic tents still have budget support; current menus no longer offer them.
   R.BUILDINGS.merc_tent={...R.BUILDINGS.warehouse,name:'Legacy mercenary tent'};
   c=reset();const tent=put('merc_tent');tent.mercAuto='stay';tent.mercOffers[1]={...tent.mercOffers[1],price:R.C(40,20,60)};
   c.resources=R.C();c.garrison=Array.from({length:c.garrisonCap},()=>R.makeEntry(c,'swordsman'));c.gateMode='closed';const merc=flow();tent.mercAuto=null;const manualMerc=flow();
   c=reset('orc');delete R.BUILDINGS.merc_tent;const war=put('orc_war');c.resources=R.C();const orc=flow();war.inactive=true;const inactive=flow();
   war.inactive=false;R.MP.enabled=true;R.MP.role='guest';c.resourceUse38=R.C(999,999,999);R.updateHud();const guestHud=R.$('#foodUse').textContent;
   return {full,empty,blocked,hud,network,networkActual,faster,noFood,parallel,discounted,beforePurchase,afterPurchase,marketEmpty,marketFull,actualMarket,twoRoutes,merc,manualMerc,orc,inactive,guestHud,productionHud:!!R.$('#unitProductionHud')};
  });report.result=result;
  const near=(a,b)=>Math.abs(a-b)<1e-6;
  check('Two real barracks budget their full 2.4 food/s even with empty stock and full reserves',near(result.full.use.food,2.4)&&near(result.empty.use.food,2.4)&&near(result.blocked.use.food,2.4));
  check('HUD displays full demand immediately instead of previous spending history, with a source breakdown',result.hud.food==='−2,4/mp'&&result.hud.tip.includes('Katonagyártás: 2,4')&&!result.hud.tip.includes('30 játékmásodperc'));
  check('Factory feedback is budgeted and covers actual sustained production over 200 simulation seconds',near(result.network.use.food,2.4/.85)&&result.networkActual<=result.network.use.food&&result.networkActual>result.network.use.food*.95);
  check('Training speed and the no-food relic update the budget immediately',near(result.faster.use.food,2.64)&&result.noFood.use.food===0);
  check('Both paid parallel barracks lines are included alongside the main line',near(result.parallel.use.food,1.2+6/7.5+6/9)&&result.parallel.use.wood>0&&result.parallel.use.stone>0);
  check('Training discounts affect demand while one-time purchases do not',near(result.discounted.use.food,5.4/5)&&JSON.stringify(result.beforePurchase)===JSON.stringify(result.afterPurchase));
  check('Configured market export and matching import stay budgeted with empty stock or a full destination',near(result.marketEmpty.use.food,1)&&near(result.marketFull.use.food,1)&&near(result.marketEmpty.gain.wood,1.6)&&near(result.marketFull.gain.wood,1.6)&&result.actualMarket.use.food===0);
  check('Both wholesaler routes are budgeted independently',near(result.twoRoutes.use.food,6)&&near(result.twoRoutes.gain.wood,3.7)&&near(result.twoRoutes.gain.stone,3.7));
  check('Auto mercenaries budget their current offer per cooldown even when blocked; manual offers do not',near(result.merc.use.food,3)&&near(result.merc.use.wood,2)&&near(result.merc.use.stone,1)&&result.manualMerc.use.food===0);
  check('Orc training is included at full demand and explicitly inactive camps contribute nothing',near(result.orc.use.food,9/8.5)&&result.inactive.use.food===0);
  check('Multiplayer guest computes the same current budget without stale host spending averages',result.guestHud==='−1,1/mp');
  check('Unit production speed widget is removed and resource HUD has no runtime errors',!result.productionHud&&!report.errors.length);
 }finally{fs.mkdirSync('artifacts',{recursive:true});fs.writeFileSync('artifacts/resource-budget.json',JSON.stringify(report,null,2));await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
