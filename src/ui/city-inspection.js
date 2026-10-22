import { assetUrl } from '../assets/urls.js';
export function initializeUiCityInspection(runtime) {
  runtime.v492RenderCity = runtime.renderCity;
  runtime.renderCity = function (container, c, interactive) {
    const fullSignature = !interactive && container ? `${runtime.cityVisualSignature(c)}§icons:${runtime.state.visualHints ? 1 : 0}§selected:${runtime.state.selectedBuilding || ''}` : '';
    if (!interactive && container?.dataset.v492FullSignature === fullSignature) return;
    runtime.v492RenderCity(container, c, interactive);
    if (interactive || !container) return;
    container.querySelectorAll('.enemyBuildingHit').forEach(x => x.remove());
    for (const b of c.buildings) {
      const el = container.querySelector(`.building[data-id="${b.id}"]`);
      if (!el) continue;
      if (runtime.state.selectedBuilding === b.id) el.classList.add('selected');
      for (const [row, col] of runtime.buildingCells(b)) {
        const hit = document.createElement('button');
        hit.type = 'button';
        hit.className = 'buildingHitCell enemyBuildingHit';
        hit.dataset.r = row;
        hit.dataset.c = col;
        hit.dataset.id = b.id;
        hit.style.gridRow = row + 1;
        hit.style.gridColumn = col + 1;
        hit.setAttribute('aria-label', `${runtime.BUILDINGS[b.type]?.name || b.type}, ${b.level}. szint, ellenfél`);
        hit.onmouseenter = () => el.classList.add('footprintHover');
        hit.onmouseleave = () => el.classList.remove('footprintHover');
        hit.onclick = e => {
          e.stopPropagation();
          runtime.state.selectedBuild = null;
          runtime.state.selectedBuilding = b.id;
          runtime.clearPlacementPreview();
          runtime.renderStatic();
        };
        container.appendChild(hit);
      }
    }
    container.dataset.v492FullSignature = fullSignature;
  };
  runtime.v492RenderInspector = runtime.renderInspector;
  runtime.renderInspector = function () {
    const b = runtime.getBuilding(runtime.E, runtime.state.selectedBuilding);
    if (!b) return runtime.v492RenderInspector();
    const el = runtime.$('#inspector'),
      d = runtime.buildingDefinition?.(runtime.E,b.type) || runtime.BUILDINGS[b.type],
      unitKey = d.unit ? runtime.effectiveUnitKey(runtime.E, b) : null,
      u = unitKey ? runtime.UNITS[unitKey] : null,
      rows = runtime.buildingEffectRows(runtime.E, b);
    const effects = rows.length ? `<div class="effectbox compactEffects"><div class="boxlabel">AKTUÁLIS HATÁS</div>${rows.map(([label, value]) => `<div class="istat"><span>${label}</span><b>${value}</b></div>`).join('')}</div>` : '';
    const unitPanel = u ? `<div class="spawnCompact"><div class="unitPortraitFrame">${runtime.unitImageTag(unitKey)}</div><div class="unitSummary"><div class="unitTitle"><b>${u.name}</b><span>Gyártási idő · ${runtime.trainingTime(runtime.E, b).toFixed(1)} mp</span></div>${runtime.unitStatsHTML(runtime.E, unitKey)}</div></div>` : '';
    el.classList.add('show');
    el.innerHTML = `<div class="inspectorCard"><div class="ihead"><div><small>ELLENFÉL · ${runtime.CATEGORY_NAMES[d.category] || d.category.toUpperCase()} · ${runtime.footprintText(b.type, b.rotation || 0)} · L${b.level}</small><h3>${d.name}</h3></div><button id="closeInspector" aria-label="Bezárás">✕</button></div><p class="idesc">${d.description}</p>${effects}${unitPanel}<div class="upgradeNote">Az ellenfél épülete · csak megtekinthető.</div></div>`;
    runtime.$('#closeInspector').onclick = e => {
      e?.stopPropagation?.();
      runtime.state.selectedBuilding = null;
      runtime.renderStatic();
    };
    requestAnimationFrame(runtime.positionInspector);
  };
  runtime.v492PositionInspector = runtime.positionInspector;
  runtime.positionInspector = function () {
    const b = runtime.getBuilding(runtime.E, runtime.state.selectedBuilding),
      el = runtime.$('#inspector');
    if (!b) return runtime.v492PositionInspector();
    if (!el?.classList.contains('show')) return;
    const anchor = runtime.$(`#enemyGrid .building[data-id="${b.id}"]`);
    if (!anchor) return;
    const r = anchor.getBoundingClientRect(),
      w = el.offsetWidth || 310,
      h = el.offsetHeight || 260,
      gap = 10;
    let left = r.left - w - gap;
    if (left < 10) left = r.right + gap;
    left = runtime.clamp(left, 10, window.innerWidth - w - 10);
    const top = runtime.clamp(r.top + r.height / 2 - h / 2, 74, window.innerHeight - h - 10);
    el.style.left = Math.round(left) + 'px';
    el.style.top = Math.round(top) + 'px';
  };
  runtime.v490InstallToggle();
  runtime.renderStatic();
}
