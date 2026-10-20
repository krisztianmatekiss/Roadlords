import { assetUrl } from '../assets/urls.js';
export function initializeAiMercenaryPlanning(runtime) {
  const oldSustainableSpawnerV4966 = runtime.sustainableSpawner;
  runtime.sustainableSpawner = function (type) {
    const d = runtime.BUILDINGS[type];
    if (!d) return false;
    if (!d.unit) return true;
    if (!runtime.UNITS[d.unit]) return false;
    return oldSustainableSpawnerV4966(type);
  };
  const oldEnemyBuildAIV4966 = runtime.enemyBuildAI;
  runtime.enemyBuildAI = function (dt) {
    runtime.E.aiMercTentThinkV4966 = Math.max(0, (Number(runtime.E.aiMercTentThinkV4966) || 0) - Math.max(0, dt || 0));
    if (!runtime.MP?.enabled && runtime.E.aiMercTentThinkV4966 <= 0 && runtime.E.unlocked?.has('merc_tent') && !runtime.hasBuilding(runtime.E, 'merc_tent') && runtime.activeSpawners(runtime.E).length >= 2) {
      runtime.E.aiMercTentThinkV4966 = 5;
      if (runtime.aiBuild('merc_tent')) return;
    }
    return oldEnemyBuildAIV4966(dt);
  };
  const oldToastV4966 = runtime.toast;
  runtime.toast = function (text) {
    if (String(text || '').includes('futási hibát kivédtem')) return;
    return oldToastV4966(text);
  };
  const styleV4966 = document.createElement('style');
  styleV4966.textContent = `
    .toast{top:calc(clamp(64px,3.33vw,128px) + 10px)!important}
  `;
  document.head.appendChild(styleV4966);
  window.__ROADLORDS_DIAGNOSTICS__ = () => runtime.state.lastRuntimeErrorV4965 || null;
  const brandSmall = document.querySelector('.brand small');
  if (brandSmall) brandSmall.textContent = 'V4.9.66 · P2P 1V1';
  if (runtime.MP?.lobby) {
    const ver = runtime.MP.lobby.querySelector('.menuVersion');
    if (ver) ver.textContent = 'V4.9.66 · P2P';
  }
  document.title = 'Roadlords V4.9.66 – AI mercenary crash fix';
  window.__ROADLORDS_VERSION__ = '4.9.66-ai-merc-crash-fix';
}
