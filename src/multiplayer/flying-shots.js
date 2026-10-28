// A projectile can outlive its shooter. Send only these extra visual actors;
// damage remains authoritative on the host, never simulated on the guest.
export function installFlyingShotSnapshots(R) {
  const send=R.mpSend,apply=R.mpApplySnapshot;
  R.mpSend=data=>{
    if(data?.type==='snapshot')data={...data,flyingShots:R.ROAD.pending
      .filter(p=>!p.u.alive&&p.a.ranged&&p.u.key!=='und_lich'&&p.u.roadDiedAt>=p.a.launch&&p.a.hit>R.ROAD.clock)
      .map(({u,a})=>({id:u.id,key:u.key,side:u.side,lane:u.lane,offset:u.offset,roadAttack:a}))};
    return send(data);
  };
  R.mpApplySnapshot=data=>{
    const result=apply(data);
    if(R.MP.role==='guest')R.ROAD.remoteShots=(data.flyingShots||[]).map(u=>R.mpMirrorUnit(u));
    return result;
  };
}
