# V4.64.0 – A város átépítése

## Mit javít

A korábbi helyfelszabadítás főleg akkor bontott, amikor egy konkrét épület már nem fért el. Egyetlen gazdasági áldozatot keresett, és több korai termelőt automatikusan megvédett. Ez nem tudott két Munkatábor helyére Arénát tenni, sem egy rossz helyen álló támogatót értelmesen újraszervezni.

Az új réteg a közös AI rendes építési döntésének része, mindkét nézői oldalon és a normál egyjátékos ellenfélnél. Gazdasági, katonai, támogató, tároló, kapacitás- és védelmi épületek egyaránt jelöltek lehetnek. A főépületet nem bontja. A multiplayerben nem végez AI-műveletet.

## Döntés és végrehajtás

- Három perc és legalább 65 beépített mező után indul az időszakos keresés. Közvetlen veszély és a korábbi csere utáni várakozás letiltja.
- Egymást követő vizsgálatok más feloldott épülettípusokat vesznek sorra; a stratégiai cél is jelöltet adhat. Egy vizsgálat legfeljebb négy teljes városelőrejelzést futtat, a szabad helyre történő építés összehasonlításával együtt.
- Minden engedett elfordítást és rácshelyet előrangsorol. Egy célterületért legfeljebb kilenc épületet cserélhet le; üres célhelyre is áthelyezhet egy meglévőt. A romeltakarítás külön, korábban létező fizetett tervező marad.
- Elkülönített városmásolaton számolja végig a bontást, visszatérítést, kapacitásváltozást, építési árat, új épületet és a teljes város újraszámolását. A tervezés nem fogyaszt játékbeli véletlenszámot és nem hoz létre valódi egységet vagy választást.
- A pontozás együtt nézi a tényleges termelést, névleges teljes működési fogyasztást, katonai utánpótlást és minőségét, helyi támogatást, globális passzív hatásokat, szükséges kapacitást, területfoglalást és költséget.
- Legalább húsz másodpercig megfigyelt, feltöltött tároló mellett is fölösleges bevétel veszít az értékéből. A legutóbbi kilencven másodperc fogyasztási csúcsa és veszteségi üteme is számít. A Lélek korlátlan tárolása, a túltermelést hasznosító fejlesztés és a hiányt fedező Piac kivétel.
- A felhalmozott bevételt adó Rabszolgatábort a tényleges gazdasági hozzájárulása is védi. A már eldobott termelés nagy száma nem nyomhatja hátra a fölösleges termelőt a rövid jelöltlistán; a teljes városelőrejelzés ezután is megvédi a szükséges bevételt. A felfegyverzett civileket előállító emberi termelő katonai hozzájárulása is megmarad az értékelésben.
- Azonos épület áthelyezéséhez tényleges helyfüggő előny kell: új kedvezményezett, erősebb bejövő támogatás, nagyobb hozam vagy megváltozó képzési típus. Globális épület puszta arrébb rakása és területfelszabadítása nem elég.

A terv nem csökkentheti a szükséges sereglimitet és foglalt tartalékhelyet, nem ronthatja tovább a nyersanyaghiányt, nem tüntetheti el a fő stratégiai egység utolsó termelőjét. A jelenlegi megtakarításból finanszírozhatónak kell lennie már a bontási visszatérítés előtt is. Közvetlenül a bontás előtt újraértékeli az árat és a következményeket. A valódi, fizetett bontás és építés egy AI-körben történik; sikertelen építéskor visszaáll a város és a tornyok állapota. A főépület HP-jának és a tartalék egységek egyedi adatainak védelme is szerepel az ellenőrzésben.

Sikeres csere után legalább 45 másodpercig nem tervez újabb átépítést. Kilencven másodpercig emlékszik a frissen bontott és épített típusokra, hogy ne bontson és építsen vissza azonnal ugyanazt. Gazdasági vészhelyzet továbbra is felülírhatja az egyszerű visszaépítési büntetést.

## Kódszerkezet

- `src/ai/redevelopment.js`: megfigyelés, jelöltek, keresési keret, fizetett végrehajtás és várakozás.
- `src/ai/redevelopment-value.js`: tiszta összehasonlítás, gazdasági/képzési érték, helyfüggő előny és biztonsági feltételek.
- `src/ai/shared-planner.js`: egyetlen bekötési pont a meglévő közös AI-körbe, közös passzív értékelés.

A Piac átváltási aránya és a felfegyverzett civilek 40 másodperces időköze közös segédbe/konstansba került, hogy a valódi játékmenet és a becslés ugyanazt az alapértéket használja. Az árak, együtthatók, harci szabályok és a multiplayer szabályverzió nem változtak.

