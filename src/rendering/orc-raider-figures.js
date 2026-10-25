import { assetUrl } from '../assets/urls.js';
import manifest from '../data/orc-raiders-art.json';

const TAU=Math.PI*2,clamp=n=>Math.max(0,Math.min(1,n)),mix=(a,b,t)=>a+(b-a)*t;
const GOBLIN_SCALE=manifest.modelScales.orc_goblin;
const goblinBow=(R,u)=>R.hasLeg(R.cityForSide(u.side),'orc_gob_bow');
export const paintedOrcRaider=(R,u)=>['orc_berserker','orc_goblin'].includes(u.key)&&R.ROAD.test&&R.ROAD.testRoster==='orc-raiders'&&R.ROAD.figureStyle==='painted'&&R.orcRaidersTexture?.naturalWidth>0;
export const orcRaiderVariant=(R,u)=>u.key==='orc_goblin'?(goblinBow(R,u)?'bow':'sling'):((u.roadAttacks||0)%2?'near':'far');

export function installOrcRaidersArt(R) {
  R.orcRaidersClothCache=new Map();
  R.loadOrcRaidersArt=()=>{
    if(R.orcRaidersArtReady)return R.orcRaidersArtReady;
    const image=new Image();R.orcRaidersTexture=image;image.src=assetUrl(manifest.file);
    return R.orcRaidersArtReady=image.decode().then(()=>true,()=>false);
  };
  R.goblinLaunchPoint=bow=>{
    const point=bow?[7.5,-30]:slingPose({state:'attack',frame:6}).pouch;
    return point.map(n=>n*GOBLIN_SCALE);
  };
  R.goblinLaunchDirection=()=>{
    const a=slingSwing(1-.00001).pouch,b=slingSwing(1).pouch,dx=b[0]-a[0],dy=b[1]-a[1],length=Math.hypot(dx,dy);
    return [dx/length,dy/length];
  };
  R.goblinProjectilePoint=(a,t)=>goblinProjectilePoint(R,a,t);
}
function joint(a,b,upper,lower,bend=1) {
  const dx=b[0]-a[0],dy=b[1]-a[1],d=Math.max(.001,Math.hypot(dx,dy)),reach=Math.min(d,upper+lower-.001);
  const along=(upper*upper-lower*lower+reach*reach)/(2*reach),across=Math.sqrt(Math.max(0,upper*upper-along*along))*bend;
  return [a[0]+dx/d*along-dy/d*across,a[1]+dy/d*along+dx/d*across];
}
function limb(g,R,name,a,b) {
  const r=manifest.parts[name],[[ax,ay],[bx,by]]=manifest.joints[name],dx=b[0]-a[0],dy=b[1]-a[1],sx=(bx-ax)*r[2],sy=(by-ay)*r[3],s=Math.hypot(dx,dy)/Math.hypot(sx,sy);
  g.save();g.translate(...a);g.rotate(Math.atan2(dy,dx)-Math.atan2(sy,sx));g.scale(s,s);g.drawImage(R.orcRaidersTexture,...r,-ax*r[2],-ay*r[3],r[2],r[3]);g.restore();
}
function cloth(R,color) {
  let c=R.orcRaidersClothCache.get(color);if(c)return c;c=document.createElement('canvas');c.width=80;c.height=72;
  const g=c.getContext('2d',{willReadFrequently:true});g.drawImage(R.orcRaidersTexture,...manifest.parts.cloth,0,0,80,72);
  const data=g.getImageData(0,0,80,72),p=data.data,hex=parseInt(color.slice(1),16),rgb=[hex>>16&255,hex>>8&255,hex&255];
  for(let i=0;i<p.length;i+=4){const r=p[i],green=p[i+1],b=p[i+2];if(!p[i+3]||Math.max(r,green,b)-Math.min(r,green,b)>32||r>205&&green>195&&b>170)continue;const light=(r+green+b)/540;for(let k=0;k<3;k++)p[i+k]=Math.min(255,p[i+k]*.18+rgb[k]*light*.82);}
  g.putImageData(data,0,0);if(R.orcRaidersClothCache.size>=8)R.orcRaidersClothCache.delete(R.orcRaidersClothCache.keys().next().value);R.orcRaidersClothCache.set(color,c);return c;
}
function fist(g,point,angle,elite=false) {
  g.save();g.translate(...point);g.rotate(angle);g.fillStyle='#9da65a';g.strokeStyle='#4c552d';g.lineWidth=.45;g.beginPath();g.roundRect(-1.6,-1.3,3,2.8,.75);g.fill();g.stroke();
  g.lineWidth=.3;for(const y of [-.5,.35]){g.beginPath();g.moveTo(-1.3,y);g.lineTo(.9,y);g.stroke();}
  if(elite){g.strokeStyle='#efd178';g.lineWidth=.8;g.beginPath();g.moveTo(-1.9,-1.6);g.lineTo(-1.9,1.5);g.stroke();}g.restore();
}
function axe(g,R,hand,angle,elite,mirror=1) {
  const r=manifest.parts.axe,a=manifest.anchors.axe.grip,h=23.5,s=h/r[3];
  g.save();g.translate(...hand);g.rotate(angle+manifest.axeRotation*mirror);g.scale(mirror,1);g.fillStyle='#65783e';g.beginPath();g.ellipse(0,0,1.8,1.8,0,0,TAU);g.fill();g.beginPath();manifest.clips.axe.forEach(([x,y],i)=>i?g.lineTo((x-a[0])*r[2]*s,(y-a[1])*h):g.moveTo((x-a[0])*r[2]*s,(y-a[1])*h));g.closePath();g.clip();g.drawImage(R.orcRaidersTexture,...r,-a[0]*r[2]*s,-a[1]*h,r[2]*s,h);g.restore();fist(g,hand,angle,elite);
}
function slingSwing(t) {
  // One backswing from the hanging pouch into an overhead release. The arm
  // pulls back, then follows through; the stone follows the combined motion.
  const s=1-t,hand=[13-27*s*t*t,-25.5*s*s*s-144*s*s*t-112.5*s*t*t-37.5*t*t*t],angle=Math.PI/2+(Math.PI-.2)*t;
  return {hand,angle,pouch:[hand[0]+Math.cos(angle)*12,hand[1]+Math.sin(angle)*12]};
}
function slingPose(pose) {
  const attack=pose.state==='attack',released=attack&&pose.frame>=7,recovery=released?(pose.frame-7)/4:0;
  const t=attack?Math.min(1,pose.frame/6):0,wind=slingSwing(t),release=slingSwing(1);
  const hand=released?[mix(release.hand[0],17,recovery),mix(release.hand[1],-26,recovery)]:wind.hand;
  const angle=released?release.angle+recovery*1.7:wind.angle,pouch=[hand[0]+Math.cos(angle)*12,hand[1]+Math.sin(angle)*12];
  return {hand,pouch,angle,released,wind:t,loaded:pose.state!=='death'&&!released};
}
const bowData=(()=>{
  const r=manifest.parts.bow,a=manifest.anchors.bow,dx=(a.bottom[0]-a.top[0])*r[2],dy=(a.bottom[1]-a.top[1])*r[3];
  return {rotation:Math.PI/2-Math.atan2(dy,dx),scale:34/Math.hypot(dx,dy)};
})();
function bowTip(name,hand,angle) {
  const r=manifest.parts.bow,a=manifest.anchors.bow,x=(a[name][0]-a.grip[0])*r[2]*bowData.scale,y=(a[name][1]-a.grip[1])*r[3]*bowData.scale,rot=bowData.rotation+angle;
  return [hand[0]+Math.cos(rot)*x-Math.sin(rot)*y,hand[1]+Math.sin(rot)*x+Math.cos(rot)*y];
}

