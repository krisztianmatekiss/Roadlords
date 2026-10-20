import { assetUrl } from '../assets/urls.js';
export function initializeFactionsOrcBerserkerGoblin(runtime) {
  const O = window.__ROADLORDS_ORCS__;
  runtime.V4_BRANCHES.orc_bers = [{
    id: 'defiance',
    name: 'Halálmegvetés',
    icon: '☠',
    description: 'Halálos találat után még 3 másodpercig harcol, maximális dühvel. Ezalatt nem gyógyítható, utána meghal.'
  }, {
    id: 'bloodbath',
    name: 'Vérfürdő',
    icon: '⚔',
    description: '50% életerő alatt támadása egy második, közelharci hatótávon belüli ellenfelet is eltalál 50% sebzéssel. Az életlopás erre a találatra is hat.'
  }];
  runtime.V4_BRANCHES.orc_gob = [{
    id: 'swarm',
    name: 'Goblinraj',
    icon: '♟',
    description: 'A Goblin nem foglal helyet a helyőrségben. A sereglimitből fél helyet használ: 2 Goblin számít 1 egységnek.'
  }, {
    id: 'agile',
    name: 'Fürge Goblinok',
    icon: '➜',
    description: 'A Goblin 40% eséllyel elkerüli a rá érkező sebzést.'
  }];
  const oldEntry = runtime.makeEntry;
  runtime.makeEntry = function (c, key, extra = {}) {
    const e = oldEntry(c, key, extra);
    if (key === 'orc_goblin') e.orcSwarm = runtime.hasBranch(c, 'orc_gob', 'swarm');
    return e;
  };
  const oldRecompute = runtime.recomputeCity;
  runtime.recomputeCity = function (c, preserve = true) {
    const result = oldRecompute(c, preserve);
    for (const e of [...c.garrison, ...c.releaseQueue, ...(c.rallyReserve || [])]) if (e.key === 'orc_goblin') e.orcSwarm = runtime.hasBranch(c, 'orc_gob', 'swarm');
    return result;
  };
  runtime.reserveCount = c => [...c.garrison, ...c.releaseQueue].reduce((sum, e) => sum + runtime.orcReserveWeight(e, c), 0);
  const oldKill = runtime.killUnit;
  runtime.killUnit = function (u, combatDeath = true) {
    if (u?.alive && combatDeath && u.key === 'orc_berserker' && runtime.hasBranch(runtime.cityForSide(u.side), 'orc_bers', 'defiance') && !u.orcDeathDefiance) {
      u.orcDeathDefiance = true;
      u.orcDefianceTime = 3;
      u.hp = 0;
      runtime.spark(u.lane, 'HALÁLMEGVETÉS', '#ff886b');
      return;
    }
    if (u?.orcDeathDefiance && u.orcDefianceTime > 0 && combatDeath) return;
    return oldKill(u, combatDeath);
  };
  const oldDamage = runtime.damageUnit;
  runtime.damageUnit = function (u, amount, type) {
    u.orcLastEvaded = false;
    if (u.orcDeathDefiance) return 0;
    if (u.alive && amount > 0 && u.key === 'orc_goblin' && runtime.hasBranch(runtime.cityForSide(u.side), 'orc_gob', 'agile') && Math.random() < .4) {
      u.orcLastEvaded = true;
      runtime.spark(u.lane, 'KITÉRÉS', '#afdca0');
      return 0;
    }
    return oldDamage(u, amount, type);
  };
  const oldHeal = runtime.healUnit;
  runtime.healUnit = (u, n) => u.orcDeathDefiance ? undefined : oldHeal(u, n);
  const oldRescue = runtime.hospitalRescueData;
  runtime.hospitalRescueData = (c, u) => u.orcDeathDefiance ? null : oldRescue(c, u);
  const oldStatus = runtime.updateUnitStatuses;
  runtime.updateUnitStatuses = function (u, dt) {
    const active = u.orcDeathDefiance;
    oldStatus(u, dt);
    if (u.orcDeathDefiance) {
      u.hp = 0;
      if (active) u.orcDefianceTime = Math.max(0, u.orcDefianceTime - dt);
      if (u.orcDefianceTime <= 0) runtime.killUnit(u, true);
    }
  };
  const oldDraw = runtime.drawUnit;
  runtime.drawUnit = function (u) {
    oldDraw(u);
    if (!u.alive || !u.orcDeathDefiance) return;
    const p = runtime.pointAt(u.lane, u.offset || 0);
    runtime.ctx.save();
    runtime.ctx.strokeStyle = '#ff6048';
    runtime.ctx.lineWidth = 2;
    runtime.ctx.beginPath();
    runtime.ctx.arc(p.x, p.y, 14, 0, Math.PI * 2);
    runtime.ctx.stroke();
    runtime.ctx.restore();
  };
  Object.assign(window.__ROADLORDS__, {
    makeEntry: runtime.makeEntry,
    recomputeCity: runtime.recomputeCity,
    reserveCount: runtime.reserveCount,
    damageUnit: runtime.damageUnit,
    healUnit: runtime.healUnit,
    killUnit: runtime.killUnit,
    updateUnitStatuses: runtime.updateUnitStatuses
  });
}
