const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox','--disable-dev-shm-usage']});
 const report={checks:[],errors:[]},check=(name,ok)=>{assert(ok,name);report.checks.push(name);console.log('PASS',name);};
 try{
  const p=await browser.newPage();await p.route('https://**/*',r=>r.abort());p.on('pageerror',e=>report.errors.push(e.message));
  await p.goto(process.env.ROADLORDS_TEST_URL||'http://127.0.0.1:4173/Roadlords/');await p.waitForFunction(()=>window.__ROADLORDS_RUNTIME__?.aiBattleState);
  await p.evaluate(()=>{
   const R=__ROADLORDS_RUNTIME__,towers=structuredClone(R.towers);
   window.mapFixture=(side,race='undead')=>{
    R.MP.enabled=false;R.spectator.active=true;R.ROAD.test=false;R.ROAD.paused=true;
    Object.assign(R.state,{running:false,pregame:false,ended:false,modal:false,startChoices:0,time:240,units:[]});
    R.$('#pauseBtn').classList.add('on');R.ROAD.clock=240;R.state.combatStep=(R.state.combatStep||0)+1;
    for(const [c,r]of [[R.P,side==='player'?race:'human'],[R.E,side==='enemy'?race:'human']]){
     R.roadResetCity(c,r);c.terrain.fill(null);c.unlocked=new Set(R.aiFactionBuildings(c));R.recomputeCity(c,false);c.resources=R.C(1e6,1e6,1e6);
    }
    R.towers.forEach((t,i)=>Object.assign(t,structuredClone(towers[i])));R.roadRefreshFrontiers();
    const c=R.cityForSide(side);c.aiThink=0;return c;
   };
   window.mapPut=(c,type)=>{c.resources=R.C(1e6,1e6,1e6);const cell=R.findCell(c,type);if(!cell)throw Error('No plot '+type);const out=R.placeBuilding(c,type,...cell);if(!out.ok)throw Error('Cannot place '+type);return c.buildings.at(-1);};
   window.mapActor=(c,key,d)=>{const u=R.releaseUnit(c,R.makeEntry(c,key));if(!u)throw Error('Cannot spawn '+key);u.lane=c===R.P?d:R.PATH_LENGTH-d;u.offset=0;return u;};
   window.portalFixture=side=>{const c=mapFixture(side);for(let n=0;n<4;n++)mapPut(c,'und_well');R.setBuildingLevel(c,'und_well',4);mapPut(c,'und_graveyard');mapPut(c,'und_otherworld_portal');c.resources=R.C(1e6,0,0);c.garrison=Array.from({length:20},()=>R.makeEntry(c,'und_skeleton'));c.gateMode='closed';c.aiThink=0;R.aiStepCity(c,1);return c;};
  });
  for(const side of ['player','enemy']){
   check(side+': a funded offensive wave uses the real portal to reach the border',await p.evaluate(side=>{
    const R=__ROADLORDS_RUNTIME__,c=portalFixture(side);if(!c.undPortalEnabled)return false;
    const u=R.releaseUnit(c,R.makeEntry(c,'und_skeleton'));return !!u&&Math.abs(u.lane-R.territoryBoundary())<1;
   },side));
   check(side+': a flank never strands the city; reinforcements return to the gate immediately',await p.evaluate(side=>{
    const R=__ROADLORDS_RUNTIME__,c=portalFixture(side),other=c===R.P?R.E:R.P;
    for(const t of R.towers)if(t.side===side&&t.tier===1)t.alive=false;
    for(let n=0;n<8;n++){mapActor(c,'und_skeleton',R.PATH_LENGTH*.6);mapActor(other,'swordsman',R.PATH_LENGTH*.7);}
    R.state.time++;c.aiThink=100;const state=R.aiBattleState(c);R.aiGate(c);
    const u=R.releaseUnit(c,R.makeEntry(c,'und_skeleton')),d=c===R.P?u.lane:R.PATH_LENGTH-u.lane;
    return state.portalUnsafe&&!c.undPortalEnabled&&d<R.PATH_LENGTH*.03&&c.aiThink===100;
   },side));
   check(side+': portal cooldown prevents rapid toggles and allows the next safe wave',await p.evaluate(side=>{
    const R=__ROADLORDS_RUNTIME__,c=portalFixture(side),other=c===R.P?R.E:R.P;
    for(let n=0;n<6;n++)mapActor(other,'swordsman',R.PATH_LENGTH*.7);
    R.state.time++;R.aiGate(c);if(c.undPortalEnabled)return false;
    R.state.units=[];R.state.time++;c.aiThink=0;c.releaseQueue=[R.makeEntry(c,'und_skeleton')];R.aiStepCity(c,1);
    if(c.undPortalEnabled)return false;
    R.state.time+=9;c.aiThink=0;R.aiStepCity(c,1);return c.undPortalEnabled;
   },side));
   check(side+': intact towers can absorb small early harassment while income is built',await p.evaluate(side=>{
    const R=__ROADLORDS_RUNTIME__,c=mapFixture(side,'human'),other=c===R.P?R.E:R.P;R.state.time=30;c.resources=R.C(110,30,20);
    const front=R.towers.filter(t=>t.side===side&&!t.gateTower).sort((a,b)=>side==='player'?b.lane-a.lane:a.lane-b.lane)[0];
    const d=side==='player'?front.lane:R.PATH_LENGTH-front.lane;
    mapActor(other,'swordsman',R.PATH_LENGTH-d-100);
    const battle=R.aiBattleState(c);c.aiThink=0;R.aiStepCity(c,1);
    const type=c.buildings.find(b=>b.type!=='keep')?.type||c._aiSaveType;
    return battle.safeOpening&&!battle.urgent&&!!R.aiBuildingMechanics(type).produces;
   },side));
   check(side+': imminent tower loss changes the decision and releases even a small defensive reserve',await p.evaluate(side=>{
    const R=__ROADLORDS_RUNTIME__,c=mapFixture(side,'human'),other=c===R.P?R.E:R.P;
    const front=R.towers.filter(t=>t.side===side&&!t.gateTower).sort((a,b)=>side==='player'?b.lane-a.lane:a.lane-b.lane)[0];
    front.hp=front.maxHp*.1;const d=side==='player'?front.lane:R.PATH_LENGTH-front.lane;
    for(let n=0;n<12;n++)mapActor(other,'catapult',R.PATH_LENGTH-d-100);
    c.garrison=[R.makeEntry(c,'swordsman')];c.gateMode='closed';const battle=R.aiBattleState(c);c.aiThink=0;R.aiStepCity(c,1);
    return battle.urgent&&c.gateMode==='open'&&c.releaseQueue.length===1&&R.activeSpawners(c).length>0;
   },side));
   check(side+': an unneeded expensive unlock does not force an opening warehouse',await p.evaluate(side=>{
    const R=__ROADLORDS_RUNTIME__,c=mapFixture(side,'human');R.state.time=30;c.resources=R.C(110,30,20);
    const metrics=R.aiPreview(c,()=>{});if(R.aiStoragePressure(c,metrics))return false;
    c.aiThink=0;R.aiStepCity(c,1);return !R.hasBuilding(c,'warehouse')&&R.aiBuildingMechanics(c._aiSaveType||c.buildings.at(-1).type).produces;
   },side));
  }
  check('A concrete useful investment above the cap can still request storage',await p.evaluate(()=>{
   const R=__ROADLORDS_RUNTIME__,c=mapFixture('enemy','human');c.resources=R.C(50,50,50);c._aiSaveType='stable';c._aiSavePrice=R.C(c.caps.wood+100,0,0);
   return R.aiStoragePressure(c,R.aiPreview(c,()=>{}));
  }));
  check('Idle surplus alone cannot fill the city with more and more warehouses',await p.evaluate(()=>{
   const R=__ROADLORDS_RUNTIME__,c=mapFixture('enemy','human');mapPut(c,'lumber');mapPut(c,'lumber');c.resources={...c.caps};
   return !R.aiStoragePressure(c,R.aiPreview(c,()=>{}));
  }));
  check('A support with no useful targets cannot trigger pointless ruin clearing',await p.evaluate(()=>{
   const R=__ROADLORDS_RUNTIME__,c=mapFixture('enemy','human'),occupied=R.occupancy(c);
   for(let r=0;r<R.GRID;r++)for(let col=0;col<R.GRID;col++)if(!occupied.has(R.idx(r,col)))R.setTerrain(c,r,col,'ruin');
   const before={...c.resources};return !R.aiBlockingPlan(c,'tavern')&&!R.aiBuild('tavern',c)&&R.RES.every(r=>c.resources[r]===before[r]);
  }));
  for(const [race,producer,support]of [['human','barracks','tavern'],['orc','orc_war','orc_arena']]){
   check(race+': nonstacking support expands to uncovered producers instead of duplicating an existing buff',await p.evaluate(({race,producer,support})=>{
    const R=__ROADLORDS_RUNTIME__,c=mapFixture('enemy',race);c.resources=R.C(1e6,1e6,1e6);
    if(!R.placeBuilding(c,producer,0,1,0,true).ok)return false;c.resources=R.C(1e6,1e6,1e6);
    if(!R.placeBuilding(c,producer,1,0,0,true).ok)return false;c.resources=R.C(1e6,1e6,1e6);
    if(!R.aiBuild(support,c))return false;
    const hub=R.buildingOf(c,support)[0];if(!R.activeSpawners(c).every(b=>R.aiSupportAffects(c,hub,b)))return false;
    const money={...c.resources};if(R.aiBuild(support,c)||R.RES.some(r=>money[r]!==c.resources[r]))return false;
    const bounds=R.shapeBounds(producer,0),row=R.GRID-bounds.h,col=R.GRID-bounds.w;
    c.resources=R.C(1e6,1e6,1e6);if(!R.placeBuilding(c,producer,row,col,0,true).ok)return false;
    c.resources=R.C(1e6,1e6,1e6);if(!R.aiBuild(support,c))return false;
    const remote=c.buildings.find(b=>b.type===producer&&b.row===row&&b.col===col);
    return R.buildingOf(c,support).length===2&&R.aiSupportAffects(c,c.buildings.at(-1),remote);
   },{race,producer,support}));
  }
  check('A stronger Town Hall-powered Tavern is recognized as an improvement rather than a redundant copy',await p.evaluate(()=>{
   const R=__ROADLORDS_RUNTIME__,c=mapFixture('enemy','human');
   for(const [type,row,col]of [['barracks',0,1],['tavern',0,0],['townhall',1,2]]){
    c.resources=R.C(1e6,1e6,1e6);if(!R.placeBuilding(c,type,row,col,0,true).ok)return false;
   }
   const before=R.aiUnitQuality(c,'swordsman',R.buildingOf(c,'barracks')[0]);c.resources=R.C(1e6,1e6,1e6);
   if(!R.aiBuild('tavern',c))return false;
   return R.aiUnitQuality(c,'swordsman',R.buildingOf(c,'barracks')[0])>before&&R.townhallPower(c,c.buildings.at(-1))===2;
  }));
  check('A full army does not keep paying for a portal that cannot deploy anybody',await p.evaluate(()=>{
   const R=__ROADLORDS_RUNTIME__,c=portalFixture('enemy');c.armyCap=1000;
   for(let n=0;n<750;n++)R.releaseUnit(c,R.makeEntry(c,'und_skeleton'));
   c.releaseQueue=[R.makeEntry(c,'und_skeleton')];R.state.time++;c.aiThink=0;R.aiStepCity(c,1);
   return R.battlePopulation(c)===750&&!c.undPortalEnabled;
  }));
  check('Economic savings are respected beyond the old 35-second timeout',await p.evaluate(()=>{
   const R=__ROADLORDS_RUNTIME__,c=mapFixture('enemy','human');mapPut(c,'archery');
   const b=R.buildingOf(c,'archery')[0],price=R.buildPrice(c,'lumber'),cost=R.primarySpawnCost(c,'archer',b);c.resources=R.C(price.wood+cost.wood-1,100,100);
   R.aiSaveForBuild('lumber',price,'economy',c);c._aiSaveSince=0;c._aiGrowthPlan={time:R.state.time,growing:true,reserve:price};
   const before={...c.resources};return !R.normalSpawn(c,b)&&R.RES.every(r=>before[r]===c.resources[r]);
  }));
  check('Optional ancient rewards do not consume the next economic repair budget',await p.evaluate(()=>{
   const R=__ROADLORDS_RUNTIME__,c=mapFixture('enemy');mapPut(c,'und_graveyard');mapPut(c,'und_graveyard');R.setTerrain(c,9,9,'ancient');
   const price=R.terrainClearPrice(c,'ancient'),budget=R.buildPrice(c,'und_well');c.resources=R.C(price.wood+budget.wood-1,0,0);
   c._aiGrowthPlan={time:R.state.time,growing:true,reserve:budget};const before=c.resources.wood;
   return !R.aiExcavateAncient('und_well',c)&&!!R.terrainAt(c,9,9)&&c.resources.wood===before;
  }));
  check('A full city can fund and reclaim an income footprint from redundant support without deleting its core',await p.evaluate(()=>{
   const R=__ROADLORDS_RUNTIME__,c=mapFixture('enemy');mapPut(c,'und_well');mapPut(c,'und_graveyard');mapPut(c,'und_graveyard');
   const protectedIds=c.buildings.map(b=>b.id);
   for(let row=0;row<R.GRID;row++)for(let col=0;col<R.GRID;col++)if(!R.occupancy(c).has(R.idx(row,col))){
    c.resources=R.C(1e6,0,0);if(!R.placeBuilding(c,'und_dark_tower',row,col,0,true).ok)return false;
   }
   c.resources=R.C();const before=JSON.stringify(c.buildings);
   if(!R.aiMakeRoomFor('und_well',c)||JSON.stringify(c.buildings)!==before||c._aiSaveReason!=='economy')return false;
   c.resources=R.C(R.buildPrice(c,'und_well').wood+100,0,0);
   for(let n=0;n<6&&R.buildingOf(c,'und_well').length<2;n++){
    R.state.time++;c.aiThink=0;R.aiStepCity(c,1);
   }
   return R.buildingOf(c,'und_well').length===2&&!c._aiRedevelopPlan&&protectedIds.every(id=>R.getBuilding(c,id))&&c.resources.wood>=0;
  }));
  check('Past capital damage without an active invasion does not keep the economy in permanent emergency mode',await p.evaluate(()=>{
   const R=__ROADLORDS_RUNTIME__,c=mapFixture('enemy','human');c.hp=c.maxHp*.4;return !R.aiBattleState(c).urgent;
  }));
  check('Map awareness and automatic portal control do not control multiplayer cities',await p.evaluate(()=>{
   const R=__ROADLORDS_RUNTIME__,c=portalFixture('enemy'),other=R.P;
   for(let n=0;n<6;n++)mapActor(other,'swordsman',R.PATH_LENGTH*.7);R.state.time++;R.MP.enabled=true;
   const before=JSON.stringify(c);R.aiGate(c);R.aiStepCity(c,1);R.aiProtectPortal(c);R.MP.enabled=false;return JSON.stringify(c)===before;
  }));
  check('No map-awareness browser errors',report.errors.length===0);
 }finally{fs.mkdirSync('artifacts',{recursive:true});fs.writeFileSync('artifacts/ai-map-awareness.json',JSON.stringify(report,null,2));await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
