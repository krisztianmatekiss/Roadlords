# V4.15 első szakasz – ellenőrzés

Ellenőrzés: 2026-10-20, Node.js 24, Linux, headless Chromium, 1440×960. A tesztek a kész `dist/` változatot szolgálták ki `/Roadlords/` alatt. Külső HTTPS-kérések a funkcionális tesztekben blokkolva voltak; a helyi grafika és PeerJS ettől függetlenül betöltődött.

## Eredmények

- `bash scripts/install.sh`: fagyasztott lockfile-ból telepítés, sikeres Vite production build.
- `bash scripts/start.sh` kétszer: a kész kiadás elindult; az ismételt indítás felismerte a működő kiszolgálót. A kész HTML és a JavaScript bundle HTTP-válasza ellenőrzött.
- `npm test`: **33 sikeres ellenőrzés**: 2 eredeti/moduláris összehasonlítás, 26 böngészős játékteszt, 5 multiplayer-protokollteszt. Alkalmazáshiba nem volt.
- Az archivált V4.14 és a moduláris kiadás 42-es maggal azonos városokat, fejlesztéseket és 1000 egységstatisztikát hozott létre. Azonos véletlenszám-sorozattal 180 valódi harci lépés után a pozíciók, életerők és veszteségek is megegyeztek.
- A főmenü TESZT gombja, az oldalanként pontosan 500 egység, mind a 14 egységtípus, szabályos endgame városok, négy további rögzített összeállítás, térképgörgetés, rögzített HUD, szünet, újraindítás, győzelem és főmenübe visszalépés ellenőrzött.
- Közelharci találat, lövedék becsapódási ideje, távolsági geometria, halálállapot és 900 harci lépés ellenőrzött.
- A normál szólójáték fajt választott, négy kezdő választást végigvitt, gazdaságot és AI-t futtatott.
- A multiplayer valódi küldő/fogadó függvényei 1000 egységet és a megőrzött ork állapotmezőket kezelték; a vendég tükrözése és parancsai ellenőrzöttek. Ez protokollteszt, nem internetes kapcsolat igazolása.
- A 153 kiszervezett képfájl mérete és SHA-256 lenyomata egyezik a migráció során rögzített eredetivel.

## Mért teljesítmény és határok

Az utolsó 12 másodperces futás átlagosan **16,5 FPS**-t ért el ebben a headless felhőkörnyezetben; a végén 494 és 474 egység élt. A 900 lépéses mérésben a harci lépés mediánja 12,3 ms, 95. percentilise 21,5 ms volt. Ez nem felhasználói gépen mért vagy stabil 60 FPS-es eredmény. A mozgás/rajzolás optimalizálása és a felhasználó által jelzett tétlen csapatok javítása a következő szakasz.

A 30 szimulált másodperces vizsgálat végén 879 egység élt; a 10 pályaegységnél közelebbi súlyos átfedések száma 0 volt. Ez a szűk ellenőrzés nem igazolja a mozgás és a frontvonal természetességét. A prototípus új animációs rendszerét ez a kiadás még nem vezeti be.

A kész kezdő HTML 8,1 kB; a minifikált JavaScript kb. 820 kB (gzip kb. 256 kB), a teljes statikus kiadás kb. 34 MB. A build ezért nagy JavaScript-csomagra figyelmeztet. A képek továbbra is az eredeti részletes grafikák; az archívum és a referenciaprototípus nem kerül a webes kiadásba.

## Külső szolgáltatások

A valódi RTCDataChannel teszt **kihagyva/környezeti akadály**: Chromium nulla helyi ICE jelöltet adott. Internetes PeerJS-jelzés, STUN/TURN és két külön gép közötti játék nem igazolt.

A zenei repository új felhasználónév alatt létezik; a menüzene URL-je HTTP 206 `audio/mpeg` választ adott. A felhős Chromium HTTPS hangbetöltése tanúsítványhibába ütközött; tényleges hanglejátszást itt nem igazoltunk. A helyi zenekatalógus használata megszünteti a futás közbeni GitHub API-függést.

A GitHub natív Git-elérése működik. A GitHub API és a tervezett Pages-cím a felhő hálózati proxyján 403/Forbidden választ adott. Ebből nem állapítható meg, hogy a nyilvános oldal létezik-e; működő éles linket nem állítunk. Az első Pages-aktiválás lépéseit a README tartalmazza. A felhőkörnyezet új indítási/telepítési utasításainak mentése konfigurációs tervezet; az élesítéshez a környezet beállításainál mentés és Publish szükséges.

A géppel előállított aktuális jelentések az `artifacts/` mappába kerülnek; CI-ben letölthető `test-results` artifact készül.
