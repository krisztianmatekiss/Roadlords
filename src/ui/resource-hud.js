import { assetUrl } from '../assets/urls.js';
export function initializeUiResourceHud(runtime) {
  const style = document.createElement('style');
  style.textContent = "@import url(\"" + (assetUrl("styles/features/ui-resource-hud-23.css") + "\");");
  document.head.appendChild(style);
  if (window.__ROADLORDS_UNIT_PRODUCTION__?.render) {
    const oldRender = window.__ROADLORDS_UNIT_PRODUCTION__.render;
    const format = v => {
      if (!Number.isFinite(v) || v <= 0) return '0/s';
      if (v < .01) return '<0.01/s';
      if (v < 1) return `${v.toFixed(2)}/s`;
      return `${v.toFixed(1)}/s`;
    };
    const ratesFn = window.__ROADLORDS_UNIT_PRODUCTION__.unitProductionRates;
    const newRender = function () {
      const root = document.getElementById('unitProductionList');
      if (!root || !ratesFn) return;
      const {
        rates,
        seen
      } = ratesFn(runtime.P);
      const order = [...runtime.UNIT_ORDER, ...[...seen].filter(k => !runtime.UNIT_ORDER.includes(k))];
      const keys = order.filter((k, i, a) => seen.has(k) && a.indexOf(k) === i);
      const sig = keys.map(k => `${k}:${(rates[k] || 0).toFixed(4)}`).join('|');
      if (root.dataset.signature === sig) return;
      root.dataset.signature = sig;
      if (!keys.length) {
        root.innerHTML = '';
        return;
      }
      root.innerHTML = keys.map(k => `<span class="unitProdChip" title="${runtime.UNITS[k].name}: ${format(rates[k] || 0)}">${runtime.unitImageTag(k, 'prodPortrait')}<b>${format(rates[k] || 0)}</b></span>`).join('');
    };
    window.__ROADLORDS_UNIT_PRODUCTION__.render = newRender;
    runtime.updateHud = (prev => function () {
      const out = prev();
      newRender();
      return out;
    })(runtime.updateHud);
    newRender();
  }
  const brandSmall = document.querySelector('.brand small');
  if (brandSmall) brandSmall.textContent = 'V4.9.51 · P2P 1V1';
  if (runtime.MP?.lobby) {
    const ver = runtime.MP.lobby.querySelector('.menuVersion');
    if (ver) ver.textContent = 'V4.9.51 · P2P';
  }
  document.title = 'Roadlords V4.9.51 – Egységtermelés HUD fix';
  window.__ROADLORDS_VERSION__ = '4.9.51-unit-production-hud-fix';
}
