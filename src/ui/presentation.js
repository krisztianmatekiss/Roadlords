import { assetUrl } from '../assets/urls.js';
export function register(runtime) {
  runtime.protectedPickControl = function protectedPickControl(target) {
    return target?.closest?.('#choiceList .choice,#rerollChoice,#banChoice,#skipChoice');
  };
  runtime.renderChoiceContext = function renderChoiceContext() {
    const c = runtime.state.choiceContext;
    if (!c) return;
    runtime.armChoiceInputGuard(c);
    runtime.renderChoice(c.opts, c.kicker, c.title, c.desc, c.legendary);
  };
  runtime.clearPlacementPreview = function clearPlacementPreview(forgetAnchor = true) {
    document.querySelectorAll('#playerGrid .plot.preview,#playerGrid .plot.blocked').forEach(x => x.classList.remove('preview', 'blocked'));
    document.querySelectorAll('#playerGrid .placementGhostCell,#playerGrid .placementBuildingGhost').forEach(x => x.remove());
    if (forgetAnchor) runtime.state.placementHover = null;
  };
  runtime.previewPlacement = function previewPlacement(row, col) {
    runtime.clearPlacementPreview(false);
    if (!runtime.state.selectedBuild) return;
    const type = runtime.state.selectedBuild,
      rotation = runtime.normalizedRotation(type, runtime.state.buildRotation),
      grid = runtime.$('#playerGrid'),
      occ = runtime.occupancy(runtime.P),
      shape = runtime.rotatedShape(type, rotation),
      origin = runtime.placementOrigin(type, rotation, row, col),
      bounds = runtime.shapeBounds(type, rotation);
    runtime.state.placementHover = {
      row,
      col
    };
    runtime.state.lastPlacementHover = {
      row,
      col
    };
    const inBounds = shape.every(([dr, dc]) => origin.row + dr >= 0 && origin.col + dc >= 0 && origin.row + dr < runtime.GRID && origin.col + dc < runtime.GRID);
    if (origin.row >= 0 && origin.col >= 0 && origin.row + bounds.h <= runtime.GRID && origin.col + bounds.w <= runtime.GRID) {
      const visual = document.createElement('span');
      visual.className = 'building placementBuildingGhost';
      visual.dataset.previewRotation = rotation;
      visual.style.gridRow = `${origin.row + 1} / span ${bounds.h}`;
      visual.style.gridColumn = `${origin.col + 1} / span ${bounds.w}`;
      visual.innerHTML = runtime.buildingSpriteHTML(type, rotation, bounds);
      grid.appendChild(visual);
    }
    for (const [dr, dc] of shape) {
      const r = origin.row + dr,
        c = origin.col + dc,
        inGrid = r >= 0 && c >= 0 && r < runtime.GRID && c < runtime.GRID;
      if (!inGrid) continue;
      const cellOk = inBounds && !occ.has(runtime.idx(r, c)) && !runtime.terrainBlocks(runtime.P, r, c),
        ghost = document.createElement('span');
      ghost.className = `placementGhostCell ${cellOk ? 'valid' : 'invalid'}${r === row && c === col ? ' anchor' : ''}`;
      ghost.style.gridRow = r + 1;
      ghost.style.gridColumn = c + 1;
      grid.appendChild(ghost);
    }
  };
  runtime.rotateSelectedBuild = function rotateSelectedBuild() {
    if (!runtime.state.selectedBuild || runtime.rotationOptions(runtime.state.selectedBuild).length < 2) return;
    const hover = runtime.state.placementHover || runtime.state.lastPlacementHover;
    runtime.state.buildRotation = runtime.nextRotation(runtime.state.selectedBuild, runtime.state.buildRotation);
    runtime.clearPlacementPreview(false);
    runtime.renderBuildList();
    if (hover) requestAnimationFrame(() => runtime.previewPlacement(hover.row, hover.col));
  };
  runtime.showTerrainTooltip = function showTerrainTooltip(def, t, e) {
    runtime.terrainTooltip.innerHTML = runtime.terrainTooltipHtml(def, t);
    runtime.terrainTooltip.classList.add('show');
    runtime.moveTerrainTooltip(e);
  };
  runtime.hideTerrainTooltip = function hideTerrainTooltip() {
    runtime.terrainTooltip.classList.remove('show');
  };
  runtime.tryPlace = function tryPlace(row, col) {
    if (!runtime.state.selectedBuild) {
      runtime.toast('Előbb válassz épületet az alsó sávból.');
      return;
    }
    const origin = runtime.placementOrigin(runtime.state.selectedBuild, runtime.state.buildRotation, row, col),
      r = runtime.placeBuilding(runtime.P, runtime.state.selectedBuild, origin.row, origin.col, runtime.state.buildRotation);
    if (!r.ok) {
      runtime.toast(r.reason);
      return;
    }
    runtime.state.selectedBuilding = null;
    runtime.state.selectedBuild = null;
    runtime.state.buildRotation = 0;
    runtime.clearPlacementPreview();
    runtime.toast(`${runtime.BUILDINGS[r.building.type].name} elkészült${r.foundationUsed ? ' · Régi alapozás: −50% költség' : ''}.`);
    runtime.renderStatic();
  };
  runtime.renderStatic = function renderStatic() {
    runtime.renderCity(runtime.$('#playerGrid'), runtime.P, true);
    runtime.renderCity(runtime.$('#enemyGrid'), runtime.E, false);
    runtime.renderBuildList();
    runtime.renderInspector();
    runtime.updateHud();
  };
  runtime.updateProgress = function updateProgress() {
    for (const [c, id] of [[runtime.P, 'playerGrid'], [runtime.E, 'enemyGrid']]) for (const b of c.buildings) {
      const el = runtime.$(`#${id} [data-id="${b.id}"] .bprog`);
      if (el) el.style.width = Math.round((b.progress || 0) * 100) + '%';
    }
  };
  runtime.toast = function toast(text) {
    const t = runtime.$('#toast');
    t.textContent = text;
    t.classList.add('show');
    clearTimeout(runtime.toast._t);
    runtime.toast._t = setTimeout(() => t.classList.remove('show'), 1600);
  };
  runtime.message = function message(text, dur = 3) {
    runtime.$('#battleMsg').textContent = text;
    runtime.message._left = dur;
  };
  runtime.renderBattle = function renderBattle(dt) {
    runtime.drawGround();
    runtime.strokeRoad(104, '#151c17');
    runtime.strokeRoad(94, '#6f6858');
    runtime.strokeRoad(82, '#a69a79');
    runtime.ctx.setLineDash([8, 13]);
    runtime.strokeRoad(1, '#e2d5b56b');
    runtime.ctx.setLineDash([]);
    for (const t of runtime.towers) runtime.drawTower(t);
    runtime.drawProjectiles(dt);
    const units = [...runtime.state.units].sort((a, b) => runtime.pointAt(a.lane, a.offset).y - runtime.pointAt(b.lane, b.offset).y);
    for (const u of units) runtime.drawUnit(u);
    runtime.drawCombatFx(dt);
    runtime.ctx.font = 'bold 10px system-ui';
    runtime.ctx.textAlign = 'center';
    runtime.particles = runtime.particles.filter(p => {
      p.life -= dt;
      p.y -= dt * 25;
      if (p.life <= 0) return false;
      runtime.ctx.globalAlpha = runtime.clamp(p.life * 1.5, 0, 1);
      runtime.ctx.fillStyle = p.color;
      runtime.ctx.fillText(p.text, p.x, p.y);
      return true;
    });
    runtime.ctx.globalAlpha = 1;
  };
  runtime.updatePickReminder = function updatePickReminder() {
    const n = runtime.state.startChoices > 0 ? 1 : runtime.state.pendingChoices.length;
    runtime.$('#pickReminder span').textContent = Math.max(1, n);
  };
  runtime.showChoice = function showChoice() {
    if (runtime.state.startChoices <= 0 && !runtime.state.pendingChoices.length) return;
    runtime.state.modal = true;
    runtime.state.banMode = false;
    runtime.state.choiceContext = runtime.choiceContextForPlayer();
    runtime.$('#pickReminder').classList.add('hidden');
    runtime.$('#choiceOverlay').classList.remove('hidden');
    runtime.updatePickReminder();
    runtime.renderChoiceContext();
  };
  runtime.minimizeChoice = function minimizeChoice() {
    if (!runtime.state.choiceContext) return;
    runtime.$('#choiceOverlay').classList.add('hidden');
    runtime.updatePickReminder();
    runtime.$('#pickReminder').classList.remove('hidden');
  };
  runtime.reopenChoice = function reopenChoice() {
    if (!runtime.state.choiceContext) return;
    runtime.$('#pickReminder').classList.add('hidden');
    runtime.$('#choiceOverlay').classList.remove('hidden');
  };
  runtime.renderCity = function renderCity(container, c, interactive) {
    const occ = runtime.occupancy(c),
      frag = document.createDocumentFragment();
    for (let r = 0; r < runtime.GRID; r++) for (let col = 0; col < runtime.GRID; col++) {
      if (occ.has(runtime.idx(r, col))) continue;
      const t = runtime.terrainAt(c, r, col),
        def = t ? runtime.TERRAIN[t.type] : null,
        p = document.createElement('button');
      p.className = `plot${t ? ' terrain ' + t.type : ''}${def?.blocked && !['ruin', 'ancient'].includes(t?.type) ? ' blockterrain' : ''}`;
      p.dataset.r = r;
      p.dataset.c = col;
      p.style.gridRow = r + 1;
      p.style.gridColumn = col + 1;
      if (t) {
        const visual = def.image ? `<img class="ticonimg" src="${def.image}" alt="${def.name}">` : `<span class="ticon">${def.icon}</span>`;
        p.innerHTML = visual;
        p.onmousemove = e => runtime.moveTerrainTooltip(e);
        p.onmouseenter = e => runtime.showTerrainTooltip(def, t, e);
      }
      if (interactive) {
        if (t && ['ruin', 'ancient'].includes(t.type)) {
          p.onclick = () => {
            if (runtime.state.selectedBuild) {
              runtime.toast(`${def.name}: előbb takarítsd el.`);
              return;
            }
            runtime.clearTerrain(runtime.P, r, col, false);
          };
        } else if (t && def.blocked) {
          p.onclick = () => runtime.toast(`${def.name}: ${def.tip}`);
        } else p.onclick = () => runtime.tryPlace(r, col);
        p.onmouseenter = (orig => e => {
          if (t) runtime.showTerrainTooltip(def, t, e);
          orig && orig(e);
        })(() => runtime.previewPlacement(r, col));
        p.onmouseleave = () => {
          runtime.clearPlacementPreview();
          runtime.hideTerrainTooltip();
        };
      } else {
        p.tabIndex = -1;
        p.onmouseleave = runtime.hideTerrainTooltip;
      }
      frag.appendChild(p);
    }
    for (const b of c.buildings) {
      const d = runtime.BUILDINGS[b.type],
        bounds = runtime.shapeBounds(b.type, b.rotation || 0),
        el = document.createElement('button');
      el.className = `building ${d.category}${b.inactive ? ' inactive' : ''}${interactive && runtime.state.selectedBuilding === b.id ? ' selected' : ''}${interactive ? '' : ' enemyb'}`;
      el.dataset.id = b.id;
      el.style.gridRow = `${b.row + 1} / span ${bounds.h}`;
      el.style.gridColumn = `${b.col + 1} / span ${bounds.w}`;
      const clip = runtime.lClipFor(b.type, b.rotation || 0);
      if (clip) el.style.clipPath = clip;
      el.innerHTML = `${runtime.buildingSpriteHTML(b.type, b.rotation || 0, bounds)}<span class="bname">${d.name}</span><span class="blv">L${b.level}</span>${d.unit ? `<i class="bprog" style="width:${Math.round((b.progress || 0) * 100)}%"></i>` : ''}`;
      if (interactive) el.onclick = () => {
        runtime.state.selectedBuild = null;
        runtime.state.selectedBuilding = b.id;
        runtime.clearPlacementPreview();
        runtime.renderStatic();
      };else el.tabIndex = -1;
      frag.appendChild(el);
    }
    container.replaceChildren(frag);
  };
  runtime.positionInspector = function positionInspector() {
    const el = runtime.$('#inspector'),
      b = runtime.getBuilding(runtime.P, runtime.state.selectedBuilding);
    if (!b || !el.classList.contains('show')) return;
    const anchor = runtime.$(`#playerGrid [data-id="${b.id}"]`);
    if (!anchor) return;
    const r = anchor.getBoundingClientRect(),
      w = el.offsetWidth || 310,
      h = el.offsetHeight || 260,
      gap = 10;
    let left = r.right + gap;
    if (left + w > window.innerWidth - 10) left = r.left - w - gap;
    left = runtime.clamp(left, 10, window.innerWidth - w - 10);
    let top = runtime.clamp(r.top + r.height / 2 - h / 2, 74, window.innerHeight - h - 10);
    el.style.left = Math.round(left) + 'px';
    el.style.top = Math.round(top) + 'px';
  };
  runtime.closeBuildingInspector = function closeBuildingInspector() {
    runtime.state.selectedBuilding = null;
    const el = runtime.$('#inspector');
    el.classList.remove('show');
    el.innerHTML = '';
  };
  runtime.marketEfficiency = function marketEfficiency(level) {
    return runtime.v4LevelValue(level, [.6, .75, .9, .9]);
  };
  runtime.marketRate = function marketRate(level) {
    return runtime.v4LevelValue(level, [1, 2, 3, 3]);
  };
  runtime.marketTransfer = function marketTransfer(c, dt, stock = {
    ...c.resources
  }, fullCapacity = false) {
    const gain = runtime.C(),
      use = runtime.C(),
      m = runtime.buildingOf(c, 'market')[0];
    if (!m || !(dt > 0)) return {
      stock,
      gain,
      use
    };
    const count = runtime.hasBranch(c, 'market', 'wholesalers') ? 2 : 1,
      rate = runtime.marketRate(m.level),
      eff = runtime.marketEfficiency(m.level);
    for (const route of (c.marketRoutes || []).slice(0, count)) {
      if (!route || route.from === route.to || !runtime.RES.includes(route.from) || !runtime.RES.includes(route.to)) continue;
      const amount = fullCapacity ? rate * dt : Math.max(0, Math.min(stock[route.from], rate * dt, Math.max(0, c.caps[route.to] - stock[route.to]) / eff));
      stock[route.from] -= amount;
      stock[route.to] += amount * eff;
      use[route.from] += amount / dt;
      gain[route.to] += amount * eff / dt;
    }
    return {
      stock,
      gain,
      use
    };
  };
  runtime.previewTrainingTime = function previewTrainingTime(c, type, level = runtime.levelOf(c, type)) {
    const fake = {
        type,
        level,
        row: 0,
        col: 0,
        id: 'preview',
        rotation: 0
      },
      key = runtime.BUILDINGS[type].unit;
    if (!key) return null;
    let t = runtime.UNITS[key].train * runtime.v4LevelValue(level, [1, .8, .6, .6]);
    if (runtime.hasLeg(c, 'swordsman_triple') && key === 'swordsman') t *= 2;
    if (runtime.hasLeg(c, 'no_food')) t *= 1.25;
    return t / Math.max(.001, runtime.trainingSpeedBonus(c, fake, key));
  };
  runtime.renderChoice = function renderChoice(opts, kicker, title, desc, legendary) {
    runtime.$('#choiceKicker').textContent = kicker;
    runtime.$('#choiceTitle').textContent = title;
    runtime.$('#choiceDesc').textContent = desc;
    const list = runtime.$('#choiceList');
    list.classList.toggle('banmode', runtime.state.banMode);
    list.classList.toggle('five', opts.length === 5);
    list.classList.toggle('six', opts.length === 6);
    list.innerHTML = opts.map((o, i) => {
      const buildingKind = ['building', 'building_upgrade', 'building_branch'].includes(o.kind),
        d = buildingKind ? runtime.BUILDINGS[o.id] : null,
        price = o.kind === 'building' ? runtime.buildPrice(runtime.P, o.id) : null,
        label = o.kind === 'building' ? 'ÉPÜLETFEL­OLDÁS' : o.kind === 'building_branch' ? 'L4 SPECIALIZÁCIÓ' : o.kind === 'building_upgrade' ? 'ÉPÜLETFEJLESZTÉS' : o.kind === 'normal' ? 'HALMOZHATÓ FEJLESZTÉS' : 'LEGENDÁS EREKLYE',
        art = buildingKind ? runtime.cardBuildingImageTag(o.id, 'choiceBuildingImage') : runtime.choiceUnitArt(o),
        footer = o.kind === 'building' ? `<span class="woodcost">${runtime.resourceIconTag('wood', true)}${Math.ceil(price.wood || 0) || '—'}</span><span class="stonecost">${runtime.resourceIconTag('stone', true)}${Math.ceil(price.stone || 0) || '—'}</span>` : o.kind === 'building_branch' ? '<span class="levelup branchTag">L3 → L4 · VÁLASZTOTT ÁG</span>' : o.kind === 'building_upgrade' ? `<span class="levelup">L${runtime.levelOf(runtime.P, o.id)} → L${runtime.upgradeTargetLevel(runtime.P, o.id)}</span>` : `<span class="picktag">${o.kind === 'legendary' ? 'LEGENDÁS' : 'PASSZÍV'}${o.kind === 'normal' && runtime.P.normal[o.id] ? ` · ×${runtime.P.normal[o.id]}` : ''}</span>`;
      return `<button class="choice gamecard ${o.kind === 'legendary' || legendary ? 'legendary' : ''} ${o.kind === 'normal' ? 'normalopt' : ''} ${buildingKind ? 'buildingchoice' : ''}" data-frame="${o.kind === 'building' ? d?.category || 'support' : o.kind === 'legendary' || legendary ? 'legendary' : 'common'}" data-i="${i}"><span class="ctype">${label}</span><h3>${o.name}</h3><span class="choiceArt card-media">${art}</span><span class="choiceBody"><p>${o.description}</p>${o.details ? `<span class="choicemeta">${o.details}</span>` : ''}</span><span class="choiceFooter">${footer}</span></button>`;
    }).join('');
    runtime.$$('#choiceList .choice').forEach(b => b.onclick = () => {
      const i = +b.dataset.i;
      if (runtime.state.banMode) runtime.banChoiceAt(i);else runtime.choose(opts[i], i);
    });
    runtime.updateChoiceTools();
  };
  runtime.updateChoiceTools = function updateChoiceTools() {
    const c = runtime.state.choiceContext;
    if (!c) return;
    const canBan = !c.legendary && c.opts.some(o => o.kind === 'normal') && runtime.P.bans > 0;
    runtime.$('#rerollChoice').disabled = runtime.P.rerolls <= 0;
    runtime.$('#banChoice').disabled = !canBan;
    runtime.$('#banChoice').classList.toggle('active', runtime.state.banMode);
    runtime.$('#banChoice').textContent = runtime.state.banMode ? '⊘ KITILTÁSI MÓD: BE' : '⊘ KITILTÁS';
    runtime.$('#choiceTokens').innerHTML = `↻ <b>${runtime.P.rerolls}</b> újrasorsolás · ⊘ <b>${runtime.P.bans}</b> kitiltás`;
    runtime.$('#choiceBanHint').textContent = runtime.state.banMode ? 'Kattints egy halmozható fejlesztésre. Erre a menetre végleg eltűnik.' : '';
  };
  runtime.marketControlsHTML = function marketControlsHTML(c, b) {
    const count = runtime.hasBranch(c, 'market', 'wholesalers') ? 2 : 1,
      wait = Math.max(0, 20 - (runtime.state.time - c.marketSwitchAt));
    return `<div class="marketControls"><div class="boxlabel">KERESKEDELMI ÚTVONAL${count > 1 ? 'AK' : ''}</div>${c.marketRoutes.slice(0, count).map((x, i) => `<div class="marketRoute" data-route="${i}"><select class="marketFrom" ${wait > 0 ? 'disabled' : ''}>${runtime.resourceOptions(x.from)}</select><span>→</span><select class="marketTo" ${wait > 0 ? 'disabled' : ''}>${runtime.resourceOptions(x.to)}</select><button class="marketSave" ${wait > 0 ? 'disabled' : ''}>MENTÉS</button></div>`).join('')}<small>${wait > 0 ? `Új beállítás ${Math.ceil(wait)} mp múlva.` : 'Válaszd ki az exportált és az importált nyersanyagot, majd mentsd el.'}</small></div>`;
  };
  runtime.renderInspector = function renderInspector() {
    const el = runtime.$('#inspector'),
      b = runtime.getBuilding(runtime.P, runtime.state.selectedBuilding);
    if (!b) {
      el.classList.remove('show');
      el.innerHTML = '';
      return;
    }
    const d = runtime.buildingDefinition?.(runtime.P,b.type) || runtime.BUILDINGS[b.type],
      unitKey = d.unit ? runtime.effectiveUnitKey(runtime.P, b) : null,
      u = unitKey ? runtime.UNITS[unitKey] : null,
      rows = runtime.buildingEffectRows(runtime.P, b),
      effects = rows.length ? `<div class="effectbox compactEffects"><div class="boxlabel">AKTUÁLIS HATÁS</div>${rows.map(([label, value]) => `<div class="istat"><span>${label}</span><b>${value}</b></div>`).join('')}</div>` : '',
      unitPanel = u ? `<div class="spawnCompact"><div class="unitPortraitFrame">${runtime.unitImageTag(unitKey)}</div><div class="unitSummary"><div class="unitTitle"><b>${u.name}</b><span>Gyártási idő · ${runtime.trainingTime(runtime.P, b).toFixed(1)} mp</span></div>${runtime.unitStatsHTML(runtime.P, unitKey)}</div></div>` : '',
      special = b.type === 'market' ? runtime.marketControlsHTML(runtime.P, b) : b.type === 'rally' ? runtime.rallyControlsHTML(runtime.P) : b.type === 'warcenter' ? runtime.warcenterControlsHTML(runtime.P) : '';
    el.classList.add('show');
    el.innerHTML = `<div class="inspectorCard"><div class="ihead"><div><small>${runtime.CATEGORY_NAMES[d.category] || d.category.toUpperCase()} · ${runtime.footprintText(b.type, b.rotation || 0)} · L${b.level}</small><h3>${d.name}</h3></div><button id="closeInspector" aria-label="Bezárás">✕</button></div><p class="idesc">${d.description}</p>${effects}${special}${unitPanel}${b.level < 4 ? `<div class="upgradeNote">A következő szint külön <b>${d.name} ${b.level === 1 ? 'II' : b.level === 2 ? 'III' : 'IV'}</b> fejlesztési kártyaként jelenhet meg.</div>` : '<div class="upgradeNote">Elérte a legmagasabb technológiai szintet.</div>'}<div class="iactions">${b.type !== 'keep' ? '<button class="demolish" id="demolishBtn">BONTÁS</button>' : ''}</div></div>`;
    runtime.$('#closeInspector').onclick = e => {
      e?.stopPropagation?.();
      runtime.closeBuildingInspector();
    };
    runtime.$$('.rallyControls [data-rally]').forEach(x => x.onclick = () => runtime.setRallyMode(runtime.P, x.dataset.rally));
    runtime.$$('.warModeControls [data-war-mode]').forEach(x => x.onclick = () => runtime.setWarMode(runtime.P, x.dataset.warMode));
    runtime.$$('.marketRoute').forEach(row => {
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
        runtime.renderInspector();
      };
    });
    runtime.$('#demolishBtn')?.addEventListener('click', () => {
      runtime.demolish(runtime.P, b.id);
      runtime.closeBuildingInspector();
      runtime.toast(`${d.name} lebontva · 50% visszatérítés.`);
      runtime.renderStatic();
    });
    requestAnimationFrame(runtime.positionInspector);
  };
  runtime.renderBuildList = function renderBuildList() {
    const list = runtime.$('#buildList'),
      entries = [...runtime.P.unlocked].filter(k => k !== 'keep' && runtime.BUILDINGS[k]).filter(k => runtime.state.category === 'all' || runtime.BUILDINGS[k].category === runtime.state.category);
    list.innerHTML = entries.map(k => {
      const d = runtime.BUILDINGS[k],
        locked = runtime.isUniqueBuilding(runtime.P, k) && runtime.hasBuilding(runtime.P, k),
        lv = runtime.levelOf(runtime.P, k),
        sample = runtime.buildingOf(runtime.P, k)[0],
        key = d.unit ? sample ? runtime.effectiveUnitKey(runtime.P, sample) : d.unit : null,
        u = key ? runtime.UNITS[key] : null,
        price = runtime.buildPrice(runtime.P, k),
        wood = Math.ceil(price.wood || 0),
        stone = Math.ceil(price.stone || 0),
        info = u ? `<span class="cardunit"><b>${u.name}</b><span class="utime">${runtime.previewTrainingTime(runtime.P, k, lv).toFixed(1)} mp</span><span class="ucost"><span>Egységköltség</span><span class="unitresources">${runtime.resourceCostHTML(runtime.unitCost(runtime.P, key), true)}</span></span></span>` : `<p class="carddesc">${d.description}</p>`;
      return `<button class="buildcard gamecard ${runtime.state.selectedBuild === k ? 'selected' : ''} ${locked ? 'locked' : ''}" data-k="${k}" ${locked ? 'disabled' : ''} title="${d.name} — ${d.description}"><span class="cardname">${d.name}${lv > 1 ? ` · L${lv}` : ''}</span><span class="cardart card-media">${runtime.cardBuildingImageTag(k, 'cardBuildingImage')}</span>${runtime.isUniqueBuilding(runtime.P, k) ? '<span class="uniquechip">EGYEDI</span>' : ''}<span class="cardinfo">${info}</span><span class="cardcosts"><span class="woodcost">${runtime.resourceIconTag('wood')} ${wood || '—'}</span><span class="stonecost">${runtime.resourceIconTag('stone')} ${stone || '—'}</span></span></button>`;
    }).join('');
    runtime.$$('#buildList .buildcard').forEach(b => b.onclick = () => {
      const k = b.dataset.k;
      runtime.state.selectedBuilding = null;
      runtime.state.lastPlacementHover = null;
      if (runtime.state.selectedBuild === k) runtime.state.selectedBuild = null;else {
        runtime.state.selectedBuild = k;
        runtime.state.buildRotation = runtime.rotationOptions(k)[0];
      }
      runtime.clearPlacementPreview();
      runtime.renderStatic();
    });
    const hint = runtime.$('#placementHint');
    if (runtime.state.selectedBuild) {
      const rotatable = runtime.rotationOptions(runtime.state.selectedBuild).length > 1;
      hint.innerHTML = `<span>${runtime.BUILDINGS[runtime.state.selectedBuild].name} · ${runtime.footprintText(runtime.state.selectedBuild, runtime.state.buildRotation)} · Kattints a lerakáshoz · az egér alatti mező körül forog</span>${rotatable ? '<button id="rotatePlacement" class="placementRotate" type="button">↻ FORGATÁS (jobb klikk)</button>' : ''}`;
      hint.classList.add('show');
      runtime.$('#rotatePlacement')?.addEventListener('click', e => {
        e.stopPropagation();
        runtime.rotateSelectedBuild();
      });
    } else {
      hint.classList.remove('show');
      hint.innerHTML = '';
    }
  };
  runtime.updateHud = function updateHud() {
    runtime.recomputeCity(runtime.P, true);
    runtime.recomputeCity(runtime.E, true);
    const rates = runtime.productionRates(runtime.P),
      use = runtime.consumptionRates(runtime.P);
    for (const r of runtime.RES) {
      runtime.$(`#${r}Stock`).textContent = `${Math.floor(runtime.P.resources[r])} / ${Math.floor(runtime.P.caps[r])}`;
      runtime.$(`#${r}Gain`).textContent = `+${rates[r].toFixed(1)}/mp`;
      runtime.$(`#${r}Use`).textContent = use[r] > .005 ? `−${use[r].toFixed(1)}/mp` : '';
    }
    runtime.$('#timer').textContent = runtime.fmt(runtime.state.time);
    runtime.$('#nextPick').textContent = runtime.state.startChoices > 0 ? 'KEZDÉS' : runtime.fmt(Math.max(0, runtime.state.nextPick));
    runtime.$('#playerHp').textContent = Math.ceil(runtime.P.hp);
    runtime.$('#enemyHp').textContent = Math.ceil(runtime.E.hp);
    const playerField = runtime.state.units.filter(u => u.alive && u.side === 'player'),
      enemyField = runtime.state.units.filter(u => u.alive && u.side === 'enemy'),
      pc = runtime.fieldUnitCount(runtime.P),
      ec = runtime.fieldUnitCount(runtime.E),
      pr = runtime.reserveCount(runtime.P),
      er = runtime.reserveCount(runtime.E);
    runtime.$('#playerArmy').textContent = `${pc}/${runtime.P.armyCap}`;
    runtime.$('#enemyArmy').textContent = `${ec}/${runtime.E.armyCap}`;
    runtime.updateUnitMix('playerArmyMix', playerField);
    runtime.updateUnitMix('enemyArmyMix', enemyField);
    runtime.updateUnitMix('playerGarrisonMix', [...runtime.P.garrison, ...runtime.P.releaseQueue]);
    runtime.updateUnitMix('enemyGarrisonMix', [...runtime.E.garrison, ...runtime.E.releaseQueue]);
    runtime.$('#garrisonCount').textContent = `${pr} / ${runtime.P.garrisonCap} · ${runtime.gateReleaseRate(runtime.P) >= 9999 ? 'azonnali' : runtime.gateReleaseRate(runtime.P) + ' /mp'}`;
    runtime.$('#garrisonFill').style.width = runtime.clamp(pr / runtime.P.garrisonCap * 100, 0, 100) + '%';
    runtime.$('#enemyGarrison').textContent = `${er} / ${runtime.E.garrisonCap}`;
    runtime.$('#relicCount').textContent = Object.values(runtime.P.normal).reduce((a, b) => a + b, 0) + runtime.P.legends.size;
    if (runtime.state.choiceContext) runtime.updatePickReminder();
    const ai = runtime.$('#enemyAiInfo');
    if (ai) ai.textContent = `AI · VÁLASZTÁS #${runtime.E.pickCount}${runtime.E.lastPick ? ' · ' + runtime.E.lastPick : ''}`;
    runtime.drawGate();
  };
  runtime.renderRelics = function renderRelics() {
    const rows = [];
    for (const [id, n] of Object.entries(runtime.P.normal)) {
      const r = runtime.NORMAL.find(x => x.id === id);
      if (r) rows.push(`<div class="relicitem"><b>${r.icon} ${r.name} ×${n}</b>${r.description}</div>`);
    }
    for (const id of runtime.P.legends) {
      const r = runtime.LEGENDARY.find(x => x.id === id);
      if (r) rows.push(`<div class="relicitem legendary"><b>${r.icon} ${r.name}</b>${r.description}</div>`);
    }
    runtime.$('#relicList').innerHTML = rows.join('') || '<div class="relicitem"><b>Még nincs ereklyéd.</b>Az első négy választás csak épületfeloldás.</div>';
  };
  runtime.finalizeChoiceEvent = function finalizeChoiceEvent() {
    const c = runtime.state.choiceContext;
    runtime.$('#choiceOverlay').classList.add('hidden');
    runtime.$('#pickReminder').classList.add('hidden');
    runtime.state.modal = false;
    runtime.state.choiceContext = null;
    runtime.state.banMode = false;
    if (runtime.state.startChoices > 0) {
      runtime.state.startChoices--;
      if (runtime.state.startChoices > 0) {
        runtime.showChoice();
        return;
      }
      runtime.state.running = true;
      runtime.state.nextPick = runtime.PICK_BASE_SECONDS;
      runtime.message('A menet elindult. Az ellenfél is négy épületválasztással kezdett.');
      runtime.$('#pauseBtn').classList.remove('on');
      runtime.$('#pauseBtn').textContent = 'Ⅱ';
    } else runtime.state.pendingChoices.shift();
    runtime.renderStatic();
    if (runtime.state.pendingChoices.length) runtime.showChoice();
  };
  runtime.v490RangeSpec = function v490RangeSpec(c, b) {
    if (!b) return null;
    if (b.type === 'guildhouse') return {
      mode: 'cheb',
      range: runtime.hasBranch(c, 'guildhouse', 'guild_network') ? 3 : 2,
      color: 'green'
    };
    if (b.type === 'townhall') return {
      mode: 'cheb',
      range: 2,
      color: 'blue'
    };
    if (b.type === 'rally') return {
      mode: runtime.hasBranch(c, 'rally', 'war_rally') ? 'cheb' : 'orth',
      range: runtime.hasBranch(c, 'rally', 'war_rally') ? 2 : 1,
      color: 'gold'
    };
    if (b.type === 'armorsmith' || b.type === 'guardhouse') return {
      mode: 'orth',
      range: 1,
      color: 'blue'
    };
    if (b.type === 'tavern' && runtime.hasBranch(c, 'tavern', 'regulars')) return {
      mode: 'orth',
      range: 1,
      color: 'gold'
    };
    if (b.type === 'warehouse' && runtime.hasBranch(c, 'warehouse', 'supply_hub')) return {
      mode: 'orth',
      range: 1,
      color: 'green'
    };
    if (b.type === 'barracks' && runtime.hasBranch(c, 'barracks', 'cavalry_barracks') || b.type === 'stable') return {
      mode: 'orth',
      range: 1,
      color: 'gold'
    };
    return null;
  };
  runtime.v490RangeCells = function v490RangeCells(b, spec) {
    if (!spec) return [];
    const own = new Set(runtime.buildingCells(b).map(([r, c]) => runtime.idx(r, c))),
      out = new Map();
    for (const [r, c] of runtime.buildingCells(b)) for (let rr = 0; rr < runtime.GRID; rr++) for (let cc = 0; cc < runtime.GRID; cc++) {
      const dr = Math.abs(rr - r),
        dc = Math.abs(cc - c),
        inside = spec.mode === 'orth' ? dr + dc === 1 : Math.max(dr, dc) <= spec.range;
      if (inside && !own.has(runtime.idx(rr, cc))) out.set(runtime.idx(rr, cc), [rr, cc]);
    }
    return [...out.values()];
  };
  runtime.v490Targets = function v490Targets(c, b) {
    if (!b) return [];
    if (b.type === 'guildhouse') return runtime.buildingOf(c, 'lumber').concat(runtime.buildingOf(c, 'stonecutter'), runtime.buildingOf(c, 'farm')).filter(x => runtime.guildMultiplier(c, x) > 1);
    if (b.type === 'townhall') return runtime.affectedHouses(c);
    if (b.type === 'rally') return c.buildings.filter(x => runtime.BUILDINGS[x.type]?.unit && runtime.rallyAccepts(c, x));
    if (b.type === 'armorsmith') return c.buildings.filter(x => runtime.BUILDINGS[x.type]?.unit && runtime.armorSmithForSpawner(c, x)?.id === b.id);
    if (b.type === 'guardhouse') return runtime.adjacentBuildings(c, b).filter(x => x.type === 'rally');
    if (b.type === 'tavern' && runtime.hasBranch(c, 'tavern', 'regulars')) return runtime.adjacentBuildings(c, b).filter(x => runtime.BUILDINGS[x.type]?.unit);
    if (b.type === 'warehouse' && runtime.hasBranch(c, 'warehouse', 'supply_hub')) return runtime.adjacentBuildings(c, b).filter(x => runtime.BUILDINGS[x.type]?.unit);
    if (b.type === 'barracks' && runtime.hasBranch(c, 'barracks', 'cavalry_barracks')) return runtime.adjacentBuildings(c, b).filter(x => x.type === 'stable');
    if (b.type === 'stable') return runtime.adjacentBuildings(c, b).filter(x => x.type === 'barracks' && runtime.hasBranch(c, 'barracks', 'cavalry_barracks'));
    return [];
  };
  runtime.v490Badges = function v490Badges(c, b) {
    const badges = [];
    const add = (icon, title, color = '') => {
      if (!badges.some(x => x.title === title)) badges.push({
        icon,
        title,
        color
      });
    };
    if (['lumber', 'stonecutter', 'farm'].includes(b.type)) {
      const terrain = b.type === 'lumber' ? runtime.adjacentTerrain(c, b, 'forest') : b.type === 'stonecutter' ? runtime.adjacentTerrain(c, b, 'quarry') : runtime.buildingOnTerrain(c, b, 'fertile');
      if (terrain) add('＋', 'Aktív terepbónusz: ×2 termelés');
      if (runtime.guildMultiplier(c, b) > 1) add('＋', 'Céhházi termelési bónusz');
    }
    if (b.type === 'house' && runtime.affectedHouses(c).some(x => x.id === b.id)) add('＋', 'Városházi sereglimit-bónusz', 'blue');
    if (runtime.BUILDINGS[b.type]?.unit) {
      if (runtime.rallyAccepts(c, b)) add('⚑', 'A Gyülekezőtér tartalékába termel', 'gold');
      if (runtime.armorSmithForSpawner(c, b)) add('◆', 'Páncélkovácsi kezdőpajzs', 'blue');
      if (runtime.adjacentBuildings(c, b).some(x => x.type === 'tavern') && runtime.hasBranch(c, 'tavern', 'regulars')) add('●', 'Kocsmai törzsvendég-bónusz', 'gold');
      if (runtime.adjacentBuildings(c, b).some(x => x.type === 'warehouse') && runtime.hasBranch(c, 'warehouse', 'supply_hub')) add('＋', 'Ellátóközpont: olcsóbb egységek');
    }
    if (b.type === 'stable' && runtime.adjacentBuildings(c, b).some(x => x.type === 'barracks' && runtime.hasBranch(c, 'barracks', 'cavalry_barracks'))) add('♞', 'A szomszédos Kaszárnya lovagokat gyárt', 'gold');
    return badges.slice(0, 3);
  };
  runtime.v490AddRange = function v490AddRange(grid, b, spec, placement = false) {
    const frag = document.createDocumentFragment();
    for (const [r, c] of runtime.v490RangeCells(b, spec)) {
      const x = document.createElement('span');
      x.className = `effectRangeCell ${spec.color === 'blue' ? 'blue' : spec.color === 'gold' ? 'gold' : ''}${placement ? ' placementRange' : ''}`;
      x.style.gridRow = r + 1;
      x.style.gridColumn = c + 1;
      frag.appendChild(x);
    }
    grid.appendChild(frag);
  };
  runtime.v490DecorateCity = function v490DecorateCity(container, c, interactive) {
    if (!container) return;
    container.querySelectorAll('.buildingHintMeta,.effectRangeCell').forEach(x => x.remove());
    container.querySelectorAll('.building.effectTarget').forEach(x => x.classList.remove('effectTarget', 'effectBlue', 'effectGold'));
    const selected = interactive ? runtime.getBuilding(c, runtime.state.selectedBuilding) : null;
    if (runtime.state.visualHints && selected) {
      const spec = runtime.v490RangeSpec(c, selected);
      if (spec) runtime.v490AddRange(container, selected, spec);
      const color = spec?.color === 'blue' ? 'effectBlue' : spec?.color === 'gold' ? 'effectGold' : '';
      for (const t of runtime.v490Targets(c, selected)) {
        const el = container.querySelector(`.building[data-id="${t.id}"]`);
        if (el) {
          el.classList.add('effectTarget');
          if (color) el.classList.add(color);
        }
      }
    }
    if (!runtime.state.visualHints) return;
    for (const b of c.buildings) {
      const cells = runtime.buildingCells(b).sort((a, z) => a[0] - z[0] || a[1] - z[1]),
        anchor = cells[0],
        meta = document.createElement('span');
      meta.className = 'buildingHintMeta';
      meta.style.gridRow = anchor[0] + 1;
      meta.style.gridColumn = anchor[1] + 1;
      const stars = document.createElement('span');
      stars.className = `levelStars${b.level >= 4 ? ' level4' : ''}`;
      stars.textContent = b.level >= 4 ? '✦' : '★'.repeat(Math.max(1, b.level));
      stars.title = b.level >= 4 ? '4. szint · specializált épület' : `${b.level}. szint`;
      meta.appendChild(stars);
      if (interactive && runtime.state.visualHints) {
        const badges = runtime.v490Badges(c, b);
        if (badges.length) {
          const row = document.createElement('span');
          row.className = 'buffBadgeRow';
          for (const badge of badges) {
            const chip = document.createElement('span');
            chip.className = `buffBadge ${badge.color || ''}`;
            chip.textContent = badge.icon;
            chip.title = badge.title;
            row.appendChild(chip);
          }
          meta.appendChild(row);
        }
      }
      container.appendChild(meta);
    }
  };
  runtime.v490InstallToggle = function v490InstallToggle() {
    const foot = document.querySelector('.cityzone .cityfoot');
    if (!foot) return;
    let btn = foot.querySelector('.visualHintsToggle');
    if (!btn) {
      btn = document.createElement('button');
      btn.type = 'button';
      btn.onclick = () => {
        runtime.state.visualHints = !runtime.state.visualHints;
        runtime.clearPlacementPreview();
        runtime.renderStatic();
        runtime.toast(runtime.state.visualHints ? 'Ikonok bekapcsolva.' : 'Ikonok kikapcsolva.');
      };
      foot.appendChild(btn);
    }
    btn.className = `visualHintsToggle${runtime.state.visualHints ? '' : ' off'}`;
    btn.innerHTML = `<span class="toggleMark">${runtime.state.visualHints ? '◉' : '○'}</span><span class="toggleLabel">Ikonok be/ki</span>`;
    btn.title = runtime.state.visualHints ? 'Minden városi ikon kikapcsolása' : 'Minden városi ikon bekapcsolása';
    btn.setAttribute('aria-pressed', runtime.state.visualHints ? 'true' : 'false');
  };
  runtime.dynamicPickStates = function dynamicPickStates(c) {
    const states = [];
    if (runtime.hasLeg(c, 'overproduction')) {
      const stacks = Math.floor(c.overflowStacks || 0),
        progress = Math.floor(c.overflowProgress || 0);
      states.push({
        icon: '📦',
        value: `${stacks}×`,
        kind: 'stack',
        title: `Túltermelés: ${stacks} stack · +${stacks}% egységsebzés · ${progress}/500 túltermelt nyersanyag a következő stackig`
      });
    }
    if (runtime.hasLeg(c, 'last_line')) {
      const stacks = Math.floor(c.lostTowers || 0),
        bonus = stacks * 25;
      states.push({
        icon: '🔥',
        value: `${stacks}×`,
        kind: 'stack',
        title: `Utolsó védvonal: ${stacks}/3 stack · +${bonus}% egység HP és sebzés`
      });
    }
    if (runtime.hasLeg(c, 'double_choice')) {
      const progress = (c.nonLegendaryPicks || 0) % 3;
      states.push({
        icon: '✌️',
        value: `${progress}/3`,
        kind: 'stack',
        title: `Kettős választás: ${progress}/3 nem legendás választás · minden harmadiknál két fejlesztést vihetsz el`
      });
    }
    if (runtime.hasLeg(c, 'full_garrison_economy')) {
      const active = c.garrisonCap > 0 && runtime.reserveCount(c) >= c.garrisonCap;
      states.push({
        icon: '🏦',
        value: active ? '×2' : '—',
        kind: active ? 'active' : 'inactive',
        title: active ? 'Teltház aktív: a megtelt helyőrség miatt ×2 nyersanyagtermelés' : 'Teltház inaktív: töltsd meg a helyőrséget a ×2 nyersanyagtermeléshez'
      });
    }
    return states;
  };
  runtime.showSuddenOverlay = function showSuddenOverlay(subtext = '', dur = 2200) {
    const el = runtime.$('#suddenOverlay');
    if (!el) return;
    el.querySelector('.sub').textContent = subtext || '';
    el.classList.add('show');
    clearTimeout(runtime.showSuddenOverlay._t);
    runtime.showSuddenOverlay._t = setTimeout(() => el.classList.remove('show'), dur);
  };
  runtime.renderTowerInspectorV496 = function renderTowerInspectorV496(t) {
    const el = runtime.$('#inspector'),
      st = runtime.towerStatsV496(t),
      owner = t.side === 'player' ? 'SAJÁT' : 'ELLENFÉL',
      hpPct = t.maxHp ? Math.round(t.hp / t.maxHp * 100) : 0;
    el.classList.add('show');
    el.innerHTML = `<div class="inspectorCard towerInspector"><div class="ihead"><div><small>${owner} · VÉDELMI ÉPÜLET</small><h3>${runtime.towerNameV496(t)}</h3></div><button id="closeInspector" aria-label="Bezárás">✕</button></div><p class="idesc">Az út védelmét biztosító torony. Kijelölve a pályán látható a tényleges lövési hatótávolsága.</p><div class="effectbox compactEffects"><div class="boxlabel">AKTUÁLIS STATOK</div><div class="istat"><span>HP</span><b id="towerHpStat">${Math.ceil(t.hp)} / ${Math.ceil(t.maxHp)} · ${hpPct}%</b></div><div class="istat"><span>Sebzés / lövés</span><b>${st.damage.toFixed(1)}</b></div><div class="istat"><span>Lövésidő</span><b>${st.cooldown.toFixed(2)} mp</b></div><div class="istat"><span>Támadási sebesség</span><b>${st.attacksPerSecond.toFixed(2)} /mp</b></div><div class="istat"><span>Hatótáv</span><b>${Math.round(st.range)}</b></div>${st.regen ? `<div class="istat"><span>HP regeneráció</span><b>+${st.regen.toFixed(1)} /mp</b></div>` : ''}<div class="istat"><span>Toronykezelők</span><b>${st.crewStacks}× · +${st.crewStacks * 8}% minden statra</b></div></div>${t.sdActive ? '<div class="upgradeNote sudden">☠ HIRTELEN HALÁL · ez a torony jelenleg olvad.</div>' : ''}<div class="upgradeNote">A sárgával kiemelt útszakasz a torony tényleges támadási tartománya.</div></div>`;
    runtime.$('#closeInspector').onclick = e => {
      e?.stopPropagation?.();
      runtime.state.selectedTowerId = null;
      el.classList.remove('show');
      el.innerHTML = '';
    };
    requestAnimationFrame(runtime.positionInspector);
  };
  runtime.renderResourceFlow38 = function renderResourceFlow38() {
    document.body.classList.toggle('resource-rates-active39', !runtime.state.pregame && !runtime.state.ended && (runtime.state.running || runtime.state.time > 0) && (!runtime.MP.enabled || runtime.MP.started));
    const { gain, use, sources } = runtime.resourceFlowRates(runtime.P),
      format = value => value.toFixed(1).replace('.', ',');
    for (const r of runtime.RES) {
      const g = runtime.$(`#${r}Gain`),
        u = runtime.$(`#${r}Use`);
      if (g) {
        g.textContent = `+${format(gain[r])}/mp`;
        g.title = 'Bruttó nyersanyagtermelés és a beállított piaci import teljes működés mellett. Tele raktárnál a többlet nem tárolódik.';
      }
      if (u) {
        u.textContent = `−${format(use[r] || 0)}/mp`;
        u.title = `Teljes működés tervezett nyersanyagigénye, másodpercenként:\nKatonagyártás: ${format(sources.production[r])}\nAutomata zsoldosbérlés: ${format(sources.mercenaries[r])}\nPiaci kivitel: ${format(sources.market[r])}\nA nyersanyaghiány és a megtelt sereg/helyőrség nem csökkenti ezt az értéket. A kikapcsolt termelés nem számít bele. Az egyszeri építkezés és fejlesztésvásárlás nem része a folyamatos igénynek.`;
      }
    }
  };
}
