import { assetUrl } from '../assets/urls.js';
export function initializeCitySupportSynergies(runtime) {
  const TAVERN_CHAIN = 'tavern_chain';
  const MILITIA = 'house_militia';
  const ARMOR_RANGE = 'armor_extended_range';
  function ensureLegendStacks(c) {
    if (!c.legendaryStacks || typeof c.legendaryStacks !== 'object') c.legendaryStacks = {};
    return c.legendaryStacks;
  }
  function legendStack(c, id) {
    const n = Number(c?.legendaryStacks?.[id] || 0);
    if (n > 0) return n;
    return c?.legends?.has?.(id) ? 1 : 0;
  }
  function tavernLimit(c) {
    return 1 + legendStack(c, TAVERN_CHAIN);
  }
  function tavernHitCount(c) {
    const count = runtime.buildingOf(c, 'tavern').length;
    if (!count) return 0;
    const per = runtime.hasBranch(c, 'tavern', 'bottoms_up') ? 4 : 2;
    return count * per;
  }
  function houseArmyBonus(c, b) {
    let val = runtime.v4LevelValue(b.level, [10, 15, 20, 40]);
    val *= runtime.townhallPower?.(c,b)||1;
    return val;
  }
  const chainDef = {
    id: TAVERN_CHAIN,
    icon: '🍻',
    name: 'Kocsmalánc',
    description: '+1 Kocsmát építhetsz. A Kocsmák által buffolt támadások száma összeadódik. Halmozható legendás.',
    eligible: s => runtime.hasBuilding(s, 'tavern')
  };
  const militiaDef = {
    id: MILITIA,
    icon: '🏘️',
    name: 'Polgárőrség',
    description: 'Minden Lakóház az általa adott tényleges sereglimit-bónusz 50%-át helyőrségkapacitásként is megadja.',
    eligible: s => runtime.hasBuilding(s, 'house')
  };
  const armorDef = {
    id: ARMOR_RANGE,
    icon: '🛡️',
    name: 'Kiterjesztett kovácsműhely',
    description: 'A Páncélkovács hatása mostantól a legfeljebb 2 mező távolságban lévő katonai termelőkre is kiterjed.',
    eligible: s => runtime.hasBuilding(s, 'armorsmith')
  };
  for (const d of [chainDef, militiaDef, armorDef]) if (!runtime.LEGENDARY.some(x => x.id === d.id)) runtime.LEGENDARY.push(d);
  runtime.PICK_IMAGES[TAVERN_CHAIN] = runtime.CARD_IMAGES.tavern || runtime.BUILDING_IMAGES.tavern || runtime.PICK_IMAGES.all_damage;
  runtime.PICK_IMAGES[MILITIA] = runtime.CARD_IMAGES.house || runtime.BUILDING_IMAGES.house || runtime.PICK_IMAGES.large_garrison;
  runtime.PICK_IMAGES[ARMOR_RANGE] = runtime.CARD_IMAGES.armorsmith || runtime.BUILDING_IMAGES.armorsmith || runtime.PICK_IMAGES.building_hp;
  const oldEligibleLegendaryV4948 = runtime.eligibleLegendary;
  runtime.eligibleLegendary = function (c) {
    const out = oldEligibleLegendaryV4948(c);
    if (chainDef.eligible(c) && !out.some(x => x.id === TAVERN_CHAIN)) out.push(chainDef);
    return out;
  };
  const oldApplyChoiceV4948 = runtime.applyChoice;
  runtime.applyChoice = function (c, o, countEvent = true) {
    if (o?.kind === 'legendary' && o.id === TAVERN_CHAIN) {
      const stacks = ensureLegendStacks(c);
      stacks[TAVERN_CHAIN] = (stacks[TAVERN_CHAIN] || 0) + 1;
    }
    const out = oldApplyChoiceV4948(c, o, countEvent);
    if (o?.kind === 'legendary' && (o.id === MILITIA || o.id === TAVERN_CHAIN)) runtime.recomputeCity(c, true);
    return out;
  };
  if (typeof runtime.MP_STRATEGY_KEYS !== 'undefined' && !runtime.MP_STRATEGY_KEYS.includes('legendaryStacks')) runtime.MP_STRATEGY_KEYS.push('legendaryStacks');
  const oldIsUniqueBuildingV4948 = runtime.isUniqueBuilding;
  runtime.isUniqueBuilding = function (c, type) {
    if (type === 'tavern') return runtime.buildingOf(c, 'tavern').length >= tavernLimit(c);
    return oldIsUniqueBuildingV4948(c, type);
  };
  const oldWaveBuffsV4948 = runtime.waveBuffs;
  runtime.waveBuffs = function (c, entries) {
    const out = oldWaveBuffsV4948(c, entries);
    const hits = tavernHitCount(c);
    if (hits > 0) {
      const tavern = runtime.buildingOf(c, 'tavern')[0];
      const mult = runtime.hasBranch(c, 'tavern', 'bottoms_up') ? 3.5 : runtime.v4LevelValue(tavern.level, [1.5, 2, 2.5, 2.5]);
      for (const e of entries) {
        if (e.permanentTavern) continue;
        e.firstMult = mult + .1 * runtime.countNormal(c, 'tavern_damage');
        e.firstHits = hits;
      }
    }
    return out;
  };
  runtime.applyTavernOriginBuff = function (c, b, e) {
    if (b && runtime.hasBranch(c, 'tavern', 'regulars') && runtime.buildingOf(c, 'tavern').some(t => runtime.adjacentBuildings(c, t).some(x => x.id === b.id))) {
      e.permanentTavern = true;
      e.tavernBaseBonus = 1.5;
      e.tavernBuffScale = 1;
      e.permanentTavernMult = runtime.tavernPermanentMult35(c, e);
    }
    return e;
  };
  const oldRecomputeCityV4948 = runtime.recomputeCity;
  runtime.recomputeCity = function (c, preserve = true) {
    const out = oldRecomputeCityV4948(c, preserve);
    if (runtime.hasLeg(c, MILITIA)) {
      let extra = 0;
      for (const h of runtime.buildingOf(c, 'house')) extra += houseArmyBonus(c, h);
      if (runtime.hasLeg(c, 'large_garrison')) extra *= 2;
      c.garrisonCap = Math.round(c.garrisonCap + extra);
    }
    return out;
  };
  runtime.armorSmithForSpawner = function (c, b) {
    const a = runtime.buildingOf(c, 'armorsmith')[0];
    if (!a || !b) return null;
    if (runtime.hasLeg(c, ARMOR_RANGE)) return runtime.inBuildingRange(a, b, 2) ? a : null;
    return runtime.adjacentBuildings(c, a).some(x => x.id === b.id) ? a : null;
  };
  const oldRangeSpecV4948 = runtime.v490RangeSpec;
  runtime.v490RangeSpec = function (c, b) {
    if (b?.type === 'armorsmith' && runtime.hasLeg(c, ARMOR_RANGE)) return {
      mode: 'cheb',
      range: 2,
      color: 'blue'
    };
    return oldRangeSpecV4948(c, b);
  };
  const oldTargetsV4948 = runtime.v490Targets;
  runtime.v490Targets = function (c, b) {
    if (b?.type === 'armorsmith' && runtime.hasLeg(c, ARMOR_RANGE)) return c.buildings.filter(x => runtime.BUILDINGS[x.type]?.unit && runtime.armorSmithForSpawner(c, x)?.id === b.id);
    return oldTargetsV4948(c, b);
  };
  const oldRowsV4948 = runtime.buildingEffectRows;
  runtime.buildingEffectRows = function (c, b) {
    const rows = oldRowsV4948(c, b) || [];
    if (b.type === 'tavern') {
      const count = runtime.buildingOf(c, 'tavern').length,
        limit = tavernLimit(c),
        hits = tavernHitCount(c);
      rows.push(['Kocsmák', `${count}/${limit}`]);
      if (count > 0) rows.push(['Buffolt támadások', runtime.hasBranch(c, 'tavern', 'regulars') ? 'Törzsvendég spawnernél: minden támadás' : `${hits} támadás / kiengedett egység`]);
    }
    if (b.type === 'house' && runtime.hasLeg(c, MILITIA)) rows.push(['Polgárőrség', `+${Math.round(houseArmyBonus(c, b))} helyőrség${runtime.hasLeg(c, 'large_garrison') ? ' · Teljes helyőrség ×2' : ''}`]);
    if (b.type === 'armorsmith' && runtime.hasLeg(c, ARMOR_RANGE)) {
      const row = rows.find(x => String(x[0]).toLowerCase().includes('hatókör') || String(x[0]).toLowerCase().includes('hatótáv'));
      if (row) row[1] = '2 mezőn belüli katonai termelők';else rows.unshift(['Hatókör', '2 mezőn belüli katonai termelők']);
    }
    return rows;
  };
  const oldRenderBuildListV4948 = runtime.renderBuildList;
  runtime.renderBuildList = function () {
    const out = oldRenderBuildListV4948();
    const card = runtime.$('#buildList .buildcard[data-k="tavern"]');
    card?.querySelectorAll('.tavernLimitChip').forEach(x=>x.remove());
    return out;
  };
  const oldRenderRelicsV4948 = runtime.renderRelics;
  runtime.renderRelics = function () {
    const out = oldRenderRelicsV4948();
    const n = legendStack(runtime.P, TAVERN_CHAIN);
    if (n > 0) {
      for (const item of runtime.$$('#relicList .relicitem.legendary')) {
        const b = item.querySelector('b');
        if (b && b.textContent.includes('Kocsmalánc') && !b.querySelector('.v4948Stack')) {
          const s = document.createElement('span');
          s.className = 'v4948Stack';
          s.textContent = ` ×${n}`;
          b.appendChild(s);
          break;
        }
      }
    }
    return out;
  };
  function decorateEndStackCounts() {
    const panels = runtime.$$('.endPlayerPanel');
    [[panels[0], runtime.P], [panels[1], runtime.E]].forEach(([panel, c]) => {
      if (!panel || !c) return;
      const n = legendStack(c, TAVERN_CHAIN);
      if (n <= 1) return;
      const chip = [...panel.querySelectorAll('.endUpgrade.legendary')].find(x => (x.dataset.upgradeName || '') === 'Kocsmalánc');
      if (chip && !chip.querySelector('.stack')) chip.insertAdjacentHTML('beforeend', ` <span class="stack">×${n}</span>`);
    });
  }
  const oldFinishV4948 = runtime.finish;
  runtime.finish = function (win) {
    const out = oldFinishV4948(win);
    decorateEndStackCounts();
    return out;
  };
  if (typeof runtime.mpShowEnd === 'function') {
    const oldMpShowEndV4948 = runtime.mpShowEnd;
    runtime.mpShowEnd = function () {
      const out = oldMpShowEndV4948();
      decorateEndStackCounts();
      return out;
    };
  }
  if (typeof runtime.scoreAiChoiceV17 === 'function') {
    const oldScoreV4948 = runtime.scoreAiChoiceV17;
    runtime.scoreAiChoiceV17 = function (o) {
      let s = oldScoreV4948(o);
      if (o?.kind === 'legendary' && o.id === TAVERN_CHAIN) s += 5 + Math.min(6, runtime.buildingOf(runtime.E, 'tavern').length * 2);
      if (o?.kind === 'legendary' && o.id === MILITIA) s += Math.min(10, runtime.buildingOf(runtime.E, 'house').length * 2);
      if (o?.kind === 'legendary' && o.id === ARMOR_RANGE) s += Math.min(9, runtime.spawnerBuildings(runtime.E).length * 1.2);
      return s;
    };
  }
  runtime.BUILDINGS.tavern.description = 'A főkapun vagy a Gyülekezőtérből kiengedett egységek első 2 támadása L1/L2/L3 szinten +50%/+100%/+150% sebzést okoz. Kocsmalánccal több Kocsma építhető, és a buffolt támadások száma összeadódik.';
  runtime.BUILDINGS.house.description = 'Minden Lakóház +10/+15/+20 úti sereglimitet ad. A Városháza hatókörében ez a bónusz tovább növekszik.';
  runtime.BUILDINGS.armorsmith.description = 'A közvetlenül szomszédos katonai termelők egységei maximális HP-juk 30%/45%/60%-ának megfelelő kezdőpajzsot kapnak. Kiterjesztett kovácsműhellyel a hatókör 2 mező.';
  const brandSmall = document.querySelector('.brand small');
  if (brandSmall) brandSmall.textContent = 'V4.9.48 · P2P 1V1';
  if (runtime.MP?.lobby) {
    const ver = runtime.MP.lobby.querySelector('.menuVersion');
    if (ver) ver.textContent = 'V4.9.48 · P2P';
  }
  document.title = 'Roadlords V4.9.48 – Build-kapcsok';
  window.__ROADLORDS_VERSION__ = '4.9.48-build-bridges';
}
