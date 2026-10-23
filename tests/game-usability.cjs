const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
const URL=process.env.ROADLORDS_TEST_URL||'http://127.0.0.1:4173/Roadlords/';
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox','--disable-dev-shm-usage']});
 const report={checks:[],errors:[]},check=(name,ok)=>{assert(ok,name);report.checks.push(name);console.log('PASS',name)};
 try{
  const p=await browser.newPage({viewport:{width:1600,height:1000}});p.on('pageerror',e=>report.errors.push(e.message));await p.route('https://**/*',r=>r.abort());
  let release,seen;const blocked=new Promise(resolve=>release=resolve),requested=new Promise(resolve=>seen=resolve);
  await p.route('**/assets/index-*.js',async route=>{seen();await blocked;await route.continue()});
  await p.goto(URL,{waitUntil:'commit'});await requested;
  check('Cold start keeps the static game hidden while JavaScript is still loading',await p.evaluate(()=>document.documentElement.classList.contains('booting')&&getComputedStyle(document.body).visibility==='hidden'&&getComputedStyle(document.body).opacity==='0'&&getComputedStyle(document.querySelector('#app')).visibility==='hidden'));
  release();await p.waitForFunction(()=>window.__ROADLORDS_RUNTIME__&&!document.documentElement.classList.contains('booting'));
  check('The initialized main menu keeps the board hidden until a game actually starts',await p.evaluate(()=>getComputedStyle(document.body).visibility==='visible'&&getComputedStyle(document.querySelector('#app')).visibility==='hidden'&&getComputedStyle(document.querySelector('#app')).opacity==='0'&&getComputedStyle(__ROADLORDS_RUNTIME__.MP.lobby).display!=='none'));
  await p.locator('.menuBrand').click();await p.waitForTimeout(900);await p.locator('#rlOpenCodex').click();await p.locator('#codexRace').selectOption('orc');await p.locator('#rlCodexPanel [data-tab="common"]').click();
  check('The missing Orc food-production card now has local themed artwork and a meat symbol',await p.evaluate(async()=>{const cards=[...document.querySelectorAll('#rlCodexPanel .rlCodexCard')],c=cards.find(c=>c.textContent.includes('élelem alaptermelése'));const image=c?.querySelector('.cardFrameImage'),food=c?.querySelector('.resourceToken[data-resource="food"]');if(!image||!food)return false;image.loading='eager';await image.decode();return image.naturalWidth===768&&food.title==='Hús'&&food.querySelector('img').src.endsWith('/art/resources/meat.svg')}));
  await p.locator('#rlCodexPanel [data-tab="buildings"]').click();
  check('Capital details have separate economy and defense sections with real level values and resource symbols',await p.evaluate(()=>{const c=document.querySelector('[data-codex-building="keep"]');return c.querySelectorAll('.capitalGroup').length===2&&c.querySelectorAll('.capitalFact').length===5&&c.querySelector('.capitalFacts').textContent.includes('20000')&&c.querySelectorAll('.capitalFacts img[data-resource]').length===6}));
  await p.locator('#codexRace').selectOption('undead');const necro=p.locator('[data-codex-building="und_necro_spawner"]');await necro.scrollIntoViewIfNeeded();await necro.locator('.cardFrameImage').evaluate(i=>i.decode());
  check('Necromancer upkeep is a distinct row with a large loss value and a Soul symbol',await necro.evaluate(c=>{const row=c.querySelector('.upkeepFact'),body=c.querySelector('.rlCodexContent');return row.textContent.includes('Fenntartás')&&row.querySelector('img').alt==='Lélek'&&parseFloat(getComputedStyle(row).fontSize)>=parseFloat(getComputedStyle(body).fontSize)&&row.querySelector('.effect-negative')&&c.querySelector('.cardFace').dataset.frame==='military'}));
  await p.screenshot({path:'artifacts/necromancer-readable-upkeep.png'});await p.keyboard.press('Escape');
  await p.evaluate(()=>{const R=__ROADLORDS_RUNTIME__;R.MP.lobby.style.display='none';document.body.classList.remove('roadlords-menu-open');R.state.running=false;R.state.modal=false});
  for(const[race,label]of[['orc','Hús'],['human','Élelem'],['undead','Lélek']]){
   const data=await p.evaluate(race=>{const R=__ROADLORDS_RUNTIME__;R.roadResetCity(R.P,race);R.renderStatic();R.updateHud();const unit=race==='orc'?'orc_troll':race==='undead'?'und_necro_spawner':'barracks';R.renderChoice([R.makeBuildingChoice(R.P,unit)],'PRÓBA','Ikonok','',false);R.$('#choiceOverlay').classList.remove('hidden');const c=R.$('#choiceList .choice'),icons=[...c.querySelectorAll('.resourceToken')].map(e=>({key:e.dataset.resource,label:e.title}));return {icons,food:R.$('#foodStock').closest('.res').querySelector('.resourceIcon').alt,slots:c.querySelectorAll('.choiceArt .pickFootprint .on').length}},race);
   check(`${race} uses faction-correct resource icons without losing training values or footprints`,data.slots>0&&data.icons.some(x=>x.label===label)&&(race==='undead'||data.food===label));
  }
  check('No initialization, symbol-rendering or menu runtime errors',report.errors.length===0);
 }finally{fs.mkdirSync('artifacts',{recursive:true});fs.writeFileSync('artifacts/game-usability.json',JSON.stringify(report,null,2));await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
