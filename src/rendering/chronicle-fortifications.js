import { assetUrl } from '../assets/urls.js';
import art from '../data/chronicle-art.json';

const stroke='#302b26';
export function chronicleTowerMarkup(race){
  const source=assetUrl(art[race].structures.webFile);
  return `<svg viewBox="0 0 512 520" aria-hidden="true"><svg width="512" height="520" overflow="hidden"><image href="${source}" width="512" height="1024"/></svg><path d="M224 300h64v48l-32 24-32-24Z" fill="currentColor" stroke="${stroke}" stroke-width="8"/></svg>`;
}
export function chronicleWalls(race,side){
  const id=`chronicleMaterial-${side}`;
  const material=race==='orc'
    ?`<pattern id="${id}" width="25" height="80" patternUnits="userSpaceOnUse"><path d="M0 0H25V80H0Z" fill="#704a32"/><path d="M3 0V80M20 0V80M9 9l3 25-3 27" stroke="#332b25" stroke-width="3"/><path d="M0 13H25M0 64H25" stroke="#4b4540" stroke-width="8"/></pattern>`
    :race==='undead'
      ?`<pattern id="${id}" width="76" height="46" patternUnits="userSpaceOnUse"><path d="M0 0H76V46H0Z" fill="#777681"/><path d="M0 23H76M18 0V23M57 23V46M35 4l-6 12 8 8-4 14" fill="none" stroke="#35363e" stroke-width="2"/><path d="m0 44 16-9 10 5 18-10 11 6 21-17" fill="none" stroke="#91aa92" stroke-width="1.5"/></pattern>`
      :`<pattern id="${id}" width="90" height="40" patternUnits="userSpaceOnUse"><path d="M0 0H90V40H0Z" fill="#d7bd89"/><path d="M0 0H90M0 20H90M0 40H90M22 0V20M68 20V40" fill="none" stroke="#78694f" stroke-width="1.6"/><path d="M2 3H86M2 23H86" stroke="#f7e7bd" stroke-width="2"/></pattern>`;
  const accents=[];
  for(let n=100;n<=900;n+=100){
    if(race==='orc')accents.push(`<path d="m${n-15} 14 9-37 11 35m-20 970 9 37 11-35" fill="#e1cf9f" stroke="${stroke}" stroke-width="3"/><path d="M9 ${n-14}l-28 10 29 13M989 ${n-14}l28 10-29 13" fill="#e1cf9f" stroke="${stroke}" stroke-width="3"/>`);
    else if(race==='undead')accents.push(`<path d="m${n-14} 19 14-32 14 32m-28 962 14 32 14-32" fill="#8e8b94" stroke="#373941" stroke-width="3"/><circle cx="${n}" cy="15" r="4" fill="#a2d2b6"/>`);
    else accents.push(`<path d="M${n-22} 16V-3h18v10h12V-3h18v19M${n-22} 984v19h18v-10h12v10h18v-19" fill="#e2c995" stroke="#514733" stroke-width="2"/>`);
  }
  const corners=[[0,0],[916,0],[0,916],[916,916]].map(([x,y])=>`<svg x="${x}" y="${y}" width="84" height="84" viewBox="0 530 512 494" overflow="hidden"><image href="${assetUrl(art[race].structures.webFile)}" width="512" height="1024"/></svg>`).join('');
  return `<svg class="chronicleWalls" data-side="${side}" data-race="${race}" viewBox="0 0 1000 1000" preserveAspectRatio="none" aria-hidden="true"><defs>${material}</defs><path d="M980 420V22H22V978H980V580" fill="none" stroke="${stroke}" stroke-width="42" stroke-linejoin="round"/><path d="M980 420V22H22V978H980V580" fill="none" stroke="url(#${id})" stroke-width="35"/>${accents.join('')}${corners}</svg>`;
}
export function chronicleDoor(race){
  const undead=race==='undead',orc=race==='orc',base=undead?'#656674':orc?'#62402c':'#ac7c45',metal=undead?'#a2c0ae':'#433e34';
  return `<svg class="chronicleDoor" data-race="${race}" viewBox="0 0 60 150" aria-hidden="true"><path d="M8 144V30L30 7l22 23v114Z" fill="#292c2a" stroke="#2d2921" stroke-width="3"/><g class="chronicleDoorLeaf"><path d="M12 140V33L30 14l18 19v107Z" fill="${base}" stroke="#302c26" stroke-width="3"/><path d="M22 25V138M34 20V138M45 32V138M13 55H47M13 116H47" fill="none" stroke="${metal}" stroke-width="3"/>${orc?'<path d="m15 52 30 67M45 52l-30 67" stroke="#bdb099" stroke-width="5"/>':undead?'<path d="M30 28V128M20 80h20" stroke="#8cc3a7" stroke-width="3"/>':''}<circle cx="36" cy="82" r="3" fill="#ead092" stroke="#332d25"/></g></svg>`;
}
