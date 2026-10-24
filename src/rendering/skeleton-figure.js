import { assetUrl } from '../assets/urls.js';
import manifest from '../data/skeleton-art.json';

const clamp = n => Math.max(0,Math.min(1,n));
const lerp = (a,b,t) => a+(b-a)*t;

export function installSkeletonArt(R) {
  R.skeletonClothCache=new Map();
  R.loadSkeletonArt=()=>{
    if(R.skeletonArtReady)return R.skeletonArtReady;
    const image=new Image();R.skeletonTexture=image;
    image.src=assetUrl(manifest.file);
    return R.skeletonArtReady=image.decode().then(()=>true,()=>false);
  };
}
export const paintedSkeleton = (R,u) => u.key==='und_skeleton' && R.ROAD.test && R.ROAD.testRoster==='skeleton' && R.ROAD.figureStyle==='skeleton' && R.skeletonTexture?.naturalWidth>0;

// Uniform joint-to-joint placement preserves the painted bone proportions.
function bone(g,R,name,start,end) {
  const rect=manifest.parts[name], [[ax,ay],[bx,by]]=manifest.joints[name];
  const sourceX=(bx-ax)*rect[2],sourceY=(by-ay)*rect[3];
  const dx=end[0]-start[0],dy=end[1]-start[1];
  const scale=Math.hypot(dx,dy)/Math.hypot(sourceX,sourceY);
  g.save();g.translate(...start);g.rotate(Math.atan2(dy,dx)-Math.atan2(sourceY,sourceX));g.scale(scale,scale);
  g.drawImage(R.skeletonTexture,...rect,-ax*rect[2],-ay*rect[3],rect[2],rect[3]);g.restore();
}

function elbow(start,end,upper,lower,bend=1) {
  const dx=end[0]-start[0],dy=end[1]-start[1];
  const distance=Math.max(.001,Math.hypot(dx,dy));
  const reach=Math.min(distance,upper+lower-.001);
  const along=(upper*upper-lower*lower+reach*reach)/(2*reach);
  const across=Math.sqrt(Math.max(0,upper*upper-along*along))*bend;
  const ux=dx/distance,uy=dy/distance;
  return [start[0]+ux*along-uy*across,start[1]+uy*along+ux*across];
}

function teamCloth(R,color) {
  let canvas=R.skeletonClothCache.get(color);if(canvas)return canvas;
  canvas=document.createElement('canvas');canvas.width=64;canvas.height=88;
  const g=canvas.getContext('2d');g.drawImage(R.skeletonTexture,...manifest.parts.cloth,0,0,64,88);
  // Recolour cloth only, retaining alpha and some original painted shading.
  g.globalCompositeOperation='source-atop';g.globalAlpha=.80;g.fillStyle=color;g.fillRect(0,0,64,88);
  if(R.skeletonClothCache.size>=8)R.skeletonClothCache.delete(R.skeletonClothCache.keys().next().value);
  R.skeletonClothCache.set(color,canvas);return canvas;
}

