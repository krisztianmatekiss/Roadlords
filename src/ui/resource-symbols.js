import { assetUrl } from '../assets/urls.js';

const MEAT = assetUrl('art/resources/meat.svg');
const words = /(?<!\p{L})(?:(?:fa|kő|élelem|lélek)(?=termel|bevétel|költség|fogyaszt|fenntart)|(?:fából|fát|fa|követ|kőből|kő|élelmiszert|élelmet|élelem|kaját|kaja|húst|hús|lelkeket|lelkek|lélekből|lelket|lélek)(?!\p{L}))/giu;
const keyFor = word => /^f/iu.test(word) ? 'wood' : /^kő|^köv/iu.test(word) ? 'stone' : /^l/iu.test(word) ? 'soul' : 'food';

export function resourceImage(R, key, race = R.P?.race) {
  const soul = key === 'soul' || key === 'wood' && race === 'undead';
  return {src:soul ? R.SOUL_IMAGE : key === 'food' && race === 'orc' ? MEAT : R.RESOURCE_IMAGES[key],
    label:soul ? 'Lélek' : key === 'food' && race === 'orc' ? 'Hús' : R.RESOURCE_NAMES[key]};
}

export function resourceIcon(R, key, race = R.P?.race, mini = false) {
  const {src,label} = resourceImage(R,key,race);
  return `<img class="costIcon resourceSymbol${mini ? ' mini' : ''}" data-resource="${key}" src="${src}" alt="${label}" title="${label}">`;
}

// Keep original names for accessibility and search, replacing their visual text only.
export function symbolizeResources(root, R, race = R.P?.race) {
  if (root.nodeType === 1 && root.closest('.resourceToken,script,style,textarea,input,svg')) return;
  const walker = document.createTreeWalker(root,NodeFilter.SHOW_TEXT), nodes=[];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  if (root.nodeType === Node.TEXT_NODE) nodes.push(root);
  for (const text of nodes) {
    const parent=text.parentElement;
    if (!parent || parent.closest('.resourceToken,script,style,textarea,input,svg')) continue;
    const matches=[...text.textContent.matchAll(words)];
    if (!matches.length) continue;
    const faction=parent.closest('[data-race]')?.dataset.race || race;
    if (parent.closest('option')) {
      parent.setAttribute('aria-label',text.textContent);
      const symbols={wood:'🪵',stone:'🪨',food:faction==='orc'?'🍖':'🌾',soul:'💠'};
      text.textContent=text.textContent.replace(words,word=>symbols[keyFor(word)]);
      continue;
    }
    const fragment=document.createDocumentFragment();let end=0;
    for (const match of matches) {
      fragment.append(document.createTextNode(text.textContent.slice(end,match.index)));
      const key=keyFor(match[0]),{src,label}=resourceImage(R,key,faction),token=document.createElement('span');
      token.className='resourceToken';token.dataset.resource=key;token.setAttribute('role','img');token.setAttribute('aria-label',label);token.title=label;
      const icon=document.createElement('img');icon.className='resourceSymbol';icon.src=src;icon.alt='';icon.setAttribute('aria-hidden','true');
      const name=document.createElement('span');name.className='sr-only';name.textContent=match[0];name.setAttribute('aria-hidden','true');
      token.append(icon,name);fragment.append(token);end=match.index+match[0].length;
    }
    fragment.append(document.createTextNode(text.textContent.slice(end)));text.replaceWith(fragment);
  }
}

export function symbolizeResourceHtml(html,R,race) {
  const template=document.createElement('template');template.innerHTML=html;
  symbolizeResources(template.content,R,race);return template.innerHTML;
}

export function initializeResourceSymbols(R) {
  const hud=R.updateHud;
  R.updateHud=(...args)=>{
    const out=hud(...args),img=R.$('#foodStock').closest('.res').querySelector('.resourceIcon'),{src,label}=resourceImage(R,'food');
    if (img.getAttribute('src')!==src) {img.src=src;img.alt=label;}
    return out;
  };
  const observer=new MutationObserver(records=>{
    for (const record of records) {
      if (record.type==='characterData') symbolizeResources(record.target,R);
      else record.addedNodes.forEach(node=>symbolizeResources(node,R));
    }
  });
  for (const selector of ['#inspector','#buildingInspectorLayer','#relicList','#roadTestSummary','.resources','#placementHint','#toast','#dynamicPickHud']) {
    const root=R.$(selector);if(root){symbolizeResources(root,R);observer.observe(root,{subtree:true,childList:true,characterData:true});}
  }
  R.updateHud();
}
