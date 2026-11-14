# V4.80.0 – Épületnézetek és ork városgrafikák

## Forgathatóság

Egy régi felülírás minden épületnek négy forgatást engedett. A meglévő, helyfoglalás szerinti szimmetriavizsgálat ismét érvényesül: négyzetes alapnál egy irány, téglalapnál két különböző helyfoglalás, L alaknál négy. A forgatógomb és a hozzá tartozó útmutatás csak akkor látszik, ha van második érdemi irány. Szimmetrikus épületnél a jobb kattintás nem fordít és nem nyit böngészőmenüt.

A korábbi téglalap-épületek 180/270 fokos értékei a velük azonos helyfoglalású 0/90 fokos irányra normalizálódnak. A foglalt mezők nem változnak. Az AI is csak a különböző alaprajzokat vizsgálja.

## Emberi képek

A négy hosszúkás épülethez – Raktár, Istálló, Templom, Céhház – külön rövid oldal felőli kép készült. Az Ostromműhely, Páncélkovács és Mesterek Céhe négy külön, az adott L alakhoz illő rajzot kapott. Az épületek falai és részletei minden irányban függőlegesen állnak, nincs többé a teljes festményt elfordító CSS-transzformáció. A 23 aktív épület összesen 36 érdemi nézetet használ.

## Ork képek

A 18 aktív épület saját rajzolt városi képet kapott: főépület, raktár, munkatábor, vadászház, kunyhó, harci tábor, dühöngők tábora, goblin-tábor, aréna, hajcsárok tábora, wargkarám, sámántábor, faltörő műhely, trollverem, ősök toteme, rabszolgatábor, fosztogatók tábora és rohamalagút. A nyolc hosszúkás épülethez két külön nézet tartozik, így összesen 26 ork nézet van.

A rajzok bőr-, fa-, kő- és csontmotívumokat használnak, visszafogott vörös zászlókkal. A termelők, barlang, aréna és totem eltérő sziluettet kaptak. Az eredeti generált képek megmaradnak. A kártyaképek nem változnak.

## Közös megjelenítés és betöltés

A két nép ugyanazt a rövid, atlasznézetet kiválasztó renderert használja. A logikai forgatás választja ki a megfelelő rajzot, és az L alakú szabad sarkok továbbra is üresen maradnak. A kivágás a szomszédos képek átlógását is megakadályozza. A lerakott épület és az építési előnézet ugyanabból az adatból készül, egyjátékosban, AI–AI módban és multiplayerben.

A `scripts/register-city-views.cjs` megőrzi a forrás-PNG-ket, veszteségmentes WebP másolatot és ellenőrzött kivágási adatokat készít. Az ork képek a fajválasztáskor, az egységképekkel együtt töltődnek elő; a másik frakció térképi képei nem szükségesek a kezdéshez. Egy közös iránynézeti atlaszt a böngésző mindkét népnél újrahasznál.

Az emberi város új, világos és alacsony kontrasztú földburkolatot kapott. A mezőrács láthatósága és a típusonkénti, egybefüggő épületkörvonalak megmaradtak.

A szabályverzió 28 a forgatási választék változása miatt. Egység-, gazdasági és épületértékek nem változtak.
