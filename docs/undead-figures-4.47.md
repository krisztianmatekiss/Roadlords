# Élőhalott grafikák – V4.47.0

A TESZTEK menü két aktuális próbát kínál: 28 élőhalott a hét emberi egységtípus ellen, illetve 500 vs 500. A kis csatában minden típusból négy indul. Az új grafikák továbbra is a grafikai próbában élnek; a normál játék és multiplayer megjelenése változatlan.

A már elfogadott sima Csontváz az új próbában és a Nekromanta által idézett csontvázaknál is használatos. A Csontvázíjász annak csontvázát és az emberi Íjász íj/ideg/nyíl geometriáját használja. A Zombi és Vámpír a bevált, ízületekhez kötött járásra és közelharcra épül. A Szellem láb nélküli, önálló lebegést és eltűnést kapott. A Nekromanta idézőmozdulata valódi sikeres idézés után indul; a Lich valódi, folyamatos sugara a bot kristályából ered. A sebzés, idézési idő, idézett egységek élettartama és életlopás nem változott.

Két eredeti, átlátszó PNG-részatlasz készült a jóváhagyott Heroes III hangulatú élőhalott terv alapján. A forrásokat változatlanul őrizzük a `public/art/battle` alatt; a kivágásokat, ízületeket, fogáspontokat és SHA-256 ellenőrzőösszegeket az `undead-fighters-art.json` és `undead-casters-art.json` rögzíti. A ruhaszínezés csak kis, gyorsítótárazott kivágásokon fut. A közös képkockatár legfeljebb 768 elemes, az élőhalott ruhatár 24 szín/atlasz készletre korlátozott.

A `tests/undead-figures.cjs` valódi böngészős próbája ellenőrzi mind a hét modellt, a járás/támadás/halál képkockáit, a nyolc csapatszínt és elitjelölést, a nyíl és varázslatok indulópontját, tényleges találati időzítést, életlopást, Lich-sugarat és idézést, továbbá az A/B kapcsolást, 50 szimulált másodpercnyi vegyes harcot, 1280×800-as elhelyezést és az 1000 induló egységes csatát. A jelentés és mozgásgaléria az `artifacts` könyvtárba kerül. Az újrahasznált emberi Íjász és sima Csontváz korábbi regressziós próbái külön is futnak.

A terheléses ellenőrzés működést és korlátos képkockatárat igazol; nem eszközfüggetlen 60 FPS ígéret. A nyilvános előnézet tényleges renderelt modelleket mutat: `public/previews/undead-in-game.png`.

## V4.47.1 – karok és kezek

A hátsó könyökök a törzsön kívül maradnak, a Zombi mindkét karma előre nyúl. A Vámpír külön kéz- és alkarillesztést kapott: a kard a tenyér fogáspontján marad, a csukló a mozdulat során legfeljebb 0,8 radiánnal hajlik el az alkartól. A varázslók szabad keze követi az alkar irányát. A Szellem két karja anatómiailag elérhető célpontokat használ. A Csontvázíjász a rövidebb törzséhez illő vállakat, hátrébb húzott ideget és a sima Csontváz festett, csontos kézrészeit használja. A nyíl új indulópontja a tényleges utolsó nockolt nyíl középpontjával egyezik.

A közös böngészőteszt mind a hat új típusnál összeveti a teljes modellt a karok nélküli rajzzal: nyugalomban, hátralendítéskor és találatkor mindkét felkar és alkar tényleges képpontjai látszanak. A csuklók irányát az összes mozgásfázisban külön is ellenőrzi.
