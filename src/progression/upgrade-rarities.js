// An upgrade's scope and mechanics determine its available editions. A missing
// edition is intentional; relics and building offers use their existing rules.
export const UPGRADE_RARITIES = Object.freeze({
  common: { label: 'GYAKORI', color: '#ecebe2', chance: .70 },
  uncommon: { label: 'NEM GYAKORI', color: '#6ed58a', chance: .25 },
  rare: { label: 'RITKA', color: '#bd8bef', chance: .05 },
});
const C = { common: 1 }, U = { uncommon: 1 }, R = { rare: 1 };
const CU = { common: 1, uncommon: 1.5 }, CUR = { common: 1, uncommon: 1.5, rare: 2 };
const CR = { common: 1, rare: 2 };
export const UPGRADE_EDITIONS = Object.freeze({
  spawn_speed: CU, production: C, all_damage: U,
  swordsman_dmg: CUR, swordsman_hp: CUR, sword_as: U,
  spear_dmg: CU, spear_hp: CU, spear_range: CR,
  archer_dmg: CU, archer_hp: CU, archer_range: U,
  knight_dmg: CU, knight_hp: CU, knight_move: U,
  priest_dmg: CU, priest_hp: CU, catapult_dmg: CU, catapult_hp: CU,
  cat_build: U, mage_dmg: CU, mage_hp: CU, mage_aoe: U,
  frugal_training: U, tower_crews: R, gate_discipline: C,
  building_discount: U, tower_regen: C,
  orc_warrior_hp: CUR, orc_warrior_dmg: CUR,
  orc_berserker_hp: CU, orc_berserker_dmg: CU,
  orc_goblin_hp: CU, orc_goblin_dmg: CU,
  orc_warg_hp: CU, orc_warg_dmg: CU, orc_shaman_hp: CU, orc_shaman_dmg: CU,
  orc_ram_hp: CU, orc_ram_dmg: CU, orc_troll_hp: CU, orc_troll_dmg: CU,
  orc_bleed: C, orc_leech: U, orc_double: CR,
  orc_wood: C, orc_stone: C, orc_food: C, orc_as: U, orc_hp: U,
  orc_spear_crit: U, orc_curse_duration: C, orc_troll_regen: U,
  orc_crit: R, orc_refund: R, orc_loot: C, orc_cargo: C,
  orc_cursed_damage: CU, orc_move: C, orc_siege_damage: U,
  orc_lifesteal: R, orc_food_discount: U,
  gen_soul_abundance: C, garden_chance: U,
  skeleton_common_hp: CUR, skeleton_common_damage: CUR,
  zombie_common_hp: CU, zombie_common_damage: CU,
  ghost_common_hp: CU, ghost_common_damage: CU,
  necromancer_common_hp: CU, necromancer_common_damage: CU,
  vampire_common_hp: CU, vampire_common_damage: CU,
  lich_common_hp: CU, lich_common_damage: CU,
  skeleton_common_ranged_res: CU, zombie_common_poison: C,
  ghost_common_dodge: CR, necro_common_summon_stats: CU,
  vampire_common_lifesteal: U, lich_common_respawn: R,
  und_death_mend: R, und_home_march: C, und_siege_force: C,
  und_spawn_ward: {common:.5, uncommon:1}, und_territory: C,
});

export function upgradeEditions(id) { return UPGRADE_EDITIONS[id] || C; }
export function upgradeRarity(option) {
  const editions = upgradeEditions(option.id);
  return Object.hasOwn(editions, option.rarity) ? option.rarity : Object.keys(editions)[0];
}
export function normalOptionPower(option) {
  // Legacy scripted grants have exactly their historical strength.
  return option.rarity ? upgradeEditions(option.id)[upgradeRarity(option)] : 1;
}
export function upgradeDescription(def, rarity) {
  const power = upgradeEditions(def.id)[rarity] || 1;
  if (power === 1) return def.description;
  // Only explicitly linear percentage effects have powered editions. Leave
  // caps, durations and unrelated figures in the same sentence unchanged.
  return def.description.replace(/([+−-]?)(\d+(?:[,.]\d+)?)(?=%| százalékpont)/u,
    (_, sign, value) => sign + (Number(value.replace(',', '.')) * power).toLocaleString('hu-HU', {maximumFractionDigits: 2}));
}
