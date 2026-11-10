import { unitIsElite } from '../data/unit-ranks.js';
import { EFFECT_COLORS as COLORS } from '../data/effect-palette.js';

const BITS = {burn:1,poison:2,slow:4,bleed:8,curse:32,stun:512};
let silhouette;
// Markers are batched vector paths; no marker image cache is needed.
export const statusSpriteCount = () => 0;
export function unitStatusMask(R,u) {
  let mask=unitIsElite(u)?128:0;
  if(R.MP.enabled&&R.MP.role==='guest') {
    for(const [id] of u.syncedStatusBadges||[])mask|=BITS[id]||0;
  } else {
    if(u.burnTime>0)mask|=1;
    if(u.orcPoison>0)mask|=2;
    if(u.slowTime>0||u.undWitherSlow>0||u.stunTime>0&&u.freezeFollow>0)mask|=4;
    if(u.orcBleed>0)mask|=8;
    if(R.orcCursePower(u,'curse'))mask|=32;
    if(u.stunTime>0)mask|=512;
  }
  return mask;
}
export function unitBodyStatus(R,u) {
  const mask=unitStatusMask(R,u),now=R.ROAD.clock;
  const recent=at=>at!=null&&now>=at&&now-at<.16;
  // A brief damage flash overrides the poison tint, then returns to green.
  const tint=recent(u.statusBleedFlashAt)?2:recent(u.statusBurnFlashAt)?3:mask&2?1:0;
  return tint|(mask&32?4:0);
}
// Called only while building a cached pose, never with per-unit pixel readback.
export function paintBodyStatus(canvas,status,resolution) {
  const g=canvas.getContext('2d'),tint=status&3;
  g.save();g.setTransform(1,0,0,1,0,0);
  if(tint) {
    g.globalCompositeOperation='source-atop';g.globalAlpha=tint===1?.42:.62;
    g.fillStyle=tint===1?COLORS.poison:tint===2?COLORS.bleed:COLORS.fire;
    g.fillRect(0,0,canvas.width,canvas.height);
  }
  if(status&4) {
    silhouette ||= document.createElement('canvas');
    silhouette.width=canvas.width;silhouette.height=canvas.height;
    const s=silhouette.getContext('2d');s.drawImage(canvas,0,0);
    s.globalCompositeOperation='source-in';s.fillStyle=COLORS.curse;s.fillRect(0,0,canvas.width,canvas.height);
    g.globalAlpha=.95;g.globalCompositeOperation='destination-over';
    const d=Math.max(1,1.3*resolution);
    for(const [x,y]of [[-d,0],[d,0],[0,-d],[0,d]])g.drawImage(silhouette,x,y);
  }
  g.restore();
}
// One path per symbol, instead of a thousand tiny image transfers. All units
// in a battle frame share the same camera scale; positions remain per-unit.
export function drawStatusBatch(g,queue,count) {
  if(!count)return;
  const scale=queue[0].scale;
  const visit=(bit,draw)=>{
    for(let i=0;i<count;i++){
      const p=queue[i],mask=p.mask;if(!(mask&bit))continue;
      const n=Number(!!(mask&128))+Number(!!(mask&4))+Number(!!(mask&512));
      const index=bit===128?0:bit===4?Number(!!(mask&128)):n-1;
      draw(p.x+(index-(n-1)/2)*12*p.scale,p.y+(p.top-14)*p.scale,p.scale);
    }
  };
  g.save();g.lineJoin='round';g.lineCap='round';
  g.beginPath();visit(128,(x,y,s)=>{g.moveTo(x-4*s,y-6*s);g.lineTo(x+4*s,y-6*s);g.lineTo(x+4*s,y+2*s);g.lineTo(x,y+6*s);g.lineTo(x-4*s,y+2*s);g.closePath();});
  g.fillStyle='#101914';g.fill();g.strokeStyle='#ffe391';g.lineWidth=scale;g.stroke();
  g.beginPath();visit(128,(x,y,s)=>{g.moveTo(x-2*s,y-3*s);g.lineTo(x,y-s);g.lineTo(x+2*s,y-3*s);g.moveTo(x-2*s,y);g.lineTo(x,y+2*s);g.lineTo(x+2*s,y);});
  g.strokeStyle='#ffd465';g.lineWidth=1.8*scale;g.stroke();
  g.beginPath();visit(4,(x,y,s)=>{g.moveTo(x,y-5*s);g.lineTo(x,y+5*s);g.moveTo(x-4*s,y+s);g.lineTo(x,y+5*s);g.lineTo(x+4*s,y+s);});
  g.strokeStyle=COLORS.frost;g.lineWidth=2.5*scale;g.stroke();
  g.beginPath();visit(512,(x,y,s)=>{for(let j=0;j<10;j++){const a=-Math.PI/2+j*Math.PI/5,r=(j%2?2.6:6)*s,px=x+Math.cos(a)*r,py=y+Math.sin(a)*r;j?g.lineTo(px,py):g.moveTo(px,py);}g.closePath();});
  g.strokeStyle='#101914';g.lineWidth=2*scale;g.stroke();g.fillStyle='#ffe391';g.fill();g.restore();
}
export function drawStatusEffects(R,g,u,detail,radius,x,y,scale,top=-51) {
  const mask=unitStatusMask(R,u)&(128|4|512);if(!mask)return;
  if(R.roadEffects?.collect) {
    const fx=R.roadEffects,item=fx.queue[fx.queueCount]||(fx.queue[fx.queueCount]={});fx.queueCount++;
    item.mask=mask;item.x=x;item.y=y;item.scale=scale;item.top=top;
  } else drawStatusBatch(g,[{mask,x:0,y:0,scale:1,top}],1);
}
