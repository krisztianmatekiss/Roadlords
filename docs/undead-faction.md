# Élőhalottak · 4.26.0 alap, 4.28.0 egységbalance

A forrás a felhasználó `Roadlords_Elothalott_Frakterv.xlsx` munkafüzete. A négy munkalap cellaértékei változatlanul megtalálhatók a [forrásadatokban](plans/undead-source.json). A terv 20 épületet tartalmaz a főépülettel együtt, 7 egységváltozatot, 24 gyakori és 13 legendás fejlesztést. A 4.26.0 az Excel egységértékeit őrizte; a felhasználó által kért 4.28.0-s egységbalance módosítja az alább jelzett alapstatisztikákat, időket, árakat és fenntartást. A képességek és épületméretek megmaradtak. A forrásmunkafüzet archivált adatai változatlanok.

Szólóban mindkét oldalon választható, multiplayerben is játszható. A főmenü **TESZTEK → ÉLŐHALOTT PRÓBA · 50 vs 50** pontja szabályos végső szintű várost és vegyes sereget indít emberek ellen. A nagy, 500/500-as élőhalott felállás a diagnosztikai API-ból is elérhető: `__ROADLORDS_RUNTIME__.roadStartTest(42, {count:500, roster:'undead'})`. A korábbi ember–ork próbák megmaradtak.

## Gazdaság és indulás

A kezdőkészlet **140 Lélek**. Kezdettől építhető a Lélekkút, a Kripta és a Temető. Csak Lélek használható, és nincs játékbeli pozitív tárolókorlát. A motor a meglévő `wood` adattagban szállítja a Lelket; a felület a megfelelő ikont és nevet mutatja, a kő és élelem helyét elrejti. Az építkezés nem vágja le a felhalmozott készletet a korábbi emberi raktárkorlátra.

A főépületet belül továbbra is `keep` azonosítja; az eredeti terv `und_capital` sora adja a Nekropolisz adatait. A Nekropolisz HP-ja **2000 / 4000 / 8000 / 16000**, alaptermelése **3 / 6 / 12 / 24 Lélek/mp**, sereglimitje **50 / 100 / 200 / 400**, kapuja **5 / 10 / 20 / 40 egység/mp**. A főváros lényegesen sérülékenyebb a másik két fajénál: ez a munkafüzet kifejezett értéke, nem véletlen tízszeres eltérés.

A piros igény az összes működő épület fenntartását és a teljes ütemű katonaképzés költségét tartalmazza. Üres készlet, adósság, tele sereg vagy tele helyőrség nem rejti el a képzés tervezett igényét. A tényleges képzési költséget a sikeresen elkészült cikluskor vonjuk le. Az épületfenntartás folyamatos, a tőle független gyártási költség mellett. Tíz **egymást követő** fizetetlen másodperc után az adott épület eltűnik; egy sikeres fenntartási fizetés újrakezdi ezt a számlálót. A sorban fizethető épületek működnek tovább.

A Lélekbank hitelkerete építésre és fenntartásra is használható; negatív készletnél a képzés és a bankkamat szünetel. A kamat 60 szimulált másodpercenként, az akkor pozitív készletből számítódik. A Lélekbőség a haláleseti bevételt és a kamatot is növeli.

## Kitöltött épületárak és fenntartások

A Lélekkút 0,5-ös fenntartása adott volt a tervben. A többi alábbi ár és fenntartás új, módosítható próbaérték. Az árak Lélekben, a fenntartások Lélek/mp-ben szerepelnek; az alapfenntartás szintemeléssel nem nő, kivéve a külön leírt szorzókat.

| Épület | Ár | Alapfenntartás |
|---|---:|---:|
| Lélekkút | 35 | 0,50 |
| Kripta | 45 | 0,30 |
| Temető | 40 | 0,35 |
| Hullaház | 65 | 0,55 |
| Fantomkapu | 60 | 0,50 |
| Nekromanták szentélye | 140 | 1,00 |
| Vámpírkastély | 200 | 1,20 |
| Lichtorony | 220 | 1,40 |
| Sötét Őrtorony | 75 | 0,75 |
| Lélekarató | 80 | 0,50 |
| Lélekbank | 150 | 1,20 |
| Lélekhorgony | 95 | 0,80 |
| Lélekégető | 45 | 0,60 |
| Csontkohó | 90 | 0,70 |
| Pestiskamra | 115 | 1,00 |
| Lélektúlhajtó | 160 | 1,40 |
| Rontott Keltető | 100 | 0,80 |
| Újjászületés sírja | 180 | 1,60 |
| Holtak kertje | 200 | 1,50 |

