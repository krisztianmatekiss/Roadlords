# V4.52.0 – Haditanács, rövid leírások és városképminták

A Haditanács a korábbi Haditermelési Központ új megjelenő neve. A belső `warcenter` azonosító, a képzési módok, előnyök, hátrányok és váltási szabályok megmaradtak. A kártya egy mondatban mutatja a három irányt; a konkrét százalékokat a módválasztó és a lexikon Működés része mutatja.

A 66 épülettípus kiválasztott szintű kártyaleírásait átnéztük. A Lélekhorgony most azt mondja, hogy az aktuális hatótávon belüli épületek 50%, L4-en 90%-kal kevesebb Lelket fogyasztanak. Önmagára nem hat, és csak a legerősebb csökkentés érvényes; ezek a lexikon részleteiben olvashatók. Többek között a Kocsma, Őrház, Kórház, Könyvtár, Rohamalagút, Sötét Őrtorony, Lélekbank, Lélekégető, Pestiskamra, Lélektúlhajtó, Keltető, Újjászületés Sírja és Holtak kertje szövege is javult. Az épületek tényleges működése nem változott.

A kivételek és korlátozások a lexikon saját épülethez tartozó részleteibe kerültek. A fontos hátrányok a rövid kártyán is szerepelnek: például a Keltető sérült egységeket ad, a Lélekégető életerőt veszít, a Lélektúlhajtó háromszorozza az épületek fogyasztását. Az extra lélekfogyasztás piros, a megtakarítás zöld.

## Három működő térképi minta

- Favágó: kis, 1×1-es tölgyfa épület, kék palatető és farakások.
- Raktár: hosszúkás, 2×1-es kő-fa épület; elforgatva 1×2.
- Akadémia: 2×2-es világos kőépület, kék tetőkkel, udvarral és arany csillagászati gömbbel.

A minták a kártyák építészeti motívumait használják. A teljes sorozat előtt ez a három példa szolgál a városi összkép megítélésére. A képek a normál játék megfelelő emberi épületein is aktívak.

Az eredeti, változatlan generált atlasz a `public/art/human/map-samples.png`. A `src/data/human-map-art.json` külön nézetablakokat és forrás-hash-t tartalmaz. A nézetablakokat az átlátszó környezetben álló három teljes sziluetthez igazítottuk; a PNG képpontjai nem módosultak. A háttér valódi alfa, nincsenek négyzetes tereplapok. A megjelenítő a valódi épületalaprajzból számolja a síkot és annak 90 fokos forgatását, ugyanúgy, mint a meglévő frakciógrafikák.

A megjelenítés városonként követi a fajt. Az orkok közös Raktára ezért nem kap emberi mintaképet, az építési szellem pedig a saját város faját használja. Az induló menü mögött ezek az SVG-k is a már meglévő halasztott képletöltést használják.

## Ellenőrzés

A célzott böngészős ellenőrzés mindhárom épület négy tényleges elhelyezését és építési szellemét vizsgálja, a transzformációs mátrixszal, foglalt mezőkkel és forgatott rácsméretekkel. Külön ellenőrzi a frakciók elkülönítését, a Lélekhorgony L1–L4 értékeit, a Haditanács módválasztóját és a tényleges lexikonkártyát. Az összes faj összes kártyájának olvashatósági ellenőrzése 800, 1366 és 1920 képpontos ablakban is átment.

A városi próbakép a `public/previews/human-city-map-samples.png`; a képen szereplő elhelyezések bemutatóadatok.
