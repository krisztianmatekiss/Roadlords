# Egységáttekintés – V4.71.0

A táblázat a futó játékból mért, fejlesztések nélküli L1 adatokat mutatja. A mágus új értékei szerepelnek benne. A többi egységnél a megjegyzés tervezési javaslat, nem végrehajtott módosítás. A Lélek nem azonos értékű egy fa/kő/élelem ponttal.

| Egység | HP | Sebzés / támadásköz | Egységár | Termelő L1 ciklusa | Termelő | Megjegyzés |
| --- | ---: | --- | --- | --- | --- | --- |
| Kardos | 100 | 12 / 1 mp | 8 kő + 10 élelem | 6,25 mp | 1 mező | Marad: olcsó, gyorsan pótolható alapgyalogos. |
| Lándzsás | 90 | 10 / 1,1 mp | 8 fa + 10 élelem | 6,25 mp | 1 mező | Marad: lovasság és ostrom ellen +100% sebzés. |
| Íjász | 55 | 5,5 / 1,2 mp | 11 fa + 9 élelem | 7,5 mp | 1 mező | Marad: alacsony HP, jó elérési távolság. |
| Lovag | 240 | 30 / 1,25 mp | 25 kő + 24 élelem | 11,25 mp | 2 mező | Marad: gyors flankelő, lándzsásokkal ellensúlyozható. |
| Pap | 90 | 6 / 1,4 mp | 16 fa + 15 kő + 19 élelem | 11,25 mp | 2 mező | Marad; a gyógyítást is számolni kell, nem csak a támadást. |
| Katapult | 220 | 12 / 2,4 mp | 41 fa + 33 kő + 14 élelem | 15 mp | 3 mező | Marad: az épületsebzése és hatótávja a fő értéke. |
| Mágus | 90 | 18 / 2 mp | 25 fa + 25 kő + 19 élelem | 15 mp | 4 mező · egyedi | Beállítva: kisebb sebzés, hatótáv és robbanás; 90 HP. |
| Ork Harcos | 300 | 20 / 1,25 mp | 11 kő + 14 élelem | 10,625 mp | 2 mező | Marad: egyedileg erős, két mező és lassabb utánpótlás. |
| Dühöngő | 220 | 16 / 0,65 mp | 6 fa + 10 kő + 13 élelem | 10 mp | 2 mező | Marad: erős sebzés, Harcosnál kisebb életerő. |
| Goblin | 30 | 3 / 0,55 mp | 5 fa + 2 kő + 6 élelem | 4,375 mp | 1 mező | Marad: olcsó utánpótlás, de csak 30 HP. |
| Warglovas | 400 | 30 / 1,5 mp | 7 fa + 25 kő + 29 élelem | 13,75 mp | 2 mező | Marad: nyitódobás + közelharc; a lándzsás ellensúlyozza. |
| Sámán | 170 | 8 / 2,5 mp | 16 fa + 13 kő + 19 élelem | 11,25 mp | 2 mező | Marad: az Átok támogatási értéke lényeges. |
| Faltörő kos | 1100 | 8 / 2 mp | 29 fa + 35 kő + 15 élelem | 15 mp | 2 mező | Marad: 1100 HP, közelről romboló ostromgép. |
| Troll | 3200 | 110 / 2 mp | 39 fa + 94 kő + 93 élelem | 30 mp | 9 mező · egyedi | Marad: 9 mező, egyedi épület és 4 sereghely korlátozza. |
| Csontváz | 85 | 10 / 1 mp | 16 Lélek | 6,25 mp | 1 mező | Marad: olcsó alapegység, távolsági fizikai ellenállással. |
| Csontváz Íjász | 85 | 8 / 1,25 mp | 16 Lélek | 6,25 mp | 1 mező | Marad: legendás átalakulás; nem szabad kezdő íjászként árazni. |
| Zombi | 280 | 12 / 1,8 mp | 33 Lélek | 10 mp | 2 mező | Marad egyelőre: lassú tank és halálméreg. |
| Szellem | 70 | 8 / 1,4 mp | 23 Lélek | 7,5 mp | 1 mező | Javaslat: sebzés 8 → 10. Most nincs átírva. |
| Nekromanta | 280 | 5 / 2 mp | 88 Lélek | 17,5 mp | 4 mező · egyedi | Javaslat: idézetek élettartama 10 → 12 mp. Most nincs átírva. |
| Vámpír | 600 | 45 / 1,25 mp | 94 Lélek | 20 mp | 4 mező · egyedi | Marad: magas HP és életlopás, de 4 mezős egyedi termelő. |
| Lich | 380 | 5 / 5 mp † | 125 Lélek | 22,5 mp | 4 mező · egyedi | Marad: a sugár erősödik és gyógyít; az 5/5 mp nem a tényleges DPS. |

