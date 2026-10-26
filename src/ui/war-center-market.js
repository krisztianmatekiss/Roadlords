import { assetUrl } from '../assets/urls.js';
export function initializeUiWarCenterMarket(runtime) {
  const style = document.createElement('style');
  style.textContent = "@import url(\"" + (assetUrl("styles/features/ui-war-center-market-21.css") + "\");");
  document.head.appendChild(style);
  function pctText(v) {
    const n = Math.round(Math.abs(v) * 1000) / 10;
    if (Math.abs(n) < .05) return '0%';
    return `${v > 0 ? '+' : '−'}${n}%`;
  }
  function modeProfileAt(c, mode) {
    const w = runtime.buildingOf(c, 'warcenter')[0];
    if (!w) return {
      mode,
      costDelta: 0,
      timePenalty: 0,
      speedBonus: 0,
      eliteBonus: 0
    };
    const i = Math.min(2, Math.max(0, w.level - 1));
    const optimized = runtime.hasBranch(c, 'warcenter', 'optimized_economy');
    const total = runtime.hasBranch(c, 'warcenter', 'total_war');
    const advMult = total ? 2 : 1,
      penMult = optimized ? 0 : total ? 2 : 1;
    if (mode === 'economy') return {
      mode,
      costDelta: -[.15, .20, .25][i] * advMult,
      timePenalty: [.20, .25, .30][i] * penMult,
      speedBonus: 0,
      eliteBonus: 0
    };
    if (mode === 'elite') return {
      mode,
      costDelta: [.20, .25, .30][i] * penMult,
      timePenalty: [.20, .25, .30][i] * penMult,
      speedBonus: 0,
      eliteBonus: [.15, .20, .25][i] * advMult
    };
    return {
      mode,
      costDelta: [.15, .20, .25][i] * penMult,
      timePenalty: 0,
      speedBonus: [.20, .30, .40][i] * advMult,
      eliteBonus: 0
    };
  }
  function statClass(value, goodWhenPositive = true) {
    if (Math.abs(value) < 1e-9) return 'neutral';
    const good = goodWhenPositive ? value > 0 : value < 0;
    return good ? 'good' : 'bad';
  }
  function warCardHTML(c, mode, title) {
    const p = modeProfileAt(c, mode),
      active = (c.warMode || 'mass') === mode;
    const rows = [['Egységköltség', p.costDelta, false], ['Képzési seb.', p.speedBonus, true], ['Képzési idő', p.timePenalty, false], ['Életerő', p.eliteBonus, true], ['Sebzés', p.eliteBonus, true]];
    return `<div class="warModeCard ${active ? 'active' : ''}"><div class="warModeTitle">${title}</div><div class="warModeStats">${rows.filter(([,val])=>Math.abs(val)>1e-9).map(([label, val, positiveGood]) => `<div class="warModeStat ${statClass(val, positiveGood)}"><span>${label}</span><b>${pctText(val)}</b></div>`).join('')}</div><button type="button" class="warModePick" data-war-mode="${mode}" title="${active ? 'Aktív képzési mód' : 'Képzési mód kiválasztása'}">✓</button></div>`;
  }
  runtime.warcenterControlsHTML = function (c) {
    return `<div class="warModeControls">${warCardHTML(c, 'mass', '⚙ TÖMEGTERMELÉS')}${warCardHTML(c, 'economy', '◈ TAKARÉKOS')}${warCardHTML(c, 'elite', '★ ELIT')}</div>`;
  };
  const oldSetWarModeV4949 = runtime.setWarMode;
  runtime.setWarMode = function (c, mode, force = false) {
    return oldSetWarModeV4949(c, mode, true);
  };
  runtime.marketControlsHTML = function (c, b) {
    const count = runtime.hasBranch(c, 'market', 'wholesalers') ? 2 : 1;
    return `<div class="marketControls"><div class="boxlabel">KERESKEDELMI ÚTVONAL${count > 1 ? 'AK' : ''}</div>${c.marketRoutes.slice(0, count).map((x, i) => `<div class="marketRoute" data-route="${i}"><select class="marketFrom">${runtime.resourceOptions(x.from)}</select><span>→</span><select class="marketTo">${runtime.resourceOptions(x.to)}</select><button class="marketSave" type="button">MENTÉS</button></div>`).join('')}<small>Az útvonalak bármikor, várakozási idő nélkül módosíthatók.</small></div>`;
  };
  const oldRowsV4949 = runtime.buildingEffectRows;
  runtime.buildingEffectRows = function (c, b) {
    const rows = oldRowsV4949(c, b) || [];
    if (b.type === 'warcenter') return [['Aktív irány', runtime.WAR_MODE_NAMES[c.warMode || 'mass']], ['Globális hatás', runtime.warModeSummary(c)], ['Módváltás', 'azonnal · nincs cooldown']];
    if (b.type === 'market') {
      const out = rows.filter(x => String(x[0]).toLowerCase() !== 'módváltás');
      out.push(['Útvonalváltás', 'azonnal · nincs cooldown']);
      return out;
    }
    return rows;
  };
  function syncStrategyNow() {
    if (typeof runtime.MP === 'undefined' || !runtime.MP?.enabled) return;
    if (runtime.MP.role === 'guest' && typeof runtime.mpSendStrategy === 'function') queueMicrotask(() => runtime.mpSendStrategy(true));else if (runtime.MP.role === 'host' && typeof runtime.mpSendSnapshot === 'function') queueMicrotask(() => runtime.mpSendSnapshot());
  }
  function installInstantMarketHandlers() {
    runtime.$$('.marketRoute').forEach(row => {
      const i = +row.dataset.route,
        from = row.querySelector('.marketFrom'),
        to = row.querySelector('.marketTo'),
        save = row.querySelector('.marketSave');
      if (!save || !from || !to) return;
      save.disabled = false;
      save.onclick = () => {
        if (from.value === to.value) {
          runtime.toast('A két nyersanyag nem lehet azonos.');
          return;
        }
        runtime.P.marketRoutes[i] = {
          from: from.value,
          to: to.value
        };
        runtime.P.marketSwitchAt = runtime.state.time;
        runtime.toast('Új kereskedelmi útvonal beállítva.');
        syncStrategyNow();
        runtime.updateHud();
        runtime.renderInspector();
      };
    });
  }
  const oldRenderInspectorV4949 = runtime.renderInspector;
  runtime.renderInspector = function () {
    const out = oldRenderInspectorV4949();
    const b = runtime.getBuilding(runtime.P, runtime.state.selectedBuilding),
      el = runtime.$('#inspector');
    el?.classList.toggle('warcenterWide', b?.type === 'warcenter');
    if (b?.type === 'market') installInstantMarketHandlers();
    return out;
  };
  runtime.BUILDINGS.warcenter.description = 'Válassz képzési módot: gyorsabb, olcsóbb vagy erősebb egységek.';
  if (runtime.BUILDINGS.market) runtime.BUILDINGS.market.description = 'Másodpercenként 1/2/3 egység kijelölt nyersanyagot vált át egy másikra 60%/75%/90% hatékonysággal. Az útvonal bármikor módosítható.';
  const brandSmall = document.querySelector('.brand small');
  if (brandSmall) brandSmall.textContent = 'V4.9.49 · P2P 1V1';
  if (runtime.MP?.lobby) {
    const ver = runtime.MP.lobby.querySelector('.menuVersion');
    if (ver) ver.textContent = 'V4.9.49 · P2P';
  }
  document.title = 'Roadlords V4.9.49 – Haditermelés + Piac QoL';
  window.__ROADLORDS_VERSION__ = '4.9.49-warcenter-market-qol';
}
