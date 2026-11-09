# V4.65.0 – Közös beruházási terv

## A korábbi ellentmondás

A stratégiai réteg több lépést is előre tudott nézni, de a végrehajtás épületenkénti pontszámokra támaszkodott. Az új egységtípus külön jutalmat kapott, az ismételt spawner pedig levonást. A gazdasági cél egy olcsó termelő és egy olcsó katonai épület árából készült. Például egy kőtermelő faárát a kőtermelési igényhez tartozó építési kiadás nem kezelte megfelelően.

## A közös modell

- Az `army-intent.js` a tényleges statokból, költségből, képzési időből, helyfoglalásból, meglevő fejlesztésekből és megfigyelt ellenséges egységekből választ fő egységet. A valódi meglevő épület környezetét és átalakult egységtípusát is figyelembe veszi.
- Egy további vonal indoka főerő, tényleges ellenszer, hiányzó frontvonal, gyógyítás vagy átok lehet. A kiegészítő szerepeknek van aránykorlátjuk. A fő típus szükséges utánpótlási ütemét a saját seregkapacitáshoz viszonyítja; a más típusú régi vonalak nem helyettesítik automatikusan az új terv fő egységének termelését.
- Az `investment-plan.js` a következő konkrét katonai/támogató beruházások és a gazdasági terjeszkedés teljes árvektorából készít keretet. Számolja az új vonalak névleges képzési igényét. A megtelt készlet nem helyettesíti a tartós finanszírozást.
- A döntés a várakozást és legfeljebb nyolc első építési lehetőséget hasonlítja össze, 120 másodperces becsléssel és legfeljebb négy fizetett lépéssel. A folyamat köztes termelőket illeszthet be a későbbi építés finanszírozásához és működtetéséhez. A tiszta várakozással együtt legfeljebb kilenc teljes városelőrejelzés készül.
- Az előrejelzés a valódi elhelyezést, elfordítást, árat, alapozási kedvezményt, tárolókorlátot, működési költséget és újraszámolást használja. A felhasznált alapozási terepet elfogyasztja. Nem hoz létre valódi katonát, választást, statisztikai eseményt vagy véletlenszámot.
- A közös értékelés a terv legszűkebb nyersanyagát, a hasznos készletet, az elkészülő célokat, a fenntartható katonai erőt, valamint a beruházás és helyfoglalás költségét nézi. Az építési műveletek is időt igényelnek; az azonos eredményhez fölösleges plusz épület hátrány. Biztonságos, tornyokkal védett nyitásban nagyobb a gazdasági felfutás súlya. A raktár önmagában nem számít elkészült katonai/buildcélnak.
- A finanszírozott stratégiai előfeltétel – például az L4 kaszárnyát lovassággá alakító Istálló – akkor is tervlépés maradhat, amikor további általános gyártókapacitás nem kell.
- A lapválasztás megvizsgálhatja, hogy egy új spawner valódi új főirányt vagy indokolt kiegészítőt nyitna-e meg. Az önálló változatossági bónusz és a darabszám miatti általános keverési ösztönző kikerült.

A tervező városonként gyorsítótáraz, épület- vagy fejlesztésváltozásnál és legfeljebb hat másodperc után újraértékel. Veszély esetén a tényleges érkezési időt vizsgáló vészhelyzeti építés és védekezés elsőbbséget kap. Nincs frakciónként előírt építési sorrend, személyiség vagy a játékban megjelenő indoklásnapló.

## Kapcsolható épületek

A `building-controls.js` külön kezeli az építés és az aktív működtetés döntését.

A Túlvilági portál újonnan kivonuló egységekre hat. Megvizsgálja, hogy a határ mögé került távolságiak ellen hátbatámadás adódik-e, megoszlik-e az ellenséges sereg a határ körül, illetve mennyi menetidőt takarítana meg. Figyelembe veszi az otthon maradó védőket, a tornyok állapotát, a várható áttörést, a tényleges kivonulást, a két seregkorlátot, a növekvő Lélekfenntartást és a gazdasági megtakarítást.

