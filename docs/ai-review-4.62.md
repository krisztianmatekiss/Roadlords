# V4.62 – Gazdasági és pályaismereti AI-felülvizsgálat

Ugyanaz a közös tervező működik mindhárom népnél, a normál ellenfélnél és az AI–AI mód két oldalán. A változtatás nem ad ingyenes nyersanyagot, épületet, választást vagy egységet. Multiplayerben továbbra sem irányít játékost. A harci szabályok és a frakciók balanszértékei nem változtak; a multiplayer szabályverzió 14 maradt.

## Feltárt okok

- A portál korábban csak egy egyszerű Lélek-egyenleg alapján kapcsolt. Nem vizsgálta, hogy az ellenség már a kijárata mögött van-e, és hogy a saját előretolt sereg egyáltalán tudja-e védeni a várost. A képlet nem a ténylegesen módosított portálfenntartást használta, és az állapotváltás egy egész építési döntést is elvett.
- A veszélyjelzés a pálya rögzített 16/84%-os pontjain belül keresett támadókat. Nem vette figyelembe a következő torony életerejét és az utánpótlás menetidejét. A sérült főváros aktív invázió nélkül is állandó vészhelyzetet jelentett.
- A tárolás értékébe az összes feloldott épület legmagasabb ára beleszámított. Egy drága, még nem tervezett feloldás miatt is jöhetett raktár a termelők helyett. A 4.61.2-es, 42-es kezdőmagú ember–élőhalott próbában az ember egy favágó után két raktárt épített, 31,6 és 47,8 másodpercnél.
- A fejlődési keret kevés építési tartalékot és kevés előre jelzett képzési fogyasztást tartott. Egy régi általános képzési őrszabály a gazdasági megtakarítást csak 35 másodpercig védte.
- A támogatóhely-keresés a már ugyanazzal az erősséggel buffolt termelőket is új célpontnak számolta. A hasznot nem hozó támogatók is kaptak általános pozitív pontot. Ez felesleges másolatokhoz vezethetett.
- A romeltakarítás nem különböztette meg a munkasorozat összköltségét és az egyetlen lépéshez szükséges raktárkapacitást. Az opcionális ősi rom a következő építésre félretett összegből is költhetett.

## Új működés

`battle-awareness.js` a valódi pályahosszból, élő térfélhatárból és a megmaradt erődítésekből számol. Az érkező támadók becsült épületsebzését a normál és ostromtámadások eltérő szabályával értékeli. Az előretolt sereget elkülöníti a beavatkozni képes védőktől. Ha egy torony várhatóan az utánpótlás odaérkezése előtt elesik, előrébb kerül a védekezés. A kis korai zaklatás ellen az ép tornyokat időnyerésnek tekinti.

A portálvédelmet a kapuvezérlés és a fizetett képzés is ellenőrzi. Ha a kijárat mögötti veszélyt nem fedezik a helyi védők, az új egységek rendesen a kapuból indulnak. Biztonságos hullámnál újra használhatja a portált. A kikapcsolás után legalább 8 másodpercet vár az újraengedélyezéssel. Bekapcsolás előtt a tényleges frakciómódosítókkal számolt fenntartást, a készletet, a beruházási keretet és a kivonulási helyet is vizsgálja. Egy kapcsolás nem helyettesíti az építési döntést.

`growth-policy.js` a meglévő fogyasztás mellett a következő érdemi építkezés és egy lehetséges új képzési sor igényét is számolja. A konkrét gazdasági keretet a vele ütköző fizetett képzés nem fogyaszthatja el a 35 másodperces határ után sem; a más nyersanyagot használó, finanszírozható képzést nem állítja le emiatt. Vészhelyzetben az azonnali védekezés felülírhatja ezt.

A raktár akkor értékes, ha egy tényleges következő beruházásnak nem fér el az ára, vagy az érdemi fogyasztás és a következő termelő ára alapján hasznos rövid készletpuffer kell. Az összes feloldás legmagasabb ára és a végtelen túltermelés nem önálló indok.

