# V4.83.0 – Egységek, kapu és épületválasztások

| Változás | Új érték |
| --- | --- |
| Lovag alapsebzés | 24 |
| Csontváz Íjász alapsebzés | 4 |
| Csontváz Íjász hatótáv | változatlan, 26 m |
| Warglovas lándzsadobás | 1., 4., 8., 12., … támadás |
| Nekromanta idézési idő | 20 mp |
| Korai épületválasztási súly vége | 12:00 |

**Lándzsamesterek:** a Warglovas minden támadása lándzsadobás. **Gyorsított rítus:** a Nekromanta idézési ideje feleződik, 20-ról 10 másodpercre. Mindkettő legendás, a saját egységet képző L4 épületet igényli. Saját illusztrációjuk ugyanabból a nyilvántartásból töltődik a pickbe, a pakliba és a lexikonba. A forráskép megmarad; a böngésző optimalizált WebP-t használ.

A Warg ritmusát a ténylegesen megkezdett normál támadások számolják, az egységek és épületek elleni támadások közösen. Az ingyenes Vérszomjas vadászat és Lándzsaeső utánütései nem léptetik ezt a számlálót; eredeti hatásaik megmaradnak. A dobás a meglévő animációt és becsapódási sebzést használja, nem okoz előre vagy kétszer sebzést. A Nekromanta idézett egységeinek száma, ideiglenessége és sereghely-szabálya nem változik.

Az első 12 percben az alap ajánlattípus-esélyek: 50% épület/épületfejlesztés, 45% normál, 5% legendás. Utána 25/70/5%. A Bő választék legendás esélye 10%, a négy kezdő ajánlat nem számol a legendás garanciába; 19 sikertelen rendes ajánlat után a 20. legendás. A normál lapok gyakori/ritka/epikus megoszlása változatlanul 70/25/5%.

A mozgó kapuajtó a külön kapudoboz helyett a teljes várfallal közös, 1000×1000-es koordinátarendszerbe kerül. A forrásgrafika ajtórésze pontosan a saját kivágását fedi; az ellenfél oldalán mindkettő ugyanúgy tükröződik. A nyitott/zárt állapot továbbra is a tényleges kapuműködést követi, automata módban is.

Az AI értékbecslése figyelembe veszi az új Warg-ritmust és a Nekromanta tényleges idézési idejét. A stratégiai választás módja ebben a patchben nem változik: a pontozott, korlátozott előretekintés és az előző terv megtartása továbbra is gyakran azonos, magasra értékelt irányokhoz vezet. A hasonlóan erős és működőképes alternatívák közötti változatosabb választás külön következő feladat.

Multiplayer szabályverzió: **30**. A Warg számlálója és az új legendások a meglévő város-/egységállapottal együtt szinkronizálódnak; a résztvevők azonos verziót használjanak.
