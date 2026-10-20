import { assetUrl } from '../assets/urls.js';
export function initializeCityAlchemist(runtime) {
  const ALC = 'alchemist';
  const ALC_IMG_BUILD = assetUrl("art/image-f6ce87440e7db6a4.png");
  const ALC_IMG_CARD = assetUrl("art/image-5fbf6b0826483991.png");
  const ALC_EFFECTS = {
    damage: {
      id: 'damage',
      icon: '⚔',
      name: 'Sebzés főzet',
      short: 'Sebzés',
      desc: '+25% sebzés',
      kind: 'damage',
      mult: 1.25,
      color: '#d8b24f'
    },
    hp: {
      id: 'hp',
      icon: '❤',
      name: 'Életerő főzet',
      short: 'HP',
      desc: '+25% max HP',
      kind: 'hp',
      mult: 1.25,
      color: '#76c98a'
    },
    attack_speed: {
      id: 'attack_speed',
      icon: '⚡',
      name: 'Gyorsító főzet',
      short: 'Attack speed',
      desc: '+25% támadási sebesség',
      kind: 'attack_speed',
      mult: 1.25,
      color: '#73b8ff'
    },
    none: {
      id: 'none',
      icon: '✖',
      name: 'X összetevő',
      short: 'Semmi',
      desc: 'Nincs hatás',
      kind: 'none',
      mult: 1,
      color: '#9f8f86'
    }
  };
  const ALC_DEFAULT_POOL = [{
    id: 'damage',
    weight: 25
  }, {
    id: 'hp',
    weight: 25
  }, {
    id: 'attack_speed',
    weight: 25
  }, {
    id: 'none',
    weight: 25,
    locked: true
  }];
  function cloneAlcPool(pool) {
    return (pool || []).map(x => ({
      ...x
    }));
  }
  function ensureAlchemistState(b) {
    if (!b || b.type !== ALC) return b;
    if (!Array.isArray(b.alchemyPool) || !b.alchemyPool.length) b.alchemyPool = cloneAlcPool(ALC_DEFAULT_POOL);
    if (!b.alchemyMeta) b.alchemyMeta = {
      maxRecipes: 12,
      notes: 'Előkészítve további főzetekhez.'
    };
    return b;
  }
  function alchemistBuildings(c) {
    return (c?.buildings || []).filter(b => b.type === ALC).map(ensureAlchemistState);
  }
  function adjacentAlchemists(c, b) {
    return runtime.adjacentBuildings(c, b).filter(x => x.type === ALC).map(ensureAlchemistState);
  }
  function alchemistRoll(pool) {
    const items = (pool || []).filter(x => x && x.weight > 0 && ALC_EFFECTS[x.id]);
    const total = items.reduce((s, x) => s + x.weight, 0);
    if (total <= 0) return ALC_EFFECTS.none;
    let roll = Math.random() * total;
    for (const item of items) {
      roll -= item.weight;
      if (roll <= 0) return ALC_EFFECTS[item.id] || ALC_EFFECTS.none;
    }
    return ALC_EFFECTS[items[items.length - 1]?.id] || ALC_EFFECTS.none;
  }
  function applyAlchemistEntry(c, originBuilding, entry) {
    if (!originBuilding || !entry || !runtime.BUILDINGS[originBuilding.type]?.unit) return;
    const huts = adjacentAlchemists(c, originBuilding).filter(h => !h.inactive);
    if (!huts.length) return;
    const hut = huts[0];
    ensureAlchemistState(hut);
    const eff = alchemistRoll(hut.alchemyPool);
    entry.alchemyEffect = eff.id;
    entry.alchemySourceId = hut.id;
    if (eff.kind === 'damage') entry.alchemyDamageMult = Math.max(entry.alchemyDamageMult || 1, eff.mult || 1);else if (eff.kind === 'hp') entry.alchemyHpMult = Math.max(entry.alchemyHpMult || 1, eff.mult || 1);else if (eff.kind === 'attack_speed') entry.alchemyAttackSpeedMult = Math.max(entry.alchemyAttackSpeedMult || 1, eff.mult || 1);
  }
  function alchemistPoolRows(b) {
    ensureAlchemistState(b);
    return (b.alchemyPool || []).map(item => {
      const e = ALC_EFFECTS[item.id] || ALC_EFFECTS.none;
      return `<div class="alcRow"><div class="alcLeft"><span class="alcIcon" style="color:${e.color}">${e.icon}</span><span><b>${e.name}</b><small>${e.desc}</small></span></div><div class="alcRight"><b>${item.weight}%</b>${item.locked ? '<small>fix</small>' : '<small>alap</small>'}</div></div>`;
    }).join('');
  }
  function alchemistControlsHTML(c, b) {
    ensureAlchemistState(b);
    const total = (b.alchemyPool || []).reduce((s, x) => s + (Number(x.weight) || 0), 0);
    const adj = runtime.adjacentBuildings(c, b).filter(x => runtime.BUILDINGS[x.type]?.unit).length;
    return `<div class="alchemyBox"><div class="alchemyHead"><div><div class="boxlabel">ALAP KOKTÉL</div><b>Szint 1 · fix 25 / 25 / 25 / 25</b></div><div>Szomszédos spawnerek: <b>${adj}</b></div></div><div class="alchemyRows">${alchemistPoolRows(b)}</div><div class="alchemyFoot">Összes esély: <b>${total}%</b> · Egy szomszédos spawner által létrehozott egység egyetlen főzet-hatást kap. A rendszer adatvezérelt, később több főzettípus is betehető.</div></div>`;
  }
  runtime.BUILDINGS[ALC] = {
    name: 'Alkimista kunyhó',
    description: '1x1 támogatói épület. A szomszédos spawnerből érkező egységeknek minden gyártáskor egy koktélt kever. Alapon 25-25-25-25%: sebzés / max HP / attack speed / semmi.',
    category: 'support',
    cost: runtime.C(84, 56, 28),
    shape: [[0, 0]],
    unique: true
  };
  if (!runtime.UNLOCKABLE.includes(ALC)) runtime.UNLOCKABLE.push(ALC);
  runtime.BUILDING_IMAGES[ALC] = ALC_IMG_BUILD;
  runtime.CARD_IMAGES[ALC] = ALC_IMG_CARD;
  runtime.PICK_IMAGES[ALC] = ALC_IMG_CARD;
  runtime.BUILDING_IMAGE_META[ALC] = {
    w: 1,
    h: 1
  };
  const oldPlaceBuildingV4958 = runtime.placeBuilding;
  runtime.placeBuilding = function (c, type, r, col, rot = 0) {
    const placed = oldPlaceBuildingV4958(c, type, r, col, rot);
    if (placed?.ok && type === ALC && placed.building) ensureAlchemistState(placed.building);
    return placed;
  };
  const oldQueueProducedV4958 = runtime.queueProduced;
  runtime.queueProduced = function (c, entry, b = null) {
    if (b && !window.__ALCHEMY_V4961_ACTIVE__) applyAlchemistEntry(c, b, entry);
    return oldQueueProducedV4958(c, entry, b);
  };
  const oldStatsForV4958 = runtime.statsFor;
  runtime.statsFor = function (c, entry) {
    const s = oldStatsForV4958(c, entry);
    if (entry?.alchemyDamageMult && entry.alchemyDamageMult !== 1) {
      s.dmg *= entry.alchemyDamageMult;
      s.buildingDamage *= entry.alchemyDamageMult;
    }
    if (entry?.alchemyHpMult && entry.alchemyHpMult !== 1) s.hp *= entry.alchemyHpMult;
    if (entry?.alchemyAttackSpeedMult && entry.alchemyAttackSpeedMult !== 1) s.cooldown /= entry.alchemyAttackSpeedMult;
    return s;
  };
  const oldReleaseUnitV4958 = runtime.releaseUnit;
  runtime.releaseUnit = function (c, entry) {
    const u = oldReleaseUnitV4958(c, entry);
    if (!u) return u;
    u.alchemyEffect = entry?.alchemyEffect || null;
    return u;
  };
  const oldBuildingEffectRowsV4958 = runtime.buildingEffectRows;
  runtime.buildingEffectRows = function (c, b) {
    const rows = oldBuildingEffectRowsV4958(c, b);
    if (b?.type === ALC) {
      ensureAlchemistState(b);
      rows.unshift(['Hatókör', 'szomszédos spawnerek']);
      rows.unshift(['Alap koktél', '25 / 25 / 25 / 25']);
      rows.unshift(['Aktív receptek', String((b.alchemyPool || []).length)]);
    }
    return rows;
  };
  const oldRenderInspectorV4958 = runtime.renderInspector;
  runtime.renderInspector = function () {
    const out = oldRenderInspectorV4958();
    const b = runtime.getBuilding(runtime.P, runtime.state.selectedBuilding),
      card = runtime.$('#inspector .inspectorCard');
    if (!b || b.type !== ALC || !card) return out;
    ensureAlchemistState(b);
    const actions = card.querySelector('.iactions');
    const holder = document.createElement('div');
    holder.innerHTML = alchemistControlsHTML(runtime.P, b);
    actions?.parentNode?.insertBefore(holder.firstElementChild, actions);
    const note = card.querySelector('.upgradeNote');
    if (note) note.innerHTML = 'Az Alkimista kunyhó nem fejleszthető.';
    return out;
  };
  const oldBuildingUpgradePoolV4958 = runtime.buildingUpgradePool;
  runtime.buildingUpgradePool = function (c) {
    return oldBuildingUpgradePoolV4958(c).filter(o => o.id !== ALC);
  };
  const oldScoreAiChoiceV4958 = runtime.scoreAiChoice;
  if (typeof oldScoreAiChoiceV4958 === 'function') runtime.scoreAiChoice = function (o) {
    let s = oldScoreAiChoiceV4958(o);
    if (!o) return s;
    if (o.kind === 'building' && o.id === ALC) s += 3.5;
    return s;
  };
  const oldBuildingChoiceDetailsV4958 = runtime.buildingChoiceDetails;
  runtime.buildingChoiceDetails = function (c, type) {
    if (type === ALC) return 'Terület: <b>1×1</b><br>Szomszédos spawnerek minden egységre főzetet kevernek.<br><b>25%</b> sebzés · <b>25%</b> max HP · <b>25%</b> attack speed · <b>25%</b> semmi.';
    return oldBuildingChoiceDetailsV4958(c, type);
  };
  const style = document.createElement('style');
  style.textContent = "@import url(\"" + (assetUrl("styles/features/city-alchemist-27.css") + "\");");
  document.head.appendChild(style);
  for (const c of [runtime.P, runtime.E]) for (const b of alchemistBuildings(c)) ensureAlchemistState(b);
  const brandSmall = document.querySelector('.brand small');
  if (brandSmall) brandSmall.textContent = 'V4.9.58 · P2P 1V1';
  if (runtime.MP?.lobby) {
    const ver = runtime.MP.lobby.querySelector('.menuVersion');
    if (ver) ver.textContent = 'V4.9.58 · P2P';
  }
  document.title = 'Roadlords V4.9.58 – Alkimista kunyhó';
  window.__ROADLORDS_VERSION__ = '4.9.58-alchemist-hut';
}
