const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox','--disable-dev-shm-usage']});
 const report={checks:[],errors:[]},check=(name,value)=>{assert(value,name);report.checks.push(name);console.log('PASS',name);};
 try {
  const manifest=JSON.parse(fs.readFileSync('src/data/upgrade-art-manifest.json'));
  const sources=Object.entries(manifest.sources).filter(([id])=>id.startsWith('human-cards-'));
  check('Six local Human upgrade atlases retain their exact generated originals',sources.length===6&&sources.every(([,s])=>crypto.createHash('sha256').update(fs.readFileSync('public/'+s.file)).digest('hex')===s.sha256));
  const web=JSON.parse(fs.readFileSync('src/data/web-card-images.json')),sharp=require('sharp');
  const quality=[];
  for(const [,s]of sources){const delivery=web[s.file];const [a,b]=await Promise.all([sharp('public/'+s.file).removeAlpha().raw().toBuffer(),sharp('public/'+delivery.file).removeAlpha().raw().toBuffer()]);let error=0;for(let i=0;i<a.length;i++)error+=(a[i]-b[i])**2;const psnr=20*Math.log10(255/Math.sqrt(error/a.length));quality.push({file:s.file,psnr,bytes:delivery.webBytes,original:delivery.originalBytes});}
  report.delivery=quality;
  check('Human upgrade delivery preserves dimensions and high image fidelity while saving at least half the original payload',quality.every(q=>q.psnr>=32&&q.bytes<q.original*.5));
  const p=await browser.newPage({viewport:{width:1920,height:1080}});await p.route('https://**/*',r=>r.abort());p.on('pageerror',e=>report.errors.push(e.message));
  await p.goto(process.env.ROADLORDS_TEST_URL||'http://127.0.0.1:4173/Roadlords/');await p.waitForFunction(()=>window.__ROADLORDS_RUNTIME__);
  const inventory=await p.evaluate(()=>{const R=__ROADLORDS_RUNTIME__;return {building:Object.entries(R.BUILDINGS).filter(([id,d])=>R.factionMatches('human',d,id)).map(([id])=>id),normal:R.NORMAL.filter(d=>!d.race||d.race==='human').map(d=>d.id),legendary:R.LEGENDARY.filter(d=>!d.race||d.race==='human').map(d=>d.id)};});
  const all=Object.entries(inventory).filter(([kind])=>kind!=='building').flatMap(([kind,ids])=>ids.map(id=>manifest.scenes[`human-${kind}:${id}`]));
  check('All 28 common and 56 legendary cards have 84 distinct in-bounds illustrations',inventory.building.length===23&&inventory.normal.length===28&&inventory.legendary.length===56&&all.every(s=>s&&s.source.startsWith('human-cards-')&&s.rect[0]>=0&&s.rect[1]>=0&&s.rect[0]+s.rect[2]<=manifest.sources[s.source].width&&s.rect[1]+s.rect[3]<=manifest.sources[s.source].height)&&new Set(all.map(s=>s.source+':'+s.rect.join(','))).size===84);
  await p.locator('.menuBrand').click();await p.waitForTimeout(900);await p.locator('#rlOpenCodex').click();await p.locator('#codexRace').selectOption('human');
  const gallery=[];const samples={buildings:['keep','barracks','magetower','tavern'],common:['swordsman_dmg','spear_range','mage_aoe','knight_move'],legendary:['phalanx','mage_triple','glass_cannon','knight_dismount']};
  for(const [tab,count,kind]of [['buildings',23,'building'],['common',28,'normal'],['legendary',56,'legendary']]) {
   await p.locator(`#rlCodexPanel [data-tab="${tab}"]`).click();await p.waitForTimeout(100);
   const result=await p.evaluate(async({kind,samples})=>{
    const cards=[...document.querySelectorAll('#rlCodexPanel [data-codex-building],#rlCodexPanel [data-codex-upgrade],#rlCodexPanel [data-codex-unit]')];
    const images=new Set();const rows=cards.map(c=>{const id=c.dataset.codexBuilding||c.dataset.codexUpgrade||c.dataset.codexUnit,face=c.querySelector('.cardFace'),scene=c.querySelector('.cardScene'),frame=c.querySelector('.cardFrameImage'),body=c.querySelector('.rlCodexContent');images.add(scene?.querySelector('image')?.getAttribute('href'));return {id,scene:scene?.dataset.upgradeArt,frame:frame?.getAttribute('src'),type:face.dataset.frame,stroke:getComputedStyle(c.querySelector('.humanFrameAccent path')).stroke,fit:body.scrollHeight<=body.clientHeight+2&&body.scrollWidth<=body.clientWidth+2};});
    await Promise.all([...images].map(async src=>{if(!src)throw Error('Missing atlas source');const img=new Image();img.src=src;await img.decode();if(!img.naturalWidth||kind!=='building'&&(img.naturalWidth!==1536||img.naturalHeight!==1024))throw Error('Unexpected atlas dimensions');}));
    return {rows,html:cards.filter(c=>samples.includes(c.dataset.codexBuilding||c.dataset.codexUpgrade)).map(c=>c.querySelector('.cardFace').outerHTML)};
   },{kind,samples:samples[tab]||[]});
   if(tab!=='buildings')gallery.push(...result.html);
   check(`${count} Human ${tab} cards decode their matching illustrations and retain readable live text`,result.rows.length===count&&result.rows.every(c=>c.scene===`human-${kind}:${c.id}`&&c.frame.endsWith('/cards/human/frame.png')&&c.fit));
   if(tab==='common')report.commonStroke=result.rows[0].stroke;if(tab==='legendary')report.legendaryStroke=result.rows[0].stroke;
  }
  check('Existing Human building illustrations stay on their original two atlases',inventory.building.every(id=>['human-buildings','human-support-buildings'].includes(manifest.scenes['human-building:'+id].source)));
  check('Common and legendary Human cards have distinct steel and gold frame inlays',report.commonStroke!==report.legendaryStroke);
  await p.evaluate(html=>{const grid=document.createElement('div');grid.id='humanArtGallery';grid.style.cssText='position:absolute;left:0;top:0;z-index:100000;width:1440px;padding:20px;box-sizing:border-box;background:#122019;display:grid;grid-template-columns:repeat(4,1fr);gap:16px';grid.innerHTML=html.join('');document.body.append(grid);window.dispatchEvent(new Event('roadlords:ui-scale'));},gallery);
  await p.waitForTimeout(100);
  check('Exported card previews refit their titles and descriptions at the gallery size',await p.evaluate(()=>[...document.querySelectorAll('#humanArtGallery .cardFace')].every(c=>['.rlCodexTitle','.rlCodexContent'].every(selector=>{const box=c.querySelector(selector);return box.scrollHeight<=box.clientHeight+2&&box.scrollWidth<=box.clientWidth+2;}))));
  await p.locator('#humanArtGallery').screenshot({path:'artifacts/human-card-art-4.58.4.png'});await p.evaluate(()=>document.querySelector('#humanArtGallery').remove());await p.keyboard.press('Escape');
  const picks=await p.evaluate(async()=>{
   const R=__ROADLORDS_RUNTIME__;R.state.running=false;R.MP.lobby.style.display='none';R.roadResetCity(R.P,'human');document.body.classList.remove('roadlords-menu-open');
   const definitions=[['normal','swordsman_dmg'],['normal','mage_aoe'],['legendary','phalanx'],['legendary','mage_triple']].map(([kind,id])=>({...R[kind==='normal'?'NORMAL':'LEGENDARY'].find(d=>d.id===id),kind}));
   R.renderChoice(definitions,'EMBERI FEJLESZTÉSEK','Új kártyaképek','',false);R.$('#choiceOverlay').classList.remove('hidden');await document.fonts.ready;await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
   return [...document.querySelectorAll('#choiceList .choice')].map((c,i)=>({id:definitions[i].id,scene:c.querySelector('.cardScene')?.dataset.upgradeArt,frame:c.querySelector('.cardFrameImage')?.getAttribute('src'),type:c.dataset.frame,fit:c.querySelector('.choiceBody').scrollHeight<=c.querySelector('.choiceBody').clientHeight+2}));
  });
  check('Actual picks reuse the same Human common and legendary art with fitting copy',picks.length===4&&picks.every((c,i)=>c.scene===`human-${i<2?'normal':'legendary'}:${c.id}`&&c.frame.endsWith('/cards/human/frame.png')&&c.type===(i<2?'common':'legendary')&&c.fit));
  await p.screenshot({path:'artifacts/human-upgrade-picks-4.58.4.png'});
  check('Owned Human upgrades retain the same illustrations and owned-effect comparisons',await p.evaluate(()=>{const R=__ROADLORDS_RUNTIME__;R.P.normal.all_damage=2;R.P.legends.add('mage_triple');R.renderRelics();return ['all_damage','mage_triple'].every(id=>{const card=R.$(`#relicList [data-relic="${id}"]`);return card?.querySelector('.cardScene')?.dataset.upgradeArt===`human-${id==='all_damage'?'normal':'legendary'}:${id}`&&card.querySelector('.humanFrameAccent');});}));
  check('No Human card-art runtime errors',!report.errors.length);
 } finally {fs.mkdirSync('artifacts',{recursive:true});fs.writeFileSync('artifacts/human-card-art.json',JSON.stringify(report,null,2));await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
