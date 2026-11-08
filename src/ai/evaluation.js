import { BUILDING_MECHANICS, CONDITIONAL_EFFECTS, UNIT_FEATURES, cardTargets } from './mechanics.js';
import { ORC_REDESIGN, TAVERN, levelValue, undeadEliteChance, REMOVED_BUILDINGS } from '../data/faction-redesign.js';
import { ARMY_TEMPO } from '../data/unit-balance.js';
import { UNDEAD_CONVERGENCE as CONVERGENCE } from '../data/undead-convergence.js';

const positive = n => Math.max(0, Number(n) || 0);
const bounded = (n, lo, hi) => Math.max(lo, Math.min(hi, n));

export function installAiEvaluation(R) {
  const effects = new WeakMap();
  function activeEffects(c) {
    const signature=JSON.stringify([c.normal,[...c.legends],c.legendaryStacks]);
    const cached=effects.get(c);
    if(cached?.signature===signature)return cached.items;
    const items=[];
    for(const [id,effect]of Object.entries(CONDITIONAL_EFFECTS)) {
      const stacks=(c.normal[id]||0)+(c.legends.has(id)?Math.max(1,c.legendaryStacks?.[id]||1):0);
      if(!stacks||id==='und_soul_might'||effect.features.some(x=>['choices','economy','support','defense','training'].includes(x)))continue;
      items.push({...effect,stacks,targets:cardTargets(R,{id,kind:c.legends.has(id)?'legendary':'normal'})});
    }
    effects.set(c,{signature,items});return items;
  }
  R.aiBuildingMechanics = type => BUILDING_MECHANICS[type] || {};
  R.aiFactionBuildings = c => Object.keys(R.BUILDINGS).filter(type =>
    R.factionMatches(c.race, R.BUILDINGS[type], type) && !REMOVED_BUILDINGS.has(type));
  R.aiResourceKeys = c => R.RES.filter(r => R.aiFactionBuildings(c).some(type =>
    BUILDING_MECHANICS[type]?.produces?.includes(r)));

  // Never call applyChoice, setBuildingLevel or makeEntry on a preview: those
  // paths can emit picks, refresh real troops, roll RNG, or update match stats.
  R.aiPreview = (city, change, measure = c => R.aiCityMetrics(c), owner = city) => {
    const shadow = structuredClone(city), side = owner === R.P ? 'P' : 'E', original = R[side], cache = R.aiDecisionCache;
    delete shadow._aiShared;
    R[side] = shadow;
    R.aiDecisionCache = null;
    try {
      change(shadow);
      R.recomputeCity(shadow, true);
      return measure(shadow);
    } finally {
      R[side] = original;
      R.aiDecisionCache = cache;
    }
  };
  R.aiProjectChoice = (shadow,o) => {
    if (o.kind === 'building') shadow.unlocked.add(o.id);
    else if (o.kind === 'normal') shadow.normal[o.id] = (shadow.normal[o.id] || 0) + 1;
    else if (o.kind === 'legendary') {
      const count = shadow.legendaryStacks?.[o.id] || (shadow.legends.has(o.id) ? 1 : 0);
      shadow.legends.add(o.id);
      shadow.legendaryStacks = { ...shadow.legendaryStacks, [o.id]: count + 1 };
    } else {
      const level = o.kind === 'building_branch' ? 4 : R.upgradeTargetLevel(shadow, o.id);
      shadow.levels[o.id] = level;
      if (o.branch) shadow.l4Branches[o.id] = o.branch;
      for (const b of shadow.buildings) if (b.type === o.id) b.level = level;
    }
  };
  R.aiPreviewChoice = (c, o, measure) => R.aiPreview(c, shadow => R.aiProjectChoice(shadow,o), measure);

  R.aiUnitQuality = (c, key, b = null) => {
    const base = R.UNITS[key];
    if (!base) return 0;
    const entry = { key, originBuildingId: b?.id, firstMult: 1, firstHits: 0, shieldPct: 0, veteran: R.monoVeteran(c) };
    R.applyArmorSmithEntry?.(c, b, entry);
    const stats = R.statsFor(c, entry), features = UNIT_FEATURES[key] || base.tags || [];
    const ranged = base.tags.includes('ranged');
    let hp = stats.hp * (1 + positive(entry.shieldPct)), damage = stats.dmg / Math.max(.1, stats.cooldown);
    if (key === 'und_lich') damage *= 10; // Sustained ramping beams, not its nominal 5-second attack.
    if (key === 'und_necromancer') {
      const sk = R.statsFor(c, { key: 'und_skeleton', undSummoned: true });
      damage += sk.dmg / sk.cooldown * 3 * 10 / ARMY_TEMPO.necroSummonInterval;
    }
    if (key === 'und_ghost') {
      const intangible=R.hasLeg(c,'ghost_leg_intangible');
      hp /= Math.max(.2,1-Math.min(intangible ? .8 : .7,.4+.05*R.countNormal(c,'ghost_common_dodge')+(intangible ? .2 : 0)));
    }
    if (key === 'und_vampire') hp *= 1.3;
    if (key === 'orc_goblin') hp *= 1.2;
    if (key === 'orc_shaman') damage += Math.min(20,R.activeSpawners(c).length*1.5);
    if(c.race==='undead')damage*=R.undSoulDamageMult(c);
    if (b) {
      const taverns = R.buildingOf(c, 'tavern').filter(t => R.aiBuildingsTouch(c, t, b));
      if (taverns.length) {
        const strength=t=>levelValue(t.level,TAVERN.bonus)*(R.townhallPower?.(c,t)||1);
        const t = taverns.reduce((a, x) => strength(x)>strength(a)?x:a);
        damage *= 1 + levelValue(t.level, TAVERN.bonus) * Math.min(1, levelValue(t.level, TAVERN.hits) / 8) * (R.townhallPower?.(c, t) || 1);
      }
      const arenaChance = Math.max(0, ...R.buildingOf(c, 'orc_arena').filter(a => !a.inactive && R.aiBuildingsTouch(c, a, b)).map(a => levelValue(a.level, ORC_REDESIGN.arena)));
      const elite = c.race === 'undead' ? undeadEliteChance(c, true) : arenaChance;
      hp *= 1 + .5 * elite; damage *= 1 + .5 * elite;
    }
    for (const effect of activeEffects(c)) {
      const {targets,stacks}=effect;
      if (targets.length && !targets.includes(key)) continue;
      if (effect.features.includes('poison') && !features.includes('poison') && !R.hasBuilding(c, 'und_plague_chamber')) continue;
      if (effect.features.includes('curse') && !R.hasBuilding(c, 'orc_shaman')) continue;
      if (effect.features.includes('siege') && !features.includes('siege')) continue;
      damage *= 1 + effect.weight * stacks;
    }
    hp *= 1 + .08 * R.countNormal(c, 'und_spawn_ward');
    const range = 1 + (ranged ? .35 * Math.log1p(stats.range / 100) : 0);
    const mobility = bounded(Math.pow(stats.speed / Math.max(1, base.speed), .2), .65, 1.5);
    const aoe = 1 + Math.min(1.5, positive(stats.aoe) / 65);
    const heal = positive(stats.heal) / Math.max(.5, base.healCooldown || 3);
    return Math.pow(hp / 100, ranged ? .3 : .5) * (damage * aoe + .12 * positive(stats.buildingDamage) / Math.max(.1, stats.cooldown) + heal * .8) * range * mobility;
  };

  R.aiCityMetrics = c => {
    const flow = R.resourceFlowRates(c), units = {}, features = {};
    let power = 0;
    const active = R.activeSpawners(c).filter(b => !b.inactive);
    for (const b of active) {
      const key = R.effectiveUnitKey(c, b), seconds = R.trainingTime(c, b);
      if (!R.UNITS[key] || !Number.isFinite(seconds)) continue;
      const rate = R.productionBatchSize(c, b) / Math.max(1, seconds), quality = R.aiUnitQuality(c, key, b);
      const u = units[key] || (units[key] = { rate: 0, power: 0, count: 0, quality: 0 });
      u.rate += rate; u.power += rate * quality; u.count++; u.quality += quality;
      power += rate * quality;
      for (const tag of UNIT_FEATURES[key] || []) features[tag] = (features[tag] || 0) + rate;
    }
    for (const u of Object.values(units)) u.quality /= u.count;
    const totalRate = Object.values(units).reduce((n, u) => n + u.rate, 0);
    // Delayed/spawn-on-death effects need an expected event rate. They do not
    // exist in statsFor; use conservative turnover, not infinite resurrection.
    const once = new Set(), originalPower = power;
    for (const b of c.buildings.filter(x => !x.inactive)) {
      if (['und_garden_of_dead','und_rebirth_tomb','und_otherworld_portal'].includes(b.type)) {
        if (once.has(b.type)) continue;
        once.add(b.type);
      }
      if (b.type === 'und_bone_forge') power += (units.und_skeleton?.rate || 0) * .6 * R.aiUnitQuality(c, 'und_zombie') / levelValue(b.level, [10, 8, 6, 4]);
      if (b.type === 'und_rebirth_tomb') power += originalPower * levelValue(b.level, [.25, .3, .4, .5]) * .35;
      if (b.type === 'und_garden_of_dead') {
        const key = b.level === 4 ? R.hasBranch(c, b.type, 'raise_lich') ? 'und_lich' : 'und_vampire' : levelValue(b.level, ['und_skeleton', 'und_ghost', 'und_zombie']);
        const chance = Math.min(1, (.1 + .02 * R.countNormal(c, 'garden_chance')) * (R.hasBranch(c, 'keep', 'dead_realm') ? 2 : 1));
        power += totalRate * .5 * chance * R.aiUnitQuality(c, key);
      }
      if (b.type === 'und_plague_chamber') power += originalPower * (.08 + .025 * b.level);
      if (b.type === 'und_soul_rift') {
        const p = R.undRiftProfile(c, b), keys = Object.keys(R.UNITS).filter(k => R.factionUnitMatches(c.race, R.UNITS[k]));
        const quality = keys.reduce((n, key) => n + R.aiUnitQuality(c, key), 0) / Math.max(1, keys.length);
        power += quality * p.count / CONVERGENCE.riftInterval * Math.min(1, p.lifetime / 60);
      }
      if (b.type === 'und_otherworld_portal' && c.undPortalEnabled) power *= 1.10;
    }
    for (const b of c.buildings) if (!b.inactive) for (const feature of BUILDING_MECHANICS[b.type]?.features || []) {
      features[feature] = (features[feature] || 0) + .1 * b.level;
    }
    const producers = R.aiResourceKeys(c).map(r => flow.gain[r]);
    const prices = R.aiFactionBuildings(c).filter(type=>type!=='keep'&&c.unlocked.has(type)).map(type=>R.buildPrice(c,type));
    const constructionCost = prices.reduce((n,price)=>n+R.RES.reduce((sum,r)=>sum+(price[r]||0),0),0) / Math.max(1,prices.length);
    const purchaseCap=Object.fromEntries(R.RES.map(r=>[r,Math.max(0,...prices.map(price=>price[r]||0))]));
    const economicPrices=R.aiFactionBuildings(c).filter(type=>c.unlocked.has(type)&&BUILDING_MECHANICS[type]?.produces).map(type=>R.buildPrice(c,type));
    const constructionReserve=Object.fromEntries(R.RES.map(r=>{const values=economicPrices.map(p=>p[r]||0).filter(n=>n>0);return [r,values.length?Math.min(...values):0];}));
    return { gain: flow.gain, use: flow.use, units, power, features, constructionCost, purchaseCap,constructionReserve,armyCap: c.armyCap,
      reserveCap: c.garrisonCap + c.rallyCap, caps: {...c.caps}, maxHp: c.maxHp,
      economy: producers.reduce((n, x) => n + x, 0), slots: R.occupancy(c).size };
  };

  R.aiMetricDelta = (before, after, c = R.E) => {
    let score = 65 * (after.power - before.power) / Math.max(2, before.power);
    for (const r of R.aiResourceKeys(c)) {
      const stock = positive(c.resources[r]), gain = before.gain[r], use = before.use[r];
      const strained = gain < use * 1.12 + .3;
      const weight = strained ? 55 : stock < Math.min(80, c.caps[r] * .25) ? 32 : 18;
      const scale=Math.max(2,gain,use);
      // Compare net income on the same scale. In a deficit, a new Well's
      // upkeep must not erase the value of its larger production increase.
      score += weight * ((after.gain[r]-gain)-(after.use[r]-use)) / scale;
      const worseDeficit=Math.max(0,after.use[r]-after.gain[r])-Math.max(0,use-gain);
      if(worseDeficit>0)score-=16*worseDeficit/scale;
      const storageNeed = R.aiStoragePressure?.(c,before) ?? false;
      if (after.caps[r] > before.caps[r]) score += (storageNeed ? 12 : 1) * Math.min(2, (after.caps[r] - before.caps[r]) / Math.max(1, before.caps[r]));
    }
    const committed = R.fieldUnitCount(c) + Math.min(R.reserveCount(c),Math.max(8,before.power*8));
    score += Math.min(20, positive(after.armyCap - before.armyCap) / Math.max(10, before.armyCap) * (committed >= before.armyCap * .65 ? 35 : 3));
    score += Math.min(10, positive(after.reserveCap - before.reserveCap) / Math.max(10, before.reserveCap) * (R.reserveCount(c) > before.reserveCap * .6 ? 20 : 2));
    score += Math.log(Math.max(1, after.maxHp) / Math.max(1, before.maxHp)) * (c.hp < c.maxHp * .7 ? 8 : 2);
    score += Math.max(0, before.slots - after.slots) * .7;
    score += Math.log(Math.max(1,before.constructionCost)/Math.max(1,after.constructionCost))*25;
    return bounded(score, -120, 120);
  };

  // A card's future contribution is discounted by whether its targets are
  // already trained, merely unlocked, or still unavailable. No future draw is
  // assumed guaranteed, and no Hungarian description is parsed.
  R.aiCardRelevance = (o, c, metrics) => {
    const targets = cardTargets(R, o);
    if (!targets.length) return 1;
    const total = Object.values(metrics.units).reduce((n, u) => n + u.rate, 0);
    const present = targets.reduce((n, key) => n + (metrics.units[key]?.rate || 0), 0);
    if (present) return .25 + .75 * present / Math.max(.01, total);
    const unlocked = [...c.unlocked].some(type => targets.includes(R.BUILDINGS[type]?.unit));
    return unlocked ? .12 : .015;
  };
  R.aiConditionalCardValue = (o, c, metrics) => {
    const effect = CONDITIONAL_EFFECTS[o.id];
    if (!effect) return 0;
    const relevance = R.aiCardRelevance(o, c, metrics);
    // Combat contributions are already captured by aiUnitQuality. Here we add
    // the discounted option value of links, and noncombat trigger benefits.
    const noncombat = effect.features.some(x => ['choices', 'economy', 'support', 'defense', 'training'].includes(x));
    let value = noncombat ? effect.weight * 35 : effect.weight * 7;
    if (effect.features.includes('choices')) value *= Math.max(.3, 1 - R.state.time / 2400);
    const matches = effect.features.filter(x => positive(metrics.features[x]) > 0).length;
    value += Math.min(8, matches * effect.weight * 7);
    if (o.id === 'und_soul_might') value *= Math.floor(Math.max(0, c.resources.wood) / 1000);
    return value * relevance;
  };
}
