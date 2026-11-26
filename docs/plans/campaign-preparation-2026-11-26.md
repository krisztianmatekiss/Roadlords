# Kampány – előkészítés és feljegyzett döntések

2026-11-26 · A V4.88 jelenlegi adataira épülő tervezési anyag.
A jóváhagyott irányok és az alábbi induló balanszjavaslatok külön szerepelnek.

**Megvalósítás:** a játszható V4.89 kampányalap végleges működését a
[kampánypatch leírása](../campaign-4.89.md) rögzíti. Az alábbi szöveg a korábbi
előkészítés; az eltérő munkajavaslatokat a megvalósítási leírás pontosítja.

## Feljegyzett felületi javítás

- [ ] A világos hátterek előtt több felirat nem olvasható. Át kell nézni a feliratok kontrasztját, és szükség szerint sötét betűszínt vagy megfelelő szöveghátteret adni.

## Korábban felvetett mozgásfinomítás

- Az egységek alapsebességének 20–30%-os növelése; a beszélgetésben +25% volt a munkajavaslat, a gyalogos–lovas arányok megtartásával. Külön balanszváltozásként kezelendő.

## A felhasználó által meghatározott irány

- Főmenü: **Kampány** és **Gyors játék**. A jelenlegi önálló meccs marad a gyors játék alapja.
- Lineáris kampány, összesen **öt harccal: négy ellenfél után az ötödik harc a boss**. A felhasználó ezt külön pontosította.
- Harc végén egy ereklyét választunk, amely megmarad a következő harcokra.
- Alapból csak az ereklyéket visszük tovább. A korábbi, harconként három fejlesztés megőrzése megszűnik.
- Később külön hatás engedhet épületet vagy fejlesztést továbbvinni.
- Az egységre vagy épületre ható meglévő legendás lapok maradnak legendás fejlesztések. Az általános választási és egyéb szabályhatásokból lehetnek ereklyék; a részletes besorolást a felhasználó a patchhez az asszisztensre bízta.
- Kampányban épület- és fejlesztésválasztások vannak; a fejlesztésválasztás legendás lapot is adhat. Az ereklyék alapvetően harc végi jutalmak.
- Gyors játékban meccs közben továbbra is megszerezhetők a korábbi ereklyejellegű hatások. A jelenlegi frakciós elérhetőség megőrzendő, amíg a közös ereklyék gyorsjátékbeli bevezetéséről nem döntünk.
- Az első ellenfél jelenlegi, normál kezdést kap. A további szinteken egyre nagyobb kezdőelőny járhat: ereklye, magasabb szintű kezdőépület vagy kapcsolódó legendás fejlesztés. A konkrét csomagok összeállítását a felhasználó az asszisztensre bízta.
- Három tábor a vár mögött; legyőzésük ideiglenes vagy tartós bónuszt adhat. A harmadik tábor adja a legnagyobb jutalmat. A működés és a jutalmak részleteit később beszéljük meg.

## Első változat – javasolt kezdőelőnyök

Az **öt harc és az ötödiken érkező boss rögzített döntés**.
Az alábbi kezdőelőnyök induló balanszjavaslatok.

| Harc | Ellenfél | Induló előny javaslata |
| --- | --- | --- |
| 1. | Véletlen nép | A jelenlegi normál kezdés, extra előny nélkül. |
| 2. | Véletlen nép | Egy használható ereklye. |
| 3. | Véletlen nép | Egy ereklye és egy ténylegesen felépített L3 katonai termelő. |
| 4. | Véletlen nép | Két ereklye és egy ténylegesen felépített L4 katonai termelő, hozzá illő ággal. |
| 5. | Élőhalott boss | Az alábbi kötött épületkezdés. További ereklyéit a játékos addig elérhető erejéhez kell balanszolni. |

A magasabb szintek bónuszai az adott ellenfél kezdőcsomagjai. Nem az előző ellenfél épületeit örökli meg egy új, másik nép.
A mennyiségek induló balanszjavaslatok; az L4 épületek ereje nem azonos egyetlen véletlen ereklye erejével.

## Véletlen ellenfelek

