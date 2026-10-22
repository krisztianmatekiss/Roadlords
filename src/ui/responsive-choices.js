// Count rendered cards rather than choiceContext, which can change separately
// during rerolls and previews. Every choice kind shares the same geometry.
export function initializeResponsiveChoices() {
  const overlay = document.querySelector('#choiceOverlay');
  const modal = overlay.querySelector('.modal');
  const list = overlay.querySelector('#choiceList');
  let frame = 0;
  function layout() {
    frame = 0;
    if (overlay.classList.contains('hidden')) return;
    const count = Math.max(1, list.children.length);
    const scale = window.__ROADLORDS_UI_SCALE__.effective();
    const margin = Math.min(20 * scale, innerWidth * .025);
    const padding = Math.min(18 * scale, innerWidth * .025);
    const gap = 14 * scale;
    const available = innerWidth - 2 * (margin + padding);
    let columns = Math.max(1, Math.min(count, Math.floor((available + gap) / (230 * scale + gap))));
    const rows = Math.ceil(count / columns);
    columns = Math.ceil(count / rows);
    const width = Math.min(innerWidth - margin * 2, columns * 310 * scale + gap * (columns - 1) + padding * 2);
    const set = (name, value) => modal.style.setProperty(name, String(value));
    set('--pick-width', `${width}px`);
    set('--pick-margin', `${margin}px`);
    set('--pick-padding', `${padding}px`);
    set('--pick-gap', `${gap}px`);
    set('--pick-columns', columns);
    const header = overlay.querySelector('.choicehead').getBoundingClientRect().height;
    const tools = overlay.querySelector('.choiceDockBar').getBoundingClientRect().height;
    const hint = overlay.querySelector('.choiceBanHint').getBoundingClientRect().height;
    const hud = document.querySelector('.topbar').getBoundingClientRect().height;
    const space = innerHeight - hud - 2 * (margin + padding) - header - tools - hint - gap * 3 - 4;
    // Short windows scroll the deck, keeping heading and actions fixed.
    const height = Math.min(space, Math.max(300 * scale, Math.min(530 * scale, (space - (rows - 1) * gap) / rows)));
    set('--pick-height', `${height}px`);
    set('--pick-title-height', `${Math.min(58 * scale, Math.max(44 * scale, height * .15))}px`);
    set('--pick-card-padding', `${Math.min(12 * scale, height * .032)}px`);
    set('--pick-art-height', `${Math.min(150 * scale, Math.max(48 * scale, height * .23))}px`);
  }
  function schedule() { if (!frame) frame = requestAnimationFrame(layout); }
  new MutationObserver(schedule).observe(list, { childList: true });
  new MutationObserver(schedule).observe(overlay, { attributes: true, attributeFilter: ['class'] });
  new MutationObserver(schedule).observe(overlay.querySelector('.choiceBanHint'), { childList: true });
  const observer = new ResizeObserver(schedule);
  observer.observe(overlay.querySelector('.choicehead'));
  observer.observe(overlay.querySelector('.choiceDockBar'));
  window.addEventListener('resize', schedule, { passive: true });
  window.addEventListener('roadlords:ui-scale', schedule);
  schedule();
}
