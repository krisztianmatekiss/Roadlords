import { assetUrl } from '../assets/urls.js';
export function initializeAiEconomy(runtime) {
  runtime.v45Style = document.createElement('style');
  runtime.v45Style.textContent = "@import url(\"" + (assetUrl("styles/features/ai-economy-5.css") + "\");");
  document.head.appendChild(runtime.v45Style);
  for (const c of [runtime.P, runtime.E]) {
    c.warMode = c.warMode || 'mass';
    c.warModeChangedAt = -30;
  }
  runtime.WAR_MODE_NAMES = {
    mass: 'Tömegtermelés',
    economy: 'Takarékos kiképzés',
    elite: 'Elit felszerelés'
  };
  runtime.v45UnitCost = runtime.unitCost;
  runtime.unitCost = function (c, key) {
    const out = runtime.v45UnitCost(c, key),
      p = runtime.warModeProfile(c),
      mult = Math.max(.1, 1 + p.costDelta);
    for (const r of runtime.RES) out[r] = Math.round((out[r] || 0) * mult * 10) / 10;
    return out;
  };
  runtime.v45TrainingSpeedBonus = runtime.trainingSpeedBonus;
  runtime.trainingSpeedBonus = function (c, b, key) {
    let speed = runtime.v45TrainingSpeedBonus(c, b, key);
    if (!speed) return speed;
    const p = runtime.warModeProfile(c);
    speed *= 1 + p.speedBonus;
    speed /= 1 + p.timePenalty;
    return speed;
  };
  runtime.duplicateByWarcenter = function () {};
  runtime.v45QueueProduced = runtime.queueProduced;
  runtime.queueProduced = function (c, entry, b = null) {
    if (b) {
      runtime.applyArmorSmithEntry(c, b, entry);
      const p = runtime.warModeProfile(c);
      if (p.eliteBonus) entry.warEliteMult = Math.max(entry.warEliteMult || 1, 1 + p.eliteBonus);
    }
    return runtime.v45QueueProduced(c, entry, b);
  };
  runtime.v45StatsFor = runtime.statsFor;
  runtime.statsFor = function (c, entry) {
    const s = runtime.v45StatsFor(c, entry),
      m = entry?.warEliteMult || 1;
    if (m !== 1) {
      s.hp *= m;
      s.dmg *= m;
      s.buildingDamage *= m;
    }
    return s;
  };
  runtime.v45ReleaseUnit = runtime.releaseUnit;
  runtime.releaseUnit = function (c, entry) {
    const u = runtime.v45ReleaseUnit(c, entry);
    if (!u) return u;
    u.hospitalSaved = !!entry.hospitalSaved;
    u.warEliteMult = entry.warEliteMult || 1;
    u.armorShieldPct = entry.armorShieldPct || 0;
    u.armorMoveMult = entry.armorMoveMult || 1;
    u.thornArmor = Number(entry.thornArmor)||0;
    if (entry.hospitalHpPct != null) u.hp = u.maxHp * entry.hospitalHpPct;
    if (u.armorMoveMult !== 1) {
      u.baseSpeed *= u.armorMoveMult;
      u.speed *= u.armorMoveMult;
    }
    return u;
  };
  runtime.v45KillUnit = runtime.killUnit;
  runtime.killUnit = function (target, combatDeath = true) {
    if (!target?.alive) return;
    const c = runtime.cityForSide(target.side),
      rescue = combatDeath ? runtime.hospitalRescueData(c, target) : null,
      entry = rescue ? runtime.makeEntry(c, target.key, {
        ...runtime.permanentUnitData(target),
        veteran: !!target.veteran,
        permanentTavern: !!target.permanentTavern,
        hospitalSaved: true,
        hospitalHpPct: rescue.hp,
        warEliteMult: target.warEliteMult || 1,
        armorShieldPct: target.armorShieldPct || 0,
        shieldPct: target.armorShieldPct || 0,
        armorMoveMult: target.armorMoveMult || 1,
        thornArmor: Number(target.thornArmor)||0
      }) : null,
      lane = target.lane;
    runtime.v45KillUnit(target, combatDeath);
    if (entry && runtime.reserveCount(c) < c.garrisonCap) {
      c.garrison.push(entry);
      runtime.spark(lane, '✚ MENTVE', '#9ff0b0');
    }
  };
  runtime.v45ApplyDirectHit = runtime.applyDirectHit;
  runtime.applyDirectHit = function (u, t, dmg, opts = {}) {
    const before = (t?.shield || 0) + (t?.tempShield || 0);
    runtime.v45ApplyDirectHit(u, t, dmg, opts);
    const absorbed = Math.max(0, before - ((t?.shield || 0) + (t?.tempShield || 0)));
    if (absorbed > 0 && t?.thornArmor && u?.alive && u.tags?.includes('melee')) {
      runtime.damageUnit(u, absorbed * .30 * (Number(t.thornArmor)||1), 'magic');
      runtime.spark(u.lane, '✹ ' + Math.round(absorbed * .30 * (Number(t.thornArmor)||1)), '#f4bd72');
    }
  };
  runtime.v45DrawUnit = runtime.drawUnit;
  runtime.drawUnit = function (u) {
    runtime.v45DrawUnit(u);
    if (!u.hospitalSaved) return;
    const p = runtime.pointAt(u.lane, u.offset);
    runtime.ctx.save();
    runtime.ctx.translate(p.x, p.y);
    runtime.ctx.fillStyle = '#f4ead3';
    runtime.ctx.strokeStyle = '#7c322d';
    runtime.ctx.lineWidth = 1.5;
    runtime.ctx.fillRect(-5, -runtime.unitDrawRadius(u.key) - 13, 10, 9);
    runtime.ctx.strokeRect(-5, -runtime.unitDrawRadius(u.key) - 13, 10, 9);
    runtime.ctx.fillStyle = '#b83b3b';
    runtime.ctx.fillRect(-1.5, -runtime.unitDrawRadius(u.key) - 12, 3, 7);
    runtime.ctx.fillRect(-4, -runtime.unitDrawRadius(u.key) - 10, 8, 3);
    runtime.ctx.restore();
  };
  runtime.v45BuildingEffectRows = runtime.buildingEffectRows;
  runtime.buildingEffectRows = function (c, b) {
    const lv = b.level;
    if (b.type === 'warcenter') return [['Aktív irány', runtime.WAR_MODE_NAMES[c.warMode || 'mass']], ['Globális hatás', runtime.warModeSummary(c)], ['Váltási idő', '30 mp']];
    if (b.type === 'armorsmith') {
      const shield = runtime.hasBranch(c, b.type, 'heavy_armor') ? 100 : 60;
      const rows = [['Hatókör', 'közvetlenül szomszédos katonai termelők'], ['Kezdőpajzs', `${lv < 4 ? runtime.v4LevelValue(lv, [30, 45, 60]) : shield}% maximális HP`]];
      if (runtime.hasBranch(c, b.type, 'heavy_armor')) rows.push(['Hátrány', '−15% mozgási sebesség']);
      if (runtime.hasBranch(c, b.type, 'spiked_armor')) rows.push(['Szöges visszasebzés', 'a felfogott közelharci sebzés 30%-a']);
      return rows;
    }
    if (b.type === 'hospital') {
      const chance = runtime.hasBranch(c, b.type, 'mass_rescue') ? 60 : runtime.hasBranch(c, b.type, 'full_recovery') ? 40 : runtime.v4LevelValue(lv, [20, 30, 40, 40]),
        hp = runtime.hasBranch(c, b.type, 'full_recovery') ? 100 : 50;
      return [['Mentési esély', `${chance}%`], ['Visszatérési HP', `${hp}%`], ['Cél', 'főhelyőrség'], ['Tele helyőrségnél', 'INAKTÍV'], ['Egy egység mentése', 'legfeljebb egyszer']];
    }
    return runtime.v45BuildingEffectRows(c, b);
  };
  runtime.v45Tick = runtime.tick;
  runtime.tick = function (dt) {
    runtime.v45Tick(dt);
    if (runtime.state.running && !runtime.state.ended) runtime.updateEnemyWarModeV45();
  };
  runtime.v462Style = document.createElement('style');
  runtime.v462Style.textContent = "@import url(\"" + (assetUrl("styles/features/ai-economy-6.css") + "\");");
  document.head.appendChild(runtime.v462Style);
  runtime.v462RenderCity = runtime.renderCity;
  runtime.renderCity = function (container, c, interactive) {
    runtime.v462RenderCity(container, c, interactive);
    for (const el of container.querySelectorAll('.building')) {
      el.style.clipPath = 'none';
      el.style.pointerEvents = 'none';
      if (!interactive) continue;
      const b = runtime.getBuilding(c, el.dataset.id);
      if (!b) continue;
      for (const [row, col] of runtime.buildingCells(b)) {
        const hit = document.createElement('button');
        hit.type = 'button';
        hit.className = 'buildingHitCell';
        hit.dataset.r = row;
        hit.dataset.c = col;
        hit.dataset.id = b.id;
        hit.style.gridRow = row + 1;
        hit.style.gridColumn = col + 1;
        hit.setAttribute('aria-label', runtime.BUILDINGS[b.type].name);
        hit.onmouseenter = () => {
          if (runtime.state.selectedBuild) runtime.previewPlacement(row, col);else el.classList.add('footprintHover');
        };
        hit.onmouseleave = () => {
          if (runtime.state.selectedBuild) runtime.clearPlacementPreview();else el.classList.remove('footprintHover');
        };
        hit.onclick = () => {
          if (runtime.state.selectedBuild) {
            runtime.tryPlace(row, col);
            return;
          }
          runtime.state.selectedBuild = null;
          runtime.state.selectedBuilding = b.id;
          runtime.clearPlacementPreview();
          runtime.renderStatic();
        };
        container.appendChild(hit);
      }
    }
  };
}
