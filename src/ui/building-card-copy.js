const shortLabels = { 'Főváros HP': 'Életerő', 'Úti sereglimit': 'Sereghely',
  'Alap sereglimit': 'Sereghely', 'Alaptermelés': 'Termelés',
  'Fa és kő másodpercenként': 'Fa és kő/mp', 'Élelem másodpercenként': 'Élelem/mp',
  'Ingyen reroll / választás': 'Újrasorsolás', 'Bónusz / stack': 'Bónusz / vétel' };
const excluded = /Tényleges|Terepbónusz|Városháza|Feltétel|Korlát|L4|Összes bónusz|Kocsmák|Buffolt|Őrházlánc|Bekötés|Módváltás|Útvonalváltás|Következő|Globális recept|Recept|Főzeterő|X tényleges|Aktív főzethelyek|Max célpont|Hatókör|Fa ·|Kő ·|Élelem ·/;

// Shared selected-level text for the codex and picks. Never mutates a live city.
export function createBuildingCardCopy(R) {
  const cache = new Map();
  const undead = () => window.__ROADLORDS_UNDEAD__;
  const definitions = (race, type) => race === 'undead' ? undead().buildings[type] : R.BUILDINGS[type];
  function cityFor(race, type, level) {
    const c = structuredClone(R.ROAD.templates[0]);
    c.race = race; c.normal = {}; c.legends = new Set(); c.legendaryStacks = {};
    c.levels = { [type]: level }; c.l4Branches = {}; c.terrain.fill(null);
    c.buildings = c.buildings.filter(b => b.type === 'keep');
    R.initializeFactionCity(c);
    let b = c.buildings[0]; b.level = type === 'keep' ? level : 1;
    if (type !== 'keep') {
      b = { id: 'codex-' + type, type, level, row: 0, col: 0, rotation: 0, progress: 0, paidCost: R.C() };
      c.buildings.push(b);
    }
    c.unlocked.add(type);
    R.recomputeCity(c, false);
    return [c, b];
  }
  function metrics(race, type, level) {
    const key = `${race}:${type}:${level}`;
    if (cache.has(key)) return cache.get(key);
    const d = definitions(race, type), [c, b] = cityFor(race, type, level);
    let rows;
    if (type === 'keep') {
      const rates = R.productionRates(c);
      rows = [['Életerő', c.maxHp], ['Termelés', `+${rates.wood}/mp${race === 'undead' ? ' Lélek' : ' nyersanyagonként'}`],
        ...(race === 'undead' ? [] : [['Tároló', `${c.caps.wood} / nyersanyag`]]),
        ['Sereghely', c.armyCap], ['Kapu', `${R.gateReleaseRate(c)} egység/mp`]];
    } else if (d.unit) {
      rows = [[R.UNITS[d.unit].name, `${R.previewTrainingTime(c, type, level).toLocaleString('hu-HU', {maximumFractionDigits: 2})} mp`],
        ['Képzési ár', costText(R.unitCost(c, d.unit), race)]];
    } else if (race === 'undead') {
      rows = [['', d.levels[level - 1]]];
    } else if (race === 'orc' && type.startsWith('orc_')) {
      const template = document.createElement('template');
      template.innerHTML = window.__ROADLORDS_ORCS__.lexiconLevels(type);
      rows = [...template.content.querySelectorAll('tbody tr')].map(tr => {
        const cols = [...tr.children].map(td => td.textContent);
        return [cols[0], cols[Math.min(level, cols.length - 1)]];
      });
    } else if (type === 'alchemist') {
      R.buildingEffectRows(c,b); // Initialises this isolated city's default recipe.
      const pool=b.alchemyPool||[],total=pool.reduce((n,p)=>n+p.weight,0);
      const chance=pool.find(p=>p.id==='damage')?.weight||0;
      rows=[['Főzeterő', `+${Math.round(window.__ROADLORDS_V4961__.potionPower(c,'damage')*100)}%`],
        ['Esély főzetenként', `${Math.round(chance/Math.max(1,total)*100)}%`]];
    } else rows = R.buildingEffectRows(c, b).filter(([name]) => !excluded.test(name));
    if(type==='academy')rows.push(['Kezdőár / irány', String(window.__ROADLORDS_V4953__.academyNextCost(c,'damage'))]);
    if (race === 'undead' && type !== 'keep') rows.push(['Fenntartás', `${d.upkeep.toLocaleString('hu-HU')} Lélek/mp`]);
    rows = rows.map(([name, value]) => [shortLabels[name] || name, String(value).replace(/stack/g, 'vétel').replace(/cooldown/g, 'várakozás')]);
    const value = { rows, cost: R.buildPrice(c, type), description: describe(race, type, level, d, rows) }; cache.set(key, value); return value;
  }
  function costText(cost, race) {
    const price = n => n.toLocaleString('hu-HU', {maximumFractionDigits:2});
    if (race === 'undead') return `${price(cost.wood)} Lélek`;
    return [['wood', 'fa'], ['stone', 'kő'], ['food', 'élelem']].filter(([k]) => cost[k] > 0)
      .map(([k, name]) => `${price(cost[k])} ${name}`).join(', ') || 'Ingyenes';
  }
  const fmt = n => Number(n).toLocaleString('hu-HU', {maximumFractionDigits: 1, useGrouping: false});
  function describe(race, type, level, d, rows) {
    const value = name => rows.find(([label]) => label === name)?.[1] || '';
    const number = name => Number(value(name).match(/[+−-]?\d+(?:[,.]\d+)?/)?.[0]?.replace(',', '.').replace('−', '-'));
    if (type === 'keep') return `${value('Életerő')} HP; ${value('Termelés').replace(' nyersanyagonként', ' fa, kő és élelem')}; ${race === 'undead' ? '' : value('Tároló') + ' tároló; '}${value('Sereghely')} sereghely; kapu: ${value('Kapu')}.`;
    if (d.unit) return `${R.UNITS[d.unit].name} képzése.`;
    if (race === 'undead') return d.levels[level - 1];
    if (['lumber','stonecutter','farm'].includes(type)) {
      const resource = {lumber:'fa',stonecutter:'kő',farm:'élelem'}[type];
      const terrain = {lumber:'Erdő mellett',stonecutter:'Kőlelőhely mellett',farm:'Termőtalajon'}[type];
      return `+${fmt(number('Termelés'))} ${resource}/mp. ${terrain} dupla termelés.`;
    }
    const sentences = {
      warehouse: () => `${value('Tárolókapacitás').split(' /')[0]} tároló minden nyersanyaghoz.`,
      house: () => `${value('Sereghely')} sereghely.`,
      guildhouse: () => `A ${value('Hatótáv').replace(' mező',' mezőn')} belüli nyersanyagtermelők ${value('Termelési bónusz').replace(/^\+/, '')}-kal többet termelnek.`,
      market: () => `${fmt(number('Kereskedelmi tempó'))} nyersanyag/mp-ből ${fmt(number('Kereskedelmi tempó') * number('Hatékonyság') / 100)} másikat termel.`,
      townhall: () => `A ${value('Hatótáv').replace(' mező',' mezőn')} belüli Lakóházak ${value('Lakóházbónusz').replace(/^\+/, '')}-kal több sereghelyet adnak.`,
      rally: () => `${value('Saját tartalék').split(' / ')[1]} tartalék férőhely a szomszédos táboroknak. Kivonuláskor ${value('Mozgási bónusz')} mozgási sebesség az első támadásig.`,
      tavern: () => `A kivonuló egységek ${value('Hullámbónusz').replace('támadás · ', 'támadásukra ').replace(' / Kocsma', '')}t kapnak.`,
      guardhouse: () => `${value('Kapacitás').split(' /')[0]} tartalék férőhely, ha falhoz vagy Gyülekezőtérhez kapcsolódik. Őrházláncon át is hat.`,
      armorsmith: () => `A szomszédos katonai épületek egységei ${fmt(number('Kezdőpajzs'))}% életerőnyi pajzzsal indulnak.`,
      hospital: () => `${value('Mentési esély')} eséllyel visszahozza az elesett egységet ${value('Visszatérési HP')} HP-val a helyőrségbe. Egységenként egyszer.`,
      library: () => `Választásonként +${value('Újrasorsolás')} ingyenes újrasorsolás. A fel nem használt alkalom elvész.`,
      mastersguild: () => `${value('Fejlesztési idő')}-enként ingyen fejleszt egy megépített épülettípust, legfeljebb L3-ig.`,
      warcenter: () => `Választható képzési módok. Tömegtermelés: ${value('Globális hatás').replace('Gyártási sebesség','képzési sebesség').replace(' · ', ', de ')}.`,
      academy: () => `A szomszédos katonai épületeknek vásárolhatsz ${value('Bónusz / vétel')} sebzést, életerőt vagy támadási sebességet.`,
      alchemist: () => `A szomszédos táborok egységei ${fmt(number('Esély főzetenként') * 3)}% eséllyel ${value('Főzeterő')} sebzést, életerőt vagy támadási sebességet kapnak.`,
      orc_work: () => `+${value('Fa és kő/mp')} fa és kő/mp. Erdő mellett dupla fa, kőlelőhely mellett dupla kő.`,
      orc_hunt: () => `+${value('Élelem/mp')} élelem/mp. Fal mellett +50%, nyitott kapunál további +50% termelés.`,
      orc_hut: () => `+${value('Sereglimit')} sereghely és +${value('Helyőrséglimit')} helyőrségi férőhely.`,
      orc_arena: () => `A szomszédos táborok ${value('Veterán esély (%)')}% eséllyel veteránokat képeznek.`,
      orc_overseer: () => `A szomszédos táborok ${fmt(100 / (1 - number('Képzési idő csökkentése (%)') / 100) - 100)}%-kal gyorsabban képeznek, de az egységek ${value('Induló életerő (%)')}% HP-val indulnak.`,
      orc_altar: () => `Feláldozza a szomszédos táborok egységeit. ${value('Szükséges áldozat')} pont után sereged 12 mp-re 25% életlopást kap.`,
      orc_totem: () => `${value('Szükséges elesett egység')} halálpont után 1 legendás lapot választhatsz.`,
      orc_slave: () => `Minden 20 legyőzött ellenség után tartósan +${value('Fa és kő / mp minden 20 ölésért')} fa és kő/mp.`,
      orc_raider: () => `Nyitott kapunál minden elkészült egység ${value('Erősítés esélye (%)')}% eséllyel ingyen erősítést hív.`,
      orc_tunnel: () => `A ${value('Hatótáv (mező)')} mezőn belüli táborok a legelöl álló saját toronynál vetik be egységeiket, zárt kapunál is.`,
    };
    return sentences[type]?.() || d.description;
  }
  return { metrics, costText, cityFor };
}
