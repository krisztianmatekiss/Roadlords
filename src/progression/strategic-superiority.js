import { assetUrl } from '../assets/urls.js';
export function initializeProgressionStrategicSuperiority(runtime) {
  const BONUS_LEG = 'strategic_superiority';
  const BONUS_SOURCE = 'strategic_superiority_bonus';
  const BONUS_DEF = {
    id: BONUS_LEG,
    icon: '🎲',
    name: 'Stratégiai fölény',
    description: 'Azonnal kapsz 5 extra picket, +10 újrasorsolást és +5 kitiltást. Halmozható legendás.',
    eligible: () => true
  };
  const removedCommons = new Set(['all_hp', 'inf_training', 'mag_training', 'priest_heal']);
  for (let i = runtime.NORMAL.length - 1; i >= 0; i--) if (removedCommons.has(runtime.NORMAL[i]?.id)) runtime.NORMAL.splice(i, 1);
  const globalCombat = runtime.NORMAL.find(x => x.id === 'all_damage');
  if (globalCombat) {
    globalCombat.name = 'Általános harci kiképzés';
    globalCombat.description = 'Minden egység sebzése +5%. A gyógyítás ereje +5%.';
  }
  const priestCombat = runtime.NORMAL.find(x => x.id === 'priest_dmg');
  if (priestCombat) {
    priestCombat.name = 'Pap – Harci szolgálat';
    priestCombat.description = 'A Pap sebzése +10%, gyógyítóereje +10%.';
  }
  const spearRange = runtime.NORMAL.find(x => x.id === 'spear_range');
  if (spearRange) {
    spearRange.name = 'Hosszabb lándzsa';
    spearRange.description = 'A Lándzsás lándzsahossza és támadási hatótávja +10%.';
  }
  const oldStatsForV4963 = runtime.statsFor;
  runtime.statsFor = function (c, entry) {
    const out = oldStatsForV4963(c, entry),
      key = entry?.key,
      base = runtime.UNITS[key];
    if (!out || !base) return out;
    const inf = runtime.countNormal(c, 'inf_training'),
      mag = runtime.countNormal(c, 'mag_training');
    const catOld = base.cat === 'infantry' ? inf : base.cat === 'magic' ? mag : 0;
    const dmgId = {
      swordsman: 'swordsman_dmg',
      spearman: 'spear_dmg',
      archer: 'archer_dmg',
      knight: 'knight_dmg',
      priest: 'priest_dmg',
      catapult: 'catapult_dmg',
      mage: 'mage_dmg'
    }[key];
    const hpId = {
      swordsman: 'swordsman_hp',
      spearman: 'spear_hp',
      archer: 'archer_hp',
      knight: 'knight_hp',
      priest: 'priest_hp',
      catapult: 'catapult_hp',
      mage: 'mage_hp'
    }[key];
    const all = runtime.countNormal(c, 'all_damage'),
      unitDmg = runtime.countNormal(c, dmgId),
      unitHp = runtime.countNormal(c, hpId);
    const oldDmgCore = 1 + .10 * all + .08 * catOld + .10 * unitDmg;
    const newDmgCore = 1 + .05 * all + .10 * unitDmg;
    if (oldDmgCore > 0) {
      const k = newDmgCore / oldDmgCore;
      out.dmg *= k;
      if (Number.isFinite(out.buildingDamage)) out.buildingDamage *= k;
    }
    const oldHpCore = 1 + .10 * runtime.countNormal(c, 'all_hp') + .08 * catOld + .10 * unitHp;
    const newHpCore = 1 + .10 * unitHp;
    if (oldHpCore > 0) out.hp *= newHpCore / oldHpCore;
    if (key === 'priest' && Number.isFinite(out.heal)) {
      const oldHealCore = 1 + .08 * mag + .15 * runtime.countNormal(c, 'priest_heal');
      const newHealCore = 1 + .05 * all + .10 * runtime.countNormal(c, 'priest_dmg');
      if (oldHealCore > 0) out.heal *= newHealCore / oldHealCore;
    }
    return out;
  };
  if (!runtime.LEGENDARY.some(x => x.id === BONUS_LEG)) runtime.LEGENDARY.push(BONUS_DEF);
  runtime.PICK_IMAGES[BONUS_LEG] = runtime.PICK_IMAGES.wide_choice || runtime.PICK_IMAGES.double_choice || runtime.PICK_IMAGES.production || runtime.CARD_IMAGES.keep || runtime.BUILDING_IMAGES.keep;
  const oldEligibleLegendaryV4963 = runtime.eligibleLegendary;
  runtime.eligibleLegendary = function (c) {
    const out = oldEligibleLegendaryV4963(c);
    if (!out.some(x => x.id === BONUS_LEG)) out.push(BONUS_DEF);
    return out;
  };
  function ensureV4963Stacks(c) {
    if (!c.legendaryStacks || typeof c.legendaryStacks !== 'object') c.legendaryStacks = {};
    return c.legendaryStacks;
  }
  function bonusStacks(c) {
    return Math.max(Number(c?.legendaryStacks?.[BONUS_LEG]) || 0, c?.legends?.has?.(BONUS_LEG) ? 1 : 0);
  }
  function queuePlayerBonusPicks(n) {
    for (let i = 0; i < n; i++) runtime.queueChoice(BONUS_SOURCE);
  }
  function grantAiBonusPicks(n) {
    if (runtime.MP?.enabled) return;
    runtime.E._v4963BonusPicks = (runtime.E._v4963BonusPicks || 0) + n;
    if (runtime.E._v4963GrantingBonus) return;
    runtime.E._v4963GrantingBonus = true;
    let safety = 0;
    try {
      while (runtime.E._v4963BonusPicks > 0 && safety++ < 250) {
        runtime.E._v4963BonusPicks--;
        runtime.grantEnemyPick(BONUS_SOURCE);
      }
    } finally {
      runtime.E._v4963GrantingBonus = false;
    }
  }
  const oldApplyChoiceV4963 = runtime.applyChoice;
  runtime.applyChoice = function (c, o, countEvent = true) {
    const bonus = o?.kind === 'legendary' && o.id === BONUS_LEG;
    const out = oldApplyChoiceV4963(c, o, countEvent);
    if (bonus) {
      const stacks = ensureV4963Stacks(c);
      stacks[BONUS_LEG] = (Number(stacks[BONUS_LEG]) || 0) + 1;
      c.rerolls = (Number(c.rerolls) || 0) + 5;
      c.bans = (Number(c.bans) || 0) + 3;
      if (c === runtime.P) {
        queuePlayerBonusPicks(3);
        runtime.toast('Stratégiai fölény · +3 pick · +5 újrasorsolás · +3 kitiltás');
      } else if (c === runtime.E) grantAiBonusPicks(3);
    }
    return out;
  };
  const oldChoiceContextV4963 = runtime.choiceContextForPlayer;
  runtime.choiceContextForPlayer = function () {
    const ctx = oldChoiceContextV4963();
    if (ctx?.source === BONUS_SOURCE) {
      ctx.kicker = 'STRATÉGIAI FÖLÉNY · EXTRA PICK';
      ctx.desc = 'A legendás bónusz három azonnali választásának egyike.';
    }
    return ctx;
  };
  const oldScoreAiChoiceV4963 = runtime.scoreAiChoice;
  runtime.scoreAiChoice = function (o) {
    let s = oldScoreAiChoiceV4963(o);
    if (o?.kind === 'legendary' && o.id === BONUS_LEG) s += 14;
    return s;
  };
  const oldRenderRelicsV4963 = runtime.renderRelics;
  runtime.renderRelics = function () {
    const out = oldRenderRelicsV4963();
    const n = bonusStacks(runtime.P);
    if (n > 0) {
      for (const item of runtime.$$('#relicList .relicitem.legendary')) {
        const b = item.querySelector('b');
        if (b && b.textContent.includes(BONUS_DEF.name) && !b.querySelector('.v4963Stack')) {
          const x = document.createElement('span');
          x.className = 'v4963Stack';
          x.textContent = ` ×${n}`;
          b.appendChild(x);
          break;
        }
      }
    }
    return out;
  };
  const oldRenderInspectorV4963 = runtime.renderInspector;
  runtime.renderInspector = function () {
    const b = runtime.getBuilding(runtime.E, runtime.state.selectedBuilding);
    if (!b) return oldRenderInspectorV4963();
    const el = runtime.$('#inspector'),
      d = runtime.BUILDINGS[b.type],
      unitKey = d.unit ? runtime.effectiveUnitKey(runtime.E, b) : null,
      u = unitKey ? runtime.UNITS[unitKey] : null,
      rows = runtime.buildingEffectRows(runtime.E, b);
    if (!el || !d) return oldRenderInspectorV4963();
    const effects = rows.length ? `<div class="effectbox compactEffects"><div class="boxlabel">AKTUÁLIS HATÁS</div>${rows.map(([label, value]) => `<div class="istat"><span>${label}</span><b>${value}</b></div>`).join('')}</div>` : '';
    const unitPanel = u ? `<div class="spawnCompact"><div class="unitPortraitFrame">${runtime.unitImageTag(unitKey)}</div><div class="unitSummary"><div class="unitTitle"><b>${u.name}</b><span>Gyártási idő · ${runtime.trainingTime(runtime.E, b).toFixed(1)} mp</span></div>${runtime.unitStatsHTML(runtime.E, unitKey)}</div></div>` : '';
    el.classList.add('show');
    el.innerHTML = `<div class="inspectorCard"><div class="ihead"><div><small>ELLENFÉL · ${runtime.CATEGORY_NAMES[d.category] || String(d.category || '').toUpperCase()} · ${runtime.footprintText(b.type, b.rotation || 0)} · L${b.level}</small><h3>${d.name}</h3></div><button id="closeInspector" aria-label="Bezárás">✕</button></div><p class="idesc">${d.description}</p>${effects}${unitPanel}<div class="upgradeNote">Az ellenfél épülete · csak megtekinthető.</div></div>`;
    runtime.$('#closeInspector').onclick = e => {
      e?.stopPropagation?.();
      runtime.state.selectedBuilding = null;
      el.classList.remove('show');
      el.innerHTML = '';
      runtime.renderStatic();
    };
    requestAnimationFrame(() => {
      const anchor = document.querySelector(`#enemyGrid .buildingHitCell[data-id="${b.id}"]`) || document.querySelector(`#enemyGrid .building[data-id="${b.id}"]`);
      if (!anchor) return;
      const r = anchor.getBoundingClientRect(),
        w = el.offsetWidth || 330,
        h = el.offsetHeight || 300,
        gap = 10;
      let left = r.left - w - gap;
      if (left < 10) left = r.right + gap;
      left = runtime.clamp(left, 10, window.innerWidth - w - 10);
      const top = runtime.clamp(r.top + r.height / 2 - h / 2, 74, window.innerHeight - h - 10);
      el.style.left = Math.round(left) + 'px';
      el.style.top = Math.round(top) + 'px';
    });
    return true;
  };
  const oldRenderCityV4963 = runtime.renderCity;
  runtime.renderCity = function (container, c, interactive) {
    const out = oldRenderCityV4963(container, c, interactive);
    if (container && c === runtime.E && !interactive) {
      container.querySelectorAll('.buildingHitCell[data-id]').forEach(hit => {
        const b = runtime.getBuilding(runtime.E, hit.dataset.id);
        if (!b) return;
        hit.onclick = e => {
          e.stopPropagation();
          runtime.state.selectedBuild = null;
          runtime.state.selectedBuilding = b.id;
          runtime.clearPlacementPreview();
          runtime.renderStatic();
        };
      });
    }
    return out;
  };
  const style = document.createElement('style');
  style.textContent = "@import url(\"" + (assetUrl("styles/features/progression-strategic-superiority-31.css") + "\");");
  document.head.appendChild(style);
  const brandSmall = document.querySelector('.brand small');
  if (brandSmall) brandSmall.textContent = 'V4.9.63 · P2P 1V1';
  if (runtime.MP?.lobby) {
    const ver = runtime.MP.lobby.querySelector('.menuVersion');
    if (ver) ver.textContent = 'V4.9.63 · P2P';
  }
  document.title = 'Roadlords V4.9.63 – QA + Stratégiai fölény';
  window.__ROADLORDS_VERSION__ = '4.9.63-qa-ai-strategic-superiority';
}
