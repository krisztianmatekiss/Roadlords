# V4.19.0 – arányos városok és számlálók a zöld sávban

2026-10-21. Linux, Node.js 24, headless Chromium, 1440×960. Az ellenőrzések a kész production buildet futtatják `/Roadlords/` alatt; a helyi funkcionális tesztekben a külső HTTPS-forgalom tiltott.

## Városok és alsó zöld sáv

A városkeret az út felső és alsó szegélyéig ér; a 600 magas terepcsempe 49–551 közötti útsávjához igazodik. Az oldalhossz a pályanézet magasságának 502/600-ad része, egész képpontra kerekítve. A belső rács és a cellák négyzetesek; az épületképek arányai megmaradnak. A görgethető világ szélessége 4800 + 2 × városméret, a harci távolságok, egységek és toronyhelyek változatlanok. A világ szélein kilógó díszítések vágva vannak, így nem növelik meg utólag a görgetési határt. A felső kezelőfelület és az építési sáv korábbi méretezése megmaradt. Az építési súgó és az értesítések a számlálók fölé kerültek, így nem takarják az alsó zöld sáv adatait.

Az eredeti helyőrségi/sereg-azonosítókat és portrécsomópontokat az alsó zöld sávba helyeztük át, háttérpanel nélkül. A Saját / Ellenfél kapcsolóval az ellenfél számlálói is elérhetők. A kijelző a képernyőn marad görgetéskor; alacsony ablakban kompakt számlálós nézetre vált. A főváros-HP ugyanazt az élő adatot mutatja a kapu alatt, akadálymentes értékkel és maximumkijelzéssel; a multiplayer név eredeti csomópontja a kapu fölé került. Az ikonkapcsoló megszűnt, a városi jelzések bekapcsolva maradnak. A zöld szegély nagyítás közben is megmarad. Minitérkép nem került be.

**14 új böngészős ellenőrzés:** négyzetes város/rács/cella, útszegélyhez igazodás, nagyobb világ és helyes pályakezdet, eltávolított régi fej/lábléc és ikonkapcsoló, keret nélküli számlálók a zöld sávon, valós tesztsereg és portrék, helyőrségi és ellenséges adatok, HP-változás és maximum, multiplayer nevek, működő kapu, rögzítés és görgetés, 3804×1746 / 1440×960 / 800×900 nézetek, futási hibák. A normál szólópróba egy további ellenőrzése valódi kártyakattintásból és a megnagyobbított rácsra kattintásból épít favágót. Képek: `artifacts/city-layout-1920.png`, `city-layout-3804.png`, `solo.png`.

## Kapukijárat és egységméret

A normál `releaseUnit` mindkét oldalon a tényleges kapunyílásból indít. A kapu az út keresztirányában 104–208 helyett 156–312 képpont magas (50%-os bővítés), a fal vastagsága változatlan. A kilépési koordinátát a kapu aktuális képernyőhelye, a pálya magassága és a nagyítás adja, a figura fejének/lábának hagyott ráhagyással. A geometria méretváltozásig gyorsítótárazott, egy hullám nem kér minden katonához új layoutmérést. A szélesebb menetpozíció mozgási cél marad, nem kezdőpozíció; odáig ténylegesen elsétálnak. A helyőrség és a gyülekező ugyanazt a kijáratot használja. Az előre felállított tesztseregek és a harctéri képességből keletkező egységek helye megmarad.

A 240 látható egység feletti részletcsökkentés korábban 0,78-as méretszorzót is alkalmazott, ezért a csata tömegétől vagy a kamerától függően a figurák összementek, majd visszanőttek. A méretszorzót eltávolítottuk; a részletcsökkentés továbbra is elhagyhat kiegészítő jelzéseket. A kézi nagyítás működik.

**9 új ellenőrzés:** 50%-os kapunyílás mindkét oldalon; 70 kijövetel a 14 egységtípussal, a valódi kapunyílás határai között; külön kilépési és menetpozíció; zárt kapu és tényleges helyőrségi/gyülekező-kieresztés; folyamatos, sebességhatáros széthúzódás; mind a 14 modell rajzolási mérete 240 → 241 → 240 látható egységnél, egyszerű és részletes módban; kézi zoom; átméretezés utáni újramérés; futási hibák. Kép és jelentés: `artifacts/gate-exit.png`, `gate-and-scale.json`.

## Pályamozgatás és rögzített város

A lebegő pályapanel normál játékban megszűnt. A tesztek vezérlői a meglévő alsó parancsterületen maradnak, nem takarják a harcot. A felbontást, a fő elrendezés sorait és a harci szabályokat nem módosítottuk. A város korábbi 440 képpontos méretét a V4.19.0-ban az arányos, útszegélyhez igazodó méretezés váltotta fel.

