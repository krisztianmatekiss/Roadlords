import { assetUrl } from '../assets/urls.js';
import manifest from '../data/human-casters-art.json';
import { drawMagicShot } from './battle-effects.js';

const TAU=Math.PI*2,clamp=n=>Math.max(0,Math.min(1,n)),mix=(a,b,t)=>a+(b-a)*t;
const trial=(R,u)=>['priest','mage'].includes(u.key)&&R.ROAD.test&&R.ROAD.testRoster==='casters';
export const paintedCaster=(R,u)=>trial(R,u)&&R.ROAD.figureStyle==='painted'&&R.humanCastersTexture?.naturalWidth>0;

export function installHumanCastersArt(R) {
  R.casterClothCache=new Map();R.casterHeals=[];
  R.loadHumanCastersArt=()=>{
    if(R.humanCastersArtReady)return R.humanCastersArtReady;
    const image=new Image();R.humanCastersTexture=image;image.src=assetUrl(manifest.file);
    return R.humanCastersArtReady=image.decode().then(()=>true,()=>false);
  };
  R.casterLaunchPoint=key=>launchPoint(key);
  R.casterProjectilePoint=(a,t)=>casterProjectilePoint(R,a,t);
  R.roadPriestHealEffect=(u,target)=>{
    if(!trial(R,u))return false;
    const start=R.ROAD.clock;u.roadHeal={start,end:start+.6};
    if(R.casterHeals.length>=128)R.casterHeals.shift();
    R.casterHeals.push({target,start});
    return paintedCaster(R,u);
  };
  R.drawCasterHealing=()=>{
    const now=R.ROAD.clock,g=R.ctx,scale=R.ROAD.h/600*R.ROAD.zoom;let n=0;
    for(const event of R.casterHeals){
      const age=now-event.start;if(age<0||age>.6)continue;R.casterHeals[n++]=event;
      if(!R.ROAD.test||R.ROAD.testRoster!=='casters'||R.ROAD.figureStyle!=='painted'||!event.target.alive)continue;
      const p=R.pointAt(event.target.lane,event.target.offset||0);if(p.x< -60||p.x>R.ROAD.w+60)continue;
      const t=age/.6;g.save();g.translate(p.x,p.y);g.scale(scale,scale);g.globalAlpha=(1-t)*.95;
      g.strokeStyle='#c4ef9b';g.lineWidth=1.2;g.beginPath();g.ellipse(0,1,11+t*5,3+t,0,0,TAU);g.stroke();
      for(let i=0;i<(R.ROAD.lowDetail?3:6);i++){
        const x=Math.sin(i*2.4+t*2)*8,y=-5-t*27-(i%3)*5;
        g.fillStyle=i%2?'#ffe6a0':'#9ce6aa';g.beginPath();g.arc(x,y,1.2-t*.5,0,TAU);g.fill();
        if(i%2===0){g.strokeStyle='#ffe8ac';g.lineWidth=.8;g.beginPath();g.moveTo(x-2,y);g.lineTo(x+2,y);g.moveTo(x,y-2);g.lineTo(x,y+2);g.stroke();}
      }
      g.restore();
    }
    R.casterHeals.length=n;
  };
}

