import { assetUrl } from '../assets/urls.js';
import { cardImageSource } from '../assets/card-loading.js';
import { UPGRADE_RARITIES } from '../progression/upgrade-rarities.js';

// Source atlas stays intact; SVG viewports select each painted faction frame.
// The writing panels below are measured against this artwork, not the Human rim.
export const FACTION_FRAME_ART = Object.freeze({
  file: 'cards/frames/orc-undead-frames.webp', width:1536, height:1024,
  orc: [14,0,736,1024], undead:[789,0,736,1024],
});
export function factionCardFrame(race) {
  if (!FACTION_FRAME_ART[race]) return '';
  const trim=race==='orc'
    ? 'M9 18 15 12H85L91 18V136L85 142H15L9 136Z'
    : 'M8 19 15 12 23 9H77L85 12 92 19V133L85 143H15L8 133Z';
  return `<svg class="factionCardFrame" data-frame-art="${race}" viewBox="0 0 100 150" preserveAspectRatio="none" aria-hidden="true"><svg class="factionFrameArtwork" x="0" y="0" width="100" height="150" viewBox="${FACTION_FRAME_ART[race].join(' ')}" preserveAspectRatio="none"><image ${cardImageSource(assetUrl(FACTION_FRAME_ART.file),'href')} width="${FACTION_FRAME_ART.width}" height="${FACTION_FRAME_ART.height}"/></svg><path class="factionRarityTrim" d="${trim}" fill="none" stroke="var(--card-border)" stroke-width=".65"/></svg>`;
}

export function cardRarityMark(rarity) {
  if (!['uncommon','rare'].includes(rarity)) return '';
  const label=UPGRADE_RARITIES[rarity].label;
  const gem=rarity==='rare'
    ? '<path d="m16 2 10 14-10 14L6 16Z"/><path d="m3 10 5 6-5 6-3-6Zm26 0 3 6-3 6-5-6Z"/>'
    : '<path d="m16 2 12 14-12 14L4 16Z"/>';
  return `<span class="cardRarityMark" role="img" aria-label="${label}"><svg viewBox="0 0 32 32" aria-hidden="true">${gem}<path class="rarityGemFacet" d="m16 2-4 14 4 14 4-14Z"/></svg><span>${label}</span></span>`;
}
