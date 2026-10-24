const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
const URL=process.env.ROADLORDS_TEST_URL||'http://127.0.0.1:4173/Roadlords/';
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
 const report={checks:[],errors:[]},check=(name,ok)=>{assert(ok,name);report.checks.push(name);console.log('PASS',name);};
 try{
  const page=await browser.newPage({viewport:{width:1920,height:1080}});await page.route('https://**/*',r=>r.abort());page.on('pageerror',e=>report.errors.push(e.message));
  await page.goto(URL);await page.waitForFunction(()=>!!window.__ROADLORDS_ROAD__);
  check('Minimap stays hidden in the main menu',!await page.locator('#roadMinimap').isVisible());
  await page.locator('.menuBrand').click();await page.waitForTimeout(900);await page.locator('#roadTestsMenu').click();await page.locator('#roadTestMenu').click();
  await page.evaluate(()=>{__ROADLORDS_ROAD__.startTest(42);__ROADLORDS_ROAD__.pause();__ROADLORDS_RUNTIME__.roadWar.scrollLeft=0;});await page.waitForTimeout(200);
  check('Each building has one continuous category footprint with a single inset outer border',await page.evaluate(()=>{
   const R=__ROADLORDS_RUNTIME__;
   return [['#playerGrid',R.P],['#enemyGrid',R.E]].every(([id,c])=>{
    const grid=R.$(id),cells=[...grid.querySelectorAll('.buildingFootprint')];
    return cells.length===c.buildings.length&&cells.every(el=>{
     const b=c.buildings.find(b=>b.id===el.dataset.id),art=grid.querySelector(`.building[data-id="${b.id}"]`),bounds=R.shapeBounds(b.type,b.rotation||0);
     if(!art||!el.classList.contains(R.BUILDINGS[b.type].category)||el.children.length!==1)return false;
     const a=el.getBoundingClientRect(),r=art.getBoundingClientRect(),path=el.firstChild,box=path.getBBox(),s=getComputedStyle(path);
     const rectangle=bounds.cells.length===bounds.w*bounds.h;
     return Math.abs(a.left-r.left)<.1&&Math.abs(a.top-r.top)<.1&&Math.abs(box.x-4)<.1&&Math.abs(box.y-4)<.1&&Math.abs(a.width-box.width-8)<.1&&Math.abs(a.height-box.height-8)<.1&&s.strokeWidth==='2px'&&s.fillOpacity==='0.16'&&getComputedStyle(el).pointerEvents==='none'&&(!rectangle||(path.getAttribute('d').match(/L/g)||[]).length===3);
    });
   });
  }));
  check('Category outlines stay above artwork on both sides while tint stays beneath it, with original category colors and no art filtering',await page.evaluate(()=>{
   const R=__ROADLORDS_RUNTIME__;
   return [['#playerGrid',R.P],['#enemyGrid',R.E]].every(([id,c])=>c.buildings.every(b=>{
    const grid=R.$(id),el=grid.querySelector(`.buildingFootprint[data-id="${b.id}"]`),border=grid.querySelector(`.buildingOutline[data-id="${b.id}"]`),art=grid.querySelector(`.building[data-id="${b.id}"]`);
    return border&&getComputedStyle(border).getPropertyValue('--footprint-color').trim()===getComputedStyle(art).getPropertyValue('--accent').trim()&&getComputedStyle(border).filter==='none'&&getComputedStyle(border).pointerEvents==='none'&&Number(getComputedStyle(border).zIndex)>Number(getComputedStyle(art).zIndex)&&Number(getComputedStyle(el).zIndex)<Number(getComputedStyle(art).zIndex)&&getComputedStyle(border.firstChild).fill==='none'&&el.firstChild.getAttribute('d')===border.firstChild.getAttribute('d');
   }));
  }));
  check('Repeated render paths do not accumulate footprint or outline layers',await page.evaluate(()=>{const R=__ROADLORDS_RUNTIME__,n=document.querySelectorAll('.buildingFootprint').length;for(let i=0;i<5;i++)R.renderStatic();return n===document.querySelectorAll('.buildingFootprint').length&&n===document.querySelectorAll('.buildingOutline').length;}));
  check('Rotated L-shaped buildings leave their empty corner uncolored',await page.evaluate(()=>{
   const R=__ROADLORDS_RUNTIME__,grid=document.createElement('div');grid.className='citygrid';
   grid.style.cssText='position:fixed;left:-1000px;top:0;width:400px;height:400px';document.body.append(grid);
   try{
    for(const rotation of R.rotationOptions('siegeworks')){
     const b={...R.P.buildings[0],id:'rotated-footprint',type:'siegeworks',row:2,col:2,rotation,level:1};
     R.roadOldRenderCity(grid,{...R.P,buildings:[b]},true);
     const occupied=R.rotatedShape(b.type,rotation).map(c=>c.join(',')),mark=grid.querySelector('.buildingFootprint'),path=mark.firstChild,box=mark.viewBox.baseVal;
     if(grid.querySelectorAll('.buildingFootprint').length!==1||grid.querySelectorAll('.plot').length!==97||(path.getAttribute('d').match(/L/g)||[]).length!==5)return false;
     for(let r=0;r<2;r++)for(let c=0;c<2;c++)if(path.isPointInFill(new DOMPoint((c+.5)*box.width/2,(r+.5)*box.height/2))!==occupied.includes(`${r},${c}`))return false;
    }
    return true;
   }finally{grid.remove();}
  }));
  async function layout(){return page.evaluate(()=>{const R=__ROADLORDS_RUNTIME__,r=e=>e.getBoundingClientRect().toJSON();return {map:r(R.$('#roadMinimap')),dock:r(R.$('.command')),catalog:r(R.$('.catalog')),roster:r(R.$('#roadRoster')),topbar:r(R.$('.topbar'))};});}
  const desktop=await layout();report.desktop=desktop;
  check('Minimap fills the construction dock height at the right without changing app rows',desktop.map.left>1920*.7&&desktop.map.right<=desktop.dock.right&&desktop.map.bottom<=desktop.dock.bottom&&Math.abs(desktop.map.top-desktop.dock.top)<=1&&Math.abs(desktop.map.height-desktop.dock.height)<=1&&desktop.topbar.height===64&&desktop.dock.height===209&&desktop.roster.bottom<desktop.dock.top);
  // Capture actual canvas primitives: canonical positions, living units and live towers.
  const draw=await page.evaluate(()=>{
   const R=__ROADLORDS_RUNTIME__,canvas=R.$('#roadMinimap'),g=canvas.getContext('2d'),rects=[],dots=[];
   const rect=g.fillRect.bind(g),arc=g.arc.bind(g);
   g.fillRect=(...a)=>{rects.push({a,color:g.fillStyle});rect(...a);};
   g.arc=(...a)=>{dots.push({a,color:g.fillStyle});arc(...a);};
   R.roadDrawMinimap(true);g.fillRect=rect;g.arc=arc;
   const w=canvas.getBoundingClientRect().width-8,world=R.PATH_LENGTH+R.ROAD.city*2;
   const cities=rects.filter(r=>r.a[3]>(canvas.getBoundingClientRect().height-8)*.8&&['player','enemy'].some(side=>r.color===R.unitTeamFill({side})));
   return {dots:dots.length,alive:R.state.units.filter(u=>u.alive).length,towers:rects.filter(r=>r.a[2]===3&&r.a[3]===6).length,liveTowers:R.towers.filter(t=>t.alive).length,cities:cities.length,
    correct:R.state.units.filter(u=>u.alive).every(u=>dots.some(d=>Math.abs(d.a[0]-(4+(R.ROAD.city+u.lane)/world*w))<.01&&d.color===R.unitTeamFill(u))),pixel: [...g.getImageData(Math.round(canvas.width/2),Math.round(canvas.height/2),1,1).data],canvas:[canvas.width,canvas.height],children:canvas.children.length};
  });report.draw=draw;
  check('Minimap draws both cities and all 1000 live unit dots at world positions with team colors',draw.dots===1000&&draw.alive===1000&&draw.cities===2&&draw.correct&&draw.pixel[3]===255);
  check('Minimap draws live towers as rectangles using one canvas bounded by dock height and 2x pixel density',draw.towers===draw.liveTowers&&draw.canvas[0]<=640&&draw.canvas[1]<=Math.ceil(desktop.dock.height*2)&&draw.children===0);
  check('Dead units and destroyed towers disappear from the minimap',await page.evaluate(()=>{
   const R=__ROADLORDS_RUNTIME__,u=R.state.units[0],t=R.towers[0];u.alive=false;t.alive=false;
   const g=R.$('#roadMinimap').getContext('2d'),arc=g.arc.bind(g),fill=g.fillRect.bind(g);let dots=0,towers=0;
   g.arc=(...a)=>{dots++;arc(...a);};g.fillRect=(...a)=>{if(a[2]===3&&a[3]===6)towers++;fill(...a);};
   R.roadDrawMinimap(true);g.arc=arc;g.fillRect=fill;u.alive=true;t.alive=true;
   return dots===999&&towers===R.towers.length-1;
  }));
  const map=page.locator('#roadMinimap'),box=await map.boundingBox();
  await map.click({position:{x:box.width/2,y:box.height/2}});
  check('Clicking the minimap navigates while paused and leaves the enemy city pinned',await page.evaluate(()=>{const R=__ROADLORDS_RUNTIME__;return R.roadWar.scrollLeft>1500&&R.ROAD.paused&&R.ROAD.enemyPinned;}));
  await page.keyboard.press('End');const end=await page.evaluate(()=>__ROADLORDS_RUNTIME__.roadWar.scrollLeft);await page.keyboard.press('Home');
  check('Keyboard access reaches both map edges',end>2000&&await page.evaluate(()=>__ROADLORDS_RUNTIME__.roadWar.scrollLeft)===0);
  await page.mouse.move(box.x+30,box.y+30);await page.mouse.down();await page.mouse.move(box.x+box.width-5,box.y+30,{steps:8});await page.mouse.up();
  check('Dragging the minimap pans to the right without moving the construction dock',await page.evaluate(()=>__ROADLORDS_RUNTIME__.roadWar.scrollLeft>2000)&&(await layout()).dock.top===desktop.dock.top);
  await page.evaluate(()=>{__ROADLORDS_RUNTIME__.roadWar.scrollLeft=0;document.body.classList.remove('road-test');});await page.waitForTimeout(100);
  const normal=await layout();
  check('Normal construction cards end before the minimap and retain their scroll controls',normal.catalog.right<normal.map.left&&await page.locator('#buildNext').isVisible()&&await page.locator('#buildPrev').isVisible());
  await page.locator('#buildNext').click();await page.waitForTimeout(350);
  check('Construction cards still scroll inside the reserved space',await page.evaluate(()=>document.querySelector('#buildList').scrollLeft>0));
  await page.screenshot({path:'artifacts/minimap-footprints-1920.png'});
  for(const [width,height] of [[3804,1746],[1440,960],[800,900]]){
   await page.setViewportSize({width,height});await page.waitForTimeout(150);const l=await layout();
   check(`Minimap fills dock height beside construction cards at ${width}x${height}`,l.map.right<=width&&l.map.bottom<=height&&Math.abs(l.map.top-l.dock.top)<=1&&Math.abs(l.map.height-l.dock.height)<=1&&l.catalog.right<l.map.left&&l.roster.bottom<=l.dock.top);
   if(width===3804)await page.screenshot({path:'artifacts/minimap-footprints-3804.png'});
  }
  check('Footprints and minimap produce no runtime errors',!report.errors.length&&!await page.evaluate(()=>__ROADLORDS_RUNTIME__.state.lastRuntimeErrorV4965));
 }finally{fs.mkdirSync('artifacts',{recursive:true});fs.writeFileSync('artifacts/minimap-footprints.json',JSON.stringify(report,null,2));await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
