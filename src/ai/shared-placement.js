import { BUILDING_MECHANICS } from './mechanics.js';
import { REMOVED_BUILDINGS } from '../data/faction-redesign.js';

export function installSharedAiPlacement(R) {
  const placementCache=new WeakMap();
  const affects = R.aiSupportAffects, requires = R.aiRequiresLocalTargets;
  R.aiSupportAffects = (c, hub, target) => {
    const m = BUILDING_MECHANICS[hub.type] || {};
    if (hub.inactive || target.inactive || m.exclude?.includes(target.type)) return false;
    if (hub.type === 'und_soul_anchor') return hub.id !== target.id && R.undInRange(c, hub, target, Math.min(3, hub.level || R.levelOf(c, hub.type)));
    if (hub.type === 'und_corrupted_hatchery') return !!R.BUILDINGS[target.type]?.unit && R.undInRange(c, hub, target, 1);
    if (hub.type === 'orc_tunnel') return !!R.BUILDINGS[target.type]?.unit && ((hub.level || R.levelOf(c, hub.type)) >= 4 || R.inBuildingRange(hub, target, hub.level || R.levelOf(c, hub.type)));
    if (hub.type === 'orc_raider') return !!R.BUILDINGS[target.type]?.unit && R.aiBuildingsTouch(c, hub, target);
    return affects(c, hub, target);
  };
  R.aiRequiresLocalTargets = (c, b) => !!BUILDING_MECHANICS[b.type]?.local || !!BUILDING_MECHANICS[b.type]?.localSupport || requires(c, b);
  R.aiMarginalSupportTargets=(c,b,targets)=>{
    if(!BUILDING_MECHANICS[b.type]?.nonstacking)return targets;
    const strength=p=>(p.level||R.levelOf(c,p.type))*(['tavern','armorsmith'].includes(p.type)?R.townhallPower?.(c,p)||1:1);
    const existing=c.buildings.filter(p=>p.type===b.type&&!p.inactive&&strength(p)>=strength(b));
    return targets.filter(p=>!existing.some(h=>R.aiSupportAffects(c,h,p)));
  };
  const oldLayout = R.aiLayoutPlan;
  R.aiLayoutPlan = c => {
    const base = oldLayout(c), ids = new Set(base.hubs.map(x => x.hub.id));
    return { producers: base.producers, hubs: [...base.hubs, ...c.buildings.filter(b =>
      !ids.has(b.id) && !b.inactive && (BUILDING_MECHANICS[b.type]?.local || BUILDING_MECHANICS[b.type]?.localUpkeep))
      .map(hub => ({hub, covered: base.producers.filter(b => R.aiSupportAffects(c, hub, b)).length}))] };
  };

  const previous = R.findCell;
  R.findCell = (c, type) => {
    if (!R.aiControlsCity(c)) return previous(c, type);
    if (!R.BUILDINGS[type] || REMOVED_BUILDINGS.has(type) || !R.factionMatches(c.race, R.BUILDINGS[type], type) ||
      R.isUniqueBuilding(c, type) && R.hasBuilding(c, type)) return null;
    const signature = c.buildings.map(b => `${b.id}:${b.type}:${b.level}:${b.row}:${b.col}:${b.rotation||0}:${!!b.inactive}`).join('|');
    const board=c.race+';'+signature+';'+c.terrain.map(t=>t?.type||'').join(',')+';'+JSON.stringify([c.levels,c.l4Branches,[...c.legends]]);
    let persistent=placementCache.get(c);
    if(persistent?.board!==board){persistent={board,cells:new Map()};placementCache.set(c,persistent);}
    if(persistent.cells.has(type))return persistent.cells.get(type);
    return R.aiMemo(`shared-cell:${type}:${signature}`, () => {
      const occupied = R.occupancy(c), layout = R.aiLayoutPlan(c), m = BUILDING_MECHANICS[type] || {};
      let best = null, bestScore = -Infinity;
      for (const rotation of R.rotationOptions(type)) {
        const offsets = R.cityBuildingCells(c, {type, row: 0, col: 0, rotation});
        for (let row = 0; row < R.GRID; row++) for (let col = 0; col < R.GRID; col++) {
          if (offsets.some(([dr, dc]) => {
            const r = row + dr, k = col + dc;
            return r < 0 || k < 0 || r >= R.GRID || k >= R.GRID || occupied.has(R.idx(r, k)) || R.terrainBlocks(c, r, k);
          })) continue;
          const b = {id: 'shared-placement-preview', type, row, col, rotation, level: R.levelOf(c, type)};
          if (type === 'guardhouse' && !R.v491GuardhousePlacementValid(c, row, col, rotation)) continue;
          const covered = layout.producers.filter(p => R.aiSupportAffects(c, b, p));
          const supportTargets = m.localSupport ? c.buildings.filter(p => R.aiSupportAffects(c, b, p)) : [];
          const useful=R.aiMarginalSupportTargets(c,b,covered),usefulSupports=R.aiMarginalSupportTargets(c,b,supportTargets);
          if (R.aiRequiresLocalTargets(c, b) && !(m.localSupport ? usefulSupports.length : useful.length)) continue;
          let score = -.3 * (Math.abs(row - R.CENTER.row) + Math.abs(col - R.CENTER.col));
          if (R.producerHasBonus(c, type, b)) score += 1000;
          if (!m.produces) {
            if (offsets.some(([dr, dc]) => R.terrainAt(c, row + dr, col + dc)?.type === 'fertile')) score -= 420;
            if (R.adjacentTerrain(c, b, 'forest')) score -= 210;
            if (R.adjacentTerrain(c, b, 'quarry')) score -= 210;
          }
          score += useful.length * 120 + usefulSupports.length * 100;
          if (m.localUpkeep) score += c.buildings.filter(p => p.type !== 'keep' && p.id !== b.id && R.aiSupportAffects(c, b, p))
            .reduce((n, p) => n + (R.buildingDefinition(c, p.type).upkeep || 0), 0) * 90;
          if (R.BUILDINGS[type].unit) {
            score += Math.min(3,layout.producers.filter(p=>R.aiBuildingsTouch(c,b,p)).length)*24;
            for (const {hub} of layout.hubs) if (R.aiSupportAffects(c, hub, b)) score += 140;
            if (type === 'und_graveyard') score += layout.producers.filter(p => p.type === type && R.aiBuildingsTouch(c, b, p)).length * 55;
            if (type === 'barracks' && R.hasBranch(c, type, 'cavalry_barracks')) score += R.buildingOf(c, 'stable').filter(p => R.aiBuildingsTouch(c, b, p)).length * 100;
            if (type === 'stable' && R.hasBranch(c, 'barracks', 'cavalry_barracks')) score += R.buildingOf(c, 'barracks').filter(p => R.aiBuildingsTouch(c, b, p)).length * 100;
          } else score += R.aiLayoutAdjustment(c, b, layout);
          if (type === 'guardhouse' && R.touchesWall(b) || type === 'orc_hunt' && R.touchesWall(b)) score += 90;
          if (type === 'guildhouse') score += c.buildings.filter(p => BUILDING_MECHANICS[p.type]?.produces && R.inBuildingRange(b, p, 2)).length * 60;
          if (type === 'und_soul_anchor' && !c.buildings.some(p => p.type !== 'keep' && R.aiSupportAffects(c, b, p))) continue;
          if (R.placementFoundationCells(c, type, row, col, rotation).length) score += 60;
          if (score > bestScore) { bestScore = score; best = [row, col, rotation]; }
        }
      }
      persistent.cells.set(type,best);return best;
    });
  };
}
