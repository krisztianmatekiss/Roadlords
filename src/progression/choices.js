import { assetUrl } from '../assets/urls.js';
export function register(runtime) {
  runtime.choiceUnitArt = function choiceUnitArt(o) {
    const key = runtime.PICK_UNIT_IMAGES[o.id],
      src = runtime.PICK_IMAGES[o.id];
    return key ? runtime.unitImageTag(key, 'choiceUnitImage') : src ? `<img class="choiceUnitImage" src="${src}" alt="${o.name}" draggable="false">` : `<span class="chicon">${o.icon}</span>`;
  };
  runtime.countNormal = function countNormal(c, id) {
    return c.normal[id] || 0;
  };
  runtime.hasLeg = function hasLeg(c, id) {
    return c.legends.has(id);
  };
  runtime.levelOf = function levelOf(c, type) {
    return c.levels[type] || 1;
  };
  runtime.normalizedRotation = function normalizedRotation(type, rotation = 0) {
    const opts = runtime.rotationOptions(type);
    return opts.includes(rotation) ? rotation : opts[0];
  };
  runtime.eligibleNormal = function eligibleNormal(c) {
    return runtime.NORMAL.filter(x => x.eligible(c) && !c.banned.has(x.id));
  };
  runtime.eligibleLegendary = function eligibleLegendary(c) {
    return runtime.LEGENDARY.filter(x => !c.legends.has(x.id) && x.eligible(c));
  };
  runtime.makeBuildingChoice = function makeBuildingChoice(c, k) {
    const d = runtime.BUILDINGS[k];
    return {
      kind: 'building',
      id: k,
      icon: d.icon,
      name: d.name,
      description: d.description,
      details: runtime.buildingChoiceDetails(c, k)
    };
  };
  runtime.choicePoolFor = function choicePoolFor(c, source, legendary) {
    if (source === 'start') return runtime.startBuildingPool(c);
    if (legendary) return runtime.eligibleLegendary(c).map(o => ({
      ...o,
      kind: 'legendary'
    }));
    return runtime.regularPool(c);
  };
  runtime.queueChoice = function queueChoice(source = 'timer') {
    runtime.state.pendingChoices.push(source);
    if (!runtime.state.modal) runtime.showChoice();
  };
  runtime.armChoiceInputGuard = function armChoiceInputGuard(c) {
    const signature = c.opts.map(runtime.choiceKey).join('|');
    if (runtime.pickInputGuard.context === c && runtime.pickInputGuard.options === c.opts && runtime.pickInputGuard.signature === signature && runtime.pickInputGuard.remaining === c.remaining) return;
    Object.assign(runtime.pickInputGuard, {
      context: c,
      options: c.opts,
      signature,
      remaining: c.remaining,
      armedAt: performance.now()
    });
    runtime.pickInputGuard.until = runtime.pickInputGuard.armedAt + runtime.PICK_INPUT_GUARD_MS;
  };
  runtime.baseRandomLegendaryChance = function baseRandomLegendaryChance(c) {
    return .03 * (runtime.hasLeg(c, 'wide_choice') ? 2 : 1);
  };
  runtime.choiceShouldBeLegendary = function choiceShouldBeLegendary(c, source, forceNormal = false) {
    if (forceNormal || source === 'start' || source === 'ancient') return false;
    const next = c.pickCount + 1;
    if (next % 10 === 0) return true;
    return Math.random() < runtime.baseRandomLegendaryChance(c);
  };
  runtime.branchOf = function branchOf(c, type) {
    return c.l4Branches?.[type] || null;
  };
  runtime.hasBranch = function hasBranch(c, type, id) {
    return runtime.levelOf(c, type) >= 4 && runtime.branchOf(c, type) === id;
  };
  runtime.choiceCount = function choiceCount(c) {
    return 4 + (runtime.hasLeg(c, 'wide_choice') ? 1 : 0) + (runtime.hasBranch(c, 'keep', 'empire') ? 1 : 0);
  };
  runtime.setBuildingLevel = function setBuildingLevel(c, type, target, branch = null) {
    target = runtime.clamp(target, 1, 4);
    if (!runtime.hasBuilding(c, type)) return false;
    c.levels[type] = target;
    if (target === 4 && branch) c.l4Branches[type] = branch;
    for (const b of c.buildings) if (b.type === type) b.level = target;
    runtime.recomputeCity(c, true);
    runtime.refreshExistingUnitsForCity(c);
    return true;
  };
  runtime.upgradeBuildingType = function upgradeBuildingType(c, type, branch = null) {
    const current = runtime.levelOf(c, type);
    if (current >= 4 || !runtime.hasBuilding(c, type)) return false;
    return runtime.setBuildingLevel(c, type, current + 1, branch);
  };
  runtime.upgradeTargetLevel = function upgradeTargetLevel(c, type) {
    const from = runtime.levelOf(c, type);
    return runtime.hasLeg(c, 'instant_l3') && from < 3 ? Math.min(3, from + 2) : Math.min(4, from + 1);
  };
  runtime.v4UpgradeDescription = function v4UpgradeDescription(c, type, branch = null) {
    const from = runtime.levelOf(c, type),
      d = runtime.BUILDINGS[type];
    if (from === 3 && branch) {
      const opt = (runtime.V4_BRANCHES[type] || []).find(x => x.id === branch);
      return `Minden jelenlegi és későbbi ${d.name} L4 lesz.<br><b>${opt?.name || ''}</b>: ${opt?.description || ''}`;
    }
    return runtime.buildingUpgradeDetails(c, type);
  };
  runtime.buildingUpgradePool = function buildingUpgradePool(c) {
    const out = [];
    for (const type of Object.keys(runtime.BUILDINGS)) {
      if (!runtime.hasBuilding(c, type) || runtime.levelOf(c, type) >= 4) continue;
      const lv = runtime.levelOf(c, type),
        d = runtime.BUILDINGS[type];
      if (lv === 3 && runtime.V4_BRANCHES[type]) {
        for (const opt of runtime.V4_BRANCHES[type]) out.push({
          kind: 'building_branch',
          id: type,
          branch: opt.id,
          level: 4,
          icon: opt.icon,
          name: opt.name,
          description: opt.description,
          details: `${d.name} · L4 specializáció`
        });
      } else out.push({
        kind: 'building_upgrade',
        id: type,
        level: lv + 1,
        icon: d.icon,
        name: `${d.name} ${lv + 1 === 2 ? 'II' : lv + 1 === 3 ? 'III' : 'IV'}`,
        description: 'Az egész épülettípus technológiai szintet lép.',
        details: runtime.v4UpgradeDescription(c, type)
      });
    }
    return out;
  };
  runtime.pickPoolFor = function pickPoolFor(c, source, tier, subtype) {
    if (source === 'start') return runtime.buildingUnlockPool(c);
    if (tier === 'legendary') return runtime.eligibleLegendary(c).map(o => ({
      ...o,
      kind: 'legendary'
    }));
    if (tier === 'common') return runtime.eligibleNormal(c).map(o => ({
      ...o,
      kind: 'normal'
    }));
    return subtype === 'upgrade' ? runtime.buildingUpgradePool(c) : runtime.buildingUnlockPool(c);
  };
  runtime.makeChoiceOptions = function makeChoiceOptions(c, source, tier = 'common', subtype = null, exclude = []) {
    if (typeof tier === 'boolean') tier = tier ? 'legendary' : 'common';
    const count = runtime.choiceCount(c);
    if (tier === 'rare') subtype = runtime.chooseRareSubtype(c, subtype, count);
    let pool = runtime.pickPoolFor(c, source, tier, subtype),
      blocked = new Set(exclude),
      fresh = pool.filter(o => !blocked.has(runtime.choiceKey(o)));
    if (!fresh.length) fresh = pool;
    let result = runtime.shuffle(fresh).slice(0, count);
    if (tier === 'rare' && subtype === 'upgrade') {
      const branched = runtime.shuffle([...new Set(fresh.filter(x => x.kind === 'building_branch').map(x => x.id))])[0];
      if (branched) {
        const pair = fresh.filter(x => x.id === branched && x.kind === 'building_branch');
        result = [...pair, ...result.filter(x => x.id !== branched)].slice(0, count);
      }
    }
    return result;
  };
  runtime.rollPickTier = function rollPickTier(c, source) {
    if (source === 'start') return {
      tier: 'rare',
      subtype: 'unlock'
    };
    if (source === 'ancient') return {
      tier: 'common',
      subtype: null
    };
    const legendaryChance = runtime.hasLeg(c, 'wide_choice') ? .10 : .05;
    let tier = (c.legendaryDrought || 0) >= 10 ? 'legendary' : Math.random() < legendaryChance ? 'legendary' : Math.random() < .25 / (1 - legendaryChance) ? 'rare' : 'common';
    if (tier === 'legendary' && !runtime.eligibleLegendary(c).length) tier = runtime.buildingUnlockPool(c).length || runtime.buildingUpgradePool(c).length ? 'rare' : 'common';
    if (tier === 'rare' && !runtime.buildingUnlockPool(c).length && !runtime.buildingUpgradePool(c).length) tier = 'common';
    if (tier === 'legendary') c.legendaryDrought = 0;else c.legendaryDrought = (c.legendaryDrought || 0) + 1;
    return {
      tier,
      subtype: tier === 'rare' ? runtime.chooseRareSubtype(c, null, runtime.choiceCount(c)) : null
    };
  };
  runtime.normalSpawn = function normalSpawn(c, b) {
    const key = runtime.effectiveUnitKey(c, b),
      batch = runtime.productionBatchSize(c, b),
      co = runtime.primarySpawnCost(c, key, b);
    if (runtime.productionRoomFor(c, b) < batch || !runtime.canPay(c, co)) return false;
    runtime.pay(c, co);
    runtime.recordResourceSpend38(c, co);
    for (let i = 0; i < batch; i++) {
      const e = runtime.makeEntry(c, key, {
        originBuildingId: b.id
      });
      runtime.queueProduced(c, e, b);
      runtime.duplicateByWarcenter(c, b, e);
    }
    c.spawnCounter++;
    if (runtime.hasLeg(c, 'every10') && c.spawnCounter % 10 === 0) runtime.queueProduced(c, runtime.makeEntry(c, key, {
      originBuildingId: b.id
    }), b);
    if (runtime.hasLeg(c, 'chain_spawn') && Math.random() < .25) {
      const others = runtime.activeSpawners(c).filter(x => x.id !== b.id);
      if (others.length) {
        const x = runtime.pick(others),
          k = runtime.effectiveUnitKey(c, x);
        runtime.queueProduced(c, runtime.makeEntry(c, k, {
          originBuildingId: x.id
        }), x);
      }
    }
    if (runtime.hasLeg(c, 'factory_network')) for (const nb of runtime.adjacentBuildings(c, b)) if (runtime.BUILDINGS[nb.type]?.unit) nb.progress = Math.min(1, (nb.progress || 0) + .15);
    return true;
  };
  runtime.choiceKey = function choiceKey(o) {
    return `${o.kind}:${o.id || o.name}:${o.level || ''}:${o.branch || ''}`;
  };
  runtime.buildingUpgradeDetails = function buildingUpgradeDetails(c, type) {
    const from = runtime.levelOf(c, type),
      to = Math.min(4, from + 1),
      d = runtime.BUILDINGS[type];
    if (from === 3) {
      if (runtime.V4_SIMPLE_L4.has(type)) {
        const labels = {
          lumber: 'Termelés: 3 → 6 Fa/mp',
          stonecutter: 'Termelés: 3 → 6 Kő/mp',
          farm: 'Termelés: 3 → 6 Élelem/mp',
          warehouse: 'Kapacitás: +600 → +1500',
          house: 'Úti sereglimit: +20 → +40'
        };
        return `Minden jelenlegi és későbbi ${d.name} L4 lesz.<br><b>${labels[type]}</b>`;
      }
      return 'Megnyitja a két választható L4 specializációt.';
    }
    let change = '';
    if (d.unit) change = `Gyártás: <b>${runtime.previewTrainingTime(c, type, from).toFixed(1)} → ${runtime.previewTrainingTime(c, type, to).toFixed(1)} mp</b>`;else if (['lumber', 'stonecutter', 'farm'].includes(type)) change = `Termelés: <b>${runtime.v4LevelValue(from, [1, 2, 3, 6])} → ${runtime.v4LevelValue(to, [1, 2, 3, 6])} /mp</b>`;else if (type === 'warehouse') change = `Kapacitás: <b>+${runtime.v4LevelValue(from, [150, 300, 600, 1500])} → +${runtime.v4LevelValue(to, [150, 300, 600, 1500])}</b>`;else if (type === 'house') change = `Úti sereglimit: <b>+${runtime.v4LevelValue(from, [10, 15, 20, 40])} → +${runtime.v4LevelValue(to, [10, 15, 20, 40])}</b>`;else if (type === 'keep') change = `Főváros HP: <b>${runtime.v4LevelValue(from, [20000, 40000, 80000, 160000])} → ${runtime.v4LevelValue(to, [20000, 40000, 80000, 160000])}</b><br>Alaptermelés: <b>+${runtime.v4LevelValue(from, [1, 2, 4, 8])} → +${runtime.v4LevelValue(to, [1, 2, 4, 8])} /mp</b><br>Sereglimit: <b>${runtime.v4LevelValue(from, [50, 100, 200, 400])} → ${runtime.v4LevelValue(to, [50, 100, 200, 400])}</b>`;
    return `Minden jelenlegi és későbbi ${d.name} L${to} lesz.<br>${change}`;
  };
  runtime.buildingChoiceDetails = function buildingChoiceDetails(c, type) {
    const d = runtime.BUILDINGS[type],
      lv = runtime.levelOf(c, type),
      bits = [`Terület: <b>${runtime.footprintText(type)}</b>`];
    if (d.unit) {
      const u = runtime.UNITS[d.unit];
      bits.push(`${u.icon} ${u.name} · gyártás <b>${runtime.previewTrainingTime(c, type, lv).toFixed(1)} mp</b>`);
      bits.push(`egységköltség <b>${runtime.costText(runtime.unitCost(c, d.unit))}</b>`);
    } else if (type === 'lumber') bits.push(`Termelés: <b>${runtime.v4LevelValue(lv, [1, 2, 3, 6])} Fa/mp</b>`);else if (type === 'stonecutter') bits.push(`Termelés: <b>${runtime.v4LevelValue(lv, [1, 2, 3, 6])} Kő/mp</b>`);else if (type === 'farm') bits.push(`Termelés: <b>${runtime.v4LevelValue(lv, [1, 2, 3, 6])} Élelem/mp</b>`);else if (type === 'house') bits.push(`Úti sereglimit: <b>+${runtime.v4LevelValue(lv, [10, 15, 20, 40])}</b>`);else if (type === 'warcenter') bits.push(`Ingyenes másolat: <b>minden ${runtime.v4LevelValue(lv, [8, 6, 4, 4])}. egység</b>`);
    return bits.join('<br>');
  };
  runtime.choiceContextForPlayer = function choiceContextForPlayer() {
    const source = runtime.state.startChoices > 0 ? 'start' : runtime.state.pendingChoices[0],
      roll = runtime.rollPickTier(runtime.P, source),
      tier = roll.tier,
      subtype = roll.subtype,
      legendary = tier === 'legendary',
      doubleTake = !legendary && source !== 'start' && runtime.hasLeg(runtime.P, 'double_choice') && ((runtime.P.nonLegendaryPicks || 0) + 1) % 3 === 0,
      n = runtime.choiceCount(runtime.P);
    let kicker = source === 'start' ? `KEZDŐ ÉPÜLETVÁLASZTÁS · ${5 - runtime.state.startChoices}/4` : source === 'ancient' ? 'ŐSI ROM · GYAKORI JUTALOM' : source === 'tower' ? `TORONYJUTALOM · ${runtime.rarityLabel(tier, subtype)}` : runtime.rarityLabel(tier, subtype),
      title = source === 'start' ? 'Válassz egy épületet' : legendary ? 'Válassz legendás ereklyét' : tier === 'rare' ? subtype === 'upgrade' ? 'Válassz épületfejlesztést' : 'Válassz új épületet' : 'Válassz fejlesztést';
    if (doubleTake) title = 'Válassz KÉT fejlesztést';
    const desc = source === 'start' ? 'A játékidő még nem fut. Az első négy választás csak új épületet old fel.' : source === 'ancient' ? 'Az ősi rom jutalma mindig gyakori fejlesztés.' : legendary ? '5% alap esély; tíz legendás nélküli alkalom után a következő garantált.' : tier === 'rare' ? subtype === 'upgrade' ? `Mind a(z) ${n} lap meglévő épülettípust fejleszt.` : `Mind a(z) ${n} lap új épületet old fel.` : `Mind a(z) ${n} lap halmozható, kisebb fejlesztés.`;
    return {
      source,
      tier,
      subtype,
      legendary,
      doubleTake,
      remaining: doubleTake ? 2 : 1,
      kicker,
      title,
      desc,
      opts: runtime.makeChoiceOptions(runtime.P, source, tier, subtype)
    };
  };
  runtime.rerollCurrentChoice = function rerollCurrentChoice() {
    const c = runtime.state.choiceContext;
    if (!c || runtime.P.rerolls <= 0) return;
    runtime.P.rerolls--;
    runtime.state.banMode = false;
    const old = c.opts.map(runtime.choiceKey);
    c.opts = runtime.makeChoiceOptions(runtime.P, c.source, c.tier, c.subtype, old);
    runtime.renderChoiceContext();
    runtime.toast('Újrasorsolás felhasználva.');
  };
  runtime.banChoiceAt = function banChoiceAt(i) {
    const c = runtime.state.choiceContext,
      o = c?.opts?.[i];
    if (!o || c.tier !== 'common' || o.kind !== 'normal') {
      runtime.toast('Csak gyakori fejlesztést lehet kitiltani.');
      return;
    }
    if (runtime.P.bans <= 0) return;
    runtime.P.bans--;
    runtime.P.banned.add(o.id);
    const used = c.opts.filter((_, j) => j !== i).map(runtime.choiceKey),
      replacement = runtime.makeChoiceOptions(runtime.P, c.source, c.tier, c.subtype, used).find(x => !used.includes(runtime.choiceKey(x)));
    if (replacement) c.opts[i] = replacement;else c.opts.splice(i, 1);
    runtime.state.banMode = false;
    runtime.renderChoiceContext();
    runtime.toast(`${o.name} kitiltva erre a menetre.`);
  };
  runtime.timedPick = function timedPick() {
    runtime.queueChoice('timer');
    runtime.grantEnemyPick('timer');
    runtime.state.timedPickCount++;
    const interval = runtime.PICK_BASE_SECONDS * Math.pow(runtime.PICK_GROWTH, runtime.state.timedPickCount);
    runtime.state.nextPick = runtime.hasBranch(runtime.P, 'keep', 'empire') ? interval / 2 : interval;
  };
  runtime.branchLabel = function branchLabel(c, type) {
    const id = runtime.branchOf(c, type),
      opt = (runtime.V4_BRANCHES[type] || []).find(x => x.id === id);
    return opt?.name || '';
  };
  runtime.grantEnemyPick = function grantEnemyPick(source = 'timer', forceNormal = false) {
    let roll = forceNormal ? {
        tier: 'common',
        subtype: null
      } : runtime.rollPickTier(runtime.E, source),
      {
        tier,
        subtype
      } = roll;
    let options = runtime.makeChoiceOptions(runtime.E, source === 'start' ? 'start' : source, tier, subtype);
    if (!options.length) return;
    const scored = arr => arr.map(o => ({
      o,
      score: runtime.scoreAiChoiceV17(o)
    })).sort((a, b) => b.score - a.score);
    if (runtime.E.rerolls > 0 && scored(options)[0].score < 6) {
      const old = options.map(runtime.choiceKey),
        rerolled = runtime.makeChoiceOptions(runtime.E, source, tier, subtype, old);
      if (rerolled.length) {
        options = rerolled;
        runtime.E.rerolls--;
      }
    }
    if (tier === 'common' && runtime.E.bans > 0) {
      const ranked = scored(options);
      if (ranked.at(-1)?.score < 2.2) {
        const bad = ranked.at(-1).o,
          index = options.indexOf(bad);
        runtime.E.banned.add(bad.id);
        runtime.E.bans--;
        const used = options.filter((_, i) => i !== index).map(runtime.choiceKey),
          replacement = runtime.makeChoiceOptions(runtime.E, source, tier, subtype, used).find(x => !used.includes(runtime.choiceKey(x)));
        if (replacement) options[index] = replacement;
      }
    }
    const ordered = scored(options).map(x => x.o),
      doubleTake = tier !== 'legendary' && runtime.hasLeg(runtime.E, 'double_choice') && ((runtime.E.nonLegendaryPicks || 0) + 1) % 3 === 0;
    runtime.applyChoice(runtime.E, ordered[0], true);
    runtime.aiRememberChoice(ordered[0]);
    if (doubleTake && ordered[1]) {
      runtime.applyChoice(runtime.E, ordered[1], false);
      runtime.aiRememberChoice(ordered[1]);
    }
    if (source === 'tower') runtime.message(`Az ellenfél extra választása: ${ordered[0].name}${doubleTake && ordered[1] ? ' + ' + ordered[1].name : ''}`, 2);
  };
  runtime.applyChoice = function applyChoice(c, o, countEvent = true) {
    if (o.kind === 'building') c.unlocked.add(o.id);else if (o.kind === 'building_branch') {
      runtime.setBuildingLevel(c, o.id, 4, o.branch);
      if (c === runtime.P && o.id === 'keep' && o.branch === 'empire') runtime.state.nextPick = Math.max(1, runtime.state.nextPick / 2);
    } else if (o.kind === 'building_upgrade') {
      const cur = runtime.levelOf(c, o.id),
        target = runtime.hasLeg(c, 'instant_l3') && cur < 3 ? Math.min(3, cur + 2) : Math.min(4, cur + 1);
      runtime.setBuildingLevel(c, o.id, target);
    } else if (o.kind === 'normal') {
      const had = c.normal[o.id] || 0,
        bonus = runtime.hasLeg(c, 'specialization') && had >= 1 && Math.random() < .5;
      c.normal[o.id] = had + 1 + (bonus ? 1 : 0);
      if (bonus && c === runtime.P) runtime.flashX2();
      runtime.refreshExistingUnitsForCity(c);
      if (o.id === 'tower_crews') runtime.refreshTowerHpFor(c, runtime.sideForCity(c), true);
    } else {
      c.legends.add(o.id);
      runtime.recomputeCity(c, true);
      runtime.refreshExistingUnitsForCity(c);
    }
    if (countEvent) {
      c.pickCount++;
      if (o.kind !== 'legendary' && runtime.hasLeg(c, 'double_choice')) c.nonLegendaryPicks = (c.nonLegendaryPicks || 0) + 1;
    }
    c.lastPick = o.name;
  };
  runtime.updateDynamicPickHud = function updateDynamicPickHud() {
    const hud = runtime.$('#dynamicPickHud');
    if (!hud) return;
    const states = runtime.dynamicPickStates(runtime.P),
      signature = states.map(s => `${s.icon}|${s.value}|${s.kind}|${s.title}`).join('§');
    if (hud.dataset.signature === signature) return;
    hud.dataset.signature = signature;
    hud.replaceChildren(...states.map(s => {
      const chip = document.createElement('span');
      chip.className = `dynamicPickChip ${s.kind}`;
      chip.title = s.title;
      chip.setAttribute('aria-label', s.title);
      const icon = document.createElement('span');
      icon.className = 'pickIcon';
      icon.textContent = s.icon;
      const value = document.createElement('span');
      value.textContent = s.value;
      chip.append(icon, value);
      return chip;
    }));
  };
  runtime.fmtUpgradeNumberV497 = function fmtUpgradeNumberV497(v, digits = 2) {
    if (Number.isInteger(v)) return String(v);
    return Number(v).toFixed(digits).replace(/0+$/, '').replace(/\.$/, '').replace('.', ',');
  };
  runtime.upgradeArrowV497 = function upgradeArrowV497(label, a, b, suffix = '') {
    return `${label}: <b>${a}${suffix} → ${b}${suffix}</b>`;
  };
}
