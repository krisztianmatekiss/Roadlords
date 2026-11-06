import {createCodexCards} from './codex-cards.js';
import {fitCardText} from './card-text-fit.js';
import {deckBack,deckStack} from './deck-back.js';
import {GATE_ICONS} from './command-icons.js';

const PICK_KINDS=new Set(['building','building_upgrade','building_branch','normal','legendary']);
const countCards=c=>Object.values(c.normal||{}).reduce((n,v)=>n+v,0)+
 [...(c.legends||[])].reduce((n,id)=>n+Math.max(1,Number(c.legendaryStacks?.[id])||0),0)+
 Object.values(c.deckBuildings||{}).reduce((n,v)=>n+v.count,0);

export function installCommandDock(R){
 const cards=createCodexCards(R),tabs=R.$('.catalog .tabs'),own=R.$('#relicBtn');
 const rail=document.createElement('div');rail.className='commandRail';tabs.before(rail);rail.append(tabs);
 const enemy=document.createElement('button');enemy.type='button';enemy.id='enemyDeckBtn';enemy.className='btn deckButton enemyDeckButton';
 enemy.setAttribute('aria-label','Ellenfél paklija');enemy.title='Ellenfél paklija';own.before(enemy);rail.append(own);
 own.className='deckButton ownDeckButton';own.title='Saját pakli';own.setAttribute('aria-label','Saját pakli');
 let ownRace='',enemyRace='',viewSide='player';
 function backs(){
  if(ownRace!==R.P.race){ownRace=R.P.race;own.innerHTML=deckStack(ownRace)+'<span class="deckCaption">PAKLI</span><b id="relicCount">0</b>';}
  if(enemyRace!==R.E.race){enemyRace=R.E.race;enemy.innerHTML=deckStack(enemyRace)+'<b id="enemyDeckCount">0</b>';}
  R.$('#relicCount').textContent=countCards(R.P);R.$('#enemyDeckCount').textContent=countCards(R.E);
 }
 const gate=document.createElement('div');gate.id='gateControls';gate.setAttribute('role','group');gate.setAttribute('aria-label','Kapu vezérlése');
 const names={open:'Nyitva',closed:'Zárva',auto:'Auto'};
 for(const button of R.$$('[data-gate]')){
  const mode=button.dataset.gate;button.classList.remove('gatebubble');button.innerHTML=GATE_ICONS[mode]+`<span>${names[mode]}</span>`;
  button.setAttribute('aria-label',mode==='auto'?'Automata kapu':mode==='open'?'Nyitott kapu':'Zárt kapu');gate.append(button);
 }
 R.$('#roadRoster').insertBefore(gate,R.$('#roadRoster').lastElementChild);
 R.$('#playerGate .gateMenu')?.remove();R.drawGate();
 function openDeck(side){
  viewSide=side;const overlay=R.$('#relicOverlay');overlay.dataset.deckSide=side;
  overlay.querySelector('h2').textContent=side==='player'?'Saját pakli':'Ellenfél paklija';
  R.renderRelics(side==='player'?R.P:R.E);overlay.classList.remove('hidden');
 }
 own.onclick=()=>openDeck('player');enemy.onclick=()=>openDeck('enemy');R.openDeck=openDeck;
 window.addEventListener('keydown',event=>{
  if(event.key==='Escape'&&!R.$('#relicOverlay').classList.contains('hidden')){
   event.preventDefault();event.stopImmediatePropagation();R.$('#relicOverlay').classList.add('hidden');
  }
 },true);
 const visible=(c=R.E)=>{
  if(!R.$('#relicOverlay').classList.contains('hidden')||document.hidden||R.state.modal||R.state.pregame||R.state.ended||R.ROAD.test||document.body.classList.contains('roadlords-menu-open'))return false;
  const city=R.$(c===R.P?'#playerGrid':'#enemyGrid')?.closest('.cityzone'),war=R.roadWar;if(!city||!war)return false;
  const style=getComputedStyle(city);if(style.display==='none'||style.visibility==='hidden')return false;
  const a=city.getBoundingClientRect(),b=war.getBoundingClientRect();
  return Math.min(a.right,b.right,innerWidth)-Math.max(a.left,b.left,0)>Math.min(80,a.width*.2)&&
   Math.min(a.bottom,b.bottom,innerHeight)-Math.max(a.top,b.top,0)>40;
 };
 R.enemyPickCityVisible=()=>visible(R.E);
 const reveals=[{side:'player',deck:own,queue:[],current:null},{side:'enemy',deck:enemy,queue:[],current:null}];
 const ownFlights=new Set(),observedPicks=new WeakMap();let guestReady=false;
 const flipFace=(html,race)=>`<div class="deckFlipInner"><div class="deckFlightFront">${html}</div><div class="deckFlightBack">${deckBack(race)}</div></div>`;
 const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
 function clearReveal(reveal){
  if(!reveal){reveals.forEach(clearReveal);return;}
  reveal.queue.length=0;if(!reveal.current)return;
  const old=reveal.current;reveal.current=null;clearTimeout(old.timer);old.element.getAnimations({subtree:true}).forEach(a=>a.cancel());old.element.remove();
 }
 function face(event,c){
  if(event.kind==='normal'||event.kind==='legendary'){
   const def=R[event.kind==='normal'?'NORMAL':'LEGENDARY'].find(o=>o.id===event.id);
   return def?cards.upgrade(def,event.kind,c.race,c):'';
  }
  return R.BUILDINGS[event.id]?cards.building(event.id,c.race,c):'';
 }
 function playNext(reveal){
  const {queue,side,deck}=reveal,c=side==='player'?R.P:R.E;
  if(reveal.current||!queue.length)return;if(!visible(c)){queue.length=0;return;}
  const event=queue.shift(),html=face(event,c);if(!html){playNext(reveal);return;}
  const element=document.createElement('div');element.id=side+'PickReveal';element.className='enemyPickReveal';
  element.setAttribute('aria-hidden','true');element.innerHTML=flipFace(html,c.race);document.body.append(element);
  const city=R.$(side==='player'?'#playerGrid':'#enemyGrid').closest('.cityzone').getBoundingClientRect(),war=R.roadWar.getBoundingClientRect();
  const width=Math.min(244,innerWidth*.23,(war.height-24)/1.5),height=width*1.5;
  const left=Math.max(8,Math.min(innerWidth-width-8,city.left+(city.width-width)/2));
  const top=Math.max(war.top+8,Math.min(war.bottom-height-8,city.top+city.height*.12));
  Object.assign(element.style,{width:`${width}px`,height:`${height}px`,left:`${left}px`,top:`${top}px`});
  fitCardText(element.querySelector('.cardFace'));
  const active=reveal.current={element,timer:0,animation:null};
  if(!reduced())active.animation=element.animate([{transform:'translateY(42px) scale(.3)',opacity:0},{transform:'translateY(0) scale(1)',opacity:1}],{duration:350,easing:'cubic-bezier(.16,1,.3,1)'});
  active.timer=setTimeout(()=>{
   if(reveal.current!==active)return;if(!visible(c)){clearReveal(reveal);return;}
   const target=deck.getBoundingClientRect(),box=element.getBoundingClientRect();
   const finish=()=>{if(reveal.current!==active)return;element.remove();reveal.current=null;deck.classList.remove('deckReceived');void deck.offsetWidth;deck.classList.add('deckReceived');playNext(reveal);};
   if(reduced()){finish();return;}
   element.querySelector('.deckFlipInner').animate([{transform:'rotateY(0deg)'},{transform:'rotateY(0deg)',offset:.2},{transform:'rotateY(180deg)'}],{duration:620,easing:'ease-in-out',fill:'forwards'});
   active.animation=element.animate([{transform:'translate(0,0) scale(1)',opacity:1},{transform:`translate(${target.left+target.width/2-box.left-box.width/2}px,${target.top+target.height/2-box.top-box.height/2}px) scale(.07)`,opacity:.2}],{duration:620,easing:'cubic-bezier(.5,0,.8,.55)',fill:'forwards'});
   active.animation.finished.then(finish,()=>{});
  },reduced()?2300:2900);
 }
 function receive(c,before){
  if(c!==R.E&&!(c===R.P&&R.spectator?.active))return;
  const reveal=reveals[c===R.P?0:1];
  before=Math.max(before,observedPicks.get(c)||0);
  observedPicks.set(c,Math.max(before,c.pickSerial||0));
  for(const event of c.pickEvents||[])if(event.seq>before&&PICK_KINDS.has(event.kind)&&visible(c)){
   if(reveal.queue.length<4)reveal.queue.push(event);
  }
  playNext(reveal);
  if((c.pickSerial||0)>before&&!R.$('#relicOverlay').classList.contains('hidden'))R.renderRelics(viewSide==='player'?R.P:R.E);
 }
 const apply=R.applyChoice;
 R.applyChoice=(c,o,...args)=>{
  const out=apply(c,o,...args);if(!PICK_KINDS.has(o.kind)||R.ROAD.test)return out;
  const before=c.pickSerial||0,seq=before+1;c.pickSerial=seq;
  const event={seq,id:o.id,kind:o.kind};if(o.branch)event.branch=o.branch;
  c.pickEvents=[...(c.pickEvents||[]),event].slice(-24);
  if(o.kind.startsWith('building')){
   c.deckBuildings||={};c.deckBuildings[o.id]={count:(c.deckBuildings[o.id]?.count||0)+1};
  }
  receive(c,before);backs();
  if(!R.$('#relicOverlay').classList.contains('hidden'))R.renderRelics(viewSide==='player'?R.P:R.E);
  return out;
 };
 const choose=R.choose;
 R.choose=(o,index,...args)=>{
  const source=R.$$('#choiceList .choice')[index],rect=source?.getBoundingClientRect(),before=R.P.pickSerial||0;
  const out=choose(o,index,...args);
  if(!rect||rect.width<=0||(R.P.pickSerial||0)===before||reduced()||document.body.classList.contains('roadlords-menu-open'))return out;
  const html=face(o,R.P);if(!html)return out;
  const element=document.createElement('div');element.className='deckChoiceFlight';element.setAttribute('aria-hidden','true');element.innerHTML=flipFace(html,R.P.race);
  Object.assign(element.style,{left:`${rect.left}px`,top:`${rect.top}px`,width:`${rect.width}px`,height:`${rect.height}px`});document.body.append(element);ownFlights.add(element);
  if(ownFlights.size>4){const oldest=ownFlights.values().next().value;oldest.remove();ownFlights.delete(oldest);}
  fitCardText(element.querySelector('.cardFace'));
  const dest=own.querySelector('.deckStack').getBoundingClientRect();
  const dx=dest.left+dest.width/2-rect.left-rect.width/2,dy=dest.top+dest.height/2-rect.top-rect.height/2;
  element.querySelector('.deckFlipInner').animate([{transform:'rotateY(0deg)'},{transform:'rotateY(0deg)',offset:.22},{transform:'rotateY(180deg)',offset:.75},{transform:'rotateY(180deg)'}],{duration:950,easing:'ease-in-out',fill:'forwards'});
  element.animate([{transform:'translate(0,0) scale(1)',opacity:1},{transform:`translate(${dx*.25}px,${dy*.15-30}px) scale(.65)`,opacity:1,offset:.35},{transform:`translate(${dx}px,${dy}px) scale(${Math.min(dest.width/rect.width,dest.height/rect.height)})`,opacity:.7}],{duration:950,easing:'cubic-bezier(.4,0,.8,.65)',fill:'forwards'}).finished.then(()=>{element.remove();ownFlights.delete(element);own.classList.remove('deckReceived');void own.offsetWidth;own.classList.add('deckReceived');},()=>{element.remove();ownFlights.delete(element);});
  return out;
 };
 const clearOwn=()=>{for(const element of ownFlights){element.getAnimations({subtree:true}).forEach(a=>a.cancel());element.remove();}ownFlights.clear();};
 const handle=R.mpHandle;
 R.mpHandle=(data,...args)=>{
  // The solo AI starts closed, but the remote human starts on Auto just like
  // the local player; their subsequent strategy messages own this setting.
  if(data?.type==='hello'&&R.MP.enabled&&!R.MP.started){R.E.gateMode='auto';R.E.autoReleasing=false;}
  return handle(data,...args);
 };
 const strategy=R.mpApplyGuestStrategy;
 R.mpApplyGuestStrategy=(data,...args)=>{const before=R.E.pickSerial||0,out=strategy(data,...args);receive(R.E,before);backs();return out;};
 const snapshot=R.mpApplySnapshot;
 R.mpApplySnapshot=(...args)=>{const before=R.E.pickSerial||0,out=snapshot(...args);if(guestReady)receive(R.E,before);else{guestReady=true;observedPicks.set(R.E,R.E.pickSerial||0);}backs();return out;};
 for(const key of ['pickSerial','pickEvents','deckBuildings'])R.MP_STRATEGY_KEYS.push(key);
 const reset=R.roadResetCity;
 R.roadResetCity=(...args)=>{clearReveal();clearOwn();guestReady=false;if(args[0])observedPicks.delete(args[0]);const out=reset(...args);if(R.MP.enabled&&args[0]){args[0].gateMode='auto';args[0].autoReleasing=false;}backs();return out;};
 const hud=R.updateHud;
 const cancelHidden=()=>{for(const reveal of reveals)if(reveal.current&&!visible(reveal.side==='player'?R.P:R.E))clearReveal(reveal);};
 R.updateHud=(...args)=>{const out=hud(...args);backs();cancelHidden();if(document.body.classList.contains('roadlords-menu-open'))clearOwn();return out;};
 R.roadWar.addEventListener('scroll',cancelHidden,{passive:true});
 window.addEventListener('resize',()=>{clearReveal();clearOwn();},{passive:true});
 document.addEventListener('visibilitychange',()=>{if(document.hidden)clearReveal();});
 R.$('#enemyCityPin').addEventListener('click',cancelHidden);
 R.$('#ownCityPin').addEventListener('click',cancelHidden);
 R.cancelEnemyPickReveal=()=>clearReveal(reveals[1]);backs();
}
