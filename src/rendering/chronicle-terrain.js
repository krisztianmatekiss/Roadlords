import art from '../data/chronicle-art.json';
import { assetUrl } from '../assets/urls.js';

export const CHRONICLE_THEMES={
  human:{ground:'#9ca65d',floor:'#e2cf9b',wall:'#d6b77d',shadow:'#947d58'},
  orc:{ground:'#704d39',floor:'#a88560',wall:'#77533a',shadow:'#49362c'},
  undead:{ground:'#686a73',floor:'#93939b',wall:'#777481',shadow:'#45434f'},
};
// Cropped source layers are composed once per viewport, then reused while moving.
// The road and city share the very same bounds; texture proportions cannot move it.
export function installChronicleTerrain(R,view,syncCities){
  const {assets,tiles}=view,retiredUrls=new Map();
  const image=src=>new Promise(resolve=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>resolve(null);img.src=assetUrl(src);});
  R.loadChronicleArt=(races=[R.P.race,R.E.race])=>Promise.all([...new Set(races)].map(key=>{
    const race=art[key]?key:'human';if(assets.has(race))return assets.get(race).promise;
    const entry={ready:false};assets.set(race,entry);
    entry.promise=Promise.all([image(art[race].webFile),image(art[race].structures.webFile),image(art[race].fortress.webFile),art[race].roadTexture?image(art[race].roadTexture.webFile):Promise.resolve(null),image(art[race].courtyard.webFile)]).then(async([terrain,structures,fortress,road,courtyard])=>{
      if(!terrain||!structures||!fortress||!courtyard||art[race].roadTexture&&!road){assets.delete(race);return false;}
      entry.image=terrain;entry.structures=structures;entry.fortress=fortress;entry.road=road;entry.courtyard=courtyard;entry.ready=true;await view.tile(race).cssReady;syncCities();return true;
    });return entry.promise;
  })).then(values=>values.every(Boolean));
  const load=R.loadProductionBattleArt;R.loadProductionBattleArt=async(races=[R.P.race,R.E.race])=>(await Promise.all([load(races),R.loadChronicleArt(races)])).every(Boolean);
  view.tile=race=>{
    const entry=assets.get(race);if(!entry?.ready)return null;
    const height=Math.min(900,R.ROAD.h),ratio=height/R.ROAD.h,bounds=view.roadBounds(),key=`${race}:${height}:${Math.round(bounds.height*ratio)}`;
    if(tiles.has(key))return tiles.get(key);
    const canvas=document.createElement('canvas');canvas.width=2048;canvas.height=height;const g=canvas.getContext('2d');
    const rows=[['background',0,bounds.top*ratio],['road',bounds.top*ratio,bounds.height*ratio],['foreground',bounds.bottom*ratio,height-bounds.bottom*ratio]];
    for(const [name,y,h]of rows){
      if(h<=0)continue;g.save();g.beginPath();g.rect(0,y,1024,h);g.clip();
      if(name==='foreground'){
        // The event line owns the bottom edge: no rocks, roots, bones or shrubs.
        g.fillStyle=CHRONICLE_THEMES[race].ground;g.fillRect(0,y,1024,h);
      }else{
        const [sx,sy,sw,sh]=art[race].layers[name],part=document.createElement('canvas');
        if(name==='road'&&entry.road){part.width=part.height=512;part.getContext('2d').drawImage(entry.road,0,0,512,512);}
        else{const trim=name==='background'?Math.round(sh*.72):0;part.width=sw;part.height=sh-trim;part.getContext('2d').drawImage(entry.image,sx,sy+trim,sw,sh-trim,0,0,sw,sh-trim);}
        const pattern=g.createPattern(part,'repeat');pattern.setTransform(new DOMMatrix().scale((name==='road'?.55:.4)*ratio));g.fillStyle=pattern;g.fillRect(0,y,1024,h);
      }
      g.restore();
    }
    g.save();g.strokeStyle='#27352a40';g.lineWidth=1.5*ratio;
    for(const edge of [bounds.top,bounds.bottom]){g.beginPath();g.moveTo(0,edge*ratio);for(let x=0;x<1024;x+=128)g.bezierCurveTo(x+32,edge*ratio-2*ratio,x+80,edge*ratio+2*ratio,x+128,edge*ratio);g.stroke();}
    // A continuous pair of worn wheel tracks ties both gate approaches together.
    g.strokeStyle=race==='undead'?'#202d3040':'#5b462728';g.lineWidth=2*ratio;
    for(const fraction of [.38,.62]){g.beginPath();g.moveTo(0,(bounds.top+bounds.height*fraction)*ratio);g.lineTo(1024,(bounds.top+bounds.height*fraction)*ratio);g.stroke();}g.restore();
    g.save();g.translate(2048,0);g.scale(-1,1);g.drawImage(canvas,0,0,1024,height,0,0,1024,height);g.restore();
    for(const oldKey of tiles.keys())if(oldKey.startsWith(race+':')){const old=tiles.get(oldKey);if(old.cssUrl){if(!retiredUrls.has(race))retiredUrls.set(race,new Set());retiredUrls.get(race).add(old.cssUrl);}tiles.delete(oldKey);}
    canvas.cssReady=new Promise(resolve=>canvas.toBlob(blob=>{if(tiles.get(key)===canvas){canvas.cssUrl=blob?URL.createObjectURL(blob):'';syncCities();if(blob){for(const url of retiredUrls.get(race)||[])URL.revokeObjectURL(url);retiredUrls.delete(race);}}resolve();},'image/webp',.93));tiles.set(key,canvas);return canvas;
  };
  view.drawGround=()=>{
    const g=R.ctx;g.globalAlpha=1;g.globalCompositeOperation='source-over';g.filter='none';const z=R.ROAD.zoom||1,boundary=R.territoryBoundary(),mid=R.pointAt(boundary).x;view.boundary=boundary;view.segments=[];
    if(!document.body.classList.contains('roadlords-menu-open')&&[R.P.race,R.E.race].some(r=>!assets.get(r)?.ready))R.loadChronicleArt();
    for(const [side,start,end]of [['player',0,Math.min(R.ROAD.w,mid)],['enemy',Math.max(0,mid),R.ROAD.w]]){
      if(end<=start)continue;const race=R.cityForSide(side).race,theme=CHRONICLE_THEMES[race]||CHRONICLE_THEMES.human,t=view.tile(race);view.segments.push({side,race,start,end,boundary});
      g.save();g.beginPath();g.rect(start,0,end-start,R.ROAD.h);g.clip();g.fillStyle=theme.ground;g.fillRect(start,0,end-start,R.ROAD.h);
      if(t){const w=t.width*R.ROAD.h/t.height*z,origin=-R.ROAD.camera*z;for(let x=origin+Math.floor((start-origin)/w)*w;x<end;x+=w)g.drawImage(t,x,0,w,R.ROAD.h);}
      g.restore();
    }
  };
}
