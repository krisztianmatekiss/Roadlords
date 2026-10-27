import { assetUrl } from '../assets/urls.js';
export function initializeCoreFeatures1(runtime) {
  window.__ROADLORDS_VERSION__ = '4.9.40-reroll-footprint-hover';
}
export function initializeCoreFeatures2(runtime) {
  {
    const AI4980_PROFILES = [{
      id: 'balanced',
      name: 'Vegyes hadrend',
      w: {
        swordsman: .18,
        spearman: .18,
        archer: .23,
        knight: .16,
        mage: .10,
        priest: .09,
        catapult: .06
      }
    }, {
      id: 'assault',
      name: 'Rohamhadsereg',
      w: {
        swordsman: .27,
        spearman: .18,
        archer: .14,
        knight: .27,
        mage: 0,
        priest: .10,
        catapult: .04
      }
    }, {
      id: 'ranged',
      name: 'Távolsági fölény',
      w: {
        swordsman: .05,
        spearman: .20,
        archer: .32,
        knight: .12,
        mage: .20,
        priest: .09,
        catapult: .02
      }
    }, {
      id: 'heavy',
      name: 'Nehéz hadrend',
      w: {
        swordsman: .06,
        spearman: .22,
        archer: .14,
        knight: .34,
        mage: 0,
        priest: .09,
        catapult: .15
      }
    }, {
      id: 'siege',
      name: 'Ostromhadsereg',
      w: {
        swordsman: .10,
        spearman: .22,
        archer: .20,
        knight: .08,
        mage: .08,
        priest: .10,
        catapult: .22
      }
    }, {
      id: 'arcane',
      name: 'Mágikus hadrend',
      w: {
        swordsman: .04,
        spearman: .17,
        archer: .18,
        knight: .08,
        mage: .33,
        priest: .16,
        catapult: .04
      }
    }];
    const AI4980_UNITS = ['swordsman', 'spearman', 'archer', 'knight', 'mage', 'priest', 'catapult'];
    const AI4980_FRONT = ['swordsman', 'spearman', 'knight'];
    const AI4980_RANGED = ['archer', 'mage'];
    const AI4980_ORC_ROLES = { orc_warrior: 'swordsman', orc_berserker: 'swordsman', orc_goblin: 'archer', orc_warg: 'knight', orc_shaman: 'mage', orc_ram: 'catapult', orc_troll: 'knight' };
    const AI4980_SUPPORT = ['priest'];
    const AI4980_SIEGE = ['catapult'];
    const AI4980_PRODUCER = {
      wood: 'lumber',
      stone: 'stonecutter',
      food: 'farm'
    };
    const AI4980_UNIT_COMMON = {
      swordsman: ['swordsman_dmg', 'swordsman_hp', 'sword_as'],
      spearman: ['spear_dmg', 'spear_hp', 'spear_range'],
      archer: ['archer_dmg', 'archer_hp', 'archer_range'],
      knight: ['knight_dmg', 'knight_hp', 'knight_move'],
      mage: ['mage_dmg', 'mage_hp', 'mage_aoe'],
      priest: ['priest_dmg', 'priest_hp'],
      catapult: ['catapult_dmg', 'catapult_hp', 'cat_build']
    };
    const aiProductionRates = runtime.productionRates,
      aiConsumptionRates = runtime.consumptionRates;
    runtime.productionRates = function (c) {
      return c === runtime.E ? {
        ...runtime.aiMemo('production', () => aiProductionRates(c))
      } : aiProductionRates(c);
    };
    runtime.consumptionRates = function (c, availableOnly = false) {
      return c === runtime.E && !availableOnly ? {
        ...runtime.aiMemo('consumption', () => aiConsumptionRates(c))
      } : aiConsumptionRates(c, availableOnly);
    };
    const aiOldFindCell4980 = runtime.findCell;
    const aiLegacyScore4980 = runtime.scoreAiChoiceV17;
    function aiPlan4980() {
      let p = runtime.E._aiPlan4980;
      const now = Number(runtime.state.time) || 0;
      const reset = !p || now + 1 < (p.lastSeenTime || 0) || now < 1 && runtime.E.pickCount === 0 && (p.lastSeenTime || 0) > 1;
      if (reset) {
        const profile = AI4980_PROFILES[Math.floor(Math.random() * AI4980_PROFILES.length)];
        p = runtime.E._aiPlan4980 = {
          profileId: profile.id,
          profileName: profile.name,
          base: {
            ...profile.w
          },
          createdAt: now,
          lastSeenTime: now,
          adaptLevel: 0,
          badSince: null,
          goodSince: null,
          lastSupportAt: -999,
          lastMilitaryAt: -999,
          buildLog: [],
          choiceLog: [],
          waitFor: null
        };
        runtime.E.aiDoctrine = null;
      }
      p.lastSeenTime = now;
      return p;
    }
    function aiProfile4980() {
      const p = aiPlan4980();
      return AI4980_PROFILES.find(x => x.id === p.profileId) || AI4980_PROFILES[0];
    }
    function aiUnitForType4980(type) {
      const d = runtime.BUILDINGS[type];
      if (!d?.unit) return null;
      try {
        return runtime.effectiveUnitKey(runtime.E, {
          type,
          level: runtime.levelOf(runtime.E, type),
          id: 'ai-preview'
        }) || d.unit;
      } catch (_) {
        return d.unit;
      }
    }
    function aiTypeForUnit4980(unit, onlyUnlocked = true) {
      const keys = Object.keys(runtime.BUILDINGS).filter(k => runtime.BUILDINGS[k]?.unit && aiUnitForType4980(k) === unit && (!onlyUnlocked || runtime.E.unlocked.has(k)));
      return keys[0] || null;
    }
    function aiSpawnerMix4980() {
      const out = Object.fromEntries(AI4980_UNITS.map(k => [k, 0]));
      for (const b of runtime.spawnerBuildings(runtime.E)) {
        const k = runtime.effectiveUnitKey(runtime.E, b) || runtime.BUILDINGS[b.type]?.unit;
        if (k in out) out[k]++;
      }
      return out;
    }
    function aiSum4980(m, keys = AI4980_UNITS) {
      return keys.reduce((s, k) => s + (Number(m[k]) || 0), 0);
    }
    function aiAvailableUnits4980() {
      const set = new Set(['swordsman']);
      for (const k of runtime.E.unlocked) if (runtime.BUILDINGS[k]?.unit) set.add(aiUnitForType4980(k) || runtime.BUILDINGS[k].unit);
      return set;
    }
    function aiTargetWeights4980(forBuild = true) {
      const p = aiPlan4980(),
        base = {
          ...p.base
        };
      if (runtime.hasLeg(runtime.E, 'melee_doctrine')) {
        base.swordsman *= 1.7;
        base.spearman *= 1.7;
        base.knight *= 1.7;
        base.archer = 0;
        base.mage = 0;
        base.catapult = 0;
        base.priest *= runtime.hasLeg(runtime.E, 'sacred_vow') ? 1.15 : .9;
      }
      if (runtime.hasLeg(runtime.E, 'sacred_vow')) base.priest *= 1.3;
      if (runtime.hasLeg(runtime.E, 'mage_proliferation')) base.mage *= 1.28;
      if (runtime.hasLeg(runtime.E, 'magic_order')) {
        base.priest *= 1.08;
        base.mage *= 1.18;
      }
      if (runtime.hasLeg(runtime.E, 'rally_cavalry_rush') && runtime.hasBuilding(runtime.E, 'rally')) base.knight *= 1.38;
      const avail = forBuild ? aiAvailableUnits4980() : new Set(AI4980_UNITS);
      let total = 0;
      for (const k of AI4980_UNITS) if (avail.has(k)) total += Math.max(0, base[k] || 0);
      if (total <= 0) {
        base.swordsman = 1;
        total = 1;
      }
      const out = {};
      for (const k of AI4980_UNITS) out[k] = avail.has(k) ? Math.max(0, base[k] || 0) / total : 0;
      return out;
    }
    function aiInvestment4980(unit) {
      let s = 0;
      for (const id of AI4980_UNIT_COMMON[unit] || []) s += (runtime.E.normal[id] || 0) * .9;
      const t = aiTypeForUnit4980(unit, true);
      if (t && runtime.hasBuilding(runtime.E, t)) s += Math.max(0, runtime.levelOf(runtime.E, t) - 1) * 1.25;
      return s;
    }
    function aiObservedMix4980() {
      const out = Object.fromEntries(AI4980_UNITS.map(k => [k, 0]));
      const add = x => {
        const k = runtime.UNITS[x?.key]?.aiRole || AI4980_ORC_ROLES[x?.key] || x?.key;
        if (k in out) out[k] += x.key === 'orc_troll' ? 4 : 1;
      };
      for (const u of runtime.state.units) if (u.alive && u.side === 'player') add(u);
      for (const arr of [runtime.P.garrison, runtime.P.releaseQueue, runtime.P.rallyReserve || []]) for (const x of arr || []) add(x);
      return out;
    }
    function aiPressure4980() {
      const pu = runtime.state.units.filter(u => u.alive && u.side === 'player'),
        eu = runtime.state.units.filter(u => u.alive && u.side === 'enemy');
      const pc = pu.length,
        ec = eu.length;
      const pDeep = pu.filter(u => u.lane > runtime.PATH_LENGTH * .72).length,
        eDeep = eu.filter(u => u.lane < runtime.PATH_LENGTH * .28).length;
      const avg = (arr, side) => arr.length ? arr.reduce((s, u) => s + (side === 'player' ? u.lane / runtime.PATH_LENGTH : (runtime.PATH_LENGTH - u.lane) / runtime.PATH_LENGTH), 0) / arr.length : 0;
      const pp = avg(pu, 'player'),
        ep = avg(eu, 'enemy'),
        php = (runtime.P.hp || 0) / Math.max(1, runtime.P.maxHp || 1),
        ehp = (runtime.E.hp || 0) / Math.max(1, runtime.E.maxHp || 1);
      let score = 0;
      if (pc >= ec + 7 && (pc + 5) / (ec + 5) > 1.3) score++;
      if (pDeep >= 3 && pDeep > eDeep + 1) score++;
      if (pc >= 5 && pp > ep + .14) score++;
      if (ehp < php - .18) score++;
      return {
        score,
        pc,
        ec,
        pDeep,
        eDeep,
        pp,
        ep,
        php,
        ehp
      };
    }
    function aiAdapt4980() {
      const p = aiPlan4980(),
        now = Number(runtime.state.time) || 0,
        m = aiPressure4980();
      const emergency = m.pDeep >= 7 || m.ehp < m.php - .30,
        bad = m.score >= 2,
        eligible = now >= 100 || emergency;
      if (eligible && bad) {
        if (p.badSince == null) p.badSince = now;
        p.goodSince = null;
        const t = now - p.badSince;
        if (m.score >= 3 && t >= 10 || emergency && t >= 5) p.adaptLevel = 2;else if (t >= 14) p.adaptLevel = Math.max(1, p.adaptLevel || 0);
      } else {
        p.badSince = null;
        if (p.adaptLevel > 0) {
          if (p.goodSince == null) p.goodSince = now;
          if (now - p.goodSince >= 28) {
            p.adaptLevel = 0;
            p.goodSince = null;
          }
        } else p.goodSince = null;
      }
      return {
        level: p.adaptLevel || 0,
        metrics: m,
        badSince: p.badSince,
        goodSince: p.goodSince
      };
    }
    function aiCounter4980(unit) {
      const m = aiObservedMix4980(),
        tot = Math.max(1, aiSum4980(m)),
        melee = aiSum4980(m, AI4980_FRONT),
        ranged = aiSum4980(m, ['archer', 'mage', 'priest', 'catapult']),
        magic = (m.mage || 0) + (m.priest || 0),
        heavy = (m.knight || 0) + (m.catapult || 0);
      if (unit === 'spearman') return Math.min(7, 8 * ((m.knight || 0) + .45 * heavy) / tot);
      if (unit === 'knight') return Math.min(7, 6 * ranged / tot + 2.5 * magic / tot);
      if (unit === 'archer') return Math.min(5.5, 5 * melee / tot + 1.2 * magic / tot);
      if (unit === 'mage') return Math.min(6, 5.5 * melee / tot + .6);
      return 0;
    }
    function aiCompositionScore4980(type) {
      const unit = aiUnitForType4980(type);
      if (!unit) return -999;
      const mix = aiSpawnerMix4980(),
        weights = aiTargetWeights4980(true),
        total = aiSum4980(mix),
        n = mix[unit] || 0,
        after = total + 1;
      const desired = (weights[unit] || 0) * after,
        share = (n + 1) / after;
      const frontline = aiSum4980(mix, AI4980_FRONT),
        ranged = aiSum4980(mix, AI4980_RANGED),
        combat = total - (mix.priest || 0);
      const targetWeight = weights[unit] || 0,
        ad = aiAdapt4980(),
        counterValue = ad.level > 0 ? aiCounter4980(unit) : 0;
      if (total === 0 && ['priest', 'catapult'].includes(unit)) return -120;
      if (runtime.hasLeg(runtime.E, 'melee_doctrine') && ['archer', 'mage', 'catapult'].includes(unit)) return -999;
      if (targetWeight <= .001 && !(ad.level > 0 && counterValue >= 4)) return -100;
      let s = 10 + (desired - n) * 6 + targetWeight * 7 + Math.min(4, aiInvestment4980(unit) * .65);
      if (total === 0) {
        if (AI4980_FRONT.includes(unit)) s += 3.0;else s -= 6.5;
      }
      if (total >= 3 && share > targetWeight + .15) s -= (share - targetWeight - .15) * 28;else if (total === 2 && share > targetWeight + .25) s -= (share - targetWeight - .25) * 10;
      const softCap = Math.max(1, Math.ceil(targetWeight * after + .35));
      if (total >= 3 && n + 1 > softCap) s -= 18 * (n + 1 - softCap);
      if (targetWeight < .06 && n === 0 && total < 7) s -= 5;
      if (n === 0 && total >= 2) s += .8;
      if (total === 0 && unit === 'swordsman') {
        const specialistFront = ['spearman', 'knight'].some(k => aiAvailableUnits4980().has(k) && (weights[k] || 0) >= .14);
        if (specialistFront) s -= 4.2;else {
          const specialistCore = ['archer', 'mage', 'catapult'].some(k => aiAvailableUnits4980().has(k) && (weights[k] || 0) >= .20);
          if (specialistCore) s -= 1.4;
        }
      }
      if (AI4980_FRONT.includes(unit) && frontline / Math.max(1, total) < .43) s += 4.5;
      if (AI4980_RANGED.includes(unit) && frontline / Math.max(1, total) > .64) s += 2.5;
      if (unit === 'priest') {
        if (combat < 2) s -= 18;else if (n === 0) s += 3.2;
        if (n > 0 && share > .17) s -= 12 + (share - .17) * 45;
        if (runtime.hasLeg(runtime.E, 'sacred_vow')) s += 3;
      }
      if (unit === 'catapult') {
        if (frontline < 2 || total < 3) s -= 13;else if (n === 0) s += 2.8;
        if (n > 0 && share > .18) s -= 13 + (share - .18) * 40;
        if (runtime.state.time > 300) s += 1.5;
      }
      if (unit === 'mage' && !runtime.hasLeg(runtime.E, 'mage_proliferation') && runtime.hasBuilding(runtime.E, 'magetower')) s -= 100;
      if (ad.level > 0) {
        const c = counterValue,
          factor = ad.level === 1 ? .55 : 1;
        s += c * factor;
        if (c >= 4.2 && n === 0) s += ad.level === 1 ? 1 : 2.5;
        if (c >= 4.2 && n >= 2) s -= 2;
      }
      return s;
    }
    runtime.aiCompositionScore = aiCompositionScore4980;
    runtime.aiMilitaryScore = function (type) {
      if (!type || !runtime.BUILDINGS[type]?.unit) return -999;
      let s = aiCompositionScore4980(type);
      const u = aiUnitForType4980(type),
        p = aiPlan4980(),
        w = aiTargetWeights4980(false);
      s += (w[u] || 0) * 2.5;
      s += Math.min(2.2, aiInvestment4980(u) * .28);
      s -= AI4980_UNITS.indexOf(u) * .001;
      return s;
    };
    runtime.aiMilitaryPool = function () {
      if (runtime.state.startChoices > 0) return [];
      const scored = [...runtime.E.unlocked].filter(k => runtime.BUILDINGS[k]?.unit && (!runtime.isUniqueBuilding(runtime.E, k) || !runtime.hasBuilding(runtime.E, k))).map(k => ({
        k,
        s: runtime.aiMilitaryScore(k)
      })).filter(x => x.s > -90);
      scored.sort((a, b) => b.s - a.s);
      return scored.map(x => x.k);
    };
    function aiMilitaryGoal4981() {
      const p = aiPlan4980(),
        now = Number(runtime.state.time) || 0,
        pool = runtime.aiMilitaryPool();
      if (!pool.length) {
        p.militaryGoal = null;
        return null;
      }
      const best = pool[0],
        bestScore = runtime.aiMilitaryScore(best),
        g = p.militaryGoal;
      if (g) {
        const valid = runtime.E.unlocked.has(g.type) && runtime.BUILDINGS[g.type]?.unit && (!runtime.isUniqueBuilding(runtime.E, g.type) || !runtime.hasBuilding(runtime.E, g.type));
        const builtNow = runtime.buildingOf(runtime.E, g.type).length;
        if (valid && builtNow <= g.baseCount) {
          const gs = runtime.aiMilitaryScore(g.type);
          if (gs >= bestScore - 5.0 && now - g.since < 70) return g.type;
        }
      }
      p.militaryGoal = {
        type: best,
        unit: aiUnitForType4980(best),
        since: now,
        baseCount: runtime.buildingOf(runtime.E, best).length,
        reason: 'composition'
      };
      return best;
    }
    runtime.aiDoctrineUnit = function () {
      return null;
    };
    runtime.aiRememberChoice = function (o) {
      if (!o) return;
      const p = aiPlan4980();
      p.choiceLog.push({
        t: Number(runtime.state.time) || 0,
        kind: o.kind,
        id: o.id,
        branch: o.branch || null,
        name: o.name || o.id
      });
      if (p.choiceLog.length > 80) p.choiceLog.shift();
      runtime.E.aiLastChoiceKey = runtime.choiceKey(o);
      runtime.E.aiDoctrine = null;
    };
    function aiTerrainPenalty4980(c, type, fake, cells) {
      if (['lumber', 'stonecutter', 'farm'].includes(type)) return 0;
      let s = 0;
      if (cells.some(([r, col]) => runtime.terrainAt(c, r, col)?.type === 'fertile')) s -= 420;
      if (runtime.adjacentTerrain(c, fake, 'forest')) s -= 210;
      if (runtime.adjacentTerrain(c, fake, 'quarry')) s -= 210;
      return s;
    }
    runtime.findCell = function (c, type) {
      if (c !== runtime.E || runtime.MP.enabled) return aiOldFindCell4980(c, type);
      if (!runtime.BUILDINGS[type]) return null;
      return runtime.aiMemo('cell:' + type + ':' + c.buildings.map(b => b.id).join(','), () => {
        const occ = runtime.occupancy(c);
        const legal = (row, col, rot) => {
          for (const [dr, dc] of runtime.rotatedShape(type, rot)) {
            const r = row + dr,
              cc = col + dc;
            if (r < 0 || cc < 0 || r >= runtime.GRID || cc >= runtime.GRID || occ.has(runtime.idx(r, cc)) || runtime.terrainBlocks(c, r, cc)) return false;
          }
          return type !== 'guardhouse' || runtime.v491GuardhousePlacementValid(c, row, col, rot);
        };
        const sp = runtime.spawnerBuildings(c);
        const layout = runtime.aiLayoutPlan?.(c);
        const candidates = [],
          isProd = ['lumber', 'stonecutter', 'farm'].includes(type),
          smithRange = runtime.hasLeg(c, 'armor_extended_range') ? 2 : 1;
        for (const rot of runtime.rotationOptions(type)) for (let row = 0; row < runtime.GRID; row++) for (let col = 0; col < runtime.GRID; col++) if (legal(row, col, rot)) {
          const fake = {
              type,
              row,
              col,
              rotation: rot,
              id: 'ai-preview'
            },
            cells = runtime.rotatedShape(type, rot).map(([dr, dc]) => [row + dr, col + dc]);
          let s = 0,
            bonus = runtime.producerHasBonus(c, type, fake);
          if (bonus) s += 1000;
          s += aiTerrainPenalty4980(c, type, fake, cells);
          const near1 = b => runtime.aiBuildingsTouch ? runtime.aiBuildingsTouch(c, fake, b) : runtime.inBuildingRange(fake, b, 1),
            near2 = b => runtime.inBuildingRange(fake, b, 2);
          const coverage = layout ? runtime.aiSupportCoverage(c, fake, layout) : null;
          if (coverage === 0 && runtime.aiRequiresLocalTargets(c, fake)) continue;
          if (layout) s += runtime.aiLayoutAdjustment(c, fake, layout);
          if (type === 'rally') {
            s += sp.filter(runtime.hasBranch(c, 'rally', 'war_rally') ? near2 : near1).length * 75;
            if (runtime.hasLeg(c, 'campaign_feast') && runtime.buildingOf(c, 'tavern').some(near1)) s += 220;
          }
          if (type === 'tavern') {
            if (runtime.hasBranch(c, 'tavern', 'regulars')) s += sp.filter(near1).length * 70;
            if (runtime.hasLeg(c, 'campaign_feast') && runtime.buildingOf(c, 'rally').some(near1)) s += 220;
          }
          if (type === 'armorsmith') s += sp.filter(smithRange === 1 ? near1 : near2).length * 95;
          if (type === 'alchemist') {
            const huts = runtime.buildingOf(c, 'alchemist');
            let covered = 0;
            for (const b of sp.filter(near1)) {
              const already = huts.some(h => runtime.aiBuildingsTouch ? runtime.aiBuildingsTouch(c, h, b) : runtime.inBuildingRange(h, b, 1));
              covered += already && !runtime.hasLeg(c, 'alc_multi_hut') ? 0.25 : 1;
            }
            s += covered * 90;
          }
          if (type === 'academy' && !runtime.hasBranch(c, 'academy', 'war_academy')) s += sp.filter(near1).length * 90;
          if (type === 'guardhouse') {
            if (runtime.touchesWall(fake)) s += 90;
            if (runtime.buildingOf(c, 'rally').some(near1)) s += 110;
          }
          if (type === 'guildhouse') s += c.buildings.filter(x => ['lumber', 'stonecutter', 'farm'].includes(x.type) && near2(x)).length * 60;
          if (type === 'townhall') s += runtime.buildingOf(c, 'house').filter(near2).length * 50;
          if (type === 'house') s += runtime.buildingOf(c, 'townhall').some(near2) ? 75 : 0;
          if (type === 'warehouse' && runtime.hasLeg(c, 'supply_hub')) s += sp.filter(near1).length * 110;
          const keep = runtime.buildingOf(c, 'keep')[0];
          if (keep && runtime.hasLeg(c, 'royal_district')) {
            if (['lumber', 'stonecutter', 'farm'].includes(type) && near1(keep)) s += 95;
            if (runtime.BUILDINGS[type]?.unit && near1(keep)) s += 90;
          }
          if (runtime.BUILDINGS[type]?.unit) {
            if (runtime.hasLeg(c, 'factory_network')) s += sp.filter(near1).length * 45;
            if (runtime.buildingOf(c, 'rally').some(h => runtime.aiSupportAffects ? runtime.aiSupportAffects(c, h, fake) : near1(h))) s += 18;
            if (runtime.hasBranch(c, 'tavern', 'regulars') && runtime.buildingOf(c, 'tavern').some(near1)) s += 18;
            if (runtime.buildingOf(c, 'armorsmith').some(a => smithRange === 1 ? near1(a) : near2(a))) s += 28;
            if (runtime.buildingOf(c, 'alchemist').some(near1)) s += 22;
            const ac = runtime.buildingOf(c, 'academy')[0];
            if (ac && !runtime.hasBranch(c, 'academy', 'war_academy') && near1(ac)) s += 25;
          }
          if (runtime.placementFoundationCells(c, type, row, col, rot).length) s += 32 + (runtime.BUILDINGS[type].cost.wood + runtime.BUILDINGS[type].cost.stone) * .07;
          s -= .45 * (Math.abs(row - runtime.CENTER.row) + Math.abs(col - runtime.CENTER.col));
          s += Math.random() * .12;
          candidates.push({
            cell: [row, col, rot],
            score: s,
            bonus
          });
        }
        if (!candidates.length) return null;
        if (isProd && candidates.some(x => x.bonus)) for (const x of candidates) if (!x.bonus) x.score -= 1200;
        let best = candidates[0];
        for (const item of candidates) if (item.score > best.score) best = item;
        return best.cell;
      });
    };
    function aiNextMilitary4980() {
      return aiMilitaryGoal4981();
    }
    function aiCommittedCount4980() {
      return runtime.fieldUnitCount(runtime.E) + runtime.reserveCount(runtime.E);
    }
    function aiHouseUrgency4980() {
      const n = runtime.buildingOf(runtime.E, 'house').length,
        cap = Math.max(1, runtime.E.armyCap || 1),
        comm = runtime.fieldUnitCount(runtime.E) + Math.min(runtime.reserveCount(runtime.E), runtime.gateReleaseRate(runtime.E) * 5),
        sp = runtime.spawnerBuildings(runtime.E).length;
      const target = Math.max(0, Math.min(runtime.aiHouseTarget(), Math.floor(sp / 3) + (comm > cap * .72 ? 1 : 0)));
      return n < target || comm > cap * .84;
    }
    function aiSupportCandidates4980() {
      const p = aiPlan4980(),
        sp = runtime.spawnerBuildings(runtime.E).length,
        houses = runtime.buildingOf(runtime.E, 'house').length,
        econ = runtime.E.buildings.filter(b => ['lumber', 'stonecutter', 'farm'].includes(b.type)).length;
      const stock = r => (runtime.E.resources[r] || 0) / Math.max(1, runtime.E.caps[r] || 1),
        ad = aiAdapt4980();
      const out = [],
        add = (type, score, want = true, max = 1) => {
          if (!want || !runtime.E.unlocked.has(type) || !runtime.BUILDINGS[type]) return;
          const n = runtime.buildingOf(runtime.E, type).length;
          if (runtime.isUniqueBuilding(runtime.E, type) && n || n >= max) return;
          out.push({
            type,
            score
          });
        };
      add('rally', 11, sp >= 3 && !runtime.hasBuilding(runtime.E, 'rally'));
      add('tavern', 9.5, sp >= 4, Math.max(1, 1 + (runtime.E.legendaryStacks?.tavern_chain || 0)));
      add('armorsmith', 10.5, sp >= 3 && !runtime.hasBuilding(runtime.E, 'armorsmith'));
      add('hospital', 9.5, sp >= 4 && runtime.state.time >= 120 && !runtime.hasBuilding(runtime.E, 'hospital'));
      add('warcenter', 8.5, sp >= 5 && !runtime.hasBuilding(runtime.E, 'warcenter'));
      add('library', 7.8, runtime.state.time >= 100 && !runtime.hasBuilding(runtime.E, 'library'));
      add('mastersguild', 8, runtime.state.time >= 150 && runtime.E.buildings.length >= 9 && !runtime.hasBuilding(runtime.E, 'mastersguild'));
      add('academy', 9, runtime.state.time >= 180 && sp >= 4 && !runtime.hasBuilding(runtime.E, 'academy'));
      const alcMax = runtime.hasLeg(runtime.E, 'alc_multi_hut') ? Math.min(4, Math.max(1, Math.ceil(sp / 2))) : Math.min(3, Math.max(1, Math.ceil(sp / 3)));
      add('alchemist', 8.8, runtime.state.time >= 120 && sp >= 3, alcMax);
      add('merc_tent', 8.5, runtime.state.time >= 150 && sp >= 3 && !runtime.hasBuilding(runtime.E, 'merc_tent'));
      add('townhall', 7.5, houses >= 3 && !runtime.hasBuilding(runtime.E, 'townhall'));
      add('guildhouse', 7.8, econ >= 5 && !runtime.hasBuilding(runtime.E, 'guildhouse'));
      add('market', 6.8, !runtime.hasBuilding(runtime.E, 'market') && Math.max(...runtime.RES.map(stock)) > .8 && Math.min(...runtime.RES.map(stock)) < .3);
      add('warehouse', 10.2, runtime.hasLeg(runtime.E, 'supply_hub') && sp >= 2 && runtime.buildingOf(runtime.E, 'warehouse').length < 1, 1);
      add('guardhouse', 6.5 + Math.min(3, sp * .4), sp >= 3 && runtime.buildingOf(runtime.E, 'guardhouse').length < Math.min(4, 1 + Math.floor(sp / 3)), 4);
      const aliveTowers = runtime.towers.filter(t => t.side === 'enemy' && t.alive).length;
      add('towercommand', 6.5 + (ad.level ? 2 : 0), runtime.state.time >= 180 && aliveTowers > 0, Math.min(3, 1 + Math.floor(runtime.state.time / 360)));
      const since = Math.max(0, runtime.state.time - (p.lastSupportAt || -999));
      for (const x of out) if (sp >= 4 && since > 75) x.score += 1.5;
      return out.sort((a, b) => b.score - a.score);
    }
    function aiPlannedBuilds4980() {
      const out = [],
        mil = aiNextMilitary4980();
      if (mil) out.push({
        type: mil,
        weight: 1
      });
      if (aiHouseUrgency4980() && runtime.E.unlocked.has('house')) out.push({
        type: 'house',
        weight: .42
      });
      const sup = aiSupportCandidates4980()[0];
      if (sup && sup.score >= 9.2) out.push({
        type: sup.type,
        weight: .22
      });
      return out.slice(0, 3);
    }
    runtime.aiResourceTargets = function (extra = runtime.C()) {
      const use = runtime.consumptionRates(runtime.E),
        plan = aiPlannedBuilds4980(),
        planned = runtime.C(),
        nonKeep = runtime.E.buildings.filter(b => b.type !== 'keep').length,
        now = Number(runtime.state.time) || 0;
      for (const item of plan) {
        const cost = aiPriceAtBest4980(item.type),
          w = item.weight ?? 1;
        for (const r of runtime.RES) planned[r] += (cost[r] || 0) * w;
      }
      const growthWood = now < 70 ? 3.4 : now < 130 ? 2.35 : now < 220 ? 1.25 : .45;
      const horizon = nonKeep < 3 ? 82 : nonKeep < 7 ? 105 : 130;
      const out = {};
      for (const r of runtime.RES) {
        const futureUse = (use[r] || 0) + (extra[r] || 0);
        const ongoing = futureUse * 1.12;
        const buildGap = Math.max(0, (planned[r] || 0) - (runtime.E.resources[r] || 0));
        const construction = buildGap / horizon;
        const safety = futureUse * .10;
        const base = r === 'wood' ? .45 : r === 'stone' ? .16 : .06;
        out[r] = Math.max(base, ongoing + construction + safety + (r === 'wood' ? growthWood : 0));
      }
      return out;
    };
    runtime.aiResourceNeeds = function (extra = runtime.C()) {
      const rates = runtime.productionRates(runtime.E),
        targets = runtime.aiResourceTargets(extra),
        stock = r => (runtime.E.resources[r] || 0) / Math.max(1, runtime.E.caps[r] || 1);
      return runtime.RES.map(r => ({
        r,
        rate: rates[r],
        desired: targets[r],
        score: targets[r] / Math.max(.12, rates[r]) + (stock(r) < .10 ? .18 : 0)
      })).sort((a, b) => b.score - a.score);
    };
    function aiPriceAtBest4980(type) {
      if (!type) return runtime.C();
      const cell = runtime.findCell(runtime.E, type);
      if (cell) return runtime.placementPrice(runtime.E, type, cell[0], cell[1], cell[2]);
      return runtime.buildPrice(runtime.E, type);
    }
    function aiTimeToAfford4980(type) {
      if (!type) return 0;
      const price = aiPriceAtBest4980(type),
        rates = runtime.productionRates(runtime.E),
        use = runtime.consumptionRates(runtime.E);
      let t = 0;
      for (const r of runtime.RES) {
        const deficit = Math.max(0, (price[r] || 0) - (runtime.E.resources[r] || 0));
        if (!deficit) continue;
        const net = Math.max(0, rates[r] - (use[r] || 0));
        if (net <= .02) return Infinity;
        t = Math.max(t, deficit / net);
      }
      return t;
    }
    function aiBestProducer4980(extra = runtime.C()) {
      const needs = runtime.aiResourceNeeds(extra);
      const lumberCount = runtime.buildingOf(runtime.E, 'lumber').length;
      const stoneCount = runtime.buildingOf(runtime.E, 'stonecutter').length;
      const militaryRunning = runtime.activeSpawners(runtime.E).length > 0;
      if (lumberCount < 3) return 'lumber';
      if (stoneCount < 1) return 'stonecutter';
      for (const n of needs) {
        if (n.r === 'food' && !militaryRunning) continue;
        if (n.score > 1.10) return AI4980_PRODUCER[n.r];
      }
      return null;
    }
    function aiSustainableMilitary4980(type) {
      if (!type || !runtime.BUILDINGS[type]?.unit) return false;
      const rates = runtime.productionRates(runtime.E),
        use = runtime.consumptionRates(runtime.E),
        add = runtime.projectedSpawnerNeed(type),
        target = runtime.aiResourceTargets(add);
      const price = aiPriceAtBest4980(type),
        cost = runtime.unitCost(runtime.E, aiUnitForType4980(type));
      return runtime.RES.every(r => rates[r] >= target[r] * .93 || runtime.E.resources[r] >= (price[r] || 0) + (cost[r] || 0) * 2.5);
    }
    runtime.sustainableSpawner = function (type) {
      const d = runtime.BUILDINGS[type];
      if (!d) return false;
      if (!d.unit) return true;
      return aiSustainableMilitary4980(type);
    };
    runtime.producerNeededForSpawner = function (type) {
      return aiBestProducer4980(runtime.BUILDINGS[type]?.unit ? runtime.projectedSpawnerNeed(type) : runtime.C());
    };
    function aiBuild4980(type) {
      if (!type) return false;
      const before = runtime.buildingOf(runtime.E, type).length,
        ok = runtime.aiBuild(type),
        after = runtime.buildingOf(runtime.E, type).length;
      if (ok && after > before) {
        const p = aiPlan4980(),
          d = runtime.BUILDINGS[type];
        p.buildLog.push({
          t: Number(runtime.state.time) || 0,
          type,
          unit: d?.unit || null
        });
        if (p.buildLog.length > 120) p.buildLog.shift();
        if (d?.unit) p.lastMilitaryAt = Number(runtime.state.time) || 0;else if (!['lumber', 'stonecutter', 'farm', 'warehouse', 'house'].includes(type)) p.lastSupportAt = Number(runtime.state.time) || 0;
      }
      return ok;
    }
    function aiEmergencyMilitary4981(goal) {
      const ad = aiAdapt4980(),
        m = ad.metrics,
        p = aiPlan4980(),
        now = Number(runtime.state.time) || 0;
      if (ad.level < 2 && !(m.pDeep >= 6 && m.pc > m.ec + 3)) return null;
      if (now - (p.lastEmergencyMilitaryAt || -999) < 18) return null;
      const candidates = runtime.aiMilitaryPool().filter(t => {
        const u = aiUnitForType4980(t);
        if (['priest', 'catapult'].includes(u)) return false;
        return runtime.canPay(runtime.E, runtime.buildPrice(runtime.E, t));
      }).map(t => ({
        t,
        s: aiCompositionScore4980(t) + (AI4980_FRONT.includes(aiUnitForType4980(t)) ? 3 : 0) + aiCounter4980(aiUnitForType4980(t))
      }));
      candidates.sort((a, b) => b.s - a.s);
      const pick = candidates[0]?.t || null;
      return pick;
    }
    function aiExcavateAncient4980(goal) {
      const ruins = runtime.terrainCellsOfType(runtime.E, 'ancient'),
        price = runtime.terrainClearPrice(runtime.E,'ancient');
      if (!ruins.length || !runtime.canPay(runtime.E, price)) return false;
      const crowded = runtime.occupancy(runtime.E).size >= runtime.GRID * runtime.GRID * .65;
      if (!crowded && runtime.spawnerBuildings(runtime.E).length < 2) return false;
      const pressure = aiPressure4980();
      if (pressure.pDeep >= 3 || pressure.score >= 2) return false;
      const use = runtime.consumptionRates(runtime.E),
        rates = runtime.productionRates(runtime.E),
        planned = goal && !crowded ? aiPriceAtBest4980(goal) : runtime.C();
      for (const r of runtime.RES) {
        if (!(price[r] > 0)) continue;
        const operating = Math.max(0, (use[r] || 0) - (rates[r] || 0)) * 12;
        const reserve = Math.max(operating, Math.min(Math.max(0, runtime.E.caps[r] - price[r]), Math.max(20, planned[r] || 0)));
        if (runtime.E.resources[r] - price[r] < reserve) return false;
      }
      const occ = runtime.occupancy(runtime.E);
      const score = ([r, c]) => [[r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]].filter(([rr, cc]) => rr >= 0 && cc >= 0 && rr < runtime.GRID && cc < runtime.GRID && !occ.has(runtime.idx(rr, cc)) && !runtime.terrainBlocks(runtime.E, rr, cc)).length;
      ruins.sort((a, b) => score(b) - score(a));
      const [row, col] = ruins[0];
      return runtime.aiMutate(() => runtime.clearTerrain(runtime.E, row, col, true));
    }
    function aiDecision4980() {
      const p = aiPlan4980();
      p.waitFor = null;
      const record = (reason, type = null) => {
        p.decision = {
          time: runtime.state.time,
          reason,
          type
        };
        if (p.history?.at(-1)?.reason !== reason || p.history?.at(-1)?.type !== type) {
          (p.history || (p.history = [])).push({
            ...p.decision
          });
          if (p.history.length > 80) p.history.shift();
        }
      };
      const attempt = (type, reason) => {
        if (!type) return false;
        if (aiBuild4980(type)) {
          record(reason, type);
          return true;
        }
        if (!runtime.findCell(runtime.E, type) && runtime.aiMutate(() => runtime.aiMakeRoomFor(type))) {
          record('make_room', type);
          return true;
        }
        return false;
      };
      const wait = (type, reason) => {
        record(reason, type);
        p.waitFor = {
          type,
          since: runtime.state.time,
          eta: aiTimeToAfford4980(type)
        };
      };
      runtime.enemyGateAI();
      const opening = runtime.buildingOf(runtime.E, 'lumber').length < 3 ? 'lumber' : runtime.buildingOf(runtime.E, 'stonecutter').length < 1 ? 'stonecutter' : null;
      if (opening) {
        if (!attempt(opening, 'opening')) wait(opening, 'save_opening');
        return;
      }
      if (runtime.state.startChoices > 0) {
        record('starter_choices');
        return;
      }
      const militaryGoal = aiNextMilitary4980();
      const support = aiSupportCandidates4980()[0],
        lastSupport = p.lastSupportAt ?? -999;
      const supportDue = support && runtime.spawnerBuildings(runtime.E).length >= 3 && support.score >= 9.2 && p.buildLog.filter(x => x.unit && x.t > lastSupport).length >= 3 && runtime.state.time - lastSupport > 55;
      const goal = supportDue ? support.type : militaryGoal;
      const extra = goal && runtime.BUILDINGS[goal]?.unit ? runtime.projectedSpawnerNeed(goal) : runtime.C();
      const rates = runtime.productionRates(runtime.E),
        use = runtime.consumptionRates(runtime.E);
      const starving = runtime.RES.map(r => ({
        r,
        gap: (use[r] || 0) * 1.08 - (rates[r] || 0)
      })).filter(x => x.gap > .05 && runtime.E.resources[x.r] < Math.max(20, (use[x.r] || 0) * 12)).sort((a, b) => b.gap - a.gap);
      if (starving.length) {
        const type = AI4980_PRODUCER[starving[0].r];
        if (!attempt(type, 'sustain_army')) wait(type, 'save_income');
        return;
      }
      if (aiExcavateAncient4980(goal)) {
        record('ancient_pick', 'ancient');
        return;
      }
      if (aiHouseUrgency4980() && runtime.E.unlocked.has('house')) {
        if (attempt('house', 'army_capacity')) return;
        if (runtime.fieldUnitCount(runtime.E) >= runtime.E.armyCap - 2) {
          wait('house', 'save_capacity');
          return;
        }
      }
      if (goal) {
        const price = aiPriceAtBest4980(goal);
        if (runtime.RES.some(r => (price[r] || 0) > (runtime.E.caps[r] || 0) + 1e-9)) {
          if (!attempt('warehouse', 'storage_for_goal')) wait('warehouse', 'save_storage');
          return;
        }
        const sustainable = !runtime.BUILDINGS[goal]?.unit || aiSustainableMilitary4980(goal);
        if (!sustainable) {
          const producer = aiBestProducer4980(extra);
          if (producer) {
            if (attempt(producer, 'prepare_income')) return;
            if (runtime.findCell(runtime.E, producer)) {
              wait(producer, 'save_income');
              return;
            }
          }
        }
        if (runtime.canPay(runtime.E, price) && attempt(goal, supportDue ? 'planned_support' : 'military_goal')) return;
        const emergency = aiEmergencyMilitary4981(goal);
        if (emergency && emergency !== goal && aiSustainableMilitary4980(emergency) && attempt(emergency, 'emergency_defense')) {
          p.lastEmergencyMilitaryAt = runtime.state.time;
          return;
        }
        wait(goal, runtime.findCell(runtime.E, goal) ? supportDue ? 'save_support' : 'save_military' : 'no_build_space');
        return;
      }
      const producer = aiBestProducer4980(runtime.C());
      if (producer && attempt(producer, 'economy')) return;
      if (support && attempt(support.type, 'support')) return;
      record('no_build_needed');
    }
    runtime.enemyBuildAI = function (dt) {
      if (runtime.MP?.enabled) return;
      runtime.E.aiThink = (Number(runtime.E.aiThink) || 0) - Math.max(0, dt || 0);
      if (runtime.E.aiThink > 0) return;
      runtime.E.aiThink = .58 + Math.random() * .32;
      const previous = runtime.aiDecisionCache;
      runtime.aiDecisionCache = new Map();
      const started = performance.now();
      try {
        aiDecision4980();
      } finally {
        const p = aiPlan4980();
        p.decisionMs = performance.now() - started;
        p.cacheEntries = runtime.aiDecisionCache?.size || 0;
        runtime.aiDecisionCache = previous;
      }
    };
    function aiStarterMilitaryNeed4980(unit) {
      const w = aiTargetWeights4980(false),
        unlocked = aiAvailableUnits4980(),
        special = [...unlocked].filter(k => k !== 'swordsman').length;
      const target = w[unit] || 0;
      let s = target * 26;
      if (!unlocked.has(unit)) s += target >= .08 ? 3.2 : .3;
      if (special === 0 && target >= .08) s += 3;
      if (target < .035) s -= 2.5;
      if (unit === 'priest') s -= 2.5;
      if (unit === 'catapult') s -= 1.5;
      return s;
    }
    function aiSupportPickValue4980(id) {
      const base = {
        rally: 8.5,
        tavern: 7.5,
        armorsmith: 9,
        hospital: 8,
        library: 7.2,
        mastersguild: 6.8,
        academy: 8.2,
        alchemist: 8.1,
        warcenter: 7.5,
        guardhouse: 6.5,
        townhall: 6.2,
        guildhouse: 6.5,
        market: 4.5,
        merc_tent: 7.3,
        towercommand: 5.5
      };
      return base[id] || 4;
    }
    function aiLegendaryValue4980(id) {
      const mix = aiSpawnerMix4980(),
        sp = aiSum4980(mix),
        front = aiSum4980(mix, AI4980_FRONT),
        meleeShare = front / Math.max(1, sp),
        rates = runtime.productionRates(runtime.E),
        use = runtime.consumptionRates(runtime.E);
      const count = k => mix[k] || 0,
        has = t => runtime.hasBuilding(runtime.E, t);
      let s = 6;
      const generic = {
        strategic_superiority: 13,
        wide_choice: 10,
        double_choice: 10,
        specialization: 8,
        building_discount: 0,
        combined_assault: 10,
        chain_spawn: 8,
        factory_network: 8,
        double_assault: 9,
        mobilization: 8,
        long_training: 7,
        glass_cannon: 6,
        last_line: 6,
        full_garrison_economy: 6,
        large_garrison: 7,
        road_rush: 6,
        overproduction: 7,
        instant_l3: 8,
        stockpile_production: 7,
        castle_defenders: 7,
        high_keep: 8,
        royal_district: 8,
        capital_studies: 6
      };
      if (id in generic) s = generic[id];
      if (id === 'no_food') s = use.food > rates.food * .8 ? 11 : 7;
      if (id === 'melee_doctrine') s = meleeShare > .58 ? 11 : meleeShare > .45 ? 8 : 3;
      if (id === 'mono_veteran') {
        const combat = AI4980_UNITS.filter(k => !['priest', 'catapult'].includes(k)),
          top = Math.max(...combat.map(k => count(k)));
        s = sp > 0 && top === sp && sp <= 3 ? 9 : 2;
      }
      const unitLeg = {
        sacred_vow: 'priest',
        holy_wave: 'priest',
        holy_retribution: 'priest',
        phalanx: 'spearman',
        spear_pierce: 'spearman',
        spear_brace: 'spearman',
        archer_skirmish: 'archer',
        archer_close_combat: 'archer',
        marking_arrow: 'archer',
        cavalry_charge: 'knight',
        momentum: 'knight',
        knight_dismount: 'knight',
        catapult_range_as: 'catapult',
        catapult_knockback: 'catapult',
        artillery_sighting: 'catapult',
        mage_ward: 'mage',
        mage_triple: 'mage',
        sword_execute: 'swordsman',
        sword_whirlwind: 'swordsman',
        bloodlust: 'swordsman'
      };
      if (unitLeg[id]) {
        const u = unitLeg[id];
        s = 5 + Math.min(7, count(u) * 2.2 + aiInvestment4980(u) * .8);
        if ((aiTargetWeights4980(false)[u] || 0) > .16) s += 1.5;
      }
      if (id === 'siege_doctrine') s = 7.5 + Math.min(3, Math.max(0, sp - count('catapult')) * .45);
      if (id === 'arm_the_people') s = 6 + Math.min(5, runtime.E.buildings.filter(b => ['lumber', 'stonecutter', 'farm'].includes(b.type)).length * .8);
      if (id === 'combined_assault') s = 7 + Math.min(4, Object.values(mix).filter(n => n > 0).length * 1.1);
      if (id === 'supply_hub') s = has('warehouse') ? 9 : 7;
      if (id === 'campaign_feast') s = has('tavern') && has('rally') ? 11 : 6;
      if (id === 'tavern_chain') s = has('tavern') ? 9 : 6;
      if (id === 'house_militia') s = 5 + Math.min(5, runtime.buildingOf(runtime.E, 'house').length * 1.3);
      if (id === 'armor_extended_range') s = has('armorsmith') ? 10 : 7;
      if (id === 'magic_order') s = has('temple') ? 9 : 6;
      if (['hospital_veterans', 'hospital_doomed'].includes(id)) s = has('hospital') ? 10 : 6;
      if (id === 'rally_cavalry_rush') s = has('rally') && count('knight') ? 11 : 6;
      if (['tower_salvo', 'tower_rebuild'].includes(id)) s = 8;
      if (['alc_full_mix', 'alc_multi_hut', 'alc_recipe_twist'].includes(id)) s = has('alchemist') ? 10 : 6;
      return s;
    }
    function aiBranchScore4980(o) {
      const id = o.id,
        b = o.branch,
        profile = aiPlan4980().profileId,
        ad = aiAdapt4980(),
        sp = runtime.spawnerBuildings(runtime.E).length;
      let s = 7;
      if (id === 'keep') s = b === 'empire' ? runtime.productionRates(runtime.E).wood < 10 ? 10 : 8 : ad.level ? 11 : 9;else if (id === 'barracks') s = b === 'cavalry_barracks' && runtime.hasBuilding(runtime.E, 'stable') ? 10 : 8;else if (id === 'spearhall') s = b === 'pike_wall' ? ad.level ? 10 : 8 : 8.5;else if (id === 'archery') s = b === 'longbowmen' ? profile === 'ranged' ? 10 : 8 : 8.5;else if (id === 'stable') s = b === 'armored_knights' ? profile === 'heavy' ? 10 : 8 : 9;else if (id === 'siegeworks') s = b === 'trebuchet' ? profile === 'siege' ? 10 : 8 : 8.5;else if (id === 'magetower') s = b === 'fire_mages' ? profile === 'arcane' ? 10 : 9 : 8.5;else if (id === 'temple') s = b === 'high_priests' ? sp >= 5 ? 9 : 8 : 8.5;else if (id === 'market') s = b === 'war_suppliers' ? 9 : 8;else if (id === 'guildhouse') s = b === 'guild_network' ? 9 : 8.5;else if (id === 'warcenter') s = b === 'optimized_economy' ? 9.5 : 8.5;else if (id === 'townhall') s = b === 'fortress_city' && ad.level ? 10 : 8.5;else if (id === 'tavern') s = b === 'regulars' && runtime.spawnerBuildings(runtime.E).some(x => runtime.buildingOf(runtime.E, 'tavern').some(t => runtime.inBuildingRange(t, x, 1))) ? 10 : 8.5;else if (id === 'rally') s = b === 'lightning_assault' ? 9.5 : 9;else if (id === 'guardhouse') s = b === 'assault_guard' && runtime.hasBuilding(runtime.E, 'rally') ? 9.5 : 8.5;else if (id === 'armorsmith') s = b === 'heavy_armor' && (profile === 'heavy' || ad.level) ? 10 : 9;else if (id === 'hospital') s = b === 'mass_rescue' ? 9.5 : 9;else if (id === 'library') s = b === 'research_fever' && runtime.E.rerolls > 2 ? 10 : 8.5;else if (id === 'mastersguild') s = b === 'plan_council' ? 9.5 : 8.5;else if (id === 'academy') s = b === 'war_academy' && sp >= 5 ? 10 : 9;else if (id === 'alchemist') s = b === 'pure_concoction' ? 9.5 : 9;
      return s;
    }
    runtime.scoreAiChoiceV17 = function (o) {
      if (!o) return -999;
      const p = aiPlan4980(),
        rates = runtime.productionRates(runtime.E),
        targets = runtime.aiResourceTargets(),
        mix = aiSpawnerMix4980(),
        sp = aiSum4980(mix),
        starter = runtime.state.startChoices > 0;
      const need = runtime.RES.map(r => ({
          r,
          ratio: targets[r] / Math.max(.12, rates[r])
        })).sort((a, b) => b.ratio - a.ratio)[0],
        producer = AI4980_PRODUCER[need.r],
        strained = need.ratio > 1.05;
      let s = 4;
      if (o.kind === 'building') {
        const d = runtime.BUILDINGS[o.id];
        if (d?.unit) {
          const u = d.unit,
            w = aiTargetWeights4980(false)[u] || 0,
            mix = aiSpawnerMix4980(),
            total = aiSum4980(mix),
            have = mix[u] || 0;
          const deficit = w * (total + 1) - have,
            unlocked = aiAvailableUnits4980().has(u);
          s = 8 + aiStarterMilitaryNeed4980(u) + (starter ? 1 : 0);
          if (!starter) {
            s += Math.max(-3, Math.min(8, deficit * 5 + w * 8));
            if (!unlocked && w >= .10) s += 3;
            const ad = aiAdapt4980();
            if (ad.level) s += aiCounter4980(u) * (ad.level === 1 ? .35 : .65);
          }
        } else if (['lumber', 'stonecutter', 'farm'].includes(o.id)) s = o.id === producer ? strained ? 13 : 7 : 4;else s = aiSupportPickValue4980(o.id) + (starter ? 0 : Math.min(2, sp * .25));
        if (starter) {
          const available = aiAvailableUnits4980();
          if (d?.unit && available.size <= 2) s += 2;
          const startMil = p.choiceLog.filter(x => x.t <= 25 && runtime.BUILDINGS[x.id]?.unit).length;
          const startSupport = p.choiceLog.filter(x => x.t <= 25 && !runtime.BUILDINGS[x.id]?.unit).length;
          if (d?.unit && startMil >= 2) s -= 2.5;
          if (!d?.unit && startSupport >= 2) s -= 1.5;
        }
      } else if (o.kind === 'normal') {
        s = 5;
        const owned = runtime.E.normal[o.id] || 0;
        if (owned) s += Math.min(4, owned * 1.1);
        if (o.id === 'production') s += strained ? 5 : 1;
        if (o.id === 'spawn_speed') s += sp >= 3 ? 4 : 2;
        if (o.id === 'frugal_training') s += runtime.RES.some(r => runtime.consumptionRates(runtime.E)[r] > rates[r] * .75) ? 5 : 2;
        if (o.id === 'all_damage') s += 4 + Math.min(3, sp * .3);
        if (o.id === 'building_discount') s += runtime.state.time < 360 ? 5 : 2;
        if (o.id === 'tavern_damage') s += runtime.hasBuilding(runtime.E, 'tavern') ? 2 + (runtime.hasLeg(runtime.E, 'campaign_feast') ? 2 : 0) : -10;
        if (['tower_crews', 'tower_regen', 'tower_guard'].includes(o.id)) s += aiAdapt4980().level ? 3 : 1;
        if (o.id === 'gate_discipline') s += runtime.reserveCount(runtime.E) > runtime.E.garrisonCap * .6 ? 4 : 1;
        for (const u of AI4980_UNITS) if ((AI4980_UNIT_COMMON[u] || []).includes(o.id)) {
          const target = aiTargetWeights4980(false)[u] || 0,
            count = mix[u] || 0;
          s += target * 11 + Math.min(6, count * 1.6) + Math.min(3, aiInvestment4980(u) * .35);
          if (count === 0 && !aiAvailableUnits4980().has(u)) s -= 5;
        }
        if (o.id.startsWith('merc_')) s += runtime.hasBuilding(runtime.E, 'merc_tent') ? 5 : 0;
        if (o.id.startsWith('alc_')) s += runtime.hasBuilding(runtime.E, 'alchemist') ? 5 : 0;
      } else if (o.kind === 'building_upgrade') {
        s = 6;
        const d = runtime.BUILDINGS[o.id],
          n = runtime.buildingOf(runtime.E, o.id).length;
        if (d?.unit) {
          const u = d.unit,
            target = aiTargetWeights4980(true)[u] || 0;
          s += n * 1.8 + target * 8 + Math.min(4, aiInvestment4980(u) * .4);
        } else if (['lumber', 'stonecutter', 'farm'].includes(o.id)) s += o.id === producer ? strained ? 6 : 3 : 2;else s += Math.min(5, n * 1.2) + aiSupportPickValue4980(o.id) * .35;
        if (o.id === 'keep') s += 5;
        if (o.id === 'house' && aiHouseUrgency4980()) s += 4;
        if (o.id === 'warehouse' || o.id === 'keep') {
          const g = aiNextMilitary4980();
          if (g) {
            const pr = aiPriceAtBest4980(g);
            if (runtime.RES.some(r => (pr[r] || 0) > (runtime.E.caps[r] || 0) + 1e-9)) s += o.id === 'warehouse' ? 9 : 5;
          }
        }
      } else if (o.kind === 'building_branch') {
        s = aiBranchScore4980(o) + Math.min(4, runtime.buildingOf(runtime.E, o.id).length * 1.2);
      } else if (o.kind === 'legendary') {
        s = aiLegendaryValue4980(o.id);
        try {
          s += Math.max(0, Math.min(4, (aiLegacyScore4980(o) || 0) * .18));
        } catch (_) {}
      }
      return s + Math.random() * .12;
    };
    runtime.aiMakeRoomFor = function (type) {
      if (!type || runtime.findCell(runtime.E, type)) return false;
      if (typeof runtime.aiClearBlockingRuin === 'function' && runtime.aiMutate(() => runtime.aiClearBlockingRuin(type))) return true;
      const rates = runtime.productionRates(runtime.E),
        targets = runtime.aiResourceTargets(),
        resourceFor = {
          lumber: 'wood',
          stonecutter: 'stone',
          farm: 'food'
        };
      const candidates = [];
      for (const b of runtime.E.buildings) {
        if (b.type === 'keep' || runtime.BUILDINGS[b.type]?.unit || runtime.isUniqueBuilding(runtime.E, b.type)) continue;
        let score = 0;
        if (b.type === 'warehouse' && runtime.buildingOf(runtime.E, 'warehouse').length > 1) score += 70;
        if (['lumber', 'stonecutter', 'farm'].includes(b.type)) {
          const r = resourceFor[b.type],
            surplus = rates[r] - targets[r];
          if (surplus > 1.5) score += 30 + surplus * 8;else score -= 100;
          if (runtime.producerHasBonus(runtime.E, b.type, b)) score -= 45;
        }
        if (b.type === 'house' && runtime.buildingOf(runtime.E, 'house').length > Math.max(1, Math.floor(runtime.spawnerBuildings(runtime.E).length / 3))) score += 18;else if (b.type === 'house') score -= 100;
        if (b.type === 'guardhouse' && runtime.buildingOf(runtime.E, 'guardhouse').length > 2) score += 25;
        if (score > 0) candidates.push({
          b,
          score
        });
      }
      candidates.sort((a, b) => b.score - a.score);
      for (const {
        b
      } of candidates.slice(0, 8)) {
        if (b.type === 'warehouse') continue;
        if (b.type === 'house' && runtime.E.armyCap - runtime.v4LevelValue(b.level, [10, 15, 20, 40]) < runtime.fieldUnitCount(runtime.E) + 5) continue;
        const fits = runtime.aiMutate(() => {
          const original = runtime.E.buildings;
          runtime.E.buildings = original.filter(x => x.id !== b.id);
          try {
            if (!runtime.findCell(runtime.E, type)) return false;
            const after = runtime.productionRates(runtime.E),
              use = runtime.consumptionRates(runtime.E);
            return runtime.RES.every(r => after[r] >= Math.min(rates[r], (use[r] || 0) * 1.1));
          } finally {
            runtime.E.buildings = original;
          }
        });
        if (!fits) continue;
        if (!runtime.aiMutate(() => runtime.demolish(runtime.E, b.id))) return false;
        return true;
      }
      return false;
    };
    if (window.__ROADLORDS__) Object.assign(window.__ROADLORDS__, {
      updateBattle: runtime.updateBattle,
      priestAction: runtime.priestAction,
      updatePhalanx: runtime.updatePhalanx,
      preferredTarget: runtime.preferredTarget,
      lowestAlly: runtime.lowestAlly,
      updateTowers: runtime.updateTowers
    });
    window.__ROADLORDS_AI_V4980__ = {
      plan: () => JSON.parse(JSON.stringify(aiPlan4980())),
      profile: () => aiProfile4980(),
      weights: (forBuild = true) => aiTargetWeights4980(forBuild),
      mix: () => aiSpawnerMix4980(),
      observed: () => aiObservedMix4980(),
      pressure: () => aiPressure4980(),
      adaptation: () => aiAdapt4980(),
      counter: u => aiCounter4980(u),
      scoreType: t => aiCompositionScore4980(t),
      militaryPool: () => [...runtime.aiMilitaryPool()],
      supports: () => aiSupportCandidates4980(),
      resourceTargets: (extra = runtime.C()) => runtime.aiResourceTargets(extra),
      resourceNeeds: (extra = runtime.C()) => runtime.aiResourceNeeds(extra),
      eta: t => aiTimeToAfford4980(t),
      goal: () => aiNextMilitary4980(),
      economy: (t = aiNextMilitary4980()) => ({
        target: t,
        extra: t ? runtime.projectedSpawnerNeed(t) : runtime.C(),
        needs: runtime.aiResourceNeeds(t ? runtime.projectedSpawnerNeed(t) : runtime.C()),
        rates: runtime.productionRates(runtime.E),
        resources: {
          ...runtime.E.resources
        }
      }),
      scoreChoice: o => runtime.scoreAiChoiceV17(o),
      step: dt => runtime.tick(dt),
      enemyPick: s => runtime.grantEnemyPick(s),
      build: t => aiBuild4980(t),
      releasePlayer: (key, n = 1, lane = null) => {
        const arr = [];
        for (let i = 0; i < n; i++) {
          const u = runtime.releaseUnit(runtime.P, runtime.makeEntry(runtime.P, key));
          if (u && lane != null) u.lane = lane;
          if (u) arr.push(u);
        }
        return arr.length;
      }
    };
    if (window.__ROADLORDS__) {
      window.__ROADLORDS__.enemyBuildAI = runtime.enemyBuildAI;
      window.__ROADLORDS__.findCell = runtime.findCell;
      window.__ROADLORDS__.aiResourceTargets = runtime.aiResourceTargets;
      window.__ROADLORDS__.aiResourceNeeds = runtime.aiResourceNeeds;
      window.__ROADLORDS__.aiSpawnerTarget = runtime.aiSpawnerTarget;
    }
  }
}
