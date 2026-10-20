import { assetUrl } from '../assets/urls.js';
export function initializeUiHudLayering(runtime) {
  const styleV4967 = document.createElement('style');
  styleV4967.textContent = "@import url(\"" + (assetUrl("styles/features/ui-hud-layering-32.css") + "\");");
  document.head.appendChild(styleV4967);
  const previousToastV4967 = runtime.toast;
  runtime.toast = function (text) {
    const msg = String(text ?? '');
    if (/futási\s*hiba|runtime\s*error|tick-védelem|render-védelem|frame-védelem/i.test(msg)) return;
    return previousToastV4967(text);
  };
  const existingToast = document.getElementById('toast');
  if (existingToast && /futási\s*hiba|runtime\s*error/i.test(existingToast.textContent || '')) {
    existingToast.textContent = '';
    existingToast.classList.remove('show');
  }
  const brandSmall = document.querySelector('.brand small');
  if (brandSmall) brandSmall.textContent = 'V4.9.67 · P2P 1V1';
  if (runtime.MP?.lobby) {
    const ver = runtime.MP.lobby.querySelector('.menuVersion');
    if (ver) ver.textContent = 'V4.9.67 · P2P';
  }
  document.title = 'Roadlords V4.9.67 – HUD uncovered';
  window.__ROADLORDS_VERSION__ = '4.9.67-hud-uncovered';
}
