# Roadlords · V4.43.1

## V4.43.1 – Az eredeti kéztartások és illesztések javítása

A Pap a távolabbi kezében tartja a botját, a Mágus az elöl látszó kezében, az elfogadott tervek szerint. A szerepek járás, támadás, gyógyítás és elesés közben is megmaradnak. A szabad tenyér a megfelelő irányba fordul; a könyökök természetesebben hajlanak, a csukló az ingujj tényleges nyílásához csatlakozik.

A botok markolati pontjai és méretei külön igazodnak a figurákhoz. A Pap botja alapállásban a talajig ér, a Mágus rövidebb botot tart. A nyak és gallér, valamint az öv és a hosszabb alsó köpeny közös illesztési pontokra épül; a törzsön maradt rögzített ruhaujjak takarása megszünteti a dupla kar hatását. A lövedékek kiindulópontjai a javított fogáshoz igazodnak.

Összehasonlító kép: `public/previews/human-casters-reference-comparison.png`. Az alapállást és a varázslást együtt mutató előnézet frissült; a próbacsata és a játékértékek változatlanok.

## V4.43.0 – Pap és Mágus

A TESZTEK menüben a PAP ÉS MÁGUS · 10 vs 10 és az Íjászpróba maradt. A közös próba 4 Kardost, 3 Papot és 3 Mágust indít 10 Ork Harcos ellen, alapértékekkel, fejlesztések és utánpótlás nélkül. A gyalogságpróba a belső diagnosztikában továbbra is elérhető.

A Pap a bot napjelképéből lő arany fénylövedéket. Gyógyításkor a szabad tenyerét emeli fel; a ténylegesen gyógyított egységeken arany–zöld részecskék jelennek meg, azonnal a meglévő gyógyítási eseménynél. A külön támadási és gyógyítási időzítés megmaradt, a két mozdulat együtt is látható. A négy célpontot gyógyító specializáció minden érintettet megjelöl. Az új nézetben a korábbi késleltetett gyógyító lövedék helyét a fogadó egységen megjelenő fény veszi át.

A Mágus a szabad kezében gyűjti a varázslatot, majd előrelendítve elengedi. A lövedék ugyanebből a tenyérpozícióból indul, a meglévő sebzés időpontjában csapódik be, területi lángrobbanással. A jégspecializáció jégszínű feltöltést, lövedéket és becsapódást használ.

Mindkét figura járást, varázslást, elesést, nyolc csapatszínt és elitjelzést kapott. Az új figurák és gyógyfények egyelőre a próbában aktívak; a játékbeli értékek és a multiplayer szabályai nem változtak. A képkockatár legfeljebb 768 elemes, a közös ruhaszíntár legfeljebb 8 színt tart. Eredeti alkatrészlap: `public/art/battle/human-casters-heroes-parts.png`; nézetablakok: `src/data/human-casters-art.json`; játékbeli előnézet: `public/previews/human-casters-in-game.png`.

## V4.42.0 – Emberi Íjász

A TESZTEK menüben az ÍJÁSZ vs ORK HARCOS · 10 vs 10 és az emberi gyalogság próbája érhető el. A katapultpróba automatikus ellenőrzése megmaradt, menüpontja kikerült.

Az Íjász külön mozgó bőrpáncélt, csuklyát, végtagokat, tegezt, íjat és nyilat kapott. A két kéz az íj markolatát és az ideget követi; a két íjfél hajlása és az ideg végpontjai összetartoznak. Kilövéskor eltűnik a befogott nyíl, és ugyanabból a helyzetből indul a textúrázott lövedék. A valódi sebzés a becsapódás időpontjában történik. Járás, lövés, elesés, nyolc csapatszín és elitjelzés elérhető.

A próba alapértékeket használ, fejlesztések és utánpótlás nélkül; az új grafika egyelőre itt aktív. A Grafika gomb mindkét sereget együtt váltja, a szünet, újraindítás és főmenübe visszalépés megmaradt. Egységértékek és multiplayer szabályok nem változtak.

Az eredeti alkatrészlap csak a próba indításakor töltődik le. Nézetablakai: `src/data/archer-art.json`. A közös képkockatár legfeljebb 768 elemes, az íjász ruhaszíntára legfeljebb 8 színt tart. Játékbeli előnézet: `public/previews/archer-orc-in-game.png`.

## V4.41.0 – Kardos és pajzs nélküli Lándzsás

A TESZTEK menüben az EMBERI GYALOGSÁG · 10 vs 10 és a Katapultpróba maradt. Az új próba 5 Kardost és 5 Lándzsást indít 10 Ork Harcos ellen, alapértékekkel, fejlesztések és utánpótlás nélkül. A lovagos próba menüpontja kikerült; automatikus ellenőrzése megmaradt.

A két emberi figura az elfogadott grafikai tervhez illeszkedő közös alkatrészlapot és végtagrendszert használ, eltérő fejjel és felszereléssel. A Kardos kardot és címerpajzsot visel. A Lándzsásnak nincs pajzsa, két kézzel tartja a lándzsát; a két fogópont szúrás közben is a nyélen marad. A találati képkockák a valódi sebzéshez igazodnak. Járás, támadás, elesés, nyolc csapatszín és elitjelzés elérhető.

A Grafika gomb ugyanabban a csatában váltja az új és a korábbi megjelenést. A Lándzsás az egyszerű nézetben és a normál játék korábbi figuráján sem visel többé pajzsot, és a másik karja is a nyélre kerül; ez kizárólag megjelenésbeli változás, egységértékek nem módosultak. A teljes új emberi grafika egyelőre csak az új próbában aktív.

