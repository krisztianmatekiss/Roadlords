# V4.18 – város, alsó sáv és körbejárható ostrom

2026-10-20. Linux, Node.js 24, Chromium. Production build `/Roadlords/` alkönyvtárból, külső HTTPS nélkül futtatott funkcionális próbák.

## Elrendezés

A város kerete négyzetes és a harctér teljes rendelkezésre álló magasságát tölti ki. A világ városszélessége, a canvas mérete és a görgetés horgonyai átméretezéskor együtt frissülnek. A zoom mindkét városfalat a csatatér megfelelő széléhez rögzíti. A 10×10-es építési terület és a szabályos épületelhelyezés megmaradt; tényleges egérkattintással is ellenőrzött az új cellaméret mellett.

A helyőrség és a sereg eredeti DOM-elemei kerültek az építési sáv fölé, balra és jobbra. A portrék és számlálók megőrzik a meglévő frissítési útvonalakat; a seregkapacitás továbbra is figyelembe veszi az eltérő helyigényű egységeket és szállított katonákat. A Saját/Ellenfél kapcsoló egy helyen mutatja bármelyik csapat adatait. A főváros HP-csíkja a kapu alatt, a multiplayernév fölötte jelenik meg. A normál játékból eltűnt a lebegő harctéri panel. A tesztek FPS-kijelzése és vezérlése az alsó sáv része.

A méretezés 900×768, 1440×960 és 1920×1080 nézetben ellenőrzött. Egyedi, szélsőséges képarányokra ez nem teljes körű garancia.

## Torony és főváros

A korábbi toronyrajz 2,4-es alapszorzót kapott, a harctér magasságával és zoomjával együtt méretezve. A HP-felirat és a tényleges kattintható terület is követi ezt. A rajzolás az egységeket és a tornyokat közös mélységi sorrendben kezeli.

A nagyobb torony közelharci távolságát a peremétől mérjük. Nyolc körkörös megközelítési irány osztja el a közelharcosokat, és a torony teste nem járható át. Az első élő ellenséges torony mögött egy helyi harci terület nyílik meg; a többi útszakasz zárt marad. Ez tudatos játékszabály, nem általános útkereső rendszer. A baráti áthaladás megmaradt; nagyon nagy tömegben a baráti átfedés szándékos.

A torony közelében kezdett egységharc 2,5 másodperc után visszaadja a torony elsőbbségét, ha az lőtávon belül van. A toronytól távolabb eső ellenfél üldözése nem viheti a katonát a következő szakaszra. A toronyra bevitt valódi találat feloldja ezt az elsőbbséget, így ismét védekezhet közeli egység ellen. Testi akadályokkal elzárt helyzetben a visszatérés ideje nem garantált.

A kétoldali, nyolc katonás 20 másodperces próbákban oldalanként mind a nyolc katona támadott: 124 valódi toronytalálatból 43 a túloldalról érkezett. A minimum távolság a torony közepétől 43,1 útegység volt, a torony teste nem került átfedésbe a katonaközépponttal. Az ellenfél elleni kitérő mellett 3,40 és 7,53 másodpercnél toronysebzés is történt, az ellenfél még élt.

A fővárosnál a teljes fal támadható. Mindkét oldal kardosával és íjászával, a −228/0/+228 oldalsó pozícióból ellenőrzött a valódi sebzés és a találat oldalsó koordinátája. A katonák nem húzódtak a középvonalhoz. Az egység-egység harc geometriája változatlan; az épületek elleni új geometria szándékosan módosítja a toronyhoz érkezés idejét és az ostrom eloszlását. A hosszú normál meccsek egyensúlya külön játéktesztet igényel.

## Ellenőrzések és korlátok

A teljes csomag 86 ellenőrzést tartalmaz: 15 új város/ostrompróba, 22 menü/grafikai/áthaladási próba, 2 archiváltadat-összehasonlítás, 16 harc/animációpróba, 26 böngészős játékteszt és 5 multiplayer-protokollteszt. Az eredmények az `artifacts/` mappába kerülnek; a GitHub Actions ugyanazt a csomagot futtatja közzététel előtt.

A valódi internetes WebRTC-kapcsolat környezeti akadály miatt kihagyott, amennyiben Chromium nem ad ICE-jelöltet; ezt a külön WebRTC-jelentés rögzíti. A protokollteszt 1000 egység 20 oszlopos csomagját, tükrözését, találati koordinátáit és vendégparancsait ellenőrzi. A fejlesztői felhőgép FPS-adatai nem hasonlíthatók közvetlenül a játékos által saját gépen jelzett 60 FPS-hez.

A részletes kétkarakteres grafika továbbra is kísérleti, csak a grafikai próbában választható; a normál játék és a vegyes seregek az egyszerűbb figurákat használják. Az eredeti grafikák és gazdasági/egységadatok megmaradtak. Előző ellenőrzés: [V4.17.1](history/v4.17.1-test-results.md).
