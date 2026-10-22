const STORE = 'roadlords-ui-scale-v2';
const MODES = ['auto', '75', '100', '125', '150'];

// Scale screen-space controls only. World coordinates, sprites and hit testing
// remain owned by the road renderer, including the unzoomed minimap canvas.
export function initializeVersionAndScaling() {
  let mode = 'auto';
  try {
    const saved = localStorage.getItem(STORE);
    if (MODES.includes(saved)) mode = saved;
    else if (localStorage.getItem('roadlords-ui-scale-v1') === 'normal') mode = '100';
    // Retired large/TV modes used incompatible geometry; migrate to auto.
  } catch (_) { /* Private browsing may disable storage. */ }
  const home = document.querySelector('.rlScaleHome');
  if (home) {
    home.innerHTML = `<div class="uiScaleControl" role="group" aria-label="Felületméret">${MODES.map(value => `<button class="uiScaleBtn" data-ui-scale="${value}" type="button">${value === 'auto' ? 'Automatikus' : value + '%'}</button>`).join('')}</div><output id="uiViewportSize" aria-live="polite"></output>`;
    home.querySelectorAll('.uiScaleBtn').forEach(button => {
      button.onclick = () => setMode(button.dataset.uiScale, true);
    });
  }
  function refresh() {
    const scale = mode === 'auto'
      ? Math.min(2, Math.max(1, Math.min(innerWidth / 1920, innerHeight / 1080)))
      : Number(mode) / 100;
    document.body.dataset.uiScale = mode;
    document.body.dataset.uiCompact = String(innerWidth / scale <= 1350);
    const narrow = innerWidth / scale <= 720;
    document.body.dataset.uiNarrow = String(narrow);
    document.documentElement.style.setProperty('--ui-scale', scale);
    document.documentElement.style.setProperty('--ui-header-height', `${(narrow ? 92 : 64) * scale}px`);
    document.documentElement.style.setProperty('--ui-dock-height', `${209 * scale}px`);
    home?.querySelectorAll('.uiScaleBtn').forEach(button => {
      const selected = button.dataset.uiScale === mode;
      button.classList.toggle('active', selected);
      button.setAttribute('aria-pressed', String(selected));
    });
    const output = document.querySelector('#uiViewportSize');
    if (output) output.textContent = `Játékablak: ${innerWidth} × ${innerHeight} px · Felület: ${Math.round(scale * 100)}%`;
    window.dispatchEvent(new CustomEvent('roadlords:ui-scale', { detail: { mode, scale } }));
    return scale;
  }
  function setMode(value, persist = false) {
    mode = MODES.includes(String(value)) ? String(value) : 'auto';
    if (persist) {
      try { localStorage.setItem(STORE, mode); } catch (_) {}
    }
    refresh();
  }
  window.__ROADLORDS_UI_SCALE__ = { set: setMode, get: () => mode,
    effective: () => Number(document.documentElement.style.getPropertyValue('--ui-scale')) };
  window.addEventListener('resize', refresh, { passive: true });
  refresh();
}
