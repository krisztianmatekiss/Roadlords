// Camera controls use wall time, so navigation also works while combat is paused.
export function installRoadNavigation(R) {
  const war = R.roadWar, world = R.roadWorld;
  const enemy = world.querySelector('.cityzone:last-child');
  enemy.classList.add('roadEnemyCity');
  const pane = document.createElement('div');
  pane.className = 'roadEnemyPane';
  pane.setAttribute('aria-hidden', 'true');
  world.insertBefore(pane, enemy);
  const toggle = document.createElement('button');
  toggle.id = 'enemyCityPin';
  toggle.type = 'button';
  toggle.className = 'btn active';
  toggle.setAttribute('aria-controls', 'enemyGrid');
  toggle.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 21V9h4V4h3v5h2V4h3v5h4v12zM10 21v-6h4v6M3 12h18"/><path d="m17 2 4 4m-2-2-4 4"/></svg>';
  R.$('.run').prepend(toggle);
  R.ROAD.enemyPinned = true;
  function positionCity() {
    if (!R.ROAD.enemyPinned) return;
    const inset = Math.max(0, world.offsetWidth - war.scrollLeft - war.clientWidth);
    world.style.setProperty('--enemy-city-inset', `${inset}px`);
  }
  function updatePin() {
    world.classList.toggle('enemy-city-pinned', R.ROAD.enemyPinned);
    toggle.classList.toggle('active', R.ROAD.enemyPinned);
    toggle.setAttribute('aria-pressed', String(R.ROAD.enemyPinned));
    toggle.title = R.ROAD.enemyPinned
      ? 'Ellenfél városának rögzítése: be · Kattints a feloldáshoz'
      : 'Ellenfél városának rögzítése: ki · Kattints a rögzítéshez';
    toggle.setAttribute('aria-label', toggle.title);
    positionCity();
  }
  toggle.onclick = () => { R.ROAD.enemyPinned = !R.ROAD.enemyPinned; updatePin(); };
  war.addEventListener('scroll', positionCity, {passive: true});
  new ResizeObserver(positionCity).observe(war);
  updatePin();

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
    const visibleWidth = Math.max(1, war.clientWidth - (R.ROAD.enemyPinned ? R.ROAD.city + 24 : 0));
    const z = R.ROAD.zoom, w = R.ROAD.w;
    // Invert the renderer's camera mapping, including its clamped end sections.
    let lo = 0, hi = Math.max(0, war.scrollWidth - war.clientWidth);
    for (let i = 0; i < 24; i++) {
      const scroll = (lo + hi) / 2;
      const view = R.clamp(scroll - R.ROAD.city, 0, R.PATH_LENGTH - w);
      const camera = view + (w - w / z) / 2;
      const screenX = R.ROAD.city + view - scroll + (lane - camera) * z;
      if (screenX > visibleWidth / 2) lo = scroll; else hi = scroll;
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
  war.addEventListener('wheel', e => e.preventDefault(), {passive: false});
  war.title = 'A / D: pályamozgatás · Dupla A / D: pálya széle · F: harci front';
}
