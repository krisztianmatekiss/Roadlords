# V4.50.0 – Élőhalott fejlesztések, emberi épületkártyák és egységikonok

## Gyakori fejlesztések

Mind az öt ismételhető; a hatás a felvételek számával összeadódik.

| Fejlesztés | Egy felvétel hatása |
| --- | --- |
| Lélekörökség | Saját egység harci halálakor a legközelebbi élőhalott 5% Max HP-t gyógyul. Idézettek halála is számít. |
| Lélekhatalom | Minden teljes 100 tárolt Lélek után +1% sebzés. Folyamatosan a jelenlegi készletből számol. |
| Síri menet | +10% mozgási sebesség a saját térfélen. |
| Holtak ostroma | +10% sebzés ellenséges tornyoknak és a fővárosnak. |
| Lélekpáncél | Megjelenéskor 8% Max HP pajzs, idézett egységeknek is. |

A gyógyítás teljes HP-n nem keres távolabbi sérült célpontot. A pajzs a tényleges maximális HP-ból számol, az elit és sérülten megjelenő egységeknél is; a már pályán lévőknek nem töltődik vissza egy új felvételtől. Lélekadósság nem ad negatív sebzésbónuszt.

## Legendás fejlesztések

| Fejlesztés | Hatás |
| --- | --- |
| Csontok ébredése | Elesett saját élőhalott 25% eséllyel Csontvázként tér vissza. |
| Síron túli íjászok | Elesett saját élőhalott 25% eséllyel Csontváz Íjászként tér vissza. |
| Halálkaszkád | Ellenség halálakor a legközelebbi másik ellenség saját Max HP-jának 20%-át kapja mágikus sebzésként; halálakor folytatódik. |
| Kettős ébredés | Fizetett képzésenként 30% eséllyel egy ingyenes, azonos egység. |
| Életszüret | +20% életlopás az élőhalottaknak. |
| Túlvilági oltalom | Az első ellenséges támadás teljes kivédése, annak állapothatásaival együtt. |
| Lélekbitorlás | Megölt ellenség 20% eséllyel eredeti típusában, 50% HP-val a saját oldalon tér vissza. |

A két 25%-os feltámadás külön dobás. Az új test saját friss védelmet és megjelenési pajzsot kap; később ismét feltámadhat. Az idézés lejárata nem harci halál. Az életlopás ténylegesen levont HP-ból számol, pajzssebzésből nem, és az egység saját életlopásával összeadódik. A lánc és a folyamatos mérgezés nem támadás, ezért nem fogyasztják el az első támadás elleni oltalmat.

A képzési másolat nem indít újabb másolatdobást és nem kér második képzési árat. Helyhiánynál a meglévő ingyenes képzési sorban vár. A harctéri feltámadásokra a meglévő 1500 aktív egység/oldal technikai korlát vonatkozik. A lánchalál feldolgozása iteratív: sok egymás utáni halál nem növeli a hívási vermet.

## Kártyák és ikonok

A 12 új fejlesztésnek 12 külön atlaszjelenete van. A legendás kártyák arany-csont keretet kapnak. Az első emberi képcsomag 16 épületkártyát fed le; a városi épületképek későbbi csomagban cserélhetők. Az emberi keret ezüst, világos kő és arany heraldika; külön zománcréteg jelöli a gazdasági, katonai és támogató kategóriát. A képek SVG-atlasznézetet használnak, a generált eredetik bájtjai és ellenőrzőösszegei megmaradtak.

Az egységikonok az adat szerinti gyalogos, lovas, ostrom vagy mágikus típussal kezdődnek. A közelharc piros, a távolsági támadás zöld, a mágia lila; az eltérő formák és feliratok színlátástól függetlenül is azonosítanak. A Troll ostrombesorolása mellett megtartja a közelharci és területi sebzés ikonját. Tornyon és fővároson egyaránt 110 alapsebzést okoz; a Kos 130-as és a Katapult 65-ös épületsebzése megmarad. A nem ostromegységek továbbra is a korábbi épületsebzés-csökkentést kapják.

## Ellenőrzés

A célzott böngészős vizsgálatok valódi, időzített találatokat használnak: mind a 12 fejlesztés, idézett/elit egységek, 512 halálos láncszem, képzési költség, előfeltételek és halmozási előnézetek. A kártyák 1600 és 1280 képpontos ablakban is olvashatóak. Két külön böngészőoldal a tényleges multiplayer csomagkezelőkön keresztül ellenőrzi az új hovatartozás, pajzs és oltalom állapotát. A szabályverzió 4; eltérő szabályú régi kliens nem csatlakozhat.
