# Roadlords · V4.20.1

A meglévő játék moduláris változata, a kapott harcprototípushoz közelítő, animált harctéri figurákkal. A városépítés, gazdaság, fejlesztések, egységstatisztikák és a multiplayer-protokoll megmaradt.

## Játék

**https://krisztianmatekiss.github.io/Roadlords/**

A városok négyzetes kerettel és építési ráccsal az út felső és alsó szegélyéig érnek. Magasságuk és szélességük együtt igazodik a pályanézethez; a teljes görgethető világ szélesedik, a harci út távolságai megmaradnak. A sereg és a helyőrség élő számlálói és portréi az alsó zöld sávban vannak, külön panel nélkül; a Saját / Ellenfél kapcsolóval mindkét oldal megtekinthető. A multiplayer név a kapu fölött, a főváros életerőcsíkja középen, a város fölött jelenik meg. A városi ikonok mindig látszanak, a felesleges ikonkapcsoló megszűnt. Az épületek foglalt mezőin 3 képponttal beljebb húzott kategóriaszínes keret és enyhe színezés jelenik meg: gazdaság zöld, hadsereg piros, támogatás kék, védelem szürke. Az L alakú épületek üres sarka szabad marad.

Az építési sáv jobb oldalán, annak teljes magasságában egyszerű, téglalap alakú minitérkép mutatja a két várost, az élő egységeket csapatszínű pontokkal és a még álló tornyokat téglalapokkal. Az egységpontok nagyobbak (4,2 képpontos átmérő), világos körvonalat és sötétebb térképhátteret kaptak. Kattintással vagy húzással mozgatható a nézet; fókuszban a nyílbillentyűk, Home és End is használhatók. A kártyasáv külön helyet hagy a térképnek. A jelenlegi figurák és animációk változatlanok.

A főmenüben egyetlen **TESZTEK** gomb nyitja az összes próbát. A külön almenüből a **VISSZA** vagy az **Escape** visz vissza; a szóló és multiplayer menüpontok külön maradnak.

A **TESZTEK → GRAFIKAI PRÓBA · Kardos / Ork** egy 20 vs 20-as csatában mutatja a két részletes, eredeti illusztrációkból kiinduló mintakaraktert. A kardos és az ork harcos külön torso-, fegyverkar-, pajzskar- és két lábelemből animálódik; a ruhák/pajzsok a nyolc választható csapatszínt követik. A **Grafika: Részletes / Egyszerű** kapcsoló ugyanabban a csatában, a szimuláció újraindítása nélkül vált a két megjelenés között. Újraindításkor a választott grafika megmarad. A részletes minták animációja még merevebb; ezért csak ebben a próbában szerepelnek, a normál játék és a vegyes csaták a korábbi figurákat használják.

A **TESZTEK → PRÓBAHARC · 50 vs 50** indítja a kisebb látványpróbát, a **TERHELÉS · 500 vs 500** a nagy seregek próbáját. Mindkettő két meglévő faj szabályos endgame városát és vegyes seregét használja, a valódi harcrendszerrel. A seregek maguktól megütköznek; újraindításkor ugyanazt a várost és seregösszeállítást kapják, a találatok véletlen kimenetele változhat.

A figura menet közben a tényleges haladás felé fordul, támadás közben az aktuális ütés/lövés célpontja felé. Lejárt támadás vagy korábbi üldözési irány nem tartja hátrafelé fordítva. Ez az egyszerű és részletes figurákra egyaránt érvényes; a multiplayer vendégénél az interpolált haladás adja a menetirányt.

A pályát az **A / D** billentyűvel mozgathatod; nyomva tartva folyamatosan halad. A **dupla A / D** a bal / jobb szélre ugrik. Az **F** a legnagyobb aktív harccsoporthoz vagy az ostromhoz visz, érintkezés előtt a seregek közé. A görgő és a vízszintes trackpad-mozgatás az A/D mellett szintén mozgatja a pályát. Gépelés és nyitott választóablak közben ezek a gyorsgombok nem működnek.

Az időtől balra lévő városikon alapból bekapcsolja az ellenfél városának rögzítését: a teljes méretű, élő város a jobb szélen marad, a kapuja előtti vonaltól balra görgethető a pálya, mint egy rögzített Excel-oszlop. Kattintással feloldható. Nincs másolt város vagy új felbontás; a város szélessége a magasságával együtt nő, kis képernyőn a rögzítés kikapcsolható. A toronyhelyek és a harci szabályok nem változtak.

