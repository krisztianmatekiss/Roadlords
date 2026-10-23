import { NORMAL_COPY, LEGENDARY_COPY, BUILDING_COPY, BRANCH_COPY } from '../data/upgrade-copy.js';

const NORMAL_LIMITS = { building_discount: 5, orc_double: 20, orc_blessing: 40, orc_refund: 5, orc_loot: 10 };
const LEGEND_LIMITS = { sword_execute: 5, magic_order: 4, tavern_chain: Infinity, strategic_superiority: Infinity };
const UNIT_PREFIXES = { sword: 'swordsman', swordsman: 'swordsman', spear: 'spearman', archer: 'archer', knight: 'knight', priest: 'priest', catapult: 'catapult', cat: 'catapult', mage: 'mage' };
const METRICS = {
  hp: ['Életerő', ''], dmg: ['Sebzés', ''], heal: ['Gyógyítás', ''], cooldown: ['Két támadás között', ' mp'],
  speed: ['Mozgási sebesség', ''], range: ['Hatótáv', ''], buildingDamage: ['Épület elleni sebzés', ''], aoe: ['Területi sugár', '']
};
const format = n => new Intl.NumberFormat('hu-HU', { maximumFractionDigits: 2 }).format(n);
const percent = n => `${format(n)}%`;
const bonus = n => `+${percent(n)}`;
const scalar = (label, value, unit = '') => n => ({ label, value: `${format(value(n))}${unit}` });
// These rows show the contribution of this card alone, never a fabricated city total.
const MODIFIERS = {
  spawn_speed: n => ({ label: 'A lap képzésisebesség-bónusza', value: bonus(10 * n) }),
  production: n => ({ label: 'A lap termelési bónusza', value: bonus(10 * n) }),
  frugal_training: n => ({ label: 'Ár e lap kedvezményével', value: percent(100 * .95 ** n) }),
  building_discount: n => ({ label: 'Ár e lap kedvezményével', value: percent(100 - 10 * Math.min(5, n)) }),
  tower_crews: n => ({ label: 'A lap toronybónusza', value: bonus(8 * n) }),
  tower_regen: scalar('A lap regenerációja', n => 5 * n, ' életerő/mp'),
  gate_discipline: n => ({ label: 'Kiengedés / plusz helyőrségi férőhely', value: `${bonus(10 * n)} / +${5 * n}` }),
  orc_bleed: scalar('Vérzés találatonként', n => n ? n + 1 : 0),
  orc_leech: n => ({ label: 'Életlopás e lapból', value: percent(n ? 3 + 2 * n : 0) }),
  orc_double: n => ({ label: 'Második támadás esélye', value: percent(Math.min(100, 5 * n)) }),
  orc_wood: n => ({ label: 'A lap fatermelési bónusza', value: bonus(20 * n) }),
  orc_stone: n => ({ label: 'A lap kőtermelési bónusza', value: bonus(20 * n) }),
  orc_food: n => ({ label: 'A lap élelemtermelési bónusza', value: bonus(20 * n) }),
  orc_spear_crit: n => ({ label: 'Kritikus esély e lapból', value: percent(10 * n) }),
  orc_curse_duration: scalar('Új átkok időtartama', n => 4 + n, ' mp'),
  orc_troll_regen: scalar('A lap regenerációja', n => 5 * n, ' életerő/mp'),
  orc_crit: n => ({ label: 'Kritikus esély e lapból', value: percent(4 * n) }),
  orc_blessing: n => ({ label: 'Áldás esélye', value: percent(Math.min(100, 2.5 * n)) }),
  orc_refund: n => ({ label: 'Visszatérítés esélye', value: percent(Math.min(50, 10 * n)) }),
  orc_loot: n => ({ label: 'Zsákmány esélye', value: percent(Math.min(100, 10 * n)) }),
  orc_cargo: scalar('Trójai kos utasférőhelye', n => 10 + 4 * n)
};

function unitFor(id) {
  if (['orc_hp', 'orc_as'].includes(id)) return 'orc_warrior';
  if (id === 'all_damage') return 'swordsman';
  if (id.startsWith('orc_') && /_(hp|dmg)$/.test(id)) return id.replace(/_(hp|dmg)$/, '');
  return UNIT_PREFIXES[id.split('_')[0]];
}

