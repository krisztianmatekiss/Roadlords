import { assetUrl } from '../assets/urls.js';
export function initializeDataTempleBalance(runtime) {
  if (runtime.BUILDINGS.temple) {
    runtime.BUILDINGS.temple.description = 'Papokat gyárt. A Pap támadása és gyógyítása külön cooldownon működik, ezért mozgás és harc közben is képes sérült szövetségest gyógyítani.';
  }
  const brandSmall = document.querySelector('.brand small');
  if (brandSmall) brandSmall.textContent = 'V4.9.43 · P2P 1V1';
  if (typeof runtime.MP !== 'undefined' && runtime.MP?.lobby) {
    const ver = runtime.MP.lobby.querySelector('.menuVersion');
    if (ver) ver.textContent = 'V4.9.43 · P2P';
  }
  document.title = 'Roadlords V4.11.18 – Menü intro';
  window.__ROADLORDS_VERSION__ = '4.9.43-playtest-fixes';
}
