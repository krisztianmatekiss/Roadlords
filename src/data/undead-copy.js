// Player-facing text. The original faction workbook stays archived unchanged.
const fmt = (n) => String(n).replace('.', ',');
export const UNDEAD_BUILDING_COPY = {
  keep: {
    description: 'Fővárosod. Lelket és sereghelyet ad. Ha elpusztul, veszítesz.',
    levels: [0, 1, 2, 3].map((i) =>
      `${[2000, 4000, 8000, 16000][i]} életerő; +${[3, 6, 12, 24][i]} Lélek/mp; ${[50, 100, 200, 400][i]} sereghely; kapu: ${[5, 10, 20, 40][i]} egység/mp.`),
    branches: [
      'Saját épület pusztulásakor 10 ingyenes egység érkezik a kapuhoz. Típusukat a feloldott katonai épületeid közül sorsolja.',
      'Minden 100 tárolt Lélek a félpálya hosszának 1%-ával növeli saját térfeledet. Legfeljebb az ellenfél kapujáig; a készlet csökkenésével visszahúzódik.',
    ],
  },
  und_well: {
    description: 'Folyamatosan Lelket termel.',
    levels: [1, 2, 4, 8].map((n) => `+${n} Lélek/mp.`),
  },
  und_crypt: {
    description: 'Növeli a sereg létszámkorlátját.',
    levels: [20, 30, 40, 80].map((n) => `+${n} sereghely.`),
  },
  und_graveyard: {
    description: 'Csontvázakat képez. A Csontváz Íjász ereklyével íjászokat is adhat.',
    branches: [
      'Legalább 3 szomszédos Temető mellett elit Csontvázakat képez: +50% életerő és sebzés.',
      'Képzésenként 2 Csontváz készül, 1 áráért.',
    ],
  },
  und_morgue: {
    description: 'Zombikat képez. Halálukkor megmérgezik a közeli ellenségeket.',
    branches: [
      'A Zombik másodpercenként 2 méregpontot adnak a 30 hatótávon belüli ellenségeknek. A halálukkor okozott méreg megmarad.',
      'Minden harcban elesett Zombi helyén 1 saját Csontváz jelenik meg.',
    ],
  },
  und_ghost_spawner: {
    description: 'Szellemeket képez. Kitérésükkel elkerülhetik a támadásokat.',
    branches: [
      'A Szellemek áthaladnak az ellenséges egységeken, és a hátsó távolságiakat támadják. A tornyokat nem kerülik meg.',
      'Kitéréskor a Szellem a kivédett sebzés 50%-át visszaadja a támadónak.',
    ],
  },
  und_necro_spawner: {
    description: 'Nekromantákat képez. Idézett egységeik nem foglalnak sereghelyet.',
    branches: [
      'A Nekromanták idézett egységei nem tűnnek el idővel. Az idézett Szellemekre is hat.',
      'A Nekromanták 3 helyett 5 egységet idéznek, továbbra is 10 mp-re. Az idézést erősítő ereklyével 6-ot.',
    ],
  },
  und_vampire_castle: {
    description: 'Vámpírokat képez. Sebzésük egy részéből visszagyógyulnak.',
    branches: [
      'A Vámpír életlopása a legközelebbi sérült szövetségest is gyógyítja, az elszívott életerő 50%-ával.',
      'Ölés után a Vámpír egy 120 hatótávon belüli ellenségre ugrik, és ingyen támad. Újabb öléssel folytathatja.',
    ],
  },
  und_lich_spawner: {
    description: 'Licheket képez. Sugaruk idővel egyre erősebben sebez, és gyógyítja őket.',
    branches: [
      'Ha a sugár megöli célpontját, új, hatótávon belüli ellenségre ugrik. Megtartja a felhalmozott sebzését.',
      'A sugár másodpercenként további 5%-kal lassítja a célpont mozgását és támadását. A lassítás a kapcsolat végén megszűnik.',
    ],
  },
  und_dark_tower: {
    description: 'A saját térfeleden legelőrébb járó ellenséget sebzi. Minden további torony 25%-kal növeli az összes Sötét Őrtorony alapfenntartását.',
    levels: [1, 1.5, 2, 3].map((n) => `A saját térfeleden legelöl járó ellenségnek ${fmt(n)}% maximális életerőt sebez másodpercenként.`),
  },
  und_soul_harvester: {
    description: 'Minden harcban elesett ellenség után Lelket ad, bárhol a csatatéren.',
    levels: [1, 2, 3, 4].map((n) => `+${n} Lélek minden harcban elesett ellenségért.`),
  },
  und_soul_bank: {
    description: 'Hitelt ad és kamatot fizet. Adósságból építhetsz és fenntarthatsz, de a katonaképzés és a kamat szünetel.',
    levels: [200, 300, 400, 1000].map((n, i) => `${n} Lélek hitelkeret; pozitív készletre ${[10, 12, 15, 20][i]}% kamat percenként. Adósságnál nincs képzés vagy kamat.`),
  },
  und_soul_anchor: {
    description: 'Csökkenti a közeli épületek fenntartását. Önmagára nem hat; több horgonyból csak a legerősebb számít.',
    levels: [1, 2, 3, 3].map((n, i) => `A ${n} mezőn belüli épületek fenntartása ${i === 3 ? 90 : 50}%-kal olcsóbb. Csak a legerősebb hat.`),
  },
  und_soul_burner: {
    description: 'Gyorsan termel Lelket, de idővel elpusztul.',
    levels: [2, 3, 4, 8].map((n, i) => `+${n} Lélek/mp, de másodpercenként ${i === 3 ? 2 : 1}% épséget veszít. ${i === 3 ? 50 : 100} mp után elpusztul.`),
  },
  und_bone_forge: {
    description: 'Elesett Csontvázaid után ingyenes Zombit ad. A harcban megölt idézetek is számítanak, az idővel eltűnők nem.',
    levels: [10, 8, 6, 4].map((n) => `Minden ${n}. harcban elesett saját Csontváz után 1 ingyenes Zombi.`),
  },
  und_plague_chamber: {
    description: 'Egységeid találatai mérgeznek, a méreg erősebben sebez. Több Pestiskamra hatása összeadódik.',
    levels: [10, 20, 30, 40].map((n, i) => `Találatonként +${i === 3 ? 2 : 1} méregpont; +${n}% méregsebzés.`),
  },
  und_soul_overdrive: {
    description: 'Fokozza a Lélektermelést és a katonaképzést, de háromszorozza az épületfenntartást. A Nekropoliszra nem hat.',
    levels: [100, 125, 150, 200].map((n) => `+${n}% Lélektermelés és képzési sebesség, de 3× épületfenntartás. A Nekropoliszra nem hat.`),
  },
  und_corrupted_hatchery: {
    description: 'Gyorsítja a közeli katonaképzést. Az egységek fél életerővel indulnak, de teljesen gyógyíthatók. Csak a legerősebb Keltető hat.',
    levels: [40, 60, 80, 100].map((n) => `Az 1 mezőn belüli táborok ${n}%-kal gyorsabban képeznek, de az egységek 50% HP-val indulnak.`),
  },
  und_rebirth_tomb: {
    description: 'Eséllyel visszahozza elesett egységeidet fél életerővel a helyőrségbe. Egységenként egyszer működik.',
    levels: [25, 30, 40, 50].map((n) => `${n}% eséllyel visszahozza az elesett egységet 50% HP-val a helyőrségbe. Egységenként egyszer.`),
  },
  und_garden_of_dead: {
    description: 'A saját térfeleden elesett ellenségeket 10% eséllyel saját egységként támasztja fel a haláluk helyén.',
    levels: ['Csontváz', 'Szellem', 'Zombi', 'Vámpír vagy Lich'].map((name) => `A saját térfeleden elesett ellenséget 10% eséllyel feltámasztja. Egység: ${name}.`),
    branches: [
      'A saját térfeleden elesett ellenségek 10% eséllyel saját Vámpírként támadnak fel.',
      'A saját térfeleden elesett ellenségek 10% eséllyel saját Lichként támadnak fel.',
    ],
  },
};

