# Fajok átdolgozása – elfogadott döntések

Frissítve: 2026-10-31.

**Megvalósítás: V4.58.0.** A felhasználó jóváhagyta a programozás megkezdését. Az elfogadott változások beépültek; a külön jelölt nyitott balance-kérdések változatlanok. A részletes kiadási állapot: [faction-redesign-4.58.md](../faction-redesign-4.58.md). Ez a fájl az elfogadott döntéseket és a nyitott kérdéseket választja külön; a korábbi auditok és táblázatok javaslatai nem automatikusan elfogadott változások.

## Közös szempontok

- A fajoknak eltérő játékstílusuk legyen. A közös alapmechanikák és az egyszerű HP-/sebzésfejlesztések megengedettek.
- Az elit/veterán állapot minden fajnál létező alapmechanika.
- A felhasználó pontosítása szerint az elit és a veterán ugyanaz az állapot. A külön jelenlegi `veteran` / `undElite` jelölést egységesíteni kell: egy állapot, egy rangjelzés, egyszeri +50% maximális HP és +50% sebzés; több elitforrás nem adhat kétszeres szorzást. A közös játékbeli megnevezés: Elit.
- Egy vagy több L4 megszerzése komoly befektetés; az erős kombináció önmagában nem balance-hiba.
- A kártyák saját hatásukat írják le röviden. A részletes kölcsönhatások a lexikonba kerüljenek.
- A halmozható fejlesztéseknél jelenlegi → következő hatás mutassa a változást.
- Az épület helyfoglalása, ára, előfeltételei és a kombináció elérhetősége együtt számítanak.
- Az áttekintés csak konkrét problémákra koncentráljon. A rendben működő épületeket nem kell egyenként újratervezni vagy a felhasználóval jóváhagyatni.

## Emberek – elfogadott változások

### Törlések

- Hadi kórház (`hospital`). A feltámasztási mechanika az élőhalottaknál marad.
- Őrségparancsnokság (`towercommand`).
- Alkimista kunyhó (`alchemist`) az emberi készletből. Orkokhoz átkerülése nincs eldöntve.
- Akadémia (`academy`).
- A törölt épületek saját fejlesztései és L4 ágai is törlendők. Más épületen működő, hasonló mechanikájú lap nem válik ettől automatikusan törlendővé.
- Új Fegyverkovács nem kerül be.

### Városháza (`townhall`)

- Egyedi, 2×2 mezős épület.
- A hatókörben lévő támogató épületek hatása kétszer érvényesül.
- L1: 1 mezős körzet; L2: 2 mező; L3: 3 mező; L4: az egész saját város.
- L4-en nincs külön ágválasztás.
- Értelmezés: mintha ugyanaz a hatás kétszer lenne leírva. A feltétel és az időzítés változatlan, az eredmény kétszeres.
- Kocsma: első 6 támadás +150% helyett első 6 támadás +300%, nem 12 támadás.
- Mesterek Céhe: ugyanazon időközönként két fejlesztés, nem felezett időköz.
- Könyvtár: két ingyenes újrasorsolás egy helyett; az L4 tiltáskor adott commonból két példány egy helyett.
- Haditanács kivétel: nem erősíti. Saját magát sem erősíti rekurzívan.

### Piac (`market`)

- Egyedi, 2×2 mezős épület marad.
- A tárolókorlát miatt egyébként elvesző termelési többletet automatikusan másik, szükséges nyersanyagra váltja.
- L1 átváltás: 2 beadott → 1 kapott; L4: 1 beadott → 2 kapott.
- Tárolókapacitás: L1 +50%, L2 +100%, L3 +150%, L4 +200%.
- A kapacitásbónusz a főépületből és raktárakból származó tárolásra vonatkozik.
- Az átváltásból kapott nyersanyag nem indíthat újabb automatikus átváltási láncot.
- Megvalósítás: L2 1:1, L3 1:1,5; a célválasztás az utánpótlási hiányt és a tároló telítettségét figyeli. A régi L4 ágak megszűntek.

### Kocsma (`tavern`)

