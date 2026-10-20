import { assetUrl } from '../assets/urls.js';
export function initializeCityAlchemyProgression(runtime) {
  window.__ALCHEMY_V4961_ACTIVE__ = true;
  const ALC = 'alchemist';
  const FULL_MIX = 'alc_full_mix';
  const MULTI_HUT = 'alc_multi_hut';
  const SLOT_LEG = 'alc_recipe_twist';
  const REPLACE_MOVE = 'alc_replace_movement';
  const REPLACE_REGEN = 'alc_replace_regen';
  const MAX_ALC_SLOTS = 12;
  const META = {
    damage: {
      icon: '⚔',
      name: 'Erő főzete',
      base: .2,
      desc: 'Erő: +20% sebzés, állandó'
    },
    hp: {
      icon: '❤',
      name: 'Életerő főzete',
      base: .2,
      desc: 'Életerő: +20% maximális életerő, állandó'
    },
    attack_speed: {
      icon: '⚡',
      name: 'Fürgeség főzete',
      base: .2,
      desc: 'Fürgeség: +20% támadási sebesség, állandó'
    },
    movement: {
      icon: '👢',
      name: 'Lendület főzete',
      base: .2,
      desc: 'Lendület: +20% mozgási sebesség, állandó'
    },
    regen: {
      icon: '💚',
      name: 'Regeneráló főzet',
      base: 10,
      desc: '10 Regeneráció; másodpercenként ennyit gyógyít, majd 1-gyel csökken'
    },
    none: {
      icon: '✖',
      name: 'X összetevő',
      base: 0,
      desc: 'Semmi'
    }
  };
  const SPEC_ID = {
    damage: 'alc_damage_power',
    hp: 'alc_hp_power',
    attack_speed: 'alc_as_power',
    movement: 'alc_move_power',
    regen: 'alc_regen_power'
  };
  runtime.BUILDINGS[ALC].unique = false;
  runtime.BUILDINGS[ALC].description = '1×1 támogatói épület. Alapból egy spawner csak egy szomszédos Alkimista kunyhótól kap főzetet. A kunyhók receptjei külön állíthatók, a főzettípusok globálisan cserélődnek.';
  if (runtime.V4_BRANCHES[ALC]) {
    const p = runtime.V4_BRANCHES[ALC].find(x => x.id === 'precise_recipe');
    if (p) p.description = 'Az aktív főzetek súlya 0–100 között szabadon állítható. Az X súlya a globális X-módosítókból számolódik.';
    const q = runtime.V4_BRANCHES[ALC].find(x => x.id === 'pure_concoction');
    if (q) q.description = 'Az alap X eltűnik, az aktív főzetek azonos súlyt kapnak. Legendary/Common X-módosítók ettől még visszahozhatják az X-et.';
  }
  function globalSlots(c) {
    if (!Array.isArray(c.alchemyRecipeSlots) || !c.alchemyRecipeSlots.length) {
      const first = runtime.buildingOf(c, ALC)[0];
      const existing = first?.alchemyPool?.filter(x => x.id !== 'none').map(x => x.id).filter(Boolean);
      c.alchemyRecipeSlots = existing?.length ? existing : ['damage', 'hp', 'attack_speed'];
    }
    if (!c.alchemyPotionUnlocks) c.alchemyPotionUnlocks = {
      damage: true,
      hp: true,
      attack_speed: true
    };
    for (const id of c.alchemyRecipeSlots) c.alchemyPotionUnlocks[id] = true;
    c.alchemySlotLegendStacks = Math.max(0, Number(c.alchemySlotLegendStacks) || 0);
    return c.alchemyRecipeSlots;
  }
  function syncHut(c, b) {
    if (!b || b.type !== ALC) return;
    globalSlots(c);
    const old = (b.alchemyPool || []).filter(x => x.id !== 'none'),
      none = (b.alchemyPool || []).find(x => x.id === 'none') || {
        id: 'none',
        weight: 25,
        locked: true
      };
    b.alchemyPool = c.alchemyRecipeSlots.map((id, i) => ({
      id,
      weight: Number(old[i]?.weight) || 25
    }));
    b.alchemyPool.push(none);
    window.__ROADLORDS_V4960__?.alcConfigure?.(c, b);
  }
  function syncAllHuts(c) {
    for (const b of runtime.buildingOf(c, ALC)) syncHut(c, b);
  }
  function recipeHas(c, id) {
    return globalSlots(c).includes(id);
  }
  function potionPower(c, id) {
    const globalAdd = .08 * runtime.countNormal(c, 'alc_all_power') + .15 * (Number(c.alchemySlotLegendStacks) || 0);
    const specific = .15 * runtime.countNormal(c, SPEC_ID[id]);
    if (id === 'regen') return Math.round(10 * (1 + globalAdd + specific));
    return (META[id]?.base || 0) + globalAdd + specific;
  }
  function applyPotion(entry, id, c, sourceId) {
    if (!entry || id === 'none' || !META[id]) return false;
    entry.alchemyEffects = Array.isArray(entry.alchemyEffects) ? entry.alchemyEffects : [];
    if (id !== 'regen' && entry.alchemyEffects.includes(id)) return false;
    if (!entry.alchemyEffects.includes(id)) entry.alchemyEffects.push(id);
    entry.alchemyEffect = entry.alchemyEffects[0] || id;
    entry.alchemySourceIds = Array.isArray(entry.alchemySourceIds) ? entry.alchemySourceIds : [];
    if (sourceId && !entry.alchemySourceIds.includes(sourceId)) entry.alchemySourceIds.push(sourceId);
    const power = potionPower(c, id);
    if (id === 'damage') entry.alchemyDamageMult = Math.max(entry.alchemyDamageMult || 1, 1 + power);else if (id === 'hp') entry.alchemyHpMult = Math.max(entry.alchemyHpMult || 1, 1 + power);else if (id === 'attack_speed') entry.alchemyAttackSpeedMult = Math.max(entry.alchemyAttackSpeedMult || 1, 1 + power);else if (id === 'movement') entry.alchemyMoveMult = Math.max(entry.alchemyMoveMult || 1, 1 + power);else if (id === 'regen') entry.alchemyRegen = (entry.alchemyRegen || 0) + power;
    return true;
  }
  function isAlchemySpawner(b) {
    return !!(b && (runtime.BUILDINGS[b.type]?.unit || b.type === 'merc_tent'));
  }
  function adjacentHuts(c, b) {
    if (!isAlchemySpawner(b)) return [];
    return runtime.buildingOf(c, ALC).filter(h => !h.inactive && runtime.adjacentBuildings(c, h).some(x => x.id === b.id));
  }
  function hutRoll(c, hut, entry) {
    syncHut(c, hut);
    const pool = hut.alchemyPool || [];
    if (runtime.hasLeg(c, FULL_MIX)) {
      const total = pool.reduce((s, x) => s + Math.max(0, Number(x.weight) || 0), 0),
        x = pool.find(v => v.id === 'none'),
        xw = Math.max(0, Number(x?.weight) || 0);
      if (total <= 0 || Math.random() < xw / total) return false;
      let any = false;
      for (const id of [...new Set(pool.filter(v => v.id !== 'none' && (Number(v.weight) || 0) > 0).map(v => v.id))]) any = applyPotion(entry, id, c, hut.id) || any;
      return any;
    }
    const id = window.__ROADLORDS_V4960__?.alcRoll?.(pool) || 'none';
    return applyPotion(entry, id, c, hut.id);
  }
  function applyAlchemyFromSpawner(c, b, entry) {
    let huts = adjacentHuts(c, b);
    if (!huts.length) return;
    if (!runtime.hasLeg(c, MULTI_HUT)) huts = huts.slice(0, 1);
    for (const hut of huts) hutRoll(c, hut, entry);
  }
  const commons = [{
    id: 'alc_x_reduce',
    icon: '🧼',
    name: 'Tisztább oldat',
    description: 'Az Alkimista kunyhók X összetevőjének súlya −5. Halmozható.',
    eligible: s => runtime.hasBuilding(s, ALC)
  }, {
    id: 'alc_damage_power',
    icon: '⚔️',
    name: 'Erősebb sebzésfőzet',
    description: 'A Sebzés főzet hatása +15 százalékpont.',
    eligible: s => runtime.hasBuilding(s, ALC) && recipeHas(s, 'damage')
  }, {
    id: 'alc_hp_power',
    icon: '❤',
    name: 'Erősebb életerőfőzet',
    description: 'Az Életerő főzet hatása +15 százalékpont.',
    eligible: s => runtime.hasBuilding(s, ALC) && recipeHas(s, 'hp')
  }, {
    id: 'alc_as_power',
    icon: '⚡',
    name: 'Erősebb gyorsítófőzet',
    description: 'A Gyorsító főzet hatása +15 százalékpont.',
    eligible: s => runtime.hasBuilding(s, ALC) && recipeHas(s, 'attack_speed')
  }, {
    id: 'alc_move_power',
    icon: '👢',
    name: 'Erősebb szélfőzet',
    description: 'A Szélfőzet hatása +15 százalékpont.',
    eligible: s => runtime.hasBuilding(s, ALC) && recipeHas(s, 'movement')
  }, {
    id: 'alc_regen_power',
    icon: '💚',
    name: 'Erősebb regeneráló főzet',
    description: 'A Regeneráló főzet +15% Regenerációt ad (egészre kerekítve).',
    eligible: s => runtime.hasBuilding(s, ALC) && recipeHas(s, 'regen')
  }, {
    id: 'alc_all_power',
    icon: '⚗️',
    name: 'Univerzális katalizátor',
    description: 'Minden aktív főzet hatása +8 százalékpont; a Regeneráló főzetnél +8% hatáserő.',
    eligible: s => runtime.hasBuilding(s, ALC)
  }, {
    id: REPLACE_MOVE,
    icon: '🌬️',
    name: 'Szélfőzet',
    description: 'Cserélj le egy jelenlegi főzethelyet Szélfőzetre. Az összes Alkimista kunyhó receptjében ugyanaz a slot cserélődik. Alap: +20% mozgási sebesség.',
    eligible: s => runtime.hasBuilding(s, ALC) && !recipeHas(s, 'movement')
  }, {
    id: REPLACE_REGEN,
    icon: '💚',
    name: 'Regeneráló főzet',
    description: 'Cserélj le egy jelenlegi főzethelyet Regeneráló főzetre. Az összes Alkimista kunyhó receptjében ugyanaz a slot cserélődik. Alap: 10 Regeneráció.',
    eligible: s => runtime.hasBuilding(s, ALC) && !recipeHas(s, 'regen')
  }];
  for (const d of commons) if (!runtime.NORMAL.some(x => x.id === d.id)) runtime.NORMAL.push(d);
  const legends = [{
    id: FULL_MIX,
    icon: '🧪',
    name: 'Mindent bele!',
    description: 'A kunyhó sikeres főzésnél az összes aktív főzet hatását egyszerre ráadja az egységre. Az X súlya +25.',
    eligible: s => runtime.hasBuilding(s, ALC)
  }, {
    id: MULTI_HUT,
    icon: '🏘️',
    name: 'Alkimista hálózat',
    description: 'Egy spawner mostantól minden szomszédos Alkimista kunyhótól kap egy külön főzést. Az azonos állapot nem erősödik tovább. A Regeneráció összeadódik.',
    eligible: s => runtime.buildingOf(s, ALC).length >= 2
  }, {
    id: SLOT_LEG,
    icon: '⚗️',
    name: 'Recepttorzítás',
    description: 'Válassz +1 vagy −1 főzethelyet. Minden felvétel +15% hatást ad minden főzetnek. Halmozható.',
    eligible: s => runtime.hasBuilding(s, ALC)
  }];
  for (const d of legends) if (!runtime.LEGENDARY.some(x => x.id === d.id)) runtime.LEGENDARY.push(d);
  for (const id of [...commons.map(x => x.id), ...legends.map(x => x.id)]) runtime.PICK_IMAGES[id] = runtime.CARD_IMAGES[ALC] || runtime.BUILDING_IMAGES[ALC] || runtime.PICK_IMAGES.production;
  const oldEligibleLegendaryV4961 = runtime.eligibleLegendary;
  runtime.eligibleLegendary = function (c) {
    const out = oldEligibleLegendaryV4961(c);
    const d = runtime.LEGENDARY.find(x => x.id === SLOT_LEG);
    if (d && d.eligible(c) && !out.some(x => x.id === SLOT_LEG)) out.push(d);
    return out;
  };
  function ensureModal() {
    let el = document.getElementById('alchemyRecipeModalV4961');
    if (!el) {
      el = document.createElement('div');
      el.id = 'alchemyRecipeModalV4961';
      el.className = 'alchemyRecipeModal hidden';
      document.body.appendChild(el);
    }
    return el;
  }
  function setModal(html) {
    const el = ensureModal();
    el.innerHTML = `<div class="alchemyRecipeDialog">${html}</div>`;
    el.classList.remove('hidden');
    runtime.state._alchemyPrevModal = !!runtime.state.modal;
    runtime.state.modal = true;
    return el;
  }
  function closeModal() {
    const el = ensureModal();
    el.classList.add('hidden');
    el.innerHTML = '';
    const choiceVisible = !runtime.$('#choiceOverlay')?.classList.contains('hidden');
    runtime.state.modal = choiceVisible || !!runtime.state._alchemyPrevModal;
    runtime.state._alchemyPrevModal = false;
    if (typeof runtime.mpSendStrategy === 'function' && runtime.MP?.enabled) runtime.mpSendStrategy(true);
    runtime.renderStatic();
  }
  function slotButton(id, i) {
    const m = META[id] || {
      icon: '🧪',
      name: id,
      desc: ''
    };
    return `<button type="button" class="alchemySlotChoice" data-slot="${i}"><span>${m.icon}</span><b>${m.name}</b><small>${m.desc}</small></button>`;
  }
  function replaceSlot(c, index, target) {
    globalSlots(c);
    if (index < 0 || index >= c.alchemyRecipeSlots.length) return;
    c.alchemyRecipeSlots[index] = target;
    c.alchemyPotionUnlocks[target] = true;
    syncAllHuts(c);
  }
  function openReplaceModal(target) {
    const slots = globalSlots(runtime.P),
      m = META[target];
    const el = setModal(`<div class="alchemyModalKicker">ALKIMISTA KUNYHÓ · RECEPTCSERE</div><h2>${m.icon} ${m.name}</h2><p>Melyik jelenlegi főzetet cseréljük le? A választás <b>az összes kunyhót</b> érinti, de mindegyik megtartja a saját csúszkaértékét.</p><div class="alchemySlotGrid">${slots.map(slotButton).join('')}</div>`);
    el.querySelectorAll('[data-slot]').forEach(btn => btn.onclick = () => {
      replaceSlot(runtime.P, +btn.dataset.slot, target);
      closeModal();
    });
  }
  function unlockedPotionIds(c) {
    globalSlots(c);
    return Object.keys(META).filter(id => id !== 'none' && c.alchemyPotionUnlocks[id]);
  }
  function openAddPotionModal() {
    const ids = unlockedPotionIds(runtime.P),
      el = setModal(`<div class="alchemyModalKicker">RECEPTTORZÍTÁS · +1 HELY</div><h2>⚗️ Új főzethely</h2><p>Válaszd ki, milyen főzet kerüljön az új slotba. A slot minden kunyhóban megjelenik, saját súllyal.</p><div class="alchemySlotGrid">${ids.map(id => {
        const m = META[id];
        return `<button type="button" class="alchemyPotionChoice" data-potion="${id}"><span>${m.icon}</span><b>${m.name}</b><small>${m.desc}</small></button>`;
      }).join('')}</div>`);
    el.querySelectorAll('[data-potion]').forEach(btn => btn.onclick = () => {
      globalSlots(runtime.P).push(btn.dataset.potion);
      syncAllHuts(runtime.P);
      closeModal();
    });
  }
  function openRemovePotionModal() {
    const slots = globalSlots(runtime.P),
      el = setModal(`<div class="alchemyModalKicker">RECEPTTORZÍTÁS · −1 HELY</div><h2>⚗️ Főzethely eltávolítása</h2><p>Válaszd ki, melyik slot tűnjön el minden kunyhó receptjéből.</p><div class="alchemySlotGrid">${slots.map(slotButton).join('')}</div>`);
    el.querySelectorAll('[data-slot]').forEach(btn => btn.onclick = () => {
      runtime.P.alchemyRecipeSlots.splice(+btn.dataset.slot, 1);
      syncAllHuts(runtime.P);
      closeModal();
    });
  }
  function openSlotLegendModal() {
    const n = globalSlots(runtime.P).length,
      canAdd = n < MAX_ALC_SLOTS,
      canRemove = n > 1;
    const el = setModal(`<div class="alchemyModalKicker">LEGENDARY · RECEPTTORZÍTÁS</div><h2>⚗️ Merre torzítsuk a receptet?</h2><p>A +15% minden-főzet hatáserőt már megkaptad. Most válaszd ki a recept szerkezetét.</p><div class="alchemyTwistGrid"><button type="button" data-twist="plus" ${canAdd ? '' : 'disabled'}><b>＋1 főzethely</b><small>Több lehetséges összetevő, szélesebb recept.</small></button><button type="button" data-twist="minus" ${canRemove ? '' : 'disabled'}><b>−1 főzethely</b><small>Szűkebb, koncentráltabb recept.</small></button></div>`);
    el.querySelector('[data-twist="plus"]')?.addEventListener('click', () => openAddPotionModal());
    el.querySelector('[data-twist="minus"]')?.addEventListener('click', () => openRemovePotionModal());
  }
  function aiReplace(c, target) {
    const slots = globalSlots(c);
    if (!slots.length) return;
    replaceSlot(c, Math.floor(Math.random() * slots.length), target);
  }
  function aiTwist(c) {
    const slots = globalSlots(c),
      plus = slots.length < MAX_ALC_SLOTS,
      minus = slots.length > 1;
    if (plus && (!minus || slots.length < 4 || Math.random() < .6)) {
      const ids = unlockedPotionIds(c);
      slots.push(ids[Math.floor(Math.random() * ids.length)] || 'damage');
    } else if (minus) slots.splice(Math.floor(Math.random() * slots.length), 1);
    syncAllHuts(c);
  }
  const oldApplyChoiceV4961 = runtime.applyChoice;
  runtime.applyChoice = function (c, o, countEvent = true) {
    const replacement = o?.kind === 'normal' && (o.id === REPLACE_MOVE || o.id === REPLACE_REGEN) ? o.id === REPLACE_MOVE ? 'movement' : 'regen' : null;
    const slotPick = o?.kind === 'legendary' && o.id === SLOT_LEG;
    const out = oldApplyChoiceV4961(c, o, countEvent);
    if (replacement) {
      globalSlots(c);
      c.alchemyPotionUnlocks[replacement] = true;
      if (c === runtime.P) c.alchemyPendingReplace = replacement;else aiReplace(c, replacement);
    }
    if (slotPick) {
      c.alchemySlotLegendStacks = (Number(c.alchemySlotLegendStacks) || 0) + 1;
      if (c === runtime.P) c.alchemyPendingTwist = true;else aiTwist(c);
      syncAllHuts(c);
    }
    if (o?.kind === 'normal' && ['alc_x_reduce', 'alc_all_power', 'alc_damage_power', 'alc_hp_power', 'alc_as_power', 'alc_move_power', 'alc_regen_power'].includes(o.id)) syncAllHuts(c);
    if (o?.kind === 'legendary' && o.id === FULL_MIX) syncAllHuts(c);
    return out;
  };
  const oldChooseV4961 = runtime.choose;
  runtime.choose = function (o, index = -1) {
    const wasReplace = o?.kind === 'normal' && (o.id === REPLACE_MOVE || o.id === REPLACE_REGEN);
    const wasTwist = o?.kind === 'legendary' && o.id === SLOT_LEG;
    const out = oldChooseV4961(o, index);
    if (wasReplace && runtime.P.alchemyPendingReplace) {
      const target = runtime.P.alchemyPendingReplace;
      runtime.P.alchemyPendingReplace = null;
      setTimeout(() => openReplaceModal(target), 0);
    }
    if (wasTwist && runtime.P.alchemyPendingTwist) {
      runtime.P.alchemyPendingTwist = false;
      setTimeout(() => openSlotLegendModal(), 0);
    }
    return out;
  };
  const oldPlaceBuildingV4961 = runtime.placeBuilding;
  runtime.placeBuilding = function (c, type, row, col, rotation = 0) {
    const res = oldPlaceBuildingV4961(c, type, row, col, rotation);
    if (res?.ok && type === ALC) {
      globalSlots(c);
      syncHut(c, res.building);
    }
    return res;
  };
  const oldQueueProducedV4961 = runtime.queueProduced;
  runtime.queueProduced = function (c, entry, b = null) {
    if (b && isAlchemySpawner(b)) applyAlchemyFromSpawner(c, b, entry);
    return oldQueueProducedV4961(c, entry, b);
  };
  const oldStatsForV4961 = runtime.statsFor;
  runtime.statsFor = function (c, entry) {
    const s = oldStatsForV4961(c, entry);
    if (entry?.alchemyMoveMult && entry.alchemyMoveMult !== 1) s.speed *= entry.alchemyMoveMult;
    return s;
  };
  const oldReleaseUnitV4961 = runtime.releaseUnit;
  runtime.releaseUnit = function (c, entry) {
    const u = oldReleaseUnitV4961(c, entry);
    if (!u) return u;
    u.alchemyEffects = Array.isArray(entry?.alchemyEffects) ? [...entry.alchemyEffects] : [];
    u.alchemyRegen = Number(entry?.alchemyRegen) || 0;
    u.alchemySourceIds = Array.isArray(entry?.alchemySourceIds) ? [...entry.alchemySourceIds] : [];
    return u;
  };
  const oldTickV4961 = runtime.tick;
  runtime.tick = function (dt) {
    return oldTickV4961(dt);
  };
  const oldRowsV4961 = runtime.buildingEffectRows;
  runtime.buildingEffectRows = function (c, b) {
    const rows = oldRowsV4961(c, b) || [];
    if (b?.type === ALC) {
      globalSlots(c);
      syncHut(c, b);
      const hutsMode = runtime.hasLeg(c, MULTI_HUT) ? 'Minden szomszédos kunyhó' : 'Spawnerenként csak 1 kunyhó';
      const x = b.alchemyPool.find(v => v.id === 'none'),
        xActual = Math.round((Number(x?.weight) || 0) / Math.max(1, b.alchemyPool.reduce((sum, v) => sum + Math.max(0, Number(v.weight) || 0), 0)) * 100);
      rows.unshift(['Kunyhó-szabály', hutsMode], ['X tényleges esély', `${xActual}%`], ['Globális recept', globalSlots(c).map(id => META[id]?.name || id).join(' · ')], ['Főzeterő bónusz', `+${Math.round((.08 * runtime.countNormal(c, 'alc_all_power') + .15 * (Number(c.alchemySlotLegendStacks) || 0)) * 100)}% minden főzetre`]);
      if (runtime.hasLeg(c, FULL_MIX)) rows.unshift(['Mindent bele!', 'Sikeres főzéskor minden aktív főzet egyszerre']);
    }
    return rows;
  };
  const oldScoreAiChoiceV4961 = runtime.scoreAiChoice;
  runtime.scoreAiChoice = function (o) {
    let s = oldScoreAiChoiceV4961(o);
    if (!o) return s;
    if (o.kind === 'building' && o.id === ALC) s += 3.5;
    if (o.kind === 'normal' && String(o.id).startsWith('alc_')) s += 3;
    if (o.kind === 'legendary' && [FULL_MIX, MULTI_HUT, SLOT_LEG].includes(o.id)) s += 5;
    return s;
  };
  const oldRenderStaticV4961 = runtime.renderStatic;
  runtime.renderStatic = function () {
    for (const c of [runtime.P, runtime.E]) syncAllHuts(c);
    return oldRenderStaticV4961();
  };
  const style = document.createElement('style');
  style.textContent = "@import url(\"" + (assetUrl("styles/features/city-alchemy-progression-30.css") + "\");");
  document.head.appendChild(style);
  for (const c of [runtime.P, runtime.E]) {
    globalSlots(c);
    syncAllHuts(c);
  }
  const brandSmall = document.querySelector('.brand small');
  if (brandSmall) brandSmall.textContent = 'V4.9.61 · P2P 1V1';
  if (runtime.MP?.lobby) {
    const ver = runtime.MP.lobby.querySelector('.menuVersion');
    if (ver) ver.textContent = 'V4.9.61 · P2P';
  }
  document.title = 'Roadlords V4.9.61 – Alkimista fejlesztések';
  window.__ROADLORDS_VERSION__ = '4.9.61-alchemy-upgrades';
  window.__ROADLORDS_V4961__ = {
    globalSlots,
    syncAllHuts,
    potionPower,
    applyAlchemyFromSpawner,
    FULL_MIX,
    MULTI_HUT,
    SLOT_LEG
  };
}
