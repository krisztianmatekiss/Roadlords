import { assetUrl } from '../assets/urls.js';
import { adjacentTerrainCount as countTerrain, producerBaseOutput } from './producer-output.js';
export function initializeEconomyTerrainStacking(runtime) {
  window.__ROADLORDS_VERSION__ = '4.9.28-terrain-stacking';
  const adjacentTerrainCount = (c, b, type) => countTerrain(runtime, c, b, type);
  runtime.productionRates = function (c) {
    const k = runtime.hasBranch(c, 'keep', 'empire') ? 16 : runtime.v4LevelValue(runtime.levelOf(c, 'keep'), [1, 2, 4, 8]);
    const global = 1 + .10 * runtime.countNormal(c, 'production');
    const rates = runtime.C(k * global, k * global, k * global);
    for (const b of c.buildings) {
      if (!['lumber', 'stonecutter', 'farm'].includes(b.type)) continue;
      const output = producerBaseOutput(runtime, c, b);
      for (const r of runtime.RES) rates[r] += output[r] * global;
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
