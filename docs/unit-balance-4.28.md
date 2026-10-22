# Egységbalance · 4.28.0

2026-10-22. Felhasználói kérés: az ork és élőhalott egységek, különösen a Troll, Sámán és az élőhalott egyediek felülvizsgálata az emberekhez képest. Az épület helyfoglalása, ára, egyedisége, sereghely és folyamatos fenntartás is számít. A külön jóváhagyott sorrend: előbb relatív egységbalance, utána minden új képzési alapárra +25%.

## Idők és helyfoglalás

Az alábbi idők támogatás és fejlesztésbónusz nélkül, L1 / L2 / L3; L4-en a képzési idő L3-é marad, az ág külön képességet ad.

| Egység | Korábbi idő (mp) | Új idő (mp) | Katonai mező | Egyedi |
|---|---|---|---:|---|
| Mágus (referencia) | 12 / 9,6 / 7,2 | változatlan | 4 | igen |
| Pap (referencia) | 9 / 7,2 / 5,4 | változatlan | 2 | nem |
| Troll | 30 / 27 / 24 | 24 / 19,2 / 14,4 | 9 | igen |
| Sámán | 10 / 9 / 8 | 9 / 7,2 / 5,4 | 2 | nem |
| Csontváz és feltételes íjászváltozata | 5 / 4,25 / 3,5 | 5 / 4 / 3 | 1 | nem |
| Zombi | 9 / 8 / 7 | 8 / 6,4 / 4,8 | 2 | nem |
| Szellem | 7 / 6 / 5 | 6 / 4,8 / 3,6 | 1 | nem |
| Nekromanta | 25 / 22 / 19 | 14 / 11,2 / 8,4 | 4 | igen |
| Vámpír | 35 / 31 / 27 | 16 / 12,8 / 9,6 | 4 | igen |
| Lich | 40 / 35 / 30 | 18 / 14,4 / 10,8 | 4 | igen |

A Mágustorony és a három élőhalott elit termelője egyaránt 2×2-es és egyedi. Az új elitek minden szinten a Mágus képzési idejének 1,17 / 1,33 / 1,5-szeresét kapják, a korábbi L3-as 2,64 / 3,75 / 4,17-szeres helyett. A Troll alapstatisztikái sokkal erősebbek: 3200 HP, 110 elsődleges és 35 másodlagos sebzés, 4 sereghely. Emiatt nem kap Mágus-sebességű utánpótlást; az L3-as 24→14,4 mp így is 67%-kal nagyobb kibocsátás. A Trolltenyészet 2×2-es, nem egyedi, fél HP/sebzés/ár, de továbbra is 4 sereghely: ezek megmaradnak.

## Alaperő és szerep

- Sámán: 6→8 sebzés, 4,2→2,5 mp támadási idő, 120→150 hatótáv. A 4 másodperces átok így nem rövidebb a következő támadásig tartó időnél; a nagyobb lőtáv segít a front mögött maradni. Az átkok alapereje, időtartama, nem halmozódó szabálya és két L4-ága változatlan. A támadás továbbra is a valódi animáció találati pontján sebzi és átkozza a célpontot.
- Csontváz: 70→85 HP, 9→10 sebzés. Közelharcban továbbra is gyengébb az emberi Kardosnál; az ár és a távolsági fizikai ellenállás a megkülönböztető előny. Az íjászváltozat HP-ja szintén 85, sebzése 8 marad; továbbra is külön ereklye és 50%-os kiválasztás kell hozzá.
- Zombi: 220→280 HP, 8→12 sebzés. Megmarad lassú, 1,8 mp-es ütésű, mérgező első sornak; a 2 mezős termelő területigényét a gyorsabb utánpótlás és használhatóbb alaptest együtt kompenzálja.
- Szellem: 65→75 HP, 5→8 sebzés. A 40%-os kitérés és az L4-képességek megmaradnak; a drágább, lassabb képzés mellé korábban túl kevés alapsebzés járt.
- Nekromanta: 90→100 HP; a 15 mp-enkénti idézés, 10 mp-es idézetidő és L4-ágak megmaradnak.
- Vámpír és Lich: nem nő a harci alaperő; az utánpótlás, relatív ár és fenntartás változik. A többi ork alaperő, így a Harcos visszaállított **300 HP-ja**, a korábbi Troll-splash és Goblin-ereklye döntés is megmarad.

## Képzési árak

Az új alapárakra egyszer kerül +25%, az összár egészre kerekítve. A nyersanyagok közti kiosztás a legnagyobb tört részeket kerekíti felfelé, így például a Goblin 1 követ kérő komponense nem drágul önmagában 100%-kal. Nulla költségből nem lesz fizetős komponens. A városi kedvezmények és a Trolltenyészet felezése a már megemelt alapár után hatnak; az ingyenes idézetek és erősítések továbbra is ingyenesek.

