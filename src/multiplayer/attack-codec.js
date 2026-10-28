const faces=['goblinFace','archerFace','casterFace','shamanFace','wargFace','undeadFace','catapultFace'];
const round=(n,precision=1000)=>Math.round((Number(n)||0)*precision)/precision;
// Visual timing is millisecond precision; authoritative combat keeps full precision.
export function packBattleAttack(a, clock) {
  if(!a||a.end<clock&&a.hit<clock)return null;
  return [round(a.start),round(a.launch),round(a.hit),round(a.end),round(a.recovery),
    round(a.lane,10),round(a.offset,10),round(a.to,10),round(a.toOffset,10),
    (a.ranged?1:0)|(a.orcSpear?2:0)|(a.resolved?4:0)|(a.goblinBow?8:0),a.effect||'',round(a.radius,10),
    faces.map(key=>a[key]||0)];
}
export function unpackBattleAttack(a,key) {
  if(!a||!Array.isArray(a))return a||null;
  const flags=a[9]||0;
  const out={key,start:a[0],launch:a[1],hit:a[2],end:a[3],recovery:a[4],lane:a[5],offset:a[6],to:a[7],toOffset:a[8],ranged:!!(flags&1),orcSpear:!!(flags&2),resolved:!!(flags&4),effect:a[10],radius:a[11]};
  if(key==='orc_goblin')out.goblinBow=!!(flags&8);
  faces.forEach((name,i)=>{if(a[12]?.[i])out[name]=a[12][i];});
  return out;
}
