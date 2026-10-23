# Kártyák és harci effektek · 4.29.0

## Kártyaképek

A felhasználó által megadott képcsomag forrása: [roadlords-music/cards/orc](https://github.com/krisztianmatekiss/roadlords-music/tree/45849177e974f61d8e679aa38c693298d8b6f1e8/cards/orc). A játékban **19 épületkép és 32 fejlesztéskép** található helyi WebP-ként. A választó és a lexikon a teljes képet használja, 2:3 képaránnyal; a cím és a szöveg a manifest megadott, üres dobozaiba kerül. Nincs képre égetett szöveg és nincs harmadik féltől függő képbetöltés. A többi faj ugyanezeket a cím-, kép- és szövegterületeket kapja CSS-kerettel.

A forrásmanifest 55 képet sorol fel, de az alábbi négy Git-objektum tényleges mérete nulla bájt:

- `upgrades/orc_crowded_huts.webp`
- `upgrades/orc_curse_master.webp`
- `upgrades/orc_curse_spread.webp`
- `upgrades/orc_shaman_common.webp`

Ezek, valamint a csomagban nem szereplő lapok a meglévő illusztrációt és a közös keretet használják. Az üres fájlokat nem telepítjük. Az érvényes 51 kép SHA-256 ellenőrzése egyezik a kapott manifesttel. A szállított manifest külön rögzíti a hiányzókat és a forráscommitot. A közös egységképek a megfelelő életerő-/sebzéslapokhoz is használhatók; az azonos nevű épület- és fejlesztésképek külön névtérben maradnak.

## Szöveg és lexikon

Egy épületből egyszerre egy kiválasztott szint látható. Az értékek elkülönített referenciavárosból, valódi épület- és képzési függvényekkel készülnek. A kezdeti és a kiválasztott szint értékeit nem ismételjük meg egymás alatt. Az L4 ágai nyithatók; a három haditermelési mód adatai szintén a kiválasztott szinthez igazodnak. A bonyolult működés külön nyitható, az egyszerű épületekhez nincs magyarázó bekezdés.

A választólapokról eltűnt a külön „Jelenleg → Felvétel után” fejléc, a hosszú számítási környezet és az ismétlődő halmozhatósági bekezdés. Az értékváltozás megmarad. A felvételszám a láblécben, a korlát az egérmutató alatti súgóban olvasható. Az építési sáv kis kártyái képet, címet és árat mutatnak; a hosszú leírás nem zsúfolódik bele az apró dobozba.

A színezés kizárólag szövegcsomópontokat kezel, nem írja át az ikonokat vagy HTML-attribútumokat. Méreg: zöld; égés/tűz: narancsvörös; fagy/lassítás: kék; vérzés: piros; átok: lila; gyógyítás: menta; pajzs: cián. A számok külön kiemelést kapnak.

## Harci jelzések

Az aktív égés, méreg, fagy/lassítás, vérzés, átok, regeneráció, erősítés és pajzs felismerhető jelzést kap. A veterán és elit jelöléseket közös, fajfüggetlen megjelenítés kezeli: arany felszerelésrészletek és rangjelvény. A haditermelés elitmódjának jelölése is átkerül a vendéghez. A különböző források saját statisztikai szabályai megmaradnak; a vizuális jelölés önmagában nem ad bónuszt.

A Mágus tűz- és fagylövedéke ugyanazt a kilövési és találati időt használja, mint az eredeti sebzés. A becsapódási effekt a tényleges feloldáskor indul, az aktuális célponthelyen. A Katapult, Pap, Sámán és nekromanta lövedéke is elkülöníthető. A meglévő Lich-sugarak megmaradnak.

Az egységképtár felső korlátja 768. Az állapotok egyetlen, legfeljebb 192 mezős atlaszt használnak; az aktuális jelzések külön menetben rajzolódnak. 240-nél több látható egységnél az állapotok kompakt, alakjukban és színükben különböző ikonokra váltanak. A becsapódási tár legfeljebb 128 elemes, sűrű tömegnél 64 helyet használ. A multiplayer a meglévő állapotjelvényeket és támadási adatokat továbbítja; a ranghoz egy szabad bitet használunk, a 20/21 oszlopos egységformátum megmarad.

## Ellenőrzés és korlátok

A 20 tesztfájlos helyi sorozat sikeres. A valódi WebRTC-kapcsolat próba ezen a gépen nem kapott ICE-jelöltet, ezért kihagyott; a két böngészőoldalas protokoll- és állapotátviteli próbák sikeresek. A külön kártya/effekt próba az 51 kép helyi dekódolását, képfájl-hashét, 800–3195 képpontos kártyaelrendezést, szintválasztást, valódi találati időzítést, kilenc eltérő egység rangját és vendégoldali jelzéseit vizsgálja. A korábbi százalékos felületpróba 4K-ig is lefut.

Az 1000 egységes szélső próbában minden egység egy képernyőn áll, egyszerre ég, mérgezett, erősített és elit. Ez szándékosan sűrűbb a szokásos csatánál. A headless Chromium képkocka-időzítése és GPU-korlátai miatt a helyi mérés **nem 60 FPS-ígéret**. Az aktuális párosított mérési adatokat az [audit](audits/vfx-render-4.29.json) őrzi: külön szerepel a rajzoló JavaScript-ideje és a teljes képkockaköz, az effektek nélküli és a szélső esetben is. A tényleges sebzésszámítást, mozgást és támadási időt a látványfrissítés nem módosítja.
