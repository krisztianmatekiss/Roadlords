import {cardImageSource} from '../assets/card-loading.js';
import {assetUrl} from '../assets/urls.js';
const RECTS={human:[7,84,504,842],orc:[520,85,499,841],undead:[1030,77,504,851]};
export function deckBack(race='human'){
 const rect=RECTS[race]||RECTS.human;
 return `<svg class="factionDeckBack" data-deck-race="${RECTS[race]?race:'human'}" viewBox="${rect.join(' ')}" preserveAspectRatio="none" aria-hidden="true"><image ${cardImageSource(assetUrl('art/interface/deck-backs.webp'),'href')} width="1536" height="1024"/></svg>`;
}
export const deckStack=race=>`<span class="deckStack" aria-hidden="true">${[0,1,2].map(i=>`<span class="deckLayer layer${i}">${deckBack(race)}</span>`).join('')}</span>`;
