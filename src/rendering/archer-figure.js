import { usesPaintedBattleArt } from '../config/figure-trials.js';
import { assetUrl } from '../assets/urls.js';
import manifest from '../data/archer-art.json';

const TAU=Math.PI*2,HEIGHT=35,ARROW=30;
const mix=(a,b,t)=>a+(b-a)*t;
const RELEASE=[16,-33];

export function installArcherArt(R) {
  R.archerClothCache=new Map();
  R.loadArcherArt=()=>{
    if(R.archerArtReady)return R.archerArtReady;
    const image=new Image();R.archerTexture=image;image.src=assetUrl(manifest.file);
    return R.archerArtReady=image.decode().then(()=>true,()=>false);
  };
  R.archerLaunchPoint=()=>[...RELEASE];
  R.archerProjectilePoint=(a,t)=>archerProjectilePoint(R,a,t);
}
export const paintedArcher=(R,u)=>u.key==='archer'&&usesPaintedBattleArt(R,['archer','undead-figures'])&&R.archerTexture?.naturalWidth>0;

function joint(a,b,upper,lower,bend=1) {
  const dx=b[0]-a[0],dy=b[1]-a[1],d=Math.max(.001,Math.hypot(dx,dy)),reach=Math.min(d,upper+lower-.001);
  const along=(upper*upper-lower*lower+reach*reach)/(2*reach),across=Math.sqrt(Math.max(0,upper*upper-along*along))*bend;
  return [a[0]+dx/d*along-dy/d*across,a[1]+dy/d*along+dx/d*across];
}
function limb(g,R,name,start,end) {
  const r=manifest.parts[name],[[ax,ay],[bx,by]]=manifest.joints[name],sx=(bx-ax)*r[2],sy=(by-ay)*r[3],dx=end[0]-start[0],dy=end[1]-start[1];
  const scale=Math.hypot(dx,dy)/Math.hypot(sx,sy);
  g.save();g.translate(...start);g.rotate(Math.atan2(dy,dx)-Math.atan2(sy,sx));g.scale(scale,scale);
  g.drawImage(R.archerTexture,...r,-ax*r[2],-ay*r[3],r[2],r[3]);g.restore();
}
function cloth(R,color) {
  let parts=R.archerClothCache.get(color);if(parts)return parts;
  const hex=parseInt(color.slice(1),16),rgb=[hex>>16&255,hex>>8&255,hex&255];parts={};
  for(const name of ['head','torso','cape','cloth']){
    const r=manifest.parts[name],canvas=document.createElement('canvas');canvas.width=72;canvas.height=Math.round(72*r[3]/r[2]);
    const g=canvas.getContext('2d',{willReadFrequently:true});g.drawImage(R.archerTexture,...r,0,0,canvas.width,canvas.height);
    const data=g.getImageData(0,0,canvas.width,canvas.height),p=data.data;
    for(let i=0;i<p.length;i+=4){const red=p[i],green=p[i+1],blue=p[i+2];
      // Neutral fabric only: keep the face, brown leather, gold and ivory emblem.
      if(!p[i+3]||Math.max(red,green,blue)-Math.min(red,green,blue)>30||red>205&&green>200&&blue>175)continue;
      const light=(red+green+blue)/540;for(let c=0;c<3;c++)p[i+c]=Math.min(255,p[i+c]*.18+rgb[c]*light*.82);
    }
    g.putImageData(data,0,0);parts[name]=canvas;
  }
  if(R.archerClothCache.size>=8)R.archerClothCache.delete(R.archerClothCache.keys().next().value);
  R.archerClothCache.set(color,parts);return parts;
}
function bowPoint(name,grip,angle,bend) {
  const r=manifest.parts.bow,s=HEIGHT/r[3],a=manifest.bow,sign=name==='top'?-1:1;
  const x=(a[name][0]-a.grip[0])*r[2]*s,y=(a[name][1]-a.grip[1])*HEIGHT,rotation=angle+sign*bend;
  return [grip[0]+Math.cos(rotation)*x-Math.sin(rotation)*y,grip[1]+Math.sin(rotation)*x+Math.cos(rotation)*y];
}
export function drawArcher(g,R,color,p,elite,pose) {
  const tinted=cloth(R,color),part=(name,x,y,h,tint=false)=>{const r=manifest.parts[name],w=h*r[2]/r[3];if(tint)g.drawImage(tinted[name],x,y,w,h);else g.drawImage(R.archerTexture,...r,x,y,w,h);};
  const walking=pose.state==='walk',walk=walking?p.walk:0,lift=walking?Math.cos(p.wheel):0,bob=Math.abs(walk)*.55,death=p.death;
  const attacking=pose.state==='attack',released=attacking&&pose.frame>=7,recovery=released?(pose.frame-7)/4:0;
  const draw=attacking?(released?1-recovery:p.wind):0;
  // The last nocked pose and the first flying arrow use precisely this centre.
  const grip=attacking?[20,-33]:[10+walk*.5,-23],nock=attacking?[mix(16,1,draw),-33]:[5,-23];
  const angle=attacking?0:.28-walk*.08,bend=attacking&&!released?draw*.025:0;
  const top=bowPoint('top',grip,angle,bend),bottom=bowPoint('bottom',grip,angle,bend);
  const arrowLoaded=!death&&!released,arrowCenter=attacking?[nock[0]+ARROW/2,-33]:[nock[0]+ARROW/2,-23];
  const hips=[[-2.6,-16.5+bob],[3.0,-16.5+bob]],ankles=[[-4.8-walk*3.4,-2.5-Math.max(0,-lift)*2.4],[4.8+walk*3.4,-2.5-Math.max(0,lift)*2.4]];
  g.save();g.translate(death*3,-15);g.rotate(death*1.48);g.translate(0,15);
  const knees=hips.map((hip,i)=>{const knee=joint(hip,ankles[i],7.7,7.4,-1);g.save();if(!i)g.globalAlpha=.85;limb(g,R,'thigh',hip,knee);limb(g,R,'shin',knee,ankles[i]);part('boot',ankles[i][0]-1.4,ankles[i][1]-.8,4.6);g.restore();return knee;});
  g.save();g.translate(0,bob);
  g.save();g.translate(-5,-30);g.rotate(.15+walk*.04+death*.35);part('cape',-5,0,23,true);g.restore();
  g.save();g.translate(-6.5,-31);g.rotate(-.16);part('quiver',-4,-4,23);g.restore();
  const rear=death?[-4,-20]:nock,front=grip;
  const rearShoulder=[-4.4,-28.5],rearElbow=joint(rearShoulder,rear,8.1,8.1,-1);
  limb(g,R,'upperArm',rearShoulder,rearElbow);
  part('torso',-7,-32,21,true);
  // Seat the short neck inside the collar instead of above the shoulders.
  part('head',-4.3,-41,12,true);part('cloth',-4.3,-16.2,10.6,true);
  limb(g,R,'forearm',rearElbow,rear);
  const shoulder=[4.3,-28.5],elbow=joint(shoulder,front,8.7,8.7,1);
  limb(g,R,'upperArm',shoulder,elbow);limb(g,R,'forearm',elbow,front);
  const {stringNock}=drawArcherEquipment(g,R,{grip,nock,angle,bend,arrowCenter,arrowLoaded,released,recovery});
  for(const [hand,rotation]of [[rear,0],[front,angle]]){g.save();g.translate(...hand);g.rotate(rotation);g.fillStyle='#c79c65';g.strokeStyle='#63432d';g.lineWidth=.45;g.beginPath();g.roundRect(-1.4,-1.1,2.8,2.5,.7);g.fill();g.stroke();g.restore();}
  if(elite){g.strokeStyle='#f3d279';g.lineWidth=1;g.beginPath();g.moveTo(-5,-32);g.lineTo(-2,-30);g.moveTo(2,-30);g.lineTo(5,-32);g.stroke();g.fillStyle='#f2d175';g.beginPath();g.moveTo(-1,-24);g.lineTo(.4,-26);g.lineTo(1.8,-24);g.lineTo(.4,-22);g.closePath();g.fill();}
  g.restore();g.restore();
  return {painted:true,style:'painted-archer',hips,ankles,knees,hands:[rear,front],grip,nock,stringNock,top,bottom,arrowCenter,arrowLoaded,draw,released,death};
}

