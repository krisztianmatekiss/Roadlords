// Rules exposed to the shared planner, not separate faction build orders.
// Numeric stats, prices, income, footprint and training time are read from the
// live game. These tags describe triggers that a DPS preview cannot observe.
export const BUILDING_MECHANICS = {
  lumber: { produces: ['wood'] }, stonecutter: { produces: ['stone'] }, farm: { produces: ['food'] },
  orc_work: { produces: ['wood', 'stone'] }, orc_hunt: { produces: ['food'] }, und_well: { produces: ['wood'] },
  warehouse: { storage: true }, market: { storage: true, features: ['exchange'] },
  house: { capacity: true }, orc_hut: { capacity: true, reserve: true }, und_crypt: { capacity: true },
  guardhouse: { reserve: true }, rally: { reserve: true, local: true, features: ['wave'] },
  tavern: { local: true, features: ['burst'] }, armorsmith: { local: true, features: ['shield'] },
  townhall: { localSupport: true, features: ['amplify'] },
  guildhouse: { features: ['economy'] }, library: { features: ['choices'] }, mastersguild: { features: ['choices'] },
  warcenter: { features: ['training'] },
  orc_arena: { local: true, features: ['elite'] }, orc_overseer: { local: true, features: ['training'] },
  orc_slave: { features: ['economy'] }, orc_totem: { features: ['choices', 'kills'] },
  orc_raider: { local: true, features: ['summon'] }, orc_tunnel: { local: true, features: ['flank'] },
  und_soul_bank: { features: ['economy', 'savings'] },
  und_soul_anchor: { localUpkeep: true, features: ['upkeep'] },
  und_bone_forge: { features: ['death', 'summon'] }, und_plague_chamber: { features: ['poison'] },
  und_corrupted_hatchery: { local: true, exclude: ['und_graveyard'], features: ['training'] },
  und_rebirth_tomb: { features: ['death', 'revive'] },
  und_garden_of_dead: { features: ['death', 'revive', 'territory'] },
  und_border_obelisk: { features: ['territory'] }, und_dark_tower: { features: ['territory', 'defense'] },
  und_soul_rift: { features: ['summon', 'territory'] },
  und_otherworld_portal: { features: ['territory', 'flank'] },
};

// Expected contribution of conditional effects over a typical engagement.
// These are AI valuation weights, never combat/balance changes. Stat buffs are
// measured by the evaluator and must not be counted a second time here.
const GROUPS = [
  [['chain_spawn', 'every10', 'factory_network', 'mobilization', 'und_twin_training'], .22, ['training']],
  [['sword_execute', 'sword_whirlwind', 'spear_pierce', 'mage_triple', 'double_assault'], .35, ['attack']],
  [['phalanx', 'spear_brace', 'mage_ward', 'archer_close_combat', 'knight_dismount'], .28, ['survival']],
  [['sacred_vow', 'holy_wave', 'holy_retribution'], .25, ['heal']],
  [['cavalry_charge', 'road_rush', 'momentum', 'orc_momentum'], .30, ['charge']],
  [['bloodlust', 'marking_arrow', 'artillery_sighting', 'combined_assault'], .22, ['attack']],
  [['regen', 'full_garrison_economy', 'overproduction', 'stockpile_production', 'arm_the_people'], .18, ['economy']],
  [['specialization', 'wide_choice', 'double_choice', 'instant_l3', 'strategic_superiority', 'capital_studies'], .24, ['choices']],
  [['campaign_feast', 'house_militia', 'armor_extended_range', 'magic_order', 'rally_cavalry_rush', 'high_keep', 'royal_district', 'supply_hub'], .20, ['support']],
  [['castle_defenders', 'tower_salvo', 'tower_rebuild'], .18, ['defense']],
  [['orc_bers_rage', 'orc_bers_blood', 'orc_gob_blood', 'orc_last_blood', 'orc_last_rampage'], .30, ['survival']],
  [['orc_gob_bow', 'orc_volley', 'orc_warg_instinct', 'orc_predator', 'orc_hunt'], .30, ['attack']],
  [['orc_curse_master', 'orc_curse_spread', 'orc_dispel'], .32, ['curse']],
  [['orc_siege_shield', 'orc_trojan', 'orc_glutton'], .30, ['siege']],
  [['orc_horde_heart', 'orc_inherit', 'orc_transfusion'], .22, ['death']],
  [['orc_veteran_kills', 'orc_skip_power'], .26, ['elite']],
  [['orc_siege_loot', 'orc_ancient_deposits', 'orc_united_huts', 'orc_crowded_huts', 'orc_revenge'], .18, ['economy']],
  [['skeleton_leg_archer', 'skeleton_leg_guard'], .30, ['survival']],
  [['zombie_leg_retribution', 'zombie_leg_poisoned_hunt', 'zombie_leg_half_poison'], .38, ['poison', 'death']],
  [['ghost_leg_mirror', 'ghost_leg_shadow_leap'], .35, ['dodge']],
  [['necro_leg_siege', 'necro_leg_spirits'], .40, ['summon']],
  [['vampire_leg_shield', 'vampire_leg_dual', 'vampire_leg_frenzy', 'vampire_leg_night_predator'], .35, ['lifesteal']],
  [['vampire_leg_infection'], .60, ['revive', 'kills']],
  [['lich_leg_greedy', 'lich_leg_shield'], .40, ['beam']],
  [['und_rise_skeleton', 'und_rise_archer', 'und_raise_enemy'], .25, ['death', 'revive']],
  [['und_death_chain'], .45, ['death', 'kills']],
  [['und_army_leech', 'und_first_guard', 'und_ranged_adaptation'], .25, ['survival']],
  [['und_fast_poison', 'und_wandering_plague'], .40, ['poison']],
  [['und_grave_islands'], .25, ['poison', 'territory']],
  [['und_withered_foundations'], .25, ['territory', 'siege']],
  [['und_elite_birth'], .20, ['elite', 'summon']],
  [['und_compact_wells'], 0, ['economy']], // The live preview measures halved income/upkeep and reclaimed plots.
  [['und_soul_might'], .02, ['savings']],
  [['spear_range'], .045, ['survival']],
  [['orc_bleed', 'orc_leech', 'orc_double', 'orc_crit', 'orc_spear_crit', 'orc_lifesteal'], .035, ['attack']],
  [['orc_blessing', 'orc_troll_regen'], .04, ['survival']],
  [['orc_curse_duration', 'orc_cursed_damage'], .045, ['curse']],
  [['orc_refund', 'orc_loot', 'orc_cargo'], .04, ['economy']],
  [['skeleton_common_ranged_res'], .045, ['survival']],
  [['zombie_common_poison'], .10, ['poison']],
  [['necro_common_summon_stats'], .08, ['summon']],
  [['vampire_common_lifesteal'], .055, ['lifesteal']],
  [['lich_common_respawn'], .06, ['revive']],
  [['und_death_mend', 'und_spawn_ward'], .045, ['survival', 'death']],
  [['und_home_march'], .035, ['territory']], [['und_siege_force'], .045, ['siege']],
  [['und_territory'], .025, ['territory']], [['garden_chance'], .06, ['revive']],
  [['tower_crews', 'tower_regen'], .04, ['defense']],
];
export const CONDITIONAL_EFFECTS = Object.fromEntries(GROUPS.flatMap(([ids, weight, features]) =>
  ids.map(id => [id, { weight, features }])));

