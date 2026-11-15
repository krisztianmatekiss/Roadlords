import { assetUrl } from '../assets/urls.js';
import { mapImageSource } from '../assets/card-loading.js';

let clipSerial=0;
export function loadCityAtlasViews(R,manifest,race){
 const used=new Set();
 for(const [type,art]of Object.entries(manifest.sprites))if(R.BUILDINGS[type]&&R.factionMatches(race,R.BUILDINGS[type],type)){
  used.add(art.source||'samples');for(const view of Object.values(art.views||{}))used.add(view.source);
 }
 return Promise.all([...used].map(key=>{const s=manifest.sources[key],image=new Image();image.src=assetUrl(s.webFile||s.file);return image.decode().then(()=>true,()=>false);})).then(values=>values.every(Boolean));
}
export function cityAtlasView(R,manifest,type,rotation,prefix){
 const art=manifest.sprites[type],turn=R.normalizedRotation(type,rotation),view=art.views?.[turn]||art,source=manifest.sources[view.source||'samples'];
 const race={humanMap:'human',orcMap:'orc',undMap:'undead'}[prefix];
 const clip='city-view-crop-'+(++clipSerial),[x,y,w,h]=view.rect,hole=R.isLShape(type,turn)?`clip-path:${R.lClipFor(type,turn)};`:'';
 return `<span class="bspriteWrap ${prefix}Sprite" data-${race}-map="${type}" data-art-rotation="${turn}"><span class="${prefix}Plane" style="position:absolute;left:50%;top:50%;width:94%;height:94%;transform:translate(-50%,-50%);${hole}"><svg ${race==='undead'?`class="undeadBuildingArt" data-undead-building="${type}" data-art-rotation="${turn}"`:''} viewBox="${view.rect.join(' ')}" preserveAspectRatio="xMidYMid meet" overflow="hidden" style="display:block;width:100%;height:100%;overflow:hidden" aria-hidden="true"><defs><clipPath id="${clip}"><rect x="${x}" y="${y}" width="${w}" height="${h}"/></clipPath></defs><image ${mapImageSource(assetUrl(source.webFile||source.file))} clip-path="url(#${clip})" width="${source.width}" height="${source.height}"/></svg></span></span>`;
}
