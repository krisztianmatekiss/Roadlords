# V4.86 – Épülő buildek és rendezettebb mozgás

## AI

Az egységek ára, képzési ideje, helyfoglalása és tényleges fejlesztései továbbra is számítanak. A nem kezdő termelők fix technológiai bónusza és az épületszint külön pontjutalma megszűnt: az erősebb szint hatása már benne van a képzési időben és az egység statisztikáiban.

Az AI külön kezeli a ténylegesen kiválasztott termelőkbe tett befektetést. Ez építés után is megmarad; korábban az új termelő az első példány lerakásakor elveszítette a kipróbálására kapott értéket, és a kezdő egység visszavette a főszerepet. A feloldási előnézet a még zárolt termelőt is értékeli, az aktuális – azt még nem tartalmazó – seregcél helyett.

A harcérték az ellenfél tényleges összetételét is figyeli: lovasság/ostrom elleni válasz, távolságiak előtti fedezet, a hatótávval nyert támadási idő és a tömörülésekre ható területi sebzés. Az ellenfél összegzését egy döntésen belül a város-előnézetek közösen használják. A főirány mellett egy hiányzó szerepre egy megfelelő vonalat keres, például távolsági támogatást vagy gyógyítást. Egy ilyen hasznos vonal szintlépésénél az egy újoncra jutó javulás is számít; nem tűnik el húsz korábbi termelő összteljesítménye mögött.

Nincs kötelező nyitóegység vagy fajonként előírt buildlista. A hasonló értékű döntések meccsenként eltérhetnek, de a megszerzett lapok és a működő gazdaság továbbra is korlátozzák a váltást. Az egységek játékosra vonatkozó harci értékei nem változtak.

## Gyülekezőtér

A kártya és a lexikon közös leírást használ: a kapcsolt táborok külön tartalékba gyűjtenek, és zárt főkapunál is bevethetők. Az épület vezérlői: **Gyűjtés**, **Kivonulás**, **Automata**; a kiválasztott mód rövid magyarázatot kapott. A 15/25/40 férőhely és a két L4 ág tényleges értékei szerepelnek a leírásban.

Javított működési hiba: a tartalékból csak a sikeresen bevetett újoncok kerülnek ki. A külön harctéri egységkorlát elérésekor a várakozók nem vesznek el, és nem kapják meg újra meg újra a kivonulási bónuszokat.

Az építési előrejelzés az útvonal közben rendelkezésre álló jövedelmet is értékeli. Korábban csak a 120. másodperces végállapot számított, ezért egy eleinte haszontalan torony és későbbi termelők megelőzhették a korán megépített gazdaságot. A nyitási teszt az élőhalottaknál 32 döntési változatot ellenőriz: az olcsó kezdő termelő akkor elfogadható, ha a gazdasági épület azonnal utána finanszírozható; a hosszú, jövedelem nélküli várakozás nem.

## Mozgás

- Goblin, Dühöngő és Troll: közel nyújtott nyugalmi lábtartás, előre hajló térd, váltakozó talajfogás. A talp nem süllyed a talajba, és a comb/lábszár nem nyúlik a lépés során.
- Lovag: a túloldali lovasláb a ló teste mögé kerül; a látható láb előtte marad. A négylábú ló mozgása, a nyereghelyzet és a lándzsa találati időzítése változatlan.
- Mind a 21 egység nyugalmi, járó, támadó és halálpózát, a kétkezes fegyvereket, a Goblin íját, a Warglovas dobását, valamint a gyógyítást és idézést is átnéztük. A vállpontok a törzsképekhez tartozó metaadatból származnak; méret- és helyváltoztatáskor együtt mozognak a törzzsel.
- A felkar/váll takarási sorrendje javítva. A Szellem kinyújtott karral suhint, a kisebb orkok karja megfelelőbb arányú, a két íjász betöltéskor és visszaengedéskor sem nyújtja meg az alkarját. A harcosok lendítésének és visszatérésének pályája elkerüli a vállba visszahajló kezet.
- A Mágus új tenyérhelyzetéből indul a lövedék is. A felszerelés ugyanabban a kézben marad.
- Az eredeti atlaszok, a fegyverek kézhez igazítása és a harci sebzés megmaradnak. Ugyanaz a rajzoló működik a játékban és az AI–AI nézetben.

## Ellenőrzés

A célzott böngészős tesztek valódi feloldásból indított íjász-, mágus- és lovasirányt, tényleges lovasság elleni választ, sűrű/ritka célpontok értékelését, a Gyülekezőtér létszámlimitjét és teljes lépésciklusokat ellenőriznek. A lovas rajzolási sorrendjét külön ellenőrzés védi; a régi harci és gazdasági tesztek is megmaradtak.

A buildértékelés ellenőrzésekor (30ebd47), tényleges kezdő nyersanyagokkal és véletlen kártyakínálattal indított, hét játékpercig futtatott AI–AI meccsekben:

| Seed | Ellenfél | Ember főirány | Tényleges termelők a 7. percben |
| --- | --- | --- | --- |
| 1 | Élőhalott | Lovag | 20 Istálló; a lovagsebzést és -életerőt célzó lapokkal |
| 42 | Ork | Íjász | 17 L4 Íjásztábor, 3 Kaszárnya, 2 Templom; Nyílzápor ággal |
| 7 | Élőhalott | Lándzsás | L4 Lándzsás termelők, L2 Mágustorony, Ostromműhely; tankos ággal |

Ez működési próba, nem győzelmi aránymérés vagy minden lehetséges build minőségének igazolása. Részletes helyi eredmény: `artifacts/variety-draft-retention.json`.

Teljes anatómiai ellenőrzés: `tests/unit-anatomy.cjs`; 674 póz és 1186 karvizsgálat, fajonkénti nagyított és tükrözött képsorral. A teszt állandó csontszakaszhosszt és összecsuklás nélküli könyököt követel.

Új célzott ellenőrzések: `tests/ai-composition-and-rally.cjs`, `tests/orc-grounded-stride.cjs`, valamint a lovas rétegsorrendje a `tests/knight-figure.cjs` fájlban.

Multiplayer szabályverzió: **33**.
