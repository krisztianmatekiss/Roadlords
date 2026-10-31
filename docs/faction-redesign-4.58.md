# V4.58.0 – Fajok és területek

Az elfogadott tervezési döntések megvalósítása. Az egységek külön aktív képességei még csak ötletek, nem részei ennek a verziónak.

## Emberek

- Kikerült: Hadi kórház, Őrségparancsnokság, Alkimista kunyhó, Akadémia, valamint a kizárólag hozzájuk tartozó fejlesztések.
- Városháza: támogató hatások kétszeresen, L1–L3-on 1/2/3 mezős körben, L4-en városszerte. A Haditanács és maga a főépület kivétel. A Kocsma nyitó sebzése duplázódik, nem a támadásszám; a Könyvtár választásonként két adag ingyen újrasorsolást ad; a Mesterek Céhe változatlan időközönként két fejlesztést ad. A pajzsok, a kovácsműhely hátránya, az Őrház- és házkapacitások is ugyanazt a támogatói szorzót követik.
- Piac: valódi termelési túlcsordulást vált át szükséges nyersanyagra, átváltási lánc nélkül. L1–L4: 1 beadott → 0,5/1/1,5/2 kapott; teljes tárolókapacitás +50/+100/+150/+200%. A köztes arányok egyenletes fejlődést adnak az elfogadott végpontok között.
- Kocsma: nem egyedi, csak oldalszomszédos termelőkre hat. Első 2/3/4/6 támadás +100/+125/+150/+150% sebzés. Az utazás nem fogyasztja el. Több Kocsma nem halmozódik. Az elavult Kocsmalánc kikerült; a Hadjárati lakoma a helyi Kocsma–Gyülekezőtér kapcsolathoz igazodik.
- Kaszárnya lovas ága: csak Istálló mellett képez Lovagot, 30%-kal kisebb képzési sebességgel.
- Lándzsás: +100% sebzés lovasság és ostrom ellen. Hatótávos common helyett −5% közelharcból kapott sebzés/felvétel, maximum −75%. Új L4-ek: Bástyaőrség (+100% HP, ellenfélnek átjárhatatlan, nem lökhető el); Nyársalók (a célpont mögötti legfeljebb két további ellenfélre 50%-os döfés).

## Orkok

- Áldozati oltár kikerült. Az Ellenségvér az ősöknek legendás is kikerült.
- Hajcsárok: egyetlen L4, csúszka. Végpontjai −40% képzési idő/80% induló HP és −80%/25%. A páros a képzési ciklus kezdetén rögzül. Az állítás az épület ablakából működik, multiplayerben is továbbítódik.
- Fosztogatók: egyetlen Szörnyhorda L4, 20% erősítési esély; az erősítések 8%-a Troll. L1–L3 változatlan.
- Rabszolgatábor: egyetlen Kényszermunka L4; 20 ölésenként +0,4 fa, +0,4 kő, +0,2 élelem/mp. A Rabszolgatábor hozama nem kapott új felső korlátot.
- Aréna: 20/30/40/60% elit esély, egyetlen L4; termelőnként csak a legerősebb szomszédos Aréna hat.
- Totem: csak ellenséges harci halálból gyűjt. 300/260/220/160 ölésenként normál választás, a szokásos ritkaságsorsolással. Saját halál nem ad pontot.
- Vadászház: L1 0,75 élelem/mp; további szintek és terepbónuszok változatlanok.
- Kunyhó: 25/35/50/75 sereg- és helyőrségi férőhely.
- Csordaszellem: közeli Warglovasonként +1,5% mozgási és támadási sebesség.
- Hadúr parancsa főépületág: kétszeres főváros-HP, kétszeres teljes helyőrség; a kapuállás feltételétől független kapubónuszok.

## Élőhalottak

- Lélekarató kikerült. Csontkohó változatlan, több példány hatása továbbra is összeadódik.
- Rontott Keltető: képzési sebesség +40/+60/+80/+100%; 20/25/30/35% eséllyel az eredeti katona helyett Csontváz készül, az eredeti áron. Temetőre nem hat, a kezdő HP-csökkentés megszűnt.
- Sötét Őrtorony: szintenként 1/2/3/4 külön célpont. Az előző torony által megölt célpont helyett a következő élőt keresi; a sebzési kör nem vész el.
- Nekropolisz – A holtak birodalma: duplázott térfélnövelés és saját térfélhez kötött bónuszok. A toronysebzés és a Holtak kertjének esélye duplázódik, a torony célpontszáma nem. A régi, Lélekkészletből automatikusan növő térfél helyett külön, halmozható +12 méteres common érkezett.
- Nekropolisz – Elit légió: dupla épületfenntartás, a termelőkből érkező egységeknél 50% elit esély. Idézésre/feltámasztásra önmagában nem hat.
- Kiválasztott holtak legendás: +20 százalékpont elit esély minden egységkeletkezésnél, előfeltétel nélkül. A főépületággal 70% a termelőknél, 20% az idézetteknél és feltámasztottaknál.
- Vámpír: 300 → 600 alap HP; elitként 900, további fejlesztések előtt.
- A bontogatással tíz ingyenes egységet adó régi Halálosztag működése megszűnt.

## Megjelenítés és kompatibilitás

- Közös Elit állapot: egyszeri +50% HP és sebzés, egy rangjelzés. A régi veterán/élőhalott elit jelölés együtt sem ad kétszeres bónuszt.
- A területhatár két egymás melletti vonal, a két tényleges csapatszínnel. A rajz és a saját térfél ellenőrzése ugyanazt a közös határt használja; két élőhalott oldal terjeszkedése ellentétes irányba tolja azt.
- A két új fejlesztés meglévő illusztrációt használ megfelelő kerettel; külön új grafika nem készült hozzájuk.
- Hálózati szabályverzió: 9. Régi klienssel nem indul közös csata; mindkét félnek frissítenie kell.

## Ellenőrzés és nyitott részek

Új, valódi böngészős tesztek vizsgálják a képzést, költséget, elit esélyeket, területet, célzást, támogatói együttműködést és a törölt kínálatokat. A korábbi tesztek katalógusszámai és szándékosan lecserélt szabályai az új tartalomhoz igazodnak; az eredeti képfájlok ellenőrzőösszegei megmaradnak.

A Gyülekezőtér új tartalékszáma, az Ostromműhely további átalakítása, az általános sebességszélsőségek és a külön egységképességek nem kaptak végleges tervet, ezért ebben a körben nem változtak. A Mesterek Céhe továbbra is legfeljebb L3-ig fejleszt.
