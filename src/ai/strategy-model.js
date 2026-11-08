import { BUILDING_MECHANICS, CONDITIONAL_EFFECTS, UNIT_FEATURES, cardTargets } from './mechanics.js';

// Mechanical links, not faction build orders. Ordinary producer branches inherit
// their unit; only transformations and cross-unit effects need explicit edges.
const BRANCH_LINKS = {
  cavalry_barracks: {units:['knight'],features:['charge'],needs:['stable']},
  conscription:{features:['training']}, bulwark:{features:['survival']}, piercing_spears:{features:['area']},
  longbowmen:{features:['ranged']}, arrow_rain:{features:['area']},
  charge_cavalry:{features:['charge','burst']}, armored_knights:{features:['survival']},
  trebuchet:{features:['siege']},shrapnel:{features:['area','control']},
  fire_mages:{features:['area','fire']},frost_mages:{features:['control']},
  high_priests:{features:['heal']},war_priests:{features:['heal','attack']},
  empire:{features:['economy','choices']},warcapital:{features:['attack','survival']},
  dead_realm:{features:['territory','amplify']},elite_dominion:{features:['elite','training']},
  elite_skeletons:{features:['elite'],needsNeighbours:3},double_summon:{features:['training','summon']},
  epidemic:{features:['poison']},dismantling:{units:['und_zombie','und_skeleton'],features:['death','summon']},
  phasewalker:{features:['flank','dodge']},revenant:{features:['dodge','attack']},
  eternal_army:{units:['und_necromancer','und_skeleton','und_ghost'],features:['summon','survival']},
  skeleton_swarm:{units:['und_necromancer','und_skeleton'],features:['summon']},
  blood_brotherhood:{features:['lifesteal','heal']},blood_hunt:{features:['kills','charge']},
  endless_hunger:{features:['beam','kills']},wither_bond:{features:['beam','control']},
  raise_vampire:{units:['und_vampire'],features:['revive','territory']},
  raise_lich:{units:['und_lich'],features:['revive','territory']},
  rift_horde:{features:['summon','territory']},rift_persistence:{features:['summon','survival']},
  veteran_army:{features:['elite']},monsters:{features:['summon']},ruthless:{features:['training']},
};
const FEATURE_PARTNERS = {
  territory:['territory','revive','flank'],poison:['poison','death'],
  summon:['summon','elite','death'],revive:['revive','death','lifesteal'],
  charge:['charge','burst','flank'],elite:['elite','training'],
  burst:['burst','charge'],amplify:['amplify','burst','shield','choices'],
};
const unique = values => [...new Set(values)];

export function installAiStrategyModel(R) {
  R.aiBuildingBranches = (c,type) => c.race==='undead' ? R.buildingDefinition(c,type)?.branches || [] :
    c.race==='orc' && type==='keep' ? window.__ROADLORDS_ORCS__.keepBranches : R.V4_BRANCHES[type] || [];
  R.aiStrategyDescriptor = (c,o) => {
    if(['building','building_upgrade','building_branch'].includes(o.kind)){
      const m=BUILDING_MECHANICS[o.id]||{},unit=R.BUILDINGS[o.id]?.unit,link=BRANCH_LINKS[o.branch]||{};
      return {units:link.units || (unit?[unit]:[]),features:unique([...(m.features||[]),...(unit?UNIT_FEATURES[unit]||[]:[]),...(link.features||[])]),needs:link.needs||[],
        needsUnits:o.id==='und_bone_forge'?['und_skeleton','und_skeleton_archer']:[]};
    }
    return {units:cardTargets(R,o),features:CONDITIONAL_EFFECTS[o.id]?.features||[],needs:[]};
  };
  R.aiStrategyRelated = (plan,description) => {
    const direct=description.units.some(key=>plan.units.includes(key));
    const partners=new Set(plan.features.flatMap(f=>FEATURE_PARTNERS[f]||[f]));
    return {direct,shared:description.features.filter(f=>partners.has(f)).length};
  };
  R.aiStrategyAnchors = c => {
    const out=[];
    for(const type of R.aiFactionBuildings(c)){
      if(R.aiBuildingMechanics(type).produces || ['house','und_crypt','orc_hut','warehouse'].includes(type))continue;
      for(const branch of R.aiBuildingBranches(c,type)){
        if(R.levelOf(c,type)>=4 && c.l4Branches[type]!==branch.id)continue;
        out.push({kind:'building_branch',id:type,branch:branch.id});
      }
      if(!R.aiBuildingBranches(c,type).length && (R.BUILDINGS[type]?.unit||R.aiBuildingMechanics(type).features?.length))out.push({kind:'building_branch',id:type});
    }
    for(const o of R.LEGENDARY)if(R.factionMatches(c.race,o,o.id))out.push({kind:'legendary',id:o.id});
    return out.map(anchor=>({anchor,key:R.choiceKey(anchor),...R.aiStrategyDescriptor(c,anchor)}))
      .filter(p=>p.units.length||p.features.some(f=>!['economy','choices','support','defense'].includes(f)));
  };
}
