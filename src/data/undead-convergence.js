// Initial playtest values. Specified ability percentages/counts remain separate
// from prices, timers and upkeep so the next balance pass can tune them safely.
export const UNDEAD_CONVERGENCE = Object.freeze({
  provisional: true,
  startingSouls: 280,
  wellPrice: 220, wellUpkeep: 2, wellIncome: [4,8,16,32],
  shadowCooldown: 8,
  bladeBonus: [.01,.02,.03,.05], bladeCost: [1,2,3,4],
  borderMetres: [5,10,15,20], borderAmplification: [.05,.1,.15,.2],
  riftInterval: 45, riftCounts: [4,6,9,18], riftLifetime: [30,40,50,60], riftPrice: [80,120,180,360],
  riftLongCount: 9, riftLongLifetime: 120, riftLongPrice: 180,
  portalUpkeep: [3,2.5,2,1.5], portalIncreaseEvery: 30, portalIncrease: 1,
});
const B=UNDEAD_CONVERGENCE,fmt=n=>n.toLocaleString('hu-HU');
const square=[[0,0],[0,1],[1,0],[1,1]];
const building=(name,shape,souls,upkeep,category,levels,cityArtIndex,extra={})=>({
  name,shape,souls,upkeep,category,levels,cityArtIndex,unique:false,branches:[],
  race:'undead',icon:'☠',description:levels[0],sourceId:'convergence',...extra,
});
export const UNDEAD_CONVERGENCE_BUILDINGS={
  und_soul_blade:building('Lélekpenge',[[0,0]],160,.6,'support',
    B.bladeBonus.map((n,i)=>`Sikeres közelharci találatonként +${fmt(n*100)}% sebzés ${B.bladeCost[i]} Lélekért.`),0),
  und_border_obelisk:building('Sírhatárkő',[[0,0]],140,.7,'support',
    B.borderMetres.map((n,i)=>`+${n} m saját térfél és +${fmt(B.borderAmplification[i]*100)}% térfélnövelés.`),1),
  und_soul_rift:building('Lélekhasadék',square,480,1.5,'military',
    B.riftCounts.map((n,i)=>i<3
      ?`${B.riftInterval} mp-enként ${n} véletlen élőhalottat idéz ${B.riftLifetime[i]} mp-re. Idézés: ${B.riftPrice[i]} Lélek.`
      :`${B.riftInterval} mp-enként ideiglenes élőhalott sereget idéz a saját területedre.`),2,{branches:[
    {id:'rift_horde',name:'Holtak áradata',icon:'☠',description:`${B.riftInterval} mp-enként ${B.riftCounts[3]} véletlen élőhalott ${B.riftLifetime[3]} mp-re. Idézés: ${B.riftPrice[3]} Lélek.`},
    {id:'rift_persistence',name:'Hosszan kísértők',icon:'◷',description:`${B.riftInterval} mp-enként ${B.riftLongCount} véletlen élőhalott ${B.riftLongLifetime} mp-re. Idézés: ${B.riftLongPrice} Lélek.`},
  ]}),
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
