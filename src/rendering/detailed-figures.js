import { assetUrl } from '../assets/urls.js';

// Two art-direction samples. The atlas was generated from the original unit art.
// Rectangles select animation pieces; pivot positions are independent of texture size.
export const DETAILED_MODELS = Object.freeze({
  swordsman: {
    torso: {rect:[59,10,265,423],at:[-10.5,-48],height:34},
    weapon: {rect:[321,41,256,346],at:[-7.5,-33.5],pivot:[.855,.517],height:31.5},
    shield: {rect:[649,94,237,328],at:[6,-33],pivot:[.24,.186],height:27},
    rearLeg: {rect:[908,89,180,317],at:[-4,-25],pivot:[.62,.06],height:27},
    frontLeg: {rect:[1203,102,190,320],at:[4,-25],pivot:[.25,.05],height:26},
  },
  orc_warrior: {
    torso: {rect:[15,447,296,418],at:[-13.5,-48],height:38.1},
    weapon: {rect:[316,448,309,376],at:[-9,-30],pivot:[.92,.53],height:35},
    shield: {rect:[609,479,277,360],at:[9,-31],pivot:[.31,.2],height:29},
    rearLeg: {rect:[899,481,207,339],at:[-4,-24],pivot:[.512,.133],height:28},
    frontLeg: {rect:[1165,484,243,380],at:[5,-24],pivot:[.313,.121],height:29},
  },
});

// Discard neighboring atlas fragments which happen to enter a rectangular crop.
// This operates on the texture in memory; the source illustration stays intact.
function isolate(data,width,height) {
  const count=width*height,seen=new Uint8Array(count),queue=new Int32Array(count);
  let largest=new Int32Array(0);
  for(let seed=0;seed<count;seed++) {
    if(seen[seed]||data[seed*4+3]<8)continue;
    let head=0,tail=1;queue[0]=seed;seen[seed]=1;
    while(head<tail) {
      const index=queue[head++],x=index%width,y=Math.floor(index/width);
      for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++) {
        const xx=x+dx,yy=y+dy;
        if(xx<0||xx>=width||yy<0||yy>=height)continue;
        const next=yy*width+xx;
        if(seen[next]||data[next*4+3]<8)continue;
        seen[next]=1;queue[tail++]=next;
      }
    }
    if(tail>largest.length)largest=queue.slice(0,tail);
  }
  seen.fill(0);for(const index of largest)seen[index]=1;
  for(let i=0;i<count;i++)if(!seen[i])data[i*4+3]=0;
}

export async function loadDetailedFigures(R) {
  const image=new Image();image.src=assetUrl('art/battle-parts-human-orc.png');await image.decode();
  const base=new Map();
  for(const [key,model] of Object.entries(DETAILED_MODELS)) {
    const pieces={};
    for(const [name,part] of Object.entries(model)) {
      const [x,y,width,height]=part.rect,canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
      const g=canvas.getContext('2d',{willReadFrequently:true});g.drawImage(image,x,y,width,height,0,0,width,height);
      const pixels=g.getImageData(0,0,width,height);isolate(pixels.data,width,height);g.putImageData(pixels,0,0);
      pieces[name]=canvas;
    }
    base.set(key,pieces);
  }
  R.ROAD.detailedArt={base,colored:new Map(),ready:true};
}
function teamParts(R,key,color) {
  const id=key+color,cache=R.ROAD.detailedArt.colored;
  let pieces=cache.get(id);if(pieces)return pieces;
  const value=parseInt(color.slice(1),16),team=[value>>16&255,value>>8&255,value&255];
  pieces={};
  for(const [name,source] of Object.entries(R.ROAD.detailedArt.base.get(key))) {
    const canvas=document.createElement('canvas');canvas.width=source.width;canvas.height=source.height;
    const g=canvas.getContext('2d',{willReadFrequently:true});g.drawImage(source,0,0);
    const pixels=g.getImageData(0,0,canvas.width,canvas.height),d=pixels.data;
    for(let i=0;i<d.length;i+=4) {
      const r=d[i],green=d[i+1],b=d[i+2],maximum=Math.max(r,green,b),minimum=Math.min(r,green,b);
      if(!d[i+3]||b<=r*1.18||b<=green*1.06||b-r<12||(maximum-minimum)/Math.max(1,maximum)<.3)continue;
      const brightness=(r*.2+green*.6+b*.2)/94;
      for(let j=0;j<3;j++)d[i+j]=Math.min(255,Math.round(team[j]*brightness));
    }
    g.putImageData(pixels,0,0);pieces[name]=canvas;
  }
  if(cache.size>=16)cache.delete(cache.keys().next().value);
  cache.set(id,pieces);return pieces;
}
function drawPart(g,source,part,angle=0) {
  const height=part.height,width=height*source.width/source.height,pivot=part.pivot||[0,0];
  g.save();g.translate(...part.at);g.rotate(angle);g.drawImage(source,-pivot[0]*width,-pivot[1]*height,width,height);g.restore();
}
export function hasDetailedFigure(R,key) {return !!R.ROAD.detailedArt?.ready&&!!DETAILED_MODELS[key];}
export function drawDetailedFigure(g,R,key,color,p) {
  const model=DETAILED_MODELS[key],parts=teamParts(R,key,color);
  drawPart(g,parts.rearLeg,model.rearLeg,-p.walk*.29);
  drawPart(g,parts.frontLeg,model.frontLeg,p.walk*.29);
  const recovery=1-p.recovery,lunge=(p.strike*4-p.wind*1.6)*recovery;
  const swing=(-p.wind*.4+p.strike*2.65)*recovery;
  g.save();g.translate(lunge,-Math.abs(p.walk)*.65);
  if(p.strike<.3)drawPart(g,parts.weapon,model.weapon,swing+p.walk*.045);
  drawPart(g,parts.torso,model.torso);
  drawPart(g,parts.shield,model.shield,-p.wind*.11*(1-p.strike));
  if(p.strike>=.3)drawPart(g,parts.weapon,model.weapon,swing);
  g.restore();
}