A Csontváz Íjász a Temető 50%-os legendás átalakulása: a 6,25 mp-es alapciklusból átlagosan 12,5 mp-enként lesz íjász; közben Csontvázak is készülnek.

† A Lich 5 másodpercenként indít új kapcsolatot. Kapcsolatonként 5 sebzés/mp-ről indul, másodpercenként +2-vel erősödik, és az okozott tényleges sebzésből gyógyul. Az egyszerű sebzés/támadásköz osztás félrevezető.

## Amit a máguson túl érdemes módosítani

- **Szellem: 8 → 10 sebzés.** A Szellem 23 Lélek és 7,5 mp képzés; a Csontváz 16 Lélek és 6,25 mp. Közvetlen sebzésük másodpercenként 5,7, illetve 10. A 40%-os kitérés értékes, de a támadóereje kevés. A +25% sebzés óvatos első javítás lenne; a kitérését nem emelném.
- **Nekromanta: az ideiglenes Csontvázak 10 helyett 12 mp-ig éljenek.** Az idézés 18,75 mp-enként történik; a közelharcos idézetek a 24 m-es támadási távolságból kb. 4–5 mp-et pusztán odasétálással tölthetnek. A kicsit hosszabb élettartam több valódi harci időt adna, több idézet és gyorsabb idézési ütem nélkül.
- **Pap és Lich: egyelőre nincs alapstatisztika-nerf.** A Pap 30 HP-t gyógyít 4,2 mp-enként; a Lich folyamatosan erősödő kapcsolatokkal dolgozik. A két képességet a nyers támadási sebzésük nem tükrözi. A buildjeikkel együtt kell figyelni őket.
- **Troll és Vámpír: nincs további általános nerf.** A Troll 226 össznyersanyagba kerül, 30 mp-enként képezhető, 9 mezős egyedi termelőből jön, és 4 sereghely. A Vámpír 94 Lélek, 20 mp-es L1 képzés és 4 mezős egyedi termelő. A magas HP önmagában nem indok a további gyengítésre.

## Összehasonlító harcok és korlátok

48 alapállapotú harci minta és 24 mágusváltozat-próba készült. Mindkét oldalon 18 mezőnyi katonai termelő 60 másodperces hozama indul együtt. Az oldalak tükrözöttek; nincs torony, utánpótlás, fejlesztés vagy legendás. Az L3 a termelő szintjét jelenti. Az egységárakat és a fenntartást a vizsgálat külön rögzíti. Ezek összeállítási minták, nem az egyes népek általános győzelmi arányai.

A tömeges élőhalott mintákkal szemben még a legerősebb mágusnerf mellett is nagy emberi fölény maradt. Ezért az élőhalottak általános gyengeségét nem lehet pusztán a mágusra fogni, és az összes egység együttes drágítása/olcsósítása sem volna megalapozott.

Az ork vegyes minta L3-on a mérsékeltebb mágussal még emberi győzelmet hozott, az eredetileg javasolt 12 sebzéses változattal mindkét tükrözésben ork győzelmet. Ez támogatta a kisebb első nerfet. Egy adott összetétel eredménye nem igazolja minden ork vagy ember egység külön buffolását/nerfelését.

## Multiplayer javítás

A vendég a sikeres terepbontást azonnal elküldi, mielőtt egy már úton lévő régi snapshot felülírhatná. A régi/ismételt vendégparancsokat a host nem alkalmazza újra. A regresszió mindhárom népnél valódi mezőkattintást, azonnal utána régi snapshotot, későbbi nyugtázást, egyszeri díjat/jutalmat, régi csomag ismétlését és sikertelen fizetést is ellenőriz. A csomagokat két helyi böngészőoldal között kézzel kézbesíti; ez nem két távoli gép WebRTC-kapcsolatának mérése.
