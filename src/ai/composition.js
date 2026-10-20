import { assetUrl } from '../assets/urls.js';
export function initializeAiComposition(runtime) {
  runtime.aiMilitaryScore = function (type) {
    return runtime.aiCompositionScore(type) + Math.random() * .35;
  };
  runtime.aiMilitaryPool = function () {
    const all = [...runtime.E.unlocked].filter(k => runtime.BUILDINGS[k]?.category === 'military' && (!runtime.isUniqueBuilding(runtime.E, k) || !runtime.hasBuilding(runtime.E, k)));
    if (runtime.state.startChoices > 0 && !runtime.spawnerBuildings(runtime.E).length) return [];
    return all.sort((a, b) => runtime.aiMilitaryScore(b) - runtime.aiMilitaryScore(a));
  };
  runtime.scoreAiChoiceV17 = function (o) {
    let s = runtime.scoreAiChoice(o),
      rates = runtime.productionRates(runtime.E),
      targets = runtime.aiResourceTargets(),
      pressure = runtime.fieldUnitCount(runtime.P) - runtime.fieldUnitCount(runtime.E);
    const need = runtime.RES.map(r => ({
      r,
      ratio: targets[r] / Math.max(.1, rates[r])
    })).sort((a, b) => b.ratio - a.ratio)[0];
    const producer = {
        wood: 'lumber',
        stone: 'stonecutter',
        food: 'farm'
      }[need.r],
      strained = need.ratio > 1.02;
    if (o.kind === 'normal') {
      const owned = runtime.E.normal[o.id] || 0;
      if (owned) s += Math.min(10, 2 + owned * 1.8);
      if (['spawn_speed', 'frugal_training'].includes(o.id)) s += 6 + (pressure > 0 ? 2 : 0);
      if (o.id === 'production') s += strained ? 12 : 4;
      if (o.id === 'gate_discipline' && runtime.reserveCount(runtime.E) >= runtime.E.garrisonCap * .65) s += 7;
      for (const [key, count] of Object.entries(runtime.aiSpawnerMix())) if (count && runtime.aiUnitPickIds(key).includes(o.id)) s += Math.min(8, 2 + count * 1.4);
    }
    if (o.kind === 'building') {
      const d = runtime.BUILDINGS[o.id];
      if (o.id === producer) s += strained ? 14 : 5;else if (['lumber', 'stonecutter', 'farm'].includes(o.id)) s += 2;
      if (d?.unit) {
        const cs = runtime.aiCompositionScore(o.id);
        s += (cs - 8) * 1.15;
        if (!runtime.spawnerBuildings(runtime.E).length) s += 5;
      }
      if (o.id === 'house') s += runtime.buildingOf(runtime.E, 'house').length < runtime.aiHouseTarget() ? 13 : 1;
    }
    if (o.kind === 'building_upgrade' || o.kind === 'building_branch') {
      const d = runtime.BUILDINGS[o.id];
      if (o.id === producer) s += strained ? 13 : 5;
      if (o.id === 'keep') s += 9;
      if (d?.unit) {
        const count = runtime.buildingOf(runtime.E, o.id).length;
        s += 4 + count * 1.8 + Math.min(8, runtime.aiUnitInvestment(d.unit));
      }
      if (o.id === 'house') s += 6;
    }
    if (o.kind === 'legendary' && ['last_line', 'wide_choice', 'double_choice', 'full_garrison_economy', 'large_garrison', 'instant_l3', 'regen', 'mobilization', 'specialization', 'supply_hub', 'castle_defenders', 'combined_assault'].includes(o.id)) s += 8;
    return s + Math.random() * .25;
  };
  runtime.aiMakeRoomFor = function (type) {
    if (!type || runtime.findCell(runtime.E, type)) return false;
    const houseFloor = Math.max(2, Math.min(7, runtime.state.time < 90 ? 0 : 1 + Math.floor((runtime.state.time - 90) / 180)));
    const resourceFor = {
      lumber: 'wood',
      stonecutter: 'stone',
      farm: 'food'
    };
    const candidates = [];
    for (const b of runtime.E.buildings) {
      if (b.type === 'keep' || runtime.BUILDINGS[b.type]?.unit || runtime.isUniqueBuilding(runtime.E, b.type)) continue;
      const sim = runtime.aiSwapSimulation(b, type);
      if (!sim || !sim.affordable || !sim.sustainable) continue;
      let score = 0;
      if (b.type === 'warehouse' && runtime.buildingOf(runtime.E, 'warehouse').length > 2) score += 100;
      if (['lumber', 'stonecutter', 'farm'].includes(b.type)) {
        const r = resourceFor[b.type];
        const afterSurplus = sim.rates[r] - (sim.use[r] + (sim.add[r] || 0));
        score += 35 + Math.min(45, afterSurplus * 8);
        if (runtime.producerHasBonus(runtime.E, b.type, b)) score -= 55;
      }
      if (b.type === 'guardhouse' && runtime.buildingOf(runtime.E, 'guardhouse').length > 2) score += 45;
      if (b.type === 'house' && runtime.buildingOf(runtime.E, 'house').length > houseFloor) score += 22;else if (b.type === 'house') score -= 100;
      if (b.type === 'guildhouse' || b.type === 'townhall' || b.type === 'rally' || b.type === 'tavern' || b.type === 'warcenter' || b.type === 'hospital' || b.type === 'armorsmith') score -= 80;
      if (score > 0) candidates.push({
        b,
        score
      });
    }
    candidates.sort((a, b) => b.score - a.score);
    if (!candidates.length) return false;
    const chosen = candidates[0].b;
    if (!runtime.demolish(runtime.E, chosen.id)) return false;
    runtime.E.aiReservedBuild = {
      type,
      until: runtime.state.time + 10
    };
    return true;
  };
  runtime.v4914EnemyBuildAI = runtime.enemyBuildAI;
  runtime.enemyBuildAI = function (dt) {
    if (runtime.E.aiReservedBuild) {
      runtime.E.aiThink -= dt;
      if (runtime.E.aiThink > 0) return;
      runtime.E.aiThink = .35 + Math.random() * .35;
      runtime.enemyGateAI();
      const plan = runtime.E.aiReservedBuild;
      if (!runtime.E.unlocked.has(plan.type) || runtime.state.time > plan.until) {
        runtime.E.aiReservedBuild = null;
        return;
      }
      if (runtime.aiBuild(plan.type)) {
        runtime.E.aiReservedBuild = null;
        runtime.E.aiEconomyStreak = 0;
        return;
      }
      if (!runtime.findCell(runtime.E, plan.type)) {
        runtime.E.aiReservedBuild = null;
        return;
      }
      return;
    }
    return runtime.v4914EnemyBuildAI(dt);
  };
}
