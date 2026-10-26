# V4.53.0 – Teljes emberi városi grafika

A három elfogadott minta mellé 24 további emberi épület térképi képe készült. Mind a 27 aktív emberi épülettípus szerepel, a Főépület is. A fővárosi várnak négy kerek saroktornya, kék tetős szárnyai és belső udvara van. A Haditanács szögletes tornyai, a Mágustorony kristályai, a Könyvtár arany könyve, az Akadémia csillagászati gömbje és a többi jellegzetes részlet megkülönbözteti a nagyobb épületeket.

A hosszúkás épületek saját alaprajzuk szerinti síkon jelennek meg. Az Ostromműhely, Páncélkovács, Hadi kórház és Mesterek Céhe L alakú; az üres sarok továbbra is szabad. A forgatás a tényleges alakzatból származik, az építési szellem ugyanazt a képet és forgatást használja. A látvány a normál játékban és a multiplayer városok rajzolásakor is a megfelelő város faját követi.

## Források

- `public/art/human/map-samples.png`: az elfogadott Favágó, Raktár és Akadémia változatlan eredetije.
- `public/art/human/map-core.png`: a főépület, gazdasági és katonai épületek új atlasza.
- `public/art/human/map-support.png`: a további lakó- és támogatói épületek atlasza.
- A mellettük lévő `.webp` fájlok veszteségmentes, azonos méretű webes kódolások.
- `src/data/human-map-art.json`: források, hash-ek, egyedi nézetablakok és webes fájlok.
- `scripts/register-human-map-atlas.cjs`: a generált atlasz regisztrálása és webes kódolása.

A PNG-k képpontjai változatlanok. Az atlasz nézetablakai az eredeti képek átlátszó közére igazodnak. A Céhháznál külön nézetablak kizárja a szomszédos alakzat maradványait; ez az adott forrás hash-éhez kötött beállítás a regisztráló újrafuttatásakor is megmarad. A rajzoló nem készít épületenként új képfájlt vagy átszínezett textúrát.

## Betöltés

A három eredeti atlasz összesen 7 426 978 bájt. A webes készlet 5 604 100 bájt, azonos látható képpontokkal. Az emberi faj kiválasztása már a beállítás alatt elindítja a dekódolást. A Tovább gomb megvárja a készletet; hiba után az előzőleg javított újrapróbálás használható.

A menü mögötti rejtett város képei külön halasztott forrást kapnak. A lexikon megnyitása önmagában nem indítja el a rejtett térképi SVG-k letöltését. Az induló menü továbbra is a 4 MB-os ellenőrzési határ alatt marad; a helyi production mérés kb. 2,7 MB.

## Ellenőrzés

A böngészős vizsgálat mind a 27 típus négy forgatását ellenőrzi: összesen 108 esetet, elhelyezést, építési szellemet, foglalt mezőket és az L alakok szabad sarkát. A Főépületnél a tényleges fővárosi objektumot rajzolja, az Őrházat pedig szabályos fal melletti helyen vizsgálja. Külön próba őrzi az ork város közös Raktárának frakciógrafikáját.

A teljes, 27 típust tartalmazó bemutatóváros szabályos elhelyezésekkel épül fel. A források és webes képek hash-e, a nézetablakok határai, az alfa-háttér és a webes kódolás látható képpontjainak azonossága is ellenőrzött. A betöltési, egységmegjelenítési, multiplayer-tükrözési, mezőkörvonal- és minitérkép-ellenőrzések is átmentek.

Az áttekintő képek a `public/previews/human-city-full.png` és `public/previews/human-map-building-set.png` fájlokban vannak. A bemutatóváros elhelyezései szemléltető adatok.
