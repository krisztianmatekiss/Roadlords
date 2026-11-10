# 4.67.0 – Harci és AI-javítások

## Meglévő Warg-fejlesztések

A Vérszomjas vadászat tévesen a Vadászház leírását kapta, mert ugyanazt a belső azonosítót használták. A meglévő legendás külön azonosítót kapott (`orc_warg_hunt`); neve, grafikája és hatása megmaradt. A Vadászház azonosítója továbbra is `orc_hunt`.

- **Vérszomjas vadászat:** a Warglovas közelharci vagy lándzsával szerzett ölése újabb lándzsadobást indít.
- **Lándzsazápor (L4):** megduplázza a lándzsadobások sebzését; újabb dobást önmagában csak lándzsával szerzett ölés indít.
- Együtt is hasznosak, de egy ölés csak egy extra dobást indíthat. Az AI az átfedő indításokat nem számolja kétszer.

Nincs új legendás vagy új képesség. A legendás lapok száma változatlan: ember 55, ork 24, élőhalott 34.

## Toronynyilak

A torony és a Toronyőrség nyilai a meglévő harci időzítőben repülnek, és a korábbi 0,22 másodperces vizuális repülés végén sebeznek. A célpont mozgását követik; a már kilőtt nyíl a torony pusztulása után is célba érhet. Halott célpont nem kap további sebzést.

A lövések közös beérkezősebzés-foglalást használnak az egységekkel és a többi toronnyal. A Toronyőrség nem pazarolja minden lövését egy már lefedett célpontra. A Sortűz megtartja a két teljes sebzésű nyilat.

A pajzsok, a páncél, a csontváz távolsági ellenállása, a kitérés és az első támadást kivédő hatás becsapódáskor érvényesülnek. A sebzés, a hatótáv és az újratöltés nem változott. A toronynyíl nem új egység, és nem örökli az egységek találati képességeit.

Multiplayerben a host számolja a találatot, a vendég a meglévő repülőlövedék-pillanatképből rajzol. A szabályverzió 19; mindkét játékosnak frissítenie kell.

## Feltételes AI-értékelés

A közös AI a működő termelők, a pályán élő egységek és a ténylegesen megszerzett fejlesztések alapján állapítja meg, van-e vérzés-, méreg-, átok-, életlopás- vagy lándzsakrit-forrása. A kikapcsolt/fenntartás nélkül maradt támogató épület nem számít működő forrásnak.

A csak később, már feloldott épülettel vagy fejlesztéssel elérhető kombináció kisebb lehetőségértéket kap. Nem kapja meg egy már működő kombináció teljes értékét. Az önmagukat lehetővé tevő lapokat az AI a választás utáni állapotban is ellenőrzi.

A Goblin íjászok már számszerűen mért sebzését nem számolja újra általános feltételes bónuszként. A két Warg-fejlesztés becsült haszna külön, az ölési indítások átfedésével együtt szerepel az értékelésben.

## Ellenőrzés

A `tests/combat-repairs.cjs` valódi harci találatokat, fejlesztéskombinációkat, sebzésfoglalást, feltételes AI-választásokat, kártyaképet és host–guest lövedékmegjelenítést vizsgál. A meglévő teljes tesztcsomag részeként fut.
