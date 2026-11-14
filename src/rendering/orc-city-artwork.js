import manifest from '../data/orc-map-art.json';
import { cityAtlasView,loadCityAtlasViews } from './city-atlas-views.js';

export function initializeOrcCityArtwork(R){
 let city=null;R.loadOrcMapArt=()=>R.orcMapArtReady||=(loadCityAtlasViews(R,manifest,'orc'));
 const render=R.renderCity;R.renderCity=(container,current,...args)=>{const old=city;city=current;try{return render(container,current,...args);}finally{city=old;}};
 const sprite=R.buildingSpriteHTML;R.buildingSpriteHTML=(type,rotation=0,bounds=null)=>manifest.sprites[type]&&(city||R.P).race==='orc'?cityAtlasView(R,manifest,type,rotation,'orcMap'):sprite(type,rotation,bounds);
 window.__ROADLORDS_ORC_MAP_VIEWS__=manifest;
}
