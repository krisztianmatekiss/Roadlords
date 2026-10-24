import { assetUrl } from '../assets/urls.js';
import manifest from '../data/knight-art.json';

const TAU=Math.PI*2,clamp=n=>Math.max(0,Math.min(1,n));

export function installKnightArt(R) {
  R.knightClothCache=new Map();
  R.loadKnightArt=()=>{
    if(R.knightArtReady)return R.knightArtReady;
    const image=new Image();R.knightTexture=image;image.src=assetUrl(manifest.file);
    return R.knightArtReady=image.decode().then(()=>true,()=>false);
  };
}
export const paintedKnight=(R,u)=>u.key==='knight'&&R.ROAD.test&&R.ROAD.testRoster==='knight'&&R.ROAD.figureStyle==='painted'&&R.knightTexture?.naturalWidth>0;

function joint(start,end,upper,lower,bend) {
  const dx=end[0]-start[0],dy=end[1]-start[1],distance=Math.max(.001,Math.hypot(dx,dy)),reach=Math.min(distance,upper+lower-.001);
  const along=(upper*upper-lower*lower+reach*reach)/(2*reach),across=Math.sqrt(Math.max(0,upper*upper-along*along))*bend;
  return [start[0]+dx/distance*along-dy/distance*across,start[1]+dy/distance*along+dx/distance*across];
}
function limb(g,R,name,start,end) {
  const rect=manifest.parts[name],[[ax,ay],[bx,by]]=manifest.joints[name],sx=(bx-ax)*rect[2],sy=(by-ay)*rect[3];
  const dx=end[0]-start[0],dy=end[1]-start[1],scale=Math.hypot(dx,dy)/Math.hypot(sx,sy);
  g.save();g.translate(...start);g.rotate(Math.atan2(dy,dx)-Math.atan2(sy,sx));g.scale(scale,scale);
  g.drawImage(R.knightTexture,...rect,-ax*rect[2],-ay*rect[3],rect[2],rect[3]);g.restore();
}
function cloth(R,color) {
  let canvas=R.knightClothCache.get(color);if(canvas)return canvas;
  canvas=document.createElement('canvas');canvas.width=160;canvas.height=104;const g=canvas.getContext('2d');
  const shade=g.createLinearGradient(0,0,160,104);shade.addColorStop(0,color);shade.addColorStop(.55,color);shade.addColorStop(1,'#243127');
  g.fillStyle=shade;g.strokeStyle='#c4a66b';g.lineWidth=4;g.beginPath();g.moveTo(8,8);g.lineTo(145,8);g.lineTo(151,85);g.lineTo(132,79);g.lineTo(117,100);g.lineTo(96,88);g.lineTo(76,101);g.lineTo(56,89);g.lineTo(31,96);g.lineTo(11,80);g.closePath();g.fill();g.stroke();
  g.strokeStyle='#e0d9b855';g.lineWidth=2;for(const x of [35,70,105,130]){g.beginPath();g.moveTo(x,18);g.lineTo(x+4,80);g.stroke();}
  g.fillStyle='#d9bd7a';for(const x of [27,70,114]){g.beginPath();g.arc(x,25,3,0,TAU);g.fill();}
  if(R.knightClothCache.size>=8)R.knightClothCache.delete(R.knightClothCache.keys().next().value);
  R.knightClothCache.set(color,canvas);return canvas;
}

