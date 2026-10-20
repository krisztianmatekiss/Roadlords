import { assetUrl } from '../assets/urls.js';
export function initializeUiInitialControls(runtime) {
  runtime.PICK_INPUT_GUARD_MS = 600;
  runtime.pickInputGuard = {
    context: null,
    options: null,
    signature: '',
    remaining: null,
    armedAt: -Infinity,
    until: 0,
    pointerDown: -Infinity
  };
  document.addEventListener('pointerdown', e => {
    if (e.isPrimary !== false) runtime.pickInputGuard.pointerDown = performance.now();
  }, true);
  window.addEventListener('click', e => {
    if (!runtime.state.choiceContext || !runtime.protectedPickControl(e.target)) return;
    const locked = performance.now() < runtime.pickInputGuard.until;
    const oldPress = e.detail > 0 && runtime.pickInputGuard.pointerDown < runtime.pickInputGuard.until;
    if (locked || oldPress || e.detail > 1) {
      e.preventDefault();
      e.stopImmediatePropagation();
    }
  }, true);
  window.addEventListener('keydown', e => {
    if (runtime.state.choiceContext && runtime.protectedPickControl(e.target) && (e.key === 'Enter' || e.key === ' ') && (e.repeat || performance.now() < runtime.pickInputGuard.until)) {
      e.preventDefault();
      e.stopImmediatePropagation();
    }
  }, true);
  runtime.terrainTooltip = document.createElement('div');
  runtime.terrainTooltip.className = 'terrainTooltip';
  document.body.appendChild(runtime.terrainTooltip);
  runtime.last = performance.now();
  runtime.acc = 0;
  runtime.uiAcc = 0;
  runtime.$$('[data-gate]').forEach(b => b.onclick = e => {
    e.stopPropagation();
    runtime.setGate(b.dataset.gate);
    runtime.$('#playerGate')?.classList.remove('menu-open');
  });
  runtime.playerGate = runtime.$('#playerGate');
  if (runtime.playerGate) {
    const toggleGateMenu = e => {
      if (e?.target?.closest?.('[data-gate]')) return;
      e?.stopPropagation?.();
      runtime.playerGate.classList.toggle('menu-open');
    };
    runtime.playerGate.addEventListener('click', toggleGateMenu);
    runtime.playerGate.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggleGateMenu(e);
      }
    });
    document.addEventListener('click', e => {
      if (!runtime.playerGate.contains(e.target)) runtime.playerGate.classList.remove('menu-open');
    });
  }
  runtime.rotateBtn = runtime.$('#rotateBuild');
  if (runtime.rotateBtn) runtime.rotateBtn.onclick = runtime.rotateSelectedBuild;
  runtime.$('#playerGrid').addEventListener('contextmenu', e => {
    if (!runtime.state.selectedBuild || runtime.rotationOptions(runtime.state.selectedBuild).length < 2) return;
    e.preventDefault();
    const cell = e.target.closest('.plot,.buildingHitCell');
    if (cell) {
      const row = +cell.dataset.r,
        col = +cell.dataset.c;
      runtime.state.placementHover = {
        row,
        col
      };
      runtime.state.lastPlacementHover = {
        row,
        col
      };
    }
    runtime.rotateSelectedBuild();
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !runtime.state.modal && runtime.state.selectedBuilding) {
      runtime.closeBuildingInspector();
      return;
    }
  });
  runtime.$$('.tab').forEach(b => b.onclick = () => {
    runtime.state.category = b.dataset.cat;
    runtime.$$('.tab').forEach(x => x.classList.toggle('active', x === b));
    runtime.renderBuildList();
  });
  runtime.$('#pauseBtn').onclick = () => {
    if (runtime.state.startChoices > 0 || runtime.state.ended) return;
    if (runtime.state.modal) {
      runtime.toast('Előbb válaszd ki vagy rejtsd el a várakozó picket.');
      return;
    }
    runtime.state.running = !runtime.state.running;
    runtime.$('#pauseBtn').classList.toggle('on', !runtime.state.running);
    runtime.$('#pauseBtn').textContent = runtime.state.running ? 'Ⅱ' : '▶';
  };
  runtime.$('#speedBtn').onclick = () => {
    runtime.state.speed = runtime.state.speed === 1 ? 2 : runtime.state.speed === 2 ? 4 : 1;
    runtime.$('#speedBtn').textContent = runtime.state.speed + '×';
  };
  runtime.$('#rerollChoice').onclick = runtime.rerollCurrentChoice;
  runtime.$('#banChoice').onclick = () => {
    if (runtime.$('#banChoice').disabled) return;
    runtime.state.banMode = !runtime.state.banMode;
    runtime.renderChoiceContext();
  };
  runtime.$('#relicBtn').onclick = () => {
    runtime.renderRelics();
    runtime.$('#relicOverlay').classList.remove('hidden');
  };
  runtime.$('#closeRelics').onclick = () => runtime.$('#relicOverlay').classList.add('hidden');
  runtime.$('#restartBtn').onclick = () => location.reload();
  runtime.$('#buildPrev').onclick = () => runtime.$('#buildList').scrollBy({
    left: -220,
    behavior: 'smooth'
  });
  runtime.$('#buildNext').onclick = () => runtime.$('#buildList').scrollBy({
    left: 220,
    behavior: 'smooth'
  });
}
