import { assetUrl } from '../assets/urls.js';
export function initializeUiCatalogAffordability(runtime) {
  const style = document.createElement('style');
  style.textContent = "@import url(\"" + (assetUrl("styles/features/ui-catalog-affordability-9.css") + "\");");
  document.head.appendChild(style);
}
