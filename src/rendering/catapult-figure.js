import { usesPaintedBattleArt } from '../config/figure-trials.js';
import { assetUrl } from '../assets/urls.js';
import manifest from '../data/catapult-art.json';

const TAU=Math.PI*2,ARM_WIDTH=46,PIVOT=[-1,-28],RELEASE=1.15;
const mix=(a,b,t)=>a+(b-a)*t;

export function installCatapultArt(R) {
  R.catapultBannerCache=new Map();
  R.loadCatapultArt=()=>{
    if(R.catapultArtReady)return R.catapultArtReady;
    const image=new Image();R.catapultTexture=image;image.src=assetUrl(manifest.file);
    return R.catapultArtReady=image.decode().then(()=>true,()=>false);
  };
  R.catapultLaunchPoint=()=>cupAt(RELEASE);
  R.catapultProjectilePoint=(a,t)=>catapultProjectilePoint(R,a,t);
}
export const paintedCatapult=(R,u)=>u.key==='catapult'&&usesPaintedBattleArt(R,['catapult','undead-figures'])&&R.catapultTexture?.naturalWidth>0;

function cupAt(angle) {
  const rect=manifest.parts.arm,scale=ARM_WIDTH/rect[2],a=manifest.anchors;
  const x=(a.cup[0]-a.armPivot[0])*rect[2]*scale,y=(a.cup[1]-a.armPivot[1])*rect[3]*scale;
  return [PIVOT[0]+Math.cos(angle)*x-Math.sin(angle)*y,PIVOT[1]+Math.sin(angle)*x+Math.cos(angle)*y];
}
function banner(R,color) {
  let canvas=R.catapultBannerCache.get(color);if(canvas)return canvas;
  canvas=document.createElement('canvas');canvas.width=64;canvas.height=80;
  const g=canvas.getContext('2d',{willReadFrequently:true});g.drawImage(R.catapultTexture,...manifest.parts.banner,0,0,64,80);
  const data=g.getImageData(0,0,64,80),hex=parseInt(color.slice(1),16),rgb=[hex>>16&255,hex>>8&255,hex&255];
  for(let i=0;i<data.data.length;i+=4){
    const p=data.data,r=p[i],green=p[i+1],b=p[i+2];
    // Preserve the ivory heraldry; recolour only grey cloth and its shading.
    if(!p[i+3]||r>205&&green>200&&b>175)continue;
    const light=(r+green+b)/540;for(let c=0;c<3;c++)p[i+c]=Math.min(255,p[i+c]*.18+rgb[c]*light*.82);
  }
  g.putImageData(data,0,0);
  if(R.catapultBannerCache.size>=8)R.catapultBannerCache.delete(R.catapultBannerCache.keys().next().value);
  R.catapultBannerCache.set(color,canvas);return canvas;
}

