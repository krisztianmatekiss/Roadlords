import { groupBattleUnits } from './battle-line-model.js';
import { formatMetres } from '../world/measurements.js';

// The overview reads the live world used by every game mode.
export function createBattleLine(R,canvas,active) {
  const g=canvas.getContext('2d'),portraits=new Map();
  let width=0,height=0,last=-Infinity,hits=[],drag=null;
  const line={groups:[],structures:[],boundary:0};
  function portrait(key){
    if(portraits.has(key))return portraits.get(key);
    const entry={ready:false},template=document.createElement('template');template.innerHTML=R.unitImageTag(key);
    const root=template.content.firstElementChild,image=root?.querySelector('image')||root;
    const src=image?.getAttribute('href')||image?.getAttribute('src')||image?.getAttribute('data-card-source');
    portraits.set(key,entry);if(!src)return entry;
    const img=new Image();img.onload=()=>{
      const view=root.getAttribute('viewBox')?.split(/[ ,]+/).map(Number),sourceWidth=Number(image.getAttribute('width'))||img.naturalWidth;
      const crop=view?.length===4?view:[0,0,img.naturalWidth,img.naturalHeight],ratio=img.naturalWidth/sourceWidth;
      const [x,y,w,h]=crop.map(n=>n*ratio),size=Math.min(w,h);
      const tile=document.createElement('canvas');tile.width=tile.height=40;
      tile.getContext('2d').drawImage(img,x+(w-size)/2,y+(h-size)/2,size,size,0,0,40,40);
      entry.image=tile;entry.ready=true;line.draw(true);
    };img.src=src;return entry;
  }
  function icon(key,x,y,size,color){
    g.fillStyle='#0a1411';g.fillRect(x-size/2-1,y-size/2-1,size+2,size+2);
    const art=portrait(key);if(art.ready)g.drawImage(art.image,x-size/2,y-size/2,size,size);
    else{g.fillStyle='#eee2bf';g.font=`${size*.75}px system-ui`;g.fillText(R.UNITS[key]?.icon||'•',x,y+size*.28);}
    g.strokeStyle=color;g.lineWidth=1.5;g.strokeRect(x-size/2-1,y-size/2-1,size+2,size+2);
  }
  function structure(item,x,y){
    const color=R.unitTeamFill({side:item.side}),hp=Math.max(0,item.hp),ratio=R.clamp(hp/Math.max(1,item.maxHp),0,1),capital=item.capital;
    const size=capital?20:13,alive=hp>0&&item.alive!==false;
    g.globalAlpha=alive?1:.3;g.fillStyle='#14271f';g.strokeStyle=alive?color:'#879088';g.lineWidth=1.5;
    g.fillRect(x-size/2,y-size,size,size*1.5);g.strokeRect(x-size/2,y-size,size,size*1.5);
    for(let i=0;i<3;i++)g.fillRect(x-size/2+i*size/3,y-size-3,size/5,4);
    const bar=capital?36:24,barY=y+size*.5+5;
    g.fillStyle='#101811';g.fillRect(x-bar/2,barY,bar,4);g.fillStyle=color;g.fillRect(x-bar/2,barY,bar*ratio,4);
    if(item.sdActive&&alive){g.strokeStyle=`rgba(255,215,115,${.5+.5*Math.sin(performance.now()/180)})`;g.lineWidth=2;g.strokeRect(x-size/2-3,y-size-6,size+6,size*1.5+18);}
    g.globalAlpha=1;g.fillStyle='#d6decf';g.font='700 10px system-ui';g.fillText(capital?'VÁROS':item.overviewLabel||`T${item.tier}`,x,barY+16);
    hits.push({x,y,r:Math.max(16,bar/2),lane:item.lane,capital,side:item.side,label:`${capital?'Főváros':item.gateTower?'Vártorony':'Úttorony'} · ${Math.ceil(hp)} / ${Math.ceil(item.maxHp)} HP`});
  }
  line.draw=(force=false)=>{
    if(!active()||!width||!height)return;
    const now=performance.now();if(!force&&now-last<100)return;last=now;hits=[];
    g.clearRect(0,0,width,height);g.textAlign='center';g.textBaseline='alphabetic';
    const pad=32,w=Math.max(1,width-2*pad),y=height/2-2,x=lane=>pad+R.clamp(lane/R.PATH_LENGTH,0,1)*w;
    const boundary=R.territoryBoundary(),mid=x(boundary),own=R.unitTeamFill({side:'player'}),enemy=R.unitTeamFill({side:'enemy'});
    canvas.closest('#uiTrialOverview').style.setProperty('--trial-own-color',own);canvas.closest('#uiTrialOverview').style.setProperty('--trial-enemy-color',enemy);
    g.lineWidth=1;g.strokeStyle=own;g.beginPath();g.moveTo(0,y);g.lineTo(pad,y);g.stroke();g.strokeStyle=enemy;g.beginPath();g.moveTo(width-pad,y);g.lineTo(width,y);g.stroke();
    g.strokeStyle=own;g.lineWidth=3;g.beginPath();g.moveTo(pad,y);g.lineTo(mid,y);g.stroke();
    g.strokeStyle=enemy;g.beginPath();g.moveTo(mid,y);g.lineTo(width-pad,y);g.stroke();
    for(const [offset,color]of [[-2,own],[2,enemy]]){g.strokeStyle=color;g.lineWidth=2;g.beginPath();g.moveTo(mid+offset,y-14);g.lineTo(mid+offset,y+14);g.stroke();}
    line.groups=groupBattleUnits(R.state.units);line.boundary=boundary;
    const size=height<160?20:24,step=height<160?24:30,rows={player:[-Infinity,-Infinity],enemy:[-Infinity,-Infinity]};
    for(const group of line.groups){
      if(!R.UNITS[group.key])continue;
      const px=x(group.lane),used=rows[group.side],row=used[0]<px-size-3?0:1;used[row]=px;
      const py=y+(group.side==='player'?-1:1)*(step+row*step),color=group.side==='player'?own:enemy;
      icon(group.key,px,py,size,color);g.font='800 11px system-ui';g.lineWidth=3;g.strokeStyle='#07100d';g.strokeText(String(group.count),px,py-size/2-4);g.fillStyle='#fff0c4';g.fillText(String(group.count),px,py-size/2-4);
      hits.push({x:px,y:py,r:size/2+3,lane:group.lane,label:`${group.count} × ${R.UNITS[group.key].name} · ${formatMetres(group.start)}–${formatMetres(group.end)}`});
    }
    const capital=(c,side,lane)=>({hp:c.hp,maxHp:c.maxHp,sdActive:c.sdActive,capital:true,side,lane});
    line.structures=[capital(R.P,'player',0),...R.towers,capital(R.E,'enemy',R.PATH_LENGTH)];
    const ownTowers=R.towers.filter(t=>t.side==='player').sort((a,b)=>a.lane-b.lane),enemyTowers=R.towers.filter(t=>t.side==='enemy').sort((a,b)=>a.lane-b.lane);
    const ordered=[line.structures[0],...ownTowers,...enemyTowers,line.structures.at(-1)],gap=Math.min(30,w/Math.max(1,ordered.length-1));
    let previous=pad-gap;const positions=ordered.map(item=>{const px=Math.max(x(item.lane),previous+gap);previous=px;return {item,x:px};});
    let next=width-pad+gap;for(let i=positions.length-1;i>=0;i--){positions[i].x=Math.min(positions[i].x,next-gap);next=positions[i].x;}
    const gates={player:0,enemy:0};for(const p of positions){const item=p.item.gateTower?{...p.item,overviewLabel:'V'+(++gates[p.item.side])}:p.item;structure(item,p.x,y);}
    g.font='700 10px system-ui';g.fillStyle='#a7b59f';g.fillText(`${formatMetres(R.PATH_LENGTH)} · 20 m-es csoportok`,width/2,height-4);
    const visible=R.roadViewportBounds(),canvasLeft=R.ROAD.city+R.clamp(R.roadWar.scrollLeft-R.ROAD.city,0,R.PATH_LENGTH-R.ROAD.w)-R.roadWar.scrollLeft;
    const start=R.ROAD.camera+(visible.left-canvasLeft)/R.ROAD.zoom,end=R.ROAD.camera+(visible.right-canvasLeft)/R.ROAD.zoom;
    g.strokeStyle='#fff1b177';g.lineWidth=1;g.strokeRect(x(start),3,Math.max(2,x(end)-x(start)),height-16);
    canvas.setAttribute('aria-valuenow',String(Math.round((start+end)/2)));
  };
  line.resize=()=>{
    const rect=canvas.getBoundingClientRect();width=rect.width;height=rect.height;if(!width||!height)return;
    const dpr=Math.min(2,devicePixelRatio||1);canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);g.setTransform(dpr,0,0,dpr,0,0);line.draw(true);
  };
  function navigate(e){
    const rect=canvas.getBoundingClientRect(),px=e.clientX-rect.left,py=e.clientY-rect.top;
    const hit=hits.findLast(h=>Math.hypot(h.x-px,h.y-py)<h.r);
    if(hit?.capital)R.roadWar.scrollLeft=hit.side==='player'?0:R.roadWorld.offsetWidth;
    else R.roadFocusLane(hit?.lane??R.clamp((px-32)/(width-64),0,1)*R.PATH_LENGTH);
    line.draw(true);
  }
  canvas.addEventListener('pointerdown',e=>{if(e.button!==0)return;e.preventDefault();drag=e.pointerId;canvas.setPointerCapture(drag);navigate(e);});
  canvas.addEventListener('pointermove',e=>{
    if(e.pointerId===drag){navigate(e);return;}
    const rect=canvas.getBoundingClientRect(),hit=hits.findLast(h=>Math.hypot(h.x-e.clientX+rect.left,h.y-e.clientY+rect.top)<h.r);
    canvas.title=hit?.label||'Kattints vagy húzd a vonalon a pálya mozgatásához.';
  });
  canvas.addEventListener('lostpointercapture',()=>drag=null);
  canvas.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();e.stopPropagation();if(e.key==='Home'||e.key==='End')R.roadWar.scrollLeft=e.key==='Home'?0:R.roadWorld.offsetWidth;else R.roadWar.scrollLeft+=e.key==='ArrowLeft'?-200:200;line.draw(true);});
  new ResizeObserver(line.resize).observe(canvas);
  return line;
}
