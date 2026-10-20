import { assetUrl } from '../assets/urls.js';
export function register(runtime) {
  runtime.aiMemo = function aiMemo(key, compute) {
    if (!runtime.aiDecisionCache) return compute();
    if (!runtime.aiDecisionCache.has(key)) runtime.aiDecisionCache.set(key, compute());
    return runtime.aiDecisionCache.get(key);
  };
  runtime.aiMutate = function aiMutate(action) {
    const cache = runtime.aiDecisionCache;
    runtime.aiDecisionCache = null;
    try {
      return action();
    } finally {
      if (cache) cache.clear();
      runtime.aiDecisionCache = cache;
    }
  };
  runtime.aiBuild = function aiBuild(type) {
    if (!type || !runtime.BUILDINGS[type] || !runtime.E.unlocked.has(type)) return false;
    if (runtime.isUniqueBuilding(runtime.E, type) && runtime.hasBuilding(runtime.E, type)) return false;
    const cell = runtime.findCell(runtime.E, type);
    if (!cell) return runtime.aiMutate(() => runtime.aiClearBlockingRuin(type));
    const price = runtime.placementPrice(runtime.E, type, ...cell);
    if (!runtime.canPay(runtime.E, price)) return false;
    return runtime.aiMutate(() => !!runtime.placeBuilding(runtime.E, type, ...cell)?.ok);
  };
  runtime.scoreAiChoice = function scoreAiChoice(o) {
    let s = Math.random() * 2;
    const sp = runtime.spawnerBuildings(runtime.E),
      rates = runtime.productionRates(runtime.E),
      use = runtime.consumptionRates(runtime.E);
    if (o.kind === 'building') {
      const d = runtime.BUILDINGS[o.id];
      if (d.category === 'military') s += sp.length < 4 ? 6 : 3;
      if (o.id === 'guardhouse') s += sp.length >= 3 ? 5 : 1;
      if (o.id === 'rally' || o.id === 'tavern') s += sp.length >= 2 ? 4 : 1;
      if (o.id === 'builders') s += runtime.E.buildings.length > 8 ? 5 : 1;
      if (o.id === 'townhall') s += runtime.typeCount(runtime.E) >= 6 ? 5 : 2;
      if (o.id === 'market' || o.id === 'guildhouse') s += 3;
    } else if (o.kind === 'building_upgrade') {
      const d = runtime.BUILDINGS[o.id];
      s += d.unit ? 6 : 3;
      if (['lumber', 'stonecutter', 'farm'].includes(o.id)) s += 4;
      if (o.id === 'keep' || o.id === 'warehouse') s += 3 + 2;
    } else if (o.kind === 'normal') {
      if (o.id === 'production') s += 5;
      if (o.id === 'spawn_speed') s += 2 + sp.length;
      if (o.id === 'all_damage' || o.id === 'all_hp' || o.id === 'all_as') s += 3 + sp.length * .35;
      if (o.id === 'building_hp') s += runtime.E.hp / runtime.E.maxHp < .75 ? 6 : 2;
      if (o.id.includes('inf_')) s += runtime.E.buildings.filter(b => runtime.BUILDINGS[b.type].unit && runtime.UNITS[runtime.BUILDINGS[b.type].unit].cat === 'infantry').length;
      if (o.id.includes('cav_')) s += runtime.buildingOf(runtime.E, 'stable').length * 2;
      if (o.id.includes('mag_')) s += (runtime.buildingOf(runtime.E, 'temple').length + runtime.buildingOf(runtime.E, 'magetower').length) * 2;
      if (o.id.includes('sie_')) s += runtime.buildingOf(runtime.E, 'siegeworks').length * 2;
    } else {
      if (o.id === 'no_food' && use.food > rates.food * .9) s += 8;
      if (o.id === 'mono_veteran' && new Set(sp.map(b => runtime.BUILDINGS[b.type].unit)).size === 1) s += 8;
      if (o.id === 'combined_arms') s += 7;
      if (o.id === 'mobilization') s += sp.length >= 3 ? 6 : 2;
      if (o.id === 'factory_network') s += sp.length >= 3 ? 6 : 2;
      if (o.id === 'chain_spawn' || o.id === 'every10') s += 5;
      if (o.id === 'regen') s += 5;
      if (o.id === 'sacred_vow' && runtime.unitAvailable(runtime.E, 'priest')) s += 6;
      if (o.id === 'phalanx' && runtime.unitAvailable(runtime.E, 'spearman')) s += 6;
      if (o.id === 'archer_skirmish' && runtime.unitAvailable(runtime.E, 'archer')) s += 6;
    }
    return s;
  };
  runtime.grantEnemyStarterPicks = function grantEnemyStarterPicks() {
    for (const type of ['spearhall', 'archery', 'guardhouse', 'rally']) {
      if (runtime.BUILDINGS[type] && !runtime.E.unlocked.has(type)) runtime.applyChoice(runtime.E, runtime.makeBuildingChoice(runtime.E, type));
    }
  };
  runtime.aiClearBlockingRuin = function aiClearBlockingRuin(preferType = null) {
    const ruins = runtime.terrainCellsOfType(runtime.E, 'ruin');
    if (!ruins.length || !runtime.canPay(runtime.E, runtime.TERRAIN.ruin.clear)) return false;
    let ranked = ruins.map(([r, col]) => {
      const fake = {
        type: preferType || 'lumber',
        row: r,
        col,
        rotation: 0,
        id: 'preview'
      };
      let score = Math.random();
      if (preferType === 'lumber' && runtime.adjacentTerrain(runtime.E, fake, 'forest')) score += 20;
      if (preferType === 'stonecutter' && runtime.adjacentTerrain(runtime.E, fake, 'quarry')) score += 20;
      score -= .1 * (Math.abs(r - runtime.CENTER.row) + Math.abs(col - runtime.CENTER.col));
      return {
        r,
        col,
        score
      };
    }).sort((a, b) => b.score - a.score);
    return runtime.clearTerrain(runtime.E, ranked[0].r, ranked[0].col, true);
  };
  runtime.enemyGateAI = function enemyGateAI() {
    const sp = Math.max(1, runtime.activeSpawners(runtime.E).length),
      players = runtime.state.units.filter(u => u.alive && u.side === 'player'),
      veryDeep = players.filter(u => u.lane > runtime.PATH_LENGTH * .84).length,
      base = Math.round(10 + sp * 2 + Math.min(12, runtime.state.time / 100)),
      counter = Math.min(55, Math.ceil(players.length * .3));
    let target = Math.min(runtime.E.garrisonCap, Math.max(base, counter));
    if (runtime.hasLeg(runtime.E, 'full_garrison_economy') && !veryDeep) target = Math.max(target, Math.min(runtime.E.garrisonCap, 28));
    const emergency = Math.min(target, Math.max(12, Math.ceil(sp * 1.8)));
    if (runtime.E.gateMode === 'closed' && (runtime.E.garrison.length >= target || veryDeep >= 2 && runtime.E.garrison.length >= emergency)) {
      runtime.openWave(runtime.E);
      runtime.E.gateMode = 'open';
    }
    if (runtime.E.gateMode === 'open' && !runtime.E.releaseQueue.length) runtime.E.gateMode = 'closed';
    if (runtime.hasBuilding(runtime.E, 'rally')) runtime.E.rallyMode = 'auto';
    runtime.updateEnemyMarket();
  };
  runtime.aiEconomyTarget = function aiEconomyTarget(t = runtime.state.time) {
    if (t < 120) return 4 + 2 * t / 120;
    if (t < 300) return 6 + 4 * (t - 120) / 180;
    if (t < 480) return 10 + 2 * (t - 300) / 180;
    if (t < 720) return 12 + 2 * (t - 480) / 240;
    return 14;
  };
  runtime.aiHouseTarget = function aiHouseTarget() {
    const scheduled = runtime.state.time < 90 ? 0 : Math.min(10, 1 + Math.floor((runtime.state.time - 90) / 150));
    const committed = runtime.fieldUnitCount(runtime.E) + runtime.E.releaseQueue.length;
    const current = runtime.buildingOf(runtime.E, 'house').length,
      sp = runtime.activeSpawners(runtime.E).length;
    const infrastructure = Math.ceil(sp / 3),
      needsRoom = committed > runtime.E.armyCap * .72;
    return Math.min(12, Math.max(scheduled, infrastructure, needsRoom ? current + 1 : 0));
  };
  runtime.aiDoctrineUnit = function aiDoctrineUnit() {
    if (runtime.E.aiDoctrine && runtime.UNITS[runtime.E.aiDoctrine] && [...runtime.E.unlocked].some(k => runtime.BUILDINGS[k]?.unit === runtime.E.aiDoctrine)) return runtime.E.aiDoctrine;
    const built = runtime.spawnerBuildings(runtime.E);
    if (built.length) {
      const counts = {};
      for (const b of built) {
        const k = runtime.effectiveUnitKey(runtime.E, b);
        counts[k] = (counts[k] || 0) + 1;
      }
      runtime.E.aiDoctrine = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
      return runtime.E.aiDoctrine;
    }
    runtime.E.aiDoctrine = null;
    return null;
  };
  runtime.aiRememberChoice = function aiRememberChoice(o) {
    if (!o) return;
    if (o.kind === 'building' && runtime.BUILDINGS[o.id]?.unit && !runtime.E.aiDoctrine) {
      const k = runtime.BUILDINGS[o.id].unit;
      if (k !== 'swordsman') runtime.E.aiDoctrine = k;
    }
    runtime.E.aiLastChoiceKey = runtime.choiceKey(o);
  };
  runtime.aiMilitaryScore = function aiMilitaryScore(type) {
    const unit = runtime.BUILDINGS[type]?.unit,
      focus = runtime.aiDoctrineUnit(),
      enemyCount = runtime.buildingOf(runtime.E, type).length,
      player = runtime.state.units.filter(u => u.alive && u.side === 'player');
    const magic = player.filter(u => u.cat === 'magic').length,
      ranged = player.filter(u => u.tags?.includes('ranged')).length;
    let s = 10 - enemyCount * 1.1 + Math.random();
    if (unit === focus) s += 9;else if (runtime.UNITS[unit]?.cat === runtime.UNITS[focus]?.cat) s += 3;
    if (unit === 'spearman') s += player.filter(u => ['knight', 'catapult'].includes(u.key)).length * .7;
    if (['archer', 'mage'].includes(unit)) s += player.filter(u => runtime.UNITS[u.key]?.tags?.includes('melee')).length * .08;
    if (unit === 'archer') s += magic * .2;
    if (unit === 'knight') s += ranged * .12 + magic * .2;
    if (unit === 'catapult' && runtime.state.time > 420) s += 4;
    if (unit === 'priest') {
      s += runtime.activeSpawners(runtime.E).length >= 4 ? 3 : 0;
      s -= Math.max(0, runtime.buildingOf(runtime.E, 'temple').length - 2) * 4;
    }
    return s;
  };
  runtime.aiMilitaryPool = function aiMilitaryPool() {
    const focus = runtime.aiDoctrineUnit(),
      builtTypes = new Set(runtime.spawnerBuildings(runtime.E).map(b => b.type));
    const all = [...runtime.E.unlocked].filter(k => runtime.BUILDINGS[k]?.category === 'military' && (!runtime.isUniqueBuilding(runtime.E, k) || !runtime.hasBuilding(runtime.E, k)));
    if (runtime.state.startChoices > 0 && !focus && !builtTypes.size) return [];
    let pool = all;
    if (focus) {
      const committed = all.filter(k => builtTypes.has(k) || runtime.BUILDINGS[k]?.unit === focus);
      if (committed.length) pool = committed;
    }
    return pool.sort((a, b) => runtime.aiMilitaryScore(b) - runtime.aiMilitaryScore(a));
  };
  runtime.aiTryProducer = function aiTryProducer(needs = runtime.aiResourceNeeds()) {
    const map = {
      wood: 'lumber',
      stone: 'stonecutter',
      food: 'farm'
    };
    for (const n of needs) {
      const type = map[n.r];
      if (n.score <= 1.005) continue;
      if (runtime.aiBuild(type)) {
        runtime.E.aiEconomyStreak = (runtime.E.aiEconomyStreak || 0) + 1;
        return true;
      }
      if (runtime.aiMakeRoomFor(type)) return true;
    }
    if (needs[0]?.score > 1.005 && runtime.aiClearBlockingRuin(map[needs[0].r])) return true;
    return false;
  };
  runtime.enemyBuildAI = function enemyBuildAI(dt) {
    runtime.E.aiThink -= dt;
    if (runtime.E.aiThink > 0) return;
    runtime.E.aiThink = .35 + Math.random() * .35;
    runtime.enemyGateAI();
    runtime.aiDoctrineUnit();
    const houses = runtime.buildingOf(runtime.E, 'house').length,
      houseTarget = runtime.aiHouseTarget();
    if (runtime.E.unlocked.has('house') && houses < houseTarget) {
      if (runtime.aiBuild('house')) {
        runtime.E.aiEconomyStreak = 0;
        return;
      }
      if (runtime.aiMakeRoomFor('house')) return;
    }
    let sp = runtime.activeSpawners(runtime.E),
      spTarget = runtime.aiSpawnerTarget();
    const militaryPool = () => runtime.aiMilitaryPool();
    let needs = runtime.aiResourceNeeds();
    if (needs[0]?.score > 1.05 && ((runtime.E.aiEconomyStreak || 0) < 3 || sp.length >= spTarget)) {
      if (runtime.aiTryProducer(needs)) return;
    }
    if (sp.length < spTarget) {
      const allMilitary = militaryPool(),
        placeable = allMilitary.filter(k => runtime.findCell(runtime.E, k));
      for (const type of placeable) {
        const extra = runtime.projectedSpawnerNeed(type);
        if (runtime.sustainableSpawner(type) && runtime.aiBuild(type)) {
          runtime.E.aiEconomyStreak = 0;
          return;
        }
        if (runtime.aiTryProducer(runtime.aiResourceNeeds(extra))) return;
      }
      if (!placeable.length && allMilitary.length && runtime.occupancy(runtime.E).size < runtime.aiCityTarget() && runtime.aiMakeRoomFor(allMilitary[0])) return;
    }
    runtime.E.aiEconomyStreak = 0;
    sp = runtime.activeSpawners(runtime.E);
    spTarget = runtime.aiSpawnerTarget();
    const stockPct = r => runtime.E.resources[r] / Math.max(1, runtime.E.caps[r]);
    const supportPlan = [{
      type: 'guardhouse',
      want: sp.length >= 3 && runtime.E.garrisonCap < Math.min(120, 35 + sp.length * 10) && runtime.buildingOf(runtime.E, 'guardhouse').length < 3
    }, {
      type: 'rally',
      want: sp.length >= 3 && !runtime.hasBuilding(runtime.E, 'rally')
    }, {
      type: 'tavern',
      want: sp.length >= 4 && !runtime.hasBuilding(runtime.E, 'tavern')
    }, {
      type: 'townhall',
      want: houses >= 3 && !runtime.hasBuilding(runtime.E, 'townhall')
    }, {
      type: 'guildhouse',
      want: runtime.E.buildings.filter(b => ['lumber', 'stonecutter', 'farm'].includes(b.type)).length >= 6 && !runtime.hasBuilding(runtime.E, 'guildhouse')
    }, {
      type: 'market',
      want: false
    }, {
      type: 'warcenter',
      want: sp.length >= 5 && !runtime.hasBuilding(runtime.E, 'warcenter')
    }];
    supportPlan[5].want = !runtime.hasBuilding(runtime.E, 'market') && Math.max(...runtime.RES.map(stockPct)) > .78 && Math.min(...runtime.RES.map(stockPct)) < .28;
    for (const step of supportPlan) if (step.want && runtime.E.unlocked.has(step.type) && runtime.aiBuild(step.type)) return;
    if (runtime.state.time > 75 && Math.max(...runtime.RES.map(stockPct)) > .90 && runtime.E.unlocked.has('warehouse') && runtime.buildingOf(runtime.E, 'warehouse').length < 2 && runtime.aiBuild('warehouse')) return;
    const occupied = runtime.occupancy(runtime.E).size;
    if (occupied < runtime.aiCityTarget()) {
      needs = runtime.aiResourceNeeds();
      const producer = {
        wood: 'lumber',
        stone: 'stonecutter',
        food: 'farm'
      }[needs[0]?.r];
      const military = militaryPool();
      if (needs[0]?.score > 1.03 && producer && runtime.aiBuild(producer)) return;
      for (const type of military) if (runtime.sustainableSpawner(type) && runtime.aiBuild(type)) return;
      if (producer && runtime.aiBuild(producer)) return;
      for (const type of military) if (runtime.aiBuild(type)) return;
    }
    const ancient = runtime.terrainCellsOfType(runtime.E, 'ancient');
    if (ancient.length && runtime.E.resources.wood >= 180 && runtime.E.resources.stone >= 180) {
      const [r, col] = runtime.pick(ancient);
      if (runtime.clearTerrain(runtime.E, r, col, true)) return;
    }
    if (runtime.aiClearBlockingRuin()) return;
  };
  runtime.aiUnitPickIds = function aiUnitPickIds(key) {
    const common = {
      swordsman: ['inf_training', 'swordsman_dmg', 'swordsman_hp', 'sword_as'],
      spearman: ['inf_training', 'spear_dmg', 'spear_hp', 'spear_range'],
      archer: ['inf_training', 'archer_dmg', 'archer_hp', 'archer_range'],
      knight: ['knight_dmg', 'knight_hp', 'knight_move'],
      catapult: ['catapult_dmg', 'catapult_hp', 'cat_build'],
      mage: ['mag_training', 'mage_dmg', 'mage_hp', 'mage_aoe'],
      priest: ['mag_training', 'priest_dmg', 'priest_hp', 'priest_heal']
    };
    return common[key] || [];
  };
  runtime.aiSpawnerTarget = function aiSpawnerTarget() {
    return runtime.GRID * runtime.GRID;
  };
  runtime.aiCityTarget = function aiCityTarget() {
    return runtime.GRID * runtime.GRID;
  };
  runtime.aiPlannedConstruction = function aiPlannedConstruction() {
    const plan = [],
      sp = runtime.activeSpawners(runtime.E).length;
    if (runtime.E.unlocked.has('house') && runtime.buildingOf(runtime.E, 'house').length < runtime.aiHouseTarget()) plan.push('house');
    const military = runtime.aiMilitaryPool();
    if (military[0]) plan.push(military[0]);
    if (sp < 2 && military[1]) plan.push(military[1]);
    const rates = runtime.productionRates(runtime.E),
      use = runtime.consumptionRates(runtime.E);
    const storagePressure = runtime.state.time > 75 && runtime.RES.some(r => runtime.E.resources[r] > runtime.E.caps[r] * .90 && rates[r] > use[r] + .5);
    if (storagePressure && runtime.E.unlocked.has('warehouse')) plan.push('warehouse');
    return plan.slice(0, sp < 2 ? 3 : 2);
  };
  runtime.aiResourceTargets = function aiResourceTargets(extra = runtime.C()) {
    const use = runtime.consumptionRates(runtime.E),
      plan = runtime.aiPlannedConstruction(),
      planned = runtime.C(),
      sp = runtime.activeSpawners(runtime.E).length;
    for (const type of plan) {
      const co = runtime.buildPrice(runtime.E, type);
      for (const r of runtime.RES) planned[r] += co[r] || 0;
    }
    if (sp === 0) planned.wood += (runtime.buildPrice(runtime.E, 'lumber').wood || 25) + (runtime.buildPrice(runtime.E, 'stonecutter').wood || 25);else if (sp === 1) planned.wood += runtime.buildPrice(runtime.E, 'lumber').wood || 25;
    const horizon = sp === 0 ? 34 : sp === 1 ? 44 : sp < 4 ? 58 : 78;
    const minimum = {
      wood: .85,
      stone: .75,
      food: .55
    };
    return Object.fromEntries(runtime.RES.map(r => {
      const live = (use[r] + (extra[r] || 0)) * 1.22;
      const construction = r === 'food' ? 0 : (planned[r] || 0) / horizon;
      const reserveTarget = (planned[r] || 0) * .65 + (use[r] + (extra[r] || 0)) * 10;
      const reserveGap = Math.max(0, reserveTarget - (runtime.E.resources[r] || 0)) / 45;
      const stockGuard = runtime.E.resources[r] < Math.max(12, reserveTarget * .35) ? .35 : 0;
      return [r, Math.max(minimum[r], live + construction + reserveGap + stockGuard + .12)];
    }));
  };
  runtime.aiResourceNeeds = function aiResourceNeeds(extra = runtime.C()) {
    const rates = runtime.productionRates(runtime.E),
      target = runtime.aiResourceTargets(extra),
      stock = r => runtime.E.resources[r] / Math.max(1, runtime.E.caps[r]);
    return runtime.RES.map(r => ({
      r,
      rate: rates[r],
      desired: target[r],
      score: target[r] / Math.max(.1, rates[r]) + (stock(r) < .15 ? .35 : 0)
    })).sort((a, b) => b.score - a.score);
  };
  runtime.aiMakeRoomFor = function aiMakeRoomFor(type) {
    if (runtime.findCell(runtime.E, type)) return false;
    const houseFloor = Math.max(2, Math.min(7, runtime.state.time < 90 ? 0 : 1 + Math.floor((runtime.state.time - 90) / 180))),
      rates = runtime.productionRates(runtime.E),
      targets = runtime.aiResourceTargets(),
      resourceFor = {
        lumber: 'wood',
        stonecutter: 'stone',
        farm: 'food'
      };
    const candidates = runtime.E.buildings.filter(b => b.type !== 'keep' && !runtime.BUILDINGS[b.type]?.unit).map(b => {
      let score = 0;
      if (b.type === 'warehouse' && runtime.buildingOf(runtime.E, 'warehouse').length > 2) score += 100;
      if (['lumber', 'stonecutter', 'farm'].includes(b.type)) {
        const r = resourceFor[b.type],
          safe = rates[r] > targets[r] + 1;
        score += safe ? 70 + runtime.buildingOf(runtime.E, b.type).length * 2 : -150;
        if (runtime.producerHasBonus(runtime.E, b.type, b)) score -= 55;
      }
      if (b.type === 'guardhouse' && runtime.buildingOf(runtime.E, 'guardhouse').length > 2) score += 45;
      if (b.type === 'house' && runtime.buildingOf(runtime.E, 'house').length > houseFloor) score += 20;else if (b.type === 'house') score -= 100;
      if (runtime.isUniqueBuilding(runtime.E, b.type)) score -= 120;
      return {
        b,
        score
      };
    }).filter(x => x.score > 0).sort((a, b) => b.score - a.score);
    if (!candidates.length) return false;
    runtime.demolish(runtime.E, candidates[0].b.id);
    return true;
  };
  runtime.scoreAiChoiceV17 = function scoreAiChoiceV17(o) {
    let s = runtime.scoreAiChoice(o),
      sp = runtime.activeSpawners(runtime.E).length,
      rates = runtime.productionRates(runtime.E),
      targets = runtime.aiResourceTargets(),
      focus = runtime.aiDoctrineUnit(),
      focusIds = runtime.aiUnitPickIds(focus),
      pressure = runtime.fieldUnitCount(runtime.P) - runtime.fieldUnitCount(runtime.E);
    const need = runtime.RES.map(r => ({
        r,
        ratio: targets[r] / Math.max(.1, rates[r])
      })).sort((a, b) => b.ratio - a.ratio)[0],
      producer = {
        wood: 'lumber',
        stone: 'stonecutter',
        food: 'farm'
      }[need.r],
      strained = need.ratio > 1.02;
    const playerMagic = runtime.state.units.filter(u => u.alive && u.side === 'player' && u.cat === 'magic').length;
    if (o.kind === 'normal') {
      const owned = runtime.E.normal[o.id] || 0;
      if (owned) s += Math.min(10, 2 + owned * 1.8);
      if (focusIds.includes(o.id)) s += 11;
      if (['spawn_speed', 'frugal_training', 'all_damage', 'all_hp'].includes(o.id)) s += 6 + (pressure > 0 ? 2 : 0);
      if (o.id === 'production') s += strained ? 12 : 4;
      if (o.id === 'gate_discipline' && runtime.reserveCount(runtime.E) >= runtime.E.garrisonCap * .65) s += 7;
    }
    if (o.kind === 'building') {
      const d = runtime.BUILDINGS[o.id];
      if (o.id === producer) s += strained ? 14 : 5;else if (['lumber', 'stonecutter', 'farm'].includes(o.id)) s += 2;
      if (d?.unit) {
        if (!focus) s += 12;else if (d.unit === focus) s += 16;else if (runtime.UNITS[d.unit]?.cat === runtime.UNITS[focus]?.cat) s += 1;else s -= 7;
        if (playerMagic && ['archer', 'knight'].includes(d.unit)) s += Math.min(5, playerMagic * .2);
      }
      if (o.id === 'house') s += runtime.buildingOf(runtime.E, 'house').length < runtime.aiHouseTarget() ? 13 : 1;
    }
    if (o.kind === 'building_upgrade' || o.kind === 'building_branch') {
      const d = runtime.BUILDINGS[o.id];
      if (o.id === producer) s += strained ? 13 : 5;
      if (o.id === 'keep') s += 9;
      if (d?.unit) {
        s += 5 + runtime.buildingOf(runtime.E, o.id).length * 1.8;
        if (d.unit === focus) s += 10;
      }
      if (o.id === 'house') s += runtime.E.armyCap < runtime.P.armyCap ? 10 : 5;
    }
    if (o.kind === 'legendary' && ['last_line', 'wide_choice', 'double_choice', 'full_garrison_economy', 'large_garrison', 'instant_l3', 'regen', 'mobilization', 'specialization', 'supply_hub', 'castle_defenders', 'combined_assault'].includes(o.id)) s += 8;
    return s + Math.random() * .25;
  };
  runtime.grantEnemyStarterPickV499 = function grantEnemyStarterPickV499() {
    runtime.grantEnemyPick('start');
  };
  runtime.aiSpawnerMix = function aiSpawnerMix() {
    const out = {
      swordsman: 0,
      spearman: 0,
      archer: 0,
      knight: 0,
      priest: 0,
      catapult: 0,
      mage: 0
    };
    for (const b of runtime.spawnerBuildings(runtime.E)) {
      const k = runtime.effectiveUnitKey(runtime.E, b);
      if (k in out) out[k]++;
    }
    return out;
  };
  runtime.aiObservedPlayerMix = function aiObservedPlayerMix() {
    const out = {
      swordsman: 0,
      spearman: 0,
      archer: 0,
      knight: 0,
      priest: 0,
      catapult: 0,
      mage: 0
    };
    const add = x => {
      const k = x?.key;
      if (k in out) out[k]++;
    };
    for (const u of runtime.state.units) if (u.alive && u.side === 'player') add(u);
    for (const arr of [runtime.P.garrison, runtime.P.releaseQueue, runtime.P.rallyReserve || []]) for (const x of arr || []) add(x);
    return out;
  };
  runtime.aiMixTotal = function aiMixTotal(m) {
    return Object.values(m).reduce((a, b) => a + b, 0);
  };
  runtime.aiMixCount = function aiMixCount(m, keys) {
    return keys.reduce((n, k) => n + (m[k] || 0), 0);
  };
  runtime.aiUnitInvestment = function aiUnitInvestment(key) {
    let v = 0;
    for (const id of runtime.aiUnitPickIds(key)) v += (runtime.E.normal[id] || 0) * 1.15;
    const type = [...runtime.E.unlocked].find(k => runtime.BUILDINGS[k]?.unit === key);
    if (type) v += Math.max(0, runtime.levelOf(runtime.E, type) - 1) * 1.2;
    return v;
  };
  runtime.aiCompositionScore = function aiCompositionScore(type) {
    const unit = runtime.BUILDINGS[type]?.unit;
    if (!unit) return -999;
    const own = runtime.aiSpawnerMix(),
      enemy = runtime.aiObservedPlayerMix(),
      total = runtime.aiMixTotal(own),
      enemyTotal = Math.max(1, runtime.aiMixTotal(enemy));
    const n = own[unit] || 0;
    const meleeOwn = runtime.aiMixCount(own, ['swordsman', 'spearman', 'knight']);
    const rangedOwn = runtime.aiMixCount(own, ['archer', 'mage', 'catapult']);
    const combatOwn = Math.max(0, total - (own.priest || 0));
    const enemyMelee = runtime.aiMixCount(enemy, ['swordsman', 'spearman', 'knight']);
    const enemyRanged = runtime.aiMixCount(enemy, ['archer', 'mage', 'priest', 'catapult']);
    const enemyMagic = runtime.aiMixCount(enemy, ['mage', 'priest']);
    const enemyHeavy = runtime.aiMixCount(enemy, ['knight', 'catapult']);
    const enemyCav = enemy.knight || 0;
    let s = 10 - n * 1.35 + Math.min(5, runtime.aiUnitInvestment(unit));
    if (n === 0 && total >= 2) s -= 1.5;
    if (['swordsman', 'spearman', 'knight'].includes(unit) && rangedOwn > meleeOwn * 1.45) s += Math.min(5, 1.5 + (rangedOwn - meleeOwn) * .65);
    if (['archer', 'mage'].includes(unit) && meleeOwn > Math.max(1, rangedOwn) * 1.8) s += Math.min(5, 1 + (meleeOwn - rangedOwn) * .55);
    if (unit === 'spearman') s += Math.min(9, enemyCav * .9 + enemyHeavy * .45);
    if (unit === 'knight') s += Math.min(10, enemyRanged * .42 + enemyMagic * .55);
    if (unit === 'archer') s += Math.min(7, enemyMelee * .22 + enemyMagic * .12);
    if (unit === 'mage') s += Math.min(8, enemyMelee * .28 + enemyTotal * .06);
    if (unit === 'swordsman') s += enemyMelee / enemyTotal < .45 ? 1.5 : 0;
    if (unit === 'catapult') {
      s += runtime.state.time > 300 ? 2.5 : 0;
      if (n >= Math.max(1, Math.ceil(total * .18))) s -= 5;
    }
    if (unit === 'priest') {
      if (combatOwn < 2) s -= 7;else if (n === 0) s += 4.5;
      const share = (n + 1) / Math.max(1, total + 1);
      if (share > .28) s -= 10 + (share - .28) * 30;
      if (runtime.hasLeg(runtime.E, 'sacred_vow')) s += 5;
    }
    if (runtime.hasLeg(runtime.E, 'melee_doctrine')) s += runtime.UNITS[unit]?.tags?.includes('melee') ? 7 : -14;
    if (runtime.hasLeg(runtime.E, 'siege_doctrine') && unit === 'catapult') s += 3;
    if (runtime.aiMixTotal(enemy) === 0) s -= Math.max(0, unit === 'spearman' || unit === 'knight' ? 1 : 0);
    return s;
  };
  runtime.aiSwapSimulation = function aiSwapSimulation(candidate, targetType) {
    const idx = runtime.E.buildings.findIndex(x => x.id === candidate.id);
    if (idx < 0) return null;
    if (candidate.type === targetType) return null;
    const refund = candidate.paidCost || runtime.adjustedCost(runtime.E, runtime.BUILDINGS[candidate.type].cost);
    runtime.E.buildings.splice(idx, 1);
    let result = null;
    try {
      const cell = runtime.findCell(runtime.E, targetType);
      if (!cell) return null;
      const rates = runtime.productionRates(runtime.E),
        use = runtime.consumptionRates(runtime.E);
      const add = runtime.BUILDINGS[targetType]?.unit ? runtime.projectedSpawnerNeed(targetType) : runtime.C();
      const minimum = {
        wood: 2.5,
        stone: 1,
        food: 2
      };
      const sustainable = runtime.RES.every(r => rates[r] >= Math.max(minimum[r], (use[r] + (add[r] || 0)) * 1.18 + .35));
      const price = runtime.placementPrice(runtime.E, targetType, cell[0], cell[1], cell[2]);
      const affordable = runtime.RES.every(r => (runtime.E.resources[r] || 0) + (refund[r] || 0) * .5 >= (price[r] || 0));
      result = {
        cell,
        rates,
        use,
        add,
        sustainable,
        affordable
      };
    } finally {
      runtime.E.buildings.splice(idx, 0, candidate);
    }
    return result;
  };
}
