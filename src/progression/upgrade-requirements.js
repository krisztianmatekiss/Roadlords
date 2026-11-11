// Targets are gameplay metadata, never inferred from artwork or prose. General
// army/economy cards have no target and keep their existing prerequisites.
const unitFamilies = {
  swordsman:'swordsman', sword:'swordsman', spear:'spearman', archer:'archer',
  knight:'knight', priest:'priest', catapult:'catapult', cat:'catapult', mage:'mage',
  skeleton:'und_skeleton', zombie:'und_zombie', ghost:'und_ghost',
  necromancer:'und_necromancer', necro:'und_necromancer', vampire:'und_vampire', lich:'und_lich',
};
const targetUnits = {
  sacred_vow:['priest'], holy_wave:['priest'], holy_retribution:['priest'],
  cavalry_charge:['knight'], momentum:['knight'], phalanx:['spearman'], bloodlust:['swordsman'],
  artillery_sighting:['catapult'],
  orc_bleed:['orc_warrior'], orc_leech:['orc_berserker'], orc_double:['orc_goblin'],
  orc_spear_crit:['orc_warg'], orc_curse_duration:['orc_shaman'], orc_troll_regen:['orc_troll'],
  orc_cargo:['orc_ram'], orc_bers_rage:['orc_berserker'], orc_bers_blood:['orc_berserker'],
  orc_gob_bow:['orc_goblin'], orc_gob_blood:['orc_goblin'], orc_volley:['orc_goblin'],
  orc_warg_instinct:['orc_warg'], orc_warg_hunt:['orc_warg'], orc_predator:['orc_warg'],
  orc_last_blood:['orc_warrior'], orc_horde_heart:['orc_warrior'],
  orc_curse_spread:['orc_shaman'], orc_siege_shield:['orc_ram'], orc_trojan:['orc_ram'],
  orc_glutton:['orc_troll'], orc_last_rampage:['orc_troll'], und_grave_islands:['und_zombie'],
};
const targetBuildings = {
  garden_chance:['und_garden_of_dead'], orc_wood:['orc_work'], orc_stone:['orc_work'], orc_food:['orc_hunt'],
  orc_ancient_deposits:['orc_work'], orc_united_huts:['orc_hut'], orc_crowded_huts:['orc_hut'],
  supply_hub:['warehouse'], campaign_feast:['tavern','rally'], house_militia:['house'],
  armor_extended_range:['armorsmith'], magic_order:['temple'], rally_cavalry_rush:['rally'],
  capital_studies:['keep'], und_compact_wells:['und_well'],
  arm_the_people:['lumber','stonecutter','farm'],
};
// These cards raise a building level themselves and explicitly require L1–L3.
// An L4 prerequisite would make them impossible to obtain.
const progressionCards = new Set(['high_keep','royal_district']);

export function upgradeTargets(id) {
  if (progressionCards.has(id)) return {units:[],buildings:[]};
  if (targetBuildings[id]) return {units:[],buildings:targetBuildings[id]};
  if (targetUnits[id]) return {units:targetUnits[id],buildings:[]};
  const orc=id.match(/^(orc_(?:warrior|berserker|goblin|warg|shaman|ram|troll))_(?:hp|dmg)$/);
  if (orc) return {units:[orc[1]],buildings:[]};
  const family=unitFamilies[id.split('_')[0]];
  return {units:family?[family]:[],buildings:[]};
}
export function createUpgradeRequirements(R) {
  const levelFor=(kind,rarity)=>kind==='legendary'?4:rarity==='rare'?3:rarity==='uncommon'?2:1;
  const matches=(c,b,targets)=>targets.buildings.includes(b.type) || targets.units.length &&
    R.buildingDefinition(c,b.type)?.unit && targets.units.includes(R.effectiveUnitKey(c,b));
  const allowed=(c,option)=>{
    const targets=upgradeTargets(option.id);
    if (!targets.units.length && !targets.buildings.length) return true;
    const level=levelFor(option.kind,option.rarity);
    // Alternative suppliers are valid too (for example an L4 Temple producing
    // Mages). Owning an unlock or a surviving summoned unit is insufficient.
    return c.buildings.some(b=>matches(c,b,targets) && R.levelOf(c,b.type)>=level);
  };
  const text=(option)=>{
    const targets=upgradeTargets(option.id), level=levelFor(option.kind,option.rarity);
    if(!targets.units.length && !targets.buildings.length)return '';
    const names=targets.buildings.map(t=>R.BUILDINGS[t]?.name || t);
    const units=targets.units.map(k=>R.UNITS[k]?.name || k);
    return names.length ? `${names.join(' / ')} · L${level}` : `${units.join(' / ')} termelője · L${level}`;
  };
  const path=(c,option)=>{
    const targets=upgradeTargets(option.id);
    if(!targets.units.length&&!targets.buildings.length)return null;
    const types=Object.keys(R.BUILDINGS).filter(type=>R.factionMatches(c.race,R.BUILDINGS[type],type) &&
      (targets.buildings.includes(type)||targets.units.includes(R.buildingDefinition(c,type)?.unit)||
        c.buildings.some(b=>b.type===type&&matches(c,b,targets))));
    const rank=type=>(R.hasBuilding(c,type)?100:0)+(c.unlocked.has(type)?10:0)+R.levelOf(c,type);
    types.sort((a,b)=>rank(b)-rank(a)||a.localeCompare(b));
    return types.length?{type:types[0],level:levelFor(option.kind,option.rarity)}:null;
  };
  return {allowed,text,path,targets:upgradeTargets};
}
