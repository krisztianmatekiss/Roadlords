import { usesPaintedBattleArt } from '../config/figure-trials.js';
import { EFFECT_COLORS as COLORS, STATUS_THEMES } from '../data/effect-palette.js';
import { forecastPoisonDamage } from '../data/poison.js';
import { drawStatusBatch, statusSpriteCount } from './unit-status-effects.js';
export { drawStatusEffects } from './unit-status-effects.js';
const TAU = Math.PI * 2;
const circle = (g,x,y,r,color) => { g.fillStyle=color;g.beginPath();g.arc(x,y,r,0,TAU);g.fill(); };

export function shotKind(R, u) {
  if (u.key === 'mage') return R.hasBranch(R.cityForSide(u.side),'magetower','frost_mages') ? 'frost' : 'fire';
  return ({catapult:'rock',priest:'holy',orc_shaman:'curse',und_necromancer:'soul',und_lich:'soul'})[u.key] || '';
}

const textures = new Map();
function glow(color) {
  if(textures.has(color))return textures.get(color);
  const c=document.createElement('canvas');c.width=c.height=64;
  const g=c.getContext('2d'),fill=g.createRadialGradient(32,32,1,32,32,31);
  fill.addColorStop(0,'#fff7d6');fill.addColorStop(.16,color);fill.addColorStop(.42,color+'bb');fill.addColorStop(1,color+'00');
  g.fillStyle=fill;g.fillRect(0,0,64,64);textures.set(color,c);return c;
}
export function drawMagicShot(g, kind, scale, clock) {
  const color=({fire:COLORS.fire,frost:COLORS.frost,curse:COLORS.curse,soul:COLORS.poison,holy:'#ffe2a0'})[kind];
  if(!color)return false;
  g.scale(scale,scale);
  if(kind==='fire'){
    g.drawImage(glow(color),-21,-16,38,32);
    g.fillStyle='#ff6f37b0';g.beginPath();g.moveTo(5,-4);g.lineTo(-24,-3);g.lineTo(-17,1);g.lineTo(-30,4);g.lineTo(5,5);g.fill();
    circle(g,0,0,5.5,'#ffc364');circle(g,1,-1,2.8,'#fff3cb');
  }else{
    g.drawImage(glow(color),-16,-12,28,24);g.strokeStyle=color;g.lineWidth=2;
    g.beginPath();g.moveTo(-18,Math.sin(clock*25)*2);g.lineTo(2,0);g.stroke();
    if(kind==='frost'){g.beginPath();g.moveTo(-2,-6);g.lineTo(5,0);g.lineTo(-2,6);g.lineTo(-6,0);g.closePath();g.fillStyle='#d9faff';g.fill();}
    else circle(g,1,0,3.5,color);
  }
  return true;
}

