import { fitCardText } from './card-text-fit.js';

// A fixed preview escapes the horizontal deck's clipping without moving the map.
export function installBuildCardDeck(R) {
  const list = R.$('#buildList');
  const sizeDeck = () => list.style.setProperty('--deck-card-width', `${Math.max(100,Math.min(310,list.clientWidth - 4))}px`);
  new ResizeObserver(sizeDeck).observe(list);
  sizeDeck();
  let key = null, preview = null, hideTimer = 0, keyboard = false;
  const cardFor = type => [...list.querySelectorAll('.buildcard')].find(c => c.dataset.k === type);
  function close() {
    clearTimeout(hideTimer);
    preview?.remove(); preview = null; key = null; keyboard = false;
  }
  function position(card) {
    const rect = card.getBoundingClientRect();
    const width = Math.min(Math.max(260,rect.width), innerWidth - 16, (innerHeight - R.$('.topbar').getBoundingClientRect().bottom - 24) / 1.5);
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
    if (!card || R.state.modal || document.body.classList.contains('roadlords-menu-open')) return;
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
    preview.addEventListener('pointerleave', () => { if (!keyboard) hideTimer = setTimeout(close, 100); });
    document.body.append(preview);
    position(card); fitCardText(preview);
    if (!matchMedia('(prefers-reduced-motion: reduce)').matches) preview.animate([{transform:'translateY(24px)',opacity:.5},{transform:'translateY(0)',opacity:1}], {duration:140,easing:'ease-out'});
  }
  list.addEventListener('pointerover', e => {
    const slot = e.target.closest('.buildSlot');
    if (slot) show(slot.dataset.k);
  });
  list.addEventListener('pointerleave', () => { if (!keyboard) hideTimer = setTimeout(close, 100); });
  list.addEventListener('focusin', e => { const card = e.target.closest('.buildcard'); if (card) show(card.dataset.k); });
  list.addEventListener('focusout', e => { if (!preview?.contains(e.relatedTarget)) hideTimer = setTimeout(close, 100); });
  list.addEventListener('scroll', () => {
    if (keyboard && cardFor(key)) position(cardFor(key)); else close();
  }, {passive:true});
  list.addEventListener('mousedown', e => { if (e.target.closest('.buildcard')) e.preventDefault(); });
  document.addEventListener('pointerdown', e => { if (preview && !preview.contains(e.target) && !e.target.closest('#buildList')) close(); }, true);
  document.addEventListener('pointermove', e => {
    if (!keyboard || !preview) return;
    const r = preview.getBoundingClientRect(), owner = cardFor(key)?.getBoundingClientRect();
    const inside = box => box && e.clientX >= box.left && e.clientX <= box.right && e.clientY >= box.top && e.clientY <= box.bottom;
    if (!inside(r) && !inside(owner)) close();
  }, {passive:true});
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
    if (active) {
      close();
      if (cardFor(active) && (!wasKeyboard || R.state.selectedBuild === active)) show(active, {keyboard:wasKeyboard});
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
    show(type, options);
  };
  Object.assign(window.__ROADLORDS__, {renderBuildList:R.renderBuildList});
}
