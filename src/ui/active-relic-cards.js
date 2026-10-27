import { createCodexCards } from './codex-cards.js';
import { fitCardText } from './card-text-fit.js';

export function installActiveRelicCards(R) {
  const cards = createCodexCards(R);
  const updateHud = R.updateHud;
  R.updateHud = (...args) => {
    const out = updateHud(...args), c = R.P;
    R.$('#relicCount').textContent = Object.values(c.normal).reduce((a,n)=>a+n,0) +
      [...c.legends].reduce((n,id)=>n+Math.max(1,Number(c.legendaryStacks?.[id])||0),0);
    return out;
  };
  R.renderRelics = () => {
    const list = R.$('#relicList'), c = R.P;
    list.replaceChildren();
    const owned = [
      ...Object.entries(c.normal).filter(([,n])=>n>0).map(([id,n])=>[R.NORMAL.find(o=>o.id===id),'normal',n]),
      ...[...c.legends].map(id=>[R.LEGENDARY.find(o=>o.id===id),'legendary',Math.max(1,Number(c.legendaryStacks?.[id])||0)]),
    ];
    for (const [def,kind,count] of owned) {
      if (!def) continue;
      const template = document.createElement('template');
      template.innerHTML = cards.upgrade(def,kind,c.race || 'human',c);
      const card = template.content.firstElementChild;
      card.dataset.relic = def.id;
      const badge = document.createElement('span');
      badge.className = 'relicOwnedCount';badge.textContent = `×${count}`;
      badge.setAttribute('aria-label',`${count} felvétel`);card.prepend(badge);
      if (def.id === 'overproduction') {
        const progress = document.createElement('p');
        progress.className='relicLiveProgress';
        progress.textContent=`+${Math.floor(c.overflowStacks||0)}% sebzés · ${Math.floor(c.overflowProgress||0)}/500 a következő bónuszhoz`;
        card.append(progress);
      }
      list.append(card);fitCardText(card.querySelector('.cardFace'));
    }
    if (!list.childElementCount) list.textContent = 'Még nincs ereklyéd.';
  };
  new ResizeObserver(()=>{
    if (!R.$('#relicOverlay').classList.contains('hidden'))
      listCards().forEach(fitCardText);
  }).observe(R.$('#relicList'));
  const listCards=()=>[...R.$$('#relicList .cardFace')];
}
