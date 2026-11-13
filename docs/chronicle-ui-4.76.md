# 4.76 — A hadvezérek atlasza

## Játékkép

- Mindhárom faj saját, egyben megrajzolt várfalat kapott, összeillő sarkokkal és két beépített kapubástyával. A kapuszárnyak a bástyák felé csúsznak; a kaputorony továbbra is a valódi, rombolható toronyhoz kapcsolódik.
- A 10×10-es építési rács és a meglévő épület-/egységképek megmaradtak. A fal a rácsot körülveszi, nem annak sarkaira vágott darabokból készül.
- Az út felső és alsó széle a város külső méretéhez igazodik. A kapuból kifutó burkolat és a folytonos nyomok összekötik a várost az úttal.
- Ritkább felső környezet; díszítés nélküli alsó talaj az eseménysáv mögött. A régi, ötvenméterenként megjelenő alsó feliratok eltűntek ebből a nézetből.
- Az élőhalott út külön, kontrasztos kőburkolatot használ. A rajzoló visszaállítja az átlátszóságot, a kompozitálást és a filtert; a kiválasztott torony hatótávja halványabb kitöltéssel jelenik meg.
- A főmenü egy hadvezéri atlasz: bal oldalon a működő menüpontok, jobb oldalon a három nép városai egy közös útra felfűzve. Kisebb ablaknál tömör, olvasható elrendezésre vált.

## Hosszú meccsek lassulása

A fázisoló szellemek ütközésvizsgálata minden egységpárhoz újabb környezeti keresést indított a lándzsás Bástya-ágának ellenőrzésére. Ez ork ellen is megtörtént, ahol ilyen blokkoló nem létezhet. A keresés csak megfelelő ellenséges ág jelenlétében indul; a geometriai elutasítás megelőzi a drágább képességvizsgálatokat. A valódi Bástya továbbra is blokkolja a szellemeket.

Kontrollált, azonos véletlenmaggal futtatott élőhalott–ork terheléspróba: a tornyok és fővárosok megnövelt HP-ja megakadályozta a korai befejezést. Percenként 600 darab 0,1 másodperces szimulációlépést mértünk, kirajzolás nélkül. Ez reprodukálható terheléspróba, nem természetes meccseredmény vagy minden gépre érvényes FPS-ígéret.

| 22. játékperc | Előtte | Utána |
| --- | ---: | ---: |
| Aktív egységek | 837 | 863 |
| Szimulációlépés mediánja | 155,4 ms | 19,4 ms |
| Szimulációlépés 95. percentilise | 352,8 ms | 32,2 ms |
| Ütközésszétválasztás összideje 600 lépésnél | 78 714 ms | 1 270,5 ms |

A kirajzolás nagy tömegben kihagyja a takarásban lévő testek egy részét, ritkítja a támadást előkészítő/levezető képkockákat, és legfeljebb 30 képet fest másodpercenként. A találati képkockák megmaradnak. Szünetben a változatlan kép újrahasználható, főmenü mögött nem rajzolódik a csata. A szimuláció, a hálózati ütem, az egységszám, az életerő és a célzás ettől nem változik; az alsó áttekintő minden egységet számol.

Külön, azonos 800 vegyes egységes jelenetben a testkirajzolások száma 800-ról 252-re csökkent képenként; a bemelegített rajzolás mediánja 6,7-ről 4,7 ms-ra csökkent a helyi headless Chromiumban. A teljes futási idő gép- és meccsfüggő; a gazdaság és az AI számítási költsége továbbra is létezik.

## Ellenőrzés

- Új teljesítményregresszió: fázisoló egységek, valódi Bástya-blokkolás, takarási ritkítás mellett változatlan egységállapotok és áttekintő, szünet/menü, átlátszóság és üres előtér.
- A játék menüjéből indított négyperces AI–AI meccs; négy ablakméret, három faj, valódi toronykattintás, csoportosított áttekintő.
- Harc, frakciókölcsönhatások és multiplayeres tükrözés külön ellenőrzése.

A forrás PNG-k és a kisebb WebP-k együtt megmaradnak. Az új környezet ugyanazon a rajzolón keresztül működik normál játékban, multiplayerben és a tesztekben. Balansz- és szabályverzió-változás nincs.