Az atlasz csak a próba indításakor töltődik le, eredetije változatlan. Nézetablakai: `src/data/human-infantry-art.json`. A két figura ugyanazt a legfeljebb 8 elemes ruhaszíntárat használja, a közös képkockatár továbbra is legfeljebb 768 elemes. Előnézet: `public/previews/human-infantry-in-game.png`.

## V4.40.0 – Katapultpróba

A TESZTEK menüben a LOVAG vs ORK HARCOS · 10 vs 10 és az új KATAPULT vs ORK HARCOS · 5 vs 5 maradt. Az ork–csontváz menüpont kikerült, automatikus ellenőrzése továbbra is elérhető.

A Katapult külön alvázzal, támaszokkal, forgó kerekekkel, hajítókarral, kővel és csapatszínű lobogóval készült. A kő az utolsó megtöltött kanálpozícióból indul; kilövés után a kanál üres. A lövedék az eredeti kilövési és találati időpont között repül, és a valódi célponton megjelenő becsapódási hatáshoz érkezik. A sebzés, hatótáv, sebesség és képességek nem változtak. Eleséskor a támaszok ledőlnek, a kerekek elgurulnak, a gép alkatrészekre hullik.

A próba alapegységeket használ fejlesztések és utánpótlás nélkül. A kezdőzoom kisebb ablakban távolabbi nézetet választ, hogy mindkét sereg és a hátranyúló kanál is látszódjon. A Grafika gomb mindkét egységet együtt váltja régi/új megjelenésre. Szünet, újraindítás és főmenübe visszatérés elérhető. A normál játék Katapultja még a korábbi grafikát használja.

Az új atlasz csak a próba indításakor töltődik le, eredetije változatlan. Nézetablakai: `src/data/catapult-art.json`. A gép 256 pixeles képkockákat használ a közös, legfeljebb 768 elemes tárban; a lobogószíntár legfeljebb 8 elemes. Játékbeli előnézet: `public/previews/catapult-orc-in-game.png`.

## V4.39.1 – Ülő lovas és javított arányok

A Lovag csípője a nyereghez igazodik, combja előrenyúlik, lábszára külön hajlik. A ló kisebb fej–nyak részt és teltebb törzset kapott; a szügyelő eltakarja az alkatrészillesztést. Az Ork Harcos feje alacsonyabbra került, így a fej és a törzs nyakrésze egybeilleszkedik. A játékbeli előnézetek frissültek.

## V4.39.0 – Lovagpróba és két aktuális teszt

A TESZTEK menüben két próba maradt: LOVAG vs ORK HARCOS · 10 vs 10 és ORK HARCOS vs CSONTVÁZ · 50 vs 50. A korábbi próbák menüpontjai kikerültek; az automatikus ellenőrzések továbbra is lefuttatják a szükséges harci, navigációs és multiplayer forgatókönyveket.

Az új Lovag az elfogadott emberi grafikai terv alapján készült: külön mozgatott lótest, fej, farok, négy láb, páncélos lovas, pajzs és lándzsa. Járáskor az átlós lábpárok váltják egymást, a visszahozott paták emelkednek, a lovas követi a nyereg mozgását. A lándzsa érintkezési képkockája a valódi sebzés időpontjához igazodik. Az elesés aránytartó dőlést használ. A lótakaró, sisakforgó, pajzs és zászló követi a csapatszínt; az elit Lovag pajzsa arany szegélyt kap.

A 10–10 próba alapegységeket használ fejlesztések és utánpótlás nélkül. Kezdőzoomja 125%, hogy a felső sor lovasai is teljesen látszódjanak. A Grafika gomb a Lovagot és az Ork Harcost együtt váltja régi/új megjelenésre. Szünet, újraindítás és főmenübe visszatérés elérhető. A normál játék még a korábbi Lovagot használja.

Az atlasz csak a próba indításakor töltődik le, eredetije változatlan; a nézetablakokat a `src/data/knight-art.json` tárolja. A Lovag 256 pixeles, korlátos közös képkockatárat és legfeljebb 8 ruhaszínváltozatot használ. Játékbeli kép: `public/previews/knight-orc-in-game.png`.

## V4.38.0 – Ork Harcos és Csontváz grafikai próba

A TESZTEK → ORK HARCOS vs CSONTVÁZ · 50 vs 50 próba mindkét egységet az elfogadott, Heroes III ihletésű grafikai tervek alapján jeleníti meg. Az Ork Harcos külön mozgatott fejjel, végtagokkal, baltával, fapajzzsal és csapatszínű ruhával készült. A baltacsapás a valódi találati időpontban ér célba; járás, támadás és elesés külön képkockákat használ. Az elit rangot arany pajzsszegély és válljelzés mutatja.

A próba alapegységeket használ fejlesztések és utánpótlás nélkül; ez grafikai összehasonlítás, nem azonos erejű seregek összeállítása. A Grafika gomb mindkét új modellt a korábbi megjelenésre váltja, a csata újraindítása nélkül. Szünet, újraindítás és főmenübe visszatérés elérhető. A meglévő Csontváz–Kardos próba is megmaradt.

Az új orkmodell egyelőre csak az új próbában aktív. A kép csak a próba indításakor töltődik le; a közös képkockatár továbbra is legfeljebb 768 elemes, az ork ruhaszíntára legfeljebb 8 elemes. A generált atlasz eredetije változatlan, az alkatrészeket a `src/data/orc-warrior-art.json` nézetablakai választják ki. Játékbeli összehasonlító kép: `public/previews/orc-skeleton-in-game.png`.

## V4.37.2 – Csontváz alapállás

Magasabb csípő és egyenesebb térdek nyugalmi helyzetben. Lépéskor a csípő enyhén süllyed, a talpak a talajon maradnak.

## V4.37.1 – Kardmarkolat

