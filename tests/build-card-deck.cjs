const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
const URL=process.env.ROADLORDS_TEST_URL||'http://127.0.0.1:4173/Roadlords/';
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox','--disable-dev-shm-usage']});
 const report={checks:[],errors:[]},check=(name,ok)=>{assert(ok,name);report.checks.push(name);console.log('PASS',name)};
 try{
  const p=await browser.newPage({viewport:{width:1600,height:1000}});await p.route('https://**/*',r=>r.abort());p.on('pageerror',e=>report.errors.push(e.message));
  await p.goto(URL);await p.waitForFunction(()=>!!window.__ROADLORDS_RUNTIME__?.revealBuildCard);
  await p.evaluate(()=>{const R=__ROADLORDS_RUNTIME__;R.MP.lobby.style.display='none';document.body.classList.remove('roadlords-menu-open','road-test','pregame-active');R.state.running=false;R.state.modal=false;R.roadResetCity(R.P,'orc');R.P.unlocked=new Set(['orc_troll','orc_shaman','orc_ram','orc_tunnel','orc_overseer','orc_war','orc_bers','orc_gob','orc_warg']);R.renderStatic();R.$('#choiceOverlay').classList.add('hidden')});
  await p.evaluate(()=>document.fonts.ready);await p.waitForTimeout(100);
  check('Complete construction thumbnails fit inside the dock with a visible construction price',await p.evaluate(()=>{const c=document.querySelector('#buildList .buildcard'),r=c.getBoundingClientRect(),price=c.querySelector('.constructionPrice').getBoundingClientRect();const deck=document.querySelector('#buildList').getBoundingClientRect();return r.width<150&&Math.abs(r.width/r.height-2/3)<.01&&r.top>=deck.top&&r.bottom<=deck.bottom&&price.bottom<innerHeight&&c.querySelector('.cardinfo .productionFacts')&&c.querySelector('.cardart .pickFootprint .on')}));
  const before=await p.evaluate(()=>{const R=__ROADLORDS_RUNTIME__;return [R.roadWar.scrollLeft,R.roadWar.getBoundingClientRect().height,document.querySelector('#roadMinimap').getBoundingClientRect().height]});
  const owner=await p.locator('#buildList .buildcard').first().boundingBox();await p.mouse.move(owner.x+90,owner.y+35);await p.waitForTimeout(180);
  check('Mouse hover raises a complete readable card without shifting the battlefield or minimap',await p.evaluate(before=>{const R=__ROADLORDS_RUNTIME__,c=document.querySelector('.buildCardPreview'),r=c?.getBoundingClientRect(),b=c?.querySelector('.cardinfo');return r&&r.bottom<=innerHeight&&r.top>R.$('.topbar').getBoundingClientRect().bottom&&getComputedStyle(c).position==='fixed'&&b.scrollHeight<=b.clientHeight+1&&JSON.stringify(before)===JSON.stringify([R.roadWar.scrollLeft,R.roadWar.getBoundingClientRect().height,document.querySelector('#roadMinimap').getBoundingClientRect().height])},before));
  await p.screenshot({path:'artifacts/build-card-hover.png'});
  await p.mouse.move(20,150);await p.waitForTimeout(160);check('Leaving the card folds the preview away',await p.locator('.buildCardPreview').count()===0);
  await p.setViewportSize({width:800,height:900});await p.waitForTimeout(80);
  await p.keyboard.press('9');await p.waitForTimeout(120);
  check('A number shortcut selects and reveals its thumbnail without opening a preview',await p.evaluate(()=>{const R=__ROADLORDS_RUNTIME__;return R.state.selectedBuild==='orc_warg'&&!document.querySelector('.buildCardPreview')&&document.querySelector('#buildList').scrollLeft>0}));
  await p.keyboard.press('Escape');check('Escape dismisses the keyboard preview',await p.locator('.buildCardPreview').count()===0);
  await p.setViewportSize({width:1600,height:1000});await p.waitForTimeout(80);
  await p.keyboard.press('1');await p.waitForTimeout(120);
  check('Selecting a building closes the preview and keeps placement unobstructed',await p.evaluate(()=>__ROADLORDS_RUNTIME__.state.selectedBuild==='orc_troll'&&!document.querySelector('.buildCardPreview')));
  const other=await p.locator('#buildList .buildcard').nth(1).boundingBox();await p.mouse.move(other.x+20,other.y+20);await p.waitForTimeout(120);
  check('Hovering other cards during placement never raises a preview',await p.locator('.buildCardPreview').count()===0);
  await p.keyboard.press('Escape');await p.mouse.move(20,150);const first=await p.locator('#buildList .buildcard').first().boundingBox();await p.mouse.move(first.x+20,first.y+20);await p.waitForTimeout(180);await p.locator('.buildCardPreview .previewHitbox').click();
  check('Clicking the raised card selects the building and immediately folds the preview away',await p.evaluate(()=>__ROADLORDS_RUNTIME__.state.selectedBuild==='orc_troll'&&!document.querySelector('.buildCardPreview')));
  await p.mouse.move(20,150);await p.keyboard.press('Escape');
  for(const[width,height]of[[800,900],[1366,768],[1920,1080]])for(const mode of['75','100','150']){
   await p.setViewportSize({width,height});await p.evaluate(mode=>{__ROADLORDS_UI_SCALE__.set(mode);const R=__ROADLORDS_RUNTIME__;R.renderBuildList();document.querySelector('#buildList').scrollLeft=0},mode);await p.waitForTimeout(80);
   check(`Complete thumbnails and raised cards fit ${width}×${height} at ${mode}%`,await p.evaluate(()=>{const R=__ROADLORDS_RUNTIME__,list=R.$('#buildList'),c=list.querySelector('.buildcard'),price=c.querySelector('.constructionPrice').getBoundingClientRect(),bounds=list.getBoundingClientRect();R.revealBuildCard(c.dataset.k,{keyboard:true});const r=document.querySelector('.buildCardPreview').getBoundingClientRect();return price.left>=bounds.left&&price.right<=bounds.right+1&&price.top>=bounds.top&&price.bottom<=bounds.bottom+1&&c.getBoundingClientRect().bottom<=bounds.bottom+1&&r.left>=0&&r.right<=innerWidth&&r.top>=R.$('.topbar').getBoundingClientRect().bottom&&r.bottom<=innerHeight}));
   await p.keyboard.press('Escape');
  }
  await p.setViewportSize({width:1600,height:1000});await p.evaluate(()=>{__ROADLORDS_UI_SCALE__.set('100');const R=__ROADLORDS_RUNTIME__;R.roadResetCity(R.P,'undead');R.P.unlocked.add('und_necro_spawner');R.renderStatic()});await p.waitForTimeout(100);
  check('Undead construction prices use only the Soul icon, including the raised preview',await p.evaluate(()=>{const R=__ROADLORDS_RUNTIME__;R.revealBuildCard('und_necro_spawner',{keyboard:true});const c=document.querySelector('.buildCardPreview');return c.querySelectorAll('.constructionPrice .costRow').length===1&&c.querySelector('.constructionPrice img').alt==='Lélek'&&c.querySelector('.cardinfo').textContent.includes('Lélek')}));
  check('Both local fantasy fonts load with Hungarian accents',await p.evaluate(async()=>{await document.fonts.ready;return document.fonts.check('18px "Roadlords Display"','őŐűŰ')&&document.fonts.check('18px "Roadlords Copy"','őŐűŰ')}));
  await p.evaluate(()=>{const R=__ROADLORDS_RUNTIME__,long=[...R.LEGENDARY].sort((a,b)=>b.description.length-a.description.length)[0].description;R.renderChoice([{id:'fit-short',kind:'legendary',name:'Rövid lap',description:'Egységeid +5% sebzést kapnak.'},{id:'fit-long',kind:'legendary',name:'Hosszabb lap',description:long}],'PRÓBA','Betűméret','',true);R.$('#choiceOverlay').classList.remove('hidden')});await p.waitForTimeout(100);
  check('Long card copy shrinks automatically while short copy keeps the larger font',await p.evaluate(()=>{const bodies=[...document.querySelectorAll('#choiceList .choiceBody')];return parseFloat(getComputedStyle(bodies[0]).fontSize)>parseFloat(getComputedStyle(bodies[1]).fontSize)&&bodies.every(b=>b.scrollHeight<=b.clientHeight+1&&b.scrollWidth<=b.clientWidth+1)}));
  check('No runtime errors during hovering, scrolling, keyboard selection or resizing',report.errors.length===0);
 }finally{fs.mkdirSync('artifacts',{recursive:true});fs.writeFileSync('artifacts/build-card-deck.json',JSON.stringify(report,null,2));await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
