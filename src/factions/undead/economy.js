import { UNDEAD_BUILDINGS as D, UNDEAD_UNITS as U, UNDEAD_RULES } from '../../data/undead.js';
import { isUndead } from './foundation.js';
export function initializeUndeadEconomy(R) {
  const { at, soulPrice } = window.__ROADLORDS_UNDEAD__,
    cache = new WeakMap();
  R.undInRange = (c, a, b, range) =>
    R.cityBuildingCells(c, a).some(([r, col]) =>
      R.cityBuildingCells(c, b).some(([rr, cc]) => Math.max(Math.abs(r - rr), Math.abs(col - cc)) <= range),
    );
  const active = (c, type) => R.buildingOf(c, type).filter((b) => !b.inactive);
  R.undEconomy = (c) => {
    const key = `${c.undRevision || 0}:${c.buildings.map((b) => `${b.id}:${b.level}:${!!b.inactive}`).join(',')}`;
    const memo = cache.get(c);
    if (memo?.key === key) return memo.value;
    const buildings = c.buildings.filter((b) => !b.inactive && D[b.type]),
      overdrive = active(c, 'und_soul_overdrive')[0],
      anchors = active(c, 'und_soul_anchor'),
      hatcheries = active(c, 'und_corrupted_hatchery');
    const production = overdrive ? at(overdrive.level, [2, 2.25, 2.5, 3]) : 1,
      frugal = 0.95 ** R.countNormal(c, 'gen_soul_frugal'),
      abundance = 1 + 0.1 * R.countNormal(c, 'gen_soul_abundance'),
      upkeep = new Map(),
      speed = new Map();
    const towerCount = active(c, 'und_dark_tower').length;
    for (const b of buildings) {
      if (b.type === 'keep') continue;
      const reduction = Math.max(
        0,
        ...anchors
          .filter((a) => a.id !== b.id && R.undInRange(c, a, b, at(a.level, [1, 2, 3, 3])))
          .map((a) => (a.level === 4 ? 0.9 : 0.5)),
      );
      const cost =
        D[b.type].upkeep *
        frugal *
        (overdrive ? 3 : 1) *
        (1 - reduction) *
        (b.type === 'und_dark_tower' ? 1 + 0.25 * Math.max(0, towerCount - 1) : 1);
      upkeep.set(b.id, cost);
      if (D[b.type].unit) {
        const hatch = Math.max(
          0,
          ...hatcheries.filter((h) => R.undInRange(c, h, b, 1)).map((h) => at(h.level, [0.4, 0.6, 0.8, 1])),
        );
        speed.set(b.id, {
          mult: production * (1 + 0.05 * R.countNormal(c, 'gen_military_speed')) * (1 + hatch),
          hurt: hatch > 0,
        });
      }
    }
    const value = {
      buildings,
      production,
      abundance,
      upkeep,
      speed,
      totalUpkeep: [...upkeep.values()].reduce((n, x) => n + x, 0),
      poisonHits: active(c, 'und_plague_chamber').reduce((n, b) => n + (b.level === 4 ? 2 : 1), 0),
      poisonMult:
        1 + active(c, 'und_plague_chamber').reduce((n, b) => n + at(b.level, [0.1, 0.2, 0.3, 0.4]), 0),
    };
    cache.set(c, { key, value });
    return value;
  };
  const recompute = R.recomputeCity;
  R.recomputeCity = (c, ...a) => {
    if (isUndead(c)) c.undRevision = (c.undRevision || 0) + 1;
    return recompute(c, ...a);
  };
  R.undCredit = (c) => {
    const bank = active(c, 'und_soul_bank')[0];
    return bank ? at(bank.level, [200, 300, 400, 1000]) : 0;
  };
  const canPay = R.canPay;
  R.canPay = (c, price) =>
    isUndead(c)
      ? c.resources.wood + R.undCredit(c) + 1e-9 >= (price.wood || 0) && !(price.stone || price.food)
      : canPay(c, price);
  const buildPrice = R.buildPrice;
  R.buildPrice = (c, type) =>
    isUndead(c) && D[type]
      ? soulPrice(Math.ceil(D[type].souls * 0.95 ** R.countNormal(c, 'gen_build_discount')))
      : buildPrice(c, type);
  const placement = R.placementPrice;
  R.placementPrice = (c, type, row, col, rotation = 0) => {
    if (!isUndead(c)) return placement(c, type, row, col, rotation);
    const foundation = R.placementFoundationCells(c, type, row, col, rotation).length > 0;
    return soulPrice(
      Math.ceil(
        (D[type]?.souls || 0) * (foundation ? 0.5 : 1) * 0.95 ** R.countNormal(c, 'gen_build_discount'),
      ),
    );
  };
  const unitCost = R.unitCost;
  R.unitCost = (c, key) => (isUndead(c) && U[key] ? soulPrice(U[key].souls) : unitCost(c, key));
  const primary = R.primarySpawnCost;
  R.primarySpawnCost = (c, key, b) => (isUndead(c) && U[key] ? R.unitCost(c, key) : primary(c, key, b));
  const rates = R.productionRates;
  R.productionRates = (c) => {
    if (!isUndead(c)) return rates(c);
    const e = R.undEconomy(c);
    let income = at(R.levelOf(c, 'keep'), UNDEAD_RULES.capitalIncome);
    for (const b of e.buildings)
      if (b.type === 'und_well') income += at(b.level, [1, 2, 4, 8]) * e.production;
      else if (b.type === 'und_soul_burner') income += at(b.level, [2, 3, 4, 8]) * e.production;
    return soulPrice(income * e.abundance);
  };
  R.undAddSouls = (c, amount) => {
    const gain = amount * (1 + 0.1 * R.countNormal(c, 'gen_soul_abundance'));
    c.resources.wood += gain;
    if (c._matchStats) c._matchStats.resourcesProduced.wood += gain;
    return gain;
  };
  R.undTrainingTime = (c, b, ignoreDebt = false) =>
    !D[b.type]?.times || b.inactive || (!ignoreDebt && c.resources.wood < 0)
      ? Infinity
      : at(b.level, D[b.type].times) / (R.undEconomy(c).speed.get(b.id)?.mult || 1);
  const training = R.trainingTime;
  R.trainingTime = (c, b) => (isUndead(c) && D[b.type]?.unit ? R.undTrainingTime(c, b) : training(c, b));
  const preview = R.previewTrainingTime;
  R.previewTrainingTime = (c, type, level = R.levelOf(c, type)) =>
    isUndead(c) && D[type]?.unit
      ? at(level, D[type].times) /
        (R.undEconomy(c).production * (1 + 0.05 * R.countNormal(c, 'gen_military_speed')))
      : preview(c, type, level);
  const batch = R.productionBatchSize;
  R.productionBatchSize = (c, b) =>
    isUndead(c) && b.type === 'und_graveyard' && R.hasBranch(c, b.type, 'double_summon') ? 2 : batch(c, b);
  const flow = R.resourceFlowRates;
  R.resourceFlowRates = (c) => {
    if (!isUndead(c)) return flow(c);
    const e = R.undEconomy(c),
      production = soulPrice(0);
    for (const b of e.buildings)
      if (D[b.type].unit) {
        const t = R.undTrainingTime(c, b, true);
        if (Number.isFinite(t) && t > 0) production.wood += U[D[b.type].unit].souls / t;
      }
    return {
      gain: R.productionRates(c),
      use: soulPrice(production.wood + e.totalUpkeep),
      sources: { production, upkeep: soulPrice(e.totalUpkeep), market: R.C(), mercenaries: R.C() },
    };
  };
  const consume = R.consumptionRates;
  R.consumptionRates = (c, availableOnly = false) =>
    isUndead(c) ? R.resourceFlowRates(c).use : consume(c, availableOnly);
  const budget = R.productionBudgetRates;
  R.productionBudgetRates = (c) => (isUndead(c) ? R.resourceFlowRates(c).sources.production : budget(c));
  R.undBuildingLost = (c, id) => {
    const state = c.undeadState;
    if (!state || state.lostBuildingIds.includes(id)) return;
    state.lostBuildingIds.push(id);
    if (state.lostBuildingIds.length > 256) state.lostBuildingIds.shift();
    if (R.hasBranch(c, 'keep', 'death_squad')) {
      const keys = [...new Set([...c.unlocked].map((type) => D[type]?.unit).filter(Boolean))];
      if (keys.includes('und_skeleton') && R.hasLeg(c, 'skeleton_leg_archer'))
        keys.push('und_skeleton_archer');
      if (!keys.length) keys.push('und_skeleton');
      for (let i = 0; i < 10; i++) R.undQueueFree(c, R.pick(keys));
    }
  };
  R.undQueueFree = (c, key, extra = {}) => {
    const entry = R.makeEntry(c, key, extra);
    if (R.queueProduced(c, entry)) return true;
    const queue = c.undeadState?.freeQueue;
    if (queue && queue.length < UNDEAD_RULES.technicalSummonLimit) queue.push(entry);
    return false;
  };
  const demolish = R.demolish;
  R.demolish = (c, id) => {
    const out = demolish(c, id);
    if (out && isUndead(c) && (!R.MP.enabled || R.MP.role !== 'guest')) R.undBuildingLost(c, id);
    return out;
  };
  const produce = R.produceResources;
  R.produceResources = (c, dt) => {
    if (!isUndead(c)) return produce(c, dt);
    const income = R.productionRates(c).wood * dt,
      e = R.undEconomy(c);
    c.resources.wood += income;
    if (c._matchStats) c._matchStats.resourcesProduced.wood += income;
    const lost = [];
    for (const b of e.buildings) {
      if (b.type === 'keep') continue;
      if (R.pay(c, soulPrice((e.upkeep.get(b.id) || 0) * dt))) b.undStarve = 0;
      else b.undStarve = (b.undStarve || 0) + dt;
      if (b.type === 'und_soul_burner') {
        b.undHp = (b.undHp ?? 100) - (b.level === 4 ? 2 : 1) * dt;
        if (b.undHp <= 0) lost.push(b.id);
      }
      if (b.undStarve >= 10 - 1e-8) lost.push(b.id);
    }
    if (lost.length) {
      const ids = new Set(lost);
      c.buildings = c.buildings.filter((b) => !ids.has(b.id));
      for (const id of ids) R.undBuildingLost(c, id);
      R.recomputeCity(c, true);
      if (c === R.P) R.renderStatic();
    }
    const bank = active(c, 'und_soul_bank')[0],
      state = c.undeadState;
    if (bank) {
      state.bankClock += dt;
      while (state.bankClock >= 60) {
        state.bankClock -= 60;
        if (c.resources.wood > 0) R.undAddSouls(c, c.resources.wood * at(bank.level, [0.1, 0.12, 0.15, 0.2]));
      }
    } else state.bankClock = 0;
    for (let i = 0; i < 10 && state.freeQueue.length; i++) {
      if (!R.queueProduced(c, state.freeQueue[0])) break;
      state.freeQueue.shift();
    }
  };
  const normalSpawn = R.normalSpawn;
  R.normalSpawn = (c, b) => {
    if (!isUndead(c)) return normalSpawn(c, b);
    if (c.resources.wood < 0 || b.inactive) return false;
    const base = D[b.type]?.unit;
    if (!base) return false;
    if (c === R.E && !R.MP.enabled && c.undSaveSouls && c.resources.wood - U[base].souls < c.undSaveSouls)
      return false;
    const cost = R.unitCost(c, base),
      count = R.productionBatchSize(c, b);
    if (R.productionRoomFor(c, b) < count || !R.canPay(c, cost)) return false;
    R.pay(c, cost);
    R.recordResourceSpend38(c, cost);
    const elite =
      b.type === 'und_graveyard' &&
      R.hasBranch(c, b.type, 'elite_skeletons') &&
      c.buildings.filter((x) => x.type === 'und_graveyard' && x.id !== b.id && R.aiBuildingsTouch(c, b, x))
        .length >= 3;
    const hurt = R.undEconomy(c).speed.get(b.id)?.hurt;
    for (let i = 0; i < count; i++) {
      const key =
        base === 'und_skeleton' && R.hasLeg(c, 'skeleton_leg_archer') && Math.random() < 0.5
          ? 'und_skeleton_archer'
          : base;
      R.queueProduced(
        c,
        R.makeEntry(c, key, { originBuildingId: b.id, undElite: elite, undSpawnHp: hurt ? 0.5 : 1 }),
        b,
      );
    }
    c.spawnCounter = (c.spawnCounter || 0) + 1;
    return true;
  };
  const clear = R.clearTerrain;
  R.clearTerrain = (c, row, col, byAI = false) => {
    if (!isUndead(c)) return clear(c, row, col, byAI);
    const t = R.terrainAt(c, row, col);
    if (!t) return false;
    const price = soulPrice(t.type === 'ancient' ? 100 : t.type === 'ruin' ? 25 : 20);
    if (!R.pay(c, price)) {
      if (!byAI) R.toast('Nincs elég Lélek az eltakarításhoz.');
      return false;
    }
    R.setTerrain(c, row, col, null);
    if (t.type === 'ancient') {
      if (c === R.P) R.queueChoice('ancient');
      else R.grantEnemyPick('ancient', true);
    }
    if (!byAI) R.renderStatic();
    return true;
  };
  const rows = R.buildingEffectRows;
  R.buildingEffectRows = (c, b) => {
    if (!isUndead(c) || !D[b.type]) return rows(c, b);
    const d = D[b.type],
      branch = d.branches.find((x) => x.id === R.branchOf(c, b.type));
    const out = [
      ['Hatás', d.levels[b.level - 1]],
      ...(b.level === 4 && branch ? [['L4-es ág', branch.description]] : []),
      ['Fenntartás', `${(R.undEconomy(c).upkeep.get(b.id) || 0).toFixed(2)} Lélek/mp`],
    ];
    if (d.unit)
      out.push(
        [
          'Képzési idő',
          Number.isFinite(R.trainingTime(c, b))
            ? R.trainingTime(c, b).toFixed(2) + ' mp'
            : 'Adósság miatt szünetel',
        ],
        ['Egység ára', U[d.unit].souls + ' Lélek'],
      );
    if (b.type === 'und_soul_burner')
      out.push(['Hátralévő épség', `${Math.max(0, b.undHp ?? 100).toFixed(0)}%`]);
    if (b.undStarve > 0) out.push(['Fenntartás hiánya', `${b.undStarve.toFixed(1)} / 10 mp`]);
    return out;
  };
  const ownHalf = R.isOwnHalf;
  R.isOwnHalf = (u) => {
    const c = R.cityForSide(u.side);
    if (!isUndead(c) || !R.hasBranch(c, 'keep', 'dead_realm')) return ownHalf(u);
    const advance = (Math.min(100, Math.floor(Math.max(0, c.resources.wood) / 100)) * R.PATH_LENGTH) / 200;
    return u.side === 'player'
      ? u.lane <= R.PATH_LENGTH / 2 + advance
      : u.lane >= R.PATH_LENGTH / 2 - advance;
  };
}