export const UNIT_FEATURES = {
  swordsman: ['melee'], spearman: ['melee', 'counter'], archer: ['ranged'], knight: ['charge', 'melee'],
  priest: ['heal'], mage: ['ranged', 'area'], catapult: ['siege', 'area'],
  orc_warrior: ['melee'], orc_berserker: ['melee', 'survival'], orc_goblin: ['ranged', 'dodge'],
  orc_warg: ['charge', 'ranged', 'melee'], orc_shaman: ['curse'], orc_troll: ['siege', 'area', 'melee'], orc_ram: ['siege'],
  und_skeleton: ['melee', 'death'], und_skeleton_archer: ['ranged', 'death'], und_zombie: ['poison', 'death'],
  und_ghost: ['dodge', 'melee'], und_necromancer: ['summon'], und_vampire: ['lifesteal', 'kills', 'revive'], und_lich: ['beam'],
};

export function cardTargets(R, card) {
  const def = (card.kind === 'legendary' ? R.LEGENDARY : R.NORMAL).find(x => x.id === card.id) || card;
  const scoped = Object.keys(R.UNITS).filter(key => R.UNITS[key].name === def.scope);
  if (scoped.length) return scoped.includes('und_skeleton') ? ['und_skeleton','und_skeleton_archer'] : scoped;
  const specific={
    phalanx:['spearman'],magic_order:['priest','mage'],rally_cavalry_rush:['knight'],
    orc_last_blood:['orc_warrior'],orc_horde_heart:['orc_warrior'],orc_volley:['orc_goblin'],
    orc_hunt:['orc_warg'],orc_predator:['orc_warg'],orc_curse_master:['orc_shaman'],
    orc_curse_spread:['orc_shaman'],orc_dispel:['orc_shaman'],orc_siege_shield:['orc_ram'],
    orc_trojan:['orc_ram'],orc_cargo:['orc_ram'],orc_glutton:['orc_troll'],orc_last_rampage:['orc_troll'],
    orc_bleed:['orc_warrior'],orc_leech:['orc_berserker'],orc_double:['orc_goblin'],
    orc_spear_crit:['orc_warg'],orc_curse_duration:['orc_shaman'],
  }[card.id];
  if(specific)return specific;
  const prefix = {
    sword: 'swordsman', swordsman: 'swordsman', spear: 'spearman', archer: 'archer',
    knight: 'knight', cavalry: 'knight', priest: 'priest', holy: 'priest', sacred: 'priest',
    mage: 'mage', catapult: 'catapult', cat: 'catapult', artillery: 'catapult', marking: 'archer',
    skeleton: 'und_skeleton', zombie: 'und_zombie', ghost: 'und_ghost', necro: 'und_necromancer',
    necromancer: 'und_necromancer', vampire: 'und_vampire', lich: 'und_lich',
  }[card.id.split('_')[0]];
  if (prefix) return prefix === 'und_skeleton' ? [prefix, 'und_skeleton_archer'] : [prefix];
  for (const [part, key] of Object.entries({warrior:'orc_warrior',bers:'orc_berserker',berserker:'orc_berserker',gob:'orc_goblin',goblin:'orc_goblin',warg:'orc_warg',shaman:'orc_shaman',ram:'orc_ram',troll:'orc_troll'})) {
    if (card.id.startsWith('orc_' + part + '_')) return [key];
  }
  return [];
}
