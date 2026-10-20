import { assetUrl } from '../assets/urls.js';
export function initializeUiBattleStatus(runtime) {
  window.__ROADLORDS_LEXICON_BRIDGE__ = {
    makeCity: runtime.makeCity,
    buildingUpgradeDetails: runtime.buildingUpgradeDetails,
    footprintText: runtime.footprintText,
    costText: runtime.costText,
    buildPrice: runtime.buildPrice,
    C: runtime.C,
    cardBuildingImageTag: runtime.cardBuildingImageTag,
    unitImageTag: runtime.unitImageTag,
    resourceIconTag: runtime.resourceIconTag,
    buildCardFootprintV41004: runtime.buildCardFootprintV41004
  };
}
