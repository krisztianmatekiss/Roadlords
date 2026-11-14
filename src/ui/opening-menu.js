import art from '../data/chronicle-shell-art.json';
import { assetUrl } from '../assets/urls.js';

// Load the opening scene and actual UI fonts, not a timer pretending to load a match.
// Unit atlases still load only after the two factions have been selected.
export function installOpeningMenu(R) {
  const lobby=R.MP.lobby,grid=lobby.querySelector('.mpLobbyGrid'),hint=lobby.querySelector('.menuStartHint');
  const hintHome=document.createComment('Opening hint return point');hint.before(hintHome);
  const boot=document.createElement('section');boot.className='menuBoot';
  boot.innerHTML='<div class="menuBootStatus" role="status" aria-live="polite">A játékfelület betöltése…</div><div class="menuBootTrack" role="progressbar" aria-label="Játékfelület betöltése" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><i></i></div><button class="menuBootRetry" type="button" hidden>Újrapróbálás</button>';
  lobby.append(boot);
  const opening=R.menuOpening={ready:false,progress:0,errors:[]};
  const track=boot.querySelector('.menuBootTrack'),status=boot.querySelector('.menuBootStatus'),retry=boot.querySelector('button');
  let pending;
  const mode=()=>{
    const modern=R.battleLayout.active;lobby.classList.toggle('openingMenu',modern);
    if(modern){lobby.append(hint);lobby.classList.remove('intro-pending','intro-revealing');lobby.classList.add('intro-ready');grid.inert=!opening.ready;}
    else{hintHome.after(hint);grid.inert=false;}
  };
  const loadImage=()=>new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>image.decode().then(resolve,reject);image.onerror=()=>reject(Error('Háttérkép'));image.src=assetUrl(art.menu.webFile);});
  opening.start=()=>{
    if(pending)return pending;
    opening.ready=false;opening.progress=0;opening.errors=[];retry.hidden=true;
    lobby.classList.add('menu-loading');lobby.classList.remove('menu-ready','menu-load-error');lobby.setAttribute('aria-busy','true');mode();
    track.setAttribute('aria-valuenow','0');track.style.setProperty('--load-progress','0%');status.textContent='A játékfelület betöltése…';
    const jobs=[loadImage,()=>document.fonts.load('700 32px "Roadlords Title"'),()=>document.fonts.load('400 20px "Roadlords Display"')];
    pending=Promise.all(jobs.map(async job=>{try{await job();opening.progress+=1/jobs.length;const percent=Math.round(opening.progress*100);track.setAttribute('aria-valuenow',String(percent));track.style.setProperty('--load-progress',percent+'%');}catch(error){opening.errors.push(error.message);}})).then(()=>{
      lobby.setAttribute('aria-busy','false');
      if(opening.errors.length){lobby.classList.add('menu-load-error');status.textContent='A felület nem töltődött be. Próbáld újra.';retry.hidden=false;return false;}
      opening.ready=true;opening.progress=1;lobby.classList.remove('menu-loading');lobby.classList.add('menu-ready');grid.inert=false;
      status.textContent='Készen áll';hint.textContent='Kattints a menüpontra a folytatáshoz';return true;
    }).finally(()=>{pending=null;});return pending;
  };
  retry.onclick=()=>opening.start();
  const setMode=R.battleLayout.setMode;R.battleLayout.setMode=(...args)=>{const out=setMode(...args);mode();return out;};
  mode();opening.start();
}
