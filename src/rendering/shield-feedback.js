import { assetUrl } from '../assets/urls.js';
export function initializeRenderingShieldFeedback(runtime) {
  const prevDrawUnitShield = runtime.drawUnit;
  runtime.drawUnit = function (u) {
    prevDrawUnitShield(u);
    const totalShield = (u.shield || 0) + (u.tempShield || 0);
    if (!u?.alive || totalShield <= 0) return;
    const p = runtime.pointAt(u.lane, u.offset);
    const r = runtime.unitDrawRadius(u.key);
    const barW = Math.max(34, r * 2.15);
    const hpBarY = r + 6;
    const shieldBarY = hpBarY - 7;
    const maxRef = Math.max(1, u.maxHp || 1);
    const permRatio = runtime.clamp((u.shield || 0) / maxRef, 0, 1);
    const tempRatio = runtime.clamp((u.tempShield || 0) / maxRef, 0, 1 - permRatio);
    const totalRatio = runtime.clamp(totalShield / maxRef, 0, 1);
    runtime.ctx.save();
    runtime.ctx.translate(p.x, p.y);
    runtime.ctx.fillStyle = 'rgba(7,18,25,.92)';
    runtime.ctx.fillRect(-barW / 2, shieldBarY, barW, 4);
    if (permRatio > 0) {
      runtime.ctx.fillStyle = '#69d0ff';
      runtime.ctx.fillRect(-barW / 2, shieldBarY, barW * permRatio, 4);
    }
    if (tempRatio > 0) {
      runtime.ctx.fillStyle = '#b8f3ff';
      runtime.ctx.fillRect(-barW / 2 + barW * permRatio, shieldBarY, barW * tempRatio, 4);
    }
    runtime.ctx.strokeStyle = 'rgba(180,240,255,.95)';
    runtime.ctx.lineWidth = 1;
    runtime.ctx.strokeRect(-barW / 2, shieldBarY, barW * totalRatio, 4);
    runtime.ctx.font = '900 9px sans-serif';
    runtime.ctx.textAlign = 'left';
    runtime.ctx.textBaseline = 'middle';
    runtime.ctx.fillStyle = '#d8fbff';
    runtime.ctx.shadowColor = 'rgba(0,0,0,.7)';
    runtime.ctx.shadowBlur = 2;
    runtime.ctx.fillText('🛡', -barW / 2 - 10, shieldBarY + 2.5);
    runtime.ctx.textAlign = 'right';
    runtime.ctx.fillStyle = '#d5f8ff';
    runtime.ctx.fillText(String(Math.round(totalShield)), barW / 2 + 16, shieldBarY + 2.5);
    runtime.ctx.shadowBlur = 0;
    if ((u.tempShield || 0) > 0) {
      runtime.ctx.strokeStyle = 'rgba(215,251,255,.85)';
      runtime.ctx.lineWidth = 1.5;
      runtime.ctx.beginPath();
      runtime.ctx.arc(0, 0, r + 7.5, 0, Math.PI * 2);
      runtime.ctx.stroke();
    }
    runtime.ctx.restore();
  };
  window.__ROADLORDS_VERSION__ = '4.9.40-reroll-footprint-hover';
}
