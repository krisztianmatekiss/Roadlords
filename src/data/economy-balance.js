// V4.54: construction slows expansion; training times and terrain rewards stay intact.
import { ARMY_TEMPO } from './unit-balance.js';
export const ECONOMY_BALANCE = Object.freeze({
  basicBuildingPrice: 1.25,
  advancedBuildingPrice: 1.4,
  ruinClearing: 4,
  ancientClearing: 10,
  suddenDeathAt: 20 * 60,
});
export const UNDEAD_ECONOMY = Object.freeze({
  startingSouls: 100,
  abundancePerStack: .05,
  frugalReduction: .4,
  trainingBonus: .25,
  bankInterest: [.05, .06, .08, .10],
  soulDamageThreshold: 1000,
});
export const UNDEAD_REMOVED_BUILDINGS = new Set(['und_soul_burner', 'und_soul_overdrive', 'und_soul_harvester']);
export const UNDEAD_TRAINING_PRICES = Object.freeze(Object.fromEntries(Object.entries({
  und_skeleton:13,und_skeleton_archer:13,und_zombie:26,
  und_ghost:18,und_necromancer:70,und_vampire:75,und_lich:100,
}).map(([key,price])=>[key,Math.round(price*ARMY_TEMPO.trainingCost)])));
