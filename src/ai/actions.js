import { installIncomeRedevelopment } from './income-redevelopment.js';
// Paid construction, excavation, redevelopment and wave release for either city.
// The same controller is used for the solo opponent and both spectator AIs.
export function installAiActions(R) {
  R.aiControlsCity = c => !R.MP.enabled && !R.ROAD.test && (c === R.E || R.spectator?.active && c === R.P);
  R.aiSaveForBuild = (type,price,reason,c=R.E) => {
    if(c._aiSaveType!==type){c._aiSaveSince=R.state.time;c._aiSaveType=type;}
    c._aiSavePrice={...price};c._aiSaveReason=reason;
    c._aiSaveCapacityPrice={...price};
  };
  R.aiClearBuildSavings = (c=R.E) => {c._aiSaveType=null;c._aiSavePrice=null;c._aiSaveCapacityPrice=null;c._aiRedevelopPlan=null;c._aiSaveReason=null;c._aiSaveSince=0;};
  installIncomeRedevelopment(R);
  R.aiBuild = (type,c=R.E) => {
    if(!type||!R.BUILDINGS[type]||!c.unlocked.has(type)||!R.factionMatches(c.race,R.BUILDINGS[type],type))return false;
    if(R.isUniqueBuilding(c,type)&&R.hasBuilding(c,type))return false;
    const cell=R.findCell(c,type);
    if(!cell)return R.aiMutate(()=>R.aiClearBlockingRuin(type,c));
    if(!R.canPay(c,R.placementPrice(c,type,...cell)))return false;
    return R.aiMutate(()=>!!R.placeBuilding(c,type,...cell)?.ok);
  };
  R.aiBlockingPlan = (c,type,{affordableOnly=true}={}) => {
    if(!R.BUILDINGS[type]||!c.unlocked.has(type)||R.isUniqueBuilding(c,type)&&R.hasBuilding(c,type))return null;
    const occupied=R.occupancy(c);let best=null;
    for(const rotation of R.rotationOptions(type)){
      const offsets=R.cityBuildingCells(c,{type,row:0,col:0,rotation});
      for(let row=0;row<R.GRID;row++)for(let col=0;col<R.GRID;col++){
        const ruins=[];let valid=true;
        for(const [dr,dc]of offsets){const r=row+dr,k=col+dc,t=R.terrainAt(c,r,k);
          if(r<0||k<0||r>=R.GRID||k>=R.GRID||occupied.has(R.idx(r,k))){valid=false;break;}
          if(t?.type==='ruin'||t?.type==='ancient')ruins.push([r,k]);
          else if(R.terrainBlocks(c,r,k)){valid=false;break;}
        }
        if(!valid||!ruins.length||affordableOnly&&!ruins.some(([r,k])=>R.canPay(c,R.terrainClearPrice(c,R.terrainAt(c,r,k).type))))continue;
        if(type==='guardhouse'&&!R.v491GuardhousePlacementValid(c,row,col,rotation))continue;
        const hub={type,row,col,rotation,level:R.levelOf(c,type)},m=R.aiBuildingMechanics(type);
        if(R.aiRequiresLocalTargets(c,hub)){
          const targets=(m.localSupport?c.buildings:R.activeSpawners(c)).filter(p=>R.aiSupportAffects(c,hub,p));
          if(!R.aiMarginalSupportTargets(c,hub,targets).length)continue;
        }
        const cost=R.C();for(const [r,k]of ruins){const price=R.terrainClearPrice(c,R.terrainAt(c,r,k).type);for(const resource of R.RES)cost[resource]+=price[resource]||0;}
        const score=R.RES.reduce((n,r)=>n+cost[r],0)+ruins.length;
        if(!best||score<best.score)best={cell:[row,col,rotation],ruins,cost,score};
      }
    }
    return best;
  };
  R.v4918BlockingRuinPlan = (type,options) => R.aiBlockingPlan(R.E,type,options);
  R.aiClearBlockingRuin = (type,c=R.E) => {
    const plan=R.aiBlockingPlan(c,type);
    if(!plan)return false;
    const cell=plan.ruins.find(([r,k])=>R.canPay(c,R.terrainClearPrice(c,R.terrainAt(c,r,k).type)));
    return !!cell&&R.aiMutate(()=>R.clearTerrain(c,...cell,true));
  };
  R.aiMakeRoomFor = (type,c=R.E) => {
    if(!type||!c.unlocked.has(type)||R.findCell(c,type))return false;
    const blocked=R.aiBlockingPlan(c,type,{affordableOnly:false});
    if(blocked)return R.aiClearBlockingRuin(type,c);
    const produced=R.aiBuildingMechanics(type).produces;
    // Income repairs reclaim redundant non-economy. Other replacements may
    // reuse surplus economy only after the full funded footprint is verified.
    if(produced)return R.state.time<(c._aiRedevelopAfter||0)?false:R.aiReclaimIncomePlot(c,type);
    if(!R.canPay(c,R.buildPrice(c,type))||R.state.time<(c._aiRedevelopAfter||0))return false;
    const keys=R.aiResourceKeys(c),candidates=c.buildings.filter(b=>!b.inactive&&R.aiBuildingMechanics(b.type).produces&&
      R.buildingOf(c,b.type).filter(x=>!x.inactive).length>2);
    const before=R.aiPreview(c,()=>{});
    // A full city must not trigger hundreds of cloned-city searches per turn.
    for(const b of candidates.slice(0,6)){
      const fits=R.aiPreview(c,shadow=>{shadow.buildings=shadow.buildings.filter(x=>x.id!==b.id);},shadow=>{
        const cell=R.findCell(shadow,type);if(!cell)return false;
        const price=R.placementPrice(shadow,type,...cell);
        if(!R.canPay(shadow,price))return false;
        for(const r of R.RES)shadow.resources[r]-=price[r]||0;
        shadow.buildings.push({id:'redevelop-preview',type,row:cell[0],col:cell[1],rotation:cell[2],level:R.levelOf(shadow,type),progress:0});
        R.recomputeCity(shadow,true);const flow=R.resourceFlowRates(shadow);
        return keys.every(r=>flow.gain[r]>=flow.use[r]*1.25+2)&&R.aiMetricDelta(before,R.aiCityMetrics(shadow),shadow)>=4;
      });
      if(fits&&R.aiMutate(()=>R.demolish(c,b.id))){
        c._aiRedevelopAfter=R.state.time+15;
        if(c.undeadState){c.undeadState.aiRedeveloped=(c.undeadState.aiRedeveloped||0)+1;c.undeadState.aiRedevelopAfter=c._aiRedevelopAfter;}
        return true;
      }
    }
    return false;
  };
  R.aiExcavateAncient = (goal=null,c=R.E) => {
    c._aiAncientPrice=null;
    if(R.MP.enabled||R.state.pregame||R.state.ended||R.aiUnderAttack(c))return false;
    const price=R.terrainClearPrice(c,'ancient'),ruins=R.terrainCellsOfType(c,'ancient');
    if(!ruins.length)return false;
    if(R.activeSpawners(c).length<2&&R.occupancy(c).size<R.GRID*R.GRID*.65)return false;
    const flow=R.resourceFlowRates(c);
    const planned=goal?R.buildPrice(c,goal):R.C();
    const growth=c._aiGrowthPlan&&R.state.time-c._aiGrowthPlan.time<5?c._aiGrowthPlan:null;
    const reserve=Object.fromEntries(R.RES.map(r=>[r,Math.max(20,Math.max(0,flow.use[r]-flow.gain[r])*30,
      planned[r]||0,growth?.growing?growth.reserve[r]||0:0)]));
    if(R.RES.some(r=>price[r]>c.caps[r]&&c.resources[r]<price[r])){
      const useful=R.occupancy(c).size>=R.GRID*R.GRID*.65&&!growth?.growing;
      const fundable=R.aiResourceKeys(c).every(r=>price[r]<=0||(flow.gain[r]>flow.use[r]&&
        (price[r]+reserve[r]-c.resources[r])/Math.max(.01,flow.gain[r]-flow.use[r])<=90));
      if(useful&&fundable)c._aiAncientPrice={...price};
      return false;
    }
    if(!R.canPay(c,price)||R.RES.some(r=>price[r]>0&&c.resources[r]-price[r]<reserve[r]))return false;
    return R.aiMutate(()=>R.clearTerrain(c,...ruins[0],true));
  };
  R.aiGate = (c=R.E) => {
    if(!R.aiControlsCity(c)||R.state.pregame||R.state.ended)return;
    R.aiProtectPortal?.(c);
    if(R.hasBranch(c,'keep','orc_conquest')){c.gateMode='open';c.autoReleasing=false;return;}
    if(c.gateMode==='open'&&!c.releaseQueue.length){c.gateMode='closed';c.autoReleasing=false;}
    const weight=e=>R.orcArmyWeight(e,c),main=c.garrison.reduce((n,e)=>n+weight(e),0),rally=c.rallyReserve.reduce((n,e)=>n+weight(e),0);
    const total=main+rally,sp=R.activeSpawners(c).length,cap=Math.max(1,c.garrisonCap+(R.hasBuilding(c,'rally')?c.rallyCap:0));
    const room=R.fieldQueueRoom(c),opening=!c._aiLastWave&&R.state.time>=120;
    const target=Math.min(cap,opening?Math.max(8,8+sp*2):Math.max(26,22+sp*3+Math.min(20,Math.floor(R.state.time/90)*2)));
    const entries=[...c.garrison,...c.rallyReserve],hp=entries.reduce((n,e)=>n+R.statsFor(c,e).hp,0);
    const mainTypes=R.activeSpawners(c).filter(b=>R.productionDestination(c,b)!=='rally');
    const smallest=mainTypes.length?Math.min(...mainTypes.map(b=>weight({key:R.effectiveUnitKey(c,b)}))):1;
    const full=main>0&&c.garrisonCap-main<smallest||rally>0&&c.rallyCap-rally<1&&!mainTypes.length;
    const reinforce=R.fieldUnitCount(c)>=8&&total>=Math.max(6,Math.min(16,sp*2))&&R.state.time-(c._aiLastWave?.time||0)>=25;
    const launch=(total>=target||full||entries.length>=12&&hp>=target*170||reinforce)&&room>=Math.min(20,Math.min(total,target)*.65);
    const defend=R.aiUnderAttack(c)&&total>0&&room>=Math.min(smallest,total);
    c._aiWaveTarget=target;
    if(c.gateMode!=='open'&&(launch||defend)){
      if(c.rallyReserve.length)R.releaseRally(c);R.openWave(c);c.gateMode='open';c.autoReleasing=false;
      c._aiLastWave={time:R.state.time,weight:total,count:entries.length,hp,emergency:defend&&!launch};
    }
    if(R.hasBuilding(c,'rally'))c.rallyMode='closed';
    // Markets select their resource targets from each city's own shortages.
    if(c===R.E)R.updateEnemyMarket();
  };
  R.enemyGateAI = () => {R.aiGate(R.E);if(R.spectator?.active)R.aiGate(R.P);};
}
