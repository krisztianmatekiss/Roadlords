import { assetUrl } from '../assets/urls.js';
export function initializeUiTowerInspection(runtime) {
  window.__ROADLORDS_VERSION__ = '4.9.6-tower-inspection';
  runtime.v495DrawTowerFinal = runtime.drawTower;
  runtime.drawTower = function (t) {
    runtime.v495DrawTowerFinal(t);
    if (!t.alive || runtime.state.selectedTowerId !== t.id) return;
    const p = runtime.pointAt(t.lane, t.lateral || 0),
      r = t.gateTower ? 32 : 27;
    runtime.ctx.save();
    runtime.ctx.translate(p.x, p.y);
    runtime.ctx.strokeStyle = '#ffe397';
    runtime.ctx.lineWidth = 3;
    runtime.ctx.setLineDash([5, 4]);
    runtime.ctx.beginPath();
    runtime.ctx.arc(0, 0, r, 0, Math.PI * 2);
    runtime.ctx.stroke();
    runtime.ctx.setLineDash([]);
    runtime.ctx.restore();
  };
  runtime.renderBattle = function (dt) {
    runtime.mpInterpolateUnits(dt);
    runtime.drawGround();
    runtime.strokeRoad(104, '#151c17');
    runtime.strokeRoad(94, '#6f6858');
    runtime.strokeRoad(82, '#a69a79');
    runtime.ctx.setLineDash([8, 13]);
    runtime.strokeRoad(1, '#e2d5b56b');
    runtime.ctx.setLineDash([]);
    runtime.drawTowerRangeV496();
    for (const t of runtime.towers) runtime.drawTower(t);
    runtime.drawProjectiles(dt);
    const units = [...runtime.state.units].sort((a, b) => runtime.pointAt(a.lane, a.offset).y - runtime.pointAt(b.lane, b.offset).y);
    for (const u of units) runtime.drawUnit(u);
    runtime.drawCombatFx(dt);
    runtime.ctx.font = 'bold 10px system-ui';
    runtime.ctx.textAlign = 'center';
    runtime.particles = runtime.particles.filter(p => {
      p.life -= dt;
      p.y -= dt * 25;
      if (p.life <= 0) return false;
      runtime.ctx.globalAlpha = runtime.clamp(p.life * 1.5, 0, 1);
      runtime.ctx.fillStyle = p.color;
      runtime.ctx.fillText(p.text, p.x, p.y);
      return true;
    });
    runtime.ctx.globalAlpha = 1;
  };
  runtime.v495RenderInspectorFinal = runtime.renderInspector;
  runtime.renderInspector = function () {
    if (runtime.state.selectedBuilding || runtime.state.selectedBuild) runtime.state.selectedTowerId = null;
    const t = runtime.selectedTowerV496();
    if (t?.alive) return runtime.renderTowerInspectorV496(t);
    if (runtime.state.selectedTowerId && !t) runtime.state.selectedTowerId = null;
    return runtime.v495RenderInspectorFinal();
  };
  runtime.v495PositionInspectorFinal = runtime.positionInspector;
  runtime.positionInspector = function () {
    const t = runtime.selectedTowerV496(),
      el = runtime.$('#inspector');
    if (!t || runtime.state.selectedBuilding) return runtime.v495PositionInspectorFinal();
    if (!el?.classList.contains('show')) return;
    const br = runtime.canvas.getBoundingClientRect(),
      p = runtime.pointAt(t.lane, t.lateral || 0),
      cx = br.left + p.x / runtime.canvas.width * br.width,
      cy = br.top + p.y / runtime.canvas.height * br.height,
      w = el.offsetWidth || 330,
      h = el.offsetHeight || 320,
      gap = 18;
    let left = t.side === 'player' ? cx + gap : cx - w - gap;
    if (left < 10) left = cx + gap;
    if (left + w > window.innerWidth - 10) left = cx - w - gap;
    left = runtime.clamp(left, 10, window.innerWidth - w - 10);
    const top = runtime.clamp(cy - h / 2, 74, window.innerHeight - h - 10);
    el.style.left = Math.round(left) + 'px';
    el.style.top = Math.round(top) + 'px';
  };
  runtime.canvas.addEventListener('click', e => {
    const p = runtime.canvasPointV496(e),
      t = runtime.towerAtCanvasPointV496(p.x, p.y);
    if (!t) return;
    runtime.state.selectedBuild = null;
    runtime.state.selectedBuilding = null;
    runtime.state.selectedTowerId = t.id;
    runtime.clearPlacementPreview();
    runtime.renderInspector();
  });
  runtime.canvas.addEventListener('mousemove', e => {
    const p = runtime.canvasPointV496(e);
    runtime.canvas.style.cursor = runtime.towerAtCanvasPointV496(p.x, p.y) ? 'pointer' : 'default';
  });
  runtime.canvas.addEventListener('mouseleave', () => {
    runtime.canvas.style.cursor = 'default';
  });
}
