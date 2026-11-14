# V4.79.0 – Városvédelem, sebesség és emberi épületgrafikák

## Két végső védőtorony

A városok előtt ismét két, egymás fölött elhelyezett, önálló végső torony áll, a régi elrendezés koordinátáival: 17,28 méterre a várostól, −57 és +40 oldalsó koordinátán. A korábbi `pg-top`, `pg-bottom`, `eg-top`, `eg-bottom` azonosítókat használják. Mindkét torony 27 000 alap HP-val és a meglévő kaputorony-statisztikákkal működik.

A fal festménye, sarkai és kapu melletti tornyai változatlanok. Ezekhez nem tartozik önálló harci objektum, HP-felirat, kattintható vizsgálat vagy külön hirtelenhalál-célpont. Mindkét úton álló torony elpusztítása után közvetlenül a főváros következik, a teljes útra néző oldalán. A meccs összesen tíz védőtornyot tartalmaz, a két fővároson felül.

A hirtelen halál meglévő végső toronyfázisába a négy úton álló kaputorony kerül. A sávban, célzásban és multiplayer-pillanatképekben is csak ezek a valódi védők szerepelnek. A vendégnél a tornyok mindkét koordinátája ugyanúgy tükröződik, mint az egységeké és a lövedékeké.

## Sebesség

Az egyjátékos és multiplayer kezelőfelület közös `[1, 2, 3]` sebességlistát használ. Az egyjátékos kör: 1× → 2× → 3× → 1×. Multiplayerben a gyorsítás továbbra is beleegyezést igényel, a lassítás a meglévő szabály szerint működik. A régi 4× érték már nem választható.

## Emberi épületek

Két új, átlátszó PNG atlasz tartalmazza a 23 jelenlegi emberi épületet. Erős körvonal, visszafogott kő- és faszínek, különböző tetők, kék csapatzászlók és a funkciót jelző részletek váltják a korábbi aprólékos térképi festményeket. A főépület is új rajzot kapott; a kártyák grafikája nem változik.

Az eredeti generált PNG-k és a régi források megmaradnak. A `scripts/register-chronicle-human-atlas.cjs` rögzíti a kivágásokat és pixelazonos, veszteségmentes WebP változatot készít. A térképi renderer külön SVG-vágást ad minden épülethez, így széles vagy magas helyfoglaláskor sem látszanak át az atlasz szomszédos rajzai. A négy forgatás, az L alak szabad sarka, az építési előnézet és a játéklogikai mezők változatlanok.

Az emberi képtöltő csak a jelenlegi épületek által használt két új atlaszt készíti elő. A már nem használt régi térképi atlaszok nem meccsindítási függőségek.

A megváltozott toronyelrendezés és sebességlista miatt a multiplayer szabályverzió 27. A játékkártyák, egységstatisztikák és gazdasági értékek változatlanok.
