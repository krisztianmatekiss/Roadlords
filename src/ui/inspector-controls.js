import { assetUrl } from '../assets/urls.js';
export function initializeUiInspectorControls(runtime) {
  runtime.$('#minimizeChoice').onclick = runtime.minimizeChoice;
  runtime.$('#pickReminder').onclick = runtime.reopenChoice;
  window.addEventListener('resize', () => requestAnimationFrame(runtime.positionInspector));
  window.__ROADLORDS_V17__ = {
    gateReleaseRate: runtime.gateReleaseRate,
    activeSpawners: runtime.activeSpawners,
    isUniqueBuilding: runtime.isUniqueBuilding,
    effectiveMoveSpeed: runtime.effectiveMoveSpeed,
    refreshExistingUnitsForCity: runtime.refreshExistingUnitsForCity,
    lockedBuildingCount: runtime.lockedBuildingCount,
    flashX2: runtime.flashX2,
    applyChoice: runtime.applyChoice,
    statsFor: runtime.statsFor,
    releaseUnit: runtime.releaseUnit,
    normalSpawn: runtime.normalSpawn,
    updateSpawners: runtime.updateSpawners,
    produceResources: runtime.produceResources,
    choiceContextForPlayer: runtime.choiceContextForPlayer,
    makeChoiceOptions: runtime.makeChoiceOptions,
    setBuildingLevel: runtime.setBuildingLevel,
    pathLength: runtime.PATH_LENGTH,
    pickBaseSeconds: runtime.PICK_BASE_SECONDS,
    pickGrowth: runtime.PICK_GROWTH
  };
}
