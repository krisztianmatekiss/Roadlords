import { assetUrl } from '../assets/urls.js';
export function initializeUiInitialHud(runtime) {
  window.__ROADLORDS_VERSION__ = '4.9.5-sudden-death';
  runtime.v468UpdateHud = runtime.updateHud;
  runtime.updateHud = function () {
    runtime.v468UpdateHud();
    runtime.$('#garrisonCount').textContent = `${runtime.reserveCount(runtime.P)}/${runtime.P.garrisonCap}`;
    runtime.$('#enemyGarrison').textContent = `${runtime.reserveCount(runtime.E)}/${runtime.E.garrisonCap}`;
  };
  runtime.v469UpdateHud = runtime.updateHud;
  runtime.updateHud = function () {
    runtime.v469UpdateHud();
    runtime.updateDynamicPickHud();
  };
  window.__ROADLORDS_VERSION__ = '4.9.5-sudden-death';
}
