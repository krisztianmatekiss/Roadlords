import { createBattleLine } from './battle-line.js';
import { installBattleRosters } from './battle-rosters.js';
const BUILD_ICON='<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M6 26h20V13H6Zm-2-13L16 4l12 9M12 26v-9h8v9"/><path d="m3 6 5-3 5 6-4 4Z"/></svg>';

// Default battle layout around the same solo, spectator and multiplayer game.
export function installBattleLayout(R) {
  const state=R.battleLayout={active:false,scale:'fit',collapsed:true};
  const rosters=installBattleRosters(R,()=>state.active);
  const app=R.$('#app'),catalog=R.$('.catalog'),tabs=R.$('.commandRail .tabs'),deck=R.$('#relicBtn'),gate=R.$('#gateControls');
  const drawer=document.createElement('aside');drawer.id='uiTrialDrawer';drawer.hidden=true;
  drawer.innerHTML='<div class="uiTrialCategories"></div><div id="uiTrialCards"></div><footer class="uiTrialDrawerFoot"><div class="uiTrialScale"><label>Nagyítás<select id="uiTrialScale"><option value="1">1×</option><option value="1.25">1,25×</option><option value="1.5">1,5×</option><option value="fit" selected>Teljes város</option></select></label><button id="uiTrialExit" type="button">Korábbi nézet</button></div></footer>';
  const launchers=document.createElement('nav');launchers.id='chronicleTools';launchers.hidden=true;launchers.setAttribute('aria-label','Építés és pakli');
  launchers.innerHTML=`<button id="uiTrialFold" type="button" aria-label="Építőmenü" title="Építőmenü · Q / W / E / R" aria-expanded="false" aria-controls="uiTrialDrawer">${BUILD_ICON}</button><div class="uiTrialDeckHome"></div>`;
  const line=document.createElement('section');line.id='uiTrialOverview';line.hidden=true;
  line.innerHTML='<aside class="uiTrialOwnSummary"></aside><div class="uiTrialTrack"><canvas id="uiTrialLine" tabindex="0" role="slider" aria-label="Csataáttekintő és pályamozgatás" aria-valuemin="0" aria-valuemax="9600"></canvas></div><aside class="uiTrialEnemySummary"></aside>';
  app.append(drawer,line,launchers);
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
    state.active=true;state.collapsed=true;document.body.classList.add('ui-trial','ui-trial-collapsed','chronicle');drawer.hidden=true;line.hidden=launchers.hidden=false;
    state.setCollapsed(true);
    move(tabs,drawer.querySelector('.uiTrialCategories'));move(catalog,drawer.querySelector('#uiTrialCards'));move(deck,launchers.querySelector('.uiTrialDeckHome'));move(gate,app);
    for(const side of ['player','enemy'])move(R.$(`.roadRosterTeam[data-side="${side}"]`),line.querySelector(side==='player'?'.uiTrialOwnSummary':'.uiTrialEnemySummary'));
    R.ROAD.zoom=1;if(R.ROAD.enemyPinned)R.$('#enemyCityPin').click();
    R.closeBuildCardPreview?.();R.roadResize();state.line.resize();R.renderBuildList();R.updateHud();
  };
  state.exit=()=>{
    if(!state.active)return;
    state.active=false;rosters.reset();R.closeBuildCardPreview?.();document.body.classList.remove('ui-trial','ui-trial-collapsed','chronicle');drawer.hidden=line.hidden=launchers.hidden=true;
    while(restore.length)restore.pop()();
    R.roadWorld.style.height=oldHeight;R.roadWorld.style.removeProperty('--trial-world-scale');R.roadWar.title=oldWarTitle;R.ROAD.zoom=oldZoom;
    if(R.ROAD.enemyPinned!==oldPinned)R.$('#enemyCityPin').click();
    R.roadWar.scrollTop=0;R.roadResize();R.renderBuildList();R.updateHud();
  };
  drawer.querySelector('#uiTrialExit').onclick=()=>state.setMode('classic');
  state.setCollapsed=collapsed=>{
    state.collapsed=collapsed;drawer.hidden=collapsed;document.body.classList.toggle('ui-trial-collapsed',collapsed);
    const button=launchers.querySelector('#uiTrialFold');button.setAttribute('aria-expanded',String(!collapsed));
    R.closeBuildCardPreview?.();if(!collapsed)requestAnimationFrame(layoutCards);
  };
  launchers.querySelector('#uiTrialFold').onclick=()=>state.setCollapsed(!state.collapsed);
  document.addEventListener('pointerdown',e=>{
    if(state.active&&!state.collapsed&&!e.target.closest('#uiTrialDrawer,#chronicleTools,.buildCardPreview'))state.setCollapsed(true);
  });
  const buildList=R.renderBuildList;
  R.renderBuildList=(...args)=>{const out=buildList(...args);if(state.active&&R.state.selectedBuild&&!state.collapsed)state.setCollapsed(true);return out;};
  drawer.querySelector('#uiTrialScale').onchange=e=>{state.scale=e.target.value;R.roadResize();};
  const renderHeight=R.roadRenderHeight;
  R.roadRenderHeight=height=>{
    if(!state.active)return renderHeight?.(height)??height;
    const reference=Math.max(260,innerHeight-viewport()-dock()+baselineOffset);
    const h=state.scale==='fit'?height:Math.max(height,Math.round(reference*Number(state.scale)));
    R.roadWorld.style.height=h+'px';R.roadWorld.style.setProperty('--trial-world-scale',String(h/reference));return h;
  };
  const resize=R.roadResize;
  R.roadResize=(...args)=>{const out=resize(...args);if(state.active){R.roadNoticeBottom=line.getBoundingClientRect().top-8;document.documentElement.style.setProperty('--road-notice-anchor',`${R.roadNoticeBottom}px`);state.line.resize();}return out;};
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
    if(state.active&&e.key==='Escape'&&!state.collapsed)state.setCollapsed(true);
    if(!state.active||!['ArrowUp','ArrowDown'].includes(e.key)||e.target.closest('input,select,textarea')||R.state.modal||document.body.classList.contains('roadlords-menu-open'))return;
    e.preventDefault();R.roadWar.scrollTop+=e.key==='ArrowUp'?-80:80;
  });
  window.addEventListener('keydown',e=>{
    if(state.active&&['q','w','e','r'].includes(e.key.toLowerCase())&&!e.ctrlKey&&!e.metaKey&&!e.altKey&&!e.target.closest('input,select,textarea')&&!R.state.modal&&!document.body.classList.contains('roadlords-menu-open'))state.setCollapsed(false);
  },true);
  const pause=R.$('#pauseBtn'),pauseLabel=()=>pause.setAttribute('aria-label',pause.classList.contains('on')?'Folytatás':'Szünet');
  new MutationObserver(pauseLabel).observe(pause,{attributes:true,attributeFilter:['class']});pauseLabel();
  const settings=document.querySelector('.rlSettingsPanel .rlPanelBody');
  const help=settings.querySelector('.rlHotkeys');
  for(const [key,description]of [['A / D','Pályamozgatás balra / jobbra. Dupla lenyomás: ugrás a pálya szélére.'],['F','Ugrás a harci frontra.'],['GÖRGŐ','Pályamozgatás; az építőmenü fölött a kártyalista görgetése.']]){const row=document.createElement('div');row.className='rlHotkeyRow';row.innerHTML=`<span class="rlHotkeyKeys"><kbd class="rlKey">${key}</kbd></span><span class="rlHotkeyText">${description}</span>`;help?.append(row);}
  const field=document.createElement('section');field.className='rlSection';
  field.innerHTML='<h3 class="rlSectionTitle">JÁTÉKNÉZET</h3><label>Elrendezés <select id="battleLayoutMode"><option value="modern">Rajzolt világ · lebegő kezelőfelület</option><option value="classic">Korábbi elrendezés</option></select></label>';
  settings.append(field);
  const select=field.querySelector('select');
  state.setMode=(mode,persist=true)=>{
    mode=mode==='classic'?'classic':'modern';select.value=mode;
    if(persist)try{localStorage.setItem('roadlords-battle-layout-v2',mode);}catch{}
    if(mode==='classic')state.exit();else state.enter();
  };
  select.onchange=()=>state.setMode(select.value);
  const spectator=R.startSpectator;
  R.startSpectator=(...args)=>{state.setMode('modern',false);return spectator(...args);};
  // Explicit classic links also keep the retained legacy UI fixtures usable.
  let mode=new URL(location.href).searchParams.get('layout');
  if(!mode)try{mode=localStorage.getItem('roadlords-battle-layout-v2');}catch{}
  state.setMode(mode||'modern',false);
}
