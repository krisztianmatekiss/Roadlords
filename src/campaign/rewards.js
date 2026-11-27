import { CAMPAIGN_RACES, campaignCardKey } from './definitions.js';

export function installCampaignRewards(R,C) {
  C.branches=(race,id)=>race==='undead'?window.__ROADLORDS_UNDEAD__.buildings[id]?.branches||[]
    :race==='orc'&&id==='keep'?window.__ROADLORDS_ORCS__.keepBranches:R.V4_BRANCHES[id]||[];
  C.catalog=Object.fromEntries(CAMPAIGN_RACES.map(race=>[race,{
    basics:[...R.factionBasics(race)],
    buildings:Object.fromEntries(Object.entries(R.BUILDINGS).filter(([id,d])=>R.factionMatches(race,d,id)).map(([id])=>[id,C.branches(race,id).map(b=>b.id)])),
    normals:Object.fromEntries(R.NORMAL.filter(d=>(d.race||'human')===race).map(d=>[d.id,Object.keys(R.upgradeCatalog.editions(d.id))])),
    legends:R.LEGENDARY.filter(d=>(d.race||'human')===race).map(d=>d.id),
  }]));
  C.cardOption=entry=>entry.kind==='normal'?R.upgradeCatalog.option(entry.id,entry.rarity)
    :{...R.upgradeCatalog.definition(entry.id,'legendary'),kind:'legendary'};
  C.rewardOptions=()=>{
    const run=C.run,loot=run?.loot;
    if(run?.status!=='reward'||!loot)return [];
    return [
      {type:'level',title:'Starter fejlesztése',description:'Egy kezdő épülettípusod +1 kezdőszintet kap.',enabled:Object.values(run.starters).some(b=>b.level<4)},
      {type:'starter',title:'Új starter',description:'Egy most feloldott épülettípus ezentúl kezdettől elérhető.',enabled:loot.unlocked.some(id=>!Object.hasOwn(run.starters,id))},
      {type:'normal',title:'3 permanens fejlesztés',description:'Tarts meg három gyakori, ritka vagy epikus lappéldányt.',enabled:loot.cards.filter(c=>c.kind==='normal').reduce((n,c)=>n+c.count,0)>=3},
      {type:'legendary',title:'1 permanens legendás',description:'Tarts meg egy ebben a csatában megszerzett legendás lapot.',enabled:loot.cards.some(c=>c.kind==='legendary')},
    ];
  };
  const addCard=(list,entry,count=1)=>{
    const previous=list.find(c=>campaignCardKey(c)===campaignCardKey(entry));
    if(previous)previous.count+=count;else list.push({id:entry.id,kind:entry.kind,...(entry.rarity?{rarity:entry.rarity}:{}),count});
  };
  C.chooseReward=choice=>{
    const run=C.run;
    if(C.loading||!run||!choice||!C.rewardOptions().some(o=>o.type===choice.type&&o.enabled))return false;
    if(choice.type==='level'){
      if(!Object.hasOwn(run.starters,choice.id))return false;
      const b=run.starters[choice.id];if(!b||b.level>=4)return false;
      const branches=C.branches(run.race,choice.id),target=b.level+1;
      if(target===4&&branches.length&&!branches.some(b=>b.id===choice.branch))return false;
      b.level=target;b.branch=target===4&&branches.length?choice.branch:null;
    }else if(choice.type==='starter'){
      if(!run.loot.unlocked.includes(choice.id)||Object.hasOwn(run.starters,choice.id)||!Object.hasOwn(C.catalog[run.race].buildings,choice.id))return false;
      run.starters[choice.id]={level:1,branch:null};
    }else{
      const selected=choice.cards;
      if(!Array.isArray(selected)||!selected.length||!selected.every(c=>c&&Number.isInteger(c.count)&&c.count>0)||new Set(selected.map(campaignCardKey)).size!==selected.length||selected.reduce((n,c)=>n+c.count,0)!==(choice.type==='normal'?3:1))return false;
      for(const c of selected){
        const available=run.loot.cards.find(o=>campaignCardKey(o)===campaignCardKey(c));
        if(c.kind!==choice.type||!available||!Number.isInteger(c.count)||c.count<1||c.count>available.count)return false;
      }
      for(const c of selected)addCard(run.permanent,c,c.count);
    }
    run.rewards.push({type:choice.type});run.stage++;run.status='ready';run.loot=null;
    C.rewardType=null;C.rewardSelection=[];C.save();C.view.render();return true;
  };
  C.startingCity=c=>{
    for(const [id,b]of Object.entries(C.run.starters)){
      c.unlocked.add(id);c.levels[id]=b.level;
      if(b.branch)c.l4Branches[id]=b.branch;
      for(const placed of c.buildings)if(placed.type===id)placed.level=b.level;
    }
  };
  C.applyPermanent=(c,entries)=>{
    C.applyingPermanent=true;
    try{
      // Replay exact copies before Specialization is restored: inheritance
      // must not roll a free duplicate or count as this battle's earned loot.
      for(const entry of [...entries.filter(e=>e.kind==='normal'),...entries.filter(e=>e.kind==='legendary')]){
        const option=C.cardOption(entry);
        for(let n=0;n<entry.count;n++)R.applyChoice(c,option,false);
      }
    }finally{C.applyingPermanent=false;}
    R.recomputeCity(c,false);
  };
  const apply=R.applyChoice;
  R.applyChoice=(c,o,...args)=>{
    const record=C.active&&!C.applyingPermanent&&C.run?.status==='battle'&&c===R.P;
    const count=()=>o.kind==='normal'?R.upgradeCatalog.count(c,o.id):c.legends.has(o.id)?Math.max(1,Number(c.legendaryStacks?.[o.id])||0):0;
    const before=record&&['normal','legendary'].includes(o.kind)?count():0,out=apply(c,o,...args);
    if(record&&['normal','legendary'].includes(o.kind)){
      const gained=count()-before;
      if(gained>0)addCard(C.battleCards,{id:o.id,kind:o.kind,...(o.kind==='normal'?{rarity:R.upgradeCatalog.option(o.id,o.rarity).rarity}:{})},gained);
    }
    return out;
  };
}
