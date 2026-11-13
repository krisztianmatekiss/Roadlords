import art from '../data/chronicle-art.json';
import { assetUrl } from '../assets/urls.js';

const THEMES={
  human:{ground:'#bdba72',floor:'#e5cc8d',wall:'#d6b77d',shadow:'#947d58'},
  orc:{ground:'#8b7544',floor:'#b58c60',wall:'#84725b',shadow:'#514d39'},
  undead:{ground:'#756c82',floor:'#9c939e',wall:'#a39caa',shadow:'#666270'},
};
const short=n=>n>=1000?(n/1000).toLocaleString('hu-HU',{maximumFractionDigits:1})+'k':String(Math.ceil(Math.max(0,n)));
const towerArt=`<svg viewBox="0 0 100 150" aria-hidden="true"><path d="M16 40 84 35 91 126 80 139 11 137Z" fill="var(--chronicle-wall)" stroke="#302b26" stroke-width="3"/><path d="m66 40 18-5 7 91-11 13-10-91Z" fill="var(--chronicle-wall-shadow)"/><path d="M14 40V23H29V34H42V20H58V33H72V20H88V41Z" fill="var(--chronicle-wall)" stroke="#302b26" stroke-width="3"/><path d="M15 65H69M14 89H72M13 113H76M35 42V65M49 65V89M32 89V113M55 113V137" fill="none" stroke="#554b3b" stroke-width="1.4"/><path d="M42 115V91a9 9 0 0 1 18 0v24Z" fill="#39352b" stroke="#272721" stroke-width="2"/><path d="M53 23V1l28 6-13 10-15-4" fill="currentColor" stroke="#292a25" stroke-width="2"/></svg>`;
const doorArt='<svg class="chronicleDoor" viewBox="0 0 60 150" aria-hidden="true"><path d="M9 143V34a21 21 0 0 1 42 0v109Z" fill="#292c26" stroke="#2d2921" stroke-width="3"/><g class="chronicleDoorLeaf"><path d="M13 140V35a17 17 0 0 1 34 0v105Z" fill="#a8733c" stroke="#342c23" stroke-width="3"/><path d="M23 23V138M34 20V138M45 32V138M13 55H47M13 116H47" fill="none" stroke="#513b27" stroke-width="3"/><circle cx="36" cy="82" r="3" fill="#ead092" stroke="#332d25"/></g></svg>';
function walls(side){
  return `<svg class="chronicleWalls" data-side="${side}" viewBox="0 0 1000 1000" preserveAspectRatio="none" aria-hidden="true"><defs><pattern id="chronicleStone-${side}" width="90" height="40" patternUnits="userSpaceOnUse"><path d="M0 0H90M0 20H90M0 40H90M22 0V20M68 20V40" fill="none" stroke="#554b3b" stroke-width="1.3"/></pattern></defs><path d="M980 420V22H22V978H980V580" fill="none" stroke="#302b24" stroke-width="40" stroke-linejoin="round"/><path d="M980 420V22H22V978H980V580" fill="none" stroke="var(--chronicle-wall)" stroke-width="33"/><path d="M980 420V22H22V978H980V580" fill="none" stroke="url(#chronicleStone-${side})" stroke-width="30"/>${[[22,22],[978,22],[22,978],[978,978]].map(([x,y])=>`<g transform="translate(${x} ${y})"><path d="M-24-22V-39H-10V-29H5V-41H20V-29H31V-10L27 30H-26Z" fill="var(--chronicle-wall)" stroke="#302b24" stroke-width="3"/><path d="M-23-10H29M-24 10H28M-6-10V10M8 10V29" fill="none" stroke="#75644d" stroke-width="1.5"/></g>`).join('')}</svg>`;
}

