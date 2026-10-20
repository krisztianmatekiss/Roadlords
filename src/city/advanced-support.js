import { assetUrl } from '../assets/urls.js';
export function initializeCityAdvancedSupport(runtime) {
  runtime.$('#relicOverlay .ledgerhead h2').textContent = 'Aktív ereklyék';
  runtime.$('#restartBtn').textContent = 'ÚJ MENET';
  runtime.v4HungarianTerms = [[/spawner/gi, 'katonai termelő'], [/spawnol/gi, 'legyárt'], [/spawn/gi, 'gyártás'], [/attack range/gi, 'hatótáv'], [/attack speed/gi, 'támadási sebesség'], [/movement speed/gi, 'mozgási sebesség'], [/max hp/gi, 'maximális HP'], [/damage/gi, 'sebzés'], [/healing power/gi, 'gyógyítóerő'], [/shield/gi, 'pajzs'], [/ranged/gi, 'távolsági'], [/melee/gi, 'közelharci'], [/cavalry/gi, 'lovasság'], [/heavy/gi, 'nehéz'], [/building/gi, 'épület'], [/fireball/gi, 'tűzgolyó'], [/legendary/gi, 'legendás'], [/normal/gi, 'gyakori'], [/relic/gi, 'ereklye'], [/stackelhető/gi, 'halmozható'], [/stackel/gi, 'halmozódik'], [/stack/gi, 'halmozás'], [/random/gi, 'véletlenszerű'], [/runra/gi, 'menetre'], [/runból/gi, 'menetből'], [/run/gi, 'menet']];
  for (const item of [...runtime.NORMAL, ...runtime.LEGENDARY]) item.description = runtime.hungarianText(item.description);
  runtime.legendNames = {
    mage_proliferation: 'Mágikus sokszorosítás',
    mage_ward: 'Mágikus oltalom',
    archer_skirmish: 'Portyázó íjászok',
    specialization: 'Szakosodás',
    wide_choice: 'Bő választék',
    double_choice: 'Kettős választás'
  };
  for (const x of runtime.LEGENDARY) if (runtime.legendNames[x.id]) x.name = runtime.legendNames[x.id];
  runtime.doubleChoice = runtime.LEGENDARY.find(x => x.id === 'double_choice');
  if (runtime.doubleChoice) runtime.doubleChoice.description = 'Minden harmadik nem legendás választásnál két külön lehetőséget választhatsz ugyanabból a kínálatból. A legendás választás nem számít bele.';
  runtime.$('.brand small').textContent = 'V4.1 · ERŐSEBB AI';
  runtime.$('#nextPick').parentElement.querySelector('small').textContent = 'KÖVETKEZŐ VÁLASZTÁS';
  runtime.$('#pauseBtn').onclick = () => {
    if (runtime.state.startChoices > 0 || runtime.state.ended) return;
    if (runtime.state.modal) {
      runtime.toast('Előbb válassz, vagy rejtsd el a várakozó választást.');
      return;
    }
    runtime.state.running = !runtime.state.running;
    runtime.$('#pauseBtn').classList.toggle('on', !runtime.state.running);
    runtime.$('#pauseBtn').textContent = runtime.state.running ? 'Ⅱ' : '▶';
  };
  runtime.v4Style.textContent += "@import url(\"" + (assetUrl("styles/features/city-advanced-support-4.css") + "\");");
  runtime.$('#relicBtn').title = 'Aktív ereklyék';
  runtime.NORMAL.splice(0, runtime.NORMAL.length, {
    id: 'spawn_speed',
    icon: '⚙️',
    name: 'Gyorsított gyártás',
    description: 'Minden katonai termelő +10% gyártási sebességet kap.',
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
    name: 'Általános harci kiképzés',
    description: 'Minden egység sebzése +10%.',
    eligible: s => runtime.hasSpawner(s)
  }, {
    id: 'all_hp',
    icon: '❤',
    name: 'Általános állóképesség',
    description: 'Minden egység maximális HP-ja +10%.',
    eligible: s => runtime.hasSpawner(s)
  }, {
    id: 'inf_training',
    icon: '🗡️',
    name: 'Gyalogsági kiképzés',
    description: 'Minden gyalogos egység +8% sebzést és +8% maximális HP-t kap.',
    eligible: s => runtime.catAvailable(s, 'infantry')
  }, {
    id: 'mag_training',
    icon: '✨',
    name: 'Mágikus kiképzés',
    description: 'A Pap és a Mágus +8% sebzést és +8% maximális HP-t kap. A Pap gyógyítása is +8%.',
    eligible: s => runtime.catAvailable(s, 'magic')
  }, {
    id: 'swordsman_dmg',
    icon: '🗡️',
    name: 'Kardos – Sebzés',
    description: 'A Kardos sebzése +10%.',
    eligible: s => runtime.unitAvailable(s, 'swordsman')
  }, {
    id: 'swordsman_hp',
    icon: '🛡️',
    name: 'Kardos – Életerő',
    description: 'A Kardos maximális HP-ja +10%.',
    eligible: s => runtime.unitAvailable(s, 'swordsman')
  }, {
    id: 'sword_as',
    icon: '🗡️',
    name: 'Kardforgatás',
    description: 'A Kardos támadási sebessége +15%.',
    eligible: s => runtime.unitAvailable(s, 'swordsman')
  }, {
    id: 'spear_dmg',
    icon: '🔱',
    name: 'Lándzsás – Sebzés',
    description: 'A Lándzsás sebzése +10%.',
    eligible: s => runtime.unitAvailable(s, 'spearman')
  }, {
    id: 'spear_hp',
    icon: '🛡️',
    name: 'Lándzsás – Életerő',
    description: 'A Lándzsás maximális HP-ja +10%.',
    eligible: s => runtime.unitAvailable(s, 'spearman')
  }, {
    id: 'spear_range',
    icon: '🔱',
    name: 'Hosszabb lándzsa',
    description: 'A Lándzsás támadási hatótávja +10%.',
    eligible: s => runtime.unitAvailable(s, 'spearman')
  }, {
    id: 'archer_dmg',
    icon: '🏹',
    name: 'Íjász – Sebzés',
    description: 'Az Íjász sebzése +10%.',
    eligible: s => runtime.unitAvailable(s, 'archer')
  }, {
    id: 'archer_hp',
    icon: '🛡️',
    name: 'Íjász – Életerő',
    description: 'Az Íjász maximális HP-ja +10%.',
    eligible: s => runtime.unitAvailable(s, 'archer')
  }, {
    id: 'archer_range',
    icon: '🏹',
    name: 'Erősebb íj',
    description: 'Az Íjász támadási hatótávja +10%.',
    eligible: s => runtime.unitAvailable(s, 'archer')
  }, {
    id: 'knight_dmg',
    icon: '🐎',
    name: 'Lovag – Sebzés',
    description: 'A Lovag sebzése +10%.',
    eligible: s => runtime.unitAvailable(s, 'knight')
  }, {
    id: 'knight_hp',
    icon: '🛡️',
    name: 'Lovag – Életerő',
    description: 'A Lovag maximális HP-ja +10%.',
    eligible: s => runtime.unitAvailable(s, 'knight')
  }, {
    id: 'knight_move',
    icon: '🐎',
    name: 'Harci mén',
    description: 'A Lovag mozgási sebessége +15%.',
    eligible: s => runtime.unitAvailable(s, 'knight')
  }, {
    id: 'priest_dmg',
    icon: '✦',
    name: 'Pap – Sebzés',
    description: 'A Pap sebzése +10%.',
    eligible: s => runtime.unitAvailable(s, 'priest')
  }, {
    id: 'priest_hp',
    icon: '🛡️',
    name: 'Pap – Életerő',
    description: 'A Pap maximális HP-ja +10%.',
    eligible: s => runtime.unitAvailable(s, 'priest')
  }, {
    id: 'priest_heal',
    icon: '✦',
    name: 'Áldás',
    description: 'A Pap gyógyítóereje +15%.',
    eligible: s => runtime.unitAvailable(s, 'priest')
  }, {
    id: 'catapult_dmg',
    icon: '🪨',
    name: 'Katapult – Sebzés',
    description: 'A Katapult sebzése +10%. Az épületek elleni alapsebzése is ezzel együtt nő.',
    eligible: s => runtime.unitAvailable(s, 'catapult')
  }, {
    id: 'catapult_hp',
    icon: '🛡️',
    name: 'Katapult – Életerő',
    description: 'A Katapult maximális HP-ja +10%.',
    eligible: s => runtime.unitAvailable(s, 'catapult')
  }, {
    id: 'cat_build',
    icon: '💥',
    name: 'Nehéz lövedék',
    description: 'A Katapult épületek elleni sebzése +25%.',
    eligible: s => runtime.unitAvailable(s, 'catapult')
  }, {
    id: 'mage_dmg',
    icon: '🔮',
    name: 'Mágus – Sebzés',
    description: 'A Mágus sebzése +10%.',
    eligible: s => runtime.unitAvailable(s, 'mage')
  }, {
    id: 'mage_hp',
    icon: '🛡️',
    name: 'Mágus – Életerő',
    description: 'A Mágus maximális HP-ja +10%.',
    eligible: s => runtime.unitAvailable(s, 'mage')
  }, {
    id: 'mage_aoe',
    icon: '🔥',
    name: 'Szélesebb tűzgolyó',
    description: 'A Mágus tűzgolyójának területi sugara +15%.',
    eligible: s => runtime.unitAvailable(s, 'mage')
  }, {
    id: 'frugal_training',
    icon: '🪙',
    name: 'Takarékos kiképzés',
    description: 'Minden egység nyersanyagköltsége 5%-kal csökken.',
    eligible: s => runtime.hasSpawner(s)
  }, {
    id: 'tower_crews',
    icon: '🏹',
    name: 'Toronykezelők',
    description: 'Minden torony támadási sebessége, sebzése, maximális HP-ja és hatótávja +8%.',
    eligible: () => true
  }, {
    id: 'gate_discipline',
    icon: '🚪',
    name: 'Kapufegyelem',
    description: 'A kapu kiengedési sebessége +10%, a helyőrség kapacitása pedig +5.',
    eligible: () => true
  });
  runtime.v42RemovedLegends = new Set(['full_blueprints', 'swordsman_triple', 'catapult_aoe', 'archer_volley', 'barracks_spear', 'barracks_archer']);
  for (let i = runtime.LEGENDARY.length - 1; i >= 0; i--) if (runtime.v42RemovedLegends.has(runtime.LEGENDARY[i].id)) runtime.LEGENDARY.splice(i, 1);
  runtime.v42Legend = (id, patch) => {
    const x = runtime.LEGENDARY.find(v => v.id === id);
    if (x) Object.assign(x, patch);
  };
  runtime.v42Legend('cavalry_charge', {
    name: 'Elsöprő roham',
    description: 'A Lovag minden megtett 50 útegység után +25% sebzést gyűjt a következő támadására, legfeljebb +200%-ig.'
  });
  runtime.v42Legend('long_training', {
    name: 'Harctéri kiképzés',
    description: 'A helyőrségben 8 másodpercet váró egység Veteránná válik: +50% életerő és +50% sebzés.'
  });
  runtime.v42Legend('large_garrison', {
    name: 'Erődített helyőrség',
    description: 'A helyőrség kapacitása és a kapu kiengedési sebessége megduplázódik. A kiengedett egységek 25% ideiglenes pajzsot kapnak.'
  });
  runtime.v42Legend('instant_l3', {
    name: 'Mesterműhelyek',
    description: 'Minden épületfejlesztés egy helyett két szintet emel, de L4 fölé nem vihet épületet.'
  });
  runtime.v42Legend('arm_the_people', {
    name: 'Felfegyverzett polgárság',
    description: 'Minden öt Favágó, Kővágó vagy Farm együtt 30 másodpercenként egy ingyenes Kardost állít ki. Egyszerre legfeljebb három készülhet.'
  });
  runtime.v42Legend('holy_wave', {
    name: 'Szent pajzs',
    description: 'A Pap gyógyítása a célpont maximális életerejének 25%-ával megegyező, 5 másodperces pajzsot is ad.'
  });
  runtime.LEGENDARY.push({
    id: 'bloodlust',
    icon: '🩸',
    name: 'Vérszomj',
    description: 'Ha egy Kardos megöl egy ellenséget, azonnal újra támadhat és visszagyógyul maximális életerejének 15%-ával.',
    eligible: s => runtime.unitAvailable(s, 'swordsman')
  }, {
    id: 'marking_arrow',
    icon: '🎯',
    name: 'Jelzőnyíl',
    description: 'Az Íjász találata 4 másodpercre megjelöli a célpontot. A megjelölt célpont +50% sebzést kap minden távolsági egységtől.',
    eligible: s => runtime.unitAvailable(s, 'archer')
  }, {
    id: 'artillery_sighting',
    icon: '💥',
    name: 'Tüzérségi bemérés',
    description: 'A Katapult ugyanazon épület elleni egymást követő lövései +50% sebzést halmoznak, legfeljebb +200%-ig.',
    eligible: s => runtime.unitAvailable(s, 'catapult')
  }, {
    id: 'supply_hub',
    icon: '📦',
    name: 'Ellátási központ',
    description: 'A Raktárral közvetlenül szomszédos katonai termelők egységköltsége −30%.',
    eligible: s => runtime.hasSpawner(s) && runtime.hasBuilding(s, 'warehouse')
  }, {
    id: 'castle_defenders',
    icon: '🏰',
    name: 'Várvédők',
    description: 'Amíg mindhárom saját úttorony áll, a helyőrségből kiengedett egységek Veteránként vonulnak ki.',
    eligible: s => runtime.hasSpawner(s)
  }, {
    id: 'combined_assault',
    icon: '⚔️',
    name: 'Összfegyvernemi roham',
    description: 'Ha egy kiengedett hullámban legalább három egységkategória jelen van, a hullám +25% mozgási és támadási sebességet kap.',
    eligible: s => runtime.hasSpawner(s)
  });
  Object.assign(runtime.PICK_UNIT_IMAGES, {
    inf_training: 'swordsman',
    mag_training: 'mage',
    swordsman_dmg: 'swordsman',
    swordsman_hp: 'swordsman',
    sword_as: 'swordsman',
    spear_dmg: 'spearman',
    spear_hp: 'spearman',
    spear_range: 'spearman',
    archer_dmg: 'archer',
    archer_hp: 'archer',
    archer_range: 'archer',
    knight_dmg: 'knight',
    knight_hp: 'knight',
    knight_move: 'knight',
    priest_dmg: 'priest',
    priest_hp: 'priest',
    priest_heal: 'priest',
    catapult_dmg: 'catapult',
    catapult_hp: 'catapult',
    cat_build: 'catapult',
    mage_dmg: 'mage',
    mage_hp: 'mage',
    mage_aoe: 'mage',
    bloodlust: 'swordsman',
    marking_arrow: 'archer',
    artillery_sighting: 'catapult',
    combined_assault: 'swordsman'
  });
  Object.assign(runtime.PICK_IMAGES, {
    all_damage: runtime.PICK_IMAGES.all_damage || runtime.PICK_IMAGES.production,
    all_hp: runtime.PICK_IMAGES.all_hp || runtime.PICK_IMAGES.building_hp,
    frugal_training: runtime.PICK_IMAGES.production,
    tower_crews: runtime.PICK_IMAGES.building_hp,
    gate_discipline: runtime.PICK_IMAGES.all_as,
    supply_hub: runtime.PICK_IMAGES.production,
    castle_defenders: runtime.PICK_IMAGES.building_hp
  });
}
