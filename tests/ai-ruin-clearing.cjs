const { chromium } = require('playwright'), assert = require('node:assert/strict'), fs = require('node:fs');
(async () => {
 const browser = await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox','--disable-dev-shm-usage']});
 const report={checks:[],errors:[]},check=(name,value)=>{assert(value,name);report.checks.push(name);console.log('PASS',name);};
 try {
  const page=await browser.newPage();await page.route('https://**/*',route=>route.abort());page.on('pageerror',e=>report.errors.push(e.message));
  await page.goto(process.env.ROADLORDS_TEST_URL||'http://127.0.0.1:4173/Roadlords/');await page.waitForFunction(()=>window.__ROADLORDS_RUNTIME__?.aiExcavateAncient);
  await page.evaluate(()=>{
   const R=__ROADLORDS_RUNTIME__;
   window.ruinFixture=race=>{
    R.state.running=false;R.state.pregame=false;R.state.ended=false;R.state.startChoices=0;R.state.time=180;R.state.units=[];R.MP.enabled=false;R.aiDecisionCache=null;
    R.roadResetCity(R.E,race);const c=R.E;c.buildings=c.buildings.filter(b=>b.type==='keep');c.terrain.fill(null);
    c.normal={};c.legends=new Set();c.unlocked=new Set(Object.keys(R.BUILDINGS).filter(k=>R.factionMatches(race,R.BUILDINGS[k],k)));
    R.recomputeCity(c,true);c.resources=R.C(100000,100000,100000);c.caps=R.C(100000,100000,100000);return c;
   };
   window.ruinTick=()=>{R.E.aiThink=0;R.enemyBuildAI(1);};
   window.ruinPut=type=>{const c=R.E;c.resources=R.C(100000,100000,100000);const cell=R.findCell(c,type);if(!cell)throw Error('No plot for '+type);const out=R.placeBuilding(c,type,...cell,true);if(!out.ok)throw Error(out.reason);return c.buildings.at(-1);};
  });
  for(const race of ['human','orc','undead']) {
   check(race+': blocking ruins are cleared at the current faction price and construction then succeeds',await page.evaluate(race=>{
    const R=__ROADLORDS_RUNTIME__,c=ruinFixture(race),type={human:'lumber',orc:'orc_work',undead:'und_well'}[race];
    const occupied=R.occupancy(c);for(let row=0;row<R.GRID;row++)for(let col=0;col<R.GRID;col++)if(!occupied.has(R.idx(row,col)))R.setTerrain(c,row,col,'ruin');
    const price=R.terrainClearPrice(c,'ruin'),before={...c.resources};let clears=0;
    while(!R.findCell(c,type)&&clears<4){if(!R.aiMakeRoomFor(type))return false;clears++;}
    return clears>0&&R.RES.every(k=>Math.abs(before[k]-c.resources[k]-clears*price[k])<1e-8)&&R.aiBuild(type);
   },race));
   check(race+': ancient excavation preserves operating cash and awards exactly one common pick',await page.evaluate(race=>{
    const R=__ROADLORDS_RUNTIME__,c=ruinFixture(race),filler={human:'farm',orc:'orc_hunt',undead:'und_well'}[race];
    const occupied=R.occupancy(c);for(let row=0;row<R.GRID;row++)for(let col=0;col<R.GRID;col++)if(!occupied.has(R.idx(row,col))&&!(row===0&&col<=1))c.buildings.push({id:'fill-'+row+'-'+col,type:filler,row,col,rotation:0,level:1,inactive:true,progress:0});
    R.setTerrain(c,0,0,'ancient');const price=R.terrainClearPrice(c,'ancient');c.resources={...price};
    if(R.aiExcavateAncient()||!R.terrainAt(c,0,0))return false;
    c.resources=R.C(price.wood+100,price.stone+100,100);const before={...c.resources},normal=Object.values(c.normal).reduce((a,b)=>a+b,0),legends=c.legends.size;
    return R.aiExcavateAncient()&&!R.terrainAt(c,0,0)&&R.RES.every(k=>Math.abs(before[k]-c.resources[k]-price[k])<1e-8)&&Object.values(c.normal).reduce((a,b)=>a+b,0)===normal+1&&c.legends.size===legends;
   },race));
   check(race+': the real AI turn excavates an affordable ancient ruin after its opening',await page.evaluate(race=>{
    const R=__ROADLORDS_RUNTIME__,c=ruinFixture(race);
    const opening={human:['lumber','lumber','lumber','stonecutter','barracks','barracks'],orc:['orc_work','orc_hunt','warehouse','orc_war','orc_war'],undead:['und_well','und_well','und_well','und_well','und_well','und_graveyard','und_graveyard']}[race];
    for(const type of opening)ruinPut(type);
    if(race==='undead')R.setBuildingLevel(c,'und_well',4);
    const occupied=R.occupancy(c);let target;
    for(let row=0;row<R.GRID&&!target;row++)for(let col=0;col<R.GRID;col++)if(!occupied.has(R.idx(row,col))){target=[row,col];break;}
    R.setTerrain(c,...target,'ancient');c.resources=R.C(100000,100000,100000);ruinTick();return !R.terrainAt(c,...target);
   },race));
  }
  check('Undead AI saves Souls for clearing, then clears and builds a Well through real turns',await page.evaluate(()=>{
   const R=__ROADLORDS_RUNTIME__,c=ruinFixture('undead'),occupied=R.occupancy(c);
   for(let row=0;row<R.GRID;row++)for(let col=0;col<R.GRID;col++)if(!occupied.has(R.idx(row,col)))R.setTerrain(c,row,col,'ruin');
   c.resources=R.C(99,0,0);const before=c.buildings.length;ruinTick();
   if(!(c.undSaveSouls===400+R.buildPrice(c,'und_well').wood)||c.resources.wood!==99||c.buildings.length!==before)return false;
   c.resources.wood=c.undSaveSouls;for(let n=0;n<4;n++){ruinTick();if(R.buildingOf(c,'und_well').length)return false;}
   ruinTick();return R.buildingOf(c,'und_well').length===1&&c.buildings.length===before+1;
  }));
  check('Undead AI clears a multi-cell Graveyard plot without demolishing its Wells',await page.evaluate(()=>{
   const R=__ROADLORDS_RUNTIME__,c=ruinFixture('undead');for(let n=0;n<3;n++)ruinPut('und_well');
   const occupied=R.occupancy(c);for(let row=0;row<R.GRID;row++)for(let col=0;col<R.GRID;col++)if(!occupied.has(R.idx(row,col)))R.setTerrain(c,row,col,'ruin');
   c.resources.wood=5000;const wells=R.buildingOf(c,'und_well').map(b=>b.id);
   for(let n=0;n<6&&!R.buildingOf(c,'und_graveyard').length;n++)ruinTick();
   return R.buildingOf(c,'und_graveyard').length===1&&wells.every(id=>R.getBuilding(c,id));
  }));
  check('Undead AI saves for blocked land instead of demolishing a funded Well when clearing is one Soul short',await page.evaluate(()=>{
   const R=__ROADLORDS_RUNTIME__,c=ruinFixture('undead');for(let n=0;n<5;n++)ruinPut('und_well');R.setBuildingLevel(c,'und_well',4);
   const occupied=R.occupancy(c);for(let row=0;row<R.GRID;row++)for(let col=0;col<R.GRID;col++)if(!occupied.has(R.idx(row,col)))R.setTerrain(c,row,col,'ruin');
   c.resources=R.C(99,0,0);const before=JSON.stringify(c.buildings);ruinTick();
   return JSON.stringify(c.buildings)===before&&c.resources.wood===99&&c.undSaveSouls>100;
  }));
  check('Orc excavation uses the enemy city footprint for a reduced-size L4 Troll pit',await page.evaluate(()=>{
   const R=__ROADLORDS_RUNTIME__,c=ruinFixture('orc');c.levels.orc_troll=4;c.l4Branches.orc_troll='breeding';R.P.l4Branches.orc_troll=null;
   const occupied=R.occupancy(c);for(let row=0;row<R.GRID;row++)for(let col=0;col<R.GRID;col++)if(!occupied.has(R.idx(row,col)))c.buildings.push({id:'hunt-'+row+'-'+col,type:'orc_hunt',row,col,rotation:0,level:1,progress:0});
   c.buildings=c.buildings.filter(b=>!(b.row<2&&b.col<2));for(let row=0;row<2;row++)for(let col=0;col<2;col++)R.setTerrain(c,row,col,'ruin');
   for(let n=0;n<4;n++)if(!R.aiClearBlockingRuin('orc_troll'))return false;
   const cell=R.findCell(c,'orc_troll');return !!cell&&R.cityBuildingCells(c,{type:'orc_troll',row:cell[0],col:cell[1],rotation:cell[2]}).length===4&&R.aiBuild('orc_troll');
  }));
  check('Ancient excavation stops under invasion and in multiplayer',await page.evaluate(()=>{
   const R=__ROADLORDS_RUNTIME__,c=ruinFixture('undead');ruinPut('und_graveyard');ruinPut('und_graveyard');R.setTerrain(c,9,9,'ancient');
   R.state.units=Array.from({length:3},(_,id)=>({id,key:'swordsman',side:'player',alive:true,lane:R.PATH_LENGTH*.9}));
   if(R.aiExcavateAncient())return false;R.state.units=[];R.MP.enabled=true;const blocked=!R.aiExcavateAncient();R.MP.enabled=false;return blocked&&!!R.terrainAt(c,9,9);
  }));
  check('No ruin-clearing browser errors',report.errors.length===0);
 } finally {fs.mkdirSync('artifacts',{recursive:true});fs.writeFileSync('artifacts/ai-ruin-clearing.json',JSON.stringify(report,null,2));await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
