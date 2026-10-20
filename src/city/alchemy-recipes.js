import { assetUrl } from '../assets/urls.js';
export function initializeCityAlchemyRecipes(runtime) {
  const ALC = 'alchemist';
  const ALC_PRECISE = 'precise_recipe';
  const ALC_PURE = 'pure_concoction';
  const ROYAL = 'royal_district';
  const KEEP_BRANCH_SOURCE = 'high_keep_branch';
  const ALC_META = {
    damage: {
      icon: '⚔',
      name: 'Erő főzete',
      desc: 'Erő: +20% sebzés, állandó',
      color: '#d9b34f'
    },
    hp: {
      icon: '❤',
      name: 'Életerő főzete',
      desc: 'Életerő: +20% maximális életerő, állandó',
      color: '#78cf8d'
    },
    attack_speed: {
      icon: '⚡',
      name: 'Fürgeség főzete',
      desc: 'Fürgeség: +20% támadási sebesség, állandó',
      color: '#77bfff'
    },
    movement: {
      icon: '👢',
      name: 'Lendület főzete',
      desc: 'Lendület: +20% mozgási sebesség, állandó',
      color: '#8bd9d6'
    },
    regen: {
      icon: '💚',
      name: 'Regeneráló főzet',
      desc: '10 Regeneráció, másodpercenként 1-gyel fogy',
      color: '#8ee69b'
    },
    none: {
      icon: '✖',
      name: 'X összetevő',
      desc: 'Semmi nem történik',
      color: '#a79b91'
    }
  };
  function alcEnsure(b) {
    if (!b || b.type !== ALC) return b;
    if (!Array.isArray(b.alchemyPool) || !b.alchemyPool.length) b.alchemyPool = [{
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
    if (!b.alchemyPool.some(x => x.id === 'none')) b.alchemyPool.push({
      id: 'none',
      weight: 25,
      locked: true
    });
    return b;
  }
  function alcLevel(c, b) {
    return Math.max(1, Math.min(4, b?.level || runtime.levelOf(c, ALC) || 1));
  }
  function alcBranch(c) {
    return runtime.branchOf(c, ALC);
  }
  function alcActive(pool) {
    return (pool || []).filter(x => x.id !== 'none');
  }
  function alcConfigure(c, b) {
    alcEnsure(b);
    const lv = alcLevel(c, b),
      branch = alcBranch(c),
      none = b.alchemyPool.find(x => x.id === 'none');
    const xShift = (runtime.hasLeg(c, 'alc_full_mix') ? 25 : 0) - 5 * runtime.countNormal(c, 'alc_x_reduce');
    const xBase = lv >= 4 && branch === ALC_PURE ? 0 : 25;
    if (lv >= 4 && branch === ALC_PURE) {
      if (none) {
        none.weight = Math.max(0, xBase + xShift);
        none.locked = true;
      }
      for (const x of alcActive(b.alchemyPool)) x.weight = 25;
    } else {
      if (none) {
        none.weight = Math.max(0, xBase + xShift);
        none.locked = true;
      }
      const min = lv <= 1 ? 25 : lv === 2 ? 25 : lv === 3 ? 25 : 0;
      const max = lv <= 1 ? 25 : lv === 2 ? 50 : lv === 3 ? 75 : 100;
      for (const x of alcActive(b.alchemyPool)) x.weight = runtime.clamp(Number(x.weight) || 25, min, max);
    }
    return b;
  }
  function alcRange(c, b, item) {
    const lv = alcLevel(c, b),
      branch = alcBranch(c);
    if (item.id === 'none') return {
      min: Number(item.weight) || 0,
      max: Number(item.weight) || 0,
      disabled: true
    };
    if (lv === 1) return {
      min: 25,
      max: 25,
      disabled: true
    };
    if (lv === 2) return {
      min: 25,
      max: 50,
      disabled: false
    };
    if (lv === 3) return {
      min: 25,
      max: 75,
      disabled: false
    };
    if (branch === ALC_PURE) return {
      min: 25,
      max: 25,
      disabled: true
    };
    return {
      min: 0,
      max: 100,
      disabled: false
    };
  }
  function alcChance(pool, item) {
    const total = (pool || []).reduce((s, x) => s + Math.max(0, Number(x.weight) || 0), 0);
    return total > 0 ? Math.max(0, Number(item.weight) || 0) / total : 0;
  }
  function alcRoll(pool) {
    const items = (pool || []).filter(x => (Number(x.weight) || 0) > 0),
      total = items.reduce((s, x) => s + (Number(x.weight) || 0), 0);
    if (!items.length || total <= 0) return 'none';
    let r = Math.random() * total;
    for (const x of items) {
      r -= Number(x.weight) || 0;
      if (r <= 0) return x.id;
    }
    return items[items.length - 1]?.id || 'none';
  }
  function alcApplyEffect(entry, id, sourceId) {
    entry.alchemyEffect = id;
    entry.alchemySourceId = sourceId || null;
    if (id === 'damage') entry.alchemyDamageMult = Math.max(entry.alchemyDamageMult || 1, 1.25);else if (id === 'hp') entry.alchemyHpMult = Math.max(entry.alchemyHpMult || 1, 1.25);else if (id === 'attack_speed') entry.alchemyAttackSpeedMult = Math.max(entry.alchemyAttackSpeedMult || 1, 1.25);
  }
  function alcHTML(c, b) {
    alcConfigure(c, b);
    const pool = b.alchemyPool,
      lv = alcLevel(c, b),
      branch = alcBranch(c),
      pure = lv >= 4 && branch === ALC_PURE;
    const subtitle = lv === 1 ? 'Fix recept' : lv === 2 ? '25–50 közötti súlyok' : lv === 3 ? '25–75 közötti súlyok' : pure ? 'X nélkül · minden aktív főzet azonos eséllyel' : '0–100 közötti szabad súlyok · X fix 25';
    return `<div class="alchemyV4960"><div class="alchemyHead"><div><div class="boxlabel">ALKIMISTA RECEPT</div><b>L${lv}${branch ? ` · ${branch === ALC_PURE ? 'Tiszta főzet' : 'Precíz receptúra'}` : ''}</b><small>${subtitle}</small></div></div><div class="alchemySliderRows">${pool.map((item, i) => {
      const m = ALC_META[item.id] || {
          icon: '🧪',
          name: item.id,
          desc: 'Főzethatás',
          color: '#d7c27d'
        },
        range = alcRange(c, b, item),
        chance = Math.round(alcChance(pool, item) * 100);
      if (pure && item.id === 'none' && item.weight <= 0) return `<div class="alchemySliderRow alcRemoved"><div class="alcName"><span style="color:${m.color}">${m.icon}</span><span><b>${m.name}</b><small>Eltávolítva ezen az ágon</small></span></div><strong>0%</strong></div>`;
      return `<div class="alchemySliderRow"><div class="alcName"><span style="color:${m.color}">${m.icon}</span><span><b>${m.name}</b><small>${m.desc}</small></span></div><div class="alcSlider"><input type="range" data-alc-index="${i}" min="${range.min}" max="${range.max}" step="1" value="${Math.round(item.weight)}" ${range.disabled ? 'disabled' : ''}><small>Súly: <b data-alc-weight="${i}">${Math.round(item.weight)}</b> · tényleges esély: <b data-alc-chance="${i}">${chance}%</b></small></div></div>`;
    }).join('')}</div><div class="alchemyRule">Minden szomszédos katonai forrásból érkező egységre egyszer sorsol. A csúszkák <b>súlyok</b>, a tényleges esélyeket a teljes recept normalizálja. Az X slot nem cserélhető.</div></div>`;
  }
  function bindAlcWindow(win, b) {
    win.querySelectorAll('[data-alc-index]').forEach(input => {
      input.addEventListener('input', () => {
        alcConfigure(runtime.P, b);
        const i = +input.dataset.alcIndex,
          item = b.alchemyPool[i];
        if (!item || item.id === 'none') return;
        item.weight = runtime.clamp(+input.value, +input.min, +input.max);
        const weight = win.querySelector(`[data-alc-weight="${i}"]`);
        if (weight) weight.textContent = Math.round(item.weight);
        b.alchemyPool.forEach((x, j) => {
          const ce = win.querySelector(`[data-alc-chance="${j}"]`);
          if (ce) ce.textContent = Math.round(alcChance(b.alchemyPool, x) * 100) + '%';
        });
      });
      input.addEventListener('change', () => runtime.renderStatic());
    });
  }
  function hydrateAlchemyWindows() {
    document.querySelectorAll('.buildingInspectorWindow[data-id]').forEach(win => {
      const b = runtime.getBuilding(runtime.P, win.dataset.id);
      if (!b || b.type !== ALC) return;
      const card = win.querySelector('.inspectorCard');
      if (!card) return;
      card.querySelector('.alchemyV4960')?.remove();
      const holder = document.createElement('div');
      holder.innerHTML = alcHTML(runtime.P, b);
      const note = card.querySelector('.upgradeNote');
      note?.parentNode?.insertBefore(holder.firstElementChild, note);
      if (note) note.textContent = 'Ez az épület nem fejleszthető.';
      bindAlcWindow(win, b);
    });
  }
  runtime.BUILDINGS[ALC].description = '1×1 támogatói épület. A szomszédos katonai termelőkből érkező egységekre egy főzetet sorsol. L1-en 25/25/25/25 a Sebzés / Max HP / Attack speed / X; magasabb szinteken a recept súlyai állíthatók.';
  runtime.BUILDINGS[ALC].unique = true;
  runtime.V4_BRANCHES[ALC] = [{
    id: ALC_PRECISE,
    name: 'Precíz receptúra',
    icon: '⚗️',
    description: 'A három aktív főzet súlya 0–100 között szabadon állítható. Az X összetevő továbbra is fix 25 súly.'
  }, {
    id: ALC_PURE,
    name: 'Tiszta főzet',
    icon: '🧪',
    description: 'Az X összetevő teljesen eltűnik. Az aktív főzetek nem állíthatók, mindegyik azonos eséllyel kerül az egységre.'
  }];
  const oldUpgradePoolV4960 = runtime.buildingUpgradePool;
  runtime.buildingUpgradePool = function (c) {
    const out = oldUpgradePoolV4960(c).filter(o => o.id !== ALC);
    if (runtime.hasBuilding(c, ALC) && runtime.levelOf(c, ALC) < 4) {
      const lv = runtime.levelOf(c, ALC);
      if (lv === 3) {
        for (const opt of runtime.V4_BRANCHES[ALC]) out.push({
          kind: 'building_branch',
          id: ALC,
          branch: opt.id,
          level: 4,
          icon: opt.icon,
          name: opt.name,
          description: opt.description,
          details: 'Alkimista kunyhó · L4 specializáció'
        });
      } else {
        const next = lv + 1,
          desc = next === 2 ? 'A három aktív főzet súlya 25–50 között állítható. Az X továbbra is fix 25.' : 'A három aktív főzet súlya 25–75 között állítható. Az X továbbra is fix 25.';
        out.push({
          kind: 'building_upgrade',
          id: ALC,
          level: next,
          icon: '🧪',
          name: `Alkimista kunyhó ${next === 2 ? 'II' : 'III'}`,
          description: desc,
          details: `L${lv} → L${next} · receptfinomítás`
        });
      }
    }
    for (const o of out) {
      if (o?.kind !== 'building_upgrade' || !runtime.BUILDINGS[o.id]) continue;
      const base = String(runtime.BUILDINGS[o.id].description || '').trim();
      const levelEffect = String(o.description || '').trim();
      if (o.id === ALC && levelEffect && levelEffect !== base) {
        o.description = `${base}<br><br><b>Az új szinten:</b> ${levelEffect}`;
      } else if (base) {
        o.description = base;
      }
    }
    return out;
  };
  const oldApplyChoiceV4960 = runtime.applyChoice;
  runtime.applyChoice = function (c, o, countEvent = true) {
    const beforeKeep = o?.kind === 'legendary' && o.id === ROYAL ? runtime.levelOf(c, 'keep') : null;
    const out = oldApplyChoiceV4960(c, o, countEvent);
    if (o?.id === ALC && ['building_upgrade', 'building_branch'].includes(o.kind)) for (const b of runtime.buildingOf(c, ALC)) alcConfigure(c, b);
    if (o?.kind === 'legendary' && o.id === ROYAL) {
      const target = Math.min(4, beforeKeep + 1);
      if (target === 4) {
        runtime.setBuildingLevel(c, 'keep', 4, null);
        if (c === runtime.P) {
          c.royalDistrictBranchPending = true;
          if (!runtime.state.pendingChoices.includes(KEEP_BRANCH_SOURCE) && runtime.state.choiceContext?.source !== KEEP_BRANCH_SOURCE) {
            if (runtime.state.startChoices > 0) runtime.state.pendingChoices.unshift(KEEP_BRANCH_SOURCE);else runtime.state.pendingChoices.splice(Math.min(1, runtime.state.pendingChoices.length), 0, KEEP_BRANCH_SOURCE);
          }
        } else {
          const opts = runtime.V4_BRANCHES.keep || [];
          if (opts.length) runtime.setBuildingLevel(c, 'keep', 4, opts[Math.floor(Math.random() * opts.length)].id);
        }
      } else runtime.setBuildingLevel(c, 'keep', target);
      runtime.recomputeCity(c, true);
      if (c === runtime.P) runtime.toast(`Királyi negyed · Főépület L${runtime.levelOf(c, 'keep')} · szomszédos termelés/gyártás +25%.`);
    }
    return out;
  };
  const royalDef = {
    id: ROYAL,
    icon: '👑',
    name: 'Királyi negyed',
    description: '+1 Főépület-szint. A Főépület közvetlen szomszédságában álló nyersanyagtermelők +25% termelést, a katonai termelők +25% gyártási sebességet kapnak.',
    eligible: s => runtime.hasBuilding(s, 'keep') && runtime.levelOf(s, 'keep') < 4
  };
  if (!runtime.LEGENDARY.some(x => x.id === ROYAL)) runtime.LEGENDARY.push(royalDef);
  runtime.PICK_IMAGES[ROYAL] = runtime.CARD_IMAGES.keep || runtime.BUILDING_IMAGES.keep || runtime.PICK_IMAGES.production || runtime.PICK_IMAGES.spawn_speed;
  function keepNeighbor(c, b) {
    const k = runtime.buildingOf(c, 'keep')[0];
    return !!(k && b && b.id !== k.id && runtime.adjacentBuildings(c, k).some(x => x.id === b.id));
  }
  const oldGuildMultiplierV4960 = runtime.guildMultiplier;
  runtime.guildMultiplier = function (c, b) {
    let m = oldGuildMultiplierV4960(c, b);
    if (runtime.hasLeg(c, ROYAL) && keepNeighbor(c, b) && ['lumber', 'stonecutter', 'farm'].includes(b.type)) m *= 1.25;
    return m;
  };
  const oldTrainingSpeedV4960 = runtime.trainingSpeedBonus;
  runtime.trainingSpeedBonus = function (c, b, key) {
    let s = oldTrainingSpeedV4960(c, b, key);
    if (s && runtime.hasLeg(c, ROYAL) && keepNeighbor(c, b) && runtime.BUILDINGS[b.type]?.unit) s *= 1.25;
    return s;
  };
  function mercAcademy(c, b, entry) {
    if (b?.type !== 'merc_tent' || !entry) return;
    const a = runtime.buildingOf(c, 'academy')[0];
    if (!a) return;
    const global = runtime.hasBranch(c, 'academy', 'war_academy'),
      near = runtime.adjacentBuildings(c, a).some(x => x.id === b.id);
    if (!global && !near) return;
    const st = c.academyStacks || {
        damage: 0,
        hp: 0,
        attackSpeed: 0
      },
      per = a.level >= 4 && runtime.hasBranch(c, 'academy', 'master_training') ? .06 : a.level <= 1 ? .01 : a.level === 2 ? .02 : .03;
    entry.academyDamageMult = 1 + (Number(st.damage) || 0) * per;
    entry.academyHpMult = 1 + (Number(st.hp) || 0) * per;
    entry.academyAttackSpeedMult = 1 + (Number(st.attackSpeed) || 0) * per;
    entry.academyTrained = true;
  }
  function mercAlchemy(c, b, entry) {
    if (b?.type !== 'merc_tent' || !entry) return;
    const hut = runtime.buildingOf(c, ALC)[0];
    if (!hut || !runtime.adjacentBuildings(c, hut).some(x => x.id === b.id)) return;
    alcConfigure(c, hut);
    alcApplyEffect(entry, alcRoll(hut.alchemyPool), hut.id);
  }
  const oldQueueProducedV4960 = runtime.queueProduced;
  runtime.queueProduced = function (c, entry, b = null) {
    if (b?.type === 'merc_tent') {
      mercAcademy(c, b, entry);
      if (!window.__ALCHEMY_V4961_ACTIVE__) mercAlchemy(c, b, entry);
    }
    return oldQueueProducedV4960(c, entry, b);
  };
  const oldRowsV4960 = runtime.buildingEffectRows;
  runtime.buildingEffectRows = function (c, b) {
    let rows = oldRowsV4960(c, b) || [];
    if (b.type === ALC) {
      alcConfigure(c, b);
      rows = rows.filter(([label]) => !['Alap koktél', 'Aktív receptek'].includes(label));
      const branch = alcBranch(c),
        lv = alcLevel(c, b),
        desc = lv === 1 ? 'fix 25/25/25/25' : lv === 2 ? 'aktív súlyok 25–50' : lv === 3 ? 'aktív súlyok 25–75' : branch === ALC_PURE ? 'X nélkül · egyenlő esély' : 'aktív súlyok 0–100 · X fix 25';
      rows.unshift(['Recept', desc], ['Aktív főzethelyek', String(alcActive(b.alchemyPool).length)]);
    }
    if (runtime.hasLeg(c, ROYAL) && b.type === 'keep') rows.unshift(['Királyi negyed', 'Szomszédos termelés és gyártás +25%']);else if (runtime.hasLeg(c, ROYAL) && keepNeighbor(c, b) && ['lumber', 'stonecutter', 'farm'].includes(b.type)) rows.unshift(['Királyi negyed', '+25% termelés']);else if (runtime.hasLeg(c, ROYAL) && keepNeighbor(c, b) && runtime.BUILDINGS[b.type]?.unit) rows.unshift(['Királyi negyed', '+25% gyártási sebesség']);
    return rows;
  };
  const oldChoiceCtxV4960 = runtime.choiceContextForPlayer;
  runtime.choiceContextForPlayer = function () {
    const ctx = oldChoiceCtxV4960();
    if (ctx?.source === KEEP_BRANCH_SOURCE && runtime.P.royalDistrictBranchPending) {
      ctx.kicker = 'KIRÁLYI NEGYED · L4 SPECIALIZÁCIÓ';
      ctx.desc = 'A Királyi negyed L4-re emelte a Főépületet. Ez a választás nem kerül külön pickbe.';
    }
    return ctx;
  };
  const oldChooseV4960 = runtime.choose;
  runtime.choose = function (o, index = -1) {
    const royalBranch = runtime.state.choiceContext?.source === KEEP_BRANCH_SOURCE && runtime.P.royalDistrictBranchPending;
    const out = oldChooseV4960(o, index);
    if (royalBranch) runtime.P.royalDistrictBranchPending = false;
    return out;
  };
  const oldRenderStaticV4960 = runtime.renderStatic;
  runtime.renderStatic = function () {
    const out = oldRenderStaticV4960();
    hydrateAlchemyWindows();
    return out;
  };
  const style = document.createElement('style');
  style.textContent = "@import url(\"" + (assetUrl("styles/features/city-alchemy-recipes-29.css") + "\");");
  document.head.appendChild(style);
  for (const c of [runtime.P, runtime.E]) for (const b of runtime.buildingOf(c, ALC)) alcConfigure(c, b);
  const brandSmall = document.querySelector('.brand small');
  if (brandSmall) brandSmall.textContent = 'V4.9.60 · P2P 1V1';
  if (runtime.MP?.lobby) {
    const ver = runtime.MP.lobby.querySelector('.menuVersion');
    if (ver) ver.textContent = 'V4.9.60 · P2P';
  }
  document.title = 'Roadlords V4.9.60 – Alkimista + Királyi negyed';
  window.__ROADLORDS_VERSION__ = '4.9.60-alchemy-royal-district';
  window.__ROADLORDS_V4960__ = {
    alcEnsure,
    alcConfigure,
    alcRoll,
    ROYAL
  };
}
