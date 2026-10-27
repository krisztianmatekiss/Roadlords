import { assetUrl } from '../assets/urls.js';
export function initializeCombatSuddenDeath(runtime) {
  const style = document.createElement('style');
  style.textContent = "@import url(\"" + (assetUrl("styles/features/combat-sudden-death-8.css") + "\");");
  document.head.appendChild(style);
  const battle = document.querySelector('.battle');
  if (battle && !document.getElementById('suddenOverlay')) {
    const el = document.createElement('div');
    el.id = 'suddenOverlay';
    el.className = 'suddenOverlay';
    el.innerHTML = '<span class="big">HIRTELEN HALÁL</span><span class="sub"></span>';
    el.setAttribute('role','status');
    el.setAttribute('aria-live','assertive');
    document.body.appendChild(el);
  }
}
