import { groupBattleUnits } from './battle-line-model.js';
import { formatMetres } from '../world/measurements.js';

const TAU=Math.PI*2;
const short=n=>n>=1000?(n/1000).toLocaleString('hu-HU',{maximumFractionDigits:1})+'k':String(Math.ceil(Math.max(0,n)));
// Transparent, interactive overview of the actual shared match state.
export function createBattleLine(R,canvas,active){
  const g=canvas.getContext('2d'),portraits=new Map(),motion=new Map();
  let width=0,height=0,last=-Infinity,hits=[],drag=null;
  const line={groups:[],structures:[],garrisons:[],boundary:0,hits:[]};
  function portrait(key){
    if(portraits.has(key))return portraits.get(key);
    const entry={ready:false},template=document.createElement('template');template.innerHTML=R.unitImageTag(key);
    const root=template.content.firstElementChild,image=root?.querySelector('image')||root;
    const src=image?.getAttribute('href')||image?.getAttribute('src')||image?.getAttribute('data-card-source');portraits.set(key,entry);if(!src)return entry;
    const img=new Image();img.onload=()=>{
      const view=root.getAttribute('viewBox')?.split(/[ ,]+/).map(Number),sourceWidth=Number(image.getAttribute('width'))||img.naturalWidth;
      const crop=view?.length===4?view:[0,0,img.naturalWidth,img.naturalHeight],ratio=img.naturalWidth/sourceWidth;
      const [x,y,w,h]=crop.map(n=>n*ratio),machine=['catapult','orc_ram'].includes(key),size=Math.min(w,h)*(machine?1:.58);
      const sx=x+(w-size)/2,sy=y+(machine?(h-size)/2:h*.06);
      const tile=document.createElement('canvas');tile.width=tile.height=96;tile.getContext('2d').drawImage(img,sx,sy,size,size,0,0,96,96);entry.image=tile;entry.ready=true;line.draw(true);
    };img.src=src;return entry;
  }
  function text(label,x,y,size=12,color='#252e30'){
    g.font=`800 ${size}px Georgia,serif`;g.lineJoin='round';g.lineWidth=4;g.strokeStyle='#fff0c9';g.strokeText(label,x,y);g.fillStyle=color;g.fillText(label,x,y);
  }
  function bubble(group,x,y,r,color,garrison=false){
    g.save();g.beginPath();g.arc(x,y,r,0,TAU);g.clip();g.fillStyle='#e6d4a5';g.fillRect(x-r,y-r,r*2,r*2);
    const art=portrait(group.key);if(art.ready)g.drawImage(art.image,x-r,y-r,r*2,r*2);else{g.fillStyle='#353d35';g.font=`bold ${r}px Georgia`;g.fillText(R.UNITS[group.key]?.name?.[0]||'•',x,y+4);}
    g.fillStyle='#182c39e0';g.fillRect(x-r,y+r*.12,r*2,r);g.restore();
    g.lineWidth=4;g.strokeStyle='#282d29';g.beginPath();g.arc(x,y,r,0,TAU);g.stroke();g.lineWidth=2.5;g.strokeStyle=color;g.stroke();
    const hp=group.maxHp?R.clamp(group.hp/group.maxHp,0,1):1;
    g.strokeStyle='#e0c8a4';g.lineWidth=2;g.beginPath();g.arc(x,y,r+3,0,TAU);g.stroke();g.strokeStyle='#80af58';g.beginPath();g.arc(x,y,r+3,-Math.PI/2,-Math.PI/2+TAU*hp);g.stroke();
    g.font=`800 ${Math.max(12,Math.min(18,r*.8))}px Georgia`;g.fillStyle='#fff1ce';g.fillText(String(group.count),x,y+r*.73);
    hits.push({x,y,r:r+5,lane:group.lane,side:group.side,garrison,key:group.key,count:group.count,label:`${garrison?'Helyőrség · ':''}${group.count} × ${R.UNITS[group.key]?.name||group.key}${group.maxHp?' · '+Math.ceil(group.hp)+' / '+Math.ceil(group.maxHp)+' HP':''}`});
  }
  function structure(item,x,y){
    const color=R.unitTeamFill({side:item.side}),ratio=R.clamp(item.hp/Math.max(1,item.maxHp),0,1),size=item.capital?22:12,alive=item.hp>0&&item.alive!==false;
    g.save();g.globalAlpha=alive?1:.35;g.fillStyle=color;g.strokeStyle='#27312c';g.lineWidth=1.6;
    g.beginPath();g.moveTo(x-size/2,y+5);g.lineTo(x-size/2,y-size/2);g.lineTo(x-size/3,y-size/2);g.lineTo(x-size/3,y-size);g.lineTo(x-size/8,y-size);g.lineTo(x-size/8,y-size/2);g.lineTo(x+size/8,y-size/2);g.lineTo(x+size/8,y-size);g.lineTo(x+size/3,y-size);g.lineTo(x+size/3,y-size/2);g.lineTo(x+size/2,y-size/2);g.lineTo(x+size/2,y+5);g.closePath();g.fill();g.stroke();
    const bar=item.capital?48:25;g.fillStyle='#393d30';g.fillRect(x-bar/2,y+8,bar,4);g.fillStyle=color;g.fillRect(x-bar/2,y+8,bar*ratio,4);
    if(item.sdActive&&alive){g.strokeStyle=`rgba(247,190,54,${.45+.5*(1+Math.sin(performance.now()/180))/2})`;g.lineWidth=3;g.beginPath();g.arc(x,y-size/3,size+5,0,TAU);g.stroke();}
    g.restore();text(short(item.hp),x,y-size-5,Math.max(10,Math.min(12,height*.12)));
    hits.push({x,y,r:item.capital?25:17,lane:item.lane,capital:item.capital,tower:item.capital?null:item,side:item.side,label:`${item.capital?'Főváros':item.gateTower?'Vártorony':'Úttorony'} · ${Math.ceil(Math.max(0,item.hp))} / ${Math.ceil(item.maxHp)} HP`});
  }
  line.draw=(force=false)=>{
    if(!active()||!width||!height)return;
    const now=performance.now();if(!force&&now-last<100)return;last=now;hits=[];g.clearRect(0,0,width,height);g.textAlign='center';g.textBaseline='alphabetic';
    const pad=Math.min(80,width*.09),w=Math.max(1,width-2*pad),y=Math.round(height*.48),x=lane=>pad+R.clamp(lane/R.PATH_LENGTH,0,1)*w;
    const boundary=R.territoryBoundary(),mid=x(boundary),own=R.unitTeamFill({side:'player'}),enemy=R.unitTeamFill({side:'enemy'});
    const section=canvas.closest('#uiTrialOverview');section.style.setProperty('--trial-own-color',own);section.style.setProperty('--trial-enemy-color',enemy);
    g.strokeStyle='#fff1d1';g.lineWidth=7;g.beginPath();g.moveTo(pad,y);g.lineTo(width-pad,y);g.stroke();
    for(const [start,end,color]of [[pad,mid,own],[mid,width-pad,enemy]]){g.strokeStyle=color;g.lineWidth=3.5;g.beginPath();g.moveTo(start,y);g.lineTo(end,y);g.stroke();}
    for(const [offset,color]of [[-2,own],[2,enemy]]){g.strokeStyle=color;g.lineWidth=2;g.beginPath();g.moveTo(mid+offset,y-10);g.lineTo(mid+offset,y+10);g.stroke();}
    line.groups=groupBattleUnits(R.state.units);line.boundary=boundary;
    const capital=(c,side,lane)=>({hp:c.hp,maxHp:c.maxHp,sdActive:c.sdActive,capital:true,side,lane});
    line.structures=[capital(R.P,'player',0),...R.towers,capital(R.E,'enemy',R.PATH_LENGTH)];
    const ordered=[...line.structures].sort((a,b)=>a.lane-b.lane),gap=Math.min(34,w/Math.max(1,ordered.length-1));let previous=pad-gap;
    const positions=ordered.map(item=>{const px=Math.max(x(item.lane),previous+gap);previous=px;return{item,x:px};});let next=width-pad+gap;
    for(let i=positions.length-1;i>=0;i--){positions[i].x=Math.min(positions[i].x,next-gap);next=positions[i].x;}
    for(const p of positions)structure(p.item,p.x,y);
    const live=new Set(),lastX={player:-Infinity,enemy:-Infinity};
    for(const group of line.groups){
      if(!R.UNITS[group.key])continue;
      const maxRadius=Math.min(27,(height-12)/4),r=Math.min(maxRadius,13+Math.log2(group.count+1)*2.2),px=x(group.lane);
      const targetX=R.clamp(Math.max(px,lastX[group.side]+r*1.4),pad,width-pad);lastX[group.side]=targetX;
      const old=motion.get(group.id),position=old?old+(targetX-old)*.4:targetX;motion.set(group.id,position);live.add(group.id);
      const py=group.side==='player'?r+5:height-r-5,color=group.side==='player'?own:enemy;
      g.strokeStyle=color;g.lineWidth=1;g.beginPath();g.moveTo(px,y);g.lineTo(position,py);g.stroke();bubble(group,position,py,r,color);
    }
    for(const key of motion.keys())if(!live.has(key))motion.delete(key);
    line.garrisons=[];
    for(const side of ['player','enemy']){
      const c=R.cityForSide(side),counts=R.unitMixCounts([...c.garrison,...c.releaseQueue]),keys=Object.keys(counts).filter(k=>counts[k]),lane=side==='player'?0:R.PATH_LENGTH;
      const summary={side,count:R.reserveCount(c),capacity:c.garrisonCap,keys};line.garrisons.push(summary);
      const direction=side==='player'?1:-1,origin=x(lane),r=Math.min(13,height*.14),py=height-r-3;
      for(const [i,key]of keys.slice(0,4).entries())bubble({side,key,count:counts[key],lane},origin+direction*(i*29+38),py,r,side==='player'?own:enemy,true);
      const army=R.fieldUnitCount(c);text(`↣ ${army}/${c.armyCap}`,origin,y+28,10);
      text(`${R.reserveCount(c)}/${c.garrisonCap}`,origin,py+5,10);
      if(keys.length>4)text('+'+(keys.length-4),origin+direction*161,py+5,10);
    }
    const visible=R.roadViewportBounds(),canvasLeft=R.ROAD.city+R.clamp(R.roadWar.scrollLeft-R.ROAD.city,0,R.PATH_LENGTH-R.ROAD.w)-R.roadWar.scrollLeft;
    const start=R.ROAD.camera+(visible.left-canvasLeft)/R.ROAD.zoom,end=R.ROAD.camera+(visible.right-canvasLeft)/R.ROAD.zoom;
    g.strokeStyle='#243b4d88';g.lineWidth=2;g.beginPath();g.moveTo(x(start),y+17);g.lineTo(x(end),y+17);g.stroke();
    canvas.setAttribute('aria-valuenow',String(Math.round((start+end)/2)));canvas.setAttribute('aria-valuetext',`Saját sereg ${R.fieldUnitCount(R.P)}/${R.P.armyCap}, helyőrség ${R.reserveCount(R.P)}/${R.P.garrisonCap}. Ellenfél sereg ${R.fieldUnitCount(R.E)}/${R.E.armyCap}, helyőrség ${R.reserveCount(R.E)}/${R.E.garrisonCap}.`);
    line.hits=hits;line.geometry={pad,width,height,y};
  };
  line.resize=()=>{const rect=canvas.getBoundingClientRect();width=rect.width;height=rect.height;if(!width||!height)return;const dpr=Math.min(2,devicePixelRatio||1);canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);g.setTransform(dpr,0,0,dpr,0,0);line.draw(true);};
  function navigate(e){
    const rect=canvas.getBoundingClientRect(),px=e.clientX-rect.left,py=e.clientY-rect.top,hit=hits.findLast(h=>Math.hypot(h.x-px,h.y-py)<h.r);
    if(hit?.capital||hit?.garrison)R.roadWar.scrollLeft=hit.side==='player'?0:R.roadWorld.offsetWidth;
    else R.roadFocusLane(hit?.lane??R.clamp((px-line.geometry.pad)/(width-2*line.geometry.pad),0,1)*R.PATH_LENGTH);
    if(hit?.tower){R.state.selectedBuilding=null;R.state.selectedTowerId=hit.tower.id;R.renderTowerInspectorV496(hit.tower);R.renderBattle(0);}
    line.draw(true);
  }
  canvas.addEventListener('pointerdown',e=>{if(e.button!==0)return;e.preventDefault();drag=e.pointerId;canvas.setPointerCapture(drag);navigate(e);});
  canvas.addEventListener('pointermove',e=>{if(e.pointerId===drag){navigate(e);return;}const rect=canvas.getBoundingClientRect(),hit=hits.findLast(h=>Math.hypot(h.x-e.clientX+rect.left,h.y-e.clientY+rect.top)<h.r);canvas.title=hit?.label||'Kattints vagy húzd a vonalon a pálya mozgatásához.';});
  canvas.addEventListener('lostpointercapture',()=>drag=null);
  canvas.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();e.stopPropagation();if(e.key==='Home'||e.key==='End')R.roadWar.scrollLeft=e.key==='Home'?0:R.roadWorld.offsetWidth;else R.roadWar.scrollLeft+=e.key==='ArrowLeft'?-200:200;line.draw(true);});
  new ResizeObserver(line.resize).observe(canvas);return line;
}
