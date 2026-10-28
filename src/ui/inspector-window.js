// Inspector geometry and pointer coordinates both use CSS pixels.
export function inspectorViewport() {
  const viewport = window.visualViewport;
  const left = (viewport?.offsetLeft || 0) + 8;
  const right = (viewport?.offsetLeft || 0) + (viewport?.width || innerWidth) - 8;
  const bottom = (viewport?.offsetTop || 0) + (viewport?.height || innerHeight) - 8;
  const header = document.querySelector('.topbar')?.getBoundingClientRect().bottom || 0;
  const top = Math.max((viewport?.offsetTop || 0) + 8, Math.min(header + 8, bottom - 64));
  return { left, right, top, bottom };
}

export function fitInspectorWindow(element, position = {}) {
  const bounds = inspectorViewport();
  element.style.setProperty('--inspector-max-width', `${bounds.right - bounds.left}px`);
  element.style.setProperty('--inspector-max-height', `${bounds.bottom - bounds.top}px`);
  const rect = element.getBoundingClientRect();
  const clamp = (n, lo, hi) => Math.max(lo, Math.min(n, Math.max(lo, hi)));
  const left = clamp(position.left ?? rect.left, bounds.left, bounds.right - rect.width);
  const top = clamp(position.top ?? rect.top, bounds.top, bounds.bottom - rect.height);
  element.style.left = `${Math.round(left)}px`;
  element.style.top = `${Math.round(top)}px`;
  return { left: Math.round(left), top: Math.round(top) };
}

// Capture and listen on the same persistent node, even if its header is refreshed.
export function bindInspectorDrag(element, { onMove = () => {}, onEnd = () => {} } = {}) {
  let drag = null;
  element.addEventListener('pointerdown', event => {
    if (drag || event.button !== 0 || event.isPrimary === false ||
        !event.target.closest('.ihead') ||
        event.target.closest('button,input,select,textarea,label,a,[contenteditable="true"]')) return;
    const start = fitInspectorWindow(element);
    drag = { id: event.pointerId, x: event.clientX, y: event.clientY, ...start };
    element.setPointerCapture(event.pointerId);
    element.classList.add('dragging');
    event.preventDefault();
  });
  element.addEventListener('pointermove', event => {
    if (!drag || event.pointerId !== drag.id) return;
    onMove(fitInspectorWindow(element, {
      left: drag.left + event.clientX - drag.x,
      top: drag.top + event.clientY - drag.y,
    }));
    event.preventDefault();
  });
  const finish = event => {
    if (!drag || event && event.pointerId !== drag.id) return;
    const id = drag.id;
    drag = null;
    element.classList.remove('dragging');
    if (element.hasPointerCapture(id)) element.releasePointerCapture(id);
    onEnd();
  };
  element.addEventListener('pointerup', finish);
  element.addEventListener('pointercancel', finish);
  element.addEventListener('lostpointercapture', finish);
  return { cancel: () => finish() };
}
