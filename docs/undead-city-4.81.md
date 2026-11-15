# V4.81.0 – Élőhalott városi épületek

Mind a 18 jelenlegi épület saját, átlátszó hátterű városi rajzot kapott. A Nekropolisz, Lélekkút, Temető, Fantomkapu, Nekromanták szentélye, Vámpírkastély, Lichtorony, Sötét Őrtorony, Lélekbank, Lélekhorgony, Újjászületés sírja, Sírhatárkő és Túlvilági portál egy rögzített nézetet használ.

A Kripta, Hullaház, Csontkohó és Pestiskamra két külön, függőlegesen álló rajzot kapott a hosszú és rövid oldal felőli nézethez. A Holtak kertje mind a négy L alakú helyfoglaláshoz saját képet használ. A szabad sarok építhető marad; a megjelenítés nem forgatja el az egész festményt.

A három nép közös atlasznézet-választója szolgálja ki a várost és az építési előnézetet. A képregiszter tartalmazza az eredeti PNG-ket, veszteségmentes WebP változatokat, kivágási adatokat és SHA-256 ellenőrzőösszegeket. A játék csak a részt vevő frakciók városi készletét tölti elő. A kártyák, portrék és harcoló egységek képei nem változnak.

A korábbi GitHub-futtatás egy elavult elforgatási ellenőrzésen bukott el: négy CSS-elforgatást várt minden téglalaptól is. A teszt most a valódi, szimmetria szerint különböző elhelyezéseket vizsgálja. A közös városi ellenőrzés mindhárom nép 87 nézetét tényleges lerakással és építési előnézettel ellenőrzi; külön ellenőrzés védi az L alakú szabad mezőket és a forrásképek épségét.

A városrajzolás gyorsítótára most a frakciót is figyelembe veszi: azonos elrendezésű főépületnél sem maradhat a korábbi nép rajza a képernyőn egy új tesztmeccs vagy multiplayer állapotváltás után.

A gazdaság, egységértékek, AI-döntések és multiplayer szabályok változatlanok; a protokoll továbbra is 28.