export function drawOrcRaider(g,R,color,p,elite,pose,key,variant) {
  const gob=key==='orc_goblin',prefix=gob?'gob':'bers',bow=variant==='bow';
  const part=(name,x,y,h)=>{const r=manifest.parts[name],w=h*r[2]/r[3];g.drawImage(R.orcRaidersTexture,...r,x,y,w,h);};
  const walking=pose.state==='walk',walk=walking?p.walk:0,lift=walking?Math.cos(p.wheel):0,bob=Math.abs(walk)*.55;
  const recovery=clamp((p.recovery-.2)/.8),strike=p.strike*(1-recovery),wind=p.wind*(1-p.strike)*(1-p.recovery);
  const pelvis=[1,(gob?-16.3:-15.5)+bob];
  const feet=[[pelvis[0]-5.1-walk*3.5,-2.5-Math.max(0,-lift)*2.4],[pelvis[0]+5.1+walk*3.5,-2.5-Math.max(0,lift)*2.4]],hips=[[pelvis[0]-3.45,pelvis[1]],[pelvis[0]+3.45,pelvis[1]]];
  g.save();g.translate(p.death*3,-17+16*Math.sin(p.death*1.48));g.rotate(p.death*1.48);g.translate(0,17);
  const knees=hips.map((start,i)=>{const knee=joint(start,feet[i],7.8,7.3,-1);g.save();if(!i)g.globalAlpha=.86;limb(g,R,prefix+'Thigh',start,knee);limb(g,R,prefix+'Shin',knee,feet[i]);const name=prefix+'Foot',r=manifest.parts[name],h=4.6,w=h*r[2]/r[3],anchor=manifest.anchors[name].ankle;part(name,feet[i][0]-anchor[0]*w,feet[i][1]-anchor[1]*h,h);g.restore();return knee;});
  g.save();g.translate(0,bob);
  const sling=slingPose(pose),released=pose.state==='attack'&&pose.frame>=7;
  let farHand,nearHand,axes=[];
  if(gob){
    nearHand=bow?(pose.state==='attack'?[15,-30]:[13,-25.5]):sling.hand;
    farHand=bow?(pose.state==='attack'?[mix(9,-5,p.wind),-30]:[4,-25.5]):[-9-walk*.5+2*Math.sin(sling.wind*Math.PI),-22-Math.sin(sling.wind*Math.PI)*1.5];
  }else{
    const farLead=variant==='far';
    farHand=farLead?[mix(-13,8,strike),mix(-22-12*wind,-25,strike)]:[-13+2*wind,-22-2*strike];
    nearHand=farLead?[12+wind,-23-strike]:[mix(13-3*wind,15,strike),mix(-23-13.5*wind,-25.5,strike)];
    axes=[{hand:farHand,angle:farLead?mix(-.22-.68*wind,1.48,strike):-.22-.08*wind,mirror:-1},{hand:nearHand,angle:farLead?.35-.15*wind:mix(.35-1.55*wind,1.45,strike),mirror:1}];
  }
  const far={shoulder:[gob?-8.6:-7.6,-29.8],wrist:[farHand[0]-(gob?0:1.2),farHand[1]]},near={shoulder:[6,-29.8],wrist:[nearHand[0]-(gob?0:1.2),nearHand[1]]};
  if(gob&&!bow){near.shoulder[0]-=Math.sin(sling.wind*Math.PI)*.8;near.shoulder[1]-=Math.sin(sling.wind*Math.PI)*.45;}
  // Let the far elbow bend outside the silhouette. Keep only the shoulder
  // behind the torso; the forearm and hand remain visible in front of it.
  far.elbow=joint(far.shoulder,far.wrist,8.1,7.8,1);near.elbow=joint(near.shoulder,near.wrist,7.2,7.2,1);
  limb(g,R,prefix+'Upper',far.shoulder,far.elbow);
  const name=prefix+'Torso',r=manifest.parts[name],a=manifest.anchors[name],h=gob?20.5:22,w=h*r[2]/r[3],waist=[pelvis[0],pelvis[1]-bob],at=[waist[0]-a.waist[0]*w,waist[1]-a.waist[1]*h];
  part(name,...at,h);
  const neck=[at[0]+a.neck[0]*w,at[1]+a.neck[1]*h],headName=prefix+'Head',hr=manifest.parts[headName],ha=manifest.anchors[headName].neck,hh=gob?13:14,hw=hh*hr[2]/hr[3];
  part(headName,neck[0]-ha[0]*hw,neck[1]-ha[1]*hh,hh);
  g.drawImage(cloth(R,color),waist[0]-7.25,waist[1]-1.1,14.5,13.8);
  limb(g,R,prefix+'Fore',far.elbow,far.wrist);
  if(!gob)axe(g,R,axes[0].hand,axes[0].angle,elite,axes[0].mirror);
  limb(g,R,prefix+'Upper',near.shoulder,near.elbow);limb(g,R,prefix+'Fore',near.elbow,near.wrist);
  let payload=null;
  if(!gob)axe(g,R,axes[1].hand,axes[1].angle,elite,axes[1].mirror);
  else if(bow){
    const br=manifest.parts.bow,anchor=manifest.anchors.bow.grip,angle=pose.state==='attack'?0:.18,top=bowTip('top',nearHand,angle),bottom=bowTip('bottom',nearHand,angle);
    g.save();g.translate(...nearHand);g.rotate(bowData.rotation+angle);g.scale(bowData.scale,bowData.scale);g.beginPath();manifest.clips.bow.forEach(([x,y],i)=>i?g.lineTo((x-anchor[0])*br[2],(y-anchor[1])*br[3]):g.moveTo((x-anchor[0])*br[2],(y-anchor[1])*br[3]));g.closePath();g.clip();g.drawImage(R.orcRaidersTexture,...br,-anchor[0]*br[2],-anchor[1]*br[3],br[2],br[3]);g.restore();
    const nock=released?[nearHand[0]-3.5,nearHand[1]]:farHand;
    g.strokeStyle='#e5d9b2';g.lineWidth=.5;g.beginPath();g.moveTo(...top);g.lineTo(...nock);g.lineTo(...bottom);g.stroke();
    payload=[farHand[0]+12.5,farHand[1]];
    if(!p.death&&!released){const ar=manifest.parts.arrow;g.drawImage(R.orcRaidersTexture,...ar,farHand[0],farHand[1]-25*ar[3]/ar[2]/2,25,25*ar[3]/ar[2]);}
    fist(g,farHand,0,elite);fist(g,nearHand,0,elite);
  }else{
    payload=sling.pouch;const grip=sling.hand,[x,y]=sling.pouch,pr=manifest.parts.pouch,h=5.3,w=h*pr[2]/pr[3];
    g.strokeStyle='#c7a079';g.lineWidth=.65;g.beginPath();g.moveTo(grip[0]-.5,grip[1]);g.lineTo(x-w*.32,y);g.moveTo(x+w*.32,y);
    if(!sling.released)g.lineTo(grip[0]+.5,grip[1]);else g.lineTo(x+Math.cos(sling.angle+.8)*8,y+Math.sin(sling.angle+.8)*8);g.stroke();
    g.save();g.translate(x,y);g.rotate(sling.angle-Math.PI/2);part('pouch',-w/2,-h/2,h);if(sling.loaded){const rr=manifest.parts.rock,rockW=4.4;g.drawImage(R.orcRaidersTexture,...rr,-rockW/2,-rockW*rr[3]/rr[2]/2,rockW,rockW*rr[3]/rr[2]);}g.restore();
    fist(g,nearHand,0,elite);fist(g,farHand,.2,elite);
  }
  if(elite){g.strokeStyle='#f3d477';g.lineWidth=1.1;g.beginPath();g.moveTo(-7,-29);g.lineTo(-4,-31);g.moveTo(4,-31);g.lineTo(7,-29);g.stroke();}
  g.restore();g.restore();
  return {painted:true,style:'painted-raider',variant,handRoles:gob?{weapon:'near',free:'far'}:{far:'axe',near:'axe'},arms:{far,near},hands:[farHand,nearHand],axes,pelvis,waist:[waist[0],waist[1]+bob],hips,feet,knees,neck,collar:[...neck],payload,loaded:gob?(bow?!p.death&&!released:sling.loaded):false,modelScale:gob?GOBLIN_SCALE:1,death:p.death};
}

