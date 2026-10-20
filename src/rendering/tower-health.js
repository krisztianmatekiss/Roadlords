import { assetUrl } from '../assets/urls.js';
export function initializeRenderingTowerHealth(runtime) {
  const prevDrawTowerHp = runtime.drawTower;
  function shortTowerHp(v) {
    v = Math.max(0, Number(v) || 0);
    if (v >= 1000) {
      const k = v / 1000;
      return (k >= 10 ? k.toFixed(1) : k.toFixed(1)).replace('.0', '') + 'k';
    }
    return String(Math.ceil(v));
  }
  runtime.drawTower = function (t) {
    prevDrawTowerHp(t);
    if (!t?.alive) return;
    const p = runtime.pointAt(t.lane, t.lateral || 0);
    const y = t.gateTower ? -38 : -33;
    const label = `${shortTowerHp(t.hp)} / ${shortTowerHp(t.maxHp)}`;
    runtime.ctx.save();
    runtime.ctx.translate(p.x, p.y);
    runtime.ctx.font = '800 8px system-ui';
    runtime.ctx.textAlign = 'center';
    runtime.ctx.textBaseline = 'middle';
    const w = Math.max(42, runtime.ctx.measureText(label).width + 8);
    runtime.ctx.fillStyle = 'rgba(8,12,10,.78)';
    runtime.ctx.fillRect(-w / 2, y - 6, w, 12);
    runtime.ctx.strokeStyle = t.side === 'player' ? 'rgba(124,196,238,.65)' : 'rgba(255,129,119,.65)';
    runtime.ctx.lineWidth = 1;
    runtime.ctx.strokeRect(-w / 2 + .5, y - 5.5, w - 1, 11);
    runtime.ctx.fillStyle = '#fff2cf';
    runtime.ctx.fillText(label, 0, y + .3);
    runtime.ctx.restore();
  };
  window.__ROADLORDS_VERSION__ = '4.9.34-tower-hp-display';
}
