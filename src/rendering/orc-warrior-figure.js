import { assetUrl } from '../assets/urls.js';
import manifest from '../data/orc-warrior-art.json';

const clamp=n=>Math.max(0,Math.min(1,n));

export function installOrcWarriorArt(R) {
  R.orcWarriorClothCache=new Map();
  R.loadOrcWarriorArt=()=>{
    if(R.orcWarriorArtReady)return R.orcWarriorArtReady;
    const image=new Image();R.orcWarriorTexture=image;
    image.src=assetUrl(manifest.file);
    return R.orcWarriorArtReady=image.decode().then(()=>true,()=>false);
  };
}

export const paintedOrcWarrior=(R,u)=>u.key==='orc_warrior'&&R.ROAD.test&&['orc-skeleton','knight','catapult','infantry','archer'].includes(R.ROAD.testRoster)&&R.ROAD.figureStyle==='painted'&&R.orcWarriorTexture?.naturalWidth>0;

function joint(start,end,upper,lower,bend=1) {
  const dx=end[0]-start[0],dy=end[1]-start[1],distance=Math.max(.001,Math.hypot(dx,dy));
  const reach=Math.min(distance,upper+lower-.001);
  const along=(upper*upper-lower*lower+reach*reach)/(2*reach);
  const across=Math.sqrt(Math.max(0,upper*upper-along*along))*bend;
  return [start[0]+dx/distance*along-dy/distance*across,start[1]+dy/distance*along+dx/distance*across];
}

function limb(g,R,name,start,end) {
  const rect=manifest.parts[name],[[ax,ay],[bx,by]]=manifest.joints[name];
  const sx=(bx-ax)*rect[2],sy=(by-ay)*rect[3],dx=end[0]-start[0],dy=end[1]-start[1];
  const scale=Math.hypot(dx,dy)/Math.hypot(sx,sy);
  g.save();g.translate(...start);g.rotate(Math.atan2(dy,dx)-Math.atan2(sy,sx));g.scale(scale,scale);
  g.drawImage(R.orcWarriorTexture,...rect,-ax*rect[2],-ay*rect[3],rect[2],rect[3]);g.restore();
}

function cloth(R,color) {
  let canvas=R.orcWarriorClothCache.get(color);if(canvas)return canvas;
  canvas=document.createElement('canvas');canvas.width=80;canvas.height=104;
  const g=canvas.getContext('2d'),shade=g.createLinearGradient(0,0,80,0);
  shade.addColorStop(0,'#20291f');shade.addColorStop(.3,color);shade.addColorStop(.55,color);shade.addColorStop(1,'#20291f');
  g.fillStyle=shade;g.strokeStyle='#292a22';g.lineWidth=3;
  g.beginPath();g.moveTo(6,4);g.lineTo(72,4);g.lineTo(67,79);g.lineTo(54,70);g.lineTo(47,101);g.lineTo(34,84);g.lineTo(20,95);g.closePath();g.fill();g.stroke();
  g.strokeStyle='#d8dcc055';g.lineWidth=2;g.beginPath();g.moveTo(22,10);g.lineTo(32,74);g.moveTo(51,12);g.lineTo(47,73);g.stroke();
  if(R.orcWarriorClothCache.size>=8)R.orcWarriorClothCache.delete(R.orcWarriorClothCache.keys().next().value);
  R.orcWarriorClothCache.set(color,canvas);return canvas;
}

