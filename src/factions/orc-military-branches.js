import { assetUrl } from '../assets/urls.js';
export function initializeFactionsOrcMilitaryBranches(runtime) {
  const O = window.__ROADLORDS_ORCS__;
  runtime.V4_BRANCHES.orc_shaman = [{
    id: 'double_curse',
    name: 'Kettős átok',
    icon: '☠',
    description: 'Minden találat 2 különböző, véletlenszerű átkot okoz.'
  }, {
    id: 'strong_curses',
    name: 'Felerősített átkok',
    icon: '☠',
    description: 'Az átkok kétszer erősebbek: −40% sebzés, −40% maximális életerő, −50% támadási sebesség, +40% kapott sebzés vagy 50% melléütési esély. Időtartamuk változatlan.'
  }];
  runtime.V4_BRANCHES.orc_troll = [{
    id: 'breeding',
    name: 'Trolltenyészet',
    icon: '♟',
    description: 'A Trollverem 2×2 mezős lesz, és több is építhető. A Trollok életereje, sebzése és képzési ára feleződik. Egy Troll továbbra is 4 helyet foglal a seregben és a helyőrségben is.'
  }, {
    id: 'earthshaker',
    name: 'Földrengető',
    icon: '⚒',
    description: 'Minden harmadik csapás 2,5-szeres sugarú területen teljes sebzést okoz, és 1 másodpercre elkábítja az eltalált ellenfeleket. Alapsebzés: 110.'
  }];
  const breeding = c => !!c && runtime.hasBranch(c, 'orc_troll', 'breeding');
  const oldStats = runtime.statsFor;
  runtime.statsFor = function (c, e) {
    const s = oldStats(c, e);
    if (e.key === 'orc_troll' && breeding(c)) {
      s.hp *= .5;
      s.dmg *= .5;
      s.buildingDamage *= .5;
    }
    return s;
  };
  const oldCost = runtime.unitCost;
  runtime.unitCost = function (c, k) {
    const co = oldCost(c, k);
    if (k === 'orc_troll' && breeding(c)) for (const r of runtime.RES) co[r] /= 2;
    return co;
  };
  const oldUnique = runtime.isUniqueBuilding;
  runtime.isUniqueBuilding = (c, t) => t === 'orc_troll' && breeding(c) ? false : oldUnique(c, t);
  let shapeCity = null;
  const scoped = (c, fn, args) => {
    const previous = shapeCity;
    shapeCity = c;
    try {
      return fn(...args);
    } finally {
      shapeCity = previous;
    }
  };
  const oldShape = runtime.rotatedShape;
  runtime.rotatedShape = function (t, r = 0) {
    if (t === 'orc_hut' && runtime.hasLeg(shapeCity || runtime.P, 'orc_crowded_huts')) return [[0, 0]];
    return t === 'orc_troll' && breeding(shapeCity || runtime.P) ? [[0, 0], [0, 1], [1, 0], [1, 1]] : oldShape(t, r);
  };
  const oldCells = runtime.buildingCells;
  runtime.buildingCells = function (b) {
    const c = runtime.P.buildings.includes(b) ? runtime.P : runtime.E.buildings.includes(b) ? runtime.E : shapeCity || runtime.P;
    return scoped(c, oldCells, [b]);
  };
  // Geometry previews must use the target city's shape-changing upgrades.
  runtime.cityBuildingCells = (c, b) => scoped(c, runtime.buildingCells, [b]);
  const oldPlace = runtime.canPlace;
  runtime.canPlace = function (c, ...args) {
    return scoped(c, oldPlace, [c, ...args]);
  };
  const oldFind = runtime.findCell;
  runtime.findCell = function (c, ...args) {
    return scoped(c, oldFind, [c, ...args]);
  };
  const oldFoundation = runtime.placementFoundationCells;
  runtime.placementFoundationCells = function (c, ...args) {
    return scoped(c, oldFoundation, [c, ...args]);
  };
  const oldRender = runtime.renderCity;
  runtime.renderCity = function (container, c, ...args) {
    return scoped(c, oldRender, [container, c, ...args]);
  };
  const oldInspector = runtime.renderInspector;
  runtime.renderInspector = function () {
    const c = runtime.getBuilding(runtime.E, runtime.state.selectedBuilding) ? runtime.E : runtime.P;
    return scoped(c, oldInspector, []);
  };
  const oldRows = runtime.buildingEffectRows;
  runtime.buildingEffectRows = function (c, b) {
    const rows = oldRows(c, b);
    if (b.type === 'orc_troll') {
      rows.push(['Helyfoglalás', breeding(c) ? '2×2 mező' : '3×3 mező'], ['Építhető', breeding(c) ? 'Több példány' : 'Legfeljebb 1'], ['Sereg és helyőrség', '4 hely / Troll']);
    }
    return rows;
  };
  O.trollBreeding = breeding;
  Object.assign(window.__ROADLORDS__, {
    statsFor: runtime.statsFor,
    unitCost: runtime.unitCost,
    isUniqueBuilding: runtime.isUniqueBuilding,
    buildingCells: runtime.buildingCells,
    canPlace: runtime.canPlace,
    findCell: runtime.findCell,
    renderCity: runtime.renderCity,
    buildingEffectRows: runtime.buildingEffectRows
  });
}
