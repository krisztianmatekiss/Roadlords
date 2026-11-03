import { UNDEAD_TERRITORY as B } from '../data/undead-territory-legends.js';

export function installUndeadTerritoryEffects(R) {
  const soil=document.createElement('canvas');soil.width=soil.height=256;
  const paint=soil.getContext('2d');let seed=417;
  const random=()=>((seed=Math.imul(seed,1664525)+1013904223>>>0)/4294967296);
  const tint=paint.createRadialGradient(128,128,24,128,128,128);
  tint.addColorStop(0,'#14251eed');tint.addColorStop(.78,'#263f31d0');tint.addColorStop(1,'#304b3400');
  paint.fillStyle=tint;paint.fillRect(0,0,256,256);
  for(let i=0;i<90;i++){
    const a=random()*Math.PI*2,r=Math.sqrt(random())*112,x=128+Math.cos(a)*r,y=128+Math.sin(a)*r;
    paint.fillStyle=i%3?'#53654a55':'#071a1666';paint.fillRect(x,y,1+random()*4,1+random()*3);
  }
  paint.lineWidth=1.5;
  for(let i=0;i<12;i++){
    const a=i*Math.PI/6,r=34+random()*25,x=128+Math.cos(a)*r,y=128+Math.sin(a)*r;
    paint.strokeStyle=i%3?'#10221d':'#5e8c5866';paint.beginPath();paint.moveTo(x,y);
    paint.lineTo(x+Math.cos(a+.4)*26,y+Math.sin(a+.4)*26);paint.lineTo(x+Math.cos(a)*48,y+Math.sin(a)*48);paint.stroke();
  }
  const unit=R.roadDrawUnit;
  R.roadDrawUnit=(u,dead=false)=>{
    unit(u,dead);
    const age=R.state.time-(u.undRangedGrowthAt??-100);
    if(dead || !u.alive || age<0 || age>=.35)return;
    const p=R.pointAt(u.lane,u.offset||0),s=R.ROAD.h/600*R.ROAD.zoom,g=R.ctx;
    g.save();g.strokeStyle=`rgba(126,245,174,${1-age/.35})`;g.lineWidth=2;
    g.beginPath();g.ellipse(p.x,p.y-17*s,(14+age*10)*s,(23+age*10)*s,0,0,Math.PI*2);g.stroke();g.restore();
  };
  const ground=R.roadDrawGroundEffects;
  R.roadDrawGroundEffects=()=>{
    ground?.();
    const g=R.ctx;
    g.save();
    for (const zone of R.undActiveIslands()) {
      const p=R.pointAt(zone.lane,zone.offset),rx=zone.radius*R.ROAD.zoom,ry=rx*R.ROAD.h/600;
      if (p.x+rx<0 || p.x-rx>R.ROAD.w) continue;
      const fade=Math.min(1,(zone.expires-R.state.time)*2);
      g.globalAlpha=fade;g.drawImage(soil,p.x-rx,p.y-ry,rx*2,ry*2);
      g.globalAlpha=.65*fade;g.beginPath();g.ellipse(p.x,p.y,rx,ry,0,0,Math.PI*2);
      g.strokeStyle=window.__ROADLORDS_UNIT_COLORS__?.colorFor(zone.side)||(zone.side==='player'?'#397fc1':'#c74949');
      g.lineWidth=2;g.setLineDash([6,5]);g.stroke();g.setLineDash([]);
      g.strokeStyle='#6ec69a';g.lineWidth=1.3;
      for (let i=0;i<7;i++) {
        const a=i*Math.PI*2/7,x=p.x+Math.cos(a)*rx*.63,y=p.y+Math.sin(a)*ry*.63;
        g.beginPath();g.moveTo(x,y);g.lineTo(x+Math.cos(a+.6)*rx*.2,y+Math.sin(a+.6)*ry*.2);g.stroke();
      }
    }
    g.restore();
  };
  R.drawUndeadTowerDecay=t=>{
    if (!R.undTowerDecaySource(t)) return;
    const g=R.ctx,p=R.pointAt(t.lane,t.lateral||0),s=R.towerVisualScale(t);
    g.save();g.translate(p.x,p.y);g.scale(s,s);
    g.fillStyle='#2c70465c';g.fillRect(-15,-18,30,36);
    g.strokeStyle='#071811';g.lineWidth=2.5;g.beginPath();g.moveTo(-11,18);g.lineTo(-6,8);g.lineTo(-9,0);g.lineTo(-2,-8);g.stroke();
    g.strokeStyle=`rgba(103,245,149,${.5+.25*Math.sin(R.state.time*5)})`;g.lineWidth=1.3;
    g.beginPath();g.moveTo(-11,18);g.lineTo(-6,8);g.lineTo(-9,0);g.lineTo(-2,-8);
    g.moveTo(12,18);g.lineTo(6,9);g.lineTo(9,2);g.stroke();g.restore();
  };
  const effects=R.roadDrawEffects;
  R.roadDrawEffects=()=>{
    effects?.();
    const g=R.ctx;
    g.save();
    for (const burst of R.undVisiblePoisonBursts()) {
      const age=(R.state.time-burst.born)/B.poisonBurstDuration;
      if (age<0 || age>=1) continue;
      const p=R.pointAt(burst.lane,burst.offset),rx=30*R.ROAD.zoom*(.25+.75*age),ry=rx*R.ROAD.h/600;
      if (p.x+rx<0 || p.x-rx>R.ROAD.w) continue;
      g.globalAlpha=(1-age)*.75;g.fillStyle='#75c756';g.strokeStyle='#b4f27c';g.lineWidth=2;
      g.beginPath();g.ellipse(p.x,p.y-4,rx,ry,0,0,Math.PI*2);g.fill();g.stroke();
      for(let i=0;i<5;i++){
        const a=i*Math.PI*2/5;
        g.beginPath();g.arc(p.x+Math.cos(a)*rx*.7,p.y-4+Math.sin(a)*ry*.7-age*12*R.ROAD.zoom,3*R.ROAD.zoom,0,Math.PI*2);g.fill();
      }
    }
    g.restore();
  };
}
