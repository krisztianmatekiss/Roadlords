import { assetUrl } from './urls.js';
import webImages from '../data/web-card-images.json';
const webUrls = new Map(Object.entries(webImages).map(([file,web])=>[assetUrl(file),assetUrl(web.file)]));
const cachedUrls = new Map();
let libraryReady=false;
export const cardWebUrl=src=>webUrls.get(src)||src;
export const cardDeliveryUrl=src=>cachedUrls.get(cardWebUrl(src))||cardWebUrl(src);
export const cardArtReady=()=>libraryReady;
// Keep encoded image blobs, not hundreds of permanently retained decoded bitmaps.
// The same URLs are used by SVG illustrations, frame images and future cards.
export async function preloadCardImage(src){
  const url=cardWebUrl(src);if(cachedUrls.has(url))return 0;
  const response=await fetch(url,{cache:'force-cache'});
  if(!response.ok)throw Error(`Kártyakép: ${response.status}`);
  const blob=await response.blob(),objectUrl=URL.createObjectURL(blob);
  try{const image=new Image();image.src=objectUrl;await image.decode();cachedUrls.set(url,objectUrl);return blob.size;}
  catch(error){URL.revokeObjectURL(objectUrl);throw error;}
}
export function hydrateCardImages(root=document){
  for(const image of root.querySelectorAll('[data-card-source]')){
    const original=image.dataset.cardSource,attribute=image.dataset.cardAttribute;
    if(attribute==='href')image.setAttribute('href',cardDeliveryUrl(original));
    else{const delivered=cardDeliveryUrl(image.dataset.cardSrcset||original);if(delivered!==original)image.setAttribute('srcset',delivered);image.setAttribute('src',original);}
    delete image.dataset.cardSrcset;delete image.dataset.cardSource;delete image.dataset.cardAttribute;
  }
}
export function markCardArtReady(){libraryReady=true;hydrateCardImages();}
// The board exists beneath the opening menu. Modern startup hydrates its cards
// after the shared library is cached; classic layout retains lazy hydration.
export function cardImageSource(src, attribute = 'src') {
  const web = webUrls.get(src),delivered=cardDeliveryUrl(src);
  const defer = !libraryReady&&document.documentElement.classList.contains('booting');
  if (attribute === 'href') {
    return defer ? `data-card-source="${web || src}" data-card-attribute="href"` : `href="${delivered}"`;
  }
  return defer
    ? `data-card-source="${src}" data-card-attribute="src"${web ? ` data-card-srcset="${web}"` : ''}`
    : `${delivered!==src ? `srcset="${delivered}" ` : ''}src="${src}"`;
}
export function mapImageSource(src) {
  return document.documentElement.classList.contains('booting') || document.body.classList.contains('roadlords-menu-open')
    ? `data-map-source="${src}"`
    : `href="${src}"`;
}
export function installDeferredCardImages() {
  const codex = document.querySelector('#rlCodexPanel');
  const flush = () => {
    if (!document.body.classList.contains('roadlords-menu-open')) {
      for (const image of document.querySelectorAll('[data-map-source]')) {
        image.setAttribute('href',image.dataset.mapSource);delete image.dataset.mapSource;
      }
    }
    if (document.body.classList.contains('roadlords-menu-open') && !codex?.classList.contains('show')) return;
    hydrateCardImages();
  };
  const observer = new MutationObserver(flush);
  observer.observe(document.body, {attributes:true, attributeFilter:['class']});
  if (codex) observer.observe(codex, {attributes:true, attributeFilter:['class']});
  queueMicrotask(flush);
}
