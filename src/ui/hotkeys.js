import { assetUrl } from '../assets/urls.js';
export function initializeUiHotkeys(runtime) {
  const style = document.createElement('style');
  style.textContent = "@import url(\"" + (assetUrl("styles/features/ui-hotkeys-11.css") + "\");");
  document.head.appendChild(style);
  const categoryKeys = {
    all: 'Q',
    economy: 'W',
    military: 'E',
    support: 'R'
  };
  const categoryByKey = {
    q: 'all',
    w: 'economy',
    e: 'military',
    r: 'support'
  };
  let shiftHeld = false;
  function typingTarget(el) {
    return !!el?.closest?.('input,textarea,select,[contenteditable="true"]');
  }
  function menuVisible() {
    const lobby = runtime.MP?.lobby;
    return !!(lobby && getComputedStyle(lobby).display !== 'none');
  }
  function overlayBlocksHotkeys() {
    if (menuVisible()) return true;
    if (runtime.state.ended) return true;
    if (runtime.state.modal) return true;
    const relic = runtime.$('#relicOverlay');
    return !!(relic && !relic.classList.contains('hidden'));
  }
  function decorate() {
    runtime.$$('.tab[data-cat]').forEach(tab => {
      const key = categoryKeys[tab.dataset.cat];
      if (!key) return;
      const label = tab.dataset.cat === 'all' ? 'Mind' : tab.dataset.cat === 'economy' ? 'Gazdaság' : tab.dataset.cat === 'military' ? 'Hadsereg' : 'Támogatás';
      tab.innerHTML = `<span class="tabHotkey">${key}</span>${label}`;
      tab.title = `${key} · ${label}`;
    });
    runtime.$$('#buildList .buildcard').forEach((card, i) => {
      card.querySelector('.buildHotkey')?.remove();
      const badgeHost = card.closest('.buildSlot')?.querySelector('.buildSlotBadges') || card;
      badgeHost.querySelector('.buildHotkey')?.remove();
      if (i < 9) {
        const badge = document.createElement('span');
        badge.className = 'buildHotkey';
        badge.textContent = String(i + 1);
        badgeHost.appendChild(badge);
        card.title = `${i + 1} · ${card.title || ''}`;
      }
    });
    const rotate = runtime.$('#rotatePlacement');
    if (rotate) {
      rotate.textContent = '↻ FORGATÁS (jobb klikk)';
      rotate.title = 'Forgatás · jobb klikk az építési mezőn';
    }
    const hint = runtime.$('#placementHint');
    if (hint?.classList.contains('show')) {
      const first = hint.querySelector('span');
      if (first && !first.dataset.v4917shift) {
        first.dataset.v4917shift = '1';
        first.textContent += ' · SHIFT: folyamatos építés';
      }
    }
  }
  const oldRenderBuildList = runtime.renderBuildList;
  runtime.renderBuildList = function () {
    const out = oldRenderBuildList();
    decorate();
    return out;
  };
  const oldTryPlace = runtime.tryPlace;
  runtime.tryPlace = function (row, col) {
    if (!runtime.state.selectedBuild) return oldTryPlace(row, col);
    const type = runtime.state.selectedBuild,
      rotation = runtime.state.buildRotation;
    const keep = shiftHeld && !runtime.isUniqueBuilding(runtime.P, type);
    if (!keep) return oldTryPlace(row, col);
    const origin = runtime.placementOrigin(type, rotation, row, col),
      res = runtime.placeBuilding(runtime.P, type, origin.row, origin.col, rotation);
    if (!res.ok) {
      runtime.toast(res.reason);
      return;
    }
    runtime.state.selectedBuilding = null;
    runtime.state.selectedBuild = type;
    runtime.state.buildRotation = rotation;
    runtime.clearPlacementPreview();
    runtime.toast(`${runtime.BUILDINGS[res.building.type].name} elkészült${res.foundationUsed ? ' · Régi alapozás: −50% költség' : ''} · SHIFT: folytatás.`);
    runtime.renderStatic();
  };
  function switchCategory(cat) {
    const tab = runtime.$(`.tab[data-cat="${cat}"]`);
    if (!tab) return;
    tab.click();
  }
  function selectBuildSlot(n) {
    const cards = [...runtime.$$('#buildList .buildcard')];
    const card = cards[n - 1];
    if (!card) return;
    if (card.disabled) {
      runtime.toast(`${n}. hely: ez az épület most nem építhető.`);
      return;
    }
    card.click();
  }
  function cycleSpeed() {
    runtime.$('#speedBtn')?.click();
  }
  function togglePause() {
    runtime.$('#pauseBtn')?.click();
  }
  document.addEventListener('keydown', e => {
    if (e.key === 'Shift') {
      shiftHeld = true;
      return;
    }
    if (typingTarget(e.target)) return;
    const key = String(e.key || '').toLowerCase();
    if (categoryByKey[key]) {
      if (overlayBlocksHotkeys()) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      switchCategory(categoryByKey[key]);
      return;
    }
    if (e.code === 'Space') {
      if (menuVisible()) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      togglePause();
      return;
    }
    if (key === 't') {
      if (menuVisible()) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      cycleSpeed();
      return;
    }
    let n = 0;
    if (/^Digit[1-9]$/.test(e.code)) n = Number(e.code.slice(5));else if (/^Numpad[1-9]$/.test(e.code)) n = Number(e.code.slice(6));else if (/^[1-9]$/.test(e.key)) n = Number(e.key);
    if (n) {
      if (overlayBlocksHotkeys()) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      selectBuildSlot(n);
    }
  }, true);
  document.addEventListener('keyup', e => {
    if (e.key === 'Shift') shiftHeld = false;
  }, true);
  window.addEventListener('blur', () => {
    shiftHeld = false;
  });
  if (runtime.$('#pauseBtn')) runtime.$('#pauseBtn').title = 'Space · Szünet / folytatás';
  if (runtime.$('#speedBtn')) runtime.$('#speedBtn').title = 'T · Sebesség váltása';
  decorate();
}