export function installBattleEffects(R) {
  const fx={impacts:[],head:0,seen:new Map(),clock:0,queue:[],queueCount:0,collect:false},poisonMultipliers=new Map();
  R.roadEffects=fx;
  R.unitPoisonDamage=u=>R.MP.enabled&&R.MP.role==='guest'?Math.max(0,Math.min((u.hp||0)-1,u.syncedPoisonDamage||0)):forecastPoisonDamage(R,u,fx.collect?poisonMultipliers:null);
  R.roadBeginUnitEffects=()=>{fx.queueCount=0;fx.collect=true;poisonMultipliers.clear();};
  R.roadFlushUnitEffects=()=>{
    fx.collect=false;drawStatusBatch(R.ctx,fx.queue,fx.queueCount);
  };
  Object.defineProperty(fx,'statusSprites',{get:statusSpriteCount});
  R.roadImpactEffect=(u,a)=>{
    const slam=u.key==='orc_troll'&&usesPaintedBattleArt(R,['orc-mystics']);
    const kind=slam?'slam':a.effect||shotKind(R,u);
    if(!kind)return;
    if(a.to<R.ROAD.camera-110||a.to>R.ROAD.camera+R.ROAD.w/R.ROAD.zoom+110)return;
    const quake=a.groundQuake??(slam&&R.hasBranch(R.cityForSide(u.side),'orc_troll','earthshaker')&&u.attackCount%3===0);
    if(slam)a.groundQuake=quake;
    const f={kind,lane:a.to,offset:a.toOffset||0,start:a.hit,radius:slam?(a.radius||u.aoe||55)*(quake?2.5:1):Math.max(14,Math.min(90,a.radius||28)),quake,casterFire:kind==='fire'&&u.key==='mage'&&usesPaintedBattleArt(R,['casters','undead-figures'])};
    if(slam){
      const contact=R.trollGroundPoint(),face=a.to>=a.lane?1:-1;
      f.lane=a.lane+contact[0]*R.ROAD.h/600*face;f.offset=(a.offset||0)+contact[1];
      // Deterministic decoration must not consume the combat random stream.
      f.cracks=Array.from({length:quake?8:6},(_,i)=>{
        const angle=i/(quake?8:6)*TAU+Math.sin(a.hit+u.id)*.4,length=.55+.35*(.5+.5*Math.sin(i*3.7+u.id));
        return Array.from({length:4},(_,j)=>{const t=j/3,bend=j===0?0:Math.sin(i*2.3+j*4.7)*.11;return [Math.cos(angle+bend)*length*t,Math.sin(angle+bend)*length*t*.32];});
      });
    }
    const limit=R.ROAD.lowDetail?64:128;
    if(fx.impacts.length<limit)fx.impacts.push(f);else{fx.head=(fx.head+1)%limit;fx.impacts[fx.head]=f;}
  };
  R.roadDrawGroundEffects=()=>{
    if(!usesPaintedBattleArt(R,['orc-mystics']))return;
    const g=R.ctx,now=R.ROAD.clock,scale=R.ROAD.h/600*R.ROAD.zoom;
    for(const f of fx.impacts){
      const age=now-f.start;if(f.kind!=='slam'||age<0||age>=3)continue;
      const p=R.pointAt(f.lane,f.offset);if(p.x< -180||p.x>R.ROAD.w+180)continue;
      g.save();g.translate(p.x,p.y);g.scale(R.ROAD.zoom,scale);g.globalAlpha=Math.min(1,age/.07)*Math.min(1,(3-age)/.7)*.85;
      for(const [pass,color,width]of [[0,'#d6bc86',2.2],[1,'#514131',1.2]]){
        g.strokeStyle=color;g.lineWidth=width;g.lineJoin='miter';g.beginPath();
        for(const points of f.cracks){
          points.forEach(([x,y],i)=>i?g.lineTo(x*f.radius,y*f.radius+(pass?0:.7)):g.moveTo(x*f.radius,y*f.radius+(pass?0:.7)));
          const a=points[2],b=points[3];g.moveTo(a[0]*f.radius,a[1]*f.radius);g.lineTo((a[0]+(b[0]-a[0])*.7)*f.radius,(a[1]-(b[1]-a[1])*.9)*f.radius);
        }g.stroke();
      }g.restore();
    }
  };
  R.roadDrawEffects=()=>{
    const now=R.ROAD.clock;
    if(now<fx.clock){fx.impacts.length=0;fx.seen.clear();}
    fx.clock=now;
    if(R.MP.enabled&&R.MP.role==='guest'){
      for(const u of R.state.units){const a=u.roadAttack;
        if(!a?.resolved||(!a.ranged&&u.key!=='orc_troll')||now<a.hit||now-a.hit>.6||fx.seen.get(u.id)===a.start)continue;
        fx.seen.set(u.id,a.start);R.roadImpactEffect(u,a);
      }
      if(fx.seen.size>2048){const alive=new Set(R.state.units.map(u=>u.id));for(const id of fx.seen.keys())if(!alive.has(id))fx.seen.delete(id);}
    }
    const g=R.ctx,scale=R.ROAD.h/600*R.ROAD.zoom;
    let n=0;
    for(const f of fx.impacts){
      const age=now-f.start;if(age<0||age>(f.kind==='slam'?3:.6))continue;fx.impacts[n++]=f;
      if(f.kind==='slam'&&age>.6)continue;
      const p=R.pointAt(f.lane,f.offset);if(p.x< -100||p.x>R.ROAD.w+100)continue;
      const t=age/.6,color=({fire:COLORS.fire,frost:COLORS.frost,curse:COLORS.curse,soul:COLORS.poison,holy:'#ffe2a0',rock:'#c5b180',slam:'#bca27c'})[f.kind];
      const radius=f.radius*(.25+Math.sin(Math.min(1,t*2)*Math.PI/2)*.75);
      if(f.kind==='slam'){
        // Ground dust follows the real splash radius; it never deals damage.
        g.save();g.translate(p.x,p.y);g.scale(R.ROAD.zoom,scale);g.globalAlpha=(1-t)*.65;
        g.strokeStyle=f.quake?'#e5c480':color;g.lineWidth=(f.quake?2.7:1.5)*(1-t)+.5;g.beginPath();g.ellipse(0,0,radius,radius*.24,0,0,TAU);g.stroke();
        const pieces=R.ROAD.lowDetail?4:7;g.fillStyle=color;
        for(let i=0;i<pieces;i++){const angle=i/pieces*TAU+f.start,x=Math.cos(angle)*radius*t,y=Math.sin(angle)*radius*.2*t-Math.sin(t*Math.PI)*(f.quake?13:7),size=(f.quake?2:1.3)*(1-t)+.5;g.fillRect(x-size,y-size,size*2,size*1.4);}
        g.restore();continue;
      }
      g.save();g.translate(p.x,p.y-13*scale);g.scale(R.ROAD.zoom,scale);g.globalAlpha=(1-t)*.85;
      g.drawImage(glow(color),-radius,-radius,radius*2,radius*2);
      if(f.casterFire){
        // A short flame blossom follows the real AoE footprint at impact.
        const petals=R.ROAD.lowDetail?4:7;
        for(let i=0;i<petals;i++){
          const angle=i/petals*TAU+f.start,x=Math.cos(angle)*radius*.55,y=Math.sin(angle)*radius*.3;
          const h=radius*(.5+.25*Math.sin(i*1.7))*(1-t),w=radius*.15;
          g.fillStyle=i%2?'#ffad42':'#ff7334';g.beginPath();g.moveTo(x-w,y);g.quadraticCurveTo(x-w*1.4,y-h*.55,x+w*.25,y-h);g.quadraticCurveTo(x+w*.1,y-h*.35,x+w,y);g.closePath();g.fill();
        }
      }
      g.strokeStyle=color;g.lineWidth=2.5*(1-t)+.7;g.beginPath();g.ellipse(0,7,radius,radius*.58,0,0,TAU);g.stroke();
      const sparks=R.ROAD.lowDetail?5:10;
      for(let i=0;i<sparks;i++){const a=i/sparks*TAU+f.start;circle(g,Math.cos(a)*radius*t*1.5,Math.sin(a)*radius*t*1.1-t*10,1.5*(1-t)+.5,color);}
      g.restore();
    }
    fx.impacts.length=n;
    R.drawCasterHealing?.();
  };
  for(const [id,theme] of Object.entries(STATUS_THEMES))if(window.__ROADLORDS_STATUSES__.defs[id])window.__ROADLORDS_STATUSES__.defs[id][2]=COLORS[theme];
}
