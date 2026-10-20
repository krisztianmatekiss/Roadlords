# Roadlords · V4.16

A meglévő játék moduláris változata, a kapott harcprototípushoz közelítő, animált harctéri figurákkal. A városépítés, gazdaság, fejlesztések, egységstatisztikák és a multiplayer-protokoll megmaradt.

## Játék

**https://krisztianmatekiss.github.io/Roadlords/**

A főmenü **TESZT · 50 vs 50** gombja indítja a kisebb látványpróbát, a **TERHELÉS · 500 vs 500** a nagy seregek próbáját. Mindkettő két meglévő faj szabályos endgame városát és vegyes seregét használja, a valódi harcrendszerrel. A seregek maguktól megütköznek; újraindításkor ugyanazt a várost és seregösszeállítást kapják, a találatok véletlen kimenetele változhat.

A csatatér feletti gombokkal városra/csatára ugorhatsz, a **− / +** a csata nagyítását módosítja (75–200%). Szünet: gomb vagy szóköz. A főmenübe visszalépés új játékállapotot tölt be. A TESZT nem gyárt utánpótlást.

A katonák külön láb-, test- és fegyvermozgást kapnak. A figurák felszerelése és anyagszínei a meglévő egységgrafikákat követik; a kártyák eredeti részletes illusztrációi megmaradtak. Ez stilizált, procedurális 2D/2.5D megjelenítés, nem 3D modell vagy az eredeti képek automatikus csontozása. A támadás felkészülését, elengedését/találatát és visszaállását közös szimulációs óra időzíti.

A közelharcosok foglalt célpontok helyett szabadabb ellenfelet és megközelítési helyet keresnek. A torlódáskor teljes megállás helyett oldalra kerülnek, a testek rugalmasan tartanak távolságot. A távolságiak lőtávon belül helyben is támadhatnak; ez rendes működés. A nagy csatában automatikus részletcsökkentés könnyíti a rajzolást; a 60 FPS-es 500 vs 500 cél további optimalizálást igényel.

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

A normál build kizárólag az `index.html`, az ES modulok és a `public/` forrásait használja. Nem olvassa az archivált HTML-t, és nem illeszt bele utólag kódfoltokat. A régi funkciók egy része még kompatibilitási burkolókat használ, közös explicit runtime állapottal; ezek fokozatos egyszerűsítése a következő refaktorálási lépés. Az első átvezetés térképe: `docs/migration-map.json`. Az új mozgás a `src/combat/movement.js`, a figurák a `src/rendering/battle-figures.js`, a terep a `src/rendering/battle-ground.js` fájlban található.

## Zene és hálózat

A PeerJS csomag helyben kerül a buildbe; a menü és a TESZT nem igényel CDN-t. A zene a `krisztianmatekiss/roadlords-music` tárhelyet használja, a zenelista verziózott helyi katalógusban van. Futás közben nincs szükség GitHub API-lekérésre. A jelenlegi zenei repository egy menüzenét és öt emberi zenét tartalmaz; külön ork zenék még nincsenek. Böngészős hangindításhoz felhasználói kattintás szükséges.

Az internetes multiplayer továbbra is PeerJS/WebRTC kapcsolatot és megfelelő hálózatot igényel. A csomagkompatibilitás ellenőrzött; a felhőkörnyezet nulla ICE jelöltje miatt a tényleges kétgépes kapcsolat itt nem volt igazolható. TLS- és böngészőbiztonsági ellenőrzéseket nem kapcsolunk ki.

Részletes eredmények és korlátok: [docs/validation.md](docs/validation.md).
