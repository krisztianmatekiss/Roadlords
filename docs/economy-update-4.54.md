# Gazdaság és hirtelen halál · 4.54.0

A cél a túl gyors városkitöltés lassítása és az élőhalott bank–készlet–sebzés kör visszafogása. Ez első gazdasági balance-kör, nem igazolt 50%-os fajgyőzelmi arány. A törölt elemek eredeti tervlapja és képei archív forrásként megmaradnak; a játék, AI és lexikon kínálatából kikerülnek.

## Közös építkezés

Az emberi és ork kezdőépületek ára +25%, a később feloldható épületeké +40%, nyersanyagonként felfelé 5-re kerekítve. A főépületet ez nem érinti. A kedvezmény és az egyszer használatos alapozás továbbra is az új építési árból számolódik; az ork visszatérítés a ténylegesen kifizetett árat adja vissza.

A termelőépületek területigénye és megtérülése is számít: az emberi 1 mezős Favágó 100 Fa, az ork 2 mezős Munkatábor 150 Fa + 40 Kő, de két nyersanyagot termel. A meglévő termelési szintek, terep- és szomszédsági bónuszok ebben a körben maradnak. A drágítás késlelteti a gazdasági befektetések megtérülését, a létszámkorlátot nem módosítja.

| Példa | Régi ár | Új ár |
|---|---|---|
| Favágó / Kővágó / Farm | 80 Fa | 100 Fa |
| Kaszárnya / Ork Harcostábor | 90 Fa + 60 Kő | 115 Fa + 75 Kő |
| Munkatábor | 120 Fa + 30 Kő | 150 Fa + 40 Kő |
| Vadászház | 80 Fa | 100 Fa |
| Sámántábor | 180 Fa + 200 Kő | 255 Fa + 280 Kő |

Rom: 100 Fa + 100 Kő (4×). Ősi rom: 1000 Fa + 1000 Kő (10×). Élőhalott megfelelőik 100 és 1000 Lélek. A felirat, a fizetés és az AI ellenőrzése közös `terrainClearPrice` függvényt használ. Az ősi rom jutalma továbbra is egy gyakori választás.

## Élőhalott gazdaság

Kezdőkészlet 140 → 100 Lélek. Képzési idők és egység-alapstatisztikák változatlanok. Új, végleges képzési árak: Csontváz/íjász 13; Zombi 26; Szellem 18; Nekromanta 70; Vámpír 75; Lich 100 Lélek. Ezekre nem kerül újabb képzési szorzó.

| Épület | Új ár, Lélek | Fenntartás, Lélek/mp |
|---|---:|---:|
| Lélekkút | 55 | 0,5 |
| Kripta | 70 | 0,4 |
| Temető | 60 | 0,46 |
| Hullaház | 100 | 0,72 |
| Fantomkapu | 90 | 0,65 |
| Nekromanták szentélye | 250 | 1,3 |
| Vámpírkastély | 320 | 1,56 |
| Lichtorony | 360 | 1,82 |
| Sötét Őrtorony | 115 | 0,98 |
| Lélekarató | 80 | 0,5 |
| Lélekbank | 300 | 1,2 |
| Lélekhorgony | 160 | 1,04 |
| Csontkohó | 140 | 0,91 |
| Pestiskamra | 180 | 1,3 |
| Rontott Keltető | 155 | 1,04 |
| Újjászületés sírja | 280 | 2,08 |
| Holtak kertje | 310 | 1,95 |

A Lélekarató és a Lélekkút fenntartása változatlan. A Lélekhorgony egyedi; hatótávja és 50/90%-os csökkentése marad. Lélekégető és Lélektúlhajtó nincs többé a kínálatban.

Bank: 5/6/8/10% kamat, 60 játékmásodpercenként a pozitív készletre, felső plafon nélkül. Lélekbőség a kamatot nem növeli; termelésre és haláleseti bevételre felvételenként +5%. Negatív készletnél továbbra sincs kamat és képzés; a hitelkeretek maradnak.

Lélektakarékosság és Sírgyorsítás egyszer választható legendás lett, −40% épületfenntartással, illetve +25% képzési sebességgel. Lélekbefektetés törölve. Lélekhatalom korlátlanul halmozható legendás: felvételenként +1% sebzés minden teljes 1000 jelenleg tárolt Lélek után. A költés azonnal csökkenti a bónuszt. A Nekromanta sebzésfejlesztése és a Temetőnkénti +1 helyőrség marad.

Az AI épületre spórolása nem zárhatja ki korlátlanul a képzést: ha megengedheti magának, 12 játékmásodpercenként legalább egy ciklus felülírhatja a megtakarítási célt. A tényleges egységárat, férőhelyet és fenntartást továbbra is fizetnie kell.

## Hirtelen halál és multiplayer

Kezdés 30:00-nál; előtte nincs HP-fogyás. Mindkét oldal külön halad: T1 → T2 → T3 → kaputornyok → főváros. A korábban lerombolt lépcsők kimaradnak; a főváros saját utolsó kaputornyáig védett ettől a fogyástól. A meglévő fokozódó sebzés nem változott.

A bejelentés képernyőhöz rögzített, nem görgethető le az úttal. Az aktív torony HP-csíkja és száma pulzál, később a főváros HP-ja is. A vendég a gazdagép állapotából kap bejelentést és jelzéseket, nem von le újabb HP-t. Az új szabályverzió 5, régi klienssel nem indulhat eltérő gazdaságú meccs. Új mérkőzéskor a hirtelen halál állapota törlődik.

## Kártyák

A halmozható lapok a jelenlegi → következő összhatást mutatják. Az átsorolt legendások saját legendás keretet, a Lélekhatalom tényleges felvételszámot kap. Az aktív ereklyék a lexikon közös kártyarajzolóját használják, jelenlegi hatással és darabszámmal. A választásban megjelenő keretképek azonnal töltődnek; a lexikon hosszú listái maradnak késleltetettek.

A teszt minden aktív élőhalott lapnál összeveti a választás és a lexikon keretének és illusztrációjának forrását: 18 épület, 25 gyakori és 23 legendás kártya. Az eredeti 20 épületkép megmarad archivált grafikakészletként.

## Egységsebességek

Mind a 21 egység alap- és tényleges mozgása átnézve. Lovag: 6,3 → 14,7 m/s (3,5× Kardos). Warglovas: 5,5 → 13,6 m/s (4× Ork Harcos). Goblin: 5 → 5,6 m/s. A többi 18 alapérték marad. A mozgási fejlesztések az új alapból számolnak; lassítás, kábítás, ellenséges testek és toronyhatárok továbbra is érvényesek. A járás animációja a megtett távolságból lép, így a gyorsabb egység lábmozgása is gyorsul. A roham sebességarányos sebzésképlete az új alapsebességhez viszonyít, ezért a nyers alapgyorsítás önmagában nem sokszorozza meg a roham sebzését.
