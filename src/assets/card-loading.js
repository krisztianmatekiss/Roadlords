import { assetUrl } from './urls.js';
import webImages from '../data/web-card-images.json';
const webUrls = new Map(Object.entries(webImages).map(([file,web])=>[assetUrl(file),assetUrl(web.file)]));
// The board exists beneath the opening menu. Do not download its large card
// atlases until the player actually opens the board or the encyclopedia.
export function cardImageSource(src, attribute = 'src') {
  const web = webUrls.get(src);
  const defer = document.documentElement.classList.contains('booting');
  if (attribute === 'href') {
    return defer ? `data-card-source="${web || src}" data-card-attribute="href"` : `href="${web || src}"`;
  }
  return defer
    ? `data-card-source="${src}" data-card-attribute="src"${web ? ` data-card-srcset="${web}"` : ''}`
    : `${web ? `srcset="${web}" ` : ''}src="${src}"`;
}
export function installDeferredCardImages() {
  const codex = document.querySelector('#rlCodexPanel');
  const flush = () => {
    if (document.body.classList.contains('roadlords-menu-open') && !codex?.classList.contains('show')) return;
    for (const image of document.querySelectorAll('[data-card-source]')) {
      if (image.dataset.cardSrcset) image.setAttribute('srcset', image.dataset.cardSrcset);
      image.setAttribute(image.dataset.cardAttribute, image.dataset.cardSource);
      delete image.dataset.cardSrcset;
      delete image.dataset.cardSource;
      delete image.dataset.cardAttribute;
    }
  };
  const observer = new MutationObserver(flush);
  observer.observe(document.body, {attributes:true, attributeFilter:['class']});
  if (codex) observer.observe(codex, {attributes:true, attributeFilter:['class']});
  queueMicrotask(flush);
}
