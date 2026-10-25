import { usesPaintedBattleArt } from '../config/figure-trials.js';
import { assetUrl } from '../assets/urls.js';
import manifest from '../data/orc-siege-art.json';

const TAU=Math.PI*2,mix=(a,b,t)=>a+(b-a)*t,clamp=n=>Math.max(0,Math.min(1,n));
const READY_HAND=[5,-57.2],WIND_HAND=[-2,-57],RELEASE_HAND=[12,-52],STAB_HAND=[15,-45];
const READY_ANGLE=.03,WIND_ANGLE=-.25,RELEASE_ANGLE=.10,STAB_ANGLE=.80;
export const paintedOrcSiege=(R,u)=>['orc_warg','orc_ram'].includes(u.key)&&usesPaintedBattleArt(R,['orc-siege'])&&R.orcSiegeTexture?.naturalWidth>0;
export const orcSiegeVariant=(u,pose)=>u.key==='orc_warg'&&pose.state==='attack'&&u.roadAttack?.orcSpear?'throw':'melee';

export function installOrcSiegeArt(R) {
  R.orcSiegeClothCache=new Map();
  R.loadOrcSiegeArt=()=>{
    if(R.orcSiegeArtReady)return R.orcSiegeArtReady;
    const image=new Image();R.orcSiegeTexture=image;image.src=assetUrl(manifest.file);
    return R.orcSiegeArtReady=image.decode().then(()=>true,()=>false);
  };
  R.wargLaunchPoint=()=>spearCenter(RELEASE_HAND,RELEASE_ANGLE);
  R.wargProjectilePoint=(a,t)=>wargProjectilePoint(R,a,t);
}
function joint(a,b,upper,lower,bend=1) {
  const dx=b[0]-a[0],dy=b[1]-a[1],d=Math.max(.001,Math.hypot(dx,dy)),reach=Math.min(d,upper+lower-.001),along=(upper*upper-lower*lower+reach*reach)/(2*reach),across=Math.sqrt(Math.max(0,upper*upper-along*along))*bend;
  return [a[0]+dx/d*along-dy/d*across,a[1]+dy/d*along+dx/d*across];
}
function tint(R,color) {
  let parts=R.orcSiegeClothCache.get(color);if(parts)return parts;parts={};
  const hex=parseInt(color.slice(1),16),rgb=[hex>>16&255,hex>>8&255,hex&255];
  for(const name of ['wolfBody','riderTorso','riderThigh','blanket','banner']){
    const r=manifest.parts[name],c=document.createElement('canvas');c.width=160;c.height=Math.round(160*r[3]/r[2]);const g=c.getContext('2d',{willReadFrequently:true});g.drawImage(R.orcSiegeTexture,...r,0,0,c.width,c.height);
    const data=g.getImageData(0,0,c.width,c.height),p=data.data,neutral=name==='blanket'||name==='banner';
    for(let i=0;i<p.length;i+=4){
      const red=p[i],green=p[i+1],blue=p[i+2],grey=Math.max(red,green,blue)-Math.min(red,green,blue)<30,teamBlue=blue>red*1.2&&blue>green*1.1;
      if(!p[i+3]||!(neutral?grey:teamBlue)||red>205&&green>195&&blue>170)continue;
      const light=(red+green+blue)/520;for(let k=0;k<3;k++)p[i+k]=Math.min(255,p[i+k]*.16+rgb[k]*light*.84);
    }g.putImageData(data,0,0);parts[name]=c;
  }
  if(R.orcSiegeClothCache.size>=8)R.orcSiegeClothCache.delete(R.orcSiegeClothCache.keys().next().value);R.orcSiegeClothCache.set(color,parts);return parts;
}
function part(g,R,tinted,name,x,y,w){const r=manifest.parts[name],h=w*r[3]/r[2];if(tinted[name])g.drawImage(tinted[name],x,y,w,h);else g.drawImage(R.orcSiegeTexture,...r,x,y,w,h);return h;}
function limb(g,R,tinted,name,a,b) {
  const r=manifest.parts[name],[[ax,ay],[bx,by]]=manifest.joints[name],dx=b[0]-a[0],dy=b[1]-a[1],sx=(bx-ax)*r[2],sy=(by-ay)*r[3],s=Math.hypot(dx,dy)/Math.hypot(sx,sy);
  g.save();g.translate(...a);g.rotate(Math.atan2(dy,dx)-Math.atan2(sy,sx));g.scale(s,s);
  if(tinted[name])g.drawImage(tinted[name],-ax*r[2],-ay*r[3],r[2],r[3]);else g.drawImage(R.orcSiegeTexture,...r,-ax*r[2],-ay*r[3],r[2],r[3]);g.restore();
}
function fist(g,R,grip,angle,height) {
  const r=manifest.parts.fist,a=manifest.anchors.fist.grip,w=height*r[2]/r[3];g.save();g.translate(...grip);g.rotate(angle);g.drawImage(R.orcSiegeTexture,...r,-a[0]*w,-a[1]*height,w,height);g.restore();
}
function weaponArm(g,R,tinted,shoulder,grip) {
  const r=manifest.parts.fist,a=manifest.anchors.fist,h=4.5,dx=(a.grip[0]-a.wrist[0])*r[2]*h/r[3],dy=(a.grip[1]-a.wrist[1])*h,length=Math.hypot(dx,dy),elbow=joint(shoulder,grip,6.5,6+length,1),direction=Math.atan2(grip[1]-elbow[1],grip[0]-elbow[0]);
  const wrist=[elbow[0]+Math.cos(direction)*6,elbow[1]+Math.sin(direction)*6],handAngle=direction-Math.atan2(dy,dx);
  limb(g,R,tinted,'upper',shoulder,elbow);limb(g,R,tinted,'fore',elbow,wrist);
  return {shoulder,elbow,wrist,handAngle,grip};
}
function spearCenter(hand,angle) {
  const r=manifest.parts.spear,a=manifest.anchors.spear.grip,s=manifest.spearWidth/r[2],x=(.5-a[0])*r[2]*s,y=(.5-a[1])*r[3]*s;
  return [hand[0]+Math.cos(angle)*x-Math.sin(angle)*y,hand[1]+Math.sin(angle)*x+Math.cos(angle)*y];
}
function spear(g,R,hand,angle) {
  const r=manifest.parts.spear,a=manifest.anchors.spear.grip,w=manifest.spearWidth,h=w*r[3]/r[2];g.save();g.translate(...hand);g.rotate(angle);g.drawImage(R.orcSiegeTexture,...r,-a[0]*w,-a[1]*h,w,h);g.restore();
}

