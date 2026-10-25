import { assetUrl } from '../assets/urls.js';
import manifest from '../data/orc-mystics-art.json';
import { drawMagicShot } from './battle-effects.js';

const TAU=Math.PI*2,clamp=n=>Math.max(0,Math.min(1,n)),mix=(a,b,t)=>a+(b-a)*t;
export const paintedOrcMystic=(R,u)=>['orc_shaman','orc_troll'].includes(u.key)&&R.ROAD.test&&R.ROAD.testRoster==='orc-mystics'&&R.ROAD.figureStyle==='painted'&&R.orcMysticsTexture?.naturalWidth>0;

export function installOrcMysticsArt(R) {
  R.orcMysticsClothCache=new Map();
  R.loadOrcMysticsArt=()=>{
    if(R.orcMysticsArtReady)return R.orcMysticsArtReady;
    const image=new Image();R.orcMysticsTexture=image;image.src=assetUrl(manifest.file);
    return R.orcMysticsArtReady=image.decode().then(()=>true,()=>false);
  };
  R.shamanLaunchPoint=()=>weaponTip('staff',[13,-28],.6);
  R.shamanProjectilePoint=(a,t)=>shamanProjectilePoint(R,a,t);
}
function joint(a,b,upper,lower,bend=1) {
  const dx=b[0]-a[0],dy=b[1]-a[1],d=Math.max(.001,Math.hypot(dx,dy)),reach=Math.min(d,upper+lower-.001);
  const along=(upper*upper-lower*lower+reach*reach)/(2*reach),across=Math.sqrt(Math.max(0,upper*upper-along*along))*bend;
  return [a[0]+dx/d*along-dy/d*across,a[1]+dy/d*along+dx/d*across];
}
function limb(g,R,name,a,b) {
  const r=manifest.parts[name],[[ax,ay],[bx,by]]=manifest.joints[name],dx=b[0]-a[0],dy=b[1]-a[1],sx=(bx-ax)*r[2],sy=(by-ay)*r[3],s=Math.hypot(dx,dy)/Math.hypot(sx,sy);
  g.save();g.translate(...a);g.rotate(Math.atan2(dy,dx)-Math.atan2(sy,sx));g.scale(s,s);g.drawImage(R.orcMysticsTexture,...r,-ax*r[2],-ay*r[3],r[2],r[3]);g.restore();
}
function cloth(R,color) {
  let c=R.orcMysticsClothCache.get(color);if(c)return c;c=document.createElement('canvas');c.width=80;c.height=84;
  const g=c.getContext('2d',{willReadFrequently:true});g.drawImage(R.orcMysticsTexture,...manifest.parts.cloth,0,0,80,84);
  const data=g.getImageData(0,0,80,84),p=data.data,hex=parseInt(color.slice(1),16),rgb=[hex>>16&255,hex>>8&255,hex&255];
  for(let i=0;i<p.length;i+=4){const r=p[i],green=p[i+1],b=p[i+2];if(!p[i+3]||Math.max(r,green,b)-Math.min(r,green,b)>30||r>205&&green>195&&b>170)continue;const light=(r+green+b)/540;for(let k=0;k<3;k++)p[i+k]=Math.min(255,p[i+k]*.18+rgb[k]*light*.82);}
  g.putImageData(data,0,0);if(R.orcMysticsClothCache.size>=8)R.orcMysticsClothCache.delete(R.orcMysticsClothCache.keys().next().value);R.orcMysticsClothCache.set(color,c);return c;
}
function weaponTip(name,hand,angle) {
  const r=manifest.parts[name],a=manifest.anchors[name],h=manifest.weaponHeights[name],s=h/r[3],x=(a.tip[0]-a.grip[0])*r[2]*s,y=(a.tip[1]-a.grip[1])*h,rot=angle+manifest.weaponRotations[name];
  return [hand[0]+Math.cos(rot)*x-Math.sin(rot)*y,hand[1]+Math.sin(rot)*x+Math.cos(rot)*y];
}
function hand(g,R,name,point,angle,height,anchor='wrist') {
  const r=manifest.parts[name],a=manifest.anchors[name][anchor],w=height*r[2]/r[3];
  g.save();g.translate(...point);g.rotate(angle);g.drawImage(R.orcMysticsTexture,...r,-a[0]*w,-a[1]*height,w,height);g.restore();
}
function shamanGrip(g,point,angle,elite) {
  g.save();g.translate(...point);g.rotate(angle);g.fillStyle='#9d9c51';g.strokeStyle=elite?'#e4c66f':'#494b26';g.lineWidth=.45;g.beginPath();g.roundRect(-1.6,-1.6,3.2,3.2,.7);g.fill();g.stroke();
  g.lineWidth=.3;for(const y of [-.6,.2,.9]){g.beginPath();g.moveTo(-1.3,y);g.lineTo(.9,y);g.stroke();}g.restore();
}