Az **A / D** egyszeri és folyamatos mozgatást, a **dupla A / D** szélre ugrást, az **F** az aktív harc legnagyobb csoportjához vagy ostromához ugrást ad. A frontkeresés egyszeri, lineáris bejárás, billentyűnyomáskor fut. A kamera szünetben is mozgatható; gépelés és nyitott választóablak közben nem lopja el a billentyűket. A görgős pályamozgatás a V4.17.3-ban ismét elérhető, az A/D alternatívájaként; a vízszintes trackpad és a különböző görgőlépés-mértékegységek is kezeltek. Ctrl/Command + görgő megmarad a böngészőnek.

Az idő előtti ikon alapból bekapcsolt, Excel-szerű városrögzítést vezérel: ugyanaz az élő ellenfélváros marad a jobb szélen, nem klón és nem külön szimuláció. A rögzítés scroll/resize eseményekre módosítja a város vízszintes helyét; nincs képkockánkénti városmásolás. F a rögzített város mellett szabadon maradt pályarész közepére viszi a harcot. A teszt indulása is ide céloz. Kis képernyőn a teljes méretű város sok helyet foglal; az ikon kikapcsolásával visszaáll a pályával együtt mozgó város.

**17 új böngészős ellenőrzés**: alapértelmezett rögzítés, ki/be kapcsolás, változatlan méretek, egyetlen élő város és HP-frissítés, alsó tesztvezérlők, szünet alatti mozgás, nyomva tartás/felengedés, dupla leütés, kétirányú görgős pályamozgatás, fő harccsoport és külön ostrom, gépelés/választóablak, átméretezés, keskeny nézet, futási hibák. Egy további ellenőrzés a valódi szólókezdés után vizsgálja a gyorsgombokat és a lebegő panel hiányát. Képek: `artifacts/navigation-pinned-cities.png`, `navigation-pinned-front.png`, `solo.png`.

A toronyhelyek változatlanok: oldalanként a három úti torony közötti rések 600 és 648 útegység, az alap toronylőtáv 165. A kapupár 97 oldalirányú egységre áll egymástól, azonos hosszirányú helyen; a legközelebbi úti torony 432 egységgel kijjebb van. Ez méretarány-ellenőrzés, nem új egyensúlymérés.

## Grafika

V4.17.1: az összes próba a főmenü egyetlen **TESZTEK** pontjába került, saját VISSZA/Escape visszalépéssel. A normál játék és a vegyes 50/500-as csaták ismét az egyszerű figurákat használják. A részletes kétkarakteres minta a grafikai próbában marad; a **Grafika: Részletes / Egyszerű** kapcsoló ugyanabban a csatában vált megjelenést, a létszámot, HP-t, pozíciókat és időt nem módosítja. Újraindításkor a választott grafika megmarad.

A menetirányt már a tényleges elmozdulás adja, az aktuális támadás pedig a találati cél felé fordítja a figurát. A korábbi célpont- vagy lejárt támadásirány nem írja ezt felül. Mindkét csapatot és mindkét megjelenést valódi harci lépésen át vizsgáljuk; a Canvas tényleges rajzolási transzformációjából ellenőrizzük az előrehaladás, megfordulás és támadás irányát. A multiplayer vendég rajzolása az interpolált haladásból állapítja meg az irányt, a 20 oszlopos hálózati formátum megmaradt.

Két részletes minta készült az eredeti illusztrációk alapján: **kardos és ork harcos**. A generált, átlátszó atlasz öt külön mozgatható elemet tartalmaz karakterenként: torso/fej, fegyverkar, pajzskar, hátsó láb, első láb. Az atlasz összeállított referenciafiguráit nem használjuk mozgó állóképként. A többi 12 típus a V4.16 procedurális figuráit tartja meg. A részletes változatok kizárólag a grafikai próbában választhatók.

Az új **GRAFIKAI PRÓBA · Kardos / Ork** menüpont 20/20 egységet indít valódi, teljesen fejlesztett városokkal és harci szabályokkal. A kezdő nagyítás 175%; a harctéri −/+ gombokkal változtatható. Újraindításkor megmarad a kétkarakteres mód, darabszám és városmag.

Az atlasz 1774×887 RGBA PNG, kb. 2,1 MB. Eredet, SHA-256 és forrásképek: `art-samples-v4.17.json`. Az eredeti forrásképek változatlanok. A böngésző a komponenseket elkülöníti, majd csak a kék ruházat/pajzsfestés színét módosítja. Mind a nyolc választható csapatszín ellenőrzött; az ork torso 7761 vizsgált bőrpixelének anyagszíne minden változatnál megmaradt. Az arany fémrészek is megmaradnak.

