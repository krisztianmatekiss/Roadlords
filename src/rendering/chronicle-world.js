import shellArt from '../data/chronicle-shell-art.json';
import { assetUrl } from '../assets/urls.js';
import { CHRONICLE_THEMES, installChronicleTerrain } from './chronicle-terrain.js';
import { chronicleWalls, chronicleDoor, chronicleTowerMarkup } from './chronicle-fortifications.js';

const css=(node,key,value)=>{if(node.style.getPropertyValue(key)!==value)node.style.setProperty(key,value);};
const short=n=>n>=1000?(n/1000).toLocaleString('hu-HU',{maximumFractionDigits:1})+'k':String(Math.ceil(Math.max(0,n)));
// All match modes share these visuals. Combat coordinates, stats and ownership stay in the game.
export function installChronicleWorld(R){
  document.documentElement.style.setProperty('--chronicle-menu-scene',`url("${assetUrl(shellArt.menu.webFile)}")`);
  const cities=[],view=R.chronicle={version:2,active:()=>!!R.battleLayout?.active,assets:new Map(),tiles:new Map(),segments:[]};
  view.roadBounds=()=>({top:R.ROAD.cityTop,bottom:R.ROAD.cityTop+R.ROAD.city,height:R.ROAD.city});
  view.lateralScale=()=>R.ROAD.city/(2*(R.ROAD.half+24));
  const point=R.pointAt;R.pointAt=(distance,lateral=0)=>{const p=point(distance,lateral);if(view.active())p.y=R.ROAD.h/2+lateral*view.lateralScale();return p;};
  installChronicleTerrain(R,view,syncCities);
  for(const side of ['player','enemy']){
    const grid=R.$(side==='player'?'#playerGrid':'#enemyGrid'),city=grid.closest('.cityzone'),frame=grid.closest('.cityframe'),gate=R.$(side==='player'?'#playerGate':'#enemyGate');city.dataset.chronicleSide=side;
    const towers=R.towers.filter(t=>t.gateTower&&t.side===side).sort((a,b)=>a.lateral-b.lateral).map((t,i)=>{
      const button=document.createElement('button');button.type='button';button.className='chronicleGateTower '+(i?'lower':'upper');button.dataset.towerId=t.id;
      button.onclick=e=>{e.stopPropagation();R.state.selectedBuild=null;R.state.selectedBuilding=null;R.state.selectedTowerId=t.id;R.renderTowerInspectorV496(t);R.renderBattle(0);};frame.append(button);return{t,button};
    });cities.push({side,city,frame,gate,towers});
  }
  function syncCities(){
    for(const {side,city,frame,gate,towers}of cities){
      const c=R.cityForSide(side),race=CHRONICLE_THEMES[c.race]?c.race:'human',theme=CHRONICLE_THEMES[race],color=R.unitTeamFill({side});if(city.dataset.race!==race)city.dataset.race=race;
      const ready=!!view.assets.get(race)?.ready;
      if(frame.dataset.chronicleRace!==race||frame.dataset.chronicleArtReady!==String(ready)){
        frame.querySelector('.chronicleWalls')?.remove();frame.insertAdjacentHTML('afterbegin',chronicleWalls(race,side,ready));gate.querySelector('.chronicleDoor')?.remove();gate.insertAdjacentHTML('beforeend',chronicleDoor(race));
        for(const [index,{button}]of towers.entries()){button.innerHTML=(ready?chronicleTowerMarkup(race,index):'')+'<span class="chronicleTowerHealth"></span>';button.dataset.race=race;}
        frame.dataset.chronicleRace=race;frame.dataset.chronicleArtReady=String(ready);
      }
      for(const [name,value]of Object.entries(theme))css(city,'--chronicle-'+name,value);
      const paint=view.tile(race),paintWidth=paint?paint.width*R.ROAD.h/paint.height:0;
      css(city,'--chronicle-team',color);css(city,'--chronicle-terrain',paint?.cssUrl?`url("${paint.cssUrl}")`:'none');css(city,'--chronicle-paint-width',paintWidth+'px');css(city,'--chronicle-paint-phase',side==='player'?R.ROAD.city+'px':-R.PATH_LENGTH+'px');css(R.roadWorld,'--chronicle-height',R.ROAD.h+'px');
      if(side==='player'){css(R.roadWorld,'--chronicle-terrain',city.style.getPropertyValue('--chronicle-terrain'));css(R.roadWorld,'--chronicle-ground',theme.ground);css(R.roadWorld,'--chronicle-paint-width',paintWidth+'px');}
      for(const {t,button}of towers){if(button.style.color!==color)button.style.color=color;button.classList.toggle('destroyed',!t.alive);frame.classList.toggle(button.classList.contains('upper')?'gate-upper-lost':'gate-lower-lost',!t.alive);button.classList.toggle('sudden',!!t.sdActive&&t.alive);button.classList.toggle('selected',R.state.selectedTowerId===t.id);const title=`Vártorony · ${Math.ceil(Math.max(0,t.hp))} / ${Math.ceil(t.maxHp)} HP`;if(button.title!==title){button.title=title;button.setAttribute('aria-label',title);}const label=t.alive?short(t.hp):'×',health=button.querySelector('.chronicleTowerHealth');if(health.textContent!==label)health.textContent=label;}
      if(frame.dataset.gateMode!==c.gateMode)frame.dataset.gateMode=c.gateMode;
    }
  }
  const hud=R.updateHud;R.updateHud=(...args)=>{const out=hud(...args);if(view.active())syncCities();return out;};
  const layout=R.roadLayoutCities;
  R.roadLayoutCities=()=>{
    if(!view.active())return layout();
    const old=R.ROAD.city,scroll=R.roadWar.scrollLeft,oldEnd=R.roadWorld.offsetWidth-(R.ROAD.layoutWidth||R.roadWar.clientWidth);
    const side=Math.round(Math.min(R.ROAD.h*.88,R.ROAD.w*.46)),top=(R.ROAD.h-side)/2;R.ROAD.layoutWidth=R.roadWar.clientWidth;R.ROAD.city=side;R.ROAD.cityTop=top;
    css(R.roadWorld,'--road-city-size',side+'px');css(R.roadWorld,'--road-city-top',top+'px');R.roadWorld.style.width=`${R.PATH_LENGTH+side*2}px`;
    if(scroll>1&&side!==old)R.roadWar.scrollLeft=oldEnd>0&&scroll>=oldEnd-2?R.roadWorld.offsetWidth:scroll+side-old;
    R.roadPositionPinnedCity?.();R.ROAD.gateExits=null;syncCities();R.roadNoticeBottom=R.roadWar.getBoundingClientRect().bottom-8;document.documentElement.style.setProperty('--road-notice-anchor',R.roadNoticeBottom+'px');
  };
  const towerScale=R.towerVisualScale,towerBounds=R.towerVisualBounds,draw=R.drawTower;
  R.towerVisualScale=t=>view.active()?Math.min(R.ROAD.h/600, R.ROAD.city/410)*R.ROAD.zoom:towerScale(t);
  const bounds=t=>{const p=R.pointAt(t.lane,t.lateral||0),s=R.towerVisualScale(t);return{x:p.x-50*s,y:p.y-99*s,width:100*s,height:108*s,scale:s};};
  R.towerVisualBounds=t=>{
    if(!view.active())return towerBounds(t);
    if(t.gateTower){const node=cities.find(c=>c.side===t.side)?.towers.find(v=>v.t===t)?.button,b=node?.getBoundingClientRect(),canvas=R.canvas.getBoundingClientRect();if(b)return{x:(b.left-canvas.left)*R.canvas.width/canvas.width,y:(b.top-canvas.top)*R.canvas.height/canvas.height,width:b.width*R.canvas.width/canvas.width,height:b.height*R.canvas.height/canvas.height,scale:R.towerVisualScale(t)};}
    return bounds(t);
  };
  R.structureVisualPoint=t=>{if(view.active()){const b=R.towerVisualBounds(t);return{x:b.x+b.width/2,y:b.y+b.height*.78};}return R.pointAt(t.lane,t.lateral||0);};
  const range=R.roadTowerRangeGeometry;R.roadTowerRangeGeometry=t=>{const band=range(t);if(view.active())Object.assign(band,{top:view.roadBounds().top,bottom:view.roadBounds().bottom});return band;};
  R.drawTower=t=>{
    if(!view.active())return draw(t);if(!t.alive||t.gateTower)return;
    const g=R.ctx,b=bounds(t),p=R.pointAt(t.lane,t.lateral||0),s=b.scale,race=R.cityForSide(t.side).race,asset=view.assets.get(race),color=R.unitTeamFill(t);
    g.save();g.fillStyle='#20252336';g.beginPath();g.ellipse(p.x,p.y+6*s,36*s,8*s,0,0,Math.PI*2);g.fill();
    if(asset?.ready)g.drawImage(asset.structures,0,0,512,520,b.x,b.y,b.width,b.height);
    else{g.fillStyle=CHRONICLE_THEMES[race].wall;g.strokeStyle='#302d27';g.lineWidth=2;g.fillRect(p.x-26*s,p.y-70*s,52*s,78*s);g.strokeRect(p.x-26*s,p.y-70*s,52*s,78*s);}
    g.strokeStyle='#29312c';g.lineWidth=2;g.fillStyle=color;g.beginPath();g.moveTo(p.x-8*s,p.y-39*s);g.lineTo(p.x+8*s,p.y-39*s);g.lineTo(p.x+8*s,p.y-26*s);g.lineTo(p.x,p.y-19*s);g.lineTo(p.x-8*s,p.y-26*s);g.closePath();g.fill();g.stroke();
    if(R.state.selectedTowerId===t.id){g.strokeStyle='#ffe8a8';g.lineWidth=3;g.beginPath();g.ellipse(p.x,p.y+8*s,43*s,11*s,0,0,Math.PI*2);g.stroke();}
    const pulse=t.sdActive ? .65+.35*Math.sin(R.ROAD.clock*9) : 1;g.font='800 12px Georgia';g.textAlign='center';g.lineWidth=4;g.strokeStyle='#fff1d2';g.strokeText(`${short(t.hp)} HP`,p.x,b.y-8);g.fillStyle='#292e28';g.fillText(`${short(t.hp)} HP`,p.x,b.y-8);g.globalAlpha=pulse;g.fillStyle='#34342b';g.fillRect(p.x-30*s,p.y+14*s,60*s,6);g.fillStyle=color;g.fillRect(p.x-30*s,p.y+14*s,60*s*R.clamp(t.hp/t.maxHp,0,1),6);g.restore();R.drawUndeadTowerDecay?.(t);
  };
}
