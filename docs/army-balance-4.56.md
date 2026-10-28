# Egységbalance – 4.56.0

## Pontos változások

- Minden nem lovas egység mozgása +25%. A Lovag 14,7 m/s, a Warglovas 13,6 m/s marad. A gyorsítás az ostromgépekre és minden élőhalott egységre is vonatkozik. A meglévő mozgásbónuszok és lassítások az új alapra hatnak.
- Minden egység alapképzési ideje minden szinten +25%, így azonos termelőépület és gyorsítók mellett 20%-kal kevesebb egység készül másodpercenként. A párhuzamos kaszárnyasorok, előnézetek és AI-büdzsé ugyanezeket az értékeket használják.
- A 4.55-ös egységárak további +25%-ot kapnak. Az egész nyersanyagokra kerekítés miatt az egyedi árak eltérése kismértékben különbözhet. A táblázat a végleges alapárat mutatja; a meglévő kedvezmények ezután érvényesülnek.
- Nekromanta-idézés: 15 → 18,75 mp. Továbbra is 3 idézett egység, 10 mp alapélettartammal; a meglévő ágak és fejlesztések külön hatása megmarad.
- Goblin íjász legendás: sebzésbónusz +40% → +20%, hatótávbónusz +40% → +20%. A támadási sebesség −40%-os hátránya megmarad. Alap Goblin íjjal: 4,9 → 4,2 sebzés, 32,2 → 27,6 m hatótáv; 0,9167 mp támadási idő. A lendületbónusz is az új sebzésbónuszból számolódik.
- Mágus: a környező célpontok sebzése az elsődleges találat 70%-áról 45%-ára csökken. Alapon 16,8 → 10,8 sebzés; a másodlagos égés is ebből számolódik. Az elsődleges találat 24, a normál területi sugár 6,2 m.

## Egységenkénti táblázat

Az ár oszlop embereknél és orkoknál **fa / kő / élelem**, élőhalottaknál **Lélek**. A képzési idők **L1 / L2 / L3** alapszintekre vonatkoznak, gyorsítók nélkül. L4-nél a már meglévő választott ág hatása adódik hozzá.

### Emberek

| Egység | Mozgás, m/s | Egységár | Képzési idő, mp (régi → új) |
|---|---:|---|---|
| Kardos | 4,2 → 5,25 | 0 / 6 / 8 → 0 / 8 / 10 | 5 / 4 / 3 → 6,25 / 5 / 3,75 |
| Lándzsás | 4 → 5 | 6 / 0 / 8 → 8 / 0 / 10 | 5 / 4 / 3 → 6,25 / 5 / 3,75 |
| Íjász | 4,2 → 5,25 | 9 / 0 / 7 → 11 / 0 / 9 | 6 / 4,8 / 3,6 → 7,5 / 6 / 4,5 |
| Lovag | 14,7 → 14,7 | 0 / 20 / 19 → 0 / 25 / 24 | 9 / 7,2 / 5,4 → 11,25 / 9 / 6,75 |
| Pap | 3,8 → 4,75 | 13 / 12 / 15 → 16 / 15 / 19 | 9 / 7,2 / 5,4 → 11,25 / 9 / 6,75 |
| Katapult | 2,4 → 3 | 33 / 26 / 11 → 41 / 33 / 14 | 12 / 9,6 / 7,2 → 15 / 12 / 9 |
| Mágus | 3,6 → 4,5 | 20 / 20 / 15 → 25 / 25 / 19 | 12 / 9,6 / 7,2 → 15 / 12 / 9 |

### Orkok

