// Shared balance values for simulation, cards and the encyclopedia.
export const ORC_REDESIGN = {
  arena: [.2, .3, .4, .6], hut: [25, 35, 50, 75],
  hunt: [.75, 1, 1.5, 3], totem: [300, 260, 220, 160],
  raid: [.05, .08, .12, .2], pack: .015,
};
export const KELTETO = {speed: [.4, .6, .8, 1], skeleton: [.2, .25, .3, .35]};
export const TAVERN = {hits: [2, 3, 4, 6], bonus: [1, 1.25, 1.5, 1.5]};
export const levelValue = (level, values) => values[Math.max(0, Math.min(values.length - 1, (level || 1) - 1))];
export const territoryPower = c => c?.race === 'undead' && c.l4Branches?.keep === 'dead_realm' ? 2 : 1;
export const undeadEliteChance = (c, produced = false) => Math.min(1,
  (produced && c?.l4Branches?.keep === 'elite_dominion' ? .5 : 0) + (c?.legends?.has('und_elite_birth') ? .2 : 0));
export const REMOVED_BUILDINGS = new Set(['hospital', 'towercommand', 'alchemist', 'academy', 'orc_altar', 'und_soul_harvester']);