// One shared presentation for solo, multiplayer and the full spectator match.
// Territory art is selected by ownership, never by army position or a test flag.
export function installChronicleWorld(R){
  const assets=new Map(),tiles=new Map(),cities=[];
  const view=R.chronicle={version:1,active:()=>!!R.battleLayout?.active,assets,tiles,segments:[]};
  R.loadChronicleArt=(races=[R.P.race,R.E.race])=>Promise.all([...new Set(races)].map(race=>{
    race=THEMES[race]?race:'human';
    if(assets.has(race))return assets.get(race).promise;
    const entry={image:new Image(),ready:false};assets.set(race,entry);
    entry.promise=new Promise(resolve=>{entry.image.onload=()=>{entry.ready=true;tile(race).cssReady.then(()=>{syncCities();resolve(true);});};entry.image.onerror=()=>{assets.delete(race);resolve(false);};entry.image.src=assetUrl(art[race].webFile);});
    return entry.promise;
  })).then(result=>result.every(Boolean));
  const productionArt=R.loadProductionBattleArt;
  R.loadProductionBattleArt=async(races=[R.P.race,R.E.race])=>{
    const results=await Promise.all([productionArt(races),R.loadChronicleArt(races)]);return results.every(Boolean);
  };
  function tile(race){
    const asset=assets.get(race);if(!asset?.ready)return null;
    const height=Math.min(900,R.ROAD.h),key=race+':'+height;
    if(tiles.has(key))return tiles.get(key);
    // Reflection makes the repeating edges agree without a visible colour seam.
    const width=Math.round(height*asset.image.naturalWidth/asset.image.naturalHeight),canvas=document.createElement('canvas');
    canvas.width=width*2;canvas.height=height;const g=canvas.getContext('2d');
    g.drawImage(asset.image,0,0,width,canvas.height);g.save();g.translate(width*2,0);g.scale(-1,1);g.drawImage(asset.image,0,0,width,canvas.height);g.restore();
    // A resize replaces old tiles; the cache is bounded to one per faction.
    for(const k of tiles.keys())if(k.startsWith(race+':')){const old=tiles.get(k);if(old.cssUrl)URL.revokeObjectURL(old.cssUrl);tiles.delete(k);}
    canvas.cssReady=new Promise(resolve=>canvas.toBlob(blob=>{if(tiles.get(key)===canvas){canvas.cssUrl=blob?URL.createObjectURL(blob):'';syncCities();}resolve();},'image/webp',.92));
    tiles.set(key,canvas);return canvas;
  }
  view.drawGround=()=>{
    const g=R.ctx,z=R.ROAD.zoom||1,boundary=R.territoryBoundary(),mid=R.pointAt(boundary).x;
    view.boundary=boundary;view.segments=[];
    if(!document.body.classList.contains('roadlords-menu-open')&&[R.P.race,R.E.race].some(race=>!assets.get(race)?.ready))R.loadChronicleArt();
    for(const [side,start,end]of [['player',0,Math.min(R.ROAD.w,mid)],['enemy',Math.max(0,mid),R.ROAD.w]]){
      if(end<=start)continue;
      const race=R.cityForSide(side).race,theme=THEMES[race]||THEMES.human,t=tile(race);
      view.segments.push({side,race,start,end,boundary});g.save();g.beginPath();g.rect(start,0,end-start,R.ROAD.h);g.clip();
      g.fillStyle=theme.ground;g.fillRect(start,0,end-start,R.ROAD.h);
      if(t){const w=t.width*R.ROAD.h/t.height*z,origin=-R.ROAD.camera*z;for(let x=origin+Math.floor((start-origin)/w)*w;x<end;x+=w)g.drawImage(t,x,0,w,R.ROAD.h);}
      else{g.fillStyle=theme.floor;g.fillRect(start,R.ROAD.h*.3,end-start,R.ROAD.h*.46);}
      g.restore();
    }
  };
  for(const side of ['player','enemy']){
    const grid=R.$(side==='player'?'#playerGrid':'#enemyGrid'),city=grid.closest('.cityzone'),frame=city.querySelector('.cityframe'),gate=R.$(side==='player'?'#playerGate':'#enemyGate');
    city.dataset.chronicleSide=side;frame.insertAdjacentHTML('afterbegin',walls(side));gate.insertAdjacentHTML('beforeend',doorArt);
    const towers=R.towers.filter(t=>t.gateTower&&t.side===side).sort((a,b)=>a.lateral-b.lateral).map((t,i)=>{
      const button=document.createElement('button');button.type='button';button.className='chronicleGateTower '+(i?'lower':'upper');button.dataset.towerId=t.id;button.innerHTML=towerArt+'<span class="chronicleTowerHealth"></span>';
      button.onclick=e=>{e.stopPropagation();R.state.selectedBuild=null;R.state.selectedBuilding=null;R.state.selectedTowerId=t.id;R.renderTowerInspectorV496(t);R.renderBattle(0);};frame.append(button);return {t,button};
    });cities.push({side,city,frame,towers});
  }
  function syncCities(){
    for(const {side,city,frame,towers}of cities){
      const c=R.cityForSide(side),theme=THEMES[c.race]||THEMES.human,color=R.unitTeamFill({side});city.dataset.race=c.race;
      for(const [name,value]of Object.entries(theme))city.style.setProperty('--chronicle-'+name,value);
      const paint=tile(c.race),paintWidth=paint?paint.width*R.ROAD.h/paint.height:0;
      city.style.setProperty('--chronicle-team',color);city.style.setProperty('--chronicle-terrain',paint?.cssUrl?`url("${paint.cssUrl}")`:'none');
      city.style.setProperty('--chronicle-paint-width',paintWidth+'px');city.style.setProperty('--chronicle-paint-phase',side==='player'?R.ROAD.city+'px':-R.PATH_LENGTH+'px');
      R.roadWorld.style.setProperty('--chronicle-height',R.ROAD.h+'px');
      if(side==='player'){R.roadWorld.style.setProperty('--chronicle-terrain',city.style.getPropertyValue('--chronicle-terrain'));R.roadWorld.style.setProperty('--chronicle-ground',theme.ground);R.roadWorld.style.setProperty('--chronicle-paint-width',paintWidth+'px');}
      for(const {t,button}of towers){button.style.color=color;button.classList.toggle('destroyed',!t.alive);button.classList.toggle('sudden',!!t.sdActive&&t.alive);button.classList.toggle('selected',R.state.selectedTowerId===t.id);button.title=`Vártorony · ${Math.ceil(Math.max(0,t.hp))} / ${Math.ceil(t.maxHp)} HP`;button.setAttribute('aria-label',button.title);button.querySelector('.chronicleTowerHealth').textContent=t.alive?short(t.hp):'×';}
      frame.dataset.gateMode=c.gateMode;
    }
  }
  const hud=R.updateHud;R.updateHud=(...args)=>{const out=hud(...args);if(view.active())syncCities();return out;};
  const layout=R.roadLayoutCities;
  R.roadLayoutCities=()=>{
    if(!view.active())return layout();
    const old=R.ROAD.city,scroll=R.roadWar.scrollLeft,oldEnd=R.roadWorld.offsetWidth-(R.ROAD.layoutWidth||R.roadWar.clientWidth);
    const side=Math.round(Math.min(R.ROAD.h*.68,R.ROAD.w*.42)),top=(R.ROAD.h-side)/2;
    R.ROAD.layoutWidth=R.roadWar.clientWidth;R.ROAD.city=side;R.ROAD.cityTop=top;
    R.roadWorld.style.setProperty('--road-city-size',side+'px');R.roadWorld.style.setProperty('--road-city-top',top+'px');R.roadWorld.style.width=`${R.PATH_LENGTH+side*2}px`;
    if(scroll>1&&side!==old)R.roadWar.scrollLeft=oldEnd>0&&scroll>=oldEnd-2?R.roadWorld.offsetWidth:scroll+side-old;
    R.roadPositionPinnedCity?.();R.ROAD.gateExits=null;syncCities();
    R.roadNoticeBottom=R.roadWar.getBoundingClientRect().bottom-8;document.documentElement.style.setProperty('--road-notice-anchor',R.roadNoticeBottom+'px');
  };
  R.structureVisualPoint=t=>{
    if(view.active()&&t.gateTower){
      const node=cities.find(c=>c.side===t.side)?.towers.find(v=>v.t===t)?.button;
      if(node){const b=node.getBoundingClientRect(),canvas=R.canvas.getBoundingClientRect();return {x:(b.left+b.width/2-canvas.left)*R.canvas.width/canvas.width,y:(b.top+b.height*.78-canvas.top)*R.canvas.height/canvas.height};}
    }
    return R.pointAt(t.lane,t.lateral||0);
  };
  const draw=R.drawTower,scale=R.towerVisualScale,bounds=R.towerVisualBounds;
  R.towerVisualScale=t=>view.active()?R.ROAD.h/600*R.ROAD.zoom*1.1:scale(t);
  R.towerVisualBounds=t=>{
    if(!view.active()||!t.gateTower)return bounds(t);
    const p=R.structureVisualPoint(t),s=R.towerVisualScale(t);return{x:p.x-22*s,y:p.y-52*s,width:44*s,height:60*s,scale:s};
  };
  R.drawTower=t=>{
    if(!view.active())return draw(t);
    if(!t.alive||t.gateTower)return;
    // Existing road defences retain their mechanics and inspection. Their old
    // placeholder tower picture is replaced by a small ink-drawn stone bastion.
    const g=R.ctx,p=R.pointAt(t.lane,t.lateral||0),s=R.towerVisualScale(t),color=R.unitTeamFill(t),theme=THEMES[R.cityForSide(t.side).race]||THEMES.human;
    g.save();g.translate(p.x,p.y);g.scale(s,s);g.strokeStyle='#302c24';g.lineWidth=1.8;g.fillStyle=theme.shadow;
    g.beginPath();g.ellipse(1,12,24,6,0,0,Math.PI*2);g.fill();g.fillStyle=theme.wall;
    g.beginPath();g.moveTo(-22,10);g.lineTo(-21,-19);g.lineTo(-10,-19);g.lineTo(-10,-12);g.lineTo(-3,-12);g.lineTo(-3,-20);g.lineTo(7,-20);g.lineTo(7,-12);g.lineTo(14,-12);g.lineTo(14,-19);g.lineTo(23,-19);g.lineTo(24,10);g.closePath();g.fill();g.stroke();
    g.lineWidth=.7;for(const y of [-4,4]){g.beginPath();g.moveTo(-21,y);g.lineTo(23,y);g.stroke();}g.fillStyle=color;g.fillRect(-5,-9,10,19);g.strokeRect(-5,-9,10,19);
    if(R.state.selectedTowerId===t.id){g.strokeStyle='#f3cf63';g.lineWidth=2;g.strokeRect(-27,-25,55,41);}
    g.restore();
    g.save();g.font='800 12px Georgia';g.textAlign='center';g.lineWidth=3;g.strokeStyle='#fff1d2';g.strokeText(`${short(t.hp)} HP`,p.x,p.y-25*s);g.fillStyle='#292e28';g.fillText(`${short(t.hp)} HP`,p.x,p.y-25*s);
    g.fillStyle='#34342b';g.fillRect(p.x-23*s,p.y+15*s,46*s,5);g.fillStyle=color;g.fillRect(p.x-23*s,p.y+15*s,46*s*R.clamp(t.hp/t.maxHp,0,1),5);g.restore();
  };
}
