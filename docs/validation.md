# V4.17 – részletes minták, baráti áthaladás, toronysorrend

2026-10-20. Linux, Node.js 24, headless Chromium, 1440×960. Az ellenőrzések a kész production buildet futtatják `/Roadlords/` alatt; a helyi funkcionális tesztekben a külső HTTPS-forgalom tiltott.

## Grafika

Két részletes minta készült az eredeti illusztrációk alapján: **kardos és ork harcos**. A generált, átlátszó atlasz öt külön mozgatható elemet tartalmaz karakterenként: torso/fej, fegyverkar, pajzskar, hátsó láb, első láb. Az atlasz összeállított referenciafiguráit nem használjuk mozgó állóképként. A többi 12 típus a V4.16 procedurális figuráit tartja meg. A részletes változatok a normál játékban, a TESZT-ben és az 500-as próbában is szerepelnek.

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

**61 sikeres ellenőrzés:** 12 grafikai/áthaladási/toronypróba, 2 régi város- és egységadat-összehasonlítás, 16 harc/animációteszt, 26 korábbi böngészős játékteszt, 5 multiplayer-protokollteszt. A szabályos endgame összeállítások, pontos 50/500 induló létszámok, mozgó és rögzített felületek, szünet/újraindítás/főmenü, találati időzítések, normál szólójáték kezdő választásai, gazdasága és AI-ja továbbra is ellenőrzöttek.

A három rögzített 50/50 csata 27,6–32,0 szimulált másodperc alatt eldőlt; mindegyikben mind a 100 egység mozgott vagy támadott, és nem maradt tartósan tétlen közelharcos. A helyi mérésben az 50/50 kb. 52,8 FPS, az 500/500 kb. 11,0 FPS volt. Ezek headless felhőgépes adatok: a felhasználó a V4.16 500-as változatán saját gépén 60 FPS-t jelzett, így a különböző környezetek nem hasonlíthatók közvetlenül. Stabil 60 FPS-t minden eszközre továbbra sem állítunk.

A valódi WebRTC-próba itt **környezeti akadály miatt kihagyva**: Chromium nulla ICE jelöltet szolgáltat. Az 1000 egységes csomagküldés, tükrözés és vendégparancsok tesztje sikeres; két internetes gép közötti kapcsolat ebből nem következik. A felhős Chromium éles HTTPS-próbájának korábbi tanúsítványkorlátját nem kerüljük meg. A GitHub Actions a kiadást ismét felépíti és ellenőrzi, mielőtt Pages-re teszi.

A jelentések és képek az `artifacts/` mappában, CI-ben a `test-results` artifactban találhatók. Korábbi fázis: [V4.16](history/v4.16-test-results.md).