A toronyszám miatti új fenntartási szabály: minden Sötét Őrtorony alapfenntartásának szorzója `1 + 0,25 × (tornyok száma − 1)`. Két toronynál mindkettő 1,25-szörös, háromnál mindegyik 1,5-szeres fenntartást kér. A Lélekhorgonyokból csak a legerősebb helyi csökkentés érvényes; egymás fenntartását csökkenthetik, a sajátjukét nem. A Lélektúlhajtó a saját fenntartását is háromszorozza, a Nekropoliszét és termelését nem módosítja. A Lélektakarékosság és az építési kedvezmény felvételenként 0,95-tel szoroz, így nem adhat negatív költséget. Az alapozás építési kedvezménye megmarad.

## Kitöltött egységárak és képzési idők

| Egység | Lélek / ciklus | L1 idő | L2 idő | L3 / L4 idő |
|---|---:|---:|---:|---:|
| Csontváz / Csontváz Íjász | 10 | 5 mp | 4 mp | 3 mp |
| Zombi | 20 | 8 mp | 6,4 mp | 4,8 mp |
| Szellem | 14 | 6 mp | 4,8 mp | 3,6 mp |
| Nekromanta | 50 | 14 mp | 11,2 mp | 8,4 mp |
| Vámpír | 56 | 16 mp | 12,8 mp | 9,6 mp |
| Lich | 75 | 18 mp | 14,4 mp | 10,8 mp |

A Kettős idézés két Csontvázat ad egyetlen 10-es alapáron. A Csontváz Íjászhoz előbb az azonos nevű ereklye kell. A hiányzó íjászértékek: 85 HP, 8 sebzés, 1,25 mp támadási idő, 40 mozgás, 130 hatótáv. A Csontváz fejlesztései és távolsági ellenállása az íjászra is hatnak. A Rontott Keltető legerősebb helyi bónusza érvényesül; a fél HP a tényleges kezdőéleterő, nem a maximum csökkentése.

A 4.28.0-s alaperő: Csontváz 85 HP / 10 sebzés, Zombi 280 HP / 12 sebzés, Szellem 75 HP / 8 sebzés, Nekromanta 100 HP. A Vámpír 300 HP / 45 sebzése és a Lich 180 HP / 5-ös sugáralapja változatlan. A végleges árak már tartalmazzák az egységbalance utáni, minden fajra érvényes +25%-ot. [Indoklás és ellenőrzések](unit-balance-4.28.md).

A tervben nyitott nevek helyére Fantomkapu, Nekromanták szentélye és Lichtorony került. A Holtak kertje két L4-ágának neve Vámpírkert és Lichkert.

## Képességek és pontosítások

- A Szellem kitérése a valódi találatkor dől el, területi találatokra is. Kitérés után a találathoz tartozó megjelölés, kábítás, égés és fagyasztás sem marad rajta. A Tükörkísértet másolata nem indít további másolatot, és fix 40% kitérést használ.
- A Síkjáró az ellenséges katonákon is áthalad, és a mögöttük álló távolságiakat keresi. Az élő tornyok teljes útszélességet lezáró szabálya továbbra is érvényes.
- A Nekromanta idézései és a tükrök nem foglalnak sereghelyet. A Csontostrom és Kísértetidézés együtt is egyetlen +1 idézetbónuszt ad, összhangban a terv 4/6-os példáival. Az Örök sereg a szellemeket is megtartja. Ideiglenes egység feltámasztása nem teszi állandóvá az eredeti időkorlátot.
- A Vámpír tényleges HP-sebzésből lop életet; a pajzson elnyelt rész nem ad gyógyítást. A Kettős harapás két teljes találatot, a Vértestvériség a legközelebbi sérült társnak fél adag gyógyítást ad. Vérvadászat új célpontot, majd újabb időzített támadást készít elő; nem okoz animáció nélküli azonnali sebzést.
- A Lich minden új kapcsolata saját időszámlálót tart. A növekvő sugársebzést eltelt időre integráljuk, nem képkockánként fix sebzést adunk. A sugár célpontja hatótávon kívül is sebződik; az Örök éhség új célpontjának megszerzéséhez az új célpont hatótávon belül legyen. A Sorvadó kötelék biztonsági alsó sebességhatára 10%, és a kapcsolat elvesztésekor megszűnik. Az Élő pajzs egyszer osztja szét a fél sebzést, nem indít végtelen visszacsatolást.
- A Méreg nem ölhet, és 30%-kal csökkenti a gyógyulást. A Pestiskamrák extra sebzése sem viheti 1 HP alá az egységet. Ugyanarra a célpontra azonos méregpontok kerülnek, nem külön mérgek. Több élőhalott forrásnál az utolsó élőhalott forrás városának méregszorzója érvényesül.
- A Csontkohó harci Csontvázhalált számol, az idézet időlejáratát nem. A harcban megölt idézett Csontváz számít. A Lélekarató ellenséges harci halálért ad Lelket; a lejáró másolatok nem termelnek bevételt.
- A Halálosztag a feloldott katonai épületek egységtípusaiból választ. A kapunál megjelenő ingyenes erősítés és az Újjászületés sírjának egysége ugyanazt a helyőrség/kapu útvonalat használja, mint a normál utánpótlás. Telt tartaléknál várakozó listába kerül. A feltámadásnál megmarad az egyszeri sír-jelölés.
- A holtak birodalma egész 100 Lelkenként a normál félpálya hosszának 1%-ával nő, 10 000 Léleknél a teljes útig. A határ a készlettel vissza is húzódik. A Holtak kertje a halál helyén alakítja át az ellenséget.

