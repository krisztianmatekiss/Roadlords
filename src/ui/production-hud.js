import { assetUrl } from '../assets/urls.js';
export function initializeUiProductionHud() {
  const style = document.createElement('style');
  style.textContent = `@import url("${assetUrl('styles/features/ui-production-hud-22.css')}");`;
  document.head.appendChild(style);
  const topbar = document.querySelector('.topbar');
  const brand = topbar?.querySelector('.brand');
  const resources = topbar?.querySelector('.resources');
  if (topbar && brand && resources && !topbar.querySelector('.topLeftCluster')) {
    const cluster = document.createElement('div');
    cluster.className = 'topLeftCluster';
    topbar.insertBefore(cluster, brand);
    cluster.append(brand, resources);
  }
}
