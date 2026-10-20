import { assetUrl } from '../assets/urls.js';
export function initializeDataUpgrades(runtime) {
  runtime.NORMAL = [{
    id: 'spawn_speed',
    icon: '⚙️',
    name: 'Gyorsított gyártás',
    description: 'Minden spawner +10% gyártási sebesség.',
    eligible: s => runtime.hasSpawner(s)
  }, {
    id: 'production',
    icon: '📈',
    name: 'Fokozott termelés',
    description: 'Minden nyersanyagtermelés +10%.',
    eligible: () => true
  }, {
    id: 'all_damage',
    icon: '⚔️',
    name: 'Harci fegyelem',
    description: 'Minden egység +5% sebzés.',
    eligible: s => runtime.hasSpawner(s)
  }, {
    id: 'all_as',
    icon: '⏱️',
    name: 'Gyorsabb támadások',
    description: 'Minden egység +5% attack speed.',
    eligible: s => runtime.hasSpawner(s)
  }, {
    id: 'all_hp',
    icon: '❤',
    name: 'Edzett sereg',
    description: 'Minden egység +10% Max HP.',
    eligible: s => runtime.hasSpawner(s)
  }, {
    id: 'all_move',
    icon: '👢',
    name: 'Menettempó',
    description: 'Minden egység +10% movement speed.',
    eligible: s => runtime.hasSpawner(s)
  }, {
    id: 'building_hp',
    icon: '🏰',
    name: 'Megerősített építmények',
    description: 'Főváros és úttornyok +10% Max HP.',
    eligible: () => true
  }, {
    id: 'inf_dmg',
    icon: '🗡️',
    name: 'Gyalogsági fegyelem',
    description: 'Gyalogság +10% sebzés.',
    eligible: s => runtime.catAvailable(s, 'infantry')
  }, {
    id: 'cav_dmg',
    icon: '🐎',
    name: 'Lovassági fegyelem',
    description: 'Lovasság +10% sebzés.',
    eligible: s => runtime.catAvailable(s, 'cavalry')
  }, {
    id: 'mag_dmg',
    icon: '✨',
    name: 'Mágikus fegyelem',
    description: 'Mágikus egységek +10% sebzés.',
    eligible: s => runtime.catAvailable(s, 'magic')
  }, {
    id: 'sie_dmg',
    icon: '🏗️',
    name: 'Ostromfegyelem',
    description: 'Ostromegységek +10% sebzés.',
    eligible: s => runtime.catAvailable(s, 'siege')
  }, {
    id: 'inf_hp',
    icon: '🛡️',
    name: 'Gyalogsági állóképesség',
    description: 'Gyalogság +10% Max HP.',
    eligible: s => runtime.catAvailable(s, 'infantry')
  }, {
    id: 'cav_hp',
    icon: '🛡️',
    name: 'Lovassági állóképesség',
    description: 'Lovasság +10% Max HP.',
    eligible: s => runtime.catAvailable(s, 'cavalry')
  }, {
    id: 'mag_hp',
    icon: '🛡️',
    name: 'Mágikus állóképesség',
    description: 'Mágikus egységek +10% Max HP.',
    eligible: s => runtime.catAvailable(s, 'magic')
  }, {
    id: 'sie_hp',
    icon: '🛡️',
    name: 'Ostromállóképesség',
    description: 'Ostromegységek +10% Max HP.',
    eligible: s => runtime.catAvailable(s, 'siege')
  }, {
    id: 'sword_as',
    icon: '🗡️',
    name: 'Kardforgatás',
    description: 'Kardos +10% attack speed.',
    eligible: s => runtime.unitAvailable(s, 'swordsman')
  }, {
    id: 'spear_counter',
    icon: '🔱',
    name: 'Ellentartás',
    description: 'Lándzsás +15% counter damage Cavalry/Heavy ellen.',
    eligible: s => runtime.unitAvailable(s, 'spearman')
  }, {
    id: 'archer_range',
    icon: '🏹',
    name: 'Erősebb íj',
    description: 'Íjász +10% attack range.',
    eligible: s => runtime.unitAvailable(s, 'archer')
  }, {
    id: 'knight_move',
    icon: '🐎',
    name: 'Harci mén',
    description: 'Lovag +10% movement speed.',
    eligible: s => runtime.unitAvailable(s, 'knight')
  }, {
    id: 'priest_heal',
    icon: '✦',
    name: 'Áldás',
    description: 'Pap +15% gyógyítás.',
    eligible: s => runtime.unitAvailable(s, 'priest')
  }, {
    id: 'cat_build',
    icon: '🪨',
    name: 'Nehéz lövedék',
    description: 'Katapult +10% Building damage.',
    eligible: s => runtime.unitAvailable(s, 'catapult')
  }, {
    id: 'mage_aoe',
    icon: '🔥',
    name: 'Szélesebb tűzlabda',
    description: 'Mágus +10% AOE sugár.',
    eligible: s => runtime.unitAvailable(s, 'mage')
  }];
  runtime.LEGENDARY = [{
    id: 'chain_spawn',
    icon: '⚙️',
    name: 'Láncreakció',
    description: 'Normál spawnnál 25% eséllyel egy random másik spawner ingyen spawnol 1 egységet. Nem láncol.',
    eligible: s => runtime.spawnerBuildings(s).length >= 2
  }, {
    id: 'siege_doctrine',
    icon: '💥',
    name: 'Rögtönzött ostrom',
    description: 'Minden nem-Ostrom egység +100% sebzést okoz Buildingek ellen.',
    eligible: s => runtime.hasSpawner(s)
  }, {
    id: 'loopholes',
    icon: '🏰',
    name: 'Lőrések',
    description: 'A garrisonban várakozó Ranged egységek a Fővárosból lőhetnek, -50% Damage és -50% Range mellett.',
    eligible: s => runtime.unitAvailable(s, 'archer')
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
    description: 'Normál spawnnál minden közvetlenül szomszédos spawner +25% gyártási progresszt kap.',
    eligible: s => runtime.spawnerBuildings(s).length >= 2
  }, {
    id: 'double_assault',
    icon: '🚪',
    name: 'Kettős roham',
    description: 'Kapunyitáskor minden bent várakozó egységből létrejön egy 15 másodperces ideiglenes másolat.',
    eligible: s => runtime.hasSpawner(s)
  }, {
    id: 'regen',
    icon: '💚',
    name: 'Regeneráció',
    description: 'Minden egységed másodpercenként a Max HP-ja 2,5%-át gyógyulja.',
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
    id: 'every10',
    icon: '➕',
    name: 'Tizedik hullám',
    description: 'Minden 10. normál spawn létrehoz még 1 ingyenes példányt ugyanabból az egységből. Nem láncol.',
    eligible: s => runtime.hasSpawner(s)
  }, {
    id: 'combined_arms',
    icon: '🛡️',
    name: 'Teljes hadrend',
    description: 'Gyalogság + Lovasság + Mágikus + Ostrom együtt a garrisonban: a kiengedett hullám +50% Max HP Shieldet kap.',
    eligible: s => ['infantry', 'cavalry', 'magic', 'siege'].every(c => runtime.catAvailable(s, c))
  }, {
    id: 'mono_veteran',
    icon: '⭐',
    name: 'Egységes hadsereg',
    description: 'Amíg minden katonai spawner ugyanazt az egységet gyártja, minden új egység Veterán: +50% HP és +50% sebzés.',
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
    description: '3 közeli Lándzsás Falankszot alkot: nem lehet rajtuk áthaladni, counter sebzésük megduplázódik.',
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
  }];
}
