# Roadlords · V4.15

A meglévő játék első, viselkedést megőrző moduláris kiadása. A városépítés, gazdaság, fejlesztések, AI, multiplayer-protokoll és az 500 vs 500 TESZT csata megmaradt. A prototípushoz igazított új mozgás és animáció a következő fejlesztési szakasz; a jelenlegi torlódási viselkedés még a V4.14-é.

## Megnyitás egy linkkel

Tervezett cím: **https://krisztianmatekiss.github.io/Roadlords/**

Az első közzétételhez a repository **Settings → Pages → Build and deployment → Source: GitHub Actions** beállítása szükséges. Ezután az **Actions → Build, test and publish Roadlords → Run workflow** gombbal indítható a publikálás. Ha a Pages még nincs engedélyezve, a cím nem él. További main frissítéseknél a build, a böngészős ellenőrzések és a publikálás automatikus; sikertelen teszt esetén a korábbi oldal marad.

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

A normál build kizárólag az `index.html`, az ES modulok és a `public/` forrásait használja. Nem olvassa az archivált HTML-t, és nem illeszt bele utólag kódfoltokat. A régi funkciók egy része még kompatibilitási burkolókat használ, közös explicit runtime állapottal; ezek fokozatos egyszerűsítése a következő refaktorálási lépés. Az átvezetés térképe: `docs/migration-map.json`.

## Zene és hálózat

A PeerJS csomag helyben kerül a buildbe; a menü és a TESZT nem igényel CDN-t. A zene a `krisztianmatekiss/roadlords-music` tárhelyet használja, a zenelista verziózott helyi katalógusban van. Futás közben nincs szükség GitHub API-lekérésre. A jelenlegi zenei repository egy menüzenét és öt emberi zenét tartalmaz; külön ork zenék még nincsenek. Böngészős hangindításhoz felhasználói kattintás szükséges.

Az internetes multiplayer továbbra is PeerJS/WebRTC kapcsolatot és megfelelő hálózatot igényel. A csomagkompatibilitás ellenőrzött; a felhőkörnyezet nulla ICE jelöltje miatt a tényleges kétgépes kapcsolat itt nem volt igazolható. TLS- és böngészőbiztonsági ellenőrzéseket nem kapcsolunk ki.

Részletes eredmények és korlátok: [docs/validation.md](docs/validation.md).
