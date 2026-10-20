import { assetUrl } from '../assets/urls.js';
export function initializeCombatSuddenDeathState(runtime) {
  runtime.v494DrawTower = runtime.drawTower;
  runtime.drawTower = function (t) {
    if (!t.alive) return;
    const p = runtime.pointAt(t.lane, t.lateral || 0),
      s = t.gateTower ? 1.18 : 1,
      sudden = !!t.sdActive;
    runtime.ctx.save();
    runtime.ctx.translate(p.x, p.y);
    runtime.ctx.scale(s, s);
    runtime.ctx.fillStyle = sudden ? '#5f2270b0' : '#0007';
    runtime.ctx.beginPath();
    runtime.ctx.ellipse(3, 18, 22, 8, 0, 0, Math.PI * 2);
    runtime.ctx.fill();
    runtime.ctx.fillStyle = sudden ? t.side === 'player' ? '#7c4db4' : '#9443a6' : t.side === 'player' ? '#80978b' : '#976b67';
    runtime.ctx.fillRect(-15, -18, 30, 36);
    runtime.ctx.fillStyle = sudden ? '#e2b2ff' : t.gateTower ? '#ead184' : '#d8ca9f';
    for (let x = -15; x <= 8; x += 11) runtime.ctx.fillRect(x, -24, 7, 9);
    if (t.gateTower || sudden) {
      runtime.ctx.strokeStyle = sudden ? '#da8cff' : '#f0c96a';
      runtime.ctx.lineWidth = 2;
      runtime.ctx.strokeRect(-16, -19, 32, 38);
    }
    runtime.ctx.fillStyle = '#0a0e0b';
    runtime.ctx.fillRect(-5, -6, 10, 18);
    runtime.ctx.fillStyle = '#0b0f0c';
    runtime.ctx.fillRect(-22, 25, 44, 5);
    runtime.ctx.fillStyle = sudden ? '#d980ff' : t.side === 'player' ? '#6fa9c6' : '#db6a60';
    runtime.ctx.fillRect(-22, 25, 44 * runtime.clamp(t.hp / t.maxHp, 0, 1), 5);
    runtime.ctx.fillStyle = '#fff0c5';
    runtime.ctx.font = 'bold 9px system-ui';
    runtime.ctx.textAlign = 'center';
    runtime.ctx.fillText(t.gateTower ? 'KAPU' : 'T' + t.tier, 0, 40);
    runtime.ctx.restore();
  };
  runtime.v494UpdateHud = runtime.updateHud;
  runtime.updateHud = function () {
    runtime.v494UpdateHud();
    runtime.$('#playerHp')?.parentElement?.classList.toggle('suddenDeathHp', !!runtime.P.sdActive);
    runtime.$('#enemyHp')?.parentElement?.classList.toggle('suddenDeathHp', !!runtime.E.sdActive);
  };
  runtime.updateSuddenDeath = function (dt) {
    if (runtime.state.time < 1200) return;
    if (!runtime.state.suddenStarted) {
      runtime.state.suddenStarted = true;
      runtime.state.suddenStageIndex = -1;
      runtime.state.suddenStageTime = 0;
      runtime.activateSuddenStageV495(0, true);
    }
    let groups = runtime.suddenGroupsV495();
    let group = groups[runtime.state.suddenStageIndex] || runtime.activateSuddenStageV495(runtime.state.suddenStageIndex, true);
    if (!group) return;
    runtime.state.suddenStageTime = (runtime.state.suddenStageTime || 0) + dt;
    if (group.capital) {
      runtime.P.sdActive = runtime.E.sdActive = true;
      const pDps = Math.max(180, runtime.P.maxHp * .02) + runtime.state.suddenStageTime * 95;
      const eDps = Math.max(180, runtime.E.maxHp * .02) + runtime.state.suddenStageTime * 95;
      runtime.P.hp = Math.max(0, runtime.P.hp - pDps * dt);
      runtime.E.hp = Math.max(0, runtime.E.hp - eDps * dt);
      if (runtime.P.hp <= 0 || runtime.E.hp <= 0) {
        if (runtime.P.hp === runtime.E.hp) runtime.finish(true);else runtime.finish(runtime.E.hp <= 0);
      }
      return;
    }
    const baseDps = group.key === 't3' ? 210 : group.key === 't2' ? 235 : group.key === 't1' ? 260 : 300;
    const ramp = group.key === 'gate' ? 70 : 55;
    const dps = baseDps + runtime.state.suddenStageTime * ramp;
    let aliveTargets = 0;
    for (const t of group.targets) {
      if (!t.alive) continue;
      aliveTargets++;
      t.sdActive = true;
      t.hp = Math.max(0, t.hp - dps * dt);
      if (t.hp <= 0) {
        t.hp = 0;
        t.alive = false;
        t.sdActive = false;
        if (!t.gateTower) runtime.onTowerLost(runtime.cityForSide(t.side));
      }
    }
    if (aliveTargets === 0 || group.targets.every(t => !t.alive)) runtime.activateSuddenStageV495(runtime.state.suddenStageIndex + 1, true);
  };
}
