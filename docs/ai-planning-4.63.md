# V4.63 – Kombinációk köré épülő közös AI

Az új réteg mindhárom frakció normál AI-ját és az AI–AI mód mindkét oldalát szolgálja. A játék árait, egységeit, kártyahatásait és multiplayer szabályait nem módosítja. Kampánymódot, személyiségeket és automatikus meccsnaplózást nem vezet be.

## Feladatok és fájlok

- `src/ai/strategy-model.js`: a tényleges katalógusból felsorolja a legendás és L4 célokat. Az egységtípusokat és mechanikákat kapcsolja össze. A különleges átalakulások és feltételek külön adatkapcsolatot kapnak; nem a magyar leírásokat elemzi.
- `src/ai/strategy-projection.js`: izolált városmásolaton vizsgál egymás utáni feloldást, fizetett építést és fejlesztést. Számol készlettel, névleges termeléssel/fogyasztással, várakozással, tárolóval és érvényes helyfoglalással. A tényleges kártyapoolból, ajánlatméretből, választási arányokból és legendás garanciából becsül megszerzési esélyt. A fizetett lépés hasznát nem teszi bizonytalanná egy később esetleg megérkező legendás.
- `src/ai/strategy-planner.js`: egyszerre legfeljebb három eltérő irányt értékel, egy közeli alternatív sorrendet is kipróbálhat. A meglévő gazdasági és védelmi vezérlőnek választási, beruházási, elhelyezési és kapuidőzítési súlyokat ad.

Egy tervet a felvett lapok, az elkészült épületek, a technológiai szintek és a tényleges termelési háttér alapoznak meg. A sok azonos termelő önmagában gyenge elköteleződés. Új lehetőség hatására újraszámol; a közeli értékű irányok közötti ugrálást kis megtartási küszöb fogja vissza. Ha 90 másodpercig nincs releváns előrelépés, ez a küszöb megszűnik.

## Megvalósítás a játékban

- A tervhez kapcsolódó commonok, legendások és L4 ágak többet érhetnek. Egy vegyes sereget érintő tervnél az egyetlen kis egységcsoportra ható common nem kap teljes fókuszbónuszt.
- Az AI megtervezheti a nagyobb beruházáshoz szükséges raktárat vagy termelőt is. A megvalósítást továbbra is a valódi, fizetett építési útvonal végzi; képzési fogyasztás és vészhelyzet felülírhatja a beruházást.
- A fontos, akár még feloldásra váró épületnek puha helyfoglalást adhat. Ez a jó termelőhelyeket nem tiltja le; vészhelyzetben a stratégiai helyfoglalás nem akadályozza a védelmet.
- A helyi támogatók elhelyezése figyeli a terv fő egységeinek termelőit is. A már elkészült cél nem kap újra első példányra szóló építési bónuszt.
- Egy erősen támogatott egységből összeálló hullám nagyobbra gyűlhet. A gyülekezés legfeljebb 45 másodpercig emelheti a szükséges hullámméretet; utána az összegyűlt sereg elindulhat. Közeli, hasznos fejlesztési lehetőségre legfeljebb 12 másodpercet várhat. Tele tartalék és közvetlen veszély ezt a várakozást feloldja.

## Terhelés és korlátok

A normál tervezés legfeljebb 16 előretekintési lépést használ egy frissítésben; 40 épület fölött legfeljebb 8-at. Egy vizsgált sorrend legfeljebb négy lépés. A tervek szokásosan 8, zsúfolt városban 12 másodpercig újrahasznosíthatók; új lap vagy technológia friss értékelést vált ki. A memória a városhoz és főépületéhez kötött, új meccsbe nem szivárog át.

A vetített város nem fogyaszt játékbeli véletlent, nem gyárt valós egységeket, és nem módosítja az igazi várost vagy tornyokat. A jövőbeli lapkészlet és a várható bevétel becslés. A harc jövőjét nem szimulálja végig, és a mechanikai kapcsolatok adatainak bővítése továbbra is szükséges új hatások bevezetésekor. A teljesen szabad, tetszőleges mélységű kombinációkeresés ennél tágabb feladat.

## Ellenőrzés

`tests/ai-planning.cjs` ellenőrzi mindkét oldal izolált előretekintését, a Vámpírkert-kapcsolatot, a három egymást követő fejlesztési lépést, az esélyek bizonytalanságát, a megfizethetőséget, az ágak kizárását, a tervváltást, az emberi lovassági szomszédságot, az ork lovas- és élőhalott térfélirányt, a jövőbeli épülethelyet, az időben korlátozott kapuvárakozást, a meccsújrakezdést és a multiplayer kizárását.

A meglévő gazdasági, várostervezési, romeltakarítási, kapacitás- és védelmi ellenőrzések is futnak. A fejlesztői `audit:ai-battle` ugyanazzal a fizetett ellenféllel hasonlíthatja össze a korábbi és az új változatot; az `audit:ai-matches` a normál AI–AI teljes mérkőzést használja. Néhány kezdőmag eredménye nem emberi ellenfelek elleni győzelmi arány.
