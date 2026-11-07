// Read the real road, surviving fortifications and local forces. An army
// marching past an invasion is not counted as a defending army.
export function installAiBattleAwareness(R) {
  const cache=new WeakMap(),health=new WeakMap();
  const distance=(side,lane)=>side==='player'?lane:R.PATH_LENGTH-lane;
  const strength=u=>{
    const base=R.UNITS[u.key]||{},hp=Math.max(0,u.hp??base.hp??100)+(u.shield||0)+(u.tempShield||0);
    let dps=(u.damage??base.damage??10)/Math.max(.2,u.cooldownTime??base.cooldown??1);
    if(u.key==='und_necromancer')dps+=12;
    if(u.key==='und_lich')dps*=10;
    return Math.sqrt(hp/100)*(dps+(u.heal||0)*.25)*(1+Math.min(1,(u.aoe||0)/100));
  };
  R.aiBattleState=c=>{
    const now=R.state.time,side=R.sideForCity(c),other=side==='player'?'enemy':'player';
    const towers=R.towers.filter(t=>t.side===side&&t.alive);
    const stamp=`${now}:${R.state.combatStep}:${R.state.unitSerial}:${R.state.units.length}:${towers.map(t=>t.hp).join(',')}:${c.hp}:${c.maxHp}`;
    const old=cache.get(c);if(old?.stamp===stamp&&old.units===R.state.units)return old.value;
    let h=health.get(c);const capital=c.buildings.find(b=>b.type==='keep');
    if(!h||h.time>now||h.maxHp!==c.maxHp||h.capital!==capital)h={hp:c.hp,maxHp:c.maxHp,capital,time:now,damageAt:-Infinity};
    if(c.hp<h.hp-.01)h.damageAt=now;
    h.hp=c.hp;h.time=now;health.set(c,h);
    const border=distance(side,R.territoryBoundary()),allies=[],foes=[];
    for(const u of R.state.units)if(u.alive){
      const base=R.UNITS[u.key]||{},item={u,d:distance(side,u.lane),power:strength(u),speed:Math.max(1,u.speed??base.speed??20),range:u.range??base.range??30};
      (u.side===side?allies:foes).push(item);
    }
    const front=towers.reduce((best,t)=>!best||distance(side,t.lane)>distance(side,best.lane)?t:best,null);
    const frontDistance=front?distance(side,front.lane):0;
    const threats=foes.filter(e=>e.d<=border||Math.max(0,e.d-frontDistance-e.range)/e.speed<35);
    const nearest=threats.length?Math.min(...threats.map(e=>e.d)):Infinity;
    const defenders=allies.filter(a=>a.d<=nearest+Math.max(100,a.range)&&a.d<=border+Math.max(100,a.range));
    const hostilePower=threats.reduce((n,e)=>n+e.power,0),defendingPower=defenders.reduce((n,a)=>n+a.power,0);
    const behindPortal=threats.filter(e=>e.d<border-Math.max(50,e.range*.5));
    const portalHostiles=behindPortal.reduce((n,e)=>n+e.power,0);
    const portalDefenders=allies.filter(a=>a.d<=Math.min(border,nearest)+Math.max(80,a.range)).reduce((n,a)=>n+a.power,0);
    const incomingDps=threats.reduce((n,e)=>{
      const base=R.UNITS[e.u.key]||{};
      const damage=(e.u.cat??base.cat)==='siege'?(e.u.buildingDamage??e.u.damage??base.damage??10):
        (e.u.damage??base.damage??10)*(front ? .25 : 1/3);
      return n+damage/Math.max(.2,e.u.cooldownTime??base.cooldown??1);
    },0);
    const arrival=threats.length?Math.min(...threats.map(e=>Math.max(0,e.d-frontDistance-e.range)/e.speed)):Infinity;
    const breach=arrival+(front?front.hp/Math.max(1,incomingDps):0);
    const spawners=R.activeSpawners(c).filter(b=>!b.inactive);
    const speeds=new Map();
    const reinforcement=spawners.length?Math.min(...spawners.map(b=>{
      const key=R.effectiveUnitKey(c,b);
      if(!speeds.has(key))speeds.set(key,R.statsFor(c,{key}).speed);
      return R.trainingTime(c,{...b})*(1-(b.progress||0))+frontDistance/Math.max(1,speeds.get(key));
    })):90+frontDistance/30;
    const undercovered=hostilePower>defendingPower*1.15+8;
    const penetrated=threats.some(e=>e.d<frontDistance-Math.max(100,e.range));
    const urgent=threats.length>0&&(now-h.damageAt<12||penetrated||front&&front.hp<front.maxHp*.25&&arrival<15||undercovered&&
      (!front||breach<reinforcement+25||front.hp<front.maxHp*.35));
    const safeOpening=R.state.time<180&&!urgent&&!!front&&front.hp>=front.maxHp*.7&&breach>reinforcement+40;
    const value={side,other,border,allies,foes,threats,front,frontDistance,hostilePower,defendingPower,breach,reinforcement,
      urgent,safeOpening,penetrated,portalUnsafe:portalHostiles>Math.max(8,portalDefenders*.85)};
    cache.set(c,{stamp,units:R.state.units,value});return value;
  };
  R.aiUnderAttack=c=>R.aiBattleState(c).urgent;
  R.aiProtectPortal=c=>{
    if(!R.aiControlsCity(c)||!c.undPortalEnabled||!R.aiBattleState(c).portalUnsafe)return false;
    c.undPortalEnabled=false;c._aiPortalOffUntil=R.state.time+8;R.recomputeCity(c,true);return true;
  };
}