export function drawCatapult(g,R,color,p,elite,pose) {
  const part=(name,x,y,w)=>{const r=manifest.parts[name],h=w*r[3]/r[2];g.drawImage(R.catapultTexture,...r,x,y,w,h);return h;};
  const death=p.death,walk=pose.state==='walk',bob=walk?Math.sin(p.wheel*2)*.25:0;
  const recovering=pose.state==='attack'&&pose.frame>=7,t=recovering?(pose.frame-7)/4:0;
  const armAngle=recovering?(t<=.25?mix(RELEASE,2.05,t*4):mix(2.05,.1,(t-.25)/.75)):.1-.45*p.wind+1.5*p.strike;
  const recoil=recovering?-1.2*Math.sin(t*Math.PI):0;
  const stoneLoaded=pose.state!=='death'&&(!recovering);
  const wheelAngle=walk?p.wheel:0;
  const wheel=(x,y,r,far)=>{
    g.save();g.translate(x+(x<0?-1:1)*death*10,y+death*(far?5:2));g.scale(.82,1);g.rotate(wheelAngle+death*(x<0?-2.4:2.8));
    if(far)g.globalAlpha=.78;part('wheel',-r,-r,r*2);g.restore();
  };
  const frame=(x,y,fall,far)=>{
    const r=manifest.parts.frame,h=22,w=h*r[2]/r[3],a=manifest.anchors.framePivot;
    g.save();g.translate(x,y+death*11);g.rotate(fall*death);if(far)g.globalAlpha=.86;
    g.drawImage(R.catapultTexture,...r,-a[0]*w,-a[1]*h,w,h);g.restore();
  };
  g.save();g.translate(recoil,bob);
  wheel(-11,-9,5.3,true);wheel(19,-9,5.3,true);
  frame(2,-31,-.8,true);
  g.save();g.translate(death*2,death*3);g.rotate(death*.12);part('chassis',-21,-24,42);g.restore();
  frame(...PIVOT,.9,false);
  g.save();g.translate(PIVOT[0]+death*8,PIVOT[1]+death*20);g.rotate(armAngle*(1-death)+death*.3);
  const arm=manifest.parts.arm,s=ARM_WIDTH/arm[2],a=manifest.anchors.armPivot;
  g.drawImage(R.catapultTexture,...arm,-a[0]*ARM_WIDTH,-a[1]*arm[3]*s,ARM_WIDTH,arm[3]*s);g.restore();
  const cup=cupAt(armAngle);
  if(stoneLoaded)part('rock',cup[0]-3.6,cup[1]-3.6,7.2);
  else if(death)part('rock',-30-death*7,-6+Math.sin(death*Math.PI)*-5,7.2);
  g.save();g.translate(3+death*7,-29+death*19);g.rotate(-death*.55);
  g.drawImage(banner(R,color),0,0,9,12);
  if(elite){g.strokeStyle='#f3d375';g.lineWidth=.7;g.strokeRect(.2,.3,8.5,11.2);}g.restore();
  if(elite&&!death){g.strokeStyle='#e1bb62';g.lineWidth=1;g.beginPath();g.moveTo(-6,-12);g.lineTo(-1,-27);g.lineTo(7,-12);g.stroke();}
  wheel(-15,-4,6.4,false);wheel(15,-4,6.4,false);
  if(death){
    const r=manifest.parts.chassis;
    for(const side of [-1,1]){g.save();g.translate(side*death*19,-2+death*3);g.rotate(side*death*.65);g.drawImage(R.catapultTexture,r[0]+r[2]*.2,r[1]+r[3]*.65,r[2]*.4,r[3]*.15,-9,-1.5,18,3);g.restore();}
  }
  g.restore();
  return {painted:true,style:'painted-catapult',armAngle,cup,stoneLoaded,wheelAngle,death,body:[recoil,bob]};
}

// Use the same release point as the last loaded cup pose. The impact endpoint
// matches the existing rock effect and the target used by real damage resolution.
export function catapultProjectilePoint(R,a,t) {
  const from=R.pointAt(a.lane,a.offset),to=R.pointAt(a.to,a.toOffset),scale=R.ROAD.h/600*R.ROAD.zoom;
  const face=a.catapultFace||(a.to>=a.lane?1:-1),cup=cupAt(RELEASE);
  return {x:mix(from.x+cup[0]*scale*face,to.x,t),y:mix(from.y+cup[1]*scale,to.y-13*scale,t)-Math.sin(t*Math.PI)*65*scale,scale,face};
}
export function drawCatapultShot(R,u,a,t) {
  if(!paintedCatapult(R,u))return false;
  a.catapultFace??=a.to>=a.lane?1:-1;
  const p=catapultProjectilePoint(R,a,t);if(p.x< -30||p.x>R.ROAD.w+30)return true;
  const g=R.ctx,r=manifest.parts.rock,w=7.2*p.scale,h=w*r[3]/r[2];
  g.save();g.translate(p.x,p.y);g.rotate(t*TAU*p.face);g.drawImage(R.catapultTexture,...r,-w/2,-h/2,w,h);g.restore();return true;
}
