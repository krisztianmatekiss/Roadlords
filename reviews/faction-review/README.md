# Roadlords — a három faj részletes áttekintése

**4.56.0 · 2026. október 28. · Tervezési munkafüzet, nem beépített módosításcsomag.**

## Megnyitás

- **[Excel-munkafüzet letöltése — 3 külön munkalap](Roadlords_Fajok_4.56_Melyelemzes.xlsx?raw=true)** · kb. 145 KB.
- [Az Excel fájloldala](Roadlords_Fajok_4.56_Melyelemzes.xlsx) — a jobb felső letöltésgombbal is elérhető.
- **[Háromfüles HTML-olvasó letöltése](Roadlords_Fajok_Attekintes.html?raw=true)** — mentsd el, majd nyisd meg böngészőben. Önálló fájl, nincs külső könyvtár vagy képletöltés; keresés, szűrés és fajok közötti kattintható kapcsolatok is vannak benne.

**Letöltés nélkül, itt a GitHubon olvasható változatok:** [Emberek](human.md) · [Orkok](orc.md) · [Élőhalottak](undead.md). A sorok lenyithatók, és egymásra is hivatkoznak.

## Mi szerepel benne?

| Munkalap | Meglévő épület | Egység | Common | Legendás | Értékelt új ötletváltozat |
|---|---:|---:|---:|---:|---:|
| Emberek | 27 | 7 | 28 | 59 | 14 |
| Orkok | 19 | 7 | 35 | 28 | 20 |
| Élőhalottak | 18 | 7 | 25 | 23 | 22 |

**283 meglévő tartalom és 56 megjelölt ötletváltozat, összesen 339 sor.** Az ötletváltozatok között 32 legendás, 19 Common és 5 épület szerepel. Nem mind egyszerre beépítendő: az átvételek, egymást kizáró alternatívák és az elvetendő Csontpalánk külön jelöltek.

Mindhárom munkalapon:

- Rövid fajbemutató, jelenlegi egységválaszték, javasolt saját stratégiai irány és fő rendszerkockázatok.
- Minden épület jelenlegi alaphatása, valódi L4 ágai vagy egyenes L4 értéke. Ahol nincs L4, az is ki van írva.
- Jelenlegi építési ár, mezőigény, egyediség és élőhalott fenntartás. A termelőknél képzési ár és idő; az egységeknél méter és m/s.
- Minden jelenlegi Common és legendás, halmozási információval és előfeltétellel.
- Soronként külön döntési javaslat, indoklás, tervezett új hatás, prioritás és konkrét kapcsolódó tartalom, fajok között is.
- Az Excelben **Saját döntésed** legördülő lista és **Saját megjegyzésed** szabad szövegoszlop.

## Hogyan érdemes végigmenni rajta?

1. Először a három lap tetején lévő javasolt faji irányt nézzük meg. Az, hogy melyik fajé legyen egy mechanika, megelőzi a százalékok állítgatását.
2. Szűrj **Meglévő** + **Épület** vagy **Legendás** tartalomra, és nézd az **Átdolgozás / Törlésjelölt / Összevonás / Átadás** sorokat. A kapcsolódó sor első hivatkozása az Excelben is kattintható.
3. Ezután jöhetnek az **Új ötlet** sorok. A megjelölt csere- és alternatív ötleteket nem szabad a lecserélendő lap mellé még egy másolatként hozzáadni.
4. A **Saját döntésed** és **Saját megjegyzésed** oszlopba írhatsz. A cellák nincsenek védve.

Az első három oszlop és a fejléc rögzített. A táblázat szándékosan részletes és vízszintesen is görgethető; képernyős olvasáshoz a HTML négy szélesebb szövegoszlopba rendezi ugyanazt a tartalmat.

## Forrás és értelmezés

A futó 4.56.0-s build végleges adattáblái, **a fajspecifikus felülírásokkal együtt**. Nem a korábbi Excel-terv vagy egy történelmi balance-jegyzet. A teljes katalógus tartalmazza azokat a feltételes lapokat is, amelyek például Toronykezelők, korábbi Common-felvétel vagy Trójai kos nélkül még nem jelenhetnek meg. Ezért a számok nagyobbak a korábbi L1-es jogosultsági próbánál.

A főépületek L4-je fajspecifikus: embereknél Birodalmi központ/Hadifőváros, orkoknál Örök hódítás/Hadúr parancsa, élőhalottaknál Halálosztag/A holtak birodalma. A közös általános adattábla önmagában nem elegendő a kiolvasásukhoz.

Bizonyított szövegprobléma: a **Vérszomjas vadászat** jelenlegi lapleírása a Vadászház élelemtermelését veszi át, de a tényleges kód Warg-ölés utáni új lándzsadobást ad. A munkafüzetben a hibás szöveg és a tényleges működés is szerepel.

A jelenlegi alapárak és képzési adatok kedvezmények/terepbónuszok nélkül értendők. Különböző fajok nyersanyagösszege nem automatikusan egyenértékű. A kibocsátás/mező tájékoztató arány, nem egység- vagy fajerő-rangsor.

**A megjegyzések mechanikai és tervezési elemzések. Új győzelmiarány-mérés nem készült. Az új ötletek számai próbaértékek, a javasolt törlések és áthelyezések még nincsenek élesítve.** A közös alapszabályok — HP, egységkategória, elit/veterán — nem szűnnek meg; a párhuzamos, közel azonos épület- és kártyafunkciókat választjuk szét.

A munkafüzet visszaolvasását, teljes katalóguslefedettségét, azonosítóit, három lapját, szűrőit és belső hivatkozásait ellenőriztük. A HTML három fülét, keresését, szűrőit és fajok közötti navigációját böngészőben is kipróbáltuk.

Gépi forrás: [runtime.json](runtime.json), [review.json](review.json). Újraépítés: `python build_workbook.py` (openpyxl szükséges).
