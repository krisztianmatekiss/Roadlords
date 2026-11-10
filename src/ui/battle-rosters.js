const ARMY='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 3 5 1-1 7-4-1Zm9 8 5 1-1 7-4-1Z" fill="currentColor"/><path d="m4 13 5 1-1 5-5-1Zm10-8 5 1-1 3-5-1Z" fill="currentColor" opacity=".65"/></svg>';
const GARRISON='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 3h4v4h3V3h3v4h3V3h3v8l-2 2v8H6v-8l-2-2Z" fill="currentColor"/><path d="M10 21v-6a2 2 0 0 1 4 0v6" fill="#13251d"/></svg>';

// Stable type slots and keyed DOM updates: recruitment changes the counters,
// never the size/order of the two summary rows or the image elements.
export function installBattleRosters(R,active){
 const ids=new Map([['playerArmyMix','player'],['playerGarrisonMix','player'],['enemyArmyMix','enemy'],['enemyGarrisonMix','enemy']]);
 const cache=new WeakMap(),original=R.updateUnitMix;
 for(const group of document.querySelectorAll('.roadRosterGroup')){
  const label=group.querySelector('.roadRosterHeading>span'),army=label.textContent==='SEREG';
  label.insertAdjacentHTML('afterbegin',`<i class="rosterRoleIcon">${army?ARMY:GARRISON}</i>`);
 }
 function slot(key){
  const node=document.createElement('span');node.className='unitchip';node.dataset.unit=key;
  node.innerHTML=`<span class="rosterDormantIcon" aria-hidden="true">${R.UNITS[key].icon}</span><b>0</b>`;return node;
 }
 R.updateUnitMix=(id,entries)=>{
  if(!active()||!ids.has(id))return original(id,entries);
  const el=R.$('#'+id),c=R.cityForSide(ids.get(id));if(!el)return;
  const counts=R.unitMixCounts(entries),keys=R.UNIT_ORDER.filter(k=>R.UNITS[k]&&R.factionUnitMatches(c.race,R.UNITS[k]));
  let view=cache.get(el);
  if(!view||view.race!==c.race||view.nodes[0]?.parentNode!==el){
   el.replaceChildren();const nodes=keys.map(slot);el.append(...nodes);
   const more=document.createElement('span');more.className='rosterMore';
   more.innerHTML='<button type="button" aria-label="Más népektől származó egységek" aria-expanded="false"></button><span class="rosterExtraPopover"></span>';
   const toggle=()=>more.querySelector('button').setAttribute('aria-expanded',String(more.matches(':hover,:focus-within')));
   more.addEventListener('pointerenter',toggle);more.addEventListener('pointerleave',toggle);more.addEventListener('focusin',toggle);more.addEventListener('focusout',()=>queueMicrotask(toggle));
   el.append(more);view={race:c.race,nodes,more,extras:''};cache.set(el,view);
  }
  keys.forEach((key,i)=>{
   const node=view.nodes[i],n=counts[key]||0,b=node.querySelector('b');
   if(n&&!node.dataset.loaded){
    const template=document.createElement('template');template.innerHTML=R.unitImageTag(key,'mixPortrait');
    node.replaceChild(template.content.firstElementChild,node.firstElementChild);node.dataset.loaded='true';
   }
   if(b.textContent!==String(n))b.textContent=String(n);
   node.classList.toggle('rosterEmpty',!n);node.title=`${R.UNITS[key].name}: ${n}`;
  });
  const extra=R.UNIT_ORDER.filter(k=>counts[k]&&!keys.includes(k)),signature=extra.map(k=>k+':'+counts[k]).join('|');
  view.more.hidden=!extra.length;
  if(view.extras!==signature){
   view.extras=signature;view.more.querySelector('button').textContent='+'+extra.length;
   view.more.querySelector('.rosterExtraPopover').innerHTML=extra.map(k=>`<span>${R.unitImageTag(k,'mixPortrait')}<span>${R.UNITS[k].name}</span><b>${counts[k]}</b></span>`).join('');
   view.more.title=extra.map(k=>`${R.UNITS[k].name}: ${counts[k]}`).join('\n');
  }
  el.style.setProperty('--mix-slots',String(keys.length+(extra.length?1:0)));
 };
 return {reset(){for(const id of ids.keys())delete R.$('#'+id).dataset.signature;}};
}
