# V4.63.1 – Termelőhelyek és gazdasági nyitás

## Konkrét hibák

- A közös helykereső a `producerHasBonus` segédet használta, amely csak a három emberi termelőt ismerte. A Munkatábor erdő- és kőlelőhelybónusza nem kapott pontot.
- Embereknél az egy és több szomszédos erdő/kőlelőhely ugyanannyit ért, pedig a tényleges termelési bónusz összeadódik. A helyi termeléstámogatás sem került bele a termelőhely pontozásába.
- A tartós helygyorsítótárból hiányoztak a commonok és a stratégiai cél egyes elemei. A döntésen belüli gyorsítótárból a terep és a fejlesztések is hiányoztak.
- A nyitás egyetlen termelő után túl könnyen elégségesnek tekintette a gazdaságot. Teli kezdőkészletnél a beruházási bevételi cél az ötödére eshetett. Ez túl hamar terelte katonai kiadásokra az AI-t.

Kis bevételi hiánynál holtpont alakulhatott ki: a katonai építés még várt a célra, a következő szükséges termelő viszont a 0,1-es javítási küszöb alatt negatív pontot kapott. Most a tényleges nettó bevételjavulás számít; a katonai készenlét ugyanazt a 0,01-es tűrést használja, mint a növekedési cél.

## Változtatások

A `src/economy/producer-output.js` a valódi termelés és az AI által közösen használt, mellékhatás nélküli termelőképlet. Megőrzi a jelenlegi gazdasági értékeket: emberi terephalmozás, termékeny föld, céhbónuszok; ork kétféle termelés, L4 ág, ősi lelőhely, rabszolgatábor és vadászházi bónuszok. Az AI az összes engedett forgatást vizsgálja, és a tényleges hozam alapján rangsorol. Szabad bónuszos hely hiányában normál helyre is építhet.

A nyitási újrabefektetés akkor erősebb, amikor a tényleges védőtornyok még biztonságot adnak, a meccs első három percében, legfeljebb 60 beépített mezőig. Ilyenkor a termelőár 12 másodpercnyi, az alap katonai épület ára 18 másodpercnyi bevétellel szerepel a célban. A teli kincstár ezt a beruházási részt legfeljebb 15%-kal mérsékli. A képzési fogyasztás külön, teljes értékkel számít; az élelem továbbra is a tényleges képzési igényt követi. Megmarad a következő szükséges termelőre félretett keret és a veszélyhelyzeti védekezés elsőbbsége.

A közös AI mindhárom népnél és az AI–AI mód mindkét oldalán ezt használja. Az épületárak, termelési együtthatók és multiplayer szabályok nem változtak.

## Valódi meccsek

Mindkét verzióban három, egyenként 15 játékperces normál AI–AI meccs futott: ember–élőhalott, ork–ember és élőhalott–ork, 42-es kezdőmaggal. A valós választási, fizetési, építési, képzési és harcrendszer működött; nem adtunk ajándék pénzt vagy sereget. Köztes mérésként a puszta elhelyezésjavítással is lefutott három ötperces meccs.

A régi verzió 11 Munkatáborából **6** esetén volt szabad, szabályos, nagyobb hozamú hely. A végső verzió **12-ből 12** alkalommal a legjobb elérhető összhozamot választotta. Konkrét példa: a 175. másodpercnél választott tábor 4,4 nyersanyag/mp-t adott, miközben egy szabad hely 8,8-at adott volna; romeltakarítás nélkül.

| AI és ellenfél | Termelők a 2. percnél, régi → új | Beépített mezők az 5. percnél | Beépített mezők a 9. percnél |
| --- | ---: | ---: | ---: |
| Ember, élőhalott ellen | 2 → 4 | 50 → 41 | 89 → 94 |
| Ember, ork ellen | 2 → 2 | 51 → 50 | 78 → 95 |
| Ork, ember ellen | 1 → 2 | 36 → 45 | 62 → 88 |
| Ork, élőhalott ellen | 2 → 6 | 39 → 40 | 72 → 86 |

Ez erősebb korai termelőfókuszt és a két ork esetben gyorsabb beépülést mutat. Az emberi ötperces kitöltés nem javult minden esetben. Az élőhalottak is több időt költhettek újrabefektetésre; a régi 3–4 perc helyett 6–7 perc körül teltek meg, és a 9. percre mindkét város teljes volt. A város kitöltése önmagában nem a build harcereje.

Az eltérő döntések a további lapokat és a harci véletleneket is megváltoztatják, ezért az azonos kezdőmag nem jelent végig azonos leosztást. Ezek minták, nem győzelmi arányok és nem ígéret arra, hogy minden leosztás gyorsabb lesz. A 15. percnél mindkét verzió mérkőzései még tartottak. Az összesített adatok: [audit JSON](audits/ai-placement-4.63.1.json).

## Ellenőrzés

Az új `tests/ai-producer-placement.cjs` 19 ellenőrzést futtat: kétoldali terepbónuszok, valós jövedelem, több lelőhely, fal és termékeny föld, céhbónusz, L4 és common együtthatók, gyorsítótár-frissítés, elzárt bónuszhely, valódi nyitási AI-kör, valamint változatlan játékállapot és véletlenszám-sorozat. A további öt célzott AI tesztcsomaggal és a kapacitásvizsgálattal összesen 132 ellenőrzés sikerült; a meccsauditok nem jeleztek futási hibát.

Újrafuttatás: `npm run build`, majd `node scripts/test.cjs tests/ai-producer-placement.cjs`. A meccsméréshez `ROADLORDS_AI_SECONDS=900 ROADLORDS_AI_TAG=placement npm run audit:ai-matches`. Az audit kizárólag kézzel indítható fejlesztői eszköz; a játék nem exportál automatikusan meccsnaplót.