A csontváz tenyerének fogópontja a markolat közepére került. A kéz a karddal együtt fordul, a csuklóhoz igazított alkar pedig külön követi a mozdulatot. Az ujjak a markolat elé kerülnek. A harci időzítés és az egységértékek változatlanok.

## V4.37.0 – Az elfogadott világos csontváz animációja

A csontvázpróba az elfogadott Heroes III ihletésű tervből készült új alkatrészkészletet használja: világos koponya, szabadon látható bordák és medence, csupasz csontvégtagok, rövid kard és kerek fapajzs. Az elutasított, sötét páncélos modell helyét ez veszi át a TESZTEK → CSONTVÁZ vs KARDOS · 50 vs 50 próbában. A Kardos megjelenése és a harci adatok változatlanok.

A csontok a rajzolt ízületeik között, aránytartóan mozognak. A talpak külön maradnak a talaj síkjában, miközben a térdek hajlanak. A kardcsapás érintkezési póza a tényleges találati időpontban van kinyújtva; a halál összerogyó oldalra dőlést használ, a modell összelapítása nélkül. A ruha és a pajzs festése mind a nyolc csapatszínt követi, a koponya és a csontok színe állandó. A grafikai kapcsoló a régi egyszerű változattal hasonlítja össze ugyanazt a csatát.

A modell továbbra is a grafikai próbában szerepel, a többi jóváhagyott terv beépítésének első lépéseként. Az atlasz csak a próba megnyitásakor töltődik le. A képkockatár legfeljebb 768 elemet, a kis ruhaszín-tár legfeljebb 8 elemet tart. A tényleges játékbeli megjelenés nagyítva és kis méretben a `public/previews/skeleton-heroes-in-game.png` képen látható.

## V4.36.0 – Csontváz grafikai próba

A TESZTEK menü új „CSONTVÁZ vs KARDOS · 50 vs 50” csatája 50 alap Csontvázat és 50 változatlan Kardost indít, fejlesztések és utánpótlás nélkül, valódi harcrendszerrel. A csontváz kártyájához igazított festett koponya, páncél, végtagok, kard és pajzs külön alkatrészként mozog. A járásnak nyolc, a támadásnak tizenkét, a halálnak hat képkockája van, a meglévő támadási órához igazítva. A csapatszín a pajzson és a rongyos ruhán látszik.

A Grafika gomb ugyanabban a csatában vált a két csontvázmodell között. A Kardos rajzolása és minden harci érték változatlan. Az új modell egyelőre csak ebben a grafikai próbában jelenik meg. Az alkatrészatlasz csak a próba indításakor töltődik le, és ugyanazt a korlátos képkockatárat használja, mint a többi figura. Szünet, újraindítás és főmenübe visszatérés elérhető.

## V4.35.0 – Egységjellemzők és ork fejlesztések

A képzőépületeken az egység neve mellett közös, feliratos súgójú piktogramok jelzik a közelharcot, távolsági támadást, kitérést, mágiát, területsebzést, életlopást, idézést és a további tényleges képességeket. Az egységportrékon ugyanaz a jelrendszer látszik. A Goblin kitérésikonja az ehhez szükséges L4-ágnál jelenik meg. Mindhárom faj egységlapjai a gyakori lapok keretcsaládját használják; az élőhalott gyakori lapok semleges csont- és fémkeretet, a katonai épületek továbbra is vörös keretet kapnak.

Öt új ork gyakori fejlesztés: +6% sebzés megátkozott egységek ellen, +5% mozgás, +15% épületsebzés, +3 százalékpont életlopás, −8 százalékpont élelemköltség legfeljebb −50%-ig. Az átoksebzéshez megépített Sámántábor szükséges. A Megvetett zsákmány felvétele utáni kihagyások +4% életerőt és sebzést adnak, korlátlanul összeadódva. Az Ellenségvér az ősöknek megépített Totemet igényel, és minden ellenséges harci halált további 1 pontként számol. Az alap Totem saját halálokból és áldozatokból gyűjt.

Az új és hiányzó ork fejlesztési képek, valamint az élőhalott gyakori fejlesztések képei helyi atlaszokból jelennek meg. A forrásképek változatlanok; nézetablakok választják ki az illusztrációkat. A lexikon lenyitható részletei pontosítják a kiváltó találatokat és a számlálás szabályait. A multiplayer helló a szabályverziót is egyezteti, így az új lapokat nem ismerő gyorsítótárazott kliens frissítést kér.

## V4.34.0 – Hosszabb út és méteres kijelzések

Az út 4800-ról 9600 belső egységre nőtt. Az egységes kijelzési lépték 10 belső egység = 1 méter: a régi út így 480 m-nek felel meg, az új 960 m. Az egységek sebessége, támadási hatótávja és a harci területek sugara változatlan értékből jelenik meg m/s-ban és méterben. A városrács hatókörei továbbra is mezőszámot használnak. Az út melletti beosztás és a minitérkép a távolságot is mutatja.

A nagyobb tornyok teljes látható testükön kijelölhetők. Kijelöléskor a tényleges, fejlesztett hatótávú útszakasz kap sárga jelzést, méteres értékkel; az adatlap a sáv mellé kerül. A két multiplayer kliens az út hosszát is egyezteti, így eltérő pályaverzióval nem indul hibás koordinátatükrözés.

Az élőhalott városi képeket az ork épületekhez hasonló, tetőt hangsúlyozó felülnézet váltotta. A közel felülnézeti képek a városrács síkjában fordulnak, a többi fajhoz igazodva. Kontár építkezés: felvételenként +12 százalékpont teljesár-visszatérítési esély, legfeljebb 60% (5 felvétel).

## V4.33.0 – Élőhalott városok és önálló leírások

