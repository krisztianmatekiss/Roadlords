# Tömegharc – 4.55.0

Az első javítási szakasz a hibás túlcélzást, elvesző lövedékeket, saját csapaton belüli torlódást és nagy seregek költséges kezelését célozza. A távolsági egységek statisztikái, ára és képzési ideje ebben a szakaszban változatlan, hogy a működési javítások után legyen mérhető alap a külön balance-hoz.

## Ellenőrzés

`node scripts/test.cjs tests/mass-battle.cjs` a valódi harcrendszerrel ellenőrzi a 120 Goblin / 6 lovas helyzetet, alternatív célpontokat, pajzsot és páncélt, megszakadt előkészítés foglalásának felszabadítását, öt különböző kilőtt távolsági támadás becsapódását a lövő halála után, a lich áthaladását 150 nekromantán, mindhárom faj 750-es plafonját és az idézések/átváltoztatások korlátozását. Valódi állapotcsomaggal ellenőrzi a vendégnél megjelenő, lövő nélküli lövedéket is.

`npm run audit:battle` 500, 750 és 2000 egységet állít fel oldalanként a húszperces játékidő után. Goblin íjász / lovas tömeg, nagyon magas HP-val: a terhelést a kezdeti egységszám csökkenése nem rejti el. Harci lépés, rajzolás, közelségi vizsgálatok, valóban elküldött JSON állapotcsomag és sprite-pixelek külön szerepelnek az `artifacts/mass-battle-current.json` jelentésben. A 2000-es helyzet csak a diagnosztikai módban engedélyezett.

Az azonos gépen futtatott összevetésben a 750 vs 750 helyzet átlagos harci lépése 54,1 ms-ról körülbelül 10–13 ms-ra csökkent. Az ugyanilyen helyzet tényleges JSON állapotcsomagja 681 kB helyett 211 kB (kb. −69%). A kirajzolás továbbra is jelentős tétel; a szoftveres, fej nélküli Chromium eredménye nem garantál felhasználói gépen 60 FPS-t.

Egy további, 25 szimulált perces folyamatos harc 128 állandó, nagy HP-jú szereplővel, 0,2 másodperces lépésekben 243 ezer támadást futtatott le. A függő támadások száma legfeljebb 123, a sprite-pixelkeret használata 4,8 MiB volt; minden pozíció és HP véges maradt. Ez ellenőrzött harci terhelés, nem teljes húszperces multiplayer-meccs vagy frakciós győzelmiarány-mérés. Két böngészőlap között a valódi játékprotokoll JSON átadása sikeres; a külön WebRTC-próba a környezetben ICE-jelölt hiányában nem tudott kapcsolatot felépíteni.

## Szabályok és korlátok

- A célzási foglalás becslés: nem sorsol előre kitérést, kritikus találatot vagy másodlagos hatásokat. A célpont elmozdulása, halála vagy kitérése miatt továbbra is lehet eredménytelen lövés. Kilőtt lövedék nem ugrik át önkényesen egy másik ellenfélre.
- A provokáció megtartja a célpontválasztási elsőbbségét. A sebzés, állapothatások, életlopás és csapattulajdonlás a meglévő harcszabályokon fut keresztül; a halott lövő nem éled újra a becsapódástól.
- A 750-es korlát a tényleges szereplőkre vonatkozik. A Troll továbbra is négy sereghely, a megfelelő Goblin-ág fél sereghely. A szállított utasok számára előre foglalt hely kell, hogy kiszálláskor se lehessen átlépni a korlátot.
- A 64 MiB a renderelt sprite-képek pixelkerete; nem a böngésző teljes memóriafogyasztásának felső határa. Az atlaszok, városképek, hálózati adatok és a böngésző saját költsége ezen felül jelentkezik.
- Az idézés telített pályán nem hoz létre új egységet. A már meglévő, fizetett kapusor várakozik és veszteség után folytatódik. A helyőrségre saját kapacitása vonatkozik.

## Következő szakaszok

1. A javított célzással összehasonlítani a közelharci és távolsági seregeket, beleértve a költséget, termelőépület-területet, gyorsítókat és ingyenes idézéseket. Ebből véglegesíteni az egységár/képzési idő és távolsági nerf értékeit.
2. Felmérni az aktuálisan választható common/legendás kínálatot, majd a hiányzó stratégiai lehetőségeket bővíteni.
3. Három faj város- és útgrafikai terve: külön csapatszínrétegek, a játék tényleges területfüggvényét követő átmenetek, két élőhalott fél befolyásának átfedésével együtt.