export function drawKnight(g,R,color,p,elite,walking=false) {
  const part=(name,x,y,h)=>{const rect=manifest.parts[name],w=h*rect[2]/rect[3];g.drawImage(R.knightTexture,...rect,x,y,w,h);return w;};
  const recovery=clamp((p.recovery-.2)/.8),strike=p.strike*(1-recovery),wind=p.wind*(1-p.strike)*(1-p.recovery);
  const death=p.death,cycle=walking?p.wheel:0,bob=walking?Math.sin(cycle*2)*.65:0,thrust=3*strike-.8*wind;
  g.save();g.translate(thrust+death*4,0);g.translate(0,-16);g.rotate(death*1.22);g.translate(0,16);

  // Diagonal pairs alternate. Hooves on the stance half stay on the ground;
  // only the returning half of a stride lifts, independent of body bobbing.
  const hoofs=[],knees=[];
  const leg=(front,near)=>{
    const phase=cycle+(front===near?0:Math.PI),stride=walking?-Math.cos(phase)*4.3:0;
    const lift=walking?Math.max(0,Math.sin(phase))*3.8:0;
    const hip=[(front?5.5:-16)+(near?1.4:-1.4),-18+bob];
    const hoof=[(front?9:-17)+(near?1.4:-1.4)+stride,-1.2-lift];
    const knee=joint(hip,hoof,front?8.8:9,front?9.4:9.2,front?-1:1);
    g.save();if(!near)g.globalAlpha=.76;
    limb(g,R,front?'frontUpper':'hindUpper',hip,knee);limb(g,R,front?'frontLower':'hindLower',knee,hoof);g.restore();
    hoofs.push(hoof);knees.push(knee);
  };
  leg(false,false);leg(true,false);
  g.save();g.translate(0,bob);
  g.save();g.translate(-20,-27);g.rotate(.06+(walking?Math.sin(cycle)*.10:0)+death*.2);part('tail',-12,-1,22);g.restore();
  part('horseBody',-23,-31,20);
  g.drawImage(cloth(R,color),-18,-27.5,26,17);
  // Redraw the saddle above the blanket, keeping leather and steel unpainted.
  g.save();g.beginPath();g.rect(-15,-31,18,8);g.clip();part('horseBody',-23,-31,20);g.restore();
  g.save();g.translate(7,-23);g.rotate((walking?Math.sin(cycle)*.035:0)+.045*strike);part('horseHead',-7,-22,25);g.restore();
  g.restore();
  leg(false,true);leg(true,true);

  g.save();g.translate(strike*.9,bob*.65);g.translate(-3,-34);g.rotate(.06*strike-.035*wind+death*.16);g.translate(3,34);
  g.save();g.globalAlpha=.83;part('riderLeg',-8,-36,17.5);g.restore();
  part('rider',-9,-57,27);
  // A small team tabard and plume retain the helmet's painted metal texture.
  g.fillStyle=color;g.strokeStyle='#c9ae70';g.lineWidth=.5;g.beginPath();g.moveTo(-1,-38);g.lineTo(6,-38);g.lineTo(5.5,-31);g.lineTo(2,-29.5);g.lineTo(-1,-31);g.closePath();g.fill();g.stroke();
  g.save();g.translate(-1.8,-56);g.rotate((walking?Math.sin(cycle)*.08:0)-.1*wind);g.fillStyle=color;g.strokeStyle='#2b362b';g.lineWidth=.6;g.beginPath();g.moveTo(0,0);g.bezierCurveTo(-4,-10,-13,-3,-17,-5);g.bezierCurveTo(-12,1,-4,-3,0,2);g.closePath();g.fill();g.stroke();g.restore();
  part('riderLeg',-5,-36,18.0);

  const arm=manifest.parts.arm,armScale=15/arm[3],shoulder=[-3,-45],armAngle=-.55-.65*wind;
  const proximal=manifest.anchors.armShoulder.map((n,i)=>n*arm[i+2]),distal=manifest.anchors.armHand.map((n,i)=>n*arm[i+2]);
  const dx=(distal[0]-proximal[0])*armScale,dy=(distal[1]-proximal[1])*armScale;
  const hand=[shoulder[0]+Math.cos(armAngle)*dx-Math.sin(armAngle)*dy,shoulder[1]+Math.sin(armAngle)*dx+Math.cos(armAngle)*dy];
  g.save();g.translate(...shoulder);g.rotate(armAngle);g.drawImage(R.knightTexture,...arm,-proximal[0]*armScale,-proximal[1]*armScale,arm[2]*armScale,15);g.restore();
  const lanceAngle=(1.05-.57*wind+.67*strike)*(1-death)+1.3*death;
  const lance=manifest.parts.lance,lanceScale=43/lance[3];
  g.save();g.translate(...hand);g.rotate(lanceAngle);g.drawImage(R.knightTexture,...lance,-manifest.anchors.lance[0]*lance[2]*lanceScale,-manifest.anchors.lance[1]*43,lance[2]*lanceScale,43);
  g.fillStyle='#b8bfba';g.strokeStyle='#4c5753';g.lineWidth=.4;g.beginPath();g.roundRect(-1.3,-1.2,2.5,2.4,.55);g.fill();g.stroke();
  g.fillStyle=color;g.beginPath();g.moveTo(0,-25);g.lineTo(-5,-24);g.lineTo(-3,-17);g.lineTo(0,-19);g.closePath();g.fill();g.restore();

  g.save();g.translate(-6,-42);g.rotate(-.1+.05*wind-.06*strike);
  const height=16,width=height*manifest.parts.shield[2]/manifest.parts.shield[3];
  const shield=()=>part('shield',-width/2,-height/2,height);shield();
  g.save();g.beginPath();g.moveTo(-width*.38,-height*.40);g.lineTo(width*.38,-height*.40);g.lineTo(width*.29,height*.15);g.lineTo(0,height*.44);g.lineTo(-width*.29,height*.15);g.closePath();g.clip();
  g.globalAlpha=.85;g.fillStyle=color;g.fillRect(-width*.37,-height/2,width*.35,height);g.restore();
  if(elite){g.strokeStyle='#ffdb76';g.lineWidth=.9;g.beginPath();g.moveTo(-width*.46,-height*.43);g.lineTo(width*.46,-height*.43);g.lineTo(width*.38,height*.15);g.lineTo(0,height*.48);g.lineTo(-width*.38,height*.15);g.closePath();g.stroke();}
  g.restore();g.restore();g.restore();
  return {painted:true,style:'painted-knight',body:[thrust,bob],hoofs,knees,hand,weapon:[...hand,lanceAngle],death};
}
