// Permanent roles/capabilities, shared by producer cards, inspectors and unit portraits.
const symbols = {
  infantry: ['Gyalogos', '#9dc9f0', '<path fill="currentColor" fill-opacity=".5" d="M5 12V9a7 7 0 0 1 14 0v3l-3 2v6l-4 2-4-2v-6Z"/><path d="M5 12V9a7 7 0 0 1 14 0v3l-3 2v6l-4 2-4-2v-6Zm7-10v9M4 11h16M8 16l4 2 4-2"/><path stroke="#eef5ff" d="m8 8 2-2"/>'],
  melee: ['Közelharci', '#ff7774', '<path fill="currentColor" fill-opacity=".6" d="m4 2 6 3 9 12-3 3L5 8Zm16 0-6 3-9 12 3 3L19 8Z"/><path d="m4 2 6 3 9 12-3 3L5 8Zm16 0-6 3-9 12 3 3L19 8M3 15l6 6m6-6 6 6M3 22l3-3m12 0 3 3"/>'],
  ranged: ['Távolsági', '#86e987', '<path fill="currentColor" fill-opacity=".2" d="M6 2q21 10 0 20l6-10Z"/><path stroke-width="2.4" d="M6 2q21 10 0 20"/><path d="m6 2 6 10-6 10M2 12h20m-4-4 4 4-4 4"/><path stroke="#eaffdf" d="M5 12h12"/>'],
  dodge: ['Kitérés', '#b3d7ed', '<path d="M4 19 10 7h9m-4-4 4 4-4 4M3 6l4 4m-5 1 3 3"/><path d="m12 21 3-6 4 4 3-6" stroke-dasharray="2 3"/>'],
  magic: ['Mágikus', '#ce9aff', '<path d="m4 21 10-10m1-9 2 5 5 2-5 2-2 5-2-5-5-2 5-2Z"/>'],
  aoe: ['Területi sebzés', '#f0b071', '<circle cx="12" cy="12" r="4"/><path d="M12 2v4m0 12v4M2 12h4m12 0h4M4 4l3 3m10 10 3 3M4 20l3-3M17 7l3-3"/>'],
  lifesteal: ['Életlopás', '#f08e9d', '<path d="M10 3C8 8 4 11 4 15a6 6 0 0 0 12 0c0-4-4-7-6-12Z"/><path d="M19 7v8m-4-4h8"/>'],
  summon: ['Idézés', '#99e9c6', '<path d="M6 13V9a6 6 0 0 1 12 0v4l-3 2v4H9v-4Z"/><circle cx="9" cy="10" r="1"/><circle cx="15" cy="10" r="1"/><path d="M3 20v3m-2-1h4m16-2v3m-2-1h4M10 22h4"/>'],
  heal: ['Gyógyítás', '#93e8ad', '<path d="M9 3h6v6h6v6h-6v6H9v-6H3V9h6Z"/>'],
  siege: ['Ostromfegyver', '#ffbd68', '<path fill="currentColor" fill-opacity=".5" d="M3 17h16v3H3Zm3-4 5-11 2 1-4 12Z"/><path d="M3 17h16v3H3Zm3-4 5-11 2 1-4 12M8 17l4-8 5 8M13 3l8 5-3 4-6-4"/><circle cx="5" cy="21" r="2" fill="currentColor"/><circle cx="18" cy="21" r="2" fill="currentColor"/><path stroke="#fff4d6" d="m14 5 4 3"/>'],
  poison: ['Mérgezés', '#ade577', '<path d="M9 2h6m-5 0v7L4 19q-1 3 3 3h10q4 0 3-3l-6-10V2M8 14h8M9 18h.1m5 1h.1"/>'],
  curse: ['Átkok', '#d8a4f1', '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Zm10-9v2m-7-4 2 4m10-4-2 4"/><circle cx="12" cy="12" r="3"/>'],
  tank: ['Nagy életerő', '#c7c9bb', '<path d="M12 2 3 6v7q1 6 9 9 8-3 9-9V6ZM8 12h8m-4-4v8"/>'],
  cavalry: ['Lovas', '#f5d576', '<path fill="currentColor" fill-opacity=".5" d="m5 22 2-7-4-4 4-7 6-2v4l7 6-2 4-6-3-1 9Z"/><path d="m5 22 2-7-4-4 4-7 6-2v4l7 6-2 4-6-3-1 9M7 5l3 3m2 5 4-3M4 22h12"/><circle cx="10" cy="7" r="1" fill="#fff4d6" stroke="none"/>'],
  frenzy: ['Sebesülten gyorsabb támadás', '#f0a07e', '<path d="m5 21 6-17 6 5-7 5M3 8l3-5m10 13 5-2m-6 5 5 2M7 15l5 2"/>'],
  resistance: ['Távolsági vagy fizikai ellenállás', '#b9d5d8', '<path d="m12 2-8 4v7q1 5 8 9 7-4 8-9V6ZM7 9h10m-3-3 3 3-3 3M8 17h8"/>'],
  bleed: ['Vérzés', '#f18da1', '<path d="M12 2C9 8 5 11 5 16a7 7 0 0 0 14 0c0-5-4-8-7-14ZM9 15l5 4m-5 0 5-4"/>'],
  fire: ['Tűz', '#ffac76', '<path d="M12 2q2 7 6 8 8 12-6 12C-2 22 6 10 8 9q-1 6 3 5 3-3 1-12Z"/>'],
  frost: ['Fagyasztás', '#9edfff', '<path d="M12 2v20M3 7l18 10M3 17 21 7M9 4l3 3 3-3M9 20l3-3 3 3M3 10l4-1-1-4m12 14-1-4 4-1M3 14l4 1-1 4m12-14-1 4 4 1"/>'],
};

