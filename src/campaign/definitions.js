export const CAMPAIGN_SCHEMA = 2;
export const CAMPAIGN_SAVE_KEY = 'roadlords:campaign:v1';
export const CAMPAIGN_LENGTH = 5;
export const CAMPAIGN_RACES = ['human', 'orc', 'undead'];
export const FACTION_RELICS = {
  human:['specialization','wide_choice','double_choice','strategic_superiority','full_garrison_economy'],
  orc:['orc_skip_power','orc_momentum','orc_revenge','orc_veteran_kills','orc_transfusion','orc_siege_loot'],
  undead:['gen_soul_frugal','und_soul_might','und_death_chain','und_twin_training','und_first_guard','und_raise_enemy','und_fast_poison','und_elite_birth'],
};
export const LEGACY_RELIC_IDS = Object.values(FACTION_RELICS).flat();

export const EXTRA_RELICS = [
  {id:'campaign_supplies',race:'human',name:'Hadjárati készletek',icon:'▣',description:'Minden harcot 50%-kal több kezdőnyersanyaggal kezdesz.',art:'full_garrison_economy'},
  {id:'campaign_blueprints',race:'human',name:'Felderített lehetőségek',icon:'⌘',description:'A négy kezdő épületválasztásban +2 lap közül választhatsz.',art:'wide_choice'},
  {id:'campaign_pathfinder',race:'human',name:'Kincskereső térkép',icon:'◇',description:'Harc végén +1 ereklye közül választhatsz.',art:'strategic_superiority'},
  {id:'orc_war_banner',race:'orc',name:'Ősök zászlaja',icon:'⚑',description:'Minden harcot 6 elit Harcossal kezdesz a helyőrségben.',art:'orc_horde_heart'},
  {id:'orc_wandering_camp',race:'orc',name:'Vándorló tábor',icon:'↶',description:'Épület bontásakor a kifizetett építési ár 100%-át visszakapod. A raktárkapacitás továbbra is számít.',art:'orc_ancient_deposits'},
];
export const relicIdsForRace = race => [...(FACTION_RELICS[race]||[]),...EXTRA_RELICS.filter(d=>d.race===race).map(d=>d.id)];

const OLD_SHARED_IDS=['specialization','wide_choice','double_choice','strategic_superiority','full_garrison_economy','campaign_supplies','campaign_blueprints','campaign_pathfinder'];
const OLD_RELIC_REPLACEMENTS={
  orc:['orc_momentum','orc_revenge','orc_siege_loot','orc_skip_power','orc_transfusion','orc_war_banner','orc_veteran_kills','orc_wandering_camp'],
  undead:['und_elite_birth','gen_soul_frugal','und_twin_training','und_death_chain','und_soul_might','und_first_guard','und_fast_poison','und_raise_enemy'],
};

export const CAMPAIGN_PROFILES = {
  human: [
    {name:'Kardtestvériség',building:'barracks',branch:'conscription'},
    {name:'Lándzsaőrség',building:'spearhall',branch:'bulwark'},
    {name:'Erdei íjászok',building:'archery',branch:'longbowmen'},
    {name:'Vaslovasok',building:'stable',branch:'armored_knights'},
    {name:'Lángőrzők',building:'magetower',branch:'fire_mages'},
  ],
  orc: [
    {name:'Vérfog klán',building:'orc_war'},
    {name:'Dühöngő falka',building:'orc_bers'},
    {name:'Goblin portyázók',building:'orc_gob'},
    {name:'Wargvadászok',building:'orc_warg'},
    {name:'Óriások hordája',building:'orc_troll'},
  ],
  undead: [
    {name:'Csontlégió',building:'und_graveyard',branch:'elite_skeletons'},
    {name:'Rothadó menet',building:'und_morgue',branch:'epidemic'},
    {name:'Kísértetjárás',building:'und_ghost_spawner',branch:'phasewalker'},
    {name:'Sírbéli idézők',building:'und_necro_spawner',branch:'eternal_army'},
    {name:'Vérudvar',building:'und_vampire_castle',branch:'blood_hunt'},
    {name:'Lichek gyülekezete',building:'und_lich_spawner',branch:'endless_hunger'},
  ],
};

