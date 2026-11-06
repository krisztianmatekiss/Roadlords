# V4.61 – Közös AI, pickritmus és AI–AI nézői mód

## Játékszabályok

| Időszak | Épület / épületfejlesztés | Common | Legendás |
| --- | ---: | ---: | ---: |
| 0:00–7:59 | 50% | 45% | 5% |
| 8:00 után | 25% | 70% | 5% |

Ezek a garancia nélküli alap esélyek. A Bő választék a legendás esélyét 10%-ra emeli, a common arányából. A 19 egymást követő, nem legendás ajánlat utáni 20. ajánlat garantáltan legendás, ha van elérhető legendás lap. A számláló a legendás felajánlásakor nullázódik, nem az elfogadásakor.

A négy kezdő épületválasztás és az ősi rom közvetlen common jutalma nem lépteti a számlálót. Az újrapörgetés megtartja a ritkaságot és az épületes altípust, és nem növeli a garanciaszámlálót. A normál sorsolású jutalomválasztások beleszámítanak. Külön időbeli legendástiltás nincs.

Az időzített választások várakozása továbbra is 12 másodpercről indul, választásonként 3,5%-kal nő. Extra választások és gyorsító hatások nélkül a legelső garancia körülbelül 5:39-nél lép be. A 35% épületfeloldás / 65% épületfejlesztés belső megoszlás és a kínálat hiányára adott visszaesési szabályok változatlanok.

## Egy algoritmus, két önálló ellenfél

A `src/ai/shared-planner.js` várost kap paraméterként. Egyjátékos módban az ellenfél városán dolgozik. A nézői módban két önálló városállapothoz futtatjuk ugyanazt a programot. Nem osztanak meg készleteket, megtakarítási célokat, fejlesztéseket, választási számlálót vagy kapuállapotot.

- `mechanics.js`: épületszerepek, egységcélpontok és a statisztikában közvetlenül nem látható harci események értékelési adatai.
- `evaluation.js`: elkülönített városmásolatok; tényleges termelés, névleges teljes fogyasztás, árak, kapacitások, képzési idők és egységstatisztikák lekérdezése. Nem hajt végre valódi fejlesztésválasztást, nem frissít élő egységeket, és nem fogyasztja a játék véletlenszámait.
- `shared-placement.js`: érvényes alaprajz, tényleges szomszédsági/hatótávszabályok, termelőhelyek és támogató épületek körüli szabad terület. A helykeresés eredménye a város, terep, forgatás, szintek, ágak és ereklyék változásáig gyorsítótárban marad.
- `actions.js`: kifizetett építés, teljes alaprajzra tervezett romeltakarítás, biztonságos telek-újrahasznosítás, megtakarítás és csapatküldés mindkét oldal számára.

A régi ork és élőhalott építési sorrendek és önálló kártyapontozók kikerültek. A frakciómodulok továbbra is saját szabályaikat, képességeiket, áraikat és elhelyezési sajátosságaikat tartalmazzák.

## Mit mérlegel?

- A gazdasági kezdést a jelenlegi hozam és a finanszírozandó fogyasztás/építkezés alapján választja meg, nem kötelező épületdarabszám szerint. Közvetlen veszély esetén előrébb kerül a védekezés.
- A termelőépület helyigénye, ára, teljes kiképzési fogyasztása és fenntartása is számít. Nem elég, hogy a pillanatnyi készletből megvehető.
- A meglévő egységek fejlesztéseit, működő támogatóit, az új egység szerepét és a pályán megfigyelhető ellenfeleket is értékeli. Rejtett ellenséges készletet vagy jövőbeli sorsolást nem használ.
- A saját épület következő fejlesztése mellett az ismert L4 folytatások kedvezményes jövőbeli értékét is becsüli. Az el nem érkezett lapot nem tekinti biztosnak.
- Újrapörgetéskor a még elérhető, azonos típusú lapokból húzható legjobb ajánlat várható értékét hasonlítja az aktuális kínálathoz. Tartalékot hagy a későbbi választásokra.
- Egy elkezdett többmezős ásatást végigvisz; nem költi el közben az első felszabadított mezőt egy másik épületre. Szükséges nyersanyagtermelést csak a teljes csere utáni finanszírozhatóság ellenőrzésével bont.

A tervező közelítő értékelést és korlátozott számú építési jelöltet használ. Nem teljes harci szimulációval keres végig minden lehetséges kombinációt, és nem tanul automatikusan a meccsekből. Új eseményalapú képességnél az értékelési adatokat is frissíteni kell. Nincs személyiség vagy döntési előzményfelület.

