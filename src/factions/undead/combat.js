import { UNDEAD_UNITS as U, UNDEAD_RULES } from '../../data/undead.js';
import { isUndead } from './foundation.js';
export function initializeUndeadCombat(R) {
  const { at } = window.__ROADLORDS_UNDEAD__;
  let context = null,
    dirty = false;
  // Legacy attacks may attach marks/stuns before damage and burns/freezes after it.
  // Restore those changes for a dodged hit, including each separate area target.
  const negativeKeys = [
    'stunTime',
    'slowTime',
    'slowMult',
    'freezeImmunity',
    'freezeFollow',
    'burnTime',
    'burnDps',
    'burnParts',
    'orcPoison',
    'orcPoisonClock',
    'orcBleed',
    'orcBleedClock',
    'rangedMarkTime',
    'orcCurses',
    'orcCurseSources',
    'undPoisonSource',
  ];
  const restoreGhost = (ctx, u) => {
    const old = ctx?.ghostEvaded?.get(u);
    if (old) {
      Object.assign(u, old);
      ctx.ghostEvaded.delete(u);
    }
  };
  const rememberGhost = (u) => {
    if (!context?.attack || u?.key !== 'und_ghost' && !R.undHasFirstWard?.(u)) return;
    restoreGhost(context, u);
    context.ghostStatus ||= new Map();
    if (!context.ghostStatus.has(u))
      context.ghostStatus.set(
        u,
        Object.fromEntries(
          negativeKeys.map((k) => [k, u[k] && typeof u[k] === 'object' ? structuredClone(u[k]) : u[k]]),
        ),
      );
  };
  const own = (u) => R.cityForSide(u.side),
    leg = (u, id) => R.hasLeg(own(u), id),
    count = (u, id) => R.countNormal(own(u), id);
  const withSource = (ctx, fn) => {
    const prev = context;
    context = ctx;
    try {
      return fn();
    } finally {
      context = prev;
    }
  };
  const near = (u, side, radius) => {
    const found = [];
    R.roadVisit(u, radius, (v) => {
      if (v.side === side && R.roadDistance(u, v) <= radius) found.push(v);
    });
    return found;
  };
  const opposite = (side) => (side === 'player' ? 'enemy' : 'player');
  R.undSpawn = (c, key, lane, offset = 0, extra = {}) => {
    if (
      extra.undNoArmySlot &&
      R.state.units.reduce(
        (n, u) => n + (u.alive && u.side === R.sideForCity(c) && u.undNoArmySlot ? 1 : 0),
        0,
      ) >= UNDEAD_RULES.technicalSummonLimit
    )
      return null;
    const e = R.makeEntry(c, key, extra),
      u = R.releaseUnit(c, e);
    if (!u) return null;
    R.setBattleLane(u, R.clamp(lane, 8, R.PATH_LENGTH - 8));
    u.offset = R.clamp(offset, -R.ROAD.half, R.ROAD.half);
    u.roadHomeOffset = u.offset;
    u.cooldown = 0.2;
    dirty = true;
    return u;
  };
  const release = R.releaseUnit;
  R.releaseUnit = (c, e) => {
    const u = release(c, e);
    if (!u) return u;
    if (U[u.key] || e.undConverted) {
      if(e.undConverted)u.undConverted=true;
      u.undSummonClock = 0;
      u.undBeams = [];
      u.undAuraClock = 0;
      u.undFrenzy = 0;
      if (e.undSpawnHp) u.hp = u.maxHp * e.undSpawnHp;
      if (e.undLifetime > 0) u.temporary = e.undLifetime;
    }
    return u;
  };
  R.undPoison = (target, stacks, c) => {
    if (!target?.alive || !(stacks > 0)) return;
    target.orcPoison = (target.orcPoison || 0) + stacks;
    if (isUndead(c)) target.undPoisonSource = R.sideForCity(c);
  };
  const mirror = (u) => {
    if (u.undMirror || !leg(u, 'ghost_leg_mirror')) return;
    const clone = R.undSpawn(own(u), 'und_ghost', u.lane + (u.id % 2 ? 12 : -12), (u.offset || 0) + 12, {
      undSummoned: true,
      undNoArmySlot: true,
      undMirror: true,
    });
    if (clone) clone.temporary = 10;
  };
  R.undTryDodge = (u, amount = 0, source = null, secondary = false) => {
    if(R.undConsumeFirstWard?.(u)){
      if(context?.ghostStatus?.has(u)){context.ghostEvaded ||= new Map();context.ghostEvaded.set(u,context.ghostStatus.get(u));}
      u.orcLastEvaded=true;return true;
    }
    if (u.key !== 'und_ghost') return false;
    const chance = u.undMirror
      ? 0.4
      : Math.min(
          leg(u, 'ghost_leg_intangible') ? 0.8 : 0.7,
          0.4 + 0.05 * count(u, 'ghost_common_dodge') + (leg(u, 'ghost_leg_intangible') ? 0.2 : 0),
        );
    if (Math.random() >= chance) return false;
    if (context?.ghostStatus?.has(u)) {
      context.ghostEvaded ||= new Map();
      context.ghostEvaded.set(u, context.ghostStatus.get(u));
    }
    u.orcLastEvaded = true;
    mirror(u);
    if (!secondary && source?.alive && R.hasBranch(own(u), 'und_ghost_spawner', 'revenant'))
      withSource({ source: u, attack: true, secondary: true }, () =>
        R.damageUnit(source, amount * 0.5, 'magic'),
      );
    return true;
  };
  const steal = (u, n) => {
    if (!u.alive || n <= 0) return;
    const c = own(u),
      requested = n * (0.3 + 0.05 * count(u, 'vampire_common_lifesteal') + (R.undGlobalLifeSteal?.(u)||0));
    const missing = Math.max(0, u.maxHp - u.hp),
      effective = requested * (u.orcPoison > 0 ? 0.7 : 1) * (u.healReceivedMult || 1);
    R.healUnit(u, requested);
    if (leg(u, 'vampire_leg_shield')) u.shield = (u.shield || 0) + Math.max(0, effective - missing);
    if (R.hasBranch(c, 'und_vampire_castle', 'blood_brotherhood')) {
      const ally = R.state.units
        .filter((v) => v.alive && v.side === u.side && v !== u && v.hp < v.maxHp)
        .sort((a, b) => R.roadDistance(a, u) - R.roadDistance(b, u))[0];
      if (ally) R.healUnit(ally, requested * 0.5);
    }
  };
  const damage = R.damageUnit;
  R.damageUnit = (target, amount, type) => {
    if (!target?.alive || !(amount > 0)) return 0;
    rememberGhost(target);
    const ctx = context,
      source = ctx?.source,
      hostile = source && source.side !== target.side;
    if(hostile&&!ctx.guarded)amount *= R.undDamageMultiplier?.(source,ctx)||1;
    if (
      ctx?.attack &&
      ctx.ranged &&
      type === 'physical' &&
      !ctx.guarded &&
      isUndead(own(target)) &&
      leg(target, 'skeleton_leg_guard') &&
      !target.key.startsWith('und_skeleton')
    ) {
      const guards = near(target, target.side, 40)
        .filter((v) => v.key === 'und_skeleton' && leg(v, 'skeleton_leg_guard'))
        .sort((a, b) => R.roadDistance(a, target) - R.roadDistance(b, target));
      if (guards.length) {
        target.orcLastEvaded = true;
        return withSource({ ...ctx, guarded: true }, () => R.damageUnit(guards[0], amount, type));
      }
    }
    target.orcLastEvaded = false;
    if (ctx?.attack && R.undTryDodge(target, amount, source, ctx.secondary)) {
      ctx.ghostStatus?.delete(target);
      return 0;
    }
    ctx?.ghostStatus?.delete(target);
    if (target.key.startsWith('und_skeleton') && ctx?.ranged && type === 'physical')
      amount *= 1 - Math.min(0.9, 0.25 + 0.05 * count(target, 'skeleton_common_ranged_res'));
    if (
      hostile &&
      source.key === 'und_zombie' &&
      leg(source, 'zombie_leg_poisoned_hunt') &&
      target.orcPoison > 0
    )
      amount *= 2;
    if (target.key === 'und_lich' && leg(target, 'lich_leg_shield') && !ctx?.secondary) {
      const victims = (target.undBeams || [])
        .map((b) => R.state.units.find((v) => v.id === b.id && v.alive))
        .filter(Boolean);
      if (victims.length) {
        const shared = (amount * 0.5) / victims.length;
        amount *= 0.5;
        for (const v of victims)
          withSource({ source: target, attack: false, secondary: true, kind: 'redirect' }, () =>
            R.damageUnit(v, shared, 'magic'),
          );
      }
    }
    const actual = damage(target, amount, type);
    if (hostile && actual > 0) {
      if (source.key === 'und_vampire') steal(source, actual);
      R.undAfterDamage?.(source,actual,ctx);
      if (source.key === 'und_lich' && ctx?.kind === 'beam' && source.alive) R.healUnit(source, actual);
      if (isUndead(own(source)) && ctx?.attack && !target.orcLastEvaded)
        R.undPoison(target, R.undEconomy(own(source)).poisonHits, own(source));
    }
    if (
      source?.alive &&
      hostile &&
      target.key === 'und_zombie' &&
      leg(target, 'zombie_leg_retribution') &&
      !ctx?.ranged &&
      ctx?.attack &&
      !ctx.secondary
    )
      R.undPoison(source, 2, own(target));
    return actual;
  };
  R.undDeathChainHit=(target,amount)=>withSource({source:null,attack:false,kind:'death_chain'},()=>R.damageUnit(target,amount,'magic'));
  const connect = (u, target) => {
    if (!target?.alive || u.undBeams.some((b) => b.id === target.id) || R.undTryDodge(target, u.damage, u))
      return false;
    u.undBeams.push({ id: target.id, age: 0 });
    return true;
  };
  const attack = R.roadRealAttack;
  const baseDamage = R.attackBaseDamage;
  R.attackBaseDamage = (u, t, ...args) => {
    rememberGhost(t);
    return baseDamage(u, t, ...args);
  };
  R.roadRealAttack = (u, t, opts = {}) => {
    const ctx = {
      source: u,
      attack: true,
      ranged:
        u.tags.includes('ranged') || !!u.spearVolleyReady || !!u.orcUsingSpear || !!u.roadAttack?.orcSpear,
    };
    try {
      return withSource(ctx, () => {
        rememberGhost(t);
        if (u.key === 'und_lich') {
          if (!u.alive || u.stunTime > 0) return;
          u.undBeams ||= [];
          connect(u, t);
          if (leg(u, 'lich_leg_greedy')) {
            const next = near(u, opposite(u.side), u.range).find(
              (v) => !u.undBeams.some((b) => b.id === v.id),
            );
            if (next) connect(u, next);
          }
          u.attackCount = (u.attackCount || 0) + 1;
          return;
        }
        const out = attack(u, t, opts);
        if (u.alive && u.key === 'und_vampire' && leg(u, 'vampire_leg_dual')) {
          const next = near(u, opposite(u.side), u.range)
            .filter((v) => v !== t)
            .sort((a, b) => R.roadDistance(a, u) - R.roadDistance(b, u))[0];
          if (next) R.applyDirectHit(u, next, R.attackBaseDamage(u, next, opts.mult || 1));
        }
        return out;
      });
    } finally {
      for (const v of ctx.ghostEvaded?.keys() || []) restoreGhost(ctx, v);
    }
  };
  const tower = R.updateTowers,
    garrison = R.garrisonFire;
  R.updateTowers = (dt) => withSource({ source: null, attack: true, ranged: true }, () => tower(dt));
  R.garrisonFire = (dt) => withSource({ source: null, attack: true, ranged: true }, () => garrison(dt));
  const statuses = R.updateUnitStatuses;
  R.updateUnitStatuses = (u, dt) => {
    if (u.undPoisonSource && u.orcPoison > 0 && u.alive) {
      const mult = R.undEconomy(R.cityForSide(u.undPoisonSource)).poisonMult;
      let time = (u.orcPoisonClock || 0) + dt,
        stacks = u.orcPoison,
        extra = 0;
      while (time >= 1 && stacks > 0) {
        extra += (mult - 1) * stacks;
        stacks--;
        time--;
      }
      if (extra > 0) u.hp = Math.max(1, u.hp - extra);
    }
    return statuses(u, dt);
  };
  const speed = R.effectiveMoveSpeed;
  R.effectiveMoveSpeed = (u, c) => speed(u, c) * Math.max(0.1, 1 - (u.undWitherSlow || 0));
  const attackSpeed = R.orcAttackSpeedMult13;
  R.orcAttackSpeedMult13 = (u) =>
    attackSpeed(u) *
    (1 + 0.1 * (u.undFrenzy || 0)) *
    (u.key === 'und_zombie' && leg(u, 'zombie_leg_poisoned_hunt') && u.roadAim?.orcPoison > 0 ? 2 : 1) *
    Math.max(0.1, 1 - (u.undWitherSlow || 0));
  R.unitPassesEnemies = (u) =>
    u.key === 'und_ghost' && R.hasBranch(own(u), 'und_ghost_spawner', 'phasewalker');
  const phaseTarget = (u, opps) => {
    const dir = u.side === 'player' ? 1 : -1;
    if (
      (u.undPhaseScanAt || 0) > R.ROAD.clock &&
      (!u.undPhaseAim || (u.undPhaseAim.alive && R.roadCanPursue(u, u.undPhaseAim)))
    )
      return u.undPhaseAim;
    let target = null;
    for (const v of opps)
      if (v.alive && v.tags.includes('ranged') && R.roadCanPursue(u, v)) {
        if (
          !target ||
          dir * (v.lane - target.lane) > 0 ||
          (v.lane === target.lane && R.roadDistance(v, u) < R.roadDistance(target, u))
        )
          target = v;
      }
    u.undPhaseScanAt = R.ROAD.clock + 0.25 + (u.id % 7) * 0.01;
    u.undPhaseAim = target;
    return target;
  };
  const preferred = R.preferredTarget;
  R.preferredTarget = (u, opps) => {
    if (R.unitPassesEnemies(u)) {
      const target = phaseTarget(u, opps);
      if (target) {
        u.undPhaseTargetId = target.id;
        u.roadAim = target;
        return R.roadDistance(u, target) <= u.range ? target : null;
      }
    }
    if (u.key === 'und_lich') {
      const ids = new Set((u.undBeams || []).map((b) => b.id));
      if (u.roadAim?.alive && !ids.has(u.roadAim.id) && R.roadDistance(u, u.roadAim) <= u.range)
        return u.roadAim;
      if ((u.roadAimAt || 0) > R.ROAD.clock) return null;
      u.roadAimAt = R.ROAD.clock + 0.2;
      const candidates = near(u, opposite(u.side), u.range).filter(
        (v) => !ids.has(v.id) && R.roadCanPursue(u, v),
      );
      u.roadAim = candidates.sort((a, b) => R.roadDistance(a, u) - R.roadDistance(b, u))[0] || null;
      return u.roadAim;
    }
    return preferred(u, opps);
  };
  const advance = R.roadAdvance;
  R.roadAdvance = (u, opps, dt) => {
    if (!R.unitPassesEnemies(u)) return advance(u, opps, dt);
    const target = phaseTarget(u, opps);
    if (!target) return advance(u, opps, dt);
    if (u.stunTime > 0 || u.roadPending) return;
    const dx = target.lane - u.lane,
      dy = (target.offset || 0) - (u.offset || 0),
      d = Math.hypot(dx, dy),
      step = Math.min(Math.max(0, d - u.range * 0.8), R.effectiveMoveSpeed(u, own(u)) * dt);
    if (d > 0) {
      R.setBattleLane(u, R.clamp(u.lane + (dx / d) * step, 8, R.PATH_LENGTH - 8));
      u.offset = R.clamp((u.offset || 0) + (dy / d) * step, -R.ROAD.half, R.ROAD.half);
    }
  };
  const kill = R.killUnit;
  R.killUnit = (u, combat = true) => {
    if (!u?.alive) return;
    if (combat && u.hp > 0 && (u.key === 'und_ghost' || R.undHasFirstWard?.(u)) && context?.attack) {
      rememberGhost(u);
      if (R.undTryDodge(u, context.source?.damage || 0, context.source, context.secondary)) return;
    }
    const c = own(u),
      credit = context?.source,
      side = u.side,
      deadLane = u.lane,
      deadOffset = u.offset || 0;
    const out = kill(u, combat);
    if (u.alive) return out;
    dirty = true;
    if (!combat) return out;
    R.undOnCombatDeath?.(u);
    // Every extra life is a fresh actor; its once-only tomb flag survives upgrades.
    if (U[u.key] && isUndead(c)) {
      if (u.key.startsWith('und_skeleton')) {
        const state = c.undeadState;
        state.skeletonDeaths++;
        for (const b of R.buildingOf(c, 'und_bone_forge'))
          if (state.skeletonDeaths % at(b.level, [10, 8, 6, 4]) === 0) R.undQueueFree(c, 'und_zombie');
      }
      if (u.key === 'und_zombie') {
        const poison = 4 + count(u, 'zombie_common_poison');
        for (const v of near(u, opposite(side), 30)) R.undPoison(v, poison, c);
        if (R.hasBranch(c, 'und_morgue', 'dismantling'))
          R.undSpawn(c, 'und_skeleton', deadLane, deadOffset, {
            undSummoned: !!u.undSummoned,
            undNoArmySlot: !!u.undNoArmySlot,
            undReborn: !!u.undReborn,
          });
      }
      let reborn = false;
      if (u.key === 'und_lich' && Math.random() < Math.min(1, 0.03 * count(u, 'lich_common_respawn'))) {
        R.undQueueFree(c, u.key, { ...R.permanentUnitData(u), undSpawnHp: 1 });
        reborn = true;
      }
      const tomb = R.buildingOf(c, 'und_rebirth_tomb')[0];
      if (!reborn && tomb && !u.undReborn && Math.random() < at(tomb.level, [0.25, 0.3, 0.4, 0.5]))
        R.undQueueFree(c, u.key, { ...R.permanentUnitData(u), undReborn: true, undSpawnHp: 0.5 });
    }
    for (const enemy of [R.P, R.E])
      if (isUndead(enemy) && R.sideForCity(enemy) !== side) {
        for (const harvester of R.buildingOf(enemy, 'und_soul_harvester'))
          R.undAddSouls(enemy, at(harvester.level, [1, 2, 3, 4]));
        const garden = R.buildingOf(enemy, 'und_garden_of_dead')[0],
          local = { side: R.sideForCity(enemy), lane: deadLane };
        if (
          garden &&
          R.isOwnHalf(local) &&
          Math.random() < Math.min(1, 0.1 + 0.02 * R.countNormal(enemy, 'garden_chance'))
        ) {
          const key =
            garden.level === 4
              ? R.hasBranch(enemy, garden.type, 'raise_lich')
                ? 'und_lich'
                : 'und_vampire'
              : at(garden.level, ['und_skeleton', 'und_ghost', 'und_zombie']);
          R.undSpawn(enemy, key, deadLane, deadOffset);
        }
      }
    if (credit?.alive && credit.key === 'und_vampire' && credit.side !== side) {
      if (leg(credit, 'vampire_leg_frenzy')) credit.undFrenzy = (credit.undFrenzy || 0) + 1;
      if (R.hasBranch(own(credit), 'und_vampire_castle', 'blood_hunt')) {
        const target = near(credit, opposite(credit.side), 120)
          .filter((v) => v !== u)
          .sort((a, b) => R.roadDistance(a, credit) - R.roadDistance(b, credit))[0];
        if (target) credit.undBloodHunt = target.id;
      }
    }
    return out;
  };
  const battle = R.updateBattle;
  R.updateBattle = (dt) => {
    const out = battle(dt);
    if (!isUndead(R.P) && !isUndead(R.E)) return out;
    R.undById = new Map(R.state.units.filter((u) => u.alive).map((u) => [u.id, u]));
    for (const u of R.state.units) if (u.undWitherSlow) u.undWitherSlow = 0;
    for (const u of [...R.state.units]) {
      if (!u.alive || !U[u.key]) continue;
      const c = own(u);
      if (u.key === 'und_necromancer' && u.stunTime <= 0) {
        u.undSummonClock = (u.undSummonClock || 0) + dt;
        if (u.undSummonClock >= 15) {
          u.undSummonClock %= 15;
          const spirits = leg(u, 'necro_leg_spirits'),
            siege = leg(u, 'necro_leg_siege'),
            swarm = R.hasBranch(c, 'und_necro_spawner', 'skeleton_swarm');
          const n = (swarm ? 5 : 3) + (spirits || siege ? 1 : 0),
            target = siege && (u.roadAim?.alive ? u.roadAim : u.roadSeek?.alive ? u.roadSeek : null),
            center = target || u;
          for (let i = 0; i < n; i++) {
            const a = (Math.PI * 2 * i) / n,
              spawn = R.undSpawn(
                c,
                spirits ? 'und_ghost' : 'und_skeleton',
                center.lane + Math.cos(a) * 24,
                (center.offset || 0) + Math.sin(a) * 24,
                { undSummoned: true, undNoArmySlot: true, undSummonerId: u.id },
              );
            if (spawn && !R.hasBranch(c, 'und_necro_spawner', 'eternal_army')) spawn.temporary = 10;
            if (spawn) R.undeadSummonEffect?.(u, spawn);
          }
        }
      }
      if (u.key === 'und_zombie' && R.hasBranch(c, 'und_morgue', 'epidemic')) {
        u.undAuraClock = (u.undAuraClock || 0) + dt;
        if (u.undAuraClock >= 1) {
          u.undAuraClock %= 1;
          for (const v of near(u, opposite(u.side), 30)) if (!R.undTryDodge(v, 0, u)) R.undPoison(v, 2, c);
        }
      }
      if (u.key === 'und_lich') {
        const beams = [];
        const retarget = (beam) => {
          if (!R.hasBranch(c, 'und_lich_spawner', 'endless_hunger')) return null;
          const next = near(u, opposite(u.side), u.range).find(
            (v) =>
              !(u.undBeams || []).some((b) => b.id === v.id) &&
              !beams.some((b) => b.id === v.id) &&
              R.roadCanPursue(u, v),
          );
          if (next && !R.undTryDodge(next, u.damage, u)) {
            beam.id = next.id;
            return next;
          }
          return null;
        };
        for (const beam of u.undBeams || []) {
          let v = R.undById.get(beam.id);
          if (!v?.alive) v = retarget(beam);
          if (!v?.alive) continue;
          const age = beam.age || 0;
          beam.age = age + dt;
          if (u.stunTime <= 0) {
            const amount = ((5 * dt + 2 * (age * dt + (dt * dt) / 2)) * u.damage) / 5;
            withSource({ source: u, attack: false, kind: 'beam' }, () => R.damageUnit(v, amount, 'magic'));
          }
          if (!v.alive) v = retarget(beam);
          if (v?.alive) {
            beams.push(beam);
            if (R.hasBranch(c, 'und_lich_spawner', 'wither_bond'))
              v.undWitherSlow = Math.max(v.undWitherSlow || 0, Math.min(0.9, Math.floor(beam.age) * 0.05));
          }
        }
        u.undBeams = beams;
      }
      if (u.undBloodHunt && !u.roadPending && u.stunTime <= 0) {
        const target = R.undById.get(u.undBloodHunt);
        u.undBloodHunt = null;
        if (target?.alive && R.roadCanPursue(u, target)) {
          const dir = u.side === 'player' ? 1 : -1;
          R.setBattleLane(u, target.lane - dir * 24);
          u.offset = target.offset;
          u.cooldown = 0;
          R.attackUnit(u, target, { free: true });
        }
      }
    }
    for (const c of [R.P, R.E])
      if (isUndead(c)) {
        const side = R.sideForCity(c),
          advance = (u) => (side === 'player' ? u.lane : R.PATH_LENGTH - u.lane);
        c.undeadState.towerClock = (c.undeadState.towerClock || 0) + dt;
        const towerTicks = Math.floor(c.undeadState.towerClock);
        c.undeadState.towerClock -= towerTicks;
        const towers = R.buildingOf(c, 'und_dark_tower').filter((t) => !t.inactive);
        if (!towerTicks || !towers.length) continue;
        let target = null;
        for (const u of R.state.units)
          if (
            u.alive &&
            u.side !== side &&
            R.isOwnHalf({ side, lane: u.lane }) &&
            (!target || advance(u) < advance(target))
          )
            target = u;
        if (target && towerTicks)
          for (const tower of towers)
            if (!tower.inactive && target.alive)
              withSource({ source: null, attack: true, ranged: false }, () =>
                R.damageUnit(
                  target,
                  target.maxHp * at(tower.level, [0.01, 0.015, 0.02, 0.03]) * towerTicks,
                  'magic',
                ),
              );
      }
    if (dirty) {
      R.state.units = R.state.units.filter((u) => u.alive);
      R.roadReindex();
      dirty = false;
    }
    return out;
  };
  const shots = R.roadDrawShots;
  R.roadDrawShots = () => {
    shots();
    const byId = new Map(R.state.units.map((u) => [u.id, u])),
      g = R.ctx;
    g.save();
    g.strokeStyle = '#75f2bbc0';
    g.lineWidth = 1.4;
    g.shadowBlur = 0;
    for (const u of R.state.units)
      if (u.alive && u.key === 'und_lich')
        for (const b of u.undBeams || []) {
          const v = byId.get(b.id);
          if (!v?.alive) continue;
          const a = R.pointAt(u.lane, u.offset),
            z = R.pointAt(v.lane, v.offset);
          if (Math.max(a.x, z.x) < 0 || Math.min(a.x, z.x) > R.ROAD.w) continue;
          const h = ((20 * R.ROAD.h) / 600) * R.ROAD.zoom;
          g.beginPath();
          const origin = R.undeadBeamOrigin?.(u);
          g.moveTo(origin?.x ?? a.x, origin?.y ?? a.y - h);
          g.lineTo(z.x, z.y - h);
          g.stroke();
        }
    g.restore();
  };
  R.mpFactionUnitPayload = (u) =>
    u && (U[u.key] || u.undConverted || u.undPoisonSource || u.undWitherSlow)
      ? {
          undNoArmySlot: !!u.undNoArmySlot,
          undConverted: !!u.undConverted,
          undFirstGuardUsed: !!u.undFirstGuardUsed,
          undSummoned: !!u.undSummoned,
          undElite: !!u.undElite,
          undReborn: !!u.undReborn,
          undMirror: !!u.undMirror,
          undFrenzy: u.undFrenzy || 0,
          undBeams: u.undBeams || [],
          undWitherSlow: u.undWitherSlow || 0,
          orcPoison: u.orcPoison || 0,
        }
      : null;
  const apply = R.mpApplyUnitTargets;
  R.mpApplyUnitTargets = (packed) => {
    const out = apply(packed),
      raw = R.mpRevive(packed),
      byId = new Map(R.state.units.map((u) => [u.id, u]));
    if (Array.isArray(raw))
      for (const row of raw)
        if (Array.isArray(row) && row[20]) {
          const u = byId.get(row[0]);
          if (u) {
            Object.assign(u, row[20]);
            R.roadRemoteUnitEffects?.(u, row[20], byId);
          }
        }
    return out;
  };
  Object.assign(window.__ROADLORDS__, {
    releaseUnit: R.releaseUnit,
    killUnit: R.killUnit,
    damageUnit: R.damageUnit,
    updateBattle: R.updateBattle,
    fieldUnitCount: R.fieldUnitCount,
  });
}
