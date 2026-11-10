import { territoryPower } from '../../data/faction-redesign.js';

// Each building owns up to four persistent beams. Their target IDs and ages
// travel with the normal city snapshot; guests only draw the host's result.
export function installDarkTowers(R, withSource) {
  R.undTowerDamagePerSecond = (c, beam) => (1 + Math.floor(beam.age || 0)) * territoryPower(c);
  R.undUpdateDarkTowers = dt => {
    if (R.MP.enabled && R.MP.role === 'guest') return;
    if (![R.P,R.E].some(c => c.race === 'undead' && R.hasBuilding(c,'und_dark_tower'))) return;
    const byId = new Map(R.state.units.filter(u => u.alive).map(u => [u.id, u]));
    for (const c of [R.P, R.E]) {
      if (c.race !== 'undead') continue;
      const side = R.sideForCity(c), towers = R.buildingOf(c, 'und_dark_tower');
      const valid = u => u?.alive && u.side !== side && R.isOwnHalf({side, lane:u.lane, offset:u.offset});
      for (const b of towers) b.undTowerBeams = b.inactive ? [] : (b.undTowerBeams || [])
        .filter(beam => valid(byId.get(beam.id))).slice(0, b.level);
      c.undeadState.towerClock = (c.undeadState.towerClock || 0) + dt;
      const ticks = Math.floor(c.undeadState.towerClock + 1e-9);
      c.undeadState.towerClock = Math.max(0, c.undeadState.towerClock - ticks);
      if (!ticks || !towers.length) continue;
      const targets = [...byId.values()].filter(valid).sort((a,b) =>
        (side === 'player' ? a.lane-b.lane : b.lane-a.lane) || a.id-b.id);
      for (let tick = 0; tick < ticks; tick++) for (const b of towers) {
        if (b.inactive) continue;
        b.undTowerBeams = b.undTowerBeams.filter(beam => valid(byId.get(beam.id)));
        const linked = new Set(b.undTowerBeams.map(beam => beam.id));
        for (const u of targets) {
          if (b.undTowerBeams.length >= b.level) break;
          if (valid(u) && !linked.has(u.id)) {b.undTowerBeams.push({id:u.id,age:0});linked.add(u.id);}
        }
        for (const beam of b.undTowerBeams) {
          const u = byId.get(beam.id);if (!valid(u)) continue;
          withSource({source:null,attack:true,ranged:true,kind:'dark_tower'}, () =>
            R.damageUnit(u, R.undTowerDamagePerSecond(c, beam), 'magic'));
          beam.age++;
        }
      }
    }
  };

  const shots = R.roadDrawShots;
  R.roadDrawShots = () => {
    shots();
    if (![R.P,R.E].some(c => c.race === 'undead' && R.buildingOf(c,'und_dark_tower').some(b => !b.inactive && b.undTowerBeams?.length))) return;
    const byId = new Map(R.state.units.filter(u => u.alive).map(u => [u.id,u]));
    const g = R.ctx, canvasRect = g.canvas.getBoundingClientRect();
    g.save();g.strokeStyle = '#88e5c9b0';g.lineWidth = 1.1;
    for (const c of [R.P,R.E]) if (c.race === 'undead') {
      const side = R.sideForCity(c), grid = R.$(side === 'player' ? '#playerGrid' : '#enemyGrid');
      for (const b of R.buildingOf(c,'und_dark_tower')) {
        if (b.inactive || !b.undTowerBeams?.length) continue;
        const element = grid?.querySelector(`[data-id="${b.id}"]`), rect = element?.getBoundingClientRect();
        const origin = rect?.width ? {x:rect.left+rect.width/2-canvasRect.left,y:rect.top+rect.height*.3-canvasRect.top}
          : R.pointAt(side === 'player' ? 0 : R.PATH_LENGTH, (b.row-4.5)*35);
        for (const beam of b.undTowerBeams) {
          const target = byId.get(beam.id);if (!target) continue;
          const end = R.pointAt(target.lane,target.offset || 0);
          if (Math.max(origin.x,end.x)<0 || Math.min(origin.x,end.x)>R.ROAD.w) continue;
          g.beginPath();g.moveTo(origin.x,origin.y);g.lineTo(end.x,end.y-22*R.ROAD.h/600*R.ROAD.zoom);g.stroke();
        }
      }
    }
    g.restore();
  };
}
