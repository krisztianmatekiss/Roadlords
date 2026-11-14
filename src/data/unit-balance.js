// Base prices are raised once, before city discounts and faction modifiers.
export const TRAINING_COST_MULTIPLIER = 1.25;
export const ARMY_TEMPO = Object.freeze({movement:1.25,trainingTime:1.25,trainingCost:1.25,necroSummonInterval:28.125});
// Relative to 4.76: slow heavy producers retain their value, ranged swarms slow most.
// Apply at the shared base, before building levels, speed upgrades and discounts.
export const TRAINING_TIME_MULTIPLIERS = Object.freeze({
  swordsman:1.4,spearman:1.4,archer:1.65,knight:1.35,priest:1.4,catapult:1.4,mage:1.6,
  orc_warrior:1.4,orc_berserker:1.45,orc_goblin:1.7,orc_warg:1.35,orc_shaman:1.45,orc_ram:1.35,orc_troll:1.3,
  und_skeleton:1.5,und_skeleton_archer:1.5,und_zombie:1.45,und_ghost:1.5,und_necromancer:1.5,und_vampire:1.4,und_lich:1.45,
});
export const trainingDuration=(base,key)=>base*ARMY_TEMPO.trainingTime*TRAINING_TIME_MULTIPLIERS[key];
function apportionedPrice(base,multiplier) {
  const resources = ['wood', 'stone', 'food'];
  const exact = resources.map(key => (base[key] || 0) * multiplier);
  const values = exact.map(Math.floor);
  let remaining = Math.round(exact.reduce((sum, n) => sum + n, 0)) - values.reduce((sum, n) => sum + n, 0);
  const order = resources.map((_, i) => i).sort((a, b) => (exact[b] - values[b]) - (exact[a] - values[a]) || a - b);
  for (const i of order) if (remaining > 0 && exact[i] > 0) { values[i]++; remaining--; }
  return Object.fromEntries(resources.map((key, i) => [key, values[i]]));
}
export function trainingPrice(base) {
  // Preserve the previous release's integer split, then raise that base by 25%.
  return apportionedPrice(apportionedPrice(base,TRAINING_COST_MULTIPLIER),ARMY_TEMPO.trainingCost);
}
export const ORC_TRAINING = Object.freeze(Object.fromEntries(Object.entries({
  orc_war: [8.5, 7.5, 6.5],
  orc_bers: [8, 7, 6],
  orc_gob: [3.5, 2.75, 2],
  orc_warg: [11, 10, 9],
  orc_shaman: [9, 7.2, 5.4],
  orc_ram: [12, 11, 10],
  orc_troll: [24, 19.2, 14.4],
}).map(([key,times])=>[key,times.map(t=>trainingDuration(t,{orc_war:'orc_warrior',orc_bers:'orc_berserker',orc_gob:'orc_goblin'}[key]||key))])));
export const UNDEAD_TRAINING = Object.freeze(Object.fromEntries(Object.entries({
  und_graveyard: ['und_skeleton', [5, 4, 3, 3]],
  und_morgue: ['und_zombie', [8, 6.4, 4.8, 4.8]],
  und_ghost_spawner: ['und_ghost', [6, 4.8, 3.6, 3.6]],
  und_necro_spawner: ['und_necromancer', [14, 11.2, 8.4, 8.4]],
  und_vampire_castle: ['und_vampire', [16, 12.8, 9.6, 9.6]],
  und_lich_spawner: ['und_lich', [18, 14.4, 10.8, 10.8]],
}).map(([key,[unit,times]])=>[key,[unit,times.map(t=>trainingDuration(t,unit))]])));
