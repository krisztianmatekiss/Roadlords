import { producerBaseOutput } from '../economy/producer-output.js';

// A building goal may include paid preparation of its complete footprint.
// Keep useful resource terrain unless the replacement can sustain its loss.
export function installAiLandPlanning(R) {
  const planFor = (c,type,{affordableOnly=true}={}) => {
    if(!R.BUILDINGS[type]||!R.canBuildArmyCapacity(c,type)||!c.unlocked.has(type)||R.isUniqueBuilding(c,type)&&R.hasBuilding(c,type))return null;
    const occupied=R.occupancy(c),candidates=[],flow=R.resourceFlowRates(c),baseGain=R.productionRates(c);
    for(const rotation of R.rotationOptions(type)){
      const offsets=R.cityBuildingCells(c,{type,row:0,col:0,rotation});
      for(let row=0;row<R.GRID;row++)for(let col=0;col<R.GRID;col++){
        const ruins=[];let valid=true;
        for(const [dr,dc]of offsets){
          const r=row+dr,k=col+dc;
          if(r<0||k<0||r>=R.GRID||k>=R.GRID||occupied.has(R.idx(r,k))){valid=false;break;}
          if(!R.terrainBlocks(c,r,k))continue;
          if(['ruin','ancient','forest','quarry'].includes(R.terrainAt(c,r,k)?.type))ruins.push([r,k]);else{valid=false;break;}
        }
        if(!valid||!ruins.length||affordableOnly&&!ruins.some(([r,k])=>R.canPay(c,R.terrainClearPrice(c,R.terrainAt(c,r,k).type))))continue;
        if(type==='guardhouse'&&!R.v491GuardhousePlacementValid(c,row,col,rotation))continue;
        const hub={type,row,col,rotation,level:R.levelOf(c,type)},m=R.aiBuildingMechanics(type);
        if(R.aiRequiresLocalTargets(c,hub)){
          const targets=(m.localSupport?c.buildings:R.activeSpawners(c)).filter(p=>R.aiSupportAffects(c,hub,p));
          if(!R.aiMarginalSupportTargets(c,hub,targets).length)continue;
        }
        const cost=R.C();for(const [r,k]of ruins){const price=R.terrainClearPrice(c,R.terrainAt(c,r,k).type);for(const resource of R.RES)cost[resource]+=price[resource]||0;}
        // Cheap terrain-only estimate first; full city projections are bounded
        // to the shortlist instead of cloning a city for every possible tile.
        const natural=ruins.some(([r,k])=>['forest','quarry'].includes(R.terrainAt(c,r,k).type));
        let loss=0;
        if(natural){
          const shadow={...c,terrain:c.terrain.slice()};for(const [r,k]of ruins)R.setTerrain(shadow,r,k,null);
          for(const b of c.buildings.filter(b=>!b.inactive)){
            const before=producerBaseOutput(R,c,b),after=producerBaseOutput(R,shadow,b);
            loss+=R.RES.reduce((n,r)=>n+Math.max(0,before[r]-after[r]),0);
          }
        }
        const score=R.RES.reduce((n,r)=>n+cost[r],0)+ruins.length+loss*90;
        candidates.push({cell:[row,col,rotation],ruins,cost,score,natural});
      }
    }
    candidates.sort((a,b)=>a.score-b.score);
    // Always retain the cheapest ruin-only alternative as well.
    const shortlist=[...new Set([...candidates.slice(0,8),candidates.find(p=>!p.natural)])].filter(Boolean),safe=[];
    for(const plan of shortlist){
      if(plan.natural){
        const gain=R.aiPreview(c,shadow=>{for(const [r,k]of plan.ruins)R.setTerrain(shadow,r,k,null);},shadow=>R.productionRates(shadow));
        const loss=R.aiResourceKeys(c).reduce((n,r)=>n+Math.max(0,baseGain[r]-gain[r]),0);
        if(loss>0){
          const replacement=R.aiPreview(c,shadow=>{
            for(const [r,k]of plan.ruins)R.setTerrain(shadow,r,k,null);
            shadow.buildings.push({type,row:plan.cell[0],col:plan.cell[1],rotation:plan.cell[2],level:R.levelOf(c,type),id:'cleared-land-preview',progress:0});
          },shadow=>R.productionRates(shadow));
          if(R.aiResourceKeys(c).some(r=>replacement[r]+.01<Math.min(baseGain[r],flow.use[r]*1.1)))continue;
        }
        plan.score=R.RES.reduce((n,r)=>n+plan.cost[r],0)+plan.ruins.length+loss*90;
      }
      safe.push(plan);
    }
    safe.sort((a,b)=>a.score-b.score);return safe[0]||null;
  };
  R.aiBlockingPlan=(c,type,options={})=>{
    if(!R.aiDecisionCache)return planFor(c,type,options);
    const board=JSON.stringify([c.race,c.terrain,c.buildings.map(b=>[b.id,b.type,b.row,b.col,b.rotation,b.level,b.inactive]),c.levels,c.normal,[...c.legends],c.l4Branches,c.resources,c.caps]);
    return R.aiMemo(`land:${R.sideForCity(c)}:${type}:${options.affordableOnly!==false}:${board}`,()=>planFor(c,type,options));
  };
}