Mind a 20 élőhalott épület saját kártyaképet kapott, kategória szerinti kerettel. A Temető nyitott sírkert, különbözik a tetős Hullaháztól. A gazdasági és támogató épületek medence, kasza, páncélterem, láncolt kristály, üst, műhely, tartályok, gyűrűk és gyökérfészek formájával is megkülönböztethetők.

A városban négy külön irányképből jelennek meg az épületek, döntött felülnézetben, átlátszó háttérrel. Forgatáskor az épület állva marad; a helyfoglalás és az építési előnézet ugyanazt a forgatást követi. A képek atlaszokból töltődnek, az eredeti PNG-k változatlanok.

A leírások az adott épület, egység, fejlesztés vagy állapot saját működését írják le. Kikerültek a más ereklyékkel és L4-ágakkal való kombinációk magyarázatai. A tényleges értékváltozásokat továbbra is a jelenlegi fejlesztésekből számolja az előnézet. Játékszabály és balance nem változott.

## V4.32.0 – Kártyajelzések és élőhalott képek

Az egyedi épületeket a kép jobb felső sarkában korona jelöli; az egyediséget megszüntető fejlesztéseket is követi. Minden halmozható lap külön, dőlt feliratú blokkban mutatja a változást. Az egész seregre ható lapok összesített százalékot mutatnak, a lexikon az első felvételt. A címekben megmaradnak a nyersanyagok nevei.

Az öt további élőhalott képzőépület a szentélyhez illő vörös katonai keretet kapott. Mind a hét élőhalott egységnek saját portréja van, közös helyi atlaszból. Mindhárom faj egységlapjain rövid képességleírás, áttekinthető statisztikák és lenyitható részletszabályok vannak. Harci statisztikák és egyensúlyértékek változatlanok.

A meglévő játék moduláris változata, a kapott harcprototípushoz közelítő, animált harctéri figurákkal. A városépítés, gazdaság és multiplayer alapjai megmaradtak; a jóváhagyott balance-változásokat külön rögzítjük.

Az élőhalott városokban nincs erdő, kő vagy termőtalaj; az újrageneráláskor sem jelennek meg. A romok és az alapozás megmaradnak.

## Játékbarát felület · 4.31.0

Épületkiválasztáskor a nagy lap azonnal bezárul, és építés közben az egérre, fókuszra vagy gyorsgombra sem nyílnak fel kártyák. Az építési sávban a kiválasztott kis lap látható marad. Hideg indításkor a statikus játékfelület rejtve marad a főmenü elkészültéig, így nincs kezdő bevillanás.

A nyersanyagnevek helyén ikonok jelennek meg a kártyákon, lexikonban és épületablakokban. Az ork élelem húsikon, az élőhalott nyersanyag lélekikon; a keresés és a segítő címkék megtartják a neveket. A főépület adatai külön gazdasági és védelmi sorokban látszanak. A lélekfenntartás nagyobb, önálló sorban szerepel. Az ork élelemtermelési fejlesztés megkapta a meglévő Vadászház kártyaképét; a fa- és kőtermelési lap is a hozzá illő gazdasági illusztrációt használja. A Nekromanták szentélyének csontkerete vörös katonai díszítést kapott; a zöld mágia megmaradt. [Kártyaképek közös szabályai](docs/card-art-style.md).

## Kisméretű építési lapok · 4.30.1

Az alsó sávban a kártyák teljes egészükben elférnek. Méretük a rendelkezésre álló magassághoz igazodik; a költség külön olvasható méretű marad. Rámutatásra és gyorsgombra a nagy, teljes leírású lap jelenik meg. A felugró lap mérete követi a választott felületméretet, és a képernyőn belül marad.

## Felugró építési kártyák · 4.30.0

Az építési sávban teljes, 2:3 arányú kártyák látszanak, alsó részük a képernyő alá lóg. Az építési ár mindig a látható képrészen marad. Egérrel, billentyűzettel fókuszálva vagy az 1–9 gyorsgombokkal a teljes lap feljön, a pálya és a minitérkép átrendezése nélkül. A gyorsgomb továbbra is kiválasztja az épületet, az Esc bezárja a lapot és megszakítja az építést; a tiltott egyedi épület leírása is elolvasható.

A területjelzés minden nagy lapon az illusztráció bal alsó sarkában van; a tényleges alakot és az L4-ágak eltéréseit mutatja. A jobb alsó sarokban az építési ár szám–ikon sorokban jelenik meg, élőhalottaknál csak Lélekkel. A nagyobb cím és az új, helyi Alegreya leírásbetű automatikusan kisebbre vált, ha a szöveg hosszabb. A meglévő képeffekt megmarad.

## Olvashatóbb kártyák · 4.29.3

Az építési ár külön, feliratos sávba került a nagy kártyák leírása fölé, a képzési ár továbbra is külön adat. A nagyobb címet helyi Metamorphous fantasy betűtípus rajzolja, magyar ékezetekkel; a nagyobb leírás tágasabb, sötét hátteret kapott. A teljes képes lapok illusztrációjára enyhe festményszerű effekt kerül, a keret változatlan. Az egész seregre ható életerő-, sebzés- és támadásisebesség-lapokon nincs kiragadott egységérték vagy másodperces előnézet. A konkrét egység fejlesztésénél a számpár látható megnevezést kap.

## Képzési adatok és Trollkiengedés · 4.29.2

A katonai épületlapokon a képzési idő, az egységár és a területjelzés a szövegdobozban van, a kisebb építőkártyákon is. Az alap-egységképességek és a Troll négyes férőhely-/áldozatértéke csak a lexikon egységoldalán szerepelnek. A kész Troll elsőbbséget kap; legalább egy szabad férőhelynél legfeljebb hárommal túllépheti a helyőrségi vagy sereglimitet. A betelt keretbe nem érkezik új egység, amíg a létszám ismét a korlát alá nem kerül. Ugyanez érvényes a kapura és a Rohamalagútra; a nyersanyagár és képzési idő változatlan.

