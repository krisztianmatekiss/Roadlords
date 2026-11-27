import { createCodexCards } from './codex-cards.js';
import { escapeText as esc } from './card-presentation.js';
import { fitCardText } from './card-text-fit.js';
import { campaignCardKey } from '../campaign/definitions.js';

export function createCampaignPanel(R,C) {
  const overlay=document.createElement('div');overlay.id='campaignOverlay';overlay.className='campaignOverlay hidden';
  overlay.setAttribute('role','dialog');overlay.setAttribute('aria-modal','true');overlay.setAttribute('aria-labelledby','campaignTitle');
  document.body.append(overlay);
  const cards=createCodexCards(R);let returnFocus=null;
  const button=(action,label,primary=false)=>`<button type="button" data-campaign-action="${action}" class="${primary?'primary':''}">${esc(label)}</button>`;
  const definition=id=>C.run.race==='undead'?window.__ROADLORDS_UNDEAD__.buildings[id]:R.BUILDINGS[id];
  function passiveCard(html) {
    const template=document.createElement('template');template.innerHTML=html;
    template.content.querySelectorAll('nav,details,.upgradeRequirement,.deckBuildingBranch').forEach(el=>el.remove());
    return template.innerHTML;
  }
  const upgradeCard=entry=>passiveCard(cards.upgrade(C.cardOption(entry),entry.kind,C.run.race));
  const buildingCard=(id,level,branch=null)=>{
    const city=R.cardBuildingCopy.cityFor(C.run.race,id,level)[0];
    if(branch)city.l4Branches[id]=branch;
    return passiveCard(cards.building(id,C.run.race,city));
  };
  function rewardBody() {
    const run=C.run,type=C.rewardType,options=C.rewardOptions();
    if(!type)return `<p class="campaignLead">Válassz egy jutalmat. A hatása a kampány végéig megmarad.</p><div class="campaignRewardTypes">${options.map(o=>`<button type="button" data-campaign-reward-type="${o.type}"${o.enabled?'':' disabled'}><strong>${esc(o.title)}</strong><span>${esc(o.description)}</span>${o.enabled?'':`<small>${o.type==='legendary'?'Ebben a harcban nem szereztél legendás lapot.':o.type==='normal'?'Legalább három új fejlesztéspéldány szükséges.':o.type==='starter'?'Nincs új, továbbvihető épülettípus.':'Minden startered L4-es.'}</small>`}</button>`).join('')}</div>`;
    const back=button('reward-back','Másik jutalom');
    if(type==='starter'||type==='level'){
      const ids=type==='starter'?run.loot.unlocked.filter(id=>!Object.hasOwn(run.starters,id)):Object.keys(run.starters).filter(id=>run.starters[id].level<4);
      if(C.rewardBuilding){
        const id=C.rewardBuilding;
        return `${back}<p class="campaignLead">${esc(definition(id).name)} · válassz L4 ágat</p><div class="campaignBranchChoices">${C.branches(run.race,id).map(b=>`<button type="button" data-campaign-branch="${b.id}"><strong>${esc(b.name)}</strong><span>${esc(b.description)}</span></button>`).join('')}</div>`;
      }
      return `${back}<p class="campaignLead">${type==='starter'?'Válassz egy ebben a harcban feloldott új startert. L1-en indul.':'Válaszd ki, melyik startered kezdőszintje nőjön eggyel.'}</p><div class="campaignRewards">${ids.map(id=>{const level=type==='starter'?1:run.starters[id].level+1;return `<button type="button" class="campaignReward" data-campaign-building="${id}"><span class="campaignCardLabel">${type==='starter'?'Új starter · L1':`L${level-1} → L${level}`}</span>${buildingCard(id,C.branches(run.race,id).length?Math.min(level,3):level)}</button>`;}).join('')}</div>`;
    }
    const entries=run.loot.cards.filter(c=>c.kind===type),selected=C.rewardSelection,total=selected.reduce((n,c)=>n+c.count,0),wanted=type==='normal'?3:1;
    return `${back}<p class="campaignLead">${type==='normal'?'Válassz három fejlesztéspéldányt. A ritkaságuk és saját hatásuk megmarad.':'Válassz egy ebben a harcban megszerzett legendás fejlesztést.'}</p><div class="campaignSelectionBar"><strong role="status">Kiválasztva: ${total} / ${wanted}</strong><button type="button" class="primary" data-campaign-action="confirm-reward"${total===wanted?'':' disabled'}>Megtartom</button></div><div class="campaignRewards">${entries.map(entry=>{const key=campaignCardKey(entry),n=selected.find(c=>campaignCardKey(c)===key)?.count||0;return `<div class="campaignRewardGroup"><button type="button" class="campaignReward ${n?'selected':''}" data-campaign-card="${key}" aria-pressed="${n>0}"${total>=wanted||n>=entry.count?' disabled':''}><span class="campaignCardLabel">${entry.count} új példány · ${n} kiválasztva</span>${upgradeCard(entry)}</button>${n?`<button type="button" data-campaign-remove="${key}">Egy példány vissza</button>`:''}</div>`;}).join('')}</div>`;
  }
  function show() {
    if(overlay.classList.contains('hidden'))returnFocus=document.activeElement;
    R.closeBuildCardPreview?.();
    overlay.classList.remove('hidden');R.state.running=false;R.$('#pauseBtn').classList.add('on');R.$('#pauseBtn').textContent='▶';
    render();requestAnimationFrame(()=>overlay.querySelector('button,select')?.focus());
  }
  function hide() {overlay.classList.add('hidden');if(!C.active&&returnFocus?.isConnected)returnFocus.focus();}
  function render() {
    const focused=overlay.contains(document.activeElement);
    const focusKey=document.activeElement?.dataset.campaignCard||document.activeElement?.dataset.campaignRemove;
    const viewKey=`${C.run?.status}:${C.rewardType||''}:${C.rewardBuilding||''}`;
    const previousPanel=overlay.querySelector('.campaignPanel');
    const scroll=previousPanel?.dataset.campaignView===viewKey?previousPanel.scrollTop:0;
    const run=C.run,phase=run?.status,entry=run?C.encounter():null;
    const progress=run?`<ol class="campaignStages" aria-label="Kampányelőrehaladás">${Array.from({length:5},(_,i)=>`<li class="${i<run.stage?'done':i===run.stage?'current':''}">${i===4?'♛':i+1}<span>${i===4?'BOSS':`${i+1}. HARC`}</span></li>`).join('')}</ol>`:'';
    let body='',title='Kampány';
    if(phase==='reward') {
      title='Győzelem · válassz jutalmat';
      body=rewardBody();
    } else if(phase==='complete') {
      title='A kampány teljesítve!';body='<p class="campaignLead">Öt győzelem. A Vérudvar Ura elesett.</p>';
    } else if(run) {
      title=phase==='defeated'?'A főváros elesett':`${run.stage+1}. harc · ${entry.boss?'BOSS':'következő ellenfél'}`;
      const extra=C.startingAdvantages(entry);
      body=`<section class="campaignEnemy"><div><small>${esc(R.FACTIONS[entry.race].name)}</small><h3>${esc(entry.name)}</h3></div><ul>${extra.map(line=>`<li>${esc(line)}</li>`).join('')}</ul></section>${phase==='defeated'?'<p>Újrapróbálhatod ugyanazt az ellenfelet. A harc eleji kampányállapotod megmarad.</p>':phase==='battle'?'<p>A mentés a harc elejéről folytatódik. A csata közbeni város és fejlesztések újraindulnak.</p>':''}<div class="campaignActions">${button('battle',phase==='defeated'?'Harc újrapróbálása':phase==='battle'?'Harc újrakezdése':'Harc indítása',true)}</div>`;
    } else {
      body='<p class="campaignLead">Négy ellenfél, majd az élőhalott boss. Győzelem után bővítsd a starter készletedet, vagy tarts meg megszerzett fejlesztéseket.</p>';
    }
    const setup=`<div class="campaignNew"><label for="campaignRace">Válassz népet</label><select id="campaignRace">${Object.entries(R.FACTIONS).map(([id,d])=>`<option value="${id}"${run?.race===id?' selected':''}>${esc(d.name)}</option>`).join('')}</select>${button('new','Új kampány indítása',true)}${run?'<small>Új kampány indításakor a korábbi végigjátszás mentése felülíródik.</small>':''}</div>`;
    const owned=run?`<details class="campaignOwned"><summary>Kampányelőnyök · ${Object.keys(run.starters).length} starter · ${run.permanent.reduce((n,c)=>n+c.count,0)} fejlesztés</summary><h3>Kezdéskor elérhető épületek</h3><ul class="campaignStarterList">${Object.entries(run.starters).map(([id,b])=>`<li><b>${esc(definition(id).name)}</b> · L${b.level}${b.branch?' · '+esc(C.branches(run.race,id).find(x=>x.id===b.branch)?.name||''):''}</li>`).join('')}</ul>${run.permanent.length?`<h3>Permanens fejlesztések</h3><div class="campaignRelicShelf">${run.permanent.map(entry=>`<div><span class="campaignCardLabel">${entry.count} példány</span>${upgradeCard(entry)}</div>`).join('')}</div>`:''}</details>`:'';
    const results=run?.results.length?`<p class="campaignResults">Megnyert harcok: ${run.results.length} / 5 · Összes játékidő: ${R.fmt(run.results.reduce((n,r)=>n+r.time,0))}</p>`:'';
    overlay.innerHTML=`<section class="campaignPanel"><header><div><small>ROADLORDS · HADJÁRAT</small><h2 id="campaignTitle">${title}</h2></div>${button('menu','Főmenü')}</header>${progress}${body}${results}${owned}${run?`<details class="campaignNewDetails"><summary>Új kampány</summary>${setup}</details>`:setup}<footer><p>A starter szintek és permanens lapok megmaradnak. Az épületeket minden harcban ki kell fizetned és felépítened.</p><p class="campaignSaveStatus" role="status">${esc(C.message||'A kampány a harcok között automatikusan mentődik ebben a böngészőben.')}</p>${R.state.ended&&C.active?button('summary','Csataösszesítő'):''}</footer></section>`;
    overlay.querySelectorAll('.cardFace').forEach(fitCardText);
    const panel=overlay.querySelector('.campaignPanel');panel.dataset.campaignView=viewKey;panel.scrollTop=scroll;
    if(C.loading){const b=overlay.querySelector('[data-campaign-action="battle"]');if(b){b.disabled=true;b.textContent='Egységképek betöltése…';}}
    if(focused){
      const same=focusKey&&overlay.querySelector(`[data-campaign-card="${CSS.escape(focusKey)}"]:not(:disabled),[data-campaign-remove="${CSS.escape(focusKey)}"]`);
      (same||overlay.querySelector('button:not(:disabled),select'))?.focus({preventScroll:true});
    }
  }
  overlay.addEventListener('click',async event=>{
    const type=event.target.closest('[data-campaign-reward-type]');
    if(type){C.rewardType=type.dataset.campaignRewardType;C.rewardBuilding=null;C.rewardSelection=[];render();return;}
    const building=event.target.closest('[data-campaign-building]');
    if(building){
      const id=building.dataset.campaignBuilding;
      if(C.rewardType==='level'&&C.run.starters[id].level===3&&C.branches(C.run.race,id).length){C.rewardBuilding=id;render();}
      else C.chooseReward({type:C.rewardType,id});return;
    }
    const branch=event.target.closest('[data-campaign-branch]');
    if(branch){C.chooseReward({type:'level',id:C.rewardBuilding,branch:branch.dataset.campaignBranch});return;}
    const add=event.target.closest('[data-campaign-card]'),remove=event.target.closest('[data-campaign-remove]');
    if(add||remove){
      const key=(add||remove).dataset[add?'campaignCard':'campaignRemove'],entry=C.run.loot.cards.find(c=>campaignCardKey(c)===key);
      let chosen=C.rewardSelection.find(c=>campaignCardKey(c)===key);
      if(add){if(chosen)chosen.count++;else C.rewardSelection.push({...entry,count:1});}
      else if(chosen)chosen.count--;
      C.rewardSelection=C.rewardSelection.filter(c=>c.count>0);render();return;
    }
    const action=event.target.closest('[data-campaign-action]')?.dataset.campaignAction;
    if(action==='reward-back'){C.rewardType=null;C.rewardBuilding=null;C.rewardSelection=[];render();}
    if(action==='confirm-reward')C.chooseReward({type:C.rewardType,cards:C.rewardSelection});
    if(action==='new')C.newRun(overlay.querySelector('#campaignRace').value);
    if(action==='battle')await C.startBattle();
    if(action==='summary')hide();
    if(action==='menu'){
      if(C.active)C.returnToMenu();else hide();
    }
  });
  document.addEventListener('keydown',event=>{
    if(overlay.classList.contains('hidden'))return;
    if(event.key==='Escape'){event.preventDefault();event.stopImmediatePropagation();if(C.active&&R.state.ended)hide();else if(!C.active)hide();return;}
    if(event.key==='Tab'){
      const nodes=[...overlay.querySelectorAll('button:not(:disabled),select,summary')].filter(e=>e.getClientRects().length),first=nodes[0],last=nodes.at(-1);
      if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}
      else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}
    }
    // Native form and button keys still work, but battlefield shortcuts must
    // never select a building or change the gate behind this modal.
    event.stopImmediatePropagation();
  },true);
  return {show,hide,render,visible:()=>!overlay.classList.contains('hidden')};
}
