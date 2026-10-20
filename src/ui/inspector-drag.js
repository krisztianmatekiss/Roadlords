import { assetUrl } from '../assets/urls.js';
export function initializeUiInspectorDrag(runtime) {
  const style = document.createElement('style');
  style.textContent = "@import url(\"" + (assetUrl("styles/features/ui-inspector-drag-15.css") + "\");");
  document.head.appendChild(style);
  const drag = {
    key: null,
    dragged: false,
    left: 0,
    top: 0,
    pointerId: null,
    startX: 0,
    startY: 0,
    startLeft: 0,
    startTop: 0
  };
  function inspectorKey() {
    const t = typeof runtime.selectedTowerV496 === 'function' ? runtime.selectedTowerV496() : null;
    if (t && !runtime.state.selectedBuilding) return `tower:${t.id}`;
    const pb = runtime.getBuilding(runtime.P, runtime.state.selectedBuilding);
    if (pb) return `player:${pb.id}`;
    const eb = runtime.getBuilding(runtime.E, runtime.state.selectedBuilding);
    if (eb) return `enemy:${eb.id}`;
    return null;
  }
  function clampInspector(left, top) {
    const el = runtime.$('#inspector'),
      w = el?.offsetWidth || 330,
      h = el?.offsetHeight || 320;
    return {
      left: runtime.clamp(left, 10, Math.max(10, window.innerWidth - w - 10)),
      top: runtime.clamp(top, 74, Math.max(74, window.innerHeight - h - 10))
    };
  }
  function resetDrag() {
    drag.key = null;
    drag.dragged = false;
    drag.pointerId = null;
    runtime.$('#inspector')?.classList.remove('dragging');
  }
  const autoPositionInspector = runtime.positionInspector;
  runtime.positionInspector = function () {
    const el = runtime.$('#inspector'),
      key = inspectorKey();
    if (!el?.classList.contains('show') || !key) return autoPositionInspector();
    if (drag.key === key && drag.dragged) {
      const p = clampInspector(drag.left, drag.top);
      drag.left = p.left;
      drag.top = p.top;
      el.style.left = Math.round(p.left) + 'px';
      el.style.top = Math.round(p.top) + 'px';
      return;
    }
    return autoPositionInspector();
  };
  function installInspectorDrag() {
    const el = runtime.$('#inspector'),
      head = el?.querySelector('.ihead'),
      key = inspectorKey();
    if (!el?.classList.contains('show') || !head || !key) {
      if (!key) resetDrag();
      return;
    }
    if (drag.key !== key) {
      drag.key = key;
      drag.dragged = false;
      drag.pointerId = null;
    }
    if (head.dataset.dragReady === '1') return;
    head.dataset.dragReady = '1';
    head.title = 'Nyomva tartva mozgatható';
    head.addEventListener('pointerdown', e => {
      if (e.button !== 0 || e.target.closest('button,input,select,textarea,a')) return;
      const r = el.getBoundingClientRect();
      drag.key = inspectorKey();
      drag.pointerId = e.pointerId;
      drag.startX = e.clientX;
      drag.startY = e.clientY;
      drag.startLeft = r.left;
      drag.startTop = r.top;
      el.classList.add('dragging');
      try {
        head.setPointerCapture(e.pointerId);
      } catch (_) {}
      e.preventDefault();
    });
    head.addEventListener('pointermove', e => {
      if (drag.pointerId !== e.pointerId) return;
      const dx = e.clientX - drag.startX,
        dy = e.clientY - drag.startY;
      if (!drag.dragged && Math.hypot(dx, dy) < 3) return;
      drag.dragged = true;
      const p = clampInspector(drag.startLeft + dx, drag.startTop + dy);
      drag.left = p.left;
      drag.top = p.top;
      el.style.left = Math.round(p.left) + 'px';
      el.style.top = Math.round(p.top) + 'px';
      e.preventDefault();
    });
    const end = e => {
      if (drag.pointerId !== e.pointerId) return;
      drag.pointerId = null;
      el.classList.remove('dragging');
      try {
        head.releasePointerCapture(e.pointerId);
      } catch (_) {}
    };
    head.addEventListener('pointerup', end);
    head.addEventListener('pointercancel', end);
  }
  const baseRenderInspectorDrag = runtime.renderInspector;
  runtime.renderInspector = function () {
    const before = inspectorKey(),
      out = baseRenderInspectorDrag(),
      after = inspectorKey();
    if (!after) resetDrag();else if (drag.key && drag.key !== after) {
      drag.key = after;
      drag.dragged = false;
      drag.pointerId = null;
    }
    requestAnimationFrame(() => {
      installInspectorDrag();
      runtime.positionInspector();
    });
    return out;
  };
  document.addEventListener('click', e => {
    if (e.target.closest?.('#closeInspector')) resetDrag();
  }, true);
  window.addEventListener('resize', () => {
    if (drag.dragged) requestAnimationFrame(runtime.positionInspector);
  });
  window.__ROADLORDS_VERSION__ = '4.9.30-draggable-inspector';
  if (typeof runtime.MP !== 'undefined' && runtime.MP?.lobby) {
    const ver = runtime.MP.lobby.querySelector('.menuVersion');
    if (ver) ver.textContent = 'V4.9.30 · P2P';
  }
}
