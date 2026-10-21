# Emberek és orkok: balance- és AI-áttekintés

2026-10-21. A 4.22.0 harci értékeinek vizsgálata, a 4.23.0 AI-javításával együtt. A 4.23.0-s AI-kiadásban egységérték, ár, képzési idő és fejlesztéshatás nem változott. Az alábbi számszerű módosítások kipróbálásra javasolt jelöltek.

## Elfogadott változtatások · 4.24.0

A felhasználó jóváhagyásával élesítve: Troll másodlagos területsebzése 55→35; Ork Harcos alapéletereje 300→250; Goblin íjászok sebzésbónusza +100%→+50%. A többi javaslat továbbra is kísérleti jelölt. **Az alábbi táblázatok és csataeredmények a változtatások előtti, 4.22.0-s állapotot rögzítik.** Nem az új változat újramért eredményei.

## Mire épül a vélemény?

532 elkülönített próbacsata futott a tényleges harcrendszerrel: 7 emberi × 7 ork egységtípus, 5 összehasonlítási mód, mindkét oldalról indulva (490); továbbá 7 vegyes/fejlesztett felállás, 3 véletlenmaggal és oldalanként megfordítva (42). Alapfajták, torony és utánpótlás nélkül, rögzített kezdőalakzatból. Lépés: 0,05 mp; időkorlát: 90 mp. A legendás Kivégzés próbája kivételével a párharcok fejlesztés nélkül indulnak; a vegyes próbákban a külön jelölt módosítók aktívak.

Az öt mód: 12–12 egység; 192 össznyersanyagnyi keret; egy L1-es termelő 60 másodperces kibocsátása; ugyanez L3-on; végül 9 katonai épületmező L3-as kibocsátása, az egyedi épületek korlátjával és 48 sereghellyel. A fa/kő/élelem egyszerű összeadása csak névleges keret, nem valós gazdasági egyenérték. A helyalapú próba nem fizetteti ki az épületeket, a sereglimithez szükséges várost vagy a termelés nyersanyagigényét. Ezek diagnosztikai összehasonlítások, **nem teljes játékokra mért fajgyőzelmi arányok**. A Pap és Sámán önálló párharca nem méri megfelelően a támogatói értéket. Egyes felállásoknál az oldalcsere érdemi különbséget okoz; ezért az egyoldalú eredményeket nem tekintjük döntőnek.

Újrafuttatás: `npm run build && npm run audit:balance`. A nyers kimenet az `artifacts/balance-audit.json` fájlba kerül; a vizsgált alapverzió rögzített adatai: [balance-v4.22.json](audits/balance-v4.22.json).

## Alapértékek

DPS: álló célpontra számolt nyers sebzés/másodperc, ellenbónusz, területsebzés, gyógyítás, páncél és mozgási idő nélkül. A képzési idő sorrendje L1 / L2 / L3; az ár fa / kő / élelem.

| Egység | Életerő | Nyers DPS | Hatótáv | Képzési idő, mp | Ár | Sereghely |
|---|---:|---:|---:|---|---|---:|
| Kardos | 100 | 12,0 | 30 | 5 / 4 / 3 | 0 / 5 / 6 | 1 |
| Lándzsás | 90 | 9,09 | 45 | 5 / 4 / 3 | 5 / 0 / 6 | 1 |
| Íjász | 55 | 6,67 | 150 | 6 / 4,800000000000001 / 3,5999999999999996 | 7 / 0 / 6 | 1 |
| Lovag | 240 | 24,0 | 32 | 9 / 7,2 / 5,3999999999999995 | 0 / 16 / 15 | 1 |
| Pap | 90 | 4,29 | 120 | 9 / 7,2 / 5,3999999999999995 | 10 / 10 / 12 | 1 |
| Katapult | 220 | 5,0 | 400 | 12 / 9,600000000000001 / 7,199999999999999 | 26 / 21 / 9 | 1 |
| Mágus | 75 | 14,12 | 150 | 12 / 9,600000000000001 / 7,199999999999999 | 16 / 16 / 12 | 1 |
| Ork Harcos | 300 | 16,0 | 30 | 8,5 / 7,5 / 6,5 | 0 / 7 / 9 | 1 |
| Dühöngő | 180 | 24,62 | 30 | 8 / 7 / 6 | 4 / 6 / 8 | 1 |
| Goblin | 30 | 6,36 | 115 | 3,5 / 2,75 / 2 | 3 / 1 / 4 | 1 |
| Warglovas | 400 | 20,0 | 30 | 11 / 10 / 9 | 5 / 16 / 18 | 1 |
| Sámán | 100 | 1,43 | 120 | 10 / 9 / 8 | 10 / 8 / 12 | 1 |
| Faltörő kos | 1100 | 4,0 | 30 | 12 / 11 / 10 | 18 / 22 / 10 | 1 |
| Troll | 3200 | 55,0 | 30 | 30 / 27 / 24 | 25 / 60 / 60 | 4 |

## Ami valóban kilóg

