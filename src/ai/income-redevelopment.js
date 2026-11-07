// If the last income footprint is occupied, trade redundant support/production
// for a funded producer. Never tear down the only source of a unit or economy.
export function installIncomeRedevelopment(R) {
  R.aiReclaimIncomePlot=(c,type)=>{
    if(R.aiUnderAttack(c))return false;
    const occupied=R.occupancy(c),byId=new Map(c.buildings.map(b=>[b.id,b]));
    let plan=c._aiRedevelopPlan;
    const fits=plan&&plan.type===type&&R.cityBuildingCells(c,{type,row:plan.cell[0],col:plan.cell[1],rotation:plan.cell[2]}).every(([r,k])=>{
      const b=occupied.get(R.idx(r,k));return !b||plan.ids.includes(typeof b==='object'?b.id:b);
    });
    if(!fits)plan=null;
    if(!plan){
      const flow=R.resourceFlowRates(c),produces=R.aiBuildingMechanics(type).produces;
      if(!produces.some(r=>flow.gain[r]<flow.use[r]*1.1))return false;
      const candidates=[],counts=new Map();for(const b of c.buildings)counts.set(b.type,(counts.get(b.type)||0)+1);
      const removable=b=>{
        const m=R.aiBuildingMechanics(b.type);
        if(b.type==='keep'||m.produces||m.capacity||m.reserve||m.storage||R.isUniqueBuilding(c,b.type))return false;
        return (counts.get(b.type)||0)>1||R.aiRequiresLocalTargets(c,b)&&!R.activeSpawners(c).some(p=>R.aiSupportAffects(c,b,p));
      };
      for(const rotation of R.rotationOptions(type))for(let row=0;row<R.GRID;row++)for(let col=0;col<R.GRID;col++){
        const cells=R.cityBuildingCells(c,{type,row,col,rotation}),ids=new Set();let legal=true;
        for(const [r,k]of cells){
          if(r<0||k<0||r>=R.GRID||k>=R.GRID||R.terrainBlocks(c,r,k)){legal=false;break;}
          const value=occupied.get(R.idx(r,k)),b=typeof value==='object'?value:byId.get(value);
          if(b){if(!removable(b)){legal=false;break;}ids.add(b.id);}
        }
        if(!legal||!ids.size||ids.size>4)continue;
        const removed=[...ids].map(id=>byId.get(id));
        if(removed.some(b=>R.BUILDINGS[b.type].unit&&removed.filter(x=>x.type===b.type).length>=counts.get(b.type)))continue;
        const cost=removed.reduce((n,b)=>n+(R.BUILDINGS[b.type].unit?30+5*b.level:5+b.level),0);
        candidates.push({cell:[row,col,rotation],ids:[...ids],cost});
      }
      candidates.sort((a,b)=>a.cost-b.cost);
      const before=R.aiPreview(c,()=>{}),resources=R.aiResourceKeys(c);
      for(const candidate of candidates.slice(0,6)){
        const after=R.aiPreview(c,shadow=>{
          shadow.buildings=shadow.buildings.filter(b=>!candidate.ids.includes(b.id));
          const [row,col,rotation]=candidate.cell,price=R.placementPrice(shadow,type,row,col,rotation);
          for(const r of R.RES)shadow.resources[r]=Math.max(0,shadow.resources[r]-(price[r]||0));
          shadow.buildings.push({id:'income-replacement',type,row,col,rotation,level:R.levelOf(shadow,type),progress:0});
        });
        if(after.power<before.power*.75)continue;
        if(resources.some(r=>after.gain[r]-after.use[r]<Math.min(0,before.gain[r]-before.use[r])-.01))continue;
        if(!produces.some(r=>after.gain[r]-after.use[r]>before.gain[r]-before.use[r]+.5))continue;
        plan={type,cell:candidate.cell,ids:candidate.ids,started:false};break;
      }
      if(!plan)return false;c._aiRedevelopPlan=plan;
    }
    R.aiSaveForBuild(type,R.buildPrice(c,type),'economy',c);
    if(c.undeadState)c.undSaveSouls=c._aiSavePrice.wood||0;
    if(!R.canPay(c,R.buildPrice(c,type)))return true;
    const victim=plan.ids.find(id=>R.getBuilding(c,id));if(!victim)return false;
    if(!R.aiMutate(()=>R.demolish(c,victim)))return false;
    if(!plan.started){plan.started=true;if(c.undeadState)c.undeadState.aiRedeveloped=(c.undeadState.aiRedeveloped||0)+1;}
    if(!plan.ids.some(id=>R.getBuilding(c,id)))c._aiRedevelopAfter=R.state.time+15;
    return true;
  };
}
