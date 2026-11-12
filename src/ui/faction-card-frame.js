import { assetUrl } from '../assets/urls.js';
import { cardImageSource } from '../assets/card-loading.js';
import upgradeArt from '../data/upgrade-art-manifest.json';

// All factions share the Human frame's measured panels. Material tint is kept
// separate from the quiet rarity/category accent, so live text stays aligned.
export function factionCardFrame(race) {
  if (!['orc','undead'].includes(race)) return '';
  return `<span class="factionCardFrame" data-frame-art="${race}" aria-hidden="true"><img class="factionFrameImage" ${cardImageSource(assetUrl(upgradeArt.sources['human-frame'].file))} alt="" loading="lazy" decoding="async" draggable="false"><svg class="factionFrameAccent" viewBox="0 0 100 150" preserveAspectRatio="none"><path d="M2.9 17V86M97.1 17V86M2.9 95V139M97.1 95V139"/></svg></span>`;
}