- A meglévő közös AI vezérli őket; a kampány a kezdőállapotot és a hasznos fejlesztési irányokat adja meg.
- A nép, az előnycsomag és a kampányon belüli véletlen választások mentett sorsolást kapnak. Visszatöltéssel ugyanaz az ellenfél jelenik meg.
- A csomagok egymáshoz illő elemekből állnak: a kapott egységfejlesztéshez tartozó termelő már álljon, vagy érdemben elérhető legyen.
- A normál ellenfelek többféle katonai termelőre épülhetnek; az ember ne mindig lovagos vagy lándzsás kezdést kapjon.
- A kezdőépületek legális mezőkre kerülnek. A valódi épületszintet és az L4 ágat is be kell állítani, a kártya feloldása önmagában nem elég.
- A kezdőcsomag fő elemei tartsák meg az ellenfél karakterét; az AI a többi épületen és választáson alkalmazkodhat.
- A kezdőelőnyök a harc előtt láthatók legyenek a játékosnak.

## Első boss: élőhalott vámpírúr

A felhasználó által megadott kezdőépületek:

| Épület | Szint |
| --- | --- |
| Nekropolisz | L3 |
| Vámpírkastély | L4 |
| Lélekkút | L4 |

Javasolt kastélyág: **Vérvadászat** – ölés után a Vámpír egy 12 méteren belüli ellenségre ugrik, és ingyen támad. Újabb öléssel folytathatja.
Ez az ágválasztás javaslat, a három megadott kezdőszint felhasználói döntés.

A jelenlegi játékmotorral külön ellenőrzött kezdő gazdaság, további ereklyék nélkül:

- Kezdő készlet: 280 Lélek.
- Termelés: 44 Lélek/mp.
- Épületfenntartás: 3,56 Lélek/mp.
- Folyamatos Vámpírképzés: kb. 5,60 Lélek/mp; egy Vámpír 94 Lélek, képzése 16,8 mp.
- Összes üzemi igény: kb. 9,16 Lélek/mp; fennmaradó bevétel: kb. 34,84 Lélek/mp.
- Seregkapacitás: 200; helyőrség: 30.

Ez a kezdés finanszírozható. A mérés a gazdaságot igazolja; a harci nehézség és a játékos elleni erőviszony külön kampánytesztet igényel.
A boss előnyét elsőre a megadott épületek adják; további köd, négy kastély vagy külön sebzésszorzó nem része ennek a kezdőcsomagnak.

## Ereklyék és harcok közötti állapot

- A jelenlegi 114 legendás lap kiolvasott készlete: 55 emberi, 25 ork, 34 élőhalott.
- Első besorolási javaslatként 5 általános lap erős ereklyejelölt: Szakosodás, Bő választék, Kettős választás, Stratégiai fölény, Teltház.
- A többi 109 lap a szigorú egység-/épülethatás-szabály alapján egyelőre legendás fejlesztés maradna. Ez munkabesorolás, még nem játékmódosítás.
- A közös és népspecifikus ereklyék induló készlete és aránya még nincs véglegesítve. A jelenlegi készlet új általános ereklyékkel bővítendő.
- Javasolt harc végi kínálat: három használható ereklyéből egy választás. Egyszeri ereklyéből már megszerzett példány ne foglaljon jutalomhelyet.
- Négy harc végi választáshoz legalább hat, az adott nép számára használható egyszeri ereklye kell ahhoz, hogy az utolsó kínálatban is három különböző, még meg nem szerzett lap lehessen. Induló célként nyolc vagy több használható hatás célszerű.
- A Stratégiai fölényhez hasonló egyszeri bónuszokat ereklyeként újra kell fogalmazni: mikor és milyen gyakran járnak a választások, újrasorsolások és kitiltások.
- A Bő választék legendásesély-bónuszát a kampány új fejlesztéskínálatára kell alkalmazni.
- Közös ereklye minden népnél ténylegesen működjön, az élőhalottak külön Lélek-gazdaságában is.
- A város, a sereg, a csata közben megszerzett fejlesztések és a meccs gazdasági készlete alapból újraindul a következő ellenfélnél.
- Egyetlen kártyadefinícióból dolgozzon a lexikon, a jutalomkínálat, a meccs közbeni választás és a pakli; a típus és az elérhetőség függjön a játékmódtól.
- Javasolt automatikus mentés: legalább a harcok között, a néppel, megszerzett ereklyékkel, következő ellenféllel és a kisorsolt jutalmakkal együtt.

## Még egyeztetendő játékszabályok

- Vereségnél véget ér-e a végigjátszás, vagy újrapróbálható ugyanaz a harc?
- Hogyan küldünk sereget a vár mögötti táborokra, és mit kockáztatunk közben a főfronton?
- A táborok ellenfelei, jutalmai és a harmadik tábor tartós bónusza.
- Az épületet vagy fejlesztést továbbvivő külön hatások pontos célpontja: feloldott kártya, felépített épület, épületszint vagy adott fejlesztésfelvétel.
