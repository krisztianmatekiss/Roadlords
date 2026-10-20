import { assetUrl } from '../assets/urls.js';
export function initializeUiMenuIntro(runtime) {
  const style = document.createElement('style');
  style.textContent = "@import url(\"" + (assetUrl("styles/features/ui-menu-intro-10.css") + "\");");
  document.head.appendChild(style);
}
