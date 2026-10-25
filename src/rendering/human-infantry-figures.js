import { assetUrl } from '../assets/urls.js';
import manifest from '../data/human-infantry-art.json';

const TAU=Math.PI*2,clamp=n=>Math.max(0,Math.min(1,n)),mix=(a,b,t)=>a+(b-a)*t;

export function installHumanInfantryArt(R) {
  R.humanInfantryClothCache=new Map();
  R.loadHumanInfantryArt=()=>{
    if(R.humanInfantryArtReady)return R.humanInfantryArtReady;
    const image=new Image();R.humanInfantryTexture=image;image.src=assetUrl(manifest.file);
    return R.humanInfantryArtReady=image.decode().then(()=>true,()=>false);
  };
}
export const paintedHumanInfantry=(R,u)=>(u.key==='swordsman'||u.key==='spearman')&&R.ROAD.test&&['infantry','casters','orc-raiders','orc-mystics'].includes(R.ROAD.testRoster)&&R.ROAD.figureStyle==='painted'&&R.humanInfantryTexture?.naturalWidth>0;

function joint(start,end,upper,lower,bend=1) {
  const dx=end[0]-start[0],dy=end[1]-start[1],distance=Math.max(.001,Math.hypot(dx,dy)),reach=Math.min(distance,upper+lower-.001);
  const along=(upper*upper-lower*lower+reach*reach)/(2*reach),across=Math.sqrt(Math.max(0,upper*upper-along*along))*bend;
  return [start[0]+dx/distance*along-dy/distance*across,start[1]+dy/distance*along+dx/distance*across];
}
function limb(g,R,name,start,end) {
  const r=manifest.parts[name],[[ax,ay],[bx,by]]=manifest.joints[name],sx=(bx-ax)*r[2],sy=(by-ay)*r[3],dx=end[0]-start[0],dy=end[1]-start[1];
  const scale=Math.hypot(dx,dy)/Math.hypot(sx,sy);
  g.save();g.translate(...start);g.rotate(Math.atan2(dy,dx)-Math.atan2(sy,sx));g.scale(scale,scale);
  g.drawImage(R.humanInfantryTexture,...r,-ax*r[2],-ay*r[3],r[2],r[3]);g.restore();
}
function cloth(R,color) {
  let canvas=R.humanInfantryClothCache.get(color);if(canvas)return canvas;
  canvas=document.createElement('canvas');canvas.width=80;canvas.height=72;
  const g=canvas.getContext('2d',{willReadFrequently:true});g.drawImage(R.humanInfantryTexture,...manifest.parts.cloth,0,0,80,72);
  const data=g.getImageData(0,0,80,72),hex=parseInt(color.slice(1),16),rgb=[hex>>16&255,hex>>8&255,hex&255];
  for(let i=0;i<data.data.length;i+=4){const p=data.data,r=p[i],green=p[i+1],b=p[i+2];if(!p[i+3]||r>205&&green>200&&b>175)continue;
    const light=(r+green+b)/540;for(let c=0;c<3;c++)p[i+c]=Math.min(255,p[i+c]*.18+rgb[c]*light*.82);
  }
  g.putImageData(data,0,0);if(R.humanInfantryClothCache.size>=8)R.humanInfantryClothCache.delete(R.humanInfantryClothCache.keys().next().value);
  R.humanInfantryClothCache.set(color,canvas);return canvas;
}

