import { createUpgradeRequirements } from './upgrade-requirements.js';
import { UPGRADE_RARITIES, upgradeEditions, upgradeRarity, upgradeDescription, normalOptionPower } from './upgrade-rarities.js';

export function installUpgradeCatalog(R) {
  const requirements=createUpgradeRequirements(R);
  const definition = (id, kind='normal') => (kind==='legendary'?R.LEGENDARY:R.NORMAL).find(d => d.id === id);
  const option = (id, rarity) => {
    const def = definition(id); if (!def) return null;
    const selected = upgradeRarity({id, rarity});
    return {...def, kind: 'normal', rarity: selected, description: upgradeDescription(def, selected)};
  };
  const owned = c => Object.entries(c.normal || {}).flatMap(([id, strength]) => {
    if (!(strength > 0) || !definition(id)) return [];
    const records = c.normalRarities?.[id];
    return records ? Object.entries(records).filter(([,count])=>count>0).map(([rarity,count])=>({option:option(id,rarity),count}))
      : [{option: option(id), count: strength}];
  });
  const count = (c, id) => {
    let total=0;
    for(const [key,strength] of Object.entries(c.normal || {})) {
      if(id && key!==id || !(strength>0)) continue;
      const records=c.normalRarities?.[key];
      total+=records ? Object.values(records).reduce((a,b)=>a+b,0) : strength;
    }
    return total;
  };
  R.upgradeCatalog = { definition, option, owned, count, editions: upgradeEditions, rarities: UPGRADE_RARITIES, requirements };
  R.normalOptionPower = normalOptionPower;
  R.recordNormalPick = (c, o, copies) => {
    c.normalRarities ||= {};
    if (!c.normalRarities[o.id]) {
      c.normalRarities[o.id] = {};
      const previous = c.normal[o.id] || 0;
      if (previous) c.normalRarities[o.id][upgradeRarity(o)] = previous;
    }
    const rarity = upgradeRarity(o), records = c.normalRarities[o.id];
    records[rarity] = (records[rarity] || 0) + copies;
  };
  if (!R.MP_STRATEGY_KEYS.includes('normalRarities')) R.MP_STRATEGY_KEYS.push('normalRarities');
  R.normalRarityPool = (c, rarity) => R.eligibleNormal(c)
    .filter(d=>Object.hasOwn(upgradeEditions(d.id),rarity)).map(d=>option(d.id,rarity)).filter(o=>requirements.allowed(c,o));
  for(const def of R.LEGENDARY) {
    const eligible=def.eligible;
    def.eligible=c=>eligible(c) && requirements.allowed(c,{...def,kind:'legendary'});
  }
  R.rollNormalRarity = () => {
    const draw = Math.random();
    return draw < UPGRADE_RARITIES.common.chance ? 'common'
      : draw < UPGRADE_RARITIES.common.chance + UPGRADE_RARITIES.uncommon.chance ? 'uncommon' : 'rare';
  };
  R.makeNormalOptions = (c, exclude = [], editions = null) => {
    const blocked = new Set(exclude), selected = new Set(), out = [];
    for (let i=0; i<Math.min(R.choiceCount(c), editions?.length ?? R.choiceCount(c)); i++) {
      const wanted = editions?.[i] || R.rollNormalRarity();
      const fallback = wanted==='rare' ? ['rare','uncommon','common'] : wanted==='uncommon' ? ['uncommon','common'] : ['common'];
      let pool = [];
      for (const rarity of fallback) {
        const available=R.normalRarityPool(c,rarity).filter(o=>!selected.has(o.id));
        pool=available.filter(o=>!blocked.has(R.choiceKey(o)));
        if (!pool.length) pool=available;
        if (pool.length) break;
      }
      if (!pool.length) continue;
      const picked=pool[Math.floor(Math.random()*pool.length)];
      selected.add(picked.id);out.push(picked);
    }
    return out;
  };
  const makeOptions=R.makeChoiceOptions;
  R.makeChoiceOptions=(c,source,tier='common',subtype=null,exclude=[],rarities=null)=> {
    if(tier===false)tier='common';
    return tier==='common' && source!=='start' ? R.makeNormalOptions(c,exclude,rarities)
      : makeOptions(c,source,tier,subtype,exclude);
  };
  const rarityLabel=R.rarityLabel;
  R.rarityLabel=(tier,subtype)=>tier==='common'?'FEJLESZTÉS':rarityLabel(tier,subtype);
  const context=R.choiceContextForPlayer;
  R.choiceContextForPlayer=()=>{
    const result=context();
    if(result.source==='ancient'){
      result.kicker='ŐSI ROM · FEJLESZTÉS';
      result.desc='A lapok ritkasága külön sorsolódik.';
    } else if(result.tier==='common') result.desc='Gyakori, ritka és epikus fejlesztések.';
    return result;
  };
  const preview=R.upgradeCopyPreview;
  R.upgradeCopyPreview=(c,o)=>{
    const result=preview(c,o);
    if (!result || !['normal','legendary'].includes(o.kind)) return result;
    const def=definition(o.id,o.kind);
    if(o.kind==='legendary')return {...result,description:def?.description || o.description};
    return {...result, description: o.rarity ? option(o.id,o.rarity)?.description || o.description : def?.description || o.description, stacking:`Halmozható · Felvéve: ${count(c,o.id)}×.`};
  };
  // All screens obtain definitions from the live runtime, after faction layers
  // have finished applying their final copy and balance changes.
  Object.assign(window.__ROADLORDS__, {NORMAL:R.NORMAL, LEGENDARY:R.LEGENDARY, upgradeCatalog:R.upgradeCatalog, makeChoiceOptions:R.makeChoiceOptions});
}