export function drawWargRider(g,R,color,p,elite,pose,variant) {
  const tinted=tint(R,color),walk=pose.state==='walk',cycle=walk?p.wheel:0,bob=walk?Math.sin(cycle*2)*.55:0,death=p.death;
  const hoofs=[],knees=[],saddle=[-4,-30+bob];
  g.save();g.translate(death*5,-17+15*Math.sin(death*1.45));g.rotate(death*1.45);g.translate(0,17);
  const leg=(front,near)=>{
    const phase=cycle+(front===near?0:Math.PI),stride=walk?-Math.cos(phase)*4.4:0,lift=walk?Math.max(0,Math.sin(phase))*3.6:0;
    const hip=[(front?9:-16)+(near?1.1:-1.1),-20+bob],foot=[(front?12:-17)+(near?1.1:-1.1)+stride,-2-lift],knee=joint(hip,foot,front?9:10,front?10:9.5,front?-1:1);
    g.save();if(!near)g.globalAlpha=.82;limb(g,R,tinted,front?'frontUpper':'hindUpper',hip,knee);limb(g,R,tinted,front?'frontLower':'hindLower',knee,foot);
    const r=manifest.parts.paw,a=manifest.anchors.paw.ankle,h=4.8,w=h*r[2]/r[3];part(g,R,tinted,'paw',foot[0]-a[0]*w,foot[1]-a[1]*h,w);g.restore();hoofs.push(foot);knees.push(knee);
  };
  leg(false,false);leg(true,false);
  g.save();g.translate(0,bob);
  const tr=manifest.parts.tail,ta=manifest.anchors.tail.root,th=16,tw=th*tr[2]/tr[3];g.save();g.translate(-23,-27);g.rotate(-.1+(walk?Math.sin(cycle)*.12:0));part(g,R,tinted,'tail',-ta[0]*tw,-ta[1]*th,tw);g.restore();
  part(g,R,tinted,'wolfBody',-27,-36,50);
  part(g,R,tinted,'blanket',-18,-30,27);
  g.save();g.beginPath();g.rect(-18,-36,26,10);g.clip();part(g,R,tinted,'wolfBody',-27,-36,50);g.restore();
  const hr=manifest.parts.wolfHead,ha=manifest.anchors.wolfHead.neck,hh=22,hw=hh*hr[2]/hr[3],neck=[9,-25];
  part(g,R,tinted,'wolfHead',neck[0]-ha[0]*hw,neck[1]-ha[1]*hh,hw);
  // Leather collar bridges the neck joint, below the jaw and away from teeth.
  g.strokeStyle='#4d3426';g.lineWidth=2.1;g.lineCap='round';g.beginPath();g.moveTo(11,-32);g.lineTo(7,-22);g.stroke();g.strokeStyle=color;g.lineWidth=.8;g.stroke();
  g.restore();leg(false,true);leg(true,true);

  g.save();g.translate(0,bob);
  const hips=[[-5,-30],[-3,-30]],riderKnees=[[1,-25],[5,-25]],ankles=[[-2,-15],[1,-14]];
  g.save();g.globalAlpha=.82;limb(g,R,tinted,'riderThigh',hips[0],riderKnees[0]);limb(g,R,tinted,'riderShin',riderKnees[0],ankles[0]);g.restore();
  part(g,R,tinted,'quiver',-13,-50,8);
  const torso=manifest.parts.riderTorso,a=manifest.anchors.riderTorso,h=18,w=h*torso[2]/torso[3],waist=[-3,-32],at=[waist[0]-a.waist[0]*w,waist[1]-a.waist[1]*h];part(g,R,tinted,'riderTorso',...at,w);
  const collar=[at[0]+a.neck[0]*w,at[1]+a.neck[1]*h],head=manifest.parts.riderHead,anchor=manifest.anchors.riderHead.neck,headH=12.5,headW=headH*head[2]/head[3];part(g,R,tinted,'riderHead',collar[0]-anchor[0]*headW,collar[1]-anchor[1]*headH,headW);
  limb(g,R,tinted,'riderThigh',hips[1],riderKnees[1]);limb(g,R,tinted,'riderShin',riderKnees[1],ankles[1]);
  const reinsHand=[-1,-33],reinsShoulder=[-12,-42],reinsArm=weaponArm(g,R,tinted,reinsShoulder,reinsHand);
  g.strokeStyle='#513425';g.lineWidth=.7;g.beginPath();g.moveTo(...reinsHand);g.quadraticCurveTo(17,-29,28,-28);g.stroke();fist(g,R,reinsHand,reinsArm.handAngle,4.5);
  const throwing=variant==='throw',released=throwing&&pose.frame>=7;
  let hand=[...READY_HAND],angle=READY_ANGLE;
  if(pose.state==='attack'){
    const contact=throwing?RELEASE_HAND:STAB_HAND,contactAngle=throwing?RELEASE_ANGLE:STAB_ANGLE;
    const rest=pose.frame>=7?clamp((pose.frame-7)/4):0;
    if(pose.frame<4){hand=READY_HAND.map((n,i)=>mix(n,WIND_HAND[i],p.wind));angle=mix(READY_ANGLE,WIND_ANGLE,p.wind);}
    else if(pose.frame<7){hand=WIND_HAND.map((n,i)=>mix(n,contact[i],p.strike));angle=mix(WIND_ANGLE,contactAngle,p.strike);}
    else{hand=contact.map((n,i)=>mix(n,READY_HAND[i],rest));angle=mix(contactAngle,READY_ANGLE,rest);}
  }
  const arm=weaponArm(g,R,tinted,[3,-43],hand),loaded=!death&&!released;
  if(loaded||death)spear(g,R,hand,angle);fist(g,R,hand,arm.handAngle,4.5);
  if(elite){g.strokeStyle='#f2cf74';g.lineWidth=1;g.beginPath();g.moveTo(-9,-43);g.lineTo(-5,-46);g.lineTo(-1,-44);g.stroke();g.fillStyle='#ecc667';g.fillRect(-1,-35,2.4,1.6);}
  g.restore();g.restore();
  return {painted:true,style:'painted-siege',variant,hoofs,knees,saddle,riderHip:[hips[1][0],hips[1][1]+bob],riderKnee:riderKnees[1],riderAnkle:ankles[1],neck:collar,collar:[...collar],headTop:collar[1]-anchor[1]*headH,arm,reinsArm,hand,payload:spearCenter(hand,angle),weaponAngle:angle,loaded,death};
}

