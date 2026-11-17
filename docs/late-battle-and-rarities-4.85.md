# V4.85.0 – Nagy csaták és ritkasági skálázás

## Teljesítmény

A javítások a közös motorban vannak: normál játékban, AI–AI nézetben és a multiplayer hostján is érvényesek. A vendég a host szimulált állapotát követi.

- A súlyozott sereglimitnél vagy a külön darabszámkorlátnál megtelt AI-sereg nem számoltatja újra minden várakozó újonc statisztikáit minden lépésben. A kapu- és portálvédelem, a várakozó egységek és a piac működése megmarad.
- A másodpercenkénti taktikai kapcsolóellenőrzés nem indít teljes építkezési és fejlesztési előretervezést. A rendes építkezési döntés továbbra is teljes értékelést használ.
- Üresjáratban a portál, illetve a nem létező állítható épületek nem készítenek fölösleges városmásolatokat.
- Ha nincs játékban provokáló ork Harcos, a célzás kihagyja az erre szolgáló extra ellenségkeresést. Aktív provokálásnál megmarad annak elsőbbsége.
- A célpont nélküli menetelők az egyébként is használt, körülbelül 0,24–0,35 másodperces újrakeresési időt betartják. Az érvénytelen, halott vagy elérhetetlen meglévő célpont azonnal újrakereshető. Az első ellenfél megjelenése azonnal érvényteleníti a korábbi üres keresést. A támadási célzás ettől függetlenül működik.
- A pap teljesen egészséges szövetségesekre nem végez távolságszámítást. A gyógyítás célpontja és prioritása változatlan.
- Az épületforgatások alapgeometriája gyorsítótárból olvasható; az alakváltoztató frakcióhatások továbbra is külön, városfüggően működnek.
- A képkocka legfeljebb 12 ms-ig kezd újabb szimulációs lépéseket. Egy már elkezdett lépést befejez; nincs egységkihagyás vagy megnyújtott harci lépés. Túlterheléskor a játékóra lassabban halad, és a felület gyakrabban kap lehetőséget reagálni. A felhalmozott idő legfeljebb nyolc lépés, így nem alakul ki hosszú felzárkózó ciklus.

### Mérési példa

Chromium, 1920 × 1080, seed 42, körülbelül 1000 úton lévő egység, két AI, fejlett városok, 30 darab 1/30 másodperces kézi lépés. A szándékosan túlterhelt fixture a rendes sereglimitet nem módosítja. A régi, ténylegesen publikált 4.84-es JS és az új build ugyanazzal a helyi felülettel/assetkészlettel futott. Az AI-döntési seed rögzített, az időzített pickek a mérési ablakon kívül vannak.

| Helyőrség oldalanként | 4.84 átlag / medián | 4.85 átlag / medián |
| --- | --- | --- |
| 0 egység | 34,4 / 25,2 ms | 23,7 / 16,2 ms |
| 200 egység | 38,7 / 26,9 ms | 15,5 / 13,5 ms |

A taktikai kapcsolóellenőrzés összes ideje ebben a 30 lépésben 24–41 ms-ról körülbelül 1,4 ms-ra csökkent. Ezek műszerezett, rövid böngészős CPU-mérések, nem általános FPS-ígéretek; egyedi építkezési döntések továbbra is okozhatnak hosszabb lépést. A képkockánkénti időkeret egy ilyen folyamatban lévő lépést nem szakít félbe.

Újramérés: `npm run build && npm run audit:late-battle`. Részletes eredmény: `artifacts/late-battle-profile.json`. Korábbi JS-bundle a `BASELINE_FILE` környezeti változóval adható meg; a mérés önmagától nem tölt le vagy exportál meccsnaplót.

## Ritkaságok

| Változat | Gyakorihoz viszonyított erő | Példa HP-bónusz |
| --- | --- | --- |
| Gyakori | 1× | +10% |
| Ritka | 1,5× | +15% |
| Epikus | 2× | +20% |

A kisebb alapbónuszú lapokra is ugyanez az arány vonatkozik. A képzési kedvezmény pontosan 5 / 7,5 / 10%, nem a kedvezmény hatványának másfélszerese. A csak epikus változattal rendelkező önálló hatások, például +1 Lich-sugár vagy +3 százalékpont életlopás, megtartják saját értéküket. A meglévő korlátok, szintfeltételek és 70/25/5%-os előfordulási arányok maradnak.

Egy gyakori, egy ritka és egy epikus +10%-os HP-lap együtt +45% HP-t és három felvett lapot jelent. A pakli ritkasági darabszámai, a lexikon, a pickek, az előnézetek és a multiplayer ugyanazt a katalógust használják. Multiplayer szabályverzió: **32**.

## Ember AI: miért lovag és lándzsás?

Az AI nincs erre a két egységre korlátozva. A célzott értékelésben a kardos-, íjász-, mágus- és katapultbefektetés is képes saját főirányt létrehozni. A pap jellemzően támogató szerepet tölt be.

Befektetés nélkül az alapértékelésben a lovag és a lándzsás közel kerül az első helyhez. A modell költséget, termelési időt és helyfoglalást is számol, de a fejlettebb termelőkre adott fix bónusz és a leegyszerűsített harcérték torzíthat; ez nem winrate-alapú bizonyíték két legerősebb buildre. Ebben a patchben nem módosítunk egységértékeket vagy kényszerítünk előre kiválasztott buildeket.

## Ellenőrzések

- Telített AI-seregnél 200 várakozó egység megőrzése, nulla ismételt újonc-statisztika-lekérés, változatlan piacfrissítés.
- Üres célpontkeresés időzítése és új ellenfél tényleges felvétele; aktív provokálás elsőbbsége.
- Gyógyítás, portálüresjárat és taktikai ellenőrzések költségének célzott regressziós tesztjei.
- Rögzített harci lépések, túlterhelési időkeret és maximális várakozó szimulációs idő.
- Ritkasági statisztikák, tört bónuszok, kedvezménymaximumok, szintfeltételek, pakli és multiplayer-adatok.