| Egység | Végleges Fa / Kő / Élelem |
|---|---|
| Kardos | 0 / 6 / 8 |
| Lándzsás | 6 / 0 / 8 |
| Íjász | 9 / 0 / 7 |
| Lovag | 0 / 20 / 19 |
| Pap | 13 / 12 / 15 |
| Katapult | 33 / 26 / 11 |
| Mágus | 20 / 20 / 15 |
| Ork Harcos | 0 / 9 / 11 |
| Dühöngő | 5 / 8 / 10 |
| Goblin | 4 / 1 / 5 |
| Warglovas | 6 / 20 / 23 |
| Sámán | 13 / 10 / 15 |
| Faltörő kos | 23 / 28 / 12 |
| Troll | 31 / 75 / 75 |

Élőhalott végleges Lélekárak: Csontváz / Csontváz Íjász **10**, Zombi **20**, Szellem **14**, Nekromanta **50**, Vámpír **56**, Lich **75**. A Szellem 11-es, Nekromanta 40-es, Vámpír 45-ös és Lich 60-as új viszonyítási alapjára került a +25%; ezért egyes elitek a korábbi próbaárukhoz képest így is olcsóbbak lettek. Ez a felhasználó által választott műveleti sorrend következménye.

## Építési ár és tartós igény

Az építési árakat átnéztük, nem emeljük rájuk a képzési +25%-ot. A játék tényleges, kedvezmény és alapozás nélküli árai: Mágustorony **210 Fa + 360 Kő**; Sámántábor **180 Fa + 200 Kő**; Trollverem **360 Fa + 420 Kő**. Az élőhalott egyedi épületek **140 / 200 / 220 Lélek**, változatlanul. A nyers adatbeli épületár nem mindenhol azonos a végleges, felületen és levonáskor használt árral: az összevetés a futó motor `buildPrice` függvényét használja.

A Nekromanták szentélye 1,2→1,0, a Vámpírkastély 1,5→1,2, a Lichtorony 1,8→1,4 Lélek/mp fenntartást kap. L3-on, folyamatos képzéssel együtt:

| Termelő | Képzés + fenntartás / mp |
|---|---:|
| Mágustorony | 55 / 7,2 = 7,64 össznyersanyag |
| Nekromanták szentélye | 50 / 8,4 + 1 = 6,95 Lélek |
| Vámpírkastély | 56 / 9,6 + 1,2 = 7,03 Lélek |
| Lichtorony | 75 / 10,8 + 1,4 = 8,34 Lélek |

Ezek nem egyenértékű pénznemek: az emberek három termelési láncot, az élőhalottak egyféle, fenntartással terhelt gazdaságot használnak. A folyamatos igény és a szükséges gazdasági mezők fontosabbak egy összeadott árnál. A gyorsabb képzés teljes igényét a HUD azonnal mutatja; nyersanyaghiány nem rejti el a keresletet.

## Ellenőrzés és korlát

A `tests/unit-balance.cjs` mind a 21 végleges árat, a 20 termelőt tényleges L1/L3 ciklusban (40 próba), a pontosan egyszeri levonást, a képzési előnézetet, a teljes költségkeretet és az élőhalott fenntartást vizsgálja. Külön ellenőrzi a kedvezményeket, Trolltenyészetet és a Sámán valós, késleltetett találatát. A korábbi Troll/Goblin-változások, élőhalott képességek és multiplayer-próbák megmaradnak. Az archivált 1000 egységes összehasonlítás csak a nevesített Sámán-deltákat engedi át az eddigi kivételek mellett.

A `npm run audit:balance` az új diagnosztikát futtatja: 6 vegyes összeállítás, L1/L3, két véletlenmag, mindkét oldalról = 48 valódi próba. Oldalanként 18 katonai mező, 60 mp-nyi kibocsátás, közelharcosok elöl, távolságiak hátul. A változás előtti és utáni futás összesen 96 mintát ad. Az ár, fenntartás és szükséges bevétel szerepel a jelentésben; a harc nem szimulál gazdasági építkezést, tornyokat, menet közbeni utánpótlást vagy fejlesztéseket.

Ez első balance-kör, nem 50%-os fajgyőzelmi arány bizonyítása. A Trollos L3-minta közelebb került az emberi oldalhoz, és megfordult; az élőhalott alapfelállások továbbra is veszítenek az adott, Papot és Mágust tartalmazó emberi referencia ellen, de több veszteséget okoznak. A minta például nem adja oda az élőhalott íjászereklyét. A külön képességek és L4-kombók miatt nem célszerű minden ilyen felállást puszta alaperő-emeléssel győzelemre kényszeríteni. További teljes mérkőzésekből érdemes finomítani.

Az összevetés megőrzött számai: [mérési összesítő](audits/unit-balance-4.28.json).
