import { createBattleLine } from './battle-line.js';

// A reversible layout experiment around the real solo game, never a second sim.
export function installUiTrial(R) {
  const state=R.uiTrial={active:false,scale:'1.5',collapsed:false,launching:false};
  const app=R.$('#app'),catalog=R.$('.catalog'),tabs=R.$('.commandRail .tabs'),deck=R.$('#relicBtn'),gate=R.$('#gateControls');
  const drawer=document.createElement('aside');drawer.id='uiTrialDrawer';drawer.hidden=true;
  drawer.innerHTML='<button id="uiTrialFold" type="button" aria-expanded="true" aria-controls="uiTrialCards">ÉPÍTÉS ‹</button><div class="uiTrialCategories"></div><div id="uiTrialCards"></div><footer class="uiTrialDrawerFoot"><div class="uiTrialScale"><label>Nagyítás<select id="uiTrialScale"><option value="1">1×</option><option value="1.25">1,25×</option><option value="1.5" selected>1,5×</option><option value="fit">Teljes város</option></select></label><button id="uiTrialExit" type="button">Normál nézet</button></div><div class="uiTrialDeckHome"></div></footer>';
  const line=document.createElement('section');line.id='uiTrialOverview';line.hidden=true;
  line.innerHTML='<aside class="uiTrialOwnSummary"></aside><div class="uiTrialTrack"><span class="uiTrialTag">UI PRÓBA</span><canvas id="uiTrialLine" tabindex="0" role="slider" aria-label="Csataáttekintő és pályamozgatás" aria-valuemin="0" aria-valuemax="9600"></canvas></div><aside class="uiTrialEnemySummary"></aside>';
  app.append(drawer,line);
  const restore=[];
  function move(node,parent){const mark=document.createComment('UI trial return point');node.before(mark);restore.push(()=>{mark.replaceWith(node)});parent.append(node);}
  state.line=createBattleLine(R,line.querySelector('canvas'),()=>state.active);
  const viewport=()=>Number.parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--ui-header-height'))||64;
  const dock=()=>Number.parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--ui-dock-height'))||209;
  let baselineOffset=0,oldHeight='',oldZoom=1,oldPinned=false,oldWarTitle='';
  state.enter=()=>{
    if(state.active)return;
    baselineOffset=R.roadWar.clientHeight-(innerHeight-viewport()-dock());oldHeight=R.roadWorld.style.height;oldZoom=R.ROAD.zoom;oldPinned=R.ROAD.enemyPinned;
    oldWarTitle=R.roadWar.title;R.roadWar.title='A / D vagy görgő: balra / jobbra · ↑ / ↓ vagy Shift+görgő: fel / le · F: harci front';
    state.active=true;state.collapsed=false;document.body.classList.add('ui-trial');drawer.hidden=line.hidden=false;
    drawer.querySelector('#uiTrialFold').textContent='ÉPÍTÉS ‹';drawer.querySelector('#uiTrialFold').setAttribute('aria-expanded','true');
    move(tabs,drawer.querySelector('.uiTrialCategories'));move(catalog,drawer.querySelector('#uiTrialCards'));move(deck,drawer.querySelector('.uiTrialDeckHome'));move(gate,R.$('.topbar'));
    for(const side of ['player','enemy'])move(R.$(`.roadRosterTeam[data-side="${side}"]`),line.querySelector(side==='player'?'.uiTrialOwnSummary':'.uiTrialEnemySummary'));
    R.ROAD.zoom=1;if(R.ROAD.enemyPinned)R.$('#enemyCityPin').click();
    R.closeBuildCardPreview?.();R.roadResize();state.line.resize();R.renderBuildList();
  };
  state.exit=()=>{
    if(!state.active)return;
    state.active=false;R.closeBuildCardPreview?.();document.body.classList.remove('ui-trial','ui-trial-collapsed');drawer.hidden=line.hidden=true;
    while(restore.length)restore.pop()();
    R.roadWorld.style.height=oldHeight;R.roadWorld.style.removeProperty('--trial-world-scale');R.roadWar.title=oldWarTitle;R.ROAD.zoom=oldZoom;
    if(R.ROAD.enemyPinned!==oldPinned)R.$('#enemyCityPin').click();
    R.roadWar.scrollTop=0;R.roadResize();R.renderBuildList();R.updateHud();
  };
  drawer.querySelector('#uiTrialExit').onclick=state.exit;
  drawer.querySelector('#uiTrialFold').onclick=()=>{
    state.collapsed=!state.collapsed;document.body.classList.toggle('ui-trial-collapsed',state.collapsed);
    const button=drawer.querySelector('#uiTrialFold');button.textContent=state.collapsed?'›':'ÉPÍTÉS ‹';button.setAttribute('aria-expanded',String(!state.collapsed));
    R.closeBuildCardPreview?.();requestAnimationFrame(()=>{R.roadResize();state.line.resize();});
  };
  drawer.querySelector('#uiTrialScale').onchange=e=>{state.scale=e.target.value;R.roadResize();};
  const renderHeight=R.roadRenderHeight;
  R.roadRenderHeight=height=>{
    if(!state.active)return renderHeight?.(height)??height;
    const reference=Math.max(260,innerHeight-viewport()-dock()+baselineOffset);
    const h=state.scale==='fit'?height:Math.max(height,Math.round(reference*Number(state.scale)));
    R.roadWorld.style.height=h+'px';R.roadWorld.style.setProperty('--trial-world-scale',String(h/reference));return h;
  };
  const resize=R.roadResize;
  R.roadResize=(...args)=>{const out=resize(...args);if(state.active){document.documentElement.style.setProperty('--road-notice-anchor',`${R.roadWar.getBoundingClientRect().bottom-6}px`);state.line.resize();}return out;};
  const minimap=R.roadDrawMinimap;
  R.roadDrawMinimap=(force=false)=>state.active?state.line.draw(force):minimap(force);
  let cardLayoutFrame=0;
  function layoutCards(){
    cardLayoutFrame=0;const list=R.$('#buildList');if(!state.active||list.clientWidth<=8)return;
    list.style.setProperty('--trial-card-width',`${list.querySelector('.buildcard')?.getBoundingClientRect().width||list.clientWidth-8}px`);
    // Frame designs have different text-box positions. Measure the real face
    // rather than hard-coding the Human box position for every faction.
    const slots=[...list.querySelectorAll('.buildSlot')],heights=slots.map((slot,i)=>{
      const card=slot.querySelector('.buildcard'),text=card?.querySelector('.cardinfo');
      return i===slots.length-1?20+card.getBoundingClientRect().height:Math.max(80,text.getBoundingClientRect().top-slot.getBoundingClientRect().top);
    });
    slots.forEach((slot,i)=>slot.style.setProperty('height',heights[i]+'px','important'));
  }
  const scheduleCards=()=>{if(!cardLayoutFrame)cardLayoutFrame=requestAnimationFrame(layoutCards);};
  new ResizeObserver(scheduleCards).observe(R.$('#buildList'));
  new MutationObserver(scheduleCards).observe(R.$('#buildList'),{childList:true});
  window.addEventListener('roadlords:ui-scale',()=>{if(state.active)requestAnimationFrame(R.roadResize);});
  document.addEventListener('keydown',e=>{
    if(!state.active||!['ArrowUp','ArrowDown'].includes(e.key)||e.target.closest('input,select,textarea')||R.state.modal||document.body.classList.contains('roadlords-menu-open'))return;
    e.preventDefault();R.roadWar.scrollTop+=e.key==='ArrowUp'?-80:80;
  });
  document.addEventListener('click',e=>{if(state.active&&!state.launching&&e.target.closest('#mpSolo,#mpOpenMulti,#mpCreateRoom,#mpJoinRoom,#roadAiVsAiMenu'))state.exit();},true);
  const menu=document.createElement('section');menu.className='spectatorSetup uiTrialSetup';
  menu.innerHTML='<h3>UI próba · Oldalsó kártyák és csatavonal</h3><button id="roadUiTrialMenu" class="menuButton" type="button">UI PRÓBA INDÍTÁSA</button><p>Játékos vs AI, fajválasztással. Bal oldali kártyafül, azonnali előnézet, vonalas csataáttekintő és 1,5× nagyítás. A normál nézet külön megmarad.</p>';
  menu.querySelector('button').onclick=()=>{
    R.$('#roadTestsBack').click();state.launching=true;
    try{state.enter();R.$('#mpSolo').click();}finally{state.launching=false;}
  };
  R.$('#roadTestsPanel .roadTestsList').append(menu);
}
