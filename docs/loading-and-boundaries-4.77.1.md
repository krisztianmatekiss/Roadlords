# V4.77.1 – Betöltés, terepikonok és építési rács

A modern alapnézet három nyitási szakaszt használ: sötét háttér és cím betöltés közben; kész állapotban kattintási felszólítás; kattintásra háttér és fokozatosan megjelenő menüpontok. Korai kattintás nem ugorja át a betöltést. Hiba esetén újrapróbálás választható. A cím mögötti régi, halvány díszítő pszeudoelemek megszűntek.

Az aktív kártyaképeket ugyanaz a kártyarenderelő gyűjti össze, amelyet a lexikon használ: épületek, egységek, normál fejlesztések és ereklyék mindhárom népnél. A jelenlegi készlet 90 egyedi kép, körülbelül 12,6 MiB. A régi, már nem használt illusztrációk és a csataanimációs atlaszok nem indulási függőségek. Hat párhuzamos letöltés fut; a folyamatjelző a valódi elkészült képeket, hátteret és betűkészleteket számolja.

A képek dekódolási ellenőrzés után tömörített Blob URL-ként maradnak a közös képtárban. A lexikon és a játékkártyák ezt használják, új hálózati kérés nélkül. A böngésző továbbra is szabályozhatja a dekódolt képek memóriáját; a program nem tartja egyszerre állandóan a memóriában az összes dekódolt bitmapet. A klasszikus elrendezés korábbi halasztott betöltése megmarad.

A tereptárgyak ismét a korábbi, egyedi képfájljaikat használják. A 4.77-es új terepatlasz nincs használatban. Az Építés és Pakli vezérlőikonjai változatlanok.

A város 10×10-es rácsának korábbi, alig 14%-os vonalát erősebb sötét szegély és vékony világos belső vonal váltja fel. Az épületek típus szerinti, egybefüggő körvonala is kontrasztosabb, továbbra is a grafika fölött és a mező szélétől beljebb látszik. A térfelek választóvonala változatlan.

Ez a javítás nem módosít harci értékeket, képzési időket, AI-t vagy a multiplayer szabályverzióját (25).
