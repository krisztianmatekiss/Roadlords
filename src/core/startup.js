import { assetUrl } from '../assets/urls.js';
export function initializeCoreStartup(runtime) {
  runtime.mpSetRallyMode = runtime.setRallyMode;
  runtime.setRallyMode = function (c, mode) {
    const result = runtime.mpSetRallyMode(c, mode);
    if (runtime.MP.enabled && runtime.MP.role === 'guest' && c === runtime.P) queueMicrotask(() => runtime.mpSendStrategy(true));
    return result;
  };
  runtime.mpSetWarMode = runtime.setWarMode;
  runtime.setWarMode = function (c, mode, force = false) {
    const result = runtime.mpSetWarMode(c, mode, force);
    if (result && runtime.MP.enabled && runtime.MP.role === 'guest' && c === runtime.P) queueMicrotask(() => runtime.mpSendStrategy(true));
    return result;
  };
  setInterval(() => {
    if (!runtime.MP.enabled || !runtime.MP.role) return;
    if (runtime.MP.role === 'guest') runtime.mpSendStrategy(false);
  }, 100);
  runtime.mpConnect();
  runtime.grantEnemyStarterPicks();
  runtime.recomputeCity(runtime.P, false);
  runtime.recomputeCity(runtime.E, false);
  runtime.refreshTowerHpFor(runtime.P, 'player', false);
  runtime.refreshTowerHpFor(runtime.E, 'enemy', false);
  runtime.renderStatic();
  runtime.updateHud();
  runtime.state.modal = true;
  runtime.showChoice();
  requestAnimationFrame(runtime.frame);
  runtime.v490Style = document.createElement('style');
  runtime.v490Style.textContent = "@import url(\"" + (assetUrl("styles/features/core-startup-7.css") + "\");");
  document.head.appendChild(runtime.v490Style);
  Object.assign(runtime.BUILDINGS.guildhouse, {
    description: 'A 2 mezőn belüli Favágók, Kővágók és Farmok termelését L1/L2/L3 szinten +25%/+50%/+75%-kal növeli.'
  });
  Object.assign(runtime.BUILDINGS.townhall, {
    description: 'A legfeljebb 2 mező távolságra álló Lakóházak sereglimit-bónuszát L1/L2/L3 szinten +50%/+75%/+100%-kal növeli.'
  });
  Object.assign(runtime.BUILDINGS.rally, {
    description: 'A hatókörében álló katonai termelők egységeit külön, 15/25/40 férőhelyes tartalékba gyűjti. Kiengedéskor +30%/+45%/+60% mozgást kapnak az első támadásukig.'
  });
  Object.assign(runtime.BUILDINGS.tavern, {
    description: 'A főkapun vagy a Gyülekezőtérből kiengedett egységek első 2 támadása L1/L2/L3 szinten +50%/+100%/+150% sebzést okoz.'
  });
  Object.assign(runtime.BUILDINGS.guardhouse, {
    description: 'Városfal mellett a főhelyőrség, Gyülekezőtér mellett annak tartaléka kap +20/+30/+45 férőhelyet. Más helyen nincs hatása.'
  });
  Object.assign(runtime.BUILDINGS.warcenter, {
    description: 'Globális katonai termelési módot választ: gyors tömegtermelés, olcsóbb gazdaságos termelés vagy erősebb elit egységek. A mód 30 másodpercenként váltható.'
  });
  Object.assign(runtime.BUILDINGS.armorsmith, {
    description: 'A közvetlenül szomszédos katonai termelők egységei maximális HP-juk 30%/45%/60%-ának megfelelő kezdőpajzsot kapnak.'
  });
  Object.assign(runtime.BUILDINGS.hospital, {
    description: 'Az elesett saját egység 20%/30%/40% eséllyel, egyszer, fél HP-n visszatér a főhelyőrségbe. Ha a helyőrség tele van, a Kórház teljesen inaktív.'
  });
  Object.assign(runtime.BUILDINGS.house, {
    description: 'Minden Lakóház +10/+15/+20 úti sereglimitet ad. A Városháza hatókörében ez a bónusz tovább növekszik.'
  });
  if (runtime.BUILDINGS.market) Object.assign(runtime.BUILDINGS.market, {
    description: 'Másodpercenként 1/2/3 egység kijelölt nyersanyagot vált át egy másikra 60%/75%/90% hatékonysággal. Az útvonal 20 másodpercenként módosítható.'
  });
  runtime.state.visualHints = runtime.state.visualHints !== false;
  runtime.v490RenderCity = runtime.renderCity;
  runtime.renderCity = function (container, c, interactive) {
    runtime.v490RenderCity(container, c, interactive);
    runtime.v490DecorateCity(container, c, interactive);
  };
  runtime.v490ClearPlacementPreview = runtime.clearPlacementPreview;
  runtime.clearPlacementPreview = function (forgetAnchor = true) {
    runtime.v490ClearPlacementPreview(forgetAnchor);
    document.querySelectorAll('#playerGrid .effectRangeCell.placementRange').forEach(x => x.remove());
  };
  runtime.v490PreviewPlacement = runtime.previewPlacement;
  runtime.previewPlacement = function (row, col) {
    runtime.v490PreviewPlacement(row, col);
    if (!runtime.state.visualHints || !runtime.state.selectedBuild) return;
    const type = runtime.state.selectedBuild,
      rotation = runtime.normalizedRotation(type, runtime.state.buildRotation),
      origin = runtime.placementOrigin(type, rotation, row, col),
      fake = {
        type,
        row: origin.row,
        col: origin.col,
        rotation,
        id: 'placement-preview'
      },
      spec = runtime.v490RangeSpec(runtime.P, fake);
    if (spec) runtime.v490AddRange(runtime.$('#playerGrid'), fake, spec, true);
  };
  runtime.v490BuildingEffectRows = runtime.buildingEffectRows;
  runtime.buildingEffectRows = function (c, b) {
    let rows = runtime.v490BuildingEffectRows(c, b),
      type = b.type,
      lv = b.level;
    if (type === 'warcenter') {
      const p = runtime.warModeProfile(c),
        names = {
          mass: 'Tömegtermelés',
          economy: 'Gazdaságos',
          elite: 'Elit'
        },
        wait = Math.ceil(Math.max(0, 30 - (runtime.state.time - (c.warModeChangedAt ?? -30))));
      rows = [['Aktív mód', names[p.mode] || 'Nincs'], ['Globális hatás', runtime.warModeSummary(c)], ['Módváltás', wait ? `${wait} mp múlva választható` : 'most választható']];
    } else if (type === 'armorsmith') rows = [['Hatótáv', 'közvetlenül szomszédos katonai termelők'], ['Kezdőpajzs', `${runtime.hasBranch(c, type, 'heavy_armor') ? '100' : runtime.hasBranch(c, type, 'spiked_armor') ? '60' : runtime.v4LevelValue(lv, [30, 45, 60, 60])}% maximális HP`]];else if (type === 'hospital') {
      const chance = runtime.hasBranch(c, type, 'mass_rescue') ? 60 : runtime.hasBranch(c, type, 'full_recovery') ? 40 : runtime.v4LevelValue(lv, [20, 30, 40, 40]),
        hp = runtime.hasBranch(c, type, 'full_recovery') ? 100 : 50;
      rows = [['Mentési esély', `${chance}%`], ['Visszatérési HP', `${hp}%`], ['Feltétel', runtime.reserveCount(c) < c.garrisonCap ? 'AKTÍV · van szabad hely' : 'INAKTÍV · megtelt a helyőrség'], ['Korlát', 'egy egység csak egyszer menthető']];
    } else if (type === 'house') {
      const base = runtime.v4LevelValue(lv, [10, 15, 20, 40]),
        active = runtime.affectedHouses(c).some(x => x.id === b.id),
        hall = runtime.buildingOf(c, 'townhall')[0],
        mult = active && hall ? runtime.hasBranch(c, 'townhall', 'metropolis') ? 3 : runtime.v4LevelValue(hall.level, [1.5, 1.75, 2, 2]) : 1;
      rows = [['Alap sereglimit', `+${base}`], ['Városháza', active ? `AKTÍV · ×${mult}` : 'Nincs hatókörben'], ['Tényleges bónusz', `+${Math.round(base * mult)}`]];
    }
    if (lv >= 4 && runtime.branchLabel(c, type) && !rows.some(x => x[0] === 'L4 specializáció')) rows.unshift(['L4 specializáció', runtime.branchLabel(c, type)]);
    return rows;
  };
  runtime.pickPoolFor = function (c, source, tier, subtype) {
    if (source === 'start') return runtime.buildingUnlockPool(c);
    if (tier === 'legendary') return runtime.eligibleLegendary(c).map(o => ({
      ...o,
      kind: 'legendary'
    }));
    if (tier === 'common') return runtime.eligibleNormal(c).map(o => ({
      ...o,
      kind: 'normal'
    }));
    return [...runtime.buildingUnlockPool(c), ...runtime.buildingUpgradePool(c)];
  };
  runtime.makeChoiceOptions = function (c, source, tier = 'common', subtype = null, exclude = []) {
    if (typeof tier === 'boolean') tier = tier ? 'legendary' : 'common';
    const count = runtime.choiceCount(c),
      pool = runtime.pickPoolFor(c, source, tier, subtype),
      blocked = new Set(exclude);
    let fresh = pool.filter(o => !blocked.has(runtime.choiceKey(o)));
    if (!fresh.length) fresh = pool;
    let result = runtime.shuffle(fresh).slice(0, count);
    if (tier === 'rare') {
      const branch = result.find(x => x.kind === 'building_branch');
      if (branch) {
        const pair = fresh.filter(x => x.kind === 'building_branch' && x.id === branch.id);
        result = [...pair, ...result.filter(x => !(x.kind === 'building_branch' && x.id === branch.id))].slice(0, count);
      }
    }
    return result;
  };
  runtime.rarityLabel = function (tier, subtype) {
    return tier === 'legendary' ? 'LEGENDÁS' : tier === 'rare' ? 'RITKA · ÉPÜLET' : 'GYAKORI · KIS FEJLESZTÉSEK';
  };
  runtime.choiceContextForPlayer = function () {
    const source = runtime.state.startChoices > 0 ? 'start' : runtime.state.pendingChoices[0],
      roll = runtime.rollPickTier(runtime.P, source),
      tier = roll.tier,
      subtype = tier === 'rare' ? 'building' : roll.subtype,
      legendary = tier === 'legendary',
      doubleTake = !legendary && source !== 'start' && runtime.hasLeg(runtime.P, 'double_choice') && ((runtime.P.nonLegendaryPicks || 0) + 1) % 3 === 0,
      n = runtime.choiceCount(runtime.P);
    let kicker = source === 'start' ? `KEZDŐ ÉPÜLETVÁLASZTÁS · ${5 - runtime.state.startChoices}/4` : source === 'ancient' ? 'ŐSI ROM · GYAKORI JUTALOM' : source === 'tower' ? `TORONYJUTALOM · ${runtime.rarityLabel(tier, subtype)}` : runtime.rarityLabel(tier, subtype),
      title = source === 'start' ? 'Válassz egy új épületet' : legendary ? 'Válassz legendás ereklyét' : tier === 'rare' ? 'Válassz épületet vagy fejlesztést' : 'Válassz fejlesztést';
    if (doubleTake) title = tier === 'rare' ? 'Válassz KÉT épületlapot' : 'Válassz KÉT fejlesztést';
    const desc = source === 'start' ? 'A játékidő még nem fut. Az első négy választás kizárólag új épületet old fel.' : source === 'ancient' ? 'Az ősi rom jutalma mindig gyakori fejlesztés.' : legendary ? '5% alap esély; tíz legendás nélküli alkalom után a következő garantált.' : tier === 'rare' ? `A(z) ${n} lap között új épület és meglévő épülettípus fejlesztése is lehet.` : `Mind a(z) ${n} lap halmozható, kisebb fejlesztés.`;
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
  runtime.v490RenderStatic = runtime.renderStatic;
  runtime.renderStatic = function () {
    const out = runtime.v490RenderStatic();
    runtime.v490InstallToggle();
    return out;
  };
}