Az élőhalott kártyasorozat első képe a Nekromanták szentélyéhez készült. Helyi, felirat nélküli kép; a játék illeszti bele a címet és az aktuális adatokat. A városi épületgrafika és a többi élőhalott lap egyelőre a meglévő készletet használja.

## Egyszerű kártyaszövegek · 4.29.1

Mindhárom faj 66 épületét, 180 gyakori/legendás fejlesztését és L4-ágait átnéztük. A kártyán rövid hatásleírás marad, a kivételek a lexikonban lenyithatók. Az adott szint értékei közösek a lexikonban és a választásnál. Az előnyös értékek zöldek, a hátrányok pirosak; az árcsökkentés is zöld. A Hajcsártábor L1-en 25%-kal gyorsabb képzést és 80% kezdő HP-t ír ki, az eredeti 20%-os időcsökkentés alapján. A harci és gazdasági szabályok változatlanok.

## Egységes kártyák és harci jelzések · 4.29.0

Az ork kártyacsomag 51 érvényes WebP-képe helyben, a játék részeként töltődik. A cím és a rövid hatásleírás a képek saját üres mezőibe kerül; a többi faj ugyanazt az elrendezést használja. A lexikon szintválasztója egyszerre egy szint adatait mutatja. Az L4 ágai külön nyithatók meg, nincs ismétlődő szintmagyarázat. A választólapokról lekerült a külön felvételszám-bekezdés és az ismétlődő előnézeti fejléc; a képzési ár, idő és terület ikonokként marad látható.

A méreg zöld, a tűz narancsvörös, a fagy kék, a vérzés piros, az átok lila. Ugyanezek a színek jelzik az egységek aktív állapotait. A közös veterán/elit rang arany felszerelésjelzést és rangjelvényt kap minden fajnál, az ostromgépeken is. Az állapotanimációk közös, korlátos képkockatárból rajzolódnak. A Mágus tűzgolyója, a fagyváltozat és a becsapódási effekt a valódi találat időzítését követi. A harci értékek és szabályok megmaradnak.

A forráscsomag négy üres fájlja és a képek nélküli lapok a meglévő grafikát és az egységes keretet használják. [Képforrások és technikai korlátok](docs/cards-and-effects-4.29.md).

## Rövidebb leírások · 4.28.2

Mindhárom faj épületei, gyakori és legendás fejlesztései rövidebb leírásokat kaptak. A fontos feltételek, hátrányok és számok megmaradnak. Az élőhalott épületlapok külön mutatják a szerepet, az adott szint hatását és az L4-es ágakat; az épületfejlesztésnél a jelenlegi és következő érték olvasható. A lexikon és az építési sáv ugyanezekből a szövegekből dolgozik.

## Egységbalance · 4.28.0

Az ork és élőhalott utánpótlás az emberi egységekhez, az épületek helyfoglalásához, egyedi korlátaihoz és költségeihez igazodik. Troll: 24 / 19,2 / 14,4 mp; Sámán: 9 / 7,2 / 5,4 mp. A Sámán 2,5 mp-enként támad, 8 alapsebzéssel és 150-es hatótávval. Az élőhalott egyediek L1-en 14 / 16 / 18 mp-enként készülnek a korábbi 25 / 35 / 40 helyett; az alapgyalogság és a fenntartás is módosult.

Az egységbalance után **minden frakció mind a 21 egységváltozatának alap képzési ára +25%**, összár szerint egész nyersanyagokra kerekítve. A kedvezmények és a Trolltenyészet felezése ezután érvényesülnek; az ingyenes idézetekért nem von le pénzt a játék. Az épületárak és helyfoglalások megmaradnak. A végleges árak, szintek, indokok és a mérések korlátai: [Egységbalance](docs/unit-balance-4.28.md). Multiplayerben mindkét játékos frissítsen erre a verzióra.

## Felületméret és választókártyák · 4.27.0

A **BEÁLLÍTÁSOK → MEGJELENÍTÉS** alatt az **Automatikus / 75% / 100% / 125% / 150%** választás ténylegesen méretezi a felső kezelősávot, az építőkártyákat, a választólapokat és a beállításablakot. Az aktuális játékablak mérete képpontban is látható. A böngésző megjegyzi a százalékot; az automatikus mód a nagyobb ablakokhoz legfeljebb 200%-ig igazodik. A régi „Nagy / TV 4K” beállítások automatikus módra váltanak.

Az új épület-, épületfejlesztés-, gyakori és legendás lapok azonos elrendezést használnak. A cím, kép, leírás és lábléc külön sorba kerül. A hosszú leírás a lapon belül görgethető; a választóablak egészének nincs görgetősávja. Ha a lapok több sorban sem férnek el, csak a laplista görgethető, a műveletgombok végig láthatók. A felső nyersanyag- és seregsáv szintén látható marad; szűk helyen több sorba rendeződik. A világ és a minitérkép saját koordinátái megmaradnak.

## Élőhalottak · 4.26.0

A szóló és multiplayer fajválasztóban megjelentek az **Élőhalottak**. A feltöltött frakcióterv alapján 20 épület (a Nekropolisszal együtt), 7 egységváltozat, 24 gyakori és 13 legendás fejlesztés játszható. Csak Lelket használnak, korlátlan tárolással és folyamatos épületfenntartással. Az épületek zöldes, áttetsző nekromanta illusztrációkat kaptak; az egységek a működő figuravázra épülnek. A **TESZTEK → ÉLŐHALOTT PRÓBA · 50 vs 50** külön indítja az új frakciót.