## Grafika, AI és multiplayer

A `public/art/undead/buildings-atlas.png` új, generált RGBA illusztráció: 5×5 mező, az első 20 mező a terv épületsorrendjében, a maradék öt nem használatos. A térképen 95%-os fedettséggel, zöld fényekkel jelenik meg. Egyetlen helyi atlaszt használ az építési kártya, a város és a lexikon. A harctéri figurák saját csontváz-, zombi-, szellem-, vámpír- és mágusmegjelenést, valamint a meglévő közös mozgás/támadás/halál időzítését használják. A 14 korábbi egység megjelenése nem változik.

Az élőhalott AI saját Lélek-mérlegből épít, tartalékol a következő épületre, fejleszti a kutakat, bővíti a sereglimitet és a helyi hatásokhoz keres helyet. A másik két faj AI-ja a hét új egységet is felismeri harci szerepként. Az első élőhalott AI heurisztika; nem végleges versenystratégia.

A multiplayer továbbra is host által számolt harcot használ. Az élőhalott egységekhez opcionális 21. csomagoszlop viszi a sugárkapcsolatokat, idézet- és feltámadásjelöléseket; a régi egységek 20 oszlopos csomagja megmarad. A vendég parancsa nem nullázhatja a host által számolt épületöregedést/fizetetlen időt, és nem teremthet vissza már eltűnt épületet. Az új fajhoz mindkét félnek friss verzió kell; a régi kliensre érthető frissítési üzenet kerül.

## Korai balance és korlátok

Ez játszható alap, nem kész versenybalance. Különösen figyelendő a sérülékeny főváros, a sokáig életben tartott Lich, a Vérőrület/Vérpajzs, a bankkamat és az Örök sereg együttese. Az azonos létszámú teszt nem azonos értékű seregek párharca: a Troll például drágább és négy sereghelyet foglal.

Oldalanként legfeljebb **1500 egyidejű, sereghelyet nem foglaló idézet/másolat**, illetve 1500 várakozó ingyenes erősítés tárolható. A további idézések addig kimaradnak, amíg hely nem szabadul. Ez memória- és csomagméret-védelem, nem a normál sereglimit. A pozitív készlet technikai számtárolása véges JavaScript számot használ; a felület nem állít raktárkorlátot.

A grafika stilizált 2D/2.5D, közös animációs vázzal. A nagy, sok sugárral/idézettel futó csata böngésző- és gépfüggő; állandó 60 FPS-t nem állítunk a frakció minden kombinációjára. A helyi teszt végigfuttat valódi 500/500-as felállást is, de a headless szimulációs idő nem egy játékos gépének FPS-mérése. Az internetes multiplayer működéséhez a meglévő PeerJS/WebRTC hálózati feltételek szükségesek.

## Fájlok és ellenőrzések

- `src/data/undead-plan.js`: a terv épület- és fejlesztéssorai, eredeti cellaszöveggel.
- `src/data/undead.js`: frakcióadatok, pótolt számok, nevek, ágak, olvasható játékbeli szöveg.
- `src/factions/undead/`: külön alapadat-, gazdaság-, AI-, grafika-, felület- és harci modul.
- `tests/undead-faction.cjs`: valódi fajválasztás, kezdés, gazdaság, találatok, idézések, feltámadás, L4-ágak és AI-növekedés.
- `tests/undead-interface.cjs`: lexikon, saját főépület-szöveg, képek, kártyaarányok és 500/500-as állapotpróba.
- `tests/undead-multiplayer.cjs`: két külön böngészőoldal a valódi csomagküldő/fogadó függvényekkel, sugár/idézet/negatív készlet és elavult vendégparancsok. Ez az alkalmazásprotokoll próbája; a külön WebRTC-teszt ellenőrzi a helyi adatcsatornát.

Futtatás: `npm run build && npm test`. A részletes JSON-jelentések és képernyőképek az `artifacts/` mappába kerülnek.
