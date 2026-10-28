import { bindInspectorDrag, fitInspectorWindow } from './inspector-window.js';

// Installed after the final tower positioner so manual movement takes precedence.
export function initializeUiInspectorDrag(runtime) {
  const element = runtime.$('#inspector');
  let key = null, manual = null, frame = 0;
  const inspectorKey = () => {
    const tower = runtime.selectedTowerV496?.();
    if (tower && !runtime.state.selectedBuilding) return `tower:${tower.id}`;
    const b = runtime.getBuilding(runtime.E, runtime.state.selectedBuilding) ||
      runtime.getBuilding(runtime.P, runtime.state.selectedBuilding);
    return b ? `building:${b.id}` : null;
  };
  const drag = bindInspectorDrag(element, { onMove: position => { manual = position; } });
  const autoPosition = runtime.positionInspector;
  runtime.positionInspector = () => {
    const next = inspectorKey();
    if (next !== key) { drag.cancel(); manual = null; key = next; }
    if (!element.classList.contains('show')) return;
    if (!manual) autoPosition();
    const position = fitInspectorWindow(element, manual || {});
    if (manual) manual = position;
  };
  const schedule = () => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(runtime.positionInspector);
  };
  new ResizeObserver(schedule).observe(element);
  const render = runtime.renderInspector;
  runtime.renderInspector = (...args) => { const result = render(...args); schedule(); return result; };
  for (const event of ['resize', 'roadlords:ui-scale']) window.addEventListener(event, schedule);
  window.visualViewport?.addEventListener('resize', schedule);
  window.addEventListener('blur', drag.cancel);
  document.addEventListener('click', event => {
    if (event.target.closest('#closeInspector')) { drag.cancel(); key = null; manual = null; }
  }, true);
}