| Egység | Mozgás, m/s | Egységár | Képzési idő, mp (régi → új) |
|---|---:|---|---|
| Ork Harcos | 3,4 → 4,25 | 0 / 9 / 11 → 0 / 11 / 14 | 8,5 / 7,5 / 6,5 → 10,625 / 9,375 / 8,125 |
| Dühöngő | 4,2 → 5,25 | 5 / 8 / 10 → 6 / 10 / 13 | 8 / 7 / 6 → 10 / 8,75 / 7,5 |
| Goblin | 5,6 → 7 | 4 / 1 / 5 → 5 / 2 / 6 | 3,5 / 2,75 / 2 → 4,375 / 3,4375 / 2,5 |
| Warglovas | 13,6 → 13,6 | 6 / 20 / 23 → 7 / 25 / 29 | 11 / 10 / 9 → 13,75 / 12,5 / 11,25 |
| Sámán | 3,8 → 4,75 | 13 / 10 / 15 → 16 / 13 / 19 | 9 / 7,2 / 5,4 → 11,25 / 9 / 6,75 |
| Faltörő kos | 2 → 2,5 | 23 / 28 / 12 → 29 / 35 / 15 | 12 / 11 / 10 → 15 / 13,75 / 12,5 |
| Troll | 2,6 → 3,25 | 31 / 75 / 75 → 39 / 94 / 93 | 24 / 19,2 / 14,4 → 30 / 24 / 18 |

### Élőhalottak

| Egység | Mozgás, m/s | Egységár | Képzési idő, mp (régi → új) |
|---|---:|---|---|
| Csontváz | 4,2 → 5,25 | 13 Lélek → 16 Lélek | 5 / 4 / 3 → 6,25 / 5 / 3,75 |
| Csontváz Íjász | 4 → 5 | 13 Lélek → 16 Lélek | 5 / 4 / 3 → 6,25 / 5 / 3,75 |
| Zombi | 2,6 → 3,25 | 26 Lélek → 33 Lélek | 8 / 6,4 / 4,8 → 10 / 8 / 6 |
| Szellem | 4,6 → 5,75 | 18 Lélek → 23 Lélek | 6 / 4,8 / 3,6 → 7,5 / 6 / 4,5 |
| Nekromanta | 3,6 → 4,5 | 70 Lélek → 88 Lélek | 14 / 11,2 / 8,4 → 17,5 / 14 / 10,5 |
| Vámpír | 5 → 6,25 | 75 Lélek → 94 Lélek | 16 / 12,8 / 9,6 → 20 / 16 / 12 |
| Lich | 3,2 → 4 | 100 Lélek → 125 Lélek | 18 / 14,4 / 10,8 → 22,5 / 18 / 13,5 |

## Ellenőrzés és gyakorlati korlátok

A mozgást mind a 21 típusnál, mindkét oldalon tényleges elmozdulással ellenőrizzük. A képzési vizsgálat 40 valódi L1/L3 termelőhelyzetben ellenőrzi a teljes ciklus kivárását, az egyszeri pontos fizetést és az erőforrás-kijelzés egyezését. A mágus 45%-os másodlagos találata és égése a valódi becsapódási időpontban, a nekromanta új idézése pedig a régi és az új időhatáron is külön ellenőrzést kapott.

`npm run audit:tempo` hat védett távolsági összeállítást hasonlít közelharcos seregekhez, két maggal és tükrözött oldalakkal. Ezek kis, ellenőrzött minták, nem teljes frakciós győzelmi arányok. Az egyes nyersanyagokat nem tekintjük gazdaságilag azonos értékűnek.

A mintákban a mágusos sereg megmaradt erősnek, de több saját veszteséget szenvedett. A védett gobliníjászok a Warglovasok ellen már vesztes mintát is adtak, és a győztes mintákban is kevesebben maradtak. Az egyszerű emberi és csontvázíjászok a vizsgált összeállításokban nem mutattak általános fölényt, ezért az alap harci értékeikre ebben a körben nincs további külön nerf. Nagy, sok fejlesztéses multiplayer-csatáknál további játékosi visszajelzés szükséges.

A képzési idő és az ár hasonló arányú növelése miatt a teljes sebességen működő táborok másodpercenkénti nyersanyagigénye közel azonos maradhat; az elkészült egységek száma csökken. Az új sereg felépítése több időt és összesen több nyersanyagot kér.

A korábbi 750 aktív egység/oldal plafon és a 20 perces hirtelen halál érvényben marad. Multiplayer játékszabály-verzió: 8; mindkét játékos frissítsen. Város- és útgrafika ebben a kiadásban nem kerül be.