A kocsma, páncélkovács, városháza, aréna, hajcsártábor és keltető elhelyezése figyeli a nem halmozódó hatások már meglévő lefedését. A távolabbi, még nem támogatott termelőknek továbbra is építhet új támogatót. Ugyanezt a feltételt a romokra tervezett támogatóknál is használja.

Az ősi rom opcionális jutalma előtt megőrzi a következő szükséges építkezés és a működési hiány fedezetét. Ha egy zsúfolt városban az ásatás rövid időn belül finanszírozható lenne, a valóban szükséges kapacitás kérhető. Többmezős munka esetén az egyes kifizetésekhez kell elegendő raktár, nem az egész munkasorozathoz egyszerre.

`income-redevelopment.js` teli, bevételhiányos városban korlátozottan vizsgálja a fölösleges épületmásolatok cseréjét. Nem bont főépületet, gazdasági termelőt, kapacitásépületet, raktárt, egyedi épületet vagy egy egységtípus utolsó képzőjét. Csak teljes, érvényes termelőhelyet és javuló egyenleget fogad el, legfeljebb 25% becsült képzési erővesztéssel. A bontás előtt meg kell lennie az új termelő árának; invázió alatt nem kezd átépítésbe.

A megkezdett többmezős cserét a tervező befejezi, mielőtt más épület elfoglalhatná a felszabaduló helyet. Ez valódi hibát javít: az egyik tízperces, 137-es kezdőmagú élőhalott gazdasági próbában a köztes változat 37 támogatót bontott le, majd visszaépítette őket a tervezett Lélekkút helyett. A javított döntéssor ugyanebben a próbában 4 bontással befejezte a termelőcseréket; fenntartási hiány egyszer sem jelentkezett. A termelők más szerepre cseréléséhez a finanszírozottságon túl tényleges pozitív összhaszon is szükséges.

Az ork L4 hajcsártáborok AI-alapbeállítása mindkét oldalon ugyanaz az explicit középállás. A már elindult képzési ciklus lezárt profilját ez nem módosítja.

## Ellenőrzések

- `tests/ai-map-awareness.cjs`: portálos hullám, védtelen visszatámadás, kapuhoz visszatérő utánpótlás, kapcsolási várakozás, tele sereg, kis korai zaklatás, várható toronyvesztés, kis védelmi tartalék, tárolóigény, támogató-lefedés, gazdasági keret, ősi rom, teli város finanszírozott helyreállítása, multiplayer kizárása; mindkét AI-oldal.
- A meglévő közös AI-, romeltakarítási, várostervezési, építési stratégiatesztek és a normál nézői mód ellenőrzései.
- `npm run audit:ai`: két kezdőmag mindhárom népnél, tíz perc normál gazdaság. A kiküldött seregek 45 másodperc után harci jutalom nélkül távoznak. Ez utánpótlási terhelés, nem győzelmi mérés.
- `npm run audit:ai-matches`: ember–élőhalott, ork–ember és élőhalott–ork, valódi normál kezdésből, valódi harccal. A mérőprogramot fejlesztéskor külön indítjuk; a játék nem készít automatikus meccsnaplót.

## Érvényességi határok

A helyzetértékelés becslés, nem a jövőbeli teljes csata lefuttatása. Nem látja előre a véletlen lapokat, és nem kap új, a játékostól elzárt irányítási képességet: a már elvonult sereget nem tudja kézzel hazaparancsolni, az utánpótlás útját és finanszírozását változtatja meg. Egyetlen közös tervező marad; nem tanul automatikusan és nincs külön személyiség.

Azonos kezdőmag mellett is eltérhet a későbbi véletlen húzások sora, mert a döntések és a harc eltérő számú véletlen műveletet végeznek. Néhány gépi meccsből nem következik emberi ellenfelek elleni győzelmi arány.
