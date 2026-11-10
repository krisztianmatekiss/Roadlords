# V4.66.0 – Állapotok és egységbalance

## Állapotrendszer

A negatív állapotok: Vérzés, Méreg, Égés, Lassítás, Kábítás és Átok.
Az Átok alapból +25% kapott és −25% kiosztott sebzést ad, 4 másodpercig;
a Tartós rontás felvételenként +1 másodperc. Azonos Átkok nem halmozódnak.
Erősebb Átokra gyengébbet alkalmazva az erősebb saját lejáratáig érvényben marad.

A külön pozitív állapotjelzők kikerültek. A Hadipapok, a Gyülekezőtér,
a Villámroham, a Kocsma és a többi meglévő statbónusz működése megmaradt.
Az Elit továbbra is közös, tartós rang. Pajzs esetén az egység HP-csíkja fölött
kék védelmi csík jelenik meg; a HP mindkét oldalon piros.

## Sámán és Sötét Őrtorony

- Kettős átok L4: egy támadás két külön egységet sebez és átkoz meg.
  Mindkét találat teljes sebzésű és külön kitérhető; egy nyitótámadási töltet fogy.
- Felerősített átkok L4: +50% kapott és −50% kiosztott sebzés, változatlan időtartam.
- Átokterjesztés kizárólag az Átkot adja tovább, a megmaradt idővel és erővel.
- Sötét Őrtorony: célpontonként 1 sebzés/mp-ről indul, másodpercenként +1 sebzés/mp.
  Célváltáskor az adott sugár újraindul. L1–L4: 1/2/3/4 külön célpont saját térfélen.
  A sugarak egymástól függetlenül erősödnek, felső plafon nélkül.
  A saját térfélhez kötött szorzók és az eddigi fenntartási szabályok megmaradnak.

## Egyéb változások

| Egység | Új alapérték |
|---|---|
| Nekromanta | 280 HP |
| Lich | 380 HP |
| Szellem | 70 HP |
| Dühöngő | 220 HP |
| Sámán | 170 HP |
| Goblin | 3 sebzés |
| Emberi Íjász | 5,5 sebzés |

- Trollregeneráció: felvételenként 0,5% Max HP/mp.
- Trolltenyészet: a félerős Troll 2 helyet foglal a seregben és a helyőrségben is.
  Az utolsó szabad helyet továbbra is használhatja, utána a kivonulás megáll.
- Goblin íjászok: +20% sebzés, +40% hatótáv, −15% támadási sebesség.
- Erősített idézés: minden Nekromanta-idézésre hat, az idézett Szellemekre is;
  a Szellemek saját tükörmásolata nem Nekromanta-idézés.
- Romlott keltető, Temetői tartalék, Véletlen áldás, Átokmester,
  Örökölt vérszomj, Átoktörés és Jelzőnyíl törölve az aktív kínálatból.
- Az emberi Áldás common neve Erősebb gyógyítás lett, azonos hatással.

## Ellenőrzés és hálózat

A célzott böngészőteszt a tényleges egységstatisztikákat, sorban álló lövedékek
becsapódását, átokfrissítést és lejáratot, nyitótámadási tölteteket,
Nekromanta-idézést, Troll-férőhelyet, pajzsmegjelenítést és a külön toronysugarakat vizsgálja.
A toronysugarak életkora a városállapottal együtt szinkronizálódik; a vendég nem számol
újabb sebzést. A Sámán második lövedékét külön átadjuk a vendég megjelenítésének.
A multiplayer szabályverzió 17: eltérő harci szabályú kliensek nem csatlakozhatnak egymáshoz.

Helyi ellenőrzés: a 68 fájlból álló teljes böngészőteszt-készlet lefutott.
Az új balansszámokra frissített három elvárás után a kapcsolódó tesztek is sikeresek.
A végső build célzott újrafuttatása a 31 új állapot-/balanszellenőrzést,
a tömegcsatát, az egységbalance-t és a korábbi balance-szabályokat is ellenőrizte.