**Ork Harcos és Dühöngő: erős alapcsomag.** A Harcos 300 HP-ja és 16 DPS-e a Kardos 100 HP-jával és 12 DPS-ével áll szemben, miközben a képzési ár 16 és 11 össznyersanyag. Egy L1-es termelőből 60 mp alatt származó 12 Kardost 7 Harcos mindkét oldalról indulva legyőzött; 6–7 ork maradt. L3-on 20 Kardos vs 9 Harcos után 2–5 ork maradt. Azonos névleges keretből 17 Kardost 12 Harcos verte, mind a 12 ork életben maradt. A Dühöngő ugyancsak erős költségarányosan, még a sebességnövelő sérülési képessége és ereklyéi előtt.

Ugyanakkor az emberi Laktanya 1, az ork Harci tábor 2 mező; az emberi képzés 5→3 mp-re, az orké 8,5→6,5 mp-re javul. Emiatt a háromszoros HP-ból nem következik háromszoros fajsúly vagy minden helyzetben ork fölény. A városépítési és gazdasági tényezőket külön kell kezelni.

**Troll: a legsürgősebb tömegharc-probléma.** Egy fejlesztetlen Troll 17 Lándzsást mindkét oldalról indulva megölt, és 2400–2425 HP-ja maradt a 3200-ból. A Lándzsások +150%-os nehézegység-ellenes bónusza aktív. A Troll 110-es elsődleges találata az alap 90 HP-s Lándzsást azonnal megöli, mellette 55-öt sebez a környezetre. A saját egységeken átjárható, sűrű front ezt tovább erősíti. A 9 mezős egyedi épület, 145-ös névleges egységár és 4 sereghely valódi hátrány, mégis erős ellenjelzés, hogy a drágább, nehézegység ellen szánt gyalogság ennyire elmarad.

**Lovag és Warg: nem egyértelmű nerfcélpont.** Azonos darabszámnál a Warg nyer, de azonos névleges keretből 6 Lovag mindkét oldalon legyőzte a 4 Wargot. L3-as egytermelős kibocsátásnál 11 Lovag verte a 6 Wargot. A kezdő lándzsadobás erős, viszont a Warg drágább; az eredmény alapján nem indokolt a teljes ork lovasság vak gyengítése.

**Íjász és Goblin: inkább eltérő termelési görbe.** Azonos keretből 14 Íjász verte a 24 Goblint, de L3-as kibocsátásnál 30 Goblin verte a 16 Íjászt. A nagyobb emberi lőtáv számít. A Goblin íjászok ereklyét külön vizsgálnám: +100% sebzés és +50% hatótáv egyetlen lapból nagy erőugrás.

**Pap és Sámán: korai értékük kérdéses, későbbi hatásaik különösen fontosak.** A Pap ára 32 névleges nyersanyag, 30-at gyógyít 4,2 mp-enként (kb. 7,14 HP/mp), és 90 HP-ja van. Az azonos keretű 9 Kardos + 1 Pap felállás a 8 Harcost nem győzte le; a 12 Kardoshoz képest sem javított a kimenetelen. Ez egy kicsi próba, nem általános bizonyíték a Pap gyengeségére. A Sámán 30-as ár mellé 1,43 nyers DPS-t és véletlen átkot ad: értékét a megátkozott célpont és a csapattársak döntik el. Egyiknél sem buffolnék vakon sebzést; előbb ár, hatáskihasználás és kevert sereg tesztelendő. Az L4 és a gyógyításhoz/átokhoz kötött ereklyék miatt az alaperő emelése később is megsokszorozódhat.

## Fejlesztések és kombók

- **Kivégzés:** az első 4%-os lap a 12 Kardos vs 8 Harcos felállást 6 ork győzelemből 4 emberi és 2 ork győzelemre fordította. Egyetlen képesség nagyot változtat az erős egységek elleni eredményen; jelentős a véletlen hatása. Troll ellen is külön stressztesztet érdemel. Nem célszerű egy faj alapgyengeségét egy ritka, azonnal ölő lappal kiegyenlíteni.
- **Goblin íjászok:** dupla sebzés és másfélszeres hatótáv. Elsőként ezt az egyszeri erőugrást vizsgálnám a Goblin alapstatisztikái helyett.
- **Vérzés:** az első 2 értékű állapot önmagában 2+1 sebzést okoz, a következő felvétel 3+2+1-et; a találatok összeadódása miatt az érték nem egyszerűen lineáris extra DPS. Több Harcos egy nagy HP-s célpontot aránytalanul gyorsan olvaszthat.
- **Földrengető:** minden harmadik ütés 2,5× sugárral, teljes sebzéssel és kábítással dolgozik. Szabad térben a sugár 2,5-szerezése 6,25× területet fedhet le; az útszélek és a tényleges alakzat ezt korlátozzák. Több Troll kábításai külön próbát igényelnek.
- **Stratégiai fölény:** három további választás + öt újrasorsolás + három kitiltás univerzális értéke magas. A szűk egységereklyékkel szemben sok helyzetben automatikus választás lehet; ez itt kódból következő kockázat, nem teljes játéksorozattal igazolt eredmény.
- **Specializáció és gyakori lapok:** a specializált +10% és az általános +5% önmagában érthető csere. A hadsereg arányai, a már felvett lapok és a Specializáció többletfelvétele alapján kell értékelni őket, nem csak a kártyán álló százalékból.
- **Hajcsártábor:** −20% képzési idő valójában +25% kibocsátás, −40% idő +66,7%. A csökkentett kezdő HP és a nagyobb nyersanyagfogyasztás lényeges ellensúly; a gyorsítás önmagában nem bizonyít túlerőt.

