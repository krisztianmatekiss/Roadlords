import { assetUrl } from '../assets/urls.js';
export function initializeUiProductionHud(runtime) {
  const style = document.createElement('style');
  style.textContent = "@import url(\"" + (assetUrl("styles/features/ui-production-hud-22.css") + "\");");
  document.head.appendChild(style);
  const topbar = document.querySelector('.topbar');
  const brand = topbar?.querySelector('.brand');
  const resources = topbar?.querySelector('.resources');
  if (topbar && brand && resources && !topbar.querySelector('.topLeftCluster')) {
    const cluster = document.createElement('div');
    cluster.className = 'topLeftCluster';
    topbar.insertBefore(cluster, brand);
    cluster.append(brand, resources);
    const prod = document.createElement('section');
    prod.id = 'unitProductionHud';
    prod.className = 'unitProductionHud';
    prod.setAttribute('aria-label', 'Egységtermelés másodpercenként');
    prod.innerHTML = '<span class="unitProductionLabel">GYÁRTÁS</span><div id="unitProductionList" class="unitProductionList"><span class="unitProductionEmpty">—</span></div>';
    cluster.appendChild(prod);
  }
  function unitProductionRatesV4950(c) {
    const rates = {};
    const seen = new Set();
    const add = (key, value) => {
      if (!key || !runtime.UNITS[key]) return;
      seen.add(key);
      if (Number.isFinite(value) && value > 0) rates[key] = (rates[key] || 0) + value;else if (!(key in rates)) rates[key] = 0;
    };
    const copyMult = 1;
    for (const b of runtime.activeSpawners(c)) {
      const key = runtime.effectiveUnitKey(c, b);
      const t = runtime.trainingTime(c, b);
      seen.add(key);
      if (Number.isFinite(t) && t > 0 && runtime.productionLineReady(c, b, runtime.productionLines(c, b)[0])) {
        let batch = 1;
        if (key === 'swordsman' && runtime.hasLeg(c, 'swordsman_triple')) batch *= 3;
        if (b.type === 'barracks' && key === 'swordsman' && runtime.hasBranch(c, 'barracks', 'conscription')) batch *= 2;
        add(key, batch / t * copyMult);
        if (runtime.hasLeg(c, 'every10')) add(key, 1 / (10 * t));
      } else add(key, 0);
      if (b.type === 'barracks' && runtime.hasLeg(c, 'barracks_spear')) {
        const et = runtime.extraBarracksTime(c, b, 'spearman');
        seen.add('spearman');
        if (Number.isFinite(et) && et > 0 && runtime.productionRoomFor(c, b) > 0 && runtime.canPay(c, runtime.unitCost(c, 'spearman'))) add('spearman', 1 / et * copyMult);else add('spearman', 0);
      }
      if (b.type === 'barracks' && runtime.hasLeg(c, 'barracks_archer')) {
        const et = runtime.extraBarracksTime(c, b, 'archer');
        seen.add('archer');
        if (Number.isFinite(et) && et > 0 && runtime.productionRoomFor(c, b) > 0 && runtime.canPay(c, runtime.unitCost(c, 'archer'))) add('archer', 1 / et * copyMult);else add('archer', 0);
      }
    }
    if (runtime.hasLeg(c, 'arm_the_people')) {
      const workers = c.buildings.filter(x => ['lumber', 'stonecutter', 'farm'].includes(x.type)).length;
      if (workers) add('swordsman', workers / 40);
    }
    return {
      rates,
      seen
    };
  }
  function formatUnitRateV4950(v) {
    if (!Number.isFinite(v) || v <= 0) return '0/s';
    if (v < .01) return '<0.01/s';
    if (v < 1) return `${v.toFixed(2)}/s`;
    return `${v.toFixed(1)}/s`;
  }
  function renderUnitProductionHudV4950() {
    const root = runtime.$('#unitProductionList');
    if (!root) return;
    const {
      rates,
      seen
    } = unitProductionRatesV4950(runtime.P);
    const order = [...runtime.UNIT_ORDER, ...[...seen].filter(k => !runtime.UNIT_ORDER.includes(k))];
    const keys = order.filter((k, i, a) => seen.has(k) && a.indexOf(k) === i);
    const sig = keys.map(k => `${k}:${(rates[k] || 0).toFixed(4)}`).join('|');
    if (root.dataset.signature === sig) return;
    root.dataset.signature = sig;
    if (!keys.length) {
      root.innerHTML = '<span class="unitProductionEmpty">Nincs egységgyártás</span>';
      return;
    }
    root.innerHTML = keys.map(k => {
      const rate = rates[k] || 0;
      return `<span class="unitProdChip" title="${runtime.UNITS[k].name}: ${formatUnitRateV4950(rate)}">${runtime.unitImageTag(k, 'prodPortrait')}<b>${formatUnitRateV4950(rate)}</b></span>`;
    }).join('');
  }
  const oldUpdateHudV4950 = runtime.updateHud;
  runtime.updateHud = function () {
    const out = oldUpdateHudV4950();
    renderUnitProductionHudV4950();
    return out;
  };
  renderUnitProductionHudV4950();
  const brandSmall = document.querySelector('.brand small');
  if (brandSmall) brandSmall.textContent = 'V4.9.50 · P2P 1V1';
  if (runtime.MP?.lobby) {
    const ver = runtime.MP.lobby.querySelector('.menuVersion');
    if (ver) ver.textContent = 'V4.9.50 · P2P';
  }
  document.title = 'Roadlords V4.9.50 – Egységtermelés HUD';
  window.__ROADLORDS_VERSION__ = '4.9.50-unit-production-hud';
  window.__ROADLORDS_UNIT_PRODUCTION__ = {
    unitProductionRates: unitProductionRatesV4950,
    render: renderUnitProductionHudV4950
  };
}
