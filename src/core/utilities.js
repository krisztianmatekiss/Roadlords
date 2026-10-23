import { assetUrl } from '../assets/urls.js';
import { fitsUnitRoom } from '../economy/unit-capacity.js';
export function register(runtime) {
  runtime.keepCellSet = function keepCellSet() {
    const set = new Set();
    for (const [dr, dc] of runtime.rotatedShape('keep', 0)) set.add(runtime.idx(runtime.CENTER.row + dr, runtime.CENTER.col + dc));
    return set;
  };
  runtime.catAvailable = function catAvailable(c, cat) {
    return c.buildings.some(b => runtime.BUILDINGS[b.type].unit && runtime.UNITS[runtime.BUILDINGS[b.type].unit].cat === cat);
  };
  runtime.idx = function idx(r, c) {
    return r * runtime.GRID + c;
  };
  runtime.orth = function orth(row, col) {
    return [[row - 1, col], [row + 1, col], [row, col - 1], [row, col + 1]].filter(([r, c]) => r >= 0 && c >= 0 && r < runtime.GRID && c < runtime.GRID);
  };
  runtime.typeCount = function typeCount(c) {
    return new Set(c.buildings.map(b => b.type)).size;
  };
  runtime.at = function at(c, row, col) {
    return runtime.occupancy(c).get(runtime.idx(row, col)) || null;
  };
  runtime.buildersDiscount = function buildersDiscount(c) {
    const b = runtime.buildingOf(c, 'builders')[0];
    return b ? [.15, .25, .40][b.level - 1] : 0;
  };
  runtime.pathLineTo = function pathLineTo(x, y, steps = 24) {
    const a = runtime.pathPoints[runtime.pathPoints.length - 1];
    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      runtime.pathPoints.push({
        x: a.x + (x - a.x) * t,
        y: a.y + (y - a.y) * t
      });
    }
  };
  runtime.pathCubicTo = function pathCubicTo(c1x, c1y, c2x, c2y, x, y, steps = 36) {
    const a = runtime.pathPoints[runtime.pathPoints.length - 1];
    for (let i = 1; i <= steps; i++) {
      const t = i / steps,
        u = 1 - t;
      runtime.pathPoints.push({
        x: u * u * u * a.x + 3 * u * u * t * c1x + 3 * u * t * t * c2x + t * t * t * x,
        y: u * u * u * a.y + 3 * u * u * t * c1y + 3 * u * t * t * c2y + t * t * t * y
      });
    }
  };
  runtime.lowestAlly = function lowestAlly(u, allies, range) {
    let best = null,
      bestRatio = Infinity,
      bestOrder = Infinity;
    for (const v of runtime.battleCandidates(allies, u.lane, range)) {
      if (v.id === u.id || !v.alive || runtime.roadDistance(v, u) > range || v.hp >= v.maxHp) continue;
      const ratio = v.hp / v.maxHp,
        order = runtime.battleOrder(v);
      if (ratio < bestRatio || ratio === bestRatio && order < bestOrder) {
        best = v;
        bestRatio = ratio;
        bestOrder = order;
      }
    }
    return best;
  };
  runtime.spark = function spark(lane, text, color) {
    if (runtime.particles.length > 80) runtime.particles.shift();
    const p = runtime.pointAt(lane, -18 + Math.random() * 36);
    runtime.particles.push({
      x: p.x,
      y: p.y,
      text,
      color,
      life: .7
    });
  };
  runtime.regularPool = function regularPool(c) {
    const out = [];
    for (const k of runtime.UNLOCKABLE) if (!c.unlocked.has(k)) out.push(runtime.makeBuildingChoice(c, k));
    out.push(...runtime.buildingUpgradePool(c));
    for (const r of runtime.eligibleNormal(c)) out.push({
      ...r,
      kind: 'normal'
    });
    return out;
  };
  runtime.lClipFor = function lClipFor(type, rotation) {
    if (!runtime.isLShape(type, rotation)) return '';
    const cells = runtime.rotatedShape(type, rotation),
      has = (r, c) => cells.some(x => x[0] === r && x[1] === c);
    if (!has(0, 0)) return 'polygon(50% 0,100% 0,100% 100%,0 100%,0 50%,50% 50%)';
    if (!has(0, 1)) return 'polygon(0 0,50% 0,50% 50%,100% 50%,100% 100%,0 100%)';
    if (!has(1, 0)) return 'polygon(0 0,100% 0,100% 100%,50% 100%,50% 50%,0 50%)';
    return 'polygon(0 0,100% 0,100% 50%,50% 50%,50% 100%,0 100%)';
  };
  runtime.frame = function frame(now) {
    const raw = Math.min(.08, (now - runtime.last) / 1000);
    runtime.last = now;
    const dt = raw * runtime.state.speed;
    runtime.acc += dt;
    runtime.uiAcc += raw;
    const fixed = 1 / 30;
    while (runtime.acc >= fixed) {
      runtime.tick(fixed);
      runtime.acc -= fixed;
    }
    runtime.renderBattle(raw);
    if (runtime.uiAcc >= .15) {
      runtime.uiAcc = 0;
      runtime.updateHud();
      runtime.updateProgress();
      if (Math.floor(runtime.state.time * 2) % 2 === 0) runtime.renderCity(runtime.$('#enemyGrid'), runtime.E, false);
    }
    requestAnimationFrame(runtime.frame);
  };
  runtime.flashX2 = function flashX2() {
    runtime.multFlash.classList.remove('go');
    void runtime.multFlash.offsetWidth;
    runtime.multFlash.classList.add('go');
  };
  runtime.keepProd = function keepProd(c) {
    const keep = runtime.buildingOf(c, 'keep')[0];
    return [1, 2, 4][keep.level - 1];
  };
  runtime.isOwnHalf = function isOwnHalf(u) {
    return u.side === 'player' ? u.lane < runtime.PATH_LENGTH / 2 : u.lane > runtime.PATH_LENGTH / 2;
  };
  runtime.onOverflowStack = function onOverflowStack(c, n = 1) {
    if (n <= 0) return;
    c.overflowStacks = (c.overflowStacks || 0) + n;
    runtime.refreshExistingUnitsForCity(c);
  };
  runtime.openWave = function openWave(c) {
    if (!c.garrison.length) return;
    const n = Math.min(c.garrison.length, runtime.fieldQueueRoom(c));
    if (n <= 0) return;
    let wave = c.garrison.splice(0, n);
    runtime.waveBuffs(c, wave);
    if (runtime.hasLeg(c, 'double_assault')) {
      const room = runtime.fieldQueueRoom(c),
        clones = wave.slice(0, Math.max(0, room - wave.length)).map(e => ({
          ...e,
          tempClone: true,
          cloneAttacksRemaining: 3
        }));
      wave = wave.flatMap((e, i) => clones[i] ? [e, clones[i]] : [e]);
    }
    c.releaseQueue.push(...wave);
  };
  runtime.addImpactFx = function addImpactFx(lane, offset, kind) {
    runtime.combatFx.push({
      kind,
      lane,
      offset: offset || 0,
      life: kind === 'boom' ? .38 : .25,
      side: 'neutral'
    });
  };
  runtime.demolish = function demolish(c, id) {
    const i = c.buildings.findIndex(b => b.id === id && b.type !== 'keep');
    if (i < 0) return false;
    const b = c.buildings[i],
      refund = b.paidCost || runtime.adjustedCost(c, runtime.BUILDINGS[b.type].cost);
    c.buildings.splice(i, 1);
    if (b.type === 'warcenter') for (const sp of runtime.spawnerBuildings(c)) sp.inactive = false;
    runtime.RES.forEach(r => c.resources[r] = Math.min(c.caps[r], c.resources[r] + (refund[r] || 0) * .5));
    runtime.recomputeCity(c, true);
    return true;
  };
  runtime.rarityLabel = function rarityLabel(tier, subtype) {
    return tier === 'legendary' ? 'LEGENDÁS' : tier === 'rare' ? subtype === 'upgrade' ? 'RITKA · ÉPÜLETFEJLESZTÉS' : 'RITKA · ÚJ ÉPÜLETEK' : 'GYAKORI · KIS FEJLESZTÉSEK';
  };
  runtime.v4LevelValue = function v4LevelValue(level, values) {
    return values[Math.min(values.length, Math.max(1, level)) - 1];
  };
  runtime.cellsDistance = function cellsDistance(a, b) {
    let best = 99;
    for (const [ar, ac] of runtime.buildingCells(a)) for (const [br, bc] of runtime.buildingCells(b)) best = Math.min(best, Math.max(Math.abs(ar - br), Math.abs(ac - bc)));
    return best;
  };
  runtime.touchesWall = function touchesWall(b) {
    return runtime.buildingCells(b).some(([r, col]) => r === 0 || col === 0 || r === runtime.GRID - 1 || col === runtime.GRID - 1);
  };
  runtime.guardhouseBonus = function guardhouseBonus(c, target) {
    let total = 0;
    for (const g of runtime.buildingOf(c, 'guardhouse')) {
      const wall = runtime.touchesWall(g),
        rally = runtime.adjacentBuildings(c, g).some(x => x.type === 'rally'),
        applies = target === 'main' ? wall : rally;
      if (!applies) continue;
      total += g.level >= 4 ? 80 : runtime.v4LevelValue(g.level, [20, 30, 45]);
    }
    return total;
  };
  runtime.affectedHouses = function affectedHouses(c) {
    const hall = runtime.buildingOf(c, 'townhall')[0];
    return hall ? runtime.buildingOf(c, 'house').filter(h => runtime.inBuildingRange(hall, h, 2)) : [];
  };
  runtime.guildMultiplier = function guildMultiplier(c, b) {
    const g = runtime.buildingOf(c, 'guildhouse')[0];
    if (!g) return 1;
    const range = runtime.hasBranch(c, 'guildhouse', 'guild_network') ? 3 : 2;
    if (!runtime.inBuildingRange(g, b, range)) return 1;
    return 1 + (runtime.hasBranch(c, 'guildhouse', 'master_guild') ? 1.25 : runtime.hasBranch(c, 'guildhouse', 'guild_network') ? .75 : runtime.v4LevelValue(g.level, [.25, .5, .75, .75]));
  };
  runtime.townMult = function townMult() {
    return 1;
  };
  runtime.warcenterSpeedMult = function warcenterSpeedMult() {
    return 1;
  };
  runtime.extraBarracksTime = function extraBarracksTime(c, b, key) {
    let t = runtime.UNITS[key].train * 1.5 * runtime.v4LevelValue(b.level, [1, .8, .6, .6]);
    if (runtime.hasLeg(c, 'no_food')) t *= 1.25;
    const speed = runtime.trainingSpeedBonus(c, b, key);
    return speed > 0 ? t / speed : Infinity;
  };
  runtime.monoVeteran = function monoVeteran(c) {
    const types = new Set(runtime.activeSpawners(c).map(b => runtime.effectiveUnitKey(c, b)));
    return runtime.hasLeg(c, 'mono_veteran') && types.size === 1 && types.size > 0;
  };
  runtime.makeEntry = function makeEntry(c, key, extra = {}) {
    return {
      key,
      veteran: runtime.monoVeteran(c),
      firstMult: 1,
      firstHits: 0,
      speedMult: 1,
      attackSpeedMult: 1,
      shieldPct: 0,
      tempClone: false,
      tempDuration: 0,
      garrisonCd: 0,
      waitTime: 0,
      ...extra
    };
  };
  runtime.duplicateByWarcenter = function duplicateByWarcenter(c, b, entry) {
    const w = runtime.buildingOf(c, 'warcenter')[0];
    if (!w) return;
    c.warProductionCounter = (c.warProductionCounter || 0) + 1;
    const every = runtime.hasBranch(c, 'warcenter', 'assembly_line') ? 3 : runtime.hasBranch(c, 'warcenter', 'quality_arms') ? 4 : runtime.v4LevelValue(w.level, [8, 6, 4, 4]);
    if (c.warProductionCounter % every === 0) {
      const copy = {
        ...entry,
        veteran: runtime.hasBranch(c, 'warcenter', 'quality_arms') ? true : entry.veteran,
        freeCopy: true
      };
      runtime.queueProduced(c, copy, b);
    }
  };
  runtime.updateExtraBarracks = function updateExtraBarracks(c, b, key, field, dt) {
    const t = runtime.extraBarracksTime(c, b, key);
    if (!Number.isFinite(t) || t <= 0) return;
    b[field] = Math.min(1, (b[field] || 0) + dt / t);
    if (b[field] < 1 || runtime.productionRoomFor(c, b) <= 0) return;
    const co = runtime.unitCost(c, key);
    if (!runtime.canPay(c, co)) return;
    runtime.pay(c, co);
    runtime.recordResourceSpend38(c, co);
    const e = runtime.makeEntry(c, key, {
      originBuildingId: b.id
    });
    runtime.queueProduced(c, e, b);
    runtime.duplicateByWarcenter(c, b, e);
    b[field] -= 1;
  };
  runtime.applyFreeze = function applyFreeze(t) {
    if ((t.freezeImmunity || 0) > 0) {
      t.slowTime = Math.max(t.slowTime || 0, 3);
      t.slowMult = Math.min(t.slowMult || 1, .5);
      return;
    }
    t.stunTime = Math.max(t.stunTime || 0, 1.5);
    t.freezeImmunity = 6;
    t.freezeFollow = 3;
  };
  runtime.choose = function choose(o, index = -1) {
    const c = runtime.state.choiceContext;
    if (!c) return;
    const first = c.remaining === (c.doubleTake ? 2 : 1);
    runtime.applyChoice(runtime.P, o, first);
    if (o.kind === 'building') runtime.toast(`Feloldva: ${runtime.BUILDINGS[o.id].name}`);else if (o.kind === 'building_upgrade' || o.kind === 'building_branch') runtime.toast(`${runtime.BUILDINGS[o.id].name} → L${runtime.levelOf(runtime.P, o.id)} · minden példány`);else if (o.kind === 'legendary') runtime.toast(`Legendás: ${o.name}`);
    c.remaining--;
    if (c.remaining > 0) {
      c.opts = c.opts.filter((x, i) => i !== index && runtime.choiceKey(x) !== runtime.choiceKey(o));
      c.kicker = 'KETTŐS VÁLASZTÁS · MÁSODIK LEHETŐSÉG';
      c.title = 'Válassz még egyet';
      c.desc = 'Ugyanebből a kínálatból még egy külön lehetőséget elvihetsz.';
      runtime.state.banMode = false;
      runtime.renderChoiceContext();
      runtime.renderStatic();
      return;
    }
    runtime.finalizeChoiceEvent();
  };
  runtime.tick = function tick(dt) {
    if (!runtime.state.running || runtime.state.ended || runtime.state.modal) return;
    runtime.state.time += dt;
    runtime.state.nextPick -= dt;
    if (runtime.state.nextPick <= 0) runtime.timedPick();
    runtime.produceResources(runtime.P, dt);
    runtime.produceResources(runtime.E, dt);
    runtime.updateSpawners(runtime.P, dt);
    runtime.updateSpawners(runtime.E, dt);
    runtime.enemyBuildAI(dt);
    runtime.enemyGateAI();
    runtime.releaseQueues(dt);
    runtime.garrisonFire(dt);
    runtime.updateBattle(dt);
    if (runtime.hasLeg(runtime.P, 'regen') || runtime.hasLeg(runtime.E, 'regen')) for (const u of runtime.state.units) if (runtime.hasLeg(runtime.cityForSide(u.side), 'regen')) u.hp = Math.min(u.maxHp, u.hp + u.maxHp * .025 * dt);
    runtime.updateSuddenDeath(dt);
    if (runtime.message._left > 0 && (runtime.message._left -= dt) <= 0) runtime.$('#battleMsg').textContent = '';
  };
  runtime.finish = function finish(win) {
    if (runtime.state.ended) return;
    runtime.state.ended = true;
    runtime.state.running = false;
    runtime.state.modal = true;
    runtime.$('#endIcon').textContent = win ? '♛' : '☠';
    runtime.$('#endTitle').textContent = win ? 'Győzelem!' : 'A főváros elesett';
    runtime.$('#endText').textContent = `Idő: ${runtime.fmt(runtime.state.time)} · Saját választások: ${runtime.P.pickCount} · Ellenfél választásai: ${runtime.E.pickCount}`;
    runtime.$('#endOverlay').classList.remove('hidden');
  };
  runtime.hungarianText = function hungarianText(s) {
    for (const [a, b] of runtime.v4HungarianTerms) s = s.replace(a, b);
    return s;
  };
  runtime.findCell = function findCell(c, type) {
    const candidates = [];
    for (const rot of runtime.rotationOptions(type)) for (let r = 0; r < runtime.GRID; r++) for (let col = 0; col < runtime.GRID; col++) if (runtime.canPlace(c, type, r, col, rot)) {
      const fake = {
          type,
          row: r,
          col,
          rotation: rot,
          id: 'preview'
        },
        cells = runtime.rotatedShape(type, rot).map(([dr, dc]) => [r + dr, col + dc]);
      let score = 0,
        bonus = runtime.producerHasBonus(c, type, fake);
      if (bonus) score += 1000;
      if (!['lumber', 'stonecutter', 'farm'].includes(type)) {
        if (cells.some(([rr, cc]) => runtime.terrainAt(c, rr, cc)?.type === 'fertile')) score -= 500;
        if (runtime.adjacentTerrain(c, fake, 'forest')) score -= 260;
        if (runtime.adjacentTerrain(c, fake, 'quarry')) score -= 260;
      }
      const near = other => runtime.inBuildingRange(fake, other, 1);
      if (type === 'guardhouse') {
        if (runtime.touchesWall(fake)) score += 90;
        if (runtime.buildingOf(c, 'rally').some(near)) score += 100;
      }
      if (type === 'rally') score += runtime.spawnerBuildings(c).filter(near).length * 65;
      if (type === 'tavern') score += runtime.spawnerBuildings(c).filter(near).length * 55;
      if (type === 'guildhouse') score += c.buildings.filter(x => ['lumber', 'stonecutter', 'farm'].includes(x.type) && runtime.inBuildingRange(fake, x, 2)).length * 55;
      if (type === 'townhall') score += runtime.buildingOf(c, 'house').filter(h => runtime.inBuildingRange(fake, h, 2)).length * 45;
      if (type === 'house') score += runtime.buildingOf(c, 'townhall').some(h => runtime.inBuildingRange(fake, h, 2)) ? 70 : 0;
      if (type === 'stable' && runtime.hasBranch(c, 'barracks', 'cavalry_barracks')) score += runtime.buildingOf(c, 'barracks').filter(near).length * 80;
      if (type === 'barracks' && runtime.hasBranch(c, 'barracks', 'cavalry_barracks')) score += runtime.buildingOf(c, 'stable').filter(near).length * 80;
      if (runtime.placementFoundationCells(c, type, r, col, rot).length) score += 35 + (runtime.BUILDINGS[type].cost.wood + runtime.BUILDINGS[type].cost.stone) * .08;
      score -= .5 * (Math.abs(r - runtime.CENTER.row) + Math.abs(col - runtime.CENTER.col));
      score += Math.random() * .5;
      candidates.push({
        cell: [r, col, rot],
        score,
        bonus
      });
    }
    if (!candidates.length) return null;
    if (['lumber', 'stonecutter', 'farm'].includes(type) && candidates.some(x => x.bonus)) for (const x of candidates) if (!x.bonus) x.score -= 1200;
    candidates.sort((a, b) => b.score - a.score);
    return candidates[0].cell;
  };
  runtime.waveBuffs = function waveBuffs(c, entries) {
    const tavern = runtime.buildingOf(c, 'tavern')[0];
    if (tavern) {
      const mult = runtime.hasBranch(c, 'tavern', 'bottoms_up') ? 3.5 : runtime.v4LevelValue(tavern.level, [1.5, 2, 2.5, 2.5]),
        hits = runtime.hasBranch(c, 'tavern', 'bottoms_up') ? 4 : 2;
      for (const e of entries) if (!e.permanentTavern) {
        e.firstMult = mult;
        e.firstHits = hits;
      }
    }
    const cats = new Set(entries.map(e => runtime.UNITS[e.key].cat));
    if (runtime.hasLeg(c, 'combined_arms') && ['infantry', 'cavalry', 'magic', 'siege'].every(cat => cats.has(cat))) for (const e of entries) e.shieldPct = Math.max(e.shieldPct || 0, .5);
    if (runtime.hasLeg(c, 'large_garrison')) for (const e of entries) e.shieldPct = Math.max(e.shieldPct || 0, .25);
    if (runtime.hasLeg(c, 'castle_defenders') && runtime.towers.filter(t => t.side === runtime.sideForCity(c) && !t.gateTower && t.alive).length === 3) for (const e of entries) e.veteran = true;
    if (runtime.hasLeg(c, 'combined_assault') && cats.size >= 3) for (const e of entries) {
      e.speedMult = Math.max(e.speedMult || 1, 1.25);
      e.attackSpeedMult = Math.max(e.attackSpeedMult || 1, 1.25);
    }
  };
  runtime.chooseRareSubtype = function chooseRareSubtype(c, preferred, count) {
    const unlock = runtime.buildingUnlockPool(c),
      upgrade = runtime.buildingUpgradePool(c),
      want = preferred || (Math.random() < .35 ? 'unlock' : 'upgrade'),
      first = want === 'unlock' ? unlock : upgrade,
      other = want === 'unlock' ? upgrade : unlock;
    if (first.length >= Math.min(count, 4)) return want;
    if (other.length >= Math.min(count, 4)) return want === 'unlock' ? 'upgrade' : 'unlock';
    return first.length >= other.length ? want : want === 'unlock' ? 'upgrade' : 'unlock';
  };
  runtime.signedPct = function signedPct(v) {
    return `${v >= 0 ? '+' : '−'}${Math.round(Math.abs(v) * 100)}%`;
  };
  runtime.warcenterControlsHTML = function warcenterControlsHTML(c) {
    const wait = Math.max(0, 30 - (runtime.state.time - (c.warModeChangedAt ?? -30)));
    return `<div class="warModeControls">${[['mass', '⚙ TÖMEG'], ['economy', '◈ TAKARÉKOS'], ['elite', '★ ELIT']].map(([id, label]) => `<button data-war-mode="${id}" class="${c.warMode === id ? 'active' : ''}" ${wait > 0 ? 'disabled' : ''}>${label}</button>`).join('')}<div class="warModeInfo"><b>${runtime.WAR_MODE_NAMES[c.warMode]}</b> · ${runtime.warModeSummary(c)}<br>${wait > 0 ? `Új irány ${Math.ceil(wait)} mp múlva választható.` : 'Az irány most módosítható.'}</div></div>`;
  };
  runtime.v491GuardhouseNetwork = function v491GuardhouseNetwork(c, start) {
    if (!start) return {
      members: [],
      wall: false,
      rally: false
    };
    const queue = [start],
      seen = new Set(),
      members = [];
    let wall = false,
      rally = false;
    while (queue.length) {
      const g = queue.shift();
      if (!g || seen.has(g.id)) continue;
      seen.add(g.id);
      members.push(g);
      if (runtime.touchesWall(g)) wall = true;
      const adjacent = runtime.adjacentBuildings(c, g);
      if (adjacent.some(x => x.type === 'rally')) rally = true;
      for (const other of adjacent) if (other.type === 'guardhouse' && !seen.has(other.id)) queue.push(other);
    }
    return {
      members,
      wall,
      rally
    };
  };
  runtime.pctV497 = function pctV497(v) {
    return `${Math.round(v * 100)}%`;
  };
  runtime.buildCardShortDescV41004 = function buildCardShortDescV41004(type) {
    const d = runtime.BUILDINGS[type];
    if (!d) return '';
    return d.description || "";
    const raw = String(d.description || '').replace(/\s+/g, ' ').trim();
    if (raw.length <= 175) return raw;
    const parts = raw.match(/[^.!?]+[.!?]+/g) || [raw];
    let out = '';
    for (const p of parts) {
      if (out && (out + p).length > 175) break;
      out += p.trim() + ' ';
      if (out.length > 105) break;
    }
    return out.trim() || raw.slice(0, 172) + '…';
  };
  runtime.buildCardCooldownV41004 = function buildCardCooldownV41004(c, type) {
    const d = runtime.BUILDINGS[type];
    if (!d?.unit) return '';
    const t = runtime.previewTrainingTime(c, type, runtime.levelOf(c, type));
    if (!Number.isFinite(t)) return '';
    const clock = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 7.2v5.1l3.7 2.2" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    return `<span class="pickCD" aria-label="Gyártási idő"><span class="cdClock">${clock}</span><b>${t.toFixed(1)} s</b></span>`;
  };
  runtime.v4916FindAnyCell = function v4916FindAnyCell(c, type) {
    const occ = runtime.occupancy(c);
    for (const rot of runtime.rotationOptions(type)) {
      const shape = runtime.rotatedShape(type, rot);
      for (let r = 0; r < runtime.GRID; r++) for (let col = 0; col < runtime.GRID; col++) {
        let ok = true;
        for (const [dr, dc] of shape) {
          const rr = r + dr,
            cc = col + dc;
          if (rr < 0 || cc < 0 || rr >= runtime.GRID || cc >= runtime.GRID || occ.has(runtime.idx(rr, cc)) || runtime.terrainBlocks(c, rr, cc)) {
            ok = false;
            break;
          }
        }
        if (ok) return [r, col, rot];
      }
    }
    return null;
  };
  runtime.v4918BlockingRuinPlan = function v4918BlockingRuinPlan(type) {
    if (!type || !runtime.BUILDINGS[type]) return null;
    if (runtime.findCell(runtime.E, type)) return null;
    const occ = runtime.occupancy(runtime.E);
    let best = null;
    for (const rot of runtime.rotationOptions(type)) {
      const shape = runtime.rotatedShape(type, rot);
      for (let row = 0; row < runtime.GRID; row++) {
        for (let col = 0; col < runtime.GRID; col++) {
          let hardBlocked = false;
          const ruins = [];
          const cells = [];
          for (const [dr, dc] of shape) {
            const r = row + dr,
              c = col + dc;
            if (r < 0 || c < 0 || r >= runtime.GRID || c >= runtime.GRID) {
              hardBlocked = true;
              break;
            }
            if (occ.has(runtime.idx(r, c))) {
              hardBlocked = true;
              break;
            }
            const t = runtime.terrainAt(runtime.E, r, c);
            if (t && runtime.TERRAIN[t.type]?.blocked) {
              if (t.type === 'ruin' || t.type === 'ancient') ruins.push([r, c]);else {
                hardBlocked = true;
                break;
              }
            }
            cells.push([r, c]);
          }
          if (hardBlocked || !ruins.length || !ruins.some(([r, c]) => runtime.canPay(runtime.E, runtime.TERRAIN[runtime.terrainAt(runtime.E, r, c).type].clear))) continue;
          const fake = {
            type,
            row,
            col,
            rotation: rot,
            id: 'preview'
          };
          let score = 1000 - ruins.length * 250;
          for (const [r, c] of ruins) {
            const price = runtime.TERRAIN[runtime.terrainAt(runtime.E, r, c).type].clear;
            score -= (price.wood + price.stone) * .1;
          }
          if (['lumber', 'stonecutter', 'farm'].includes(type) && runtime.producerHasBonus(runtime.E, type, fake)) score += 150;
          if (cells.some(([r, c]) => runtime.terrainAt(runtime.E, r, c)?.type === 'foundation')) score += 30;
          if (type === 'guildhouse') {
            const producers = runtime.E.buildings.filter(b => ['lumber', 'stonecutter', 'farm'].includes(b.type));
            score += producers.filter(b => runtime.inBuildingRange(fake, b, 2)).length * 25;
          }
          if (type === 'rally' || type === 'tavern') {
            score += runtime.spawnerBuildings(runtime.E).filter(b => runtime.inBuildingRange(fake, b, 1)).length * 20;
          }
          score -= .35 * (Math.abs(row - runtime.CENTER.row) + Math.abs(col - runtime.CENTER.col));
          if (!best || score > best.score) best = {
            type,
            row,
            col,
            rot,
            ruins,
            score
          };
        }
      }
    }
    return best;
  };
  runtime.executionStacks35 = function executionStacks35(c) {
    return Math.min(5, Math.max(Number(c.legendaryStacks?.sword_execute) || 0, runtime.hasLeg(c, 'sword_execute') ? 1 : 0));
  };
  runtime.rollExecution35 = function rollExecution35(c, u, t) {
    if (u.key !== 'swordsman' || u.executionPrimaryId !== t.id || u.executionRolled || !runtime.hasLeg(c, 'sword_execute')) return false;
    u.executionRolled = true;
    return Math.random() < .04 * runtime.executionStacks35(c);
  };
  runtime.orcArmyWeight = function orcArmyWeight(entry, c = null) {
    if (entry?.key === 'orc_troll') return 4;
    const owner = c || (entry?.side ? runtime.cityForSide(entry.side) : null);
    return entry?.key === 'orc_goblin' && (owner ? runtime.hasBranch(owner, 'orc_gob', 'swarm') : entry.orcSwarm) ? .5 : 1;
  };
  runtime.orcTakeArmyRoom = function orcTakeArmyRoom(entries, room, fifo = false) {
    const wave = [];
    for (let i = 0; i < entries.length;) {
      const weight = runtime.orcArmyWeight(entries[i]);
      if (fitsUnitRoom(entries[i], room, weight)) {
        room -= weight;
        wave.push(...entries.splice(i, 1));
      } else if (fifo) break;else i++;
    }
    return wave;
  };
  runtime.auditInheritExtras = function auditInheritExtras(u, v) {
    v.orcRegenBlessingTime = Math.max(v.orcRegenBlessingTime || 0, u.orcRegenBlessingTime || 0);
    v.shield = Math.max(v.shield || 0, u.shield || 0);
    if (u.tempShield > 0 && u.tempShieldTime > 0) {
      v.tempShield = Math.max(v.tempShield || 0, u.tempShield);
      v.tempShieldTime = Math.max(v.tempShieldTime || 0, u.tempShieldTime);
    }
    if (u.firstHitsRemaining > 0) {
      v.firstHitsRemaining = Math.max(v.firstHitsRemaining || 0, u.firstHitsRemaining);
      v.firstMult = Math.max(v.firstMult || 1, u.firstMult || 1);
    }
    if (u.permanentTavern) {
      v.permanentTavern = true;
      for (const k of ['permanentTavernMult', 'tavernBaseBonus', 'tavernBuffScale']) if (u[k] != null) v[k] = Math.max(v[k] || 0, u[k]);
    }
    if (u.rallySpeedReady && u.speedBuffTime > 0) v.rallySpeedReady = true;
  };
}