A kész animációs képkockák gyorsítótárazottak: legfeljebb 768 darab, a részletes mintáknál 192×192, a többi típusnál 128×128 pixel. A színezett alkatrészek tára legfeljebb 16 készlet; az atlaszfeldolgozás nem képkockánként történik. Ez festett textúrákból összeállított 2D/2.5D animáció, nem teljes 3D vagy anatómiailag teljes csontváz. A két minta a további 12 figura művészeti irányának kipróbálására szolgál.

## Baráti áthaladás

A saját egységek nem blokkolják és nem lassítják le egymás előrehaladását. Megmarad egy enyhe oldalirányú széthúzás, a sűrű tömegben viszont a baráti átfedés szándékos. Az ellenfeleket a mozgási szakasz ütközésvizsgálata és a különválasztó lépés tartja távol. A támadótáv változatlan.

A három mozdulatlan baráti sorral végzett próbában a katona 2 szimulált másodperc alatt 83,89 útegységet haladt az üres úton mért 84,00 helyett; a legközelebbi baráti távolság 1,22 volt, vagyis ténylegesen áthaladt a saját sorokon. A 30 szimulált másodperces 500/500 próbában 0, tíz útegységnél közelebbi **ellenséges** pár volt; a baráti átfedéseket külön mérjük, és nem minősítjük hibának.

## Tornyok

Az első élő ellenséges torony a teljes útszélességet lezárja, 18 útegységnyi első oldali megállási vonallal. A korlát a közös pozícióállító függvényben is érvényes: a képességek, eltolások és ütközési korrekciók sem juttatják az egységet mögé. A közvetlenül elhelyezett egységek pozícióját a harci lépés elején és végén is korrigáljuk. A torony mögötti célpont nem választható üldözéshez; a Warg Ragadozó képessége is követi ezt.

A teszt mindkét csapatot az út közepén és a két szélén ellenőrzi. Valódi késleltetett közelharci támadás pusztítja el az első, középvonaltól −57-re eltolt tornyot; a hatótáv a tényleges oldalsó koordinátát veszi figyelembe; ezután csak a következő toronyig nyílik meg az út. Az utolsó torony után a főváros válik célponttá.

## Ellenőrzések és korlátok

**113 sikeres ellenőrzés:** 14 új városelrendezési próba, 9 új kapukijárati/méretstabilitási próba, 17 új pályamozgatási/városrögzítési próba, 22 menü/grafikai/menetirány/áthaladási/toronypróba, 2 régi város- és egységadat-összehasonlítás, 16 harc/animációteszt, 28 böngészős játékteszt, 5 multiplayer-protokollteszt. A szabályos endgame összeállítások, pontos 50/500 induló létszámok, mozgó és rögzített felületek, szünet/újraindítás/főmenü, találati időzítések, normál szólójáték kezdő választásai, gazdasága és AI-ja továbbra is ellenőrzöttek.

A három rögzített 50/50 csata 26,4–32,0 szimulált másodperc alatt eldőlt; mindegyikben mind a 100 egység mozgott vagy támadott, és nem maradt tartósan tétlen közelharcos. A korábbi V4.17.1 helyi mérésben az 50/50 kb. 48,4 FPS, az 500/500 kb. 9,0 FPS volt. Ezek headless felhőgépes adatok: a felhasználó a V4.16 500-as változatán saját gépén 60 FPS-t jelzett, így a különböző környezetek nem hasonlíthatók közvetlenül. Stabil 60 FPS-t minden eszközre továbbra sem állítunk.

A rögzített harci próbák külön, frissen betöltött runtime-ot kapnak; így nem öröklik az előző csata és képernyőképezés után maradt állapotot. A 7-es magú próbát külön a `b7ed759` változattal is összevetettük: azonos induló városok/egységek, 26,4 másodperc, 662 támadás, 25/0 végső létszám. A harci tesztek eredeti mozgási, holtpont- és lezárási követelményei megmaradtak.

A valódi WebRTC-próba itt **környezeti akadály miatt kihagyva**: Chromium nulla ICE jelöltet szolgáltat. Az 1000 egységes csomagküldés, tükrözés és vendégparancsok tesztje sikeres; két internetes gép közötti kapcsolat ebből nem következik. A felhős Chromium éles HTTPS-próbájának korábbi tanúsítványkorlátját nem kerüljük meg. A GitHub Actions a kiadást ismét felépíti és ellenőrzi, mielőtt Pages-re teszi.

A jelentések és képek az `artifacts/` mappában, CI-ben a `test-results` artifactban találhatók. Korábbi fázis: [V4.16](history/v4.16-test-results.md).
