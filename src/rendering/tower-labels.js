import { assetUrl } from '../assets/urls.js';
export function initializeRenderingTowerLabels(runtime) {
  const drawTowerV4970 = runtime.drawTower;
  runtime.drawTower = function (t) {
    drawTowerV4970(t);
    if (!t?.alive) return;
    const mode = document.body.dataset.uiScale || 'normal';
    if (mode === 'normal') return;
    const p = runtime.pointAt(t.lane, t.lateral || 0),
      y = t.gateTower ? -38 : -33;
    const short = v => {
      v = Math.max(0, Number(v) || 0);
      if (v >= 1000) {
        const k = v / 1000;
        return k.toFixed(1).replace('.0', '') + 'k';
      }
      return String(Math.ceil(v));
    };
    const label = `${short(t.hp)} / ${short(t.maxHp)}`;
    const fs = mode === 'tv' ? 14 : 11,
      boxH = mode === 'tv' ? 21 : 17,
      pad = mode === 'tv' ? 12 : 9;
    runtime.ctx.save();
    runtime.ctx.translate(p.x, p.y);
    runtime.ctx.font = `900 ${fs}px system-ui`;
    runtime.ctx.textAlign = 'center';
    runtime.ctx.textBaseline = 'middle';
    const w = Math.max(mode === 'tv' ? 64 : 52, runtime.ctx.measureText(label).width + pad);
    runtime.ctx.fillStyle = 'rgba(8,12,10,.94)';
    runtime.ctx.fillRect(-w / 2, y - boxH / 2, w, boxH);
    runtime.ctx.strokeStyle = t.side === 'player' ? 'rgba(124,196,238,.9)' : 'rgba(255,129,119,.9)';
    runtime.ctx.lineWidth = 1.4;
    runtime.ctx.strokeRect(-w / 2 + .7, y - boxH / 2 + .7, w - 1.4, boxH - 1.4);
    runtime.ctx.fillStyle = '#fff2cf';
    runtime.ctx.fillText(label, 0, y + .4);
    runtime.ctx.restore();
  };
}
