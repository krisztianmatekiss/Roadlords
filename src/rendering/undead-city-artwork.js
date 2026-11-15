import manifest from '../data/undead-map-art.json';
import { cityAtlasView,loadCityAtlasViews } from './city-atlas-views.js';

export function initializeUndeadCityArtwork(R){
 let city=null;R.loadUndeadCityArt=()=>R.undeadCityArtReady||=(loadCityAtlasViews(R,manifest,'undead'));
 const render=R.renderCity;R.renderCity=(container,current,...args)=>{const old=city;city=current;try{return render(container,current,...args);}finally{city=old;}};
 const sprite=R.buildingSpriteHTML;R.buildingSpriteHTML=(type,rotation=0,bounds=null)=>manifest.sprites[type]&&(city||R.P).race==='undead'?cityAtlasView(R,manifest,type,rotation,'undMap'):sprite(type,rotation,bounds);
 window.__ROADLORDS_UNDEAD_MAP_VIEWS__=manifest;
}
