import { assetUrl } from '../assets/urls.js';
export function register(runtime) {
  runtime.roadDistance = function roadDistance(a, b) {
    return Math.hypot(a.lane - b.lane, (a.offset || 0) - (b.offset || 0));
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
  runtime.roadAdvance = function roadAdvance(u, opps, dt) {
    if (u.roadAttack && runtime.ROAD.clock < u.roadAttack.hit) return;
    const dir = u.side === 'player' ? 1 : -1,
      c = runtime.cityForSide(u.side),
      speed = runtime.effectiveMoveSpeed(u, c),
      old = u.lane;
    let target = u.roadSeek;
    if (!target?.alive || runtime.ROAD.clock >= (u.roadSeekAt || 0)) {
      target = null;
      let best = Infinity;
      runtime.roadVisit(u, Math.max(280, u.range + 30), v => {
        if (v.side === u.side) return;
        const dx = v.lane - u.lane,
          dy = (v.offset || 0) - (u.offset || 0),
          score = dx * dx + dy * dy + (v.roadEngaged || 0) * 225;
        if (score < best) {
          best = score;
          target = v;
        }
      });
      u.roadSeek = target;
      u.roadSeekAt = runtime.ROAD.clock + .3 + u.id % 7 * .017;
    }
    if (!target) {
      const structure = runtime.targetStructure(u.side);
      if (Math.abs(structure.lane - u.lane) < 500) target = {
        lane: structure.lane,
        offset: structure.lateral || 0
      };
    }
    let dx = dir,
      dy = 0;
    if (target) {
      dx = target.lane - u.lane;
      dy = (target.offset || 0) - (u.offset || 0);
      const d = Math.hypot(dx, dy) || 1,
        stop = u.tags.includes('ranged') ? Math.max(25, u.range * .88) : Math.max(21, u.range * .78);
      if (d <= stop) return;
      const step = Math.min(speed * dt, d - stop);
      dx = dx / d * step;
      dy = dy / d * step;
    } else {
      dx = dir * speed * dt;
      const row = ((u.id - 1) % 20 - 9.5) * 24;
      dy = runtime.clamp(row - (u.offset || 0), -speed * dt * .45, speed * dt * .45);
    }
    let blocked = false;
    if (target?.phalanx) runtime.roadVisit(u, 45, v => {
      if (v.side !== u.side && v.phalanx && Math.abs((v.offset || 0) - (u.offset || 0)) < 20 && Math.abs(v.lane - (u.lane + dx)) < 20) blocked = true;
    });
    let crowded = false;
    runtime.roadVisit(u, 34, v => {
      const gap = u.tags.includes('heavy') || v.tags.includes('heavy') ? 25 : 21;
      const ox = v.lane - u.lane,
        oy = (v.offset || 0) - (u.offset || 0),
        nx = ox - dx,
        ny = oy - dy;
      if (nx * nx + ny * ny < gap * gap && nx * nx + ny * ny < ox * ox + oy * oy - .01) crowded = true;
    });
    if (crowded) {
      dx = 0;
      dy = 0;
    }
    if (!blocked) runtime.setBattleLane(u, runtime.clamp(u.lane + dx, 8, runtime.PATH_LENGTH - 8));
    u.offset = runtime.clamp((u.offset || 0) + dy, -runtime.ROAD.half, runtime.ROAD.half);
    if (u.key === 'knight') u.chargeDist += Math.abs(old - u.lane);
  };
  runtime.roadSeparate = function roadSeparate() {
    for (let pass = 0; pass < 1; pass++) {
      runtime.roadReindex();
      for (const u of runtime.state.units) {
        if (!u.alive) continue;
        runtime.roadVisit(u, 30, v => {
          if (v.id <= u.id) return;
          let dx = v.lane - u.lane,
            dy = (v.offset || 0) - (u.offset || 0),
            d = Math.hypot(dx, dy);
          const gap = u.tags.includes('heavy') || v.tags.includes('heavy') ? 25 : 21;
          if (d >= gap) return;
          if (d < .001) {
            dx = 0;
            dy = u.id % 2 ? 1 : -1;
            d = 1;
          }
          const push = Math.min(3, (gap - d) * .5),
            px = dx / d * push,
            py = dy / d * push;
          runtime.setBattleLane(u, runtime.clamp(u.lane - px, 8, runtime.PATH_LENGTH - 8));
          runtime.setBattleLane(v, runtime.clamp(v.lane + px, 8, runtime.PATH_LENGTH - 8));
          u.offset = runtime.clamp((u.offset || 0) - py, -runtime.ROAD.half, runtime.ROAD.half);
          v.offset = runtime.clamp((v.offset || 0) + py, -runtime.ROAD.half, runtime.ROAD.half);
        });
      }
    }
  };
  runtime.roadQueueAttack = function roadQueueAttack(u, t, structure, opts) {
    if (!u?.alive || !structure && !t?.alive || u.roadPending) return;
    const ranged = u.tags.includes('ranged'),
      wind = Math.min(.16, Math.max(.055, u.cooldownTime * .16)),
      flight = ranged ? runtime.clamp(runtime.roadDistance(u, t) / 800, .09, .48) : 0;
    const a = {
      start: runtime.ROAD.clock,
      launch: runtime.ROAD.clock + wind,
      hit: runtime.ROAD.clock + wind + flight,
      end: runtime.ROAD.clock + wind + flight + .14,
      lane: u.lane,
      offset: u.offset || 0,
      to: t.lane,
      toOffset: t.offset || t.lateral || 0,
      ranged,
      key: u.key
    };
    u.roadAttack = a;
    u.roadPending = true;
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
      if (runtime.ROAD.clock + 1e-8 < p.a.hit) {
        runtime.ROAD.pending[n++] = p;
        continue;
      }
      p.u.roadPending = false;
      if (!p.structure && !p.t.alive) continue;
      if (!p.a.ranged && runtime.roadDistance(p.u, p.t) > p.u.range + 12) continue;
      if (p.structure && !p.t.capital && !p.t.alive) continue;
      runtime.roadResolving = true;
      try {
        if (p.structure) runtime.roadRealStructure(p.u, p.t);else runtime.roadRealAttack(p.u, p.t, p.opts);
      } finally {
        runtime.roadResolving = false;
      }
    }
    runtime.ROAD.pending.length = n;
  };
}
