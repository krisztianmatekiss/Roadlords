# 4.75.0 – Környezet és felület

A javítás a valódi ork–élőhalott AI-meccs és a menük végigkattintása során talált megjelenítési gondokat kezeli.

- Az út felső és alsó széle pontosan a város külső méretéhez igazodik. Az egységek lábpontjait és a kijelölt torony hatótávját ugyanaz a megjelenítési geometria helyezi el. A harci világkoordináták, sebességek és távolságok változatlanok.
- Külön háttér-, út- és előtérréteg mindhárom fajhoz. Ember: füves-köves táj. Ork: hamus föld, bazalt és csontok. Élőhalott: repedt kövezet, gyökerek és sírmaradványok. A térfélhatár továbbra is az aktuális területuralomnál váltja mindhárom réteget.
- Nagyobb, külön rajzolt úttorony és kaputorony mindhárom fajnak. Eltérő kőfal, agyaras fa-vasszerkezet és gótikus temetőfal. A tornyok valódi HP-ja, sebzése, kijelölése és hatótávja megmaradt.
- Egységes papír–tinta stílus a főmenüben, almenükben, fajválasztásnál, pályaválasztásnál, választóablakban, épületablakoknál, szünetmenüben és a meccs végén. Külön menüháttér.
- Alsó csataáttekintő: a képernyőn összetorlódó húszméteres csoportok olvasható formációkban jelennek meg. A pontos típusonkénti darabszám megmarad; rámutatva részletes buborék mutatja az összetételt. Ritkább toronyfeliratok, lábnyom és pajzs a sereg/helyőrség jelzéséhez.
- Kijavított fejlécbeli sortörés, levágódó menücím és több gyenge kontrasztú felirat. A szünetgomb alakzatot használ a hiányzó karakter helyett. A beállítások a pályamozgatás gyorsgombjait is felsorolják.

A rétegek és az erődítmények a rendes egyjátékos, multiplayer és AI–AI mód közös megjelenítőjét használják. Az épületek és harcoló egységek képfájljai nem változtak.

Ellenőrzés: valódi meccs négy játékpercig, főmenü és minden fő ablak végigkattintása, négy ablakméreten egyező város/út méret, tényleges toronykattintás, zsúfolt áttekintő darabszámai, multiplayer térfélhatár, ablakkezelés, képek késleltetett betöltése és harci regressziótesztek.
