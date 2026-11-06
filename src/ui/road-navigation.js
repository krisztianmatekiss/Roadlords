// Camera controls use wall time, so navigation also works while combat is paused.
export function installRoadNavigation(R) {
  const war = R.roadWar, world = R.roadWorld;
  const own=R.$('#playerGrid').closest('.cityzone'),enemy=R.$('#enemyGrid').closest('.cityzone');
  own.classList.add('roadOwnCity');enemy.classList.add('roadEnemyCity');
  Object.assign(R.ROAD,{ownPinned:false,enemyPinned:true});
  const toggles=[];
  for(const [side,label]of [['own','Saját'],['enemy','Ellenfél']]){
    const pane=document.createElement('div');pane.className=side==='own'?'roadOwnPane':'roadEnemyPane';pane.setAttribute('aria-hidden','true');
    world.insertBefore(pane,enemy);
    const toggle=document.createElement('button');toggle.id=side==='own'?'ownCityPin':'enemyCityPin';toggle.type='button';toggle.className='btn cityPin';
    toggle.setAttribute('aria-controls',side==='own'?'playerGrid':'enemyGrid');
    toggle.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 21V9h4V4h3v5h2V4h3v5h4v12zM10 21v-6h4v6M3 12h18"/><path d="m17 2 4 4m-2-2-4 4"/></svg>';
    toggles.push(toggle);
    const update=()=>{
      const pinned=R.ROAD[side+'Pinned'];world.classList.toggle(side==='own'?'own-city-pinned':'enemy-city-pinned',pinned);
      toggle.classList.toggle('active',pinned);toggle.setAttribute('aria-pressed',String(pinned));
      toggle.title=`${label} városának rögzítése: ${pinned?'be · Kattints a feloldáshoz':'ki · Kattints a rögzítéshez'}`;
      toggle.setAttribute('aria-label',toggle.title);positionCity();
    };
    toggle.onclick=()=>{R.ROAD[side+'Pinned']=!R.ROAD[side+'Pinned'];update();};update();
  }
  R.$('.run').prepend(...toggles);
  function positionCity() {
    if(R.ROAD.ownPinned)world.style.setProperty('--own-city-inset',`${war.scrollLeft}px`);
    if(R.ROAD.enemyPinned)world.style.setProperty('--enemy-city-inset',`${Math.max(0,world.offsetWidth-war.scrollLeft-war.clientWidth)}px`);
    // Two pinned cities must leave an unobstructed strip of road on small screens.
    const both=R.ROAD.ownPinned&&R.ROAD.enemyPinned,scale=both?Math.min(1,Math.max(1,war.clientWidth-160)/(2*R.ROAD.city)):1;
    world.classList.toggle('both-cities-pinned',both);
    world.style.setProperty('--pinned-city-scale',String(scale));
    world.style.setProperty('--pinned-city-width',`${R.ROAD.city*scale}px`);
    world.style.setProperty('--pinned-city-top',`${R.ROAD.h*49/600+R.ROAD.city*(1-scale)/2}px`);
  }
  R.roadPositionPinnedCity = positionCity;
  R.roadViewportBounds=()=>{
    const both=R.ROAD.ownPinned&&R.ROAD.enemyPinned,city=both?Math.min(R.ROAD.city,Math.max(1,war.clientWidth-160)/2):R.ROAD.city;
    return {left:R.ROAD.ownPinned?city+24:0,right:war.clientWidth-(R.ROAD.enemyPinned?city+24:0)};
  };
  war.addEventListener('scroll', positionCity, {passive: true});
  new ResizeObserver(positionCity).observe(war);

  // The densest group of current attacks is the front, including a tower siege.
  // Before contact, use the gap between the two advancing armies.
  function frontLane() {
    const groups = new Map();
    const add = lane => {
      const key = Math.floor(lane / 240), group = groups.get(key) || {count: 0, sum: 0};
      group.count++; group.sum += lane; groups.set(key, group);
    };
    let player = -Infinity, enemy = Infinity;
    for (const u of R.state.units) {
      if (!u.alive) continue;
      if (u.side === 'player') player = Math.max(player, u.lane);
      else enemy = Math.min(enemy, u.lane);
      const a = u.roadAttack;
      if (a && a.end >= R.ROAD.clock && Number.isFinite(a.to)) add(a.to);
      else if (u.roadAim?.alive && R.roadDistance(u, u.roadAim) <= u.range + 1) add((u.lane + u.roadAim.lane) / 2);
    }
    let best;
    for (const group of groups.values()) if (!best || group.count > best.count) best = group;
    if (best) return best.sum / best.count;
    if (Number.isFinite(player) && Number.isFinite(enemy)) return (player + enemy) / 2;
    if (Number.isFinite(player)) return player;
    if (Number.isFinite(enemy)) return enemy;
    return R.PATH_LENGTH / 2;
  }
  R.roadFocusFront = () => {
    const lane = frontLane();
    const bounds=R.roadViewportBounds(),center=(bounds.left+bounds.right)/2;
    const z = R.ROAD.zoom, w = R.ROAD.w;
    // Invert the renderer's camera mapping, including its clamped end sections.
    let lo = 0, hi = Math.max(0, war.scrollWidth - war.clientWidth);
    for (let i = 0; i < 24; i++) {
      const scroll = (lo + hi) / 2;
      const view = R.clamp(scroll - R.ROAD.city, 0, R.PATH_LENGTH - w);
      const camera = view + (w - w / z) / 2;
      const screenX = R.ROAD.city + view - scroll + (lane - camera) * z;
      if (screenX > center) lo = scroll; else hi = scroll;
    }
    war.scrollLeft = (lo + hi) / 2;
  };
  function blocked(target) {
    if (target?.closest?.('input,textarea,select,[contenteditable]:not([contenteditable="false"])')) return true;
    return document.body.classList.contains('roadlords-menu-open') || R.state.modal ||
      !R.$('#relicOverlay').classList.contains('hidden') || !R.$('#endOverlay').classList.contains('hidden');
  }
  const held = new Set();
  let lastKey = '', lastAt = -Infinity;
  document.addEventListener('keydown', e => {
    const key = e.key.toLowerCase();
    if (!['a', 'd', 'f'].includes(key) || e.ctrlKey || e.metaKey || e.altKey || blocked(e.target)) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    if (e.repeat) return;
    if (key === 'f') { held.clear(); R.roadFocusFront(); return; }
    const now = performance.now(), direction = key === 'a' ? -1 : 1;
    if (lastKey === key && now - lastAt < 300) {
      war.scrollLeft = direction < 0 ? 0 : war.scrollWidth;
      held.clear(); lastKey = ''; lastAt = -Infinity;
    } else {
      war.scrollLeft += direction * 90;
      held.add(key); lastKey = key; lastAt = now;
    }
  }, true);
  document.addEventListener('keyup', e => held.delete(e.key.toLowerCase()), true);
  window.addEventListener('blur', () => { held.clear(); lastKey = ''; });
  R.roadUpdateNavigation = dt => {
    if (!held.size) return;
    if (blocked(document.activeElement)) { held.clear(); return; }
    if (held.size) war.scrollLeft += ((held.has('d') ? 1 : 0) - (held.has('a') ? 1 : 0)) * Math.min(dt, .05) * 850;
  };
  war.addEventListener('wheel', e => {
    if (e.ctrlKey || e.metaKey) return;
    const delta = Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
    war.scrollLeft += delta * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? war.clientWidth : 1);
    e.preventDefault();
  }, {passive: false});
  war.title = 'A / D vagy görgő: pályamozgatás · Dupla A / D: pálya széle · F: harci front';
}