export function drawSkeleton(g,R,color,p,elite,walking=false) {
  const part=(name,x,y,h)=>{
    const rect=manifest.parts[name],w=h*rect[2]/rect[3];
    g.drawImage(R.skeletonTexture,...rect,x,y,w,h);return w;
  };
  // Preserve the extended contact pose at frame 7, when melee damage resolves.
  const recovery=clamp((p.recovery-.2)/.8);
  const strike=p.strike*(1-recovery),wind=p.wind*(1-p.strike)*(1-p.recovery);
  const death=p.death,walk=walking?p.walk:0;
  const thrust=2.0*strike-.8*wind;
  // Raise the pelvis for a relaxed standing knee angle. On a wide step the
  // hips lower slightly, while the planted feet stay on the ground plane.
  const bodyShift=-2.3+Math.abs(walk)*.8;
  g.save();
  g.translate(thrust+death*3,death*16.3);
  g.translate(0,-16.3);g.rotate(death*1.48);g.translate(0,16.3);

  const leg=(hip,ankle,back)=>{
    const knee=elbow(hip,ankle,7.6,7.5,-1);
    g.save();if(back)g.globalAlpha=.91;
    bone(g,R,'thigh',hip,knee);bone(g,R,'shin',knee,ankle);g.restore();
    g.save();g.translate(...ankle);
    part('foot',-1.78,-.55,3.0);g.restore();
    return knee;
  };
  const lift=walking?Math.cos(p.wheel):0;
  const backHip=[-2.8,-14.7+bodyShift],frontHip=[3.2,-14.7+bodyShift];
  const backAnkle=[-5.1-walk*3.6,-2.4-Math.max(0,-lift)*2.5];
  const frontAnkle=[5.0+walk*3.6,-2.4-Math.max(0,lift)*2.5];
  const knees=[leg(backHip,backAnkle,true),leg(frontHip,frontAnkle,false)];

  g.save();g.translate(0,bodyShift);
  const backShoulder=[-4.8,-28.4],backHand=[-7.4+walk*.5,-19.5];
  const backElbow=elbow(backShoulder,backHand,6.4,6.3,-1);
  bone(g,R,'upperArm',backShoulder,backElbow);bone(g,R,'forearm',backElbow,backHand);
  part('torso',-9.1,-32.6,22.0);
  g.save();g.translate(.4,-31.6);g.rotate(-.05*wind+.05*strike);
  part('skull',-4.8,-12.8,12.8);g.restore();
  g.drawImage(teamCloth(R,color),-3.5,-13.0,7.8,9.0);

  const shoulder=[5.3,-28.0];
  let hand=[13.0-9.0*wind+2.0*strike-walk*.6,-21.7-13.0*wind-.3*strike];
  hand=[lerp(hand[0],4.0,death),lerp(hand[1],-22.0,death)];
  const swordAngle=lerp(.42-1.6*wind+1.0*strike,.10,death);
  const grip=manifest.grip,handScale=grip.handScale;
  const wristX=(grip.wrist[0]-grip.handHole[0])*handScale,wristY=(grip.wrist[1]-grip.handHole[1])*handScale;
  const wrist=[hand[0]+Math.cos(swordAngle)*wristX-Math.sin(swordAngle)*wristY,hand[1]+Math.sin(swordAngle)*wristX+Math.cos(swordAngle)*wristY];
  const frontElbow=elbow(shoulder,wrist,7.6,7.5,1);
  bone(g,R,'upperArm',shoulder,frontElbow);bone(g,R,'forearmBare',frontElbow,wrist);
  g.save();g.translate(...hand);g.rotate(swordAngle);
  const gripPart=name=>{
    const rect=manifest.parts[name];
    g.drawImage(R.skeletonTexture,...rect,(rect[0]-grip.handHole[0])*handScale,(rect[1]-grip.handHole[1])*handScale,rect[2]*handScale,rect[3]*handScale);
  };
  // Palm behind the hilt, curled fingers in front. The wrist follows this grip
  // instead of rotating the whole hand with the forearm bone.
  gripPart('hand');
  const sword=manifest.parts.sword,swordScale=25/sword[3];
  g.drawImage(R.skeletonTexture,...sword,-grip.sword[0]*sword[2]*swordScale,-grip.sword[1]*25,sword[2]*swordScale,25);
  gripPart('gripFingers');g.restore();

  g.save();g.translate(-7.3,-21.2);g.rotate(-.13+.14*wind-.1*strike-death*.35);
  const shieldHeight=14.6,shieldWidth=shieldHeight*manifest.parts.shield[2]/manifest.parts.shield[3];
  const shield=()=>part('shield',-shieldWidth/2,-shieldHeight/2,shieldHeight);
  shield();
  g.save();g.beginPath();g.ellipse(0,0,shieldWidth*.43,shieldHeight*.44,0,0,Math.PI*2);g.clip();
  g.globalAlpha=.82;g.fillStyle=color;g.fillRect(-1.8,-shieldHeight/2,3.6,shieldHeight);g.restore();
  // Keep the metal boss unpainted and identical on both teams.
  g.save();g.beginPath();g.ellipse(0,0,1.75,2.1,0,0,Math.PI*2);g.clip();shield();g.restore();
  if(elite){g.strokeStyle='#efcb69';g.lineWidth=.8;g.beginPath();g.ellipse(0,0,shieldWidth*.47,shieldHeight*.47,0,0,Math.PI*2);g.stroke();}
  g.restore();
  if(elite){g.fillStyle='#f3d77f';g.beginPath();g.moveTo(-5.5,-30);g.lineTo(-4.3,-32);g.lineTo(-3.1,-30);g.lineTo(-4.3,-28);g.fill();}
  g.restore();g.restore();
  return {body:[thrust,bodyShift],weapon:[...hand,swordAngle],stride:walk*3.6,knees,hips:[backHip,frontHip],ankles:[backAnkle,frontAnkle],hand,painted:true,style:'light-bone',death};
}
