export function installConvergenceEffects(R){
  const drawUnit=R.roadDrawUnit;
  R.roadDrawUnit=(u,dead=false)=>{
    drawUnit(u,dead);if(dead||!u.alive)return;
    const protectedNow=R.undNightProtected(u);
    if(!protectedNow)return;
    const p=R.pointAt(u.lane,u.offset||0),s=R.ROAD.h/600*R.ROAD.zoom,g=R.ctx;
    if(p.x < -80 || p.x > R.ROAD.w+80)return;
    g.save();
    if(protectedNow){
      g.fillStyle='#210c2855';g.strokeStyle='#d96a91aa';g.lineWidth=1.4;
      g.beginPath();g.ellipse(p.x,p.y-18*s,17*s,29*s,0,0,Math.PI*2);g.fill();g.stroke();
      g.fillStyle='#40182a';g.beginPath();g.moveTo(p.x-8*s,p.y-15*s);g.lineTo(p.x-25*s,p.y-28*s);g.lineTo(p.x-20*s,p.y-8*s);g.closePath();g.fill();
    }
    g.restore();
  };
  const effects=R.roadDrawEffects;
  R.roadDrawEffects=()=>{
    effects?.();const g=R.ctx;g.save();
    for(const c of [R.P,R.E])for(const f of c.undeadState?.convergenceFx||[]){
      if(f.start>R.state.time||f.end<=R.state.time)continue;
      const player=R.sideForCity(c)==='player',lane=player?f.distance:R.PATH_LENGTH-f.distance,offset=player?f.offset:-f.offset;
      const p=R.pointAt(lane,offset);if(p.x<-120||p.x>R.ROAD.w+120)continue;
      const age=(R.state.time-f.start)/(f.end-f.start),radius=(f.kind==='rift'?42:25)*R.ROAD.zoom;
      g.globalAlpha=(1-age)*.8;g.strokeStyle=({infection:'#ed7091',shadow:'#c3b8ff',plague:'#91e559',rift:'#80efba',portal:'#65e8d1'})[f.kind];g.fillStyle=g.strokeStyle;g.lineWidth=2;
      g.beginPath();g.ellipse(p.x,p.y-4,radius*(.4+.6*age),radius*R.ROAD.h/600*(.4+.6*age),0,0,Math.PI*2);g.stroke();
      for(let i=0;i<5;i++){const a=i*Math.PI*2/5+age*2;g.beginPath();g.arc(p.x+Math.cos(a)*radius*.6,p.y-4+Math.sin(a)*radius*.25-age*25,2,0,Math.PI*2);g.fill();}
    }
    g.restore();
  };
}