export function campaignRandom(seed) {
  let value=seed>>>0;
  return () => ((value=(Math.imul(value,1664525)+1013904223)>>>0)/4294967296);
}

export function campaignEncounters(seed) {
  const random=campaignRandom(seed),pick=values=>values[Math.floor(random()*values.length)],out=[];
  for(let stage=0;stage<4;stage++) {
    const races=CAMPAIGN_RACES.filter(r=>stage<2||out[stage-1].race!==r||out[stage-2].race!==r);
    // NPCs never skip picks, so their opening cannot waste a relic on skipping.
    const race=pick(races),profile=pick(CAMPAIGN_PROFILES[race]),remaining=relicIdsForRace(race).filter(id=>!['campaign_pathfinder','strategic_superiority','orc_skip_power','orc_transfusion'].includes(id)),rewards=[];
    for(let n=0;n<(stage===0?0:stage===3?2:1);n++)rewards.push(remaining.splice(Math.floor(random()*remaining.length),1)[0]);
    out.push({...profile,race,seed:Math.floor(random()*0x100000000),level:stage>=2?stage===2?3:4:0,relics:rewards,boss:false});
  }
  out.push({name:'A Vérudvar Ura',race:'undead',building:'und_vampire_castle',branch:'blood_hunt',level:4,seed:Math.floor(random()*0x100000000),relics:['und_first_guard','und_elite_birth'],boss:true});
  return out;
}

export function newCampaignRun(race,seed) {
  if(!CAMPAIGN_RACES.includes(race))throw new RangeError('Ismeretlen nép');
  return {schema:CAMPAIGN_SCHEMA,seed:seed>>>0,race,stage:0,status:'ready',relics:[],offers:[],results:[]};
}

export function readCampaignRun(text,relicIds) {
  if(!text)return null;
  try {
    const value=JSON.parse(text),validIds=new Set(relicIds),statuses=['ready','battle','reward','defeated','complete'];
    if(![1,CAMPAIGN_SCHEMA].includes(value.schema)||!CAMPAIGN_RACES.includes(value.race)||!Number.isInteger(value.seed)||value.seed<0||value.seed>0xffffffff||!Number.isInteger(value.stage)||value.stage<0||value.stage>=CAMPAIGN_LENGTH||!statuses.includes(value.status))return null;
    if(value.schema===1&&value.race!=='human'){
      const replace=id=>OLD_RELIC_REPLACEMENTS[value.race][OLD_SHARED_IDS.indexOf(id)];
      for(const key of ['relics','offers']){
        if(!Array.isArray(value[key])||!value[key].every(id=>OLD_SHARED_IDS.includes(id)))return null;
        value[key]=value[key].map(replace);
      }
    }
    const factionIds=new Set(relicIdsForRace(value.race));
    for(const key of ['relics','offers'])if(!Array.isArray(value[key])||value[key].length>factionIds.size||new Set(value[key]).size!==value[key].length||!value[key].every(id=>validIds.has(id)&&factionIds.has(id)))return null;
    if(value.relics.length!==value.stage||value.status==='complete'&&value.stage!==4||value.status==='reward'&&(value.stage===4||!value.offers.length||value.offers.some(id=>value.relics.includes(id))))return null;
    return {...newCampaignRun(value.race,value.seed),stage:value.stage,status:value.status,relics:[...value.relics],offers:value.status==='reward'?[...value.offers]:[],results:Array.isArray(value.results)?value.results.slice(0,5).filter(x=>Number.isFinite(x?.time)&&x.time>=0).map(x=>({time:x.time})):[]};
  }catch{return null;}
}
