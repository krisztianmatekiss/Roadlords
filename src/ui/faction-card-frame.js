import { assetUrl } from '../assets/urls.js';
import { cardImageSource } from '../assets/card-loading.js';

// Distinct paintings share measured panel bounds, keeping live copy aligned.
export const cardRarityPanels = '<svg class="cardRarityPanels" viewBox="0 0 100 150" preserveAspectRatio="none" aria-hidden="true"><rect class="rarityTitlePanel" x="11" y="2.8" width="78" height="10.3" rx=".5"/><rect class="rarityDescriptionPanel" x="6.5" y="92.7" width="87" height="46.4" rx=".8"/><rect class="rarityFooterPanel" x="9" y="141.1" width="82" height="6.2" rx=".5"/></svg>';

export function factionCardFrame(race, eager = false) {
  if (!['orc','undead'].includes(race)) return '';
  return `<span class="factionCardFrame" data-frame-art="${race}" aria-hidden="true"><img class="factionFrameImage" ${cardImageSource(assetUrl(`cards/frames/${race}.png`))} alt="" loading="${eager?'eager':'lazy'}" decoding="async" draggable="false">${cardRarityPanels}<svg class="factionFrameAccent" viewBox="0 0 100 150" preserveAspectRatio="none"><path d="M9 90H91"/></svg></span>`;
}
