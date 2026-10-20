import { assetUrl } from '../assets/urls.js';
export function initializeCityAcademy(runtime) {
  const CAPITAL_STUDIES = 'capital_studies';
  const CAPITAL_SOURCE = 'capital_studies_choice';
  const ACADEMY = 'academy';
  const ACADEMY_GLOBAL = 'war_academy';
  const ACADEMY_ELITE = 'master_training';
  const ACADEMY_RES = {
    damage: 'wood',
    hp: 'stone',
    attackSpeed: 'food'
  };
  const capitalDef = {
    id: CAPITAL_STUDIES,
    icon: '📜',
    name: 'Haditanulmányok',
    description: 'A Fővárosban Common fejlesztés-választást vásárolhatsz. Az első ára 500 Fa + 500 Kő + 500 Élelem, majd minden vásárlás után nyersanyagonként +500-zal nő. Automatikus vásárlás is bekapcsolható.',
    eligible: s => runtime.hasBuilding(s, 'keep')
  };
  if (!runtime.LEGENDARY.some(x => x.id === CAPITAL_STUDIES)) runtime.LEGENDARY.push(capitalDef);
  runtime.PICK_IMAGES[CAPITAL_STUDIES] = runtime.BUILDING_IMAGES.keep || runtime.CARD_IMAGES.keep || runtime.PICK_IMAGES.production || runtime.PICK_IMAGES.all_damage;
  function capitalStudyCost(c) {
    const n = Math.max(0, c.capitalStudyPurchases || 0),
      v = 500 * (n + 1);
    return runtime.C(v, v, v);
  }
  function capitalStudyPending() {
    return runtime.state.choiceContext?.source === CAPITAL_SOURCE || runtime.state.pendingChoices.includes(CAPITAL_SOURCE);
  }
  function canBuyCapitalStudy(c) {
    return runtime.hasLeg(c, CAPITAL_STUDIES) && runtime.canPay(c, capitalStudyCost(c));
  }
  function syncLocalStrategyV4953() {
    if (typeof runtime.MP === 'undefined' || !runtime.MP?.enabled) return;
    if (runtime.MP.role === 'guest' && typeof runtime.mpSendStrategy === 'function') queueMicrotask(() => runtime.mpSendStrategy(true));else if (runtime.MP.role === 'host' && typeof runtime.mpSendSnapshot === 'function') queueMicrotask(() => runtime.mpSendSnapshot());
  }
  function libraryFreeRerollsV4953(c) {
    const b = runtime.buildingOf(c, 'library')[0];
    if (!b) return 0;
    return b.level <= 1 ? 1 : b.level === 2 ? 2 : 3;
  }
  function capitalCommonOptions(c) {
    return runtime.shuffle(runtime.eligibleNormal(c).map(o => ({
      ...o,
      kind: 'normal'
    }))).slice(0, Math.max(1, runtime.choiceCount(c)));
  }
  function buyCapitalStudy(c, showChoice = true) {
    if (!runtime.hasLeg(c, CAPITAL_STUDIES)) return false;
    if (c === runtime.P && capitalStudyPending()) {
      runtime.toast('Az előző haditanulmány-választás még vár rád.');
      return false;
    }
    const cost = capitalStudyCost(c);
    if (!runtime.pay(c, cost)) {
      if (c === runtime.P) runtime.toast(`Nincs elég nyersanyag · ${cost.wood} mindegyikből.`);
      return false;
    }
    c.capitalStudyPurchases = (c.capitalStudyPurchases || 0) + 1;
    if (c === runtime.P && showChoice) {
      if (runtime.MP?.enabled && runtime.MP.role === 'guest') {
        syncLocalStrategyV4953();
        runtime.mpSend({
          type: 'capital_study_choice'
        });
      }
      runtime.queueChoice(CAPITAL_SOURCE);
      runtime.toast(`Haditanulmányok megvásárolva · következő ár ${capitalStudyCost(c).wood} mindegyikből.`);
      runtime.updateHud();
      runtime.renderInspector();
    } else {
      const opts = capitalCommonOptions(c);
      if (opts.length) runtime.applyChoice(c, runtime.pick(opts), false);
    }
    return true;
  }
  const oldChoiceContextV4953 = runtime.choiceContextForPlayer;
  runtime.choiceContextForPlayer = function () {
    const source = runtime.state.startChoices > 0 ? 'start' : runtime.state.pendingChoices[0];
    if (source === CAPITAL_SOURCE) {
      const free = libraryFreeRerollsV4953(runtime.P);
      return {
        source: CAPITAL_SOURCE,
        tier: 'common',
        subtype: null,
        legendary: false,
        doubleTake: false,
        remaining: 1,
        kicker: 'FŐVÁROS · HADITANULMÁNYOK',
        title: 'Válassz egy Common fejlesztést',
        desc: 'Megvásárolt haditanulmány. Csak Common fejlesztések jelennek meg; a vásárlás nem lépteti tovább a normál pick-ciklust.',
        opts: capitalCommonOptions(runtime.P),
        freeRerolls: free,
        freeRerollsMax: free
      };
    }
    return oldChoiceContextV4953();
  };
  const oldChooseV4953 = runtime.choose;
  runtime.choose = function (o, index = -1) {
    if (runtime.state.choiceContext?.source === CAPITAL_SOURCE) {
      if (!o || o.kind !== 'normal') return;
      runtime.applyChoice(runtime.P, o, false);
      runtime.toast(`Haditanulmányok: ${o.name}`);
      runtime.finalizeChoiceEvent();
      return;
    }
    return oldChooseV4953(o, index);
  };
  if (typeof runtime.mpHandle === 'function') {
    const oldMpHandleV4953 = runtime.mpHandle;
    runtime.mpHandle = function (data) {
      if (data?.type === 'capital_study_choice' && runtime.MP.role === 'host') {
        runtime.MP.guestChoicePending = true;
        runtime.mpSetStatus('Az ellenfél Haditanulmányok fejlesztést választ…', 'wait');
        return;
      }
      return oldMpHandleV4953(data);
    };
  }
  runtime.BUILDINGS[ACADEMY] = {
    name: 'Akadémia',
    icon: '🎓',
    category: 'support',
    unique: true,
    shape: [[0, 0], [0, 1], [1, 0], [1, 1]],
    description: 'A közvetlenül szomszédos katonai termelők egységeit három, nyersanyagból korlátlanul fejleszthető irányban erősíti: Fa = sebzés, Kő = Max HP, Élelem = attack speed.',
    cost: runtime.C(60, 60, 0)
  };
  if (!runtime.UNLOCKABLE.includes(ACADEMY)) runtime.UNLOCKABLE.push(ACADEMY);
  runtime.V4_BRANCHES[ACADEMY] = [{
    id: ACADEMY_GLOBAL,
    name: 'Hadiakadémia',
    icon: '🌍',
    description: 'Az Akadémia minden megvett stackje az összes saját katonai termelő egységeire érvényes. Stackenként +3% marad.'
  }, {
    id: ACADEMY_ELITE,
    name: 'Mesterképzés',
    icon: '🎓',
    description: 'A bónusz továbbra is csak a közvetlenül szomszédos katonai termelőkre hat, viszont minden stack +6%-ot ad.'
  }];
  runtime.BUILDING_IMAGES[ACADEMY] = runtime.BUILDING_IMAGES.library || runtime.BUILDING_IMAGES.townhall || runtime.BUILDING_IMAGES.guildhouse || runtime.BUILDING_IMAGES.keep;
  runtime.CARD_IMAGES[ACADEMY] = runtime.CARD_IMAGES.library || runtime.CARD_IMAGES.townhall || runtime.CARD_IMAGES.guildhouse || runtime.BUILDING_IMAGES[ACADEMY];
  runtime.BUILDING_IMAGE_META[ACADEMY] = {
    w: 2,
    h: 2
  };
  function academyStacks(c) {
    if (!c.academyStacks) c.academyStacks = {
      damage: 0,
      hp: 0,
      attackSpeed: 0
    };
    for (const k of ['damage', 'hp', 'attackSpeed']) c.academyStacks[k] = Math.max(0, Number(c.academyStacks[k]) || 0);
    return c.academyStacks;
  }
  function academyNextCostForCount(n) {
    let cost = 30;
    for (let i = 0; i < n; i++) cost = Math.ceil(cost * 1.5);
    return cost;
  }
  function academyNextCost(c, stat) {
    return academyNextCostForCount(academyStacks(c)[stat] || 0);
  }
  function academyPerStack(c) {
    const a = runtime.buildingOf(c, ACADEMY)[0];
    if (!a) return 0;
    if (a.level >= 4 && runtime.hasBranch(c, ACADEMY, ACADEMY_ELITE)) return .06;
    if (a.level <= 1) return .01;
    if (a.level === 2) return .02;
    return .03;
  }
  function academyIsGlobal(c) {
    return runtime.hasBranch(c, ACADEMY, ACADEMY_GLOBAL);
  }
  function academyAffectsSpawner(c, b) {
    const a = runtime.buildingOf(c, ACADEMY)[0];
    if (!a || !b || !runtime.BUILDINGS[b.type]?.unit) return false;
    if (academyIsGlobal(c)) return true;
    return runtime.adjacentBuildings(c, a).some(x => x.id === b.id);
  }
  function academyBonusMults(c) {
    const stacks = academyStacks(c),
      per = academyPerStack(c);
    return {
      damage: 1 + stacks.damage * per,
      hp: 1 + stacks.hp * per,
      attackSpeed: 1 + stacks.attackSpeed * per
    };
  }
  function buyAcademyStack(c, stat) {
    const a = runtime.buildingOf(c, ACADEMY)[0];
    if (!a || !ACADEMY_RES[stat]) return false;
    const resource = ACADEMY_RES[stat],
      cost = academyNextCost(c, stat),
      price = runtime.C();
    price[resource] = cost;
    if (!runtime.pay(c, price)) {
      if (c === runtime.P) runtime.toast(`Nincs elég ${resource === 'wood' ? 'fa' : resource === 'stone' ? 'kő' : 'élelem'} · ${cost} kell.`);
      return false;
    }
    academyStacks(c)[stat]++;
    if (c === runtime.P) {
      const labels = {
        damage: 'Sebzés',
        hp: 'Max HP',
        attackSpeed: 'Attack speed'
      };
      runtime.toast(`Akadémia · ${labels[stat]} stack ${academyStacks(c)[stat]}`);
      syncLocalStrategyV4953();
      runtime.updateHud();
      runtime.renderInspector();
    }
    return true;
  }
  const oldQueueProducedV4953 = runtime.queueProduced;
  runtime.queueProduced = function (c, entry, b = null) {
    if (b && entry && academyAffectsSpawner(c, b)) {
      const m = academyBonusMults(c);
      entry.academyDamageMult = m.damage;
      entry.academyHpMult = m.hp;
      entry.academyAttackSpeedMult = m.attackSpeed;
      entry.academyTrained = true;
    }
    return oldQueueProducedV4953(c, entry, b);
  };
  const oldStatsForV4953 = runtime.statsFor;
  runtime.statsFor = function (c, entry) {
    const s = oldStatsForV4953(c, entry);
    const hp = Math.max(1, Number(entry?.academyHpMult) || 1),
      dmg = Math.max(1, Number(entry?.academyDamageMult) || 1),
      as = Math.max(1, Number(entry?.academyAttackSpeedMult) || 1);
    if (hp !== 1) s.hp *= hp;
    if (dmg !== 1) {
      s.dmg *= dmg;
      s.buildingDamage *= dmg;
    }
    if (as !== 1) s.cooldown /= as;
    return s;
  };
  const oldReleaseUnitV4953 = runtime.releaseUnit;
  runtime.releaseUnit = function (c, entry) {
    const u = oldReleaseUnitV4953(c, entry);
    if (!u) return u;
    u.academyTrained = !!entry.academyTrained;
    u.academyHpMult = entry.academyHpMult || 1;
    u.academyDamageMult = entry.academyDamageMult || 1;
    u.academyAttackSpeedMult = entry.academyAttackSpeedMult || 1;
    return u;
  };
  const oldKillUnitV4953 = runtime.killUnit;
  runtime.killUnit = function (target, combatDeath = true) {
    if (!target?.alive) return;
    const c = runtime.cityForSide(target.side),
      before = c?.garrison?.length || 0;
    const academyData = {
      trained: !!target.academyTrained,
      hp: target.academyHpMult || 1,
      damage: target.academyDamageMult || 1,
      as: target.academyAttackSpeedMult || 1,
      key: target.key
    };
    const out = oldKillUnitV4953(target, combatDeath);
    if (combatDeath && academyData.trained && c?.garrison?.length > before) {
      for (let i = before; i < c.garrison.length; i++) {
        const e = c.garrison[i];
        if (!e || e.key !== academyData.key || !e.hospitalSaved) continue;
        e.academyTrained = true;
        e.academyHpMult = academyData.hp;
        e.academyDamageMult = academyData.damage;
        e.academyAttackSpeedMult = academyData.as;
      }
    }
    return out;
  };
  if (typeof runtime.MP_STRATEGY_KEYS !== 'undefined') for (const k of ['academyStacks', 'capitalStudyPurchases', 'capitalStudyAuto']) if (!runtime.MP_STRATEGY_KEYS.includes(k)) runtime.MP_STRATEGY_KEYS.push(k);
  const oldRowsV4953 = runtime.buildingEffectRows;
  runtime.buildingEffectRows = function (c, b) {
    const rows = oldRowsV4953(c, b) || [];
    if (b.type === ACADEMY) {
      const s = academyStacks(c),
        per = academyPerStack(c),
        scope = academyIsGlobal(c) ? 'MINDEN katonai termelő' : 'közvetlenül szomszédos termelők';
      return [['Hatókör', scope], ['Bónusz / stack', `+${Math.round(per * 100)}%`], ['Fa · Sebzés', `${s.damage} stack · +${Math.round(s.damage * per * 100)}% · köv. ${academyNextCost(c, 'damage')} Fa`], ['Kő · Max HP', `${s.hp} stack · +${Math.round(s.hp * per * 100)}% · köv. ${academyNextCost(c, 'hp')} Kő`], ['Élelem · Attack speed', `${s.attackSpeed} stack · +${Math.round(s.attackSpeed * per * 100)}% · köv. ${academyNextCost(c, 'attackSpeed')} Élelem`]];
    }
    if (b.type === 'keep' && runtime.hasLeg(c, CAPITAL_STUDIES)) rows.push(['Haditanulmányok', `${c.capitalStudyPurchases || 0} vásárlás · következő ${capitalStudyCost(c).wood} mindegyikből`]);
    return rows;
  };
  const oldUpgradeDetailsV4953 = runtime.buildingUpgradeDetails;
  runtime.buildingUpgradeDetails = function (c, type) {
    if (type === ACADEMY) {
      const from = runtime.levelOf(c, type),
        to = runtime.upgradeTargetLevel(c, type);
      if (from < 3) {
        const a = from <= 1 ? 1 : from === 2 ? 2 : 3,
          b = to <= 1 ? 1 : to === 2 ? 2 : 3;
        return `Minden jelenlegi és későbbi Akadémia L${to} lesz.<span class="upgradeDeltaV497">Bónusz stackenként: <b>+${a}% → +${b}%</b></span>`;
      }
      return 'Megnyitja a két L4 specializációt: globális +3%/stack vagy helyi +6%/stack.';
    }
    return oldUpgradeDetailsV4953(c, type);
  };
  const style = document.createElement('style');
  style.textContent = "@import url(\"" + (assetUrl("styles/features/city-academy-24.css") + "\");");
  document.head.appendChild(style);
  function academyControlsHTML(c) {
    const s = academyStacks(c),
      per = academyPerStack(c),
      labels = {
        damage: ['🪵', 'Sebzés', 'Fa'],
        hp: ['🪨', 'Max HP', 'Kő'],
        attackSpeed: ['🌾', 'Attack speed', 'Élelem']
      };
    return `<div class="academySpendBox"><div class="boxlabel">AKADÉMIAI KÉPZÉS · KORLÁTLAN STACK</div><div class="academySpendGrid">${Object.entries(labels).map(([stat, [icon, label, res]]) => {
      const cost = academyNextCost(c, stat),
        resource = ACADEMY_RES[stat],
        ok = (c.resources[resource] || 0) + 1e-9 >= cost;
      return `<button type="button" class="academySpend" data-academy-stat="${stat}" ${ok ? '' : 'disabled'}><span class="academyIcon">${icon}</span><b>${label}</b><small>${s[stat]} stack · +${Math.round(s[stat] * per * 100)}%</small><em>${cost} ${res}</em></button>`;
    }).join('')}</div></div>`;
  }
  function capitalStudyControlsHTML(c) {
    const cost = capitalStudyCost(c),
      pending = c === runtime.P && capitalStudyPending(),
      aff = runtime.canPay(c, cost);
    return `<div class="capitalStudyBox"><div class="boxlabel">📜 HADITANULMÁNYOK</div><div class="capitalStudyPrice">Következő Common választás: <b>${cost.wood} Fa + ${cost.stone} Kő + ${cost.food} Élelem</b><br>Vásárlások: ${c.capitalStudyPurchases || 0}</div><div class="capitalStudyActions"><button type="button" id="capitalStudyBuy" ${!aff || pending ? 'disabled' : ''}>${pending ? 'VÁLASZTÁS FOLYAMATBAN' : 'COMMON VÁSÁRLÁSA'}</button><button type="button" id="capitalStudyAuto" class="${c.capitalStudyAuto ? 'active' : ''}">AUTOMATA: ${c.capitalStudyAuto ? 'BE' : 'KI'}</button></div></div>`;
  }
  const oldRenderInspectorV4953 = runtime.renderInspector;
  runtime.renderInspector = function () {
    const out = oldRenderInspectorV4953();
    const b = runtime.getBuilding(runtime.P, runtime.state.selectedBuilding),
      card = runtime.$('#inspector .inspectorCard');
    if (!b || !card) return out;
    const actions = card.querySelector('.iactions');
    if (b.type === ACADEMY) {
      const holder = document.createElement('div');
      holder.innerHTML = academyControlsHTML(runtime.P);
      actions?.parentNode?.insertBefore(holder.firstElementChild, actions);
      runtime.$$('.academySpend [data-academy-stat], .academySpend').forEach(() => {});
      card.querySelectorAll('[data-academy-stat]').forEach(btn => btn.onclick = () => buyAcademyStack(runtime.P, btn.dataset.academyStat));
    }
    if (b.type === 'keep' && runtime.hasLeg(runtime.P, CAPITAL_STUDIES)) {
      const holder = document.createElement('div');
      holder.innerHTML = capitalStudyControlsHTML(runtime.P);
      actions?.parentNode?.insertBefore(holder.firstElementChild, actions);
      const buy = card.querySelector('#capitalStudyBuy');
      if (buy) buy.onclick = () => buyCapitalStudy(runtime.P, true);
      const auto = card.querySelector('#capitalStudyAuto');
      if (auto) auto.onclick = () => {
        runtime.P.capitalStudyAuto = !runtime.P.capitalStudyAuto;
        syncLocalStrategyV4953();
        runtime.toast(`Haditanulmányok automata: ${runtime.P.capitalStudyAuto ? 'BE' : 'KI'}.`);
        runtime.renderInspector();
      };
    }
    return out;
  };
  function maybeAutoCapitalPlayer() {
    if (!runtime.P.capitalStudyAuto || !runtime.hasLeg(runtime.P, CAPITAL_STUDIES) || runtime.state.ended || runtime.state.modal || capitalStudyPending()) return;
    if (canBuyCapitalStudy(runtime.P)) buyCapitalStudy(runtime.P, true);
  }
  function maybeAiEconomySinks(c, dt) {
    if (!c || runtime.MP?.enabled) return;
    c.v4953SinkTimer = (c.v4953SinkTimer || 0) + dt;
    if (c.v4953SinkTimer < 4) return;
    c.v4953SinkTimer = 0;
    if (runtime.hasLeg(c, CAPITAL_STUDIES) && canBuyCapitalStudy(c)) buyCapitalStudy(c, false);
    const a = runtime.buildingOf(c, ACADEMY)[0];
    if (!a) return;
    const candidates = ['damage', 'hp', 'attackSpeed'].map(stat => ({
      stat,
      res: ACADEMY_RES[stat],
      cost: academyNextCost(c, stat)
    })).filter(x => (c.resources[x.res] || 0) >= x.cost * 1.35);
    if (candidates.length) {
      candidates.sort((x, y) => c.resources[y.res] / y.cost - c.resources[x.res] / x.cost);
      buyAcademyStack(c, candidates[0].stat);
    }
  }
  const oldTickV4953 = runtime.tick;
  runtime.tick = function (dt) {
    const out = oldTickV4953(dt);
    maybeAutoCapitalPlayer();
    if (!runtime.MP?.enabled) maybeAiEconomySinks(runtime.E, Math.max(0, dt || 0));
    return out;
  };
  for (const c of [runtime.P, runtime.E]) {
    academyStacks(c);
    c.capitalStudyPurchases = c.capitalStudyPurchases || 0;
    c.capitalStudyAuto = !!c.capitalStudyAuto;
    c.v4953SinkTimer = 0;
  }
  const brandSmall = document.querySelector('.brand small');
  if (brandSmall) brandSmall.textContent = 'V4.9.53 · P2P 1V1';
  if (runtime.MP?.lobby) {
    const ver = runtime.MP.lobby.querySelector('.menuVersion');
    if (ver) ver.textContent = 'V4.9.53 · P2P';
  }
  document.title = 'Roadlords V4.9.53 – Akadémia + Haditanulmányok';
  window.__ROADLORDS_VERSION__ = '4.9.53-academy-war-studies';
  window.__ROADLORDS_V4953__ = {
    buyCapitalStudy,
    capitalStudyCost,
    buyAcademyStack,
    academyNextCost,
    academyPerStack,
    academyAffectsSpawner,
    academyControlsHTML,
    capitalStudyControlsHTML
  };
}
