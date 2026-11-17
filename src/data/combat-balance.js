// Approved balance changes. Shared by combat rules and derived relic bonuses.
export const ORC_BALANCE = Object.freeze({
  warriorHp: 300,
  trollSecondaryDamage: 35,
  goblinBowDamageMultiplier: 1.2,
  goblinBowRangeMultiplier: 1.4,
  goblinBowAttackSpeedMultiplier: .85,
  buildingRefundPerStack: .12,
  buildingRefundMaximum: .6
});

export const GOBLIN_BOW_COPY = 'A Goblin íjat kap: +20% sebzés, +40% hatótáv és −15% támadási sebesség.';
export const MAGE_SECONDARY_DAMAGE = .45;

// Road and castle tower firing ranges, in world coordinates (10 = 1 metre).
export const TOWER_RANGE = Object.freeze({ road: 500, gate: 500 });

// Siege uses its dedicated building damage; these multipliers apply to others.
export const STRUCTURE_DAMAGE_MULTIPLIER = Object.freeze({tower: .10, capital: 1/3});
