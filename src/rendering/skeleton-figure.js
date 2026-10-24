import { assetUrl } from '../assets/urls.js';
import manifest from '../data/skeleton-art.json';

export function installSkeletonArt(R) {
  R.loadSkeletonArt=()=>{
    if(R.skeletonArtReady)return R.skeletonArtReady;
    const image=new Image();R.skeletonTexture=image;
    image.src=assetUrl(manifest.file);
    return R.skeletonArtReady=image.decode().then(()=>true,()=>false);
  };
}
export const paintedSkeleton = (R,u) => u.key==='und_skeleton' && R.ROAD.test && R.ROAD.testRoster==='skeleton' && R.ROAD.figureStyle==='skeleton' && R.skeletonTexture?.naturalWidth>0;

// Textured cutout parts use the same pose clock as the existing battle figures.
export function drawSkeleton(g,R,color,p,elite,walking=false) {
  const part=(name,x,y,w,h)=>g.drawImage(R.skeletonTexture,...manifest.parts[name],x,y,w,h);
  const joint=(name,x,y,angle,w,h,origin=.5)=>{
    g.save();g.translate(x,y);g.rotate(angle);part(name,-w*origin,0,w,h);g.restore();
  };
  const thrust=(p.strike*3.5-p.wind*1.8)*(1-p.recovery),bob=Math.abs(p.walk)*.7;
  g.save();g.translate(thrust,-bob);
  // Legs swing from the hips; knees flex on the lifted step rather than scaling the model.
  const leg=(x,phase,lift,back)=>{
    const hip=phase*.48,knee=Math.max(0,lift)*.65;
    g.save();g.translate(x,-16);g.rotate(hip);
    if(back)g.globalAlpha=.88;
    part('thigh',-2.5,0,5,8.8);g.translate(0,7.6);g.rotate(knee);
    part('shin',-2.5,0,6.8,9);g.restore();
  };
  const lift=walking?Math.cos(p.wheel):0;
  leg(-3.5,-p.walk,-lift,true);leg(3,p.walk,lift,false);
  // Back arm and a team-coloured rag remain visible around the iron breastplate.
  joint('upperArm',-6,-31,.18+p.walk*.12,4.8,9);
  g.fillStyle=color;g.beginPath();g.moveTo(-7,-31);g.lineTo(-11,-13);g.lineTo(-7,-15);g.lineTo(-5,-9);g.lineTo(-2,-29);g.fill();
  part('torso',-10,-33,20,23);
  part('skull',-4.5,-43,10.5,12);
  // Elbow follows the blade through wind-up, strike and recovery.
  const strike=p.strike*(1-Math.max(0,p.recovery-.2)/.8),wind=p.wind*(1-p.recovery);
  const upper=.1+wind*.5-strike*1.1+p.walk*.12;
  g.save();g.translate(6,-30);g.rotate(upper);
  part('upperArm',-2.6,-1,5.2,9.2);g.translate(0,7.2);
  g.rotate(-.7-wind*.9+strike*1.35);
  part('forearm',-1.9,0,4.3,8);
  g.translate(.5,6.6);g.rotate(.65-wind*.8+strike*1.9);
  part('sword',-3.4,-22,7,25);g.restore();
  // The shield has a separate shoulder joint; its banner supplies readable team colour.
  g.save();g.translate(-7,-23);g.rotate(-.12+p.wind*.12-strike*.18);
  part('shield',-5.5,-5,11,16);g.fillStyle=color;g.globalAlpha=.9;
  g.beginPath();g.moveTo(-2,-2);g.lineTo(2,-2);g.lineTo(2,4);g.lineTo(0,7);g.lineTo(-2,4);g.fill();g.restore();
  if(elite){g.strokeStyle='#f2cf73';g.lineWidth=1.2;g.beginPath();g.moveTo(-9,-30);g.lineTo(-6,-33);g.lineTo(-3,-31);g.moveTo(4,-32);g.lineTo(8,-31);g.stroke();}
  g.restore();
  return {body:[thrust,-bob],weapon:[6,-30,upper],stride:p.walk*4,painted:true};
}
