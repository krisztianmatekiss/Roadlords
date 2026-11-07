import { BATTLE_UNIT_LIMIT } from './battle-population.js';
import { ORC_REDESIGN, levelValue } from '../data/faction-redesign.js';

// One capacity policy for recomputation, placement, presentation and AI.
// The actor ceiling remains separate: Trolls still use four army slots.
export const MAX_ARMY_CAPACITY = BATTLE_UNIT_LIMIT;

export function installArmyCapacity(R) {
  const states = new WeakMap();
  R.armyCapacityLimit = MAX_ARMY_CAPACITY;
  R.armyCapacityBonus = (c, b) => {
    if (b.type === 'house') return levelValue(b.level, [10,15,20,40]) * (R.townhallPower?.(c,b) || 1);
    if (b.type === 'und_crypt') return levelValue(b.level, [20,30,40,80]);
    if (b.type !== 'orc_hut') return 0;
    const bonus = levelValue(b.level, ORC_REDESIGN.hut) * (R.hasLeg(c,'orc_crowded_huts') ? .5 : 1);
    return R.hasLeg(c,'orc_united_huts') ? c.orcHutMode === 'reserve' ? 0 : bonus * 2 : bonus;
  };
  R.capacityAddsReserve = (c, type) => type === 'house' && R.hasLeg(c,'house_militia') ||
    type === 'orc_hut' && (!R.hasLeg(c,'orc_united_huts') || c.orcHutMode === 'reserve');
  R.canBuildArmyCapacity = (c, type) => !['house','und_crypt','orc_hut'].includes(type) ||
    c.armyCap < MAX_ARMY_CAPACITY || R.capacityAddsReserve(c,type);
  R.armyCapacityState = c => states.get(c);
  const recompute = R.recomputeCity;
  R.recomputeCity = (c, preserve = true) => {
    const out = recompute(c,preserve), raw = c.armyCap;
    const bonuses = c.buildings.map(b => [b,R.armyCapacityBonus(c,b)]);
    const base = Math.max(0,raw - bonuses.reduce((n,[,value]) => n + value,0));
    let room = Math.max(0,MAX_ARMY_CAPACITY-base);
    const buildings = new Map();
    // Stable construction order identifies surplus buildings after upgrades.
    for (const [b,bonus] of bonuses) if (bonus > 0) {
      const effective = Math.min(room,bonus);room -= effective;
      buildings.set(b.id,{bonus,effective,redundant:effective <= 0 && !R.capacityAddsReserve(c,b.type)});
    }
    c.armyCap = Math.min(MAX_ARMY_CAPACITY,raw);
    c.armyCapBase = c.armyCap + (c.towerGuardSlots || 0);
    states.set(c,{raw,base,buildings});
    return out;
  };
}