## Ellenőrzés és korlátok

A `tests/ai-redevelopment.cjs` 33 ellenőrzése valódi fizetett cserét vizsgál mindkét AI-oldalon, több épület bontását, mindhárom nép helyi támogatását, katonai termelő áthelyezését, tárolást, foglalt tartalékokat, a külön aktív-egységplafont, előző meccs állapotának törlését, finanszírozást, visszaállítást, tiszta előrejelzést és a valódi közös AI önálló döntését. Az új teszt a normál tesztsor része.

Ez korlátozott keresés és heurisztikus értékelés. Nem keres minden lehetséges teljes városelrendezést, nem garantál optimális buildet vagy minden támogatási kombináció felismerését. A pillanatnyi túltermelés nem azonos a fölösleges épülettel; egy későbbi katonai hullámhoz, piachoz vagy Lélek-alapú sebzéshez szükséges tartalék szándékosan megmaradhat. A város mindenáron történő teleépítése vagy bontása nem cél.

Újrafuttatás: `npm run build`, majd `node scripts/test.cjs tests/ai-redevelopment.cjs`. Hosszú valódi meccsek: `ROADLORDS_AI_SECONDS=1200 ROADLORDS_AI_TAG=redevelopment-final npm run audit:ai-matches`. Ez kézzel indított fejlesztői mérés; a játék nem exportál automatikus meccsnaplót.

## A végleges kód valódi meccsei

A `cd31fba` kóddal két normál AI–AI mérkőzés futott, mindhárom néppel, 42-es kezdőmaggal. A katonák és a városok a tényleges kezdőválasztásokból és gazdaságból épültek fel; a mérés nem adott ajándék pénzt vagy sereget.

| Párosítás | Vizsgált idő | Bal / jobb oldal sikeres átépítései | Eredmény |
| --- | ---: | ---: | --- |
| Ork – ember | 20:00 | 8 / 3 | Mindkét főváros állt az időhatárnál. |
| Élőhalott – ork | 13:31 | 5 / 2 | Élőhalott győzelem, természetes meccsvég. |

Konkrét fizetett műveletek:

- Az ork–ember mérkőzésben **hét Munkatábor bontása** került végrehajtott átépítési tervekbe. A végén öt maradt, a felhalmozott bevételt adó Rabszolgatábor is megmaradt. A végső névleges termelés továbbra is fedezte mindhárom nyersanyag teljes képzési fogyasztását.
- Több Munkatábor, Vadászház és katonai épület helyére Kunyhó került. Egy Trollverem hat régi katonai épület helyén jött létre. A támogatási cserék közt Templom → Kocsma, Kővágó → Őrház is történt.
- Az élőhalott–ork meccsen Lélekhasadék helyett Kripta, majd másik hasadék helyett Temető épült; két Pestiskamra helyén Sötét torony. Az ork Raktárt épített katonai termelő helyére, illetve három Dühöngő-termelő helyére Kunyhót.
- A végrehajtás és a teljes meccsek nem jeleztek böngésző- vagy játékmotorhibát. A helyfüggő áthelyezést a célzott tesztek igazolják; e két meccsben nem állítunk mért természetes áthelyezési eredményt.

Az új átépítési csomag 33 ellenőrzése sikerült; a teljes közös AI/gazdasági integrációs vizsgálatok és a végső előszűrési javítás érintett tesztjei is átmentek. A végleges kód teljes tesztsora és a GitHub Pages publikálása is sikerült: [kiadási futás](https://github.com/krisztianmatekiss/Roadlords/actions/runs/42596694118).

A keresés mért 95. percentilise 31,8 ms és 18,0 ms volt; a leglassabb keresés 57,6 ms és 20,6 ms. A keresés időszakos, legfeljebb négy teljes előrejelzéssel. A mérés instrumentált, fej nélküli böngészőben történt, ezért ezek nem játék közbeni FPS-adatok. A korlátozott keresés mellett is maradhatnak drágább AI-körök.

A kevés, azonos kezdőmagú minta nem győzelmi arány és nem bizonyítja minden csere stratégiai optimalitását. Az ork városban a javítás után is maradt túltermelés: a tervező csak a rendelkezésre álló lapokkal és a rövid jelöltlistával keres nyereséges cserét. A felmért állapotok és végrehajtott műveletek: [audit JSON](audits/ai-redevelopment-4.64.json).

E két párosítás megismétléséhez: `ROADLORDS_AI_SECONDS=1200 ROADLORDS_AI_PAIRS=orc:human,undead:orc ROADLORDS_AI_TAG=redevelopment-release npm run audit:ai-matches`.