export function casterHealingPose(u,pose,clock) {
  const heal=u.key==='priest'&&u.roadHeal;
  if(pose.state==='death'||!heal||clock<heal.start||clock>=heal.end)return pose;
  const healFrame=Math.min(5,Math.floor((clock-heal.start)/.6*6));
  return pose.state==='idle'?{state:'heal',frame:healFrame,healFrame}:{...pose,healFrame};
}
function cloth(R,color) {
  let parts=R.casterClothCache.get(color);if(parts)return parts;parts={};
  const hex=parseInt(color.slice(1),16),rgb=[hex>>16&255,hex>>8&255,hex&255];
  for(const name of ['priestTorso','priestRobe','mageHead','mageTorso','mageRobe','mageUpper','mageFore','cape']){
    const r=manifest.parts[name],c=document.createElement('canvas');c.width=80;c.height=Math.round(80*r[3]/r[2]);
    const g=c.getContext('2d',{willReadFrequently:true});g.drawImage(R.humanCastersTexture,...r,0,0,c.width,c.height);
    const data=g.getImageData(0,0,c.width,c.height),p=data.data;
    for(let i=0;i<p.length;i+=4){const red=p[i],green=p[i+1],blue=p[i+2],x=(i/4%c.width)/c.width;
      if(!p[i+3]||Math.max(red,green,blue)-Math.min(red,green,blue)>30||red>205&&green>200&&blue>175)continue;
      if(name.startsWith('priest')&&(x<(name==='priestTorso'?.4:.47)||x>.8))continue;
      const light=(red+green+blue)/540;for(let k=0;k<3;k++)p[i+k]=Math.min(255,p[i+k]*.18+rgb[k]*light*.82);
    }
    g.putImageData(data,0,0);parts[name]=c;
  }
  if(R.casterClothCache.size>=8)R.casterClothCache.delete(R.casterClothCache.keys().next().value);
  R.casterClothCache.set(color,parts);return parts;
}
function joint(a,b,length,bend) {
  const dx=b[0]-a[0],dy=b[1]-a[1],d=Math.max(.001,Math.hypot(dx,dy)),half=Math.min(d,length*2-.001)/2,across=Math.sqrt(Math.max(0,length*length-half*half))*bend;
  return [a[0]+dx/d*half-dy/d*across,a[1]+dy/d*half+dx/d*across];
}
function limb(g,R,tinted,name,start,end) {
  const r=manifest.parts[name],[[ax,ay],[bx,by]]=manifest.joints[name],sx=(bx-ax)*r[2],sy=(by-ay)*r[3],dx=end[0]-start[0],dy=end[1]-start[1],scale=Math.hypot(dx,dy)/Math.hypot(sx,sy);
  g.save();g.translate(...start);g.rotate(Math.atan2(dy,dx)-Math.atan2(sy,sx));g.scale(scale,scale);
  if(tinted[name])g.drawImage(tinted[name],-ax*r[2],-ay*r[3],r[2],r[3]);else g.drawImage(R.humanCastersTexture,...r,-ax*r[2],-ay*r[3],r[2],r[3]);g.restore();
}
function staffTip(key,hand,angle) {
  const name=key==='priest'?'priestStaff':'mageStaff',r=manifest.parts[name],a=manifest.anchors[name],s=43/r[3];
  const x=(a.tip[0]-a.grip[0])*r[2]*s,y=(a.tip[1]-a.grip[1])*43;
  return [hand[0]+Math.cos(angle)*x-Math.sin(angle)*y,hand[1]+Math.sin(angle)*x+Math.cos(angle)*y];
}
function launchPoint(key){return key==='priest'?staffTip(key,[-2.5,-25],1.12):[16,-31];}
function light(g,point,color,radius) {
  const glow=g.createRadialGradient(...point,0,...point,radius*2.5);glow.addColorStop(0,'#fff8dd');glow.addColorStop(.28,color+'ee');glow.addColorStop(1,color+'00');
  g.fillStyle=glow;g.beginPath();g.arc(...point,radius*2.5,0,TAU);g.fill();
}

