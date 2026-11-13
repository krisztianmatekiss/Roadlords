// Presentation only: simulation, damage, targeting and network cadence are untouched.
// Crowded bodies hide the figures behind them; the overview still counts every actor.
export function selectVisibleFigures(R,units){
  if(units.length<120||R.ROAD.zoom>1.5)return units;
  const scale=R.ROAD.h/600*R.ROAD.zoom,cells=new Map(),chosen=new Set(),limit=units.length>=360?1:2;
  for(let i=units.length-1;i>=0;i--){const u=units[i],p=R.pointAt(u.lane,u.offset||0),key=u.side+':'+Math.floor(p.x/(34*scale))+':'+Math.floor(p.y/(26*scale));let cell=cells.get(key);if(!cell){cell=[];cells.set(key,cell);}if(cell.length<limit){cell.push(u);chosen.add(u);}}
  return units.filter(u=>chosen.has(u));
}
export function installBattlePresentationBudget(R){
  let last=-Infinity,signature='',pending=0;
  const metrics={rendered:0,skipped:0,candidates:0,drawn:0};
  R.battlePresentation={metrics,frame(raw){
    if(!R.chronicle?.active()||!raw){pending=0;metrics.rendered++;return{skip:false,elapsed:raw};}
    pending=Math.min(.25,pending+raw);
    if(document.hidden||document.body.classList.contains('roadlords-menu-open')){metrics.skipped++;return{skip:true};}
    const now=performance.now(),clock=R.MP.enabled&&R.MP.role==='guest'?R.state.time:R.ROAD.clock;
    const next=[clock,R.roadWar.scrollLeft,R.roadWar.scrollTop,R.ROAD.zoom,R.ROAD.w,R.ROAD.h,R.state.units.length,R.state.selectedTowerId,R.state.selectedBuild,R.state.selectedBuilding].join(':');
    const frozen=!R.state.running||R.state.modal||R.state.ended;
    const interval=R.state.units.length>300?1000/30:1000/60;
    if(frozen&&signature===next||!frozen&&now-last<interval-1){metrics.skipped++;return{skip:true};}
    signature=next;last=now;const elapsed=pending;pending=0;metrics.rendered++;return{skip:false,elapsed};
  }};
}