A lebegő pályapanel eltűnt. A tesztcsaták FPS-, létszám-, szünet-, újraindítás-, grafika- és nagyításvezérlői a meglévő alsó területre kerültek. A **− / +** a tesztcsata nagyítását módosítja (75–200%). Szünet: gomb vagy szóköz. A főmenübe visszalépés új játékállapotot tölt be. A TESZT nem gyárt utánpótlást.

A normál játékban mindkét sereg egységei a saját kapunyílásukból lépnek az útra, majd fokozatosan elfoglalhatják szélesebb menetpozíciójukat. A kapunyílás az út keresztirányában 50%-kal szélesebb. A helyőrség és a gyülekező kijövetele ugyanazt a kapuhelyet használja; a tesztcsaták továbbra is előre felállított sereggel indulnak a pálya közepén. A harctéren keletkező képességegységek (például a lovasból leszálló kardos) a képességük helyén maradnak.

A katonák külön láb-, test- és fegyvermozgást kapnak. A figurák felszerelése és anyagszínei a meglévő egységgrafikákat követik; a kártyák eredeti részletes illusztrációi megmaradtak. Ez stilizált, procedurális 2D/2.5D megjelenítés, nem 3D modell vagy az eredeti képek automatikus csontozása. A támadás felkészülését, elengedését/találatát és visszaállását közös szimulációs óra időzíti.

A közelharcosok foglalt célpontok helyett szabadabb ellenfelet és megközelítési helyet keresnek. A saját egységeken át lehet haladni: az enyhe oldalirányú széthúzás nem akadályozza az előrejutást, ezért sűrű helyzetben baráti átfedés is lehet. Az ellenfelekkel továbbra is ütköznek.

Az első élő ellenséges torony lezárja a teljes útszélesség mögötte lévő szakaszát. Az út szélén, üldözéssel, képességgel vagy ütközési eltolással sem lehet megkerülni. A torony elpusztítása a következő toronyig nyitja meg az utat, végül a fővárosig. A torony mögötti elérhetetlen ellenfél nem vonja el a mozgási célzást. A távolságiak lőtávon belül helyben is támadhatnak; ez rendes működés. A nagy csatában automatikus részletcsökkentés könnyíti a rajzolást, de a figurák mérete a tömegtől függetlenül állandó marad; a 60 FPS-es 500 vs 500 cél további optimalizálást igényel.

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

A normál build kizárólag az `index.html`, az ES modulok és a `public/` forrásait használja. Nem olvassa az archivált HTML-t, és nem illeszt bele utólag kódfoltokat. A régi funkciók egy része még kompatibilitási burkolókat használ, közös explicit runtime állapottal; ezek fokozatos egyszerűsítése a következő refaktorálási lépés. Az első átvezetés térképe: `docs/migration-map.json`. Az új mozgás a `src/combat/movement.js`, a toronysorrend a `src/combat/frontiers.js`, a figurák a `src/rendering/battle-figures.js`, a részletes minták a `src/rendering/detailed-figures.js`, a terep a `src/rendering/battle-ground.js` fájlban található.

## Zene és hálózat

A PeerJS csomag helyben kerül a buildbe; a menü és a TESZT nem igényel CDN-t. A zene a `krisztianmatekiss/roadlords-music` tárhelyet használja, a zenelista verziózott helyi katalógusban van. Futás közben nincs szükség GitHub API-lekérésre. A jelenlegi zenei repository egy menüzenét és öt emberi zenét tartalmaz; külön ork zenék még nincsenek. Böngészős hangindításhoz felhasználói kattintás szükséges.

Az internetes multiplayer továbbra is PeerJS/WebRTC kapcsolatot és megfelelő hálózatot igényel. A csomagkompatibilitás ellenőrzött; a felhőkörnyezet nulla ICE jelöltje miatt a tényleges kétgépes kapcsolat itt nem volt igazolható. TLS- és böngészőbiztonsági ellenőrzéseket nem kapcsolunk ki.

Részletes eredmények és korlátok: [docs/validation.md](docs/validation.md).
