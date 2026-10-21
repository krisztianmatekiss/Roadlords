// One small canvas, refreshed at 10 Hz; no per-unit DOM or retained snapshots.
export function installRoadMinimap(R) {
  const map = document.createElement('canvas'), g = map.getContext('2d');
  map.id = 'roadMinimap'; map.tabIndex = 0;
  map.setAttribute('role', 'slider'); map.setAttribute('aria-orientation', 'horizontal');
  map.setAttribute('aria-label', 'Minitérkép – pályamozgatás'); map.setAttribute('aria-valuemin', '0');
  map.title = 'Minitérkép · Kattints vagy húzd a nézet mozgatásához · Nyilak / Home / End';
  R.$('.command').append(map);
  let width = 0, height = 0, last = -Infinity, dragging = null;
  R.roadLayoutMinimap = () => {
    const bounds = map.getBoundingClientRect();
    width = bounds.width; height = bounds.height;
    if (!width || !height) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    map.width = Math.round(width * dpr); map.height = Math.round(height * dpr);
    g.setTransform(map.width / width, 0, 0, map.height / height, 0, 0);
    R.roadDrawMinimap(true);
  };
  R.roadDrawMinimap = (force = false) => {
    const now = performance.now();
    if (!width || document.body.classList.contains('roadlords-menu-open') || !force && now - last < 100) return;
    last = now;
    const pad = 4, w = width - pad * 2, h = height - pad * 2;
    const world = R.PATH_LENGTH + R.ROAD.city * 2;
    const x = lane => pad + (R.ROAD.city + lane) / world * w;
    const y = offset => pad + (.5 + offset / 600) * h;
    const cityWidth = R.ROAD.city / world * w;
    g.clearRect(0, 0, width, height);
    g.fillStyle = '#23382c'; g.fillRect(0, 0, width, height);
    g.fillStyle = '#84704d'; g.fillRect(x(0), pad + h * 49 / 600, w - cityWidth * 2, h * 502 / 600);
    for (const side of ['player', 'enemy']) {
      g.fillStyle = R.unitTeamFill({side});
      g.fillRect(side === 'player' ? pad : width - pad - cityWidth, pad + h * 49 / 600, cityWidth, h * 502 / 600);
      for (const t of R.towers) if (t.alive && t.side === side) g.fillRect(x(t.lane) - 1.5, y(t.lateral || 0) - 3, 3, 6);
      g.beginPath();
      for (const u of R.state.units) if (u.alive && u.side === side) {
        const px = x(u.lane), py = y(u.offset || 0);
        g.moveTo(px + 1, py); g.arc(px, py, 1, 0, Math.PI * 2);
      }
      g.fill();
    }
    // The enemy-city pin is a separate frozen pane, not part of the moving view.
    const visible = R.roadWar.clientWidth - (R.ROAD.enemyPinned ? R.ROAD.city : 0);
    const left = pad + R.roadWar.scrollLeft / world * w;
    g.strokeStyle = '#fff0b8'; g.lineWidth = 1;
    g.strokeRect(left, pad - 1, Math.min(visible / world * w, width - pad - left), h + 2);
    const max = Math.max(0, R.roadWar.scrollWidth - R.roadWar.clientWidth);
    map.setAttribute('aria-valuemax', String(max));
    map.setAttribute('aria-valuenow', String(Math.round(R.roadWar.scrollLeft)));
  };
  function navigate(event) {
    const rect = map.getBoundingClientRect();
    const fraction = R.clamp((event.clientX - rect.left - 4) / (width - 8), 0, 1);
    const visible = R.roadWar.clientWidth - (R.ROAD.enemyPinned ? R.ROAD.city : 0);
    R.roadWar.scrollLeft = fraction * R.roadWorld.offsetWidth - visible / 2;
    R.roadDrawMinimap(true);
  }
  map.addEventListener('pointerdown', e => {
    if (e.button !== 0) return;
    e.preventDefault(); map.focus({preventScroll: true});
    dragging = e.pointerId; map.setPointerCapture(e.pointerId); navigate(e);
  });
  map.addEventListener('pointermove', e => { if (e.pointerId === dragging) navigate(e); });
  map.addEventListener('lostpointercapture', () => { dragging = null; });
  map.addEventListener('keydown', e => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) return;
    e.preventDefault(); e.stopPropagation();
    R.roadWar.scrollLeft = e.key === 'Home' ? 0 : e.key === 'End' ? R.roadWorld.offsetWidth
      : R.roadWar.scrollLeft + (e.key === 'ArrowLeft' ? -200 : 200);
    R.roadDrawMinimap(true);
  });
  new ResizeObserver(() => R.roadLayoutMinimap()).observe(map);
}