export function drawHumanInfantry(g,R,color,p,elite,walking,key) {
  const spear=key==='spearman',part=(name,x,y,h)=>{const r=manifest.parts[name],w=h*r[2]/r[3];g.drawImage(R.humanInfantryTexture,...r,x,y,w,h);return w;};
  const recovery=clamp((p.recovery-.2)/.8),strike=p.strike*(1-recovery),wind=p.wind*(1-p.strike)*(1-p.recovery);
  const death=p.death,walk=walking?p.walk:0,lift=walking?Math.cos(p.wheel):0,bob=Math.abs(walk)*.55;
  const thrust=(spear?1.5:2)*strike-.7*wind;
  g.save();g.translate(thrust+death*3,0);g.translate(0,-15);g.rotate(death*1.48);g.translate(0,15);
  const hips=[[-2.7,-16.5+bob],[3.2,-16.5+bob]],ankles=[[-4.9-walk*3.4,-2.5-Math.max(0,-lift)*2.4],[5.0+walk*3.4,-2.5-Math.max(0,lift)*2.4]];
  const knees=hips.map((hip,i)=>{const knee=joint(hip,ankles[i],7.7,7.4,-1);g.save();if(!i)g.globalAlpha=.85;limb(g,R,'thigh',hip,knee);limb(g,R,'shin',knee,ankles[i]);part('boot',ankles[i][0]-1.25,ankles[i][1]-.8,4.6);g.restore();return knee;});
  g.save();g.translate(0,bob);
  const angle=mix(spear?1.10-.18*wind+.46*strike:.42-1.45*wind+strike,spear?.09:.1,death);
  const rear=spear?[mix(-1-2.5*wind+5*strike,2,death),mix(-22.5-.7*strike,-22,death)]:[-7.5,-20.8];
  const hand=spear?[rear[0]+Math.sin(angle)*13.92,rear[1]-Math.cos(angle)*13.92]:[mix(12.2-8.5*wind+2.3*strike,4,death),mix(-23-10.5*wind-.8*strike,-22,death)];
  const backShoulder=[-4.8,-28.7],backElbow=joint(backShoulder,rear,7.6,7.6,1);
  limb(g,R,'upperArm',backShoulder,backElbow);
  part('torso',-8.5,-32,20.5);
  g.save();g.translate(.3,-30.0);g.rotate(-.035*wind+.035*strike);part(spear?'spearHead':'swordHead',-3.8,-11.5,11.5);g.restore();
  g.drawImage(cloth(R,color),-5.9,-16.5,12.0,11.0);
  limb(g,R,'forearm',backElbow,rear);
  const shoulder=[4.9,-28.7],elbow=joint(shoulder,hand,7.7,7.7,1);
  limb(g,R,'upperArm',shoulder,elbow);limb(g,R,'forearm',elbow,hand);

  const grip=spear?rear:hand,name=spear?'spear':'sword',r=manifest.parts[name],height=spear?58:27,scale=height/r[3],anchor=manifest.grips[name];
  g.save();g.translate(...grip);g.rotate(angle);g.drawImage(R.humanInfantryTexture,...r,-anchor[0]*r[2]*scale,-anchor[1]*height,r[2]*scale,height);g.restore();
  const gauntlet=(point,rotation)=>{g.save();g.translate(...point);g.rotate(rotation);g.fillStyle='#b8c0ba';g.strokeStyle='#414b47';g.lineWidth=.45;g.beginPath();g.roundRect(-1.5,-1.4,2.8,2.8,.75);g.fill();g.stroke();g.strokeStyle='#707b73';g.lineWidth=.35;for(const y of [-.45,.45]){g.beginPath();g.moveTo(-1.1,y);g.lineTo(.9,y);g.stroke();}g.restore();};
  if(spear){gauntlet(rear,angle);gauntlet(hand,angle);}else{
    gauntlet(hand,angle);
    g.save();g.translate(-7.7,-20.8);g.rotate(-.12+.1*wind-.08*strike-death*.25);
    const h=18,w=h*manifest.parts.shield[2]/manifest.parts.shield[3],shield=()=>part('shield',-w/2,-h/2,h);shield();
    g.save();g.beginPath();g.moveTo(-w*.40,-h*.38);g.lineTo(w*.37,-h*.38);g.lineTo(w*.27,h*.15);g.lineTo(0,h*.43);g.lineTo(-w*.28,h*.15);g.closePath();g.clip();g.globalAlpha=.84;g.fillStyle=color;g.fillRect(-w*.38,-h/2,w*.36,h);g.restore();
    g.save();g.beginPath();g.ellipse(1,-.5,2,2.5,0,0,TAU);g.clip();shield();g.restore();
    if(elite){g.strokeStyle='#ffdc78';g.lineWidth=1;g.beginPath();g.moveTo(-w*.45,-h*.43);g.lineTo(w*.43,-h*.43);g.lineTo(w*.33,h*.17);g.lineTo(0,h*.48);g.lineTo(-w*.34,h*.17);g.closePath();g.stroke();}g.restore();
  }
  if(elite){g.strokeStyle='#f5d279';g.lineWidth=1.2;g.beginPath();g.moveTo(-7,-28.5);g.lineTo(-3.5,-28.5);g.moveTo(3.5,-28.5);g.lineTo(7,-28.5);g.stroke();g.fillStyle='#f2d175';g.beginPath();g.moveTo(-1,-24);g.lineTo(.4,-26);g.lineTo(1.8,-24);g.lineTo(.4,-22);g.closePath();g.fill();}
  g.restore();g.restore();
  return {painted:true,style:'painted-human',weapon:[...grip,angle],hands:spear?[rear,hand]:[hand],shield:!spear,hips,ankles,knees,body:[thrust,bob],death};
}
