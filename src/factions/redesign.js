import { ORC_REDESIGN as O, levelValue as lv, REMOVED_BUILDINGS, undeadEliteChance, territoryPower } from '../data/faction-redesign.js';
import { UNDEAD_BUILDINGS as D } from '../data/undead.js';
import { initializeHumanRedesign } from '../city/human-redesign.js';

const removedCards = new Set(['hospital_veterans','hospital_doomed','orc_enemy_ancestors','tavern_chain']);
const pct = n => `${(Math.round(n * 1000) / 10).toLocaleString('hu-HU')}%`;

// Final catalog registration; effects themselves live in the relevant simulation modules.
export function initializeFactionRedesign(R) {
  const factionMatches = R.factionMatches;
  R.factionMatches = (race, def, key) => !REMOVED_BUILDINGS.has(key) && factionMatches(race, def, key);
  window.__ROADLORDS_FACTIONS__.matches = R.factionMatches;
  for (let i=R.UNLOCKABLE.length-1;i>=0;i--) if(REMOVED_BUILDINGS.has(R.UNLOCKABLE[i]))R.UNLOCKABLE.splice(i,1);
  for(const list of [R.NORMAL,R.LEGENDARY])for(let i=list.length-1;i>=0;i--)
    if(removedCards.has(list[i].id)||/hospital|alchemy|alchemist|academy_/.test(list[i].id))list.splice(i,1);
  for(const key of ['buildingUnlockPool','startBuildingPool','buildingUpgradePool','eligibleNormal','eligibleLegendary']){
    const original=R[key];
    R[key]=(...args)=>original(...args).filter(o=>!REMOVED_BUILDINGS.has(o.id)&&!removedCards.has(o.id)&&!/^hospital|^alchemy|^alchemist|^academy_/.test(o.id));
  }
  // Deleted definitions remain available only for safe inspection of older snapshots.
  // No new placement, unlock, upgrade, codex entry or AI build can select them.
  const aiBuild=R.aiBuild;
  R.aiBuild=(key,...args)=>!REMOVED_BUILDINGS.has(key)&&aiBuild(key,...args);

  const only = (key,id,description) => {
    const branch=R.V4_BRANCHES[key].find(b=>b.id===id);
    R.V4_BRANCHES[key]=[{...branch,description}];
  };
  only('orc_overseer','ruthless','Csúszkával állítható: −40–80% képzési idő, 80–25% induló HP.');
  only('orc_arena','veteran_army','A szomszédos termelők 60% eséllyel elit egységeket képeznek.');
  only('orc_slave','forced_labor','Minden 20 legyőzött ellenség után +0,4 fa, +0,4 kő és +0,2 élelem/mp.');
  only('orc_raider','monsters','20% eséllyel ingyenes erősítés érkezik. Az erősítés 8% eséllyel Troll.');
  const command=window.__ROADLORDS_ORCS__.keepBranches.find(b=>b.id==='orc_command');
  command.description='Kétszeres főváros-HP és helyőrségi kapacitás. A kapuhoz kötött bónuszok mindig aktívak.';
  R.V4_BRANCHES.orc_warg.find(b=>b.id==='pack').description='Közeli Warglovasonként +1,5% mozgási és támadási sebesség.';

  D.keep.branches=[
    {id:'dead_realm',name:'A holtak birodalma',icon:'☠',description:'Kétszeres térfélnövelés és kétszeres saját térfélhez kötött bónuszok.'},
    {id:'elite_dominion',name:'Elit légió',icon:'★',description:'A termelőid 50% eséllyel elit egységeket képeznek. Épületeid fenntartása megduplázódik.'},
  ];
  const hatchCopy=level=>`A közeli termelők ${pct(lv(level,[.4,.6,.8,1]))}-kal gyorsabban képeznek, de ${pct(lv(level,[.2,.25,.3,.35]))} eséllyel Csontváz készül. Temetőkre nem hat.`;
  D.und_corrupted_hatchery.description=hatchCopy(1);
  D.und_corrupted_hatchery.levels=[1,2,3,4].map(hatchCopy);
  D.und_dark_tower.description='A saját térfeleden járó ellenségeket sebzi. Szintenként +1 célpont.';
  D.und_dark_tower.levels=[1,2,3,4].map((level,i)=>`${level} célpont: ${[1,1.5,2,3][i]}% Max HP/mp a saját térfeleden.`);
  for(const key of ['und_corrupted_hatchery','und_dark_tower'])Object.assign(R.BUILDINGS[key],D[key]);
  R.NORMAL.push({id:'und_territory',kind:'normal',name:'Terjeszkedő sírok',icon:'↔',race:'undead',description:'Saját térfeled +12 méterrel hosszabb.',eligible:c=>c.race==='undead'});
  R.LEGENDARY.push({id:'und_elite_birth',kind:'legendary',name:'Kiválasztott holtak',icon:'★',race:'undead',description:'Egységeid +20% eséllyel elitként jelennek meg. Idézettekre és feltámasztottakra is hat.',eligible:c=>c.race==='undead'&&!R.hasLeg(c,'und_elite_birth')});
  R.PICK_IMAGES.und_elite_birth=R.PICK_IMAGES.und_first_guard||R.CARD_IMAGES.und_necro_spawner;
  R.PICK_IMAGES.und_territory=R.PICK_IMAGES.und_home_march||R.CARD_IMAGES.und_crypt;
  R.undTerritoryAdvance=c=>Math.min(Math.max(0,R.PATH_LENGTH/2-20),120*R.countNormal(c,'und_territory')*territoryPower(c));
  R.territoryBoundary=()=>R.clamp(R.PATH_LENGTH/2+R.undTerritoryAdvance(R.P)-R.undTerritoryAdvance(R.E),20,R.PATH_LENGTH-20);
  R.isOwnHalf=u=>u.side==='player'?u.lane<=R.territoryBoundary():u.lane>=R.territoryBoundary();
  const entry=R.makeEntry;
  R.makeEntry=(c,key,extra={})=>{
    const e=entry(c,key,extra);
    if(c.race==='undead'){
      const chance=undeadEliteChance(c,!!extra.producerMade);
      if(!e.veteran&&!e.undElite&&chance>0&&Math.random()<chance)e.veteran=true;
    }
    // Legacy elite flags are accepted, but the shared stats calculation applies them once.
    if(e.undElite)e.veteran=true;
    return e;
  };
  const release=R.releaseUnit;
  R.releaseUnit=(c,e)=>{const u=release(c,e);if(u&&(e.veteran||e.undElite))u.veteran=true;return u;};
  const badges=R.unitStatusBadges;
  R.unitStatusBadges=u=>{
    const out=badges(u).filter(([key])=>key!=='elite'&&key!=='veteran');
    if(u?.veteran||u?.undElite)out.push(['veteran',0]);
    return out;
  };
  delete window.__ROADLORDS_STATUSES__.defs.elite;
  window.__ROADLORDS_STATUSES__.badges=R.unitStatusBadges;

  // One profile is locked for the entire training cycle, including its birth HP.
  function currentHaste(c,b){
    let profile={time:1,hp:1};
    for(const support of R.adjacentBuildings(c,b))if(support.type==='orc_overseer'&&!support.inactive){
      const configured=c.orcHasteSettings?.[support.id];
      const fallback=configured==null&&c===R.E&&!R.MP.enabled ? .5 : Number(configured)||0;
      const setting=support.level>=4 ? Math.max(0,Math.min(1,fallback)) : 0;
      const time=support.level>=4 ? .6-.4*setting : 1-lv(support.level,[.2,.3,.4]);
      if(time<profile.time)profile={time,hp:support.level>=4?.8-.55*setting:.8};
    }
    return profile;
  }
  R.orcHasteProfile=(c,b)=>{
    if(b.progress>0&&b.orcTrainingProfile)return b.orcTrainingProfile;
    const profile=currentHaste(c,b);
    if(c.race==='orc'&&R.BUILDINGS[b.type]?.unit)b.orcTrainingProfile=profile;
    return profile;
  };
  const normalSpawn=R.normalSpawn;
  R.normalSpawn=(c,b)=>{
    const profile=b.orcTrainingProfile;
    const ok=normalSpawn(c,b);
    if(ok&&c.race==='orc')delete b.orcTrainingProfile;
    else if(profile)b.orcTrainingProfile=profile;
    return ok;
  };
  R.MP_STRATEGY_KEYS.push('orcHasteSettings');
  R.redesignBuildingControls=(c,b)=>b.type==='orc_overseer'&&b.level>=4?
    `<label class="overseerSlider">Hajszolás <input type="range" min="0" max="100" step="1" data-overseer="${String(b.id).replaceAll('"','&quot;')}" value="${Math.round((c.orcHasteSettings?.[b.id]||0)*100)}"><output>${pct(.4+.4*(c.orcHasteSettings?.[b.id]||0))} rövidebb képzés · ${pct(.8-.55*(c.orcHasteSettings?.[b.id]||0))} induló HP</output></label>`:'';
  document.addEventListener('input',event=>{
    const input=event.target.closest?.('[data-overseer]');if(!input)return;
    const b=R.getBuilding(R.P,input.dataset.overseer);if(!b||b.type!=='orc_overseer'||b.level<4)return;
    const value=Math.max(0,Math.min(1,Number(input.value)/100));
    (R.P.orcHasteSettings||={})[b.id]=value;
    input.parentElement.querySelector('output').textContent=`${pct(.4+.4*value)} rövidebb képzés · ${pct(.8-.55*value)} induló HP`;
    if(R.MP.enabled){if(R.MP.role==='guest')R.mpSendStrategy(true);else R.mpSendSnapshot(true);}
  });

  const descriptions={
    orc_arena:(c,l)=>`A szomszédos termelők ${pct(lv(l,O.arena))} eséllyel elit egységeket képeznek. Több Aréna nem adódik össze.`,
    orc_hut:(c,l)=>`+${lv(l,O.hut)} sereghely és +${lv(l,O.hut)} helyőrségi férőhely.`,
    orc_hunt:(c,l)=>`+${lv(l,O.hunt).toLocaleString('hu-HU')} élelem/mp. Fal mellett +50%, nyitott kapunál további +50%.`,
    orc_totem:(c,l)=>`Minden ${lv(l,O.totem)} megölt ellenség után 1 normál választás.`,
    orc_raider:(c,l)=>`Nyitott kapunál minden kiképzés ${pct(lv(l,O.raid))} eséllyel ingyenes erősítést hív.`,
    orc_overseer:(c,l)=>l>=4?'Állítható hajszolás: −40–80% képzési idő, 80–25% induló HP.':`A szomszédos táborok ${pct(1/(1-lv(l,[.2,.3,.4]))-1)}-kal gyorsabban képeznek, de az egységek 80% HP-val indulnak.`,
    und_corrupted_hatchery:(c,l)=>hatchCopy(l),
    und_dark_tower:(c,l)=>D.und_dark_tower.levels[l-1],
  };
  R.redesignDescriptions=descriptions;
  const upgradeDescription=R.v4UpgradeDescription,upgradeDetails=R.buildingUpgradeDetails;
  R.v4UpgradeDescription=(c,type,branch)=>descriptions[type]?.(c,Math.min(4,R.levelOf(c,type)+1))||upgradeDescription(c,type,branch);
  R.buildingUpgradeDetails=(c,type)=>descriptions[type]?.(c,Math.min(4,R.levelOf(c,type)+1))||upgradeDetails(c,type);
  for(const [id,description]of Object.entries(descriptions))R.BUILDINGS[id].description=description(null,1);
  const rows=R.buildingEffectRows;
  R.buildingEffectRows=(c,b)=>{
    if(descriptions[b.type]){
      const out=[['Hatás',descriptions[b.type](c,b.level)]];
      if(b.type==='orc_totem')out.push(['Megölt ellenség',`${c.orcSupport?.totemProgress||0} / ${lv(b.level,O.totem)}`]);
      if(b.type==='orc_overseer'&&b.level>=4)out.push(['Csúszka','A következő képzési ciklusra érvényes.']);
      if(D[b.type])out.push(['Fenntartás',`${(R.undEconomy(c).upkeep.get(b.id)||0).toFixed(2)} Lélek/mp`]);
      return out;
    }
    return rows(c,b);
  };
  const cardDescription=R.buildingCardDescription;
  if(cardDescription)R.buildingCardDescription=(c,type,level,...args)=>descriptions[type]?.(c,level||R.levelOf(c,type))||cardDescription(c,type,level,...args);
  const preview=R.upgradeCopyPreview;
  R.upgradeCopyPreview=(c,o)=>{
    if(o.id==='und_territory'||o.id==='spear_range'){
      const n=R.countNormal(c,o.id),value=k=>o.id==='und_territory'?`+${12*k*territoryPower(c)} m`:`−${Math.min(75,5*k)}%`;
      return {description:R.NORMAL.find(d=>d.id===o.id)?.description||o.description||'',context:'Egy felvétel hatása.',stacking:`Halmozható. Felvéve: ${n}×`,rows:[{label:o.id==='und_territory'?'Térfélnövelés':'Közelharcból kapott sebzés',before:value(n),after:value(n+1)}]};
    }
    return preview(c,o);
  };
  initializeHumanRedesign(R);
}
