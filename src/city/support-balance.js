import { assetUrl } from '../assets/urls.js';
export function initializeCitySupportBalance(runtime) {
  runtime.ROADLORDS_V17 = 'v1.8';
  runtime.BUILDINGS.keep.description = '+0,5 / +0,75 / +1 Fa/Kő/Élelem másodpercenként. Főváros HP és kapu-kihaladás: 5 / 6 / 7 egység/mp.';
  runtime.BUILDINGS.warcenter = {
    name: 'Haditanács',
    icon: '⚙️',
    category: 'support',
    shape: [[0, 0], [0, 1], [1, 0], [1, 1]],
    unique: true,
    description: 'A spawnerek aktív vagy inaktív állapotba kapcsolhatók. Minden inaktív spawner +3% gyártási sebességet ad az aktív spawnereknek.',
    cost: runtime.C(90, 90)
  };
  if (!runtime.UNLOCKABLE.includes('warcenter')) runtime.UNLOCKABLE.push('warcenter');
  for (const c of [runtime.P, runtime.E]) {
    c.overflowProgress = 0;
    c.overflowStacks = 0;
    c.lostTowers = 0;
    c.nonLegendaryPicks = 0;
    c.civilianProgress = new Map();
  }
  runtime.LEGENDARY.splice(0, runtime.LEGENDARY.length, {
    id: 'chain_spawn',
    icon: '⚙️',
    name: 'Láncreakció',
    description: 'Normál spawnnál 25% eséllyel egy random másik aktív spawner ingyen spawnol 1 egységet. Nem láncol.',
    eligible: s => runtime.activeSpawners(s).length >= 2
  }, {
    id: 'siege_doctrine',
    icon: '💥',
    name: 'Rögtönzött ostrom',
    description: 'Minden nem-Ostrom egység +100% sebzést okoz Buildingek ellen.',
    eligible: s => runtime.hasSpawner(s)
  }, {
    id: 'melee_doctrine',
    icon: '⚔️',
    name: 'Közelharci doktrína',
    description: 'Melee egységeid 2× sebzést okoznak. Minden nem-Melee egységed 0 sebzést okoz.',
    eligible: s => runtime.hasSpawner(s)
  }, {
    id: 'factory_network',
    icon: '🔗',
    name: 'Haditermelési lánc',
    description: 'Normál spawnnál minden közvetlenül szomszédos aktív spawner +25% gyártási progresszt kap.',
    eligible: s => runtime.activeSpawners(s).length >= 2
  }, {
    id: 'double_assault',
    icon: '🚪',
    name: 'Kettős roham',
    description: 'Kapunyitáskor minden bent várakozó egységből létrejön egy 12 másodperces ideiglenes másolat.',
    eligible: s => runtime.hasSpawner(s)
  }, {
    id: 'no_food',
    icon: '🥖',
    name: 'Hadkötelezettség',
    description: 'Az egységek nem kerülnek Élelembe, de +50% gyártási időt kapnak.',
    eligible: s => runtime.hasSpawner(s)
  }, {
    id: 'mobilization',
    icon: '🔒',
    name: 'Mozgósítás',
    description: 'Zárt kapunál +100% spawner speed. Nyitott kapunál a spawnerek nem termelnek.',
    eligible: s => runtime.hasSpawner(s)
  }, {
    id: 'mono_veteran',
    icon: '⭐',
    name: 'Egységes hadsereg',
    description: 'Amíg minden aktív katonai spawner ugyanazt az egységet gyártja, minden új egység Veterán: +50% HP és +50% sebzés.',
    eligible: s => runtime.hasSpawner(s)
  }, {
    id: 'sacred_vow',
    icon: '🙏',
    name: 'Szent fogadalom',
    description: 'A Pap többé nem támad. Minden ciklusban gyógyít, +50% Healing Powert kap, és ideiglenes Shieldet ad.',
    eligible: s => runtime.unitAvailable(s, 'priest')
  }, {
    id: 'cavalry_charge',
    icon: '🐎',
    name: 'Roham',
    description: 'Lovasság minden 60 megtett lane-egység után +10% sebzést gyűjt a következő támadására.',
    eligible: s => runtime.unitAvailable(s, 'knight')
  }, {
    id: 'swordsman_triple',
    icon: '🗡️',
    name: 'Sorozás',
    description: 'A Kaszárnya 1 helyett 3 Kardost gyárt, +100% gyártási idővel, két Kardos költségéért.',
    eligible: s => runtime.unitAvailable(s, 'swordsman')
  }, {
    id: 'phalanx',
    icon: '🔱',
    name: 'Falanksz',
    description: '3 közeli Lándzsás Falankszot alkot: nem lehet rajtuk áthaladni, nem lökhetők hátra, counter sebzésük megduplázódik.',
    eligible: s => runtime.unitAvailable(s, 'spearman')
  }, {
    id: 'catapult_aoe',
    icon: '💣',
    name: 'Repeszgránát',
    description: 'Katapult egységek ellen is teljes 40 sebzést okoz, kis területen minden ellenségnek.',
    eligible: s => runtime.unitAvailable(s, 'catapult')
  }, {
    id: 'mage_ward',
    icon: '🔮',
    name: 'Arcane Ward',
    description: 'Minden Fireball-cast 15 ideiglenes Shieldet ad minden közeli szövetségesnek.',
    eligible: s => runtime.unitAvailable(s, 'mage')
  }, {
    id: 'archer_skirmish',
    icon: '🏹',
    name: 'Skirmisherek',
    description: 'Íjász +50% movement speed. Melee veszélynél hátrál, és csak biztonságos távolságból lő.',
    eligible: s => runtime.unitAvailable(s, 'archer')
  }, {
    id: 'momentum',
    icon: '💨',
    name: 'Lendület',
    description: 'A Lovag Damage bónusza megegyezik az aktuális Movement Speed bónuszának 100%-ával.',
    eligible: s => runtime.unitAvailable(s, 'knight')
  }, {
    id: 'long_training',
    icon: '🎖️',
    name: 'Hosszú kiképzés',
    description: 'A helyőrségben 15 másodpercet váró egység Veteránná válik: +100% HP és +100% Damage.',
    eligible: s => runtime.hasSpawner(s)
  }, {
    id: 'glass_cannon',
    icon: '🩸',
    name: 'Üvegágyú',
    description: 'Minden saját egység +100% Damage, de −50% Max HP.',
    eligible: s => runtime.hasSpawner(s)
  }, {
    id: 'last_line',
    icon: '🔥',
    name: 'Utolsó védvonal',
    description: 'Minden elvesztett saját lane-torony után minden jelenlegi és jövőbeli egység +25% Damage és +25% Max HP. Stackel.',
    eligible: s => runtime.hasSpawner(s)
  }, {
    id: 'specialization',
    icon: '🎯',
    name: 'Specializáció',
    description: 'Ha olyan Normal relicet választasz, amiből már van legalább 1 stacked, 50% eséllyel +1 extra stacket kapsz belőle.',
    eligible: s => Object.values(s.normal).some(n => n > 0)
  }, {
    id: 'full_blueprints',
    icon: '📚',
    name: 'Teljes tervtár',
    description: 'Minden épület azonnal feloldódik. Csak akkor jelenhet meg, ha legalább 3 épülettípus még hiányzik.',
    eligible: s => runtime.lockedBuildingCount(s) >= 3
  }, {
    id: 'wide_choice',
    icon: '🃏',
    name: 'Bő választék',
    description: 'Minden picknél 4 helyett 5 opció jelenik meg, és a véletlen Legendary pick esélye megduplázódik.',
    eligible: () => true
  }, {
    id: 'double_choice',
    icon: '✌️',
    name: 'Kettős választás',
    description: 'Minden 3. nem-Legendary picknél 2 opciót választhatsz ugyanabból a kínálatból. Legendary pick nem számít bele.',
    eligible: () => true
  }, {
    id: 'barracks_spear',
    icon: '🔱',
    name: 'Vegyes kiképzés',
    description: 'A Kaszárnya a Kardos mellett külön, párhuzamos ciklusban Lándzsást is gyárt. A Lándzsás saját gyártási idejénél 50%-kal lassabban.',
    eligible: s => runtime.hasBuilding(s, 'barracks')
  }, {
    id: 'barracks_archer',
    icon: '🏹',
    name: 'Íjászkiképzés',
    description: 'A Kaszárnya a Kardos mellett külön, párhuzamos ciklusban Íjászt is gyárt. Az Íjász saját gyártási idejénél 50%-kal lassabban.',
    eligible: s => runtime.hasBuilding(s, 'barracks')
  }, {
    id: 'full_garrison_economy',
    icon: '🏦',
    name: 'Teltház',
    description: 'Amíg a helyőrség teljesen tele van, minden nyersanyagtermelés +100%.',
    eligible: s => runtime.hasSpawner(s)
  }, {
    id: 'large_garrison',
    icon: '🚪',
    name: 'Nagy kapacitás',
    description: '+100% helyőrség-kapacitás és +100% kapun való kihaladási sebesség.',
    eligible: s => runtime.hasSpawner(s)
  }, {
    id: 'road_rush',
    icon: '🏃',
    name: 'Rohamút',
    description: 'A lane saját térfelén minden egységed +75% Movement Speedet kap.',
    eligible: s => runtime.hasSpawner(s)
  }, {
    id: 'overproduction',
    icon: '📦',
    name: 'Túltermelés',
    description: 'Minden összesen 30 egységnyi túltermelt nyersanyag után minden jelenlegi és jövőbeli egységed +1% Damage-et kap. Korlátlanul stackel.',
    eligible: () => true
  }, {
    id: 'instant_l3',
    icon: '⚡',
    name: 'Gyorsított fejlesztés',
    description: 'Ha épületfejlesztés-picket választasz, az adott épülettípus azonnal L3-ra ugrik.',
    eligible: s => runtime.buildingUpgradePool(s).length > 0
  }, {
    id: 'arm_the_people',
    icon: '🧑‍🌾',
    name: 'Fegyverbe a népet',
    description: 'Minden Favágó, Kővágó és Farm 30 másodpercenként 1 Kardost termel ingyen a normál termelése mellett.',
    eligible: s => ['lumber', 'stonecutter', 'farm'].some(k => runtime.hasBuilding(s, k))
  }, {
    id: 'mage_proliferation',
    icon: '🔮',
    name: 'Arcane Proliferation',
    description: 'A Mágustorony elveszíti a Unique jelölést. Mostantól korlátlan számú Mágustornyot építhetsz.',
    eligible: s => runtime.unitAvailable(s, 'mage')
  }, {
    id: 'mage_triple',
    icon: '🔥',
    name: 'Háromszoros varázslat',
    description: 'Minden Mágus-támadás 3 Fireballt lő ki egyszerre 3 különböző célpontra. Mindegyik 50% sebzést és teljes AOE-t kap.',
    eligible: s => runtime.unitAvailable(s, 'mage')
  }, {
    id: 'holy_wave',
    icon: '✨',
    name: 'Szent hullám',
    description: 'A Pap minden gyógyítása minden közeli szövetségest a teljes gyógyítási értékkel gyógyít.',
    eligible: s => runtime.unitAvailable(s, 'priest')
  }, {
    id: 'holy_retribution',
    icon: '☀️',
    name: 'Szent visszacsapás',
    description: 'A Pap minden gyógyítása a gyógyított célpont körül ugyanakkora értékű Magic sebzést oszt ki az ellenségeknek.',
    eligible: s => runtime.unitAvailable(s, 'priest')
  }, {
    id: 'catapult_range_as',
    icon: '🎯',
    name: 'Távolsági ostrom',
    description: 'Katapult +50% Attack Range és +50% Attack Speed.',
    eligible: s => runtime.unitAvailable(s, 'catapult')
  }, {
    id: 'catapult_knockback',
    icon: '💥',
    name: 'Ostromlökés',
    description: 'A Katapult találata erősen hátralöki a célpontot; az maga előtt más ellenségeket is továbbtolhat.',
    eligible: s => runtime.unitAvailable(s, 'catapult')
  }, {
    id: 'sword_execute',
    icon: '☠️',
    name: 'Kivégzés',
    description: 'A Kardos azonnal megöli azt az ellenséges egységet, amely a találat előtt 20% Max HP alatt van.',
    eligible: s => runtime.unitAvailable(s, 'swordsman')
  }, {
    id: 'sword_whirlwind',
    icon: '🌪️',
    name: 'Forgószél',
    description: 'A Kardos minden 3. támadása az összes közeli ellenséget 100% sebzéssel eltalálja.',
    eligible: s => runtime.unitAvailable(s, 'swordsman')
  }, {
    id: 'spear_pierce',
    icon: '➶',
    name: 'Átdöfés',
    description: 'A Lándzsás minden támadása áthatol a célponton, és a mögötte egy vonalban álló ellenségeket is 100% sebzéssel eltalálja.',
    eligible: s => runtime.unitAvailable(s, 'spearman')
  }, {
    id: 'spear_brace',
    icon: '🔱',
    name: 'Kitámasztott lándzsa',
    description: 'Amikor egy ellenség először belép egy Lándzsás hatótávjába, a Lándzsás azonnal egy ingyenes normál támadást hajt végre.',
    eligible: s => runtime.unitAvailable(s, 'spearman')
  }, {
    id: 'archer_volley',
    icon: '🏹',
    name: 'Nyílzápor',
    description: 'Az Íjász minden 5. támadáskor 5 nyilat lő ki egyszerre, legfeljebb 5 különböző célpontra, 100% sebzéssel.',
    eligible: s => runtime.unitAvailable(s, 'archer')
  }, {
    id: 'archer_close_combat',
    icon: '🎯',
    name: 'Hosszúíj',
    description: 'Az Íjász sebzése a célpont távolságával nő, maximum +200% Damage bónuszig.',
    eligible: s => runtime.unitAvailable(s, 'archer')
  }, {
    id: 'knight_dismount',
    icon: '🐎',
    name: 'Leszáll a nyeregből',
    description: 'Amikor egy Lovag harcban meghal, a helyén azonnal megjelenik egy Kardos 100% HP-val.',
    eligible: s => runtime.unitAvailable(s, 'knight')
  });
  runtime.v17Style = document.createElement('style');
  runtime.v17Style.textContent = "@import url(\"" + (assetUrl("styles/features/city-support-balance-2.css") + "\");");
  document.head.appendChild(runtime.v17Style);
  runtime.multFlash = document.createElement('div');
  runtime.multFlash.id = 'multFlash';
  runtime.multFlash.className = 'multFlash';
  runtime.multFlash.textContent = '×2';
  document.body.appendChild(runtime.multFlash);
}
