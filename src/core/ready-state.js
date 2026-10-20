import { assetUrl } from '../assets/urls.js';
export function initializeCoreReadyState(runtime) {
  runtime.renderStatic();
  runtime.updateHud();
  runtime.mpBeginPregame = undefined;
}