## Első balance-kísérletre javasolt sorrend

Ezek külön-külön kipróbálandó értékek, nem együtt élesített csomag:

1. **Troll másodlagos területsebzés 55→35**, az elsődleges 110 és a 3200 HP megtartásával. Elsőként a tömeggyilkolást csökkenteném, a nagy szörny karakterét megtartva. Alternatív külön kísérlet: Lándzsás HP 90→120, hogy egy alap Troll-találatot túléljen. A két kísérletet először nem kombinálnám.
2. **Ork Harcos HP 300→250** mint mérsékelt alapgyalogsági próba. Utána azonos költségű és termelési sebességű vegyes seregeket kell újramérni, L1–L4-en is. A Dühöngőnél előbb 18→21 körüli összköltséget tesztelnék, a támadási ritmus megtartásával.
3. **Goblin íjászok +100%→+50% sebzés** külön ereklyepróbaként, egyelőre változatlan hatótávval. Az alap Goblin és Íjász első körben maradjon.
4. **Pap árának 32→26 körüli összköltsége** külön támogatói próbaként. A gyógyítás buffja előtt megvizsgálnám a Szent fogadalom, Szent pajzs és L4 csoportgyógyítás kombinációit.

A próbasor következő szükséges szintje a gazdaságot és építési költségeket is fizető, több véletlenmagos teljes játék; L4 ágak, legalább több tipikus ereklyeösszeállítás és kicsi/nagy seregek. Az itt felsorolt jelölteket ilyen ellenőrzés nélkül nem nevezném kész balance-nak.

## AI: bizonyított hibák és az elkészült javítás

- **Átló és közös oldal összekeverése:** a pontozó a Gyülekezőtér, Páncélkovács, Akadémia, Alkimista és több szinergia körül 1 mezős átlós közelséget is értékelt. A tényleges szomszédsági hatások közös oldalt igényelnek. A pontozás most ezt követi, az L4 és hatótávnövelő kivételekkel együtt.
- **Utólag beépített működési terület:** az AI olcsó házakat tett a támogatók értékes szomszédos telkeire. A még három termelőnél kevesebbet kiszolgáló támogatók környékét most hátrébb sorolja a házak és más, oda nem illő épületek számára. Ez puha preferencia: tele városban az utolsó legális telek továbbra is használható.
- **Haszontalan helyi támogatók:** tisztán helyi hatású támogatót nem épít olyan helyre, ahol egyetlen aktív termelőt sem érint. A Raktár és Kocsma globális haszna, a globális Akadémia és a Hajcsártábor globális életlopásága kivétel marad.
- **Ork ellenfél láthatatlan összetétele:** az emberi AI régi ellenfél-elemzője csak emberi egységazonosítókat ismert. Most az összes ork egységet a megfelelő harci szerephez számítja; a Troll 4 sereghelyes súllyal jelenik meg az összetételben. Ez szerepbecslés, nem a két faj egységeinek statisztikai azonosságát állítja.
- **Lassú ork helykeresés:** a foglaltságot és a forgatott alakzatot egyszer számoljuk, a döntésen belüli ismételt keresést gyorsítótárazzuk. Egy 300 mp-es, rögzített magú építési próbában a korábbi 98 ms-os 95. percentilis 14,5 ms-ra csökkent, a végső városépületek darabszáma változatlan maradt. Ez helyi felhőgépes mérés, nem minden gépre garantált idő.

A célzott próbában 10 utólag épített Lakóház nem foglalta el az alulhasznált Gyülekezőtér közvetlen szomszédos helyeit; az utána épített Laktanya tényleges termelési útvonala a Gyülekezőtér lett. A 300 mp-es emberi építési mintában a Gyülekezőtér 7, a Páncélkovács 5 katonai termelőt ért el. Mindkét faj építési mintája futási hiba nélkül lefutott.

**Ami maradt:** az ork AI több fejlesztést fix vagy véletlen pontszámmal rangsorol, és katonai épületeinél darabszámalapú választást használ. A drágább egységtípusokra való tudatos félrerakás és a fejlesztések valódi seregarány szerinti értékelése következő javítás. A helyfoglalás nem rendez át korábban megépített várost. Az elhelyezési javítások a szóló AI döntéseire vonatkoznak; a játékos építési szabályai és a multiplayer-protokoll nem változtak.
