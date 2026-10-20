import { assetUrl } from '../assets/urls.js';
export function initializeUiChoiceLayout(runtime) {
  const style = document.createElement('style');
  style.textContent = "@import url(\"" + (assetUrl("styles/features/ui-choice-layout-17.css") + "\");");
  document.head.appendChild(style);
  runtime.updateChoiceTools = function () {
    const c = runtime.state.choiceContext;
    if (!c) return;
    const canBan = !c.legendary && c.opts.some(o => o.kind === 'normal') && runtime.P.bans > 0;
    const rerollBtn = runtime.$('#rerollChoice'),
      banBtn = runtime.$('#banChoice'),
      skipBtn = runtime.$('#skipChoice');
    if (rerollBtn) {
      rerollBtn.disabled = runtime.P.rerolls <= 0;
      rerollBtn.innerHTML = '<span class="dockIcon" aria-hidden="true"><svg class="rerollSvg" viewBox="0 0 40 40" aria-hidden="true"><path d="M8.5 18.5A12.5 12.5 0 0 1 29 9.5"/><path d="M28.8 5.7l1.1 7.1-7.1-1.1"/><path d="M31.5 21.5A12.5 12.5 0 0 1 11 30.5"/><path d="M11.2 34.3l-1.1-7.1 7.1 1.1"/></svg></span><span class="dockCount" id="rerollCount">' + runtime.P.rerolls + '</span>';
      rerollBtn.title = `Újrasorsolás · ${runtime.P.rerolls}`;
    }
    if (banBtn) {
      banBtn.disabled = !canBan;
      banBtn.classList.toggle('active', runtime.state.banMode);
      banBtn.innerHTML = '<span class="dockIcon" aria-hidden="true">⊘</span><span class="dockCount" id="banCount">' + runtime.P.bans + '</span>';
      banBtn.title = runtime.state.banMode ? `Kitiltási mód aktív · ${runtime.P.bans}` : `Kitiltás · ${runtime.P.bans}`;
    }
    if (skipBtn) {
      skipBtn.disabled = false;
      skipBtn.title = 'Kihagyás';
    }
    runtime.$('#choiceTokens').innerHTML = `↻ <b>${runtime.P.rerolls}</b> újrasorsolás · ⊘ <b>${runtime.P.bans}</b> kitiltás`;
    runtime.$('#choiceBanHint').textContent = runtime.state.banMode ? 'Kattints egy halmozható fejlesztésre. Erre a menetre végleg eltűnik.' : '';
  };
  function skipCurrentChoice() {
    if (!runtime.state.choiceContext) return;
    runtime.toast('Választás kihagyva.');
    runtime.finalizeChoiceEvent();
  }
  const skipBtn = runtime.$('#skipChoice');
  if (skipBtn) skipBtn.onclick = skipCurrentChoice;
  const minimize = runtime.$('#minimizeChoice');
  if (minimize) minimize.innerHTML = '<span aria-hidden="true">👁</span>';
}
