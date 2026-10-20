import { assetUrl } from '../assets/urls.js';
export function initializeAiArmyPlanning(runtime) {
  {
    function aiUnitFamilyV4979(key) {
      if (['swordsman', 'spearman', 'knight'].includes(key)) return 'melee';
      if (['archer', 'mage', 'catapult'].includes(key)) return 'ranged';
      if (key === 'priest') return 'support';
      return 'other';
    }
    function aiAverageProgressV4979(side) {
      const units = runtime.state.units.filter(u => u.alive && u.side === side);
      if (!units.length) return 0;
      return units.reduce((sum, u) => sum + (side === 'player' ? u.lane / runtime.PATH_LENGTH : (runtime.PATH_LENGTH - u.lane) / runtime.PATH_LENGTH), 0) / units.length;
    }
    function aiPressureV4979() {
      const player = runtime.state.units.filter(u => u.alive && u.side === 'player');
      const enemy = runtime.state.units.filter(u => u.alive && u.side === 'enemy');
      const pCount = player.length,
        eCount = enemy.length;
      const playerDeep = player.filter(u => u.lane > runtime.PATH_LENGTH * .72).length;
      const enemyDeep = enemy.filter(u => u.lane < runtime.PATH_LENGTH * .28).length;
      const pProg = aiAverageProgressV4979('player'),
        eProg = aiAverageProgressV4979('enemy');
      const pHp = (runtime.P.maxHp || 1) > 0 ? (runtime.P.hp || 0) / (runtime.P.maxHp || 1) : 1;
      const eHp = (runtime.E.maxHp || 1) > 0 ? (runtime.E.hp || 0) / (runtime.E.maxHp || 1) : 1;
      let score = 0;
      if (pCount >= eCount + 6 && (pCount + 4) / (eCount + 4) > 1.25) score++;
      if (playerDeep >= 3 && playerDeep > enemyDeep + 1) score++;
      if (pCount >= 4 && pProg > eProg + .12) score++;
      if (eHp < pHp - .15) score++;
      return {
        score,
        pCount,
        eCount,
        playerDeep,
        enemyDeep,
        pProg,
        eProg,
        pHp,
        eHp
      };
    }
    function aiAdaptationV4979() {
      const now = Number(runtime.state.time) || 0,
        m = aiPressureV4979();
      const st = runtime.E._aiAdapt4979 || (runtime.E._aiAdapt4979 = {
        level: 0,
        badSince: null,
        goodSince: null,
        last: m
      });
      st.last = m;
      const emergency = m.playerDeep >= 6 || m.eHp < m.pHp - .28;
      const bad = m.score >= 2,
        eligible = now >= 90 || emergency;
      if (eligible && bad) {
        if (st.badSince == null) st.badSince = now;
        st.goodSince = null;
        const badFor = now - st.badSince;
        if (m.score >= 3 && badFor >= 8 || emergency && badFor >= 4) st.level = 2;else if (badFor >= 12) st.level = Math.max(st.level, 1);
      } else {
        st.badSince = null;
        if (st.level > 0) {
          if (st.goodSince == null) st.goodSince = now;
          if (now - st.goodSince >= 25) {
            st.level = 0;
            st.goodSince = null;
          }
        } else st.goodSince = null;
      }
      return {
        level: st.level,
        metrics: m,
        badSince: st.badSince,
        goodSince: st.goodSince
      };
    }
    function aiCounterValueV4979(unit) {
      const m = runtime.aiObservedPlayerMix(),
        total = Math.max(1, runtime.aiMixTotal(m));
      const melee = runtime.aiMixCount(m, ['swordsman', 'spearman', 'knight']);
      const ranged = runtime.aiMixCount(m, ['archer', 'mage', 'priest', 'catapult']);
      const magic = runtime.aiMixCount(m, ['mage', 'priest']);
      const cav = m.knight || 0,
        heavy = (m.knight || 0) + (m.catapult || 0);
      if (unit === 'spearman') return Math.min(9, 9 * (cav + .55 * heavy) / total);
      if (unit === 'knight') return Math.min(9, 7 * ranged / total + 3 * magic / total);
      if (unit === 'archer') return Math.min(7, 6 * melee / total + 1.5 * magic / total);
      if (unit === 'mage') return Math.min(8, 7 * melee / total + 1);
      return 0;
    }
    function aiSelfCompositionScoreV4979(type) {
      const unit = runtime.BUILDINGS[type]?.unit;
      if (!unit) return -999;
      const own = runtime.aiSpawnerMix(),
        total = runtime.aiMixTotal(own),
        n = own[unit] || 0,
        doctrine = runtime.aiDoctrineUnit();
      const melee = runtime.aiMixCount(own, ['swordsman', 'spearman', 'knight']);
      const ranged = runtime.aiMixCount(own, ['archer', 'mage', 'catapult']);
      const combat = Math.max(0, total - (own.priest || 0));
      let s = 10 - n * 1.25 + Math.min(7, runtime.aiUnitInvestment(unit) * 1.35);
      if (doctrine === unit) s += 5.5;else if (doctrine && aiUnitFamilyV4979(doctrine) === aiUnitFamilyV4979(unit)) s += .8;
      if (n === 0 && total >= 2) s -= .8;
      if (total >= 3 && n / Math.max(1, total) > .62) s -= 4;
      if (['swordsman', 'spearman', 'knight'].includes(unit) && ranged > melee * 1.55) s += Math.min(4, 1 + (ranged - melee) * .55);
      if (['archer', 'mage'].includes(unit) && melee > Math.max(1, ranged) * 1.75) s += Math.min(4, 1 + (melee - ranged) * .5);
      if (unit === 'catapult') {
        if (runtime.state.time > 300) s += 2;
        if (n >= Math.max(1, Math.ceil(total * .18))) s -= 5;
      }
      if (unit === 'mage') {
        if (frontline === 0 && total === 0) s -= 3.5;else if (frontline === 0) s -= 4.0;
      }
      if (unit === 'archer' && frontline === 0 && total > 0) s -= 2.5;
      if (frontline === 0 && total > 0 && AI4980_FRONT.includes(unit)) s += 8.0;
      if (unit === 'priest') {
        if (combat < 2) s -= 8;else if (n === 0) s += 4;
        const share = (n + 1) / Math.max(1, total + 1);
        if (share > .28) s -= 10 + (share - .28) * 30;
        if (runtime.hasLeg(runtime.E, 'sacred_vow')) s += 5;
      }
      if (runtime.hasLeg(runtime.E, 'melee_doctrine')) s += runtime.UNITS[unit]?.tags?.includes('melee') ? 7 : -14;
      if (runtime.hasLeg(runtime.E, 'siege_doctrine') && unit === 'catapult') s += 3;
      return s;
    }
    runtime.aiCompositionScore = function (type) {
      const unit = runtime.BUILDINGS[type]?.unit;
      if (!unit) return -999;
      let s = aiSelfCompositionScoreV4979(type);
      const adapt = aiAdaptationV4979();
      if (adapt.level > 0) {
        const counter = aiCounterValueV4979(unit),
          factor = adapt.level === 1 ? .55 : 1;
        s += counter * factor;
        const own = runtime.aiSpawnerMix();
        if (counter >= 4.5 && (own[unit] || 0) === 0) s += adapt.level === 1 ? 1.5 : 3;
        if (counter >= 4.5 && (own[unit] || 0) >= 2) s -= 1.5;
      }
      return s;
    };
    runtime.aiMilitaryScore = function (type) {
      return runtime.aiCompositionScore(type) + Math.random() * .35;
    };
    runtime.aiMilitaryPool = function () {
      const all = [...runtime.E.unlocked].filter(k => runtime.BUILDINGS[k]?.category === 'military' && (!runtime.isUniqueBuilding(runtime.E, k) || !runtime.hasBuilding(runtime.E, k)));
      const built = runtime.spawnerBuildings(runtime.E);
      if (runtime.state.startChoices > 0 && !built.length) return [];
      if (!built.length) {
        const doctrine = runtime.aiDoctrineUnit();
        if (doctrine) {
          const core = all.filter(k => runtime.BUILDINGS[k]?.unit === doctrine);
          if (runtime.state.time < 100 && core.length) return core.sort((a, b) => runtime.aiMilitaryScore(b) - runtime.aiMilitaryScore(a));
          const specialized = all.filter(k => k !== 'barracks');
          if (specialized.length) return specialized.sort((a, b) => runtime.aiMilitaryScore(b) - runtime.aiMilitaryScore(a));
          if (core.length) return core.sort((a, b) => runtime.aiMilitaryScore(b) - runtime.aiMilitaryScore(a));
        }
      }
      return all.sort((a, b) => runtime.aiMilitaryScore(b) - runtime.aiMilitaryScore(a));
    };
    const scoreAiChoiceV4979Base = runtime.scoreAiChoiceV17;
    runtime.scoreAiChoiceV17 = function (o) {
      let s = scoreAiChoiceV4979Base(o),
        d = runtime.BUILDINGS[o?.id];
      if (o.kind === 'building' && d?.unit) {
        const own = aiSelfCompositionScoreV4979(o.id),
          adapt = aiAdaptationV4979();
        s += (own - 8) * 1.25;
        if (adapt.level === 0 && runtime.E.aiDoctrine === d.unit) s += 3;
      }
      if ((o.kind === 'building_upgrade' || o.kind === 'building_branch') && d?.unit) {
        const own = runtime.aiSpawnerMix(),
          count = own[d.unit] || 0;
        if (count) s += 2 + count * 1.2;
        if (runtime.E.aiDoctrine === d.unit) s += 3;
      }
      return s;
    };
    window.__ROADLORDS_AI_V4979__ = {
      pressure: aiPressureV4979,
      adaptation: aiAdaptationV4979,
      counterValue: aiCounterValueV4979,
      selfScore: aiSelfCompositionScoreV4979,
      compositionScore: type => runtime.aiCompositionScore(type),
      militaryPool: () => [...runtime.aiMilitaryPool()]
    };
  }
}
