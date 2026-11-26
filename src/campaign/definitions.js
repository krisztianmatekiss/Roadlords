export const CAMPAIGN_SCHEMA = 1;
export const CAMPAIGN_SAVE_KEY = 'roadlords:campaign:v1';
export const CAMPAIGN_LENGTH = 5;
export const CAMPAIGN_RACES = ['human', 'orc', 'undead'];
export const LEGACY_RELIC_IDS = ['specialization', 'wide_choice', 'double_choice', 'strategic_superiority', 'full_garrison_economy'];

export const EXTRA_RELICS = [
  {id:'campaign_supplies',name:'Hadjárati készletek',icon:'▣',description:'Minden harcot 50%-kal több kezdőnyersanyaggal kezdesz.',art:'full_garrison_economy'},
  {id:'campaign_blueprints',name:'Felderített lehetőségek',icon:'⌘',description:'A négy kezdő épületválasztásban +2 lap közül választhatsz.',art:'wide_choice'},
  {id:'campaign_pathfinder',name:'Kincskereső térkép',icon:'◇',description:'Harc végén +1 ereklye közül választhatsz.',art:'strategic_superiority'},
];

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
  const relics=['specialization','wide_choice','double_choice','full_garrison_economy','campaign_supplies','campaign_blueprints'];
  for(let stage=0;stage<4;stage++) {
    const races=CAMPAIGN_RACES.filter(r=>stage<2||out[stage-1].race!==r||out[stage-2].race!==r);
    const race=pick(races),profile=pick(CAMPAIGN_PROFILES[race]),remaining=[...relics],rewards=[];
    for(let n=0;n<(stage===0?0:stage===3?2:1);n++)rewards.push(remaining.splice(Math.floor(random()*remaining.length),1)[0]);
    out.push({...profile,race,seed:Math.floor(random()*0x100000000),level:stage>=2?stage===2?3:4:0,relics:rewards,boss:false});
  }
  out.push({name:'A Vérudvar Ura',race:'undead',building:'und_vampire_castle',branch:'blood_hunt',level:4,seed:Math.floor(random()*0x100000000),relics:['specialization','double_choice'],boss:true});
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
    if(value.schema!==CAMPAIGN_SCHEMA||!CAMPAIGN_RACES.includes(value.race)||!Number.isInteger(value.seed)||value.seed<0||value.seed>0xffffffff||!Number.isInteger(value.stage)||value.stage<0||value.stage>=CAMPAIGN_LENGTH||!statuses.includes(value.status))return null;
    for(const key of ['relics','offers'])if(!Array.isArray(value[key])||value[key].length>validIds.size||new Set(value[key]).size!==value[key].length||!value[key].every(id=>validIds.has(id)))return null;
    if(value.relics.length!==value.stage||value.status==='complete'&&value.stage!==4||value.status==='reward'&&(value.stage===4||!value.offers.length||value.offers.some(id=>value.relics.includes(id))))return null;
    return {...newCampaignRun(value.race,value.seed),stage:value.stage,status:value.status,relics:[...value.relics],offers:value.status==='reward'?[...value.offers]:[],results:Array.isArray(value.results)?value.results.slice(0,5).filter(x=>Number.isFinite(x?.time)&&x.time>=0).map(x=>({time:x.time})):[]};
  }catch{return null;}
}
