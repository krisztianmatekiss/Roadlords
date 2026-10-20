import { assetUrl } from '../assets/urls.js';
export function initializeDataRosterCleanup(runtime) {
  const removed = id => id === 'merc_tent' || id?.startsWith('merc_') || id === 'mercenary_network' || id?.startsWith('alc_') || ['tavern_damage', 'tower_guard'].includes(id);
  for (const list of [runtime.NORMAL, runtime.LEGENDARY]) for (let i = list.length - 1; i >= 0; i--) if (removed(list[i].id)) list.splice(i, 1);
  for (let i = runtime.UNLOCKABLE.length - 1; i >= 0; i--) if (runtime.UNLOCKABLE[i] === 'merc_tent') runtime.UNLOCKABLE.splice(i, 1);
  delete runtime.BUILDINGS.merc_tent;
  delete runtime.V4_BRANCHES.merc_tent;
  delete runtime.V4_BRANCHES.alchemist;
  runtime.V4_SIMPLE_L4.delete('alchemist');
  const allowed = o => !removed(o.id) && !(['building_upgrade', 'building_branch'].includes(o.kind) && o.id === 'alchemist');
  const oldUnlock = runtime.buildingUnlockPool,
    oldUpgrade = runtime.buildingUpgradePool,
    oldApply = runtime.applyChoice,
    oldLevel = runtime.setBuildingLevel,
    oldDetails = runtime.buildingUpgradeDetails;
  runtime.buildingUnlockPool = c => oldUnlock(c).filter(allowed);
  runtime.buildingUpgradePool = c => oldUpgrade(c).filter(allowed);
  runtime.applyChoice = function (c, o) {
    if (!allowed(o)) return;
    return oldApply(c, o);
  };
  runtime.setBuildingLevel = function (c, type, level, ...args) {
    if (type === 'merc_tent' || type === 'alchemist' && level > 1) return;
    return oldLevel(c, type, level, ...args);
  };
  runtime.buildingUpgradeDetails = function (c, type) {
    return type === 'alchemist' ? 'Ez az épület nem fejleszthető.' : oldDetails(c, type);
  };
  for (const d of Object.values(runtime.BUILDINGS)) d.description = d.description.replace(/^1\. szint:\s*/, '');
  Object.assign(runtime.BUILDINGS.alchemist, {
    description: 'A szomszédos katonai termelők minden új egysége egy sorsolást kap: 25% eséllyel +20% sebzést, 25% eséllyel +20% maximális életerőt, 25% eséllyel +20% támadási sebességet; 25% eséllyel nem kap bónuszt. A bónusz állandó. Termelőnként csak egy kunyhó hat.'
  });
  const copy = {
    keep: 'Másodpercenként 1 fát, 1 követ és 1 élelmet termel. Nyersanyagonként 200-at tárol. 20000 életerő, 50 úti sereghely és 30 helyőrségi férőhely. A kapu másodpercenként 5 egységet enged ki.',
    orc_hut: '+20 úti sereghelyet és +20 helyőrségi férőhelyet ad.',
    orc_arena: 'A szomszédos katonai termelők minden új egysége 10% eséllyel veterán: +50% maximális életerőt és +50% sebzést kap. Több Aréna esélye nem adódik össze.',
    orc_overseer: 'A szomszédos katonai termelők képzési ideje 20%-kal rövidebb. Új egységeik maximális életerejük 80%-ával indulnak. Több Hajcsártábor bónusza nem adódik össze.',
    orc_hunt: 'Másodpercenként 0,5 élelmet termel. A városfal mellett +50% élelemtermelés; nyitott főkapunál további +50%. A két bónusz összeadódik.',
    townhall: 'A 2 mezőn belüli Lakóházak által adott úti sereghelyek számát 50%-kal növeli.',
    rally: 'A szomszédos katonai termelők egységeit külön, 15 férőhelyes tartalékba gyűjti. Kiengedéskor +30% mozgási sebességet kapnak az első támadásukig.',
    academy: 'A szomszédos katonai termelők egységeit erősíti. Fa: vásárlásonként +1% sebzés. Kő: +1% maximális életerő. Élelem: +1% támadási sebesség. Irányonként az első vásárlás 30 nyersanyag; a következő 50%-kal drágább, felfelé kerekítve.',
    warcenter: 'Szabadon váltható módok. Tömegtermelés: +20% képzési sebesség, +15% egységár. Takarékos: −15% egységár, +20% képzési idő. Elit: +15% maximális életerő és sebzés, +20% egységár és képzési idő.',
    towercommand: 'Minden saját torony +20% maximális életerőt, sebzést, hatótávot és támadási sebességet kap. Városonként legfeljebb 1 építhető. A lövedékszámot nem növeli.'
  };
  for (const [id, description] of Object.entries(copy)) runtime.BUILDINGS[id].description = description;
  Object.assign(window.__ROADLORDS__, {
    buildingUpgradePool: runtime.buildingUpgradePool,
    buildingUnlockPool: runtime.buildingUnlockPool,
    buildingUpgradeDetails: runtime.buildingUpgradeDetails,
    applyChoice: runtime.applyChoice,
    setBuildingLevel: runtime.setBuildingLevel
  });
}
