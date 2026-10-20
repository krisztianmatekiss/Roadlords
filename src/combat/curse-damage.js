import { assetUrl } from '../assets/urls.js';
export function initializeCombatCurseDamage(runtime) {
  const O = window.__ROADLORDS_ORCS__;
  runtime.applyBurn = function (u, damage) {
    const remaining = runtime.auditBurnCopy(u).reduce((n, x) => n + x.time * x.dps, 0);
    u.burnParts = [{
      time: 4,
      dps: (remaining + Math.max(0, damage)) / 4
    }];
    runtime.auditBurnSummary(u);
  };
  const oldStatus = runtime.updateUnitStatuses;
  runtime.updateUnitStatuses = function (u, dt) {
    if (!u?.alive) return;
    const parts = runtime.auditBurnCopy(u);
    let damage = 0;
    for (const part of parts) {
      const elapsed = Math.min(dt, part.time);
      damage += part.dps * elapsed;
      part.time -= elapsed;
    }
    u.burnParts = parts;
    runtime.auditBurnSummary(u);
    if (damage > 0) runtime.damageUnit(u, damage, 'magic');
    if (!u.alive) return;
    u.burnTime = 0;
    u.burnDps = 0;
    try {
      return oldStatus(u, dt);
    } finally {
      runtime.auditBurnSummary(u);
    }
  };
  const oldAttack = runtime.attackUnit;
  runtime.attackUnit = function (u, t, opts = {}) {
    if (!u?.alive || u.stunTime > 0) return;
    return oldAttack(u, t, opts);
  };
  const oldStructure = runtime.attackStructure;
  runtime.attackStructure = function (u, t) {
    if (!u?.alive || u.stunTime > 0) return;
    return oldStructure(u, t);
  };
  const inherit = runtime.LEGENDARY.find(x => x.id === 'orc_inherit');
  if (inherit) inherit.description = 'Halálkor a közeli szövetséges megörökli a pozitív állapotokat, a megmaradt pajzsot és támadásbónuszokat. Az időtartamok és töltetek nem indulnak újra.';
  const spread = runtime.LEGENDARY.find(x => x.id === 'orc_curse_spread');
  if (spread) spread.description = 'Elátkozott ellenség halálakor negatív állapotai a legközelebbi közeli ellenségre szállnak. Megmarad az erősségük és a hátralévő időtartamuk.';
  Object.assign(window.__ROADLORDS__, {
    attackUnit: runtime.attackUnit,
    attackStructure: runtime.attackStructure,
    updateUnitStatuses: runtime.updateUnitStatuses,
    statsFor: runtime.statsFor,
    applyBurn: runtime.applyBurn
  });
  window.__ROADLORDS_AUDIT__ = {
    curseSources: runtime.auditCurseCopy,
    burnParts: runtime.auditBurnCopy
  };
}
