import { createCodexCards } from './codex-cards.js';
import { fitCardText } from './card-text-fit.js';

export function installActiveRelicCards(R) {
  const cards = createCodexCards(R);
  const updateHud = R.updateHud;
  R.updateHud = (...args) => {
    const out = updateHud(...args), c = R.P;
    R.$('#relicCount').textContent = R.upgradeCatalog.count(c) +
      [...c.legends].reduce((n,id)=>n+Math.max(1,Number(c.legendaryStacks?.[id])||0),0);
    return out;
  };
  R.renderRelics = (c = R.P) => {
    const list = R.$('#relicList');
    list.replaceChildren();
    const owned = [
      ...R.upgradeCatalog.grouped(c).map(({option,count,rarities})=>[option,'normal',count,rarities]),
      ...[...c.legends].map(id=>[R.LEGENDARY.find(o=>o.id===id),'legendary',Math.max(1,Number(c.legendaryStacks?.[id])||0)]),
    ];
    for (const [def,kind,count,rarities] of owned) {
      if (!def) continue;
      const template = document.createElement('template');
      template.innerHTML = cards.upgrade(def,kind,c.race || 'human',c,kind==='normal'?R.upgradeCatalog.summary(c,def):null);
      const card = template.content.firstElementChild;
      card.dataset.relic = def.id;
      const badge = document.createElement('span');
      badge.className = 'relicOwnedCount';badge.textContent = `×${count}`;
      badge.setAttribute('aria-label',`${count} felvétel`);card.prepend(badge);
      if(rarities){
        const breakdown=document.createElement('div');breakdown.className='relicRarityCounts';breakdown.setAttribute('aria-label','Felvételek ritkaságonként');
        for(const [key,rarity]of Object.entries(R.upgradeCatalog.rarities)){
          const n=rarities[key]||0;if(!n)continue;
          const chip=document.createElement('span');chip.dataset.rarity=key;chip.style.setProperty('--rarity-color',rarity.color);chip.textContent=rarity.label+' ×'+n;breakdown.append(chip);
        }
        card.append(breakdown);
      }
      if (def.id === 'overproduction') {
        const progress = document.createElement('p');
        progress.className='relicLiveProgress';
        progress.textContent=`+${Math.floor(c.overflowStacks||0)}% sebzés · ${Math.floor(c.overflowProgress||0)}/500 a következő bónuszhoz`;
        card.append(progress);
      }
      list.append(card);fitCardText(card.querySelector('.cardFace'));
    }
    for(const [type,entry]of Object.entries(c.deckBuildings||{})){
      if(!R.BUILDINGS[type])continue;
      const template=document.createElement('template');template.innerHTML=cards.building(type,c.race||'human',c);
      const card=template.content.firstElementChild;card.dataset.deckBuilding=type;
      const badge=document.createElement('span');badge.className='relicOwnedCount';badge.textContent=`L${R.levelOf(c,type)}`;card.prepend(badge);
      list.append(card);fitCardText(card.querySelector('.cardFace'));
    }
    if (!list.childElementCount) list.textContent = 'Még nincs lap a pakliban.';
  };
  new ResizeObserver(()=>{
    if (!R.$('#relicOverlay').classList.contains('hidden'))
      listCards().forEach(fitCardText);
  }).observe(R.$('#relicList'));
  const listCards=()=>[...R.$$('#relicList .cardFace')];
}
