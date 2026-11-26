import { createCodexCards } from './codex-cards.js';
import { escapeText as esc } from './card-presentation.js';
import { fitCardText } from './card-text-fit.js';

export function createCampaignPanel(R,C) {
  const overlay=document.createElement('div');overlay.id='campaignOverlay';overlay.className='campaignOverlay hidden';
  overlay.setAttribute('role','dialog');overlay.setAttribute('aria-modal','true');overlay.setAttribute('aria-labelledby','campaignTitle');
  document.body.append(overlay);
  const cards=createCodexCards(R);let returnFocus=null;
  const button=(action,label,primary=false)=>`<button type="button" data-campaign-action="${action}" class="${primary?'primary':''}">${esc(label)}</button>`;
  const relicCard=id=>cards.upgrade(R.RELICS.find(d=>d.id===id),'relic',C.run?.race||'human');
  function show() {
    if(overlay.classList.contains('hidden'))returnFocus=document.activeElement;
    R.closeBuildCardPreview?.();
    overlay.classList.remove('hidden');R.state.running=false;R.$('#pauseBtn').classList.add('on');R.$('#pauseBtn').textContent='▶';
    render();requestAnimationFrame(()=>overlay.querySelector('button,select')?.focus());
  }
  function hide() {overlay.classList.add('hidden');if(!C.active&&returnFocus?.isConnected)returnFocus.focus();}
  function render() {
    const focused=overlay.contains(document.activeElement);
    const run=C.run,phase=run?.status,entry=run?C.encounter():null;
    const progress=run?`<ol class="campaignStages" aria-label="Kampányelőrehaladás">${Array.from({length:5},(_,i)=>`<li class="${i<run.stage?'done':i===run.stage?'current':''}">${i===4?'♛':i+1}<span>${i===4?'BOSS':`${i+1}. HARC`}</span></li>`).join('')}</ol>`:'';
    let body='',title='Kampány';
    if(phase==='reward') {
      title='Győzelem · válassz ereklyét';
      body=`<p class="campaignLead">Egy lapot tarthatsz meg. A következő harcokban is veled marad.</p><div class="campaignRewards">${run.offers.map(id=>`<button type="button" class="campaignReward" data-campaign-reward="${id}" aria-label="${esc(R.RELICS.find(d=>d.id===id).name)} kiválasztása">${relicCard(id)}</button>`).join('')}</div>`;
    } else if(phase==='complete') {
      title='A kampány teljesítve!';body='<p class="campaignLead">Öt győzelem. A Vérudvar Ura elesett.</p>';
    } else if(run) {
      title=phase==='defeated'?'A főváros elesett':`${run.stage+1}. harc · ${entry.boss?'BOSS':'következő ellenfél'}`;
      const extra=C.startingAdvantages(entry);
      body=`<section class="campaignEnemy"><div><small>${esc(R.FACTIONS[entry.race].name)}</small><h3>${esc(entry.name)}</h3></div><ul>${extra.map(line=>`<li>${esc(line)}</li>`).join('')}</ul></section>${phase==='defeated'?'<p>Újrapróbálhatod ugyanazt az ellenfelet. A harc eleji kampányállapotod megmarad.</p>':phase==='battle'?'<p>A mentés a harc elejéről folytatódik. A csata közbeni város és fejlesztések újraindulnak.</p>':''}<div class="campaignActions">${button('battle',phase==='defeated'?'Harc újrapróbálása':phase==='battle'?'Harc újrakezdése':'Harc indítása',true)}</div>`;
    } else {
      body='<p class="campaignLead">Négy ellenfél, majd az élőhalott boss. Győzelem után válassz egy ereklyét, és építs egyre erősebb hadjáratot.</p>';
    }
    const setup=`<div class="campaignNew"><label for="campaignRace">Válassz népet</label><select id="campaignRace">${Object.entries(R.FACTIONS).map(([id,d])=>`<option value="${id}"${run?.race===id?' selected':''}>${esc(d.name)}</option>`).join('')}</select>${button('new','Új kampány indítása',true)}${run?'<small>Új kampány indításakor a korábbi végigjátszás mentése felülíródik.</small>':''}</div>`;
    const owned=run?.relics.length?`<details class="campaignOwned"><summary>Ereklyéid · ${run.relics.length}</summary><div class="campaignRelicShelf">${run.relics.map(relicCard).join('')}</div></details>`:'';
    const results=run?.results.length?`<p class="campaignResults">Megnyert harcok: ${run.results.length} / 5 · Összes játékidő: ${R.fmt(run.results.reduce((n,r)=>n+r.time,0))}</p>`:'';
    overlay.innerHTML=`<section class="campaignPanel"><header><div><small>ROADLORDS · HADJÁRAT</small><h2 id="campaignTitle">${title}</h2></div>${button('menu','Főmenü')}</header>${progress}${body}${results}${owned}${run?`<details class="campaignNewDetails"><summary>Új kampány</summary>${setup}</details>`:setup}<footer><p>Az ereklyék megmaradnak. Minden harcban új várost és sereget építesz.</p><p class="campaignSaveStatus" role="status">${esc(C.message||'A kampány a harcok között automatikusan mentődik ebben a böngészőben.')}</p>${R.state.ended&&C.active?button('summary','Csataösszesítő'):''}</footer></section>`;
    overlay.querySelectorAll('.cardFace').forEach(fitCardText);
    if(C.loading){const b=overlay.querySelector('[data-campaign-action="battle"]');if(b){b.disabled=true;b.textContent='Egységképek betöltése…';}}
    if(focused)overlay.querySelector('button:not(:disabled),select')?.focus();
  }
  overlay.addEventListener('click',async event=>{
    const reward=event.target.closest('[data-campaign-reward]');if(reward){C.chooseReward(reward.dataset.campaignReward);return;}
    const action=event.target.closest('[data-campaign-action]')?.dataset.campaignAction;
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