export function initializeUiUpgradeCopy(R) {
  for (const [id, description] of Object.entries(BUILDING_COPY)) if (R.BUILDINGS[id]) R.BUILDINGS[id].description = description;
  for (const [type, branches] of Object.entries(R.V4_BRANCHES))
    for (const branch of branches)
      if (BRANCH_COPY[`${type}/${branch.id}`]) branch.description = BRANCH_COPY[`${type}/${branch.id}`];
  for (const [defs, copy] of [[R.NORMAL, NORMAL_COPY], [R.LEGENDARY, LEGENDARY_COPY]]) {
    for (const def of defs) if (copy[def.id]) def.description = copy[def.id];
  }
  // Previewing must not call applyChoice/recomputeCity or consume random numbers.
  R.upgradeCopyPreview = function (c, option) {
    const { id, kind } = option;
    const normal = kind === 'normal';
    if (!normal && kind !== 'legendary') return null;
    const n = normal ? R.countNormal(c, id) : Math.max(Number(c.legendaryStacks?.[id]) || 0, R.hasLeg(c, id) ? 1 : 0);
    const limit = normal ? NORMAL_LIMITS[id] ?? Infinity : LEGEND_LIMITS[id] ?? 1;
    const next = Math.min(n + 1, limit);
    const rows = [];
    let context = '';
    if (normal && MODIFIERS[id]) {
      const before = MODIFIERS[id](n), after = MODIFIERS[id](next);
      rows.push({ label: before.label, before: before.value, after: after.value });
      context = 'A fejlesztés összesített bónusza.';
      if (id === 'orc_curse_duration' && R.hasBranch(c, 'orc_shaman', 'strong_curses')) context += ' Az erősebb átokág az erősséget módosítja.';
    } else if (normal) {
      const key = unitFor(id);
      if (R.UNITS[key]) {
        const beforeCity = { ...c, normal: { ...c.normal } };
        const afterCity = { ...c, normal: { ...c.normal, [id]: next } };
        const before = R.statsFor(beforeCity, { key, veteran: false });
        const after = R.statsFor(afterCity, { key, veteran: false });
        for (const [metric, [label, suffix]] of Object.entries(METRICS)) {
          if (metric === 'buildingDamage' && !['catapult', 'orc_ram'].includes(key)) continue;
          if (!Number.isFinite(before[metric]) || !Number.isFinite(after[metric]) || Math.abs(before[metric] - after[metric]) < 1e-8) continue;
          rows.push({ label, before: format(before[metric]) + suffix, after: format(after[metric]) + suffix });
        }
        context = `${R.UNITS[key].name} · városi fejlesztésekkel, veterán és ideiglenes bónuszok nélkül.`;
        if (id === 'all_damage') {
          const a = R.statsFor(beforeCity, { key: 'priest', veteran: false });
          const b = R.statsFor(afterCity, { key: 'priest', veteran: false });
          rows.push({ label: 'Pap gyógyítása', before: format(a.heal), after: format(b.heal) });
        }
      }
    } else if (id === 'sword_execute' || id === 'magic_order') {
      rows.push({ label: id === 'sword_execute' ? 'Kivégzés esélye' : 'Mágusképzés esélye', before: percent(n * (id === 'sword_execute' ? 4 : 25)), after: percent(next * (id === 'sword_execute' ? 4 : 25)) });
    } else if (id === 'tavern_chain') {
      rows.push({ label: 'Építhető Kocsmák', before: format(1 + n), after: format(1 + next) });
    }
    const stacking = `${limit === 1 ? 'Egyszer választható.' : Number.isFinite(limit) ? `Legfeljebb ${limit}× választható.` : 'Korlátlanul halmozható.'} Felvéve: ${n}${Number.isFinite(limit) ? `/${limit}` : '×'}${n < limit ? ` → ${next}${Number.isFinite(limit) ? `/${limit}` : '×'}` : ' · maximum'}.`;
    const specialization = normal && n > 0 && R.hasLeg(c, 'specialization') && n < limit
      ? 'Specializáció: 50% eséllyel kétszer kapod meg. Az előnézet egy felvételt mutat.' : '';
    return { description: (normal ? NORMAL_COPY : LEGENDARY_COPY)[id] || option.description || '', rows, context, stacking, specialization };
  };

  const render = R.renderChoice;
  R.renderChoice = function (options, ...args) {
    render(options, ...args);
    R.$$('#choiceList .choice').forEach((card, i) => {
      const option = options[i], body = card.querySelector('.choiceBody');
      if (option.kind === 'building_upgrade' && body) {
        body.querySelector('p')?.remove();
      }
      const preview = R.upgradeCopyPreview(R.P, option);
      if (!preview || !body) return;
      card.classList.add('upgradeCopyCard');
      body.replaceChildren();
      const append = (tag, className, text, parent = body) => {
        const el = document.createElement(tag);
        el.className = className;
        el.textContent = text;
        parent.append(el);
        return el;
      };
      append('p', 'upgradeDescription', preview.description);
      if (preview.rows.length) {
        const rows = append('span', 'upgradeComparison', '');
        rows.title = preview.context;
        for (const row of preview.rows) {
          const line = append('span', 'upgradeRow', '', rows);
          append('span', 'upgradeMetric', row.label, line);
          append('b', 'upgradeValues', `${row.before} → ${row.after}`, line);
        }
      }
      card.title = preview.stacking;
      if (preview.specialization) append('small', 'upgradeSpecialization', preview.specialization);
    });
  };
}
