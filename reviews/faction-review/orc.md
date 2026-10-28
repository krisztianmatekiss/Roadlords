# Orkok — részletes fajterv

**Jelenlegi játék:** Fa–kő–hús gazdaság, két nyersanyagot adó Munkatáborral és nyitott kapuból profitáló Vadászházzal. Harcos, Dühöngő, Goblin, Warglovas, Sámán, Faltörő kos és Troll. A Troll 4 sereghely és 9 mezős alapspawner. Jelenleg sok az életlopás, a véletlen születési bónusz és a más fajokhoz hasonló ingyenutánpótlás.

**Javasolt saját irány:** Javasolt egyediség: kockázatos túlhajszolás, harc közben szerzett dicsőség, vérzés, átok és fizikai nyomás. A zsákmány rombolásból/fogolyejtésből jöjjön, ne általános kamatból vagy halottidézésből. Globális életlopás és halál utáni állapotöröklés inkább élőhalott irány.

**Fontos:** minden döntés és új hatás javaslat, még nincs beépítve. A számok 4.56.0-ból származnak; az új ötletek próbaértékek.

[← Vissza a munkafüzethez](README.md)

## Egység készlet

<a id="unit-orc_warrior"></a>
<details>
<summary><strong>Ork Harcos</strong> · Meglévő · Szerep megtartása · P2</summary>

**Jelenlegi hatás**

Nagy HP-jú közelharcos, külön alappasszív nélkül.

**L4 / halmozás**

Az egység alapváltozata; L4 hatásai a termelő épület sorában.
Az elit/veterán közös alapállapot; a hozzá vezető út fajonként különbözzön.

**Ár / hely / előfeltétel**

HP: 300; sebzés: 20; támadásköz: 1,25 mp.
Hatótáv: 3 m; mozgás: 4,25 m/s.
Egységár: 11 kő, 14 hús; sereghely: 1.
Képzés L1/L2/L3: 10,625 / 9,375 / 8,125 mp.
Termelő: Harci tábor.

**Megjegyzés**

Erős, drágább és 2 mezős termelőből jövő frontgyalogos. A Kardoshoz képest a háromszoros HP önmagában nem fajerőmérő; a táborhely és kibocsátás számít.

**Javasolt új működés**

Az egységszerep alapján válogassuk a fejlesztéseket; ez a sor nem automatikus HP/sebzés-módosítás.

