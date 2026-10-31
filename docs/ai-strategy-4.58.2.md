# V4.58.2 – AI-döntések és csapatküldés

## Mi változott?

- Az emberek és orkok gazdasági növekedési célja figyelembe veszi a raktárak telítettségét. Tele készletnél kisebb az újabb termelők kedvéért fenntartott extra termelési cél; a meglévő katonák tervezett fogyasztása továbbra is teljes egészében számít.
- Az ork AI meg tud takarítani egy kiválasztott katonai vagy támogató épületre. A gazdasági rutin következő köre nem törli ezt a szándékot, és nem helyettesíti automatikusan egy olcsó Harcostáborral. A tartalék mellett termelőnként legfeljebb kétszeres képzési idővel folytatódhat a katonaképzés. Közvetlen támadásnál a megtakarítás nem tiltja a védekező képzést.
- Az ork seregarányokban a gyalogság marad a többség, de a Dühöngő és a Warglovas is kap szerepet. A saját oldaláról látható távolsági ellenségek aránya emeli a Warglovas-tervezés prioritását. Sámánt három, ostromtermelőt hat meglévő katonai termelő után tervez. Az aktuális nyersanyagár, helyigény és raktárkapacitás korlátozza a vásárlást.
- Az Aréna és a Hajcsártábor három katonai termelő után saját vásárlási lehetőséget kap. A helykeresés továbbra is a tényleges szomszédság alapján dolgozik.
- Az élőhalott támogatók három katonai termelő után, legfeljebb 45 másodpercenként előnyt kapnak a következő ismételt termelővel szemben. Meglévő épületet nem dupláz emiatt, és a fenntartást is fedeznie kell. Rontott Keltetőt nem vásárol csak Temetők mellé.
- A kútátépítés után legalább 25% fogyasztási többletet és 2 Lélek/mp szabad termelést követel. Ez szigorúbb az új kút építését kiváltó 20%-os küszöbnél. Két ilyen bontás között legalább 15 másodperc telik el.
- A 120. másodperc után az első kivonulás célja 8 + termelőnként 2 sereghely, a helyőrségi kapacitásig. A későbbi nagy hullámok mellett 25 másodperc után külön erősítés is indulhat, ha legalább nyolc saját egység már kint van és legalább 6–16 sereghelynyi csoport összegyűlt. A kapu közelében négy egységnyi helyőrség is elindulhat védekezni.

## Ellenőrzés

Valódi böngészős próbák: `tests/ai-strategy.cjs`, `tests/ai-city-planning.cjs`, `tests/ai-ruin-clearing.cjs`, `tests/battle-flow.cjs`, `tests/undead-faction.cjs`. Ellenőrzik a tényleges vásárlást, a megtakarítás megmaradását, a katonaképzés folytatását, a reagáló Warglovas-vásárlást, a kivonulást, az erősítésküldést és a multiplayerben kikapcsolt AI-t.

A `scripts/audit-ai-economy.cjs` hat, egyenként tíz játékperces gazdasági szimulációja összehasonlítja a kiinduló 4.58.1 és a javított változatot. A két indulási mag 42 és 137. Az erőforrás, fejlesztésválasztás, építés, kiképzés és kivonulás valódi; a kint lévő egységeket 45 másodperc után harci jutalom nélkül eltávolítja, így van folyamatos utánpótlási igény.

| Faj / mag | Első kivonulás, mp | Katonai termelők 10 percnél | Kiküldött egységek | Kútátépítések |
| --- | --- | --- | --- | --- |
| Ember / 42 | 201 → 153 | 10 → 19 | 614 → 687 | 0 → 0 |
| Ember / 137 | 165 → 125 | 7 → 10 | 499 → 420 | 0 → 0 |
| Ork / 42 | 210 → 208 | 22 → 26 | 642 → 671 | 0 → 0 |
| Ork / 137 | 225 → 181 | 24 → 17 | 446 → 291 | 0 → 0 |
| Élőhalott / 42 | 197 → 169 | 31 → 24 | 1219 → 1232 | 81 → 0 |
| Élőhalott / 137 | 180 → 151 | 26 → 33 | 1567 → 1478 | 0 → 11 |

A két ork kiinduló város katonai épületei kizárólag Harcost és Goblint képeztek. A javított két városban Dühöngők és Warglovasok termelői is felépültek. Egyik gazdasági próbában sem volt fenntartási mulasztás.

Ez nem győzelmi arány vagy harci erősségmérés. A nyers egységdarabszám eltérő egységeket és ingyenes idézéseket is tartalmaz. A megváltozott döntések később a véletlen kártyák sorát is megváltoztathatják. A megmaradt, legalább 15 másodperces várakozást betartó kútátépítések ténylegesen katonai épületnek felszabadított telkek, nem fenntartás miatt összeomló kutak.

Az ellenfél minden fejlesztést és épületet a meglévő játékszabályok szerint kap és fizet ki. Új harci képesség vagy mesterséges nyersanyagbónusz nem része ennek a módosításnak. Az ellenfélhez igazított fejlesztésválasztás és a fajok további taktikai finomítása külön mérésre marad.