export function drawOrcWarrior(g,R,color,p,elite,walking=false) {
  const part=(name,x,y,h)=>{
    const rect=manifest.parts[name],w=h*rect[2]/rect[3];
    g.drawImage(R.orcWarriorTexture,...rect,x,y,w,h);return w;
  };
  // Keep the axe at contact through frame 7: this is the real melee hit instant.
  const recovery=clamp((p.recovery-.2)/.8),strike=p.strike*(1-recovery),wind=p.wind*(1-p.strike)*(1-p.recovery);
  const death=p.death,walk=walking?p.walk:0,lift=walking?Math.cos(p.wheel):0;
  const bodyShift=Math.abs(walk)*.65,thrust=2.4*strike-.9*wind;
  g.save();g.translate(thrust+death*4,0);g.translate(0,-17);g.rotate(death*1.48);g.translate(0,17);

  const hips=[[-3.4,-16.7+bodyShift],[4.1,-16.7+bodyShift]];
  const ankles=[[-5.4-walk*3.6,-2.5-Math.max(0,-lift)*2.4],[5.3+walk*3.6,-2.5-Math.max(0,lift)*2.4]];
  const knees=hips.map((hip,i)=>{
    const knee=joint(hip,ankles[i],8.1,7.4,-1);
    g.save();if(!i)g.globalAlpha=.86;
    limb(g,R,'thigh',hip,knee);limb(g,R,'shin',knee,ankles[i]);
    part('boot',ankles[i][0]-1.6,ankles[i][1]-.7,4.8);g.restore();return knee;
  });
  g.save();g.translate(0,bodyShift);
  const backShoulder=[-5.5,-29.8],backHand=[-9.4+walk*.45,-20.2];
  const backElbow=joint(backShoulder,backHand,7.5,7,-1);
  limb(g,R,'upperArm',backShoulder,backElbow);limb(g,R,'forearm',backElbow,backHand);
  part('torso',-11.1,-34.6,24.0);
  g.save();g.translate(.9,-30.2);g.rotate(-.06*wind+.05*strike);part('head',-6.2,-13.8,14.4);g.restore();
  g.drawImage(cloth(R,color),-4.7,-13.1,10.2,11.5);

  const hand=[14-10*wind+2.5*strike-walk*.45,-22.0-12.4*wind-.8*strike];
  hand[0]+=(4-hand[0])*death;hand[1]+=(-20-hand[1])*death;
  const axeAngle=(.18-1.45*wind+1.27*strike)*(1-death)+.12*death;
  const shoulder=[6.3,-29.7],wrist=[hand[0]-1.1,hand[1]-.25];
  const elbow=joint(shoulder,wrist,8.2,8.0,1);
  limb(g,R,'upperArm',shoulder,elbow);limb(g,R,'forearm',elbow,wrist);
  g.save();g.translate(...hand);g.rotate(axeAngle);
  // Palm sits behind the haft, curled fingers in front of it.
  g.fillStyle='#69733b';g.strokeStyle='#343c25';g.lineWidth=.5;
  g.beginPath();g.ellipse(0,0,2.1,1.8,0,0,Math.PI*2);g.fill();g.stroke();
  const axe=manifest.parts.axe,axeScale=29/axe[3];
  g.drawImage(R.orcWarriorTexture,...axe,-manifest.grip[0]*axe[2]*axeScale,-manifest.grip[1]*29,axe[2]*axeScale,29);
  g.fillStyle='#8d9650';g.beginPath();g.roundRect(-1.5,-1.4,2.3,2.6,.7);g.fill();
  g.strokeStyle='#49532b';g.lineWidth=.4;for(const y of [-.5,.35]){g.beginPath();g.moveTo(-1.4,y);g.lineTo(.5,y);g.stroke();}g.restore();

  g.save();g.translate(-9.3,-21.2);g.rotate(-.1+.12*wind-.12*strike-death*.3);
  const height=18.3,width=height*manifest.parts.shield[2]/manifest.parts.shield[3];
  const shield=()=>part('shield',-width/2,-height/2,height);shield();
  g.save();g.beginPath();g.ellipse(0,0,width*.42,height*.43,0,0,Math.PI*2);g.clip();
  g.globalAlpha=.82;g.fillStyle=color;g.fillRect(-2.5,-height/2,5,height);g.restore();
  g.save();g.beginPath();g.ellipse(0,0,2.1,2.5,0,0,Math.PI*2);g.clip();shield();g.restore();
  if(elite){g.strokeStyle='#efd07a';g.lineWidth=1;g.beginPath();g.ellipse(0,0,width*.47,height*.47,0,0,Math.PI*2);g.stroke();}
  g.restore();
  if(elite){g.fillStyle='#f2d37a';g.beginPath();g.moveTo(-8,-30);g.lineTo(-6.5,-33);g.lineTo(-5,-30);g.lineTo(-6.5,-28);g.fill();}
  g.restore();g.restore();
  return {painted:true,style:'painted-orc',body:[thrust,bodyShift],weapon:[...hand,axeAngle],hand,hips,ankles,knees,death};
}
