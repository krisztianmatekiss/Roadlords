// Each upgrade has a minimum rarity and every stronger edition through Rare.
// Relics and building offers use their existing, separate rules.
export const UPGRADE_RARITIES = Object.freeze({
  common: { label: 'GYAKORI', color: '#ecebe2', chance: .70 },
  uncommon: { label: 'RITKA', color: '#83b5e8', chance: .25 },
  rare: { label: 'EPIKUS', color: '#b394df', chance: .05 },
});
const C = Object.freeze({ common: 1, uncommon: 1.5, rare: 2 });
const HALF = Object.freeze({common:.5, uncommon:.75, rare:1});
const ARMY = Object.freeze({common:.6, uncommon:.9, rare:1.2});
const R = Object.freeze({ rare: 1 });
// Status stacks and reserve capacity support fractional bonuses as well.
const WHOLE = C;
export const UPGRADE_EDITIONS = Object.freeze({
  spawn_speed: C, production: C, all_damage: C,
  swordsman_dmg: C, swordsman_hp: C, sword_as: C,
  spear_dmg: C, spear_hp: C, spear_range: C,
  archer_dmg: C, archer_hp: C, archer_range: C,
  knight_dmg: C, knight_hp: C, knight_move: C,
  priest_dmg: C, priest_hp: C, catapult_dmg: C, catapult_hp: C,
  cat_build: C, mage_dmg: C, mage_hp: C, mage_aoe: C,
  frugal_training: {common:1, uncommon:Math.log(.85)/Math.log(.9), rare:Math.log(.8)/Math.log(.9)}, gate_discipline: WHOLE,
  building_discount: C,
  orc_warrior_hp: C, orc_warrior_dmg: C,
  orc_berserker_hp: C, orc_berserker_dmg: C,
  orc_goblin_hp: C, orc_goblin_dmg: C,
  orc_warg_hp: C, orc_warg_dmg: C, orc_shaman_hp: C, orc_shaman_dmg: C,
  orc_ram_hp: C, orc_ram_dmg: C, orc_troll_hp: C, orc_troll_dmg: C,
  orc_bleed: WHOLE, orc_leech: R, orc_double: C,
  orc_wood: C, orc_stone: C, orc_food: C, orc_as: ARMY, orc_hp: ARMY,
  orc_spear_crit: C, orc_curse_duration: C, orc_troll_regen: C,
  orc_crit: {common:.25, uncommon:.375, rare:.5}, orc_refund: R, orc_loot: C, orc_cargo: C,
  orc_cursed_damage: C, orc_move: C, orc_siege_damage: C,
  orc_lifesteal: R, orc_food_discount: C,
  gen_soul_abundance: C, garden_chance: HALF,
  skeleton_common_hp: C, skeleton_common_damage: C,
  zombie_common_hp: C, zombie_common_damage: C,
  ghost_common_hp: C, ghost_common_damage: C,
  necromancer_common_hp: C, necromancer_common_damage: C,
  vampire_common_hp: C, vampire_common_damage: C,
  lich_common_hp: C, lich_common_damage: C,
  skeleton_common_ranged_res: C, zombie_common_poison: WHOLE,
  ghost_common_dodge: C, necro_common_summon_stats: C,
  vampire_common_lifesteal: R, lich_common_respawn: R,
  lich_leg_greedy: R, lich_common_growth: R, zombie_common_burst_radius: R,
  und_death_mend: R, und_home_march: C, und_siege_force: C,
  und_spawn_ward: HALF, und_territory: C,
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
  return upgradeDescriptionAtPower(def,upgradeEditions(def.id)[rarity] || 1);
}
export function upgradeDescriptionAtPower(def,power) {
  if (power === 1) return def.description;
  const fmt = value => value.toLocaleString('hu-HU', {maximumFractionDigits: 2});
  if(def.id==='lich_leg_greedy')return `A Lich támadásonként +${fmt(power)} új célpontra kapcsol sugarat.`;
  if (def.id === 'gate_discipline') return `+${fmt(10*power)}% kapukiengedési sebesség és +${fmt(10*power)} helyőrségi férőhely.`;
  if (def.id === 'orc_bleed') return `A Harcosok találatai +${fmt(power)} Vérzést okoznak.`;
  if (def.id === 'orc_leech') return `Dühöngő: +${fmt(5*power)} százalékpont életlopás.`;
  if (def.id === 'frugal_training') return `Az egységképzés ${fmt(100*(1-.9**power))}%-kal olcsóbb, legfeljebb 50%-kal.`;
  // Scale the effect, leaving caps, loot amounts and other constants intact.
  return def.description.replace(/([+−-]?)(\d+(?:[,.]\d+)?)(?=%| százalékpont| másodperc| méter| gyalogos| méregpont| életer)/u,
    (_, sign, value) => sign + fmt(Number(value.replace(',', '.')) * power));
}
