import { cardFrameUrl, frameImage, effectText, escapeText as esc } from './card-presentation.js';
import cardRules from '../data/card-rules.json';

const BUILDING_RULES = {
  orc_overseer: 'Több Hajcsártábor nem gyorsítja tovább ugyanazt a tábort. A kezdő sérülés gyógyítható.',
  orc_arena: 'A veterán esély alapból nem adódik össze. A veterán +50% életerőt és sebzést kap.',
  orc_raider: 'L1: Harcos. L2: 65% Harcos, 35% Dühöngő. L3: 55% Harcos, 30% Dühöngő, 15% Warglovas. Az erősítés nem hív újabb erősítést.',
  orc_tunnel: 'Torony nélkül a kaput használja. Az egységek továbbra is foglalnak sereghelyet.',
  orc_altar: 'A feláldozott egységek nem vonulnak ki. A Troll 4 áldozati pontot ér.',
  orc_totem: 'Legfeljebb 4 ajánlatból választhatsz. A Troll 4 halálpontot ér.',
  orc_slave: 'A korábbi ölések is számítanak a tábor megépítésekor és fejlesztésekor.',
  hospital: 'Szabad helyőrségi férőhely szükséges.',
  und_dark_tower: 'Minden további Sötét Őrtorony +25%-kal növeli az összes ilyen torony alapfenntartását.',
  und_soul_anchor: 'Önmagára nem hat.',
  und_bone_forge: 'Csak harci halál számít. Az idézett Csontvázak halála is számít, az idővel eltűnésük nem.',
  und_plague_chamber: 'Több Pestiskamra hatása összeadódik.',
  und_corrupted_hatchery: 'A kezdő sérülés gyógyítható. Több Keltető közül csak a legerősebb hat.',
};

const ruleDetails = text => text ? `<details class="lexBranches"><summary>Részletek</summary><p>${effectText(text)}</p></details>` : '';

export function createCodexCards(R) {
  const levels = new Map();
  const { metrics, costText, cityFor } = R.cardBuildingCopy;
  const undead = () => window.__ROADLORDS_UNDEAD__;
  const definitions = (race, type) => race === 'undead' ? undead().buildings[type] : R.BUILDINGS[type];
  const branches = (race, type) => race === 'undead' ? definitions(race, type).branches
    : race === 'orc' && type === 'keep' ? window.__ROADLORDS_ORCS__.keepBranches : R.V4_BRANCHES[type] || [];
  function face({ id, kind, race, name, category, art, body, meta = '' }) {
    const src = cardFrameUrl(id, kind, race);
    return `<div class="cardFace illustratedCard ${src ? 'hasCardFrame' : ''}" data-frame="${category || 'support'}">${frameImage(src)}
      <header class="rlCodexCardHead"><span class="rlCodexIcon">${src ? '' : art}</span><div class="rlCodexTitle"><h3>${esc(name)}</h3></div></header>
      <div class="rlCodexMeta">${meta}</div><div class="rlCodexContent">${body}</div></div>`;
  }
  function extraRules(type,race,level) {
    if(!['warcenter','academy','alchemist','merc_tent'].includes(type))return ruleDetails(BUILDING_RULES[type]);
    const [c]=cityFor(race,type,level);
    const rules=type==='warcenter'
      ? [['mass','Tömegtermelés'],['economy','Takarékos'],['elite','Elit']].map(([mode,name])=>{
          c.warMode=mode;return `${name}: ${R.warModeSummary(c)}`;
        }).join('\n')
      : type==='academy' ? `Fa: sebzés. Kő: életerő. Élelem: támadási sebesség. Kezdőár irányonként: ${window.__ROADLORDS_V4953__.academyNextCost(c,'damage')} nyersanyag; vételenként +50%, felfelé kerekítve.`
      : type==='alchemist' ? 'Erő: sebzés. Életerő: maximális életerő. Fürgeség: támadási sebesség. A bónusz állandó; azonos főzetből a legerősebb hat. Termelőnként egy kunyhó.'
      : definitions(race,type).description;
    return `<details class="lexBranches"><summary>Működés</summary><p>${effectText(rules).replace(/\n/g,'<br>')}</p></details>`;
  }
  function building(type, race) {
    const d = definitions(race, type), level = levels.get(`${race}:${type}`) || 1;
    const bs = branches(race, type), { rows, cost, description } = metrics(race, type, level);
    // Branched L4 has no single value: show its two actual alternatives below the card.
    const max = bs.length ? 3 : race === 'undead' || R.V4_SIMPLE_L4.has(type) ? 4 : 3;
    const text = description, art = R.cardBuildingImageTag(type, 'lexBuildingImg', race);
    const stats = rows.map(([name, val]) => `<div class="lexEffectRow">${name ? `<span>${esc(name)}</span>` : ''}<b>${effectText(val)}</b></div>`).join('');
    const body = type === 'keep' ? `<div class="lexEffectRows">${stats}</div>` : `<p>${effectText(text)}</p>`;
    const meta = `<span class="rlChip">${type === 'keep' ? '' : esc(costText(cost, race))}</span>${R.buildCardFootprintV41004(type)}${d.unique ? '<span class="rlChip gold" title="Egyedi épület">1×</span>' : ''}${d.unit ? `<span class="rlChip" title="Képzési idő">◷ ${esc(rows[0][1])}</span><span class="rlChip" title="Egységköltség">${esc(rows[1][1])}</span>` : ''}${race === 'undead' && type !== 'keep' ? `<span class="rlChip" title="Fenntartás">${effectText('−' + d.upkeep.toLocaleString('hu-HU') + ' Lélek/mp')}</span>` : ''}`;
    return `<article class="rlCodexCard" data-codex-building="${type}" data-race="${race}">${face({id:type,kind:'building',race,name:race === 'orc' && type === 'keep' ? 'Ork főépület' : d.name,category:d.category,art,body,meta})}
      <nav class="lexLevels" aria-label="${esc(d.name)} szintje">${Array.from({length:max}, (_, i) => `<button type="button" data-codex-level="${i+1}" aria-pressed="${level === i+1}">L${i+1}</button>`).join('')}</nav>
      ${bs.length ? `<details class="lexBranches"><summary>L4 ágak</summary>${bs.map(b => `<div class="rlBranch"><b>${esc(b.name)}</b><p>${effectText(b.description)}</p>${ruleDetails(cardRules[type+'/'+b.id])}</div>`).join('')}</details>` : ''}
      ${extraRules(type,race,level)}</article>`;
  }
  function upgrade(item, kind, race) {
    const key = R.PICK_UNIT_IMAGES[item.id], src = R.PICK_IMAGES[item.id];
    const art = key && R.UNITS[key] ? R.unitImageTag(key, 'lexUnitImg') : src ? `<img src="${src}" alt="" loading="lazy">` : esc(item.icon || '✦');
    return `<article class="rlCodexCard ${kind === 'legendary' ? 'rlLegendCard' : ''}">${face({id:item.id,kind,race,name:item.name,category:kind === 'legendary' ? 'legendary' : 'common',art,body:`<p>${effectText(item.description)}</p>`})}${ruleDetails(cardRules[item.id])}</article>`;
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
