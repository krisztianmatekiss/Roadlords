import { assetUrl } from '../assets/urls.js';
export function initializeCombatSuddenDeathTiming(runtime) {
  runtime.updateSuddenDeath = function (dt) {
    if (runtime.state.time < 1200 || runtime.state.ended || dt <= 0 || runtime.MP.enabled && runtime.MP.role === 'guest') return;
    if (!runtime.state.suddenStarted) {
      runtime.state.suddenStarted = true;
      runtime.showSuddenOverlay('A védelem mindkét oldalon külön, folyamatosan fogy.', 2800);
      runtime.message('HIRTELEN HALÁL', 4);
    }
    if (!runtime.state.suddenSides) runtime.state.suddenSides = {
      player: {
        index: 0,
        elapsed: 0
      },
      enemy: {
        index: 0,
        elapsed: 0
      }
    };
    for (const t of runtime.towers) t.sdActive = false;
    runtime.P.sdActive = runtime.E.sdActive = false;
    const elapsed = Math.min(dt, Math.max(0, runtime.state.time - 1200));
    for (const side of ['player', 'enemy']) {
      runtime.drainSuddenSide(side, elapsed);
      const group = runtime.advanceSuddenSide(side, runtime.state.suddenSides[side]);
      if (group.capital) runtime.cityForSide(side).sdActive = true;else for (const t of group.targets) t.sdActive = true;
    }
    if (runtime.P.hp <= 0 || runtime.E.hp <= 0) runtime.finish(runtime.E.hp <= 0);
  };
  runtime.v495UpdateHudFinal = runtime.updateHud;
  runtime.updateHud = function () {
    runtime.v495UpdateHudFinal();
    const t = runtime.selectedTowerV496();
    if (runtime.state.selectedTowerId && !t?.alive) {
      runtime.state.selectedTowerId = null;
      runtime.$('#inspector')?.classList.remove('show');
      return;
    }
    if (t) {
      const hp = runtime.$('#towerHpStat');
      if (hp) hp.textContent = `${Math.ceil(t.hp)} / ${Math.ceil(t.maxHp)} · ${Math.round(t.maxHp ? t.hp / t.maxHp * 100 : 0)}%`;
    }
  };
  window.__ROADLORDS_VERSION__ = '4.9.7-qol';
}
