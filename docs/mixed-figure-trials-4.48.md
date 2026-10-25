# Vegyes grafikai csaták – V4.48.0

A TESZTEK menüben pontosan két aktuális próba látható:

- Orkok vs emberek: 100 vs 100.
- Élőhalottak vs orkok: 100 vs 100.

Mindkét oldalon a frakció mind a hét egységtípusa szerepel, típusonként 14 vagy 15 példánnyal, összesen pontosan 100 induló egységgel. Ez darabszám; például a Troll normál sereghelyigénye ettől nem változik. A csaták az alapértékeket és a valódi harci képességeket használják, véletlen fejlesztések és épületi utánpótlás nélkül. A Nekromanta valódi idézése később növelheti a létszámot.

A két próba valamennyi szereplője az elkészült festett megjelenést használja, a hozzá tartozó nyilakkal, varázslatokkal, gyógyítással és Troll-földcsapással. A grafika A/B kapcsoló ugyanabban a csatában vált; szünet, újraindítás és főmenü továbbra is elérhető. A normál játék és multiplayer grafikai engedélyezése nem változott.

A közös beállítás a `src/config/figure-trials.js` fájlban van. A korábbi kisebb grafikai próbák belső regressziós tesztként megmaradnak, menüpontjuk nincs.

A `tests/mixed-figure-trials.cjs` mindkét valódi menügombot, a frakciókat, a pontos induló darabszámot, mind a hét típust, mind a 21 különböző egység új modelljét, az alapértékeket, A/B váltást, újraindítást, 30 szimulált másodpercnyi harcot, korlátos képkockatárat, 1280×800-as elhelyezést és a főmenübe visszalépést ellenőrzi. A jelentés és képernyőképek az `artifacts` könyvtárban találhatók.