- Nem egyedi; több is építhető.
- Az oldalszomszédos katonai termelőkből érkező egységekre hat.
- Több Kocsma hatása ugyanazon termelőn nem adódik össze.
- L1: első 2 támadás +100% sebzés.
- L2: első 3 támadás +125% sebzés.
- L3: első 4 támadás +150% sebzés.
- L4: első 6 támadás +150% sebzés.
- A bónusz a támadások elhasználásáig tart, nem jár le az úton.
- A Városháza a sebzésbónuszt duplázza, a támadások számát nem.
- A korábbi L4 ágak helyett ez a szintenkénti fejlődés marad.

### Kaszárnya (`barracks`)

- Az L4 lovasképző ág megmarad.
- Istállóval oldalszomszédosan Lovagot képez Kardos helyett, 30%-kal kisebb képzési sebességgel.
- Ez csak a Lovag képzésének lassítása; képzési időben 1 / 0,7, azaz körülbelül +42,86%.
- Szomszédos Istálló nélkül továbbra is Kardost képez.
- A másik L4 ág, a két fizetett Kardost képző Sorozás nem változik e döntéssel.

### Lándzsás és Lándzsás őrség (`spearman`, `spearhall`)

- Új alappasszív: +100% sebzés lovasság és ostromfegyver ellen, tehát kétszeres sebzés. A Troll is ostromfegyvernek számít.
- Ez leváltja a jelenlegi +150%-os lovasság/nehéz célpont elleni alapbónuszt.
- A hatótávos common helyett: felvételenként −5 százalékpont közelharcból kapott sebzés; maximum −75%. Távolsági támadásokra nem vonatkozik.
- A két új L4 ág leváltja a jelenlegi Pikafal és Dárdazápor hatásait, nem azok mellé kerül.
- **Bástyaőrség:** +100% életerő. Harc közben nem lökhető el, és az ellenség nem haladhat át rajta. Saját egységek továbbra is áthaladhatnak; az ellenfél megkerülheti.
- **Nyársalók:** a döfés az első célpont mögött, keskeny vonalban álló legfeljebb két további ellenfelet is eltalál, 50% sebzéssel. Közelharci támadás marad.
- Beépítés előtt a megmaradó Falanksz legendással való kölcsönhatást is tisztázni kell; a régi L4 bónuszok nem maradhatnak rejtve aktívak.

## Emberek – még nyitott, nem elfogadott módosítások

1. Gyülekezőtér: 2×2 helyért az L1-es 15 tartalékhely kevés; új érték vagy működés még nincs kiválasztva.
2. Szélsőséges mozgásisebesség-kombinációk: később külön áttekintendők.
3. Ostromműhely és L4 ágai: később részletesen áttekintendők.
4. A Piac köztes átváltási arányai és a Városháza jogosult célpontjainak teljes listája.
5. Az átalakított épületekhez kapcsolódó legendások, különösen Kocsmalánc és Hadjárati lakoma.
6. A különböző kezdőpajzsok jelenleg maximumot vesznek, nem összeadódnak; Páncélkovács és Rohamőrség együttműködésének felülvizsgálata.
7. Mesterek Céhe: ha már nincs fejleszthető L1/L2 épülettípus, a hatás elfogy; további működéséről nincs döntés.

## Orkok – elfogadott változások

### Hajcsárok tábora (`orc_overseer`)

- A Könyörtelen hajszolás L4 ág egy állítható csúszkát old fel az épület saját kezelőablakában.
- Az egyik végpont: −40% képzési idő, 80% induló HP; a másik: −80% képzési idő, 25% induló HP.
- A köztes értékek folyamatosan, lineárisan változnak: középállásban −60% képzési idő és 52,5% induló HP.
- A maximális HP változatlan, csak az induló aktuális HP csökken. Az egységek ára továbbra is teljes.
- A hatás a szomszédos termelőkre vonatkozik, ahogy az épület alaphatása.
- Egy képzési ciklus elején a képzési idő és a hozzá tartozó induló HP együtt rögzül. A csúszka átállítása a már futó ciklust nem módosítja.
- Csak ez az egy L4 fejlesztés marad; nincs második ág. A Vérszívó horda ág és annak globális +8% életlopása kikerül.

### Fosztogatók tábora (`orc_raider`)

