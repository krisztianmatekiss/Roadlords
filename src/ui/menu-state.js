import { assetUrl } from '../assets/urls.js';
export function initializeUiMenuState(runtime) {
  window.__ROADLORDS_VERSION__ = '4.9.14-ai-composition-planning';
  document.title = 'Roadlords V4.11.18 – Menü intro';
  runtime.$('.brand small').textContent = 'V4.9.14 · P2P 1V1';
  if (runtime.MP?.lobby) {
    const ver = runtime.MP.lobby.querySelector('.menuVersion');
    if (ver) ver.textContent = 'V4.9.10 · P2P';
  }
}
