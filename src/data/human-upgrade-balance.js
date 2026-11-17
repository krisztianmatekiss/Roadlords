// Counts are accumulated rarity strength; caps apply to the actual effect.
export const HUMAN_UPGRADES = Object.freeze({
  trainingSpeed: .05,
  maximumTrainingSpeed: .5,
  trainingDiscount: .10,
  maximumTrainingDiscount: .5,
  garrisonSlots: 10,
});
export const trainingSpeedBonus = n => Math.min(HUMAN_UPGRADES.maximumTrainingSpeed,HUMAN_UPGRADES.trainingSpeed*n);
export const trainingCostMultiplier = n => Math.max(1-HUMAN_UPGRADES.maximumTrainingDiscount,(1-HUMAN_UPGRADES.trainingDiscount)**n);
export const TRAINING_DISCOUNT_STRENGTH_LIMIT = Math.log(1-HUMAN_UPGRADES.maximumTrainingDiscount)/Math.log(1-HUMAN_UPGRADES.trainingDiscount);
