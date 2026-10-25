# Új egységek és hosszabb lőtáv – V4.49.0

Mind a 21 elfogadott festett egységmodell a normál játékban és multiplayerben is aktív. A menet, támadás, halál, csapatszín és elitjelölés a már ellenőrzött rajzolót használja. A TESZTEK menü két vegyes 100 vs 100 csatája és a helyi A/B kapcsoló megmarad.

Az atlaszok a főmenüben nem töltődnek le. A fajválasztás és az indulás gombja megvárja a részt vevő frakciók képeinek dekódolását. A már betöltött atlaszokat újra használjuk; nem indul képkockánként új letöltés vagy teljes képfeldolgozás. Az ismert 768 képkockás tárkorlát megmarad.

## Hatótávok

| Egység | Korábban | Most |
| --- | ---: | ---: |
| Íjász | 15 m | 30 m |
| Pap támadása | 12 m | 24 m |
| Mágus | 15 m | 30 m |
| Katapult | 40 m | 80 m |
| Goblin | 11,5 m | 23 m |
| Sámán | 15 m | 30 m |
| Csontvázíjász | 13 m | 26 m |
| Nekromanta | 12 m | 24 m |
| Lich | 14 m | 28 m |

A Pap gyógyítása 15 → 30 m. A Warglovas nyitó dobása és annak célpontváltó képességei 11,5 → 23 m; közelharci lőtávja marad 3 m. A Lándzsás Lándzsaeső-nyitása 19 → 38 m. A Hosszúíjász +7,5 m kiegészítése +15 m-re nő, így teljes alap lőtávja 45 m. A százalékos lőtávfejlesztések az új alapból számolnak. A lexikon és statisztikai előnézet méterben a tényleges értékeket mutatja.

A célpontkeresés és a megállási távolság ugyanazt az új `u.range` értéket használja. A közelharci elérés, területsebzés sugara, sebesség, sebzés, HP és képzési ár nem változott. A tornyok saját lőtávja változatlan: a hosszabb egységlőtáv ezért az ostrom erőviszonyait is módosítja.

## Multiplayer

A gazda továbbra is egyedül számolja a harcot; a vendég tükrözött egységeket és helyi statisztikai előnézetet rajzol. A gyógyító kézmozdulat és célponteffekt, illetve az idézés rövid mozdulata a meglévő opcionális frakció-adatoszlopban utazik. Az inaktív egységekhez nem kerül új effektadat. A vendég egy lezajlott Troll-csapásból egyszer hozza létre a talajhatást.

A kézfogás szabályverziója 3: mindkét játékosnak frissítenie kell, hogy a korábbi lőtávokkal futó kliens ne csatlakozzon.

## Ellenőrzés

A `tests/production-figures-and-range.cjs` valódi szóló-fajválasztással ellenőrzi az előtöltést, majd mind a 21 normál játékbeli modellt. Mind a kilenc távolsági típus a korábbi lőtávján kívül keres és talál el célpontot; a megállási távolság, gyógyítás, Warg-dobás, Lándzsaeső és Hosszúíjász külön is vizsgált. Két böngészőoldal között valódi JSON snapshot igazolja a vendég új modelljeit, statisztikáit és gyógyító effektjét. Ez adatátviteli próba, nem két internetes gép közötti WebRTC-kapcsolat igazolása.

A mértékegység-, archivált paritás-, egységbalance-, 1000 egységes multiplayer-, élőhalott frakció- és kártya/effektpróbák is futnak. Az engedélyezett tartományeltérések az archivált paritáspróbában kifejezetten rögzítettek.
