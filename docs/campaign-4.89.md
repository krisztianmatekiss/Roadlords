# V4.89 – játszható kampányalap

A főmenüben a **Kampány** külön mód, a korábbi önálló meccs neve **Gyors játék**.
Mindhárom nép választható. Összesen öt harc van; az ötödik a boss.

## Menet és mentés

1. Az első négy ellenfél népe és katonai iránya véletlenszerű. A második egy ereklyét, a harmadik egy ereklyét és egy L3 katonai épületet, a negyedik két ereklyét és egy L4 katonai épületet kap.
2. Az ötödik ellenfél **A Vérudvar Ura**: élőhalott, valódi L3 Nekropolisszal, L4 Lélekkúttal és L4 Vámpírkastéllyal, Vérvadászat ággal. Ereklyéi a Szakosodás és a Kettős választás.
3. Az első négy győzelem után három különböző, még nem birtokolt ereklyéből választasz egyet. Az ötödik győzelem lezárja a hadjáratot.
4. Csak az ereklyék maradnak meg: minden harc új város, készlet, sereg és fejlesztések nélkül indul. A négy kezdő épületválasztás megmarad.
5. Vereség után ugyanaz a harc újrapróbálható. A nép, az ellenfél, a birtokolt ereklyék és a még ki nem választott jutalom a böngésző helyi tárhelyére mentődik. A mentés a harc elejét őrzi, nem a csata pillanatnyi állását.

Az ellenfelek kezdőcsomagja mentett magból készül, újratöltéssel nem változik. A csata közbeni sorsolások továbbra is normál véletlent használnak. A kampányellenfél kezdőépületeit az AI nem bonthatja el az újratervezés során; a további építkezését a meglévő közös AI végzi. A kezdőelőnyök a harc előtt láthatók.

## Választások és ereklyék

Kampányban két kínálat van: épületek és fejlesztések. A korábbi legendás sorsolás fejlesztéskínálatot ad, benne egy elérhető legendás lappal; a többi hely normál fejlesztés. Az épületszint-előfeltételek, ritkasági erősségek, 12 perces épületbiasz és 20. alkalommal garantált legendás kínálat megmarad. Ereklye harc közben nem szerezhető.

Közös induló ereklyekészlet:

| Ereklye | Hatás |
| --- | --- |
| Szakosodás | A már megszerzett normál fejlesztés újabb felvétele 50% eséllyel kétszer hat. |
| Bő választék | +1 lap minden választásban; a legendás kínálat esélye kétszeres. |
| Kettős választás | Minden harmadik normál választáskor két lap választható. |
| Stratégiai fölény | Minden harcban +3 választás a kezdő négy után, +5 újrasorsolás és +3 kitiltás. |
| Teltház | Teli helyőrségnél kétszeres nyersanyagtermelés; mindhárom népnél, Lélekre is. |
| Hadjárati készletek | +50% kezdőnyersanyag minden harcban. |
| Felderített lehetőségek | +2 lap a négy kezdő épületválasztásban. |
| Kincskereső térkép | +1 ereklye a harc végi kínálatban. Az utolsó jutalomnál már nem ajánlja fel a játék. |

Az első öt a meglévő definíciókra épül, az utolsó három új kampányereklye, meglévő illusztrációkat használva. A lexikon külön Ereklyék fülön, a jutalom és a pakli ugyanabból a regiszterből jeleníti meg őket. A többi 109 legendás fejlesztés marad. A gyors játék megtartja a korábbi öt hatás meccs közbeni, eredeti frakciós elérhetőségét; az új három nem kerül a gyors játék kínálatába. A multiplayer szabályverziója változatlan, mert az új kampányszabályok nem futnak multiplayerben.

## Ellenőrzés és hátralévő tervezés

Böngészős teszt ellenőrzi az öt harc teljes átmenetét, a tényleges bossépületeket és finanszírozásukat, a harcok közötti tiszta állapotot, a mentés visszatöltését, a vereség utáni újrapróbálást, a jutalom egyszeri felvételét, az ereklyék valódi hatását mindhárom népnél, a vegyes legendás kínálatot és a gyors játék elkülönítését. Az átmeneti teszt a győzelmeket vezérelten váltja ki; nem állítja, hogy öt teljes, ember által lejátszott meccs nehézségét bemérte.

A harci nehézség és az ereklyék erőviszonyai első balanszértékek. A vár mögötti táborok és az épületek/fejlesztések továbbvitelét engedő hatások későbbi, külön tervezésre várnak. Az egységsebességek ebben a patchben nem változnak. A világos felületek több címkéje kapott sötétebb szöveget; további kontraszthibák helyenként még javíthatók.
