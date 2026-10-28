const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const URL = process.env.ROADLORDS_TEST_URL || 'http://127.0.0.1:4173/Roadlords/';
(async () => {
  const browser = await chromium.launch({executablePath:process.env.CHROMIUM_PATH || '/usr/bin/chromium',args:['--no-sandbox','--disable-dev-shm-usage']});
  const report = {checks:[],errors:[]};
  const check = (name, value) => { assert(value,name); report.checks.push(name); console.log('PASS',name); };
  try {
    const page = await browser.newPage({viewport:{width:1600,height:1000}});
    page.on('pageerror',error => report.errors.push(error.message));
    await page.route('https://**/*',route => route.abort());
    await page.goto(URL);
    await page.waitForFunction(() => !!window.__ROADLORDS_RUNTIME__?.revealBuildCard);
    await page.evaluate(() => {
      const R = __ROADLORDS_RUNTIME__;
      R.MP.lobby.style.display='none'; R.MP.enabled=false;
      document.body.classList.remove('roadlords-menu-open','pregame-active','road-test');
      R.state.running=false; R.state.modal=false; R.state.pregame=false; R.state.choiceContext=null; R.state.startChoices=0;
      R.$('#pauseBtn').textContent='▶'; R.$('#choiceOverlay').classList.add('hidden'); R.$('#pickReminder').classList.add('hidden');
      R.roadResetCity(R.P,'human');
      for (const [id,type,row,col] of [['window-short','lumber',8,8],['window-tall','barracks',0,0],['window-wide','warcenter',0,3]])
        R.P.buildings.push({id,type,row,col,level:1,rotation:0,progress:0,paidCost:{wood:40,stone:20,food:0}});
      R.state.openBuildingInspectors=['window-short','window-tall','window-wide'];
      R.renderStatic();
    });
    await page.evaluate(() => document.fonts.ready);
    const settle = () => page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    const bounds = selector => page.evaluate(selector => {
      const header=document.querySelector('.topbar').getBoundingClientRect();
      const elements=[...document.querySelectorAll(selector)];
      return elements.length>0 && elements.every(el => {
        const r=el.getBoundingClientRect();
        return r.left>=7 && r.top>=header.bottom+7 && r.right<=innerWidth-7 && r.bottom<=innerHeight-7;
      });
    },selector);
    await settle();
    check('Short, tall and wide building windows fit when opened near the edge of the city',await bounds('.buildingInspectorWindow'));
    await page.evaluate(() => {
      const R=__ROADLORDS_RUNTIME__;
      R.state.buildingInspectorPos['window-short']={left:200,top:100}; R.renderInspector();
      R.$('[data-id="window-short"].buildingInspectorWindow').style.zIndex='99999';
      window.originalInspector=R.$('[data-id="window-short"].buildingInspectorWindow');
    });
    const short=page.locator('.buildingInspectorWindow[data-id="window-short"]');
    const start=await short.boundingBox(), head=await short.locator('.ihead').boundingBox();
    await page.mouse.move(head.x+25,head.y+head.height/2); await page.mouse.down();
    await page.mouse.move(head.x+85,head.y+head.height/2+25,{steps:4});
    await page.evaluate(() => __ROADLORDS_RUNTIME__.renderStatic());
    await page.mouse.move(head.x+145,head.y+head.height/2+60,{steps:4}); await page.mouse.up();
    const moved=await short.boundingBox();
    if (Math.abs(moved.x-start.x-120)>=2 || Math.abs(moved.y-start.y-60)>=2) console.error('Drag bounds', {start,moved,head});
    check('Dragging follows the pointer across the header and survives a game UI refresh',
      Math.abs(moved.x-start.x-120)<2 && Math.abs(moved.y-start.y-60)<2 && await page.evaluate(() => originalInspector===document.querySelector('.buildingInspectorWindow[data-id="window-short"]')));
    await page.evaluate(() => __ROADLORDS_RUNTIME__.renderInspector());
    check('A refreshed window retains its manually chosen position',Math.abs((await short.boundingBox()).x-moved.x)<1);
    check('Inspector action buttons refresh their selected state immediately, without needing a blur',await page.evaluate(() => {
      const win=document.querySelector('.buildingInspectorWindow[data-id="window-wide"]');
      const button=win.querySelector('[data-war-mode="elite"]');button.focus();button.click();
      return __ROADLORDS_RUNTIME__.P.warMode==='elite' && !!win.querySelector('.warModeCard.active [data-war-mode="elite"]');
    }));
    for (const [width,height,mode] of [[2840,2180,'auto'],[1366,768,'150'],[800,600,'100'],[1200,500,'150']]) {
      await page.setViewportSize({width,height});
      await page.evaluate(mode => __ROADLORDS_UI_SCALE__.set(mode),mode); await settle();
      check(`All windows remain fully on screen at ${width}×${height}, ${mode}`,await bounds('.buildingInspectorWindow'));
    }
    const tall=page.locator('.buildingInspectorWindow[data-id="window-tall"]');
    await tall.locator('.inspectorCard').evaluate(el => {el.scrollTop=el.scrollHeight;});
    check('Scrolling a long window keeps its drag handle and close button visible',await tall.evaluate(el => {
      const win=el.getBoundingClientRect(),head=el.querySelector('.ihead').getBoundingClientRect(),close=el.querySelector('.closeSingleInspector').getBoundingClientRect(),card=el.querySelector('.inspectorCard');
      return card.scrollHeight>card.clientHeight && head.top>=win.top && close.top>=win.top && close.bottom<=win.bottom;
    }));
    await page.screenshot({path:'artifacts/window-controls-small.png'});
    await short.locator('.closeSingleInspector').click();
    check('Close buttons close only their own window',await short.count()===0 && await page.locator('.buildingInspectorWindow').count()===2);
    await page.setViewportSize({width:1600,height:1000});
    await page.evaluate(() => {
      const R=__ROADLORDS_RUNTIME__; __ROADLORDS_UI_SCALE__.set('100');
      R.state.openBuildingInspectors=[]; R.state.selectedTowerId='p2'; R.renderInspector();
    }); await settle();
    check('Tower details use the same viewport-safe bounds',await bounds('#inspector.show'));
    const towerHead=await page.locator('#inspector .ihead').boundingBox(),towerStart=await page.locator('#inspector').boundingBox();
    await page.mouse.move(towerHead.x+25,towerHead.y+20);await page.mouse.down();
    await page.mouse.move(towerHead.x-75,towerHead.y+60,{steps:6});await page.mouse.up();
    await page.evaluate(() => {__ROADLORDS_RUNTIME__.renderInspector();__ROADLORDS_RUNTIME__.positionInspector();});await settle();
    check('Tower auto-positioning no longer overrides a manual drag',Math.abs((await page.locator('#inspector').boundingBox()).x-towerStart.x+100)<2);
    await page.evaluate(() => {const R=__ROADLORDS_RUNTIME__;R.state.selectedTowerId=null;R.state.selectedBuilding=R.E.buildings.find(b=>b.type==='keep').id;R.renderInspector();});await settle();
    check('Enemy building inspection still opens and remains on screen',await page.locator('#inspector.show').count()===1 && (await page.locator('#inspector').innerText()).includes('ELLENFÉL') && await bounds('#inspector.show'));
    await page.evaluate(() => {const R=__ROADLORDS_RUNTIME__;R.state.selectedBuilding=null;R.renderInspector();R.P.resources={wood:0,stone:0,food:0};R.roadWar.scrollLeft=0;});
    const hammer=page.locator('#demolitionTool');
    check('The hammer sits above the construction dock in the lower left',await hammer.evaluate(el => {
      const r=el.getBoundingClientRect(),dock=document.querySelector('.command').getBoundingClientRect();return r.left<25&&r.bottom<dock.top&&r.top>innerHeight/2;
    }));
    await hammer.click();
    const target=page.locator('#playerGrid .buildingHitCell[data-id="window-tall"]').first();
    await target.hover();
    check('Taking the hammer shows its cursor and highlights the actual target',await target.evaluate(el => getComputedStyle(el).cursor.includes('data:image/svg') && el.classList.contains('demolitionTarget')));
    await target.click();
    check('Hammer demolition uses the real 50% refund without opening an inspector',await page.evaluate(() => {
      const R=__ROADLORDS_RUNTIME__;return !R.getBuilding(R.P,'window-tall')&&R.P.resources.wood===20&&R.P.resources.stone===10&&!R.state.openBuildingInspectors.includes('window-tall')&&R.state.demolishMode;
    }));
    const keepId=await page.evaluate(() => __ROADLORDS_RUNTIME__.P.buildings.find(b=>b.type==='keep').id);
    await page.locator(`#playerGrid .buildingHitCell[data-id="${keepId}"]`).first().click();
    check('The demolition tool protects the capital',await page.evaluate(id => !!__ROADLORDS_RUNTIME__.getBuilding(__ROADLORDS_RUNTIME__.P,id),keepId));
    await page.keyboard.press('Escape');
    check('Escape puts the hammer down',await hammer.getAttribute('aria-pressed')==='false');
    await hammer.click();await page.mouse.click(200,200,{button:'right'});
    check('Right click also puts the hammer down',await hammer.getAttribute('aria-pressed')==='false');
    await hammer.click();await page.keyboard.press('1');
    check('Choosing construction exits demolition mode',await hammer.getAttribute('aria-pressed')==='false' && await page.evaluate(() => !!__ROADLORDS_RUNTIME__.state.selectedBuild));
    await page.keyboard.press('Escape');
    const opacity=await page.evaluate(async () => {
      const R=__ROADLORDS_RUNTIME__; R.roadResetCity(R.P,'undead'); R.state.units=[];
      await R.loadSkeletonArt();
      const temp=R.releaseUnit(R.P,R.makeEntry(R.P,'und_skeleton')),permanent=R.releaseUnit(R.P,R.makeEntry(R.P,'und_skeleton'));
      temp.temporary=5;permanent.temporary=0;permanent.undSummoned=true;
      for(const u of [temp,permanent]) {u.lane=150;u.offset=0;}
      R.ROAD.camera=0;R.ROAD.lowDetail=false;
      const original=R.ctx.drawImage,alphas=[];
      R.ctx.drawImage=function(...args){alphas.push(this.globalAlpha);return original.apply(this,args);};
      R.roadDrawUnit(temp);R.roadDrawUnit(permanent);R.ctx.drawImage=original;
      return {alphas,restored:R.ctx.globalAlpha};
    });
    check('Temporary skeletons draw at 55% opacity; permanent summons remain opaque; canvas opacity is restored',
      opacity.alphas.length===2 && Math.abs(opacity.alphas[0]-.55)<.001 && opacity.alphas[1]===1 && opacity.restored===1);
    const network=await page.evaluate(() => {
      const R=__ROADLORDS_RUNTIME__,old={enabled:R.MP.enabled,role:R.MP.role,peer:R.MP.peer,conn:R.MP.conn};let packet;
      Object.assign(R.MP,{enabled:true,role:'host',peer:true,conn:{open:true,dataChannel:{bufferedAmount:0},send:data=>{if(data.type==='snapshot')packet=data;}}});
      R.mpSendSnapshot(true); R.mpApplyUnitTargets(packet.units);
      const visual=R.state.units.map(u=>!!u.temporaryVisual);
      packet.units[0][9]&=~2048;R.mpApplyUnitTargets(packet.units);
      const cleared=!R.state.units[0].temporaryVisual; Object.assign(R.MP,old);
      return {visual,cleared};
    });
    check('Multiplayer preserves temporary appearance and clears it when the flag ends',network.visual[0] && !network.visual[1] && network.cleared);
    check('No runtime errors during movement, demolition or unit rendering',report.errors.length===0);
  } finally {
    fs.mkdirSync('artifacts',{recursive:true});fs.writeFileSync('artifacts/window-controls.json',JSON.stringify(report,null,2));await browser.close();
  }
})().catch(error => {console.error(error);process.exitCode=1;});