A hiányzó épület- és egységárak, fenntartások és képzési idők első balance-értékek. A terv kifejezett statisztikáit megtartottuk, így a Nekropolisz különösen sérülékeny: 2000 / 4000 / 8000 / 16000 HP. A szabályok, kitöltött értékek és technikai korlátok: [Élőhalott frakció](docs/undead-faction.md). Mindkét multiplayer játékosnak ezt a verziót kell betöltenie az új fajhoz.

## Játék

**https://krisztianmatekiss.github.io/Roadlords/**

A városok négyzetes kerettel és építési ráccsal az út felső és alsó szegélyéig érnek. Magasságuk és szélességük együtt igazodik a pályanézethez; a teljes görgethető világ szélesedik, a harci út távolságai megmaradnak. A felső sávban mindkét csapat helyőrsége és serege folyamatosan látszik, élő számlálókkal és portrékkal. Sorrendjük: saját helyőrség, saját sereg, ellenséges helyőrség, ellenséges sereg. Nincs csapatváltó kapcsoló. Az építési súgó és az értesítések a város alatti zöld sávba kerültek; a súgó szövege nem fogja el a kattintást, a forgatás gomb használható marad. A multiplayer nevek a saját városuk HP-csíkja fölött, középre igazítva jelennek meg; a szólójátékban nincs általános városfelirat. A főváros életerőcsíkja középen, a város fölött marad. A városi ikonok mindig látszanak, a felesleges ikonkapcsoló megszűnt. Épületenként egy összefüggő, enyhén színezett felület és 3 képponttal beljebb húzott külső kategóriakeret jelenik meg, belső cellavonalak nélkül: gazdaság zöld, hadsereg piros, támogatás kék, védelem szürke. A V4.25.1-ben a kategóriakeret külön, az épületkép fölötti réteget kapott, így az átlátszatlan grafika sem takarja el. Az enyhe háttérszínezés a kép alatt marad, és a keret nem fogja el a kattintást. Az L alakú épületek üres sarka szabad marad.

Az építési sáv jobb oldalán, annak teljes magasságában egyszerű, téglalap alakú minitérkép mutatja a két várost, az élő egységeket csapatszínű pontokkal és a még álló tornyokat téglalapokkal. Az egységpontok nagyobbak (4,2 képpontos átmérő), világos körvonalat és sötétebb térképhátteret kaptak. Kattintással vagy húzással mozgatható a nézet; fókuszban a nyílbillentyűk, Home és End is használhatók. A kártyasáv külön helyet hagy a térképnek. A normál játék figurái és animációi megmaradtak.

A főmenüben egyetlen **TESZTEK** gomb nyitja az összes próbát. A külön almenüből a **VISSZA** vagy az **Escape** visz vissza; a szóló és multiplayer menüpontok külön maradnak.

A **TESZTEK → ÚJ GRAFIKAI PRÓBA · Kardos vs Ork** 5 kardost és 5 ork harcost indít a valódi harcrendszerben. Új, részletesebb anyag- és felszerelésrétegek épülnek a bevált figuramozgásra: a kardos acélpáncélt, sisakot és címeres pajzsot, az ork új arcot, agyarakat, szőrme/bőr felszerelést és kidolgozott fejszét kapott. A **Grafika: Új / Jelenlegi** gomb ugyanabban a csatában, újraindítás nélkül váltja a megjelenést. A járás, fordulás, ütés és halál ugyanazt az animációs vázat és időzítést használja; azonos marad a figura léptéke is. A nyolc csapatszín a ruhát és a pajzsot színezi, a bőr és fém anyagszínei megmaradnak. Újraindításkor a választott grafika megmarad.

A korábbi atlaszos kardos–ork próba, annak külön rajzolója és PNG-atlasza eltávolítva. Az új grafika első körben kizárólag e két egység próbájában szerepel; a normál játék és a vegyes 50/500-as csaták a jelenlegi figurákat használják.

A **TESZTEK → PRÓBAHARC · 50 vs 50** indítja a kisebb látványpróbát, a **TERHELÉS · 500 vs 500** a nagy seregek próbáját. Mindkettő két meglévő faj szabályos endgame városát és vegyes seregét használja, a valódi harcrendszerrel. A seregek maguktól megütköznek; újraindításkor ugyanazt a várost és seregösszeállítást kapják, a találatok véletlen kimenetele változhat.

A figura menet közben a tényleges haladás felé fordul, támadás közben az aktuális ütés/lövés célpontja felé. Lejárt támadás vagy korábbi üldözési irány nem tartja hátrafelé fordítva. Ez az egyszerű és részletes figurákra egyaránt érvényes; a multiplayer vendégénél az interpolált haladás adja a menetirányt.

A pályát az **A / D** billentyűvel mozgathatod; nyomva tartva folyamatosan halad. A **dupla A / D** a bal / jobb szélre ugrik. Az **F** a legnagyobb aktív harccsoporthoz vagy az ostromhoz visz, érintkezés előtt a seregek közé. A görgő és a vízszintes trackpad-mozgatás az A/D mellett szintén mozgatja a pályát. Gépelés és nyitott választóablak közben ezek a gyorsgombok nem működnek.

Az időtől balra lévő városikon alapból bekapcsolja az ellenfél városának rögzítését: a teljes méretű, élő város a jobb szélen marad, a kapuja előtti vonaltól balra görgethető a pálya, mint egy rögzített Excel-oszlop. Kattintással feloldható. Nincs másolt város vagy új felbontás; a város szélessége a magasságával együtt nő, kis képernyőn a rögzítés kikapcsolható. A toronyhelyek és a harci szabályok nem változtak.

A lebegő pályapanel eltűnt. A tesztcsaták FPS-, létszám-, szünet-, újraindítás-, grafika- és nagyításvezérlői a meglévő alsó területre kerültek. A **− / +** a tesztcsata nagyítását módosítja (75–200%). Szünet: gomb vagy szóköz. A főmenübe visszalépés új játékállapotot tölt be. A TESZT nem gyárt utánpótlást.

