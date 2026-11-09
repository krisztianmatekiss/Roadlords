// Initial playtest values. Specified ability percentages/counts remain separate
// from prices, timers and upkeep so the next balance pass can tune them safely.
export const UNDEAD_CONVERGENCE = Object.freeze({
  provisional: true,
  startingSouls: 280,
  wellPrice: 220, wellUpkeep: 2, wellIncome: [4,8,16,32],
  shadowCooldown: 8,
  borderMetres: [5,10,15,20], borderAmplification: [.05,.1,.15,.2],
  portalUpkeep: [3,2.5,2,1.5], portalIncreaseEvery: 30, portalIncrease: 1,
});
const B=UNDEAD_CONVERGENCE,fmt=n=>n.toLocaleString('hu-HU');
const square=[[0,0],[0,1],[1,0],[1,1]];
const building=(name,shape,souls,upkeep,category,levels,cityArtIndex,extra={})=>({
  name,shape,souls,upkeep,category,levels,cityArtIndex,unique:false,branches:[],
  race:'undead',icon:'☠',description:levels[0],sourceId:'convergence',...extra,
});
export const UNDEAD_CONVERGENCE_BUILDINGS={
  und_border_obelisk:building('Sírhatárkő',[[0,0]],140,.7,'support',
    B.borderMetres.map((n,i)=>`+${n} m saját térfél és +${fmt(B.borderAmplification[i]*100)}% térfélnövelés.`),1),
  und_otherworld_portal:building('Túlvilági portál',square,360,0,'support',
    B.portalUpkeep.map(n=>`Bekapcsolva a kapuból kivonulók a saját térfélhatárra érkeznek. Alapfenntartás: ${fmt(n)} Lélek/mp.`),
    3,{unique:true,description:'Bekapcsolva a kapuból kivonuló egységeket a saját térfélhatárra küldi. Fenntartása működés közben nő.'}),
};
export const UNDEAD_CONVERGENCE_UPGRADES=[
  {id:'vampire_leg_infection',name:'Vérfertőzés',scope:'Vámpír',description:'A Vámpír által megölt ellenség helyén saját Vámpír támad fel 25% HP-val. Az új Vámpír is fertőz.'},
  {id:'ghost_leg_shadow_leap',name:'Árnyékugrás',scope:'Szellem',description:`Sikeres kitéréskor a Szellem a támadó mögé ugrik és visszatámad. Újratöltés: ${B.shadowCooldown} mp.`},
  {id:'vampire_leg_night_predator',name:'Éjszakai ragadozó',scope:'Vámpír',description:'A Vámpírok az első támadásukig sebezhetetlenek, és +20% mozgási sebességet kapnak.'},
  {id:'und_wandering_plague',name:'Vándorló pestis',scope:'Általános',requires:'poison',description:'Mérgezett ellenség halálakor megmaradt méregpontjai a legközelebbi élő ellenségre szállnak. Láncolódhat.'},
  {id:'und_compact_wells',name:'Sűrített lélekkutak',scope:'Általános',requires:'well',description:'A Lélekkutak 1×1 mezőre zsugorodnak. Termelésük és fenntartásuk megfeleződik.'},
].map(o=>({...o,kind:'legendary',race:'undead',icon:'☠',expansion:true}));
