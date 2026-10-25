# V4.51.0 – Kártyaképek és betöltés

## Fájlszerkezet

A játék által használt grafikák a Roadlords repóban vannak:

- `public/art/human/`: az emberi épületek két kártya-atlasza.
- `public/art/undead/`: élőhalott épület-, egység- és fejlesztés-atlaszok.
- `public/art/battle/`: a festett játékbeli egységek animálható készletei.
- `public/cards/<faj>/`: kártyakeretek és a korábbi teljes kártyaképek.
- `public/web-images/`: veszteségmentes WebP-kódolású webes példányok.
- `src/data/upgrade-art-manifest.json`: a jelenetek forrása és nézetablaka.
- `src/data/web-card-images.json`: eredeti fájl → webes példány, méret és ellenőrzőösszeg.

A `roadlords-music` külön repót csak a hangrendszer használja. A tervképek manifestjeiben maradt történeti GitHub-hivatkozások eredetmegjelölések, nem futásidejű képfüggőségek.

## Új képek

Az emberi csomag 11 további épületet fed le: Céhház, Piac, Kocsma, Haditermelési Központ, Páncélkovács, Hadi kórház, Őrségparancsnokság, Könyvtár, Mesterek Céhe, Akadémia, Alkimista kunyhó. Ezzel mind a 27 aktív emberi épületnek új kártyaképe van, a már elfogadott külön emberi kerettel és kategóriaszínekkel.

Mind a 13 korábbi élőhalott egységspecifikus legendás fejlesztés saját jelenetet kapott. A 20 legendás lap azonos arany-csont keretet használ. A nem tökéletesen egyenletes új atlasz jelenetei külön nézetablakot használnak, így a szomszédos jelenet nem lóg be. A generált PNG-k változatlanul megmaradtak. Az atlaszok fennmaradó díszjelenetei nem hoznak létre új játékbeli tartalmat.

## A várakozás okai és javításai

A korábbi kezdőképernyő mögött a rejtett építési sáv nagy emberi képei, a régi egységportrék és a régi színezőatlasz is letöltődött. Ezek most csak használatkor indulnak. A később is használható korábbi rajzoló készlete a diagnosztikai `artReady` getterrel továbbra is betölthető.

A normál játék részt vevő fajainak animációs atlaszai a fajválasztás megnyitásakor és módosításakor kezdődnek el; a készlet frakciónként és képenként újrahasznosul. A továbbgomb megvárja a teljes dekódolást, közben egyértelmű betöltési állapotot mutat. Egy hibás letöltés nem marad végleg sikertelen Promise-ként a tárban: újrapróbálható ugyanarról a képernyőről.

A lexikon és kártyák eredeti PNG-forrásai nagyok. Az új webes kódolás nem méretezi át, nem rajzolja át és nem rontja a képeket. A HTML-képek `srcset` mezőből választják a WebP-t, miközben az eredeti `src` megmarad. Az SVG-atlaszok közvetlenül a kisebb webes fájlt használják. Az eredeti és webes SHA-256, valamint a méretek rögzítettek.

## Mérések

Azonos helyi production kiszolgálón, üres böngészőkontextusban, 1600×1000 ablakban, zene nélkül:

| Mérés | Előtte | Utána |
| --- | ---: | ---: |
| Kezdőképernyő lekért fájltartalma | kb. 17,0 MB | kb. 2,7 MB |
| A 29 átkódolt kártyaforrás összmérete | 81,78 MB | 59,71 MB |

Az első szám kb. 84%-os induláskori csökkenés; a második 27%-os méretcsökkenés a kódolt készletben. A második sor az összes érintett képet összegzi, nem egyetlen lexikonlap egyszeri letöltését. A kiszolgáló tömörítése, a gyorsítótár, a hálózat és a dekódolás miatt ez nem közvetlen idő- vagy FPS-ígéret. Az első kártyamegnyitás továbbra is igényel képletöltést. A rendszeres Ctrl+F5 a gyorsítótár újrahasználata helyett új letöltést kényszeríthet ki.

A `scripts/audit-art-loading.cjs` mérés újrafuttatható a production tesztfuttatóval. Új grafika felvétele után `npm run art:web` készíti el a webes példányokat; az eredetieket nem módosítja.

## Ellenőrzés

A böngészős regresszió ellenőrzi a kis kezdő letöltést, a lexikon és az építési sáv képeinek aktiválását, a jelzett betöltési állapotot és egy valóban megszakított Knight-atlasz sikeres újrapróbálását. A kártyateszt az összes eredeti és webes fájl hashét ellenőrzi, négy eltérő reprezentatív forrásnál pedig minden dekódolt képpont azonosságát is. Az új 27 emberi és 20 élőhalott legendás lap a valódi lexikonban jelenik meg.
