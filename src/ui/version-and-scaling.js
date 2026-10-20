// Preserve the original TV/4K sizing. Version labels are owned by config/app.js.
export function initializeVersionAndScaling() {
  function applyTv4kScale() {
    const ratio = Math.min(window.innerWidth / 1920, window.innerHeight / 1080);
    const scale = Math.min(1.8, 0.90 * Math.max(1, ratio));
    document.documentElement.style.setProperty('--tv4k-s', String(scale));
  }
  applyTv4kScale();
  window.addEventListener('resize', applyTv4kScale, { passive: true });
  window.__ROADLORDS_TV4K_SCALE__ = () => getComputedStyle(document.documentElement).getPropertyValue('--tv4k-s').trim();
}
