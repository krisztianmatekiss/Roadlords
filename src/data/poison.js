// Poison loses one stack per tick and bypasses shields, but leaves at least 1 HP.
// Fractional stacks also get a final tick; speed changes timing, not this sum.
export function remainingPoisonDamage(u, multiplier = 1) {
  const stacks = Math.max(0, Number(u?.orcPoison) || 0), ticks = Math.ceil(stacks);
  const damage = (ticks * stacks - ticks * (ticks - 1) / 2) * Math.max(0, multiplier);
  return Math.max(0, Math.min((u?.hp || 0) - 1, damage));
}
// A render pass / snapshot shares the two source-city multipliers. Do not
// rebuild city economy keys once per poisoned soldier on every drawn frame.
export function forecastPoisonDamage(R,u,multipliers) {
  if(!(u?.orcPoison>0))return 0;
  const source=u.undPoisonSource||'';
  let multiplier=multipliers?.get(source);
  if(multiplier==null){multiplier=R.poisonTickMultiplier?.(u)??1;multipliers?.set(source,multiplier);}
  return remainingPoisonDamage(u,multiplier);
}
