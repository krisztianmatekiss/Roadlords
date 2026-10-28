import { installRoadMovement } from './movement.js';
import { shotKind } from '../rendering/battle-effects.js';
import { incomingDamageEstimate, installTargetBudget } from './target-budget.js';
export function register(runtime) {
  installTargetBudget(runtime);
  runtime.roadFlyingShots = function* () {
    if(runtime.MP.enabled&&runtime.MP.role==='guest') {
      for(const u of runtime.state.units)if(u.alive&&u.roadAttack)yield {u,a:u.roadAttack};
      for(const u of runtime.ROAD.remoteShots||[])yield {u,a:u.roadAttack};
    } else {
      for(const p of runtime.ROAD.pending)yield p;
      // Also support a locally reconstructed animation with no queued damage.
      for(const u of runtime.state.units)if(u.alive&&!u.roadPending&&u.roadAttack)yield {u,a:u.roadAttack};
    }
  };
  runtime.roadDistance = function roadDistance(a, b) {
    return Math.hypot(a.lane - b.lane, (a.offset ?? a.lateral ?? 0) - (b.offset ?? b.lateral ?? 0));
  };
  runtime.roadReindex = function roadReindex() {
    for (const bucket of runtime.ROAD.grid.values()) {
      bucket.length = 0;
      bucket.player.length = bucket.enemy.length = 0;
      bucket.playerY = bucket.enemyY = 0;
    }
    runtime.ROAD.counts[0] = runtime.ROAD.counts[1] = 0;
    for (const u of runtime.state.units) {
      if (!u.alive) continue;
      runtime.ROAD.counts[u.side === 'player' ? 0 : 1]++;
      const k = runtime.roadCell(u.lane, u.offset || 0);
      let b = runtime.ROAD.grid.get(k);
      if (!b) {b = [];b.player = [];b.enemy = [];b.playerY = b.enemyY = 0;runtime.ROAD.grid.set(k, b);}
      b.push(u);
      b[u.side].push(u);
      b[u.side + 'Y'] += u.offset || 0;
    }
  };
  runtime.roadVisit = function roadVisit(u, range, fn, side) {
    const x0 = Math.max(0, Math.floor((u.lane - range) / 64)),
      x1 = Math.min(Math.ceil(runtime.PATH_LENGTH / 64), Math.floor((u.lane + range) / 64)),
      y0 = Math.max(4, Math.floor(((u.offset || 0) + 512 - range) / 64)),
      y1 = Math.min(11, Math.floor(((u.offset || 0) + 512 + range) / 64));
    for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) {
      const b = runtime.ROAD.grid.get(x * 32 + y);
      if (b) for (const v of side ? b[side] : b) if (v.alive && v !== u) fn(v);
    }
  };
  // Friendly spreading is a bounded preference, independent of crowd size.
  // Cell summaries avoid visiting thousands of overlapping allies per mover.
  runtime.roadFriendlyBias = u => {
    const x = Math.floor(u.lane / 64), y = Math.floor(((u.offset || 0) + 512) / 64);
    let sum = 0, count = 0;
    for (let xx=x-1;xx<=x+1;xx++) for(let yy=y-1;yy<=y+1;yy++) {
      const b=runtime.ROAD.grid.get(xx*32+yy), n=b?.[u.side].length || 0;
      if(n){sum+=b[u.side+'Y'];count+=n;}
    }
    return count>1 ? runtime.clamp(((u.offset||0)-sum/count)/64,-1,1)*.18 : 0;
  };
  installRoadMovement(runtime);
  runtime.roadQueueAttack = function roadQueueAttack(u, t, structure, opts) {
    if (!u?.alive || !structure && !t?.alive || u.roadPending) return;
    const orcSpear = u.key === 'orc_warg' && !!u.orcSpearReady;
    const ranged = u.tags.includes('ranged') || !!u.spearVolleyReady || orcSpear,
      wind = Math.min(.28, Math.max(.12, u.cooldownTime * .24)),
      flight = ranged ? runtime.clamp(runtime.roadDistance(u, t) / 800, .09, .48) : 0,
      recovery = Math.min(.24, Math.max(.07, u.cooldownTime * .26));
    const a = {
      start: runtime.ROAD.clock,
      launch: runtime.ROAD.clock + wind,
      hit: runtime.ROAD.clock + wind + flight,
      end: runtime.ROAD.clock + wind + flight + recovery,
      recovery,
      orcSpear,
      lane: u.lane,
      offset: u.offset || 0,
      to: t.lane,
      toOffset: t.offset || t.lateral || 0,
      ranged,
      effect: ranged ? shotKind(runtime, u) : '',
      radius: u.aoe || (u.key === 'catapult' ? 32 : 20),
      key: u.key
    };
    if(u.key==='orc_goblin')a.goblinBow=runtime.hasLeg(runtime.cityForSide(u.side),'orc_gob_bow');
    const reserved = !structure && ranged ? incomingDamageEstimate(runtime,u,t,opts) : 0;
    u.roadFace = t.lane >= u.lane ? 1 : -1;
    u.roadAttack = a;
    u.roadPending = true;
    if (orcSpear) u.orcSpearReady = false;
    u.roadAttacks = (u.roadAttacks || 0) + 1;
    if(reserved)t.roadIncomingDamage=(t.roadIncomingDamage||0)+reserved;
    runtime.ROAD.pending.push({
      u,
      t,
      a,
      structure,
      opts,
      reserved
    });
    runtime.ROAD.metrics.attacks++;
  };
  runtime.roadImpacts = function roadImpacts() {
    let n = 0;
    for (const p of runtime.ROAD.pending) {
      const launched = p.a.ranged && p.u.key !== 'und_lich' && runtime.ROAD.clock >= p.a.launch && (p.u.alive || p.u.roadDiedAt >= p.a.launch);
      if (!p.u.alive && !launched) {
        p.u.roadPending = false;
        runtime.roadReleaseReservation(p);
        continue;
      }
      // The visual projectile follows the same live target that receives the hit.
      p.a.to = p.t.lane;
      p.a.toOffset = p.t.offset || p.t.lateral || 0;
      if (runtime.ROAD.clock + 1e-8 < p.a.hit) {
        runtime.ROAD.pending[n++] = p;
        continue;
      }
      p.u.roadPending = false;
      runtime.roadReleaseReservation(p);
      if (!p.structure && !p.t.alive) continue;
      if (!p.a.ranged && runtime.roadDistance(p.u, p.t) > p.u.range + 12) continue;
      if (p.structure && !p.t.capital && !p.t.alive) continue;
      runtime.roadResolving = true;
      runtime.roadProjectileSource = launched ? p.u : null;
      // Before-combat hooks consume this flag immediately; preserve the queued throw.
      if (p.a.orcSpear) p.u.orcSpearReady = true;
      try {
        if (p.structure) runtime.roadRealStructure(p.u, p.t);else runtime.roadRealAttack(p.u, p.t, p.opts);
        p.a.resolved = true;
        runtime.roadImpactEffect?.(p.u, p.a);
      } finally {
        if (p.a.orcSpear) p.u.orcSpearReady = false;
        runtime.roadResolving = false;
        runtime.roadProjectileSource = null;
      }
    }
    runtime.ROAD.pending.length = n;
  };
}
