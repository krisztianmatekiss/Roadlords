import { assetUrl } from '../assets/urls.js';
export function initializeUiChoiceText(runtime) {
  const NORMAL_TEXT = {
    "spawn_speed": "Minden katonai termelő 10%-kal gyorsabban gyárt egységeket.",
    "production": "Minden nyersanyagtermelésed 10%-kal nő.",
    "all_damage": "Minden egységed +5% sebzést okoz, és a Papok gyógyítása +5%-kal erősebb.",
    "swordsman_dmg": "A Kardosok +10% sebzést okoznak.",
    "swordsman_hp": "A Kardosok maximális HP-ja +10%.",
    "sword_as": "A Kardosok 15%-kal gyorsabban támadnak.",
    "spear_dmg": "A Lándzsások +10% sebzést okoznak.",
    "spear_hp": "A Lándzsások maximális HP-ja +10%.",
    "spear_range": "A Lándzsások támadási hatótávja +10%.",
    "archer_dmg": "Az Íjászok +10% sebzést okoznak.",
    "archer_hp": "Az Íjászok maximális HP-ja +10%.",
    "archer_range": "Az Íjászok támadási hatótávja +10%.",
    "knight_dmg": "A Lovagok +10% sebzést okoznak.",
    "knight_hp": "A Lovagok maximális HP-ja +10%.",
    "knight_move": "A Lovagok 15%-kal gyorsabban mozognak.",
    "priest_dmg": "A Papok +10% sebzést okoznak, és 10%-kal erősebben gyógyítanak.",
    "priest_hp": "A Papok maximális HP-ja +10%.",
    "catapult_dmg": "A Katapultok +10% sebzést okoznak. Az épületek elleni alapsebzésük is ugyanennyivel nő.",
    "catapult_hp": "A Katapultok maximális HP-ja +10%.",
    "cat_build": "A Katapultok +25% sebzést okoznak épületeknek.",
    "mage_dmg": "A Mágusok +10% sebzést okoznak.",
    "mage_hp": "A Mágusok maximális HP-ja +10%.",
    "mage_aoe": "A Mágusok tűzgolyóinak területi sugara +15%.",
    "frugal_training": "Minden egység gyártási nyersanyagköltsége 5%-kal csökken.",
    "tower_crews": "Minden saját torony sebzése, HP-ja, hatótávja és támadási sebessége +8%.",
    "gate_discipline": "A kapu 10%-kal gyorsabban engedi ki az egységeket, a helyőrség kapacitása pedig +5.",
    "building_discount": "Minden épület nyersanyagköltsége 10%-kal csökken. Legfeljebb 5× halmozható, összesen −50%-ig.",
    "tower_regen": "Minden saját torony +5 HP-t regenerál másodpercenként. Halmozható.",
    "tower_guard": "Minden saját torony +1 automatikus íjászt kap, legfeljebb 3-ig. A toronyíjászok a saját Íjász statjaidat használják, és beleszámítanak az úti sereglimitbe.",
    "merc_cost": "A zsoldoscsapatok ára 10%-kal csökken.",
    "merc_cd": "A Zsoldos sátor két bérlés közti várakozási ideje 10%-kal csökken.",
    "merc_power": "A Zsoldos sátorból bérelt egységek +10% maximális HP-t és +10% sebzést kapnak.",
    "merc_size": "Minden bérelhető zsoldoscsapat +1 egységgel érkezik.",
    "alc_x_reduce": "Minden Alkimista kunyhó receptjében az X, vagyis a „nem történik semmi” összetevő súlya −5. Halmozható.",
    "alc_damage_power": "A Sebzésfőzet bónusza +15 százalékponttal nő.",
    "alc_hp_power": "Az Életerőfőzet bónusza +15 százalékponttal nő.",
    "alc_as_power": "A Gyorsítófőzet bónusza +15 százalékponttal nő.",
    "alc_move_power": "A Szélfőzet bónusza +15 százalékponttal nő.",
    "alc_regen_power": "A Regeneráló főzet másodpercenkénti gyógyítása 15%-kal erősebb.",
    "alc_all_power": "Minden aktív főzet +8 százalékponttal erősebb. A Regeneráló főzet hatása +8%-kal nő.",
    "alc_replace_movement": "Válassz ki egy jelenlegi recepthelyet, és cseréld Szélfőzetre. A csere minden Alkimista kunyhóra érvényes. Alaphatás: +15% mozgási sebesség.",
    "alc_replace_regen": "Válassz ki egy jelenlegi recepthelyet, és cseréld Regeneráló főzetre. A csere minden Alkimista kunyhóra érvényes. Alaphatás: +1 HP/mp."
  };
  const LEGEND_TEXT = {
    "chain_spawn": "Minden normál egységgyártás 25% eséllyel beránt egy másik aktív katonai termelőt, amely ingyen legyárt 1 egységet. Az extra gyártás nem indít új láncreakciót.",
    "siege_doctrine": "Minden nem ostromegységed +100% sebzést okoz épületeknek.",
    "melee_doctrine": "Közelharci egységeid 2× sebzést okoznak, viszont minden nem közelharci egységed sebzése 0-ra esik.",
    "factory_network": "Normál egységgyártáskor minden közvetlenül szomszédos aktív katonai termelő +15% gyártási előrehaladást kap.",
    "double_assault": "A hullám másolatai 3 saját támadásig élnek, időkorlát nélkül. Megölhetők, sereglimitet foglalnak. Épületütés is számít.",
    "no_food": "Az egységgyártás többé nem fogyaszt Élelmet, viszont minden egység gyártási ideje +25%.",
    "mobilization": "Zárt kapunál minden katonai termelő 2× sebességgel dolgozik. Nyitott kapunál teljesen leállnak.",
    "mono_veteran": "Amíg minden aktív katonai termelő ugyanazt az egységtípust gyártja, minden új egység Veteránként érkezik: +50% HP és +50% sebzés.",
    "sacred_vow": "A Papok többé nem támadnak. Gyógyításuk +50%-kal erősebb, 30%-kal gyorsabban használható, és minden gyógyítás ideiglenes pajzsot ad.",
    "cavalry_charge": "A Lovagok minden megtett 50 útegység után +25% sebzést gyűjtenek a következő támadásukra, legfeljebb +200%-ig.",
    "phalanx": "3 közeli Lándzsás Falankszot alkot: nem lehet rajtuk áthaladni, nem lökhetők hátra, és a Lovasság/Heavy egységek elleni bónuszsebzésük megduplázódik.",
    "mage_ward": "Minden tűzgolyó elsütése 15 ideiglenes pajzsot ad az összes közeli szövetségesnek.",
    "archer_skirmish": "Az Íjászok +50% mozgási sebességet kapnak. Ha közelharci veszély érkezik, hátrálnak és távolról folytatják a tüzelést.",
    "momentum": "A Lovagok az aktuális mozgásisebesség-bónuszukkal megegyező mértékű sebzésbónuszt kapnak.",
    "long_training": "A főhelyőrségben, kiengedési sorban vagy Gyülekezőtérben összesen 20 másodpercet váró egység Veteránná válik: +50% HP és +50% sebzés.",
    "glass_cannon": "Minden saját egységed 2× sebzést okoz, de maximális HP-juk a felére csökken.",
    "last_line": "Minden elvesztett saját úttorony után minden jelenlegi és jövőbeli egységed +25% sebzést és +25% maximális HP-t kap. Halmozódik.",
    "specialization": "Ha olyan gyakori fejlesztést választasz, amit már korábban felvettél, 50% eséllyel azonnal kapsz belőle még +1 stacket.",
    "wide_choice": "Minden picknél +1 választási lehetőséget kapsz, és a legendás pick esélye megduplázódik.",
    "double_choice": "Minden 3. nem legendás picknél két külön lapot választhatsz ugyanabból a kínálatból. A legendás pickek nem számítanak bele.",
    "full_garrison_economy": "Amíg a főhelyőrséged teljesen tele van, minden nyersanyagtermelésed 2×.",
    "large_garrison": "A helyőrség kapacitása és a kapu kiengedési sebessége 2×. A kiengedett egységek maximális HP-juk 25%-ának megfelelő pajzzsal indulnak.",
    "road_rush": "Az út saját térfelén minden egységed +75% mozgási sebességet kap.",
    "overproduction": "Minden összesen 500 egységnyi túltermelt nyersanyag után minden jelenlegi és jövőbeli egységed +1% sebzést kap. Nincs felső korlát.",
    "instant_l3": "Egy épületfejlesztés egyszerre +2 szintet ad, de ezzel legfeljebb L3-ig juthatsz. L4 továbbra is csak külön L4-fejlesztéssel vagy specializációval érhető el.",
    "arm_the_people": "Minden Favágó, Kővágó és Farm 40 másodpercenként kiállít 1 ingyenes Kardost a normál termelése mellett.",
    "mage_proliferation": "A Mágustorony elveszíti az Egyedi korlátozást: mostantól korlátlan számú Mágustornyot építhetsz.",
    "mage_triple": "Minden Mágus-támadás 3 tűzgolyót lő ki egyszerre, legfeljebb 3 különböző célpontra. Mindegyik 50% sebzést és teljes AOE-t okoz.",
    "holy_wave": "Minden Pap-gyógyítás 5 másodpercre a célpont maximális HP-jának 25%-ával megegyező pajzsot is ad.",
    "holy_retribution": "Minden Pap-gyógyítás a gyógyított célpont körül ugyanakkora mágikus sebzést oszt ki, mint a gyógyítás értéke.",
    "catapult_range_as": "A Katapultok +50% támadási hatótávot és +50% támadási sebességet kapnak.",
    "catapult_knockback": "A Katapult találatai erősen hátralökik a célpontot. A meglökött egység maga előtt további ellenségeket is továbbtolhat.",
    "sword_execute": "Kardos: 4% kivégzési esély az elsődleges célpontra. +4 százalékpont/stack, max. 5× (20%). Csak egységre hat.",
    "sword_whirlwind": "A Kardosok minden 3. támadása az összes közeli ellenséget eltalálja teljes sebzéssel.",
    "spear_pierce": "A Lándzsások támadása átdöfi a célpontot, és a mögötte egy vonalban álló ellenségeket is teljes sebzéssel eltalálja.",
    "spear_brace": "Amikor egy ellenség először belép egy Lándzsás támadási hatótávjába, a Lándzsás azonnal kap egy ingyenes normál támadást.",
    "archer_close_combat": "Az Íjászok sebzése a célpont távolságával nő, legfeljebb +200% sebzésbónuszig.",
    "knight_dismount": "Ha egy Lovag harcban elesik, a helyén azonnal megjelenik egy teljes HP-s Kardos.",
    "bloodlust": "Ha egy Kardos megöl egy ellenséget, azonnal újra támadhat, és visszagyógyul maximális HP-jának 15%-ával.",
    "marking_arrow": "Az Íjász találata 4 másodpercre megjelöli a célpontot. A megjelölt egység +50% sebzést kap minden távolsági egységtől.",
    "artillery_sighting": "A Katapult ugyanazt az épületet egymás után lőve találatonként +50% sebzést halmoz, legfeljebb +200%-ig.",
    "supply_hub": "A Raktárral közvetlenül szomszédos katonai termelők egységköltsége −30%.",
    "castle_defenders": "Amíg mindhárom saját úttornyod áll, a helyőrségből kiengedett egységek Veteránként vonulnak ki.",
    "combined_assault": "Ha egy kiengedett hullámban legalább 3 különböző egységkategória van, a teljes hullám +25% mozgási és támadási sebességet kap.",
    "tower_salvo": "Minden saját torony minden támadáskor +1 extra, teljes sebzésű lövedéket lő ki.",
    "tower_rebuild": "Azonnal újjáépít 2 ledőlt saját tornyot teljes HP-val.",
    "stockpile_production": "Minden teljes 500 jelenleg tárolt össznyersanyag után minden katonai termelő +3% gyártási sebességet kap.",
    "campaign_feast": "Szomszédos Kocsma–Gyülekezőtér: fél Kocsma-sebzésbónusz állandóan. A nyitó támadásokon a teljes bónusz jár, a kettő nem adódik össze.",
    "tavern_chain": "+1 Kocsmát építhetsz. Több Kocsma bónusza összeadódik, így az egységek több erősített támadást kapnak. Ez a legendás korlátlanul halmozható.",
    "house_militia": "Minden Lakóház a tényleges úti sereglimit-bónuszának 100%-át helyőrségkapacitásként is megadja.",
    "armor_extended_range": "A Páncélkovács már nem csak közvetlen szomszédokra hat: minden legfeljebb 2 mező távolságban lévő katonai termelő megkapja a hatását.",
    "magic_order": "A Templom 25% eséllyel Pap helyett Mágust képez. Legfeljebb 4× halmozható, így 100%-ig növelhető az esély.",
    "hospital_veterans": "A Kórház által megmentett egységek +20% maximális HP-t kapnak, és minden gyógyításból 2× annyit kapnak.",
    "rally_cavalry_rush": "A Gyülekezőtérből indított Lovagok +25% maximális HP-t, sebzést, mozgási sebességet és támadási sebességet kapnak.",
    "hospital_doomed": "A Kórházból visszatért egységek 2× sebzést okoznak, de másodpercenként elveszítik maximális HP-juk 1%-át.",
    "capital_studies": "A Főépületben gyakori fejlesztés-picket vásárolhatsz. Az első ára 500 Fa + 500 Kő + 500 Élelem, majd minden vásárlás után mindhárom ár +500-zal nő. Automata vásárlás is bekapcsolható.",
    "high_keep": "A Főépület azonnal +1 szintet kap, és 1×1 mezősre zsugorodik a jelenlegi helyének bal felső mezőjén. Ha ezzel eléri az L4-et, azonnal választanod kell a két L4 specializáció közül.",
    "royal_district": "A Főépület azonnal +1 szintet kap. A közvetlenül mellette álló nyersanyagtermelők +25% termelést, a katonai termelők +25% gyártási sebességet kapnak.",
    "alc_full_mix": "Sikeres főzésnél az Alkimista kunyhó az összes aktív főzet hatását egyszerre ráteszi az egységre. Cserébe az X összetevő súlya +25.",
    "alc_multi_hut": "Egy katonai termelő minden szomszédos Alkimista kunyhótól külön főzést kap. Azonos főzet nem halmozódik: a duplikált találat egyszerűen elvész.",
    "alc_recipe_twist": "Válassz +1 vagy −1 főzethelyet. Minden felvétel minden főzet hatását +15%-kal erősíti. Halmozható.",
    "strategic_superiority": "Azonnal kapsz 3 extra picket, +5 újrasorsolást és +3 kitiltást. Korlátlanul halmozható."
  };
  for (const pick of runtime.NORMAL) if (NORMAL_TEXT[pick.id]) pick.description = NORMAL_TEXT[pick.id];
  for (const pick of runtime.LEGENDARY) if (LEGEND_TEXT[pick.id]) pick.description = LEGEND_TEXT[pick.id];
  const toastEl = document.getElementById('toast'),
    commandEl = document.querySelector('.command');
  const toastStyle = document.createElement('style');
  toastStyle.textContent = "@import url(\"" + (assetUrl("styles/features/ui-choice-text-34.css") + "\");");
  document.head.appendChild(toastStyle);
  function positionToastV4972() {
    if (!toastEl || !commandEl) return;
    const dock = commandEl.getBoundingClientRect(),
      topbar = document.querySelector('.topbar')?.getBoundingClientRect();
    const h = toastEl.offsetHeight || 32;
    const minTop = (topbar?.bottom || 0) + 8;
    const wanted = dock.top - h - 12;
    toastEl.style.setProperty('top', Math.round(Math.max(minTop, wanted)) + 'px', 'important');
    toastEl.style.setProperty('bottom', 'auto', 'important');
  }
  const oldToastV4972 = runtime.toast;
  runtime.toast = function (text) {
    const out = oldToastV4972(text);
    requestAnimationFrame(positionToastV4972);
    return out;
  };
  if (typeof ResizeObserver === 'function') {
    const ro = new ResizeObserver(() => positionToastV4972());
    if (commandEl) ro.observe(commandEl);
    if (toastEl) ro.observe(toastEl);
  }
  window.addEventListener('resize', positionToastV4972);
  requestAnimationFrame(positionToastV4972);
  document.querySelectorAll('#rotatePlacement').forEach(b => {
    b.textContent = '↻ FORGATÁS (jobb klikk)';
    b.title = 'Forgatás · jobb klikk az építési mezőn';
  });
  window.__ROADLORDS_V4972__ = {
    positionToast: positionToastV4972,
    normalText: NORMAL_TEXT,
    legendText: LEGEND_TEXT
  };
  const brandSmall = document.querySelector('.brand small');
  if (brandSmall) brandSmall.textContent = 'V4.9.72 · P2P 1V1';
  const menuVer = document.querySelector('.menuVersion');
  if (menuVer) menuVer.textContent = 'V4.9.72 · P2P';
  document.title = 'Roadlords V4.9.72 – Pick szöveg + toast + hotkey QA';
  window.__ROADLORDS_VERSION__ = '4.9.72-pick-text-toast-hotkey-qa';
}
