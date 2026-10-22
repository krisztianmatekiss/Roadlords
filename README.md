# Roadlords · V4.28.1

A meglévő játék moduláris változata, a kapott harcprototípushoz közelítő, animált harctéri figurákkal. A városépítés, gazdaság és multiplayer alapjai megmaradtak; a jóváhagyott balance-változásokat külön rögzítjük.

Az élőhalott városokban nincs erdő, kő vagy termőtalaj; az újrageneráláskor sem jelennek meg. A romok és az alapozás megmaradnak.

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
