import { formatMetres, toMetres } from '../world/measurements.js';

export function installTowerPresentation(R) {
  // Size follows the map height and zoom, with enough space between gate towers.
  R.towerVisualScale=t=>1.75*(t.gateTower?1.18:1)*(R.ROAD.h/600)*R.ROAD.zoom;
  R.towerVisualBounds=t=>{
    const p=R.pointAt(t.lane,t.lateral||0),s=R.towerVisualScale(t);
    return {x:p.x-23*s,y:p.y-28*s,width:46*s,height:58*s,scale:s};
  };
  R.drawTower=t=>{
    if(!t.alive)return;
    const g=R.ctx,p=R.pointAt(t.lane,t.lateral||0),s=R.towerVisualScale(t),selected=R.state.selectedTowerId===t.id;
    const pulse=t.sdActive ? .55+.45*(1+Math.sin(R.state.time*7))/2 : 0;
    g.save();g.translate(p.x,p.y);g.scale(s,s);
    g.fillStyle='#0007';g.beginPath();g.ellipse(3,18,22,8,0,0,Math.PI*2);g.fill();
    g.fillStyle=t.side==='player'?'#80978b':'#976b67';g.fillRect(-15,-18,30,36);
    g.fillStyle='#ffffff22';g.fillRect(-15,-18,5,36);g.fillStyle='#0003';g.fillRect(10,-18,5,36);
    g.fillStyle=t.gateTower?'#ead184':'#d8ca9f';
    for(let x=-15;x<=8;x+=11)g.fillRect(x,-24,7,9);
    if(t.gateTower){g.strokeStyle='#f0c96a';g.lineWidth=2;g.strokeRect(-16,-19,32,38);}
    g.fillStyle='#0a0e0b';g.fillRect(-5,-6,10,18);
    g.fillStyle='#0b0f0c';g.fillRect(-22,25,44,5);g.fillStyle=t.sdActive ? `rgba(240,130,255,${pulse})` : R.unitTeamFill(t);
    g.fillRect(-22,25,44*R.clamp(t.hp/t.maxHp,0,1),5);
    if(selected){g.strokeStyle='#ffe397';g.lineWidth=2;g.setLineDash([4,3]);g.strokeRect(-22,-29,44,63);}
    g.restore();
    const short=v=>v>=1000?`${(v/1000).toLocaleString('hu-HU',{maximumFractionDigits:1})}k`:String(Math.ceil(v));
    const lower=t.gateTower&&(t.lateral||0)>0,label=`${short(t.hp)} / ${short(t.maxHp)}`;
    const hpY=p.y+(lower?38*s+10:-28*s-12);
    g.save();g.font='800 11px system-ui';g.textAlign='center';g.textBaseline='middle';
    const w=Math.max(60,g.measureText(label).width+12);g.fillStyle='#080c0af2';g.fillRect(p.x-w/2,hpY-9,w,18);
    if(t.sdActive){g.shadowColor='#e98bff';g.shadowBlur=6+10*pulse;}
    g.strokeStyle=t.sdActive?'#e98bff':R.unitTeamFill(t);g.lineWidth=t.sdActive?1.2+1.5*pulse:1.2;g.strokeRect(p.x-w/2+.6,hpY-8.4,w-1.2,16.8);
    g.fillStyle=t.sdActive?`rgba(255,${Math.round(165+90*pulse)},255,1)`:'#fff2cf';g.fillText(label,p.x,hpY);
    if(!t.gateTower){g.font='bold 11px system-ui';g.fillText(`T${t.tier}`,p.x,p.y+40*s);}
    g.restore();
  };
  R.towerAtCanvasPointV496=(x,y)=>{
    let best=null,distance=Infinity;
    for(const t of R.towers){if(!t.alive)continue;const b=R.towerVisualBounds(t),p=R.pointAt(t.lane,t.lateral||0);
      if(x<b.x-5||x>b.x+b.width+5||y<b.y-5||y>b.y+b.height+5)continue;
      const d=Math.hypot(x-p.x,y-p.y);if(d<distance){best=t;distance=d;}
    }return best;
  };
  R.roadTowerRangeGeometry=t=>{
    const range=R.towerStatsV496(t).range,start=R.clamp(t.lane-range,0,R.PATH_LENGTH),end=R.clamp(t.lane+range,0,R.PATH_LENGTH);
    return {start,end,range,metres:toMetres(range),left:R.pointAt(start).x,right:R.pointAt(end).x,top:R.ROAD.h*49/600,bottom:R.ROAD.h*551/600};
  };
  R.drawTowerRangeV496=()=>{
    const t=R.selectedTowerV496();
    if(!t?.alive){if(R.canvas.dataset.towerRange){delete R.canvas.dataset.towerRange;R.canvas.removeAttribute('aria-description');}return;}
    const b=R.roadTowerRangeGeometry(t),g=R.ctx,label=`Hatótáv: ${formatMetres(b.range)}`;
    if(R.canvas.dataset.towerRange!==label){R.canvas.dataset.towerRange=label;R.canvas.setAttribute('aria-description',`${R.towerNameV496(t)} · ${label}`);}
    if(b.right<0||b.left>R.ROAD.w)return;
    // Tower targeting uses lane distance across the road, so show the real band.
    g.save();g.fillStyle='#f6c94b2b';g.fillRect(b.left,b.top,b.right-b.left,b.bottom-b.top);
    g.strokeStyle='#ffe18b';g.lineWidth=3;g.beginPath();g.moveTo(b.left,b.top);g.lineTo(b.left,b.bottom);g.moveTo(b.right,b.top);g.lineTo(b.right,b.bottom);g.stroke();
    g.setLineDash([8,6]);g.lineWidth=1.5;g.strokeRect(b.left,b.top,b.right-b.left,b.bottom-b.top);g.setLineDash([]);
    g.font='800 13px system-ui';g.textAlign='center';g.textBaseline='middle';const w=g.measureText(label).width+18;
    const x=R.clamp(R.pointAt(t.lane).x,w/2+5,R.ROAD.w-w/2-5),y=b.top+18;
    g.fillStyle='#131c13f2';g.fillRect(x-w/2,y-12,w,24);g.strokeStyle='#ffe18b';g.strokeRect(x-w/2,y-12,w,24);g.fillStyle='#fff0ae';g.fillText(label,x,y);g.restore();
  };
  const position=R.positionInspector;
  R.positionInspector=()=>{
    const t=R.selectedTowerV496(),el=R.$('#inspector');
    if(!t?.alive||R.state.selectedBuilding||!el.classList.contains('show'))return position();
    const band=R.roadTowerRangeGeometry(t),canvas=R.canvas.getBoundingClientRect(),w=el.offsetWidth||330,h=el.offsetHeight||320;
    const right=canvas.left+band.right+20,left=canvas.left+band.left-w-20;
    el.style.left=`${Math.round(R.clamp(right+w<innerWidth-10?right:left,10,Math.max(10,innerWidth-w-10)))}px`;
    el.style.top=`${Math.round(R.clamp(canvas.top+R.ROAD.h/2-h/2,74,Math.max(74,innerHeight-h-10)))}px`;
  };
  R.canvas.addEventListener('click',()=>{if(R.state.selectedTowerId)R.renderBattle(0);});
}
