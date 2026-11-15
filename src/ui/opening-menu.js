import art from '../data/chronicle-shell-art.json';
import { assetUrl } from '../assets/urls.js';

export function installOpeningMenu(R) {
  const lobby=R.MP.lobby,grid=lobby.querySelector('.mpLobbyGrid'),hint=lobby.querySelector('.menuStartHint');
  const hintHome=document.createComment('Opening hint return point'),oldHint=hint.textContent;hint.before(hintHome);
  const boot=document.createElement('section');boot.className='menuBoot';
  boot.innerHTML='<div class="menuBootStatus" role="status" aria-live="polite">Előkészítés…</div><div class="menuBootTrack" role="progressbar" aria-label="Játék és kártyaképek betöltése" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><i></i></div><button class="menuBootRetry" type="button" hidden>Újrapróbálás</button>';
  lobby.append(boot);
  const opening=R.menuOpening={ready:false,entered:false,progress:0,errors:[]};
  const track=boot.querySelector('.menuBootTrack'),status=boot.querySelector('.menuBootStatus'),retry=boot.querySelector('button');
  let returning=false;try{returning=sessionStorage.getItem('roadlords:return-to-menu')==='1';sessionStorage.removeItem('roadlords:return-to-menu');}catch{}
  let pending,started=false;
  const loadImage=()=>new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>image.decode().then(resolve,reject);image.onerror=()=>reject(Error('Háttérkép'));image.src=assetUrl(art.menu.webFile);});
  opening.enter=()=>{
    if(!opening.ready||opening.entered)return false;
    opening.entered=true;lobby.classList.remove('menu-loading','menu-loaded','menu-load-error');lobby.classList.add('menu-ready');grid.inert=false;return true;
  };
  opening.start=()=>{
    if(pending)return pending;started=true;
    opening.ready=false;opening.entered=returning;opening.progress=0;opening.errors=[];retry.hidden=true;grid.inert=!returning;
    lobby.classList.remove('menu-loading','menu-ready','menu-loaded','menu-load-error');lobby.classList.add(returning?'menu-ready':'menu-loading');boot.hidden=returning;lobby.setAttribute('aria-busy','true');
    track.setAttribute('aria-valuenow','0');track.style.setProperty('--load-progress','0%');status.textContent='Kártyakészlet előkészítése…';hint.textContent='';
    pending=(async()=>{
      try{
        await R.cardArt.prepare();let core=0;
        const total=R.cardArt.total+3,progress=()=>{const done=core+R.cardArt.loaded,percent=Math.round(done/total*100);opening.progress=done/total;track.setAttribute('aria-valuenow',String(percent));track.style.setProperty('--load-progress',percent+'%');status.textContent=`Betöltés · ${done} / ${total}`;};
        progress();
        const jobs=[loadImage,()=>document.fonts.load('700 32px "Roadlords Title"'),()=>document.fonts.load('400 20px "Roadlords Display"')];
        await Promise.all([...jobs.map(async job=>{try{await job();core++;progress();}catch(error){opening.errors.push(error.message);}}),R.cardArt.preload(progress).catch(error=>opening.errors.push(error.message))]);
      }catch(error){opening.errors.push(error.message);}
      lobby.setAttribute('aria-busy','false');
      if(opening.errors.length&&returning){opening.ready=true;R.toast('Néhány kártyakép nem töltődött be.');return false;}
      if(opening.errors.length){lobby.classList.add('menu-load-error');status.textContent='A betöltés nem sikerült. Próbáld újra.';retry.hidden=false;return false;}
      opening.ready=true;opening.progress=1;lobby.classList.remove('menu-loading');lobby.classList.add(returning?'menu-ready':'menu-loaded');
      status.textContent='Betöltés kész';hint.textContent='Kattints a folytatáshoz';return true;
    })().finally(()=>{pending=null;});return pending;
  };
  retry.onclick=()=>opening.start();
  lobby.addEventListener('click',event=>{
    if(!R.battleLayout.active||opening.entered||event.target.closest('.menuBootRetry'))return;
    event.preventDefault();event.stopImmediatePropagation();opening.enter();
  },true);
  lobby.addEventListener('keydown',event=>{
    if(!R.battleLayout.active||opening.entered||!['Enter',' '].includes(event.key)||event.target.closest('.menuBootRetry'))return;
    event.preventDefault();event.stopImmediatePropagation();opening.enter();
  },true);
  const mode=()=>{
    const modern=R.battleLayout.active;lobby.classList.toggle('openingMenu',modern);
    if(modern){lobby.append(hint);lobby.classList.remove('intro-pending','intro-revealing');lobby.classList.add('intro-ready');grid.inert=!opening.entered;if(!started)opening.start();}
    else{hintHome.after(hint);hint.textContent=oldHint;grid.inert=false;}
  };
  const setMode=R.battleLayout.setMode;R.battleLayout.setMode=(...args)=>{const out=setMode(...args);mode();return out;};
  mode();
}
