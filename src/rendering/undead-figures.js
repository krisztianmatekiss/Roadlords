import { assetUrl } from '../assets/urls.js';
import fighters from '../data/undead-fighters-art.json';
import casters from '../data/undead-casters-art.json';
import skeleton from '../data/skeleton-art.json';
import archer from '../data/archer-art.json';
import { drawArcherEquipment } from './archer-figure.js';
import { drawMagicShot } from './battle-effects.js';

const TAU=2*Math.PI,clamp=n=>Math.max(0,Math.min(1,n)),mix=(a,b,t)=>a+(b-a)*t;
const keys=new Set(['und_skeleton_archer','und_zombie','und_ghost','und_necromancer','und_vampire','und_lich']);
const trial=R=>R.ROAD.test&&R.ROAD.testRoster==='undead-figures'&&R.ROAD.figureStyle==='painted';
export const paintedUndead=(R,u)=>trial(R)&&keys.has(u.key)&&R.undeadFightersTexture?.naturalWidth>0&&R.undeadCastersTexture?.naturalWidth>0&&R.skeletonTexture?.naturalWidth>0&&R.archerTexture?.naturalWidth>0;

export function installUndeadArt(R){
  R.undeadClothCache=new Map();
  R.loadUndeadArt=()=>{
    if(R.undeadArtReady)return R.undeadArtReady;
    const loads=[[fighters,'undeadFightersTexture'],[casters,'undeadCastersTexture']].map(([m,key])=>{const image=new Image();R[key]=image;image.src=assetUrl(m.file);return image.decode().then(()=>true,()=>false);});
    return R.undeadArtReady=Promise.all(loads).then(x=>x.every(Boolean));
  };
  R.undeadLaunchPoint=launchPoint;
  R.undeadProjectilePoint=(a,t)=>projectilePoint(R,a,t);
  R.undeadSummonEffect=(u,spawn)=>{if(paintedUndead(R,u)&&spawn)u.roadUndSummon={start:R.ROAD.clock,end:R.ROAD.clock+.75};};
  R.undeadBeamOrigin=u=>{
    if(!paintedUndead(R,u)||u.key!=='und_lich')return null;
    const at=R.pointAt(u.lane,u.offset||0),tip=launchPoint(u.key),s=R.ROAD.h/600*R.ROAD.zoom,face=u.roadFace||(u.side==='enemy'?-1:1);
    return {x:at.x+tip[0]*s*face,y:at.y+tip[1]*s};
  };
}
export function undeadFigurePose(R,u,pose,clock){
  if(!paintedUndead(R,u)||pose.state==='death')return pose;
  if(u.key==='und_ghost'&&pose.state!=='attack')return {...pose,state:pose.state==='walk'?'float':'hover',frame:pose.state==='walk'?pose.frame:Math.floor(clock*4+u.id*.31)%8};
  const event=u.roadUndSummon;
  if(event&&clock>=event.start&&clock<event.end){const summonFrame=Math.min(5,Math.floor((clock-event.start)/.75*6));return {...pose,state:pose.state==='idle'?'summon':pose.state,summonFrame};}
  if(u.key==='und_lich'&&u.undBeams?.length&&pose.state==='idle')return {state:'channel',frame:Math.floor(clock*5)%8};
  return pose;
}
function joint(a,b,upper,lower,bend=1){
  const dx=b[0]-a[0],dy=b[1]-a[1],d=Math.max(.001,Math.hypot(dx,dy)),reach=Math.max(Math.abs(upper-lower)+.001,Math.min(d,upper+lower-.001));
  const along=(upper*upper-lower*lower+reach*reach)/(2*reach),across=Math.sqrt(Math.max(0,upper*upper-along*along))*bend;
  return [a[0]+dx/d*along-dy/d*across,a[1]+dy/d*along+dx/d*across];
}
function art(R,m){return m===fighters?R.undeadFightersTexture:m===casters?R.undeadCastersTexture:R.skeletonTexture;}
function cloth(R,m,color,name){
  const cacheKey=(m===fighters?'f':m===casters?'c':'s')+color;let set=R.undeadClothCache.get(cacheKey);
  if(!set){if(R.undeadClothCache.size>=24)R.undeadClothCache.delete(R.undeadClothCache.keys().next().value);R.undeadClothCache.set(cacheKey,set={});}
  if(set[name])return set[name];
  const r=m.parts[name],canvas=document.createElement('canvas');canvas.width=96;canvas.height=Math.round(96*r[3]/r[2]);
  const g=canvas.getContext('2d',{willReadFrequently:true});g.drawImage(art(R,m),...r,0,0,canvas.width,canvas.height);
  const data=g.getImageData(0,0,canvas.width,canvas.height),p=data.data,n=parseInt(color.slice(1),16),rgb=[n>>16&255,n>>8&255,n&255];
  for(let i=0;i<p.length;i+=4){const red=p[i],green=p[i+1],blue=p[i+2];if(!p[i+3]||Math.max(red,green,blue)-Math.min(red,green,blue)>27||red>198&&green>190&&blue>165)continue;const light=(red+green+blue)/500;for(let k=0;k<3;k++)p[i+k]=Math.min(255,p[i+k]*.16+rgb[k]*light*.84);}
  g.putImageData(data,0,0);return set[name]=canvas;
}
function part(g,R,m,name,x,y,h,color){const r=m.parts[name],w=h*r[2]/r[3];if(color)g.drawImage(cloth(R,m,color,name),x,y,w,h);else g.drawImage(art(R,m),...r,x,y,w,h);}
function anchored(g,R,m,name,anchor,at,h,color,angle=0){const r=m.parts[name],a=m.anchors[name][anchor],w=h*r[2]/r[3];g.save();g.translate(...at);g.rotate(angle);part(g,R,m,name,-a[0]*w,-a[1]*h,h,color);g.restore();}
function limb(g,R,m,name,start,end,color){
  const r=m.parts[name],[[ax,ay],[bx,by]]=m.joints[name],sx=(bx-ax)*r[2],sy=(by-ay)*r[3],dx=end[0]-start[0],dy=end[1]-start[1],scale=Math.hypot(dx,dy)/Math.hypot(sx,sy);
  g.save();g.translate(...start);g.rotate(Math.atan2(dy,dx)-Math.atan2(sy,sx));g.scale(scale,scale);if(color)g.drawImage(cloth(R,m,color,name),-ax*r[2],-ay*r[3],r[2],r[3]);else g.drawImage(art(R,m),...r,-ax*r[2],-ay*r[3],r[2],r[3]);g.restore();
}
function body(g,R,m,name,waist,h,color){const r=m.parts[name],a=m.anchors[name],w=h*r[2]/r[3],at=[waist[0]-a.waist[0]*w,waist[1]-a.waist[1]*h];part(g,R,m,name,...at,h,color);return [at[0]+a.neck[0]*w,at[1]+a.neck[1]*h];}
function fall(g,death){g.translate(death*3,-17);g.rotate(death*1.48);g.translate(0,17);}
function glow(g,at,r=3){const gradient=g.createRadialGradient(...at,0,...at,r*2);gradient.addColorStop(0,'#e6ffdf');gradient.addColorStop(.25,'#5df3b6b0');gradient.addColorStop(1,'#47dc9d00');g.fillStyle=gradient;g.beginPath();g.arc(...at,r*2,0,TAU);g.fill();}
function windGlow(p){return p.wind*(1-p.strike)*.8;}
function eliteMark(g,elite){if(!elite)return;g.strokeStyle='#f2d37e';g.lineWidth=1;g.beginPath();g.moveTo(-7,-31);g.lineTo(-3,-29);g.moveTo(3,-29);g.lineTo(7,-31);g.stroke();g.fillStyle='#ffe298';g.beginPath();g.moveTo(0,-26);g.lineTo(1.7,-24);g.lineTo(0,-22);g.lineTo(-1.7,-24);g.fill();}

