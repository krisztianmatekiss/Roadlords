# Roadlords 4.59 – Élőhalott bővítés

A megadott képességhatások elkészültek. Az itt külön jelölt árak és időzítések **első tesztértékek**, játékosi próbák alapján változhatnak. Az emberi és ork harci alapszabályok változatlanok.

| Új épület | Méret | Építési ár | Folyamatos fenntartás |
|---|---|---:|---:|
| Lélekpenge | 1×1 | 160 Lélek | 0,6 Lélek/mp |
| Sírhatárkő | 1×1 | 140 Lélek | 0,7 Lélek/mp |
| Lélekhasadék | 2×2 | 480 Lélek | 1,5 Lélek/mp |
| Túlvilági portál | 2×2, egyedi | 360 Lélek | Csak bekapcsolva; lásd lent |
| Lélekkút | 2×2 | 220 Lélek | 2 Lélek/mp |

Az új építési árak és fenntartások ideiglenes balanszértékek. A szokásos fenntartáscsökkentések és a főépület fenntartási szorzója ezekre is érvényesek.

## Legendás fejlesztések

- **Vérfertőzés:** Vámpír harci ölése után egy saját Vámpír jelenik meg a halott helyén, 25% Max HP-val. Újabb ölésével ez is fertőz. Ez a feltámasztás elsőbbséget élvez a holttestért versengő hatásokkal szemben. A halál többi hatása megmarad. Az ideiglenes Vámpír utódja a szülő hátralévő élettartamát örökli; nem keletkezik belőle állandó sereg.
- **Árnyékugrás:** valódi Szellem-kitérés után ugrás a támadó mögé és rendes visszatámadás. Kezdő újratöltés: **8 mp**. Az első találat teljes kivédése önmagában nem kitérés. Élő ellenséges úttornyon nem teleportál át.
- **Éjszakai ragadozó:** Vámpírok az első végrehajtott egység- vagy épülettámadásig sebezhetetlenek; mozgásuk tartósan +20%. Félbeszakadt támadás-előkészítés nem fogyasztja el a védelmet.
- **Vándorló pestis:** harci halálkor minden megmaradt méregpont a legközelebbi élő ellenség meglévő mérgéhez adódik. Tovább láncolódhat; időbeli eltűnés nem váltja ki.
- **Sűrített lélekkutak:** a meglévő és későbbi kutak 1×1-re zsugorodnak; termelés és fenntartás feleződik, építési ár változatlan.

A legendások a meglévő pickrendszerben és lexikonban jelennek meg; a Vámpír/Szellem lapjaihoz megfelelő termelő, a pestishez méregforrás, a kútlaphoz Lélekkút szükséges.

## Lélekpenge

| Szint | Találatonkénti sebzéstöbblet | Lélek / találat |
|---|---:|---:|
| L1 | +1% | 1 |
| L2 | +2% | 2 |
| L3 | +3% | 3 |
| L4 | +5% | 4 |

Minden saját közelharci egységre, ellenséges egység és épület ellen is. Több példány százaléka és ára összeadódik. Csak sikeres találat fizet; kitérés vagy teljes támadásvédelem nem. A teljes összesített ár szükséges a tényleges készletből: hitelből vagy részösszegből nem működik. Távolsági támadást, mérgezést és más folyamatos sebzést nem erősít.

## Sírhatárkő

L1–L4: **+5 / 10 / 15 / 20 m** terület és **+5 / 10 / 15 / 20%** térfélnövelés. A magasabb szintek értékei tesztértékek. A méterek és százalékok példányonként összeadódnak:

`(12 m × térfélnövelő commonok + kövek méterei) × (1 + kövek százalékai) × főépület területnövelési szorzója`

A százalék a sírszigetek sugarát is erősíti. A saját térfélen működő sebzésbónuszokat külön nem növeli; azok főépületi duplázása megmarad. A két oldal növekedése egy közös határvonalat mozgat.

## Lélekhasadék

**45 mp-es** időköz; a teljes idézés ára egyszerre fizetendő.

| Szint/ág | Egység | Élettartam | Idézés ára |
|---|---:|---:|---:|
| L1 | 4 | 30 mp | 80 Lélek |
| L2 | 6 | 40 mp | 120 Lélek |
| L3 | 9 | 50 mp | 180 Lélek |
| L4 – Holtak áradata | 18 | 60 mp | 360 Lélek |
| L4 – Hosszan kísértők | 9 | 120 mp | 180 Lélek |

A gyakoriság és ár tesztérték. Minden csapat egyetlen véletlen, elérhető saját területi pontra érkezik, a meglévő hét élőhalott típus közül véletlenül. A sírszigetek is saját területnek számítanak. Nem foglalnak sereghelyet, de a meglévő 750 aktív egység/oldal technikai korlátot betartják. Kevés Lélek, teljes harctér vagy elérhető saját terület hiányában a kész idézés vár; nem fizet részleges csapatért. Lejáratkor nincs harci halálhatás.

## Túlvilági portál

Az épület ablakában kapcsolható. A kapun kiengedett egység a saját térfélhatárra érkezik, az élő ellenséges úttorony előtti legközelebbi szabályos pontig. A már terepen történő idézéseket és feltámasztásokat nem helyezi át.

L1–L4 alapfenntartás: **3 / 2,5 / 2 / 1,5 Lélek/mp**. Minden **30 összesített aktív másodperc** után további **+1 Lélek/mp**. Kikapcsolva nem fogyaszt és az időszámláló szünetel; nem nullázódik. Sikertelen fenntartásnál automatikusan kikapcsol. Mérete, egyedisége és a fenntartás számai tesztértékek.

## Kút és kezdés

A korábbi egységnyi kút négy mezőre nőtt: építési ára 55 → **220**, fenntartása 0,5 → **2/mp**, L1–L4 termelése 1/2/4/8 → **4/8/16/32/mp**. A kezdő készlet **100 → 280 Lélek**: egy kút és egy Temető azonnal megépíthető. Ezt a kezdő gazdaságot érdemes külön próbálni.

## Grafika és együttműködés

Az új épületek külön kártyajelenetet és forgatható városi képet kaptak; a Lélekkútnak is új térképi képe van. A kardos pajzsos, a lándzsás kétkezes lándzsával harcol, a pap kopasz, fehér ruhás idős gyógyító, a mágus fiatal, sötét hajú, kék-lila ruhás tűzidéző. A harctéri emberi modellek változatlanok.

Az új idézéseket és harci eseményeket multiplayerben a host számolja. A portálállapot, idézési óra, képességállapot és vizuális események szinkronizálódnak. A vendég nem írhatja felül a host idézési óráját. Az eltérő szabályverziójú klienseket a játék visszautasítja; mindkét félnek frissítenie kell.
