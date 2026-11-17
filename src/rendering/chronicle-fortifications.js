import { assetUrl } from '../assets/urls.js';
import art from '../data/chronicle-art.json';

// The whole enclosure is a single drawing, so its corners, masonry and gate
// share one camera and meet without stretched or overlaid corner fragments.
export function chronicleWalls(race,side,ready=true){
  const id='fortress-live-'+side,src=assetUrl(art[race].fortress.webFile),[x,y,w,h]=art[race].fortress.portal;
  return `<svg class="chronicleWalls" data-side="${side}" data-race="${race}" viewBox="0 0 1000 1000" aria-hidden="true"><defs><mask id="${id}" maskUnits="userSpaceOnUse"><rect width="1000" height="1000" fill="white"/><rect class="fortressGateCut upper" x="830" y="310" width="170" height="160" fill="white"/><rect class="fortressGateCut lower" x="830" y="530" width="170" height="160" fill="white"/><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="black"/></mask></defs>${ready?`<image href="${src}" width="1000" height="1000" mask="url(#${id})"/>`:""}</svg>`;
}
export function chronicleDoor(race,side,ready=true){
  const [x,y,w,h]=art[race].fortress.portal,id='gate-opening-'+side,src=assetUrl(art[race].fortress.webFile);
  // Turn the painted double door itself, so its seam and its travel both run
  // up/down along the side wall. The enclosure and its opening stay aligned.
  const cx=x+w/2,cy=y+h/2,turn=`translate(${cx} ${cy}) scale(${w/h} ${h/w}) rotate(90) translate(${-cx} ${-cy})`;
  const leaf=(top,name)=>`<g class="chronicleGateLeaf ${name}"><svg x="${x}" y="${top}" width="${w}" height="${h/2}" viewBox="${x} ${top} ${w} ${h/2}" overflow="hidden"><g class="chronicleDoorArt" transform="${turn}"><image href="${src}" width="1000" height="1000"/></g></svg></g>`;
  return `<svg class="chronicleDoor" data-side="${side}" data-race="${race}" viewBox="0 0 1000 1000" aria-hidden="true"><defs><clipPath id="${id}"><rect x="${x}" y="${y}" width="${w}" height="${h}"/></clipPath></defs>${ready?`<g clip-path="url(#${id})">${leaf(y,'upper')}${leaf(y+h/2,'lower')}</g>`:''}</svg>`;
}
