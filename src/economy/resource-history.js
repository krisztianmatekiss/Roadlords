import { assetUrl } from '../assets/urls.js';
export function initializeEconomyResourceHistory(runtime) {
  const oldSnapshot = runtime.mpCitySnapshot;
  runtime.mpCitySnapshot = function (c) {
    c.resourceUse38 = runtime.measuredResourceUse38(c);
    return oldSnapshot(c);
  };
  const oldHud = runtime.updateHud;
  runtime.updateHud = function () {
    const out = oldHud();
    runtime.renderResourceFlow38();
    return out;
  };
  const style = document.createElement('style');
  style.textContent = "@import url(\"" + (assetUrl("styles/features/economy-resource-history-37.css") + "\");");
  document.head.appendChild(style);
  window.__ROADLORDS_RESOURCE_FLOW__ = {
    measured: runtime.measuredResourceUse38
  };
}
