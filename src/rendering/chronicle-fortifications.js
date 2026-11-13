import { assetUrl } from '../assets/urls.js';
import art from '../data/chronicle-art.json';

// The whole enclosure is a single drawing, so its corners, masonry and gate
// share one camera and meet without stretched or overlaid corner fragments.
export function chronicleWalls(race,side,ready=true){
  const id='fortress-live-'+side,src=assetUrl(art[race].fortress.webFile);
  return `<svg class="chronicleWalls" data-side="${side}" data-race="${race}" viewBox="0 0 1000 1000" aria-hidden="true"><defs><mask id="${id}" maskUnits="userSpaceOnUse"><rect width="1000" height="1000" fill="white"/><rect class="fortressGateCut upper" x="830" y="310" width="170" height="160" fill="white"/><rect class="fortressGateCut lower" x="830" y="530" width="170" height="160" fill="white"/></mask></defs>${ready?`<image href="${src}" width="1000" height="1000" mask="url(#${id})"/>`:""}</svg>`;
}
export function chronicleTowerMarkup(race,index=0){
  return `<svg class="fortressGateDamage" viewBox="830 ${index?530:310} 170 160" aria-hidden="true"><image href="${assetUrl(art[race].fortress.webFile)}" width="1000" height="1000"/></svg><span class="gateTeamMedallion" aria-hidden="true"></span>`;
}
export function chronicleDoor(race){
  const base=race==='undead'?'#555963':race==='orc'?'#684329':'#a77843',metal=race==='undead'?'#84ab9d':'#393b34';
  const leaf=(y,name)=>`<g class="chronicleGateLeaf ${name}"><rect x="20" y="${y}" width="20" height="70" rx="2" fill="${base}" stroke="#302e27" stroke-width="3"/><path d="M25 ${y+4}v62M34 ${y+4}v62M21 ${y+17}h18M21 ${y+50}h18" stroke="${metal}" stroke-width="3"/></g>`;
  return `<svg class="chronicleDoor" data-race="${race}" viewBox="0 0 60 150" aria-hidden="true">${leaf(5,'upper')}${leaf(75,'lower')}</svg>`;
}
