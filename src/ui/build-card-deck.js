import { fitCardText } from './card-text-fit.js';

// A fixed preview escapes the horizontal deck's clipping without moving the map.
export function installBuildCardDeck(R) {
  const list = R.$('#buildList');
  const sizeDeck = () => {
    if (list.clientHeight <= 24) return;
    const width = Math.max(1,Math.min(140,(list.clientHeight - 24) / 1.5,list.clientWidth - 4));
    list.style.setProperty('--deck-card-width', `${width}px`);
  };
  new ResizeObserver(sizeDeck).observe(list);
  sizeDeck();
  const HOVER_DELAY = 1500;
  let key = null, preview = null, hideTimer = 0, hoverTimer = 0, hovered = null, keyboard = false;
  const cardFor = type => [...list.querySelectorAll('.buildcard')].find(c => c.dataset.k === type);
  function cancelHover() { clearTimeout(hoverTimer); hoverTimer = 0; hovered = null; }
  function close() {
    clearTimeout(hideTimer);
    cancelHover();
    preview?.remove(); preview = null; key = null; keyboard = false;
  }
  function position(card) {
    const rect = card.getBoundingClientRect();
    const scale = window.__ROADLORDS_UI_SCALE__?.effective() || 1;
    const width = Math.min(Math.max(310 * scale,rect.width), innerWidth - 16, (innerHeight - R.$('.topbar').getBoundingClientRect().bottom - 24) / 1.5);
    preview.style.width = `${width}px`;
    preview.style.height = `${width * 1.5}px`;
    preview.style.left = `${Math.max(8, Math.min(rect.left, innerWidth - width - 8))}px`;
    preview.style.bottom = '8px';
    const top = innerHeight - 8 - width * 1.5;
    // Over the folded deck, let clicks reach the real card underneath.
    preview.querySelector('.previewHitbox').style.height = `${Math.max(0, Math.min(width * 1.5, rect.top - top))}px`;
  }
  function show(type, {keyboard: fromKeyboard = false} = {}) {
    const card = cardFor(type);
    if (!card || R.state.selectedBuild || R.state.modal || document.body.classList.contains('roadlords-menu-open')) return;
    clearTimeout(hideTimer);
    if (key === type && preview) { keyboard ||= fromKeyboard; return; }
    close(); key = type; keyboard = fromKeyboard;
    preview = card.cloneNode(true);
    preview.classList.add('buildCardPreview');
    preview.classList.remove('compactPickCard');
    // Locked buildings remain readable, while their click remains disabled.
    preview.removeAttribute('id'); preview.removeAttribute('title');
    const badge = card.closest('.buildSlot').querySelector('.buildSlotBadges').cloneNode(true);
    badge.classList.add('previewBadges'); preview.append(badge);
    const hitbox = document.createElement('span'); hitbox.className = 'previewHitbox'; preview.append(hitbox);
    preview.onclick = e => { e.preventDefault(); cardFor(type)?.click(); };
    preview.addEventListener('pointerenter', () => clearTimeout(hideTimer));
    document.body.append(preview);
    position(card); fitCardText(preview);
    if (!matchMedia('(prefers-reduced-motion: reduce)').matches) preview.animate([{transform:'translateY(24px)',opacity:.5},{transform:'translateY(0)',opacity:1}], {duration:140,easing:'ease-out'});
  }
  list.addEventListener('focusin', e => { const card = e.target.closest('.buildcard'); if (card) show(card.dataset.k, {keyboard:true}); });
  list.addEventListener('focusout', e => { if (!preview?.contains(e.relatedTarget)) hideTimer = setTimeout(close, 100); });
  list.addEventListener('scroll', () => {
    if (keyboard && cardFor(key)) position(cardFor(key)); else close();
  }, {passive:true});
  list.addEventListener('mousedown', e => { if (e.target.closest('.buildcard')) e.preventDefault(); });
  document.addEventListener('pointerdown', e => {
    cancelHover();
    if (preview && !preview.contains(e.target) && !e.target.closest('#buildList')) close();
  }, true);
  document.addEventListener('pointermove', e => {
    const inside = box => box && e.clientX >= box.left && e.clientX <= box.right && e.clientY >= box.top && e.clientY <= box.bottom;
    if (preview) {
      // The lower, click-through part is still visually part of the large card.
      // Don't dismiss it just because its hitbox no longer receives pointer events.
      if (inside(preview.getBoundingClientRect()) || inside(cardFor(key)?.getBoundingClientRect())) return;
      close();
    }
    const slot = e.target.closest('#buildList .buildSlot');
    if (!slot || e.pointerType === 'touch' || R.state.selectedBuild || R.state.modal ||
        document.body.classList.contains('roadlords-menu-open')) { cancelHover(); return; }
    if (hovered === slot.dataset.k) return;
    cancelHover();
    hovered = slot.dataset.k;
    hoverTimer = setTimeout(() => {
      const type = hovered;
      hoverTimer = 0;
      if (type) show(type);
    }, HOVER_DELAY);
  }, {passive:true});
  document.addEventListener('pointerleave', close);
  window.addEventListener('keydown', e => { if (e.key === 'Escape') close(); }, true);
  window.addEventListener('blur', close);
  window.addEventListener('resize', close);
  window.addEventListener('roadlords:ui-scale', close);
  new MutationObserver(() => {
    if (!R.$('#choiceOverlay').classList.contains('hidden')) close();
  }).observe(R.$('#choiceOverlay'), {attributes:true,attributeFilter:['class']});
  new MutationObserver(() => { if (document.body.classList.contains('roadlords-menu-open')) close(); })
    .observe(document.body, {attributes:true,attributeFilter:['class']});
  const render = R.renderBuildList;
  R.renderBuildList = (...args) => {
    const scroll = list.scrollLeft, active = key, wasKeyboard = keyboard;
    const out = render(...args);
    list.scrollLeft = scroll;
    if (R.state.selectedBuild) close();
    else if (active) {
      close();
      if (cardFor(active)) show(active, {keyboard:wasKeyboard});
    }
    return out;
  };
  const affordability = R.updateBuildAffordabilityV497;
  R.updateBuildAffordabilityV497 = () => {
    affordability();
    if (!preview) return;
    for (const row of preview.querySelectorAll('[data-cost-resource]')) {
      const missing = (R.P.resources[row.dataset.costResource] || 0) + 1e-9 < Number(row.dataset.costAmount);
      row.classList.toggle('unaffordable', missing); row.classList.toggle('affordable', !missing);
    }
  };
  R.revealBuildCard = (type, options) => {
    const card = cardFor(type);
    if (!card) return;
    // Horizontal scrolling must never move the page or the camera vertically.
    const slot = card.closest('.buildSlot'), bounds = list.getBoundingClientRect(), rect = slot.getBoundingClientRect();
    const zoom = Number(getComputedStyle(R.$('.catalog')).zoom) || 1;
    if (rect.left < bounds.left) list.scrollLeft -= (bounds.left - rect.left) / zoom;
    if (rect.right > bounds.right) list.scrollLeft += (rect.right - bounds.right) / zoom;
    if (options?.selection) { close(); return; }
    show(type, options);
  };
  Object.assign(window.__ROADLORDS__, {renderBuildList:R.renderBuildList});
}
