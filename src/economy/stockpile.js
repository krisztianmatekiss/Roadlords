import { assetUrl } from '../assets/urls.js';
export function initializeEconomyStockpile(runtime) {
  const STOCKPILE_LEGEND = 'stockpile_production';
  const STOCKPILE_STEP = 500;
  const STOCKPILE_SPEED = .03;
  function storedTotal(c) {
    return runtime.RES.reduce((sum, r) => sum + (Number(c.resources?.[r]) || 0), 0);
  }
  function stockpileStacks(c) {
    return Math.floor(storedTotal(c) / STOCKPILE_STEP);
  }
  function stockpileSpeedMult(c) {
    return 1 + stockpileStacks(c) * STOCKPILE_SPEED;
  }
  if (!runtime.LEGENDARY.some(x => x.id === STOCKPILE_LEGEND)) {
    runtime.LEGENDARY.push({
      id: STOCKPILE_LEGEND,
      icon: '📦',
      name: 'Felhalmozott készletek',
      description: 'Minden teljes 150 jelenleg tárolt össznyersanyag után minden katonai termelő +3% gyártási sebességet kap.',
      eligible: s => runtime.hasSpawner(s)
    });
  }
  runtime.PICK_IMAGES[STOCKPILE_LEGEND] = runtime.PICK_IMAGES.production || runtime.PICK_IMAGES.spawn_speed || runtime.PICK_IMAGES.all_as;
  const oldTrainingSpeedV4937 = runtime.trainingSpeedBonus;
  runtime.trainingSpeedBonus = function (c, b, key) {
    let speed = oldTrainingSpeedV4937(c, b, key);
    if (!speed) return speed;
    if (runtime.hasLeg(c, STOCKPILE_LEGEND)) speed *= stockpileSpeedMult(c);
    return speed;
  };
  const oldRenderRelicsV4937 = runtime.renderRelics;
  runtime.renderRelics = function () {
    oldRenderRelicsV4937();
    const root = runtime.$('#relicList');
    if (!root || !runtime.hasLeg(runtime.P, STOCKPILE_LEGEND)) return;
    const items = [...root.querySelectorAll('.relicitem.legendary')];
    const item = items.find(x => x.textContent.includes('Felhalmozott készletek'));
    if (item) {
      const stacks = stockpileStacks(runtime.P),
        total = Math.floor(storedTotal(runtime.P)),
        bonus = stacks * 3,
        next = (stacks + 1) * STOCKPILE_STEP;
      item.innerHTML = `<b>📦 Felhalmozott készletek</b>Minden teljes 500 tárolt össznyersi után +3% katonai gyártási sebesség.<br><small>Most: ${total} nyersi · ${stacks} stack · +${bonus}% · következő: ${next}</small>`;
    }
  };
  const style = document.createElement('style');
  style.textContent = "@import url(\"" + (assetUrl("styles/features/economy-stockpile-16.css") + "\");");
  document.head.appendChild(style);
  function clearSameTypeHighlight() {
    document.querySelectorAll('#playerGrid .sameTypeFootprintHighlight').forEach(x => x.classList.remove('sameTypeFootprintHighlight'));
    document.querySelectorAll('#playerGrid .sameTypeSourceHighlight').forEach(x => x.classList.remove('sameTypeSourceHighlight'));
  }
  function highlightSameTypeNeighbors(type) {
    clearSameTypeHighlight();
    if (!type || !runtime.BUILDINGS[type]) return;
    for (const b of runtime.buildingOf(runtime.P, type)) {
      const bel = runtime.$(`#playerGrid .building[data-id="${b.id}"]`);
      if (bel) bel.classList.add('sameTypeSourceHighlight');
      document.querySelectorAll(`#playerGrid .buildingHitCell[data-id="${b.id}"]`).forEach(cell => cell.classList.add('sameTypeFootprintHighlight'));
    }
  }
  function bindBuildHoverV4937() {
    runtime.$$('#buildList .buildcard').forEach(card => {
      if (card.dataset.v4937HoverBound) return;
      card.dataset.v4937HoverBound = '1';
      card.addEventListener('mouseenter', () => highlightSameTypeNeighbors(card.dataset.k));
      card.addEventListener('mouseleave', clearSameTypeHighlight);
      card.addEventListener('focus', () => highlightSameTypeNeighbors(card.dataset.k));
      card.addEventListener('blur', clearSameTypeHighlight);
    });
  }
  const oldRenderBuildListV4937 = runtime.renderBuildList;
  runtime.renderBuildList = function () {
    const out = oldRenderBuildListV4937();
    bindBuildHoverV4937();
    return out;
  };
  let nameTip = document.getElementById('buildingNameHoverV4937');
  if (!nameTip) {
    nameTip = document.createElement('div');
    nameTip.id = 'buildingNameHoverV4937';
    document.body.appendChild(nameTip);
  }
  function buildingForHit(hit) {
    const grid = hit?.closest?.('.citygrid');
    if (!grid) return null;
    const c = grid.id === 'enemyGrid' ? runtime.E : runtime.P;
    const b = runtime.getBuilding(c, hit.dataset.id);
    return b ? {
      c,
      b
    } : null;
  }
  function showBuildingTip(hit, e) {
    if (runtime.state.selectedBuild && hit.closest('#playerGrid')) return;
    const found = buildingForHit(hit);
    if (!found) return;
    const d = runtime.BUILDINGS[found.b.type];
    if (!d) return;
    nameTip.textContent = `${d.name} · L${found.b.level}`;
    nameTip.style.display = 'block';
    moveBuildingTip(e);
  }
  function moveBuildingTip(e) {
    if (nameTip.style.display !== 'block') return;
    const pad = 12,
      w = nameTip.offsetWidth || 120,
      h = nameTip.offsetHeight || 24;
    let x = e.clientX + 14,
      y = e.clientY - 30;
    if (x + w > window.innerWidth - pad) x = e.clientX - w - 14;
    if (y < pad) y = e.clientY + 16;
    nameTip.style.left = Math.round(x) + 'px';
    nameTip.style.top = Math.round(y) + 'px';
  }
  function hideBuildingTip() {
    nameTip.style.display = 'none';
  }
  for (const gridId of ['playerGrid', 'enemyGrid']) {
    const grid = runtime.$('#' + gridId);
    if (!grid) continue;
    grid.addEventListener('mouseover', e => {
      const hit = e.target.closest('.buildingHitCell');
      if (hit && grid.contains(hit)) showBuildingTip(hit, e);
    });
    grid.addEventListener('mousemove', e => {
      const hit = e.target.closest('.buildingHitCell');
      if (hit && grid.contains(hit)) moveBuildingTip(e);
    });
    grid.addEventListener('mouseout', e => {
      const hit = e.target.closest('.buildingHitCell');
      if (hit && grid.contains(hit) && !hit.contains(e.relatedTarget)) hideBuildingTip();
    });
  }
  if (typeof runtime.scoreAiChoiceV17 === 'function') {
    const oldScoreAiStockV4937 = runtime.scoreAiChoiceV17;
    runtime.scoreAiChoiceV17 = function (o) {
      let s = oldScoreAiStockV4937(o);
      if (o?.kind === 'legendary' && o.id === STOCKPILE_LEGEND) s += Math.min(8, runtime.activeSpawners(runtime.E).length * .8 + stockpileStacks(runtime.E) * .35);
      return s;
    };
  }
  window.__ROADLORDS_STOCKPILE__ = {
    storedTotal,
    stockpileStacks,
    stockpileSpeedMult
  };
  window.__ROADLORDS_VERSION__ = '4.9.37-stockpile-hover-qol';
  if (runtime.MP?.lobby) {
    const ver = runtime.MP.lobby.querySelector('.menuVersion');
    if (ver) ver.textContent = 'V4.9.37 · P2P';
  }
  runtime.$('.brand small').textContent = 'V4.9.37 · P2P 1V1';
  bindBuildHoverV4937();
}