- Csak a Szörnyhorda L4 fejlesztés marad; a Hordaözön ág kikerül.
- L4-en az erősítés hívásának esélye 12%-ról 20%-ra nő minden jogosult fizetett kiképzés után.
- Az erősítés 8% eséllyel Troll; egyébként a jelenlegi Harcos/Dühöngő/Warglovas választás marad. A 8% az erősítéseken belüli arány, nem minden kiképzésre külön Troll-esély.
- Sikeres híváskor egy ingyenes egység érkezik, nem kettő. Az ingyenes erősítés nem hív további erősítést.
- A nyitott kapu feltétele, az épület 2×2-es mérete, egyedisége és L1–L3 működése változatlan. Átnevezésről nincs elfogadott döntés.

### Rabszolgatábor (`orc_slave`)

- Csak a Kényszermunka L4 fejlesztés marad, külön ágválasztás nélkül.
- L4-en megmarad a minden 20 összegyűjtött ellenséges ölés után járó +0,4 fa és +0,4 kő/mp, mellé +0,2 élelem/mp jár ugyanennyi ölésért.
- A Kíméletlen hajcsárok ág és a szomszédos Munkatáboroknak/Vadászházaknak adott +50% termelése kikerül.
- Az alapműködés és az L1–L3 értékei változatlanok. Termelési korlátról, az ölések súlyozásáról vagy más balance-változásról nincs elfogadott döntés.

### Aréna (`orc_arena`)

- A szomszédos katonai termelők veteránképzési esélye: L1 20%, L2 30%, L3 40%, L4 60%.
- Csak egy egyszerű L4 fejlesztés marad, ágválasztás nélkül. A korábbi 40%-os Veteránok serege és a halmozódó Harci akadémiák ág helyébe a 60%-os L4 lép.
- Egy termelő csak egy Aréna bónuszát kapja. Több szomszédos aktív Aréna esetén a legerősebb hat; az esélyek nem adódnak össze, és nincs Arénánként külön veterándobás.
- A veterán állapot továbbra is +50% maximális HP-t és +50% sebzést ad. A 2×2-es méret és a több példány építhetősége változatlan.

### Ősök Toteme (`orc_totem`)

- Saját halálesetek és áldozati pontok helyett megölt ellenséges egységeket számol. Egy ellenséges egység egy ölésnek számít, a Troll is.
- Minden 300/260/220/160 megölt ellenség után egy normál jutalomválasztást ad L1/L2/L3/L4 szinten. A szokásos választási rendszer sorsolja, hogy gyakori fejlesztés, épület/épületfejlesztés vagy legendás legyen; a jutalom nem garantáltan legendás.
- A játékosnak mutatott számláló és leírás megölt ellenségekről szól, nem halálpontokról.
- Saját egység halála vagy feláldozása nem növeli az új számlálót.

### Vadászház (`orc_hunt`)

- L1 alap élelemtermelése 0,5-ről 0,75/mp-re nő.
- A fal melletti és kapuhoz kötött termelési bónusz változatlan. L2–L4 új alapértékeiről nincs külön döntés, ezért azokat ez a feljegyzés nem módosítja.

### Ork főépület (`keep`), Hadúr parancsa (`orc_command`)

- Az L4 Hadúr parancsa ág hatása: a főváros maximális HP-ja ×2, a város teljes helyőrségi kapacitása +100%, a kapuálláshoz kötött bónuszok a kapu állásától függetlenül aktívak.
- A HP-duplázás a fővárosra vonatkozik, nem az egységekre. A jelenlegi 160 000-es L4 alap HP-val ez 320 000 HP.
- A kapu továbbra is vezérelhető: az állapotfüggetlen bónusz nem kényszeríti nyitva a kaput, és nem engedi automatikusan ki a helyőrséget.
- Ez az orc_command ág cseréje; az Örök hódítás másik L4 ágáról nem született új változtatási döntés. Új ágnév nincs kiválasztva.

### Kunyhó (`orc_hut`)

- L1 +25 sereghely és +25 helyőrségi férőhely.
- L2 +35 sereghely és +35 helyőrségi férőhely.
- L3 +50 sereghely és +50 helyőrségi férőhely.
- L4 +75 sereghely és +75 helyőrségi férőhely.
- A méret és az egyéb működés változatlan. Az érintett kapacitásfejlesztéseknek, kijelzéseknek és az AI-nak is ezekkel az új alapértékekkel kell számolniuk.

### Wargkarám (`orc_warg`), Csordaszellem (`pack`)

- Minden közeli másik Warglovas +2% helyett +1,5% mozgási és támadási sebességet ad.
- A hatókör és a többi működés változatlan. Felső korlát bevezetéséről nincs elfogadott döntés.

