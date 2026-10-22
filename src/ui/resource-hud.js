import { assetUrl } from '../assets/urls.js';
export function initializeUiResourceHud() {
  const style = document.createElement('style');
  style.textContent = `@import url("${assetUrl('styles/features/ui-resource-hud-23.css')}");`;
  document.head.appendChild(style);
}
