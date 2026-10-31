import { ORC_REDESIGN } from '../data/faction-redesign.js';
import { SPEAR_VOLLEY_RANGE, WARG_THROW_RANGE } from '../data/ranged-balance.js';
import { assetUrl } from '../assets/urls.js';
export function initializeFactionsOrcCapital(runtime) {
  const O = window.__ROADLORDS_ORCS__,
    isOrc = O.isOrc;
  const keepBranches = [{
    id: 'orc_conquest',
    name: 'Örök hódítás',
    icon: '⚔',
    description: 'A kapu végleg nyitva marad. +100% katonai képzési sebesség és élelemtermelés.'
  }, {
    id: 'orc_command',
    name: 'Hadúr parancsa',
    icon: '♜',
    description: 'Zárt kapunál is jár a Vadászház és a Fosztogatótábor kapubónusza. +100% helyőrségi férőhely.'
  }];
  O.keepBranches = keepBranches;
  const oldLexicon = O.lexiconLevels;
  O.lexiconLevels = function (type) {
    if (type !== 'keep') return oldLexicon(type);
    const rows = [['Fa, kő és élelem / mp', [1, 2, 4, 8]], ['Tároló / nyersanyag', [200, 200, 400, 800]], ['Életerő', [20000, 40000, 80000, 160000]], ['Sereglimit', [50, 100, 200, 400]], ['Kiengedett egység / mp', [5, 10, 20, 40]]];
    return `<div class="rlUpgradeBlock"><strong>ALAPÉRTÉKEK SZINTENKÉNT</strong><table class="orcLevelTable"><thead><tr><th>Hatás</th>${[1, 2, 3, 4].map(n => `<th>${n}. szint</th>`).join('')}</tr></thead><tbody>${rows.map(([name, values]) => `<tr><td>${name}</td>${values.map(v => `<td>${v}</td>`).join('')}</tr>`).join('')}</tbody></table><strong>4. SZINT · VÁLASSZ EGYET</strong>${keepBranches.map(b => `<div class="rlBranch"><b>${b.name}</b><br>${b.description}</div>`).join('')}</div>`;
  };
  runtime.V4_BRANCHES.orc_war = [{
    id: 'blood_brothers',
    name: 'Vértestvérek',
    icon: '⚔',
    description: 'Képzésenként 2 Harcos érkezik, fejenként teljes áron. A Harcosok életereje 30%-kal csökken.'
  }, {
    id: 'meat_shield',
    name: 'Húspajzs',
    icon: '♜',
    description: 'A Harcosok +100% életerőt és −30% sebzést kapnak. A támadni képes ellenségek elsősorban őket célozzák.'
  }];
  runtime.V4_BRANCHES.orc_warg = [{
    id: 'spear_rain',
    name: 'Lándzsazápor',
    icon: '➶',
    description: 'A nyitó lándzsa sebzése megduplázódik: 60 → 120. Ha megöli a célpontot, azonnal újabb lándzsát dob egy hatótávon belüli ellenségre. A sorozat addig tart, amíg minden dobás öl.'
  }, {
    id: 'pack',
    name: 'Csordaszellem',
    icon: '🐺',
    description: 'Minden másik Warglovas 82,5 távolságon belül +2% támadási és mozgási sebességet ad. Nincs felső korlát.'
  }];
  runtime.V4_BRANCHES.orc_ram = [{
    id: 'crusher',
    name: 'Zúzógép',
    icon: '⚒',
    description: 'Egységek elleni sebzés: 8 → 56. Az épületek elleni sebzés változatlan.'
  }, {
    id: 'rush',
    name: 'Őrült roham',
    icon: '➜',
    description: 'A Faltörő kos háromszor gyorsabban mozog: 20 → 60.'
  }];
  const oldPool = runtime.buildingUpgradePool;
  runtime.buildingUpgradePool = function (c) {
    const pool = oldPool(c);
    if (!isOrc(c) || runtime.levelOf(c, 'keep') !== 3) return pool;
    return [...pool.filter(x => x.id !== 'keep'), ...keepBranches.map(x => ({
      ...x,
      kind: 'building_branch',
      id: 'keep',
      branch: x.id,
      level: 4,
      details: 'Ork főépület · 4. szint'
    }))];
  };
  const oldDetails = runtime.buildingUpgradeDetails;
  runtime.buildingUpgradeDetails = (c, type) => isOrc(c) && type === 'keep' && runtime.levelOf(c, type) === 3 ? 'Válassz: Örök hódítás vagy Hadúr parancsa.' : oldDetails(c, type);
  const conquest = c => isOrc(c) && runtime.hasBranch(c, 'keep', 'orc_conquest');
  const oldGate = runtime.gateActuallyOpen;
  runtime.gateActuallyOpen = c => conquest(c) || oldGate(c);
  const oldSetGate = runtime.setGate;
  runtime.setGate = mode => oldSetGate(conquest(runtime.P) ? 'open' : mode);
  const oldEnemyGate = runtime.enemyGateAI;
  runtime.enemyGateAI = function () {
    if (conquest(runtime.E)) {
      runtime.E.gateMode = 'open';
      runtime.E.autoReleasing = false;
      return;
    }
    return oldEnemyGate();
  };
  const oldRecompute = runtime.recomputeCity;
  runtime.recomputeCity = function (c, preserve = true) {
    const out = oldRecompute(c, preserve);
    if (isOrc(c) && runtime.hasBranch(c, 'keep', 'orc_command')) { c.garrisonCap *= 2; c.maxHp *= 2; c.hp *= 2; }
    if (conquest(c)) {
      c.gateMode = 'open';
      c.autoReleasing = false;
    }
    return out;
  };
  const oldRates = runtime.productionRates;
  runtime.productionRates = function (c) {
    const r = oldRates(c);
    if (conquest(c)) r.food *= 2;
    return r;
  };
  const oldTime = runtime.trainingTime;
  runtime.trainingTime = (c, b) => oldTime(c, b) / (conquest(c) && runtime.BUILDINGS[b.type]?.unit ? 2 : 1);
  const oldBatch = runtime.productionBatchSize;
  runtime.productionBatchSize = (c, b) => isOrc(c) && b.type === 'orc_war' && runtime.hasBranch(c, b.type, 'blood_brothers') ? 2 : oldBatch(c, b);
  const oldCost = runtime.primarySpawnCost;
  runtime.primarySpawnCost = function (c, key, b) {
    const co = oldCost(c, key, b);
    return isOrc(c) && b?.type === 'orc_war' && runtime.hasBranch(c, b.type, 'blood_brothers') ? runtime.C(co.wood * 2, co.stone * 2, co.food * 2) : co;
  };
  const oldStats = runtime.statsFor;
  runtime.statsFor = function (c, e) {
    const s = oldStats(c, e);
    if (!isOrc(c)) return s;
    if (e.key === 'orc_warrior') {
      if (runtime.hasBranch(c, 'orc_war', 'blood_brothers')) s.hp *= .7;
      if (runtime.hasBranch(c, 'orc_war', 'meat_shield')) {
        s.hp *= 2;
        s.dmg *= .7;
        s.buildingDamage *= .7;
      }
    }
    if (e.key === 'orc_ram') {
      if (runtime.hasBranch(c, 'orc_ram', 'crusher')) s.dmg *= 7;
      if (runtime.hasBranch(c, 'orc_ram', 'rush')) s.speed *= 3;
    }
    return s;
  };
  function tauntTarget(u, list, range) {
    let best = null,
      dist = Infinity;
    for (const t of runtime.battleCandidates(list, u.lane, range)) {
      const d = runtime.roadDistance(t, u);
      if (t.alive && t.side !== u.side && d <= range && t.key === 'orc_warrior' && runtime.hasBranch(runtime.cityForSide(t.side), 'orc_war', 'meat_shield') && d < dist) {
        best = t;
        dist = d;
      }
    }
    return best;
  }
  const oldTarget = runtime.preferredTarget;
  runtime.preferredTarget = (u, opps) => tauntTarget(u, opps, u.spearVolleyReady ? Math.max(u.range, SPEAR_VOLLEY_RANGE) : u.range) || oldTarget(u, opps);
  function spearTarget(u) {
    const enemies = runtime.state.units.filter(t => t.alive && t.side !== u.side);
    return tauntTarget(u, enemies, WARG_THROW_RANGE) || enemies.filter(t => runtime.roadDistance(t, u) <= WARG_THROW_RANGE).sort((a, b) => runtime.roadDistance(a, u) - runtime.roadDistance(b, u))[0];
  }
  const oldAttack = runtime.attackUnit;
  runtime.attackUnit = function (u, t, opts = {}) {
    if (u?.key !== 'orc_warg' || !u.orcSpearReady || !runtime.hasBranch(runtime.cityForSide(u.side), 'orc_warg', 'spear_rain')) return oldAttack(u, t, opts);
    const previous = u.orcSpearRainActive;
    u.orcSpearRainActive = true;
    try {
      let target = t;
      while (u.alive && target?.alive) {
        u.orcSpearReady = true;
        oldAttack(u, target, {
          ...opts,
          mult: (opts.mult || 1) * 2
        });
        u.orcSpearReady = false;
        if (target.alive) break;
        target = spearTarget(u);
      }
    } finally {
      u.orcSpearRainActive = previous;
    }
  };
  const oldStructure = runtime.attackStructure;
  runtime.attackStructure = function (u, t) {
    const empowered = u.key === 'orc_warg' && u.orcSpearReady && runtime.hasBranch(runtime.cityForSide(u.side), 'orc_warg', 'spear_rain'),
      damage = u.damage;
    if (empowered) u.damage *= 2;
    try {
      return oldStructure(u, t);
    } finally {
      u.damage = damage;
    }
  };
  const oldBefore = runtime.orcBeforeCombat13;
  runtime.orcBeforeCombat13 = function (u, opps, dt) {
    if (u.key === 'orc_warg' && u.orcSpearReady && u.cooldown <= 0 && u.alive) {
      const t = tauntTarget(u, opps, WARG_THROW_RANGE);
      if (t) {
        runtime.attackUnit(u, t);
        u.orcSpearReady = false;
        u.cooldown = u.cooldownTime;
        return;
      }
    }
    return oldBefore(u, opps, dt);
  };
  function updatePacks() {
    for (const u of runtime.state.units) if (u.key === 'orc_warg') u.orcPackMult = 1;
    for (const side of ['player', 'enemy']) {
      if (!runtime.hasBranch(runtime.cityForSide(side), 'orc_warg', 'pack')) continue;
      const list = runtime.state.units.filter(u => u.alive && u.side === side && u.key === 'orc_warg').sort((a, b) => a.lane - b.lane);
      let left = 0,
        right = 0;
      for (let i = 0; i < list.length; i++) {
        while (list[left].lane < list[i].lane - 82.5) left++;
        while (right < list.length && list[right].lane <= list[i].lane + 82.5) right++;
        list[i].orcPackMult = 1 + ORC_REDESIGN.pack * (right - left - 1);
      }
    }
  }
  const oldBattle = runtime.updateBattle;
  runtime.updateBattle = function (dt) {
    updatePacks();
    return oldBattle(dt);
  };
  const oldSpeed = runtime.effectiveMoveSpeed;
  runtime.effectiveMoveSpeed = (u, c) => oldSpeed(u, c) * (u.orcPackMult || 1);
  const oldAttackSpeed = runtime.orcAttackSpeedMult13;
  runtime.orcAttackSpeedMult13 = u => oldAttackSpeed(u) * (u.orcPackMult || 1);
  const oldRows = runtime.buildingEffectRows;
  runtime.buildingEffectRows = function (c, b) {
    let rows = oldRows(c, b);
    if (isOrc(c) && b.type === 'keep' && b.level === 4) rows.push(['Specializáció', conquest(c) ? 'Örök hódítás' : 'Hadúr parancsa'], ...(conquest(c) ? [['Kapu', 'Végleg nyitva'], ['Katonai képzés', '×2 sebesség'], ['Élelemtermelés', '×2']] : [['Nyitottkapu-bónuszok', 'Mindig aktívak'], ['Helyőrség', '×2 kapacitás']]));
    if (b.type === 'orc_war' && b.level === 4) rows.push(['Képzésenként', runtime.hasBranch(c, b.type, 'blood_brothers') ? '2 Harcos · kétszeres költség' : '1 Harcos'], ['Harcos', runtime.hasBranch(c, b.type, 'blood_brothers') ? '−30% életerő' : '+100% életerő · −30% sebzés']);
    return rows;
  };
  O.updatePacks = updatePacks;
  Object.assign(window.__ROADLORDS__, {
    buildingUpgradePool: runtime.buildingUpgradePool,
    buildingUpgradeDetails: runtime.buildingUpgradeDetails,
    recomputeCity: runtime.recomputeCity,
    productionRates: runtime.productionRates,
    trainingTime: runtime.trainingTime,
    productionBatchSize: runtime.productionBatchSize,
    primarySpawnCost: runtime.primarySpawnCost,
    statsFor: runtime.statsFor,
    preferredTarget: runtime.preferredTarget,
    updateBattle: runtime.updateBattle,
    buildingEffectRows: runtime.buildingEffectRows
  });
}
