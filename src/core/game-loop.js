import { assetUrl } from '../assets/urls.js';
export function initializeCoreGameLoop(runtime) {
  let v4965ErrorCount = 0;
  let v4965LastErrorToast = -1e9;
  function visibleV4965(el) {
    return !!el && !el.classList.contains('hidden') && getComputedStyle(el).display !== 'none';
  }
  function reconcileRunStateV4965() {
    if (runtime.state.roadTest) return;
    if (runtime.state.ended) return;
    const choice = runtime.$('#choiceOverlay');
    const reminder = runtime.$('#pickReminder');
    const alchemy = document.getElementById('alchemyRecipeModalV4961');
    const end = runtime.$('#endOverlay');
    const choiceVisible = visibleV4965(choice);
    const reminderVisible = visibleV4965(reminder);
    const alchemyVisible = visibleV4965(alchemy);
    const endVisible = visibleV4965(end);
    if (runtime.state.choiceContext && !choiceVisible && !reminderVisible && !alchemyVisible && runtime.state.startChoices <= 0) {
      reminder?.classList.remove('hidden');
      runtime.updatePickReminder?.();
    }
    const minimizedChoice = !!runtime.state.choiceContext && !choiceVisible && visibleV4965(reminder);
    const shouldBlock = choiceVisible || alchemyVisible || endVisible;
    if (shouldBlock && !runtime.state.modal) runtime.state.modal = true;
    if (runtime.state.modal && !shouldBlock && !minimizedChoice && !runtime.state.choiceContext) {
      runtime.state.modal = false;
      runtime.state._alchemyPrevModal = false;
    }
    const pause = runtime.$('#pauseBtn');
    const pauseLooksRunning = !!pause && !pause.classList.contains('on') && pause.textContent !== '▶';
    if (!runtime.MP?.enabled && !runtime.state.pregame && runtime.state.startChoices <= 0 && !runtime.state.running && pauseLooksRunning && !shouldBlock) {
      runtime.state.running = true;
    }
  }
  runtime.frame = function (now) {
    try {
      reconcileRunStateV4965();
      const raw = Math.min(.08, Math.max(0, (now - runtime.last) / 1000));
      runtime.last = now;
      const dt = raw * runtime.state.speed;
      runtime.acc += dt;
      runtime.uiAcc += raw;
      const fixed = 1 / 30;
      let guard = 0;
      while (runtime.acc >= fixed && guard++ < 240) {
        try {
          runtime.tick(fixed);
        } catch (error) {
          v4965ErrorCount++;
          runtime.state.lastRuntimeErrorV4965 = {
            time: runtime.state.time,
            message: String(error?.message || error),
            stack: String(error?.stack || ''),
            count: v4965ErrorCount
          };
          console.error('Roadlords V4.9.65 tick-védelem:', error);
          runtime.acc = 0;
          if (performance.now() - v4965LastErrorToast > 2500) {
            v4965LastErrorToast = performance.now();
            runtime.toast('⚠ Egy futási hibát kivédtem · a játékciklus tovább fut.');
          }
          break;
        }
        runtime.acc -= fixed;
      }
      if (guard >= 240) runtime.acc = 0;
      try {
        runtime.renderBattle(raw);
      } catch (error) {
        v4965ErrorCount++;
        runtime.state.lastRuntimeErrorV4965 = {
          time: runtime.state.time,
          message: String(error?.message || error),
          stack: String(error?.stack || ''),
          count: v4965ErrorCount
        };
        console.error('Roadlords V4.9.65 render-védelem:', error);
      }
      if (runtime.uiAcc >= .15) {
        runtime.uiAcc = 0;
        try {
          runtime.updateHud();
          runtime.updateProgress();
          if (Math.floor(runtime.state.time * 2) % 2 === 0) runtime.renderCity(runtime.$('#enemyGrid'), runtime.E, false);
        } catch (error) {
          v4965ErrorCount++;
          runtime.state.lastRuntimeErrorV4965 = {
            time: runtime.state.time,
            message: String(error?.message || error),
            stack: String(error?.stack || ''),
            count: v4965ErrorCount
          };
          console.error('Roadlords V4.9.65 UI-védelem:', error);
        }
      }
    } catch (error) {
      v4965ErrorCount++;
      runtime.state.lastRuntimeErrorV4965 = {
        time: runtime.state.time,
        message: String(error?.message || error),
        stack: String(error?.stack || ''),
        count: v4965ErrorCount
      };
      console.error('Roadlords V4.9.65 frame-védelem:', error);
      runtime.acc = 0;
      runtime.uiAcc = 0;
      runtime.last = now;
    } finally {
      requestAnimationFrame(runtime.frame);
    }
  };
  const brandSmall = document.querySelector('.brand small');
  if (brandSmall) brandSmall.textContent = 'V4.9.65 · P2P 1V1';
  if (runtime.MP?.lobby) {
    const ver = runtime.MP.lobby.querySelector('.menuVersion');
    if (ver) ver.textContent = 'V4.9.65 · P2P';
  }
  document.title = 'Roadlords V4.9.65 – Game loop watchdog';
  window.__ROADLORDS_VERSION__ = '4.9.65-gameloop-watchdog';
}
