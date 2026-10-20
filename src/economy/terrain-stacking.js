import { assetUrl } from '../assets/urls.js';
export function initializeEconomyTerrainStacking(runtime) {
  window.__ROADLORDS_VERSION__ = '4.9.28-terrain-stacking';
  function adjacentTerrainCount(c, b, type) {
    const seen = new Set();
    for (const [r, col] of runtime.buildingCells(b)) {
      for (const [rr, cc] of runtime.orth(r, col)) {
        if (runtime.terrainAt(c, rr, cc)?.type === type) seen.add(runtime.idx(rr, cc));
      }
    }
    return seen.size;
  }
  runtime.productionRates = function (c) {
    const k = runtime.hasBranch(c, 'keep', 'empire') ? 16 : runtime.v4LevelValue(runtime.levelOf(c, 'keep'), [1, 2, 4, 8]);
    const global = 1 + .10 * runtime.countNormal(c, 'production');
    const rates = runtime.C(k * global, k * global, k * global),
      lv = [1, 2, 3, 6];
    for (const b of c.buildings) {
      const val = (lv[b.level - 1] || lv[3]) * runtime.guildMultiplier(c, b) * global;
      if (b.type === 'lumber') {
        const n = adjacentTerrainCount(c, b, 'forest');
        rates.wood += val * (1 + n);
      }
      if (b.type === 'stonecutter') {
        const n = adjacentTerrainCount(c, b, 'quarry');
        rates.stone += val * (1 + n);
      }
      if (b.type === 'farm') rates.food += val * (runtime.buildingOnTerrain(c, b, 'fertile') ? 2 : 1);
    }
    if (runtime.hasLeg(c, 'full_garrison_economy') && runtime.reserveCount(c) >= c.garrisonCap && c.garrisonCap > 0) runtime.RES.forEach(r => rates[r] *= 2);
    return rates;
  };
  runtime.producerHasBonus = function (c, type, b) {
    return type === 'lumber' ? adjacentTerrainCount(c, b, 'forest') > 0 : type === 'stonecutter' ? adjacentTerrainCount(c, b, 'quarry') > 0 : type === 'farm' ? runtime.buildingOnTerrain(c, b, 'fertile') : false;
  };
  const oldRowsV4928 = runtime.buildingEffectRows;
  runtime.buildingEffectRows = function (c, b) {
    if (['lumber', 'stonecutter', 'farm'].includes(b.type)) {
      const levels = [1, 2, 3, 6],
        base = runtime.v4LevelValue(b.level, levels),
        gm = runtime.guildMultiplier(c, b),
        name = b.type === 'lumber' ? 'Fa' : b.type === 'stonecutter' ? 'Kő' : 'Élelem';
      let terrainMult = 1,
        terrainLabel = 'Nincs';
      if (b.type === 'lumber') {
        const n = adjacentTerrainCount(c, b, 'forest');
        terrainMult = 1 + n;
        if (n) terrainLabel = `${n}× Erdő · +${n * 100}%`;
      } else if (b.type === 'stonecutter') {
        const n = adjacentTerrainCount(c, b, 'quarry');
        terrainMult = 1 + n;
        if (n) terrainLabel = `${n}× Szikla · +${n * 100}%`;
      } else if (runtime.buildingOnTerrain(c, b, 'fertile')) {
        terrainMult = 2;
        terrainLabel = 'Termékeny föld · +100%';
      }
      const rows = [];
      if (b.level >= 4 && runtime.branchLabel(c, b.type)) rows.push(['L4 specializáció', runtime.branchLabel(c, b.type)]);
      rows.push(['Alaptermelés', `${base} ${name} /mp`], ['Terepbónusz', terrainLabel], ['Tényleges termelés', `${(base * terrainMult * gm).toFixed(2).replace(/\.00$/, '')} ${name} /mp`]);
      return rows;
    }
    return oldRowsV4928(c, b);
  };
  const oldDecorateProducerIcons = typeof decorateProducerIcons === 'function' ? decorateProducerIcons : null;
  if (runtime.MP?.lobby) {
    const ver = runtime.MP.lobby.querySelector('.menuVersion');
    if (ver) ver.textContent = 'V4.9.28 · P2P';
  }
  runtime.$('.brand small').textContent = 'V4.9.28 · P2P 1V1';
}
