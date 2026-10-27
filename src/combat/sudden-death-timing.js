import { ECONOMY_BALANCE } from '../data/economy-balance.js';
export function initializeCombatSuddenDeathTiming(runtime) {
  const resetIfNewMatch = () => {
    if (runtime.state.time >= ECONOMY_BALANCE.suddenDeathAt || !runtime.state.suddenStarted) return;
    runtime.state.suddenStarted = false;
    delete runtime.state.suddenSides;
    runtime.P.sdActive = runtime.E.sdActive = false;
    for (const tower of runtime.towers) tower.sdActive = false;
    runtime.$('#suddenOverlay')?.classList.remove('show');
  };
  runtime.updateSuddenDeath = function (dt) {
    resetIfNewMatch();
    if (runtime.state.time < ECONOMY_BALANCE.suddenDeathAt || runtime.state.ended || dt <= 0 || runtime.MP.enabled && runtime.MP.role === 'guest') return;
    if (!runtime.state.suddenStarted) {
      runtime.state.suddenStarted = true;
      runtime.showSuddenOverlay('Először a tornyok, aztán a kapu és a főváros életereje fogy.', 2800);
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
    const elapsed = Math.min(dt, Math.max(0, runtime.state.time - ECONOMY_BALANCE.suddenDeathAt));
    for (const side of ['player', 'enemy']) {
      runtime.drainSuddenSide(side, elapsed);
      const group = runtime.advanceSuddenSide(side, runtime.state.suddenSides[side]);
      if (group.capital) runtime.cityForSide(side).sdActive = true;else for (const t of group.targets) t.sdActive = true;
    }
    if (runtime.P.hp <= 0 || runtime.E.hp <= 0) runtime.finish(runtime.E.hp <= 0);
  };
  const snapshot = runtime.mpApplySnapshot;
  runtime.mpApplySnapshot = data => {
    const before = !!runtime.state.suddenStarted;
    const out = snapshot(data);
    if (runtime.MP.role === 'guest' && !before && runtime.state.suddenStarted)
      runtime.showSuddenOverlay('Először a tornyok, aztán a kapu és a főváros életereje fogy.', 4000);
    return out;
  };
  runtime.v495UpdateHudFinal = runtime.updateHud;
  runtime.updateHud = function () {
    resetIfNewMatch();
    runtime.v495UpdateHudFinal();
    const t = runtime.selectedTowerV496();
    if (runtime.state.selectedTowerId && !t?.alive) {
      runtime.state.selectedTowerId = null;
      runtime.$('#inspector')?.classList.remove('show');
      return;
    }
    document.querySelector('#suddenOverlay')?.classList.toggle('hidden', !runtime.state.suddenStarted);
    for (const [id, c] of [['#playerHp', runtime.P], ['#enemyHp', runtime.E]])
      runtime.$(id)?.parentElement?.classList.toggle('suddenDeathHp', !!c.sdActive);
    if (t) {
      const hp = runtime.$('#towerHpStat');
      hp?.classList.toggle('suddenDeathHp',!!t.sdActive);
      if (hp) hp.textContent = `${Math.ceil(t.hp)} / ${Math.ceil(t.maxHp)} · ${Math.round(t.maxHp ? t.hp / t.maxHp * 100 : 0)}%`;
    }
  };
  window.__ROADLORDS_VERSION__ = '4.9.7-qol';
}
