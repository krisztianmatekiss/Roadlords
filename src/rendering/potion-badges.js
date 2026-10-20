import { assetUrl } from '../assets/urls.js';
export function initializeRenderingPotionBadges(runtime) {
  const POTION_COLORS = {
    damage: '#ff665e',
    hp: '#68d982',
    attack_speed: '#ffd35f',
    movement: '#63c8ff',
    regen: '#c989ff'
  };
  const POTION_CYCLE_SECONDS = .8;
  function unitAlchemyEffectsV4962(u) {
    const arr = Array.isArray(u?.alchemyEffects) ? u.alchemyEffects.filter(id => POTION_COLORS[id]) : [];
    if (arr.length) return arr;
    if (u?.alchemyEffect && POTION_COLORS[u.alchemyEffect]) return [u.alchemyEffect];
    return [];
  }
  function drawPotionBadgeV4962(u) {
    const effects = unitAlchemyEffectsV4962(u);
    if (!effects.length || !u.alive) return;
    const p = runtime.pointAt(u.lane, u.offset),
      r = runtime.unitDrawRadius(u.key);
    const cycleIndex = effects.length > 1 ? Math.floor((runtime.state.time || 0) / POTION_CYCLE_SECONDS) % effects.length : 0;
    const color = POTION_COLORS[effects[cycleIndex]] || '#fff';
    const x = p.x - r - 7,
      y = p.y - r - 10;
    runtime.ctx.save();
    runtime.ctx.translate(x, y);
    runtime.ctx.lineJoin = 'round';
    runtime.ctx.lineCap = 'round';
    runtime.ctx.fillStyle = '#101712e8';
    runtime.ctx.strokeStyle = '#050907cc';
    runtime.ctx.lineWidth = 2;
    runtime.ctx.beginPath();
    runtime.ctx.roundRect(-4, -5, 8, 5, 2);
    runtime.ctx.fill();
    runtime.ctx.stroke();
    runtime.ctx.fillStyle = color;
    runtime.ctx.shadowColor = color;
    runtime.ctx.shadowBlur = 5;
    runtime.ctx.beginPath();
    runtime.ctx.moveTo(-3, -1);
    runtime.ctx.lineTo(-6, 5);
    runtime.ctx.quadraticCurveTo(-7, 9, -2, 10);
    runtime.ctx.lineTo(2, 10);
    runtime.ctx.quadraticCurveTo(7, 9, 6, 5);
    runtime.ctx.lineTo(3, -1);
    runtime.ctx.closePath();
    runtime.ctx.fill();
    runtime.ctx.shadowBlur = 0;
    runtime.ctx.strokeStyle = '#f6f1d6';
    runtime.ctx.lineWidth = 1.25;
    runtime.ctx.stroke();
    runtime.ctx.fillStyle = '#ffffff99';
    runtime.ctx.beginPath();
    runtime.ctx.arc(-2, 4, 1.1, 0, Math.PI * 2);
    runtime.ctx.fill();
    if (effects.length > 1) {
      runtime.ctx.fillStyle = '#0b100dcc';
      runtime.ctx.strokeStyle = '#f0dd88';
      runtime.ctx.lineWidth = 1;
      runtime.ctx.beginPath();
      runtime.ctx.arc(6, -4, 4, 0, Math.PI * 2);
      runtime.ctx.fill();
      runtime.ctx.stroke();
      runtime.ctx.fillStyle = '#fff4c7';
      runtime.ctx.font = '900 6px sans-serif';
      runtime.ctx.textAlign = 'center';
      runtime.ctx.textBaseline = 'middle';
      runtime.ctx.fillText(String(effects.length), 6, -4.2);
    }
    runtime.ctx.restore();
  }
  const oldDrawUnitV4962 = runtime.drawUnit;
  runtime.drawUnit = function (u) {
    oldDrawUnitV4962(u);
  };
  const brandSmall = document.querySelector('.brand small');
  if (brandSmall) brandSmall.textContent = 'V4.9.62 · P2P 1V1';
  if (runtime.MP?.lobby) {
    const ver = runtime.MP.lobby.querySelector('.menuVersion');
    if (ver) ver.textContent = 'V4.9.62 · P2P';
  }
  document.title = 'Roadlords V4.9.62 – Potion unit ikonok';
  window.__ROADLORDS_VERSION__ = '4.9.62-potion-unit-icons';
}
