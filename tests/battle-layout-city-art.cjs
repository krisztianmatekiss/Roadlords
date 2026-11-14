const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{
 const b=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox','--disable-dev-shm-usage']}),report={checks:[],errors:[]};
 const check=(name,ok,data)=>{assert(ok,name+(data?' '+JSON.stringify(data):''));report.checks.push(name);console.log('PASS',name);};
 try{
  const p=await b.newPage({viewport:{width:1920,height:1080}});await p.route('https://**/*',r=>r.abort());p.on('pageerror',e=>report.errors.push(e.message));
  await p.goto(process.env.ROADLORDS_TEST_URL||'http://127.0.0.1:4173/Roadlords/');await p.waitForFunction(()=>window.__ROADLORDS_RUNTIME__?.menuOpening.ready);await p.locator('.menuBrand').click();await p.locator('#mpSolo').click();await p.selectOption('#soloRace','human');await p.selectOption('#aiRace','orc');await p.locator('#raceContinue').click();await p.waitForFunction(()=>__ROADLORDS_RUNTIME__.state.pregame);await p.locator('#pregameReady').click();await p.waitForFunction(()=>__ROADLORDS_RUNTIME__.state.choiceContext);
  await p.evaluate(()=>{const R=__ROADLORDS_RUNTIME__;Object.assign(R.state,{running:false,pregame:false,modal:false,startChoices:0,choiceContext:null});R.$('#choiceOverlay').classList.add('hidden');R.$('#pickReminder').classList.add('hidden');});
  const rows=await p.evaluate(()=>{
   const R=__ROADLORDS_RUNTIME__,rows=[];
   for(const race of ['human','orc']){
    R.roadResetCity(R.P,race);R.P.terrain.fill(null);R.P.unlocked=new Set(Object.keys(R.BUILDINGS));
    const keep=structuredClone(R.P.buildings[0]);keep.row=keep.col=0;
    const manifest=race==='human'?__ROADLORDS_HUMAN_MAP__:__ROADLORDS_ORC_MAP_VIEWS__;
    for(const [type,d]of Object.entries(R.BUILDINGS).filter(([type,d])=>R.factionMatches(race,d,type))){
     const opts=R.rotationOptions(type),signatures=new Set();
     for(const rotation of opts){
      R.P.buildings=[structuredClone(keep)];R.P.resources=R.C(1e6,1e6,1e6);R.recomputeCity(R.P,false);R.P.resources=R.C(1e6,1e6,1e6);
      const col=type==='guardhouse'?0:3,placed=type==='keep'?{ok:true,building:Object.assign(R.P.buildings[0],{row:3,col,rotation})}:R.placeBuilding(R.P,type,3,col,rotation);
      if(!placed.ok){rows.push({race,type,rotation,error:placed.reason});continue;}
      R.renderStatic();const node=R.$(`#playerGrid .building[data-id="${placed.building.id}"]`),sprite=node.querySelector(race==='human'?'.humanMapSprite':'.orcMapSprite'),plane=sprite?.querySelector(race==='human'?'.humanMapPlane':'.orcMapPlane'),m=plane&&new DOMMatrix(getComputedStyle(plane).transform),svg=sprite?.querySelector('svg'),art=manifest.sprites[type],view=art?.views?.[rotation]||art;
      const upright=m&&Math.abs(m.a-1)<1e-6&&Math.abs(m.d-1)<1e-6&&Math.abs(m.b)<1e-6&&Math.abs(m.c)<1e-6;
      const signature=svg?.getAttribute('viewBox')+':'+view?.source;signatures.add(signature);
      R.state.selectedBuild=type;R.state.buildRotation=rotation;R.previewPlacement(7,type==='guardhouse'?0:7);
      const ghost=R.$('#playerGrid .placementBuildingGhost [data-art-rotation]');
      rows.push({race,type,rotation,upright,view:svg?.getAttribute('viewBox')===view?.rect.join(' '),turn:Number(sprite?.dataset.artRotation),ghost:type==='keep'||Number(ghost?.dataset.artRotation)===rotation,options:opts.length,signatures:0});
      R.clearPlacementPreview();R.state.selectedBuild=null;
     }
     for(const row of rows.filter(r=>r.race===race&&r.type===type))row.signatures=signatures.size;
    }
   }return rows;
  });report.views=rows;
  check('All 36 Human and 26 Orc city views place and preview with upright, independently drawn art',rows.length===62&&rows.every(r=>!r.error&&r.upright&&r.view&&r.turn===r.rotation&&r.ghost&&r.signatures===r.options),rows.filter(r=>r.error||!r.upright||!r.view||!r.ghost||r.signatures!==r.options));
  check('Symmetric footprints have one orientation, rectangles two and L shapes four; old placements keep equivalent cells',await p.evaluate(()=>{const R=__ROADLORDS_RUNTIME__;return R.rotationOptions('lumber').join(',')==='0'&&R.rotationOptions('orc_troll').join(',')==='0'&&R.rotationOptions('warehouse').join(',')==='0,1'&&R.rotationOptions('orc_warg').join(',')==='0,1'&&R.rotationOptions('siegeworks').join(',')==='0,1,2,3'&&R.normalizedRotation('warehouse',3)===1&&R.normalizedRotation('warehouse',2)===0&&R.normalizedRotation('lumber',3)===0;}));
  await p.evaluate(()=>{const R=__ROADLORDS_RUNTIME__;R.roadResetCity(R.P,'human');R.P.terrain.fill(null);R.P.unlocked.add('lumber');R.P.unlocked.add('warehouse');R.state.selectedBuild='lumber';R.state.buildRotation=0;R.renderStatic();R.renderBuildList();});
  check('Square buildings show no rotation control and ignore rotation requests',await p.evaluate(()=>{const R=__ROADLORDS_RUNTIME__;R.rotateSelectedBuild();return !R.$('#rotatePlacement')&&R.state.buildRotation===0&&!R.$('#placementHint').textContent.includes('forog');}));
  await p.evaluate(()=>{const R=__ROADLORDS_RUNTIME__;R.state.selectedBuild='warehouse';R.state.buildRotation=0;R.renderBuildList();R.previewPlacement(7,7);});await p.locator('#rotatePlacement').click();await p.waitForTimeout(100);
  check('The real rotation control swaps a rectangular building to its end view and changes the placement footprint',await p.evaluate(()=>{const R=__ROADLORDS_RUNTIME__,g=R.$('#playerGrid .placementBuildingGhost .humanMapSprite'),m=new DOMMatrix(getComputedStyle(g.querySelector('.humanMapPlane')).transform);return R.state.buildRotation===1&&g.dataset.artRotation==='1'&&R.shapeBounds('warehouse',1).w===1&&R.shapeBounds('warehouse',1).h===2&&m.a===1&&m.d===1;}));
  for(const race of ['human','orc']){
   const count=await p.evaluate(async race=>{const R=__ROADLORDS_RUNTIME__;R.roadResetCity(R.P,race);R.P.terrain.fill(null);R.P.unlocked=new Set(Object.keys(R.BUILDINGS));R.state.selectedBuild=null;R.clearPlacementPreview();const keep=R.P.buildings[0];keep.row=keep.col=0;const types=Object.entries(R.BUILDINGS).filter(([k,d])=>k!=='keep'&&R.factionMatches(race,d,k)).sort((a,b)=>b[1].shape.length-a[1].shape.length);for(const [type]of types){R.P.resources=R.C(1e6,1e6,1e6);const at=R.findCell(R.P,type);if(at)R.placeBuilding(R.P,type,...at);}R.renderStatic();R.updateHud();R.roadResize();R.roadWar.scrollLeft=0;await R.chronicle.tile(race).cssReady;R.renderBattle(0);return R.P.buildings.length;},race);
   check(`The complete ${race} city uses its new map art in the actual game`,count===(race==='human'?23:18),count);await p.screenshot({path:`artifacts/city-views-480-${race}.png`});
  }
  check('The Human courtyard uses its quiet ground texture',await p.evaluate(()=>__ROADLORDS_RUNTIME__.chronicle.assets.get('human').courtyard.src.includes('human-courtyard-soft')));
  check('City views and rotation controls have no browser errors',report.errors.length===0,report.errors);
 }finally{fs.mkdirSync('artifacts',{recursive:true});fs.writeFileSync('artifacts/city-views-480.json',JSON.stringify(report,null,2));await b.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
