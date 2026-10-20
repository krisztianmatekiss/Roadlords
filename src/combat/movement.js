// Local steering uses the battle grid; no all-pairs pathfinding is needed.
const TAU = Math.PI * 2;
const gapFor = (a, b) => a.tags.includes('heavy') || b.tags.includes('heavy') || a.cat === 'cavalry' || b.cat === 'cavalry' ? 25 : 21;
const anchored = (u, clock) => u.roadAttack && clock < u.roadAttack.launch + .09;

export function installRoadMovement(R) {
  R.roadAdvance = function advance(u, opponents, dt) {
    if (anchored(u, R.ROAD.clock) || u.stunTime > 0) return;
    const dir = u.side === 'player' ? 1 : -1;
    const speed = R.effectiveMoveSpeed(u, R.cityForSide(u.side));
    let target = u.roadSeek;
    if (!target?.alive || !R.roadCanPursue(u, target) || R.ROAD.clock >= (u.roadSeekAt || 0)) {
      if (target?.alive) target.roadEngaged = Math.max(0, (target.roadEngaged || 0) - 1);
      target = null;
      let best = Infinity;
      R.roadVisit(u, Math.max(340, u.range + 60), v => {
        if (v.side === u.side || !R.roadCanPursue(u,v)) return;
        const dx = v.lane - u.lane, dy = (v.offset || 0) - (u.offset || 0);
        // Prefer reachable, less occupied opponents instead of piling onto one soldier.
        const score = (dx * dx + dy * dy * 1.1) * (1 + (v.roadEngaged || 0) * .45);
        if (score < best) { best = score; target = v; }
      });
      if (target) {
        if (target !== u.roadSeek) u.roadSlot = target.roadEngaged || 0;
        target.roadEngaged = (target.roadEngaged || 0) + 1;
      }
      u.roadSeek = target;
      u.roadSeekAt = R.ROAD.clock + .24 + u.id % 7 * .019;
    }
    let aimX, aimY;
    if (target) {
      const ranged = u.tags.includes('ranged');
      const stop = ranged ? Math.max(25, u.range * .86) : Math.max(21, u.range * .78);
      let angle = 0;
      if (!ranged && u.roadSlot > 0) {
        const sign = (u.offset || 0) === (target.offset || 0) ? (u.id % 2 ? 1 : -1) : Math.sign((u.offset || 0) - (target.offset || 0));
        angle = sign * Math.min(1.8, .65 + Math.floor((u.roadSlot - 1) / 2) * .42);
      }
      aimX = target.lane - dir * Math.cos(angle) * stop;
      aimY = (target.offset || 0) + Math.sin(angle) * stop;
    } else {
      const structure = R.targetStructure(u.side);
      aimX = structure.lane;
      aimY = Math.abs(structure.lane - u.lane) < 420 ? structure.lateral || 0 : u.roadHomeOffset ?? u.offset ?? 0;
    }
    let dx = aimX - u.lane, dy = aimY - (u.offset || 0);
    const distance = Math.hypot(dx, dy);
    if (distance < .5) return;
    let vx = dx / distance, vy = dy / distance;
    let repelX = 0, repelY = 0, obstacle = 0, wall = false;
    R.roadVisit(u, 43, v => {
      const ox = v.lane - u.lane, oy = (v.offset || 0) - (u.offset || 0);
      const d = Math.hypot(ox, oy) || .01, gap = gapFor(u, v);
      if (v.side === u.side) {
        // Preference only: friendly bodies never slow or block forward movement.
        if (d < gap + 6) repelY -= oy / d * (gap + 6 - d) / (gap + 6) * .18;
        return;
      }
      const ahead = ox * vx + oy * vy, across = Math.abs(ox * vy - oy * vx);
      if (ahead > 0 && ahead < gap + 10 && across < gap * .85) {
        obstacle = Math.max(obstacle, (1 - across / gap) * (1 - Math.max(0, ahead - gap) / 10));
        if (v.side !== u.side && v.phalanx) wall = true;
      }
      if (d < gap + 7) {
        const strength = Math.max(0, (gap + 7 - d) / (gap + 7));
        repelX -= ox / d * strength;
        repelY -= oy / d * strength;
      }
    });
    // Keep a personal passing side instead of sending every row to the road edge.
    if (!u.roadDetour) u.roadDetour = u.id % 2 ? 1 : -1;
    if (Math.abs(u.offset || 0) > R.ROAD.half - 28) u.roadDetour = -(Math.sign(u.offset) || 1);
    if (obstacle > .05) {
      vx *= 1 - obstacle * .7;
      vy += u.roadDetour * obstacle * .9;
    }
    vx += repelX * .85; vy += repelY * .85;
    const magnitude = Math.hypot(vx, vy) || 1;
    const step = Math.min(speed * dt, distance);
    dx = vx / Math.max(1, magnitude) * step;
    dy = vy / Math.max(1, magnitude) * step;
    if (wall) dx = 0;
    // Sweep against enemies so a fast mover cannot step through an opposing body.
    let fraction = 1;
    const length2 = dx*dx + dy*dy;
    if (length2 > 1e-8) R.roadVisit(u, Math.sqrt(length2)+28, v => {
      if (v.side === u.side) return;
      const ox = v.lane-u.lane, oy = (v.offset||0)-(u.offset||0), gap = gapFor(u,v);
      const dot = ox*dx+oy*dy, c = ox*ox+oy*oy-gap*gap;
      if (dot <= 0) return;
      if (c < 0) {fraction = 0;return;}
      const discriminant = dot*dot-length2*c;
      if (discriminant < 0) return;
      const entry = (dot-Math.sqrt(discriminant))/length2;
      if (entry >= 0 && entry < fraction) fraction = Math.max(0,entry-.001);
    });
    dx *= fraction;dy *= fraction;
    const old = u.lane;
    R.setBattleLane(u, R.clamp(u.lane + dx, 8, R.PATH_LENGTH - 8));
    u.offset = R.clamp((u.offset || 0) + dy, -R.ROAD.half, R.ROAD.half);
    if (u.key === 'knight') u.chargeDist += Math.abs(u.lane - old);
  };

  R.roadSeparate = function separate() {
    for (let pass = 0; pass < 2; pass++) {
      R.roadReindex();
      for (const u of R.state.units) {
        if (!u.alive) continue;
        R.roadVisit(u, 28, v => {
          if (v.id <= u.id) return;
          let dx = v.lane - u.lane, dy = (v.offset || 0) - (u.offset || 0), d = Math.hypot(dx, dy);
          const friendly = u.side === v.side;
          const gap = friendly ? 17 : gapFor(u, v);
          if (d >= gap) return;
          if (d < .001) { const angle = ((u.id * 17 + v.id * 13) % 64) / 64 * TAU; dx = Math.cos(angle); dy = Math.sin(angle); d = 1; }
          const mass = x => (anchored(x, R.ROAD.clock) ? .12 : 1) / (x.cat === 'siege' ? 2 : x.cat === 'cavalry' ? 1.5 : 1);
          const a = mass(u), b = mass(v), push = Math.min(friendly ? .25 : 5, gap - d) / (a + b);
          if (friendly) {dx = 0;dy = Math.abs(dy) < .01 ? (u.id%2?1:-1) : Math.sign(dy);d = 1;}
          const px = dx / d * push, py = dy / d * push;
          R.setBattleLane(u, R.clamp(u.lane - px * a, 8, R.PATH_LENGTH - 8));
          R.setBattleLane(v, R.clamp(v.lane + px * b, 8, R.PATH_LENGTH - 8));
          u.offset = R.clamp((u.offset || 0) - py * a, -R.ROAD.half, R.ROAD.half);
          v.offset = R.clamp((v.offset || 0) + py * b, -R.ROAD.half, R.ROAD.half);
        });
      }
    }
  };
}
