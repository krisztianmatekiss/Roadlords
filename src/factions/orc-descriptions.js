import { GOBLIN_BOW_COPY } from '../data/combat-balance.js';
import { assetUrl } from '../assets/urls.js';
import { ORC_TRAINING } from '../data/unit-balance.js';
export function initializeFactionsOrcDescriptions(runtime) {
  const O = window.__ROADLORDS_ORCS__;
  const descriptions = {
    orc_work: 'Fát és követ termel. Erdő mellett kétszer annyi fát, kőlelőhely mellett kétszer annyi követ ad.',
    orc_hunt: 'Élelmet termel. A városfal mellett +50%, nyitott kapunál további +50% élelmet ad.',
    orc_hut: 'Növeli a sereg és a helyőrség létszámkorlátját.',
    orc_war: 'Ork Harcosokat képez.',
    orc_bers: 'Dühöngőket képez.',
    orc_gob: 'Goblinokat képez.',
    orc_warg: 'Warglovasokat képez.',
    orc_shaman: 'Sámánokat képez.',
    orc_ram: 'Faltörő kosokat készít.',
    orc_troll: 'Nagy életerejű, területsebző Trollokat képez. Egy Troll 4 helyet foglal a seregben és a helyőrségben is. Az oltár és a totem számlálójában is 4 egységnek számít.',
    orc_arena: 'A szomszédos táborok veterán egységeket képezhetnek. A veteránoknak +50% életerejük és sebzésük van. Több Aréna bónusza alapból nem adódik össze.',
    orc_overseer: 'A szomszédos táborok gyorsabban képeznek egységeket, de azok sérülten indulnak. Több Hajcsártábor bónusza nem adódik össze.',
    orc_altar: 'Feláldozza a szomszédos táborok elkészült egységeit. Elegendő áldozat után sereged 12 másodpercig az okozott sebzés 25%-át visszagyógyítja.',
    orc_totem: 'Elesett és feláldozott egységeid után legendás fejlesztést ad: legfeljebb 4 lapból választhatsz egyet.',
    orc_slave: 'Minden 20 legyőzött ellenség tartósan növeli a tábor fa- és kőtermelését. Fejlesztéskor a korábbi ölésekért is több nyersanyagot kapsz.'
  };
  for (const [key, text] of Object.entries(descriptions)) runtime.BUILDINGS[key].description = text;
  const fmt = n => String(n).replace('.', ',');
  const levels = {
    orc_raider: [['Erősítés esélye (%)', [5, 8, 12]]],
    orc_tunnel: [['Hatótáv (mező)', [1, 2, 3, 'Minden tábor']]],
    orc_work: [['Fa és kő másodpercenként', [1, 2, 3]]],
    orc_hunt: [['Élelem másodpercenként', [.5, 1, 1.5, 3]]],
    orc_hut: [['Sereglimit', [20, 30, 40, 60]], ['Helyőrséglimit', [20, 30, 60, 60]]],
    orc_arena: [['Veterán esély (%)', [10, 15, 25]]],
    orc_overseer: [['Képzési idő csökkentése (%)', [20, 30, 40]], ['Induló életerő (%)', [80, 80, 80]]],
    orc_altar: [['Szükséges áldozat', [100, 90, 75, 50]]],
    orc_totem: [['Szükséges elesett egység', [500, 450, 400, 200]]],
    orc_slave: [['Fa és kő / mp minden 20 ölésért', [.1, .2, .4]]]
  };
  for (const [key, values] of Object.entries(ORC_TRAINING)) levels[key] = [['Képzési idő (mp)', values]];
  const branchCopy = {
    orc_work: ['Másodpercenként 6 fát és 4 követ termel.', 'Másodpercenként 4 fát és 6 követ termel.'],
    orc_slave: ['Minden 20 ölésért +0,4 fa, +0,4 kő és +0,2 élelem másodpercenként.', 'Minden 20 ölésért továbbra is +0,4 fa és +0,4 kő másodpercenként. A szomszédos Munkatáborok és Vadászházak +50%-kal többet termelnek.']
  };
  for (const [key, texts] of Object.entries(branchCopy)) runtime.V4_BRANCHES[key].forEach((branch, i) => branch.description = texts[i]);
  const oldChoiceDetails = runtime.buildingChoiceDetails;
  runtime.buildingChoiceDetails = function (c, type) {
    const text = oldChoiceDetails(c, type);
    if (!levels[type] || runtime.BUILDINGS[type].unit) return text;
    const lv = runtime.levelOf(c, type);
    return text + '<br>' + levels[type].map(([label, values]) => `${label}: <b>${fmt(runtime.v4LevelValue(lv, values))}</b>`).join('<br>');
  };
  const oldDetails = runtime.buildingUpgradeDetails;
  runtime.buildingUpgradeDetails = function (c, type) {
    if (!levels[type]) return oldDetails(c, type);
    const lv = runtime.levelOf(c, type);
    if (lv >= O.maxLevel(type)) return 'Elérte a legmagasabb szintet.';
    if (lv === 3 && runtime.V4_BRANCHES[type]?.length) return 'Válassz egy specializációt.';
    return levels[type].map(([label, values]) => `${label}: <b>${fmt(values[lv - 1])} → ${fmt(values[lv])}</b>`).join('<br>');
  };
  O.lexiconLevels = function (type) {
    if (!levels[type]) return '';
    const rows = levels[type],
      count = rows[0][1].length;
    return `<div class="rlUpgradeBlock"><strong>SZINTENKÉNTI HATÁS</strong><table class="orcLevelTable"><thead><tr><th>Hatás</th>${Array.from({
      length: count
    }, (_, i) => `<th>${i + 1}. szint</th>`).join('')}</tr></thead><tbody>${rows.map(([label, values]) => `<tr><td>${label}</td>${values.map(v => `<td>${fmt(v)}</td>`).join('')}</tr>`).join('')}</tbody></table>${type === 'orc_raider' ? '<p>1. szint: Harcos.<br>2. szint: 65% Harcos, 35% Dühöngő.<br>3. szint: 55% Harcos, 30% Dühöngő, 15% Warglovas.</p>' : ''}${(runtime.V4_BRANCHES[type] || []).length ? '<strong>4. SZINT · VÁLASSZ EGYET</strong>' : ''}${(runtime.V4_BRANCHES[type] || []).map(b => `<div class="rlBranch"><b>${b.name}</b><br>${b.description}</div>`).join('')}</div>`;
  };
  const unitCopy = {
    orc_warrior: 'Erős közelharcos.',
    orc_berserker: 'Minden 2% hiányzó életerőért +1% támadási sebességet kap.',
    orc_goblin: 'Gyorsan támadó távolsági egység.',
    orc_warg: 'Első támadásként 60 sebzésű lándzsát dob 230 hatótávból, utána közelharcban küzd. Épületek ellen a lándzsa kevesebbet sebez, és nem lehet kritikus.',
    orc_shaman: 'Találatonként egy véletlen átkot tesz a célpontra 4 másodpercre. Elsősorban az átok nélküli ellenfeleket támadja.\nGyengeség: −20% sebzés.\nSorvadás: −20% maximális életerő; lejáratkor nem gyógyít.\nKimerültség: −25% támadási sebesség.\nSebezhetőség: +20% elszenvedett sebzés.\nVakság: 25% eséllyel elhibázza a támadást.\nUgyanaz az átok frissül, nem erősödik.',
    orc_ram: 'Épületek ellen 130-at, egységek ellen 8-at sebez. A fizikai támadásokból 50%-kal kevesebb sebzést kap.',
    orc_troll: 'A célpontnak 110-et, a körülötte álló ellenségeknek 35-öt sebez. 4 sereghelyet és 4 helyőrségi férőhelyet foglal.'
  };
  for (const [key, text] of Object.entries(unitCopy)) runtime.UNITS[key].description = text;
  const picks = {
    orc_bleed: 'A Harcos találatai 2 Vérzést okoznak. Minden további felvétel +1 Vérzést ad. A Vérzés másodpercenként a saját értékével sebez, majd 1-gyel csökken.',
    orc_leech: 'A Dühöngő az okozott sebzés 5%-át visszagyógyítja. Minden további felvétel +2 százalékpont életlopást ad.',
    orc_double: 'A Goblin +5% eséllyel kétszer támad. Az esély felvételekkel növelhető, legfeljebb 100%-ig.',
    orc_spear_crit: 'A Warglovas lándzsája +10% eséllyel dupla sebzést okoz egységeknek. 100% fölött újabb duplázásra nyílik esély: 150%-nál mindig dupla, 50% eséllyel négyszeres sebzés.',
    orc_curse_duration: 'A Sámán átkai 1 másodperccel tovább tartanak.',
    orc_troll_regen: 'A Troll másodpercenként 5 életerőt gyógyul.',
    orc_as: 'Minden ork egység +5% támadási sebességet kap.',
    orc_hp: 'Minden ork egység +5% maximális életerőt kap.',
    orc_bers_rage: 'A Dühöngő minden 1% hiányzó életerőért +1% sebzést kap.',
    orc_gob_bow: GOBLIN_BOW_COPY,
    orc_ancient_deposits: 'A Munkatábor erdő mellett háromszor annyi fát, kőlelőhely mellett háromszor annyi követ termel a kétszeres helyett.',
    orc_bers_blood: 'A Dühöngő dupla sebzést okoz Vérző ellenfeleknek.',
    orc_gob_blood: 'A Goblin találatai 1 Vérzést okoznak. A már Vérző ellenfeleknek +25% sebzést okoz.',
    orc_warg_instinct: 'A Warglovas közelharci támadásai is használják a lándzsa kritikus esélyét. Csak egységek ellen hat.'
  };
  for (const r of runtime.RES) picks['orc_' + r] = `+20% ${r === 'wood' ? 'fa' : r === 'stone' ? 'kő' : 'élelem'}termelés.`;
  for (const [key, u] of Object.entries(runtime.UNITS).filter(([, u]) => u.race === 'orc')) {
    picks[key + '_hp'] = `${u.name}: +10% maximális életerő.`;
    picks[key + '_dmg'] = `${u.name}: +10% sebzés.`;
  }
  for (const item of [...runtime.NORMAL, ...runtime.LEGENDARY]) if (picks[item.id]) item.description = picks[item.id];
  const oldRows = runtime.buildingEffectRows;
  runtime.buildingEffectRows = function (c, b) {
    const rows = oldRows(c, b);
    if (!levels[b.type]) return rows;
    const clean = rows.filter(([label]) => !['Építési ár', 'Hatás'].includes(label));
    const d = c.orcSupport || {};
    if (b.type === 'orc_arena') clean.push(['Veterán esély', fmt(runtime.hasBranch(c, b.type, 'academies') ? 25 : runtime.v4LevelValue(b.level, [10, 15, 25, 40])) + '%']);
    if (b.type === 'orc_overseer') clean.push(['Induló életerő', runtime.hasBranch(c, b.type, 'ruthless') ? '25%' : '80%'], ['Életlopás', runtime.hasBranch(c, b.type, 'blood_horde') ? '8% minden saját egységnek' : 'Nincs']);
    if (b.type === 'orc_overseer') clean.push(['Képzési idő', '−' + fmt(runtime.v4LevelValue(b.level, [20, 30, 40, runtime.hasBranch(c, b.type, 'ruthless') ? 80 : 40])) + '%']);
    if (b.type === 'orc_hut') clean.push(['Sereglimit', '+' + runtime.v4LevelValue(b.level, [20, 30, 40, 60])], ['Helyőrséglimit', '+' + runtime.v4LevelValue(b.level, [20, 30, 60, 60])]);
    if (b.type === 'orc_slave') {
      return [['Legyőzött ellenségek', String(d.slaveKills || 0)], ['Fa és kő másodpercenként', '+' + fmt(Math.round(Math.floor((d.slaveKills || 0) / 20) * runtime.v4LevelValue(b.level, [.1, .2, .4]) * 10) / 10)], ...(runtime.hasBranch(c, b.type, 'forced_labor') ? [['Élelem másodpercenként', '+' + fmt(Math.round(Math.floor((d.slaveKills || 0) / 20) * .2 * 10) / 10)]] : []), ...(runtime.hasBranch(c, b.type, 'overseers') ? [['Szomszédos termelők', '+50% termelés']] : [])];
    }
    return clean.map(([label, value]) => [label === 'Függő legendás jutalom' ? 'Felvehető jutalom' : label, String(value).replace(' (globális bónusz előtt)', ' (termelési fejlesztések nélkül)')]);
  };
  const style = document.createElement('style');
  style.textContent = "@import url(\"" + (assetUrl("styles/features/factions-orc-descriptions-39.css") + "\");");
  document.head.appendChild(style);
  const note = document.querySelector('.orcSoloPanel .orcNote');
  if (note) note.textContent = 'Válaszd ki a saját és az ellenfeled faját.';
  Object.assign(window.__ROADLORDS__, {
    buildingUpgradeDetails: runtime.buildingUpgradeDetails,
    buildingEffectRows: runtime.buildingEffectRows
  });
}
