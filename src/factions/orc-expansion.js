import { ORC_EXPANSION as B, ORC_COMMON_ADDITIONS, ORC_LEGEND_ADDITIONS } from '../data/orc-expansion.js';

export function initializeOrcExpansion(R) {
  const orc = c => c?.race === 'orc';
  const army = c => c.buildings.some(b => R.BUILDINGS[b.type]?.unit);
  const producer = (c, type) => c.buildings.some(b => b.type === type);
  for (const [id, name, description] of ORC_COMMON_ADDITIONS) R.NORMAL.push({
    id, name, description, race: 'orc', icon: '✦',
    eligible: c => orc(c) && army(c)
      && (id !== 'orc_cursed_damage' || producer(c, 'orc_shaman'))
      && (id !== 'orc_food_discount' || R.countNormal(c, id) < 7),
  });
  for (const [id, name, description] of ORC_LEGEND_ADDITIONS) R.LEGENDARY.push({
    id, name, description, race: 'orc', icon: '✦',
    eligible: c => orc(c) && (id === 'orc_enemy_ancestors' ? producer(c, 'orc_totem') : army(c)),
  });
  const stats = R.statsFor;
  R.statsFor = (c, e) => {
    const s = stats(c, e);
    if (!orc(c) || !e.key?.startsWith('orc_')) return s;
    const power = 1 + (R.hasLeg(c, 'orc_skip_power') ? (c.orcSkippedUpgrades || 0) * B.skipPower : 0);
    s.hp *= power; s.dmg *= power; s.buildingDamage *= power;
    s.speed *= 1 + R.countNormal(c, 'orc_move') * B.movement;
    s.buildingDamage *= 1 + R.countNormal(c, 'orc_siege_damage') * B.siegeDamage;
    return s;
  };
  const damage = R.attackBaseDamage;
  R.attackBaseDamage = (u, t, mult = 1) => {
    const amount=damage(u,t,mult),c=R.cityForSide(u.side);
    const count=orc(c)&&u.key?.startsWith('orc_')?R.countNormal(c,'orc_cursed_damage'):0;
    if (count && t?.side!==u.side) for(const curse in t.orcCurses) if(t.orcCurses[curse]>0) return amount*(1+B.cursedDamage*count);
    return amount;
  };
  const cost = R.unitCost;
  const structure = R.attackStructure;
  R.attackStructure = (u, target) => {
    const c=R.cityForSide(u.side), previous=u.damage;
    // Siege units read buildingDamage; other Orc attacks use damage and a structure penalty.
    if (orc(c) && u.key.startsWith('orc_') && u.cat!=='siege') u.damage *= 1 + B.siegeDamage * R.countNormal(c,'orc_siege_damage');
    try { return structure(u,target); } finally { u.damage=previous; }
  };
  R.unitCost = (c, key) => {
    const price = cost(c, key),count=orc(c)&&key.startsWith('orc_')?R.countNormal(c,'orc_food_discount'):0;
    return count ? {...price, food: price.food * (1 - Math.min(B.maximumFoodDiscount, B.foodDiscount * count))} : price;
  };
  R.recordOrcSkippedUpgrade = c => {
    if (!orc(c) || !R.hasLeg(c, 'orc_skip_power')) return false;
    c.orcSkippedUpgrades = (c.orcSkippedUpgrades || 0) + 1;
    R.refreshExistingUnitsForCity(c);
    return true;
  };
  // Only an explicit skip earns the bonus; rerolls, bans and choosing another card do not.
  const button = R.$('#skipChoice'), previousSkip = button.onclick;
  button.onclick = function(event) {
    const context = R.state.choiceContext;
    if (context && R.state.startChoices === 0 && context.source !== 'high_keep_branch' && !button.disabled) R.recordOrcSkippedUpgrade(R.P);
    return previousSkip.call(this, event);
  };
  R.MP_STRATEGY_KEYS.push('orcSkippedUpgrades');
  const applyGuest = R.mpApplyGuestStrategy;
  R.mpApplyGuestStrategy = (data, seq) => {
    const count=Number(data?.orcSkippedUpgrades);
    return applyGuest(data ? {...data, orcSkippedUpgrades:Number.isFinite(count)?Math.max(0,Math.floor(count)):0} : data, seq);
  };
  Object.assign(window.__ROADLORDS__, {statsFor:R.statsFor, attackBaseDamage:R.attackBaseDamage, attackStructure:R.attackStructure, unitCost:R.unitCost, mpApplyGuestStrategy:R.mpApplyGuestStrategy});
}
