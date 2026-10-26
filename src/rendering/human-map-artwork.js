import manifest from '../data/human-map-art.json';
import { assetUrl } from '../assets/urls.js';
import { mapImageSource } from '../assets/card-loading.js';

export function initializeHumanMapArtwork(R) {
  let city = null;
  const sources = manifest.sources || {samples:manifest.source};
  R.loadHumanMapArt = () => {
    if (R.humanMapArtReady) return R.humanMapArtReady;
    return R.humanMapArtReady=Promise.all(Object.values(sources).map(source=>{
      const image=new Image();image.src=assetUrl(source.webFile||source.file);
      return image.decode().then(()=>true,()=>false);
    })).then(result=>result.every(Boolean));
  };
  const renderCity = R.renderCity;
  R.renderCity = (container, current, interactive) => {
    const previous = city;city = current;
    try { return renderCity(container,current,interactive); }
    finally { city = previous; }
  };
  const sprite = R.buildingSpriteHTML;
  R.buildingSpriteHTML = (type, rotation = 0, bounds = null) => {
    const art = manifest.sprites[type];
    if (!art || (city || R.P).race !== 'human') return sprite(type,rotation,bounds);
    const source=sources[art.source||'samples'];
    const base=R.shapeBounds(type,0),box=bounds||R.shapeBounds(type,rotation),turn=((rotation%4)+4)%4;
    return `<span class="bspriteWrap humanMapSprite" data-human-map="${type}" data-art-rotation="${turn}"><span class="humanMapPlane" style="position:absolute;left:50%;top:50%;width:${base.w/box.w*94}%;height:${base.h/box.h*94}%;transform:translate(-50%,-50%) rotate(${turn*90}deg);transform-origin:center center;${R.isLShape(type)?'clip-path:'+R.lClipFor(type,0)+';':''}"><svg viewBox="${art.rect.join(' ')}" preserveAspectRatio="xMidYMid meet" overflow="hidden" style="display:block;width:100%;height:100%;overflow:hidden" aria-hidden="true"><image ${mapImageSource(assetUrl(source.webFile||source.file))} width="${source.width}" height="${source.height}"/></svg></span></span>`;
  };
  window.__ROADLORDS_HUMAN_MAP__ = manifest;
}