Hátbatámadási/szétválasztási helyzetben legfeljebb nyolc, más hasznos kivonuláskor legfeljebb tizenkét másodperces időszakot használ, utána legalább nyolc másodperc szünetet tart. Közvetlen veszély, üres kivonulás vagy pénzhiány korábban is leállítja. Nem teleportálja a már úton levő katonákat és nem kerül meg élő úttornyot. A konkrét taktikai tesztek mindkét oldalon valódi portálos kivonulást ellenőriznek.

A Haditanács módjait, az ork összevont sereg/helyőrségi kapacitást és az L4 Hajcsártábor három vizsgált hajszolási szintjét is összehasonlítja. Az utóbbinál a sebesült indulás és a megfigyelt távolsági kitettség is költség. Az elindított képzési ciklus sebesség/HP profilja megmarad. A korábbi jobb oldali implicit 50%-os AI-alapérték kikerült; mindkét oldal ugyanazzal a normál alapértékkel és döntési kóddal indul.

## Önálló bontás

A meglévő, fizetett cseretervező megmaradt. A katonai vonalak értékeléséhez az aktuális egységszerepeket is használja. Egy még meg nem épített, befektetés nélküli alternatíva önmagában nem csökkenti a működő sereg értékét.

A tartósan alig hasznos épület bontása új építés nélkül is megengedett. Időszakosan, korlátozott számú jelölttel vizsgálja a teljes városra gyakorolt különbséget; az inaktív és kapcsolódás nélküli támogatók előre kerülnek. Legalább 45 másodperces megfigyelés, valós haszon és a korábbi finanszírozási, helyőrségi, sereglimit-, gazdasági és veszélyvédelmi feltételek szükségesek. Az új építési tervező tiszteletben tartja a frissen lebontott típusok visszaépítési várakozását.

## Tartalmi változások

- Emberi kezdőkészlet: 110 fa, 20 kő, 10 élelem. A közös adatot használja az indulás, népváltás és nézői újraindítás is.
- Az ork és élőhalott kezdőkészlet nem változott. Az ork Munkatábor alapára továbbra is 150 fa és 40 kő; 90 kezdő fából, kedvezmény nélkül az első táborhoz szükséges várakozást az AI nem tudja megszüntetni.
- A Lélekhasadék kikerült a definíciókból, feloldásokból, szintlépésekből, lexikonból, AI-tervekből és az aktív grafikai jegyzékből. Az idézési időzítő, fogyasztási hozzájárulás és harci idézés is megszűnt.
- Multiplayer szabályverzió: 16, hogy régi Lélekhasadékos klienssel ne induljon eltérő szabályú meccs.

## Ellenőrzés és korlátok

A `tests/ai-investment-policy.cjs` 20 ellenőrzése a közös kezdőkészletet, a törölt épület hiányát, a vámpírbuild indokolatlan csontváztermelésének elkerülését, a kétoldali tiszta előrejelzést, teljes építési költségvetést, köztes termelőt, fölösleges újabb Lélekkút elkerülését bőséges bevételnél, utánpótlási telítődést, a ténylegesen megtelt sereghez szükséges kapacitásépítést, várakozást, tényleges önálló bontást, kétoldali portálos hátbatámadást, időzített lekapcsolást, mély betörés felülírását és a multiplayerben inaktív AI-t vizsgálja.

A régi tesztek közül a pusztán feloldott Warg kötelező építését számon kérő eset most befektetéssel és legendással indokolt Warg-tervet ellenőriz, köztes gazdasági finanszírozást is engedve. A lovassági kombináció tesztje a tényleges megtakarítási bevételt is futtatja. A feltöltött raktárakról szóló ellenőrzés megköveteli, hogy ne tűnjön el a tartós építési/képzési igény. A visszavont Lélekhasadék tesztjeit eltávolítási állítás váltotta fel; a portál-, időleges egység-, képességállapot- és multiplayerellenőrzések megmaradtak.

A rendszer rövid távú, korlátozott keresés, heurisztikus egység- és gazdasági értékeléssel. A pénzügyi előrejelzés a gazdasági megtakarítás alatt csökkentett képzési kiadással becsül; nem teljes harci szimuláció és nem a következő kártyák ismerete. Nem garantál optimális buildet vagy minden kombináció felismerését. A tesztek működést és konkrét hibák elkerülését igazolják, nem ember elleni győzelmi arányt.
