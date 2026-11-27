# V4.90.0 – kampányjutalmak és egységes legendás lapok

A külön ereklyekategória megszűnik. A korábban átminősített 19 lap ismét rendes legendás fejlesztés: 55 emberi, 25 ork és 34 élőhalott legendás szerepel a közös játék-/lexikon-adatforrásban. Legendás választáskor az összes felkínált kártya legendás; újrasorsoláskor és kitiltás utáni pótláskor is. A 20. ajánlatra vonatkozó garancia, a kezdőválasztások kivétele és az első 12 perc épületarányai változatlanok.

## Győzelmi jutalom

Az első négy győzelem után pontosan egy opció választható. Az ötödik győzelem lezárja a kampányt.

| Jutalom | Hatás |
| --- | --- |
| Starter fejlesztése | Egy kezdéskor elérhető épülettípus kezdőszintje +1, legfeljebb L4-ig. A főépület is választható. L4-nél valódi faji ágat kell választani, ha van. |
| Új starter | Egy az adott csatában feloldott, eddig nem starter épülettípus L1-es starterré válik. |
| 3 permanens fejlesztés | Az adott csatában újonnan megszerzett gyakori/ritka/epikus lappéldányokból pontosan három tartható meg. |
| 1 permanens legendás | Az adott csatában újonnan megszerzett legendás lap egy példánya tartható meg. |

A starter feloldás és kezdő technológiai szint; nem ingyen lerakott épület. A következő harcban csak a szokásos főépület van felépítve. Minden más építkezéshez helyet és nyersanyagot kell biztosítani. A rendes négy kezdő épületválasztás megmarad.

Az örökölt fejlesztések nem új szerzemények. A rendszer az alkalmazott választások tényleges példányszámát és ritkaságát külön követi. Egy nyolcszor felvett fejlesztés egy kiválasztott példánya nem a nyolcszoros hatást viszi tovább. A három normál példány lehet azonos lapból is, ha valóban megszerezted őket. Az öröklés nem sorsol új Specializáció-bónuszt, nem növeli a csatabeli pickszámlálót, és nem indít friss választást jelző animációt.

Az elérhetetlen opció letiltva, rövid indoklással jelenik meg. A jutalomtípus kiválasztása még nem végleges: a lapok kiválasztásakor vissza lehet lépni. Normál és legendás jutalom külön megerősítést kap. Egy jutalom egyszer számolható el.

## Mentések és ellenfelek

A mentés sémája 3, a böngészős kulcs változatlan. A korábbi 1-es/2-es séma faját, ellenfelét meghatározó seedjét, előrehaladását és eredményeit megtartjuk. A régi valódi lapok permanens legendásként folytatódnak. Az öt megszűnő, kizárólag kampányereklyeként létező jutalom meglévő faji legendásra alakul:

| Régi jutalom | Új permanens legendás azonosító |
| --- | --- |
| Hadjárati készletek | full_garrison_economy |
| Felderített lehetőségek | wide_choice |
| Kincskereső térkép | strategic_superiority |
| Ősök zászlaja | orc_veteran_kills |
| Vándorló tábor | orc_siege_loot |

A régi, még át nem vett ereklyejutalom az új jutalomválasztóval folytatódik. A régi mentés csatabeli választáslistát nem tartalmazott; ezért ehhez a jutalomhoz nem találunk ki megszerzett lapokat vagy épületfeloldásokat. A starter fejlesztése így is választható.

A függő jutalomhoz az új mentés tárolja a tényleges csatabeli lapokat és feloldásokat. Újratöltéskor ugyanebből választhatsz; vereség és újrapróbálás megőrzi az induló kampányállapotot. A kampányból kilépve a gyors játék és az AI-tesztek tiszta várossal működnek.

Az ellenfelek fokozatos kezdőelőnyei és az ötödik, L3 Nekropolisz/L4 Lélekkút/L4 Vámpírkastély boss megmaradnak. Az ellenfél előnyei is a szokásos legendás lapok.

## Ellenőrzés

A kampánytesztek mindhárom népnél vizsgálják a pontos öröklést, a tisztán legendás ajánlatokat, a főépület valódi L4 ágait, a katonai starterek fizetett megépítését, a mentésmigrációt és a függő jutalom/vereség visszatöltését. A teljes ötcsatás UI-teszt mind a négy jutalmat kiválasztja, és egy percig futtatja a boss szokásos AI-ját is. A kapcsolódó választási, ritkasági, pakli-, gazdasági és kártyagrafikai tesztek a közös definíciókat használják.
