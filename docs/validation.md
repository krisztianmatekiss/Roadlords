# V4.16 – harcpróba

2026-10-20. Node.js 24, Linux, headless Chromium, 1440×960. Minden funkcionális ellenőrzés a kész production buildet futtatta a GitHub Pages-szel azonos `/Roadlords/` útvonalon, blokkolt külső HTTPS-kérésekkel.

## Ellenőrzések

A `npm run build` és `npm test` sikeres. **49 ellenőrzés ment át**: 2 megőrzött város/egységadat összehasonlítás, 16 új harc- és animációteszt, 26 korábbi böngészős játékteszt, 5 multiplayer-protokollteszt. Alkalmazáshiba nem volt. A valódi helyi WebRTC teszt külön, környezeti akadály miatt kihagyva: a Chromium nulla ICE jelöltet adott.

Az archivált kiadással az 500/500 kezdeti város, fejlesztés, egységstatisztika és kezdőpozíció továbbra is egyezik. A harci pozíciók későbbi azonossága már nem elvárás: a mozgást szándékosan cseréltük le. Az új mozgást önálló viselkedési tesztek ellenőrzik.

## 50 vs 50

Három rögzített mag, mindkét faj-/oldalirány. Az „aktív” egység legalább 12 pályaegységet megtett vagy támadást indított; a szabályosan helyben tüzelő távolságiakat nem tekintjük elakadt katonának.

| Mag | Csata hossza | Aktív egység | Aktív közelharcos | Túlélők saját / ellenfél |
| --- | --- | --- | --- | --- |
| 42 | 39,5 mp | 100/100 | 58/58 | 40 / 0 |
| 7 | 33,5 mp | 100/100 | 58/58 | 27 / 0 |
| 98765 | 29,1 mp | 100/100 | 58/58 | 0 / 14 |

A vizsgált csatákban nulla, legalább két másodperce tétlen, nem kábított, célponton kívül álló közelharcost mértünk. Ez három összeállításra vonatkozó bizonyíték, nem minden lehetséges tömeghelyzet kizárása.

Külön akadálytesztben a hátulsó kardos egy mozdulatlan szövetségest oldalra kerülve megelőzött: 181,0 útegység előrehaladás, 20,1 oldalirányú kitérés, legalább 21,0 testtávolság.

A 6 másodperces, valóban képkockákon futó 50/50 próba **57,9 FPS** átlagot ért el. Ez egy headless felhőgépes mérés, nem minden eszközre vonatkozó ígéret.

## Animáció és időzítés

Mind a 14 modell álló, járó, támadó és halálpóza kirajzolódott. A támadás felkészülése, csapása/elengedése és visszaállása elkülönül. A járás fázisa a ténylegesen megtett kétdimenziós távolságból származik; szünetben az animáció is áll. A külön tesztek bizonyítják a késleltetett közelharci sebzést és a lövedék becsapódásához igazított sebzést.

A Warg nyitó lándzsadobásának jelzője a késleltetés alatt korábban elveszhetett. A sorba tett támadás most megőrzi, és a találatkor az eredeti képességfüggvény számolja a sebzést. Az izolált próba az eredeti közvetlen képességhez hasonlít: 60/60 sebzés, korai sebzés nélkül, egyszer elfogyasztott nyitó lándzsával.

A figurák procedurális, szerepenként felépített 2D/2.5D miniatűrök. Nem 3D modellek és nem az eredeti képek automatikusan kivágott, csontozott változatai. A felszerelések, anyagszínek és fajjelleg az eredeti grafikákat követik; a kártyák részletes illusztrációi megmaradtak.

## Nagy seregek és megmaradt korlátok

Az 500/500 külön főmenügombon megmaradt. A 12 másodperces terhelési futás **8,0 FPS**-t ért el; a 900 harci lépés 95. percentilise 21,4 ms volt. A részletesebb figurák és az új helyezkedés költségesebbek; ez az első 50/50-re célzott változat nem teljesíti az 500/500 60 FPS célját. Ehhez további harci és rajzolási optimalizálás szükséges.

A 30 szimulált másodperces nagy csata végén 551 élő egység maradt, a 10 pályaegységnél súlyosabb átfedések száma 0. A sprite-tár legfeljebb 768 darab 128×128-as képet tart meg (legfeljebb kb. 48 MiB nyers pixeladat, a böngésző további költségein felül); a holttestlista 220-as korlátos. Sok látható egységnél a rajzoló kevesebb jelzést és kisebb figurákat használ. A terep csempéjét egyszer állítja elő és újrahasználja.

Normál szólójáték: fajválasztás, négy kezdő választás, gazdaság és AI sikeresen lefutott. A multiplayer csomagmezői, tükrözése és parancskezelése ellenőrzöttek. Két internetes gép közötti kapcsolat továbbra sem igazolt ebben a környezetben.

A JavaScript build kb. 831 kB, gzip kb. 262 kB; a Vite nagy csomagra vonatkozó figyelmeztetése megmaradt. A zene külső tárhelyet használ; a felhős hanglejátszás korábbi tanúsítványkorlátját nem kerültük meg. A GitHub Pages előző kiadása HTTP 200-zal elérhető, az új verziót a main-ra feltöltés után a workflow teszteli és publikálja.

A gépi jelentések és képek az `artifacts/` mappában vannak; CI-ben a `test-results` artifactból tölthetők le. Az előző fázis mérése: [V4.15](history/v4.15-test-results.md).
