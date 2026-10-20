import { assetUrl } from '../assets/urls.js';
export function initializeUiMenuLabels(runtime) {
  window.__ROADLORDS_VERSION__ = '4.9.24-economy-stats';
  document.title = 'Roadlords V4.9.24 – Gazdaság és meccsstatisztika';
  runtime.$('.brand small').textContent = 'V4.9.24 · P2P 1V1';
  if (runtime.MP?.lobby) {
    const ver = runtime.MP.lobby.querySelector('.menuVersion');
    if (ver) ver.textContent = 'V4.9.24 · P2P';
  }
}
