export const CAMPAIGN_SCHEMA = 3;
export const CAMPAIGN_SAVE_KEY = 'roadlords:campaign:v1';
export const CAMPAIGN_LENGTH = 5;
export const CAMPAIGN_RACES = ['human', 'orc', 'undead'];

// Existing faction-wide legendaries can seed enemies; they are ordinary
// legendary cards, never a second reward category.
const ENEMY_LEGENDARIES = {
  human:['specialization','wide_choice','double_choice','full_garrison_economy'],
  orc:['orc_momentum','orc_revenge','orc_veteran_kills','orc_siege_loot'],
  undead:['gen_soul_frugal','und_soul_might','und_death_chain','und_twin_training','und_first_guard','und_raise_enemy','und_fast_poison','und_elite_birth'],
};
const OLD_SHARED=['specialization','wide_choice','double_choice','strategic_superiority','full_garrison_economy','campaign_supplies','campaign_blueprints','campaign_pathfinder'];
const OLD_REPLACEMENTS={
  human:['specialization','wide_choice','double_choice','strategic_superiority','full_garrison_economy','full_garrison_economy','wide_choice','strategic_superiority'],
  orc:['orc_momentum','orc_revenge','orc_siege_loot','orc_skip_power','orc_transfusion','orc_veteran_kills','orc_veteran_kills','orc_siege_loot'],
  undead:['und_elite_birth','gen_soul_frugal','und_twin_training','und_death_chain','und_soul_might','und_first_guard','und_fast_poison','und_raise_enemy'],
};
const RETIRED_REWARDS={campaign_supplies:'full_garrison_economy',campaign_blueprints:'wide_choice',campaign_pathfinder:'strategic_superiority',orc_war_banner:'orc_veteran_kills',orc_wandering_camp:'orc_siege_loot'};

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
    const race=pick(races),profile=pick(CAMPAIGN_PROFILES[race]),remaining=[...ENEMY_LEGENDARIES[race]],legendaries=[];
    for(let n=0;n<(stage===0?0:stage===3?2:1);n++)legendaries.push(remaining.splice(Math.floor(random()*remaining.length),1)[0]);
    out.push({...profile,race,seed:Math.floor(random()*0x100000000),level:stage>=2?stage===2?3:4:0,legendaries,boss:false});
  }
  out.push({name:'A Vérudvar Ura',race:'undead',building:'und_vampire_castle',branch:'blood_hunt',level:4,seed:Math.floor(random()*0x100000000),legendaries:['und_first_guard','und_elite_birth'],boss:true});
  return out;
}

export const campaignCardKey = card => `${card.kind}:${card.id}:${card.rarity||''}`;
export function newCampaignRun(race,seed,basics=[]) {
  if(!CAMPAIGN_RACES.includes(race))throw new RangeError('Ismeretlen nép');
  return {schema:CAMPAIGN_SCHEMA,seed:seed>>>0,race,stage:0,status:'ready',starters:Object.fromEntries(['keep',...basics].map(id=>[id,{level:1,branch:null}])),permanent:[],rewards:[],loot:null,results:[]};
}

export function readCampaignRun(text,catalog) {
  if(!text)return null;
  try {
    let value=JSON.parse(text);
    const {race,seed,stage,status}=value,rules=catalog[race];
    if(!rules||![1,2,CAMPAIGN_SCHEMA].includes(value.schema)||!Number.isInteger(seed)||seed<0||seed>0xffffffff||!Number.isInteger(stage)||stage<0||stage>=CAMPAIGN_LENGTH||!['ready','battle','reward','defeated','complete'].includes(status)||status==='complete'&&stage!==4||status==='reward'&&stage===4)return null;
    if(value.schema<3){
      if(!Array.isArray(value.relics)||value.relics.length!==stage||new Set(value.relics).size!==stage)return null;
      const ids=value.relics.map(id=>value.schema===1?OLD_REPLACEMENTS[race][OLD_SHARED.indexOf(id)]:RETIRED_REWARDS[id]||id);
      if(ids.some(id=>!rules.legends.includes(id)))return null;
      value={...newCampaignRun(race,seed,rules.basics),stage,status,results:value.results,permanent:[...new Set(ids)].map(id=>({id,kind:'legendary',count:1})),loot:status==='reward'?{unlocked:['keep',...rules.basics],cards:[]}:null,migrated:true};
    }
    const building=id=>Object.hasOwn(rules.buildings,id);
    const card=entry=>entry&&Number.isInteger(entry.count)&&entry.count>0&&entry.count<=10000&&(entry.kind==='normal'?rules.normals[entry.id]?.includes(entry.rarity):entry.kind==='legendary'&&rules.legends.includes(entry.id)&&!entry.rarity);
    if(!value.starters||Array.isArray(value.starters)||Object.keys(value.starters).length>rules.basics.length+5)return null;
    for(const id of ['keep',...rules.basics])if(!Object.hasOwn(value.starters,id))return null;
    for(const [id,b]of Object.entries(value.starters))if(!building(id)||!b||!Number.isInteger(b.level)||b.level<1||b.level>4||(b.level===4&&rules.buildings[id].length?!rules.buildings[id].includes(b.branch):b.branch!==null))return null;
    if(!Array.isArray(value.permanent)||!value.permanent.every(card)||value.permanent.reduce((n,c)=>n+c.count,0)>stage*3||new Set(value.permanent.map(campaignCardKey)).size!==value.permanent.length)return null;
    if(!Array.isArray(value.rewards)||value.rewards.length>stage)return null;
    const loot=value.loot;
    if(status==='reward'){
      if(!loot||!Array.isArray(loot.unlocked)||!loot.unlocked.every(building)||new Set(loot.unlocked).size!==loot.unlocked.length||!Array.isArray(loot.cards)||!loot.cards.every(card)||new Set(loot.cards.map(campaignCardKey)).size!==loot.cards.length)return null;
    }else if(loot!==null)return null;
    const clean=c=>({id:c.id,kind:c.kind,...(c.rarity?{rarity:c.rarity}:{}),count:c.count});
    return {...newCampaignRun(race,seed,rules.basics),stage,status,starters:Object.fromEntries(Object.entries(value.starters).map(([id,b])=>[id,{level:b.level,branch:b.branch}])),permanent:value.permanent.map(clean),rewards:value.rewards.slice(),loot:loot?{unlocked:[...loot.unlocked],cards:loot.cards.map(clean)}:null,results:Array.isArray(value.results)?value.results.slice(0,5).filter(x=>Number.isFinite(x?.time)&&x.time>=0).map(x=>({time:x.time})):[],...(value.migrated?{migrated:true}:{})};
  }catch{return null;}
}
