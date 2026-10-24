// Battle experiments live behind one main-menu entry.
export function installTestMenu(R) {
  const lobby=R.MP.lobby,main=lobby.querySelector('.menuMain'),card=lobby.querySelector('.mpLobbyCard');
  const opener=document.createElement('button');
  opener.id='roadTestsMenu';opener.type='button';opener.className='menuButton';opener.textContent='TESZTEK';
  opener.setAttribute('aria-haspopup','dialog');opener.setAttribute('aria-controls','roadTestsPanel');opener.setAttribute('aria-expanded','false');
  const panel=document.createElement('section');
  panel.id='roadTestsPanel';panel.className='roadTestsPanel';panel.hidden=true;
  panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','true');panel.setAttribute('aria-labelledby','roadTestsTitle');
  panel.innerHTML='<div class="rlMenuPanelCard rlSettingsCard"><header class="rlPanelHead"><h2 id="roadTestsTitle">TESZTEK</h2><button id="roadTestsBack" class="rlPanelBack" type="button">VISSZA</button></header><div class="rlPanelBody roadTestsList"></div></div>';
  const list=panel.querySelector('.roadTestsList'),back=panel.querySelector('#roadTestsBack');
  function close(restore=true){panel.hidden=true;panel.classList.remove('show');card.inert=false;opener.setAttribute('aria-expanded','false');if(restore)opener.focus();}
  opener.onclick=()=>{panel.hidden=false;panel.classList.add('show');card.inert=true;opener.setAttribute('aria-expanded','true');list.querySelector('button').focus();};
  back.onclick=()=>close();
  panel.addEventListener('keydown',e=>{
    if(e.key==='Escape'){e.preventDefault();e.stopPropagation();close();}
    if(e.key==='Tab'){
      const buttons=[...panel.querySelectorAll('button')],first=buttons[0],last=buttons.at(-1);
      if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}
      else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}
    }
  });
  for(const [id,label,description,options] of [
    ['roadKnightMenu','LOVAG vs ORK HARCOS · 10 vs 10','Új lovasgrafika, mozgó ló és lovas, időzített lándzsaszúrással.',{count:10,roster:'knight'}],
    ['roadOrcSkeletonMenu','ORK HARCOS vs CSONTVÁZ · 50 vs 50','Két új, festett egységmodell. Alapegységek, fejlesztések és utánpótlás nélkül.',{count:50,roster:'orc-skeleton'}],
  ]){
    const item=document.createElement('div'),button=document.createElement('button'),note=document.createElement('p');
    button.id=id;button.type='button';button.className='menuButton';button.textContent=label;
    button.onclick=async()=>{
      button.disabled=true;
      const results=await Promise.all([R.loadOrcWarriorArt(),options.roster==='knight'?R.loadKnightArt():R.loadSkeletonArt()]);
      button.disabled=false;
      if(!results.every(Boolean)){R.toast('Az egységek képe nem töltődött be. Frissítsd az oldalt.');return;}
      close(false);R.roadStartTest(undefined,options);
    };
    note.textContent=description;item.append(button,note);list.appendChild(item);
  }
  main.appendChild(opener);lobby.appendChild(panel);
}
