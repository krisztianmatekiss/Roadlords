import { installRoadMovement } from './movement.js';
export function register(runtime) {
  runtime.roadDistance = function roadDistance(a, b) {
    if(a.capital||b.capital)return Math.abs(a.lane-b.lane);
    return Math.max(0,Math.hypot(a.lane-b.lane,(a.offset??a.lateral??0)-(b.offset??b.lateral??0))-(a.roadRadius||b.roadRadius||0));
  };
  runtime.roadReindex = function roadReindex() {
    for (const bucket of runtime.ROAD.grid.values()) bucket.length = 0;
    runtime.ROAD.counts[0] = runtime.ROAD.counts[1] = 0;
    for (const u of runtime.state.units) {
      if (!u.alive) continue;
      runtime.ROAD.counts[u.side === 'player' ? 0 : 1]++;
      const k = runtime.roadCell(u.lane, u.offset || 0);
      let b = runtime.ROAD.grid.get(k);
      if (!b) runtime.ROAD.grid.set(k, b = []);
      b.push(u);
    }
  };
  runtime.roadVisit = function roadVisit(u, range, fn) {
    const x0 = Math.max(0, Math.floor((u.lane - range) / 64)),
      x1 = Math.min(Math.ceil(runtime.PATH_LENGTH / 64), Math.floor((u.lane + range) / 64)),
      y0 = Math.max(4, Math.floor(((u.offset || 0) + 512 - range) / 64)),
      y1 = Math.min(11, Math.floor(((u.offset || 0) + 512 + range) / 64));
    for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) {
      const b = runtime.ROAD.grid.get(x * 32 + y);
      if (b) for (const v of b) if (v.alive && v !== u) fn(v);
    }
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
      toOffset: t.capital ? u.offset||0 : t.offset || t.lateral || 0,
      ranged,
      key: u.key
    };
    u.roadFace = t.lane >= u.lane ? 1 : -1;
    if(!structure&&u.tags.includes('melee')){
      const tower=runtime.targetStructure(u.side);
      runtime.roadShouldReturnTower(u);
      if(!tower.capital&&!u.roadTowerDiversionUntil&&Math.hypot(u.lane-tower.lane,(u.offset||0)-(tower.lateral||0))<160)u.roadTowerDiversionUntil=runtime.ROAD.clock+2.5;
    }
    u.roadAttack = a;
    u.roadPending = true;
    if (orcSpear) u.orcSpearReady = false;
    u.roadAttacks = (u.roadAttacks || 0) + 1;
    runtime.ROAD.pending.push({
      u,
      t,
      a,
      structure,
      opts
    });
    runtime.ROAD.metrics.attacks++;
  };
  runtime.roadImpacts = function roadImpacts() {
    let n = 0;
    for (const p of runtime.ROAD.pending) {
      if (!p.u.alive) {
        p.u.roadPending = false;
        continue;
      }
      // The visual projectile follows the same live target that receives the hit.
      p.a.to = p.t.lane;
      p.a.toOffset = p.t.capital ? p.u.offset||0 : p.t.offset || p.t.lateral || 0;
      if (runtime.ROAD.clock + 1e-8 < p.a.hit) {
        runtime.ROAD.pending[n++] = p;
        continue;
      }
      p.u.roadPending = false;
      if (!p.structure && !p.t.alive) continue;
      if (!p.a.ranged && runtime.roadDistance(p.u, p.t) > p.u.range + 12) continue;
      if (p.structure && !p.t.capital && !p.t.alive) continue;
      runtime.roadResolving = true;
      // Before-combat hooks consume this flag immediately; preserve the queued throw.
      if (p.a.orcSpear) p.u.orcSpearReady = true;
      try {
        if (p.structure) runtime.roadRealStructure(p.u, p.t);else runtime.roadRealAttack(p.u, p.t, p.opts);
      } finally {
        if(p.structure&&p.u.roadTowerObjective===p.t.id){p.u.roadTowerDiversionUntil=0;p.u.roadSeek=null;p.u.roadSeekAt=0;}
        if (p.a.orcSpear) p.u.orcSpearReady = false;
        runtime.roadResolving = false;
      }
    }
    runtime.ROAD.pending.length = n;
  };
}
