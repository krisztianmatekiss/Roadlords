import { CONDITIONAL_EFFECTS, UNIT_FEATURES } from './mechanics.js';
import { matchupContext } from './matchups.js';

// Capabilities come from the real army and chosen upgrades. An unlocked
// producer is a discounted future option, never an already functioning source.
export function installAiConditionalContext(R) {
  R.aiUnitMechanics=(c,key,potential=false)=>{
    if(!key)return [];
    const out=new Set(UNIT_FEATURES[key]||[]);
    if(key==='orc_warrior'&&(potential||R.countNormal(c,'orc_bleed')>0)||key==='orc_goblin'&&(potential||R.hasLeg(c,'orc_gob_blood')))out.add('bleed');
    if(key==='orc_warg'&&(potential||R.countNormal(c,'orc_spear_crit')+R.countNormal(c,'orc_crit')>0))out.add('spear_crit');
    if(key.startsWith('orc_')&&(potential||R.countNormal(c,'orc_lifesteal')>0||key==='orc_berserker'&&R.countNormal(c,'orc_leech')>0))out.add('lifesteal');
    return [...out];
  };
  R.aiCombatContext=c=>{
    const producers=R.activeSpawners(c).filter(b=>!b.inactive),keys=new Set(producers.map(b=>R.effectiveUnitKey(c,b)).filter(key=>R.UNITS[key]));
    const side=R.sideForCity(c);
    let field=R.aiObservationContext?.get('field');
    if(!field){
      field={player:[],enemy:[],keys:{player:new Set(),enemy:new Set()},matchups:new Map()};
      for(const u of R.state.units)if(u.alive){field[u.side].push({u});field.keys[u.side].add(u.key);}
      R.aiObservationContext?.set('field',field);
    }
    for(const key of field.keys[side])keys.add(key);
    const possible=new Set(keys);
    for(const type of c.unlocked){const key=R.BUILDINGS[type]?.unit;if(key)possible.add(key);}
    const active=new Set([...keys].flatMap(key=>R.aiUnitMechanics(c,key)));
    const future=new Set([...possible].flatMap(key=>R.aiUnitMechanics(c,key,true)));
    const plague=c.buildings.some(b=>b.type==='und_plague_chamber'&&!b.inactive);
    if(plague&&keys.size)active.add('poison');
    if((plague||c.unlocked.has('und_plague_chamber'))&&possible.size)future.add('poison');
    let matchup=field.matchups.get(side);
    if(!matchup){matchup=matchupContext(R,{foes:field[side==='player'?'enemy':'player']},{units:{}});field.matchups.set(side,matchup);}
    return {active,future,plague,matchup:{...matchup,frontline:[...keys].some(key=>(R.UNITS[key]?.tags||[]).includes('melee'))}};
  };
  R.aiCardReadiness=(c,o,context)=>{
    const needs=CONDITIONAL_EFFECTS[o.id]?.requires||[];
    if(!needs.length)return 1;
    context ||= R.aiCombatContext(c);
    if(needs.every(f=>context.active.has(f)))return 1;
    return needs.every(f=>context.future.has(f))?.15:0;
  };
}
