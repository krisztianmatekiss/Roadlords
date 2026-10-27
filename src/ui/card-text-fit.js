// Prefer generous typography; shrink only cards whose actual text needs it.
export function fitCardText(card) {
  const width = card.clientWidth;
  if (!width) return;
  const fit = (element, variable, min, max) => {
    if (!element || !element.clientHeight) return;
    const set = size => card.style.setProperty(variable, `${size.toFixed(2)}px`);
    const fits = () => element.scrollHeight <= element.clientHeight + 1 && element.scrollWidth <= element.clientWidth + 1;
    set(max);
    if (fits()) return;
    let lo = min, hi = max;
    for (let i = 0; i < 7; i++) {
      const middle = (lo + hi) / 2;
      set(middle);
      if (fits()) lo = middle; else hi = middle;
    }
    set(lo);
  };
  fit(card.querySelector('.rlCodexTitle,h3,.cardname'), '--card-title-size', width * .045, width * .072);
  const thumbnail = !!card.closest('#buildList');
  fit(card.querySelector('.choiceBody,.rlCodexContent,.cardinfo'), '--card-copy-size', thumbnail ? width * .032 : Math.max(10, width * .032), width * .066);
}

export function initializeCardTextFit() {
  let frame = 0;
  const observed = new Set(), signatures = new WeakMap();
  const schedule = () => { if (!frame) frame = requestAnimationFrame(refresh); };
  const observer = new ResizeObserver(schedule);
  function refresh() {
    frame = 0;
    for (const card of observed) if (!card.isConnected) { observer.unobserve(card); observed.delete(card); }
    for (const card of document.querySelectorAll('.illustratedCard')) {
      if (!observed.has(card)) { observed.add(card); observer.observe(card); }
      const signature = `${card.clientWidth}:${card.clientHeight}:${card.textContent}`;
      if (signatures.get(card) === signature) continue;
      fitCardText(card);
      signatures.set(card, signature);
    }
  }
  const mutations = new MutationObserver(schedule);
  for (const root of ['#choiceList','#buildList','#rlCodexPanel','#relicList']) {
    const el = document.querySelector(root);
    if (el) mutations.observe(el, {childList:true,subtree:true});
  }
  document.fonts.ready.then(() => { for (const card of observed) signatures.delete(card); schedule(); });
  document.fonts.addEventListener('loadingdone', () => { for (const card of observed) signatures.delete(card); schedule(); });
  window.addEventListener('roadlords:ui-scale', schedule);
  schedule();
}
