import { assetUrl } from '../assets/urls.js';
export function initializeProgressionSynergyRelics(runtime) {
  const MAGIC_ORDER = 'magic_order';
  const HOSPITAL_VETERANS = 'hospital_veterans';
  const CAVALRY_RUSH = 'rally_cavalry_rush';
  const HOSPITAL_DOOMED = 'hospital_doomed';
  function ensureLegendStacksV4952(c) {
    if (!c.legendaryStacks || typeof c.legendaryStacks !== 'object') c.legendaryStacks = {};
    return c.legendaryStacks;
  }
  function legendStackV4952(c, id) {
    const n = Number(c?.legendaryStacks?.[id] || 0);
    if (n > 0) return n;
    return c?.legends?.has?.(id) ? 1 : 0;
  }
  function magicOrderStacks(c) {
    return Math.min(4, legendStackV4952(c, MAGIC_ORDER));
  }
  function magicOrderChance(c) {
    return magicOrderStacks(c) * .25;
  }
  const defs = [{
    id: MAGIC_ORDER,
    icon: '🔮',
    name: 'Mágikus rend',
    description: 'A Templom 25% eséllyel Pap helyett Mágust képez. Halmozható legfeljebb 4×-ig, 100% esélyig.',
    eligible: s => runtime.hasBuilding(s, 'temple')
  }, {
    id: HOSPITAL_VETERANS,
    icon: '❤',
    name: 'Edzett túlélők',
    description: 'A Kórház által megmentett egységek +20% maximális HP-t kapnak, és minden gyógyításból +100%-kal többet kapnak.',
    eligible: s => runtime.hasBuilding(s, 'hospital')
  }, {
    id: CAVALRY_RUSH,
    icon: '♞',
    name: 'Lovasroham',
    description: 'A Gyülekezőtérből indított Lovasok +25% maximális HP-t, sebzést, mozgási sebességet és támadási sebességet kapnak.',
    eligible: s => runtime.hasBuilding(s, 'rally') && runtime.unitAvailable(s, 'knight')
  }, {
    id: HOSPITAL_DOOMED,
    icon: '☠',
    name: 'Halálra ítéltek',
    description: 'A Kórházból visszatért egységek +100% sebzést kapnak, de másodpercenként elveszítik maximális HP-juk 1%-át.',
    eligible: s => runtime.hasBuilding(s, 'hospital')
  }];
  for (const d of defs) if (!runtime.LEGENDARY.some(x => x.id === d.id)) runtime.LEGENDARY.push(d);
  runtime.PICK_IMAGES[MAGIC_ORDER] = runtime.CARD_IMAGES.temple || runtime.BUILDING_IMAGES.temple || runtime.PICK_IMAGES.mag_damage || runtime.PICK_IMAGES.all_damage;
  runtime.PICK_IMAGES[HOSPITAL_VETERANS] = runtime.CARD_IMAGES.hospital || runtime.BUILDING_IMAGES.hospital || runtime.PICK_IMAGES.regen || runtime.PICK_IMAGES.all_hp;
  runtime.PICK_IMAGES[CAVALRY_RUSH] = runtime.CARD_IMAGES.rally || runtime.BUILDING_IMAGES.rally || runtime.CARD_IMAGES.stable || runtime.BUILDING_IMAGES.stable || runtime.PICK_IMAGES.knight_move;
  runtime.PICK_IMAGES[HOSPITAL_DOOMED] = runtime.CARD_IMAGES.hospital || runtime.BUILDING_IMAGES.hospital || runtime.PICK_IMAGES.bloodlust || runtime.PICK_IMAGES.all_damage;
  const oldEligibleLegendaryV4952 = runtime.eligibleLegendary;
  runtime.eligibleLegendary = function (c) {
    const out = oldEligibleLegendaryV4952(c);
    const def = defs[0];
    if (def.eligible(c) && magicOrderStacks(c) < 4 && !out.some(x => x.id === MAGIC_ORDER)) out.push(def);
    return out;
  };
  const oldApplyChoiceV4952 = runtime.applyChoice;
  runtime.applyChoice = function (c, o, countEvent = true) {
    if (o?.kind === 'legendary' && o.id === MAGIC_ORDER) {
      const stacks = ensureLegendStacksV4952(c);
      stacks[MAGIC_ORDER] = Math.min(4, (stacks[MAGIC_ORDER] || 0) + 1);
    }
    return oldApplyChoiceV4952(c, o, countEvent);
  };
  if (typeof runtime.MP_STRATEGY_KEYS !== 'undefined' && !runtime.MP_STRATEGY_KEYS.includes('legendaryStacks')) runtime.MP_STRATEGY_KEYS.push('legendaryStacks');
  const oldQueueProducedV4952 = runtime.queueProduced;
  runtime.queueProduced = function (c, entry, b = null) {
    if (b?.type === 'temple' && entry?.key === 'priest') {
      const chance = magicOrderChance(c);
      if (chance >= 1 || Math.random() < chance) {
        entry.key = 'mage';
        entry.magicOrderSpawn = true;
      }
    }
    return oldQueueProducedV4952(c, entry, b);
  };
  const oldRallyWaveBuffsV4952 = runtime.rallyWaveBuffs;
  runtime.rallyWaveBuffs = function (c, entries) {
    const out = oldRallyWaveBuffsV4952(c, entries);
    if (runtime.hasLeg(c, CAVALRY_RUSH)) {
      for (const e of entries) if (e?.key === 'knight') e.rallyCavalryRush = true;
    }
    return out;
  };
  const oldKillUnitV4952 = runtime.killUnit;
  runtime.killUnit = function (target, combatDeath = true) {
    if (!target?.alive) return;
    const c = runtime.cityForSide(target.side),
      before = c?.garrison?.length || 0,
      key = target.key;
    const out = oldKillUnitV4952(target, combatDeath);
    if (combatDeath && c?.garrison?.length > before) {
      for (let i = before; i < c.garrison.length; i++) {
        const e = c.garrison[i];
        if (!e || e.key !== key || !e.hospitalSaved) continue;
        if (runtime.hasLeg(c, HOSPITAL_VETERANS)) {
          e.hospitalVeteran = true;
          e.healReceivedMult = 2;
        }
        if (runtime.hasLeg(c, HOSPITAL_DOOMED)) e.hospitalDoomed = true;
      }
    }
    return out;
  };
  const oldStatsForV4952 = runtime.statsFor;
  runtime.statsFor = function (c, entry) {
    const s = oldStatsForV4952(c, entry);
    if (entry?.hospitalVeteran) s.hp *= 1.20;
    if (entry?.hospitalDoomed) {
      s.dmg *= 2;
      s.buildingDamage *= 2;
    }
    if (entry?.rallyCavalryRush && entry?.key === 'knight') {
      s.hp *= 1.25;
      s.dmg *= 1.25;
      s.buildingDamage *= 1.25;
      s.speed *= 1.25;
      s.cooldown /= 1.25;
    }
    return s;
  };
  const oldReleaseUnitV4952 = runtime.releaseUnit;
  runtime.releaseUnit = function (c, entry) {
    const u = oldReleaseUnitV4952(c, entry);
    if (!u) return u;
    u.hospitalVeteran = !!entry.hospitalVeteran;
    u.healReceivedMult = entry.healReceivedMult || 1;
    u.hospitalDoomed = !!entry.hospitalDoomed;
    u.rallyCavalryRush = !!entry.rallyCavalryRush;
    return u;
  };
  const oldHealUnitV4952 = runtime.healUnit;
  runtime.healUnit = function (u, amount) {
    const mult = Math.max(0, Number(u?.healReceivedMult) || 1);
    return oldHealUnitV4952(u, amount * mult);
  };
  const oldTickV4952 = runtime.tick;
  runtime.tick = function (dt) {
    const out = oldTickV4952(dt);
    if (runtime.state.running && !runtime.state.ended && dt > 0) {
      for (const u of [...runtime.state.units]) {
        if (!u.alive || !u.hospitalDoomed) continue;
        u.hp -= u.maxHp * .01 * dt;
        if (u.hp <= 0) {
          u.hp = 0;
          const lane = u.lane;
          runtime.killUnit(u, false);
          runtime.spark(lane, '☠', '#d98b8b');
        }
      }
    }
    return out;
  };
  const oldRowsV4952 = runtime.buildingEffectRows;
  runtime.buildingEffectRows = function (c, b) {
    const rows = oldRowsV4952(c, b) || [];
    if (b.type === 'temple' && magicOrderStacks(c) > 0) rows.push(['Mágikus rend', `${Math.round(magicOrderChance(c) * 100)}% Mágus · ${magicOrderStacks(c)}/4 stack`]);
    if (b.type === 'hospital') {
      if (runtime.hasLeg(c, HOSPITAL_VETERANS)) rows.push(['Edzett túlélők', '+20% Max HP · +100% kapott gyógyítás']);
      if (runtime.hasLeg(c, HOSPITAL_DOOMED)) rows.push(['Halálra ítéltek', '+100% sebzés · −1% Max HP/mp']);
    }
    if (b.type === 'rally' && runtime.hasLeg(c, CAVALRY_RUSH)) rows.push(['Lovasroham', 'Lovas: +25% HP / DMG / mozgás / AS']);
    return rows;
  };
  function decorateMagicOrderStack() {
    const n = magicOrderStacks(runtime.P);
    if (n > 0) {
      for (const item of runtime.$$('#relicList .relicitem.legendary')) {
        const b = item.querySelector('b');
        if (b && b.textContent.includes('Mágikus rend') && !b.querySelector('.v4952Stack')) {
          const s = document.createElement('span');
          s.className = 'v4952Stack';
          s.textContent = ` ×${n}`;
          b.appendChild(s);
          break;
        }
      }
    }
  }
  const oldRenderRelicsV4952 = runtime.renderRelics;
  runtime.renderRelics = function () {
    const out = oldRenderRelicsV4952();
    decorateMagicOrderStack();
    return out;
  };
  function decorateEndMagicStacks() {
    const panels = runtime.$$('.endPlayerPanel');
    [[panels[0], runtime.P], [panels[1], runtime.E]].forEach(([panel, c]) => {
      if (!panel || !c) return;
      const n = magicOrderStacks(c);
      if (n <= 1) return;
      const chip = [...panel.querySelectorAll('.endUpgrade.legendary')].find(x => (x.dataset.upgradeName || '') === 'Mágikus rend');
      if (chip && !chip.querySelector('.v4952EndStack')) chip.insertAdjacentHTML('beforeend', ` <span class="v4952EndStack">×${n}</span>`);
    });
  }
  const oldFinishV4952 = runtime.finish;
  runtime.finish = function (win) {
    const out = oldFinishV4952(win);
    decorateEndMagicStacks();
    return out;
  };
  if (typeof runtime.mpShowEnd === 'function') {
    const oldMpShowEndV4952 = runtime.mpShowEnd;
    runtime.mpShowEnd = function () {
      const out = oldMpShowEndV4952();
      decorateEndMagicStacks();
      return out;
    };
  }
  if (typeof runtime.scoreAiChoiceV17 === 'function') {
    const oldScoreV4952 = runtime.scoreAiChoiceV17;
    runtime.scoreAiChoiceV17 = function (o) {
      let s = oldScoreV4952(o);
      if (o?.kind === 'legendary' && o.id === MAGIC_ORDER) s += 5 + magicOrderStacks(runtime.E) * 2;
      if (o?.kind === 'legendary' && o.id === HOSPITAL_VETERANS) s += 5;
      if (o?.kind === 'legendary' && o.id === HOSPITAL_DOOMED) s += 5;
      if (o?.kind === 'legendary' && o.id === CAVALRY_RUSH) s += Math.min(8, runtime.buildingOf(runtime.E, 'stable').length * 3 + runtime.buildingOf(runtime.E, 'rally').length * 2);
      return s;
    };
  }
  const brandSmall = document.querySelector('.brand small');
  if (brandSmall) brandSmall.textContent = 'V4.9.52 · P2P 1V1';
  if (runtime.MP?.lobby) {
    const ver = runtime.MP.lobby.querySelector('.menuVersion');
    if (ver) ver.textContent = 'V4.9.52 · P2P';
  }
  document.title = 'Roadlords V4.9.52 – új Legendary build-kapcsok';
  window.__ROADLORDS_VERSION__ = '4.9.52-legendary-build-links';
}
