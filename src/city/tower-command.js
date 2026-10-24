import { formatMetres } from '../world/measurements.js';
import { assetUrl } from '../assets/urls.js';
export function initializeCityTowerCommand(runtime) {
  const TOWER_COMMAND_ID = 'towercommand';
  const TOWER_SALVO_ID = 'tower_salvo';
  const TOWER_REBUILD_ID = 'tower_rebuild';
  const TOWER_GUARD_ID = 'tower_guard';
  const TOWER_REGEN_ID = 'tower_regen';
  const TOWER_REGEN_PER_STACK = 5;
  const sideOf = c => runtime.sideForCity(c);
  const hasTowerTech = c => (runtime.countNormal(c, 'tower_crews') || 0) > 0;
  const towerCommandCount = c => Math.min(1, runtime.buildingOf(c, TOWER_COMMAND_ID).length);
  const towerCommandMult = c => 1 + .20 * towerCommandCount(c);
  const towerBaseStatMult = c => (1 + .08 * runtime.countNormal(c, 'tower_crews')) * towerCommandMult(c);
  const towerGuardStacks = c => runtime.unitAvailable(c, 'archer') ? Math.min(3, runtime.countNormal(c, TOWER_GUARD_ID) || 0) : 0;
  const aliveOwnTowers = c => runtime.towers.filter(t => t.side === sideOf(c) && t.alive);
  const deadOwnTowers = c => runtime.towers.filter(t => t.side === sideOf(c) && !t.alive);
  const towerGuardSlots = c => aliveOwnTowers(c).length * towerGuardStacks(c);
  const missingTowerCount = c => deadOwnTowers(c).length;
  function ensureNormal(def) {
    if (!runtime.NORMAL.some(x => x.id === def.id)) runtime.NORMAL.push(def);
  }
  function ensureLegend(def) {
    if (!runtime.LEGENDARY.some(x => x.id === def.id)) runtime.LEGENDARY.push(def);
  }
  ensureNormal({
    id: TOWER_REGEN_ID,
    icon: '🛠️',
    name: 'Karbantartók',
    description: `Minden torony +${TOWER_REGEN_PER_STACK} HP/mp regenerációt kap. Halmozható.`,
    eligible: s => hasTowerTech(s)
  });
  ensureNormal({
    id: TOWER_GUARD_ID,
    icon: '🏹',
    name: 'Toronyőrség',
    description: 'Minden toronyba +1 automatikus íjász kerül, legfeljebb 3-ig. Ezek az íjászok a saját íjász statjaiddal lőnek, és beleszámítanak a sereglimitbe.',
    eligible: s => hasTowerTech(s) && runtime.unitAvailable(s, 'archer')
  });
  ensureLegend({
    id: TOWER_SALVO_ID,
    icon: '🏹',
    name: 'Sortűz',
    description: 'Minden torony minden támadásnál +1 extra lövedéket lő ki. A plusz lövedék teljes sebzést okoz.',
    eligible: s => hasTowerTech(s)
  });
  ensureLegend({
    id: TOWER_REBUILD_ID,
    icon: '🏗️',
    name: 'Újjáépítés',
    description: 'Azonnal újjáépít 2 ledőlt saját tornyot teljes HP-n.',
    eligible: s => hasTowerTech(s) && missingTowerCount(s) >= 2
  });
  Object.assign(runtime.PICK_IMAGES, {
    [TOWER_REGEN_ID]: runtime.PICK_IMAGES.building_hp || runtime.PICK_IMAGES.production,
    [TOWER_GUARD_ID]: runtime.PICK_IMAGES.archer_range || runtime.PICK_IMAGES.all_damage,
    [TOWER_SALVO_ID]: runtime.PICK_IMAGES.all_damage || runtime.PICK_IMAGES.production,
    [TOWER_REBUILD_ID]: runtime.PICK_IMAGES.building_hp || runtime.PICK_IMAGES.production
  });
  Object.assign(runtime.PICK_UNIT_IMAGES, {
    [TOWER_GUARD_ID]: 'archer'
  });
  if (!runtime.BUILDINGS[TOWER_COMMAND_ID]) {
    const base = JSON.parse(JSON.stringify(runtime.BUILDINGS.guildhouse || runtime.BUILDINGS.townhall || runtime.BUILDINGS.warehouse));
    runtime.BUILDINGS[TOWER_COMMAND_ID] = Object.assign(base || {}, {
      name: 'Őrségparancsnokság',
      icon: '🏰',
      unique: true,
      category: 'support',
      description: 'Egyedi épület: városonként legfeljebb 1. +20% toronysebzést, HP-t, hatótávot és támadási sebességet ad. A lövedékszámot nem növeli.'
    });
  }
  if (!runtime.UNLOCKABLE.includes(TOWER_COMMAND_ID)) runtime.UNLOCKABLE.push(TOWER_COMMAND_ID);
  runtime.BUILDING_IMAGES[TOWER_COMMAND_ID] = runtime.BUILDING_IMAGES.guildhouse || runtime.BUILDING_IMAGES.townhall || runtime.BUILDING_IMAGES.warehouse;
  runtime.CARD_IMAGES[TOWER_COMMAND_ID] = runtime.CARD_IMAGES.guildhouse || runtime.CARD_IMAGES.townhall || runtime.CARD_IMAGES.warehouse || runtime.BUILDING_IMAGES[TOWER_COMMAND_ID];
  if (typeof runtime.BUILDING_IMAGE_META === 'object' && runtime.BUILDING_IMAGE_META) {
    runtime.BUILDING_IMAGE_META[TOWER_COMMAND_ID] = runtime.BUILDING_IMAGE_META.guildhouse || runtime.BUILDING_IMAGE_META.townhall || runtime.BUILDING_IMAGE_META.warehouse || null;
  }
  if (typeof runtime.V4_BRANCHES === 'object' && runtime.V4_BRANCHES) runtime.V4_BRANCHES[TOWER_COMMAND_ID] = [];
  const canOfferTowerCommand = c => hasTowerTech(c);
  const oldBuildingUnlockPool = runtime.buildingUnlockPool;
  runtime.buildingUnlockPool = function (c) {
    return oldBuildingUnlockPool(c).filter(o => o.id !== TOWER_COMMAND_ID || canOfferTowerCommand(c));
  };
  const oldStartBuildingPool = runtime.startBuildingPool;
  runtime.startBuildingPool = function (c) {
    return oldStartBuildingPool(c).filter(o => o.id !== TOWER_COMMAND_ID || canOfferTowerCommand(c));
  };
  const oldBuildingUpgradePool = runtime.buildingUpgradePool;
  runtime.buildingUpgradePool = function (c) {
    return oldBuildingUpgradePool(c).filter(o => o.id !== TOWER_COMMAND_ID);
  };
  const oldRecomputeCityTower = runtime.recomputeCity;
  runtime.recomputeCity = function (c, preserve = true) {
    const out = oldRecomputeCityTower(c, preserve);
    c.armyCapBase = c.armyCap;
    c.towerGuardSlots = towerGuardSlots(c);
    c.armyCap = Math.max(0, Math.round(c.armyCap - c.towerGuardSlots));
    return out;
  };
  runtime.refreshTowerHpFor = function (c, side, preserve = true) {
    const mult = towerBaseStatMult(c);
    for (const t of runtime.towers.filter(t => t.side === side)) {
      const ratio = t.maxHp ? t.hp / t.maxHp : 1;
      t.maxHp = t.baseHp * mult;
      t.hp = t.alive ? preserve ? t.maxHp * ratio : t.maxHp : 0;
    }
  };
  function towerComputedStats(t) {
    const c = runtime.cityForSide(t.side),
      statMult = towerBaseStatMult(c),
      guardCount = towerGuardStacks(c),
      guardEntry = {
        key: 'archer'
      },
      guardStats = guardCount ? runtime.statsFor(c, guardEntry) : null;
    return {
      crewStacks: runtime.countNormal(c, 'tower_crews') || 0,
      commandCount: towerCommandCount(c),
      damage: (t.baseDamage || 96) * statMult,
      range: (t.baseRange || 165) * statMult,
      cooldown: (t.baseCooldown || 1) / statMult,
      attacksPerSecond: statMult / (t.baseCooldown || 1),
      regen: (runtime.countNormal(c, TOWER_REGEN_ID) || 0) * TOWER_REGEN_PER_STACK,
      extraProjectiles: runtime.hasLeg(c, TOWER_SALVO_ID) ? 1 : 0,
      guardCount,
      guardDamage: guardStats ? guardStats.dmg : 0,
      guardRange: guardStats ? guardStats.range : 0,
      guardCooldown: guardStats ? guardStats.cooldown : 1,
      guardArcherStats: guardStats,
      statMult
    };
  }
  runtime.towerStatsV496 = function (t) {
    return towerComputedStats(t);
  };
  runtime.updateTowers = function (dt) {
    for (const t of runtime.towers) {
      if (!t.alive) continue;
      const c = runtime.cityForSide(t.side),
        st = towerComputedStats(t);
      if (st.regen) t.hp = Math.min(t.maxHp, t.hp + st.regen * dt);
      t.cooldown = (t.cooldown || 0) - dt;
      const mainTargets = t.cooldown <= 0 ? runtime.nearestTowerTargets(t.side, t.lane, st.range, 1 + st.extraProjectiles) : [];
      if (t.cooldown <= 0 && mainTargets.length) {
        const shots = 1 + st.extraProjectiles;
        for (let i = 0; i < shots; i++) {
          const target = mainTargets[Math.min(i, mainTargets.length - 1)];
          const pseudo = {
            lane: t.lane,
            offset: t.lateral || 0,
            side: t.side,
            key: 'archer'
          };
          runtime.addProjectile(pseudo, target, 'arrow');
          runtime.damageUnit(target, st.damage, 'physical');
        }
        t.cooldown = st.cooldown;
      }
      const guardCount = st.guardCount;
      if (!Array.isArray(t.guardCooldowns)) t.guardCooldowns = [0, 0, 0];
      for (let i = 0; i < t.guardCooldowns.length; i++) t.guardCooldowns[i] = Math.max(0, (t.guardCooldowns[i] || 0) - dt);
      if (guardCount <= 0) continue;
      const guardReady = Array.from({
        length: guardCount
      }, (_, i) => i).some(i => !(t.guardCooldowns[i] > 0));
      if (!guardReady) continue;
      const guardTargets = runtime.nearestTowerTargets(t.side, t.lane, st.guardRange, guardCount);
      if (!guardTargets.length) continue;
      for (let i = 0; i < guardCount; i++) {
        if (t.guardCooldowns[i] > 0) continue;
        const target = guardTargets[Math.min(i, guardTargets.length - 1)];
        const pseudo = {
          lane: t.lane,
          offset: (t.lateral || 0) + (i - 1) * 6,
          side: t.side,
          key: 'archer'
        };
        runtime.addProjectile(pseudo, target, 'arrow');
        runtime.damageUnit(target, st.guardDamage, 'physical');
        t.guardCooldowns[i] = st.guardCooldown;
      }
    }
  };
  function rebuildOwnTowers(c, count = 2) {
    let rebuilt = 0;
    const dead = deadOwnTowers(c).sort((a, b) => Number(!!a.gateTower) - Number(!!b.gateTower) || a.tier - b.tier);
    for (const t of dead) {
      t.alive = true;
      t.cooldown = 0;
      t.guardCooldowns = [0, 0, 0];
      rebuilt++;
      if (rebuilt >= count) break;
    }
    if (rebuilt) {
      runtime.refreshTowerHpFor(c, sideOf(c), false);
      if (c === runtime.P) {
        runtime.toast(`${rebuilt} torony újjáépült.`);
        runtime.renderStatic();
        runtime.updateHud();
      }
    }
    return rebuilt;
  }
  const oldApplyChoiceTower = runtime.applyChoice;
  runtime.applyChoice = function (c, o, countEvent = true) {
    const out = oldApplyChoiceTower(c, o, countEvent);
    if (!o) return out;
    if (o.kind === 'legendary' && o.id === TOWER_REBUILD_ID) rebuildOwnTowers(c, 2);
    if (o.kind === 'normal' && o.id === 'tower_crews') runtime.refreshTowerHpFor(c, sideOf(c), true);
    if (c === runtime.P && (o.id === TOWER_REGEN_ID || o.id === TOWER_GUARD_ID || o.id === TOWER_SALVO_ID || o.id === TOWER_REBUILD_ID)) {
      runtime.renderStatic();
      runtime.updateHud();
    }
    return out;
  };
  const oldPlaceBuildingTower = runtime.placeBuilding;
  runtime.placeBuilding = function (c, type, row, col, rotation = 0) {
    const res = oldPlaceBuildingTower(c, type, row, col, rotation);
    if (res?.ok && type === TOWER_COMMAND_ID) {
      runtime.refreshTowerHpFor(c, sideOf(c), true);
      if (c === runtime.P) {
        runtime.renderStatic();
        runtime.updateHud();
      }
    }
    return res;
  };
  const oldDemolishTower = runtime.demolish;
  runtime.demolish = function (c, id) {
    const b = runtime.getBuilding(c, id),
      type = b?.type;
    const ok = oldDemolishTower(c, id);
    if (ok && type === TOWER_COMMAND_ID) {
      runtime.refreshTowerHpFor(c, sideOf(c), true);
      if (c === runtime.P) {
        runtime.renderStatic();
        runtime.updateHud();
      }
    }
    return ok;
  };
  const oldOnTowerLost = runtime.onTowerLost;
  runtime.onTowerLost = function (c) {
    const out = oldOnTowerLost(c);
    if (c === runtime.P || c === runtime.E) runtime.updateHud();
    return out;
  };
  const oldBuildingEffectRowsTower = runtime.buildingEffectRows;
  runtime.buildingEffectRows = function (c, b) {
    if (b.type === TOWER_COMMAND_ID) {
      const copies = towerCommandCount(c),
        bonus = copies * 20;
      return [['Hatás', '+20% torony HP / sebzés / hatótáv / támadási sebesség'], ['Korlát', 'városonként 1 épület'], ['Összes bónusz', `+${bonus}% alap toronystat`], ['Korlát', 'nem növeli a lövedékszámot']];
    }
    return oldBuildingEffectRowsTower(c, b);
  };
  runtime.renderTowerInspectorV496 = function (t) {
    const el = runtime.$('#inspector'),
      st = runtime.towerStatsV496(t),
      owner = t.side === 'player' ? 'SAJÁT' : 'ELLENFÉL',
      hpPct = t.maxHp ? Math.round(t.hp / t.maxHp * 100) : 0;
    el.classList.add('show');
    const extra = [];
    extra.push(`<div class="istat"><span>Toronykezelők</span><b>${st.crewStacks}× · +${st.crewStacks * 8}%</b></div>`);
    if (st.commandCount) extra.push(`<div class="istat"><span>Őrségparancsnokság</span><b>${st.commandCount}× · +${st.commandCount * 20}% alap stat</b></div>`);
    if (st.regen) extra.push(`<div class="istat"><span>HP regeneráció</span><b>+${st.regen.toFixed(1)} /mp</b></div>`);
    if (st.guardCount) extra.push(`<div class="istat"><span>Toronyőrség</span><b>${st.guardCount} íjász / torony</b></div>`);
    if (st.extraProjectiles) extra.push(`<div class="istat"><span>Sortűz</span><b>+${st.extraProjectiles} extra lövedék</b></div>`);
    el.innerHTML = `<div class="inspectorCard towerInspector"><div class="ihead"><div><small>${owner} · VÉDELMI ÉPÜLET</small><h3>${runtime.towerNameV496(t)}</h3></div><button id="closeInspector" aria-label="Bezárás">✕</button></div><p class="idesc">Az út védelmét biztosító torony. Kijelölve a pályán látható a tényleges lövési hatótávolsága.</p><div class="effectbox compactEffects"><div class="boxlabel">AKTUÁLIS STATOK</div><div class="istat"><span>HP</span><b id="towerHpStat">${Math.ceil(t.hp)} / ${Math.ceil(t.maxHp)} · ${hpPct}%</b></div><div class="istat"><span>Sebzés / lövés</span><b>${st.damage.toFixed(1)}</b></div><div class="istat"><span>Lövésidő</span><b>${st.cooldown.toFixed(2)} mp</b></div><div class="istat"><span>Támadási sebesség</span><b>${st.attacksPerSecond.toFixed(2)} /mp</b></div><div class="istat"><span>Hatótáv</span><b id="towerRangeStat">${formatMetres(st.range)}</b></div>${extra.join('')}</div>${t.sdActive ? '<div class="upgradeNote sudden">☠ HIRTELEN HALÁL · ez a torony jelenleg olvad.</div>' : ''}<div class="upgradeNote">A sárgával kiemelt útszakasz a torony tényleges támadási tartománya.</div></div>`;
    runtime.$('#closeInspector').onclick = e => {
      e?.stopPropagation?.();
      runtime.state.selectedTowerId = null;
      el.classList.remove('show');
      el.innerHTML = '';
    };
    requestAnimationFrame(runtime.positionInspector);
  };
  const oldUpdateHudTower = runtime.updateHud;
  runtime.updateHud = function () {
    const out = oldUpdateHudTower();
    if (!runtime.P || !runtime.E) return out;
    const pBase = runtime.P.armyCapBase ?? runtime.P.armyCap,
      eBase = runtime.E.armyCapBase ?? runtime.E.armyCap;
    const pUsed = runtime.fieldUnitCount(runtime.P),
      eUsed = runtime.fieldUnitCount(runtime.E);
    const pGuard = runtime.P.towerGuardSlots || 0,
      eGuard = runtime.E.towerGuardSlots || 0;
    runtime.$('#playerArmy').textContent = `${pUsed}/${runtime.P.armyCap}` + (pGuard ? ` · őrség: ${pGuard}` : '');
    runtime.$('#enemyArmy').textContent = `${eUsed}/${runtime.E.armyCap}` + (eGuard ? ` · őrség: ${eGuard}` : '');
    return out;
  };
  if (runtime.MP?.lobby) {
    const ver = runtime.MP.lobby.querySelector('.menuVersion');
    if (ver) ver.textContent = 'V4.9.32 · P2P';
  }
  window.__ROADLORDS_VERSION__ = '4.9.31-pick-tokens';
}
