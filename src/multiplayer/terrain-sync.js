// A successful terrain edit must be pending before an in-flight host snapshot
// can replace the local city. The periodic strategy sender is too late here.
export function installTerrainSync(R){
  const clear=R.clearTerrain;
  R.clearTerrain=(c,row,col,byAI=false)=>{
    const sequence=R.MP.strategySeq;
    const result=clear(c,row,col,byAI);
    if(result&&!byAI&&c===R.P&&R.MP.enabled&&!R.MP.applying){
      if(R.MP.role==='guest'&&R.MP.strategySeq===sequence)R.mpSendStrategy(true);
      else if(R.MP.role==='host')R.mpSendSnapshot(true);
    }
    return result;
  };
  const apply=R.mpApplyGuestStrategy;
  R.mpApplyGuestStrategy=(data,seq)=>{
    const number=Number(seq)||0;
    if(R.MP.role==='host'&&number>0&&number<=R.MP.lastGuestSeq){
      R.mpSendSnapshot(true);return false;
    }
    return apply(data,seq);
  };
  Object.assign(window.__ROADLORDS__,{clearTerrain:R.clearTerrain,mpApplyGuestStrategy:R.mpApplyGuestStrategy});
}
