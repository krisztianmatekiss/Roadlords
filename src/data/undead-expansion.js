export const UNDEAD_EXPANSION = [
  {id:'und_death_mend',name:'Lélekörökség',kind:'normal',description:'Saját egység harci halálakor a legközelebbi élőhalott 5% Max HP-t gyógyul. Idézettek is számítanak.'},
  {id:'und_soul_might',name:'Lélekhatalom',kind:'legendary',repeatable:true,description:'Minden 1000 tárolt Lélek után +1% sebzés az élőhalottaknak.'},
  {id:'und_home_march',name:'Síri menet',kind:'normal',description:'Élőhalottaid +10% mozgási sebességet kapnak a saját térfélen.'},
  {id:'und_siege_force',name:'Holtak ostroma',kind:'normal',description:'Élőhalottaid +10% sebzést okoznak az ellenséges tornyoknak és fővárosnak.'},
  {id:'und_spawn_ward',name:'Lélekpáncél',kind:'normal',description:'Élőhalottaid 8% Max HP-nak megfelelő pajzzsal jelennek meg. Idézettek is megkapják.'},
  {id:'und_rise_skeleton',name:'Csontok ébredése',kind:'legendary',description:'Harcban elesett élőhalottaid 25% eséllyel Csontvázként támadnak fel.'},
  {id:'und_rise_archer',name:'Síron túli íjászok',kind:'legendary',description:'Harcban elesett élőhalottaid 25% eséllyel Csontváz Íjászként támadnak fel.'},
  {id:'und_death_chain',name:'Halálkaszkád',kind:'legendary',description:'Ellenség halálakor a legközelebbi másik ellenség 20% Max HP-t sebződik. Halálával a lánc folytatódik.'},
  {id:'und_twin_training',name:'Kettős ébredés',kind:'legendary',description:'Minden kiképzett élőhalott 30% eséllyel egy ingyenes, azonos egységet is ad.'},
  {id:'und_army_leech',name:'Életszüret',kind:'legendary',description:'Minden élőhalott +20% életlopást kap.'},
  {id:'und_first_guard',name:'Túlvilági oltalom',kind:'legendary',description:'Minden élőhalott teljesen kivédi az első rá mért támadást.'},
  {id:'und_raise_enemy',name:'Lélekbitorlás',kind:'legendary',description:'A harcban megölt ellenségek 20% eséllyel a te oldaladon támadnak fel, eredeti típusukként, 50% HP-val.'},
].map(o=>({...o,scope:'Általános',icon:'☠',race:'undead',expansion:true}));
export const UNDEAD_EXPANSION_IDS = new Set(UNDEAD_EXPANSION.map(o=>o.id));
