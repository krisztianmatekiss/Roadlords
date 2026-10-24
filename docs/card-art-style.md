# Kártyakeretek és frakciók

A kategóriát minden fajnál ugyanaz a keretszín jelzi: katonai épület vörös, gazdasági zöld, támogató kék; legendás fejlesztés arany. A faj saját motívumai megmaradnak. Az élőhalott katonai lap csont- és fémkerete például rubinvörös betéteket kap, miközben az épület nekromanta mágiája zöld marad. A keretszín a képzőépület fejlesztésein és L4-ágain is követi az épület kategóriáját.

A cím és a leírás a játék által kitöltött üres mező. A kép bal alsó sarkában a tényleges területjelzés, jobb alsó sarkában az építési költség van. A képzési költség, idő és a jól olvasható lélekfenntartás a szövegmezőbe kerül. A nyersanyagok képi jelzést használnak; az ork élelem húsikon, az élőhalott nyersanyag lélekikon.

Az egyedi épületet a képen jobb felül arany koronapiktogram jelöli. Az ár továbbra is jobb alul, a terület bal alul van. A korona a tényleges építési korláthoz igazodik, ezért eltűnik, ha egy ereklye vagy specializáció megszünteti az egyediséget. A kártyacímek nyersanyagnevei szövegesek maradnak.

Az élőhalott egységportrék a `public/art/undead/units-atlas.png` 4×2 képosztását használják, a manifestben rögzített sorrenddel. A hét portrét SVG-nézetablakok jelenítik meg, így az eredeti generált kép változatlan, és minden megjelenés egy dekódolt képet használ. A katonai kártyák és a portrék eredeti példányai a generált képek könyvtárában is megmaradnak.

A teljes élőhalott épületkészlet kártyaképet használ. A gazdasági keret zöld, a támogató és védelmi kék. A temető nyílt sírkert; a hullaház fedett csarnok. Az épületeket eltérő sziluettek és tárgyak különböztetik meg, nem pusztán eltérő díszítés.

A városi épületek közel felülnézeti tetőképek: a nézőpont az ork mapképekhez igazodik, kevés homlokzattal és domináns tetőfelületekkel. Az egyetlen tetőatlasz képei a térkép síkjában, 90 fokonként fordulnak, ugyanúgy, mint az ork képek. A hosszú épületek alapiránya és a megjelenítő sík aránya követi a helyfoglalást. A manifest nézetablakai és SVG-kontúrjai a szomszédos atlaszképek belógását zárják ki; a generált PNG-pixelek változatlanok. A helyfoglalás továbbra is a játékmotor forgatott mezőlistájából származik.

## Gyakori fejlesztések és egységek

Az egységportrék a gyakori fejlesztések keretcsaládját használják. Az ork keret a meglévő `orc_as.webp` változat; az élőhalott és semleges egységkeret az új, kategóriaszínek nélküli csont/fém `cards/undead/common-frame.png`. A katonai épületek vörös kerete továbbra is épületkategóriát jelöl.

Az új ork fejlesztések és az élőhalott gyakori általános/képességfejlesztések önálló jelenetek egy-egy atlaszon. A statisztikai egységfejlesztések a megfelelő meglévő egységportrét használják. A `upgrade-art-manifest.json` a teljes, változatlan forrásfájlokat és sorfolytonos képosztást rögzíti. A képek és a külön keret a megjelenítőben rétegződnek; a generált pixelek nincsenek újrarajzolva.

Az egységjellemzők kis vektoros piktogramjai a portré bal alsó sarkában és a képzőépület egységneve mellett sorakoznak. A jelölés tényleges képességre utal: például az alap Goblin nem kap kitérésikont, a Fürge L4-ággal igen. A jelölés megnevezése súgóként és akadálymentes feliratként is elérhető.
