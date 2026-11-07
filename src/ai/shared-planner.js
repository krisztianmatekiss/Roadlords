import { installAiEvaluation } from './evaluation.js';
import { installAiActions } from './actions.js';
import { installSharedAiPlacement } from './shared-placement.js';
import { installAiBattleAwareness } from './battle-awareness.js';
import { installAiGrowthPolicy } from './growth-policy.js';
import { BUILDING_MECHANICS, CONDITIONAL_EFFECTS, UNIT_FEATURES, cardTargets } from './mechanics.js';
import { levelValue } from '../data/faction-redesign.js';

const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
const sum = values => values.reduce((n, x) => n + x, 0);

// This is the sole live construction/choice planner for all three factions.
// Faction modules retain combat, prices, effects and legal-placement rules.
export function installSharedAiPlanner(R) {
  installAiEvaluation(R);
  installAiActions(R);
  installSharedAiPlacement(R);
  installAiBattleAwareness(R);
  installAiGrowthPolicy(R);
  let decision = null;
  const available = c => R.aiFactionBuildings(c).filter(type => type !== 'keep' && c.unlocked.has(type) &&
    (!R.isUniqueBuilding(c, type) || !R.hasBuilding(c, type)));
  const previewBuilding = (c, type, cell, measure) => R.aiPreview(c, shadow => {
    const price=R.placementPrice(shadow,type,...cell);
    for(const r of R.RES)shadow.resources[r]=Math.max(0,shadow.resources[r]-(price[r]||0));
    shadow.buildings.push({id: 'shared-build-preview', type, row: cell[0], col: cell[1], rotation: cell[2],
      level: R.levelOf(shadow, type), progress: 0});
  }, measure);

  function context(c) {
    const metrics = R.aiPreview(c,()=>{}), resources = R.aiResourceKeys(c);
    const battle=R.aiBattleState(c),observed=battle.foes.map(e=>e.u),army=battle.allies.map(e=>e.u);
    const deep=battle.threats.map(e=>e.u),pressure=battle.urgent;
    const military = available(c).filter(type => R.BUILDINGS[type].unit);
    const producers = available(c).filter(type => BUILDING_MECHANICS[type]?.produces);
    const growth=R.aiGrowthTargets(c,metrics,battle,military),target=growth.target;
    return { c, metrics, resources, observed, army, pressure, deep, military, producers, target,battle,growth,
      options: new Map(), buildings: new Map(), successors: new Map() };
  }
  function duringDecision(action,city=decision?.c||R.E) {
    if (decision?.c===city) return action(decision);
    const previous=decision,cache = R.aiDecisionCache;
    R.aiDecisionCache = new Map();
    try { decision = context(city); return action(decision); }
    finally { decision = previous; R.aiDecisionCache = cache; }
  }
  function priceWait(c, price, metrics) {
    let wait = 0;
    for (const r of R.aiResourceKeys(c)) {
      if ((price[r] || 0) > c.caps[r]) return Infinity;
      const short = (price[r] || 0) - c.resources[r];
      if (short > 0) wait = Math.max(wait, short / Math.max(.05, metrics.gain[r] - metrics.use[r]));
    }
    return wait;
  }
  function investment(c, key) {
    let value = 0;
    for (const [id, n] of Object.entries(c.normal)) if (cardTargets(R, {id, kind:'normal'}).includes(key)) value += Math.sqrt(n);
    for (const id of c.legends) if (cardTargets(R, {id, kind:'legendary'}).includes(key)) value += 3;
    return Math.min(15, value);
  }
  function militaryScore(type, ctx) {
    const {c, metrics, observed} = ctx, key = R.BUILDINGS[type]?.unit, base = R.UNITS[key];
    if (!base) return -100;
    const b = {type, id:'shared-military-preview', level:R.levelOf(c,type), row:0, col:0, rotation:0};
    const seconds = R.trainingTime(c, b), seats = R.orcArmyWeight({key}, c);
    const quality = R.aiUnitQuality(c, key);
    let score = 12 + 3 * Math.sqrt(quality * R.productionBatchSize(c, b) / Math.max(1, seconds)) + investment(c, key);
    const count = metrics.units[key]?.count || 0;
    score -= count * 1.3;
    if (!count && sum(Object.values(metrics.units).map(u=>u.count)) >= 3) score += 4;
    const features = UNIT_FEATURES[key] || [], total = Math.max(1, observed.length);
    const ranged = observed.filter(u => (u.tags || R.UNITS[u.key]?.tags || []).includes('ranged')).length / total;
    const heavy = observed.filter(u => ['cavalry','siege'].includes(R.UNITS[u.key]?.cat)).length / total;
    if (features.includes('charge')) score += ranged * 9;
    if (features.includes('counter')) score += heavy * 12;
    const own = Object.keys(metrics.units), frontline = own.some(k => R.UNITS[k].tags.includes('melee'));
    if (!frontline && own.length && base.tags.includes('melee')) score += 6;
    if (!frontline && base.tags.includes('ranged') && !features.includes('summon')) score -= 3;
    if (features.includes('heal') || features.includes('curse')) {
      if (!metrics.power) score -= 20;
      else if (!count) score += 5;
      const share = (count + 1) / Math.max(1, sum(Object.values(metrics.units).map(u=>u.count)) + 1);
      if (share > .25) score -= 30 * share;
    }
    if (features.includes('siege') && !metrics.power) score -= 12;
    if (c.armyCap - R.fieldUnitCount(c) < seats) score -= 15;
    return score;
  }
  function passive(c, metrics) {
    let value = 0;
    for (const b of c.buildings.filter(b=>!b.inactive)) {
      const lv = b.level;
      if (b.type === 'library') value += Math.min(12, 2 + lv * 2) * Math.max(.25,1-R.state.time/2400);
      if (b.type === 'mastersguild') value += (3 + lv * 2) * Math.min(1, c.buildings.length / 12);
      if (b.type === 'orc_totem') value += 5 * 300 / levelValue(lv,[300,260,220,160]) * Math.min(2, metrics.power / 8);
      if (b.type === 'orc_slave') value += Math.min(6, metrics.power * .25) * lv;
      if (b.type === 'und_soul_bank') value += Math.max(0,(Math.max(0,c.resources.wood-500)*levelValue(lv,[.05,.06,.08,.10])/60)*.5-(R.buildingDefinition(c,b.type).upkeep||0))*4;
      if (b.type === 'orc_raider') value += R.activeSpawners(c).filter(p=>R.aiSupportAffects(c,b,p)).length * levelValue(lv,[1,1.5,2.2,4]);
      if (b.type === 'orc_tunnel') value += Math.min(8, R.activeSpawners(c).filter(p=>R.aiSupportAffects(c,b,p)).length * 2);
      if (b.type === 'und_border_obelisk') value += lv * (.6 + (metrics.features.territory || 0) * 1.5);
      if (b.type === 'und_dark_tower') value += (2 + lv) * Math.min(2, metrics.power / 8);
      if (b.type === 'und_otherworld_portal') value += Math.min(10, metrics.power * .3);

    }
    return value;
  }
  function valueDelta(before, after, c, beforePassive, afterPassive) {
    return R.aiMetricDelta(before, after, c) + afterPassive - beforePassive;
  }

  function opportunity(type, ctx) {
    if (ctx.buildings.has(type)) return ctx.buildings.get(type);
    const {c, metrics} = ctx, m = BUILDING_MECHANICS[type] || {};
    const cell = R.findCell(c, type), price = cell ? R.placementPrice(c,type,...cell) : R.buildPrice(c,type);
    const result = {type, cell, price, score:-100, wait:priceWait(c,price,metrics), after:null};
    ctx.buildings.set(type,result);
    if (!cell) return result;
    const measured = previewBuilding(c,type,cell,shadow => {
      const after = R.aiCityMetrics(shadow); return {after, passive:passive(shadow,after)};
    });
    const after = result.after = measured.after;
    const benefit=valueDelta(metrics,after,c,passive(c,metrics),measured.passive);
    let score = benefit;
    const area = R.cityBuildingCells(c,{type,row:0,col:0,rotation:cell[2]}).length;
    if (m.produces) {
      let repair = 0;
      for (const r of ctx.resources) {
        const deficit = Math.max(0,ctx.target[r]-metrics.gain[r]);
        repair += Math.min(deficit, Math.max(0,after.gain[r]-metrics.gain[r])) / Math.max(1,ctx.target[r]);
      }
      score += repair * 48 + (repair > .1 ? 9 : -18);
      if (!metrics.power && repair > .05) score += 12;
      if (ctx.resources.some(r=>metrics.use[r]>metrics.gain[r] && after.gain[r]>metrics.gain[r])) score += 30;
    } else if (R.BUILDINGS[type].unit) {
      score = militaryScore(type,ctx) + Math.min(12,score*.15);
      const ready = ctx.resources.every(r => metrics.gain[r] >= ctx.target[r]);
      if (!ready && !ctx.pressure) score -= ctx.battle.safeOpening?48:25;
      if (ctx.pressure) score += metrics.power?25:65;
      if (ctx.resources.some(r=>after.use[r] > after.gain[r]*.98 && c.resources[r]-(price[r]||0)<Math.max(0,after.use[r]-after.gain[r])*45)) score -= 40;
      if (sum(Object.values(metrics.units).map(u=>u.count)) < 2 && ready) score += 8;
    } else if (m.capacity || m.reserve) {
      const committed = R.fieldUnitCount(c) + R.reserveCount(c);
      if (m.capacity) score += committed > c.armyCap*.75 ? 40 : committed > c.armyCap*.5 ? 10 : -22;
      if (m.reserve && R.reserveCount(c)>=(c.garrisonCap+c.rallyCap)*.75) score += 12;
    } else if (m.storage) {
      score += R.aiStoragePressure(c,metrics) ? 25 : -45;
    } else {
      if (!metrics.power) score -= 25;
      if(ctx.pressure&&m.features?.includes('defense'))score+=40;
      score += benefit>.1?Math.min(5,metrics.power/5):-20;
      if (R.activeSpawners(c).length >= 3 && !R.hasBuilding(c,type)) score += 4;
    }
    // Expensive 2x2/3x3 buildings and sustained operating costs have real
    // opportunity costs even when the treasury currently covers their price.
    const costTime = sum(ctx.resources.map(r=>(price[r]||0)/Math.max(1,metrics.gain[r])));
    score -= Math.min(12,costTime*.10) + Math.max(0,area-1)*.45;
    score -= Math.min(25,result.wait*.10);
    if (ctx.resources.some(r=>after.gain[r]<after.use[r] && after.gain[r]-after.use[r]<metrics.gain[r]-metrics.use[r]-1e-6 && !R.BUILDINGS[type].unit)) score -= 45;
    result.score = score;
    return result;
  }

  function successorValue(type, ctx) {
    if (ctx.successors.has(type)) return ctx.successors.get(type);
    const {c,metrics} = ctx, level=R.levelOf(c,type);
    if (level>=4 || !R.hasBuilding(c,type)) return 0;
    const branches = R.V4_BRANCHES[type] || [];
    const options = branches.length ? branches.map(b=>({kind:'building_branch',id:type,branch:b.id})) : [{kind:'building_branch',id:type}];
    let best = 0;
    for (const o of options) {
      const measured = R.aiPreviewChoice(c,o,shadow=> {
        const after=R.aiCityMetrics(shadow);
        return {after,passive:passive(shadow,after)};
      });
      const value=valueDelta(metrics,measured.after,c,passive(c,metrics),measured.passive);
      best = Math.max(best,value);
    }
    const discounted = Math.min(9,best * (level===3?.20:.08));
    ctx.successors.set(type,discounted); return discounted;
  }
  function scoreChoice(o, ctx) {
    const signature = R.choiceKey(o);
    if (ctx.options.has(signature)) return ctx.options.get(signature);
    const {c,metrics} = ctx;
    let score;
    if (o.kind === 'building') {
      // An unlock has option value but no imaginary free building. Preview its
      // best legal footprint, then discount construction time and affordability.
      const opp = opportunity(o.id,ctx), type = R.BUILDINGS[o.id], m=BUILDING_MECHANICS[o.id]||{};
      score = opp.cell ? 4 + Math.max(-5,opp.score) * .48 : -8;
      if (type?.unit) score += investment(c,type.unit) * .6;
      if (m.capacity && c.armyCap<=R.fieldUnitCount(c)+R.reserveCount(c)+15) score += 12;
      if (m.features?.some(x=>(metrics.features[x]||0)>0)) score += 3;
      if (c.unlocked.has(o.id)) score = -100;
    } else {
      const measured = R.aiPreviewChoice(c,o,shadow=>{
        const after=R.aiCityMetrics(shadow);
        return {after,passive:passive(shadow,after)};
      });
      const value=valueDelta(metrics,measured.after,c,passive(c,metrics),measured.passive);
      score = value + R.aiConditionalCardValue(o,c,metrics);
      if(ctx.pressure&&CONDITIONAL_EFFECTS[o.id]?.features.includes('defense'))score+=16;
      if (o.kind === 'building_upgrade') score += successorValue(o.id,ctx);
      if (o.kind==='building_upgrade'||o.kind==='building_branch') score += Math.min(4,R.buildingOf(c,o.id).length*.3);
      // Non-stat links still matter for a near-future unlocked unit, without
      // valuing an unbuilt army as highly as the one already being produced.
      if (o.kind==='normal'||o.kind==='legendary') {
        const relevance=R.aiCardRelevance(o,c,metrics);
        if (value<.1 && relevance<1) score += relevance*2;
      }
    }
    score=Number.isFinite(score)?score:-100;
    ctx.options.set(signature,score); return score;
  }
  R.scoreAiChoice = R.scoreAiChoiceV17 = (o,c=R.E) => duringDecision(ctx=>scoreChoice(o,ctx),c);
  R.aiMilitaryScore = R.aiCompositionScore = (type,c=R.E) => duringDecision(ctx=>militaryScore(type,ctx),c);
  R.aiMilitaryPool = (c=R.E) => duringDecision(ctx=>ctx.military.slice().sort((a,b)=>militaryScore(b,ctx)-militaryScore(a,ctx)),c);
  R.aiConstructionOpportunities = (c=R.E) => duringDecision(ctx=>available(ctx.c).map(type=>opportunity(type,ctx)).sort((a,b)=>b.score-a.score),c);
  R.aiResourceTargets = (extra=R.C()) => duringDecision(ctx=>Object.fromEntries(R.RES.map(r=>[r,ctx.target[r]+(extra[r]||0)*1.18])));
  R.aiRememberChoice = (o,c=R.E) => {
    if (!o) return;
    c.aiLastChoiceKey=R.choiceKey(o);
    c.aiDoctrine=null;
    if(o.kind==='building' && R.BUILDINGS[o.id]?.unit) c._aiSharedPreferred=o.id;
  };

  R.aiChooseOptions = (options, {source,tier,subtype,city=R.E}) => duringDecision(ctx=>{
    const rank=arr=>arr.map(o=>({o,score:scoreChoice(o,ctx)})).sort((a,b)=>b.score-a.score);
    let ranked=rank(options);
    // Estimate the improvement from an entire same-tier reroll pool. A good
    // unseen card alone is insufficient: account for its chance of appearing.
    const pool = tier==='legendary'?R.eligibleLegendary(ctx.c).map(o=>({...o,kind:'legendary'})):
      tier==='common'?R.eligibleNormal(ctx.c).map(o=>({...o,kind:'normal'})):
      subtype==='unlock'?R.buildingUnlockPool(ctx.c):R.buildingUpgradePool(ctx.c);
    const used=new Set(options.map(R.choiceKey)), remaining=pool.filter(o=>!used.has(R.choiceKey(o)));
    if (ctx.c.rerolls>0 && remaining.length && source!=='start') {
      const scores=rank(remaining).map(x=>x.score), n=Math.min(R.choiceCount(ctx.c),scores.length);
      // Exact expected maximum of n uniformly drawn distinct pool entries.
      let expected=0, probability=1;
      for(let i=0;i<=scores.length-n;i++) {
        const bestProbability=probability*n/(scores.length-i);
        expected+=bestProbability*scores[i]; probability-=bestProbability;
      }
      const reserveCost=ctx.c.rerolls<=2?5:ctx.c.rerolls<=5?3:1.5;
      if(expected>ranked[0].score+reserveCost) {
        const replacement=R.makeChoiceOptions(ctx.c,source,tier,subtype,[...used]);
        if(replacement.length){ctx.c.rerolls--;options=replacement;ranked=rank(options);}
      }
    }
    if(tier==='common'&&ctx.c.bans>0&&ranked.length>1) {
      const worst=ranked.at(-1), relevance=R.aiCardRelevance(worst.o,ctx.c,ctx.metrics);
      if(worst.score<.5&&relevance<.15&&R.activeSpawners(ctx.c).length>=3) {
        ctx.c.banned.add(worst.o.id);ctx.c.bans--;
        const keep=options.filter(o=>R.choiceKey(o)!==R.choiceKey(worst.o));
        const replacements=R.makeChoiceOptions(ctx.c,source,tier,subtype,keep.map(R.choiceKey));
        const replacement=replacements.find(o=>!keep.some(k=>R.choiceKey(k)===R.choiceKey(o)));
        options=replacement?[...keep,replacement]:keep;ranked=rank(options);
      }
    }
    return ranked.map(x=>x.o);
  },city);

  function savings(c, opp) {
    R.aiSaveForBuild(opp.type,opp.price,R.BUILDINGS[opp.type]?.unit?'military':BUILDING_MECHANICS[opp.type]?.produces?'economy':'support',c);
    if(opp.capacityPrice)c._aiSaveCapacityPrice={...opp.capacityPrice};
    if(c.undeadState)c.undSaveSouls=opp.price.wood||0;
  }
  function clearSavings(c) {
    R.aiClearBuildSavings(c);c.undSaveSouls=0;
  }
  function invest(opp,ctx) {
    const {c}=ctx;
    if(!opp.cell) {
      const plan=R.aiBlockingPlan(c,opp.type,{affordableOnly:false});
      if(plan) {
        const price={...opp.price},capacityPrice={...opp.price};
        for(const [row,col] of plan.ruins){const cost=R.terrainClearPrice(c,R.terrainAt(c,row,col).type);for(const r of R.RES){price[r]+=(cost[r]||0);capacityPrice[r]=Math.max(capacityPrice[r]||0,cost[r]||0);}}
        savings(c,{...opp,price,capacityPrice});
        return R.aiClearBlockingRuin(opp.type,c)||true;
      }
      return R.aiMakeRoomFor(opp.type,c);
    }
    if(R.RES.some(r=>(opp.price[r]||0)>c.caps[r])) {
      const stores=available(c).filter(type=>BUILDING_MECHANICS[type]?.storage).map(type=>opportunity(type,ctx)).filter(x=>x.cell);
      stores.sort((a,b)=>a.wait-b.wait);
      return stores[0]?invest(stores[0],ctx):false;
    }
    if(R.canPay(c,opp.price)&&R.aiBuild(opp.type,c)) {
      clearSavings(c);c._aiSharedLastBuild=R.state.time;return true;
    }
    savings(c,opp);return true;
  }
  function setPortal(ctx) {
    const c=ctx.c;
    if(!c.undeadState||!R.hasBuilding(c,'und_otherworld_portal'))return;
    const battle=R.aiBattleState(c),reserve=R.reserveCount(c),readyWave=reserve>=Math.min(c._aiWaveTarget||10,c.garrisonCap);
    const room=R.fieldUnitCount(c)<c.armyCap&&(R.battlePopulationRoom?.(c)??Infinity)>0;
    const deploying=room&&(c.releaseQueue.length>0||c.gateMode==='open'&&reserve>0||readyWave);
    let enabled=false;
    if(deploying&&!battle.portalUnsafe&&R.state.time>=(c._aiPortalOffUntil||0)){
      const on=c.undPortalEnabled?{flow:R.resourceFlowRates(c),upkeep:R.undEconomy(c).totalUpkeep}:
        R.aiPreview(c,shadow=>{shadow.undPortalEnabled=true;},shadow=>({flow:R.resourceFlowRates(shadow),upkeep:R.undEconomy(shadow).totalUpkeep}));
      const saving=c._aiSaveReason==='economy'?(c._aiSavePrice?.wood||0):0;
      const needed=Math.max(0,on.flow.use.wood-on.flow.gain.wood)*45+on.upkeep*12+saving;
      enabled=c.resources.wood>Math.max(30,needed);
    }
    if(enabled!==!!c.undPortalEnabled){
      c.undPortalEnabled=enabled;if(!enabled)c._aiPortalOffUntil=R.state.time+8;
      R.recomputeCity(c,true);
    }
  }
  R.aiStepCity = (city,dt) => {
    if(R.MP.enabled||R.ROAD.test||R.state.pregame||R.state.ended)return;
    city.aiThink-=Math.max(0,dt||0);
    if(city.aiThink>0)return;
    city.aiThink=.8;
    // The old implicit L4 slider default applied only to the right AI. Set
    // the same explicit profile for either AI, preserving each locked cycle.
    if(city.race==='orc')for(const b of city.buildings)if(b.type==='orc_overseer'&&b.level===4){
      city.orcHasteSettings||={};if(city.orcHasteSettings[b.id]==null)city.orcHasteSettings[b.id]=.5;
    }
    R.aiGate(city);
    return duringDecision(ctx=>{
      const {c,metrics}=ctx;
      if(metrics.slots>=R.GRID*R.GRID*.92&&!ctx.pressure)c.aiThink=2.4;
      const reserve=R.C();
      for(const r of ctx.resources)if(metrics.gain[r]<ctx.target[r]){
        const sources=ctx.producers.filter(type=>BUILDING_MECHANICS[type]?.produces.includes(r));
        const cheapest=sources.sort((a,b)=>R.RES.reduce((n,k)=>n+(R.buildPrice(c,a)[k]||0)-(R.buildPrice(c,b)[k]||0),0))[0];
        if(cheapest){const price=R.buildPrice(c,cheapest);for(const k of R.RES)reserve[k]=Math.max(reserve[k],price[k]||0);}
      }
      c._aiGrowthPlan={time:R.state.time,growing:ctx.growth.growing,reserve};
      try{
        if(R.state.startChoices>0)return;
        if(ctx.pressure&&!R.activeSpawners(c).some(b=>!b.inactive)){
          const emergency=ctx.military.map(type=>{
            const opp=opportunity(type,ctx);if(!opp.cell)return null;
            const b={type,id:'emergency-budget',level:R.levelOf(c,type),row:opp.cell[0],col:opp.cell[1],rotation:opp.cell[2]};
            const key=R.effectiveUnitKey(c,b),cost=R.primarySpawnCost(c,key,b),stats=R.statsFor(c,{key});
            if(R.RES.some(r=>c.resources[r]<(opp.price[r]||0)+(cost[r]||0)))return null;
            const eta=R.trainingTime(c,b)+Math.min(ctx.battle.frontDistance,...ctx.battle.threats.map(e=>e.d))/Math.max(1,stats.speed);
            return {...opp,emergency:militaryScore(type,ctx)-eta*.25};
          }).filter(Boolean).sort((a,b)=>b.emergency-a.emergency);
          if(emergency[0]&&R.aiBuild(emergency[0].type,c)){clearSavings(c);return;}
        }
        // Complete a funded multi-cell replacement before another small
        // building can occupy its freshly cleared cells.
        const redevelopment=c._aiRedevelopPlan;
        if(redevelopment&&!ctx.pressure){
          if(invest(opportunity(redevelopment.type,ctx),ctx))return;
          clearSavings(c);
        }
        if(R.aiExcavateAncient(c._aiSaveType,c)){clearSavings(c);return;}
        const saved=c._aiSaveType;
        if(saved&&c.unlocked.has(saved)&&R.state.time-c._aiSaveSince<60&&!R.findCell(c,saved)) {
          const deficit=ctx.resources.some(r=>metrics.gain[r]<metrics.use[r]);
          if((BUILDING_MECHANICS[saved]?.produces||!deficit&&!ctx.pressure)&&invest(opportunity(saved,ctx),ctx))return;
        }
        const types=available(c);
        // Evaluate all economic/capacity roles, but only the four most promising
        // military and four support investments. No per-frame search or history.
        const military=ctx.military.slice().sort((a,b)=>militaryScore(b,ctx)-militaryScore(a,ctx)).slice(0,4);
        const supports=types.filter(type=>!R.BUILDINGS[type].unit&&!BUILDING_MECHANICS[type]?.produces&&!BUILDING_MECHANICS[type]?.capacity&&!BUILDING_MECHANICS[type]?.storage);
        supports.sort((a,b)=>{
          const affinity=type=>sum((BUILDING_MECHANICS[type]?.features||[]).map(x=>metrics.features[x]||0))+(R.hasBuilding(c,type)?-5:1);
          return affinity(b)-affinity(a);
        });
        const chosen=new Set([...ctx.producers,...military,...supports.slice(0,4),...types.filter(type=>BUILDING_MECHANICS[type]?.capacity||BUILDING_MECHANICS[type]?.storage)]);
        if(c._aiSaveType&&c.unlocked.has(c._aiSaveType)&&R.state.time-c._aiSaveSince<60)chosen.add(c._aiSaveType);
        let ranked=[...chosen].map(type=>opportunity(type,ctx));
        const noPlot=ranked.filter(x=>!x.cell);
        ranked=ranked.filter(x=>x.cell).map(x=>({...x,score:x.score+(x.type===c._aiSaveType?R.canPay(c,x.price)?18:3:0)})).sort((a,b)=>b.score-a.score);
        const best=ranked[0];
        if(best&&best.score>0) {
          // Existing construction savings survive ordinary ticks. A sustained
          // deficit or invasion can supersede them; sunk costs are not a lock.
          invest(best,ctx);return;
        }
        const blocked=noPlot.sort((a,b)=>{
          const urgency=type=>BUILDING_MECHANICS[type]?.produces?ctx.resources.some(r=>ctx.target[r]>metrics.gain[r])?30:5:R.BUILDINGS[type]?.unit?20:0;
          return urgency(b.type)-urgency(a.type);
        });
        if(blocked.length){
          const limit=Math.min(4,blocked.length),index=(c._aiBlockedCursor||0)%limit;
          c._aiBlockedCursor=index+1;
          if(invest(blocked[index],ctx))return;
        }
        clearSavings(c);
      }finally{setPortal(ctx);}
    },city);
  };
  R.enemyBuildAI=dt=>{if(R.spectator?.active)R.aiStepCity(R.P,dt);R.aiStepCity(R.E,dt);};
  R.updateEnemyWarModeV45=()=>{
    for(const c of R.spectator?.active?[R.P,R.E]:[R.E]){
      if(!R.aiControlsCity(c)||!R.hasBuilding(c,'warcenter')||R.state.time-(c.warModeChangedAt??-30)<30)continue;
      duringDecision(ctx=>{
        let best=c.warMode||'mass',value=0;
        for(const mode of ['mass','economy','elite'])if(mode!==c.warMode){
          const measured=R.aiPreview(c,shadow=>{shadow.warMode=mode;});
          const score=R.aiMetricDelta(ctx.metrics,measured,c);
          if(score>value+1){best=mode;value=score;}
        }
        if(best!==c.warMode)R.setWarMode(c,best,true);
      },c);
    }
  };
  Object.assign(window.__ROADLORDS__,{enemyBuildAI:R.enemyBuildAI,enemyGateAI:R.enemyGateAI,aiBuild:R.aiBuild,aiMilitaryPool:R.aiMilitaryPool,
    scoreAiChoiceV17:R.scoreAiChoiceV17,aiResourceTargets:R.aiResourceTargets,findCell:R.findCell});
}
