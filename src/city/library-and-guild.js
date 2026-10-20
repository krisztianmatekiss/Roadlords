import { assetUrl } from '../assets/urls.js';
export function initializeCityLibraryAndGuild(runtime) {
  const LIBRARY = 'library';
  const MASTERS = 'mastersguild';
  const MASTERS_CHOICE = 'masters_guild_choice';
  const LIB_FORBIDDEN = 'forbidden_knowledge';
  const LIB_FEVER = 'research_fever';
  const MASTER_CHOICE_BRANCH = 'plan_council';
  const MASTER_FAST_BRANCH = 'grandmasters';
  const oldGuildMaster = (runtime.V4_BRANCHES.guildhouse || []).find(x => x.id === 'master_guild');
  if (oldGuildMaster) oldGuildMaster.name = 'Céhmesterek';
  runtime.BUILDINGS[LIBRARY] = {
    name: 'Könyvtár',
    icon: '📚',
    category: 'support',
    unique: true,
    shape: [[0, 0], [0, 1], [1, 0], [1, 1]],
    description: 'Minden választásnál ingyenes újrasorsolásokat ad. Az ingyenes pörgetések csak az aktuális választásra érvényesek.',
    cost: runtime.C(40, 50)
  };
  runtime.BUILDINGS[MASTERS] = {
    name: 'Mesterek Céhe',
    icon: '📐',
    category: 'support',
    unique: true,
    shape: [[0, 0], [1, 0], [1, 1]],
    description: 'Időközönként ingyenesen fejleszt egy már megépített épülettípust. A céh legfeljebb L3-ig fejleszt.',
    cost: runtime.C(50, 50)
  };
  for (const k of [LIBRARY, MASTERS]) if (!runtime.UNLOCKABLE.includes(k)) runtime.UNLOCKABLE.push(k);
  runtime.V4_BRANCHES[LIBRARY] = [{
    id: LIB_FORBIDDEN,
    name: 'Tiltott tudás',
    icon: '⊘',
    description: '+5 kitiltást kapsz. Amikor kitiltasz egy gyakori fejlesztést, előbb azonnal megkapod belőle az adott stacket, majd a fejlesztés végleg kikerül a menet pooljából.'
  }, {
    id: LIB_FEVER,
    name: 'Kutatási láz',
    icon: '⚗',
    description: 'Minden felhasznált újrasorsolás +1% nyersanyagtermelési és katonai gyártási sebességet ad a menet végéig, legfeljebb +40%-ig.'
  }];
  runtime.V4_BRANCHES[MASTERS] = [{
    id: MASTER_CHOICE_BRANCH,
    name: 'Tervtanács',
    icon: '📜',
    description: '180 másodpercenként nem véletlenszerű fejlesztést kapsz, hanem rendes választást a legfeljebb L3-ig fejleszthető, már megépített épülettípusokból.'
  }, {
    id: MASTER_FAST_BRANCH,
    name: 'Nagymesterek',
    icon: '⚒',
    description: 'A Mesterek Céhe 90 másodpercenként ad egy véletlenszerű épületfejlesztést. Továbbra sem vihet semmit L3 fölé.'
  }];
  runtime.BUILDING_IMAGES[LIBRARY] = runtime.BUILDING_IMAGES.townhall || runtime.BUILDING_IMAGES.guildhouse || runtime.BUILDING_IMAGES.keep;
  runtime.CARD_IMAGES[LIBRARY] = runtime.CARD_IMAGES.townhall || runtime.CARD_IMAGES.guildhouse || runtime.CARD_IMAGES.keep || runtime.BUILDING_IMAGES[LIBRARY];
  runtime.BUILDING_IMAGE_META[LIBRARY] = {
    w: 2,
    h: 2
  };
  runtime.BUILDING_IMAGES[MASTERS] = runtime.BUILDING_IMAGES.builders || runtime.BUILDING_IMAGES.guildhouse || runtime.BUILDING_IMAGES.warcenter || runtime.BUILDING_IMAGES.townhall;
  runtime.CARD_IMAGES[MASTERS] = runtime.CARD_IMAGES.builders || runtime.CARD_IMAGES.guildhouse || runtime.CARD_IMAGES.warcenter || runtime.CARD_IMAGES.townhall || runtime.BUILDING_IMAGES[MASTERS];
  runtime.BUILDING_IMAGE_META[MASTERS] = {
    w: 2,
    h: 2
  };
  function libraryFreePerChoice(c) {
    const b = runtime.buildingOf(c, LIBRARY)[0];
    if (!b) return 0;
    return b.level <= 1 ? 1 : b.level === 2 ? 2 : 3;
  }
  function researchStacks(c) {
    return Math.min(40, Math.max(0, c.libraryResearchRerolls || 0));
  }
  function researchMult(c) {
    return 1 + researchStacks(c) * .01;
  }
  function mastersInterval(c) {
    const b = runtime.buildingOf(c, MASTERS)[0];
    if (!b) return Infinity;
    if (b.level >= 4 && runtime.hasBranch(c, MASTERS, MASTER_FAST_BRANCH)) return 90;
    return b.level <= 1 ? 300 : b.level === 2 ? 240 : 180;
  }
  function mastersEligible(c) {
    return runtime.buildingUpgradePool(c).filter(o => o.kind === 'building_upgrade' && runtime.levelOf(c, o.id) < 3 && o.level <= 3 && runtime.hasBuilding(c, o.id));
  }
  function mastersChoiceOptions(c) {
    return runtime.shuffle(mastersEligible(c)).slice(0, Math.max(1, runtime.choiceCount(c)));
  }
  const oldTrainingSpeedV4941 = runtime.trainingSpeedBonus;
  runtime.trainingSpeedBonus = function (c, b, key) {
    const base = oldTrainingSpeedV4941(c, b, key);
    if (!base) return base;
    return base * (runtime.hasBranch(c, LIBRARY, LIB_FEVER) ? researchMult(c) : 1);
  };
  const oldProductionRatesV4941 = runtime.productionRates;
  runtime.productionRates = function (c) {
    const rates = oldProductionRatesV4941(c);
    if (runtime.hasBranch(c, LIBRARY, LIB_FEVER)) {
      const mult = researchMult(c);
      for (const r of runtime.RES) rates[r] *= mult;
    }
    return rates;
  };
  const oldChoiceContextV4941 = runtime.choiceContextForPlayer;
  runtime.choiceContextForPlayer = function () {
    const source = runtime.state.startChoices > 0 ? 'start' : runtime.state.pendingChoices[0];
    if (source === MASTERS_CHOICE) {
      const free = libraryFreePerChoice(runtime.P),
        opts = mastersChoiceOptions(runtime.P);
      return {
        source: MASTERS_CHOICE,
        tier: 'rare',
        subtype: 'upgrade',
        legendary: false,
        doubleTake: false,
        remaining: 1,
        kicker: 'MESTEREK CÉHE · TERVTANÁCS',
        title: 'Válassz ingyenes épületfejlesztést',
        desc: 'A Mesterek Céhe ajándéka. A választás nem számít normál picknek, és egyik épületet sem viheti L3 fölé.',
        opts,
        freeRerolls: free,
        freeRerollsMax: free
      };
    }
    const ctx = oldChoiceContextV4941();
    if (ctx) {
      const free = libraryFreePerChoice(runtime.P);
      ctx.freeRerolls = free;
      ctx.freeRerollsMax = free;
    }
    return ctx;
  };
  runtime.rerollCurrentChoice = function () {
    const c = runtime.state.choiceContext;
    if (!c) return;
    const free = Math.max(0, c.freeRerolls || 0);
    if (free <= 0 && runtime.P.rerolls <= 0) return;
    let usedFree = false;
    if (free > 0) {
      c.freeRerolls--;
      usedFree = true;
    } else runtime.P.rerolls--;
    if (runtime.hasBranch(runtime.P, LIBRARY, LIB_FEVER)) runtime.P.libraryResearchRerolls = Math.min(40, (runtime.P.libraryResearchRerolls || 0) + 1);
    runtime.state.banMode = false;
    c.opts = c.source === MASTERS_CHOICE ? mastersChoiceOptions(runtime.P) : runtime.makeChoiceOptions(runtime.P, c.source, c.tier, c.subtype);
    runtime.renderChoiceContext();
    runtime.toast(usedFree ? 'Ingyenes újrasorsolás felhasználva.' : 'Újrasorsolás felhasználva.');
  };
  const rrBtn = runtime.$('#rerollChoice');
  if (rrBtn) rrBtn.onclick = runtime.rerollCurrentChoice;
  runtime.banChoiceAt = function (i) {
    const c = runtime.state.choiceContext,
      o = c?.opts?.[i];
    if (!o || c.tier !== 'common' || o.kind !== 'normal') {
      runtime.toast('Csak gyakori fejlesztést lehet kitiltani.');
      return;
    }
    if (runtime.P.bans <= 0) return;
    runtime.P.bans--;
    if (runtime.hasBranch(runtime.P, LIBRARY, LIB_FORBIDDEN)) runtime.applyChoice(runtime.P, o, false);
    runtime.P.banned.add(o.id);
    const used = c.opts.filter((_, j) => j !== i).map(runtime.choiceKey);
    const replacement = runtime.makeChoiceOptions(runtime.P, c.source, c.tier, c.subtype, used).find(x => !used.includes(runtime.choiceKey(x)) && !runtime.P.banned.has(x.id));
    if (replacement) c.opts[i] = replacement;else c.opts.splice(i, 1);
    runtime.state.banMode = false;
    runtime.renderChoiceContext();
    runtime.toast(runtime.hasBranch(runtime.P, LIBRARY, LIB_FORBIDDEN) ? `${o.name}: megkaptad, majd kitiltottad.` : `${o.name} kitiltva erre a menetre.`);
  };
  const oldApplyChoiceV4941 = runtime.applyChoice;
  runtime.applyChoice = function (c, o, countEvent = true) {
    const previousBranch = o?.kind === 'building_branch' ? runtime.branchOf(c, o.id) : null;
    const out = oldApplyChoiceV4941(c, o, countEvent);
    if (o?.kind === 'building_branch' && o.id === LIBRARY && o.branch === LIB_FORBIDDEN && previousBranch !== LIB_FORBIDDEN) {
      c.bans = (c.bans || 0) + 5;
      if (c === runtime.P) runtime.toast('Tiltott tudás · +5 kitiltás.');
    }
    return out;
  };
  const oldChooseV4941 = runtime.choose;
  runtime.choose = function (o, index = -1) {
    const ctx = runtime.state.choiceContext;
    if (ctx?.source === MASTERS_CHOICE) {
      if (!o || o.kind !== 'building_upgrade' || runtime.levelOf(runtime.P, o.id) >= 3) {
        runtime.toast('Ez az épület már nem fejleszthető a Céhen keresztül.');
        return;
      }
      runtime.applyChoice(runtime.P, o, false);
      runtime.toast(`Mesterek Céhe: ${runtime.BUILDINGS[o.id].name} → L${runtime.levelOf(runtime.P, o.id)}`);
      runtime.finalizeChoiceEvent();
      return;
    }
    return oldChooseV4941(o, index);
  };
  function giveRandomMasterUpgrade(c) {
    const pool = mastersEligible(c);
    if (!pool.length) return false;
    const option = runtime.pick(pool);
    runtime.applyChoice(c, option, false);
    if (c === runtime.P) runtime.toast(`Mesterek Céhe: ${runtime.BUILDINGS[option.id].name} → L${runtime.levelOf(c, option.id)}`);
    return true;
  }
  function triggerMasterChoice(c) {
    if (c === runtime.P) {
      runtime.queueChoice(MASTERS_CHOICE);
      return true;
    }
    if (runtime.MP.enabled && runtime.MP.role === 'host') {
      runtime.grantEnemyPick(MASTERS_CHOICE);
      return true;
    }
    return giveRandomMasterUpgrade(c);
  }
  function updateMastersGuild(c, dt) {
    const b = runtime.buildingOf(c, MASTERS)[0];
    if (!b) {
      c.mastersGuildProgress = 0;
      return;
    }
    const interval = mastersInterval(c);
    c.mastersGuildProgress = Math.min(interval, (c.mastersGuildProgress || 0) + dt);
    if (c.mastersGuildProgress + 1e-6 < interval) return;
    if (!mastersEligible(c).length) {
      c.mastersGuildProgress = interval;
      return;
    }
    c.mastersGuildProgress = 0;
    if (b.level >= 4 && runtime.hasBranch(c, MASTERS, MASTER_CHOICE_BRANCH)) triggerMasterChoice(c);else giveRandomMasterUpgrade(c);
  }
  const oldTickV4941 = runtime.tick;
  runtime.tick = function (dt) {
    const before = runtime.state.time;
    const out = oldTickV4941(dt);
    const advanced = Math.max(0, runtime.state.time - before);
    if (advanced > 0 && !runtime.state.ended) {
      updateMastersGuild(runtime.P, advanced);
      updateMastersGuild(runtime.E, advanced);
    }
    return out;
  };
  const oldRowsV4941 = runtime.buildingEffectRows;
  runtime.buildingEffectRows = function (c, b) {
    if (b.type === LIBRARY) {
      const free = libraryFreePerChoice(c),
        rows = [['Ingyen reroll / választás', `${free}`]];
      if (runtime.hasBranch(c, LIBRARY, LIB_FORBIDDEN)) rows.push(['Tiltott tudás', 'kitiltáskor előbb +1 stack'], ['Extra kitiltás', '+5']);
      if (runtime.hasBranch(c, LIBRARY, LIB_FEVER)) rows.push(['Kutatási láz', `+${researchStacks(c)}% termelés és gyártás`], ['Felhasznált reroll', `${researchStacks(c)} / 40`]);
      return rows;
    }
    if (b.type === MASTERS) {
      const interval = mastersInterval(c),
        progress = Math.min(interval, c.mastersGuildProgress || 0),
        left = Math.max(0, Math.ceil(interval - progress));
      return [['Fejlesztési idő', `${interval} mp`], ['Következő fejlesztés', mastersEligible(c).length ? `${left} mp` : 'VÁRAKOZIK · nincs L1/L2 célpont'], ['Max célpont', 'L3'], ['L4 mód', runtime.hasBranch(c, MASTERS, MASTER_CHOICE_BRANCH) ? 'választás' : runtime.hasBranch(c, MASTERS, MASTER_FAST_BRANCH) ? '90 mp-es véletlen' : 'véletlen']];
    }
    return oldRowsV4941(c, b);
  };
  runtime.updateChoiceTools = function () {
    const c = runtime.state.choiceContext;
    if (!c) return;
    const free = Math.max(0, c.freeRerolls || 0),
      canReroll = free > 0 || runtime.P.rerolls > 0;
    const canBan = c.tier === 'common' && c.opts.some(o => o.kind === 'normal') && runtime.P.bans > 0;
    const rerollBtn = runtime.$('#rerollChoice'),
      banBtn = runtime.$('#banChoice'),
      skipBtn = runtime.$('#skipChoice');
    if (rerollBtn) {
      rerollBtn.disabled = !canReroll;
      rerollBtn.innerHTML = '<span class="dockIcon" aria-hidden="true"><svg class="rerollSvg" viewBox="0 0 40 40" aria-hidden="true"><path d="M8.5 18.5A12.5 12.5 0 0 1 29 9.5"/><path d="M28.8 5.7l1.1 7.1-7.1-1.1"/><path d="M31.5 21.5A12.5 12.5 0 0 1 11 30.5"/><path d="M11.2 34.3l-1.1-7.1 7.1 1.1"/></svg></span><span class="dockCount">' + runtime.P.rerolls + (c.freeRerollsMax ? '<small class="freeRerolls">(+' + free + ')</small>' : '') + '</span>';
      rerollBtn.title = `Újrasorsolás · ${runtime.P.rerolls} normál${c.freeRerollsMax ? ` · ${free} ingyenes` : ''}`;
    }
    if (banBtn) {
      banBtn.disabled = !canBan;
      banBtn.classList.toggle('active', runtime.state.banMode);
      banBtn.innerHTML = '<span class="dockIcon" aria-hidden="true">⊘</span><span class="dockCount">' + runtime.P.bans + '</span>';
      banBtn.title = runtime.state.banMode ? `Kitiltási mód aktív · ${runtime.P.bans}` : `Kitiltás · ${runtime.P.bans}`;
    }
    if (skipBtn) {
      skipBtn.disabled = false;
      skipBtn.title = 'Kihagyás';
    }
    runtime.$('#choiceTokens').innerHTML = `↻ <b>${runtime.P.rerolls}</b>${c.freeRerollsMax ? ` (+${free})` : ''} újrasorsolás · ⊘ <b>${runtime.P.bans}</b> kitiltás`;
    runtime.$('#choiceBanHint').textContent = runtime.state.banMode ? 'Kattints egy halmozható fejlesztésre. Erre a menetre végleg eltűnik.' : '';
  };
  const style = document.createElement('style');
  style.textContent = "@import url(\"" + (assetUrl("styles/features/city-library-and-guild-18.css") + "\");");
  document.head.appendChild(style);
  for (const c of [runtime.P, runtime.E]) {
    c.libraryResearchRerolls = c.libraryResearchRerolls || 0;
    c.mastersGuildProgress = c.mastersGuildProgress || 0;
  }
  if (runtime.MP?.lobby) {
    const ver = runtime.MP.lobby.querySelector('.menuVersion');
    if (ver) ver.textContent = 'V4.9.41 · P2P';
  }
  window.__ROADLORDS_VERSION__ = '4.9.41-library-masters-guild';
}
