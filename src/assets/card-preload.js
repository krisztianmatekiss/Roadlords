import { createCodexCards } from '../ui/codex-cards.js';
import { cardWebUrl, markCardArtReady, preloadCardImage } from './card-loading.js';

// Discover art from the very same card renderer as the codex and real picks.
// Retired paintings, city sheets and battle atlases are not startup dependencies.
export function installCardArtPreloader(R){
  const state=R.cardArt={ready:false,loaded:0,total:0,bytes:0,urls:[],failures:[]};
  let pending,discovery;
  async function discover(){
    const cards=createCodexCards(R),urls=new Set(),template=document.createElement('template');
    const collect=html=>{
      template.innerHTML=html;
      for(const image of template.content.querySelectorAll('img,image')){
        const src=image.dataset.cardSrcset||image.getAttribute('srcset')||image.dataset.cardSource||image.getAttribute('href')||image.getAttribute('src');
        if(src&&!/^(data|blob):/.test(src))urls.add(cardWebUrl(new URL(src,document.baseURI).href));
      }
    };
    for(const race of ['human','orc','undead']){
      const matches=(d,key)=>R.factionMatches(race,d,key);
      for(const [key,d]of Object.entries(R.BUILDINGS))if(matches(d,key))collect(cards.building(key,race));
      for(const [key,d]of Object.entries(R.UNITS))if(matches(d,key))collect(cards.unit(key,d,race));
      for(const [list,kind]of [[R.NORMAL,'normal'],[R.LEGENDARY,'legendary']])for(const d of list)if(matches(d,d.id))collect(cards.upgrade(d,kind,race));
      // Give the progress bar and title a paint opportunity between factions.
      await new Promise(resolve=>setTimeout(resolve,0));
    }
    template.innerHTML='';return [...urls];
  }
  state.prepare=()=>discovery||=(async()=>{state.urls=await discover();state.total=state.urls.length;return state;})().catch(error=>{discovery=null;throw error;});
  state.preload=onProgress=>{
    if(pending)return pending;
    pending=(async()=>{
      await state.prepare();
      state.total=state.urls.length;state.loaded=0;state.failures=[];let index=0;
      onProgress?.(state);
      const worker=async()=>{while(index<state.urls.length){const url=state.urls[index++];try{state.bytes+=await preloadCardImage(url);state.loaded++;}catch{state.failures.push(url);}onProgress?.(state);}};
      await Promise.all(Array.from({length:6},worker));
      if(state.failures.length)throw Error(`${state.failures.length} kártyakép nem töltődött be`);
      state.ready=true;markCardArtReady();return state;
    })().finally(()=>{pending=null;});return pending;
  };
}
