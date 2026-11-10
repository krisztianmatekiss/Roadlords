// Extra projectiles include a dead shooter's launched shot and simultaneous
// secondary shots which do not fit the source unit's single animation record.
// Damage remains authoritative on the host, never simulated on the guest.
export function installFlyingShotSnapshots(R) {
  const send=R.mpSend,apply=R.mpApplySnapshot;
  R.mpSend=data=>{
    if(data?.type==='snapshot')data={...data,flyingShots:R.ROAD.pending
      .filter(p=>p.a.ranged&&p.u.key!=='und_lich'&&p.a.hit>R.ROAD.clock&&
        (p.u.alive?p.a!==p.u.roadAttack:p.u.roadDiedAt>=p.a.launch))
      .map(({u,a})=>({id:u.id,key:u.key,side:u.side,lane:u.lane,offset:u.offset,roadAttack:a}))};
    return send(data);
  };
  R.mpApplySnapshot=data=>{
    const result=apply(data);
    if(R.MP.role==='guest')R.ROAD.remoteShots=(data.flyingShots||[]).map(u=>R.mpMirrorUnit(u));
    return result;
  };
}
