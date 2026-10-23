import { cardFrameUrl, frameImage, effectText, escapeText as esc } from './card-presentation.js';

const ROLES = {
  keep: '', lumber: 'Erdő mellett 2× termelés.', stonecutter: 'Kőlelőhely mellett 2× termelés.',
  farm: 'Termőtalajon 2× termelés.', warehouse: '', house: '',
  barracks: '', archery: '35 távolságon belül az Íjász sebzése 25%.',
  spearhall: 'Lovasság és nehéz egységek ellen +150% sebzés.', stable: '',
  temple: 'Papjai harc és mozgás közben is gyógyítanak.', siegeworks: 'Épületek ellen hatékony.',
  magetower: 'A Mágus tűzgolyója területen sebez.',
  guildhouse: 'Favágókra, Kővágókra és Farmokra hat.', market: 'Nyersanyagokat vált át.',
  townhall: 'A közeli Lakóházak sereglimitjét növeli.',
  rally: 'A szomszédos termelők egységeit külön tartalékba gyűjti.',
  tavern: 'A kapunál és a Gyülekezőtérnél is hat.',
  guardhouse: 'Városfalhoz vagy Gyülekezőtérhez kötve ad férőhelyet. Őrházláncon át is hat.',
  warcenter: 'Három választható haditermelési mód.', armorsmith: 'Szomszédos katonai épületekre hat.',
  hospital: 'Egységenként egyszer; szabad helyőrségi férőhely kell.', towercommand: '',
  library: '', mastersguild: '', academy: 'Nyersanyagért vásárolható, tartós egységbónuszok.',
  merc_tent: 'Zsoldoscsapatokat bérelhetsz. A választott sor alakítja a következő ajánlatot.',
  alchemist: 'Szomszédos katonai épületek egységeinek ad főzetet.',
  orc_work: 'Erdő mellett dupla fa; kőlelőhely mellett dupla kő.',
  orc_hunt: 'Fal mellett +50%, nyitott kapunál további +50% termelés.', orc_hut: '',
  orc_war: '', orc_bers: '', orc_gob: '', orc_warg: '', orc_shaman: '', orc_ram: '',
  orc_troll: 'Trollonként 4 sereghely és 4 helyőrségi férőhely.',
  orc_arena: 'Szomszédos táborokra hat. Veterán: +50% életerő és sebzés.',
  orc_overseer: 'Szomszédos táborokra hat; több Hajcsártábor nem adódik össze.',
  orc_altar: 'Áldozati jutalom: 12 mp-re 25% életlopás. Troll: 4 pont.',
  orc_totem: 'Halálpontokért 1 legendás lap, legfeljebb 4 ajánlatból. Troll: 4 pont.',
  orc_slave: 'Minden 20 legyőzött ellenség után tartós termelést ad.',
  orc_raider: 'Nyitott kapunál az elkészült egység ingyenes erősítést hívhat.',
  orc_tunnel: 'Táborok egységeit az első saját toronynál veti be. A sereglimit érvényes.',
};
const shortLabels = { 'Főváros HP': 'Életerő', 'Úti sereglimit': 'Sereghely',
  'Alap sereglimit': 'Sereghely', 'Alaptermelés': 'Termelés',
  'Fa és kő másodpercenként': 'Fa és kő/mp', 'Élelem másodpercenként': 'Élelem/mp',
  'Ingyen reroll / választás': 'Újrasorsolás', 'Bónusz / stack': 'Bónusz / vétel' };
const excluded = /Tényleges|Terepbónusz|Városháza|Feltétel|Korlát|L4|Összes bónusz|Kocsmák|Buffolt|Őrházlánc|Bekötés|Módváltás|Útvonalváltás|Következő|Globális recept|Recept|Főzeterő|X tényleges|Aktív főzethelyek|Max célpont|Hatókör|Fa ·|Kő ·|Élelem ·/;
const UNDEAD_ROLES = {
  keep: '', und_well: '', und_crypt: '', und_soul_burner: '',
  und_soul_harvester: 'Bárhol a csatatéren.',
  und_dark_tower: 'Első ellenségre, saját térfélen. Újabb tornyonként +25% alapfenntartás.',
  und_soul_bank: 'Adósságnál nincs katonaképzés vagy kamat.',
  und_soul_anchor: 'Önmagára nem hat; csak a legerősebb horgony számít.',
  und_bone_forge: 'Csak harci halál számít, idézett Csontvázaké is.',
  und_plague_chamber: 'Több Pestiskamra hatása összeadódik.',
  und_soul_overdrive: 'A Nekropoliszra nem hat.',
  und_corrupted_hatchery: 'Gyógyítható sérülés; csak a legerősebb Keltető hat.',
  und_rebirth_tomb: 'Egységenként egyszer a helyőrségbe hoz vissza.',
  und_garden_of_dead: 'Saját térfélen elesett ellenségre hat.',
};