export function drawOrcRam(g,R,color,p,elite,pose) {
  const tinted=tint(R,color),death=p.death,walking=pose.state==='walk',wheelAngle=walking?p.wheel:0,bob=walking?Math.sin(p.wheel*2)*.25:0,recovery=clamp((p.recovery-.2)/.8),strike=p.strike*(1-recovery),wind=p.wind*(1-p.strike)*(1-p.recovery),beamShift=-5*wind+9*strike;
  const wheels=[];
  const wheel=(x,y,r,far)=>{g.save();g.translate(x+death*(x<0?-11:11),y+death*3);g.scale(.9,1);g.rotate(wheelAngle+death*(x<0?-1.8:2.4));if(far)g.globalAlpha=.82;part(g,R,tinted,'wheel',-r,-r,r*2);if(elite){g.strokeStyle='#e6c975';g.lineWidth=.6;g.beginPath();g.arc(0,0,r*.92,0,TAU);g.stroke();}g.restore();wheels.push([x,y,wheelAngle]);};
  g.save();g.translate(-strike*.8,bob);
  wheel(-12,-8,5.5,true);wheel(18,-8,5.5,true);
  g.save();g.translate(death*2,death*17);g.rotate(death*.22);
  part(g,R,tinted,'beam',-24+beamShift,-23,58);
  part(g,R,tinted,'ramBody',-28,-36,56);
  // A small post masks the beam where it passes through the front frame.
  g.strokeStyle='#66472d';g.lineWidth=2.3;g.beginPath();g.moveTo(18,-24);g.lineTo(18,-9);g.stroke();g.strokeStyle='#bc955b';g.lineWidth=.65;g.stroke();
  part(g,R,tinted,'banner',-5,-40,12);
  if(elite){g.strokeStyle='#edca72';g.lineWidth=1.1;g.beginPath();g.moveTo(-27,-30);g.lineTo(-5,-37);g.lineTo(24,-31);g.stroke();}g.restore();
  wheel(-16,-3,6.4,false);wheel(15,-3,6.4,false);
  if(death){for(const side of [-1,1]){g.save();g.translate(side*death*23,-5+death*7);g.rotate(side*death*.5);part(g,R,tinted,'support',-8,-4,16);g.restore();}}
  g.restore();return {painted:true,style:'painted-siege',variant:'ram',wheels,wheelAngle,beamShift,beamTip:[34+beamShift,-16],body:[-strike*.8,bob],death};
}

