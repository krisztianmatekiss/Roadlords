import { assetUrl } from '../assets/urls.js';
export function initializeUiBuildingLevelCopy(runtime) {
  const copy = {
    keep: '1. szint: +1 fa, kő és élelem/mp; 200 tároló/nyersanyag; 20000 HP; 50 sereglimit, 30 helyőrség; kiengedés 5 egység/mp.',
    lumber: '1. szint: 1 fa/mp. Erdő mellett 2 fa/mp.',
    stonecutter: '1. szint: 1 kő/mp. Kőlelőhely mellett 2 kő/mp.',
    farm: '1. szint: 1 élelem/mp. Termékeny talajon 2 élelem/mp.',
    warehouse: '1. szint: +150 tárolókapacitás minden nyersanyaghoz.',
    guildhouse: '1. szint: +25% termelés a 2 mezőn belüli Favágóknak, Kővágóknak és Farmoknak.',
    market: '1. szint: 1 nyersanyag/mp átváltása 60% hatékonysággal (0,6/mp bevétel). Az útvonal szabadon módosítható.',
    townhall: '1. szint: +50% a 2 mezőn belüli Lakóházak sereglimit-bónuszára.',
    rally: '1. szint: 15 férőhelyes külön tartalék a szomszédos katonai termelőknek. Kiengedéskor +30% mozgás az első támadásig.',
    tavern: '1. szint: a kiengedett egységek első 2 támadása +50% sebzést okoz. A főkapunál és a Gyülekezőtérnél is hat.',
    guardhouse: '1. szint: +20 tartalékkapacitás. Városfalhoz, Gyülekezőtérhez vagy bekötött Őrházhoz kell kapcsolódnia.',
    house: '1. szint: +10 úti sereglimit. A Városháza tovább növelheti.',
    warcenter: '1. szint: Tömegtermelés: +20% gyártási sebesség, +15% költség. Takarékos: −15% költség, +20% képzési idő. Elit: +15% HP és sebzés, +20% költség és képzési idő. Szabad módváltás.',
    armorsmith: '1. szint: a szomszédos katonai termelők egységeinek kezdőpajzsa a maximális HP 30%-a.',
    hospital: '1. szint: 20% eséllyel menti az elesett egységet fél HP-n a főhelyőrségbe. Egységenként egyszer; csak szabad férőhelynél.',
    towercommand: '1. szint: +20% toronysebzés, HP, hatótáv és támadási sebesség. Városonként legfeljebb 1; a lövedékszámot nem növeli.',
    library: '1. szint: választásonként 1 ingyenes újrasorsolás. Csak az aktuális választásra érvényes.',
    mastersguild: '1. szint: 300 másodpercenként ingyen fejleszt egy megépített épülettípust, legfeljebb L3-ig.',
    academy: '1. szint: vásárlásonként +1% sebzés, HP vagy támadási sebesség a szomszédos termelők egységeinek. Irányonként az első ár 30 fa/kő/élelem, majd ×1,5 (felfelé kerekítve).',
    merc_tent: '1. szint: 3 zsoldosajánlat közül bérelhetsz, 1-es kezdő zsoldosszinten. Felső sor: erősebb következő ajánlat; középső: azonos szint; alsó: gyengébb. Automata mód is választható.',
    alchemist: '1. szint: 25–25–25% esély Erő, Életerő vagy Fürgeség főzetére (+20%); 25% főzet nélkül. Szomszédos katonai termelőkre hat, termelőnként 1 kunyhó. A főzetek állandók.',
    orc_work: '1. szint: 1 fa és 1 kő/mp. Erdő mellett dupla fa, kőlelőhely mellett dupla kő.',
    orc_hunt: '1. szint: 0,5 élelem/mp. Városfal mellett +50%, nyitott kapunál további +50%.',
    orc_hut: '1. szint: +20 sereglimit és +20 helyőrségi férőhely.',
    orc_arena: '1. szint: a szomszédos táborok egységei 10% eséllyel veteránok: +50% HP és sebzés. Több Aréna esélye nem adódik össze.',
    orc_overseer: '1. szint: −20% képzési idő a szomszédos táborokban; egységeik 80% HP-val indulnak. Több tábor bónusza nem adódik össze.',
    orc_altar: '1. szint: 100 áldozati pont után 12 másodpercig 25% életlopás a seregnek. A szomszédos táborok egységeit áldozza fel; Troll: 4 pont.',
    orc_totem: '1. szint: 500 halálpont után 1 legendás választás, legfeljebb 4 lapból. Saját elesett és feláldozott egységek: 1 pont; Troll: 4 pont.',
    orc_slave: '1. szint: minden 20 legyőzött ellenség után tartósan +0,1 fa és +0,1 kő/mp. Fejlesztéskor a korábbi ölések is számítanak.',
    orc_raider: '1. szint: nyitott kapunál minden elkészült katona 5% eséllyel ingyen Ork Harcost hív. Az erősítés nem hív további erősítést.',
    orc_tunnel: '1. szint: 1 mezős hatótáv. Az érintett táborok egységei a legelőrébb álló saját toronynál jelennek meg, zárt kapunál is. A sereglimit érvényes; torony nélkül normál útvonal.'
  };
  const base = runtime.makeCity('player');
  for (const [key, d] of Object.entries(runtime.BUILDINGS)) {
    if (copy[key]) d.description = copy[key];else if (d.unit) {
      const time = runtime.previewTrainingTime(base, key, 1);
      d.description = `1. szint: ${runtime.UNITS[d.unit].name} képzése ${String(Number(time.toFixed(2))).replace('.', ',')} másodpercenként. ` + d.description;
    }
  }
}