export function createCodexCards(R) {
  const levels = new Map(), cache = new Map();
  const undead = () => window.__ROADLORDS_UNDEAD__;
  const definitions = (race, type) => race === 'undead' ? undead().buildings[type] : R.BUILDINGS[type];
  const branches = (race, type) => race === 'undead' ? definitions(race, type).branches
    : race === 'orc' && type === 'keep' ? window.__ROADLORDS_ORCS__.keepBranches : R.V4_BRANCHES[type] || [];
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
    const value = { rows, cost: R.buildPrice(c, type) }; cache.set(key, value); return value;
  }
  function costText(cost, race) {
    if (race === 'undead') return `${Math.ceil(cost.wood)} Lélek`;
    return [['wood', 'fa'], ['stone', 'kő'], ['food', 'élelem']].filter(([k]) => cost[k] > 0)
      .map(([k, name]) => `${Math.ceil(cost[k])} ${name}`).join(', ') || 'Ingyenes';
  }
  function role(race, type) {
    if (race !== 'undead') return ROLES[type] ?? '';
    if (Object.hasOwn(UNDEAD_ROLES,type)) return UNDEAD_ROLES[type];
    const desc = definitions(race, type).description;
    return desc.replace(/^[^.]+(?:képez|termel|korlátját)\.[ ]*/u, '');
  }
  function face({ id, kind, race, name, category, art, body, meta = '' }) {
    const src = cardFrameUrl(id, kind, race);
    return `<div class="cardFace illustratedCard ${src ? 'hasCardFrame' : ''}" data-frame="${category || 'support'}">${frameImage(src)}
      <header class="rlCodexCardHead"><span class="rlCodexIcon">${src ? '' : art}</span><div class="rlCodexTitle"><h3>${esc(name)}</h3></div></header>
      <div class="rlCodexMeta">${meta}</div><div class="rlCodexContent">${body}</div></div>`;
  }
  function extraRules(type,race,level) {
    if(!['warcenter','academy','alchemist','merc_tent'].includes(type))return '';
    const [c]=cityFor(race,type,level);
    const rules=type==='warcenter'
      ? [['mass','Tömegtermelés'],['economy','Takarékos'],['elite','Elit']].map(([mode,name])=>{
          c.warMode=mode;return `${name}: ${R.warModeSummary(c)}`;
        }).join('\n')
      : type==='academy' ? 'Fa: sebzés. Kő: életerő. Élelem: támadási sebesség. Az irányok külön vásárolhatók; áruk vételenként 50%-kal nő, felfelé kerekítve.'
      : type==='alchemist' ? 'Erő: sebzés. Életerő: maximális életerő. Fürgeség: támadási sebesség. A bónusz állandó; azonos főzetből a legerősebb hat. Termelőnként egy kunyhó.'
      : definitions(race,type).description;
    return `<details class="lexBranches"><summary>Működés</summary><p>${effectText(rules).replace(/\n/g,'<br>')}</p></details>`;
  }
  function building(type, race) {
    const d = definitions(race, type), level = levels.get(`${race}:${type}`) || 1;
    const bs = branches(race, type), { rows, cost } = metrics(race, type, level);
    const max = race === 'undead' || bs.length || R.V4_SIMPLE_L4.has(type) ? 4 : 3;
    const text = role(race, type), art = R.cardBuildingImageTag(type, 'lexBuildingImg', race);
    const stats = rows.map(([name, val]) => `<div class="lexEffectRow">${name ? `<span>${esc(name)}</span>` : ''}<b>${effectText(val)}</b></div>`).join('');
    const body = `${text ? `<p>${effectText(text)}</p>` : ''}<div class="lexEffectRows">${stats}</div>`;
    const meta = `<span class="rlChip">${type === 'keep' ? '' : esc(costText(cost, race))}</span>${R.buildCardFootprintV41004(type)}${d.unique ? '<span class="rlChip gold" title="Egyedi épület">1×</span>' : ''}`;
    return `<article class="rlCodexCard" data-codex-building="${type}" data-race="${race}">${face({id:type,kind:'building',race,name:race === 'orc' && type === 'keep' ? 'Ork főépület' : d.name,category:d.category,art,body,meta})}
      <nav class="lexLevels" aria-label="${esc(d.name)} szintje">${Array.from({length:max}, (_, i) => `<button type="button" data-codex-level="${i+1}" aria-pressed="${level === i+1}">L${i+1}</button>`).join('')}</nav>
      ${bs.length ? `<details class="lexBranches"><summary>L4 ágak</summary>${bs.map(b => `<div class="rlBranch"><b>${esc(b.name)}</b><p>${effectText(b.description)}</p></div>`).join('')}</details>` : ''}
      ${extraRules(type,race,level)}</article>`;
  }
  function upgrade(item, kind, race) {
    const key = R.PICK_UNIT_IMAGES[item.id], src = R.PICK_IMAGES[item.id];
    const art = key && R.UNITS[key] ? R.unitImageTag(key, 'lexUnitImg') : src ? `<img src="${src}" alt="" loading="lazy">` : esc(item.icon || '✦');
    return `<article class="rlCodexCard ${kind === 'legendary' ? 'rlLegendCard' : ''}">${face({id:item.id,kind,race,name:item.name,category:kind === 'legendary' ? 'legendary' : 'common',art,body:`<p>${effectText(item.description)}</p>`})}</article>`;
  }
  function unit(key, u, race) {
    const stats = [['Életerő', u.hp], ['Sebzés', u.damage], ['Támadás', `${u.cooldown} mp`], ['Hatótáv', u.range], ['Mozgás', u.speed], ...(u.heal ? [['Gyógyítás', u.heal]] : [])];
    const body = `<div class="lexUnitStats">${stats.map(([name,value]) => `<div><span>${esc(name)}</span><b>${effectText(value)}</b></div>`).join('')}</div>`;
    return `<article class="rlCodexCard">${face({id:key,kind:'unit',race,name:u.name,category:'military',art:R.unitImageTag(key,'lexUnitImg'),body,meta:`<span class="rlChip">${esc(costText(u.cost, race))}</span>`})}${u.description ? `<details class="lexBranches"><summary>Képesség</summary><p>${effectText(u.description)}</p></details>` : ''}</article>`;
  }
  function selectLevel(article, level) {
    levels.set(`${article.dataset.race}:${article.dataset.codexBuilding}`, Number(level));
  }
  return { building, unit, upgrade, selectLevel };
}
