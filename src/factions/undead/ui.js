import {
  UNDEAD_BUILDINGS as D,
  UNDEAD_UNITS as U,
  UNDEAD_UPGRADES,
  UNDEAD_RULES,
} from '../../data/undead.js';
import { isUndead } from './foundation.js';
import { formatMetres, formatSpeed, metricDescription } from '../../world/measurements.js';
export function initializeUndeadUi(R) {
  for (const select of document.querySelectorAll('#soloRace,#aiRace,#mpRace')) {
    const option = document.createElement('option');
    option.value = 'undead';
    option.textContent = 'Élőhalottak';
    select.append(option);
  }
  const note = R.MP.lobby.querySelector('.orcSoloPanel .orcNote');
  if (note)
    note.textContent =
      'Emberek, Orkok vagy Élőhalottak. Az élőhalottak csak Lelket használnak; épületeik fenntartása folyamatos költség.';
  const cost = R.costText,
    icons = R.resourceIconTag,
    costHtml = R.resourceCostHTML;
  R.costText = (price) => (isUndead(R.P) ? `${Math.ceil(price?.wood || 0)} Lélek` : cost(price));
  R.resourceIconTag = (type, mini = false) =>
    isUndead(R.P) && type === 'wood'
      ? `<img class="costIcon${mini ? ' mini' : ''}" src="${R.SOUL_IMAGE}" alt="Lélek">`
      : icons(type, mini);
  R.resourceCostHTML = (price, mini = false, zero = false) =>
    isUndead(R.P)
      ? `<span class="resourceCost soul">${R.resourceIconTag('wood', mini)}${Math.ceil(price?.wood || 0) || (zero ? '—' : 0)}</span>`
      : costHtml(price, mini, zero);
  const refresh = () => {
    const undead = isUndead(R.P);
    document.body.classList.toggle('undead-player', undead);
    const image = R.$('#woodStock').closest('.res').querySelector('.resourceIcon');
    if (!image.dataset.originalSrc) image.dataset.originalSrc = image.src;
    const src = undead ? R.SOUL_IMAGE : image.dataset.originalSrc;
    if (image.src !== src) image.src = src;
    image.alt = undead ? 'Lélek' : 'Fa';
    if (!undead) return;
    const c = R.P,
      format = (v) => v.toLocaleString('hu-HU', { minimumFractionDigits: 1, maximumFractionDigits: 1 }),
      flow = R.resourceFlowRates(c),
      credit = R.undCredit(c);
    R.$('#woodStock').textContent = Math.floor(c.resources.wood).toLocaleString('hu-HU');
    R.$('#woodStock').classList.toggle('undDebt', c.resources.wood < 0);
    R.$('#woodStock').title =
      `Korlátlan tárolás.${credit ? ' Hitelkeret: −' + credit + ' Lélek. Negatív készletnél a katonai képzés szünetel.' : ''}`;
    R.$('#woodGain').textContent = `+${format(flow.gain.wood)}/mp`;
    R.$('#woodUse').textContent = `−${format(flow.use.wood)}/mp`;
    R.$('#woodGain').title =
      'Állandó Lélektermelés. A halálok után járó Lélek és a bankkamat külön, eseménykor érkezik.';
    R.$('#woodUse').title =
      `Teljes üzemi igény:\nKatonaképzés: ${format(flow.sources.production.wood)} Lélek/mp\nÉpületek fenntartása: ${format(flow.sources.upkeep.wood)} Lélek/mp\nA nyersanyaghiány és a megtelt sereg nem csökkenti a tervezett igényt.`;
  };
  const hud = R.updateHud;
  R.updateHud = (...a) => {
    const out = hud(...a);
    refresh();
    return out;
  };
  const render = R.renderStatic;
  R.renderStatic = (...a) => {
    const out = render(...a);
    refresh();
    return out;
  };
  const preview = R.upgradeCopyPreview,
    defs = new Map(UNDEAD_UPGRADES.map((o) => [o.id, o]));
  R.upgradeCopyPreview = (c, o) => {
    const d = defs.get(o.id);
    if (!d) return preview(c, o);
    const n = o.kind === 'normal' ? R.countNormal(c, o.id) : R.hasLeg(c, o.id) ? 1 : 0,
      next = n + 1,
      rows = [];
    const key = Object.keys(U).find((k) => U[k].name === d.scope);
    if (key && o.kind === 'normal' && /_(hp|damage)$/.test(o.id)) {
      const after = { ...c, normal: { ...c.normal, [o.id]: next } },
        a = R.statsFor(c, { key }),
        b = R.statsFor(after, { key });
      for (const [k, label] of [
        ['hp', 'Életerő'],
        ['dmg', 'Sebzés'],
      ])
        if (a[k] !== b[k])
          rows.push({ label, before: a[k].toLocaleString('hu-HU'), after: b[k].toLocaleString('hu-HU') });
    }
    const fmt = (v) => v.toLocaleString('hu-HU', { maximumFractionDigits: 2 });
    const modifiers = {
      gen_soul_frugal: ['Fenntartás az eredeti értékhez képest', (n) => fmt(100 * 0.95 ** n) + '%'],
      gen_soul_abundance: ['Lélekbevétel', (n) => '+' + fmt(10 * n) + '%'],
      gen_graveyard_capacity: ['Plusz helyőrségi férőhely / Temető', (n) => '+' + n],
      gen_military_speed: ['Katonai gyártás sebessége', (n) => '+' + fmt(5 * n) + '%'],
      gen_build_discount: ['Építési ár az eredeti értékhez képest', (n) => fmt(100 * 0.95 ** n) + '%'],
      garden_chance: ['Holtak kertje feltámasztási esélye', (n) => fmt(Math.min(100, 10 + 2 * n)) + '%'],
      skeleton_common_ranged_res: [
        'Távolsági fegyverek elleni ellenállás',
        (n) => fmt(Math.min(90, 25 + 5 * n)) + '%',
      ],
      zombie_common_poison: ['Méregpont harci halálkor', (n) => 4 + n],
      ghost_common_dodge: [
        'Kitérés esélye',
        (n) =>
          fmt(
            Math.min(
              R.hasLeg(c, 'ghost_leg_intangible') ? 80 : 70,
              40 + 5 * n + (R.hasLeg(c, 'ghost_leg_intangible') ? 20 : 0),
            ),
          ) + '%',
      ],
      necro_common_summon_stats: ['Idézett Csontvázak HP- és sebzésbónusza', (n) => '+' + fmt(10 * n) + '%'],
      vampire_common_lifesteal: ['Életlopás', (n) => fmt(30 + 5 * n) + '%'],
      lich_common_respawn: ['Újraéledés esélye', (n) => fmt(Math.min(100, 3 * n)) + '%'],
    };
    const mod = modifiers[o.id];
    if (mod) rows.push({ label: mod[0], before: String(mod[1](n)), after: String(mod[1](next)) });
    return {
      description: d.description,
      rows,
      context: 'Az élőhalott frakció jelenlegi fejlesztéseivel.',
      stacking:
        o.kind === 'normal'
          ? `Halmozható · felvéve: ${n} → ${next}.`
          : 'Egyszer választható.',
      specialization: '',
    };
  };
  const stats = R.unitStatsHTML;
  R.unitStatsHTML = (c, key) => {
    if (!U[key]) return stats(c, key);
    const s = R.statsFor(c, { key }),
      u = U[key];
    return `<div class="unitgrid"><div class="unitstat"><span>Életerő</span><b>${s.hp.toFixed(0)}</b></div><div class="unitstat"><span>${key === 'und_lich' ? 'Kezdeti sugár / mp' : 'Sebzés'}</span><b>${s.dmg.toFixed(1)}</b></div><div class="unitstat"><span>Hatótáv</span><b>${formatMetres(s.range)}</b></div><div class="unitstat"><span>Mozgás</span><b>${formatSpeed(s.speed)}</b></div><div class="unitstat"><span>Egység ára</span><b>${u.souls} Lélek</b></div></div><p class="undUnitMechanic">${metricDescription(u.description)}</p>`;
  };
  const short = R.buildCardShortDescV41004;
  R.buildCardShortDescV41004 = (type) =>
    isUndead(R.P) && D[type]
      ? D[type].description +
        (D[type].unit ? '' : ` ${D[type].levels[R.levelOf(R.P, type) - 1]}`) +
        ` Fenntartás: ${D[type].upkeep.toLocaleString('hu-HU')} Lélek/mp.`
      : short(type);
  const branch = R.makeBuildingChoice;
  R.makeBuildingChoice = (c, type) =>
    isUndead(c) && type === 'keep'
      ? {
          kind: 'building',
          id: type,
          icon: D.keep.icon,
          name: D.keep.name,
          description: D.keep.description,
          details: R.buildingChoiceDetails(c, type),
        }
      : branch(c, type);
  window.__ROADLORDS_UNDEAD__.soulCostHTML = (price) =>
    `<span class="lexResource"><img class="costIcon mini" src="${R.SOUL_IMAGE}" alt="Lélek"><b>${Math.ceil(price?.wood || 0)} Lélek</b></span>`;
  Object.assign(window.__ROADLORDS_LEXICON_BRIDGE__, {
    buildingUpgradeDetails: R.buildingUpgradeDetails,
    buildPrice: R.buildPrice,
    cardBuildingImageTag: R.cardBuildingImageTag,
    unitImageTag: R.unitImageTag,
    resourceIconTag: icons,
  });
  Object.assign(window.__ROADLORDS__, {
    statsFor: R.statsFor,
    makeEntry: R.makeEntry,
    productionRates: R.productionRates,
    trainingTime: R.trainingTime,
    eligibleNormal: R.eligibleNormal,
    eligibleLegendary: R.eligibleLegendary,
    buildingUnlockPool: R.buildingUnlockPool,
    buildingUpgradePool: R.buildingUpgradePool,
    setBuildingLevel: R.setBuildingLevel,
    buildingEffectRows: R.buildingEffectRows,
    unitStatsHTML: R.unitStatsHTML,
  });
  refresh();
}