### Kapcsolódó legendás törlése

- Az Ellenségvér az ősöknek (`orc_enemy_ancestors`) törlendő. Az új Totem eleve ellenséges ölésekből működik, ezért a korábbi legendás hatás feleslegessé vált.

## Orkok – az épületkör állapota

- Az első ork épületkört a felhasználóval lezárjuk, és áttérünk az élőhalottakra. Az elfogadott változások a V4.58.0-ban megvalósultak.
- Ez nem jelenti a teljes gyakori/legendás készlet vagy a külön egységképességek véglegesítését.

### Még nyilvántartott kérdések

- Áldozati oltár: a lezárt ork csomagban törölve. Korábbi állapota: Jelenleg 2×2-es egyedi épület, a szomszédos termelők egységeit áldozza fel; 100/90/75/50 pontonként 12 másodpercig +25% életlopást ad a seregnek. Nincs külön L4 ágválasztása.
- A katonai termelők további L4 ágai és a teljes gyakori/legendás kínálat még nem lett egyenként véglegesítve; az épületek fenti módosításai nem jelentik az egész ork tartalom lezárását.

## Élőhalottak – elfogadott változások és nyitott kérdések

- A jelenlegi készlet 18 épületet tartalmaz a Nekropolisszal együtt.
- Az épületeket egyenként tekintjük át. A meglévő Lélek-gazdaság, fenntartás, feltámasztás/idézés és területmechanika együtt számít.

### Rontott Keltető (`und_corrupted_hatchery`)

- Új alaphatás: +40% képzési sebesség az érintett katonai termelőknek, de 20% eséllyel a kívánt egység helyett Csontváz készül. A Csontváz nem plusz egység.
- Temetőkre nem hat. Egy szomszédos Temető jelenléte nem tiltja le a Keltető többi termelőre kifejtett hatását.
- A korábbi fél HP-val induló egységek mechanikáját ez a csere váltja le. A felvetett +50%-os gyorsítás / 30%-os Zombi-csere változat elvetve.
- Elfogadott szintsor, képzési sebesség / Csontvázra cserélés esélye: L1 +40% / 20%; L2 +60% / 25%; L3 +80% / 30%; L4 +100% / 35%.
- Egyetlen L4 fejlesztés marad, külön ágválasztás nélkül.
- Megvalósítás: a Csontváz az eredeti egység áráért készül, így megmarad a gyorsítás gazdasági kockázata.

### Csontkohó (`und_bone_forge`) – változatlanul marad

- Jelenleg kétmezős, több példányban építhető. Fenntartása épületenként 0,91 Lélek/mp.
- L1/L2/L3/L4 szinten minden 10./8./6./4. harcban elesett saját Csontváz után egy ingyenes Zombit ad. A Csontváz íjász és a harcban megölt idézett Csontváz is beleszámít, az idővel eltűnő nem.
- Minden Csontkohó külön jutalmaz ugyanabból a haláleseti számlálóból, tehát több azonos szintű épület ugyanakkor több Zombit ad. A felhasználó ezt változatlanul megtartja, a több épületből származó halmozódással együtt.

### Lélekarató (`und_soul_harvester`) – törlés

- Az épület kikerül a játékból. A kizárólag hozzá tartozó lapokat, leírásokat, előfeltételeket és AI-építési javaslatokat is ki kell vezetni.
- Más Lélektermelő épület vagy általános bevételfejlesztés nem válik ettől automatikusan törlendővé.

### Sötét Őrtorony (`und_dark_tower`)

- Szintenként eggyel több különböző ellenséget támad: L1 1, L2 2, L3 3, L4 4 célpont.
- A szintenkénti meglévő sebzés, a saját térfél feltétele és a több toronyhoz kötött fenntartás változatlan.
- Konkrét jelenlegi célzási hiba a `undead/combat.js` toronyciklusában: az összes torony közösen előre kiválaszt egy célpontot. Ha azt egy korábbi torony megöli, a későbbiek a halott célpont miatt kihagyják azt a sebzési kört, nem keresnek másik élő ellenfelet. A többcélpontos működés beépítésekor ezt is javítani kell.

### Nekropolisz (`keep`) – új L4 ágak tervezése

