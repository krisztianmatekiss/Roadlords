import { EXTRA_RELICS, FACTION_RELICS, LEGACY_RELIC_IDS } from './definitions.js';

// One registry: legacy effects keep their existing Quick Game behavior. The
// campaign changes acquisition and lifetime, rather than duplicating combat.
export function installCampaignRelics(R,C) {
  for(const [race,ids]of Object.entries(FACTION_RELICS))for(const id of ids)Object.assign(R.LEGENDARY.find(d=>d.id===id),{cardType:'relic',relicRace:race});
  R.RELICS=[...LEGACY_RELIC_IDS.map(id=>R.LEGENDARY.find(d=>d.id===id)),...EXTRA_RELICS.map(d=>({...d,cardType:'relic',relicRace:d.race}))];
  R.RELICS.find(d=>d.id==='und_soul_might').relicRules='A jelenleg tárolt, teljes ezres Lélekcsoportok számítanak. Költéskor csökken, új Lélekkel nő a bónusz. Támadásokra, területi találatokra és a Lich sugarára is hat. Kampányban egyszer szerezhető meg.';
  R.relicPool=race=>R.RELICS.filter(d=>d.relicRace===(typeof race==='string'?race:race.race));
  for(const d of EXTRA_RELICS)R.PICK_IMAGES[d.id]=R.PICK_IMAGES[d.art];
  R.isRelic=id=>R.RELICS.some(d=>d.id===id);
  const anchors=R.aiStrategyAnchors;
  R.aiStrategyAnchors=c=>anchors(c).filter(p=>!C.active||p.anchor.kind!=='legendary'||!R.isRelic(p.anchor.id)||c.legends.has(p.anchor.id));
  R.demolitionRefundRate=c=>C.active&&c.race==='orc'&&c.legends.has('orc_wandering_camp')?1:.5;
  R.relicDescription=id=>id==='strategic_superiority'?'Minden harcban +3 választás, +5 újrasorsolás és +3 kitiltás.':id==='wide_choice'?'Választásonként +1 lap. A legendás fejlesztések kínálatának esélye 2×.':R.RELICS.find(d=>d.id===id)?.description||'';

  const definition=R.upgradeCatalog.definition;
  R.upgradeCatalog.definition=(id,kind)=>kind==='relic'?R.RELICS.find(d=>d.id===id):definition(id,kind)||(kind==='legendary'?R.RELICS.find(d=>d.id===id):null);
  const preview=R.upgradeCopyPreview;
  R.upgradeCopyPreview=(c,o)=>o.kind==='relic'?{description:R.relicDescription(o.id),rows:[],context:'Kampányereklye',stacking:'A következő harcokban is megmarad.',specialization:''}:preview(c,o);

  const eligible=R.eligibleLegendary;
  R.eligibleLegendary=c=>eligible(c).filter(d=>!C.active||!R.isRelic(d.id));
  const roll=R.rollPickTier;
  R.rollPickTier=(c,source)=>{
    const out=roll(c,source);
    return C.active&&out.tier==='legendary'?{tier:'common',subtype:'campaign_legendary'}:out;
  };
  const make=R.makeChoiceOptions;
  R.makeChoiceOptions=(c,source,tier,subtype,exclude=[],rarities=null)=>{
    const out=make(c,source,tier,subtype,exclude,rarities);
    if(!C.active||source==='start'||tier!=='common'||subtype!=='campaign_legendary')return out;
    const pool=R.eligibleLegendary(c).map(d=>({...d,kind:'legendary'})),fresh=pool.filter(d=>!exclude.includes(R.choiceKey(d))),choices=fresh.length?fresh:pool;
    if(choices.length)out.splice(Math.max(0,out.length-1),out.length?1:0,choices[Math.floor(Math.random()*choices.length)]);
    return out;
  };
  const context=R.choiceContextForPlayer;
  R.choiceContextForPlayer=()=>{
    const out=context();
    if(C.active&&out.source!=='start'){
      if(out.doubleTake&&out.opts.length<2){out.doubleTake=false;out.remaining=1;}
      out.title=out.doubleTake?'Válassz két lapot':out.tier==='rare'?'Válassz épületet vagy épületfejlesztést':'Válassz fejlesztést';
      out.desc=out.tier==='rare'?'Új épület vagy meglévő épülettípus fejlesztése.':'Gyakori, ritka, epikus és az előfeltételek teljesülésekor legendás fejlesztések.';
    }
    return out;
  };
  const count=R.choiceCount;
  R.choiceCount=c=>count(c)+(C.active&&R.state.startChoices>0&&c.legends.has('campaign_blueprints')?2:0);
  const render=R.renderChoice;
  R.renderChoice=(options,...args)=>{
    const out=render(options,...args);
    R.$$('#choiceList .choice').forEach((card,i)=>{
      const type=R.isRelic(options[i].id)?'relic':options[i].kind;
      card.dataset.cardType=type;
      if(type==='relic')for(const selector of ['.choiceFooter','.picktag']){const el=card.querySelector(selector);if(el)el.textContent='EREKLYE';}
    });return out;
  };
}
