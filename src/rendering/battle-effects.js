import { EFFECT_COLORS as COLORS, STATUS_THEMES } from '../data/effect-palette.js';
import { unitIsElite } from '../data/unit-ranks.js';
const TAU = Math.PI * 2;
const circle = (g,x,y,r,color) => { g.fillStyle=color;g.beginPath();g.arc(x,y,r,0,TAU);g.fill(); };

export function shotKind(R, u) {
  if (u.key === 'mage') return R.hasBranch(R.cityForSide(u.side),'magetower','frost_mages') ? 'frost' : 'fire';
  return ({catapult:'rock',priest:'holy',orc_shaman:'curse',und_necromancer:'soul',und_lich:'soul'})[u.key] || '';
}

const statusSprites = new Map();
let statusAtlas, statusContext;
const STATUS_BITS = { burn:1, poison:2, freeze:4, slow:4, bleed:8, regen:16,
  weakness:32, atrophy:32, exhaustion:32, vulnerability:32, blindness:32, stun:32,
  power:64, haste:64, stride:64, vitality:64, resistance:64, blessing:64, shield:256 };
export function drawStatusEffects(R, g, u, detail, radius, x, y, scale) {
  let mask = unitIsElite(u) ? 128 : 0;
  if (R.MP.enabled && R.MP.role === 'guest') {
    for (const item of u.syncedStatusBadges || []) mask |= STATUS_BITS[item[0]] || 0;
  } else {
    if(u.burnTime>0)mask|=1;
    if((u.shield||0)+(u.tempShield||0)>0)mask|=256;
    if(u.orcPoison>0)mask|=2;
    if(u.slowTime>0||u.stunTime>0&&u.freezeFollow>0)mask|=4;
    if(u.orcBleed>0)mask|=8;
    if((u.orcPositive?.regen||0)+(u.alchemyRegen||0)+(u.orcRegenBlessingTime>0?1:0)>0)mask|=16;
    if(u.stunTime>0&&!u.freezeFollow)mask|=32;
    for(const key in u.orcCurses)if(u.orcCurses[key]>0)mask|=32;
    if(u.blessingTime>0||u.attackSpeedBuffTime>0||u.speedBuffTime>0||u.rallySpeedReady||u.firstHitsRemaining>0||u.permanentTavern||u.alchemyEffects?.length>0)mask|=64;
    for(const key in u.orcPositive)if(key!=='regen'&&u.orcPositive[key]>0)mask|=64;
  }
  if(!mask)return;
  const frame=Math.floor(R.ROAD.clock*8+(u.id||0)*.73)%8,r=Math.round(radius/4)*4;
  if(R.roadEffects?.collect){
    const fx=R.roadEffects,i=fx.queueCount++;
    const item=fx.queue[i]||(fx.queue[i]={});
    item.mask=mask;item.frame=frame;item.r=r;item.detail=detail;item.x=x;item.y=y;item.scale=scale;
    return;
  }
  drawStatusSprite(g,mask,frame,detail,r);
}
function drawStatusSprite(g,mask,frame,detail,r){
  const key=`${mask}:${frame}:${r}:${detail?1:0}`;
  if(!statusAtlas){
    statusAtlas=document.createElement('canvas');statusAtlas.width=48*16;statusAtlas.height=82*12;
    statusContext=statusAtlas.getContext('2d',{willReadFrequently:true});
  }
  let cell=statusSprites.get(key);
  if(!cell){
    let slot=statusSprites.size;
    if(slot>=192){const oldest=statusSprites.keys().next().value;slot=statusSprites.get(oldest).slot;statusSprites.delete(oldest);}
    cell={slot,x:slot%16*48,y:Math.floor(slot/16)*82};
    statusContext.clearRect(cell.x,cell.y,48,82);
    statusContext.save();statusContext.translate(cell.x+24,cell.y+70);
    if(detail)drawStatusGeometry(statusContext,mask,frame,detail,r);
    else drawCompactStatuses(statusContext,mask);
    statusContext.restore();statusSprites.set(key,cell);
  }
  if(detail)g.drawImage(statusAtlas,cell.x,cell.y,48,82,-24,-70,48,82);
  else g.drawImage(statusAtlas,cell.x,cell.y+3,48,18,-24,-67,48,18);
}
function drawCompactStatuses(g,mask){
  const flags=[128,1,2,4,8,16,32,64,256].filter(bit=>mask&bit);
  for(let i=0;i<flags.length;i++){
    const bit=flags[i],x=(i-(flags.length-1)/2)*5,y=-61;
    const color=({128:COLORS.buff,1:COLORS.fire,2:COLORS.poison,4:COLORS.frost,8:COLORS.bleed,16:COLORS.heal,32:COLORS.curse,64:COLORS.buff,256:COLORS.shield})[bit];
    g.fillStyle='#11190ff0';g.fillRect(x-2.5,y-4,5,9);g.strokeStyle=color;g.fillStyle=color;g.lineWidth=1.4;
    g.beginPath();
    if(bit===128||bit===64){const d=bit===128?1:-1;g.moveTo(x-2,y-d*2);g.lineTo(x,y+d);g.lineTo(x+2,y-d*2);g.stroke();}
    else if(bit===4||bit===16){g.moveTo(x-2,y);g.lineTo(x+2,y);g.moveTo(x,y-3);g.lineTo(x,y+3);g.stroke();}
    else if(bit===1||bit===8){g.moveTo(x,y-4);g.lineTo(x-2,y+2);g.lineTo(x+2,y+2);g.closePath();g.fill();}
    else if(bit===256){g.rect(x-2,y-3,4,6);g.stroke();}
    else{g.arc(x,y,2,0,TAU);g.fill();}
  }
}
function drawStatusGeometry(g,mask,frame,detail,radius) {
  const burning=mask&1,poison=mask&2,ice=mask&4,bleed=mask&8,regen=mask&16,curse=mask&32,buff=mask&64;
  const clock=frame/8,phase=clock*TAU;
  if(burning){
    for(let i=0;i<(detail?3:1);i++){
      const x=(i-1)*7,y=-5-3*Math.sin(phase+i),h=12+4*Math.sin(phase*1.8+i);
      g.fillStyle=COLORS.fire;g.beginPath();g.moveTo(x-4,y);g.quadraticCurveTo(x-7,y-h*.5,x+1,y-h);g.quadraticCurveTo(x+1,y-6,x+5,y-2);g.closePath();g.fill();
      if(detail){g.fillStyle='#ffe29c';g.beginPath();g.moveTo(x-2,y);g.lineTo(x+1,y-h*.65);g.lineTo(x+3,y-1);g.fill();}
    }
  }
  if(poison){
    g.strokeStyle=COLORS.poison;g.lineWidth=1.8;g.beginPath();g.ellipse(0,1,radius+2,4,0,0,TAU);g.stroke();
    for(let i=0;i<(detail?3:1);i++){const t=(clock+i*.33)%1;circle(g,(i-1)*7+Math.sin(phase+i)*2,-8-t*22,1.4+(1-t),COLORS.poison);}
  }
  if(ice){g.strokeStyle=COLORS.frost;g.lineWidth=1.7;for(const x of [-radius,radius]){g.beginPath();g.moveTo(x-3,0);g.lineTo(x,-13);g.lineTo(x+4,0);g.stroke();}}
  if(curse){g.strokeStyle=COLORS.curse;g.lineWidth=1.5;g.beginPath();g.arc(0,-29,15,phase,phase+Math.PI*1.2);g.stroke();}
  if(buff||regen){
    const color=regen?COLORS.heal:COLORS.buff;g.strokeStyle=color;g.lineWidth=1.7;
    const y=-9-clock*16;
    g.beginPath();g.moveTo(-4,y+3);g.lineTo(0,y-1);g.lineTo(4,y+3);g.stroke();
    if(detail){circle(g,-radius,-13,1.4,color);circle(g,radius,-23,1.4,color);}
  }
  if(bleed){g.fillStyle=COLORS.bleed;g.beginPath();g.moveTo(radius,-20);g.quadraticCurveTo(radius-5,-12,radius,-11);g.quadraticCurveTo(radius+5,-12,radius,-20);g.fill();}
  if(mask&256){g.strokeStyle=COLORS.shield;g.lineWidth=1.3;g.beginPath();g.ellipse(0,-20,radius+2,24,0,0,TAU);g.stroke();}
  if(mask&128){
    const y=-64;g.fillStyle='#151b13';g.strokeStyle='#ffe391';g.lineWidth=1.3;
    g.beginPath();g.moveTo(-6,y-4);g.lineTo(6,y-4);g.lineTo(6,y+3);g.lineTo(0,y+8);g.lineTo(-6,y+3);g.closePath();g.fill();g.stroke();
    g.strokeStyle='#ffd465';g.lineWidth=1.8;g.beginPath();g.moveTo(-3,y);g.lineTo(0,y+3);g.lineTo(3,y);g.stroke();
  }
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
  const fx={impacts:[],head:0,seen:new Map(),clock:0,queue:[],queueCount:0,collect:false};
  R.roadEffects=fx;
  R.roadBeginUnitEffects=()=>{fx.queueCount=0;fx.collect=true;};
  R.roadFlushUnitEffects=()=>{
    fx.collect=false;const g=R.ctx;
    for(let i=0;i<fx.queueCount;i++){
      const item=fx.queue[i];g.save();g.translate(item.x,item.y);g.scale(item.scale,item.scale);
      drawStatusSprite(g,item.mask,item.frame,item.detail,item.r);g.restore();
    }
  };
  Object.defineProperty(fx,'statusSprites',{get:()=>statusSprites.size});
  R.roadImpactEffect=(u,a)=>{
    const kind=a.effect||shotKind(R,u);
    if(!kind)return;
    if(a.to<R.ROAD.camera-110||a.to>R.ROAD.camera+R.ROAD.w/R.ROAD.zoom+110)return;
    const f={kind,lane:a.to,offset:a.toOffset||0,start:a.hit,radius:Math.max(14,Math.min(90,a.radius||28))};
    const limit=R.ROAD.lowDetail?64:128;
    if(fx.impacts.length<limit)fx.impacts.push(f);else{fx.head=(fx.head+1)%limit;fx.impacts[fx.head]=f;}
  };
  R.roadDrawEffects=()=>{
    const now=R.ROAD.clock;
    if(now<fx.clock){fx.impacts.length=0;fx.seen.clear();}
    fx.clock=now;
    if(R.MP.enabled&&R.MP.role==='guest'){
      for(const u of R.state.units){const a=u.roadAttack;
        if(!a?.resolved||!a.ranged||now<a.hit||now-a.hit>.6||fx.seen.get(u.id)===a.start)continue;
        fx.seen.set(u.id,a.start);R.roadImpactEffect(u,a);
      }
      if(fx.seen.size>2048){const alive=new Set(R.state.units.map(u=>u.id));for(const id of fx.seen.keys())if(!alive.has(id))fx.seen.delete(id);}
    }
    const g=R.ctx,scale=R.ROAD.h/600*R.ROAD.zoom;
    let n=0;
    for(const f of fx.impacts){
      const age=now-f.start;if(age<0||age>.6)continue;fx.impacts[n++]=f;
      const p=R.pointAt(f.lane,f.offset);if(p.x< -100||p.x>R.ROAD.w+100)continue;
      const t=age/.6,color=({fire:COLORS.fire,frost:COLORS.frost,curse:COLORS.curse,soul:COLORS.poison,holy:'#ffe2a0',rock:'#c5b180'})[f.kind];
      const radius=f.radius*(.25+Math.sin(Math.min(1,t*2)*Math.PI/2)*.75);
      g.save();g.translate(p.x,p.y-13*scale);g.scale(R.ROAD.zoom,scale);g.globalAlpha=(1-t)*.85;
      g.drawImage(glow(color),-radius,-radius,radius*2,radius*2);
      g.strokeStyle=color;g.lineWidth=2.5*(1-t)+.7;g.beginPath();g.ellipse(0,7,radius,radius*.58,0,0,TAU);g.stroke();
      const sparks=R.ROAD.lowDetail?5:10;
      for(let i=0;i<sparks;i++){const a=i/sparks*TAU+f.start;circle(g,Math.cos(a)*radius*t*1.5,Math.sin(a)*radius*t*1.1-t*10,1.5*(1-t)+.5,color);}
      g.restore();
    }
    fx.impacts.length=n;
  };
  for(const [id,theme] of Object.entries(STATUS_THEMES))if(window.__ROADLORDS_STATUSES__.defs[id])window.__ROADLORDS_STATUSES__.defs[id][2]=COLORS[theme];
}
