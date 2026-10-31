import { TAVERN, levelValue as lv } from '../data/faction-redesign.js';

export function initializeHumanRedesign(R) {
  const human=c=>(c.race||'human')==='human';
  const active=(c,type)=>R.buildingOf(c,type).filter(b=>!b.inactive);
  R.townhallPower=(c,b)=>{
    if(!human(c)||!b||['keep','townhall','warcenter'].includes(b.type))return 1;
    return active(c,'townhall').some(h=>h.level>=4||R.inBuildingRange(h,b,h.level))?2:1;
  };
  for(const type of ['townhall','market','tavern']){delete R.V4_BRANCHES[type];R.V4_SIMPLE_L4.add(type);}
  R.BUILDINGS.tavern.unique=false;
  const unique=R.isUniqueBuilding;
  R.isUniqueBuilding=(c,type)=>type==='tavern'?false:unique(c,type);
  R.V4_BRANCHES.spearhall=[
    {id:'bulwark',name:'Bástyaőrség',icon:'🛡',description:'+100% életerő. Harc közben nem lökhető el, és az ellenség nem haladhat át rajta.'},
    {id:'piercing_spears',name:'Nyársalók',icon:'🔱',description:'A döfés a célpont mögötti legfeljebb 2 ellenfelet is eltalálja, 50% sebzéssel.'},
  ];
  R.V4_BRANCHES.barracks.find(b=>b.id==='cavalry_barracks').description='Istálló mellett Lovagot képez Kardos helyett, 30%-kal kisebb képzési sebességgel.';
  const defense=R.NORMAL.find(o=>o.id==='spear_range');
  Object.assign(defense,{name:'Szívós lándzsások',description:'Lándzsásaid −5% sebzést kapnak közelharci támadásokból. Legfeljebb −75%.',eligible:c=>human(c)&&R.unitAvailable(c,'spearman')&&R.countNormal(c,'spear_range')<15});
  const training=R.trainingTime;
  R.trainingTime=(c,b)=>training(c,b)/(human(c)&&b.type==='barracks'&&R.effectiveUnitKey(c,b)==='knight'?.7:1);
  const stats=R.statsFor;
  R.statsFor=(c,e)=>{const s=stats(c,e);if(e.key==='spearman'&&R.hasBranch(c,'spearhall','bulwark'))s.hp*=2;return s;};
  R.spearBastion=u=>!!u?.alive&&u.key==='spearman'&&R.hasBranch(R.cityForSide(u.side),'spearhall','bulwark');
  const passes=R.unitPassesEnemies;
  R.unitPassesEnemies=u=>{
    if(!passes?.(u))return false;
    let blocked=false;
    R.roadVisit(u,Math.max(100,(u.speed||0)*.1),v=>{if(v.side!==u.side&&R.spearBastion(v)&&Math.abs((v.offset||0)-(u.offset||0))<30)blocked=true;},u.side==='player'?'enemy':'player');
    return !blocked;
  };
  const knock=R.knockback;
  if(knock)R.knockback=(u,...args)=>R.spearBastion(u)?undefined:knock(u,...args);
  const hit=R.applyDirectHit;
  R.applyDirectHit=(u,t,damage,opts={})=>{
    const dx=t.lane-u.lane,dy=(t.offset||0)-(u.offset||0),distance=Math.hypot(dx,dy)||1;
    const previous=R.redesignAttackContext;
    R.redesignAttackContext={source:u,melee:!u.tags?.includes('ranged')&&!u.orcSpearReady&&!u.orcUsingSpear&&!u.roadAttack?.orcSpear};
    let out;
    try{out=hit(u,t,damage,opts);}finally{R.redesignAttackContext=previous;}
    if(u.key==='spearman'&&!opts.redesignSecondary&&R.hasBranch(R.cityForSide(u.side),'spearhall','piercing_spears')){
      const candidates=[];
      R.roadVisit(u,distance+u.range,v=>{
        if(v===t||!v.alive||v.side===u.side)return;
        const x=v.lane-u.lane,y=(v.offset||0)-(u.offset||0),along=(x*dx+y*dy)/distance,across=Math.abs(x*dy-y*dx)/distance;
        if(along>distance&&along<=distance+u.range&&across<=13)candidates.push({v,along});
      },u.side==='player'?'enemy':'player');
      candidates.sort((a,b)=>a.along-b.along||a.v.id-b.v.id);
      for(const {v}of candidates.slice(0,2))R.applyDirectHit(u,v,R.attackBaseDamage(u,v)*.5,{...opts,redesignSecondary:true});
    }
    return out;
  };

  // The opening buff is earned at the producer, never from simply opening a gate.
  R.applyTavernOriginBuff=(c,b,e)=>{
    if(!human(c)||!b)return e;
    const taverns=active(c,'tavern').filter(t=>R.adjacentBuildings(c,t).some(x=>x.id===b.id));
    let best=null,bonus=0;
    for(const t of taverns){const value=lv(t.level,TAVERN.bonus)*R.townhallPower(c,t);if(value>bonus||value===bonus&&lv(t.level,TAVERN.hits)>lv(best?.level,TAVERN.hits)){best=t;bonus=value;}}
    if(best){
      const base=lv(best.level,TAVERN.bonus)*R.townhallPower(c,best);
      e.firstMult=1+base+.1*R.countNormal(c,'tavern_damage')*R.townhallPower(c,best);e.firstHits=lv(best.level,TAVERN.hits);
      if(R.hasLeg(c,'campaign_feast')&&R.adjacentBuildings(c,best).some(x=>x.type==='rally')){
        e.permanentTavern=true;e.tavernBaseBonus=base;e.tavernBuffScale=.5;
        e.permanentTavernMult=R.tavernPermanentMult35(c,e);
      }
    }
    return e;
  };
  const wave=R.waveBuffs;
  R.waveBuffs=(c,entries)=>{
    const saved=entries.map(e=>[e.firstMult,e.firstHits]);const out=wave(c,entries);
    if(human(c))entries.forEach((e,i)=>{[e.firstMult,e.firstHits]=saved[i];});return out;
  };
  const rallyWave=R.rallyWaveBuffs;
  R.rallyWaveBuffs=(c,entries)=>{
    const saved=entries.map(e=>({firstMult:e.firstMult,firstHits:e.firstHits,permanentTavern:e.permanentTavern,tavernBaseBonus:e.tavernBaseBonus,permanentTavernMult:e.permanentTavernMult}));
    const out=rallyWave(c,entries);
    if(human(c)){
      const rally=active(c,'rally')[0],power=R.townhallPower(c,rally);
      const guardPower=Math.max(0,...active(c,'guardhouse').filter(g=>R.v491GuardhouseNetwork(c,g).rally).map(g=>R.townhallPower(c,g)));
      entries.forEach((e,i)=>{
        Object.assign(e,saved[i]);
        if(power>1&&e.rallySpeedUntilAttack)e.speedMult=1+((e.speedMult||1)-1)*power;
        if(guardPower&&R.hasBranch(c,'guardhouse','assault_guard'))e.shieldPct=Math.max(e.shieldPct||0,.5*guardPower);
      });
    }
    return out;
  };
  const armor=R.applyArmorSmithEntry;
  R.applyArmorSmithEntry=(c,b,e)=>{
    const out=armor(c,b,e),smith=R.armorSmithForSpawner(c,b);
    if(smith&&R.townhallPower(c,smith)>1){
      e.armorShieldPct=(e.armorShieldPct||0)*2;e.shieldPct=Math.max(e.shieldPct||0,e.armorShieldPct);
      if(e.armorMoveMult)e.armorMoveMult=1+2*(e.armorMoveMult-1);
      if(e.thornArmor)e.thornArmor=2;
    }
    return out;
  };
  const guild=R.guildMultiplier;
  R.guildMultiplier=(c,b)=>{
    const value=guild(c,b);if(!human(c))return value;
    const support=active(c,'guildhouse').find(g=>R.inBuildingRange(g,b,R.hasBranch(c,'guildhouse','guild_network')?3:2));
    return 1+(value-1)*R.townhallPower(c,support);
  };
  const guard=R.guardhouseBonus;
  R.guardhouseBonus=(c,target)=>{
    const original=guard(c,target);if(!human(c))return original;
    let extra=0;
    for(const b of active(c,'guardhouse')){
      const net=R.v491GuardhouseNetwork(c,b);
      if((target==='main'&&net.wall||target==='rally'&&net.rally)&&R.townhallPower(c,b)>1)extra+=lv(b.level,[20,30,45,80]);
    }
    return original+extra;
  };

  R.marketStorageMultiplier=c=>{const m=active(c,'market')[0];return m?1+.5*m.level*R.townhallPower(c,m):1;};
  // The old manual market has no route consumption anymore.
  R.marketTransfer=(c,dt,stock={...c.resources})=>({stock,gain:R.C(),use:R.C()});
  R.marketImports=()=>new Set();
  R.marketControlsHTML=()=>'<p>Túltermelésed automatikusan a szükséges nyersanyagra váltódik.</p>';
  R.aiMarket=()=>{};
  R.convertMarketOverflow=(c,overflow)=>{
    const market=human(c)&&active(c,'market')[0];if(!market)return;
    const efficiency=lv(market.level,[.5,1,1.5,2])*R.townhallPower(c,market);
    const demand=R.productionBudgetRates(c),income=R.productionRates(c);
    // Only original production overflow is passed here. Converted output never recurses.
    for(const from of R.RES){
      let amount=Math.max(0,overflow[from]||0)*efficiency;
      const choices=R.RES.filter(to=>to!==from).sort((a,b)=>{
        const priority=key=>(demand[key]>income[key]&&c.resources[key]<(demand[key]-income[key])*10?10:0)+(1-c.resources[key]/Math.max(1,c.caps[key]));
        return priority(b)-priority(a);
      });
      for(const to of choices){const moved=Math.min(amount,Math.max(0,c.caps[to]-c.resources[to]));c.resources[to]+=moved;amount-=moved;if(amount<=0)break;}
    }
  };
  Object.assign(R.redesignDescriptions,{
    townhall:(c,l)=>l>=4?'Megduplázza támogató épületeid hatását az egész városban. A Haditanácsra nem hat.':`${l} mezőn belül megduplázza a támogató épületek hatását.`,
    tavern:(c,l)=>`A szomszédos termelők egységeinek első ${lv(l,TAVERN.hits)} támadása +${lv(l,TAVERN.bonus)*100}% sebzést okoz.`,
    market:(c,l)=>`Túltermelésedet automatikusan átváltja: 1 → ${lv(l,[.5,1,1.5,2]).toLocaleString('hu-HU')}. +${l*50}% tárolókapacitás.`,
  });
  for(const type of ['townhall','tavern','market'])R.BUILDINGS[type].description=R.redesignDescriptions[type](null,1);
}
