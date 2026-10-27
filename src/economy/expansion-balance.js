import { ECONOMY_BALANCE as B } from '../data/economy-balance.js';

export function initializeExpansionBalance(R) {
  const base = R.v4915UndiscountedBuildPrice;
  const basics = new Set([...R.BASIC, ...R.factionBasics('orc')]);
  R.v4915UndiscountedBuildPrice = (c, type) => {
    const price = base(c, type);
    if (c.race === 'undead' || type === 'keep') return price;
    const multiplier = basics.has(type) ? B.basicBuildingPrice : B.advancedBuildingPrice;
    return R.C(...R.RES.map(key => Math.ceil((price[key] || 0) * multiplier / 5) * 5));
  };
  for (const [type, multiplier] of [['ruin', B.ruinClearing], ['ancient', B.ancientClearing]]) {
    const d = R.TERRAIN[type];
    d.clear = R.C(...R.RES.map(key => (d.clear[key] || 0) * multiplier));
    d.tip = `Eltakarítás: ${d.clear.wood} Fa + ${d.clear.stone} Kő.${type === 'ancient' ? ' Jutalom: +1 gyakori választás.' : ''}`;
  }
  // One price source for player tooltips, payment and both faction AIs.
  R.terrainClearPrice = (c, type) => c.race === 'undead'
    ? R.C(type === 'ancient' ? 1000 : type === 'ruin' ? 100 : 20)
    : R.TERRAIN[type]?.clear || R.C();
}