**Kapcsolódó tartalom:** [Emberek – Kardos](human.md#unit-swordsman), [Orkok – Harci tábor](orc.md#building-orc_war)

</details>

<a id="unit-orc_berserker"></a>
<details>
<summary><strong>Dühöngő</strong> · Meglévő · Szerep megtartása · P2</summary>

**Jelenlegi hatás**

Minden 2% hiányzó HP után +1% támadási sebesség.

**L4 / halmozás**

Az egység alapváltozata; L4 hatásai a termelő épület sorában.
Az elit/veterán közös alapállapot; a hozzá vezető út fajonként különbözzön.

**Ár / hely / előfeltétel**

HP: 180; sebzés: 16; támadásköz: 0,65 mp.
Hatótáv: 3 m; mozgás: 5,25 m/s.
Egységár: 6 fa, 10 kő, 13 hús; sereghely: 1.
Képzés L1/L2/L3: 10 / 8,75 / 7,5 mp.
Termelő: Dühöngők tábora.

**Megjegyzés**

Minden 2% hiányzó HP +1% támadási sebesség: ez az élő, sebesült ork agresszió magja. Az életlopás könnyen visszagyógyítja abból az állapotból, amely a képességet adja.

**Javasolt új működés**

Az egységszerep alapján válogassuk a fejlesztéseket; ez a sor nem automatikus HP/sebzés-módosítás.

**Kapcsolódó tartalom:** [Orkok – Fájdalomból erő](orc.md#legendary-orc_bers_rage), [Orkok – Vérivás](orc.md#normal-orc_leech)

</details>

<a id="unit-orc_goblin"></a>
<details>
<summary><strong>Goblin</strong> · Meglévő · Szerep megtartása · P2</summary>

**Jelenlegi hatás**

Gyors, kevés HP-jú távolsági parittyás.

**L4 / halmozás**

Az egység alapváltozata; L4 hatásai a termelő épület sorában.
Az elit/veterán közös alapállapot; a hozzá vezető út fajonként különbözzön.

**Ár / hely / előfeltétel**

HP: 30; sebzés: 3,5; támadásköz: 0,55 mp.
Hatótáv: 23 m; mozgás: 7 m/s.
Egységár: 5 fa, 2 kő, 6 hús; sereghely: 1.
Képzés L1/L2/L3: 4,375 / 3,438 / 2,5 mp.
Termelő: Goblin-tábor.

**Megjegyzés**

Olcsó, gyors parittyás; 1 mezős tábor, gyors ciklus. A fél sereghelyes L4 és ingyenlövések külön tömeg/FX keretet igényelnek. Ne legyen az emberi íjász átnevezve.

**Javasolt új működés**

Az egységszerep alapján válogassuk a fejlesztéseket; ez a sor nem automatikus HP/sebzés-módosítás.

**Kapcsolódó tartalom:** [Orkok – Goblin íjászok](orc.md#legendary-orc_gob_bow), [Orkok – Goblin össztűz](orc.md#legendary-orc_volley)

</details>

<a id="unit-orc_warg"></a>
<details>
<summary><strong>Warglovas</strong> · Meglévő · Szerep megtartása · P2</summary>

**Jelenlegi hatás**

Nyitó gerely 60 sebzéssel, 23 m hatótávval; utána közelharc. Épületeknél a dobás gyengébb.

**L4 / halmozás**

Az egység alapváltozata; L4 hatásai a termelő épület sorában.
Az elit/veterán közös alapállapot; a hozzá vezető út fajonként különbözzön.

**Ár / hely / előfeltétel**

HP: 400; sebzés: 30; támadásköz: 1,5 mp.
Hatótáv: 3 m; mozgás: 13,6 m/s.
Egységár: 7 fa, 25 kő, 29 hús; sereghely: 1.
Képzés L1/L2/L3: 13,75 / 12,5 / 11,25 mp.
Termelő: Wargkarám.

**Megjegyzés**

23 m-ről nyitó lándzsadobás, majd közelharc. Ez különbözzön a Lovag sebességből töltött rohamától és a Szellem áthaladásától.

**Javasolt új működés**

Az egységszerep alapján válogassuk a fejlesztéseket; ez a sor nem automatikus HP/sebzés-módosítás.

**Kapcsolódó tartalom:** [Emberek – Lovag](human.md#unit-knight), [Élőhalottak – Szellem](undead.md#unit-und_ghost), [Orkok – Vérszomjas vadászat](orc.md#legendary-orc_hunt)

</details>

<a id="unit-orc_shaman"></a>
<details>
<summary><strong>Sámán</strong> · Meglévő · Szerep megtartása · P2</summary>

**Jelenlegi hatás**

Találatonként egy véletlen átkot tesz a célpontra 4 másodpercre. Elsősorban az átok nélküli ellenfeleket támadja.
Gyengeség: −20% sebzés.
Sorvadás: −20% maximális életerő; lejáratkor nem gyógyít.
Kimerültség: −25% támadási sebesség.
Sebezhetőség: +20% elszenvedett sebzés.
Vakság: 25% eséllyel elhibázza a támadást.
Ugyanaz az átok frissül, nem erősödik.

**L4 / halmozás**

Az egység alapváltozata; L4 hatásai a termelő épület sorában.
Az elit/veterán közös alapállapot; a hozzá vezető út fajonként különbözzön.

**Ár / hely / előfeltétel**

HP: 100; sebzés: 8; támadásköz: 2,5 mp.
Hatótáv: 30 m; mozgás: 4,75 m/s.
Egységár: 16 fa, 13 kő, 19 hús; sereghely: 1.
Képzés L1/L2/L3: 11,25 / 9 / 6,75 mp.
Termelő: Sámántábor.

**Megjegyzés**

Támogató átokmágus. Nem a Pap vagy Mágus nyers sebzésére kell felhúzni: az alkalmazható átkok és célpontok tényleges értéke számít.

**Javasolt új működés**

Az egységszerep alapján válogassuk a fejlesztéseket; ez a sor nem automatikus HP/sebzés-módosítás.

**Kapcsolódó tartalom:** [Emberek – Pap](human.md#unit-priest), [Emberek – Mágus](human.md#unit-mage), [Orkok – Átokmester](orc.md#legendary-orc_curse_master)

</details>

<a id="unit-orc_ram"></a>
<details>
<summary><strong>Faltörő kos</strong> · Meglévő · Szerep megtartása · P2</summary>

**Jelenlegi hatás**

130 épületsebzés, 8 egységsebzés; −50% kapott fizikai sebzés. Heavy ostromegység.

**L4 / halmozás**

Az egység alapváltozata; L4 hatásai a termelő épület sorában.
Az elit/veterán közös alapállapot; a hozzá vezető út fajonként különbözzön.

**Ár / hely / előfeltétel**

HP: 1100; sebzés: 8; támadásköz: 2 mp.
Hatótáv: 3 m; mozgás: 2,5 m/s.
Egységár: 29 fa, 35 kő, 15 hús; sereghely: 1.
Képzés L1/L2/L3: 15 / 13,75 / 12,5 mp.
Termelő: Faltörő műhely.
Épületsebzés: 130.

**Megjegyzés**

Közelharci ostrom és szállító/fedező szerep, 50% fizikai ellenállással. Az Élő ostrompajzs sebzésátvétele és Csontpajzs között védelmi átfedés van, de a hordozás valóban sajátos.

**Javasolt új működés**

Az egységszerep alapján válogassuk a fejlesztéseket; ez a sor nem automatikus HP/sebzés-módosítás.

**Kapcsolódó tartalom:** [Orkok – Trójai kos](orc.md#legendary-orc_trojan), [Élőhalottak – Csontpajzs](undead.md#legendary-skeleton_leg_guard)

</details>

<a id="unit-orc_troll"></a>
<details>
<summary><strong>Troll</strong> · Meglévő · Szerep megtartása · P2</summary>

**Jelenlegi hatás**

110 elsődleges, 35 másodlagos csapás, 5,5 m területi sugár; 4 sereghely. Közelharci + ostrom + heavy.

**L4 / halmozás**

Az egység alapváltozata; L4 hatásai a termelő épület sorában.
Az elit/veterán közös alapállapot; a hozzá vezető út fajonként különbözzön.

**Ár / hely / előfeltétel**

HP: 3200; sebzés: 110; támadásköz: 2 mp.
Hatótáv: 3 m; mozgás: 3,25 m/s.
Egységár: 39 fa, 94 kő, 93 hús; sereghely: 4.
Képzés L1/L2/L3: 30 / 24 / 18 mp.
Termelő: Trollverem.
Épületsebzés: 110.

**Megjegyzés**

Egyszerre közelharci és ostromegység; heavy címke is. 110 elsődleges/35 másodlagos alapcsapás, 4 sereghely. Az ár, 9 mező és ciklusidő együtt számít; a boss legyen tömegkontroll, ne olcsó klóngyártás.

**Javasolt új működés**

Az egységszerep alapján válogassuk a fejlesztéseket; ez a sor nem automatikus HP/sebzés-módosítás.

**Kapcsolódó tartalom:** [Orkok – Trollverem](orc.md#building-orc_troll), [Orkok – Trollregeneráció](orc.md#normal-orc_troll_regen)

</details>

## Épület készlet

<a id="building-keep"></a>
<details>
<summary><strong>Ork főépület</strong> · Meglévő · Megtartás · P2</summary>

**Jelenlegi hatás**

20000 HP; +1/mp fa, kő és élelem; 200 / nyersanyag tároló; 50 sereghely; kapu: 5 egység/mp.

**L4 / halmozás**

L4 alap, az ág saját eltérései előtt:
160 000 HP; +8 fa, kő és élelem/mp; 800 tároló/nyersanyag; 400 sereghely; kapu 40 egység/mp.

L4 A – Örök hódítás:
A kapu végleg nyitva marad. +100% katonai képzési sebesség és élelemtermelés.

L4 B – Hadúr parancsa:
Zárt kapunál is jár a Vadászház és a Fosztogatótábor kapubónusza. +100% helyőrségi férőhely.

**Ár / hely / előfeltétel**

Terület: 2×2, 4 mező.
Építés: Ingyenes.
Egyedi épület.

**Megjegyzés**

A saját L4 ágak ténylegesen léteznek: Örök hódítás / Hadúr parancsa. A nyitott kapura épülő ork gazdaságot választják szét; ez nem az emberi főépület L4 másolata.

**Javasolt új működés**

Az L1–L3 azonos emberi alapértékei később faji ívet kaphatnak, az L4 nyitottkapu-árát viszont megőrizném.

**Kapcsolódó tartalom:** [Emberek – Főépület](human.md#building-keep)

</details>

<a id="building-warehouse"></a>
<details>
<summary><strong>Raktár</strong> · Meglévő · Törlésjelölt · P1</summary>

**Jelenlegi hatás**

+150 tároló minden nyersanyaghoz.

**L4 / halmozás**

Egyenes L4, nincs két választható ág:
+1500 tároló minden nyersanyaghoz.

**Ár / hely / előfeltétel**

Terület: 2×1, 2 mező.
Építés: 75 fa, 40 kő.
Több példány építhető az alapdefiníció szerint.

**Megjegyzés**

Az emberi Raktár pontos másolata. A törlése önmagában súlyosan módosítaná a tárolókorlátot, ezért helyettesítő rendszerrel együtt kezelendő.

**Javasolt új működés**

Ork tárolókapacitás a Munkatáborokhoz/Kunyhókhoz vagy zsákmányudvarhoz kötve; külön újramért kezdő- és végjáték-kapacitással.

**Kapcsolódó tartalom:** [Emberek – Raktár](human.md#building-warehouse), [Orkok – Munkatábor](orc.md#building-orc_work)

</details>

<a id="building-orc_work"></a>
<details>
<summary><strong>Munkatábor</strong> · Meglévő · Megtartás · P2</summary>

**Jelenlegi hatás**

+1 fa és kő/mp. Erdő mellett dupla fa, kőlelőhely mellett dupla kő.

**L4 / halmozás**

L4 A – Erdőirtó munkatábor:
+6 fa és +4 kő/mp.

L4 B – Kőfejtő munkatábor:
+4 fa és +6 kő/mp.

**Ár / hely / előfeltétel**

Terület: 2×1, 2 mező.
Építés: 150 fa, 40 kő.
Több példány építhető az alapdefiníció szerint.

**Megjegyzés**

Két nyersanyag ugyanabban a 2 mezős épületben: más városi kompromisszum, mint a külön emberi Favágó/Kővágó. A terepszorzó viszont közös.

**Javasolt új működés**

A két L4 ág később ne csak 6/4 ↔ 4/6 csere legyen: egy biztonságos ellátás és egy zsákmányhoz kötött kockázatos művelés különülhet el.

**Kapcsolódó tartalom:** [Emberek – Favágó](human.md#building-lumber), [Emberek – Kővágó](human.md#building-stonecutter)

</details>

<a id="building-orc_hunt"></a>
<details>
<summary><strong>Vadászház</strong> · Meglévő · Megtartás · P0</summary>

**Jelenlegi hatás**

+0,5 élelem/mp. Fal mellett +50%, nyitott kapunál további +50% termelés.

**L4 / halmozás**

Egyenes L4, nincs két választható ág:
+3 élelem/mp. Fal mellett +50%, nyitott kapunál további +50% termelés.

**Ár / hely / előfeltétel**

Terület: 1×1, 1 mező.
Építés: 100 fa.
Több példány építhető az alapdefiníció szerint.

**Megjegyzés**

Fal és nyitott kapu: egyedi ork építési/harci összefüggés. Nem azonos az emberi termőtalajos Farmmal. Az azonosítóját a Vérszomjas vadászat lap is használja, ettől annak hibás lett a szövege.

**Javasolt új működés**

A gazdasági épület és a Warg-legendás kapjon külön szöveg/art azonosítást, mielőtt bármelyik hatását változtatjuk.

**Kapcsolódó tartalom:** [Orkok – Vérszomjas vadászat](orc.md#legendary-orc_hunt), [Emberek – Farm](human.md#building-farm)

</details>

<a id="building-orc_hut"></a>
<details>
<summary><strong>Kunyhó</strong> · Meglévő · Megtartás · P2</summary>

**Jelenlegi hatás**

+20 sereghely és +20 helyőrségi férőhely.

**L4 / halmozás**

Egyenes L4, nincs két választható ág:
+60 sereghely és +60 helyőrségi férőhely.

**Ár / hely / előfeltétel**

Terület: 2×2, 4 mező.
Építés: 140 fa, 75 kő.
Több példány építhető az alapdefiníció szerint.

**Megjegyzés**

A sereg/helyőrség közös lakhatása más aránydöntés, mint az emberi külön Lakóház és Őrház. 4 mezőn az alap +20/+20 kapacitást és a későbbi 1×1 lapot együtt kell mérni.

**Javasolt új működés**

A rugalmas hordakapacitás maradjon ork. A nyers kapacitásnak legyen közös technikai maximuma, a Goblin fél helye ne kerülje meg azt.

**Kapcsolódó tartalom:** [Emberek – Lakóház](human.md#building-house), [Emberek – Őrház](human.md#building-guardhouse), [Orkok – Zsúfolt kunyhók](orc.md#legendary-orc_crowded_huts)

</details>

<a id="building-orc_war"></a>
<details>
<summary><strong>Harci tábor</strong> · Meglévő · Átdolgozás · P1</summary>

**Jelenlegi hatás**

Ork Harcos képzése.
L1 ciklus: 10,625 mp. Egységár: 11 kő, 14 hús.

**L4 / halmozás**

L4 A – Vértestvérek:
Képzésenként 2 Harcos készül, mindkettő teljes áráért. A Harcosok életereje −30%.

L4 B – Húspajzs:
Harcosok: +100% életerő, −30% sebzés. A hatótávon belüli ellenségek elsősorban őket támadják.

**Ár / hely / előfeltétel**

Terület: 2×1, 2 mező.
Építés: 115 fa, 75 kő.
Több példány építhető az alapdefiníció szerint.
L1 kibocsátás/mező: 2,824 egység/perc, 1-es alapbatch-csel.

**Megjegyzés**

Az alap Harcos kell. A Vértestvérek kettős batch-e emberi Sorozás/Temető másolat; a Húspajzs célelvonása a Csontpajzshoz és Élő ostrompajzshoz is hasonló védőszerep.

**Javasolt új működés**

L4: harcban kivívott bajnoki irány vagy vérzésre építő nyomás. A két Harcos/ciklus változatot kiváltanám.

**Kapcsolódó tartalom:** [Emberek – Kaszárnya](human.md#building-barracks), [Élőhalottak – Temető](undead.md#building-und_graveyard), [Élőhalottak – Csontpajzs](undead.md#legendary-skeleton_leg_guard)

</details>

<a id="building-orc_bers"></a>
<details>
<summary><strong>Dühöngők tábora</strong> · Meglévő · Átdolgozás · P1</summary>

**Jelenlegi hatás**

Dühöngő képzése.
L1 ciklus: 10 mp. Egységár: 6 fa, 10 kő, 13 hús.

**L4 / halmozás**

L4 A – Halálmegvetés:
Halálos találat után a Dühöngő még 3 mp-ig harcol maximális dühvel. Nem gyógyítható, utána meghal.

L4 B – Vérfürdő:
50% életerő alatt a Dühöngő egy második közeli célpontot is eltalál 50% sebzéssel.

**Ár / hely / előfeltétel**

Terület: 2×1, 2 mező.
Építés: 200 fa, 130 kő.
Több példány építhető az alapdefiníció szerint.
L1 kibocsátás/mező: 3 egység/perc, 1-es alapbatch-csel.

**Megjegyzés**

A sebesültségből gyorsulás jól ork. A Halálmegvetés halál utáni harca közelít az élőhalott túlélési témához, a Vérfürdő viszont sebesült rohamra épül.

**Javasolt új működés**

A Halálmegvetés helyett egyszeri, még élő állapotban aktiválódó fájdalomtűrés/akciófolytatás legyen. A halál utáni hatást élőhalott ötletként is felsoroljuk, nem két fajnál egyszerre.

**Kapcsolódó tartalom:** [Élőhalottak – Haladék a sírig](undead.md#legendary-idea_grave_delay), [Orkok – Fájdalomból erő](orc.md#legendary-orc_bers_rage)

</details>

<a id="building-orc_gob"></a>
<details>
<summary><strong>Goblin-tábor</strong> · Meglévő · Átdolgozás · P1</summary>

**Jelenlegi hatás**

Goblin képzése.
L1 ciklus: 4,375 mp. Egységár: 5 fa, 2 kő, 6 hús.

**L4 / halmozás**

L4 A – Goblinraj:
A Goblin nem foglal helyőrségi férőhelyet. A seregből fél helyet használ: 2 Goblin = 1 sereghely.

L4 B – Fürge Goblinok:
A Goblin 40% eséllyel elkerüli a sebzést.

**Ár / hely / előfeltétel**

Terület: 1×1, 1 mező.
Építés: 155 fa, 85 kő.
Több példány építhető az alapdefiníció szerint.
L1 kibocsátás/mező: 13,714 egység/perc, 1-es alapbatch-csel.

**Megjegyzés**

A Goblinraj fél sereghelye külön technikai tömeglimit nélkül laggot és célpontkeresési tömeget okozhat. A Fürge Goblin 40% kitérése pontosan a Szellem alapja.

**Javasolt új működés**

Az olcsó tömeg maradjon, kemény aktívegység-limit mellett. A kitérő L4 helyére parittyás/fosztogató ork trükk kell; a Szellemhez tartozzon a kitérésre épített teljes ág.

**Kapcsolódó tartalom:** [Élőhalottak – Szellem](undead.md#unit-und_ghost), [Élőhalottak – Kísérteties mozgás](undead.md#normal-ghost_common_dodge)

</details>

<a id="building-orc_arena"></a>
<details>
<summary><strong>Aréna</strong> · Meglévő · Megtartás · P2</summary>

**Jelenlegi hatás**

A szomszédos táborok 10% eséllyel veteránokat képeznek.

**L4 / halmozás**

L4 A – Veteránok serege:
A szomszédos táborok 40% eséllyel képeznek veteránokat.

L4 B – Harci akadémiák:
Arénánként +25 százalékpont veterán esély a szomszédos táboroknak, legfeljebb 100%.

**Ár / hely / előfeltétel**

Terület: 2×2, 4 mező.
Építés: 280 fa, 210 kő.
Több példány építhető az alapdefiníció szerint.

**Megjegyzés**

Az ork harci veteránút helye. A születéskori véletlen statbónusz az Alkimistával rokon, a veterán mint közös alapállapot önmagában nem másolat.

**Javasolt új működés**

Később a véletlen helyett harcban kivívott dicsőségből neveljen veteránt. Az Aréna L4 és a Harcedzett gyilkosok adhatnak összefüggő ork veteránutat.

**Kapcsolódó tartalom:** [Emberek – Alkimista kunyhó](human.md#building-alchemist), [Emberek – Harctéri kiképzés](human.md#legendary-long_training), [Orkok – Harcedzett gyilkosok](orc.md#legendary-orc_veteran_kills)

</details>

<a id="building-orc_overseer"></a>
<details>
<summary><strong>Hajcsárok tábora</strong> · Meglévő · Megtartás · P1</summary>

**Jelenlegi hatás**

A szomszédos táborok 25%-kal gyorsabban képeznek, de az egységek 80% HP-val indulnak.

**L4 / halmozás**

L4 A – Könyörtelen hajszolás:
A szomszédos táborok 400%-kal gyorsabban képeznek, de az egységek 25% HP-val indulnak.

L4 B – Vérszívó horda:
A szomszédos táborok 66,7%-kal gyorsabban képeznek, de az egységek 80% HP-val indulnak. Sereged 8% életlopást kap.

**Ár / hely / előfeltétel**

Terület: 2×1, 2 mező.
Építés: 210 fa, 155 kő.
Több példány építhető az alapdefiníció szerint.

**Megjegyzés**

A gyors képzés sérült kezdéssel maradjon ork ár–kockázat mechanika, ne két fajnál más számmal. L4 Könyörtelen hajszolás ×5 kibocsátás, nem egyszerű +80% képzési sebesség.

**Javasolt új működés**

A Vérszívó horda globális életlopását lecserélném, mert a Vámpír/Életszüret irányát másolja. A költség/mp és a tömeglimit a gyorsítással együtt vizsgálandó.

**Kapcsolódó tartalom:** [Élőhalottak – Rontott Keltető](undead.md#building-und_corrupted_hatchery), [Élőhalottak – Életszüret](undead.md#legendary-und_army_leech)

</details>

<a id="building-orc_warg"></a>
<details>
<summary><strong>Wargkarám</strong> · Meglévő · Átdolgozás · P1</summary>

**Jelenlegi hatás**

Warglovas képzése.
L1 ciklus: 13,75 mp. Egységár: 7 fa, 25 kő, 29 hús.

**L4 / halmozás**

L4 A – Lándzsazápor:
A nyitó lándzsa sebzése 60 → 120. Öléssel a Warglovas azonnal újabb lándzsát dob.

L4 B – Csordaszellem:
Közeli Warglovasonként +2% mozgási és támadási sebesség, korlátlanul. Hatótáv: 8,25 m.

**Ár / hely / előfeltétel**

Terület: 2×1, 2 mező.
Építés: 295 fa, 255 kő.
Több példány építhető az alapdefiníció szerint.
L1 kibocsátás/mező: 2,182 egység/perc, 1-es alapbatch-csel.

**Megjegyzés**

A nyitó dobás és vadászat saját karakter. Lándzsazápor és Vérszomjas vadászat részben ugyanazt az ölés utáni új dobást adja; Csordaszellem korlátlan, tömegben szélsőséges.

**Javasolt új működés**

A dobáslánc egyetlen helyen legyen. A másik ág térbeli falka/fogolyejtő irányt kapjon, kemény csordabónusz-plafonnal. A régi nyers sebességszövegeket a jelenlegi m/s-ból kell képezni.

**Kapcsolódó tartalom:** [Orkok – Vérszomjas vadászat](orc.md#legendary-orc_hunt), [Emberek – Istálló](human.md#building-stable), [Élőhalottak – Fantomkapu](undead.md#building-und_ghost_spawner)

</details>

<a id="building-orc_shaman"></a>
<details>
<summary><strong>Sámántábor</strong> · Meglévő · Megtartás · P2</summary>

**Jelenlegi hatás**

Sámán képzése.
L1 ciklus: 11,25 mp. Egységár: 16 fa, 13 kő, 19 hús.

**L4 / halmozás**

L4 A – Kettős átok:
A Sámán találata 2 különböző, véletlen átkot okoz.

L4 B – Felerősített átkok:
2× erősebb átkok: −40% sebzés és életerő, −50% támadási sebesség, +40% kapott sebzés vagy 50% melléütés.

**Ár / hely / előfeltétel**

Terület: 2×1, 2 mező.
Építés: 255 fa, 280 kő.
Több példány építhető az alapdefiníció szerint.
L1 kibocsátás/mező: 2,667 egység/perc, 1-es alapbatch-csel.

**Megjegyzés**

Az átok nem közvetlen tűzgolyó és nem idézés: jó ork mágikus támasz. Kettős és erősebb átok érthető csere, az Átokmester pedig irányítást ad.

**Javasolt új működés**

Az új ork mágikus legendások rontást, ideiglenes áldáslopást vagy képességzavarást adjanak, ne Pap-gyógyítást vagy Lich-sugarat.

**Kapcsolódó tartalom:** [Emberek – Mágustorony](human.md#building-magetower), [Élőhalottak – Lichtorony](undead.md#building-und_lich_spawner), [Orkok – Átokmester](orc.md#legendary-orc_curse_master)

</details>

<a id="building-orc_ram"></a>
<details>
<summary><strong>Faltörő műhely</strong> · Meglévő · Megtartás · P1</summary>

**Jelenlegi hatás**

Faltörő kos képzése.
L1 ciklus: 15 mp. Egységár: 29 fa, 35 kő, 15 hús.

**L4 / halmozás**

L4 A – Zúzógép:
A kos egységsebzése 8 → 56. Épületsebzése változatlan.

L4 B – Őrült roham:
A kos mozgási sebessége 2,5 → 7,5 m/s.

**Ár / hely / előfeltétel**

Terület: 2×1, 2 mező.
Építés: 340 fa, 420 kő.
Több példány építhető az alapdefiníció szerint.
L1 kibocsátás/mező: 2 egység/perc, 1-es alapbatch-csel.

**Megjegyzés**

Lassú, fizikai ellenálló közelharci ostrom, más a Katapultnál. A Zúzógép sebzésága elviszi az épületromboló szereptől; az Őrült roham kártyaszövege régi nyers 20→60 érték.

**Javasolt új működés**

A két L4 inkább szállító/ostromszerkezet-feltörő funkció legyen. A jelenlegi sebesség valódi alapja 2,5 m/s; a háromszoros mód 7,5 m/s, a további módosítók előtt.

**Kapcsolódó tartalom:** [Emberek – Ostromműhely](human.md#building-siegeworks), [Orkok – Trójai kos](orc.md#legendary-orc_trojan)

</details>

<a id="building-orc_troll"></a>
<details>
<summary><strong>Trollverem</strong> · Meglévő · Megtartás · P2</summary>

**Jelenlegi hatás**

Troll képzése.
L1 ciklus: 30 mp. Egységár: 39 fa, 94 kő, 93 hús.

**L4 / halmozás**

L4 A – Trolltenyészet:
A Trollverem 2×2 méretű, több is építhető. Trollok: −50% életerő és sebzés, de −50% képzési ár.

L4 B – Földrengető:
Minden 3. csapás 2,5× nagyobb körben teljes sebzést okoz, és 1 mp-re elkábít.

**Ár / hely / előfeltétel**

Terület: 3×3, 9 mező.
Építés: 505 fa, 590 kő.
Egyedi épület.
L1 kibocsátás/mező: 0,222 egység/perc, 1-es alapbatch-csel.

**Megjegyzés**

Óriási, 4 helyes élő ostrom. A 9→4 mezős, többször építhető Trolltenyészet a darabszámot és helyhatékonyságot együtt módosítja; nem egyszerű félstat nerf.

**Javasolt új működés**

A Földrengető térbeli nyomása maradhat. A születési prioritást és félstat Troll sereghelyét az árakkal együtt kell ellenőrizni, az egység ne váljon Katapult-másolattá.

**Kapcsolódó tartalom:** [Emberek – Ostromműhely](human.md#building-siegeworks), [Orkok – Utolsó tombolás](orc.md#legendary-orc_last_rampage)

</details>

<a id="building-orc_altar"></a>
<details>
<summary><strong>Áldozati oltár</strong> · Meglévő · Átdolgozás · P1</summary>

**Jelenlegi hatás**

Feláldozza a szomszédos táborok egységeit. 100 pont után sereged 12 mp-re 25% életlopást kap.

**L4 / halmozás**

Egyenes L4, nincs két választható ág:
Feláldozza a szomszédos táborok egységeit. 50 pont után sereged 12 mp-re 25% életlopást kap.

**Ár / hely / előfeltétel**

Terület: 2×2, 4 mező.
Építés: 380 fa, 420 kő.
Egyedi épület.

**Megjegyzés**

Kiképzett egység feláldozása globális életlopásért: élőhalottas irány; Totemmel extra választási hurkot is táplál. Az áldozat rendes költsége és a kieső frontszám komoly ár.

**Javasolt új működés**

Hadidobok: még élő egységek harci megpróbáltatásaiból gyűjtött indulat, rövid zavarástűrő rohamhoz. Ne gyártson halálpontot és ne adjon életlopást.

**Kapcsolódó tartalom:** [Élőhalottak – Életszüret](undead.md#legendary-und_army_leech), [Orkok – Ősök Toteme](orc.md#building-orc_totem), [Orkok – Hadidobok](orc.md#building-idea_war_drums)

</details>

<a id="building-orc_totem"></a>
<details>
<summary><strong>Ősök Toteme</strong> · Meglévő · Átdolgozás · P1</summary>

**Jelenlegi hatás**

500 halálpont után 1 legendás lapot választhatsz.

**L4 / halmozás**

Egyenes L4, nincs két választható ág:
200 halálpont után 1 legendás lapot választhatsz.

**Ár / hely / előfeltétel**

Terület: 2×2, 4 mező.
Építés: 420 fa, 505 kő.
Egyedi épület.

**Megjegyzés**

A saját halálból kapott legendás választás túlságosan az olcsó áldozatgyártást jutalmazhatja. Az 500→200 pont szintskála és Kihagyásból erősödés együtt külön körvizsgálatot kér.

**Javasolt új működés**

A Totem dicsőséget/trófeát gyűjtsön tényleges harcból; az idővel eltűnő idézet és az oltári üzemi gyártás ne legyen farmolható jutalomforrás.

**Kapcsolódó tartalom:** [Orkok – Áldozati oltár](orc.md#building-orc_altar), [Orkok – Megvetett zsákmány](orc.md#legendary-orc_skip_power), [Orkok – Ellenségvér az ősöknek](orc.md#legendary-orc_enemy_ancestors)

</details>

<a id="building-orc_slave"></a>
<details>
<summary><strong>Rabszolgatábor</strong> · Meglévő · Átdolgozás · P1</summary>

**Jelenlegi hatás**

Minden 20 legyőzött ellenség után tartósan +0,1 fa és kő/mp.

**L4 / halmozás**

L4 A – Kényszermunka:
Minden 20 ölés után +0,4 fa, +0,4 kő és +0,2 élelem/mp.

L4 B – Kíméletlen hajcsárok:
Minden 20 ölés után +0,4 fa és kő/mp. A szomszédos Munkatáborok és Vadászházak +50% termelést kapnak.

**Ár / hely / előfeltétel**

Terület: 2×2, 4 mező.
Építés: 340 fa, 340 kő.
Egyedi épület.

**Megjegyzés**

Az ölés utáni tartós termelés Lélekarató-jellegű, az L4 helyi +50% pedig az emberi Céhházat másolja. A retroaktív számláló bontás/újraépítés mellett is fontos.

**Javasolt új működés**

Zsákmányudvarrá alakítanám: rombolásból vagy tényleges fogolyejtésből származó, korlátos készlet. Ne adjon egyszerűen végtelen passzív termelést ölésenként.

**Kapcsolódó tartalom:** [Élőhalottak – Lélekarató](undead.md#building-und_soul_harvester), [Emberek – Céhház](human.md#building-guildhouse), [Orkok – Zsákmányudvar](orc.md#building-idea_loot_yard)

</details>

<a id="building-orc_raider"></a>
<details>
<summary><strong>Fosztogatók tábora</strong> · Meglévő · Átdolgozás · P1</summary>

**Jelenlegi hatás**

Nyitott kapunál minden elkészült egység 5% eséllyel ingyen erősítést hív.

**L4 / halmozás**

L4 A – Szörnyhorda:
Az erősítés 8% eséllyel Troll; különben Harcos, Dühöngő vagy Warglovas.

L4 B – Hordaözön:
Sikeres híváskor 1 helyett 2 azonos egység érkezik.

**Ár / hely / előfeltétel**

Terület: 2×2, 4 mező.
Építés: 365 fa, 280 kő.
Egyedi épület.

**Megjegyzés**

Képzéskor esélyalapú ingyenegység: Láncreakció/Kettős ébredés rokon. A kapufeltétel önmagában kevés egyediség, L4-ben még másolatból is többet ad.

**Javasolt új működés**

Összevonható a zsákmányrendszerrel; a tábor ne normál termelésből nyerjen új katonát. A Hadúr parancsa és régi L4 ágak függőségét át kell vezetni.

**Kapcsolódó tartalom:** [Emberek – Láncreakció](human.md#legendary-chain_spawn), [Élőhalottak – Kettős ébredés](undead.md#legendary-und_twin_training), [Orkok – Zsákmányudvar](orc.md#building-idea_loot_yard)

</details>

<a id="building-orc_tunnel"></a>
<details>
<summary><strong>Rohamalagút</strong> · Meglévő · Megtartás · P2</summary>

**Jelenlegi hatás**

1 mezőn belül a táborok a legelöl álló saját toronynál vetik be egységeiket, zárt kapunál is.

**L4 / halmozás**

Egyenes L4, nincs két választható ág:
Az összes saját katonai tábor a legelöl álló saját toronynál vetik be egységeiket, zárt kapunál is.

**Ár / hely / előfeltétel**

Terület: 2×2, 4 mező.
Építés: 420 fa, 505 kő.
Egyedi épület.

**Megjegyzés**

A saját első toronynál történő bevetés tényleges frontlogisztikai különbség az emberi kapus hullámhoz képest. Nem azonos az élő Szellem ellenségen átjutásával.

**Javasolt új működés**

Torony nélkül maradjon kapukijárat; a sereglimitet ne kerülje meg. Az L4 minden termelőre ható sugarát és a kapubónuszok kombinációját célzottan mérni kell.

**Kapcsolódó tartalom:** [Emberek – Gyülekezőtér](human.md#building-rally), [Élőhalottak – Fantomkapu](undead.md#building-und_ghost_spawner)

</details>

<a id="building-idea_loot_yard"></a>
<details>
<summary><strong>Zsákmányudvar</strong> · Új ötlet · Új ötlet · P1</summary>

**Jelenlegi hatás**

Nincs a játékban. Tervezési jelölt; az esetleges számok kipróbálandó kezdőértékek.

**L4 / halmozás**

L4 A – Ostromkincstár: a már megszerzett zsákmányból egy kiválasztott új építkezés fizethető, a kereten belül.
L4 B – Túszudvar: a Fogolyejtők által valóban hazahozott foglyot kezelheti; nincs fogoly passzív sorsolásból.

**Ár / hely / előfeltétel**

Előfeltétel / terv:
Legalább 1 ork ostromtermelő. A Fosztogatók vagy Rabszolgatábor TELJES CSERÉJE, nem harmadik párhuzamos passzív jövedelemforrás.

**Megjegyzés**

A Fosztogatók/Rabszolgatábor általános ingyenegység- és haláljövedelem-szerepét rombolásra helyezi át. Nem a Lélekarató átnevezése.

**Javasolt új működés**

Az ellenséges torony eredeti HP-jának újabb, egyszer átlépett sérülési küszöbei korlátos fa/kő zsákmányt adnak. Ugyanaz a megjavított vagy visszaépített torony nem tölti újra automatikusan a keretet.

Korlát / értelmezés: Toronyazonosítónként rögzített zsákmánykeret; saját és baráti épület, fővárosi önkárosítás nem farmolható. Az értékek külön gazdasági próbát kérnek.

**Kapcsolódó tartalom:** [Orkok – Fosztogatók tábora](orc.md#building-orc_raider), [Orkok – Rabszolgatábor](orc.md#building-orc_slave), [Orkok – Ostromzsákmány](orc.md#legendary-orc_siege_loot)

</details>

<a id="building-idea_war_drums"></a>
<details>
<summary><strong>Hadidobok</strong> · Új ötlet · Új ötlet · P1</summary>

**Jelenlegi hatás**

Nincs a játékban. Tervezési jelölt; az esetleges számok kipróbálandó kezdőértékek.

**L4 / halmozás**

L4 A – Rövid üvöltés: aktiváláskor egy mozgást gátló ideiglenes hatás megszüntetése, rövid időtartam.
L4 B – Hosszú ritmus: kisebb ellenállás tovább tart; nem ad teljes állapotimmunitást.

**Ár / hely / előfeltétel**

Előfeltétel / terv:
Az Áldozati oltár helyettesítése; egyedi 2×2 terv, 3 aktív katonai termelő után kínálható.

**Megjegyzés**

Az Oltár halálból életlopást termelő szerepét élő, sebesült ork nyomásra cseréli. Nem kell a vámpíros életlopás másolata.

**Javasolt új működés**

Kiképzett orkok tényleges ellenséges találataiból rövid életű indulat gyűlik. Ebből rövid rohamparancs aktiválható, amely a meglévő egységek lassítás-/hátralökés-tűrését erősíti; nem gyógyít és nem hoz létre új egységet.

Korlát / értelmezés: Idézet, szövetséges vagy saját sebzés nem tölt. Egységenként és időablakonként töltési plafon; 1 aktív rohamparancs, nem öröklődő aura.

**Kapcsolódó tartalom:** [Orkok – Áldozati oltár](orc.md#building-orc_altar), [Orkok – Makacs lendület](orc.md#legendary-idea_stubborn_swing), [Élőhalottak – Életszüret](undead.md#legendary-und_army_leech)

</details>

## Common készlet

<a id="normal-orc_warrior_hp"></a>
<details>
<summary><strong>Ork Harcos · Életerő</strong> · Meglévő · Törlésjelölt · P1</summary>

**Jelenlegi hatás**

Ork Harcos: +10% életerő.

**L4 / halmozás**

Korlátlanul halmozható.
Első felvétel: Életerő: 300 → 330

**Ár / hely / előfeltétel**

Előfeltétel: Harci tábor.
Ár: egy megfelelő választás, nincs külön nyersanyagár.

**Megjegyzés**

Ugyanaz a +10% egység-HP/sebzés család három fajnál; a portré és név nem új működés. A Pap sebzéslapja gyógyítást is ad, a csontvázcsalád lapjai a távolsági változatot is érintik.

**Javasolt új működés**

Törlésjelölt a másolt statlapkészlet ritkításakor. Csak a helyettesítő, fajra jellemző Common készlettel és az alapegység-fejlődés újramérésével együtt; ne egyszerűen vegyük el a faj erősödését.

**Kapcsolódó tartalom:** [Emberek – Kardos – Sebzés](human.md#normal-swordsman_dmg), [Orkok – Ork Harcos · Sebzés](orc.md#normal-orc_warrior_dmg), [Élőhalottak – Csontváz · Sebzés +10%](undead.md#normal-skeleton_common_damage)

</details>

<a id="normal-orc_warrior_dmg"></a>
<details>
<summary><strong>Ork Harcos · Sebzés</strong> · Meglévő · Törlésjelölt · P1</summary>

**Jelenlegi hatás**

Ork Harcos: +10% sebzés.

**L4 / halmozás**

Korlátlanul halmozható.
Első felvétel: Sebzés: 20 → 22

**Ár / hely / előfeltétel**

Előfeltétel: Harci tábor.
Ár: egy megfelelő választás, nincs külön nyersanyagár.

**Megjegyzés**

Ugyanaz a +10% egység-HP/sebzés család három fajnál; a portré és név nem új működés. A Pap sebzéslapja gyógyítást is ad, a csontvázcsalád lapjai a távolsági változatot is érintik.

**Javasolt új működés**

Törlésjelölt a másolt statlapkészlet ritkításakor. Csak a helyettesítő, fajra jellemző Common készlettel és az alapegység-fejlődés újramérésével együtt; ne egyszerűen vegyük el a faj erősödését.

**Kapcsolódó tartalom:** [Emberek – Kardos – Sebzés](human.md#normal-swordsman_dmg), [Élőhalottak – Csontváz · Sebzés +10%](undead.md#normal-skeleton_common_damage)

</details>

<a id="normal-orc_berserker_hp"></a>
<details>
<summary><strong>Dühöngő · Életerő</strong> · Meglévő · Törlésjelölt · P1</summary>

**Jelenlegi hatás**

Dühöngő: +10% életerő.

**L4 / halmozás**

Korlátlanul halmozható.
Első felvétel: Életerő: 180 → 198

**Ár / hely / előfeltétel**

Előfeltétel: Dühöngők tábora.
Ár: egy megfelelő választás, nincs külön nyersanyagár.

**Megjegyzés**

Ugyanaz a +10% egység-HP/sebzés család három fajnál; a portré és név nem új működés. A Pap sebzéslapja gyógyítást is ad, a csontvázcsalád lapjai a távolsági változatot is érintik.

**Javasolt új működés**

Törlésjelölt a másolt statlapkészlet ritkításakor. Csak a helyettesítő, fajra jellemző Common készlettel és az alapegység-fejlődés újramérésével együtt; ne egyszerűen vegyük el a faj erősödését.

**Kapcsolódó tartalom:** [Emberek – Kardos – Sebzés](human.md#normal-swordsman_dmg), [Orkok – Ork Harcos · Sebzés](orc.md#normal-orc_warrior_dmg), [Élőhalottak – Csontváz · Sebzés +10%](undead.md#normal-skeleton_common_damage)

</details>

<a id="normal-orc_berserker_dmg"></a>
<details>
<summary><strong>Dühöngő · Sebzés</strong> · Meglévő · Törlésjelölt · P1</summary>

**Jelenlegi hatás**

Dühöngő: +10% sebzés.

**L4 / halmozás**

Korlátlanul halmozható.
Első felvétel: Sebzés: 16 → 17,6

**Ár / hely / előfeltétel**

Előfeltétel: Dühöngők tábora.
Ár: egy megfelelő választás, nincs külön nyersanyagár.

**Megjegyzés**

Ugyanaz a +10% egység-HP/sebzés család három fajnál; a portré és név nem új működés. A Pap sebzéslapja gyógyítást is ad, a csontvázcsalád lapjai a távolsági változatot is érintik.

**Javasolt új működés**

Törlésjelölt a másolt statlapkészlet ritkításakor. Csak a helyettesítő, fajra jellemző Common készlettel és az alapegység-fejlődés újramérésével együtt; ne egyszerűen vegyük el a faj erősödését.

**Kapcsolódó tartalom:** [Emberek – Kardos – Sebzés](human.md#normal-swordsman_dmg), [Orkok – Ork Harcos · Sebzés](orc.md#normal-orc_warrior_dmg), [Élőhalottak – Csontváz · Sebzés +10%](undead.md#normal-skeleton_common_damage)

</details>

<a id="normal-orc_goblin_hp"></a>
<details>
<summary><strong>Goblin · Életerő</strong> · Meglévő · Törlésjelölt · P1</summary>

**Jelenlegi hatás**

Goblin: +10% életerő.

**L4 / halmozás**

Korlátlanul halmozható.
Első felvétel: Életerő: 30 → 33

**Ár / hely / előfeltétel**

Előfeltétel: Goblin-tábor.
Ár: egy megfelelő választás, nincs külön nyersanyagár.

**Megjegyzés**

Ugyanaz a +10% egység-HP/sebzés család három fajnál; a portré és név nem új működés. A Pap sebzéslapja gyógyítást is ad, a csontvázcsalád lapjai a távolsági változatot is érintik.

**Javasolt új működés**

Törlésjelölt a másolt statlapkészlet ritkításakor. Csak a helyettesítő, fajra jellemző Common készlettel és az alapegység-fejlődés újramérésével együtt; ne egyszerűen vegyük el a faj erősödését.

**Kapcsolódó tartalom:** [Emberek – Kardos – Sebzés](human.md#normal-swordsman_dmg), [Orkok – Ork Harcos · Sebzés](orc.md#normal-orc_warrior_dmg), [Élőhalottak – Csontváz · Sebzés +10%](undead.md#normal-skeleton_common_damage)

</details>

<a id="normal-orc_goblin_dmg"></a>
<details>
<summary><strong>Goblin · Sebzés</strong> · Meglévő · Törlésjelölt · P1</summary>

**Jelenlegi hatás**

Goblin: +10% sebzés.

**L4 / halmozás**

Korlátlanul halmozható.
Első felvétel: Sebzés: 3,5 → 3,85

**Ár / hely / előfeltétel**

Előfeltétel: Goblin-tábor.
Ár: egy megfelelő választás, nincs külön nyersanyagár.

**Megjegyzés**

Ugyanaz a +10% egység-HP/sebzés család három fajnál; a portré és név nem új működés. A Pap sebzéslapja gyógyítást is ad, a csontvázcsalád lapjai a távolsági változatot is érintik.

**Javasolt új működés**

Törlésjelölt a másolt statlapkészlet ritkításakor. Csak a helyettesítő, fajra jellemző Common készlettel és az alapegység-fejlődés újramérésével együtt; ne egyszerűen vegyük el a faj erősödését.

**Kapcsolódó tartalom:** [Emberek – Kardos – Sebzés](human.md#normal-swordsman_dmg), [Orkok – Ork Harcos · Sebzés](orc.md#normal-orc_warrior_dmg), [Élőhalottak – Csontváz · Sebzés +10%](undead.md#normal-skeleton_common_damage)

</details>

<a id="normal-orc_bleed"></a>
<details>
<summary><strong>Vérző sebek</strong> · Meglévő · Megtartás · P2</summary>

**Jelenlegi hatás**

A Harcos találatai 2 Vérzést okoznak. További felvételenként +1 Vérzés.

**L4 / halmozás**

Korlátlanul halmozható.
Első felvétel: Vérzés találatonként: 0 → 2

**Ár / hely / előfeltétel**

Előfeltétel: Harci tábor.
Ár: egy megfelelő választás, nincs külön nyersanyagár.

**Megjegyzés**

Vérzés az ork fizikai nyomás magja. 2, majd +1 pont; a másodpercenként fogyó halmozás nem lineáris plusz DPS.

**Javasolt új működés**

Legyen plafon/olvasható állapotjelzés, és a Goblin-vérzés ne nyomja el a Harcos saját szerepét.

**Kapcsolódó tartalom:** [Orkok – Vérszomjas lövedékek](orc.md#legendary-orc_gob_blood), [Orkok – Vérszagra gyűlnek](orc.md#legendary-orc_bers_blood)

</details>

<a id="normal-orc_leech"></a>
<details>
<summary><strong>Vérivás</strong> · Meglévő · Átdolgozás · P1</summary>

**Jelenlegi hatás**

Dühöngő: 5% életlopás, további felvételenként +2 százalékpont.

**L4 / halmozás**

Korlátlanul halmozható.
Első felvétel: Életlopás e lapból: 0% → 5%

**Ár / hely / előfeltétel**

Előfeltétel: Dühöngők tábora.
Ár: egy megfelelő választás, nincs külön nyersanyagár.

**Megjegyzés**

A Dühöngő életlopása a Vámpír irányát másolja, és visszagyógyítja a sebesültségi bónuszából is.

**Javasolt új működés**

A sebzésből visszagyógyítás helyett élő sebesültségből szerzett akciótűrés vagy korlátos lendület.

**Kapcsolódó tartalom:** [Élőhalottak – Vérszomj](undead.md#normal-vampire_common_lifesteal), [Orkok – Fájdalomtűrés](orc.md#normal-idea_pain_tolerance)

</details>

<a id="normal-orc_double"></a>
<details>
<summary><strong>Kettős parittya</strong> · Meglévő · Megtartás · P2</summary>

**Jelenlegi hatás**

Goblin: +5 százalékpont esély dupla támadásra, legfeljebb 100%.

**L4 / halmozás**

Legfeljebb 20× választható.
Első felvétel: Második támadás esélye: 0% → 5%

**Ár / hely / előfeltétel**

Előfeltétel: Goblin-tábor; 20 felvétel alatt.
Ár: egy megfelelő választás, nincs külön nyersanyagár.

**Megjegyzés**

A parittya második köve ork trükk lehet. A maximum 100%, és az ingyenlövés-sorozatokkal való kölcsönhatás fontos.

**Javasolt új működés**

A második találat ne generáljon új, önmagát hívó össztűzláncot. Kőszóró maradjon, ne emberi íjász.

**Kapcsolódó tartalom:** [Orkok – Goblin össztűz](orc.md#legendary-orc_volley)

</details>

<a id="normal-orc_wood"></a>
<details>
<summary><strong>Fa · Termelés</strong> · Meglévő · Átdolgozás · P1</summary>

**Jelenlegi hatás**

A fa alaptermelése +20%.

**L4 / halmozás**

Korlátlanul halmozható.
Első felvétel: A lap fatermelési bónusza: +0% → +20%

**Ár / hely / előfeltétel**

Előfeltétel: Jelenleg nincs külön termelőfeltétel a laphoz.
Ár: egy megfelelő választás, nincs külön nyersanyagár.

**Megjegyzés**

Feltétel nélküli +20% fa-termelés; emberi Fokozott termelés és Lélekbőség rokon szerep. A külön fa/kő lap a kettős Munkatábor funkcióját is szétbontja.

**Javasolt új működés**

A Munkatábor nyersanyag-arányát vagy a nyitott kapuhoz kötött húsellátást alakítsa, illetve zsákmányból dolgozzon; ne csak más százalékú általános gazdasági buff legyen.

**Kapcsolódó tartalom:** [Emberek – Fokozott termelés](human.md#normal-production), [Élőhalottak – Lélekbőség](undead.md#normal-gen_soul_abundance)

</details>

<a id="normal-orc_stone"></a>
<details>
<summary><strong>Kő · Termelés</strong> · Meglévő · Átdolgozás · P1</summary>

**Jelenlegi hatás**

A kő alaptermelése +20%.

**L4 / halmozás**

Korlátlanul halmozható.
Első felvétel: A lap kőtermelési bónusza: +0% → +20%

**Ár / hely / előfeltétel**

Előfeltétel: Jelenleg nincs külön termelőfeltétel a laphoz.
Ár: egy megfelelő választás, nincs külön nyersanyagár.

**Megjegyzés**

Feltétel nélküli +20% kő-termelés; emberi Fokozott termelés és Lélekbőség rokon szerep. A külön fa/kő lap a kettős Munkatábor funkcióját is szétbontja.

**Javasolt új működés**

A Munkatábor nyersanyag-arányát vagy a nyitott kapuhoz kötött húsellátást alakítsa, illetve zsákmányból dolgozzon; ne csak más százalékú általános gazdasági buff legyen.

**Kapcsolódó tartalom:** [Emberek – Fokozott termelés](human.md#normal-production), [Élőhalottak – Lélekbőség](undead.md#normal-gen_soul_abundance)

</details>

<a id="normal-orc_food"></a>
<details>
<summary><strong>Élelem · Termelés</strong> · Meglévő · Átdolgozás · P1</summary>

**Jelenlegi hatás**

Az élelem alaptermelése +20%.

**L4 / halmozás**

Korlátlanul halmozható.
Első felvétel: A lap élelemtermelési bónusza: +0% → +20%

**Ár / hely / előfeltétel**

Előfeltétel: Jelenleg nincs külön termelőfeltétel a laphoz.
Ár: egy megfelelő választás, nincs külön nyersanyagár.

**Megjegyzés**

Feltétel nélküli +20% hús-termelés; emberi Fokozott termelés és Lélekbőség rokon szerep. A külön fa/kő lap a kettős Munkatábor funkcióját is szétbontja.

**Javasolt új működés**

A Munkatábor nyersanyag-arányát vagy a nyitott kapuhoz kötött húsellátást alakítsa, illetve zsákmányból dolgozzon; ne csak más százalékú általános gazdasági buff legyen.

**Kapcsolódó tartalom:** [Emberek – Fokozott termelés](human.md#normal-production), [Élőhalottak – Lélekbőség](undead.md#normal-gen_soul_abundance)

</details>

<a id="normal-orc_as"></a>
<details>
<summary><strong>Ork harci tempó</strong> · Meglévő · Átdolgozás · P2</summary>

**Jelenlegi hatás**

Minden ork egység támadási sebessége +5%.

**L4 / halmozás**

Korlátlanul halmozható.
Első felvétel: Támadási sebesség: +0% → +5%

**Ár / hely / előfeltétel**

Előfeltétel: Jelenleg nincs külön termelőfeltétel a laphoz.
Ár: egy megfelelő választás, nincs külön nyersanyagár.

**Megjegyzés**

Általános támadási stat. Ork jellegű lehet, de feltétel nélkül minden faj +AS lapjának másolata.

**Javasolt új működés**

Harcban/sebesültségből épülő, lecsengő tempó; az alapfaj ne válogatás nélkül három külön globális bónuszt gyűjtsön.

**Kapcsolódó tartalom:** [Emberek – Kardforgatás](human.md#normal-sword_as), [Orkok – Harci lendület](orc.md#legendary-orc_momentum)

</details>

<a id="normal-orc_hp"></a>
<details>
<summary><strong>Szívós horda</strong> · Meglévő · Törlésjelölt · P1</summary>

**Jelenlegi hatás**

Minden ork egység maximális életereje +5%.

**L4 / halmozás**

Korlátlanul halmozható.
Első felvétel: Maximális életerő: +0% → +5%

**Ár / hely / előfeltétel**

Előfeltétel: Jelenleg nincs külön termelőfeltétel a laphoz.
Ár: egy megfelelő választás, nincs külön nyersanyagár.

**Megjegyzés**

Újabb általános HP-lap a hét külön egység HP-lapja fölé.

**Javasolt új működés**

A Harcos/Horda saját állóképességi és tapasztalati mechanikái váltsák ki; az alapértékek újramérésével együtt.

**Kapcsolódó tartalom:** [Emberek – Kardos – Életerő](human.md#normal-swordsman_hp), [Élőhalottak – Csontváz · Életerő +10%](undead.md#normal-skeleton_common_hp), [Orkok – Hordaszív](orc.md#legendary-orc_horde_heart)

</details>

<a id="normal-orc_warg_hp"></a>
<details>
<summary><strong>Warglovas · Életerő</strong> · Meglévő · Törlésjelölt · P1</summary>

**Jelenlegi hatás**

Warglovas: +10% életerő.

**L4 / halmozás**

Korlátlanul halmozható.
Első felvétel: Életerő: 400 → 440

**Ár / hely / előfeltétel**

Előfeltétel: Wargkarám.
Ár: egy megfelelő választás, nincs külön nyersanyagár.

**Megjegyzés**

Ugyanaz a +10% egység-HP/sebzés család három fajnál; a portré és név nem új működés. A Pap sebzéslapja gyógyítást is ad, a csontvázcsalád lapjai a távolsági változatot is érintik.

**Javasolt új működés**

Törlésjelölt a másolt statlapkészlet ritkításakor. Csak a helyettesítő, fajra jellemző Common készlettel és az alapegység-fejlődés újramérésével együtt; ne egyszerűen vegyük el a faj erősödését.

**Kapcsolódó tartalom:** [Emberek – Kardos – Sebzés](human.md#normal-swordsman_dmg), [Orkok – Ork Harcos · Sebzés](orc.md#normal-orc_warrior_dmg), [Élőhalottak – Csontváz · Sebzés +10%](undead.md#normal-skeleton_common_damage)

</details>

<a id="normal-orc_warg_dmg"></a>
<details>
<summary><strong>Warglovas · Sebzés</strong> · Meglévő · Törlésjelölt · P1</summary>

**Jelenlegi hatás**

Warglovas: +10% sebzés.

**L4 / halmozás**

Korlátlanul halmozható.
Első felvétel: Sebzés: 30 → 33

**Ár / hely / előfeltétel**

Előfeltétel: Wargkarám.
Ár: egy megfelelő választás, nincs külön nyersanyagár.

**Megjegyzés**

Ugyanaz a +10% egység-HP/sebzés család három fajnál; a portré és név nem új működés. A Pap sebzéslapja gyógyítást is ad, a csontvázcsalád lapjai a távolsági változatot is érintik.

**Javasolt új működés**

Törlésjelölt a másolt statlapkészlet ritkításakor. Csak a helyettesítő, fajra jellemző Common készlettel és az alapegység-fejlődés újramérésével együtt; ne egyszerűen vegyük el a faj erősödését.

**Kapcsolódó tartalom:** [Emberek – Kardos – Sebzés](human.md#normal-swordsman_dmg), [Orkok – Ork Harcos · Sebzés](orc.md#normal-orc_warrior_dmg), [Élőhalottak – Csontváz · Sebzés +10%](undead.md#normal-skeleton_common_damage)

</details>

<a id="normal-orc_shaman_hp"></a>
<details>
<summary><strong>Sámán · Életerő</strong> · Meglévő · Törlésjelölt · P1</summary>

**Jelenlegi hatás**

Sámán: +10% életerő.

**L4 / halmozás**

Korlátlanul halmozható.
Első felvétel: Életerő: 100 → 110

**Ár / hely / előfeltétel**

Előfeltétel: Sámántábor.
Ár: egy megfelelő választás, nincs külön nyersanyagár.

**Megjegyzés**

Ugyanaz a +10% egység-HP/sebzés család három fajnál; a portré és név nem új működés. A Pap sebzéslapja gyógyítást is ad, a csontvázcsalád lapjai a távolsági változatot is érintik.

**Javasolt új működés**

Törlésjelölt a másolt statlapkészlet ritkításakor. Csak a helyettesítő, fajra jellemző Common készlettel és az alapegység-fejlődés újramérésével együtt; ne egyszerűen vegyük el a faj erősödését.

**Kapcsolódó tartalom:** [Emberek – Kardos – Sebzés](human.md#normal-swordsman_dmg), [Orkok – Ork Harcos · Sebzés](orc.md#normal-orc_warrior_dmg), [Élőhalottak – Csontváz · Sebzés +10%](undead.md#normal-skeleton_common_damage)

</details>

<a id="normal-orc_shaman_dmg"></a>
<details>
<summary><strong>Sámán · Sebzés</strong> · Meglévő · Törlésjelölt · P1</summary>

**Jelenlegi hatás**

Sámán: +10% sebzés.

**L4 / halmozás**

Korlátlanul halmozható.
Első felvétel: Sebzés: 8 → 8,8

**Ár / hely / előfeltétel**

Előfeltétel: Sámántábor.
Ár: egy megfelelő választás, nincs külön nyersanyagár.

**Megjegyzés**

Ugyanaz a +10% egység-HP/sebzés család három fajnál; a portré és név nem új működés. A Pap sebzéslapja gyógyítást is ad, a csontvázcsalád lapjai a távolsági változatot is érintik.

**Javasolt új működés**

Törlésjelölt a másolt statlapkészlet ritkításakor. Csak a helyettesítő, fajra jellemző Common készlettel és az alapegység-fejlődés újramérésével együtt; ne egyszerűen vegyük el a faj erősödését.

**Kapcsolódó tartalom:** [Emberek – Kardos – Sebzés](human.md#normal-swordsman_dmg), [Orkok – Ork Harcos · Sebzés](orc.md#normal-orc_warrior_dmg), [Élőhalottak – Csontváz · Sebzés +10%](undead.md#normal-skeleton_common_damage)

</details>

<a id="normal-orc_ram_hp"></a>
<details>
<summary><strong>Faltörő kos · Életerő</strong> · Meglévő · Törlésjelölt · P1</summary>

**Jelenlegi hatás**

Faltörő kos: +10% életerő.

**L4 / halmozás**

Korlátlanul halmozható.
Első felvétel: Életerő: 1100 → 1210

**Ár / hely / előfeltétel**

Előfeltétel: Faltörő műhely.
Ár: egy megfelelő választás, nincs külön nyersanyagár.

**Megjegyzés**

Ugyanaz a +10% egység-HP/sebzés család három fajnál; a portré és név nem új működés. A Pap sebzéslapja gyógyítást is ad, a csontvázcsalád lapjai a távolsági változatot is érintik.

**Javasolt új működés**

Törlésjelölt a másolt statlapkészlet ritkításakor. Csak a helyettesítő, fajra jellemző Common készlettel és az alapegység-fejlődés újramérésével együtt; ne egyszerűen vegyük el a faj erősödését.

**Kapcsolódó tartalom:** [Emberek – Kardos – Sebzés](human.md#normal-swordsman_dmg), [Orkok – Ork Harcos · Sebzés](orc.md#normal-orc_warrior_dmg), [Élőhalottak – Csontváz · Sebzés +10%](undead.md#normal-skeleton_common_damage)

</details>

<a id="normal-orc_ram_dmg"></a>
<details>
<summary><strong>Faltörő kos · Sebzés</strong> · Meglévő · Törlésjelölt · P1</summary>

**Jelenlegi hatás**

Faltörő kos: +10% sebzés.

**L4 / halmozás**

Korlátlanul halmozható.
Első felvétel: Sebzés: 8 → 8,8; Épület elleni sebzés: 130 → 143

**Ár / hely / előfeltétel**

Előfeltétel: Faltörő műhely.
Ár: egy megfelelő választás, nincs külön nyersanyagár.

**Megjegyzés**

Ugyanaz a +10% egység-HP/sebzés család három fajnál; a portré és név nem új működés. A Pap sebzéslapja gyógyítást is ad, a csontvázcsalád lapjai a távolsági változatot is érintik.

**Javasolt új működés**

Törlésjelölt a másolt statlapkészlet ritkításakor. Csak a helyettesítő, fajra jellemző Common készlettel és az alapegység-fejlődés újramérésével együtt; ne egyszerűen vegyük el a faj erősödését.

**Kapcsolódó tartalom:** [Emberek – Kardos – Sebzés](human.md#normal-swordsman_dmg), [Orkok – Ork Harcos · Sebzés](orc.md#normal-orc_warrior_dmg), [Élőhalottak – Csontváz · Sebzés +10%](undead.md#normal-skeleton_common_damage)

</details>

<a id="normal-orc_troll_hp"></a>
<details>
<summary><strong>Troll · Életerő</strong> · Meglévő · Törlésjelölt · P1</summary>

**Jelenlegi hatás**

Troll: +10% életerő.

**L4 / halmozás**

Korlátlanul halmozható.
Első felvétel: Életerő: 3200 → 3520

**Ár / hely / előfeltétel**

Előfeltétel: Trollverem.
Ár: egy megfelelő választás, nincs külön nyersanyagár.

**Megjegyzés**

Ugyanaz a +10% egység-HP/sebzés család három fajnál; a portré és név nem új működés. A Pap sebzéslapja gyógyítást is ad, a csontvázcsalád lapjai a távolsági változatot is érintik.

**Javasolt új működés**

Törlésjelölt a másolt statlapkészlet ritkításakor. Csak a helyettesítő, fajra jellemző Common készlettel és az alapegység-fejlődés újramérésével együtt; ne egyszerűen vegyük el a faj erősödését.

**Kapcsolódó tartalom:** [Emberek – Kardos – Sebzés](human.md#normal-swordsman_dmg), [Orkok – Ork Harcos · Sebzés](orc.md#normal-orc_warrior_dmg), [Élőhalottak – Csontváz · Sebzés +10%](undead.md#normal-skeleton_common_damage)

</details>

<a id="normal-orc_troll_dmg"></a>
<details>
<summary><strong>Troll · Sebzés</strong> · Meglévő · Törlésjelölt · P1</summary>

**Jelenlegi hatás**

Troll: +10% sebzés.

**L4 / halmozás**

Korlátlanul halmozható.
Első felvétel: Sebzés: 110 → 121

**Ár / hely / előfeltétel**

Előfeltétel: Trollverem.
Ár: egy megfelelő választás, nincs külön nyersanyagár.

**Megjegyzés**

Ugyanaz a +10% egység-HP/sebzés család három fajnál; a portré és név nem új működés. A Pap sebzéslapja gyógyítást is ad, a csontvázcsalád lapjai a távolsági változatot is érintik.

**Javasolt új működés**

Törlésjelölt a másolt statlapkészlet ritkításakor. Csak a helyettesítő, fajra jellemző Common készlettel és az alapegység-fejlődés újramérésével együtt; ne egyszerűen vegyük el a faj erősödését.

**Kapcsolódó tartalom:** [Emberek – Kardos – Sebzés](human.md#normal-swordsman_dmg), [Orkok – Ork Harcos · Sebzés](orc.md#normal-orc_warrior_dmg), [Élőhalottak – Csontváz · Sebzés +10%](undead.md#normal-skeleton_common_damage)

</details>

<a id="normal-orc_spear_crit"></a>
<details>
<summary><strong>Kritikus lándzsák</strong> · Meglévő · Megtartás · P1</summary>

**Jelenlegi hatás**

A Warglovas lándzsája +10 százalékpont kritikus esélyt kap.

**L4 / halmozás**

Korlátlanul halmozható.
Első felvétel: Kritikus esély e lapból: 0% → 10%

**Ár / hely / előfeltétel**

Előfeltétel: Wargkarám.
Ár: egy megfelelő választás, nincs külön nyersanyagár.

**Megjegyzés**

A Warg nyitó fegyverére szabott kockázatos kritikus út. A globális Kritikus csapások ugyanennek szélesebb változata. 100% fölött további duplázás történik.

**Javasolt új működés**

A két kritikus lapot összevonni vagy a lándzsásat fegyverhasználati szabállyá alakítani; 100% fölötti exponenciális növekedés helyett világos felső korlát.

**Kapcsolódó tartalom:** [Orkok – Kritikus csapások](orc.md#normal-orc_crit), [Orkok – Halálos ösztön](orc.md#legendary-orc_warg_instinct)

</details>

<a id="normal-orc_curse_duration"></a>
<details>
<summary><strong>Tartós rontás</strong> · Meglévő · Megtartás · P2</summary>

**Jelenlegi hatás**

A Sámán újonnan kiosztott átkainak időtartama 1 másodperccel nő.

**L4 / halmozás**

Korlátlanul halmozható.
Első felvétel: Új átkok időtartama: 4 mp → 5 mp

**Ár / hely / előfeltétel**

Előfeltétel: Sámántábor.
Ár: egy megfelelő választás, nincs külön nyersanyagár.

**Megjegyzés**

A Sámán saját átkainak időtartamát növeli, nem bármely frakció generikus lassítását.

**Javasolt új működés**

A maximális időtartam és az újratalálat-frissítés legyen látható. Ne magyarázzon más lapot a rövid kártyaszöveg.

**Kapcsolódó tartalom:** [Orkok – Sámántábor](orc.md#building-orc_shaman)

</details>

<a id="normal-orc_troll_regen"></a>
<details>
<summary><strong>Trollregeneráció</strong> · Meglévő · Próba szükséges · P2</summary>

**Jelenlegi hatás**

A Troll regenerációja +5 életerő másodpercenként.

**L4 / halmozás**

Korlátlanul halmozható.
Első felvétel: A lap regenerációja: 0 életerő/mp → 5 életerő/mp

**Ár / hely / előfeltétel**

Előfeltétel: Trollverem.
Ár: egy megfelelő választás, nincs külön nyersanyagár.

**Megjegyzés**

5 HP/mp az alap 3200 HP 0,156%-a/mp. A szerephez képest gyenge, de összeadódó, harc közben működő gyógyításból nem szabad automatikus halhatatlanságot csinálni.

**Javasolt új működés**

Arányos, legfeljebb meghatározott hiányzó HP-t visszaadó Troll-pihenés; maradjon a saját óriás regenerációja, ne globális életlopás.

**Kapcsolódó tartalom:** [Élőhalottak – Vérszomj](undead.md#normal-vampire_common_lifesteal), [Orkok – Trollverem](orc.md#building-orc_troll)

</details>

<a id="normal-orc_crit"></a>
<details>
<summary><strong>Kritikus csapások</strong> · Meglévő · Összevonás · P1</summary>

**Jelenlegi hatás**

Minden egység +4 százalékpont kritikus esélyt kap.

**L4 / halmozás**

Korlátlanul halmozható.
Első felvétel: Kritikus esély e lapból: 0% → 4%

**Ár / hely / előfeltétel**

Előfeltétel: Jelenleg nincs külön termelőfeltétel a laphoz.
Ár: egy megfelelő választás, nincs külön nyersanyagár.

**Megjegyzés**

A lándzsás kritikus lap fölé kerülő általános változat. A 100% feletti duplázó matematika szélsőséges lehet.

**Javasolt új működés**

Egyetlen ork kritikus szabály, világos maximum vagy a fölös esély más, lineáris értékké alakítása.

**Kapcsolódó tartalom:** [Orkok – Kritikus lándzsák](orc.md#normal-orc_spear_crit)

</details>

<a id="normal-orc_blessing"></a>
<details>
<summary><strong>Véletlen áldás</strong> · Meglévő · Megtartás · P1</summary>

**Jelenlegi hatás**

Az új egységek +2,5 százalékpont eséllyel véletlen áldást kapnak 40 mp-re.

**L4 / halmozás**

Legfeljebb 40× választható.
Első felvétel: Áldás esélye: 0% → 2,5%

**Ár / hely / előfeltétel**

Előfeltétel: Kevesebb mint 40 felvétel.
Ár: egy megfelelő választás, nincs külön nyersanyagár.

**Megjegyzés**

A véletlen, időleges sámáni áldás inkább ork jelleg, mint az emberi Alkimista véletlen főzete. A hat forrásból regeneráció és fizikai védelem is lehet.

**Javasolt új működés**

Ide vonható az Alkimista véletlen áldásmechanikája, miközben az emberi épület kikerül. A 40 mp-nyi ideiglenes bónusz ne öröklődjön új idővel korlátlanul.

**Kapcsolódó tartalom:** [Emberek – Alkimista kunyhó](human.md#building-alchemist), [Orkok – Örökölt vérszomj](orc.md#legendary-orc_inherit)

</details>

<a id="normal-orc_refund"></a>
<details>
<summary><strong>Kontár építkezés</strong> · Meglévő · Átdolgozás · P1</summary>

**Jelenlegi hatás**

Építéskor +12 százalékpont esély a teljes ár visszatérítésére. Maximum: 60%.

**L4 / halmozás**

Legfeljebb 5× választható.
Első felvétel: Visszatérítés esélye: 0% → 12%

**Ár / hely / előfeltétel**

Előfeltétel: Kevesebb mint 5 felvétel.
Ár: egy megfelelő választás, nincs külön nyersanyagár.

**Megjegyzés**

A 12 százalékpontos esély, 60% plafon elfogadott jelenlegi érték. Várható árkedvezményben mégis emberi Takarékos építkezés másolat, csak nagyobb szórással.

**Javasolt új működés**

A kontárság ideiglenes működési kockázatot vagy anyag-visszanyerést adhat, de ne ugyanazt a tartós olcsósítást más számokkal.

**Kapcsolódó tartalom:** [Emberek – Takarékos építkezés](human.md#normal-building_discount)

</details>

<a id="normal-orc_loot"></a>
<details>
<summary><strong>Hadizsákmány</strong> · Meglévő · Átdolgozás · P1</summary>

**Jelenlegi hatás**

Öléskor +10 százalékpont esély 2 fa, 2 kő és 2 élelem szerzésére. Maximum: 100%.

**L4 / halmozás**

Legfeljebb 10× választható.
Első felvétel: Zsákmány esélye: 0% → 10%

**Ár / hely / előfeltétel**

Előfeltétel: Kevesebb mint 10 felvétel.
Ár: egy megfelelő választás, nincs külön nyersanyagár.

**Megjegyzés**

Haláleseti közvetlen nyersanyagjövedelem a Lélekarató másik változata. Idézett tömeg megölése farmolható bevétel.

**Javasolt új működés**

Az ork zsákmányt épületrombolásra/foglyokra és korlátozott készletre helyezni át; ez a lap akkor a zsákmány felhasználási módját fejlessze.

**Kapcsolódó tartalom:** [Élőhalottak – Lélekarató](undead.md#building-und_soul_harvester), [Orkok – Zsákmányudvar](orc.md#building-idea_loot_yard)

</details>

<a id="normal-orc_cargo"></a>
<details>
<summary><strong>Tágasabb ostromgépek</strong> · Meglévő · Megtartás · P2</summary>

**Jelenlegi hatás**

A Trójai kos +4 gyalogost szállíthat.

**L4 / halmozás**

Korlátlanul halmozható.
Első felvétel: Trójai kos utasférőhelye: 10 → 14

**Ár / hely / előfeltétel**

Előfeltétel: Faltörő műhely és Trójai kos legendás.
Ár: egy megfelelő választás, nincs külön nyersanyagár.

**Megjegyzés**

A Trójai kos szállítókapacitása valóban egyedi, és helyesen csak a legendás birtokában kínálható.

**Javasolt új működés**

Legyen felső utaslimit és látható sereghelyfoglalás. Az utas nem lehet egyszerre bent is és külön aktív támadó is.

**Kapcsolódó tartalom:** [Orkok – Trójai kos](orc.md#legendary-orc_trojan)

</details>

<a id="normal-orc_cursed_damage"></a>
<details>
<summary><strong>Rontott sebek</strong> · Meglévő · Megtartás · P2</summary>

**Jelenlegi hatás**

Minden ork egység +6% sebzést okoz megátkozott ellenségeknek.

**L4 / halmozás**

Korlátlanul halmozható.
Első felvétel: Sebzés megátkozott egységek ellen: +0% → +6%

**Ár / hely / előfeltétel**

Előfeltétel: Katonai termelő és Sámántábor.
Ár: egy megfelelő választás, nincs külön nyersanyagár.

**Megjegyzés**

Az ork Sámán és fizikai sereg közös átokhasználata, helyes Sámán-előfeltétellel. Más fajnak nem kell ugyanilyen megjelöltcélpont-bónusz más színben.

**Javasolt új működés**

Az aktív átok számától ne többszöröződjön; az egyértelmű +6% felvételenként maradjon számszerű összevetésben.

**Kapcsolódó tartalom:** [Orkok – Sámántábor](orc.md#building-orc_shaman), [Emberek – Jelzőnyíl](human.md#legendary-marking_arrow)

</details>

<a id="normal-orc_move"></a>
<details>
<summary><strong>Hordamenet</strong> · Meglévő · Átdolgozás · P1</summary>

**Jelenlegi hatás**

Minden ork egység mozgási sebessége +5%.

**L4 / halmozás**

Korlátlanul halmozható.
Első felvétel: Mozgási sebesség: +0% → +5%

**Ár / hely / előfeltétel**

Előfeltétel: Legalább 1 katonai termelő.
Ár: egy megfelelő választás, nincs külön nyersanyagár.

**Megjegyzés**

Általános +5% mozgás, a többi faj mozgási lapjának új neve.

**Javasolt új működés**

Az ork üldözéshez/sebesült prédához vagy saját ostromhoz kapcsolódó mozgásszabály váltsa ki; a lovas és gyalogos tempó arányát ne mossa el végtelen stat.

**Kapcsolódó tartalom:** [Emberek – Harci mén](human.md#normal-knight_move), [Élőhalottak – Síri menet](undead.md#normal-und_home_march)

</details>

<a id="normal-orc_siege_damage"></a>
<details>
<summary><strong>Erődrombolók</strong> · Meglévő · Átdolgozás · P1</summary>

**Jelenlegi hatás**

Minden ork egység tornyok és a főváros elleni sebzése +15%.

**L4 / halmozás**

Korlátlanul halmozható.
Első felvétel: Tornyok és főváros elleni sebzés: +0% → +15%

**Ár / hely / előfeltétel**

Előfeltétel: Legalább 1 katonai termelő.
Ár: egy megfelelő választás, nincs külön nyersanyagár.

**Megjegyzés**

Általános +15% épületsebzés, az élőhalott Holtak ostroma és emberi ostromlapok tükre.

**Javasolt új működés**

A közelharci ostrom saját eszközei: pajzs-/szerkezetrombolás, szállítás, feltartóztathatatlan nyomás. Nem általános százalék minden egységre.

**Kapcsolódó tartalom:** [Élőhalottak – Holtak ostroma](undead.md#normal-und_siege_force), [Emberek – Nehéz lövedék](human.md#normal-cat_build)

</details>

<a id="normal-orc_lifesteal"></a>
<details>
<summary><strong>Vérszomjas horda</strong> · Meglévő · Átadás: Élőhalottak · P1</summary>

**Jelenlegi hatás**

Minden ork egység +3 százalékpont életlopást kap.

**L4 / halmozás**

Korlátlanul halmozható.
Első felvétel: Életlopás: 0% → 3%

**Ár / hely / előfeltétel**

Előfeltétel: Legalább 1 katonai termelő.
Ár: egy megfelelő választás, nincs külön nyersanyagár.

**Megjegyzés**

A teljes ork hadsereg életlopása ugyanaz a szerep, mint az Életszüret; az Oltár és L4 Hajcsár tovább is duplázza.

**Javasolt új működés**

Az orkoknál kiváltanám; az élőhalott életlopó irányt nem kell mellé tovább buffolni, ez nem egyszerű számátmásolás.

**Kapcsolódó tartalom:** [Élőhalottak – Életszüret](undead.md#legendary-und_army_leech), [Orkok – Áldozati oltár](orc.md#building-orc_altar)

</details>

<a id="normal-orc_food_discount"></a>
<details>
<summary><strong>Hadi fejadag</strong> · Meglévő · Átdolgozás · P1</summary>

**Jelenlegi hatás**

Minden ork egység élelemköltsége −8%, legfeljebb −50%.

**L4 / halmozás**

Legfeljebb 7× választható.
Első felvétel: Élelemköltség: 100% → 92%

**Ár / hely / előfeltétel**

Előfeltétel: Katonai termelő; kevesebb mint 7 felvétel.
Ár: egy megfelelő választás, nincs külön nyersanyagár.

**Megjegyzés**

Csak a húsra vonatkozik, de gazdaságilag az emberi általános képzési kedvezmény szűkebb változata. 7 felvételnél −50%.

**Javasolt új működés**

A nyílt kapuval vállalt kinti ellátás vagy a foglyokból visszanyert, korlátos élelem váltsa ki; ne állandó olcsósító másolat.

**Kapcsolódó tartalom:** [Emberek – Takarékos kiképzés](human.md#normal-frugal_training)

</details>

<a id="normal-idea_hardened_hide"></a>
<details>
<summary><strong>Megedzett bőr</strong> · Új ötlet · Új ötlet · P2</summary>

**Jelenlegi hatás**

Nincs a játékban. Tervezési jelölt; az esetleges számok kipróbálandó kezdőértékek.

**L4 / halmozás**

Célpontonként 1 állapot, kis plafon; a felvételek a plafont emelik, nem adnak korlátlan támadónkénti szorzót.

**Ár / hely / előfeltétel**

Előfeltétel / terv:
Harci tábor.

**Megjegyzés**

Az ellenállást harc közben szerzi, nem a Kardos–Lándzsás alakzati fedezetének másolata.

**Javasolt új működés**

A Harcos ugyanattól a közelharci ellenféltől ismételt találatot kapva rövid idejű fizikai tűrést épít. Másik támadó és harcszünet leépíti.

Korlát / értelmezés: Célpontonként 1 állapot, kis plafon; a felvételek a plafont emelik, nem adnak korlátlan támadónkénti szorzót.

**Kapcsolódó tartalom:** [Orkok – Ork Harcos · Életerő](orc.md#normal-orc_warrior_hp), [Emberek – Pajzsillesztés](human.md#normal-idea_shield_join)

</details>

<a id="normal-idea_pain_tolerance"></a>
<details>
<summary><strong>Fájdalomtűrés</strong> · Új ötlet · Új ötlet · P2</summary>

**Jelenlegi hatás**

Nincs a játékban. Tervezési jelölt; az esetleges számok kipróbálandó kezdőértékek.

**L4 / halmozás**

Kis, legfeljebb összesen +20 százalékpontos többletplafon; teljes HP-n nincs hatás.

**Ár / hely / előfeltétel**

Előfeltétel / terv:
Dühöngők tábora.

**Megjegyzés**

Az életlopást kiváltó, sebesült ork irány; nem újabb általános +AS lap.

**Javasolt új működés**

A Dühöngő fél HP alatt a már meglévő sebesültségi tempójának felső határát növeli, nem gyógyítja vissza magát.

Korlát / értelmezés: Kis, legfeljebb összesen +20 százalékpontos többletplafon; teljes HP-n nincs hatás.

**Kapcsolódó tartalom:** [Orkok – Vérivás](orc.md#normal-orc_leech), [Orkok – Fájdalomból erő](orc.md#legendary-orc_bers_rage)

</details>

<a id="normal-idea_ricochet"></a>
<details>
<summary><strong>Pattanó parittyakő</strong> · Új ötlet · Új ötlet · P2</summary>

**Jelenlegi hatás**

Nincs a játékban. Tervezési jelölt; az esetleges számok kipróbálandó kezdőértékek.

**L4 / halmozás**

Legfeljebb 1 pattanás/lövés; nincs új össztűz/új pattanás. A felvételek a másodlagos arányt emelik, maximum 40%-ig.

**Ár / hely / előfeltétel**

Előfeltétel / terv:
Goblin-tábor és ellenséges pajzsforrás.

**Megjegyzés**

Parittyás trükk az emberi íjászátalakítás helyett. A kivédett első találat nem számít felhasznált numerikus pajzsnak.

**Javasolt új működés**

Ha egy Goblin kövét ténylegesen ellenséges pajzs fogja fel, a kő egy közeli másik célpontra pattanhat, gyengébb sebzéssel.

Korlát / értelmezés: Legfeljebb 1 pattanás/lövés; nincs új össztűz/új pattanás. A felvételek a másodlagos arányt emelik, maximum 40%-ig.

**Kapcsolódó tartalom:** [Orkok – Goblin íjászok](orc.md#legendary-orc_gob_bow), [Élőhalottak – Túlvilági oltalom](undead.md#legendary-und_first_guard)

</details>

<a id="normal-idea_curse_variety"></a>
<details>
<summary><strong>Rontásváltó</strong> · Új ötlet · Új ötlet · P2</summary>

**Jelenlegi hatás**

Nincs a játékban. Tervezési jelölt; az esetleges számok kipróbálandó kezdőértékek.

**L4 / halmozás**

+20 százalékpont esély/felvétel, legfeljebb 100%; a Kettős átok nem tesz rá azonos átkot kétszer.

**Ár / hely / előfeltétel**

Előfeltétel / terv:
Sámántábor; legalább 2 engedélyezett, különböző átok.

**Megjegyzés**

Az Átokmester döntését használja, nem újabb +sebzés/+időtartam százalék.

**Javasolt új működés**

A Sámán egy már átok alatt álló célpontnál nagyobb eséllyel hiányzó, engedélyezett átkot választ a puszta időfrissítés helyett.

Korlát / értelmezés: +20 százalékpont esély/felvétel, legfeljebb 100%; a Kettős átok nem tesz rá azonos átkot kétszer.

**Kapcsolódó tartalom:** [Orkok – Átokmester](orc.md#legendary-orc_curse_master), [Orkok – Sámántábor](orc.md#building-orc_shaman)

</details>

<a id="normal-idea_heavy_footing"></a>
<details>
<summary><strong>Megvetett láb</strong> · Új ötlet · Új ötlet · P2</summary>

**Jelenlegi hatás**

Nincs a játékban. Tervezési jelölt; az esetleges számok kipróbálandó kezdőértékek.

**L4 / halmozás**

−15% hátralökési távolság/felvétel, legfeljebb −60%; 4 felvétel.

**Ár / hely / előfeltétel**

Előfeltétel / terv:
Trollverem és az ellenfélnek releváns lökésforrása.

**Megjegyzés**

Az óriás tömegét fejezi ki, nem még több HP/regeneráció; a Falanx és toronysorrend szabályát nem írja felül.

**Javasolt új működés**

A Trollt a fizikai hátralökések kisebb távolságra mozdítják el, de nem válik lassítás- vagy kábításimmunissá.

Korlát / értelmezés: −15% hátralökési távolság/felvétel, legfeljebb −60%; 4 felvétel.

**Kapcsolódó tartalom:** [Orkok – Troll · Életerő](orc.md#normal-orc_troll_hp), [Emberek – Ostromlökés](human.md#legendary-catapult_knockback)

</details>

<a id="normal-idea_trophy_record"></a>
<details>
<summary><strong>Trófeanyilvántartás</strong> · Új ötlet · Új ötlet · P2</summary>

**Jelenlegi hatás**

Nincs a játékban. Tervezési jelölt; az esetleges számok kipróbálandó kezdőértékek.

**L4 / halmozás**

Egységazonosítónként egyszer; ugyanannak az eredeti testnek a feltámadása nem új trófea.

**Ár / hely / előfeltétel**

Előfeltétel / terv:
Ősök Toteme az átdolgozott dicsőségszabállyal.

**Megjegyzés**

A Totemnek minőségi harci teljesítményt ad, a minden halál=1 pont lap alternatívája.

**Javasolt új működés**

A Totem értékes, kiképzett ellenséges elit megöléséből kaphat kevés külön dicsőséget; az olcsó idézett tömeg nem ér ennyit.

Korlát / értelmezés: Egységazonosítónként egyszer; ugyanannak az eredeti testnek a feltámadása nem új trófea.

**Kapcsolódó tartalom:** [Orkok – Ellenségvér az ősöknek](orc.md#legendary-orc_enemy_ancestors), [Orkok – Ősök Toteme](orc.md#building-orc_totem)

</details>

## Legendás készlet

<a id="legendary-orc_bers_rage"></a>
<details>
<summary><strong>Fájdalomból erő</strong> · Meglévő · Megtartás · P2</summary>

**Jelenlegi hatás**

A Dühöngő minden 1% hiányzó életerőért +1% sebzést kap.

**L4 / halmozás**

Egyszer választható.

**Ár / hely / előfeltétel**

Előfeltétel: Dühöngők tábora.
Ár: egy megfelelő választás, nincs külön nyersanyagár.

**Megjegyzés**

A Dühöngő saját sebesült, még élő állapotából szerzett sebzés, így több egy egyszerű +10%-os lapon.

**Javasolt új működés**

Maradjon a sebesült kockázati irány, a gyógyulás/életlopás és a Harci lendület szorzóival együtt mérve.

**Kapcsolódó tartalom:** [Orkok – Dühöngő](orc.md#unit-orc_berserker), [Orkok – Harci lendület](orc.md#legendary-orc_momentum)

</details>

<a id="legendary-orc_gob_bow"></a>
<details>
<summary><strong>Goblin íjászok</strong> · Meglévő · Átdolgozás · P1</summary>

**Jelenlegi hatás**

A Goblin íjat kap: +20% sebzés, +20% hatótáv és −40% támadási sebesség.

**L4 / halmozás**

Egyszer választható.

**Ár / hely / előfeltétel**

Előfeltétel: Goblin-tábor.
Ár: egy megfelelő választás, nincs külön nyersanyagár.

**Megjegyzés**

Az emberi Hosszúíjászok rokona. +20% sebzés és −40% AS = 0,72× alap nyers DPS, a +20% táv kompenzációja nélkül; ettől még nem mértünk fajerőt.

**Javasolt új működés**

Maradjon parittyás: pajzson pattanó kő, ostromkísérő vagy más ork trükk. Ne emberi íjászt adjunk új portréval.

**Kapcsolódó tartalom:** [Emberek – Íjásztelep](human.md#building-archery), [Orkok – Pattanó parittyakő](orc.md#normal-idea_ricochet)

</details>

<a id="legendary-orc_ancient_deposits"></a>
<details>
<summary><strong>Ősi lelőhelyek</strong> · Meglévő · Átdolgozás · P2</summary>

**Jelenlegi hatás**

A Munkatábor erdő mellett 3× fát, kőlelőhely mellett 3× követ termel.

**L4 / halmozás**

Egyszer választható.

**Ár / hely / előfeltétel**

Előfeltétel: Jelenleg nincs külön Munkatábor-feltétel a definícióban.
Ár: egy megfelelő választás, nincs külön nyersanyagár.

**Megjegyzés**

A Munkatábor terepszorzóját ×2-ről ×3-ra emeli. Ez nagyobb passzív termelés, nem igazán új legendás működés.

**Javasolt új működés**

Ork kitermelési kockázat/rombolási zsákmány irányra válthat, nem újabb általános gazdasági százalékra.

**Kapcsolódó tartalom:** [Emberek – Fokozott termelés](human.md#normal-production), [Orkok – Munkatábor](orc.md#building-orc_work)

</details>

<a id="legendary-orc_bers_blood"></a>
<details>
<summary><strong>Vérszagra gyűlnek</strong> · Meglévő · Megtartás · P2</summary>

**Jelenlegi hatás**

A Dühöngő dupla sebzést okoz Vérző ellenfeleknek.

**L4 / halmozás**

Egyszer választható.

**Ár / hely / előfeltétel**

Előfeltétel: Dühöngők tábora.
Ár: egy megfelelő választás, nincs külön nyersanyagár.

**Megjegyzés**

A vérző célpontot kihasználó Dühöngő jó ork összefüggés. A dupla sebzés + sebesült AS + sebzésből AS együtt már nem egyszerű két bónusz.

**Javasolt új működés**

A vérzés maradjon feltétel, és más nép ne kapjon ugyanilyen vérszagvadászt eltérő színnel.

**Kapcsolódó tartalom:** [Orkok – Vérző sebek](orc.md#normal-orc_bleed), [Orkok – Harci lendület](orc.md#legendary-orc_momentum)

</details>

<a id="legendary-orc_gob_blood"></a>
<details>
<summary><strong>Vérszomjas lövedékek</strong> · Meglévő · Átdolgozás · P1</summary>

**Jelenlegi hatás**

A Goblin találatai 1 Vérzést okoznak. A már Vérző ellenfeleknek +25% sebzést okoz.

**L4 / halmozás**

Egyszer választható.

**Ár / hely / előfeltétel**

Előfeltétel: Goblin-tábor.
Ár: egy megfelelő választás, nincs külön nyersanyagár.

**Megjegyzés**

A Goblin egyszerre előállítja és ki is használja a Harcos saját vérzését. Ettől a vegyes sereg szüksége csökkenhet.

**Javasolt új működés**

Vagy a Harcos által nyitott vérzést használja, vagy teljesen saját parittyás funkciót kapjon; ne legyen önellátó vérzésmotor minden lövész.

**Kapcsolódó tartalom:** [Orkok – Vérző sebek](orc.md#normal-orc_bleed), [Orkok – Vérszagra gyűlnek](orc.md#legendary-orc_bers_blood)

</details>

<a id="legendary-orc_warg_instinct"></a>
<details>
<summary><strong>Halálos ösztön</strong> · Meglévő · Összevonás · P1</summary>

**Jelenlegi hatás**

A Warglovas közelharci támadásai is használják a lándzsa kritikus esélyét. Csak egységek ellen hat.

**L4 / halmozás**

Egyszer választható.

**Ár / hely / előfeltétel**

Előfeltétel: Wargkarám.
Ár: egy megfelelő választás, nincs külön nyersanyagár.

**Megjegyzés**

A lándzsakritikus esélyt adja a közelharcnak is, miközben globális kritikus lap is létezik.

**Javasolt új működés**

Egyetlen ork fegyver/kritikus rendszerben kezelni. A legendás helye inkább valódi vadászat vagy fogolyejtés lehet.

**Kapcsolódó tartalom:** [Orkok – Kritikus csapások](orc.md#normal-orc_crit), [Orkok – Kritikus lándzsák](orc.md#normal-orc_spear_crit)

</details>

<a id="legendary-orc_last_blood"></a>
<details>
<summary><strong>Utolsó vérig</strong> · Meglévő · Átadás: Élőhalottak · P1</summary>

**Jelenlegi hatás**

A Harcos halálakor sebzése 2×-ével sújtja a közelharci hatótávján belüli ellenségeket.

**L4 / halmozás**

Egyszer választható.

**Ár / hely / előfeltétel**

Előfeltétel: Harci tábor.
Ár: egy megfelelő választás, nincs külön nyersanyagár.

**Megjegyzés**

Harcos halálából körsebzés: ugyanaz a halálrobbanás-család, mint Troll Utolsó tombolás és Zombi/halállánc.

**Javasolt új működés**

Az ork utolsó, még élő csapása legyen veszélyes; a holttestből támadó hatás ne maradjon több népnél. Átadáskor a Zombi saját halálhatásába kell összevonni, nem mellé még egy lap.

**Kapcsolódó tartalom:** [Orkok – Utolsó tombolás](orc.md#legendary-orc_last_rampage), [Élőhalottak – Hullaház](undead.md#building-und_morgue), [Élőhalottak – Halálkaszkád](undead.md#legendary-und_death_chain)

</details>

<a id="legendary-orc_horde_heart"></a>
<details>
<summary><strong>Hordaszív</strong> · Meglévő · Megtartás · P2</summary>

**Jelenlegi hatás**

A Harcos +3% életerőt kap minden másik, 8 m távolságon belüli Harcos után.

**L4 / halmozás**

Egyszer választható.

**Ár / hely / előfeltétel**

Előfeltétel: Harci tábor.
Ár: egy megfelelő választás, nincs külön nyersanyagár.

**Megjegyzés**

Azonos Harcosok közelségéből HP: ork tömör horda lehet, szemben az emberi vegyes fegyvernemmel. Korlátlan létszámnál négyzetes csoportelőnynek tűnhet.

**Javasolt új működés**

Korlátozott szomszédszám és látható maximális erő; a sok Harcos ne nyerjen korlátlan HP-t egyetlen kupacból.

**Kapcsolódó tartalom:** [Emberek – Összfegyvernemi roham](human.md#legendary-combined_assault), [Orkok – Wargkarám](orc.md#building-orc_warg)

</details>

<a id="legendary-orc_volley"></a>
<details>
<summary><strong>Goblin össztűz</strong> · Meglévő · Megtartás · P2</summary>

**Jelenlegi hatás**

Goblin találatakor a közeli Goblinok 3% eséllyel ingyen támadják ugyanazt a célpontot.

**L4 / halmozás**

Egyszer választható.

**Ár / hely / előfeltétel**

Előfeltétel: Goblin-tábor.
Ár: egy megfelelő választás, nincs külön nyersanyagár.

**Megjegyzés**

Falkaszerű parittyás reakció, nem ugyanaz a fix három lövedék. Sok Goblinnál minden találat sok sorsolást indíthat.

**Javasolt új működés**

Csoportonként/időablakonként reakciólimit; a másodlagos ingyenlövés ne hívjon új össztüzet. A tényleges sebzést és a látványelemek számát külön korlátozni.

**Kapcsolódó tartalom:** [Emberek – Háromszoros varázslat](human.md#legendary-mage_triple), [Orkok – Kettős parittya](orc.md#normal-orc_double)

</details>

<a id="legendary-orc_hunt"></a>
<details>
<summary><strong>Vérszomjas vadászat</strong> · Meglévő · Szövegjavítás · P0</summary>

**Jelenlegi hatás**

+0,5 élelem/mp. Fal mellett +50%, nyitott kapunál további +50% termelés.

KÓDBAN TÉNYLEGES HATÁS: Warglovas ölés után ingyen lándzsadobás. A fenti élelemtermelés hibás jelenlegi kártyaszöveg.

**L4 / halmozás**

Egyszer választható.

**Ár / hely / előfeltétel**

Előfeltétel: Wargkarám.
Ár: egy megfelelő választás, nincs külön nyersanyagár.

**Megjegyzés**

Bizonyított név/azonosító-ütközés: a lap jelenleg a Vadászház élelemtermelését írja, de a kód szerint Warg-ölés után ingyen új lándzsadobást ad. A Warg L4 részben ugyanezt teszi.

**Javasolt új működés**

Szöveg és art különválasztása a Vadászháztól, majd a dobáslánc egyetlen szabályba összevonása. Ez nem új élelmező lap.

**Kapcsolódó tartalom:** [Orkok – Vadászház](orc.md#building-orc_hunt), [Orkok – Wargkarám](orc.md#building-orc_warg)

</details>

<a id="legendary-orc_predator"></a>
<details>
<summary><strong>Ragadozóösztön</strong> · Meglévő · Megtartás · P2</summary>

**Jelenlegi hatás**

A Warglovas a közeli távolsági ellenfelekre rohan.

**L4 / halmozás**

Egyszer választható.

**Ár / hely / előfeltétel**

Előfeltétel: Wargkarám.
Ár: egy megfelelő választás, nincs külön nyersanyagár.

**Megjegyzés**

A Warg célpontvadászata a Szellem hátsó sorba jutásával rokon célt szolgál, de nem átjárás és nem teleport.

**Javasolt új működés**

A Warg fizikai útvonallal és dobással közelítsen; a Falanxon/tornyon ne jusson át.

**Kapcsolódó tartalom:** [Élőhalottak – Fantomkapu](undead.md#building-und_ghost_spawner), [Orkok – Warglovas](orc.md#unit-orc_warg)

</details>

<a id="legendary-orc_curse_master"></a>
<details>
<summary><strong>Átokmester</strong> · Meglévő · Megtartás · P2</summary>

**Jelenlegi hatás**

A Sámántáborban kiválaszthatod a Sámánjaid által használt átkokat.

**L4 / halmozás**

Egyszer választható.

**Ár / hely / előfeltétel**

Előfeltétel: Sámántábor.
Ár: egy megfelelő választás, nincs külön nyersanyagár.

**Megjegyzés**

A véletlen átokkészlet játékos által választott lesz; ez valódi működésváltás és döntés.

**Javasolt új működés**

A választható átkokat mutassa jól a panel, és az AI is az ellenfélhez válasszon. Nem kell az emberi kutatás/kínálat másolata.

**Kapcsolódó tartalom:** [Orkok – Sámántábor](orc.md#building-orc_shaman)

</details>

<a id="legendary-orc_curse_spread"></a>
<details>
<summary><strong>Átokterjesztés</strong> · Meglévő · Megtartás · P2</summary>

**Jelenlegi hatás**

Elátkozott ellenség halálakor negatív állapotai a legközelebbi, hatótávon belüli ellenségre kerülnek.

**L4 / halmozás**

Egyszer választható.

**Ár / hely / előfeltétel**

Előfeltétel: Sámántábor.
Ár: egy megfelelő választás, nincs külön nyersanyagár.

**Megjegyzés**

A meglévő idővel/erősséggel továbbadott negatív állapot ork rontásmechanika. Az élőhalottnak ne adjunk ugyanilyen mérgezés-halálterjedést új néven.

**Javasolt új működés**

Maradjon korlátozott hatótáv, azonos célpontot ne lehessen egyszerre többször szétosztó lánccal elárasztani.

**Kapcsolódó tartalom:** [Élőhalottak – Pestiskamra](undead.md#building-und_plague_chamber), [Orkok – Tartós rontás](orc.md#normal-orc_curse_duration)

</details>

<a id="legendary-orc_dispel"></a>
<details>
<summary><strong>Átoktörés</strong> · Meglévő · Megtartás · P2</summary>

**Jelenlegi hatás**

A Sámán találata eltávolít 1 pozitív állapotot a célpontról.

**L4 / halmozás**

Egyszer választható.

**Ár / hely / előfeltétel**

Előfeltétel: Sámántábor és ellenséges ideiglenes buffforrás.
Ár: egy megfelelő választás, nincs külön nyersanyagár.

**Megjegyzés**

Pozitív ideiglenes állapot eltávolítása eltér az emberi Pap negatívállapot-tisztításától. Feltételesen csak ellenséges buffforrással kínálja.

**Javasolt új működés**

Az új áldáslopás ötlet ennek ALTERNATÍVÁJA, nem még egy ugyanilyen lap. A permanens fejlesztést ne törölje.

**Kapcsolódó tartalom:** [Orkok – Elrabolt áldás](orc.md#legendary-idea_stolen_blessing), [Emberek – Sebtisztítás](human.md#normal-idea_clean_bandage)

</details>

<a id="legendary-orc_siege_shield"></a>
<details>
<summary><strong>Élő ostrompajzs</strong> · Meglévő · Átdolgozás · P1</summary>

**Jelenlegi hatás**

A kos +100% életerőt, de −50% sebzést kap. Átveszi a közeli szövetségeseket érő sebzés felét.

**L4 / halmozás**

Egyszer választható.

**Ár / hely / előfeltétel**

Előfeltétel: Faltörő műhely.
Ár: egy megfelelő választás, nincs külön nyersanyagár.

**Megjegyzés**

Sebzésátvétel a közeli szövetségesektől, a Csontpajzs szerepéhez hasonló. A kos támadását is gyengíti, így valójában védelmi platform.

**Javasolt új működés**

A kos egyedi szállító/ostromfunkcióját erősíteném, a lövedék- vagy sebzésátirányításnak egy tulajdonos faj maradjon.

**Kapcsolódó tartalom:** [Élőhalottak – Csontpajzs](undead.md#legendary-skeleton_leg_guard), [Orkok – Trójai kos](orc.md#legendary-orc_trojan)

</details>

<a id="legendary-orc_trojan"></a>
<details>
<summary><strong>Trójai kos</strong> · Meglévő · Megtartás · P2</summary>

**Jelenlegi hatás**

Legfeljebb 10 helyőrségi gyalogos száll a kosba. Toronynál vagy a kos halálakor kiszállnak. Sereghelyet foglalnak.

**L4 / halmozás**

Egyszer választható.

**Ár / hely / előfeltétel**

Előfeltétel: Faltörő műhely.
Ár: egy megfelelő választás, nincs külön nyersanyagár.

**Megjegyzés**

Mozgó egységszállító ostromgép, valódi saját ork működés. A bent lévők is sereghelyet foglalnak.

**Javasolt új működés**

A kiszállás és koshalál ne duplikálja az utasokat. A Harci szekér új ötlet csak ennek alternatív, kiegészítő szerepű tesztje.

**Kapcsolódó tartalom:** [Orkok – Tágasabb ostromgépek](orc.md#normal-orc_cargo), [Orkok – Harci szekér](orc.md#legendary-idea_war_wagon)

</details>

<a id="legendary-orc_glutton"></a>
<details>
<summary><strong>Falánk óriások</strong> · Meglévő · Megtartás · P2</summary>

**Jelenlegi hatás**

A Troll minden öléssel +5% maximális életerőt és sebzést szerez haláláig.

**L4 / halmozás**

Egyszer választható.

**Ár / hely / előfeltétel**

Előfeltétel: Trollverem.
Ár: egy megfelelő választás, nincs külön nyersanyagár.

**Megjegyzés**

Ölésből egy adott nagy ork erősödik, nem halottból új test keletkezik. A vég nélküli +5% HP/sebzés viszont elszállhat könnyű idézetekből.

**Javasolt új működés**

Természetes/értéksúlyozott ölés és felső növekedési korlát. Az idővel eltűnés ne etesse a Trollt.

**Kapcsolódó tartalom:** [Élőhalottak – Nekromanták szentélye](undead.md#building-und_necro_spawner), [Orkok – Harcedzett gyilkosok](orc.md#legendary-orc_veteran_kills)

</details>

<a id="legendary-orc_last_rampage"></a>
<details>
<summary><strong>Utolsó tombolás</strong> · Meglévő · Átadás: Élőhalottak · P1</summary>

**Jelenlegi hatás**

A Troll halálakor maximális életereje 25%-ával sebzi a közeli ellenségeket.

**L4 / halmozás**

Egyszer választható.

**Ár / hely / előfeltétel**

Előfeltétel: Trollverem.
Ár: egy megfelelő választás, nincs külön nyersanyagár.

**Megjegyzés**

A 3200 HP-s Troll halálából 800 körsebzés már alapértéken is nagy. Az Utolsó vérig és Zombi halálhatás azonos eseménycsalád.

**Javasolt új működés**

A nagy földcsapás életében és Földrengetőből jöjjön; a halál utáni robbanás egyetlen élőhalott átalakítás része legyen, ne új tükörlap.

**Kapcsolódó tartalom:** [Orkok – Utolsó vérig](orc.md#legendary-orc_last_blood), [Élőhalottak – Hullaház](undead.md#building-und_morgue)

</details>

<a id="legendary-orc_united_huts"></a>
<details>
<summary><strong>Hordák egyesítése</strong> · Meglévő · Megtartás · P2</summary>

**Jelenlegi hatás**

A Kunyhók teljes kapacitását a sereghez vagy a helyőrséghez rendelheted.

**L4 / halmozás**

Egyszer választható.

**Ár / hely / előfeltétel**

Előfeltétel: Kunyhó.
Ár: egy megfelelő választás, nincs külön nyersanyagár.

**Megjegyzés**

Kapacitás átcsoportosítása, nem egyszerű +limit. A Kunyhó kettős lakhatásának jó ork változata.

**Javasolt új működés**

A beállítás legyen globálisan jól látható; a határ alá csökkentett sereg ne tűnjön el, de új képzés ne kerülje meg a limitet.

**Kapcsolódó tartalom:** [Orkok – Kunyhó](orc.md#building-orc_hut), [Emberek – Erődített helyőrség](human.md#legendary-large_garrison)

</details>

<a id="legendary-orc_crowded_huts"></a>
<details>
<summary><strong>Zsúfolt kunyhók</strong> · Meglévő · Átdolgozás · P1</summary>

**Jelenlegi hatás**

A Kunyhók 1×1 méretűek lesznek, de −50% sereg- és helyőrségi férőhelyet adnak.

**L4 / halmozás**

Egyszer választható.

**Ár / hely / előfeltétel**

Előfeltétel: Kunyhó.
Ár: egy megfelelő választás, nincs külön nyersanyagár.

**Megjegyzés**

1×1-re zsugorítás fél kapacitásért: 4 helyről 1-re kétszeres kapacitássűrűséget ad, nem egyszerű kapacitásfelezés. Emberi Magasvár is hasonló helyfelszabadítás.

**Javasolt új működés**

A lakhatási kompromisszum maradhat ork, de ne legyen másik faj ugyanilyen épületösszenyomó lapja. A használható teljes aktívlétszám külön keret.

**Kapcsolódó tartalom:** [Emberek – Magasvár](human.md#legendary-high_keep), [Orkok – Kunyhó](orc.md#building-orc_hut)

</details>

<a id="legendary-orc_revenge"></a>
<details>
<summary><strong>Bosszúhadjárat</strong> · Meglévő · Átdolgozás · P1</summary>

**Jelenlegi hatás**

Minden elvesztett saját torony +10% katonai képzési sebességet ad.

**L4 / halmozás**

Egyszer választható.

**Ár / hely / előfeltétel**

Előfeltétel: Ork faj; jelenleg nincs külön további épületfeltétel.
Ár: egy megfelelő választás, nincs külön nyersanyagár.

**Megjegyzés**

Saját toronyvesztésből stat, az emberi Utolsó védvonal másik változata.

**Javasolt új működés**

Az ork a rombolásból és visszatámadásból kapjon más, harci döntéshez kötött jutalmat, ne a saját torony elvesztését farmolja.

**Kapcsolódó tartalom:** [Emberek – Utolsó védvonal](human.md#legendary-last_line), [Emberek – Újjáépítés](human.md#legendary-tower_rebuild)

</details>

<a id="legendary-orc_momentum"></a>
<details>
<summary><strong>Harci lendület</strong> · Meglévő · Átdolgozás · P1</summary>

**Jelenlegi hatás**

A sebzésfejlesztések bónuszának fele támadási sebességként is jár.

**L4 / halmozás**

Egyszer választható.

**Ár / hely / előfeltétel**

Előfeltétel: Ork faj; jelenleg nincs külön további épületfeltétel.
Ár: egy megfelelő választás, nincs külön nyersanyagár.

**Megjegyzés**

Sebzésbónusz felét AS-ként megadva több erős ork szorzó egymást gyorsítja; a lap általános +stat lánc, nem új viselkedés.

**Javasolt új működés**

A sebesültségi/falka-lendület külön, plafonos állapotként kezelendő; ne minden későbbi sebzésszorzót automatikusan újra jutalmazzon.

**Kapcsolódó tartalom:** [Orkok – Fájdalomból erő](orc.md#legendary-orc_bers_rage), [Orkok – Falánk óriások](orc.md#legendary-orc_glutton)

</details>

<a id="legendary-orc_inherit"></a>
<details>
<summary><strong>Örökölt vérszomj</strong> · Meglévő · Átadás: Élőhalottak · P1</summary>

**Jelenlegi hatás**

Halálkor a legközelebbi, hatótávon belüli szövetséges örökli az egység pozitív állapotait, pajzsát és támadásbónuszait.

**L4 / halmozás**

Egyszer választható.

**Ár / hely / előfeltétel**

Előfeltétel: Ork faj; jelenleg nincs külön további épületfeltétel.
Ár: egy megfelelő választás, nincs külön nyersanyagár.

**Megjegyzés**

Halál után a legközelebbi élő örökli a pozitív állapotot/pajzsot/töltetet: erős halotti örökség-téma.

**Javasolt új működés**

Élőhalott Halotti hagyaték alternatívaként átadható, az ork változat kivezetésével. Időt és töltetet nem szabad újratölteni vagy többször örökíteni.

**Kapcsolódó tartalom:** [Élőhalottak – Halotti hagyaték](undead.md#legendary-idea_last_will), [Élőhalottak – Lélekörökség](undead.md#normal-und_death_mend)

</details>

<a id="legendary-orc_veteran_kills"></a>
<details>
<summary><strong>Harcedzett gyilkosok</strong> · Meglévő · Megtartás · P2</summary>

**Jelenlegi hatás**

Minden Veteránod ölésenként +10% sebzést kap haláláig.

**L4 / halmozás**

Egyszer választható.

**Ár / hely / előfeltétel**

Előfeltétel: Ork faj; jelenleg nincs külön további épületfeltétel.
Ár: egy megfelelő választás, nincs külön nyersanyagár.

**Megjegyzés**

Harci tapasztalat egy már veterán orknak; az Aréna és valós győzelmek közös iránya. Korlátlan +10%/ölés idézettekből túlgyorsulhat.

**Javasolt új működés**

Értékes/naturális ölés, egyértelmű plafon és veteránjelzés; ez legyen az orkok egyik mély saját útja.

**Kapcsolódó tartalom:** [Orkok – Aréna](orc.md#building-orc_arena), [Orkok – Párbajbajnokok](orc.md#legendary-idea_duel_champion)

</details>

<a id="legendary-orc_transfusion"></a>
<details>
<summary><strong>Vérátömlesztés</strong> · Meglévő · Átadás: Élőhalottak · P1</summary>

**Jelenlegi hatás**

Az életlopás túlgyógyításának 30%-át a legközelebbi, 80 hatótávon belüli sérült szövetséges kapja.

**L4 / halmozás**

Egyszer választható.

**Ár / hely / előfeltétel**

Előfeltétel: Legalább egy saját ork életlopásforrás.
Ár: egy megfelelő választás, nincs külön nyersanyagár.

**Megjegyzés**

Életlopás túlgyógyításából közeli szövetséges gyógyul; a Vámpír Vértestvériségének más feltételű változata.

**Javasolt új működés**

A vámpíros irányba olvasztani, az ork lap helyére fizikai nyomás vagy sámáni zavarás jöjjön.

**Kapcsolódó tartalom:** [Élőhalottak – Vámpírkastély](undead.md#building-und_vampire_castle)

</details>

<a id="legendary-orc_siege_loot"></a>
<details>
<summary><strong>Ostromzsákmány</strong> · Meglévő · Átdolgozás · P1</summary>

**Jelenlegi hatás**

Lerombolt ellenséges tornyonként +1 szint egy saját épülettípusnak, legfeljebb L4-ig.

**L4 / halmozás**

Egyszer választható.

**Ár / hely / előfeltétel**

Előfeltétel: Ork faj; jelenleg nincs külön további épületfeltétel.
Ár: egy megfelelő választás, nincs külön nyersanyagár.

**Megjegyzés**

Ellenséges toronyért saját épületszint, az emberi ingyenes céhes technológiát adja új triggerrel.

**Javasolt új működés**

Anyagi zsákmány/fogoly/elfoglalt ostrompozíció lehet saját ork jutalom; a technológiai szintlépés az emberi tervezésé maradjon.

**Kapcsolódó tartalom:** [Emberek – Mesterek Céhe](human.md#building-mastersguild), [Orkok – Zsákmányudvar](orc.md#building-idea_loot_yard)

</details>

<a id="legendary-orc_skip_power"></a>
<details>
<summary><strong>Megvetett zsákmány</strong> · Meglévő · Átdolgozás · P1</summary>

**Jelenlegi hatás**

Minden kihagyott választás után az ork egységek +4% életerőt és sebzést kapnak.

**L4 / halmozás**

Egyszer választható.
Első felvétel: Életerő és sebzés / kihagyás: 0% → +4%

**Ár / hely / előfeltétel**

Előfeltétel: Legalább 1 katonai termelő.
Ár: egy megfelelő választás, nincs külön nyersanyagár.

**Megjegyzés**

Kihagyott választásból korlátlan +4% HP/sebzés. A Totem újabb ingyenes választásaiból is gyűlhet; a lapgazdasági tervezés eredetileg inkább emberi.

**Javasolt új működés**

Ha marad ork, csak valóban feladott értékből és körönként plafonnal működjön; a Totem-üzemi áldozatból újra gyártott kihagyás ne növelje ingyen a sereget.

**Kapcsolódó tartalom:** [Orkok – Ősök Toteme](orc.md#building-orc_totem), [Emberek – Szakosodás](human.md#legendary-specialization)

</details>

<a id="legendary-orc_enemy_ancestors"></a>
<details>
<summary><strong>Ellenségvér az ősöknek</strong> · Meglévő · Átdolgozás · P1</summary>

**Jelenlegi hatás**

Minden harcban elesett ellenség +1 halálpontot ad az Ősök Totemének.

**L4 / halmozás**

Egyszer választható.

**Ár / hely / előfeltétel**

Előfeltétel: Ősök Toteme.
Ár: egy megfelelő választás, nincs külön nyersanyagár.

**Megjegyzés**

Az ellenfél minden harci halála 1 pont, még Trollé is. A Lélekaratóhoz és saját halál-totemhez hasonló tömeghalál-számlálót szélesít.

**Javasolt új működés**

Dicsőség/ellenséges bajnokért járó trófea legyen; a kiképzett és idézett ellenfél, illetve tényleges egységérték különüljön el.

**Kapcsolódó tartalom:** [Orkok – Ősök Toteme](orc.md#building-orc_totem), [Élőhalottak – Lélekarató](undead.md#building-und_soul_harvester)

</details>

<a id="legendary-idea_shield_breakers"></a>
<details>
<summary><strong>Pajzszúzók</strong> · Új ötlet · Új ötlet · P1</summary>

**Jelenlegi hatás**

Nincs a játékban. Tervezési jelölt; az esetleges számok kipróbálandó kezdőértékek.

**L4 / halmozás**

Egyszeri lap, rögzített többlet-pajzsbontási arány; kitérés és elsőtalálat-kivédés nem pajzs.

**Ár / hely / előfeltétel**

Előfeltétel / terv:
Harci tábor és tényleges ellenséges numerikus pajzsforrás.

**Megjegyzés**

Konkrét ork erőszakos ellenszer a pajzsra, nem globális +sebzés.

**Javasolt új működés**

A Harcos közelharci találata a numerikus pajzsot külön erősebben bontja. A többlet nem folyik át életerősebzésbe.

Korlát / értelmezés: Egyszeri lap, rögzített többlet-pajzsbontási arány; kitérés és elsőtalálat-kivédés nem pajzs.

**Kapcsolódó tartalom:** [Emberek – Páncélkovács](human.md#building-armorsmith), [Élőhalottak – Túlvilági oltalom](undead.md#legendary-und_first_guard)

</details>

<a id="legendary-idea_spell_disruption"></a>
<details>
<summary><strong>Varázsrontás</strong> · Új ötlet · Új ötlet · P2</summary>

**Jelenlegi hatás**

Nincs a játékban. Tervezési jelölt; az esetleges számok kipróbálandó kezdőértékek.

**L4 / halmozás**

Kiinduló terv 1,5 mp, célpontonként legalább 6 mp újraalkalmazási szünet; nem töröl már lejátszódott idézést.

**Ár / hely / előfeltétel**

Előfeltétel / terv:
Sámántábor és megfelelő ellenséges Pap/Nekromanta-képesség.

**Megjegyzés**

Új célzott némítás, nem Mágus-fagyasztás vagy a meglévő −AS átok másolata.

**Javasolt új működés**

A Sámán találata rövid időre megakadályozhat új gyógyító vagy idéző képesség indítását. A célpont alapfegyveres támadása és mozgása nem áll le.

Korlát / értelmezés: Kiinduló terv 1,5 mp, célpontonként legalább 6 mp újraalkalmazási szünet; nem töröl már lejátszódott idézést.

**Kapcsolódó tartalom:** [Orkok – Sámántábor](orc.md#building-orc_shaman), [Emberek – Pap](human.md#unit-priest), [Élőhalottak – Nekromanta](undead.md#unit-und_necromancer)

</details>

<a id="legendary-idea_open_wounds"></a>
<details>
<summary><strong>Nyílt sebek</strong> · Új ötlet · Új ötlet · P2</summary>

**Jelenlegi hatás**

Nincs a játékban. Tervezési jelölt; az esetleges számok kipróbálandó kezdőértékek.

**L4 / halmozás**

A sebzés és a pontszám növekedése külön plafonos; megszakadt közelharcnál a rendes csökkenés azonnal visszatér.

**Ár / hely / előfeltétel**

Előfeltétel / terv:
Harcos/vérzésforrás és legalább 2 közelharci termelő.

**Megjegyzés**

Fenn kell tartani a közelharcot, nem elég egy távoli Goblin és egy nagyobb sebzésbónusz.

**Javasolt új működés**

Az ellenség vérzése rövid ideig nem csökken, amíg legalább két valódi ork közelharcos ténylegesen nyomás alatt tartja.

Korlát / értelmezés: A sebzés és a pontszám növekedése külön plafonos; megszakadt közelharcnál a rendes csökkenés azonnal visszatér.

**Kapcsolódó tartalom:** [Orkok – Vérző sebek](orc.md#normal-orc_bleed), [Orkok – Vérszomjas lövedékek](orc.md#legendary-orc_gob_blood)

</details>

<a id="legendary-idea_duel_champion"></a>
<details>
<summary><strong>Párbajbajnokok</strong> · Új ötlet · Új ötlet · P2</summary>

**Jelenlegi hatás**

Nincs a játékban. Tervezési jelölt; az esetleges számok kipróbálandó kezdőértékek.

**L4 / halmozás**

Az ellenfél névleges képzési súly/HP küszöbét rögzíteni; idézet, már számolt újraéledés és saját áldozat nem érdem. Egységenként egy előléptetés.

**Ár / hely / előfeltétel**

Előfeltétel / terv:
Harci tábor és Aréna; az Aréna-átalakítás egyik iránya.

**Megjegyzés**

Valódi harci teljesítményből elit, az emberi helyőrségi várakozás és a véletlen Aréna helyett.

**Javasolt új működés**

Egy még nem veterán Harcos az egyértelműen nála értékesebb, természetesen kiképzett ellenfél legyőzésével egyszer veteránná válhat.

Korlát / értelmezés: Az ellenfél névleges képzési súly/HP küszöbét rögzíteni; idézet, már számolt újraéledés és saját áldozat nem érdem. Egységenként egy előléptetés.

**Kapcsolódó tartalom:** [Orkok – Aréna](orc.md#building-orc_arena), [Emberek – Harctéri kiképzés](human.md#legendary-long_training)

</details>

<a id="legendary-idea_living_roller"></a>
<details>
<summary><strong>Élő úthenger</strong> · Új ötlet · Új ötlet · P3</summary>

**Jelenlegi hatás**

Nincs a játékban. Tervezési jelölt; az esetleges számok kipróbálandó kezdőértékek.

**L4 / halmozás**

Célpontonként rövid lökéskorlát, tömeg/súly feltétel; Falanx, torony és főváros megállítja. Maximum-közeli aktorszámnál teljesítménypróba kell.

**Ár / hely / előfeltétel**

Előfeltétel / terv:
Trollverem.

**Megjegyzés**

A nagy óriás helyet csinál, nem újabb mindenharmadik-csapás körsebzés. A Katapult lökése egyszeri távoli találat, nem folyamatos előrenyomulás.

**Javasolt új működés**

A mozgó Troll a túl kicsi ellenséges testeket lassan félretolja a saját útjából, extra sebzés nélkül.

Korlát / értelmezés: Célpontonként rövid lökéskorlát, tömeg/súly feltétel; Falanx, torony és főváros megállítja. Maximum-közeli aktorszámnál teljesítménypróba kell.

**Kapcsolódó tartalom:** [Orkok – Trollverem](orc.md#building-orc_troll), [Emberek – Ostromlökés](human.md#legendary-catapult_knockback)

</details>

<a id="legendary-idea_siege_wedge"></a>
<details>
<summary><strong>Kiékelt szerkezet</strong> · Új ötlet · Új ötlet · P2</summary>

**Jelenlegi hatás**

Nincs a játékban. Tervezési jelölt; az esetleges számok kipróbálandó kezdőértékek.

**L4 / halmozás**

Csak egy kos hatása számít tornyonként; kapcsolat megszakadásakor megszűnik. Extra lövedék nélkül nem kínálható.

**Ár / hely / előfeltétel**

Előfeltétel / terv:
Faltörő műhely és ellenséges extra-lövedékes toronyfejlesztés.

**Megjegyzés**

Közelharci ork ostrom ellenlépés az emberi Sortűzre, nem minden egység globális +épületsebzése.

**Javasolt új működés**

A toronnyal ténylegesen érintkező kos ideiglenesen leállítja annak extra lövedékeit; az alaplövés megmarad. A kosnak az épületnél kell maradnia.

Korlát / értelmezés: Csak egy kos hatása számít tornyonként; kapcsolat megszakadásakor megszűnik. Extra lövedék nélkül nem kínálható.

**Kapcsolódó tartalom:** [Emberek – Sortűz](human.md#legendary-tower_salvo), [Orkok – Erődrombolók](orc.md#normal-orc_siege_damage)

</details>

<a id="legendary-idea_hooked_javelin"></a>
<details>
<summary><strong>Horgas gerely</strong> · Új ötlet · Új ötlet · P3</summary>

**Jelenlegi hatás**

Nincs a játékban. Tervezési jelölt; az esetleges számok kipróbálandó kezdőértékek.

**L4 / halmozás**

Csak első dobás, legfeljebb 2–3 m próbaérték; nehéz/ostrom célpontokra nincs rántás. Egy célpontra rövid közös védelem a láncolt több-Warg húzás ellen.

**Ár / hely / előfeltétel**

Előfeltétel / terv:
Wargkarám.

**Megjegyzés**

A Warg saját fegyverének új használata, nem az emberi sebességből töltött lovasroham.

**Javasolt új működés**

A Warg nyitó gerelye egy könnyű ellenfelet kis, meghatározott távolsággal maga felé ránt; nem teleportál és nem szúr át korlátlanul mindenkin.

Korlát / értelmezés: Csak első dobás, legfeljebb 2–3 m próbaérték; nehéz/ostrom célpontokra nincs rántás. Egy célpontra rövid közös védelem a láncolt több-Warg húzás ellen.

**Kapcsolódó tartalom:** [Orkok – Warglovas](orc.md#unit-orc_warg), [Emberek – Elsöprő roham](human.md#legendary-cavalry_charge)

</details>

<a id="legendary-idea_stubborn_swing"></a>
<details>
<summary><strong>Makacs lendület</strong> · Új ötlet · Új ötlet · P2</summary>

**Jelenlegi hatás**

Nincs a játékban. Tervezési jelölt; az esetleges számok kipróbálandó kezdőértékek.

**L4 / halmozás**

Egyetlen megőrzött ütés, rövid lejárat; újra kábítás nem tölt egymásra több ütést. Animáció és sebzési pillanat együtt ellenőrizendő.

**Ár / hely / előfeltétel**

Előfeltétel / terv:
Dühöngők tábora. A Halálmegvetés CSERÉJE is lehet, nem szükséges mindkettő.

**Megjegyzés**

Még élő fájdalomtűrés a halál utáni három másodperces harc helyett. Nem immunitás és nem ingyen új támadás.

**Javasolt új működés**

A Dühöngő kábítással megszakított, már megkezdett ütésének előkészülete részben megmarad. A kábítás végét ki kell várnia.

Korlát / értelmezés: Egyetlen megőrzött ütés, rövid lejárat; újra kábítás nem tölt egymásra több ütést. Animáció és sebzési pillanat együtt ellenőrizendő.

**Kapcsolódó tartalom:** [Orkok – Dühöngők tábora](orc.md#building-orc_bers), [Orkok – Hadidobok](orc.md#building-idea_war_drums)

</details>

<a id="legendary-idea_encirclement"></a>
<details>
<summary><strong>Falkaharapófogó</strong> · Új ötlet · Új ötlet · P3</summary>

**Jelenlegi hatás**

Nincs a játékban. Tervezési jelölt; az esetleges számok kipróbálandó kezdőértékek.

**L4 / halmozás**

A szög/távolság feltétele látható legyen; nincs célponthoz teleport, toronykerülés vagy kitérés teljes nullázása.

**Ár / hely / előfeltétel**

Előfeltétel / terv:
Legalább 2 közelharci termelő és ellenséges kitérésforrás.

**Megjegyzés**

Térbeli erőszakos körülzárás, nem az emberi soralakzat statbónusza. Nem növeli mindenkivel szemben a nyers sebzést.

**Javasolt új működés**

Ha egy ellenséget ténylegesen két ellentétes oldalról ér el ork közelharcos, csökken a kitérési esélye, amíg a bekerítés fennáll.

Korlát / értelmezés: A szög/távolság feltétele látható legyen; nincs célponthoz teleport, toronykerülés vagy kitérés teljes nullázása.

**Kapcsolódó tartalom:** [Élőhalottak – Szellem](undead.md#unit-und_ghost), [Emberek – Falanksz](human.md#legendary-phalanx)

</details>

<a id="legendary-idea_stolen_blessing"></a>
<details>
<summary><strong>Elrabolt áldás</strong> · Új ötlet · Új ötlet · P2</summary>

**Jelenlegi hatás**

Nincs a játékban. Tervezési jelölt; az esetleges számok kipróbálandó kezdőértékek.

**L4 / halmozás**

Fehérlista: nincs permanens fejlesztés, elsőtalálat-védelem vagy újratöltött életmentés. Egy buffot egyszer lehet áttenni, időt nem frissít.

**Ár / hely / előfeltétel**

Előfeltétel / terv:
Sámántábor és ellenséges eltávolítható buff. Az Átoktörés helyét foglalná el.

**Megjegyzés**

A zsákmányoló rontás iránya, az Átoktörés tényleges ALTERNATÍVÁJA; nem második azonos dispel-lap.

**Javasolt új működés**

A Sámán egy eltávolított ideiglenes ellenséges buffot egy közeli orknak adhat, csak a hátralévő idővel.

Korlát / értelmezés: Fehérlista: nincs permanens fejlesztés, elsőtalálat-védelem vagy újratöltött életmentés. Egy buffot egyszer lehet áttenni, időt nem frissít.

**Kapcsolódó tartalom:** [Orkok – Átoktörés](orc.md#legendary-orc_dispel), [Orkok – Véletlen áldás](orc.md#normal-orc_blessing)

</details>

<a id="legendary-idea_war_wagon"></a>
<details>
<summary><strong>Harci szekér</strong> · Új ötlet · Új ötlet · P3</summary>

**Jelenlegi hatás**

Nincs a játékban. Tervezési jelölt; az esetleges számok kipróbálandó kezdőértékek.

**L4 / halmozás**

Maximum 4 lövő utas mint próba; minden utas sereghelyet foglal, nem lő külön a pályán is. A kos és utas tényleges teljes ára számít.

**Ár / hely / előfeltétel**

Előfeltétel / terv:
Trójai kos és Goblin-tábor.

**Megjegyzés**

Mozgó hordozó, nem az emberi falból lövő helyőrség új neve: az ostromgéphez és valós utasokhoz kötött.

**Javasolt új működés**

A Trójai kos kevés bent ülő Goblinja útközben is tüzelhet, a bent lévő katonák csökkentett erejével és közös célelszámolással.

Korlát / értelmezés: Maximum 4 lövő utas mint próba; minden utas sereghelyet foglal, nem lő külön a pályán is. A kos és utas tényleges teljes ára számít.

**Kapcsolódó tartalom:** [Orkok – Trójai kos](orc.md#legendary-orc_trojan), [Emberek – Őrház](human.md#building-guardhouse)

</details>

<a id="legendary-idea_prisoners"></a>
<details>
<summary><strong>Fogolyejtők</strong> · Új ötlet · Új ötlet · P3</summary>

**Jelenlegi hatás**

Nincs a játékban. Tervezési jelölt; az esetleges számok kipróbálandó kezdőértékek.

**L4 / halmozás**

Legfeljebb 1 fogoly/Warg, nincs főváros, ostrom vagy idézet. Testazonosító egyszer számít; az útvonali és haláleseti szabály új fejlesztést igényel.

**Ár / hely / előfeltétel**

Előfeltétel / terv:
Wargkarám és a Zsákmányudvar túszkezelő iránya.

**Megjegyzés**

Nem azonnali +2 nyersanyag minden ölésből. Az ork portyának harctéri távolléti ára van.

**Javasolt új működés**

A Warg egy alkalmas, természetesen kiképzett könnyű ellenfelet halálos ütés helyett foglyul ejthet. A fogoly hazakísérése időre kivonja a Wargot a frontból; csak valódi hazajutáskor jár zsákmány.

Korlát / értelmezés: Legfeljebb 1 fogoly/Warg, nincs főváros, ostrom vagy idézet. Testazonosító egyszer számít; az útvonali és haláleseti szabály új fejlesztést igényel.

**Kapcsolódó tartalom:** [Orkok – Zsákmányudvar](orc.md#building-idea_loot_yard), [Orkok – Hadizsákmány](orc.md#normal-orc_loot)

</details>
