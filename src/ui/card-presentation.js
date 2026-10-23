import manifest from '../data/orc-card-manifest.json';
import { assetUrl } from '../assets/urls.js';
import { createBuildingCardCopy } from './building-card-copy.js';
import cardRules from '../data/card-rules.json';

export const escapeText = (s) => String(s ?? '').replace(/[&<>"']/g, c =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

export function cardFrameUrl(id, kind, race) {
  if (race !== 'orc') return '';
  const building = ['building', 'building_upgrade', 'building_branch'].includes(kind);
  let key = id;
  if (!building) {
    const family = id.match(/^(orc_(?:berserker|goblin|warg|shaman|ram|troll))_(?:hp|dmg)$/)?.[1];
    if (family) key = family + '_common';
    else key = ({ orc_warrior_hp: 'orc_hp', orc_warrior_dmg: 'orc_hp', orc_bleed: 'orc_hp',
      orc_leech: 'orc_berserker_common', orc_double: 'orc_goblin_common',
      orc_spear_crit: 'orc_warg_common', orc_curse_duration: 'orc_shaman_common',
      orc_troll_regen: 'orc_troll_common' })[id] || id;
  }
  const file = manifest.cards[`${building ? 'building' : 'upgrade'}:${key}`];
  return file ? assetUrl('cards/orc/' + file) : '';
}
export const frameImage = (src) => src
  ? `<img class="cardFrameImage" src="${src}" alt="" loading="lazy" decoding="async" draggable="false">` : '';

const mechanics = /mérg\w*|méreg\w*|tűz\w*|égés\w*|égési\w*|fagy\w*|lassít\w*|vérz\w*|átok\w*|átk\w*|pajzs\w*|gyógy\w*|regener\w*/giu;
const theme = (word) => /mérg|méreg/i.test(word) ? 'poison' : /tűz|égés|égési/i.test(word) ? 'fire'
  : /fagy|lassít/i.test(word) ? 'frost' : /vérz/i.test(word) ? 'bleed'
  : /átok|átk/i.test(word) ? 'curse' : /pajzs/i.test(word) ? 'shield' : 'heal';

// A reduction in price is a benefit; a reduction in our units' health is a penalty.
// Unmodified quantities (costs, ranges, thresholds) remain neutral.
function numberTone(input, match) {
  const before = input.slice(0, match.index), after = input.slice(match.index + match[0].length);
  const clauseBefore = before.split(/[;.!?\n]|\bde\b/iu).at(-1);
  const clauseAfter = after.split(/[;.!?\n]|\bde\b/iu)[0].split(/[+−-]?\d/u)[0];
  const context = clauseBefore + match[0] + clauseAfter;
  const n = Number(match[0].replace(/[+%×\s]/g, '').replace('−', '-').replace(',', '.'));
  if (/HP-val indul|kezdőéleterő|induló életerő/iu.test(clauseAfter) && n < 100) return 'negative';
  if (/(?:épséget|életerőt) veszít|lassabban mozog|tovább tart/iu.test(clauseAfter)) return 'negative';
  if (n === 0 && /sebzése\s*$/iu.test(clauseBefore)) return 'negative';
  const expense = /(?:költség|egységár|képzési ár|fenntartás|képzési idő|gyártási idő|várakozás|idő két gyógyítás|kapott (?:fizikai )?sebzés)/iu;
  const enemy = /ellenség|ellenfél|célpont|megjelölt|átok|átkai|átkok|fagyasztás/iu.test(clauseBefore);
  const saving = /olcsóbb|rövidebb|kevesebb/iu.test(clauseAfter);
  if (saving && /%|^[+−-]/u.test(match[0])) return 'positive';
  if (expense.test(context) && /[+−-]|×/u.test(match[0])) return enemy ? (n < 0 ? 'negative' : 'positive') : (n < 0 ? 'positive' : 'negative');
  if (/^[−-]/u.test(match[0])) return enemy ? 'positive' : 'negative';
  if (/^\+/u.test(match[0])) return 'positive';
  if (/×$/u.test(match[0])) return 'positive';
  if (/%$/u.test(match[0]) && !/életerő alatt|eséllyel elhibázza|hiányzó életerő/iu.test(clauseAfter)) return 'positive';
  return 'value';
}

export function effectText(text) {
  const input = String(text ?? '');
  const terms = [...input.matchAll(mechanics)];
  const tokens = /[+−-]?\d+(?:[,.]\d+)?(?:\s?[%×])?|mérg\p{L}*|méreg\p{L}*|tűz\p{L}*|égés\p{L}*|égési\p{L}*|fagy\p{L}*|lassít\p{L}*|vérz\p{L}*|átok\p{L}*|átk\p{L}*|pajzs\p{L}*|gyógy\p{L}*|regener\p{L}*/giu;
  let out = '', end = 0;
  for (const m of input.matchAll(tokens)) {
    out += escapeText(input.slice(end, m.index));
    let color = /\d/u.test(m[0]) ? numberTone(input, m) : theme(m[0]);
    if (color === 'value') {
      const near = terms.filter(t => Math.abs(t.index - m.index) < 45 &&
        !/[.;\n]/u.test(input.slice(Math.min(t.index, m.index), Math.max(t.index, m.index))));
      near.sort((a, b) => Math.abs(a.index - m.index) - Math.abs(b.index - m.index));
      if (near[0]) color = theme(near[0][0]);
    }
    out += `<span class="effectValue effect-${color}">${escapeText(m[0])}</span>`;
    end = m.index + m[0].length;
  }
  return out + escapeText(input.slice(end));
}

// Decorate text nodes only: generated resource icons and attributes remain intact.
export function decorateEffects(root) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walker.nextNode()) if (!walker.currentNode.parentElement.closest('.effectValue, h3, .ctype, .cardname')) nodes.push(walker.currentNode);
  for (const node of nodes) {
    if (!/\d|méreg|mérg|tűz|égés|fagy|pajzs|vérz|átok|gyógy/i.test(node.textContent)) continue;
    const template = document.createElement('template');
    const tone = node.parentElement.closest('[data-effect-tone]')?.dataset.effectTone;
    template.innerHTML = tone ? `<span class="effectValue effect-${tone}">${escapeText(node.textContent)}</span>` : effectText(node.textContent);
    node.replaceWith(template.content);
  }
}

