import { assetUrl } from '../assets/urls.js';
export function initializeProgressionRerolls(runtime) {
  runtime.rerollCurrentChoice = function () {
    const c = runtime.state.choiceContext;
    if (!c || runtime.P.rerolls <= 0) return;
    runtime.P.rerolls--;
    runtime.state.banMode = false;
    c.opts = runtime.makeChoiceOptions(runtime.P, c.source, c.tier, c.subtype, c.opts.map(runtime.choiceKey), c.opts.map(o=>o.rarity));
    runtime.renderChoiceContext();
    runtime.toast('Újrasorsolás felhasználva.');
  };
  const rerollBtn = runtime.$('#rerollChoice');
  if (rerollBtn) rerollBtn.onclick = runtime.rerollCurrentChoice;
  window.__ROADLORDS_VERSION__ = '4.9.36-spear-brace-nerf';
}
