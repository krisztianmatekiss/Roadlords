import { WORLD_UNITS_PER_METRE } from '../world/measurements.js';

export const UNDEAD_TERRITORY = Object.freeze({
  radius: 8 * WORLD_UNITS_PER_METRE,
  duration: 6,
  maximumIslands: 128,
  towerDamagePerSecond: 60,
  poisonBurstDuration: .7,
});

export const UNDEAD_TERRITORY_UPGRADES = [
  {id:'und_grave_islands', name:'Sírszigetek', scope:'Zombi', description:'Az ellenséges térfélen eleső Zombik 6 mp-re 8 m sugarú saját területet hagynak hátra.'},
  {id:'und_withered_foundations', name:'Elsorvasztott alapok', scope:'Általános', description:'A saját területeden álló ellenséges úttornyok másodpercenként 60 életerőt veszítenek.'},
  {id:'zombie_leg_half_poison', name:'Repedő rothadás', scope:'Zombi', description:'A Zombi egyszer, 50% életerőre csökkenve is kibocsátja halálkori mérgét.'},
  {id:'und_ranged_adaptation', name:'Holtak alkalmazkodása', scope:'Általános', description:'Egységeid minden elszenvedett távolsági találat után +1% Max HP-t kapnak.'},
  {id:'und_fast_poison', name:'Heves méreg', scope:'Általános', description:'Mérgezésed kétszer gyorsabban sebez és fogy el: 1 mp helyett 0,5 mp-enként.'},
].map(o=>({...o,kind:'legendary',icon:'☠',race:'undead',expansion:true}));