A normál játékban mindkét sereg egységei a saját kapunyílásukból lépnek az útra, majd fokozatosan elfoglalhatják szélesebb menetpozíciójukat. A kapunyílás az út keresztirányában 50%-kal szélesebb. A helyőrség és a gyülekező kijövetele ugyanazt a kapuhelyet használja; a tesztcsaták továbbra is előre felállított sereggel indulnak a pálya közepén. A harctéren keletkező képességegységek (például a lovasból leszálló kardos) a képességük helyén maradnak.

A katonák külön láb-, test- és fegyvermozgást kapnak. A figurák felszerelése és anyagszínei a meglévő egységgrafikákat követik; a kártyák eredeti részletes illusztrációi megmaradtak. Ez stilizált, procedurális 2D/2.5D megjelenítés, nem 3D modell vagy az eredeti képek automatikus csontozása. A támadás felkészülését, elengedését/találatát és visszaállását közös szimulációs óra időzíti.

A közelharcosok foglalt célpontok helyett szabadabb ellenfelet és megközelítési helyet keresnek. A saját egységeken át lehet haladni: az enyhe oldalirányú széthúzás nem akadályozza az előrejutást, ezért sűrű helyzetben baráti átfedés is lehet. Az ellenfelekkel továbbra is ütköznek.

Az első élő ellenséges torony lezárja a teljes útszélesség mögötte lévő szakaszát. Az út szélén, üldözéssel, képességgel vagy ütközési eltolással sem lehet megkerülni. A torony elpusztítása a következő toronyig nyitja meg az utat, végül a fővárosig. A torony mögötti elérhetetlen ellenfél nem vonja el a mozgási célzást. A távolságiak lőtávon belül helyben is támadhatnak; ez rendes működés. A nagy csatában automatikus részletcsökkentés könnyíti a rajzolást, de a figurák mérete a tömegtől függetlenül állandó marad; a 60 FPS-es 500 vs 500 cél további optimalizálást igényel.

## Tervezhető nyersanyagigény · 4.25.0

A piros fogyasztási érték a jelenlegi beállítások teljes működéshez szükséges másodpercenkénti igénye. Nem az utolsó 30 másodperc tényleges költését átlagolja, ezért az üres raktár és a megtelt sereg/helyőrség nem csökkenti. Az összes katonai gyártósor, a párhuzamos laktanyagyártás, a valós képzési idő, költségkedvezmény, ellátóközpont és a Haditermelési lánc gyorsítása is szerepel benne. A beállított piaci útvonalak teljes kivitele és hozzá tartozó importja a pillanatnyi készlettől függetlenül látszik. A számon tartott automata zsoldosbérlés aktuális ajánlatának ára a szerződés ciklusidejére osztva számít.

A piros szám fölött külön bontás olvasható katonagyártásra, automata zsoldosbérlésre és piaci kivitelre. Az egyszeri építkezés és fejlesztésvásárlás nem folyamatos költség. A kijelzés elméleti üzemi igény: leállás vagy elvesző lánc-előrehaladás mellett a tényleges költés kisebb lehet; a készlettől függő képzésgyorsítás valódi sebességváltozáskor módosítja a tervezett igényt. A tényleges nyersanyaglevonás szabályai megmaradtak, és a multiplayer vendég is a saját aktuális városából számolja a kijelzést. A nyersanyagok mellőli egységgyártási sebesség-kijelző és annak frissítő kódja eltávolítva.

## Kártyaleírások

A 44 épület, 58 gyakori fejlesztés és 85 legendás ereklye szövege közös, külön szerkeszthető adatmodulban van: `src/data/upgrade-copy.js`. Az új szövegek a tényleges szabályokat írják le, magyar kifejezésekkel; a Hadkötelezettség tényleges +25% képzési ideje és a Haditermelési lánc +15 százalékpontos előrehaladása is pontosan szerepel.

A fejlesztéskártyák **Jelenleg → Felvétel után** értékeket és felvételszámot mutatnak. Az egységstatisztikákat ugyanaz a `statsFor` számolja, mint a játékban, nem veterán alapegységre, a város jelenlegi fejlesztéseivel. A különleges, egységenkénti és ideiglenes bónuszok nem szerepelnek ebben a példában. A gazdasági és esélybónuszoknál kifejezetten csak az adott lap hozzájárulása látszik. A többször felvehető legendás lapok, a felső korlátok és a Specializáció extra felvételének esélye külön jelölést kapnak. Az előnézet nem módosítja a játékállapotot és nem sorsol.

A választóablak fejlesztéskártyái nagyobb szövegterületet kapnak; a hosszú leírások görgethetők, többé nem vágjuk le őket három sornál. A fő játéknézet és az építési sáv méretezése megmarad. A harci szabályok változatlanok.