export function drawHumanCaster(g,R,color,p,elite,pose,key,kind) {
  const priest=key==='priest',prefix=priest?'priest':'mage',tinted=cloth(R,color);
  const part=(name,x,y,h)=>{const r=manifest.parts[name],w=h*r[2]/r[3];if(tinted[name])g.drawImage(tinted[name],x,y,w,h);else g.drawImage(R.humanCastersTexture,...r,x,y,w,h);};
  const walk=pose.state==='walk'?p.walk:0,lift=pose.state==='walk'?Math.cos(p.wheel):0,bob=Math.abs(walk)*.45;
  const recovering=pose.state==='attack'&&pose.frame>=7,rest=recovering?clamp((pose.frame-7)/4):0;
  const cast=p.strike*(1-rest),wind=p.wind*(1-p.strike),healing=Number.isInteger(pose.healFrame),heal=healing?1-pose.healFrame/6:0;
  const staffHand=priest?[-7.5+5*cast,-23-2*cast]:[-8,-23],angle=priest?-.08+1.2*cast:-.08-walk*.025;
  const hand=priest?[mix(9,13,heal),mix(-22,-34,heal)]:[mix(9-18*wind,14,cast),mix(-22-7*wind,-29,cast)];
  const tip=staffTip(key,staffHand,angle),palm=[hand[0]+2,hand[1]-2],orbLoaded=key==='mage'&&pose.state==='attack'&&!recovering;
  const feet=[[-4-walk*3,-2-Math.max(0,-lift)*2.4],[4+walk*3,-2-Math.max(0,lift)*2.4]];
  g.save();g.translate(p.death*3,-17);g.rotate(p.death*1.48);g.translate(0,17);
  for(const foot of feet)part('boot',foot[0]-1.4,foot[1]-1,4.7);
  g.save();g.translate(0,bob);
  if(!priest){g.save();g.translate(-5,-31);g.rotate(.12+walk*.04+p.death*.2);part('cape',-5,0,27);g.restore();}
  g.save();g.translate(0,-19);g.rotate(walk*.035);part(prefix+'Robe',priest?-10.1:-10.8,0,17);g.restore();
  const shoulderBack=[-4.5,-28.5],elbowBack=joint(shoulderBack,staffHand,7.8,1);
  limb(g,R,tinted,prefix+'Upper',shoulderBack,elbowBack);
  part(prefix+'Torso',priest?-6.6:-7,-33,15.4);
  part(prefix+'Head',priest?-4.2:-7.8,priest?-42:-48,priest?11.4:16.5);
  limb(g,R,tinted,prefix+'Fore',elbowBack,staffHand);
  const shoulder=[4.8,-28.5],elbow=joint(shoulder,hand,7.8,1);
  limb(g,R,tinted,prefix+'Upper',shoulder,elbow);limb(g,R,tinted,prefix+'Fore',elbow,hand);
  const name=prefix+'Staff',r=manifest.parts[name],a=manifest.anchors[name].grip,s=43/r[3];
  g.save();g.translate(...staffHand);g.rotate(angle);g.drawImage(R.humanCastersTexture,...r,-a[0]*r[2]*s,-a[1]*43,r[2]*s,43);g.restore();
  g.fillStyle='#c79b66';g.strokeStyle='#6f4d32';g.lineWidth=.4;g.beginPath();g.roundRect(staffHand[0]-1.3,staffHand[1]-1.3,2.6,2.8,.65);g.fill();g.stroke();
  const palmRect=manifest.parts.palm,h=4.7,w=h*palmRect[2]/palmRect[3];g.drawImage(R.humanCastersTexture,...palmRect,hand[0]-.1*w,hand[1]-.82*h,w,h);
  if(!p.death){
    if(priest&&pose.state==='attack')light(g,tip,'#ffe2a0',recovering?1.1:1+cast*1.5+wind);
    if(priest&&healing)light(g,palm,'#c2f09c',1.5+heal*1.5);
    if(orbLoaded)light(g,palm,kind==='frost'?'#80ddff':'#ff8846',1.5+p.wind*1.8);
  }
  if(elite){g.strokeStyle='#f5d279';g.lineWidth=1.2;g.beginPath();g.moveTo(-6,-30.5);g.lineTo(-2,-28.5);g.moveTo(2,-28.5);g.lineTo(6,-30.5);g.stroke();g.strokeStyle='#fff0b2';g.lineWidth=.65;g.beginPath();g.moveTo(-5,-5);g.lineTo(5,-5);g.stroke();}
  g.restore();g.restore();
  return {painted:true,style:'painted-caster',hands:[staffHand,hand],staffTip:tip,palm,release:launchPoint(key),orbLoaded,healing,healFrame:pose.healFrame,feet,death:p.death};
}

export function casterProjectilePoint(R,a,t) {
  const from=R.pointAt(a.lane,a.offset),to=R.pointAt(a.to,a.toOffset),s=R.ROAD.h/600*R.ROAD.zoom,face=a.casterFace||(a.to>=a.lane?1:-1),start=launchPoint(a.key);
  const x0=from.x+start[0]*s*face,y0=from.y+start[1]*s,x1=to.x,y1=to.y-13*s;
  return {x:mix(x0,x1,t),y:mix(y0,y1,t),angle:Math.atan2(y1-y0,x1-x0),scale:s};
}
export function drawCasterShot(R,u,a,t) {
  if(!paintedCaster(R,u))return false;
  a.casterFace??=a.to>=a.lane?1:-1;
  const p=casterProjectilePoint(R,a,t);if(p.x< -40||p.x>R.ROAD.w+40)return true;
  const g=R.ctx;g.save();g.translate(p.x,p.y);g.rotate(p.angle);drawMagicShot(g,a.effect||(u.key==='priest'?'holy':'fire'),p.scale,R.ROAD.clock);g.restore();return true;
}
