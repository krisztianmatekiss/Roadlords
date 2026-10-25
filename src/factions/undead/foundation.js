import {
  UNDEAD_BUILDINGS as D,
  UNDEAD_UNITS as U,
  UNDEAD_UPGRADES,
  UNDEAD_START,
  UNDEAD_RULES,
} from '../../data/undead.js';
export const isUndead = (c) => c?.race === 'undead';
export function initializeUndeadFoundation(R) {
  const at = (level, values) => values[Math.max(0, Math.min(values.length - 1, level - 1))];
  const unitFamily = (key) => (key === 'und_skeleton_archer' ? 'skeleton' : key.replace('und_', ''));
  const soulPrice = (n) => R.C(n, 0, 0);
  R.buildingDefinition = (c, type) => (isUndead(c) && type === 'keep' ? D.keep : R.BUILDINGS[type]);
  R.FACTIONS = {
    human: { name: 'Emberek', basic: R.BASIC },
    orc: { name: 'Orkok', basic: window.__ROADLORDS_ORCS__.basic },
    undead: { name: 'Élőhalottak', basic: UNDEAD_START },
  };
  R.factionName = (race) => R.FACTIONS[race]?.name || 'Emberek';
  R.factionBasics = (race) => R.FACTIONS[race]?.basic || R.BASIC;
  R.factionMatches = (race, def, key) =>
    race === 'undead'
      ? key === 'keep' || def.race === 'undead'
      : race === 'orc'
        ? def.race === 'orc' || ['keep', 'warehouse'].includes(key)
        : !def.race || def.race === 'human';
  R.factionUnitMatches = (race, def) => (def.race || 'human') === (race || 'human');
  const oldTerrain = R.generateTerrain;
  R.generateTerrain = (c, ruinCount) => {
    const out = oldTerrain(c, ruinCount);
    if (isUndead(c))
      c.terrain = c.terrain.map((t) =>
        ['forest', 'quarry', 'fertile'].includes(t?.type) ? null : t,
      );
    return out;
  };
  R.initializeFactionCity = (c) => {
    if (!isUndead(c)) {
      delete c.undeadState;
      return;
    }
    c.undeadState = { bankClock: 0, skeletonDeaths: 0, freeQueue: [], lostBuildingIds: [] };
    c.resources = soulPrice(UNDEAD_RULES.startingSouls);
    c.caps = R.C(Number.MAX_SAFE_INTEGER, 0, 0);
    c.unlocked = new Set(UNDEAD_START);
    c.garrisonCap = 30;
  };
  for (const [key, d] of Object.entries(D))
    if (key !== 'keep') {
      R.BUILDINGS[key] = { ...d, cost: soulPrice(d.souls) };
      R.BUILDING_IMAGE_META[key] = {
        w: Math.max(...d.shape.map((x) => x[1])) + 1,
        h: Math.max(...d.shape.map((x) => x[0])) + 1,
      };
      if (!R.UNLOCKABLE.includes(key)) R.UNLOCKABLE.push(key);
      if (d.branches.length) R.V4_BRANCHES[key] = d.branches;
      else R.V4_SIMPLE_L4.add(key);
    }
  for (const [key, u] of Object.entries(U)) {
    R.UNITS[key] = { ...u, cost: soulPrice(u.souls), damageType: u.damageType || 'physical', race: 'undead' };
    R.UNIT_ORDER.push(key);
  }
  const available = (c, key) =>
    c.buildings.some(
      (b) =>
        R.BUILDINGS[b.type]?.unit === key || (key === 'und_skeleton_archer' && b.type === 'und_graveyard'),
    );
  for (const o of UNDEAD_UPGRADES) {
    const unit = Object.keys(U).find((k) => U[k].name === o.scope);
    const def = {
      ...o,
      eligible: (c) =>
        isUndead(c) &&
        (!o.expansion || c.buildings.some(b=>R.BUILDINGS[b.type]?.unit)) &&
        (unit
          ? available(c, unit)
          : o.id === 'garden_chance'
            ? R.hasBuilding(c, 'und_garden_of_dead')
            : true),
    };
    (o.kind === 'normal' ? R.NORMAL : R.LEGENDARY).push(def);
    if (unit) R.PICK_UNIT_IMAGES[o.id] = unit;
  }
  const oldNormal = R.eligibleNormal,
    oldLegend = R.eligibleLegendary;
  for (const [key, prev] of [
    ['eligibleNormal', oldNormal],
    ['eligibleLegendary', oldLegend],
  ])
    R[key] = (c) => prev(c).filter((o) => (isUndead(c) ? o.race === 'undead' : o.race !== 'undead'));
  const oldUnlock = R.buildingUnlockPool,
    oldStart = R.startBuildingPool,
    oldUpgrade = R.buildingUpgradePool;
  R.buildingUnlockPool = (c) =>
    isUndead(c)
      ? Object.keys(D)
          .filter((k) => k !== 'keep' && !c.unlocked.has(k))
          .map((k) => R.makeBuildingChoice(c, k))
      : oldUnlock(c).filter((o) => o.id === 'keep' || R.BUILDINGS[o.id]?.race !== 'undead');
  R.startBuildingPool = (c) =>
    isUndead(c) ? R.buildingUnlockPool(c) : oldStart(c).filter((o) => R.BUILDINGS[o.id]?.race !== 'undead');
  R.buildingUpgradePool = (c) => {
    if (!isUndead(c)) return oldUpgrade(c);
    const out = [];
    for (const type of Object.keys(D)) {
      const lv = R.levelOf(c, type),
        d = D[type];
      if (!R.hasBuilding(c, type) || lv >= 4) continue;
      if (lv === 3 && d.branches.length)
        for (const branch of d.branches)
          out.push({
            kind: 'building_branch',
            id: type,
            branch: branch.id,
            level: 4,
            icon: branch.icon,
            name: branch.name,
            description: branch.description,
            details: `${d.name} · L4<br>${d.levels[3]}`,
          });
      else
        out.push({
          kind: 'building_upgrade',
          id: type,
          level: lv + 1,
          icon: d.icon,
          name: `${d.name} · L${lv + 1}`,
          description: d.levels[lv],
          details: R.buildingUpgradeDetails(c, type),
        });
    }
    return out;
  };
  const oldDetails = R.buildingUpgradeDetails,
    oldChoice = R.buildingChoiceDetails,
    oldBranch = R.branchLabel;
  R.buildingUpgradeDetails = (c, type) => {
    if (!isUndead(c) || !D[type]) return oldDetails(c, type);
    const d = D[type], lv = R.levelOf(c, type);
    if (lv >= 4) return 'Elérte a legmagasabb szintet.';
    if (lv === 3 && d.branches.length) return 'Válassz egy L4-es ágat.';
    return `Jelenleg: ${d.levels[lv - 1]}<br>Fejlesztés után: ${d.levels[lv]}`;
  };
  R.buildingChoiceDetails = (c, type) =>
    isUndead(c) && D[type]
      ? `${D[type].levels[R.levelOf(c, type) - 1]}<br>Alapfenntartás: ${D[type].upkeep.toLocaleString('hu-HU')} Lélek/mp.${D[type].unit ? '<br>Egység ára: ' + U[D[type].unit].souls + ' Lélek.' : ''}`
      : oldChoice(c, type);
  R.branchLabel = (c, type) =>
    isUndead(c) && D[type]
      ? D[type].branches.find((b) => b.id === R.branchOf(c, type))?.name || ''
      : oldBranch(c, type);
  const oldCanPlace = R.canPlace;
  R.canPlace = (c, type, ...args) =>
    R.factionMatches(c.race, R.BUILDINGS[type] || {}, type) && oldCanPlace(c, type, ...args);
  const oldRecompute = R.recomputeCity;
  R.recomputeCity = (c, preserve = true) => {
    const ratio = c.maxHp ? c.hp / c.maxHp : 1,
      souls = isUndead(c) ? c.resources.wood : null;
    const out = oldRecompute(c, preserve);
    if (!isUndead(c)) return out;
    const lv = R.levelOf(c, 'keep');
    c.maxHp = at(lv, UNDEAD_RULES.capitalHp);
    c.hp = preserve ? Math.max(0, ratio * c.maxHp) : c.maxHp;
    c.armyCapBase =
      at(lv, UNDEAD_RULES.armyCapacity) +
      R.buildingOf(c, 'und_crypt').reduce((n, b) => n + at(b.level, [20, 30, 40, 80]), 0);
    c.armyCap = Math.max(0, c.armyCapBase - (c.towerGuardSlots || 0));
    c.garrisonCap = 30 + R.buildingOf(c, 'und_graveyard').length * R.countNormal(c, 'gen_graveyard_capacity');
    c.rallyCap = 0;
    c.caps = R.C(Number.MAX_SAFE_INTEGER, 0, 0);
    c.resources.wood = souls;
    c.resources.stone = c.resources.food = 0;
    c.undeadState ||= { bankClock: 0, skeletonDeaths: 0, freeQueue: [], lostBuildingIds: [] };
    return out;
  };
  const oldStats = R.statsFor;
  R.statsFor = (c, e) => {
    const s = oldStats(c, e);
    if (!U[e.key]) return s;
    const family = unitFamily(e.key),
      hp = 1 + 0.1 * R.countNormal(c, family + '_common_hp'),
      damage = 1 + 0.1 * R.countNormal(c, family + '_common_damage');
    const summon =
      e.undSummoned && e.key === 'und_skeleton' ? 1 + 0.1 * R.countNormal(c, 'necro_common_summon_stats') : 1;
    s.hp *= hp * summon * (e.undElite ? 1.5 : 1);
    s.dmg *= damage * summon * (e.undElite ? 1.5 : 1);
    s.buildingDamage *= damage * summon * (e.undElite ? 1.5 : 1);
    if (e.key === 'und_lich') s.buildingDamage = s.dmg * 5;
    return s;
  };
  const oldPermanent = R.permanentUnitData;
  R.permanentUnitData = (e) => {
    const out = oldPermanent(e);
    for (const k of [
      'undElite',
      'undConverted',
      'undSummoned',
      'undNoArmySlot',
      'undSpawnHp',
      'undReborn',
      'undMirror',
      'undSummonerId',
      'undLifetime',
    ])
      if (e[k] !== undefined) out[k] = e[k];
    if (e.undNoArmySlot && e.temporary > 0) out.undLifetime = e.temporary;
    return out;
  };
  const oldWeight = R.orcArmyWeight,
    oldReserveWeight = R.orcReserveWeight;
  R.orcArmyWeight = (e, ...args) => (e.undNoArmySlot ? 0 : oldWeight(e, ...args));
  R.orcReserveWeight = (e, ...args) => (e.undNoArmySlot ? 0 : oldReserveWeight(e, ...args));
  const oldField = R.fieldUnitCount;
  R.fieldUnitCount = (c) => {
    const side = R.sideForCity(c);
    if (!R.state.units.some((u) => u.alive && u.side === side && u.undNoArmySlot)) return oldField(c);
    return R.state.units.reduce(
      (n, u) => n + (u.alive && u.side === side && !u.undNoArmySlot ? R.orcArmyWeight(u, c) : 0),
      0,
    );
  };
  const oldReset = R.roadResetCity;
  R.roadResetCity = (c, race) => {
    oldReset(c, race);
    if (isUndead(c)) {
      R.initializeFactionCity(c);
      R.recomputeCity(c, false);
    }
    return c;
  };
  const oldHandle = R.mpHandle,
    oldSend = R.mpSend;
  R.mpSend = (data) => oldSend(data?.type === 'hello' ? { ...data, factionProtocol: 2 } : data);
  R.mpHandle = (data) => {
    if (
      data?.type === 'hello' &&
      (R.P.race === 'undead' || data.race === 'undead') &&
      data.factionProtocol !== 2
    ) {
      R.mpSetStatus('Az élőhalottakhoz mindkét játékos frissítse a játékot.', 'error');
      R.MP.conn?.close();
      return;
    }
    return oldHandle(data);
  };
  const oldGuest = R.mpApplyGuestStrategy;
  R.mpApplyGuestStrategy = (data, seq) => {
    if (data && isUndead(R.E) && Array.isArray(data.buildings)) {
      const byId = new Map(R.E.buildings.map((b) => [b.id, b])),
        lost = new Set(R.E.undeadState?.lostBuildingIds || []);
      data = {
        ...data,
        buildings: data.buildings
          .filter((b) => !lost.has(b.id))
          .map((b) => {
            const old = byId.get(b.id);
            if (!old) return b;
            const copy = { ...b };
            for (const key of ['undHp', 'undStarve']) if (old[key] !== undefined) copy[key] = old[key];
            return copy;
          }),
      };
    }
    const before = isUndead(R.E) ? R.E.buildings.map((b) => b.id) : [];
    const out = oldGuest(data, seq);
    if (before.length && R.MP.started)
      for (const id of before) if (!R.E.buildings.some((b) => b.id === id)) R.undBuildingLost?.(R.E, id);
    return out;
  };
  window.__ROADLORDS_FACTIONS__ = { matches: R.factionMatches, name: R.factionName };
  window.__ROADLORDS_UNDEAD__ = {
    isUndead,
    buildings: D,
    units: U,
    rules: UNDEAD_RULES,
    at,
    unitFamily,
    soulPrice,
    lexiconLevels: (type) =>
      D[type]
        ? '<div class="rlUpgradeBlock"><strong>SZINTEK / L4</strong>' +
          D[type].levels.map((v, i) => `<div class="rlUpgradeStep"><b>L${i + 1}</b><br>${v}</div>`).join('') +
          D[type].branches
            .map((b) => `<div class="rlBranch"><b>${b.name}</b><br>${b.description}</div>`)
            .join('') +
          '</div>'
        : '',
  };
}
