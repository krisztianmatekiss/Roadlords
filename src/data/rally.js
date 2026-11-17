import { levelValue } from './faction-redesign.js';

export const RALLY_CAPACITY=[15,25,40,40];
export const RALLY_SPEED=[.3,.45,.6,.6];
export function rallyStats(level,branch=''){
  return{capacity:level>=4&&branch==='war_rally'?100:levelValue(level,RALLY_CAPACITY),
    speed:level>=4&&branch==='lightning_assault'?1.5:levelValue(level,RALLY_SPEED),
    range:level>=4&&branch==='war_rally'?2:1};
}
export function rallyDescription(level=1,branch=''){
  const s=rallyStats(level,branch),scope=s.range===2?'A 2 mezőn belüli táborok':'A szomszédos táborok';
  const gather=`${scope} egységeit külön gyűjti (${s.capacity} férőhely).`;
  if(level>=4&&branch==='lightning_assault')return `${gather} Induláskor +150% mozgás és lassításvédelem az első támadásig; utána 5 mp-re +100% támadási sebesség.`;
  return `${gather} Zárt főkapunál is indíthatók; az első támadásig +${Math.round(s.speed*100)}% mozgási sebesség.`;
}
