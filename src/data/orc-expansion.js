// Shared by live combat, previews and the encyclopedia.
export const ORC_EXPANSION = Object.freeze({
  cursedDamage: .06, movement: .05, siegeDamage: .15, lifesteal: .03,
  foodDiscount: .08, maximumFoodDiscount: .5, skipPower: .04,
});
export const ORC_COMMON_ADDITIONS = [
  ['orc_cursed_damage', 'Rontott sebek', 'Minden ork egység +6% sebzést okoz megátkozott ellenségeknek.', 'curse'],
  ['orc_move', 'Hordamenet', 'Minden ork egység mozgási sebessége +5%.', 'move'],
  ['orc_siege_damage', 'Erődrombolók', 'Minden ork egység tornyok és a főváros elleni sebzése +15%.', 'siege'],
  ['orc_lifesteal', 'Vérszomjas horda', 'Minden ork egység +3 százalékpont életlopást kap.', 'lifesteal'],
  ['orc_food_discount', 'Hadi fejadag', 'Minden ork egység élelemköltsége −8%, legfeljebb −50%.', 'food'],
];
export const ORC_LEGEND_ADDITIONS = [
  ['orc_skip_power', 'Megvetett zsákmány', 'Minden kihagyott választás után az ork egységek +4% életerőt és sebzést kapnak.', 'skip'],
  ['orc_enemy_ancestors', 'Ellenségvér az ősöknek', 'Minden harcban elesett ellenség +1 halálpontot ad az Ősök Totemének.', 'totem'],
];
