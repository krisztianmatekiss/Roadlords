import { cardFrameUrl, frameImage, cardTextBackdrop, constructionPrice, productionFacts, productionFootprint, capitalFacts, buildingUpkeep, uniqueBuildingMark, effectText, escapeText as esc } from './card-presentation.js';
import { symbolizeResourceHtml } from './resource-symbols.js';
import { UNIT_COPY } from './unit-copy.js';
import { upgradeMetricLabel } from './upgrade-copy.js';
import { formatMetres, formatSpeed } from '../world/measurements.js';
import cardRules from '../data/card-rules.json';
import { unitTraitIcons } from './unit-traits.js';
import { upgradeScene } from '../rendering/upgrade-card-art.js';

const BUILDING_RULES = {
  orc_overseer: 'Több Hajcsártábor nem gyorsítja tovább ugyanazt a tábort. A kezdő sérülés gyógyítható.',
  orc_arena: 'A veterán esély alapból nem adódik össze. A veterán +50% életerőt és sebzést kap.',
  orc_raider: 'L1: Harcos. L2: 65% Harcos, 35% Dühöngő. L3: 55% Harcos, 30% Dühöngő, 15% Warglovas. Az erősítés nem hív újabb erősítést.',
  orc_tunnel: 'Torony nélkül a kaput használja. Az egységek továbbra is foglalnak sereghelyet.',
  orc_altar: 'A feláldozott egységek nem vonulnak ki.',
  orc_totem: 'A saját egységek harci halála és az oltári áldozat ad halálpontot. Egy Troll 4 pontot ér, más egység 1-et. Az ellenségek halála alapból nem ad pontot. Csak megépített, aktív Totem gyűjt; bontáskor az összegyűlt pontok megmaradnak. Legfeljebb 4 legendás ajánlatból választhatsz.',
  orc_slave: 'A korábbi ölések is számítanak a tábor megépítésekor és fejlesztésekor.',
  hospital: 'Egységenként egyszer működik. Szabad helyőrségi férőhely szükséges.',
  tavern: 'A főkapun és a Gyülekezőtérből kiengedett egységekre hat.',
  library: 'A fel nem használt újrasorsolás a választás végén elvész.',
  guardhouse: 'Összekapcsolt Őrházakon át is eléri a városfalat vagy Gyülekezőteret.',
  und_dark_tower: 'Minden további Sötét Őrtorony +25%-kal növeli az összes ilyen torony alapfenntartását.',
  und_soul_anchor: 'Önmagára nem hat. Több Lélekhorgony közül csak a legerősebb hatása érvényes.',
  und_soul_overdrive: 'A Nekropolisz termelését nem növeli.',
  und_corrupted_hatchery: 'Több Keltető közül csak a legerősebb hatása érvényes. A kezdő sérülés teljesen gyógyítható.',
  und_rebirth_tomb: 'Egységenként egyszer működik.',
  und_bone_forge: 'Csak harci halál számít. Az idézett Csontvázak halála is számít, az idővel eltűnésük nem.',
  und_plague_chamber: 'A saját élőhalott egységek életerőt sebző támadási találatai mérgeznek, beleértve az idézett egységeket és a területi támadások külön eltalált célpontjait. Kitért vagy teljesen pajzzsal kivédett találat nem mérgez. A méreg, égés és sugár folyamatos sebzése nem támadási találat. Több Pestiskamra hatása összeadódik.',
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
  function face({ id, kind, race, name, category, art, body, meta = '', price = '', footprint = '', mark = '', metaInBody = false }) {
    const src = cardFrameUrl(id, kind, race);
    const unitKey=kind==='unit'?id:kind==='normal'?R.PICK_UNIT_IMAGES[id]:null;
    return symbolizeResourceHtml(`<div class="cardFace illustratedCard ${src ? 'hasCardFrame' : ''}" data-race="${race}" data-frame="${category || 'support'}">${frameImage(src)}${upgradeScene(R,id,kind,race)}${unitKey?unitTraitIcons(R,unitKey,null,'cardPortraitTraits'):''}${cardTextBackdrop}
      <header class="rlCodexCardHead"><span class="rlCodexIcon">${src ? '' : art}${footprint}</span><div class="rlCodexTitle"><h3>${esc(name)}</h3></div></header>
      ${price}${mark}${metaInBody ? '' : `<div class="rlCodexMeta">${meta}</div>`}<div class="rlCodexContent">${body}${metaInBody ? `<div class="productionMeta">${meta}</div>` : ''}</div></div>`,R,race);
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
    const bs = branches(race, type), { cost, description } = metrics(race, type, level);
    // Branched L4 has no single value: show its two actual alternatives below the card.
    const max = bs.length ? 3 : race === 'undead' || R.V4_SIMPLE_L4.has(type) ? 4 : 3;
    const text = description, art = R.cardBuildingImageTag(type, 'lexBuildingImg', race);
    const reference=cityFor(race,type,level)[0];
    const body = (d.unit ? productionFacts(R, reference, type, level) : type === 'keep' ? capitalFacts(R,race,level) : `<p>${effectText(text)}</p>`)+(race==='undead'?buildingUpkeep(R,type):'');
    const meta = '';
    const price = type === 'keep' ? '' : constructionPrice(R, cost, race);
    return `<article class="rlCodexCard" data-codex-building="${type}" data-race="${race}">${face({id:type,kind:'building',race,name:race === 'orc' && type === 'keep' ? 'Ork főépület' : d.name,category:d.category,art,body,meta,price,mark:uniqueBuildingMark(R,reference,type),footprint:productionFootprint(R,reference,type),metaInBody:!!d.unit})}
      <nav class="lexLevels" aria-label="${esc(d.name)} szintje">${Array.from({length:max}, (_, i) => `<button type="button" data-codex-level="${i+1}" aria-pressed="${level === i+1}">L${i+1}</button>`).join('')}</nav>
      ${bs.length ? `<details class="lexBranches"><summary>L4 ágak</summary>${bs.map(b => `<div class="rlBranch"><b>${esc(b.name)}</b><p>${effectText(b.description)}</p>${ruleDetails(cardRules[type+'/'+b.id])}</div>`).join('')}</details>` : ''}
      ${extraRules(type,race,level)}</article>`;
  }
  function upgrade(item, kind, race) {
    const key = R.PICK_UNIT_IMAGES[item.id], src = R.PICK_IMAGES[item.id];
    const art = key && R.UNITS[key] ? R.unitImageTag(key, 'lexUnitImg') : src ? `<img src="${src}" alt="" loading="lazy">` : esc(item.icon || '✦');
    const reference=cityFor(race,'keep',1)[0];
    const preview=R.upgradeCopyPreview(reference,{...item,kind});
    const changes=preview?.rows.length ? `<div class="upgradeComparison" aria-label="Első felvétel változása">${preview.rows.map(row=>`<span class="upgradeRow"><span class="upgradeMetric">${esc(upgradeMetricLabel(row.label))}</span><b class="upgradeValues"><span class="upgradeBefore">${esc(row.before)}</span> → <span class="upgradeAfter effect-positive">${esc(row.after)}</span></b></span>`).join('')}</div>` : '';
    return `<article class="rlCodexCard ${kind === 'legendary' ? 'rlLegendCard' : ''}" data-codex-upgrade="${item.id}">${face({id:item.id,kind,race,name:item.name,category:kind === 'legendary' ? 'legendary' : 'common',art,body:`<p>${effectText(item.description)}</p>${changes}`})}${ruleDetails(cardRules[item.id])}</article>`;
  }
  function unit(key, u, race) {
    const copy=UNIT_COPY[key] || {role:'Harci egység',ability:u.description || ''};
    const stats = [['Életerő', u.hp], [key==='und_lich'?'Sugár / mp':'Sebzés', u.damage], [key==='und_lich'?'Új sugár':'Támadásköz', `${u.cooldown.toLocaleString('hu-HU')} mp`], ['Hatótáv', formatMetres(u.range)], ['Mozgás', formatSpeed(u.speed)], ...(u.heal ? [['Gyógyítás', u.heal]] : u.buildingDamage ? [['Épületsebzés',u.buildingDamage]] : u.aoe ? [['Területi sugár',formatMetres(u.aoe)]] : [])];
    const body = `<p class="lexUnitAbility">${effectText(copy.ability)}</p><div class="lexUnitStats">${stats.map(([name,value]) => `<div><span>${esc(name)}</span><b>${effectText(value)}</b></div>`).join('')}</div>`;
    const details=copy.details?.length ? `<details class="lexBranches lexUnitDetails"><summary>Részletek</summary><ul>${copy.details.map(line=>`<li>${effectText(line)}</li>`).join('')}</ul></details>` : '';
    return `<article class="rlCodexCard lexUnitCard" data-codex-unit="${key}" data-race="${race}">${face({id:key,kind:'unit',race,name:u.name,category:'common',art:R.unitImageTag(key,'lexUnitImg'),body,meta:`<span class="rlChip">${esc(costText(u.cost, race))}</span>`})}${details}</article>`;
  }
  function selectLevel(article, level) {
    levels.set(`${article.dataset.race}:${article.dataset.codexBuilding}`, Number(level));
  }
  return { building, unit, upgrade, selectLevel };
}