// Shared bow, string and release geometry for human and skeletal archers.
export function drawArcherEquipment(g,R,{grip,nock,angle,bend,arrowCenter,arrowLoaded,released,recovery}) {
  const top=bowPoint('top',grip,angle,bend),bottom=bowPoint('bottom',grip,angle,bend);
  const r=manifest.parts.bow,a=manifest.bow.grip,s=HEIGHT/r[3];
  // Two half-staves bend about the grip; the string follows their actual tips.
  for(const [upper,rotation]of [[true,angle-bend],[false,angle+bend]]){
    const sy=upper?0:a[1]*r[3],h=upper?a[1]*r[3]:(1-a[1])*r[3];
    g.save();g.translate(...grip);g.rotate(rotation);g.drawImage(R.archerTexture,r[0],r[1]+sy,r[2],h,-a[0]*r[2]*s,(sy-a[1]*r[3])*s,r[2]*s,h*s);g.restore();
  }
  const stringNock=released?[mix(16,nock[0],recovery),-33]:nock;
  g.strokeStyle='#ece0b4';g.lineWidth=.5;g.beginPath();g.moveTo(...top);g.lineTo(...stringNock);g.lineTo(...bottom);g.stroke();
  if(arrowLoaded){const rect=manifest.parts.arrow,w=ARROW,h=w*rect[3]/rect[2];g.drawImage(R.archerTexture,...rect,arrowCenter[0]-w/2,arrowCenter[1]-h/2,w,h);}
  return {top,bottom,stringNock};
}

export function archerProjectilePoint(R,a,t) {
  const from=R.pointAt(a.lane,a.offset),to=R.pointAt(a.to,a.toOffset),scale=R.ROAD.h/600*R.ROAD.zoom,face=a.archerFace||(a.to>=a.lane?1:-1);
  const x0=from.x+RELEASE[0]*scale*face,y0=from.y+RELEASE[1]*scale,x1=to.x,y1=to.y-25*scale;
  return {x:mix(x0,x1,t),y:mix(y0,y1,t)-Math.sin(t*Math.PI)*8*scale,angle:Math.atan2(y1-y0-Math.cos(t*Math.PI)*Math.PI*8*scale,x1-x0),scale};
}
export function drawArcherShot(R,u,a,t) {
  if(!paintedArcher(R,u))return false;
  a.archerFace??=a.to>=a.lane?1:-1;
  const p=archerProjectilePoint(R,a,t);if(p.x< -30||p.x>R.ROAD.w+30)return true;
  const g=R.ctx,r=manifest.parts.arrow,w=ARROW*p.scale,h=w*r[3]/r[2];
  g.save();g.translate(p.x,p.y);g.rotate(p.angle);g.drawImage(R.archerTexture,...r,-w/2,-h/2,w,h);g.restore();return true;
}
