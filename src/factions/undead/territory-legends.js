import { territoryPower } from '../../data/faction-redesign.js';
import { UNDEAD_TERRITORY as B } from '../../data/undead-territory-legends.js';
import { installUndeadTerritoryEffects } from '../../rendering/undead-territory-effects.js';

export function initializeUndeadTerritoryLegends(R) {
  const now = () => R.state.time;
  const cities = () => [R.P, R.E].filter(c => c.race === 'undead');
  const zones = c => c.undeadState?.graveIslands || [];
  // City-relative coordinates survive mirrored snapshots without another protocol field.
  const position = (c, p) => R.sideForCity(c) === 'player'
    ? {lane:p.distance,offset:p.offset} : {lane:R.PATH_LENGTH-p.distance,offset:-p.offset};
  const local = u => u.side === 'player'
    ? {distance:u.lane,offset:u.offset||0} : {distance:R.PATH_LENGTH-u.lane,offset:-(u.offset||0)};
  const baseHalf = R.isOwnHalf;
  const release=R.releaseUnit,stats=R.statsFor;
  R.releaseUnit=(c,e)=>{
    const u=release(c,e);
    if(u && c.race==='undead')u.undRangedGrowthBase=u.maxHp;
    return u;
  };
  R.statsFor=(c,e)=>{
    const s=stats(c,e);
    s.hp+=e.undRangedHpBonus||0;
    return s;
  };
  R.undGainRangedHp=u=>{
    if(R.MP.enabled && R.MP.role==='guest')return;
    const base=u.undRangedGrowthBase || u.maxHp-(u.undRangedHpBonus||0),gain=base*.01;
    u.undRangedGrowthBase=base;
    u.undRangedHpBonus=(u.undRangedHpBonus||0)+gain;
    u.maxHp+=gain;u.hp=Math.min(u.maxHp,u.hp+gain);u.undRangedGrowthAt=now();
  };
  const indexes = new WeakMap(), cellSize = B.radius * 2;
  function index(c) {
    const state = c.undeadState;
    if (!state) return null;
    const power = R.undTerritoryScale?.(c) || territoryPower(c), old = indexes.get(state);
    if (old && old.revision === state.graveRevision && old.power === power) return old;
    const cells = new Map(), radius = B.radius * power;
    for (const zone of zones(c)) {
      const p = position(c, zone);
      for (let x = Math.floor((p.lane-radius)/cellSize); x <= Math.floor((p.lane+radius)/cellSize); x++)
        for (let y = Math.floor((p.offset-radius)/cellSize); y <= Math.floor((p.offset+radius)/cellSize); y++) {
          const key = `${x}:${y}`;
          if (!cells.has(key)) cells.set(key, []);
          cells.get(key).push({zone,...p});
        }
    }
    const out = {revision:state.graveRevision,power,radius,cells};
    indexes.set(state, out);
    return out;
  }
  R.undIslandOwner = point => {
    let latest = null, owner = null;
    const key = `${Math.floor(point.lane/cellSize)}:${Math.floor((point.offset||0)/cellSize)}`;
    for (const c of cities()) {
      const grid = index(c);
      for (const p of grid?.cells.get(key) || []) {
        const z = p.zone, dx = point.lane-p.lane, dy = (point.offset||0)-p.offset;
        if (z.expires <= now() || dx*dx+dy*dy > grid.radius*grid.radius) continue;
        if (!latest || z.born > latest.born || z.born === latest.born && z.actor > latest.actor) {
          latest=z;owner=R.sideForCity(c);
        }
      }
    }
    return owner;
  };
  R.isOwnHalf = u => {
    const side = R.undIslandOwner(u);
    return side ? side === u.side : baseHalf(u);
  };
  R.undActiveIslands = () => cities().flatMap(c => zones(c).filter(z=>z.expires>now()).map(z=>({
    ...position(c,z),radius:B.radius*(R.undTerritoryScale?.(c)||territoryPower(c)),side:R.sideForCity(c),expires:z.expires,
  })));
  function addIsland(u) {
    const c = R.cityForSide(u.side);
    if (c.race !== 'undead' || u.key !== 'und_zombie' || !R.hasLeg(c,'und_grave_islands') || baseHalf(u)) return;
    const state = c.undeadState, p = local(u);
    state.graveIslands = zones(c).filter(z=>z.expires>now());
    // Nearby corpses refresh one patch rather than allocating overlapping effects.
    let zone = state.graveIslands.find(z=>(z.distance-p.distance)**2+(z.offset-p.offset)**2 <= (B.radius/4)**2);
    if (!zone) {
      if (state.graveIslands.length >= B.maximumIslands) state.graveIslands.shift();
      zone={...p};state.graveIslands.push(zone);
    }
    Object.assign(zone,{born:now(),expires:now()+B.duration,actor:u.id});
    state.graveRevision=(state.graveRevision||0)+1;
  }
  const death = R.undOnCombatDeath;
  R.undOnCombatDeath = u => {addIsland(u);return death?.(u);};
  R.undRecordPoisonBurst = u => {
    const c=R.cityForSide(u.side);
    if (c.race !== 'undead' || !c.undeadState) return;
    const state=c.undeadState;
    state.poisonBursts=(state.poisonBursts||[]).filter(b=>b.expires>now()).slice(-47);
    state.poisonBursts.push({...local(u),born:now(),expires:now()+B.poisonBurstDuration});
  };
  R.undVisiblePoisonBursts = () => cities().flatMap(c=>(c.undeadState?.poisonBursts||[])
    .filter(b=>b.expires>now()).map(b=>({...position(c,b),born:b.born,expires:b.expires})));
  R.undTowerDecaySource = t => {
    if (!t?.alive || t.gateTower) return null;
    return cities().find(c=>R.sideForCity(c)!==t.side && R.hasLeg(c,'und_withered_foundations') &&
      R.isOwnHalf({side:R.sideForCity(c),lane:t.lane,offset:t.lateral||0})) || null;
  };
  const decay=R.LEGENDARY.find(o=>o.id==='und_withered_foundations'),eligible=decay.eligible;
  decay.eligible=c=>eligible(c) && (
    R.hasLeg(c,'und_grave_islands') && R.unitAvailable(c,'und_zombie') ||
    R.towers.some(t=>t.alive && !t.gateTower && t.side!==R.sideForCity(c) &&
      R.isOwnHalf({side:R.sideForCity(c),lane:t.lane,offset:t.lateral||0}))
  );
  const fastPoison=R.LEGENDARY.find(o=>o.id==='und_fast_poison'),poisonEligible=fastPoison.eligible;
  fastPoison.eligible=c=>poisonEligible(c) && (R.unitAvailable(c,'und_zombie') || R.hasBuilding(c,'und_plague_chamber'));
  const battle=R.updateBattle;
  R.updateBattle=dt=>{
    if (dt > 0 && !(R.MP.enabled && R.MP.role === 'guest')) {
      for (const c of cities()) {
        const s=c.undeadState;
        if (!s) continue;
        if (zones(c).some(z=>z.expires<=now())) {
          s.graveIslands=zones(c).filter(z=>z.expires>now());
          s.graveRevision=(s.graveRevision||0)+1;
        }
        if (s.poisonBursts) s.poisonBursts=s.poisonBursts.filter(z=>z.expires>now());
      }
      for (const t of R.towers) {
        const c=R.undTowerDecaySource(t);
        if (!c) continue;
        t.hp=Math.max(0,t.hp-B.towerDamagePerSecond*territoryPower(c)*dt);
        if (!t.hp) {
          t.alive=false;
          R.onTowerLost(R.cityForSide(t.side));
          R.rewardTowerKill(R.sideForCity(c),t.tier);
        }
      }
    }
    return battle(dt);
  };
  installUndeadTerritoryEffects(R);
}
