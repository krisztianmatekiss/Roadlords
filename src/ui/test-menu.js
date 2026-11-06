// Full matches use the live game; retired figure demos have no menu entries.
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
  const spectator=document.createElement('div');spectator.className='spectatorSetup';
  const races='<option value="human">Emberek</option><option value="orc">Orkok</option><option value="undead">Élőhalottak</option>';
  spectator.innerHTML=`<h3>AI vs AI · Teljes meccs</h3><div class="spectatorRaces"><label>Bal oldali AI<select id="spectatorLeftRace">${races}</select></label><span aria-hidden="true">VS</span><label>Jobb oldali AI<select id="spectatorRightRace">${races}</select></label></div><button id="roadAiVsAiMenu" type="button" class="menuButton">MECCS INDÍTÁSA · NÉZŐKÉNT</button><p>Két önálló AI, normál kezdővárosokkal, gazdasággal és fejlesztésválasztással.</p>`;
  spectator.querySelector('#spectatorRightRace').value='orc';
  spectator.querySelector('button').onclick=async()=>{
    const button=spectator.querySelector('button'),selectors=[...spectator.querySelectorAll('select')];
    if(button.disabled)return;
    const label=button.textContent,config={left:selectors[0].value,right:selectors[1].value};
    button.disabled=true;button.setAttribute('aria-busy','true');button.textContent='EGYSÉGKÉPEK BETÖLTÉSE…';selectors.forEach(s=>s.disabled=true);
    try{if(await R.startSpectator(config))close(false);}
    finally{button.disabled=false;button.removeAttribute('aria-busy');button.textContent=label;selectors.forEach(s=>s.disabled=false);}
  };
  list.append(spectator);
  main.appendChild(opener);lobby.appendChild(panel);
}