## AI–AI nézői mód

Főmenü → **TESZTEK → AI vs AI · Teljes meccs**. A bal és a jobb oldali AI népe egymástól függetlenül választható: Emberek, Orkok, Élőhalottak; azonos népek is játszhatnak egymás ellen.

Mindkét oldal normál kezdővárossal és kezdőnyersanyaggal indul, és négy épületválasztást kap. A termelés, építés, fejlesztésválasztás, képzés, kapuk, valódi harc és hirtelen halál működik. Nincs ingyenes endgame város vagy előre generált sereg. A saját időzített választásokat az adott város gyorsító hatásai módosítják.

Mindkét AI paklija külön megtekinthető. A néző kamerát mozgat (A/D vagy görgő, F: front), szüneteltet, 1×/2×/4× sebességet választ, új meccset indít azonos népekkel vagy visszalép a főmenübe. Építéssel, bontással vagy kapuállítással nem avatkozik be. A mód elhagyása visszaállítja a normál játék vezérlését.

## Lélekpenge

Az épület, a feloldása és fejlesztései, a lexikonbejegyzés, a találatonkénti Léleklevonás és sebzésbónusz, az ehhez tartozó effekt és fogyasztásbecslés kikerült. A közös képatlasz többi épületének grafikája megmaradt. A többi élőhalott képesség és épület szabálya nem változott.

## Ellenőrzés

- `tests/pick-progression.cjs`: első négy választás kivétele, pontos 20. ajánlatos garancia, normál jutalmak, véletlen legendás utáni nullázás, 8:00 határ, Bő választék és mért sorsolási arányok.
- `tests/shared-ai.cjs`: mindhárom nép, állapotot és RNG-t érintetlenül hagyó becslés, gazdasági kezdés, egységbefektetés, vámpíros kombináció és L4 ág, ellenféltípushoz igazodás, újrapörgetés, multiplayerben kikapcsolt AI.
- `tests/ai-spectator.cjs`: valódi menüből indítás, mindkét fajválasztó, külön állapot és választások, négy perc valódi játék, mindkét oldal építése/képzése/kivonulása és tényleges sebzés, szünet, gyorsítás, újraindítás, külön pickidőzítés, normál mód visszaállítása.
- Meglévő épületelhelyezési, romeltakarítási, harci, grafikai és multiplayer regressziós próbák. A szándékosan eltávolított lap darabszámai és a Tesztek új menüpontja a megfelelő elvárásokban frissültek.
- `npm run audit:ai`: hat tízperces gazdasági próba. A kint lévő egységek 45 másodperc után harci jutalom nélkül távoznak, hogy folyamatos utánpótlási igény legyen. Ez nem harci győzelmi arány.

Az előző, 4.60-as változat és a 4.61-es gazdasági próba első kivonulása:

| Nép / mag | Korábban | Most |
| --- | ---: | ---: |
| Ember / 42 | 153 mp | 140 mp |
| Ember / 137 | 125 mp | 128 mp |
| Ork / 42 | 208 mp | 128 mp |
| Ork / 137 | 181 mp | 132 mp |
| Élőhalott / 42 | 165 mp | 187 mp |
| Élőhalott / 137 | 164 mp | 119 mp |

A hat új gazdasági futásban nem volt fenntartási mulasztás. A későbbi kivonulás lehet tudatos gazdasági beruházás következménye, nem önmagában hibajel. A megváltozott pickarányok és döntések a későbbi véletlen sorsolási sort is módosítják; az egységdarabszám különböző típusokat és ingyenes idézéseket is tartalmaz.

A `scripts/audit-ai-battles.cjs` külön, tényleges harccal futó fejlesztői mérés egy rögzített, kifizetett építési stratégiájú ellenfél ellen. Opcionális `ROADLORDS_BASELINE_DIST` mellett korábbi builddel is összevethető. Ez sem emberi ellenfelek elleni győzelmi arány. A futtatott mérőprogramok eredményei a helyi `artifacts/` mappába kerülnek; a játék nem készít és nem tölt fel automatikus meccsnaplót.

A helyi valódi WebRTC-próba ICE-jelöltek hiánya miatt kimaradt; a snapshot-, stratégia- és verzióegyeztetési protokolltesztek lefutottak.

Multiplayer szabályverzió: **14**. Eltérő kliensverzióval a kapcsolat nem indul el; mindkét fél frissítse az oldalt.
