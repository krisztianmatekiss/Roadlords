import { assetUrl } from '../assets/urls.js';
export function initializeDataTrainingBalance(runtime) {
  for (const leg of runtime.LEGENDARY) {
    if (leg.id === 'no_food') leg.description = 'Az egységek nem kerülnek Élelembe, de +50% gyártási időt kapnak.';
  }
  const brandSmall = document.querySelector('.brand small');
  if (brandSmall) brandSmall.textContent = 'V4.9.55 · P2P 1V1';
  if (runtime.MP?.lobby) {
    const ver = runtime.MP.lobby.querySelector('.menuVersion');
    if (ver) ver.textContent = 'V4.9.55 · P2P';
  }
  document.title = 'Roadlords V4.9.55 – Egységárak + Hadkötelezettség nerf';
  window.__ROADLORDS_VERSION__ = '4.9.55-unit-costs-conscription-nerf';
}
