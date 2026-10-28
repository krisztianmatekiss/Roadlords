import { assetUrl } from '../assets/urls.js';
import { fitsUnitRoom } from '../economy/unit-capacity.js';
export function register(runtime) {
  runtime.cardBuildingImageTag = function cardBuildingImageTag(type, cls = 'cardBuildingImage') {
    const src = runtime.CARD_IMAGES[type] || runtime.BUILDING_IMAGES[type];
    return src ? `<img class="${cls}" src="${src}" alt="${runtime.BUILDINGS[type]?.name || ''}" draggable="false">` : `<span>${runtime.BUILDINGS[type]?.icon || ''}</span>`;
  };
  runtime.buildingImageTag = function buildingImageTag(type, cls = 'buildingThumb') {
    const src = runtime.BUILDING_IMAGES[type];
    return src ? `<img class="${cls}" src="${src}" alt="" draggable="false">` : `<span>${runtime.BUILDINGS[type]?.icon || ''}</span>`;
  };
  runtime.buildingSpriteHTML = function buildingSpriteHTML(type, rotation = 0, bounds = null) {
    const src = runtime.BUILDING_IMAGES[type];
    if (!src) return `<span class="bicon">${runtime.BUILDINGS[type]?.icon || ''}</span>`;
    const base = runtime.shapeBounds(type, 0),
      box = bounds || runtime.shapeBounds(type, rotation),
      w = (base.w / box.w * 100).toFixed(3),
      h = (base.h / box.h * 100).toFixed(3),
      deg = (rotation % 4 + 4) % 4 * 90;
    return `<span class="bspriteWrap"${type === 'mastersguild' ? ` style="clip-path:${runtime.lClipFor(type, rotation)}"` : ''}><img class="bsprite" src="${src}" alt="" draggable="false" style="width:${w}%;height:${h}%;transform:rotate(${deg}deg)"></span>`;
  };
  runtime.makeCity = function makeCity(isEnemy = false) {
    return {
      isEnemy,
      resources: runtime.C(150, 75, 40),
      caps: runtime.C(200, 200, 200),
      buildings: [{
        id: isEnemy ? 'e0' : 'p0',
        type: 'keep',
        level: 1,
        row: runtime.CENTER.row,
        col: runtime.CENTER.col,
        rotation: 0,
        progress: 0
      }],
      unlocked: new Set(runtime.BASIC),
      levels: {
        keep: 1
      },
      serial: 1,
      hp: 2000,
      maxHp: 2000,
      armyCap: 50,
      garrison: [],
      garrisonCap: 30,
      releaseQueue: [],
      releaseAcc: 0,
      gateMode: isEnemy ? 'closed' : 'open',
      autoReleasing: false,
      spawnCounter: 0,
      capShotCd: 0,
      normal: {},
      legends: new Set(),
      pickCount: 0,
      towerReward: new Set(),
      lastPick: '',
      aiThink: 0,
      rerolls: 10,
      bans: 5,
      banned: new Set(),
      legendaryDrought: 0,
      terrain: Array(runtime.GRID * runtime.GRID).fill(null)
    };
  };
  runtime.terrainAt = function terrainAt(c, row, col) {
    return c.terrain?.[runtime.idx(row, col)] || null;
  };
  runtime.setTerrain = function setTerrain(c, row, col, type) {
    if (!c.terrain) c.terrain = Array(runtime.GRID * runtime.GRID).fill(null);
    c.terrain[runtime.idx(row, col)] = type ? {
      type
    } : null;
  };
  runtime.terrainBlocks = function terrainBlocks(c, row, col) {
    const t = runtime.terrainAt(c, row, col);
    return !!(t && runtime.TERRAIN[t.type]?.blocked);
  };
  runtime.terrainCellsOfType = function terrainCellsOfType(c, type) {
    const out = [];
    for (let i = 0; i < c.terrain.length; i++) if (c.terrain[i]?.type === type) out.push([Math.floor(i / runtime.GRID), i % runtime.GRID]);
    return out;
  };
  runtime.positiveTerrainComposition = function positiveTerrainComposition() {
    for (let attempt = 0; attempt < 500; attempt++) {
      let left = runtime.POSITIVE_TERRAIN_BUDGET;
      const counts = {
        forest: 0,
        quarry: 0,
        fertile: 0,
        foundation: 0,
        ancient: 0
      };
      let guard = 0;
      while (left > 0 && guard++ < 100) {
        const valid = Object.keys(counts).filter(k => counts[k] < runtime.POSITIVE_TERRAIN_MAX[k] && runtime.POSITIVE_TERRAIN_POINTS[k] <= left);
        if (!valid.length) break;
        const k = runtime.pick(valid);
        counts[k]++;
        left -= runtime.POSITIVE_TERRAIN_POINTS[k];
      }
      if (left === 0) return counts;
    }
    return {
      forest: 2,
      quarry: 2,
      fertile: 4,
      foundation: 1,
      ancient: 1
    };
  };
  runtime.terrainLayoutValid = function terrainLayoutValid(c) {
    const ring = [];
    for (let r = runtime.CENTER.row - 1; r <= runtime.CENTER.row + 2; r++) for (let col = runtime.CENTER.col - 1; col <= runtime.CENTER.col + 2; col++) {
      if (r < 0 || col < 0 || r >= runtime.GRID || col >= runtime.GRID) continue;
      if (r >= runtime.CENTER.row && r <= runtime.CENTER.row + 1 && col >= runtime.CENTER.col && col <= runtime.CENTER.col + 1) continue;
      ring.push([r, col]);
    }
    if (ring.filter(([r, col]) => !runtime.terrainBlocks(c, r, col)).length < 6) return false;
    const rawCan = (type, row, col, rot) => {
      for (const [dr, dc] of runtime.rotatedShape(type, rot)) {
        const r = row + dr,
          cc = col + dc;
        if (r < 0 || cc < 0 || r >= runtime.GRID || cc >= runtime.GRID) return false;
        if (runtime.terrainBlocks(c, r, cc)) return false;
        if ((r === runtime.CENTER.row || r === runtime.CENTER.row + 1) && (cc === runtime.CENTER.col || cc === runtime.CENTER.col + 1)) return false;
      }
      return true;
    };
    let has2 = false,
      hasL = false;
    for (let r = 0; r < runtime.GRID; r++) for (let col = 0; col < runtime.GRID; col++) {
      if (!has2 && rawCan('market', r, col, 0)) has2 = true;
      if (!hasL && runtime.rotationOptions('siegeworks').some(rot => rawCan('siegeworks', r, col, rot))) hasL = true;
    }
    if (!has2 || !hasL) return false;
    for (const type of ['forest', 'quarry']) for (const [r, col] of runtime.terrainCellsOfType(c, type)) {
      if (!runtime.orth(r, col).some(([rr, cc]) => !runtime.terrainBlocks(c, rr, cc) && !((rr === runtime.CENTER.row || rr === runtime.CENTER.row + 1) && (cc === runtime.CENTER.col || cc === runtime.CENTER.col + 1)))) return false;
    }
    return true;
  };
  runtime.generateTerrain = function generateTerrain(c, ruinCount) {
    const keep = runtime.keepCellSet();
    for (let attempt = 0; attempt < 700; attempt++) {
      c.terrain = Array(runtime.GRID * runtime.GRID).fill(null);
      const cells = [];
      for (let r = 0; r < runtime.GRID; r++) for (let col = 0; col < runtime.GRID; col++) if (!keep.has(runtime.idx(r, col))) cells.push([r, col]);
      const takeCell = () => {
        if (!cells.length) return null;
        const i = Math.floor(Math.random() * cells.length);
        return cells.splice(i, 1)[0];
      };
      const counts = runtime.positiveTerrainComposition();
      const types = [];
      for (const [type, n] of Object.entries(counts)) for (let i = 0; i < n; i++) types.push(type);
      for (const type of runtime.shuffle(types)) {
        const cell = takeCell();
        if (!cell) break;
        runtime.setTerrain(c, cell[0], cell[1], type);
      }
      for (let i = 0; i < ruinCount; i++) {
        const cell = takeCell();
        if (!cell) break;
        runtime.setTerrain(c, cell[0], cell[1], 'ruin');
      }
      if (runtime.terrainLayoutValid(c)) return;
    }
    c.terrain = Array(runtime.GRID * runtime.GRID).fill(null);
    const edge = runtime.GRID - 1,
      near = runtime.GRID - 2;
    const fixed = [['forest', 0, 0], ['forest', 0, edge], ['quarry', edge, 0], ['quarry', edge, edge], ['foundation', 2, 1], ['ancient', near, near], ['fertile', 1, 3], ['fertile', 1, 6], ['fertile', near, 3], ['fertile', near, 6]];
    for (const [t, r, col] of fixed) runtime.setTerrain(c, r, col, t);
    const blocked = new Set([...runtime.keepCellSet(), ...fixed.map(x => runtime.idx(x[1], x[2]))]);
    let placed = 0;
    for (let r = 0; r < runtime.GRID && placed < ruinCount; r++) for (let col = 0; col < runtime.GRID && placed < ruinCount; col++) {
      const i = runtime.idx(r, col);
      if (blocked.has(i)) continue;
      if (r >= runtime.CENTER.row - 2 && r <= runtime.CENTER.row + 3 && col >= runtime.CENTER.col - 2 && col <= runtime.CENTER.col + 3) continue;
      runtime.setTerrain(c, r, col, 'ruin');
      placed++;
    }
  };
  runtime.adjacentTerrain = function adjacentTerrain(c, b, type) {
    for (const [r, col] of runtime.buildingCells(b)) for (const [rr, cc] of runtime.orth(r, col)) if (runtime.terrainAt(c, rr, cc)?.type === type) return true;
    return false;
  };
  runtime.buildingOnTerrain = function buildingOnTerrain(c, b, type) {
    return runtime.buildingCells(b).some(([r, col]) => runtime.terrainAt(c, r, col)?.type === type);
  };
  runtime.placementFoundationCells = function placementFoundationCells(c, type, row, col, rotation = 0) {
    return runtime.rotatedShape(type, rotation).map(([dr, dc]) => [row + dr, col + dc]).filter(([r, cc]) => runtime.terrainAt(c, r, cc)?.type === 'foundation');
  };
  runtime.clearTerrain = function clearTerrain(c, row, col, byAI = false) {
    const t = runtime.terrainAt(c, row, col);
    if (!t || !['ruin', 'ancient'].includes(t.type)) return false;
    const def = runtime.TERRAIN[t.type],
      price = runtime.terrainClearPrice(c, t.type);
    if (!runtime.canPay(c, price)) {
      if (!byAI) runtime.toast(`Eltakarítás: ${runtime.costText(price)} · nincs elég nyersanyag.`);
      return false;
    }
    runtime.pay(c, price);
    runtime.setTerrain(c, row, col, null);
    if (t.type === 'ancient') {
      if (c === runtime.P) {
        runtime.queueChoice('ancient');
        runtime.toast('Ősi rom feltárva · +1 Normal pick.');
      } else {
        runtime.grantEnemyPick('ancient', true);
        runtime.E.lastPick = `Ősi rom → ${runtime.E.lastPick}`;
      }
    } else if (!byAI) runtime.toast('Rom eltakarítva.');
    if (!byAI) runtime.renderStatic();
    return true;
  };
  runtime.terrainSummary = function terrainSummary(c) {
    const counts = {
      forest: 0,
      quarry: 0,
      fertile: 0,
      foundation: 0,
      ancient: 0,
      ruin: 0
    };
    for (const t of c.terrain || []) if (t) counts[t.type] = (counts[t.type] || 0) + 1;
    return counts;
  };
  runtime.cityForSide = function cityForSide(side) {
    return side === 'player' ? runtime.P : runtime.E;
  };
  runtime.otherCity = function otherCity(c) {
    return c === runtime.P ? runtime.E : runtime.P;
  };
  runtime.sideForCity = function sideForCity(c) {
    return c === runtime.P ? 'player' : 'enemy';
  };
  runtime.spawnerBuildings = function spawnerBuildings(c) {
    return c.buildings.filter(b => runtime.BUILDINGS[b.type].unit);
  };
  runtime.hasSpawner = function hasSpawner(c) {
    return runtime.spawnerBuildings(c).length > 0;
  };
  runtime.buildingOf = function buildingOf(c, type) {
    return c.buildings.filter(b => b.type === type);
  };
  runtime.hasBuilding = function hasBuilding(c, type) {
    return c.buildings.some(b => b.type === type);
  };
  runtime.getBuilding = function getBuilding(c, id) {
    return c.buildings.find(b => b.id === id);
  };
  runtime.rotatedShape = function rotatedShape(type, rotation = 0) {
    let cells = (runtime.BUILDINGS[type].shape || [[0, 0]]).map(x => [x[0], x[1]]);
    for (let i = 0; i < (rotation % 4 + 4) % 4; i++) cells = cells.map(([r, col]) => [col, -r]);
    const minR = Math.min(...cells.map(x => x[0])),
      minC = Math.min(...cells.map(x => x[1]));
    return cells.map(([r, col]) => [r - minR, col - minC]).sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  };
  runtime.rotationOptions = function rotationOptions(type) {
    const out = [],
      seen = new Set();
    for (let r = 0; r < 4; r++) {
      const key = runtime.rotatedShape(type, r).map(x => x.join(',')).join(';');
      if (!seen.has(key)) {
        seen.add(key);
        out.push(r);
      }
    }
    return out;
  };
  runtime.nextRotation = function nextRotation(type, rotation = 0) {
    const opts = runtime.rotationOptions(type),
      i = opts.indexOf(runtime.normalizedRotation(type, rotation));
    return opts[(i + 1) % opts.length];
  };
  runtime.shapeBounds = function shapeBounds(type, rotation = 0) {
    const cells = runtime.rotatedShape(type, rotation);
    return {
      h: Math.max(...cells.map(x => x[0])) + 1,
      w: Math.max(...cells.map(x => x[1])) + 1,
      cells
    };
  };
  runtime.isLShape = function isLShape(type, rotation = 0) {
    const b = runtime.shapeBounds(type, rotation);
    return b.w === 2 && b.h === 2 && b.cells.length === 3;
  };
  runtime.footprintText = function footprintText(type, rotation = 0) {
    const b = runtime.shapeBounds(type, rotation);
    if (runtime.isLShape(type, rotation)) return 'L alak · 3 mező';
    return `${b.w}×${b.h} · ${b.cells.length} mező`;
  };
  runtime.shapeAnchor = function shapeAnchor(type, rotation = 0) {
    const cells = runtime.rotatedShape(type, rotation),
      has = (r, c) => cells.some(([rr, cc]) => rr === r && cc === c);
    let best = cells[0],
      bestScore = -1;
    for (const cell of cells) {
      const [r, c] = cell,
        score = [[r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]].filter(([rr, cc]) => has(rr, cc)).length;
      if (score > bestScore) {
        best = cell;
        bestScore = score;
      }
    }
    return best;
  };
  runtime.placementOrigin = function placementOrigin(type, rotation, hoverRow, hoverCol) {
    const [ar, ac] = runtime.shapeAnchor(type, rotation);
    return {
      row: hoverRow - ar,
      col: hoverCol - ac
    };
  };
  runtime.buildingCells = function buildingCells(b) {
    return runtime.rotatedShape(b.type, b.rotation || 0).map(([dr, dc]) => [b.row + dr, b.col + dc]);
  };
  runtime.occupancy = function occupancy(c, exceptId = null) {
    const map = new Map();
    for (const b of c.buildings) {
      if (b.id === exceptId) continue;
      for (const [r, col] of runtime.buildingCells(b)) map.set(runtime.idx(r, col), b);
    }
    return map;
  };
  runtime.canPlace = function canPlace(c, type, row, col, rotation = 0, exceptId = null) {
    const occ = runtime.occupancy(c, exceptId);
    for (const [dr, dc] of runtime.rotatedShape(type, rotation)) {
      const r = row + dr,
        cc = col + dc;
      if (r < 0 || cc < 0 || r >= runtime.GRID || cc >= runtime.GRID || occ.has(runtime.idx(r, cc)) || runtime.terrainBlocks(c, r, cc)) return false;
    }
    return true;
  };
  runtime.adjacentBuildings = function adjacentBuildings(c, b) {
    const occ = runtime.occupancy(c, b.id),
      ids = new Set(),
      out = [];
    for (const [r, col] of runtime.buildingCells(b)) for (const [rr, cc] of runtime.orth(r, col)) {
      const other = occ.get(runtime.idx(rr, cc));
      if (other && !ids.has(other.id)) {
        ids.add(other.id);
        out.push(other);
      }
    }
    return out;
  };
  runtime.gateActuallyOpen = function gateActuallyOpen(c) {
    return c.gateMode === 'open' || c.gateMode === 'auto' && c.autoReleasing;
  };
  runtime.spawnFreeFromBuilding = function spawnFreeFromBuilding(c, b) {
    const key = runtime.BUILDINGS[b.type].unit;
    runtime.queueProduced(c, runtime.makeEntry(c, key));
  };
  runtime.setGate = function setGate(mode) {
    const wasOpen = runtime.gateActuallyOpen(runtime.P);
    runtime.P.gateMode = mode;
    if (mode === 'open') {
      runtime.P.autoReleasing = false;
      if (!wasOpen) runtime.openWave(runtime.P);
    } else if (mode === 'closed') {
      runtime.P.autoReleasing = false;
    } else {
      runtime.P.autoReleasing = runtime.P.releaseQueue.length > 0;
      if (!runtime.P.autoReleasing && runtime.P.garrison.length >= runtime.P.garrisonCap) {
        runtime.P.autoReleasing = true;
        runtime.openWave(runtime.P);
      }
    }
    runtime.drawGate();
    runtime.message(mode === 'open' ? 'Kapu nyitva.' : mode === 'closed' ? 'Kapu zárva.' : 'Automata kapu: megtelik → kienged → visszazár.');
  };
  runtime.startBuildingPool = function startBuildingPool(c) {
    return runtime.UNLOCKABLE.filter(k => !c.unlocked.has(k)).map(k => runtime.makeBuildingChoice(c, k));
  };
  runtime.moveTerrainTooltip = function moveTerrainTooltip(e) {
    const pad = 16;
    const w = runtime.terrainTooltip.offsetWidth || 240;
    const h = runtime.terrainTooltip.offsetHeight || 90;
    let x = e.clientX + 18,
      y = e.clientY + 18;
    if (x + w > window.innerWidth - pad) x = e.clientX - w - 18;
    if (y + h > window.innerHeight - pad) y = e.clientY - h - 18;
    runtime.terrainTooltip.style.left = x + 'px';
    runtime.terrainTooltip.style.top = y + 'px';
  };
  runtime.lockedBuildingCount = function lockedBuildingCount(c) {
    return Object.keys(runtime.BUILDINGS).filter(k => k !== 'keep' && !c.unlocked.has(k)).length;
  };
  runtime.isUniqueBuilding = function isUniqueBuilding(c, type) {
    return !!runtime.BUILDINGS[type]?.unique && !(type === 'magetower' && runtime.hasLeg(c, 'mage_proliferation'));
  };
  runtime.inactiveSpawnerCount = function inactiveSpawnerCount(c) {
    return runtime.spawnerBuildings(c).filter(b => b.inactive).length;
  };
  runtime.extraTrainingTime = function extraTrainingTime(c, key, hostLevel = 1) {
    const u = runtime.UNITS[key];
    let t = u.train * 1.5 * [1, .8, .6][hostLevel - 1];
    if (runtime.hasLeg(c, 'no_food')) t *= 1.25;
    const speed = runtime.townMult(c) * (1 + .10 * runtime.countNormal(c, 'spawn_speed')) * runtime.warcenterSpeedMult(c);
    if (runtime.hasLeg(c, 'mobilization')) {
      if (runtime.gateActuallyOpen(c)) return Infinity;
      return t / (speed * 2);
    }
    return t / speed;
  };
  runtime.spawnFreeKey = function spawnFreeKey(c, key) {
    return runtime.queueProduced(c, runtime.makeEntry(c, key));
  };
  runtime.releaseQueues = function releaseQueues(dt) {
    for (const c of [runtime.P, runtime.E]) {
      if (c.gateMode === 'auto' && !c.autoReleasing && c.garrison.reduce((n, e) => n + runtime.orcReserveWeight(e, c), 0) >= c.garrisonCap && c.garrison.length) {
        c.autoReleasing = true;
        runtime.openWave(c);
      }
      if (!runtime.gateActuallyOpen(c)) {
        c.releaseAcc = 0;
        continue;
      }
      if (c.garrison.length && runtime.fieldQueueRoom(c) > 0) runtime.openWave(c);
      if (!c.releaseQueue.length || runtime.fieldUnitCount(c) >= c.armyCap) c.releaseAcc = 0;else c.releaseAcc = (c.releaseAcc || 0) + dt * runtime.gateReleaseRate(c);
      while (c.releaseAcc >= 1 && c.releaseQueue.length && (runtime.battlePopulationRoom?.(c)??Infinity)>=(runtime.battleEntrySeats?.(c.releaseQueue[0])??1) && fitsUnitRoom(c.releaseQueue[0], c.armyCap - runtime.fieldUnitCount(c), runtime.orcArmyWeight(c.releaseQueue[0], c))) {
        c.releaseAcc -= 1;
        runtime.releaseUnit(c, c.releaseQueue.shift());
      }
      if (!c.releaseQueue.length || runtime.fieldUnitCount(c) >= c.armyCap) c.releaseAcc = 0;
      if (c.gateMode === 'auto' && c.autoReleasing && !c.releaseQueue.length && !c.garrison.length) c.autoReleasing = false;
    }
  };
  runtime.placeBuilding = function placeBuilding(c, type, row, col, rotation = 0) {
    const def = runtime.BUILDINGS[type];
    if (!def || !c.unlocked.has(type)) return {
      ok: false,
      reason: 'Ez az épület még nincs feloldva.'
    };
    if (runtime.isUniqueBuilding(c, type) && runtime.hasBuilding(c, type)) return {
      ok: false,
      reason: 'Ebből csak 1 lehet.'
    };
    rotation = runtime.normalizedRotation(type, rotation);
    if (!runtime.canPlace(c, type, row, col, rotation)) return {
      ok: false,
      reason: 'A teljes épület nem fér el ezen a helyen.'
    };
    const foundationCells = runtime.placementFoundationCells(c, type, row, col, rotation),
      price = runtime.placementPrice(c, type, row, col, rotation);
    if (!runtime.pay(c, price)) return {
      ok: false,
      reason: 'Nincs elég nyersanyag.'
    };
    const b = {
      id: ((runtime.MP.enabled && runtime.MP.role === 'guest' ? c === runtime.E : c === runtime.P) ? 'p' : 'e') + c.serial++,
      type,
      level: runtime.levelOf(c, type),
      row,
      col,
      rotation,
      progress: 0,
      paidCost: {
        ...price
      },
      inactive: false
    };
    c.buildings.push(b);
    for (const [r, cc] of foundationCells) runtime.setTerrain(c, r, cc, null);
    runtime.recomputeCity(c, true);
    return {
      ok: true,
      building: b,
      foundationUsed: foundationCells.length > 0,
      price
    };
  };
  runtime.buildingUnlockPool = function buildingUnlockPool(c) {
    return runtime.UNLOCKABLE.filter(k => !c.unlocked.has(k)).map(k => runtime.makeBuildingChoice(c, k));
  };
  runtime.projectedSpawnerNeed = function projectedSpawnerNeed(type) {
    const key = runtime.BUILDINGS[type]?.unit;
    if (!key) return runtime.C();
    const t = runtime.previewTrainingTime(runtime.E, type, runtime.levelOf(runtime.E, type)),
      co = runtime.primarySpawnCost(runtime.E, key);
    return runtime.C(co.wood / t, co.stone / t, co.food / t);
  };
  runtime.extraBarracksSpawn = function extraBarracksSpawn(c, b, key, field) {
    const co = runtime.unitCost(c, key);
    if (runtime.totalProductionRoom(c) <= 0 || !runtime.canPay(c, co)) return false;
    runtime.pay(c, co);
    runtime.queueProduced(c, runtime.makeEntry(c, key));
    b[field] = Math.max(0, (b[field] || 1) - 1);
    return true;
  };
  runtime.inBuildingRange = function inBuildingRange(a, b, range) {
    return runtime.cellsDistance(a, b) <= range;
  };
  runtime.rallyCapacity = function rallyCapacity(c) {
    const r = runtime.buildingOf(c, 'rally')[0];
    if (!r) return 0;
    const base = r.level >= 4 && runtime.hasBranch(c, 'rally', 'war_rally') ? 100 : runtime.v4LevelValue(r.level, [15, 25, 40, 40]);
    return base + runtime.guardhouseBonus(c, 'rally');
  };
  runtime.activeSpawners = function activeSpawners(c) {
    return runtime.spawnerBuildings(c);
  };
  runtime.trainingSpeedBonus = function trainingSpeedBonus(c, b, key) {
    let speed = 1 + .10 * runtime.countNormal(c, 'spawn_speed');
    const imports = runtime.importedResources(c),
      co = runtime.unitCost(c, key);
    if ([...imports].some(r => (co[r] || 0) > 0)) speed *= 1.5;
    if (runtime.hasLeg(c, 'mobilization')) {
      if (runtime.gateActuallyOpen(c)) return 0;
      speed *= 2;
    }
    return speed;
  };
  runtime.trainingTime = function trainingTime(c, b) {
    const key = runtime.effectiveUnitKey(c, b);
    let t = runtime.UNITS[key].train * runtime.v4LevelValue(b.level, [1, .8, .6, .6]);
    if (runtime.hasLeg(c, 'swordsman_triple') && key === 'swordsman') t *= 2;
    if (runtime.hasLeg(c, 'no_food')) t *= 1.25;
    const speed = runtime.trainingSpeedBonus(c, b, key);
    return speed ? t / speed : Infinity;
  };
  runtime.rallyAccepts = function rallyAccepts(c, b) {
    const r = runtime.buildingOf(c, 'rally')[0];
    if (!r || !b) return false;
    return runtime.hasBranch(c, 'rally', 'war_rally') ? runtime.inBuildingRange(r, b, 2) : runtime.adjacentBuildings(c, r).some(x => x.id === b.id);
  };
  runtime.applyTavernOriginBuff = function applyTavernOriginBuff(c, b, e) {
    const tavern = runtime.buildingOf(c, 'tavern')[0];
    if (tavern && runtime.hasBranch(c, 'tavern', 'regulars') && runtime.adjacentBuildings(c, tavern).some(x => x.id === b?.id)) e.permanentTavern = true;
    return e;
  };
  runtime.rallyWaveBuffs = function rallyWaveBuffs(c, entries) {
    const r = runtime.buildingOf(c, 'rally')[0];
    if (!r) return;
    const move = runtime.v4LevelValue(r.level, [1.3, 1.45, 1.6, 1.6]);
    for (const e of entries) {
      e.speedMult = Math.max(e.speedMult || 1, move);
      e.rallySpeedUntilAttack = true;
    }
    if (runtime.hasBranch(c, 'rally', 'lightning_assault')) for (const e of entries) {
      e.speedMult = 2.5;
      e.lightningAssault = true;
    }
    if (runtime.hasBranch(c, 'guardhouse', 'assault_guard') && runtime.buildingOf(c, 'guardhouse').some(g => runtime.adjacentBuildings(c, g).some(x => x.type === 'rally'))) for (const e of entries) e.shieldPct = Math.max(e.shieldPct || 0, .5);
  };
  runtime.updateSpawners = function updateSpawners(c, dt) {
    runtime.updateGarrisonTraining(c, dt);
    runtime.updateCivilianMilitia(c, dt);
    const spawners = runtime.activeSpawners(c);
    if (c.race === 'orc') spawners.sort((a, b) => Number(b.type === 'orc_troll' && b.progress >= 1) - Number(a.type === 'orc_troll' && a.progress >= 1));
    for (const b of spawners) {
      const t = runtime.trainingTime(c, b);
      if (Number.isFinite(t)) {
        b.progress = Math.min(1, (b.progress || 0) + dt / t);
        if (b.progress >= 1 && runtime.normalSpawn(c, b)) b.progress -= 1;
      }
      if (b.type === 'barracks' && runtime.hasLeg(c, 'barracks_spear')) runtime.updateExtraBarracks(c, b, 'spearman', 'spearProgress', dt);
      if (b.type === 'barracks' && runtime.hasLeg(c, 'barracks_archer')) runtime.updateExtraBarracks(c, b, 'archer', 'archerProgress', dt);
    }
    runtime.updateRally(c);
  };
  runtime.releaseRally = function releaseRally(c) {
    if (!c.rallyReserve.length) return;
    const room = runtime.fieldQueueRoom(c),
      wave = runtime.orcTakeArmyRoom(c.rallyReserve, room);
    runtime.rallyWaveBuffs(c, wave);
    runtime.waveBuffs(c, wave);
    for (const e of wave) runtime.releaseUnit(c, e);
  };
  runtime.updateRally = function updateRally(c) {
    if (c.rallyMode === 'open' && c.rallyReserve.length) runtime.releaseRally(c);
    if (c.rallyMode === 'auto' && c.rallyReserve.length >= c.rallyCap && c.rallyCap > 0) runtime.releaseRally(c);
  };
  runtime.setRallyMode = function setRallyMode(c, mode) {
    c.rallyMode = mode;
    if (mode === 'open') runtime.releaseRally(c);
    if (c === runtime.P) {
      runtime.toast(`Gyülekezőtér: ${mode === 'open' ? 'nyitott' : mode === 'closed' ? 'zárt' : 'automata'}.`);
      runtime.renderStatic();
    }
  };
  runtime.reserveCount = function reserveCount(c) {
    return c.garrison.length + c.releaseQueue.length;
  };
  runtime.fieldQueueRoom = function fieldQueueRoom(c) {
    return Math.max(0, c.armyCap - runtime.fieldUnitCount(c) - c.releaseQueue.length);
  };
  runtime.buildingEffectRows = function buildingEffectRows(c, b) {
    const type = b.type,
      lv = b.level,
      rows = [];
    if (type === 'keep') rows.push(['Alaptermelés', `+${runtime.hasBranch(c, 'keep', 'empire') ? 16 : runtime.v4LevelValue(lv, [1, 2, 4, 8])} /mp · minden nyersanyag`], ['Tároló', `${runtime.hasBranch(c, 'keep', 'empire') ? 1600 : runtime.v4LevelValue(lv, [200, 200, 400, 800])} / nyersanyag`], ['Főváros HP', `${runtime.hasBranch(c, 'keep', 'warcapital') ? 320000 : runtime.v4LevelValue(lv, [20000, 40000, 80000, 160000])}`], ['Úti sereglimit', `${runtime.v4LevelValue(lv, [50, 100, 200, 400])}`], ['Kapu', `${runtime.hasBranch(c, 'keep', 'warcapital') ? 'azonnali' : runtime.v4LevelValue(lv, [5, 10, 20, 40]) + ' egység/mp'}`]);else if (['lumber', 'stonecutter', 'farm'].includes(type)) {
      const base = runtime.v4LevelValue(lv, [1, 2, 3, 6]),
        bonus = type === 'lumber' ? runtime.adjacentTerrain(c, b, 'forest') : type === 'stonecutter' ? runtime.adjacentTerrain(c, b, 'quarry') : runtime.buildingOnTerrain(c, b, 'fertile');
      rows.push(['Termelés', `${base * (bonus ? 2 : 1) * runtime.guildMultiplier(c, b)} ${type === 'lumber' ? 'Fa' : type === 'stonecutter' ? 'Kő' : 'Élelem'} /mp`], ['Terepbónusz', bonus ? 'AKTÍV · ×2' : 'Nincs']);
    } else if (type === 'warehouse') rows.push(['Tárolókapacitás', `+${runtime.v4LevelValue(lv, [150, 300, 600, 1500])} / nyersanyag`]);else if (type === 'house') rows.push(['Úti sereglimit', `+${runtime.v4LevelValue(lv, [10, 15, 20, 40])}`]);else if (type === 'guildhouse') rows.push(['Hatótáv', runtime.hasBranch(c, type, 'guild_network') ? '3 mező' : '2 mező'], ['Termelési bónusz', runtime.hasBranch(c, type, 'master_guild') ? '+125%' : runtime.hasBranch(c, type, 'guild_network') ? '+75%' : `+${runtime.v4LevelValue(lv, [25, 50, 75, 75])}%`]);else if (type === 'market') rows.push(['Kereskedelmi tempó', `${runtime.marketRate(lv)} /mp`], ['Hatékonyság', `${Math.round(runtime.marketEfficiency(lv) * 100)}%`]);else if (type === 'townhall') rows.push(['Hatótáv', '2 mező'], ['Lakóházbónusz', runtime.hasBranch(c, type, 'metropolis') ? '+200%' : `+${Math.round((runtime.v4LevelValue(lv, [1.5, 1.75, 2, 2]) - 1) * 100)}%`]);else if (type === 'rally') rows.push(['Saját tartalék', `${c.rallyReserve.length} / ${c.rallyCap}`], ['Gyülekezési kör', runtime.hasBranch(c, type, 'war_rally') ? '2 mező' : 'közvetlen szomszéd'], ['Mozgási bónusz', runtime.hasBranch(c, type, 'lightning_assault') ? '+150% az első támadásig' : `+${Math.round((runtime.v4LevelValue(lv, [1.3, 1.45, 1.6, 1.6]) - 1) * 100)}%`]);else if (type === 'tavern') rows.push([runtime.hasBranch(c, type, 'bottoms_up') ? 'Első 4 támadás' : 'Első 2 támadás', runtime.hasBranch(c, type, 'bottoms_up') ? '+250% sebzés' : `+${Math.round((runtime.v4LevelValue(lv, [1.5, 2, 2.5, 2.5]) - 1) * 100)}% sebzés`]);else if (type === 'guardhouse') rows.push(['Aktív hely', runtime.touchesWall(b) ? 'Városfal' : runtime.adjacentBuildings(c, b).some(x => x.type === 'rally') ? 'Gyülekezőtér' : 'Nincs megfelelő szomszéd'], ['Kapacitás', `+${lv >= 4 ? 80 : runtime.v4LevelValue(lv, [20, 30, 45])}`]);else if (type === 'warcenter') rows.push(['Közös számláló', `${c.warProductionCounter % (runtime.hasBranch(c, type, 'assembly_line') ? 3 : 4)} / ${runtime.hasBranch(c, type, 'assembly_line') ? 3 : runtime.hasBranch(c, type, 'quality_arms') ? 4 : runtime.v4LevelValue(lv, [8, 6, 4, 4])}`], ['Ingyenes másolat', `minden ${runtime.hasBranch(c, type, 'assembly_line') ? 3 : runtime.hasBranch(c, type, 'quality_arms') ? 4 : runtime.v4LevelValue(lv, [8, 6, 4, 4])}. egység`]);
    if (lv >= 4 && runtime.branchLabel(c, type)) rows.unshift(['L4 specializáció', runtime.branchLabel(c, type)]);
    return rows;
  };
  runtime.rallyControlsHTML = function rallyControlsHTML(c) {
    return `<div class="rallyControls"><button data-rally="open" class="${c.rallyMode === 'open' ? 'active' : ''}">NYITOTT</button><button data-rally="closed" class="${c.rallyMode === 'closed' ? 'active' : ''}">ZÁRT</button><button data-rally="auto" class="${c.rallyMode === 'auto' ? 'active' : ''}">AUTOMATA</button></div>`;
  };
  runtime.terrainTooltipHtml = function terrainTooltipHtml(def, t) {
    const desc = t.type === 'forest' ? 'A mellette álló Favágó termelése megduplázódik.' : t.type === 'quarry' ? 'A mellette álló Kővágó termelése megduplázódik.' : t.type === 'fertile' ? 'Az ide épített Farm termelése megduplázódik.' : t.type === 'foundation' ? 'Az ide épített épület 50%-kal olcsóbb.' : t.type === 'ruin' ? 'El kell takarítani, mielőtt használhatnád ezt a mezőt.' : t.type === 'ancient' ? 'El kell takarítani, utána egy extra választást kapsz.' : def.tip,
      extra = ['ancient','ruin'].includes(t.type) ? `<div class="ttCost">Eltakarítás: ${runtime.costText(runtime.terrainClearPrice(runtime.P,t.type))}${t.type==='ancient'?' · Jutalom: +1 választás':''}</div>` : '';
    return `<div class="ttTitle">${def.name}</div><div class="ttDesc">${desc}</div>${extra}`;
  };
  runtime.recomputeCity = function recomputeCity(c, preserve = true) {
    const keep = runtime.buildingOf(c, 'keep')[0],
      old = c.maxHp || 2000,
      ratio = old ? c.hp / old : 1,
      kl = keep.level;
    let storage = runtime.v4LevelValue(kl, [200, 200, 400, 800]),
      gar = 30 + runtime.guardhouseBonus(c, 'main') + 5 * runtime.countNormal(c, 'gate_discipline'),
      army = runtime.v4LevelValue(kl, [50, 100, 200, 400]);
    if (runtime.hasBranch(c, 'keep', 'empire')) storage = 1600;
    for (const b of c.buildings) {
      if (b.type === 'warehouse') storage += runtime.v4LevelValue(b.level, [150, 300, 600, 1500]);
      if (b.type === 'house') {
        let val = runtime.v4LevelValue(b.level, [10, 15, 20, 40]);
        const hall = runtime.buildingOf(c, 'townhall')[0];
        if (hall && runtime.inBuildingRange(hall, b, 2)) {
          if (runtime.hasBranch(c, 'townhall', 'metropolis')) val *= 3;else val *= runtime.v4LevelValue(hall.level, [1.5, 1.75, 2, 2]);
          if (runtime.hasBranch(c, 'townhall', 'fortress_city')) gar += 10;
        }
        army += val;
      }
    }
    if (runtime.hasLeg(c, 'large_garrison')) gar *= 2;
    c.caps = runtime.C(storage, storage, storage);
    runtime.RES.forEach(r => c.resources[r] = Math.min(c.resources[r], c.caps[r]));
    c.garrisonCap = Math.round(gar);
    c.armyCap = Math.round(army);
    const hpBase = runtime.hasBranch(c, 'keep', 'warcapital') ? 320000 : runtime.v4LevelValue(kl, [20000, 40000, 80000, 160000]);
    c.maxHp = hpBase;
    c.hp = preserve ? runtime.clamp(ratio * c.maxHp, 0, c.maxHp) : c.maxHp;
    c.rallyCap = runtime.rallyCapacity(c);
    if (c.rallyReserve.length > c.rallyCap) c.garrison.push(...c.rallyReserve.splice(c.rallyCap));
  };
  runtime.gateReleaseRate = function gateReleaseRate(c) {
    if (runtime.hasBranch(c, 'keep', 'warcapital')) return 9999;
    return runtime.v4LevelValue(runtime.levelOf(c, 'keep'), [5, 10, 20, 40]) * (runtime.hasLeg(c, 'large_garrison') ? 2 : 1) * (1 + .10 * runtime.countNormal(c, 'gate_discipline'));
  };
  runtime.updateGarrisonTraining = function updateGarrisonTraining(c, dt) {
    if (!runtime.hasLeg(c, 'long_training')) return;
    for (const list of [c.garrison, c.releaseQueue, c.rallyReserve]) for (const e of list) {
      if (e.veteran) continue;
      e.waitTime = (e.waitTime || 0) + dt;
      if (e.waitTime >= 20) e.veteran = true;
    }
  };
  runtime.updateCivilianMilitia = function updateCivilianMilitia(c, dt) {
    if (!runtime.hasLeg(c, 'arm_the_people')) return;
    const workers = c.buildings.filter(x => ['lumber', 'stonecutter', 'farm'].includes(x.type)).length,
      groups = Math.min(3, Math.floor(workers / 5));
    if (!groups) return;
    c.civilianMilitiaProgress = (c.civilianMilitiaProgress || 0) + dt / 30;
    while (c.civilianMilitiaProgress >= 1) {
      c.civilianMilitiaProgress--;
      for (let i = 0; i < groups; i++) if (!runtime.spawnFreeKey(c, 'swordsman')) break;
    }
  };
  runtime.sustainableSpawner = function sustainableSpawner(type) {
    const rates = runtime.productionRates(runtime.E),
      use = runtime.consumptionRates(runtime.E),
      add = runtime.projectedSpawnerNeed(type),
      target = runtime.aiResourceTargets(add);
    return runtime.RES.every(r => rates[r] >= target[r] || runtime.E.resources[r] >= (runtime.BUILDINGS[type]?.cost?.[r] || 0) + (runtime.unitCost(runtime.E, runtime.BUILDINGS[type].unit)[r] || 0) * 3);
  };
  runtime.warModeProfile = function warModeProfile(c) {
    const w = runtime.buildingOf(c, 'warcenter')[0];
    if (!w) return {
      mode: null,
      costDelta: 0,
      timePenalty: 0,
      speedBonus: 0,
      eliteBonus: 0
    };
    const mode = c.warMode || 'mass',
      i = Math.min(2, Math.max(0, w.level - 1)),
      optimized = runtime.hasBranch(c, 'warcenter', 'optimized_economy'),
      total = runtime.hasBranch(c, 'warcenter', 'total_war'),
      advMult = total ? 2 : 1,
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
  };
  runtime.warModeSummary = function warModeSummary(c) {
    const p = runtime.warModeProfile(c);
    if (p.mode === 'economy') return `Egységköltség ${runtime.signedPct(p.costDelta)} · gyártási idő ${runtime.signedPct(p.timePenalty)}`;
    if (p.mode === 'elite') return `HP és sebzés ${runtime.signedPct(p.eliteBonus)} · költség ${runtime.signedPct(p.costDelta)} · idő ${runtime.signedPct(p.timePenalty)}`;
    return `Gyártási sebesség ${runtime.signedPct(p.speedBonus)} · egységköltség ${runtime.signedPct(p.costDelta)}`;
  };
  runtime.setWarMode = function setWarMode(c, mode, force = false) {
    if (!['mass', 'economy', 'elite'].includes(mode) || !runtime.hasBuilding(c, 'warcenter')) return false;
    const wait = 30 - (runtime.state.time - (c.warModeChangedAt ?? -30));
    if (!force && wait > 0) {
      if (c === runtime.P) runtime.toast(`Új irány ${Math.ceil(wait)} mp múlva választható.`);
      return false;
    }
    c.warMode = mode;
    c.warModeChangedAt = runtime.state.time;
    if (c === runtime.P) {
      runtime.toast(`Haditermelési irány: ${runtime.WAR_MODE_NAMES[mode]}.`);
      runtime.renderInspector();
      runtime.renderStatic();
    }
    return true;
  };
  runtime.armorSmithForSpawner = function armorSmithForSpawner(c, b) {
    const a = runtime.buildingOf(c, 'armorsmith')[0];
    return a && b && runtime.adjacentBuildings(c, a).some(x => x.id === b.id) ? a : null;
  };
  runtime.applyArmorSmithEntry = function applyArmorSmithEntry(c, b, entry) {
    const a = runtime.armorSmithForSpawner(c, b);
    if (!a) return entry;
    const pct = runtime.hasBranch(c, 'armorsmith', 'heavy_armor') ? 1 : runtime.hasBranch(c, 'armorsmith', 'spiked_armor') ? .6 : runtime.v4LevelValue(a.level, [.30, .45, .60, .60]);
    entry.shieldPct = Math.max(entry.shieldPct || 0, pct);
    entry.armorShieldPct = Math.max(entry.armorShieldPct || 0, pct);
    if (runtime.hasBranch(c, 'armorsmith', 'heavy_armor')) entry.armorMoveMult = .85;
    if (runtime.hasBranch(c, 'armorsmith', 'spiked_armor')) entry.thornArmor = true;
    return entry;
  };
  runtime.hospitalRescueData = function hospitalRescueData(c, target) {
    const h = runtime.buildingOf(c, 'hospital')[0];
    if (!h || target.hospitalSaved || target.tempClone || target.temporary > 0 || runtime.reserveCount(c) >= c.garrisonCap) return null;
    const chance = runtime.hasBranch(c, 'hospital', 'mass_rescue') ? .60 : runtime.hasBranch(c, 'hospital', 'full_recovery') ? .40 : runtime.v4LevelValue(h.level, [.20, .30, .40, .40]);
    if (Math.random() >= chance) return null;
    return {
      hp: runtime.hasBranch(c, 'hospital', 'full_recovery') ? 1 : .5,
      chance
    };
  };
  runtime.updateEnemyWarModeV45 = function updateEnemyWarModeV45() {
    if (!runtime.hasBuilding(runtime.E, 'warcenter') || runtime.state.time - (runtime.E.warModeChangedAt ?? -30) < 30) return;
    const rates = runtime.productionRates(runtime.E),
      use = runtime.consumptionRates(runtime.E),
      strained = runtime.RES.some(r => runtime.E.resources[r] < 20 || use[r] > rates[r] * 1.05),
      behind = runtime.fieldUnitCount(runtime.E) + runtime.reserveCount(runtime.E) < runtime.fieldUnitCount(runtime.P) + runtime.reserveCount(runtime.P) * .75;
    runtime.setWarMode(runtime.E, strained ? 'economy' : behind ? 'elite' : 'mass', true);
  };
  runtime.cityVisualSignature = function cityVisualSignature(c) {
    const terrain = (c.terrain || []).map(t => t?.type || '').join(','),
      buildings = c.buildings.map(b => `${b.id}:${b.type}:${b.level}:${b.row}:${b.col}:${b.rotation || 0}:${b.inactive ? 1 : 0}`).join('|');
    return `${terrain}§${buildings}`;
  };
  runtime.v491GuardhousePlacementValid = function v491GuardhousePlacementValid(c, row, col, rotation = 0) {
    const fake = {
      id: 'guardhouse-preview',
      type: 'guardhouse',
      row,
      col,
      rotation
    };
    const net = runtime.v491GuardhouseNetwork(c, fake);
    return net.wall || net.rally;
  };
  runtime.buildCardFootprintV41004 = function buildCardFootprintV41004(type) {
    const shape = (runtime.BUILDINGS[type]?.shape || [[0, 0]]).map(([r, c]) => [Number(r) || 0, Number(c) || 0]);
    const maxR = Math.max(0, ...shape.map(x => x[0])),
      maxC = Math.max(0, ...shape.map(x => x[1])),
      set = new Set(shape.map(([r, c]) => `${r}:${c}`));
    let cells = '';
    for (let r = 0; r <= maxR; r++) for (let c = 0; c <= maxC; c++) cells += `<i class="${set.has(`${r}:${c}`) ? 'on' : 'off'}"></i>`;
    return `<span class="pickFootprint" style="--fp-cols:${maxC + 1};--fp-rows:${maxR + 1}" aria-hidden="true">${cells}</span>`;
  };
  runtime.v4915ApplyBuildingDiscount = function v4915ApplyBuildingDiscount(c, price) {
    const stacks = Math.min(5, runtime.countNormal(c, 'building_discount'));
    if (stacks <= 0) return runtime.C(price.wood || 0, price.stone || 0, price.food || 0);
    const mult = 1 - .10 * stacks;
    const cut = v => v > 0 ? Math.max(1, Math.ceil(v * mult - 1e-9)) : 0;
    return runtime.C(cut(price.wood || 0), cut(price.stone || 0), cut(price.food || 0));
  };
  runtime.tavernPermanentMult35 = function tavernPermanentMult35(c, e) {
    return e.tavernBaseBonus != null ? 1 + (e.tavernBaseBonus + .1 * runtime.countNormal(c, 'tavern_damage')) * (e.tavernBuffScale || 1) : e.permanentTavernMult || 2.5;
  };
  runtime.orcReserveWeight = function orcReserveWeight(entry, c) {
    if (entry?.key === 'orc_troll') return 4;
    return entry?.key === 'orc_goblin' && runtime.hasBranch(c, 'orc_gob', 'swarm') ? 0 : 1;
  };
  runtime.orcGateBonuses = function orcGateBonuses(c) {
    return runtime.gateActuallyOpen(c) || c.race === 'orc' && runtime.hasBranch(c, 'keep', 'orc_command');
  };
}
