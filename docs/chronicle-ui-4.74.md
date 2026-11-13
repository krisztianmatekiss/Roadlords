# Rajzolt játékvilág – 4.74.0

A jóváhagyott képregényes látványterv alapján kialakított élő játékfelület. A fejlécen a nyersanyagok és a játékvezérlők szerepelnek; a látványterv címe nem része a felületnek.

- Bal felül összecsukott Építés és Pakli fülek. Az építőmenü a pálya fölött nyílik, a kamera mérete megmarad. A Q/W/E/R kategóriák és a számozott építési gyorsgombok működnek; választás után a menü és az előnézet becsukódik.
- A három színes kapumód-gomb a fejléc alatt, a képernyő közepén lebeg.
- A város 10×10-es rácsa folytonos udvart és külön falréteget kapott. Az épületek meglévő képfájljai és forgatásai továbbra is az eredeti megjelenítőből érkeznek.
- A két váronkénti kaputorony a kapuhoz kapcsolódó élő elem: ugyanaz a toronyobjektum, HP, kijelölés és hatótáv. A toronylövedékek a megjelenített kaputoronyból indulnak.
- Alul átlátszó csatavonal: városok és tornyok HP-ja, 20 méteren belül típusonként csoportosított egységek. A portrékörök mérete korlátozottan nő az egységszámmal, a gyűrű a csoport összesített életerejét jelzi. A helyőrség a két város végpontjánál szerepel. Kattintás és húzás mozgatja a kamerát.
- A hirtelen halál tényleges HP-vesztése és jelzése az áttekintőn is megjelenik.

## Fajok és térfélhatár

Az emberi, ork és élőhalott környezet külön képfájl. A közös megjelenítő a helyi játékos és az ellenfél népét olvassa, és a `territoryBoundary()` aktuális világkoordinátáján vágja össze őket. Az élőhalottak területnövelésével a látvány is együtt változik. A tükrözött multiplayer snapshotok ugyanebbe a rendszerbe érkeznek.

A háttér és az udvar külön réteg az épületek, tereptárgyak, egységek, falak és kezelőszervek alatt; a későbbi épületgrafika-csere ehhez az alaphoz illeszthető.

A kiválasztott népek környezete az egységképekkel együtt töltődik be. A görgetés és a térfélhatár mozgatása a gyorsítótárazott textúrákat használja. A textúragyorsítótár mérete fajonként egy, legfeljebb 900 képpont magas csempére korlátozott; az újraméretezésnél leváltott háttérhivatkozások felszabadulnak.

## Játékmódok

Az új nézet az alapértelmezett. Az AI–AI teszt a rendes játék közös felületét és megjelenítőjét használja; indítása az új nézetre vált. A régi elrendezés explicit kompatibilitási opcióként marad elérhető.

## Ellenőrzés

Az automatizált böngészős ellenőrzések valódi építést, kapuvezérlést, portrécsoportokat, hirtelen halált, négy ablakméretet, mind a kilenc fajpárt, élőhalott térfélnövelést és tükrözött multiplayer állapotot vizsgálnak. Az AI–AI próba a normál kezdésből induló két AI-t és a valódi paklikat/választásokat ellenőrzi. Az eredeti épület- és egységképek a meglévő fájlok maradtak.
