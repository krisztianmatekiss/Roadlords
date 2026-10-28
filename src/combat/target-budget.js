// Selection only: never roll a crit/dodge or consume an opening attack here.
// Keep uncertain effects conservative; real damage still uses the combat rules.
export function incomingDamageEstimate(R, u, t, opts = {}) {
  let damage = Math.max(0, u.damage || 0) * (opts.mult || 1);
  const c = R.cityForSide(u.side), enemy = R.cityForSide(t.side);
  if (u.blessingTime > 0) damage *= 2;
  if (u.firstHitsRemaining > 0 && !u.permanentTavern) damage *= u.firstMult || 1;
  if (u.spearVolleyReady) damage *= 3.5;
  if (u.orcSpearReady) damage *= 2;
  if (t.rangedMarkTime > 0 && u.tags.includes('ranged')) damage *= 1.5;
  if (R.hasLeg(c, 'melee_doctrine')) damage *= u.tags.includes('melee') ? 2 : 0;
  damage *= R.longbowMult(u, t.lane);
  if (R.orcCursePower) damage *= (1 - .2 * R.orcCursePower(u, 'weakness')) * (1 + .2 * R.orcCursePower(t, 'vulnerability'));
  if (u.damageType === 'physical') {
    if (t.key === 'knight' && R.hasBranch(enemy, 'stable', 'armored_knights')) damage *= .5;
    if (t.key === 'orc_ram') damage *= .5;
    if (t.key.startsWith('und_skeleton')) damage *= 1 - Math.min(.9, .25 + .05 * R.countNormal(enemy, 'skeleton_common_ranged_res'));
  }
  return Math.max(0, damage);
}

export function attackSourceCanResolve(R, u) {
  return !!u && (u.alive || R.roadProjectileSource === u);
}

export function installTargetBudget(R) {
  R.roadTargetCovered = (u, t) => {
    if (!u.tags.includes('ranged') || u.key === 'und_lich') return false;
    // A taunting warrior must retain its explicit gameplay priority.
    if (t.key === 'orc_warrior' && R.hasBranch(R.cityForSide(t.side), 'orc_war', 'meat_shield')) return false;
    return (t.roadIncomingDamage || 0) >= Math.max(0, t.hp) + Math.max(0, t.shield || 0) + Math.max(0, t.tempShield || 0);
  };
  R.roadReleaseReservation = p => {
    if (!p.reserved) return;
    p.t.roadIncomingDamage = Math.max(0, (p.t.roadIncomingDamage || 0) - p.reserved);
    p.reserved = 0;
  };
}
