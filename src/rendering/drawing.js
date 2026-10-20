import { installBattleFigures } from './battle-figures.js';
export function register(runtime) {
  runtime.pointAt = function pointAt(distance, lateral = 0) {
    const target = runtime.clamp(distance, 0, runtime.PATH_LENGTH);
    let lo = 0,
      hi = runtime.cumulative.length - 1;
    while (lo < hi) {
      const m = lo + hi >> 1;
      if (runtime.cumulative[m] < target) lo = m + 1;else hi = m;
    }
    const i = Math.max(1, lo),
      a = runtime.pathPoints[i - 1],
      b = runtime.pathPoints[i],
      seg = Math.max(.001, runtime.cumulative[i] - runtime.cumulative[i - 1]),
      r = (target - runtime.cumulative[i - 1]) / seg,
      x = a.x + (b.x - a.x) * r,
      y = a.y + (b.y - a.y) * r,
      dx = b.x - a.x,
      dy = b.y - a.y,
      mag = Math.hypot(dx, dy) || 1;
    return {
      x: x - dy / mag * lateral,
      y: y + dx / mag * lateral
    };
  };
  runtime.drawGround = function drawGround() {
    const W = runtime.canvas.width,
      H = runtime.canvas.height;
    runtime.ctx.fillStyle = '#24382a';
    runtime.ctx.fillRect(0, 0, W, H);
    const g = runtime.ctx.createRadialGradient(W / 2, H / 2, 40, W / 2, H / 2, Math.max(W, H) * .62);
    g.addColorStop(0, '#3a5538');
    g.addColorStop(1, '#18271d');
    runtime.ctx.fillStyle = g;
    runtime.ctx.fillRect(0, 0, W, H);
    runtime.ctx.globalAlpha = .12;
    runtime.ctx.fillStyle = '#c8d8b4';
    for (let i = 0; i < 145; i++) {
      const x = i * 137 % W,
        y = i * 83 % H;
      runtime.ctx.fillRect(x, y, 2, 4);
    }
    runtime.ctx.globalAlpha = 1;
  };
  runtime.strokeRoad = function strokeRoad(w, color) {
    runtime.ctx.beginPath();
    runtime.ctx.moveTo(runtime.pathPoints[0].x, runtime.pathPoints[0].y);
    for (let i = 1; i < runtime.pathPoints.length; i++) runtime.ctx.lineTo(runtime.pathPoints[i].x, runtime.pathPoints[i].y);
    runtime.ctx.lineWidth = w;
    runtime.ctx.lineCap = 'round';
    runtime.ctx.lineJoin = 'round';
    runtime.ctx.strokeStyle = color;
    runtime.ctx.stroke();
  };
  runtime.drawTower = function drawTower(t) {
    if (!t.alive) return;
    const p = runtime.pointAt(t.lane, t.lateral || 0),
      s = t.gateTower ? 1.18 : 1;
    runtime.ctx.save();
    runtime.ctx.translate(p.x, p.y);
    runtime.ctx.scale(s, s);
    runtime.ctx.fillStyle = '#0007';
    runtime.ctx.beginPath();
    runtime.ctx.ellipse(3, 18, 22, 8, 0, 0, Math.PI * 2);
    runtime.ctx.fill();
    runtime.ctx.fillStyle = t.side === 'player' ? '#80978b' : '#976b67';
    runtime.ctx.fillRect(-15, -18, 30, 36);
    runtime.ctx.fillStyle = t.gateTower ? '#ead184' : '#d8ca9f';
    for (let x = -15; x <= 8; x += 11) runtime.ctx.fillRect(x, -24, 7, 9);
    if (t.gateTower) {
      runtime.ctx.strokeStyle = '#f0c96a';
      runtime.ctx.lineWidth = 2;
      runtime.ctx.strokeRect(-16, -19, 32, 38);
    }
    runtime.ctx.fillStyle = '#0a0e0b';
    runtime.ctx.fillRect(-5, -6, 10, 18);
    runtime.ctx.fillStyle = '#0b0f0c';
    runtime.ctx.fillRect(-22, 25, 44, 5);
    runtime.ctx.fillStyle = t.side === 'player' ? '#6fa9c6' : '#db6a60';
    runtime.ctx.fillRect(-22, 25, 44 * runtime.clamp(t.hp / t.maxHp, 0, 1), 5);
    runtime.ctx.fillStyle = '#fff0c5';
    runtime.ctx.font = 'bold 9px system-ui';
    runtime.ctx.textAlign = 'center';
    runtime.ctx.fillText(t.gateTower ? 'KAPU' : 'T' + t.tier, 0, 40);
    runtime.ctx.restore();
  };
  runtime.drawGate = function drawGate() {
    const icons = {
        open: '🔓',
        closed: '🔒',
        auto: '↻'
      },
      names = {
        open: 'Nyitott',
        closed: 'Zárt',
        auto: 'Automata'
      };
    runtime.$$('[data-gate]').forEach(b => b.classList.toggle('active', b.dataset.gate === runtime.P.gateMode));
    const pg = runtime.$('#playerGate'),
      pi = runtime.$('#gateModeIcon');
    if (pg) {
      pg.dataset.mode = runtime.P.gateMode;
      pg.title = `Kapu: ${names[runtime.P.gateMode]} · kattints a váltáshoz`;
    }
    if (pi) pi.textContent = icons[runtime.P.gateMode] || '↻';
    const eg = runtime.$('#enemyGate'),
      ei = runtime.$('#enemyGateModeIcon');
    if (eg) {
      eg.dataset.mode = runtime.E.gateMode;
      eg.title = `Ellenséges kapu: ${names[runtime.E.gateMode]}`;
    }
    if (ei) ei.textContent = icons[runtime.E.gateMode] || '↻';
  };
  runtime.drawProjectiles = function drawProjectiles(dt) {
    runtime.projectiles = runtime.projectiles.filter(p => {
      p.life += dt;
      const t = runtime.clamp(p.life / p.dur, 0, 1),
        x = p.x0 + (p.x1 - p.x0) * t;
      let y = p.y0 + (p.y1 - p.y0) * t;
      if (p.kind === 'rock') y -= Math.sin(Math.PI * t) * 90;
      runtime.ctx.save();
      runtime.ctx.translate(x, y);
      if (p.kind === 'arrow') {
        const a = Math.atan2(p.y1 - p.y0, p.x1 - p.x0);
        runtime.ctx.rotate(a);
        runtime.ctx.strokeStyle = '#f4e6bd';
        runtime.ctx.lineWidth = 2.6;
        runtime.ctx.beginPath();
        runtime.ctx.moveTo(-10, 0);
        runtime.ctx.lineTo(9, 0);
        runtime.ctx.stroke();
        runtime.ctx.beginPath();
        runtime.ctx.moveTo(7, 0);
        runtime.ctx.lineTo(2, -3);
        runtime.ctx.moveTo(7, 0);
        runtime.ctx.lineTo(2, 3);
        runtime.ctx.stroke();
      } else if (p.kind === 'rock') {
        runtime.ctx.fillStyle = '#4b4b45';
        runtime.ctx.beginPath();
        runtime.ctx.arc(0, 0, 9, 0, Math.PI * 2);
        runtime.ctx.fill();
        runtime.ctx.strokeStyle = '#d2c28f';
        runtime.ctx.stroke();
      } else if (p.kind === 'fireball') {
        runtime.ctx.shadowColor = '#ff9b31';
        runtime.ctx.shadowBlur = 12;
        runtime.ctx.fillStyle = '#ffb33d';
        runtime.ctx.beginPath();
        runtime.ctx.arc(0, 0, 8, 0, Math.PI * 2);
        runtime.ctx.fill();
        runtime.ctx.fillStyle = '#fff0a8';
        runtime.ctx.beginPath();
        runtime.ctx.arc(1, -1, 2.5, 0, Math.PI * 2);
        runtime.ctx.fill();
      } else if (p.kind === 'holy' || p.kind === 'heal') {
        runtime.ctx.shadowColor = p.kind === 'heal' ? '#65ffab' : '#fff1a6';
        runtime.ctx.shadowBlur = 10;
        runtime.ctx.fillStyle = p.kind === 'heal' ? '#86e8aa' : '#ffe7a0';
        runtime.ctx.font = 'bold 18px serif';
        runtime.ctx.textAlign = 'center';
        runtime.ctx.textBaseline = 'middle';
        runtime.ctx.fillText(p.kind === 'heal' ? '✚' : '✦', 0, 0);
      }
      runtime.ctx.restore();
      if (t >= 1) {
        if (p.kind === 'rock' || p.kind === 'fireball') runtime.addImpactFx(p.endLane, p.endOffset, 'boom');else if (p.kind === 'holy' || p.kind === 'heal') runtime.addImpactFx(p.endLane, p.endOffset, 'holyburst');
        return false;
      }
      return true;
    });
  };
  runtime.drawCombatFx = function drawCombatFx(dt) {
    runtime.combatFx = runtime.combatFx.filter(f => {
      f.life -= dt;
      if (f.life <= 0) return false;
      if (f.kind === 'noop') return false;
      const p = runtime.pointAt(f.lane, f.offset);
      runtime.ctx.save();
      runtime.ctx.translate(p.x, p.y);
      runtime.ctx.globalAlpha = runtime.clamp(f.life * 4, 0, 1);
      if (f.kind === 'slash') {
        runtime.ctx.strokeStyle = '#fff0c3';
        runtime.ctx.lineWidth = 3;
        runtime.ctx.beginPath();
        runtime.ctx.arc(0, 0, 16, -1.1, .55);
        runtime.ctx.stroke();
      } else if (f.kind === 'stab') {
        runtime.ctx.strokeStyle = '#cbeeff';
        runtime.ctx.lineWidth = 3;
        runtime.ctx.beginPath();
        runtime.ctx.moveTo(-16, 5);
        runtime.ctx.lineTo(16, -5);
        runtime.ctx.stroke();
      } else if (f.kind === 'boom') {
        runtime.ctx.strokeStyle = '#ffc85a';
        runtime.ctx.lineWidth = 3;
        runtime.ctx.beginPath();
        runtime.ctx.arc(0, 0, 22 * (1.3 - f.life), 0, Math.PI * 2);
        runtime.ctx.stroke();
      } else if (f.kind === 'holyburst') {
        runtime.ctx.strokeStyle = '#fff0a8';
        runtime.ctx.lineWidth = 2;
        runtime.ctx.beginPath();
        runtime.ctx.arc(0, 0, 18 * (1.4 - f.life), 0, Math.PI * 2);
        runtime.ctx.stroke();
      }
      runtime.ctx.restore();
      return true;
    });
  };
  runtime.unitDrawRadius = function unitDrawRadius(key) {
    return key === 'catapult' ? 20 : key === 'knight' ? 17 : 14;
  };
  runtime.drawUnit = function drawUnit(u) {
    const p = runtime.pointAt(u.lane, u.offset),
      base = runtime.UNITS[u.key],
      r = runtime.unitDrawRadius(u.key),
      fontSize = u.key === 'catapult' ? 22 : u.key === 'knight' ? 20 : 17,
      barW = Math.max(34, r * 2.15),
      barY = r + 6;
    runtime.ctx.save();
    runtime.ctx.translate(p.x, p.y);
    runtime.ctx.fillStyle = '#0009';
    runtime.ctx.beginPath();
    runtime.ctx.ellipse(0, r * .64, r + 3, Math.max(6, r * .36), 0, 0, Math.PI * 2);
    runtime.ctx.fill();
    if (u.permanentTavern) {
      runtime.ctx.strokeStyle = '#ffac45aa';
      runtime.ctx.lineWidth = 4;
      runtime.ctx.beginPath();
      runtime.ctx.arc(0, 0, r + 6, 0, Math.PI * 2);
      runtime.ctx.stroke();
    }
    if (u.blessingTime > 0) {
      runtime.ctx.strokeStyle = '#fff09a';
      runtime.ctx.lineWidth = 3;
      runtime.ctx.beginPath();
      runtime.ctx.arc(0, 0, r + 9, 0, Math.PI * 2);
      runtime.ctx.stroke();
    }
    if (u.stunTime > 0) {
      runtime.ctx.fillStyle = '#bceaff66';
      runtime.ctx.beginPath();
      runtime.ctx.arc(0, 0, r + 5, 0, Math.PI * 2);
      runtime.ctx.fill();
    }
    runtime.ctx.fillStyle = runtime.unitTeamFill(u);
    runtime.ctx.beginPath();
    runtime.ctx.arc(0, 0, r, 0, Math.PI * 2);
    runtime.ctx.fill();
    runtime.ctx.strokeStyle = u.veteran ? '#ffd166' : u.phalanx ? '#8ee8ff' : base.damageType === 'magic' ? '#d89bea' : '#eadcb5';
    runtime.ctx.lineWidth = u.veteran ? 3.5 : 2.5;
    runtime.ctx.stroke();
    if (u.shield + u.tempShield > 0) {
      runtime.ctx.strokeStyle = '#91d9e9cc';
      runtime.ctx.lineWidth = 2.5;
      runtime.ctx.beginPath();
      runtime.ctx.arc(0, 0, r + 5, 0, Math.PI * 2);
      runtime.ctx.stroke();
    }
    runtime.ctx.font = `900 ${fontSize}px "Segoe UI Symbol","Arial Unicode MS",sans-serif`;
    runtime.ctx.textAlign = 'center';
    runtime.ctx.textBaseline = 'middle';
    runtime.ctx.fillStyle = '#fff7dc';
    runtime.ctx.shadowColor = '#000';
    runtime.ctx.shadowBlur = 3;
    if (!runtime.drawPencilUnitIcon(u, r)) runtime.ctx.fillText(base.battleIcon || base.icon, 0, .5);
    runtime.ctx.shadowBlur = 0;
    if (u.chargeReady || u.spearVolleyReady || u.lightningReady) {
      runtime.ctx.fillStyle = '#ffe16b';
      runtime.ctx.font = '900 10px sans-serif';
      runtime.ctx.fillText(u.lightningReady ? '⚡' : u.chargeReady ? '!' : '➶', r + 3, -r);
    }
    if (u.firstHitsRemaining > 0) {
      runtime.ctx.fillStyle = '#ffb85c';
      runtime.ctx.font = '900 8px sans-serif';
      runtime.ctx.fillText(String(u.firstHitsRemaining), -r - 2, -r);
    }
    runtime.ctx.fillStyle = '#090c0a';
    runtime.ctx.fillRect(-barW / 2, barY, barW, 5);
    runtime.ctx.fillStyle = runtime.unitTeamFill(u);
    runtime.ctx.fillRect(-barW / 2, barY, barW * runtime.clamp(u.hp / u.maxHp, 0, 1), 5);
    runtime.ctx.restore();
  };
  runtime.towerStatsV496 = function towerStatsV496(t) {
    const c = runtime.cityForSide(t.side),
      crewStacks = runtime.countNormal(c, 'tower_crews'),
      crew = 1 + .08 * crewStacks;
    return {
      crewStacks,
      damage: (t.baseDamage || 96) * crew,
      range: (t.baseRange || 165) * crew,
      cooldown: (t.baseCooldown || 1) / crew,
      attacksPerSecond: crew / (t.baseCooldown || 1),
      regen: t.regen || 0
    };
  };
  runtime.towerNameV496 = function towerNameV496(t) {
    return t.gateTower ? 'Kaputorony' : `T${t.tier} torony`;
  };
  runtime.drawTowerRangeV496 = function drawTowerRangeV496() {
    const t = runtime.selectedTowerV496();
    if (!t?.alive) return;
    const range = runtime.towerStatsV496(t).range,
      start = runtime.clamp(t.lane - range, 0, runtime.PATH_LENGTH),
      end = runtime.clamp(t.lane + range, 0, runtime.PATH_LENGTH),
      steps = Math.max(12, Math.ceil((end - start) / 12));
    runtime.ctx.save();
    runtime.ctx.beginPath();
    for (let i = 0; i <= steps; i++) {
      const p = runtime.pointAt(start + (end - start) * (i / steps));
      if (i === 0) runtime.ctx.moveTo(p.x, p.y);else runtime.ctx.lineTo(p.x, p.y);
    }
    runtime.ctx.lineCap = 'round';
    runtime.ctx.lineJoin = 'round';
    runtime.ctx.lineWidth = 92;
    runtime.ctx.strokeStyle = 'rgba(233,187,88,.18)';
    runtime.ctx.stroke();
    runtime.ctx.setLineDash([10, 8]);
    runtime.ctx.lineWidth = 2.5;
    runtime.ctx.strokeStyle = 'rgba(255,229,151,.92)';
    runtime.ctx.stroke();
    runtime.ctx.setLineDash([]);
    for (const d of [start, end]) {
      const p = runtime.pointAt(d);
      runtime.ctx.fillStyle = 'rgba(255,229,151,.92)';
      runtime.ctx.beginPath();
      runtime.ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
      runtime.ctx.fill();
    }
    runtime.ctx.restore();
  };
  runtime.towerAtCanvasPointV496 = function towerAtCanvasPointV496(x, y) {
    let best = null,
      bestD = 1e9;
    for (const t of runtime.towers) {
      if (!t.alive) continue;
      const p = runtime.pointAt(t.lane, t.lateral || 0),
        d = Math.hypot(x - p.x, y - p.y),
        hit = t.gateTower ? 37 : 31;
      if (d <= hit && d < bestD) {
        best = t;
        bestD = d;
      }
    }
    return best;
  };
  runtime.canvasPointV496 = function canvasPointV496(e) {
    const r = runtime.canvas.getBoundingClientRect();
    return {
      x: (e.clientX - r.left) * runtime.canvas.width / r.width,
      y: (e.clientY - r.top) * runtime.canvas.height / r.height
    };
  };
  runtime.unitTeamFill = function unitTeamFill(u) {
    return window.__ROADLORDS_UNIT_COLORS__?.colorFor(u.side) || (u.side === 'player' ? '#397fc1' : '#c74949');
  };
  runtime.drawPencilUnitIcon = function drawPencilUnitIcon(u, r) {
    return window.__ROADLORDS_UNIT_COLORS__?.draw(runtime.ctx, u, r) || false;
  };
  runtime.roadResize = function roadResize() {
    const oldCity=runtime.ROAD.city,oldScroll=runtime.roadWar.scrollLeft;
    const atEnd=oldScroll>0&&oldScroll>=runtime.roadWar.scrollWidth-runtime.roadWar.clientWidth-2;
    runtime.ROAD.w = Math.max(320, runtime.roadWar.clientWidth);
    runtime.ROAD.h = Math.max(260, runtime.roadWar.clientHeight);
    runtime.ROAD.city=runtime.ROAD.h;
    runtime.roadWorld.style.width=runtime.PATH_LENGTH+runtime.ROAD.city*2+'px';
    runtime.roadWorld.style.height=runtime.ROAD.h+'px';
    runtime.roadWorld.style.setProperty('--road-city-size',runtime.ROAD.city+'px');
    runtime.roadWorld.style.setProperty('--capital-gate-height',Math.max(100,Math.min(240,runtime.ROAD.city*.28))+'px');
    if(oldScroll>0&&oldCity!==runtime.ROAD.city)runtime.roadWar.scrollLeft=atEnd?runtime.roadWar.scrollWidth:oldScroll+runtime.ROAD.city-oldCity;
    if (runtime.canvas.width !== runtime.ROAD.w || runtime.canvas.height !== runtime.ROAD.h) {
      runtime.canvas.width = runtime.ROAD.w;
      runtime.canvas.height = runtime.ROAD.h;
      runtime.ROAD.ground = null;
    }
    runtime.canvas.style.setProperty('width', runtime.ROAD.w + 'px', 'important');
    runtime.canvas.style.setProperty('height', runtime.ROAD.h + 'px', 'important');
  };
  installBattleFigures(runtime);
}