export function wargProjectilePoint(R,a,t) {
  const from=R.pointAt(a.lane,a.offset),to=R.pointAt(a.to,a.toOffset),s=R.ROAD.h/600*R.ROAD.zoom,face=a.wargFace||(a.to>=a.lane?1:-1),start=R.wargLaunchPoint(),x0=from.x+start[0]*s*face,y0=from.y+start[1]*s,x1=to.x,y1=to.y-13*s,length=Math.min(Math.hypot(x1-x0,y1-y0)*.5,70*s),cx=x0+Math.cos(RELEASE_ANGLE)*face*length,cy=y0+Math.sin(RELEASE_ANGLE)*length,k=1-t;
  return {x:k*k*x0+2*k*t*cx+t*t*x1,y:k*k*y0+2*k*t*cy+t*t*y1,angle:Math.atan2(2*k*(cy-y0)+2*t*(y1-cy),2*k*(cx-x0)+2*t*(x1-cx)),scale:s};
}
export function drawWargShot(R,u,a,t) {
  if(u.key!=='orc_warg'||!a.orcSpear||!paintedOrcSiege(R,u))return false;
  a.wargFace??=a.to>=a.lane?1:-1;const p=wargProjectilePoint(R,a,t);if(p.x< -60||p.x>R.ROAD.w+60)return true;
  const g=R.ctx,r=manifest.parts.spear,w=manifest.spearWidth*p.scale,h=w*r[3]/r[2];g.save();g.translate(p.x,p.y);g.rotate(p.angle);g.drawImage(R.orcSiegeTexture,...r,-w/2,-h/2,w,h);g.restore();return true;
}