export const UNDEAD_UPGRADE_COPY = {
  gen_soul_frugal: 'Az épületek fenntartása 5%-kal olcsóbb.',
  gen_soul_abundance: '+10% Lélekbevétel minden forrásból.',
  gen_graveyard_capacity: '+1 helyőrségi férőhely minden Temetőd után.',
  gen_military_speed: '+5% képzési sebesség minden katonai épületnek.',
  gen_build_discount: 'Az építkezés 5%-kal olcsóbb.',
  garden_chance: 'Holtak kertje: +2 százalékpont feltámasztási esély, legfeljebb 100%.',
  skeleton_common_ranged_res: 'Csontváz: +5 százalékpont távolsági ellenállás. Alap: 25%, maximum: 90%.',
  zombie_common_poison: 'Zombi: halálakor +1 méregpontot okoz. Alap: 4 méregpont.',
  ghost_common_dodge: 'Szellem: +5 százalékpont kitérési esély. Alap: 40%, maximum: 70%; Megfoghatatlannal 80%.',
  necro_common_summon_stats: 'A Nekromanták idézett Csontvázai +10% életerőt és sebzést kapnak.',
  vampire_common_lifesteal: 'Vámpír: +5 százalékpont életlopás. Alap: 30%.',
  lich_common_respawn: 'Lich: halálakor +3 százalékpont eséllyel újjáéled a saját kapunál, teljes életerővel.',
  skeleton_leg_archer: 'A Temetők 50% eséllyel Csontváz Íjászt képeznek Csontváz helyett.',
  skeleton_leg_guard: 'A Csontvázak magukra vonják a 40 távolságon belüli szövetségeseket célzó távolsági fegyveres támadásokat.',
  zombie_leg_retribution: 'A Zombit közelharcban eltaláló ellenség 2 méregpontot kap.',
  zombie_leg_poisoned_hunt: 'A Zombik mérgezett ellenségek ellen +100% sebzést és támadási sebességet kapnak.',
  ghost_leg_intangible: 'Szellem: +20 százalékpont kitérési esély. Új maximum: 80%.',
  ghost_leg_mirror: 'Kitéréskor a Szellem 10 mp-es másolatot idéz. Nem foglal sereghelyet, újabb másolatot nem idéz.',
  necro_leg_siege: 'A Nekromanták a célpontjuk mellé idéznek, alkalmanként +1 egységet. Kísértetidézéssel nem halmozódik.',
  necro_leg_spirits: 'A Nekromanták Csontvázak helyett Szellemeket idéznek, alkalmanként +1-et. Csontostrommal nem halmozódik.',
  vampire_leg_shield: 'A Vámpír életlopásából megmaradó túlgyógyítás korlátlan pajzzsá alakul.',
  vampire_leg_dual: 'A Vámpír egyszerre 2 célpontot támad teljes sebzéssel. Mindkettőből életet lop.',
  vampire_leg_frenzy: 'A Vámpír ölésenként +10% támadási sebességet kap haláláig, korlátlanul.',
  lich_leg_greedy: 'A Lich 5 mp-enként 1 helyett 2 új célpontra kapcsol sugarat.',
  lich_leg_shield: 'A Lichet érő sebzés felét a sugaraival összekötött ellenségek kapják.',
};
