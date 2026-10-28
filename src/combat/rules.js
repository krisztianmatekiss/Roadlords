import { SPEAR_VOLLEY_RANGE, rangedRange } from '../data/ranged-balance.js';
import { assetUrl } from '../assets/urls.js';
import { formatMetres, formatSpeed } from '../world/measurements.js';
import { attackSourceCanResolve } from './target-budget.js';
export function register(runtime) {
  runtime.unitImageTag = function unitImageTag(key, cls = 'unitPortrait') {
    const src = runtime.UNIT_IMAGES[key];
    return src ? `<img class="${cls}" src="${src}" alt="${runtime.UNITS[key]?.name || ''}" draggable="false">` : `<span class="chicon">${runtime.UNITS[key]?.icon || ''}</span>`;
  };
  runtime.unitAvailable = function unitAvailable(c, key) {
    return c.buildings.some(b => runtime.BUILDINGS[b.type].unit === key);
  };
  runtime.tower = function tower(id, side, tier, f, hp) {
    const towerHp = hp * 4.5;
    return {
      id,
      side,
      tier,
      lane: runtime.PATH_LENGTH * f,
      lateral: 0,
      baseHp: towerHp,
      hp: towerHp,
      maxHp: towerHp,
      baseDamage: 96,
      baseRange: 165,
      baseCooldown: 1,
      regen: 0,
      cooldown: 0,
      alive: true
    };
  };
  runtime.gateTower = function gateTower(id, side, f, lateral) {
    const towerHp = 27000;
    return {
      id,
      side,
      tier: 4,
      gateTower: true,
      lane: runtime.PATH_LENGTH * f,
      lateral,
      baseHp: towerHp,
      hp: towerHp,
      maxHp: towerHp,
      baseDamage: 120,
      baseRange: 190,
      baseCooldown: .85,
      regen: 1,
      cooldown: 0,
      alive: true
    };
  };
  runtime.refreshTowerHpFor = function refreshTowerHpFor(c, side, preserve = true) {
    const mult = (1 + .10 * runtime.countNormal(c, 'building_hp')) * (1 + .08 * runtime.countNormal(c, 'tower_crews'));
    for (const t of runtime.towers.filter(t => t.side === side)) {
      const r = t.maxHp ? t.hp / t.maxHp : 1;
      t.maxHp = t.baseHp * mult;
      t.hp = t.alive ? preserve ? t.maxHp * r : t.maxHp : 0;
    }
  };
  runtime.targetStructure = function targetStructure(side) {
    const enemy = side === 'player' ? 'enemy' : 'player',
      arr = runtime.towers.filter(t => t.side === enemy && t.alive).sort((a, b) => side === 'player' ? a.lane - b.lane : b.lane - a.lane);
    if (arr.length) return arr[0];
    return {
      capital: true,
      side: enemy,
      lane: side === 'player' ? runtime.PATH_LENGTH : 0
    };
  };
  runtime.healUnit = function healUnit(u, amount) {
    u.hp = Math.min(u.maxHp, u.hp + amount);
  };
  runtime.giveTempShield = function giveTempShield(u, amount, dur = 5) {
    u.tempShield += amount;
    u.tempShieldTime = Math.max(u.tempShieldTime, dur);
  };
  runtime.nearestTarget = function nearestTarget(u, opps) {
    if (!opps.length) return null;
    let chosen = null,
      best = 1e9;
    if (u.key === 'knight') {
      const ranged = opps.filter(v => u.side === 'player' ? v.lane >= u.lane && v.lane - u.lane < 190 : v.lane <= u.lane && u.lane - v.lane < 190).filter(v => v.tags.includes('ranged') && !runtime.phalanxBetween(u, v.lane));
      if (ranged.length) opps = ranged;
    }
    for (const v of opps) {
      const d = runtime.roadDistance(v, u);
      if (d < best) {
        best = d;
        chosen = v;
      }
    }
    return chosen ? {
      unit: chosen,
      d: best
    } : null;
  };
  runtime.beginBattleSearch = function beginBattleSearch(players, enemies) {
    const context = {
      lists: new Map(),
      positions: new Map(),
      order: new Map(),
      sides: {}
    };
    for (const list of [players, enemies]) {
      let low = Infinity,
        high = -Infinity;
      for (const u of list) {
        low = Math.min(low, u.lane);
        high = Math.max(high, u.lane);
      }
      const buckets = new Map(),
        indexed = list.length >= 64 && high - low > 512;
      for (let i = 0; i < list.length; i++) {
        const u = list[i];
        if (!indexed) continue;
        context.order.set(u, i);
        const key = Math.floor(u.lane / runtime.BATTLE_BUCKET_SIZE);
        if (!buckets.has(key)) buckets.set(key, new Set());
        buckets.get(key).add(u);
        context.positions.set(u, key);
      }
      if (indexed) {
        context.lists.set(list, buckets);
        context.sides[list[0].side] = buckets;
      }
    }
    return context;
  };
  runtime.setBattleLane = function setBattleLane(u, lane) {
    u.lane = lane;
    const buckets = runtime.battleSearch?.sides[u.side];
    if (!buckets || !runtime.battleSearch.positions.has(u)) return;
    const previous = runtime.battleSearch.positions.get(u),
      key = Math.floor(lane / runtime.BATTLE_BUCKET_SIZE);
    if (key === previous) return;
    const old = buckets.get(previous);
    old.delete(u);
    if (!old.size) buckets.delete(previous);
    if (!buckets.has(key)) buckets.set(key, new Set());
    buckets.get(key).add(u);
    runtime.battleSearch.positions.set(u, key);
  };
  runtime.battleCandidates = function battleCandidates(list, lane, range) {
    const buckets = runtime.battleSearch?.lists.get(list);
    if (!buckets || !Number.isFinite(lane) || !Number.isFinite(range) || range < 0) return list;
    const lo = Math.floor((lane - range) / runtime.BATTLE_BUCKET_SIZE),
      hi = Math.floor((lane + range) / runtime.BATTLE_BUCKET_SIZE);
    if (hi - lo > 64) return list;
    const out = [];
    for (let k = lo; k <= hi; k++) {
      const bucket = buckets.get(k);
      if (bucket) for (const u of bucket) out.push(u);
    }
    return out;
  };
  runtime.battleOrder = function battleOrder(u) {
    return runtime.battleSearch?.order.get(u) ?? 0;
  };
  runtime.preferredTarget = function preferredTarget(u, opps) {
    const c = runtime.cityForSide(u.side),
      range = u.spearVolleyReady ? Math.max(u.range, SPEAR_VOLLEY_RANGE) : u.range;
    const longbow = u.key === 'archer' && runtime.hasBranch(c, 'archery', 'longbowmen');
    let best = null,
      bestPriority = -1,
      bestDist = Infinity,
      bestOrder = Infinity;
    for (const x of runtime.battleCandidates(opps, u.lane, range)) {
      if (!x.alive) continue;
      const dist = runtime.roadDistance(x, u);
      if (dist > range) continue;
      const priority = longbow && (x.tags && x.tags.includes('ranged') || x.cat === 'magic') ? 1 : 0,
        order = runtime.battleOrder(x);
      if (priority > bestPriority || priority === bestPriority && (dist < bestDist || dist === bestDist && order < bestOrder)) {
        best = x;
        bestPriority = priority;
        bestDist = dist;
        bestOrder = order;
      }
    }
    return best;
  };
  runtime.nearbyMeleeThreat = function nearbyMeleeThreat(u, opps) {
    let best = null,
      distance = 85,
      order = Infinity;
    for (const v of runtime.battleCandidates(opps, u.lane, 85)) {
      if (!v.alive || !v.tags.includes('melee')) continue;
      const d = runtime.roadDistance(v, u),
        rank = runtime.battleOrder(v);
      if (d < distance || best && d === distance && rank < order) {
        best = v;
        distance = d;
        order = rank;
      }
    }
    return best;
  };
  runtime.updatePhalanx = function updatePhalanx(alive) {
    const sides = {
      player: [],
      enemy: []
    };
    for (const u of alive) {
      u.phalanx = false;
      if (u.key === 'spearman') sides[u.side].push(u);
    }
    for (const side of ['player', 'enemy']) {
      if (!runtime.hasLeg(runtime.cityForSide(side), 'phalanx')) continue;
      const spears = sides[side].sort((a, b) => a.lane - b.lane),
        n = spears.length;
      const coverage = new Int32Array(n + 1);
      let left = 0,
        right = 0;
      for (let i = 0; i < n; i++) {
        while (left < i && Math.abs(spears[left].lane - spears[i].lane) > 60) left++;
        while (right < n && Math.abs(spears[right].lane - spears[i].lane) <= 60) right++;
        if (right - left >= 3) {
          coverage[left]++;
          coverage[right]--;
        }
      }
      let active = 0;
      for (let i = 0; i < n; i++) {
        active += coverage[i];
        if (active > 0) spears[i].phalanx = true;
      }
    }
  };
  runtime.nearestTowerTargets = function nearestTowerTargets(side, lane, range, count) {
    const out = [];
    for (const u of runtime.state.units) {
      if (!u.alive || u.side === side) continue;
      const d = Math.abs(u.lane - lane);
      if (d > range) continue;
      let i = out.length;
      while (i > 0 && d < Math.abs(out[i - 1].lane - lane)) i--;
      if (i < count) {
        out.splice(i, 0, u);
        if (out.length > count) out.pop();
      }
    }
    return out;
  };
  runtime.priestAction = function priestAction(u, allies) {
    if (!u?.alive || u.key !== 'priest') return false;
    const c = runtime.cityForSide(u.side),
      sacred = runtime.hasLeg(c, 'sacred_vow');
    const range = u.healRange || runtime.PRIEST_HEAL_RANGE;
    const t = runtime.lowestAlly(u, allies, range);
    if (!t) return false;
    let targets = [t];
    if (runtime.hasBranch(c, 'temple', 'high_priests')) {
      targets = runtime.battleCandidates(allies, t.lane, 90).filter(v => v.alive && v.id !== u.id && v.hp < v.maxHp && runtime.roadDistance(v, t) <= 90).sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp || runtime.battleOrder(a) - runtime.battleOrder(b)).slice(0, 4);
    }
    for (const h of targets) {
      runtime.healUnit(h, u.heal);
      if (sacred) runtime.giveTempShield(h, 10, 5);
      if (runtime.hasLeg(c, 'holy_wave')) runtime.giveTempShield(h, h.maxHp * .25, 5);
      if (runtime.hasBranch(c, 'temple', 'war_priests')) {
        h.blessingTime = 5;
        h.cooldownTime = (h.baseCooldownTime || h.cooldownTime) / 1.5;
      }
      runtime.addProjectile(u, h, 'heal');
      runtime.spark(h.lane, '+' + Math.round(u.heal), '#8fdda0');
      runtime.holyRetaliation(c, u, h);
    }
    return true;
  };
  runtime.updateBattle = function updateBattle(dt) {
    runtime.state.combatStep = (runtime.state.combatStep || 0) + 1;
    const alive = runtime.state.units.filter(u => u.alive);
    runtime.updatePhalanx(alive);
    const players = alive.filter(u => u.side === 'player'),
      enemies = alive.filter(u => u.side === 'enemy');
    const previousSearch = runtime.battleSearch;
    runtime.battleSearch = runtime.beginBattleSearch(players, enemies);
    try {
      const blockers = {
        player: players.filter(u => u.phalanx),
        enemy: enemies.filter(u => u.phalanx)
      };
      const structures = {
        player: runtime.targetStructure('player'),
        enemy: runtime.targetStructure('enemy')
      };
      const structureSlots = runtime.structureAttackSlots(alive, structures);
      for (const u of alive) {
        const c = runtime.cityForSide(u.side);
        runtime.updateUnitStatuses(u, dt);
        if (!u.alive) continue;
        if (u.temporary > 0 && (u.temporary -= dt) <= 0) {
          runtime.killUnit(u, false);
          continue;
        }
        if (u.tempShieldTime > 0 && (u.tempShieldTime -= dt) <= 0) u.tempShield = 0;
        if (u.speedBuffTime > 0 && !u.lightningReady) u.speedBuffTime = Math.max(0, u.speedBuffTime - dt);
        if (u.attackSpeedBuffTime > 0) {
          u.attackSpeedBuffTime = Math.max(0, u.attackSpeedBuffTime - dt);
          if (u.attackSpeedBuffTime === 0 && u.blessingTime <= 0) u.cooldownTime = u.baseCooldownTime || u.cooldownTime;
        }
        u.cooldownTime = (u.baseCooldownTime || u.cooldownTime) / Math.max(u.blessingTime > 0 ? 1.5 : 1, u.attackSpeedBuffTime > 0 ? u.attackSpeedMult || 1 : 1) / (u.key === 'orc_berserker' ? 1 + Math.floor((1 - Math.max(0, u.hp) / u.maxHp) * 50 + 1e-8) / 100 : 1);
        u.cooldownTime /= runtime.orcAttackSpeedMult13(u);
        const attackClock = u.slowTime > 0 && u.slowMult <= .5 && !u.lightningReady ? .5 : 1;
        u.cooldown = Math.max(0, u.cooldown - dt * attackClock);
        if (u.key === 'priest') u.healCooldown = Math.max(0, (Number.isFinite(u.healCooldown) ? u.healCooldown : 0) - dt);
        const opps = u.side === 'player' ? enemies : players,
          allies = u.side === 'player' ? players : enemies;
        runtime.checkSpearBrace(u, opps);
        if (u.stunTime > 0) continue;
        runtime.orcBeforeCombat13(u, opps, dt);
        if (u.orcPredatorMoved) continue;
        if (u.key === 'priest' && u.healCooldown <= 0 && runtime.priestAction(u, allies)) {
          u.healCooldown = u.healCooldownTime || runtime.PRIEST_BASE_HEAL_CD;
        }
        if (u.key === 'archer' && runtime.hasLeg(c, 'archer_skirmish')) {
          const threat = runtime.nearbyMeleeThreat(u, opps);
          if (threat && runtime.roadDistance(threat, u) < 85) {
            if (u.stationaryShotStep !== runtime.state.combatStep) runtime.setBattleLane(u, runtime.clamp(u.lane + (u.side === 'player' ? -1 : 1) * runtime.effectiveMoveSpeed(u, c) * dt, 0, runtime.PATH_LENGTH));
            continue;
          }
        }
        const sacred = u.key === 'priest' && runtime.hasLeg(c, 'sacred_vow');
        const s = structures[u.side],
          sd = runtime.roadDistance(s, u);
        if (u.key === 'catapult' && runtime.hasBranch(c, 'siegeworks', 'trebuchet') && sd <= u.range && structureSlots[u.side].has(u.id)) {
          if (u.cooldown <= 0) {
            runtime.attackStructure(u, s);
            u.cooldown = u.cooldownTime;
          }
          continue;
        }
        const target = runtime.preferredTarget(u, opps);
        if (target) {
          if (sacred || u.roadHoldFire) continue;
          if (u.cooldown <= 0) {
            runtime.attackUnit(u, target);
            u.cooldown = u.cooldownTime;
          }
          continue;
        }
        if (sd <= u.range) {
          if (!structureSlots[u.side].has(u.id)) continue;
          if (sacred) continue;
          if (u.cooldown <= 0) {
            runtime.attackStructure(u, s);
            u.cooldown = u.cooldownTime;
          }
          continue;
        }
        if (u.stationaryShotStep === runtime.state.combatStep) continue;
        runtime.roadAdvance(u, opps, dt);
      }
      runtime.state.units = runtime.state.units.filter(u => u.alive);
      runtime.updateTowers(dt);
    } finally {
      runtime.battleSearch = previousSearch;
    }
  };
  runtime.phalanxBetween = function phalanxBetween(u, targetLane) {
    const ph = runtime.state.units.filter(v => v.alive && v.phalanx && v.side !== u.side);
    return ph.some(s => u.side === 'player' ? s.lane > u.lane && s.lane < targetLane : s.lane < u.lane && s.lane > targetLane);
  };
  runtime.onTowerLost = function onTowerLost(c) {
    c.lostTowers = (c.lostTowers || 0) + 1;
    runtime.refreshExistingUnitsForCity(c);
    if (c === runtime.P && runtime.hasLeg(c, 'last_line')) runtime.toast(`Utolsó védvonal: ${c.lostTowers}× toronyvesztés`);
  };
  runtime.fieldUnitCount = function fieldUnitCount(c) {
    const side = runtime.sideForCity(c);
    return runtime.state.units.filter(u => u.alive && u.side === side).length;
  };
  runtime.spawnBattleUnitAt = function spawnBattleUnitAt(c, key, lane, offset = 0) {
    const u = runtime.releaseUnit(c, runtime.makeEntry(c, key));
    if(!u)return null;
    u.lane = lane;
    u.offset = offset;
    u.cooldown = .2;
    return u;
  };
  runtime.killUnit = function killUnit(target, combatDeath = true) {
    if (!target.alive) return;
    target.alive = false;
    if (combatDeath && target.key === 'knight' && runtime.hasLeg(runtime.cityForSide(target.side), 'knight_dismount')) {
      const c = runtime.cityForSide(target.side);
      const s = runtime.spawnBattleUnitAt(c, 'swordsman', target.lane, target.offset);
      if(!s)return;
      s.hp = s.maxHp;
      if (target.tempClone) {
        s.tempClone = true;
        s.cloneAttacksRemaining = target.cloneAttacksRemaining;
        s.temporary = 0;
      }
      runtime.spark(target.lane, '♞→⚔', '#ffe29a');
    }
  };
  runtime.projectileKindFor = function projectileKindFor(key, heal = false) {
    if (heal) return 'heal';
    return key === 'archer' ? 'arrow' : key === 'mage' ? 'fireball' : key === 'catapult' ? 'rock' : key === 'priest' ? 'holy' : null;
  };
  runtime.addProjectile = function addProjectile(u, t, kind) {
    if (!kind) return;
    const s = runtime.pointAt(u.lane, u.offset || 0),
      endLane = t.lane,
      endOffset = t.offset || 0,
      e = runtime.pointAt(endLane, endOffset);
    runtime.projectiles.push({
      kind,
      x0: s.x,
      y0: s.y,
      x1: e.x,
      y1: e.y,
      endLane,
      endOffset,
      life: 0,
      dur: kind === 'rock' ? .5 : kind === 'arrow' ? .22 : .32,
      side: u.side
    });
  };
  runtime.addMeleeFx = function addMeleeFx(u, t, kind = 'slash') {
    runtime.combatFx.push({
      kind,
      lane: t.lane,
      offset: t.offset || 0,
      life: .22,
      side: u.side
    });
  };
  runtime.projectileToStructure = function projectileToStructure(u, s) {
    runtime.addProjectile(u, {
      lane: s.lane,
      offset: s.lateral || 0
    }, runtime.projectileKindFor(u.key));
  };
  runtime.longbowMult = function longbowMult(u, targetLane) {
    if (u.key !== 'archer' || runtime.hasLeg(runtime.cityForSide(u.side), 'archer_close_combat')) return 1;
    return Math.abs(targetLane - u.lane) <= 35 ? .25 : 1;
  };
  runtime.momentumMult = function momentumMult(u) {
    if (u.key !== 'knight' || !runtime.hasLeg(runtime.cityForSide(u.side), 'momentum')) return 1;
    return Math.max(1, runtime.effectiveMoveSpeed(u, runtime.cityForSide(u.side)) / runtime.UNITS.knight.speed);
  };
  runtime.pushUnitChain = function pushUnitChain(target, dir, amount = 72) {
    if (!target.alive || target.phalanx) return;
    const side = target.side,
      same = runtime.state.units.filter(v => v.alive && v.side === side && v.id !== target.id).sort((a, b) => dir > 0 ? a.lane - b.lane : b.lane - a.lane);
    let newLane = runtime.clamp(target.lane + dir * amount, 12, runtime.PATH_LENGTH - 12);
    for (const v of same) {
      const ahead = dir > 0 ? v.lane > target.lane : v.lane < target.lane;
      if (!ahead) continue;
      const gap = Math.abs(v.lane - newLane);
      if (gap < 28) {
        if (v.phalanx) {
          newLane = v.lane - dir * 28;
          break;
        }
        runtime.setBattleLane(v, runtime.clamp(v.lane + dir * (28 - gap), 12, runtime.PATH_LENGTH - 12));
      }
    }
    runtime.setBattleLane(target, newLane);
  };
  runtime.holyRetaliation = function holyRetaliation(c, u, healed) {
    if (!runtime.hasLeg(c, 'holy_retribution')) return;
    for (const e of runtime.state.units.filter(v => v.alive && v.side !== u.side && runtime.roadDistance(v, healed) <= 65)) runtime.damageUnit(e, u.heal, 'magic');
    runtime.addImpactFx(healed.lane, healed.offset, 'holyburst');
  };
  runtime.checkSpearBrace = function checkSpearBrace(u, opps) {
    const c = runtime.cityForSide(u.side);
    if (u.key !== 'spearman' || !runtime.hasLeg(c, 'spear_brace')) return;
    u.braceSeen = u.braceSeen || new Set();
    for (const e of opps) {
      if (!e.alive || runtime.roadDistance(e, u) > u.range || u.braceSeen.has(e.id)) continue;
      u.braceSeen.add(e.id);
      runtime.attackUnit(u, e, {
        mult: 1,
        free: true
      });
    }
  };
  runtime.structureAttackSlots = function structureAttackSlots(alive, structures) {
    const allowed = {
      player: new Set(),
      enemy: new Set()
    };
    for (const side of ['player', 'enemy']) {
      const s = structures[side];
      for (const u of alive) if (u.side === side && runtime.roadDistance(s, u) <= u.range) allowed[side].add(u.id);
    }
    return allowed;
  };
  runtime.effectiveUnitKey = function effectiveUnitKey(c, b) {
    if (b.type === 'barracks' && runtime.hasBranch(c, 'barracks', 'cavalry_barracks') && runtime.adjacentBuildings(c, b).some(x => x.type === 'stable')) return 'knight';
    return runtime.BUILDINGS[b.type].unit;
  };
  runtime.releaseUnit = function releaseUnit(c, entry) {
    const s = runtime.statsFor(c, entry),
      base = runtime.UNITS[entry.key],
      side = runtime.sideForCity(c),
      atkMult = entry.attackSpeedMult || 1,
      u = {
        id: runtime.state.unitSerial++,
        side,
        key: entry.key,
        lane: side === 'player' ? 6 : runtime.PATH_LENGTH - 6,
        offset: runtime.state.unitSerial * (side === 'player' ? 31 : 29) % 45 - 22,
        hp: s.hp,
        maxHp: s.hp,
        shield: s.hp * (entry.shieldPct || 0),
        tempShield: 0,
        tempShieldTime: 0,
        damage: s.dmg,
        buildingDamage: s.buildingDamage,
        baseCooldownTime: s.cooldown,
        cooldownTime: s.cooldown / atkMult,
        cooldown: Math.random() * .2,
        speed: s.speed,
        range: s.range,
        heal: s.heal,
        aoe: s.aoe,
        tags: [...base.tags],
        cat: base.cat,
        damageType: base.damageType,
        firstMult: entry.firstMult || 1,
        firstHitsRemaining: entry.firstHits || 0,
        veteran: entry.veteran,
        permanentTavern: !!entry.permanentTavern,
        temporary: 0,
        tempClone: !!entry.tempClone,
        cloneAttacksRemaining: entry.tempClone ? entry.cloneAttacksRemaining ?? 3 : 0,
        chargeDist: 0,
        attackCount: 0,
        phalanx: false,
        alive: true,
        baseSpeed: s.speed,
        speedMult: entry.speedMult || 1,
        speedBuffTime: (entry.speedMult || 1) > 1 ? 10 : 0,
        attackSpeedMult: atkMult,
        attackSpeedBuffTime: atkMult > 1 ? 10 : 0,
        braceSeen: new Set(),
        spearVolleyReady: entry.key === 'spearman' && runtime.hasBranch(c, 'spearhall', 'spear_rain'),
        chargeReady: entry.key === 'knight' && runtime.hasBranch(c, 'stable', 'charge_cavalry'),
        lightningReady: !!entry.lightningAssault,
        rallySpeedReady: !!entry.rallySpeedUntilAttack,
        slowTime: 0,
        slowMult: 1,
        stunTime: 0,
        freezeImmunity: 0,
        burnTime: 0,
        burnDps: 0,
        blessingTime: 0
      };
    if (u.rallySpeedReady) u.speedBuffTime = 1e9;
    Object.assign(u, runtime.permanentUnitData(entry));
    runtime.state.units.push(u);
    return u;
  };
  runtime.damageUnit = function damageUnit(target, amount, type) {
    if (!target.alive) return 0;
    const before = target.hp,
      c = runtime.cityForSide(target.side);
    if (type === 'physical' && target.key === 'knight' && runtime.hasBranch(c, 'stable', 'armored_knights')) amount *= .5;
    let hit = Math.min(target.tempShield || 0, amount);
    target.tempShield -= hit;
    amount -= hit;
    hit = Math.min(target.shield || 0, amount);
    target.shield -= hit;
    amount -= hit;
    target.hp -= amount;
    if (target.hp <= 0) {
      target.hp = 0;
      runtime.killUnit(target, true);
    }
    return Math.max(0, before - target.hp);
  };
  runtime.effectiveMoveSpeed = function effectiveMoveSpeed(u, c) {
    let s = u.baseSpeed || u.speed;
    if (u.speedBuffTime > 0) s *= u.speedMult || 1;
    if (u.slowTime > 0 && !u.lightningReady) s *= u.slowMult || 1;
    if (u.stunTime > 0) return 0;
    if (runtime.hasLeg(c, 'road_rush') && runtime.isOwnHalf(u)) s *= 1.75;
    return s;
  };
  runtime.permanentUnitData = function permanentUnitData(source) {
    const out = {};
    for (const key of ['originBuildingId', 'veteran', 'permanentTavern', 'permanentTavernMult', 'tavernBaseBonus', 'tavernBuffScale', 'warEliteMult', 'armorShieldPct', 'armorMoveMult', 'thornArmor', 'academyTrained', 'academyHpMult', 'academyDamageMult', 'academyAttackSpeedMult', 'mercenary', 'mercPowerMult', 'rallyCavalryRush', 'hospitalVeteran', 'healReceivedMult', 'hospitalDoomed', 'alchemyEffect', 'alchemySourceId', 'alchemyDamageMult', 'alchemyHpMult', 'alchemyAttackSpeedMult', 'alchemyMoveMult', 'alchemyRegen', 'alchemyEffects', 'alchemySourceIds']) {
      if (source[key] !== undefined) out[key] = Array.isArray(source[key]) ? [...source[key]] : source[key];
    }
    return out;
  };
  runtime.refreshExistingUnitsForCity = function refreshExistingUnitsForCity(c) {
    const side = runtime.sideForCity(c);
    for (const u of runtime.state.units) {
      if (!u.alive || u.side !== side) continue;
      const ratio = u.maxHp ? u.hp / u.maxHp : 1,
        s = runtime.statsFor(c, u);
      u.maxHp = s.hp;
      u.hp = runtime.clamp(ratio * s.hp, 0, s.hp);
      u.damage = s.dmg;
      u.buildingDamage = s.buildingDamage;
      u.baseCooldownTime = s.cooldown;
      u.cooldownTime = s.cooldown / Math.max(u.blessingTime > 0 ? 1.5 : 1, u.attackSpeedBuffTime > 0 ? u.attackSpeedMult || 1 : 1);
      u.range = s.range;
      u.heal = s.heal;
      u.aoe = s.aoe;
      u.baseSpeed = s.speed * (u.armorMoveMult || 1);
      u.speed = runtime.effectiveMoveSpeed(u, c);
      if (u.key === 'priest') {
        u.healCooldownTime = s.healCooldown || 2;
        u.healRange = s.healRange || u.healRange;
        u.healCooldown = Math.min(Number.isFinite(u.healCooldown) ? u.healCooldown : 0, u.healCooldownTime);
      }
    }
  };
  runtime.consumeOpeningAttack = function consumeOpeningAttack(u) {
    let m = 1;
    if ((u.firstHitsRemaining || 0) > 0) {
      u.firstHitsRemaining--;
      m *= u.permanentTavern && u.tavernBaseBonus != null ? (1 + u.tavernBaseBonus + .1 * runtime.countNormal(runtime.cityForSide(u.side), 'tavern_damage')) / runtime.tavernPermanentMult35(runtime.cityForSide(u.side), u) : u.firstMult || 1;
    }
    return m;
  };
  runtime.afterFirstAttack = function afterFirstAttack(u) {
    if (u.rallySpeedReady) {
      u.rallySpeedReady = false;
      u.speedBuffTime = 0;
    }
    if (u.lightningReady) {
      u.lightningReady = false;
      u.attackSpeedMult = 2;
      u.attackSpeedBuffTime = 5;
      u.cooldownTime = (u.baseCooldownTime || u.cooldownTime) / 2;
      runtime.spark(u.lane, '⚡ ROHAM', '#ffe56f');
    }
  };
  runtime.applyBurn = function applyBurn(t, dmg) {
    t.burnDps = Math.max(t.burnDps || 0, dmg / 4);
    t.burnTime = 4;
  };
  runtime.mageHit = function mageHit(u, t, dmg) {
    const c = runtime.cityForSide(u.side);
    runtime.addProjectile(u, t, runtime.hasBranch(c, 'magetower', 'frost_mages') ? 'holy' : 'fireball');
    runtime.damageUnit(t, dmg, u.damageType);
    if (runtime.hasBranch(c, 'magetower', 'fire_mages')) runtime.applyBurn(t, dmg);
    if (runtime.hasBranch(c, 'magetower', 'frost_mages')) runtime.applyFreeze(t);
    for (const v of runtime.state.units) if (v.alive && v.side !== u.side && v.id !== t.id && runtime.roadDistance(v, t) <= u.aoe) {
      runtime.damageUnit(v, dmg * .7, u.damageType);
      if (runtime.hasBranch(c, 'magetower', 'fire_mages')) runtime.applyBurn(v, dmg * .7);
      if (runtime.hasBranch(c, 'magetower', 'frost_mages')) runtime.applyFreeze(v);
    }
  };
  runtime.attackUnit = function attackUnit(u, t, opts = {}) {
    if (!attackSourceCanResolve(runtime,u) || !t?.alive) return;
    const c = runtime.cityForSide(u.side),
      opening = runtime.consumeOpeningAttack(u);
    u.attackCount = (u.attackCount || 0) + 1;
    u.executionPrimaryId = t.id;
    u.executionRolled = false;
    if (u.chargeReady) {
      u.chargeReady = false;
      t.stunTime = Math.max(t.stunTime || 0, 2);
      runtime.applyDirectHit(u, t, runtime.attackBaseDamage(u, t, (opts.mult || 1) * opening * 5));
      runtime.afterFirstAttack(u);
      return;
    }
    if (u.spearVolleyReady) {
      u.spearVolleyReady = false;
      const dir = u.side === 'player' ? 1 : -1,
        targets = runtime.state.units.filter(v => v.alive && v.side !== u.side && (dir > 0 && v.lane >= t.lane || dir < 0 && v.lane <= t.lane) && runtime.roadDistance(v, t) <= 120).sort((a, b) => runtime.roadDistance(a, t) - runtime.roadDistance(b, t)).slice(0, 3),
        dmg = runtime.attackBaseDamage(u, t, (opts.mult || 1) * opening * 3.5);
      for (const v of targets) runtime.applyDirectHit(u, v, dmg, {
        fx: v.id === t.id
      });
      runtime.afterFirstAttack(u);
      return;
    }
    if (u.key === 'mage') {
      const triple = runtime.hasLeg(c, 'mage_triple'),
        dmg = runtime.attackBaseDamage(u, t, (opts.mult || 1) * opening * (triple ? .5 : 1)),
        targets = triple ? runtime.state.units.filter(v => v.alive && v.side !== u.side && runtime.roadDistance(v, u) <= u.range).sort((a, b) => runtime.roadDistance(a, u) - runtime.roadDistance(b, u)).slice(0, 3) : [t];
      for (const v of targets) runtime.mageHit(u, v, dmg);
      if (runtime.hasLeg(c, 'mage_ward')) for (const v of runtime.state.units) if (v.alive && v.side === u.side && runtime.roadDistance(v, u) <= 120) runtime.giveTempShield(v, 15, 5);
      runtime.afterFirstAttack(u);
      return;
    }
    if (u.key === 'catapult') {
      runtime.addProjectile(u, t, 'rock');
      const dmg = runtime.attackBaseDamage(u, t, (opts.mult || 1) * opening);
      if (runtime.hasBranch(c, 'siegeworks', 'shrapnel')) {
        runtime.damageUnit(t, dmg, u.damageType);
        for (const v of runtime.state.units) if (v.alive && v.side !== u.side && v.id !== t.id && runtime.roadDistance(v, t) <= 95) {
          runtime.damageUnit(v, dmg * .75, u.damageType);
          v.slowTime = Math.max(v.slowTime || 0, 2);
          v.slowMult = Math.min(v.slowMult || 1, .6);
        }
      } else if (runtime.hasLeg(c, 'catapult_aoe')) {
        for (const v of runtime.state.units) if (v.alive && v.side !== u.side && runtime.roadDistance(v, t) <= 58) runtime.damageUnit(v, dmg, u.damageType);
      } else {
        runtime.damageUnit(t, dmg, u.damageType);
      }
      if (runtime.hasLeg(c, 'catapult_knockback')) runtime.pushUnitChain(t, u.side === 'player' ? 1 : -1, 72);
      runtime.afterFirstAttack(u);
      return;
    }
    if (u.key === 'archer') {
      let targets = [t],
        factor = 1;
      if (runtime.hasBranch(c, 'archery', 'arrow_rain')) {
        targets = runtime.state.units.filter(v => v.alive && v.side !== u.side && runtime.roadDistance(v, u) <= u.range).sort((a, b) => runtime.roadDistance(a, u) - runtime.roadDistance(b, u)).slice(0, 3);
        factor = .6;
      } else if (runtime.hasLeg(c, 'archer_volley') && u.attackCount % 5 === 0) targets = runtime.state.units.filter(v => v.alive && v.side !== u.side && runtime.roadDistance(v, u) <= u.range).sort((a, b) => runtime.roadDistance(a, u) - runtime.roadDistance(b, u)).slice(0, 5);
      for (const v of targets) {
        runtime.addProjectile(u, v, 'arrow');
        runtime.damageUnit(v, runtime.attackBaseDamage(u, v, (opts.mult || 1) * opening * factor), u.damageType);
      }
      runtime.afterFirstAttack(u);
      return;
    }
    if (u.key === 'priest') {
      runtime.addProjectile(u, t, 'holy');
      runtime.damageUnit(t, runtime.attackBaseDamage(u, t, (opts.mult || 1) * opening), u.damageType);
      runtime.afterFirstAttack(u);
      return;
    }
    const dmg = runtime.attackBaseDamage(u, t, (opts.mult || 1) * opening);
    if (u.key === 'swordsman' && runtime.hasLeg(c, 'sword_whirlwind') && u.attackCount % 3 === 0) {
      for (const v of runtime.state.units.filter(v => v.alive && v.side !== u.side && runtime.roadDistance(v, u) <= u.range + 22)) runtime.applyDirectHit(u, v, dmg, {
        fx: false
      });
      runtime.addMeleeFx(u, t, 'slash');
    } else {
      runtime.applyDirectHit(u, t, dmg);
      if (u.key === 'spearman' && runtime.hasLeg(c, 'spear_pierce')) {
        const dir = u.side === 'player' ? 1 : -1;
        for (const v of runtime.state.units) if (v.alive && v.side !== u.side && v.id !== t.id && (dir > 0 && v.lane > t.lane || dir < 0 && v.lane < t.lane) && runtime.roadDistance(v, t) <= 100 && Math.abs((v.offset || 0) - (t.offset || 0)) <= 28) runtime.applyDirectHit(u, v, dmg, {
          fx: false
        });
      }
    }
    runtime.afterFirstAttack(u);
  };
  runtime.garrisonFire = function garrisonFire(dt) {
    for (const [c, side] of [[runtime.P, 'player'], [runtime.E, 'enemy']]) {
      const enabled = runtime.hasLeg(c, 'loopholes') || runtime.hasBranch(c, 'guardhouse', 'arrow_bastion') && runtime.buildingOf(c, 'guardhouse').some(runtime.touchesWall);
      if (!enabled) continue;
      for (const e of c.garrison) {
        if (!runtime.UNITS[e.key].tags.includes('ranged')) continue;
        e.garrisonCd = Math.max(0, (e.garrisonCd || 0) - dt);
        if (e.garrisonCd > 0) continue;
        const st = runtime.statsFor(c, e),
          targets = runtime.state.units.filter(u => u.alive && u.side !== side && (side === 'player' ? u.lane <= st.range * .5 : u.lane >= runtime.PATH_LENGTH - st.range * .5)).sort((a, b) => side === 'player' ? a.lane - b.lane : b.lane - a.lane);
        if (!targets.length) continue;
        if (e.key === 'priest' && runtime.hasLeg(c, 'sacred_vow')) continue;
        runtime.damageUnit(targets[0], st.dmg * .5, runtime.UNITS[e.key].damageType);
        e.garrisonCd = st.cooldown;
      }
    }
  };
  runtime.collapseSuddenTier = function collapseSuddenTier(tier) {
    for (const t of runtime.towers.filter(x => x.tier === tier && x.alive)) {
      t.hp = 0;
      t.alive = false;
      runtime.onTowerLost(runtime.cityForSide(t.side));
    }
    runtime.message(`HIRTELEN HALÁL · A T${tier} toronypár összeomlott!`, 5);
  };
  runtime.updateSuddenDeath = function updateSuddenDeath(dt) {
    if (runtime.state.time < 1200) return;
    if (!runtime.state.suddenStarted) {
      runtime.state.suddenStarted = true;
      runtime.state.suddenNext = 1230;
      runtime.state.suddenTierIndex = 0;
      runtime.message('HIRTELEN HALÁL · 30 másodperc múlva omlik az első toronypár!', 6);
    }
    const order = [1, 2, 3];
    while (runtime.state.suddenTierIndex < 3 && runtime.state.time >= runtime.state.suddenNext) {
      runtime.collapseSuddenTier(order[runtime.state.suddenTierIndex]);
      runtime.state.suddenTierIndex++;
      runtime.state.suddenNext += 30;
    }
    if (runtime.state.suddenTierIndex >= 3) {
      runtime.state.suddenCapitalTime = (runtime.state.suddenCapitalTime || 0) + dt;
      const dps = 250 * (1 + .35 * Math.floor(runtime.state.suddenCapitalTime / 30));
      runtime.P.hp = Math.max(0, runtime.P.hp - dps * dt);
      runtime.E.hp = Math.max(0, runtime.E.hp - dps * dt);
      if (runtime.P.hp <= 0 || runtime.E.hp <= 0) {
        if (runtime.P.hp === runtime.E.hp) runtime.finish(runtime.P.hp >= runtime.E.hp);else runtime.finish(runtime.E.hp <= 0);
      }
    }
  };
  runtime.unitStatsHTML = function unitStatsHTML(c, key) {
    const base = runtime.UNITS[key],
      s = runtime.statsFor(c, {
        key,
        veteran: false
      }),
      aps = 1 / s.cooldown,
      cats = {
        infantry: 'gyalogság',
        cavalry: 'lovasság',
        magic: 'mágikus',
        siege: 'ostrom'
      },
      types = {
        physical: 'fizikai',
        magic: 'mágikus'
      },
      stats = [['HP', Math.round(s.hp)], ['Sebzés', Number(s.dmg.toFixed(1))], ['Támadás/mp', aps.toFixed(2)], ['Hatótáv', formatMetres(s.range)], ['Mozgás', formatSpeed(s.speed)]];
    if (s.buildingDamage !== s.dmg) stats.push(['Épületsebzés', Number(s.buildingDamage.toFixed(1))]);
    if (key === 'priest') stats.push(['Gyógyítás', Number(s.heal.toFixed(1))]);
    if (s.aoe) stats.push(['Területi sugár', formatMetres(s.aoe)]);
    return `<div class="unitgrid">${stats.map(([label, value]) => `<div class="unitstat"><span>${label}</span><b>${value}</b></div>`).join('')}</div><div class="spawnCosts"><span>Egységköltség</span><b>${runtime.resourceCostHTML(runtime.unitCost(c, key), true)}</b></div><div class="unitcostrow"><span>Típus</span><b>${cats[base.cat] || base.cat} · ${types[base.damageType] || base.damageType}</b></div>`;
  };
  runtime.unitMixCounts = function unitMixCounts(entries) {
    const counts = {};
    for (const e of entries || []) {
      const key = typeof e === 'string' ? e : e?.key;
      if (key && runtime.UNITS[key]) counts[key] = (counts[key] || 0) + 1;
    }
    return counts;
  };
  runtime.updateUnitMix = function updateUnitMix(id, entries) {
    const el = runtime.$(`#${id}`);
    if (!el) return;
    const counts = runtime.unitMixCounts(entries),
      sig = runtime.UNIT_ORDER.map(k => counts[k] || 0).join(',');
    if (el.dataset.signature === sig) return;
    el.dataset.signature = sig;
    el.innerHTML = runtime.UNIT_ORDER.filter(k => counts[k]).map(k => `<span class="unitchip" title="${runtime.UNITS[k].name}: ${counts[k]}">${runtime.unitImageTag(k, 'mixPortrait')}<b>${counts[k]}</b></span>`).join('');
  };
  runtime.rewardTowerKill = function rewardTowerKill(attackerSide, tier) {
    const c = runtime.cityForSide(attackerSide);
    if (c.towerReward.has(tier)) return;
    c.towerReward.add(tier);
    if (attackerSide === 'player') {
      runtime.queueChoice('tower');
      runtime.toast(`A T${tier} torony ledőlt → extra választás`);
    } else {
      runtime.grantEnemyPick('tower');
      runtime.message(`Az ellenfél ledöntötte a T${tier} tornyot, ezért extra választást kapott.`, 3);
    }
  };
  runtime.unitCost = function unitCost(c, key) {
    const out = {
        ...runtime.UNITS[key].cost
      },
      discountMult = Math.pow(.95, runtime.countNormal(c, 'frugal_training'));
    for (const r of runtime.RES) out[r] = Math.round((out[r] || 0) * discountMult * 10) / 10;
    if (runtime.hasLeg(c, 'no_food')) out.food = 0;
    return out;
  };
  runtime.statsFor = function statsFor(c, entry) {
    const base = runtime.UNITS[entry.key],
      key = entry.key,
      cat = base.cat;
    const infTraining = runtime.countNormal(c, 'inf_training'),
      magTraining = runtime.countNormal(c, 'mag_training');
    const categoryTraining = cat === 'infantry' ? infTraining : cat === 'magic' ? magTraining : 0;
    const dmgId = {
      swordsman: 'swordsman_dmg',
      spearman: 'spear_dmg',
      archer: 'archer_dmg',
      knight: 'knight_dmg',
      priest: 'priest_dmg',
      catapult: 'catapult_dmg',
      mage: 'mage_dmg'
    }[key];
    const hpId = {
      swordsman: 'swordsman_hp',
      spearman: 'spear_hp',
      archer: 'archer_hp',
      knight: 'knight_hp',
      priest: 'priest_hp',
      catapult: 'catapult_hp',
      mage: 'mage_hp'
    }[key];
    const damageMult = 1 + .10 * runtime.countNormal(c, 'all_damage') + .08 * categoryTraining + .10 * runtime.countNormal(c, dmgId);
    const hpMult = 1 + .10 * runtime.countNormal(c, 'all_hp') + .08 * categoryTraining + .10 * runtime.countNormal(c, hpId);
    let hp = base.hp * hpMult,
      dmg = base.damage * damageMult,
      as = 1,
      speed = base.speed,
      range = base.range;
    let heal = (base.heal || 0) * (1 + .08 * magTraining + (key === 'priest' ? .15 * runtime.countNormal(c, 'priest_heal') : 0)) * (runtime.hasLeg(c, 'sacred_vow') ? 1.5 : 1);
    let buildingDamage = (base.buildingDamage || base.damage) * damageMult,
      aoe = base.aoe || 0;
    if (key === 'swordsman') as += .15 * runtime.countNormal(c, 'sword_as');
    if (key === 'spearman') range *= 1 + .10 * runtime.countNormal(c, 'spear_range');
    if (key === 'knight') speed *= 1 + .15 * runtime.countNormal(c, 'knight_move');
    if (key === 'archer') {
      range *= 1 + .10 * runtime.countNormal(c, 'archer_range');
      if (runtime.hasLeg(c, 'archer_skirmish')) speed *= 1.5;
      if (runtime.hasBranch(c, 'archery', 'longbowmen')) {
        range += rangedRange(75);
        dmg *= 2;
        buildingDamage *= 2;
        as *= .6;
      }
    }
    if (key === 'spearman' && runtime.hasBranch(c, 'spearhall', 'pike_wall')) {
      hp *= 1.75;
      range *= 1.5;
      speed *= .75;
    }
    if (key === 'knight') {
      if (runtime.hasBranch(c, 'stable', 'charge_cavalry')) speed *= 1.5;
      if (runtime.hasBranch(c, 'stable', 'armored_knights')) {
        hp *= 2;
        speed *= .75;
      }
    }
    if (key === 'catapult') {
      buildingDamage *= 1 + .25 * runtime.countNormal(c, 'cat_build');
      if (runtime.hasLeg(c, 'catapult_range_as')) {
        range *= 1.5;
        as *= 1.5;
      }
      if (runtime.hasBranch(c, 'siegeworks', 'trebuchet')) {
        range *= 2;
        buildingDamage *= 4;
        as *= .6;
        speed *= .75;
      }
    }
    if (key === 'mage') {
      aoe *= 1 + .15 * runtime.countNormal(c, 'mage_aoe');
      if (runtime.hasBranch(c, 'magetower', 'fire_mages')) aoe *= 2;
    }
    if (entry.veteran) {
      hp *= 1.5;
      dmg *= 1.5;
      buildingDamage *= 1.5;
    }
    if (entry.permanentTavern) {
      dmg *= 2.5;
      buildingDamage *= 2.5;
    }
    if (runtime.hasBranch(c, 'keep', 'warcapital')) {
      hp *= 1.5;
      dmg *= 1.5;
      buildingDamage *= 1.5;
    }
    if (runtime.hasLeg(c, 'glass_cannon')) {
      hp *= .5;
      dmg *= 2;
      buildingDamage *= 2;
    }
    const last = 1 + (runtime.hasLeg(c, 'last_line') ? .25 * (c.lostTowers || 0) : 0),
      over = 1 + .01 * (c.overflowStacks || 0);
    hp *= last;
    dmg *= last * over;
    buildingDamage *= last * over;
    return {
      hp,
      dmg,
      cooldown: base.cooldown / as,
      speed,
      range,
      heal,
      buildingDamage,
      aoe
    };
  };
  runtime.attackBaseDamage = function attackBaseDamage(u, t, mult = 1) {
    const c = runtime.cityForSide(u.side);
    let dmg = u.damage * mult * (u.blessingTime > 0 ? 2 : 1);
    if (runtime.hasLeg(c, 'melee_doctrine')) dmg *= u.tags.includes('melee') ? 2 : 0;
    if (u.key === 'spearman' && (t.cat === 'cavalry' || t.tags.includes('heavy'))) {
      let counter = runtime.hasBranch(c, 'spearhall', 'pike_wall') ? 4 : 2.5;
      if (u.phalanx && runtime.hasLeg(c, 'phalanx')) counter *= 2;
      dmg *= counter;
    }
    if (t.rangedMarkTime > 0 && u.tags.includes('ranged')) dmg *= 1.5;
    if (u.key === 'archer' && runtime.hasLeg(c, 'marking_arrow')) t.rangedMarkTime = 4;
    if (u.key === 'knight' && runtime.hasLeg(c, 'cavalry_charge')) {
      dmg *= 1 + Math.min(2, .25 * Math.floor(u.chargeDist / 50));
      u.chargeDist = 0;
    }
    dmg *= runtime.momentumMult(u);
    dmg *= runtime.longbowMult(u, t.lane);
    return dmg;
  };
  runtime.applyDirectHit = function applyDirectHit(u, t, dmg, opts = {}) {
    const c = runtime.cityForSide(u.side),
      wasAlive = t.alive;
    if (runtime.rollExecution35(c, u, t)) {
      runtime.killUnit(t, true);
      runtime.spark(t.lane, 'KIVÉGZÉS', '#ffd166');
    } else {
      runtime.damageUnit(t, dmg, u.damageType);
      if (opts.fx !== false) runtime.addMeleeFx(u, t, u.key === 'spearman' ? 'stab' : 'slash');
    }
    if (wasAlive && !t.alive && u.key === 'swordsman' && runtime.hasLeg(c, 'bloodlust')) {
      u.bloodlustReady = true;
      u.hp = Math.min(u.maxHp, u.hp + u.maxHp * .15);
      runtime.spark(u.lane, 'VÉRSZOMJ', '#ff876f');
    }
  };
  runtime.attackStructure = function attackStructure(u, s) {
    const c = runtime.cityForSide(u.side);
    if (u.key === 'priest' && runtime.hasLeg(c, 'sacred_vow')) return;
    const opening = runtime.consumeOpeningAttack(u);
    let dmg = u.cat === 'siege' ? (u.buildingDamage ?? u.damage) : u.damage * (s.capital ? 1 / 3 : .25);
    if (runtime.hasLeg(c, 'siege_doctrine') && u.cat !== 'siege') dmg *= 2;
    if (runtime.hasLeg(c, 'melee_doctrine')) dmg *= u.tags.includes('melee') ? 2 : 0;
    if (u.key === 'mage' && runtime.hasLeg(c, 'mage_triple')) dmg *= .5;
    if (u.chargeReady) {
      dmg *= 5;
      u.chargeReady = false;
    }
    if (u.key === 'knight' && runtime.hasLeg(c, 'cavalry_charge')) {
      dmg *= 1 + Math.min(2, .25 * Math.floor(u.chargeDist / 50));
      u.chargeDist = 0;
    }
    if (u.key === 'catapult' && runtime.hasLeg(c, 'artillery_sighting')) {
      const id = s.capital ? `capital:${s.side}` : `tower:${s.side}:${s.tier}`;
      if (u.lastStructureTarget === id) u.structureSight = Math.min(4, (u.structureSight || 0) + 1);else {
        u.lastStructureTarget = id;
        u.structureSight = 0;
      }
      dmg *= 1 + .5 * u.structureSight;
    }
    dmg *= u.blessingTime > 0 ? 2 : 1;
    dmg *= runtime.momentumMult(u) * runtime.longbowMult(u, s.lane) * opening;
    if (['archer', 'mage', 'catapult', 'priest'].includes(u.key)) runtime.projectileToStructure(u, s);else runtime.addMeleeFx(u, {
      lane: s.lane,
      offset: 0
    }, u.key === 'spearman' ? 'stab' : 'slash');
    if (s.capital) {
      const city = s.side === 'enemy' ? runtime.E : runtime.P;
      city.hp -= dmg;
      runtime.spark(s.lane, '-' + Math.round(dmg) + ' 🏰', u.side === 'player' ? '#ffd166' : '#ff9b92');
      if (city.hp <= 0) {
        city.hp = 0;
        runtime.finish(u.side === 'player');
      }
    } else {
      s.hp -= dmg;
      runtime.spark(s.lane, '-' + Math.round(dmg), u.side === 'player' ? '#ffd166' : '#ff9b92');
      if (s.hp <= 0) {
        s.hp = 0;
        s.alive = false;
        if (!s.gateTower) {
          runtime.onTowerLost(runtime.cityForSide(s.side));
          runtime.rewardTowerKill(u.side, s.tier);
        }
      }
    }
    runtime.afterFirstAttack(u);
  };
  runtime.updateUnitStatuses = function updateUnitStatuses(u, dt) {
    if (u.bloodlustReady) {
      u.cooldown = 0;
      u.bloodlustReady = false;
    }
    if (u.rangedMarkTime > 0) u.rangedMarkTime = Math.max(0, u.rangedMarkTime - dt);
    if (u.burnTime > 0) {
      const d = Math.min(dt, u.burnTime);
      u.burnTime -= d;
      runtime.damageUnit(u, (u.burnDps || 0) * d, 'magic');
      if (u.burnTime <= 0) u.burnDps = 0;
    }
    if (u.freezeImmunity > 0) u.freezeImmunity = Math.max(0, u.freezeImmunity - dt);
    if (u.stunTime > 0) {
      u.stunTime = Math.max(0, u.stunTime - dt);
      if (u.stunTime === 0 && u.freezeFollow) {
        u.slowTime = Math.max(u.slowTime || 0, u.freezeFollow);
        u.slowMult = .5;
        u.freezeFollow = 0;
      }
    }
    if (u.slowTime > 0) u.slowTime = Math.max(0, u.slowTime - dt);
    if (u.blessingTime > 0) {
      u.blessingTime = Math.max(0, u.blessingTime - dt);
      if (u.blessingTime === 0) u.cooldownTime = u.baseCooldownTime || u.cooldownTime;
    }
  };
  runtime.suddenGroupsV495 = function suddenGroupsV495() {
    return [{
      key: 't3',
      label: 'A legkülső tornyok olvadnak.',
      targets: runtime.towers.filter(t => t.alive && !t.gateTower && t.tier === 3)
    }, {
      key: 't2',
      label: 'A középső tornyok olvadnak.',
      targets: runtime.towers.filter(t => t.alive && !t.gateTower && t.tier === 2)
    }, {
      key: 't1',
      label: 'A belső tornyok olvadnak.',
      targets: runtime.towers.filter(t => t.alive && !t.gateTower && t.tier === 1)
    }, {
      key: 'gate',
      label: 'A kaputornyok olvadnak.',
      targets: runtime.towers.filter(t => t.alive && t.gateTower)
    }, {
      key: 'capital',
      label: 'A bázisok olvadnak.',
      capital: true
    }];
  };
  runtime.setSuddenVisualTargetsV495 = function setSuddenVisualTargetsV495(group) {
    for (const t of runtime.towers) t.sdActive = false;
    runtime.P.sdActive = false;
    runtime.E.sdActive = false;
    if (!group) return;
    if (group.capital) {
      runtime.P.sdActive = true;
      runtime.E.sdActive = true;
      return;
    }
    for (const t of group.targets) t.sdActive = true;
  };
  runtime.activateSuddenStageV495 = function activateSuddenStageV495(index, announce = true) {
    const groups = runtime.suddenGroupsV495();
    while (index < groups.length) {
      const g = groups[index];
      const aliveCount = g.capital ? (runtime.P.hp > 0 ? 1 : 0) + (runtime.E.hp > 0 ? 1 : 0) : g.targets.filter(t => t.alive).length;
      if (aliveCount > 0) {
        runtime.state.suddenStageIndex = index;
        runtime.state.suddenStageTime = 0;
        runtime.state.suddenStageKey = g.key;
        runtime.setSuddenVisualTargetsV495(g);
        if (announce) {
          runtime.showSuddenOverlay(g.label, index === 0 ? 2600 : 1800);
          runtime.message('HIRTELEN HALÁL · ' + g.label, 4);
        }
        return g;
      }
      index++;
    }
    runtime.state.suddenStageIndex = groups.length;
    runtime.setSuddenVisualTargetsV495(null);
    return null;
  };
  runtime.selectedTowerV496 = function selectedTowerV496() {
    return runtime.towers.find(t => t.id === runtime.state.selectedTowerId) || null;
  };
  runtime.suddenGroupsV496 = function suddenGroupsV496() {
    return [{
      key: 't1',
      targets: runtime.towers.filter(t => t.alive && !t.gateTower && t.tier === 1)
    }, {
      key: 't2',
      targets: runtime.towers.filter(t => t.alive && !t.gateTower && t.tier === 2)
    }, {
      key: 't3',
      targets: runtime.towers.filter(t => t.alive && !t.gateTower && t.tier === 3)
    }, {
      key: 'gate',
      targets: runtime.towers.filter(t => t.alive && t.gateTower)
    }, {
      key: 'capital',
      capital: true
    }];
  };
  runtime.activateSuddenStageV496 = function activateSuddenStageV496(index) {
    const groups = runtime.suddenGroupsV496();
    while (index < groups.length) {
      const g = groups[index],
        aliveCount = g.capital ? (runtime.P.hp > 0 ? 1 : 0) + (runtime.E.hp > 0 ? 1 : 0) : g.targets.filter(t => t.alive).length;
      if (aliveCount > 0) {
        runtime.state.suddenStageIndex = index;
        runtime.state.suddenStageTime = 0;
        runtime.state.suddenStageKey = g.key;
        runtime.setSuddenVisualTargetsV495(g);
        return g;
      }
      index++;
    }
    runtime.setSuddenVisualTargetsV495(null);
    return null;
  };
  runtime.suddenSideGroup = function suddenSideGroup(side, index) {
    if (index >= 4) return {
      capital: true,
      targets: []
    };
    return {
      capital: false,
      targets: runtime.towers.filter(t => t.side === side && t.alive && t.hp > 0 && (index === 3 ? t.gateTower : !t.gateTower && t.tier === index + 1))
    };
  };
  runtime.advanceSuddenSide = function advanceSuddenSide(side, phase) {
    while (phase.index < 4 && !runtime.suddenSideGroup(side, phase.index).targets.length) {
      phase.index++;
      phase.elapsed = 0;
    }
    return runtime.suddenSideGroup(side, phase.index);
  };
  runtime.drainSuddenSide = function drainSuddenSide(side, dt) {
    const c = runtime.cityForSide(side),
      phase = runtime.state.suddenSides[side];
    let left = dt;
    while (left > 1e-9) {
      const group = runtime.advanceSuddenSide(side, phase),
        base = group.capital ? Math.max(180, c.maxHp * .02) : [210, 235, 260, 300][phase.index];
      const ramp = group.capital ? 95 : phase.index === 3 ? 70 : 55;
      const targets = group.capital ? [c] : group.targets;
      const hp = Math.min(...targets.map(t => Math.max(0, t.hp)));
      const rate = base + ramp * phase.elapsed;
      const deathTime = hp > 0 ? 2 * hp / (Math.sqrt(rate * rate + 2 * ramp * hp) + rate) : 0;
      const step = Math.min(left, deathTime),
        damage = rate * step + .5 * ramp * step * step;
      for (const t of targets) {
        t.hp = Math.max(0, t.hp - damage);
        if (!group.capital && t.hp < 1e-7) {
          t.hp = 0;
          t.alive = false;
          t.sdActive = false;
          if (!t.gateTower) runtime.onTowerLost(c);
          if (runtime.state.selectedTowerId === t.id) {
            runtime.state.selectedTowerId = null;
            runtime.$('#inspector')?.classList.remove('show');
          }
        }
      }
      phase.elapsed += step;
      left -= step;
      if (group.capital) {
        if (c.hp < 1e-7) c.hp = 0;
        break;
      }
      runtime.advanceSuddenSide(side, phase);
    }
  };
  runtime.buildCardUnitCostV41004 = function buildCardUnitCostV41004(c, type) {
    const d = runtime.BUILDINGS[type];
    if (!d?.unit) return '';
    const co = runtime.unitCost(c, d.unit),
      parts = runtime.RES.filter(r => (co[r] || 0) > 0).map(r => `<span>${runtime.resourceIconTag(r, true)}<b>${Math.round(co[r])}</b></span>`);
    return parts.length ? `<span class="pickUnitCost" aria-label="Egységköltség">${parts.join('')}</span>` : '';
  };
  runtime.orcCursePower = function orcCursePower(u, key) {
    return (u.orcCurses?.[key] || 0) > 0 ? u.orcCursePower?.[key] || 1 : 0;
  };
  runtime.orcAttackSpeedMult13 = function orcAttackSpeedMult13(u) {
    return 1 - .25 * runtime.orcCursePower(u, 'exhaustion');
  };
  runtime.unitStatusBadges = function unitStatusBadges(u) {
    if (!u) return [];
    const out = [],
      add = (k, n = 0) => {
        if (!out.some(x => x[0] === k)) out.push([k, Math.ceil(n)]);
      };
    for (const k of Object.keys(u.orcCurses || {})) if (u.orcCurses[k] > 0) add(k);
    for (const k of Object.keys(u.orcPositive || {})) if (u.orcPositive[k] > 0 && k !== 'regen') add(k);
    const potions = {
      damage: 'power',
      hp: 'vitality',
      attack_speed: 'haste',
      movement: 'stride'
    };
    for (const k of u.alchemyEffects || []) if (potions[k]) add(potions[k]);
    if (u.orcBleed > 0) add('bleed', u.orcBleed);
    if (u.orcPoison > 0) add('poison', u.orcPoison);
    if (u.burnTime > 0) add('burn');
    if (u.stunTime > 0) add(u.freezeFollow > 0 ? 'freeze' : 'stun');
    if (u.slowTime > 0) add('slow');
    const regen = (u.orcPositive?.regen || 0) + (u.alchemyRegen || 0) + (u.orcRegenBlessingTime > 0 ? 1 : 0);
    if (regen > 0) add('regen', regen);
    if (u.blessingTime > 0) add('blessing');
    if (u.attackSpeedBuffTime > 0) add('haste');
    if (u.speedBuffTime > 0 || u.rallySpeedReady) add('stride');
    if (u.firstHitsRemaining > 0 || u.permanentTavern) add('power');
    if (u.shield + u.tempShield > 0) add('shield');
    return out;
  };
  runtime.auditCurseCopy = function auditCurseCopy(u) {
    const copy = {};
    for (const [k, t] of Object.entries(u.orcCurses || {})) {
      if (t <= 0) continue;
      copy[k] = u.orcCurseSources?.[k] ? {
        ...u.orcCurseSources[k]
      } : {
        [u.orcCursePower?.[k] || 1]: t
      };
    }
    return copy;
  };
  runtime.auditSetCurseSummary = function auditSetCurseSummary(u, key) {
    const sources = u.orcCurseSources?.[key] || {},
      old = runtime.orcCursePower(u, key),
      time = Math.max(0, ...Object.values(sources)),
      power = sources[2] > 0 ? 2 : sources[1] > 0 ? 1 : 0;
    u.orcCurses ||= {};
    u.orcCursePower ||= {};
    if (time > 0) {
      u.orcCurses[key] = time;
      u.orcCursePower[key] = power;
    } else {
      delete u.orcCurses[key];
      delete u.orcCursePower[key];
      delete u.orcCurseSources[key];
    }
    if (key === 'atrophy' && power !== old) {
      u.maxHp = u.maxHp / (1 - .2 * old) * (1 - .2 * power);
      u.hp = Math.min(u.hp, u.maxHp);
    }
  };
  runtime.auditApplyCurse = function auditApplyCurse(u, key, duration, power = 1) {
    if (duration <= 0) return;
    power = power >= 2 ? 2 : 1;
    u.orcCurseSources ||= {};
    if (!u.orcCurseSources[key]) u.orcCurseSources[key] = runtime.auditCurseCopy(u)[key] || {};
    const sources = u.orcCurseSources[key];
    sources[power] = Math.max(sources[power] || 0, duration);
    runtime.auditSetCurseSummary(u, key);
  };
  runtime.auditTickCurses = function auditTickCurses(u, dt) {
    const sources = runtime.auditCurseCopy(u);
    u.orcCurseSources = sources;
    for (const [k, times] of Object.entries(sources)) {
      for (const power of Object.keys(times)) times[power] = Math.max(0, times[power] - dt);
      runtime.auditSetCurseSummary(u, k);
    }
  };
  runtime.auditBurnCopy = function auditBurnCopy(u) {
    return Array.isArray(u.burnParts) ? u.burnParts.filter(x => x.time > 0).map(x => ({
      ...x
    })) : u.burnTime > 0 ? [{
      time: u.burnTime,
      dps: u.burnDps || 0
    }] : [];
  };
  runtime.auditBurnSummary = function auditBurnSummary(u) {
    u.burnParts = (u.burnParts || []).filter(x => x.time > 1e-9 && x.dps > 0);
    u.burnTime = Math.max(0, ...u.burnParts.map(x => x.time));
    u.burnDps = u.burnParts.reduce((n, x) => n + x.dps, 0);
  };
  runtime.auditTransferBurn = function auditTransferBurn(u, parts) {
    u.burnParts = [...runtime.auditBurnCopy(u), ...parts.map(x => ({
      ...x
    }))];
    runtime.auditBurnSummary(u);
  };
}
