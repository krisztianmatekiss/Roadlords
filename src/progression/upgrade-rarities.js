// Each upgrade has a minimum rarity and every stronger edition through Rare.
// Relics and building offers use their existing, separate rules.
export const UPGRADE_RARITIES = Object.freeze({
  common: { label: 'GYAKORI', color: '#ecebe2', chance: .70 },
  uncommon: { label: 'NEM GYAKORI', color: '#6ed58a', chance: .25 },
  rare: { label: 'RITKA', color: '#bd8bef', chance: .05 },
});
const C = Object.freeze({ common: 1, uncommon: 1.5, rare: 2 });
const U = Object.freeze({ uncommon: 1, rare: 1.5 });
const R = Object.freeze({ rare: 1 });
// Whole stacks/seats stay integral; the first-hit unlock bonuses remain intact.
const WHOLE = Object.freeze({ common: 1, uncommon: 2, rare: 3 });
export const UPGRADE_EDITIONS = Object.freeze({
  spawn_speed: C, production: C, all_damage: U,
  swordsman_dmg: C, swordsman_hp: C, sword_as: U,
  spear_dmg: C, spear_hp: C, spear_range: C,
  archer_dmg: C, archer_hp: C, archer_range: U,
  knight_dmg: C, knight_hp: C, knight_move: U,
  priest_dmg: C, priest_hp: C, catapult_dmg: C, catapult_hp: C,
  cat_build: U, mage_dmg: C, mage_hp: C, mage_aoe: U,
  frugal_training: {uncommon:1, rare:Math.log(.925)/Math.log(.95)}, tower_crews: R, gate_discipline: WHOLE,
  building_discount: U, tower_regen: C,
  orc_warrior_hp: C, orc_warrior_dmg: C,
  orc_berserker_hp: C, orc_berserker_dmg: C,
  orc_goblin_hp: C, orc_goblin_dmg: C,
  orc_warg_hp: C, orc_warg_dmg: C, orc_shaman_hp: C, orc_shaman_dmg: C,
  orc_ram_hp: C, orc_ram_dmg: C, orc_troll_hp: C, orc_troll_dmg: C,
  orc_bleed: WHOLE, orc_leech: {uncommon:1, rare:2}, orc_double: C,
  orc_wood: C, orc_stone: C, orc_food: C, orc_as: U, orc_hp: U,
  orc_spear_crit: U, orc_curse_duration: C, orc_troll_regen: U,
  orc_crit: R, orc_refund: R, orc_loot: C, orc_cargo: C,
  orc_cursed_damage: C, orc_move: C, orc_siege_damage: U,
  orc_lifesteal: R, orc_food_discount: U,
  gen_soul_abundance: C, garden_chance: U,
  skeleton_common_hp: C, skeleton_common_damage: C,
  zombie_common_hp: C, zombie_common_damage: C,
  ghost_common_hp: C, ghost_common_damage: C,
  necromancer_common_hp: C, necromancer_common_damage: C,
  vampire_common_hp: C, vampire_common_damage: C,
  lich_common_hp: C, lich_common_damage: C,
  skeleton_common_ranged_res: C, zombie_common_poison: WHOLE,
  ghost_common_dodge: C, necro_common_summon_stats: C,
  vampire_common_lifesteal: U, lich_common_respawn: R,
  und_death_mend: R, und_home_march: C, und_siege_force: C,
  und_spawn_ward: {common:.5, uncommon:1, rare:1.5}, und_territory: C,
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
  const fmt = value => value.toLocaleString('hu-HU', {maximumFractionDigits: 2});
  if (def.id === 'gate_discipline') return `+${fmt(10*power)}% kapukiengedési sebesség és +${fmt(5*power)} helyőrségi férőhely.`;
  if (def.id === 'orc_bleed') return `A Harcos találatai ${fmt(1+power)} Vérzést okoznak. További felvételenként +${fmt(power)} Vérzés.`;
  if (def.id === 'orc_leech') return `Dühöngő: ${fmt(3+2*power)}% életlopás, további felvételenként +${fmt(2*power)} százalékpont.`;
  if (def.id === 'frugal_training') return `Az egységképzés ${fmt(100*(1-.95**power))}%-kal olcsóbb.`;
  // Scale the effect, leaving caps, loot amounts and other constants intact.
  return def.description.replace(/([+−-]?)(\d+(?:[,.]\d+)?)(?=%| százalékpont| másodperc| méter| gyalogos| méregpont| életer)/u,
    (_, sign, value) => sign + fmt(Number(value.replace(',', '.')) * power));
}