function drawSkeletonArcher(g,R,color,p,elite,pose){
  const walk=pose.state==='walk'?p.walk:0,lift=pose.state==='walk'?Math.cos(p.wheel):0,bob=Math.abs(walk)*.45,attacking=pose.state==='attack',released=attacking&&pose.frame>=7,recovery=released?(pose.frame-7)/4:0,draw=attacking?(released?1-recovery:p.wind):0;
  const grip=attacking?[20,-33]:[10+walk*.5,-23],nock=attacking?[mix(16,1,draw),-33]:[5,-23],angle=attacking?0:.28-walk*.08,bend=attacking&&!released?draw*.025:0,arrowCenter=[nock[0]+15,nock[1]],arrowLoaded=!p.death&&!released;
  const hips=[[-2.8,-17+bob],[3.2,-17+bob]],ankles=[[-5-walk*3.5,-2.5-Math.max(0,-lift)*2.4],[5+walk*3.5,-2.5-Math.max(0,lift)*2.4]];
  g.save();fall(g,p.death);
  const knees=hips.map((hip,i)=>{const knee=joint(hip,ankles[i],7.6,7.5,-1);limb(g,R,skeleton,'thigh',hip,knee);limb(g,R,skeleton,'shin',knee,ankles[i]);part(g,R,skeleton,'foot',ankles[i][0]-1.8,ankles[i][1]-.55,3);return knee;});
  g.save();g.translate(0,bob);const q=archer.parts.quiver;g.save();g.translate(-7,-31);g.rotate(-.16);g.drawImage(R.archerTexture,...q,-3,-4,23*q[2]/q[3],23);g.restore();
  const hands=[p.death?[-4,-20]:nock,grip],shoulders=[[-4.4,-28.5],[4.3,-28.5]],elbows=shoulders.map((s,i)=>joint(s,hands[i],i?8.7:8.1,i?8.7:8.1,i?1:-1));
  limb(g,R,skeleton,'upperArm',shoulders[0],elbows[0]);part(g,R,skeleton,'torso',-9.1,-32.6,22);
  anchored(g,R,fighters,'saHead','neck',[0,-32],14,color);part(g,R,skeleton,'cloth',-3.7,-15,10,color);
  limb(g,R,skeleton,'forearmBare',elbows[0],hands[0]);limb(g,R,skeleton,'upperArm',shoulders[1],elbows[1]);limb(g,R,skeleton,'forearmBare',elbows[1],hands[1]);
  const bow=drawArcherEquipment(g,R,{grip,nock,angle,bend,arrowCenter,arrowLoaded,released,recovery});
  for(const hand of hands){g.fillStyle='#d8cfb0';g.strokeStyle='#686454';g.lineWidth=.4;g.beginPath();g.roundRect(hand[0]-1.4,hand[1]-1.1,2.8,2.5,.7);g.fill();g.stroke();}
  eliteMark(g,elite);g.restore();g.restore();return {painted:true,style:'painted-skeleton-archer',hips,ankles,knees,hands,elbows,grip,nock,arrowCenter,arrowLoaded,released,...bow,death:p.death};
}
function drawFighter(g,R,color,p,elite,pose,key){
  const vampire=key==='und_vampire',prefix=vampire?'v':'z',walk=pose.state==='walk'?p.walk:0,lift=pose.state==='walk'?Math.cos(p.wheel):0,recovery=clamp((p.recovery-.2)/.8),strike=p.strike*(1-recovery),wind=p.wind*(1-p.strike),bob=Math.abs(walk)*.4;
  const hips=[[-3,-17+bob],[3,-17+bob]],stride=vampire?3.5:2.6,ankles=[[-5-walk*stride,-2.3-Math.max(0,-lift)*2],[5+walk*stride,-2.3-Math.max(0,lift)*2]],hands=vampire?[[-9,-23],[13-5*wind+5*strike,-25-13*wind]]:[[-9+2*strike,-21-2*wind],[12-5*wind+6*strike,-22-7*wind]];
  const shoulders=[[-7,-29],[6,-29]],elbows=shoulders.map((s,i)=>joint(s,hands[i],8,8,i?1:-1));
  g.save();fall(g,p.death);
  const knees=hips.map((hip,i)=>{const knee=joint(hip,ankles[i],7.8,7.4,-1);limb(g,R,fighters,prefix+'Thigh',hip,knee);limb(g,R,fighters,prefix+'Shin',knee,ankles[i]);anchored(g,R,fighters,prefix+'Boot','ankle',ankles[i],5);return knee;});
  g.save();g.translate(0,bob);
  if(vampire)anchored(g,R,fighters,'vCape','root',[-6,-35],30,undefined,.05+walk*.04);
  limb(g,R,fighters,prefix+'Upper',shoulders[0],elbows[0]);
  const neck=body(g,R,fighters,prefix+'Torso',[1,vampire?-19:-17],vampire?26:24);
  anchored(g,R,fighters,prefix+'Head','neck',neck,vampire?14:13);part(g,R,fighters,prefix+'Cloth',-3.5,-17,12,color);
  limb(g,R,fighters,prefix+'Fore',elbows[0],hands[0]);limb(g,R,fighters,prefix+'Upper',shoulders[1],elbows[1]);limb(g,R,fighters,prefix+'Fore',elbows[1],hands[1]);
  const swordAngle=.3-1.15*wind+strike;if(vampire)anchored(g,R,fighters,'vSword','grip',hands[1],27,undefined,swordAngle);
  eliteMark(g,elite);g.restore();g.restore();return {painted:true,style:vampire?'painted-vampire':'painted-zombie',hips,ankles,knees,hands,elbows,shoulders,neck,stride:walk*stride,swordAngle,death:p.death};
}
function drawGhost(g,R,color,p,elite,pose){
  const phase=pose.frame/8*TAU,bob=-8+Math.sin(phase)*1.4+Math.cos(phase)*.35,rest=clamp((p.recovery-.2)/.8),strike=p.strike*(1-rest),wind=p.wind*(1-p.strike),hands=[[-9,-29],[13-3*wind+10*strike,-27-8*wind+2*strike]],shoulders=[[-10,-34],[8,-34]],elbows=shoulders.map((s,i)=>joint(s,hands[i],7,12.5,i?1:-1));
  g.save();g.globalAlpha=.9*(1-p.death);g.translate(p.death*2,bob-p.death*12);
  anchored(g,R,fighters,'gTail','root',[1,-21],25,undefined,Math.sin(phase)*.06);
  limb(g,R,fighters,'gUpper',shoulders[0],elbows[0]);const neck=body(g,R,fighters,'gTorso',[1,-21],28);anchored(g,R,fighters,'gHead','neck',neck,16);
  part(g,R,fighters,'vCloth',-2.5,-26,12,color);limb(g,R,fighters,'gFore',elbows[0],hands[0]);limb(g,R,fighters,'gUpper',shoulders[1],elbows[1]);limb(g,R,fighters,'gFore',elbows[1],hands[1]);eliteMark(g,elite);
  g.restore();return {painted:true,style:'painted-ghost',legs:0,floating:true,bob,hands,shoulders,elbows,neck,death:p.death};
}
function staffTip(prefix,hand,angle){const name=prefix+'Staff',r=casters.parts[name],a=casters.anchors[name],height=casters.staffHeights[name],x=(a.tip[0]-a.grip[0])*r[2]*height/r[3],y=(a.tip[1]-a.grip[1])*height;return [hand[0]+Math.cos(angle)*x-Math.sin(angle)*y,hand[1]+Math.sin(angle)*x+Math.cos(angle)*y];}
function launchPoint(key){return key==='und_skeleton_archer'?[16*.95,-33*.95]:staffTip(key==='und_lich'?'l':'n',[13,-21],key==='und_lich'?.08:.35);}
function drawCaster(g,R,color,p,elite,pose,key){
  const lich=key==='und_lich',prefix=lich?'l':'n',walk=pose.state==='walk'?p.walk:0,lift=pose.state==='walk'?Math.cos(p.wheel):0,release=pose.state==='attack'&&pose.frame>=7,rest=release?clamp((pose.frame-7)/4):0,cast=p.strike*(1-rest),summoning=Number.isInteger(pose.summonFrame),summon=summoning?Math.sin((pose.summonFrame+1)/7*Math.PI):0;
  const hands=[[-11-2*summon+3*cast,-25-9*summon-4*cast],[13,-21]],shoulders=[[-6,-34],[6,-34]],elbows=shoulders.map((s,i)=>joint(s,hands[i],7.5,7.5,i?1:-1)),angle=lich?.08:.08+.27*cast,tip=staffTip(prefix,hands[1],angle),waist=[1,lich?-24:-23];
  g.save();fall(g,p.death);
  if(!lich)for(const [x,d]of [[-4,-1],[4,1]])anchored(g,R,casters,'boot','ankle',[x+d*walk*2,-2-Math.max(0,d*lift)*1.6],4.5);
  anchored(g,R,casters,prefix+'Robe','waist',waist,lich?25:24,color,walk*.025+lift*.008);
  limb(g,R,casters,prefix+'Upper',shoulders[0],elbows[0],color);
  const neck=body(g,R,casters,prefix+'Torso',waist,lich?20:22,color);anchored(g,R,casters,prefix+'Head','neck',neck,lich?18:14);
  limb(g,R,casters,prefix+'Fore',elbows[0],hands[0],color);limb(g,R,casters,prefix+'Upper',shoulders[1],elbows[1],color);limb(g,R,casters,prefix+'Fore',elbows[1],hands[1],color);
  anchored(g,R,casters,prefix+'Staff','grip',hands[1],casters.staffHeights[prefix+'Staff'],undefined,angle);
  g.fillStyle=lich?'#d7cfb4':'#c4bc9c';g.strokeStyle='#625b49';g.lineWidth=.4;g.beginPath();g.roundRect(11.6,-22.2,2.8,2.8,.6);g.fill();g.stroke();
  anchored(g,R,casters,prefix+'Palm','wrist',hands[0],5);
  if(!p.death){glow(g,tip,1.2+(pose.state==='attack'?cast*1.4+windGlow(p):pose.state==='channel'?1.1+Math.sin(pose.frame/8*TAU)*.25:0));if(summoning){glow(g,[-9,-31],2+summon);g.strokeStyle='#62e5a9';g.lineWidth=.8;g.beginPath();g.ellipse(0,0,9+summon*6,2.5+summon,0,0,TAU);g.stroke();}}
  eliteMark(g,elite);g.restore();return {painted:true,style:lich?'painted-lich':'painted-necromancer',hands,shoulders,elbows,neck,waist,staffTip:tip,release:launchPoint(key),summoning,death:p.death};
}
export function drawUndead(g,R,color,p,elite,pose,key){
  if(key==='und_skeleton_archer')return drawSkeletonArcher(g,R,color,p,elite,pose);
  if(key==='und_ghost')return drawGhost(g,R,color,p,elite,pose);
  if(key==='und_necromancer'||key==='und_lich')return drawCaster(g,R,color,p,elite,pose,key);
  return drawFighter(g,R,color,p,elite,pose,key);
}
function projectilePoint(R,a,t){
  const from=R.pointAt(a.lane,a.offset),to=R.pointAt(a.to,a.toOffset),s=R.ROAD.h/600*R.ROAD.zoom,face=a.undeadFace||(a.to>=a.lane?1:-1),start=launchPoint(a.key),x0=from.x+start[0]*s*face,y0=from.y+start[1]*s,y1=to.y-25*s,arc=a.key==='und_skeleton_archer'?8*s:0;
  return {x:mix(x0,to.x,t),y:mix(y0,y1,t)-Math.sin(t*Math.PI)*arc,angle:Math.atan2(y1-y0-Math.cos(t*Math.PI)*Math.PI*arc,to.x-x0),scale:s};
}
export function drawUndeadShot(R,u,a,t){
  if(!paintedUndead(R,u))return false;if(u.key==='und_lich')return true;
  if(!['und_skeleton_archer','und_necromancer'].includes(u.key))return false;
  a.undeadFace??=a.to>=a.lane?1:-1;const at=projectilePoint(R,a,t);if(at.x< -40||at.x>R.ROAD.w+40)return true;
  const g=R.ctx;g.save();g.translate(at.x,at.y);g.rotate(at.angle);
  if(u.key==='und_skeleton_archer'){const r=archer.parts.arrow,w=30*.95*at.scale,h=w*r[3]/r[2];g.drawImage(R.archerTexture,...r,-w/2,-h/2,w,h);}else drawMagicShot(g,'soul',at.scale,R.ROAD.clock);
  g.restore();return true;
}