export function unitTraits(R, key, c = null) {
  const base = {
    swordsman:['melee'], spearman:['melee'], archer:['ranged'], knight:['melee','cavalry'], priest:['ranged','magic','heal'], catapult:['ranged','siege'], mage:['ranged','magic','aoe','fire'],
    orc_warrior:['melee','tank'], orc_berserker:['melee','frenzy'], orc_goblin:['ranged'], orc_warg:['melee','cavalry','ranged'], orc_shaman:['ranged','magic','curse'], orc_troll:['melee','aoe'], orc_ram:['melee','siege','resistance'],
    und_skeleton:['melee','resistance'], und_skeleton_archer:['ranged','resistance'], und_zombie:['melee','poison'], und_ghost:['melee','dodge'], und_necromancer:['ranged','magic','summon'], und_vampire:['melee','lifesteal'], und_lich:['ranged','magic','lifesteal'],
  };
  const category = R.UNITS[key]?.cat;
  const role = {infantry:'infantry', cavalry:'cavalry', siege:'siege', magic:'magic'}[category];
  const traits = [...(role ? [role] : []), ...(base[key] || [])];
  if (c) {
    if (key === 'orc_goblin' && R.hasBranch(c,'orc_gob','agile')) traits.push('dodge');
    if (key === 'orc_warrior' && R.countNormal(c,'orc_bleed')) traits.push('bleed');
    if (c.race === 'undead' && R.hasLeg(c,'und_army_leech')) traits.push('lifesteal');
    if (key.startsWith('orc_') && window.__ROADLORDS_STATUSES__.lifeStealRate(c,key) > 0) traits.push('lifesteal');
    if (c.race === 'undead' && c.buildings.some(b=>b.type==='und_plague_chamber'&&!b.inactive)) traits.push('poison');
    if (key==='mage' && R.hasBranch(c,'magetower','frost_mages')) traits.splice(traits.indexOf('fire'),1,'frost');
  }
  return [...new Set(traits)];
}
export function unitTraitIcons(R, key, c = null, cls = '') {
  return `<span class="unitTraits ${cls}" aria-label="Egységjellemzők">${unitTraits(R,key,c).map(id=>{
    const [name,color,paths] = symbols[id];
    return `<span class="unitTrait" data-trait="${id}" style="--trait-color:${color}" title="${name}" role="img" tabindex="0" aria-label="${name}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg></span>`;
  }).join('')}</span>`;
}

export function installUnitTraitInspectors(R) {
  const decorate = () => {
    for (const panel of document.querySelectorAll('.spawnCompact')) {
      const name=panel.querySelector('.unitTitle > b');
      if (!name || name.querySelector('.unitTraits')) continue;
      const key=Object.keys(R.UNITS).find(k=>R.UNITS[k].name===name.textContent);
      if (!key) continue;
      const c=panel.closest('#inspector') && R.getBuilding(R.E,R.state.selectedBuilding) ? R.E : R.P;
      name.insertAdjacentHTML('beforeend',unitTraitIcons(R,key,c,'inlineTraits'));
      panel.querySelector('.unitPortraitFrame')?.insertAdjacentHTML('beforeend',unitTraitIcons(R,key,c,'portraitTraits'));
    }
  };
  for(const method of ['renderInspector','renderStatic','inspectEnemyBuilding']) if (typeof R[method]==='function') {
    const previous=R[method];R[method]=(...args)=>{const out=previous(...args);decorate();return out;};
  }
}