A külső ork kártyakészlet a [roadlords-music/cards/orc](https://github.com/krisztianmatekiss/roadlords-music/tree/main/cards/orc) mappában található: **19 épület és 36 fejlesztés, összesen 55 WebP**. A képek üres cím- és leírásmezőket tartalmaznak. Ez a kiadás a meglévő játékbeli illusztrációkat használja; a teljes külső kártyakeretek integrálása és az emberi készlet még nincs benne. `cards/human` mappa jelenleg nincs; a repository gyökerében lévő `human` mappa zenéket tartalmaz.

## AI városépítés és balance-áttekintés

Az AI helyi támogatói most valódi, közös oldalú szomszédságra épülnek; a hatótávnövelő ágak és ereklyék kivételei megmaradnak. A Gyülekezőtér, Páncélkovács, Aréna és más helyi támogatók környékén az AI szabad helyet részesít előnyben a későbbi katonai termelőknek. A globális épülethatások továbbra sem igényelnek szomszédot. Az emberi AI az ork ellenfél szerepeit is felismeri. Az ork helykeresés egyszeri foglaltságszámítást és döntésenkénti gyorsítótárat használ.

A [532 harcmintára és a kód áttekintésére épülő jelentés](docs/balance-audit.md) külön tárgyalja a balance-kockázatokat, az AI korlátait és az első finomhangolás javasolt értékeit. Újrafuttatás: `npm run build && npm run audit:balance`.

## Első balance · 4.24.0

A **4.24.2** kiadásban az Ork Harcos alapéletereje visszaállt **300-ra** (250-ről). Az életerőfejlesztések és a veteránbónusz ismét ebből az alapból számolnak.

A **4.24.1** kiadásban az ork **Kunyhó** indulástól építhető alapépület; külön feloldást nem igényel, az építési ára változatlan.

A három elfogadott változtatás: **Troll másodlagos területsebzése 55→35**, **Ork Harcos alapéletereje 300→250**, **Goblin íjászok sebzésbónusza +100%→+50%**. A Troll elsődleges 110-es találata és 55-ös hatássugara, a Földrengető külön harmadik ütése, valamint a Goblin íjászok +50% hatótávja megmarad. A sebzés- és életerőfejlesztések, veteránbónuszok és Trolltenyészet az új alapértékekből számolnak. A Harci lendület számítása is a csökkentett Goblin íjászok bónuszt használja. Az árak és képzési idők nem változnak.

A közös értékek a `src/data/combat-balance.js` fájlban vannak; a játékbeli leírások frissültek. A régi [balance-jelentés](docs/balance-audit.md) megőrzi a változtatások előtti mérési alapot.

## Közzététel

Minden `main` frissítés után a GitHub Actions buildel, böngészőben tesztel, majd közzéteszi a `dist/` tartalmát. Sikertelen teszt esetén a korábbi oldal marad. Új repository esetén egyszeri beállítás: **Settings → Pages → Source: GitHub Actions**, majd **Actions → Build, test and publish Roadlords → Run workflow**. Ingyenes Pages-hez nyilvános repository szükséges.

## Fejlesztés

Node.js 24 szükséges.

```sh
npm ci
npm run dev
```

A futtatható webes kiadás:

```sh
npm run build
npm run preview
```

A `dist/` teljes tartalma telepíthető statikus tárhelyre, alkönyvtárba is. A több fájlos alkalmazást HTTP-n kell kiszolgálni. A forrás `index.html` nem önálló letölthető játék.

```sh
npm test
```

A tesztek a kész buildet a GitHub Pages útvonalát követő `/Roadlords/` alkönyvtárból indítják. Linuxon alapértelmezett böngésző: `/usr/bin/chromium`; más telepítéshez `CHROMIUM_PATH` állítható. A CI a Playwright saját Chromiumát telepíti. Jelentések és képek: `artifacts/`.

## Mappák

| Hely | Tartalom |
| --- | --- |
| `src/core/` | Állapot, indítás és a modulok regisztrációja |
| `src/data/`, `src/factions/` | Egységek, épületek, fejlesztések és fajok |
| `src/city/`, `src/economy/`, `src/progression/` | Város, termelés, választások |
| `src/combat/`, `src/ai/`, `src/world/` | Harc, döntések, pálya |
| `src/rendering/`, `src/ui/`, `src/styles/` | Kirajzolás, kezelőfelület, stílusok |
| `src/audio/`, `src/multiplayer/` | Zene és hálózati protokoll |
| `src/diagnostics/` | TESZT csata és mérési felület |
| `src/config/app.js` | Verzió, alkalmazásnév és zenei tárhely |
| `public/art/`, `public/styles/` | Külső képfájlok és a megőrzött stílusok |
| `tests/`, `scripts/` | Regressziók, build- és indítási segédek |
| `archive/` | A korábbi önálló HTML, összehasonlításhoz |
| `references/` | A kapott harcprototípus, fejlesztési referencia |

A normál build kizárólag az `index.html`, az ES modulok és a `public/` forrásait használja. Nem olvassa az archivált HTML-t, és nem illeszt bele utólag kódfoltokat. A régi funkciók egy része még kompatibilitási burkolókat használ, közös explicit runtime állapottal; ezek fokozatos egyszerűsítése a következő refaktorálási lépés. Az első átvezetés térképe: `docs/migration-map.json`. Az új mozgás a `src/combat/movement.js`, a toronysorrend a `src/combat/frontiers.js`, a figurák a `src/rendering/battle-figures.js`, az új felszerelés- és anyagrétegek a `src/rendering/refined-figures.js`, a terep a `src/rendering/battle-ground.js` fájlban található.

## Zene és hálózat

A PeerJS csomag helyben kerül a buildbe; a menü és a TESZT nem igényel CDN-t. A zene a `krisztianmatekiss/roadlords-music` tárhelyet használja, a zenelista verziózott helyi katalógusban van. Futás közben nincs szükség GitHub API-lekérésre. A jelenlegi zenei repository egy menüzenét és öt emberi zenét tartalmaz; külön ork zenék még nincsenek. Böngészős hangindításhoz felhasználói kattintás szükséges.

Az internetes multiplayer továbbra is PeerJS/WebRTC kapcsolatot és megfelelő hálózatot igényel. A csomagkompatibilitás ellenőrzött; a felhőkörnyezet nulla ICE jelöltje miatt a tényleges kétgépes kapcsolat itt nem volt igazolható. TLS- és böngészőbiztonsági ellenőrzéseket nem kapcsolunk ki.

Részletes eredmények és korlátok: [docs/validation.md](docs/validation.md).