- A felhasználó új L4/1 hatása: minden térfélnövelési hatás és minden kifejezetten saját térfélhez kötött hatás kétszeresen érvényesül.
- Példák: a felvetett új, +12 méter saját térfelet adó common +24 métert adna; a Sötét Őrtorony 1% Max HP/mp sebzése 2%-ra nőne; a Holtak kertjének feltámasztási esélye duplázódna.
- A saját térfélen működő mozgásbónusznál a bónusz duplázását értjük, például +10% helyett +20%-ot, nem a teljes alapmozgás kétszerezését. Ez az általános értelmezés a kártyák pontosításánál még ellenőrizendő.
- A +12 méteres common új lapként felvetve; részleteit még véglegesíteni kell. A régi, tárolt Lélekhez kötött L4 térfélnövelés nem maradhat rejtetten a lecserélt ág része; esetleges megtartásának vagy áthelyezésének módja külön döntés.
- Elfogadott L4/2 (Elit légió): épületfenntartás ×2, a termelőkből érkező egységeknél 50% elit esély. Idézettekre és feltámasztottakra ez az ág nem hat.
- Új, önálló legendás: Kiválasztott holtak. +20 százalékpont elit esély minden új egységre, az idézettekre és feltámasztottakra is. Nincs főépület- vagy termelőépület-előfeltétele; nem halmozható.
- Együtt a termelőkből érkezők 70%, az idézettek/feltámasztottak 20% esélyt kapnak. Egy már elit egység nem kap újabb elitbónuszt.
- A +12 méteres common Terjeszkedő sírok néven bekerült, halmozható; az új területi L4 duplázza. A határjelölő ugyanahhoz az egyetlen közös határhoz igazodik, két egymás melletti csapatszínű vonallal.
- A Csontkolosszus javaslat elvetve. Az Életrontás és Síri csend ötletek nem Nekropolisz-L4-ként kerülnek tovább; más fejlesztéshez később visszavehetők, de még nem elfogadott játékelemek.

### Vámpír (`und_vampire`) – tervezett HP-emelés

- A jelenlegi alap maximális HP 300. A felhasználó legalább kétszeresére kívánja emelni, tehát az új alap HP legalább 600 legyen.
- Megvalósítás: 600 alap HP. Ez alap HP-emelés, nem az elit állapot módosítása; 600 alap HP esetén az egyszeri +50%-os elitbónusz önmagában 900 HP-t adna.

### Nekropolisz – lecserélendő korábbi ág: Halálosztag (`death_squad`)

- Jelenleg saját épület elvesztéséért 10 ingyenes egységet ad a feloldott katonai típusokból.
- A kód a kézi bontáskor is meghívja ezt: `undead/economy.js` → `demolish` → `undBuildingLost`. Így olcsó épületek ismételt felépítésével és bontásával kiképzés nélkül vásárolható sok véletlen egység, köztük feloldott elit típusok. A szokásos bontási visszatérítés is megmarad.
- Az L4 kikerült; a fenti két új ág váltja. Nem szabad feltételezni, hogy egyszerűen az ellenség által lerombolt városi épületekre szűkíthető: a jelenlegi harcban ennek tényleges elérhetőségét külön tisztázni kell.
- A felhasználó a többi épület után most elővette a Nekropoliszt; mindkét új L4 ágat véglegesítette.

## Új ötlet – külön egységképességek, még nincs végleges terv

- A felhasználó felvetése: az alaptámadás mellett újratöltési idővel működő külön képességek, akár legendás fejlesztésből feloldva. Példája a Vámpír hipnotizálása.
- Univerzális, többféle egységre kiosztható képességek is felmerültek.
- A konkrét hatások, értékek, feloldási szabályok és a képességek száma még nincsenek elfogadva. A meglévő papi gyógyítás az automatikus képességhasználat példája; a bővítésnél a nagy seregek teljesítményét és a multiplayer működését is meg kell őrizni.

## Következő lépések

1. Ork épületek, L4 ágak és kapcsolódó fejlesztések: egyenként, mindig az aktuális hatást is kiírva.
2. Élőhalott épületek, L4 ágak és kapcsolódó fejlesztések ugyanezzel a módszerrel.
3. Nyitott emberi és fajok közötti kölcsönhatások lezárása.
4. Csak ezután közös implementáció, leírások/lexikon/előfeltételek/AI frissítése és a módosításokhoz szükséges ellenőrzés.
