import { assetUrl } from '../assets/urls.js';
export function initializeCityGuardhouseNetwork(runtime) {
  Object.assign(runtime.BUILDINGS.tavern, {
    description: 'Minden, a főkapun vagy a Gyülekezőtérből kiengedett egység első 2 sikeres támadása L1/L2/L3 szinten +50%/+100%/+150% extra sebzést okoz. A bónusz az egység kiengedésekor kerül rá.'
  });
  Object.assign(runtime.BUILDINGS.guardhouse, {
    description: 'Csak városfal, Gyülekezőtér vagy egy már bekötött Őrház mellé építhető. Az összefüggő Őrházak közös láncként +20/+30/+45 kapacitást adnak a falhoz tartozó főhelyőrségnek vagy a Gyülekezőtér tartalékának.'
  });
  runtime.v491Master = runtime.LEGENDARY.find(x => x.id === 'instant_l3');
  if (runtime.v491Master) runtime.v491Master.description = 'Egy épületfejlesztés két szintet emel, de ez a bónusz legfeljebb L3-ig vihet. Az L4-et továbbra is csak külön L4-fejlesztés vagy specializáció adhatja.';
  runtime.v491GuardBranches = runtime.V4_BRANCHES.guardhouse || [];
  runtime.v491Arrow = runtime.v491GuardBranches.find(x => x.id === 'arrow_bastion');
  if (runtime.v491Arrow) runtime.v491Arrow.description = '+80 kapacitást ad. Ha az összefüggő Őrházlánc eléri a városfalat, a főhelyőrség távolsági egységei 50% sebzéssel tüzelhetnek.';
  runtime.v491Assault = runtime.v491GuardBranches.find(x => x.id === 'assault_guard');
  if (runtime.v491Assault) runtime.v491Assault.description = '+80 kapacitást ad. Ha az összefüggő Őrházlánc eléri a Gyülekezőteret, az onnan induló egységek 50% maximális HP-nak megfelelő pajzsot kapnak.';
  runtime.v491CanPlace = runtime.canPlace;
  runtime.canPlace = function (c, type, row, col, rotation = 0, exceptId = null) {
    if (!runtime.v491CanPlace(c, type, row, col, rotation, exceptId)) return false;
    return type !== 'guardhouse' || runtime.v491GuardhousePlacementValid(c, row, col, rotation);
  };
  runtime.v491PlaceBuilding = runtime.placeBuilding;
  runtime.placeBuilding = function (c, type, row, col, rotation = 0) {
    if (type === 'guardhouse' && runtime.v491CanPlace(c, type, row, col, rotation) && !runtime.v491GuardhousePlacementValid(c, row, col, rotation)) return {
      ok: false,
      reason: 'Az Őrház csak városfal, Gyülekezőtér vagy egy már bekötött Őrház mellé építhető.'
    };
    return runtime.v491PlaceBuilding(c, type, row, col, rotation);
  };
  runtime.guardhouseBonus = function (c, target) {
    let total = 0;
    for (const g of runtime.buildingOf(c, 'guardhouse')) {
      const net = runtime.v491GuardhouseNetwork(c, g),
        applies = target === 'main' ? net.wall : net.rally;
      if (applies) total += g.level >= 4 ? 80 : runtime.v4LevelValue(g.level, [20, 30, 45]);
    }
    return total;
  };
  runtime.v491PreviewPlacement = runtime.previewPlacement;
  runtime.previewPlacement = function (row, col) {
    runtime.v491PreviewPlacement(row, col);
    if (runtime.state.selectedBuild !== 'guardhouse') return;
    const rotation = runtime.normalizedRotation('guardhouse', runtime.state.buildRotation),
      origin = runtime.placementOrigin('guardhouse', rotation, row, col);
    if (runtime.v491GuardhousePlacementValid(runtime.P, origin.row, origin.col, rotation)) return;
    document.querySelectorAll('#playerGrid .placementGhostCell').forEach(x => {
      x.classList.remove('valid');
      x.classList.add('invalid');
    });
  };
  runtime.v491BuildingEffectRows = runtime.buildingEffectRows;
  runtime.buildingEffectRows = function (c, b) {
    if (b.type === 'tavern') {
      const rows = [];
      if (b.level >= 4 && runtime.branchLabel(c, b.type)) rows.push(['L4 specializáció', runtime.branchLabel(c, b.type)]);
      if (runtime.hasBranch(c, 'tavern', 'bottoms_up')) rows.push(['Hullámbónusz', 'első 4 támadás · +250% sebzés']);else rows.push(['Hullámbónusz', `első 2 támadás · +${Math.round((runtime.v4LevelValue(b.level, [1.5, 2, 2.5, 2.5]) - 1) * 100)}% sebzés`]);
      if (runtime.hasBranch(c, 'tavern', 'regulars')) rows.push(['Törzsvendégek', 'szomszédos termelők · minden támadás +150%']);
      return rows;
    }
    if (b.type === 'guardhouse') {
      const net = runtime.v491GuardhouseNetwork(c, b),
        place = net.wall && net.rally ? 'Városfal + Gyülekezőtér' : net.wall ? 'Városfal' : net.rally ? 'Gyülekezőtér' : 'Nincs bekötve',
        rows = [];
      if (b.level >= 4 && runtime.branchLabel(c, b.type)) rows.push(['L4 specializáció', runtime.branchLabel(c, b.type)]);
      rows.push(['Őrházlánc', `${net.members.length} épület`], ['Bekötés', place], ['Kapacitás', `+${b.level >= 4 ? 80 : runtime.v4LevelValue(b.level, [20, 30, 45])} / Őrház`]);
      return rows;
    }
    return runtime.v491BuildingEffectRows(c, b);
  };
  runtime.v491RallyWaveBuffs = runtime.rallyWaveBuffs;
  runtime.rallyWaveBuffs = function (c, entries) {
    runtime.v491RallyWaveBuffs(c, entries);
    if (runtime.hasBranch(c, 'guardhouse', 'assault_guard') && runtime.guardhouseBonus(c, 'rally') > 0) for (const e of entries) e.shieldPct = Math.max(e.shieldPct || 0, .5);
  };
  runtime.garrisonFire = function (dt) {
    for (const [c, side] of [[runtime.P, 'player'], [runtime.E, 'enemy']]) {
      const enabled = runtime.hasLeg(c, 'loopholes') || runtime.hasBranch(c, 'guardhouse', 'arrow_bastion') && runtime.guardhouseBonus(c, 'main') > 0;
      if (!enabled) continue;
      for (const e of c.garrison) {
        if (!runtime.UNITS[e.key].tags.includes('ranged')) continue;
        e.garrisonCd = Math.max(0, (e.garrisonCd || 0) - dt);
        if (e.garrisonCd > 0) continue;
        const st = runtime.statsFor(c, e),
          targets = runtime.state.units.filter(u => u.alive && u.side !== side && (side === 'player' ? u.lane <= st.range * .5 : u.lane >= runtime.PATH_LENGTH - st.range * .5)).sort((a, b) => side === 'player' ? a.lane - b.lane : b.lane - a.lane);
        if (!targets.length) continue;
        if (e.key === 'priest' && runtime.hasLeg(c, 'sacred_vow')) continue;
        runtime.damageUnit(targets[0], st.dmg * .5, runtime.UNITS[e.key].damageType);
        e.garrisonCd = st.cooldown;
      }
    }
  };
  runtime.v491Targets = runtime.v490Targets;
  runtime.v490Targets = function (c, b) {
    if (b?.type === 'guardhouse') {
      const net = runtime.v491GuardhouseNetwork(c, b),
        out = net.members.filter(x => x.id !== b.id);
      if (net.rally) out.push(...runtime.buildingOf(c, 'rally'));
      return out;
    }
    return runtime.v491Targets(c, b);
  };
}
