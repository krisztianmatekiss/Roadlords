import { assetUrl } from '../assets/urls.js';
export function initializeDataArcherBalance(runtime) {
  const close = runtime.LEGENDARY.find(x => x.id === 'archer_close_combat');
  Object.assign(close, {
    name: 'Közelharci lövészet',
    description: 'Az Íjászok közvetlen közelről is teljes sebzést okoznak a szokásos 25% helyett.'
  });
  runtime.PICK_UNIT_IMAGES.archer_close_combat = 'archer';
  runtime.NORMAL.push({
    id: 'tavern_damage',
    icon: '🍺',
    name: 'Erősebb italok',
    description: 'A Kocsma sebzésbónusza +10 százalékponttal nő. Halmozható. A Hadjárati lakoma állandó bónusza ennek a felével nő.',
    eligible: c => runtime.hasBuilding(c, 'tavern')
  });
  runtime.PICK_IMAGES.tavern_damage = runtime.CARD_IMAGES.tavern || runtime.BUILDING_IMAGES.tavern;
  runtime.UNITS.archer.description = (runtime.UNITS.archer.description || 'Távolsági íjász.') + ' Közvetlen közelről (35 útegységen belül) 25% sebzést okoz; a Közelharci lövészet ezt megszünteti.';
  runtime.BUILDINGS.archery.description += ' Az Íjász közvetlen közelről csak 25% sebzést okoz, kivéve Közelharci lövészettel.';
  const oldAfter = runtime.afterFirstAttack;
  runtime.afterFirstAttack = function (u) {
    oldAfter(u);
    if (u.tempClone && u.alive) {
      u.cloneAttacksRemaining = Math.max(0, (u.cloneAttacksRemaining ?? 3) - 1);
      if (u.cloneAttacksRemaining === 0) runtime.killUnit(u, false);
    }
  };
  const oldEligible = runtime.eligibleLegendary;
  runtime.eligibleLegendary = function (c) {
    const out = oldEligible(c).filter(x => x.id !== 'sword_execute' || runtime.executionStacks35(c) < 5);
    const def = runtime.LEGENDARY.find(x => x.id === 'sword_execute');
    if (runtime.executionStacks35(c) < 5 && def.eligible(c) && !out.some(x => x.id === def.id)) out.push(def);
    return out;
  };
  const oldApply = runtime.applyChoice;
  runtime.applyChoice = function (c, o, countEvent = true) {
    if (o?.kind === 'legendary' && o.id === 'sword_execute') {
      const n = runtime.executionStacks35(c);
      if (n >= 5) return false;
      c.legendaryStacks = c.legendaryStacks || {};
      c.legendaryStacks.sword_execute = n + 1;
    }
    return oldApply(c, o, countEvent);
  };
  const oldRender = runtime.renderRelics;
  runtime.renderRelics = function () {
    const out = oldRender();
    if (runtime.hasLeg(runtime.P, 'sword_execute')) for (const item of runtime.$$('#relicList .relicitem.legendary')) {
      const title = item.querySelector('b');
      if (title?.textContent.includes('Kivégzés')) title.textContent = `☠ Kivégzés ×${runtime.executionStacks35(runtime.P)} · ${runtime.executionStacks35(runtime.P) * 4}%`;
    }
    return out;
  };
  const oldRows = runtime.buildingEffectRows;
  runtime.buildingEffectRows = function (c, b) {
    const rows = oldRows(c, b) || [];
    if (b.type === 'tavern') {
      const full = (runtime.hasBranch(c, 'tavern', 'bottoms_up') ? 2.5 : runtime.v4LevelValue(b.level, [.5, 1, 1.5, 1.5])) + .1 * runtime.countNormal(c, 'tavern_damage');
      const opening = rows.find(r => r[0] === 'Hullámbónusz');
      if (opening) opening[1] = `első ${runtime.hasBranch(c, 'tavern', 'bottoms_up') ? 4 : 2} támadás · +${Math.round(full * 100)}% sebzés / Kocsma`;
      const regular = rows.find(r => r[0] === 'Törzsvendégek');
      if (regular) regular[1] = `szomszédos termelők · minden támadás +${Math.round((1.5 + .1 * runtime.countNormal(c, 'tavern_damage')) * 100)}%`;
      if (runtime.hasLeg(c, 'campaign_feast')) rows.push(['Hadjárati lakoma', `szomszédos Gyülekezőtérből · állandó +${Math.round(full * 50)}% sebzés`]);
    }
    return rows;
  };
  Object.assign(window.__ROADLORDS__, {
    applyChoice: runtime.applyChoice,
    buildingEffectRows: runtime.buildingEffectRows,
    releaseUnit: runtime.releaseUnit
  });
}
