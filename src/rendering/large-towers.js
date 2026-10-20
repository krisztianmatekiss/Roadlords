// Scale the original towers and their existing HP labels around their world
// anchor, using the same camera and vertical scale as the combatants.
export function installLargeTowers(R){
  const draw=R.drawTower;
  R.drawTower=function drawLargeTower(t){
    if(!t.alive)return;
    const p=R.pointAt(t.lane,t.lateral||0),scale=2.4*(R.ROAD.h/600)*(R.ROAD.zoom||1);
    R.ctx.save();R.ctx.translate(p.x,p.y);R.ctx.scale(scale,scale);R.ctx.translate(-p.x,-p.y);
    draw(t);R.ctx.restore();
  };
  R.towerAtCanvasPointV496=function towerAtCanvasPoint(x,y){
    let best=null,bestDistance=Infinity;
    const scale=2.4*(R.ROAD.h/600)*(R.ROAD.zoom||1);
    for(const t of R.towers){
      if(!t.alive)continue;
      const p=R.pointAt(t.lane,t.lateral||0),distance=Math.hypot(x-p.x,y-p.y);
      if(distance<=(t.gateTower?37:31)*scale&&distance<bestDistance){best=t;bestDistance=distance;}
    }
    return best;
  };
}
