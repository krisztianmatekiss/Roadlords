import { assetUrl } from '../assets/urls.js';
export function initializeUiPlacementCancellation(runtime) {
  function cancelSelectedBuildV4938() {
    if (!runtime.state.selectedBuild) return false;
    runtime.state.selectedBuild = null;
    runtime.state.buildRotation = 0;
    runtime.state.placementHover = null;
    runtime.state.lastPlacementHover = null;
    runtime.clearPlacementPreview();
    runtime.renderStatic();
    return true;
  }
  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape' || runtime.state.modal) return;
    if (!runtime.state.selectedBuild) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    cancelSelectedBuildV4938();
  }, true);
  const playerGridV4938 = runtime.$('#playerGrid');
  if (playerGridV4938) {
    playerGridV4938.addEventListener('click', e => {
      if (!runtime.state.selectedBuild) return;
      const plot = e.target.closest('.plot.terrain');
      if (!plot || !playerGridV4938.contains(plot)) return;
      const row = Number(plot.dataset.r),
        col = Number(plot.dataset.c);
      const terrain = runtime.terrainAt(runtime.P, row, col);
      if (!terrain || !['ruin', 'ancient'].includes(terrain.type)) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      const heldType = runtime.state.selectedBuild,
        heldRotation = runtime.state.buildRotation;
      const cleared = runtime.clearTerrain(runtime.P, row, col, false);
      if (cleared) {
        runtime.state.selectedBuild = heldType;
        runtime.state.buildRotation = heldRotation;
        runtime.state.selectedBuilding = null;
        requestAnimationFrame(() => runtime.renderStatic());
      }
    }, true);
  }
  window.__ROADLORDS_VERSION__ = '4.9.38-build-cancel-ruin-qol';
}
