import { assetUrl } from '../assets/urls.js';
export function initializeUiMenuBrand(runtime) {
  const style = document.createElement('style');
  style.textContent = "@import url(\"" + (assetUrl("styles/features/ui-menu-brand-12.css") + "\");");
  document.head.appendChild(style);
}
