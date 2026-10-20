import { assetUrl } from '../assets/urls.js';
export function initializeDataBuildingBranches(runtime) {
  runtime.V4_SIMPLE_L4 = new Set(['lumber', 'stonecutter', 'farm', 'warehouse', 'house']);
  runtime.V4_BRANCHES = {
    keep: [{
      id: 'empire',
      name: 'Birodalmi központ',
      icon: '♛',
      description: 'A Főépület minden nyersanyagból 16-ot termel másodpercenként, 1600-as tárolókapacitást ad, kétszer sűrűbben érkeznek a választások, és +1 választási lehetőséget kínál.'
    }, {
      id: 'warcapital',
      name: 'Hadifőváros',
      icon: '⚔',
      description: 'A Főépület 320 000 HP-t kap, a főkapu azonnal kiengedi a teljes helyőrséget, és minden saját egység +50% maximális HP-t és sebzést kap.'
    }],
    barracks: [{
      id: 'conscription',
      name: 'Sorozás',
      icon: '⚔',
      description: 'A Kaszárnya minden gyártási ciklusban két Kardost képez. Mindkét egység teljes költségét ki kell fizetni.'
    }, {
      id: 'cavalry_barracks',
      name: 'Lovassági laktanya',
      icon: '♞',
      description: 'A közvetlenül szomszédos Istálló mellett álló Kaszárnya Kardos helyett ugyanazt a Lovagot képzi, mint az Istálló.'
    }],
    spearhall: [{
      id: 'pike_wall',
      name: 'Pikafal',
      icon: '🔱',
      description: 'A Lándzsások +75% maximális HP-t, +50% hatótávot és +300% összes ellenbónuszt kapnak, de 25%-kal lassabban mozognak.'
    }, {
      id: 'spear_rain',
      name: 'Dárdazápor',
      icon: '➶',
      description: 'Minden Lándzsás első támadása nagy hatótávú, +250% sebzésű, és legfeljebb három egységet döf át.'
    }],
    archery: [{
      id: 'longbowmen',
      name: 'Hosszúíjászok',
      icon: '🏹',
      description: 'Az Íjászok +75 útegység hatótávot és +100% sebzést kapnak, de 40%-kal lassabban támadnak. Elsősorban távolsági és mágikus célpontokra lőnek.'
    }, {
      id: 'arrow_rain',
      name: 'Nyílzápor',
      icon: '☄',
      description: 'Az Íjász minden támadással legfeljebb három különböző célpontot talál el, célpontonként 60% sebzéssel.'
    }],
    stable: [{
      id: 'charge_cavalry',
      name: 'Rohamlovasság',
      icon: '🐎',
      description: 'A Lovagok +50% mozgási sebességet kapnak. Első támadásuk +400% sebzést okoz és 2 másodpercre elkábít.'
    }, {
      id: 'armored_knights',
      name: 'Vértes lovagok',
      icon: '🛡',
      description: 'A Lovagok +100% maximális HP-t és 50% fizikai sebzéscsökkentést kapnak, de 25%-kal lassabban mozognak.'
    }],
    siegeworks: [{
      id: 'trebuchet',
      name: 'Trebuchet',
      icon: '🏗',
      description: 'A Katapult +100% hatótávot és épületek ellen +300% sebzést kap, de 40%-kal lassabban támad és 25%-kal lassabban mozog.'
    }, {
      id: 'shrapnel',
      name: 'Repeszkő',
      icon: '💥',
      description: 'A lövedék nagy területen sebez: a fő célpont teljes, a környező egységek 75% sebzést kapnak, és 2 másodpercre 40%-kal lelassulnak.'
    }],
    magetower: [{
      id: 'fire_mages',
      name: 'Tűzmágusok',
      icon: '🔥',
      description: 'A Mágusok területi hatása megduplázódik. A találat további, az alapsebzéssel megegyező égést okoz 4 másodperc alatt.'
    }, {
      id: 'frost_mages',
      name: 'Fagymágusok',
      icon: '❄',
      description: 'A találat 1,5 másodpercre megfagyaszt, majd 3 másodpercre 50%-kal lassítja a mozgást és a támadást. Ugyanaz a célpont 6 másodpercenként fagyasztható meg teljesen.'
    }],
    temple: [{
      id: 'high_priests',
      name: 'Főpapok',
      icon: '✚',
      description: 'Minden gyógyítás legfeljebb négy közeli sérült szövetségest gyógyít teljes értékkel.'
    }, {
      id: 'war_priests',
      name: 'Hadipapok',
      icon: '☀',
      description: 'A gyógyított célpont 5 másodpercre +100% sebzést és +50% támadási sebességet kap.'
    }],
    market: [{
      id: 'wholesalers',
      name: 'Nagykereskedők',
      icon: '⚖',
      description: 'A Piac egyszerre két külön kereskedelmi útvonalat működtethet.'
    }, {
      id: 'war_suppliers',
      name: 'Hadiszállítók',
      icon: '📦',
      description: 'Az importált nyersanyagot használó katonai termelők +50% gyártási sebességet kapnak.'
    }],
    guildhouse: [{
      id: 'master_guild',
      name: 'Mesterek Céhe',
      icon: '🏛',
      description: 'A legfeljebb 2 mező távolságon belüli nyersanyagtermelők +125% termelést kapnak.'
    }, {
      id: 'guild_network',
      name: 'Céhhálózat',
      icon: '⌘',
      description: 'A +75%-os termelési bónusz legfeljebb 3 mező távolságon belül minden nyersanyagtermelőre hat.'
    }],
    warcenter: [{
      id: 'assembly_line',
      name: 'Futószalag',
      icon: '⚙',
      description: 'Minden harmadik elkészült egység mellé ingyenes, azonos másolat készül.'
    }, {
      id: 'quality_arms',
      name: 'Minőségi hadianyag',
      icon: '★',
      description: 'Minden negyedik elkészült egység mellé ingyenes Veterán másolat készül, +50% maximális HP-val és sebzéssel.'
    }],
    townhall: [{
      id: 'metropolis',
      name: 'Nagyváros',
      icon: '🏘',
      description: 'A legfeljebb két mezőre álló Lakóházak sereglimit-bónusza +200%-kal nő.'
    }, {
      id: 'fortress_city',
      name: 'Erődváros',
      icon: '🏰',
      description: 'A legfeljebb két mezőre álló Lakóházak sereglimit-bónusza megduplázódik, és házanként +10 helyőrség-kapacitást adnak.'
    }],
    tavern: [{
      id: 'bottoms_up',
      name: 'Fenékig!',
      icon: '🍺',
      description: 'A kapun vagy a Gyülekezőtérből kiengedett egységek első négy támadása +250% sebzést okoz.'
    }, {
      id: 'regulars',
      name: 'Törzsvendégek',
      icon: '🍻',
      description: 'A közvetlenül szomszédos katonai termelők egységei minden támadásukra +150% sebzést kapnak. A Kocsma L3-as hullámbónusza is megmarad.'
    }],
    rally: [{
      id: 'war_rally',
      name: 'Hadgyülekező',
      icon: '🚩',
      description: 'A Gyülekezőtér kapacitása 100, és a legfeljebb két mező távolságra álló katonai termelőkből is ide érkeznek az egységek.'
    }, {
      id: 'lightning_assault',
      name: 'Villámroham',
      icon: '⚡',
      description: 'A kiengedett egységek az első támadásukig +150% mozgási sebességet és lassításvédelmet, utána 5 másodpercig +100% támadási sebességet kapnak.'
    }],
    guardhouse: [{
      id: 'arrow_bastion',
      name: 'Lőréses bástya',
      icon: '🏹',
      description: '+80 kapacitást ad. Városfal mellett a főhelyőrség távolsági egységei 50% sebzéssel tüzelhetnek.'
    }, {
      id: 'assault_guard',
      name: 'Rohamőrség',
      icon: '🛡',
      description: '+80 kapacitást ad. Gyülekezőtér mellett az onnan induló egységek maximális HP-juk 50%-ával megegyező pajzsot kapnak.'
    }]
  };
  delete runtime.BUILDINGS.builders;
  for (let i = runtime.UNLOCKABLE.length - 1; i >= 0; i--) if (runtime.UNLOCKABLE[i] === 'builders' || runtime.UNLOCKABLE[i] === 'house') runtime.UNLOCKABLE.splice(i, 1);
  if (!runtime.BASIC.includes('house')) runtime.BASIC.push('house');
  for (const c of [runtime.P, runtime.E]) {
    c.unlocked.add('house');
    c.unlocked.delete('builders');
    c.buildings = c.buildings.filter(b => b.type !== 'builders');
    c.l4Branches = c.l4Branches || {};
    c.rallyReserve = c.rallyReserve || [];
    c.rallyMode = c.rallyMode || 'closed';
    c.rallyAutoReleasing = false;
    c.marketRoutes = c.marketRoutes || [{
      from: 'wood',
      to: 'stone'
    }, {
      from: 'food',
      to: 'wood'
    }];
    c.marketSwitchAt = -20;
    c.warProductionCounter = c.warProductionCounter || 0;
  }
  Object.assign(runtime.BUILDINGS.keep, {
    description: 'A birodalom központja. Alaptermelést, tárolót, fővárosi HP-t, úti sereglimitet és kapukiengedést ad.'
  });
  Object.assign(runtime.BUILDINGS.guildhouse, {
    description: 'A közelében működő Favágók, Kővágók és Farmok termelését növeli.'
  });
  Object.assign(runtime.BUILDINGS.market, {
    description: 'Folyamatos kereskedelmi útvonalon egy kiválasztott nyersanyagot egy másikra cserél. Az útvonal 20 másodpercenként módosítható.'
  });
  Object.assign(runtime.BUILDINGS.townhall, {
    description: 'A legfeljebb két mező távolságra álló Lakóházak sereglimit-bónuszát növeli.'
  });
  Object.assign(runtime.BUILDINGS.rally, {
    description: 'A környező katonai termelőkből külön tartalékba gyűjti az egységeket, majd azonnal a főkapunál veti be őket.'
  });
  Object.assign(runtime.BUILDINGS.tavern, {
    description: 'A kapun vagy a Gyülekezőtérből induló hullám első támadásait erősíti.'
  });
  Object.assign(runtime.BUILDINGS.guardhouse, {
    description: 'Városfal vagy Gyülekezőtér mellett kapacitást ad az adott tartaléknak.'
  });
  Object.assign(runtime.BUILDINGS.warcenter, {
    description: 'A katonai termelést közös számlálóval figyeli, és rendszeresen ingyenes egységmásolatot készít.'
  });
  runtime.V4_TEXT_REPLACEMENTS = {
    spawn_speed: ['Gyorsított kiképzés', 'Minden katonai termelő +10% gyártási sebességet kap.'],
    all_as: ['Gyorsabb támadások', 'Minden egység +5% támadási sebességet kap.'],
    all_hp: ['Edzett sereg', 'Minden egység +10% maximális HP-t kap.'],
    all_move: ['Menettempó', 'Minden egység +10% mozgási sebességet kap.'],
    sword_as: ['Kardforgatás', 'A Kardosok +10% támadási sebességet kapnak.'],
    spear_counter: ['Ellentartás', 'A Lándzsások +15% ellenbónuszt kapnak lovasság és nehéz egységek ellen.'],
    archer_range: ['Erősebb íj', 'Az Íjászok +10% hatótávot kapnak.'],
    knight_move: ['Harci mén', 'A Lovagok +10% mozgási sebességet kapnak.'],
    cat_build: ['Nehéz lövedék', 'A Katapultok +10% sebzést okoznak épületeknek.'],
    mage_aoe: ['Szélesebb tűzlabda', 'A Mágusok területi hatásának sugara +10%-kal nő.']
  };
  for (const n of runtime.NORMAL) {
    const x = runtime.V4_TEXT_REPLACEMENTS[n.id];
    if (x) {
      n.name = x[0];
      n.description = x[1];
    }
  }
  runtime.wide = runtime.LEGENDARY.find(x => x.id === 'wide_choice');
  if (runtime.wide) runtime.wide.description = '+1 választási lehetőséget ad minden alkalommal, és megduplázza a legendás választás esélyét.';
  runtime.v4Style = document.createElement('style');
  runtime.v4Style.textContent = "@import url(\"" + (assetUrl("styles/features/data-building-branches-3.css") + "\");");
  document.head.appendChild(runtime.v4Style);
  runtime.$('#rerollChoice').textContent = '↻ ÚJRASORSOLÁS';
  runtime.$('#banChoice').textContent = '⊘ KITILTÁS';
  runtime.$('#pickReminder').firstChild.textContent = 'VÁLASZTÁS VÁR · ';
  runtime.$('#nextPick').textContent = 'KEZDÉS';
}
