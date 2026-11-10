import { unitIsElite } from '../data/unit-ranks.js';
import { EFFECT_COLORS as COLORS } from '../data/effect-palette.js';

const BITS = {burn:1,poison:2,slow:4,bleed:8,curse:32,stun:512};
const markers = new Map();
let silhouette;
export const statusSpriteCount = () => markers.size;
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
export function drawStatusSprite(g,mask,top) {
  mask&=128|4|512;if(!mask)return;
  let sprite=markers.get(mask);
  if(!sprite) {
    sprite=document.createElement('canvas');sprite.width=40;sprite.height=18;
    const s=sprite.getContext('2d'),flags=[128,4,512].filter(bit=>mask&bit);
    s.translate(20,9);s.lineWidth=1.8;s.lineJoin='round';s.lineCap='round';
    flags.forEach((bit,i)=>{
      const x=(i-(flags.length-1)/2)*12;s.save();s.translate(x,0);
      s.strokeStyle='#101914';s.fillStyle='#101914';
      if(bit===128) {
        s.beginPath();s.moveTo(-4,-6);s.lineTo(4,-6);s.lineTo(4,2);s.lineTo(0,6);s.lineTo(-4,2);s.closePath();s.fill();s.strokeStyle='#ffe391';s.lineWidth=1;s.stroke();
        s.strokeStyle='#ffd465';s.lineWidth=1.8;s.beginPath();s.moveTo(-2,-3);s.lineTo(0,-1);s.lineTo(2,-3);s.moveTo(-2,0);s.lineTo(0,2);s.lineTo(2,0);s.stroke();
      } else if(bit===4) {
        s.strokeStyle=COLORS.frost;s.lineWidth=2.5;s.beginPath();s.moveTo(0,-5);s.lineTo(0,5);s.moveTo(-4,1);s.lineTo(0,5);s.lineTo(4,1);s.stroke();
      } else {
        s.beginPath();for(let j=0;j<10;j++){const a=-Math.PI/2+j*Math.PI/5,r=j%2?2.6:6;const px=Math.cos(a)*r,py=Math.sin(a)*r;j?s.lineTo(px,py):s.moveTo(px,py);}s.closePath();s.lineWidth=2;s.stroke();s.fillStyle='#ffe391';s.fill();
      }
      s.restore();
    });
    markers.set(mask,sprite);
  }
  g.drawImage(sprite,-20,top-23);
}
export function drawStatusEffects(R,g,u,detail,radius,x,y,scale,top=-51) {
  const mask=unitStatusMask(R,u)&(128|4|512);if(!mask)return;
  if(R.roadEffects?.collect) {
    const fx=R.roadEffects,item=fx.queue[fx.queueCount]||(fx.queue[fx.queueCount]={});fx.queueCount++;
    Object.assign(item,{mask,x,y,scale,top});
  } else drawStatusSprite(g,mask,top);
}
