const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox','--disable-dev-shm-usage']});
 const report={checks:[],errors:[]};
 const check=(name,ok)=>{assert(ok,name);report.checks.push(name);console.log('PASS',name);};
 try{
  const p=await browser.newPage();await p.route('https://**/*',r=>r.abort());p.on('pageerror',e=>report.errors.push(e.message));
  await p.goto(process.env.ROADLORDS_TEST_URL||'http://127.0.0.1:4173/Roadlords/');await p.waitForFunction(()=>window.__ROADLORDS_RUNTIME__?.aiPreview);
  await p.evaluate(()=>{
   const R=__ROADLORDS_RUNTIME__;
   window.producerFixture=(race,side='enemy')=>{
    R.MP.enabled=false;R.ROAD.test=false;Object.assign(R.state,{running:false,time:0,units:[],startChoices:0,pregame:false,ended:false,modal:false});R.aiDecisionCache=null;R.spectator.active=true;
    const c=side==='player'?R.P:R.E;R.roadResetCity(c,race);c.buildings=c.buildings.filter(b=>b.type==='keep');c.terrain.fill(null);
    c.unlocked=new Set(R.aiFactionBuildings(c));R.recomputeCity(c,false);c.resources=R.C(100000,100000,100000);return c;
   };
   window.terrain=(c,row,col,type)=>{c.terrain[R.idx(row,col)]={type};};
   window.producerResult=(c,type)=>{
    const cell=R.findCell(c,type);if(!cell)return null;
    const b={id:'producer-test',type,row:cell[0],col:cell[1],rotation:cell[2],level:R.levelOf(c,type)};
    c.resources=R.C(100000,100000,100000);
    const before=R.productionRates(c),out=R.placeBuilding(c,type,...cell);if(!out.ok)throw Error(out.reason);
    const after=R.productionRates(c);
    return {cell,b,gain:Object.fromEntries(R.RES.map(r=>[r,after[r]-before[r]])),forest:R.adjacentTerrain(c,b,'forest'),quarry:R.adjacentTerrain(c,b,'quarry'),wall:R.touchesWall(b)};
   };
  });
  for(const side of ['player','enemy']){
   check(side+': Orc Work Camp takes a legal forest AND quarry bonus, measured by actual income',await p.evaluate(side=>{
    const c=producerFixture('orc',side);terrain(c,0,0,'forest');terrain(c,0,3,'quarry');
    const x=producerResult(c,'orc_work');return x?.forest&&x.quarry&&x.gain.wood===2&&x.gain.stone===2;
   },side));
   for(const [type,resource,kind]of [['lumber','wood','forest'],['stonecutter','stone','quarry']]){
    check(side+': '+type+' prefers two adjacent deposits over the nearer single deposit',await p.evaluate(({side,type,resource,kind})=>{
     const c=producerFixture('human',side);terrain(c,3,3,kind);terrain(c,0,1,kind);terrain(c,1,0,kind);
     const x=producerResult(c,type);return x?.gain[resource]===3;
    },{side,type,resource,kind}));
   }
   check(side+': Farms use fertile ground and Hunters use the wall',await p.evaluate(side=>{
    let c=producerFixture('human',side);terrain(c,0,0,'fertile');if(producerResult(c,'farm')?.gain.food!==2)return false;
    c=producerFixture('orc',side);const x=producerResult(c,'orc_hunt');return x?.wall&&x.gain.food>=1.125;
   },side));
  }
  check('Actual Guild output can justify a plot away from the forest',await p.evaluate(()=>{
   const R=__ROADLORDS_RUNTIME__,c=producerFixture('human');terrain(c,0,0,'forest');
   const out=R.placeBuilding(c,'guildhouse',7,7,0);if(!out.ok)throw Error(out.reason);
   R.setBuildingLevel(c,'guildhouse',4,'master_guild');
   const x=producerResult(c,'lumber');return !x.forest&&Math.abs(x.gain.wood-2.25)<1e-6;
  }));
  check('Human L4 terrain and production common preserve their live economic values',await p.evaluate(()=>{
   const R=__ROADLORDS_RUNTIME__,c=producerFixture('human');terrain(c,0,1,'forest');terrain(c,1,0,'forest');
   c.normal.production=2;c.levels.lumber=4;
   const x=producerResult(c,'lumber');return Math.abs(x.gain.wood-21.6)<1e-6;
  }));
  check('The Orc L4 stone branch, ancient deposits and resource buffs retain their actual output',await p.evaluate(()=>{
   const R=__ROADLORDS_RUNTIME__,c=producerFixture('orc');terrain(c,0,0,'forest');terrain(c,0,3,'quarry');
   c.normal.orc_wood=2;c.normal.orc_stone=1;c.legends.add('orc_ancient_deposits');c.levels.orc_work=4;c.l4Branches.orc_work='stone';
   const x=producerResult(c,'orc_work');return Math.abs(x.gain.wood-16.8)<1e-6&&Math.abs(x.gain.stone-21.6)<1e-6;
  }));
  check('Orc resource buffs invalidate placement caches within the same decision',await p.evaluate(()=>{
   const R=__ROADLORDS_RUNTIME__,c=producerFixture('orc');terrain(c,0,0,'forest');terrain(c,3,8,'quarry');R.aiDecisionCache=new Map();
   try{
    const before=R.findCell(c,'orc_work'),near=cell=>({type:'orc_work',row:cell[0],col:cell[1],rotation:cell[2],level:1});
    if(!R.adjacentTerrain(c,near(before),'quarry'))return false;
    c.normal.orc_wood=10;const after=R.findCell(c,'orc_work');
    return R.adjacentTerrain(c,near(after),'forest')&&!R.adjacentTerrain(c,near(after),'quarry');
   }finally{R.aiDecisionCache=null;}
  }));
  check('Terrain changes invalidate cached placement within the same decision',await p.evaluate(()=>{
   const R=__ROADLORDS_RUNTIME__,c=producerFixture('human');terrain(c,3,3,'forest');R.aiDecisionCache=new Map();
   try{R.findCell(c,'lumber');terrain(c,0,1,'forest');terrain(c,1,0,'forest');const cell=R.findCell(c,'lumber');return cell&&(cell[0]===0&&cell[1]===0||cell[0]===1&&cell[1]===1);}
   finally{R.aiDecisionCache=null;}
  }));
  check('Blocked bonus plots do not prevent construction on a legal ordinary plot',await p.evaluate(()=>{
   const R=__ROADLORDS_RUNTIME__,c=producerFixture('human');terrain(c,0,0,'forest');
   for(const [row,col]of [[0,1],[1,0]]){const out=R.placeBuilding(c,'house',row,col,0);if(!out.ok)throw Error(out.reason);}
   const x=producerResult(c,'lumber');return x&&!x.forest&&x.gain.wood===1;
  }));
  for(const race of ['human','orc']){
   check(race+': safe opening reinvests despite a full starting treasury',await p.evaluate(race=>{
    const R=__ROADLORDS_RUNTIME__,c=producerFixture(race);
    const types=race==='orc'?['orc_work','orc_hunt']:['lumber','stonecutter','farm'];
    for(const type of types)producerResult(c,type);
    c.resources={...c.caps};const metrics=R.aiPreview(c,()=>{}),military=R.aiFactionBuildings(c).filter(type=>R.BUILDINGS[type].unit);
    const safe=R.aiGrowthTargets(c,metrics,{safeOpening:true},military),exposed=R.aiGrowthTargets(c,metrics,{safeOpening:false},military);
    if(!(safe.expanding&&safe.growing&&safe.target.wood>exposed.target.wood&&safe.target.stone>exposed.target.stone))return false;
    const ids=new Set(c.buildings.map(b=>b.id));c.aiThink=0;R.aiStepCity(c,1);
    const invested=c.buildings.find(b=>!ids.has(b.id))?.type||c._aiSaveType;
    return !!R.aiBuildingMechanics(invested).produces;
   },race));
  }
  check('A small funded income shortfall cannot deadlock both economy and military construction',await p.evaluate(()=>{
   const R=__ROADLORDS_RUNTIME__,c=producerFixture('human');R.state.time=120;
   c.unlocked=new Set(['keep','lumber','stonecutter','farm','barracks','house','warehouse']);
   for(let i=0;i<6;i++)producerResult(c,'lumber');
   for(let i=0;i<6;i++){producerResult(c,'stonecutter');producerResult(c,'farm');}
   c.resources=R.C(1e5,1e5,1e5);const cell=R.findCell(c,'barracks');if(!R.placeBuilding(c,'barracks',...cell).ok)return false;
   c.resources={...c.caps};const before=R.productionRates(c).wood;
   const opportunity=R.aiConstructionOpportunities(c).find(o=>o.type==='lumber');
   if(!(opportunity?.score>0)){const metrics=R.aiPreview(c,()=>{});throw Error(JSON.stringify({stage:'opportunity',before,score:opportunity?.score,flow:R.resourceFlowRates(c),target:R.aiGrowthTargets(c,metrics,R.aiBattleState(c),['barracks']),b:c.buildings.at(-1)}));}
   c.aiThink=0;R.aiStepCity(c,1);const after=R.productionRates(c).wood;
   if(!(after>before))throw Error(JSON.stringify({stage:'turn',before,after,saving:c._aiSaveType,last:c.buildings.at(-1),growth:c._aiGrowthPlan}));
   return true;
  }));
  check('Placement evaluation consumes no RNG and leaves both real cities unchanged',await p.evaluate(()=>{
   const R=__ROADLORDS_RUNTIME__,c=producerFixture('orc');terrain(c,0,0,'forest');
   const snapshot=()=>JSON.stringify([R.P,R.E]),before=snapshot(),random=Math.random;
   Math.random=()=>{throw Error('Placement used game RNG');};
   try{for(const type of ['orc_work','orc_hunt','warehouse','orc_war'])R.findCell(c,type);return snapshot()===before;}
   finally{Math.random=random;}
  }));
  check('No producer-placement browser errors',report.errors.length===0);
 }finally{fs.mkdirSync('artifacts',{recursive:true});fs.writeFileSync('artifacts/ai-producer-placement.json',JSON.stringify(report,null,2));await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