export function installCardPresentation(R) {
  R.cardBuildingCopy = createBuildingCardCopy(R);
  const choices = R.renderChoice;
  R.renderChoice = (options, ...args) => {
    R.hideTerrainTooltip();
    const out = choices(options, ...args);
    R.$$('#choiceList .choice').forEach((card, i) => {
      const o = options[i], src = cardFrameUrl(o.id, o.kind, R.P.race);
      const body = card.querySelector('.choiceBody');
      if (['building', 'building_upgrade'].includes(o.kind)) {
        const level = o.kind === 'building_upgrade' ? R.upgradeTargetLevel(R.P, o.id) : R.levelOf(R.P, o.id);
        const model = R.cardBuildingCopy.metrics(R.P.race, o.id, level);
        body.innerHTML = `<p>${effectText(model.description)}</p>`;
        // The art already displays the training price and time; no repeated rows below it.
        if (o.kind === 'building_upgrade' && R.BUILDINGS[o.id]?.unit) {
          const before = R.previewTrainingTime(R.P, o.id, R.levelOf(R.P, o.id));
          const after = R.previewTrainingTime(R.P, o.id, level);
          const fmt = n => n.toLocaleString('hu-HU', {maximumFractionDigits: 2});
          body.insertAdjacentHTML('beforeend', `<span class="trainingChange">Képzés: ${escapeText(fmt(before))} → <b class="effectValue effect-positive">${escapeText(fmt(after))} mp</b></span>`);
          const badge = card.querySelector('.pickCD b');
          if (badge) badge.textContent = `${fmt(after)} mp`;
        }
      }
      if (o.kind === 'building_branch') {
        const branches = R.P.race === 'undead' ? window.__ROADLORDS_UNDEAD__.buildings[o.id]?.branches
          : R.P.race === 'orc' && o.id === 'keep' ? window.__ROADLORDS_ORCS__.keepBranches : R.V4_BRANCHES[o.id];
        body.innerHTML = `<p>${effectText(branches?.find(b => b.id === o.branch)?.description || o.description)}</p>`;
      }
      if (R.P.race === 'undead' && ['building','building_upgrade','building_branch'].includes(o.kind) && o.id !== 'keep') {
        const upkeep = window.__ROADLORDS_UNDEAD__.buildings[o.id].upkeep.toLocaleString('hu-HU');
        card.querySelector('.choiceArt').insertAdjacentHTML('beforeend', `<span class="pickUpkeep" title="Alapfenntartás">${effectText('−' + upkeep + ' Lélek/mp')}</span>`);
      }
      if (cardRules[o.id]) card.title += `\n${cardRules[o.id]}`;
      card.classList.add('illustratedCard');
      card.querySelector('.ctype')?.remove();
      const tag=card.querySelector('.picktag');
      if(tag&&o.kind==='normal')tag.textContent=R.P.normal[o.id] ? `GYAKORI · ×${R.P.normal[o.id]}` : 'GYAKORI';
      const branchTag=card.querySelector('.branchTag');
      if(branchTag)branchTag.textContent='L3 → L4';
      if (src) {
        card.classList.add('hasCardFrame');
        card.insertAdjacentHTML('afterbegin', frameImage(src));
        card.querySelector('.choiceArt')?.querySelectorAll(':scope > img, :scope > .undeadBuildingArt').forEach(el => el.remove());
      }
      decorateEffects(body);
    });
    return out;
  };
  const builds = R.renderBuildList;
  R.renderBuildList = (...args) => {
    const out = builds(...args);
    R.$$('#buildList .buildcard').forEach(card => {
      const src = cardFrameUrl(card.dataset.k, 'building', R.P.race);
      card.classList.add('illustratedBuildCard', 'illustratedCard');
      card.querySelector('.cardinfo')?.remove();
      if (src) {
        card.classList.add('hasCardFrame');
        card.insertAdjacentHTML('afterbegin', frameImage(src));
        card.querySelector('.cardart')?.querySelectorAll(':scope > img').forEach(el => el.remove());
      }
    });
    return out;
  };
  Object.assign(window.__ROADLORDS__, { renderChoice: R.renderChoice, renderBuildList: R.renderBuildList });
  R.renderBuildList();
}
