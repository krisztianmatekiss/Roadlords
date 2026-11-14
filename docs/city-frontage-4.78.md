# V4.78.0 – Városfront és csataáttekintő

## Kezelőfelület

Az Építés gomb színes ház–kalapács rajzot, a Pakli három kártyából álló, kék–arany motívumú ikont kapott. A gombok funkciója, billentyűparancsai és akadálymentes nevei megmaradtak.

Az alsó csataáttekintő magassága 116–168 CSS-pixel. A harcoló egységek portréi legfeljebb 68 pixel átmérőjűek, a darabszámok 14–22 pixelesek. Nagyobbak az építményjelölők, a HP-csíkok, valamint a sereg és helyőrség értékei és ikonjaik. A szomszédos képernyőjelölők sűrű csatában közös formációvá olvadnak; az egységszám, típusonkénti bontás és HP változatlan marad. A kalapács és az építőmenü az új magassághoz igazodik. Nincs új panel vagy alsó díszítés.

## Tereptárgyak

Hat új, erős körvonalú, egyszerű rajz készült: erdő, kőlelőhely, termőtalaj, régi alapozás, rom és ősi rom. Külön 256×256-os, átlátszó WebP fájlok, egységes 16 pixeles belső margóval. A hat ikont tartalmazó eredeti generált PNG megmarad; a `scripts/prepare-terrain-art.cjs` az átlátszóság alapján vágja körbe és egységesíti őket. A régi, típusonként eltérő nagyítást, negatív eltolást és túlszínezést felülírjuk: minden kép a saját mezőjében, teljes egészében látszik. Ugyanaz a hat kép szerepel minden frakciónál, egyjátékosban, AI–AI módban, multiplayerben és a régi elrendezésben is.

## Tornyok

Mindkét város elé egy külön előtorony kerül, 17,28 méterre a várostól. A meglévő két vártorony a falnál marad, logikai helyük is a városhatár. A várfal, kapu és vártorony rajza változatlan. A külön torony a frakció meglévő toronygrafikáját használja.

Az előtorony a kapuvédelem része: 27 000 alap HP, 120 alapsebzés, 0,85 mp lövésköz és a meglévő kaputorony-hatótáv. Saját célpont, HP, kattintható vizsgálat és hatótáv tartozik hozzá. A hirtelen halálban a kaputornyokkal együtt fogy az élete, nem kap külön fázist. A három eredeti úttoronyhoz kötött hatások és jutalmak nem változnak.

## Főváros támadása

A főváros a teljes útszélességet lefedő célfelület. Hatótávját a támadó és a városhatár hosszanti távolsága dönti el, miközben az egység a saját oldalsó koordinátáját tartja. Minden támadás saját, az egység vonalában lévő becsapódási pontot kap; különböző egységek célpontja nem írja felül egymást. Az úttornyok továbbra is pontszerű célok, és az élő védőtornyok sorrendje továbbra is megállítja az előrenyomulást.

## Multiplayer

A tornyok állapota a meglévő meccspillanatképben utazik, a vendégnél tükrözve jelenik meg. A falba épített toronygombok az aktuális, helyes oldalon lévő toronyobjektumhoz kötődnek, így HP-juk és vizsgálatuk a következő pillanatképpel is helyes marad. A módosult pálya és célzási szabály miatt a szabályverzió 26; eltérő verziók nem csatlakozhatnak.
