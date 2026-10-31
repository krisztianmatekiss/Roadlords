import { assetUrl } from '../assets/urls.js';
import { bindInspectorDrag, fitInspectorWindow, inspectorViewport } from './inspector-window.js';
export function initializeUiMultipleInspectors(runtime) {
  const VERSION_LABEL = 'V4.9.59 · P2P 1V1';
  runtime.state.openBuildingInspectors = Array.isArray(runtime.state.openBuildingInspectors) ? runtime.state.openBuildingInspectors : [];
  runtime.state.buildingInspectorPos = runtime.state.buildingInspectorPos || {};
  runtime.state.buildingInspectorZ = runtime.state.buildingInspectorZ || {};
  runtime.state.buildingInspectorZCounter = Number(runtime.state.buildingInspectorZCounter) || 9200;
  const windows = new Map();
  runtime.rotationOptions = function (type) {
    return [0, 1, 2, 3];
  };
  function ensureBuildingInspectorLayer() {
    let layer = document.getElementById('buildingInspectorLayer');
    if (!layer) {
      layer = document.createElement('div');
      layer.id = 'buildingInspectorLayer';
      document.body.appendChild(layer);
    }
    return layer;
  }
  function focusBuildingInspector(id) {
    runtime.state.buildingInspectorZCounter = (Number(runtime.state.buildingInspectorZCounter) || 9200) + 1;
    runtime.state.buildingInspectorZ[id] = runtime.state.buildingInspectorZCounter;
  }
  function closeBuildingWindow(id) {
    runtime.state.openBuildingInspectors = runtime.state.openBuildingInspectors.filter(x => x !== id);
    delete runtime.state.buildingInspectorPos[id];
    delete runtime.state.buildingInspectorZ[id];
  }
  function closeAllBuildingWindows() {
    runtime.state.openBuildingInspectors = [];
    runtime.state.buildingInspectorPos = {};
    runtime.state.buildingInspectorZ = {};
  }
  function defaultBuildingInspectorPos(id, index, win) {
    const anchor = document.querySelector(`#playerGrid .buildingHitCell[data-id="${id}"]`) || document.querySelector(`#playerGrid .building[data-id="${id}"]`);
    const cascade = index * 24;
    if (anchor) {
      const r = anchor.getBoundingClientRect(),
        w = win.getBoundingClientRect().width,
        h = win.getBoundingClientRect().height,
        gap = 12;
      let left = r.right + gap + cascade;
      if (left + w > window.innerWidth - 12) left = r.left - w - gap - cascade;
      const top = r.top + r.height / 2 - h / 2 + cascade;
      return {
        left: Math.round(left),
        top: Math.round(top)
      };
    }
    return {
      left: 30 + cascade,
      top: inspectorViewport().top + cascade
    };
  }
  function openBuildingInspector(id) {
    const b = runtime.getBuilding(runtime.P, id);
    if (!b) return;
    if (!runtime.state.openBuildingInspectors.includes(id)) runtime.state.openBuildingInspectors.push(id);
    focusBuildingInspector(id);
    runtime.state.selectedBuild = null;
    runtime.state.selectedBuilding = null;
    const base = runtime.$('#inspector');
    if (base) {
      base.classList.remove('show');
      base.innerHTML = '';
    }
    runtime.renderStatic();
  }
  function buildingUpgradeNoteHTML(b, d) {
    if (b.type === 'merc_tent') return 'A <b>Zsoldos sátor</b> nem épületszintekkel fejlődik. A bérelt csapatok minőségét a szerződés-irányok mozgatják fel vagy le.';
    if (b.type === 'alchemist') return 'Az Alkimista kunyhó nem fejleszthető.';
    if (b.level < 4) return `A következő szint külön <b>${d.name} ${b.level === 1 ? 'II' : b.level === 2 ? 'III' : 'IV'}</b> fejlesztési kártyaként jelenhet meg.`;
    return 'Elérte a legmagasabb technológiai szintet.';
  }
  function buildingInspectorSpecialHTML(b) {
    let html = runtime.redesignBuildingControls?.(runtime.P,b)||'';
    if (b.type === 'market') html += runtime.marketControlsHTML(runtime.P, b);else if (b.type === 'rally') html += runtime.rallyControlsHTML(runtime.P);else if (b.type === 'warcenter') html += runtime.warcenterControlsHTML(runtime.P);
    if (b.type === 'academy' && window.__ROADLORDS_V4953__?.academyControlsHTML) html += window.__ROADLORDS_V4953__.academyControlsHTML(runtime.P);
    if (b.type === 'keep' && runtime.hasLeg(runtime.P, 'capital_studies') && window.__ROADLORDS_V4953__?.capitalStudyControlsHTML) html += window.__ROADLORDS_V4953__.capitalStudyControlsHTML(runtime.P);
    if (b.type === 'merc_tent' && window.__ROADLORDS_V4956__?.mercControlsHTML) html += window.__ROADLORDS_V4956__.mercControlsHTML(runtime.P, b);
    if (typeof alchemistControlsHTML === 'function' && b.type === 'alchemist') html += alchemistControlsHTML(runtime.P, b);
    return html;
  }
  function buildingInspectorCardHTML(b) {
    const d = runtime.buildingDefinition?.(runtime.P,b.type) || runtime.BUILDINGS[b.type],
      unitKey = d.unit ? runtime.effectiveUnitKey(runtime.P, b) : null,
      u = unitKey ? runtime.UNITS[unitKey] : null,
      rows = runtime.buildingEffectRows(runtime.P, b);
    const description = runtime.redesignDescriptions?.[b.type]?.(runtime.P, b.level) || d.description;
    const effects = rows.length ? `<div class="effectbox compactEffects"><div class="boxlabel">AKTUÁLIS HATÁS</div>${rows.map(([label, value]) => `<div class="istat"><span>${label}</span><b>${value}</b></div>`).join('')}</div>` : '';
    const unitPanel = u ? `<div class="spawnCompact"><div class="unitPortraitFrame">${runtime.unitImageTag(unitKey)}</div><div class="unitSummary"><div class="unitTitle"><b>${u.name}</b><span>Gyártási idő · ${runtime.trainingTime(runtime.P, b).toFixed(1)} mp</span></div>${runtime.unitStatsHTML(runtime.P, unitKey)}</div></div>` : '';
    return `<div class="inspectorCard"><div class="ihead"><div><small>${runtime.CATEGORY_NAMES[d.category] || d.category.toUpperCase()} · ${runtime.footprintText(b.type, b.rotation || 0)} · L${b.level}</small><h3>${d.name}</h3></div><div class="multiInspectorButtons"><button class="closeAllInspectors" type="button" title="Összes ablak bezárása">✕✕</button><button class="closeSingleInspector" type="button" title="Ablak bezárása">✕</button></div></div><p class="idesc">${description}</p>${effects}${buildingInspectorSpecialHTML(b)}${unitPanel}<div class="upgradeNote">${buildingUpgradeNoteHTML(b, d)}</div><div class="iactions">${b.type !== 'keep' ? '<button class="demolish" data-action="demolish" type="button">BONTÁS</button>' : ''}</div></div>`;
  }
  function bindBuildingInspectorWindow(win, b) {
    win.querySelector('.closeSingleInspector')?.addEventListener('click', e => {
      e.stopPropagation();
      closeBuildingWindow(b.id);
      runtime.renderStatic();
    });
    win.querySelector('.closeAllInspectors')?.addEventListener('click', e => {
      e.stopPropagation();
      closeAllBuildingWindows();
      runtime.renderStatic();
    });
    win.querySelector('[data-action="demolish"]')?.addEventListener('click', () => {
      runtime.demolish(runtime.P, b.id);
      closeBuildingWindow(b.id);
      runtime.toast(`${runtime.BUILDINGS[b.type].name} lebontva · 50% visszatérítés.`);
      runtime.renderStatic();
    });
    win.querySelectorAll('.rallyControls [data-rally]').forEach(x => x.onclick = () => {
      runtime.setRallyMode(runtime.P, x.dataset.rally);
      runtime.renderStatic();
    });
    win.querySelectorAll('.warModeControls [data-war-mode]').forEach(x => x.onclick = () => {
      runtime.setWarMode(runtime.P, x.dataset.warMode);
      runtime.renderStatic();
    });
    win.querySelectorAll('.marketRoute').forEach(row => {
      const i = +row.dataset.route,
        from = row.querySelector('.marketFrom'),
        to = row.querySelector('.marketTo'),
        save = row.querySelector('.marketSave');
      if (save) save.onclick = () => {
        if (runtime.state.time - runtime.P.marketSwitchAt < 20) {
          runtime.toast('A kereskedelmi útvonal még nem módosítható.');
          return;
        }
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
        runtime.renderStatic();
      };
    });
    win.querySelectorAll('[data-academy-stat]').forEach(btn => btn.onclick = () => window.__ROADLORDS_V4953__?.buyAcademyStack(runtime.P, btn.dataset.academyStat));
    const capBuy = win.querySelector('#capitalStudyBuy');
    if (capBuy) capBuy.onclick = () => window.__ROADLORDS_V4953__?.buyCapitalStudy(runtime.P, true);
    const capAuto = win.querySelector('#capitalStudyAuto');
    if (capAuto) capAuto.onclick = () => {
      runtime.P.capitalStudyAuto = !runtime.P.capitalStudyAuto;
      runtime.toast(`Haditanulmányok automata: ${runtime.P.capitalStudyAuto ? 'BE' : 'KI'}.`);
      runtime.renderStatic();
    };
    win.querySelectorAll('[data-merc-hire]').forEach(btn => btn.onclick = () => window.__ROADLORDS_V4956__?.hireMercs(runtime.P, btn.dataset.mercHire, false, b?.id || btn.dataset.mercBuilding || null));
    win.querySelectorAll('[data-merc-auto]').forEach(btn => btn.onclick = () => {
      const dir = btn.dataset.mercAuto;
      runtime.P.mercAuto = runtime.P.mercAuto === dir ? null : dir;
      const lab = window.__ROADLORDS_V4956__?.MERC_LABEL || {};
      runtime.toast(`Zsoldos automata: ${runtime.P.mercAuto ? lab[runtime.P.mercAuto] || runtime.P.mercAuto : 'KI'}.`);
      runtime.renderStatic();
      runtime.updateHud();
    });
  }
  function renderBuildingInspectors() {
    const layer = ensureBuildingInspectorLayer(),
      valid = [];
    for (const id of runtime.state.openBuildingInspectors) {
      if (runtime.getBuilding(runtime.P, id)) valid.push(id);
    }
    runtime.state.openBuildingInspectors = valid;
    for (const [id, entry] of windows) {
      if (valid.includes(id)) continue;
      entry.observer.disconnect();
      entry.drag.cancel();
      entry.win.remove();
      windows.delete(id);
      delete runtime.state.buildingInspectorPos[id];
      delete runtime.state.buildingInspectorZ[id];
    }
    if (!valid.length) {
      layer.classList.remove('show');
      return;
    }
    layer.classList.add('show');
    valid.forEach((id, index) => {
      const b = runtime.getBuilding(runtime.P, id);
      if (!b) return;
      if (!runtime.state.buildingInspectorZ[id]) focusBuildingInspector(id);
      let entry = windows.get(id);
      if (!entry) {
        const win = document.createElement('section');
        win.className = 'buildingInspectorWindow';
        win.dataset.id = id;
        win.setAttribute('role', 'dialog');
        const keepInside = () => {
          runtime.state.buildingInspectorPos[id] = fitInspectorWindow(win, runtime.state.buildingInspectorPos[id]);
        };
        const drag = bindInspectorDrag(win, {
          onMove: pos => { runtime.state.buildingInspectorPos[id] = pos; },
        });
        win.addEventListener('pointerdown', () => {
          focusBuildingInspector(id);
          win.style.zIndex = String(runtime.state.buildingInspectorZ[id]);
        });
        const observer = new ResizeObserver(keepInside);
        entry = { win, drag, observer, keepInside };
        windows.set(id, entry);
        layer.appendChild(win);
        observer.observe(win);
      }
      const win = entry.win;
      win.style.zIndex = String(runtime.state.buildingInspectorZ[id] || 9200 + index);
      win.classList.toggle('warcenterWide', b.type === 'warcenter');
      win.setAttribute('aria-label', (runtime.buildingDefinition?.(runtime.P,b.type) || runtime.BUILDINGS[b.type]).name);
      // Keep pointer capture, open controls and the reading position during refresh.
      const editing = win.contains(document.activeElement) &&
        document.activeElement.matches('input,select,textarea,[contenteditable="true"]');
      if (!win.classList.contains('dragging') && !editing) {
        const scroll = win.querySelector('.inspectorCard')?.scrollTop || 0;
        win.innerHTML = buildingInspectorCardHTML(b);
        bindBuildingInspectorWindow(win, b);
        win.querySelector('.inspectorCard').scrollTop = scroll;
      }
      fitInspectorWindow(win);
      if (!runtime.state.buildingInspectorPos[id]) runtime.state.buildingInspectorPos[id] = defaultBuildingInspectorPos(id, index, win);
      entry.keepInside();
    });
  }
  const oldRenderInspectorV4959 = runtime.renderInspector;
  runtime.renderInspector = function () {
    if (runtime.state.selectedTowerId || runtime.getBuilding(runtime.E, runtime.state.selectedBuilding)) {
      renderBuildingInspectors();
      return oldRenderInspectorV4959();
    }
    const el = runtime.$('#inspector');
    if (el) {
      el.classList.remove('show');
      el.innerHTML = '';
    }
    renderBuildingInspectors();
  };
  const oldRenderCityV4959 = runtime.renderCity;
  runtime.renderCity = function (container, c, interactive) {
    const out = oldRenderCityV4959(container, c, interactive);
    if (container) {
      container.querySelectorAll('.building[data-id]').forEach(el => {
        const b = runtime.getBuilding(c, el.dataset.id);
        if (!b) return;
        el.dataset.btype = b.type;
        if (interactive && runtime.state.openBuildingInspectors.includes(b.id)) el.classList.add('selected');
      });
      if (interactive) {
        container.querySelectorAll('.buildingHitCell[data-id]').forEach(hit => {
          const b = runtime.getBuilding(c, hit.dataset.id);
          if (!b) return;
          hit.onclick = e => {
            if (runtime.state.selectedBuild) {
              runtime.tryPlace(+hit.dataset.r, +hit.dataset.c);
              return;
            }
            e.stopPropagation();
            runtime.clearPlacementPreview();
            openBuildingInspector(b.id);
          };
        });
      }
    }
    return out;
  };
  const oldRenderStaticV4959 = runtime.renderStatic;
  runtime.renderStatic = function () {
    const out = oldRenderStaticV4959();
    renderBuildingInspectors();
    return out;
  };
  const oldCloseBuildingInspectorV4959 = runtime.closeBuildingInspector;
  runtime.closeBuildingInspector = function () {
    runtime.state.selectedBuilding = null;
    const el = runtime.$('#inspector');
    if (el) {
      el.classList.remove('show');
      el.innerHTML = '';
    }
    if (typeof oldCloseBuildingInspectorV4959 === 'function') try {
      oldCloseBuildingInspectorV4959();
    } catch (_) {}
  };
  const fitWindows = () => { for (const entry of windows.values()) entry.keepInside(); };
  for (const event of ['resize', 'roadlords:ui-scale']) window.addEventListener(event, fitWindows);
  window.visualViewport?.addEventListener('resize', fitWindows);
  window.addEventListener('blur', () => { for (const entry of windows.values()) entry.drag.cancel(); });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !runtime.state.modal && runtime.state.openBuildingInspectors?.length) {
      const last = runtime.state.openBuildingInspectors[runtime.state.openBuildingInspectors.length - 1];
      closeBuildingWindow(last);
      runtime.renderStatic();
    }
  }, true);
  const style = document.createElement('style');
  style.textContent = "@import url(\"" + (assetUrl("styles/features/ui-multiple-inspectors-28.css") + "\");");
  document.head.appendChild(style);
  const brandSmall = document.querySelector('.brand small');
  if (brandSmall) brandSmall.textContent = VERSION_LABEL;
  if (runtime.MP?.lobby) {
    const ver = runtime.MP.lobby.querySelector('.menuVersion');
    if (ver) ver.textContent = 'V4.9.59 · P2P';
  }
  document.title = 'Roadlords V4.9.59 – Inspector & art fix';
  window.__ROADLORDS_VERSION__ = '4.9.59-inspector-rotation-artfix';
}