export function goblinProjectilePoint(R,a,t) {
  const from=R.pointAt(a.lane,a.offset),to=R.pointAt(a.to,a.toOffset),scale=R.ROAD.h/600*R.ROAD.zoom,face=a.goblinFace||(a.to>=a.lane?1:-1),start=R.goblinLaunchPoint(a.goblinBow);
  const x0=from.x+start[0]*scale*face,y0=from.y+start[1]*scale,x1=to.x,y1=to.y-13*scale;
  if(a.goblinBow)return {x:mix(x0,x1,t),y:mix(y0,y1,t)-Math.sin(t*Math.PI)*4*scale,angle:Math.atan2(y1-y0-Math.cos(t*Math.PI)*Math.PI*4*scale,x1-x0),scale};
  const direction=R.goblinLaunchDirection(),length=Math.min(Math.hypot(x1-x0,y1-y0)*.5,160*scale),cx=x0+direction[0]*face*length,cy=y0+direction[1]*length,s=1-t;
  return {x:s*s*x0+2*s*t*cx+t*t*x1,y:s*s*y0+2*s*t*cy+t*t*y1,angle:Math.atan2(2*s*(cy-y0)+2*t*(y1-cy),2*s*(cx-x0)+2*t*(x1-cx)),scale};
}
export function drawGoblinShot(R,u,a,t) {
  if(u.key!=='orc_goblin'||!paintedOrcRaider(R,u))return false;
  a.goblinBow??=goblinBow(R,u);a.goblinFace??=a.to>=a.lane?1:-1;
  const p=goblinProjectilePoint(R,a,t);if(p.x< -30||p.x>R.ROAD.w+30)return true;
  const g=R.ctx,r=manifest.parts[a.goblinBow?'arrow':'rock'],w=(a.goblinBow?25:4.4)*GOBLIN_SCALE*p.scale,h=w*r[3]/r[2];
  g.save();g.translate(p.x,p.y);g.rotate(a.goblinBow?p.angle:t*TAU);g.drawImage(R.orcRaidersTexture,...r,-w/2,-h/2,w,h);g.restore();return true;
}