export function drawOrcMystic(g,R,color,p,elite,pose,key) {
  const troll=key==='orc_troll',prefix=troll?'tr':'sh';
  const part=(name,x,y,h)=>{const r=manifest.parts[name],w=h*r[2]/r[3];g.drawImage(R.orcMysticsTexture,...r,x,y,w,h);};
  const walk=pose.state==='walk'?p.walk:0,lift=pose.state==='walk'?Math.cos(p.wheel):0,bob=Math.abs(walk)*(troll?.65:.45);
  const recovery=clamp((p.recovery-.2)/.8),strike=p.strike*(1-recovery),wind=p.wind*(1-p.strike)*(1-p.recovery);
  const pelvis=[1,(troll?-17.2:-16)+bob],waist=[pelvis[0],pelvis[1]-bob],spread=troll?5.6:4.8;
  const hips=[[pelvis[0]-3.5,pelvis[1]],[pelvis[0]+3.5,pelvis[1]]],feet=[[pelvis[0]-spread-walk*3.1,-2.8-Math.max(0,-lift)*2.4],[pelvis[0]+spread+walk*3.1,-2.8-Math.max(0,lift)*2.4]];
  g.save();g.translate(p.death*3,-18+17*Math.sin(p.death*1.48));g.rotate(p.death*1.48);g.translate(0,18);
  const knees=hips.map((start,i)=>{const knee=joint(start,feet[i],8.5,7.9,-1);g.save();if(!i)g.globalAlpha=.9;limb(g,R,prefix+'Thigh',start,knee);limb(g,R,prefix+'Shin',knee,feet[i]);const name=prefix+'Foot',r=manifest.parts[name],h=troll?5.8:5,w=h*r[2]/r[3],a=manifest.anchors[name].ankle;part(name,feet[i][0]-a[0]*w,feet[i][1]-a[1]*h,h);g.restore();return knee;});
  g.save();g.translate(0,bob);
  const grip=troll?[mix(18-5*wind,21,strike),mix(-24-12*wind,-26,strike)]:[mix(12,13,strike),-28-wind*1.3];
  const angle=troll?mix(.22-1.3*wind,1.3,strike):mix(-.10-.15*wind,.6,strike);
  const fistRect=manifest.parts.fist,fistAnchor=manifest.anchors.fist,fistHeight=6.5,dx=(fistAnchor.grip[0]-fistAnchor.wrist[0])*fistRect[2]*fistHeight/fistRect[3],dy=(fistAnchor.grip[1]-fistAnchor.wrist[1])*fistHeight;
  const far={shoulder:[troll?-9.8:-8,-30.5],wrist:troll?[-13+2*wind-strike,-17-3*wind+strike]:[-11-2*wind+strike,-22-3*wind-strike]},near={shoulder:[troll?5:6.5,troll?-31:-30.5],wrist:troll?[grip[0]-dx,grip[1]-dy]:[grip[0]-1.3,grip[1]]};
  far.elbow=joint(far.shoulder,far.wrist,8.7,8.2,1);near.elbow=joint(near.shoulder,near.wrist,8.7,8.2,1);
  limb(g,R,prefix+'Upper',far.shoulder,far.elbow);
  const torso=prefix+'Torso',r=manifest.parts[torso],a=manifest.anchors[torso],h=troll?25:22,w=h*r[2]/r[3],at=[waist[0]-a.waist[0]*w,waist[1]-a.waist[1]*h];
  // The generated torso includes skirt/hip stubs. The animated legs own that
  // silhouette; stop the chest at its belt before drawing the waist cloth.
  g.save();g.beginPath();g.rect(at[0],at[1],w,a.waist[1]*h+.5);g.clip();part(torso,...at,h);g.restore();
  const neck=[at[0]+a.neck[0]*w,at[1]+a.neck[1]*h],head=prefix+'Head',hr=manifest.parts[head],ha=manifest.anchors[head].neck,hh=troll?17:27,hw=hh*hr[2]/hr[3],hx=neck[0]-ha[0]*hw,hy=neck[1]-ha[1]*hh;
  g.save();if(!troll){g.beginPath();manifest.clips.shHead.forEach(([x,y],i)=>i?g.lineTo(hx+x*hw,hy+y*hh):g.moveTo(hx+x*hw,hy+y*hh));g.closePath();g.clip();}part(head,hx,hy,hh);g.restore();
  g.drawImage(cloth(R,color),waist[0]-7.2,waist[1]-1.4,14.4,troll?13.8:13);
  limb(g,R,prefix+'Fore',far.elbow,far.wrist);
  const freeAngle=Math.atan2(far.wrist[1]-far.elbow[1],far.wrist[0]-far.elbow[0]);
  hand(g,R,troll?'openHand':'palm',far.wrist,freeAngle-(troll?Math.PI/2:0),troll?8:5.8);
  limb(g,R,prefix+'Upper',near.shoulder,near.elbow);limb(g,R,prefix+'Fore',near.elbow,near.wrist);
  const weapon=troll?'club':'staff',wr=manifest.parts[weapon],wa=manifest.anchors[weapon].grip,wh=manifest.weaponHeights[weapon],ww=wh*wr[2]/wr[3];
  g.save();g.translate(...grip);g.rotate(angle+manifest.weaponRotations[weapon]);g.drawImage(R.orcMysticsTexture,...wr,-wa[0]*ww,-wa[1]*wh,ww,wh);g.restore();
  if(troll)hand(g,R,'fist',grip,0,fistHeight,'grip');else shamanGrip(g,grip,angle,elite);
  const tip=weaponTip(weapon,grip,angle),loaded=!troll&&pose.state==='attack'&&pose.frame<7;
  if(!troll&&!p.death){const radius=loaded?2.1+wind+strike:1.2,gradient=g.createRadialGradient(...tip,0,...tip,radius*2.5);gradient.addColorStop(0,'#f8e4ff');gradient.addColorStop(.25,'#bc72edbb');gradient.addColorStop(1,'#a565e800');g.fillStyle=gradient;g.beginPath();g.arc(...tip,radius*2.5,0,TAU);g.fill();}
  if(elite){g.strokeStyle='#f0cf76';g.lineWidth=1.2;g.beginPath();g.moveTo(-8,-30);g.lineTo(-4,-32);g.moveTo(4,-32);g.lineTo(8,-30);g.stroke();g.strokeStyle='#ffe3a0';g.lineWidth=.8;g.beginPath();g.moveTo(-5,waist[1]+2);g.lineTo(5,waist[1]+2);g.stroke();}
  g.restore();g.restore();
  return {painted:true,style:'painted-mystic',handRoles:{weapon:'near',free:'far'},arms:{far,near},grip,weapon,weaponAngle:angle,weaponTip:tip,loaded,neck,collar:[...neck],pelvis,waist:[waist[0],waist[1]+bob],hips,knees,feet,modelScale:manifest.modelScales[key],death:p.death};
}

export function shamanProjectilePoint(R,a,t) {
  const from=R.pointAt(a.lane,a.offset),to=R.pointAt(a.to,a.toOffset),s=R.ROAD.h/600*R.ROAD.zoom,face=a.shamanFace||(a.to>=a.lane?1:-1),start=R.shamanLaunchPoint();
  const x0=from.x+start[0]*s*face,y0=from.y+start[1]*s,x1=to.x,y1=to.y-13*s;
  return {x:mix(x0,x1,t),y:mix(y0,y1,t),angle:Math.atan2(y1-y0,x1-x0),scale:s};
}
export function drawShamanShot(R,u,a,t) {
  if(u.key!=='orc_shaman'||!paintedOrcMystic(R,u))return false;
  a.shamanFace??=a.to>=a.lane?1:-1;
  const p=shamanProjectilePoint(R,a,t);if(p.x< -40||p.x>R.ROAD.w+40)return true;
  const g=R.ctx;g.save();g.translate(p.x,p.y);g.rotate(p.angle);drawMagicShot(g,'curse',p.scale,R.ROAD.clock);g.restore();return true;
}
