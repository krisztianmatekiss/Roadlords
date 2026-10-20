import { assetUrl } from '../assets/urls.js';
export function initializeCityCampaignFeast(runtime) {
  const FEAST = 'campaign_feast';
  function tavernRallyPair(c) {
    const rallies = runtime.buildingOf(c, 'rally'),
      taverns = runtime.buildingOf(c, 'tavern');
    for (const r of rallies) {
      const t = taverns.find(x => runtime.adjacentBuildings(c, r).some(a => a.id === x.id));
      if (t) return {
        rally: r,
        tavern: t
      };
    }
    return null;
  }
  function tavernDamageMult(c, tavern) {
    if (!tavern) return 1;
    if (runtime.hasBranch(c, 'tavern', 'bottoms_up')) return 3.5;
    return runtime.v4LevelValue(tavern.level, [1.5, 2, 2.5, 2.5]);
  }
  if (!runtime.LEGENDARY.some(x => x.id === FEAST)) runtime.LEGENDARY.push({
    id: FEAST,
    icon: '🍻',
    name: 'Hadjárati lakoma',
    description: 'Ha a Kocsma közvetlenül a Gyülekezőtér mellett áll, az onnan induló egységek a Kocsma sebzésbónuszát minden támadásukra megkapják.',
    eligible: s => runtime.hasBuilding(s, 'tavern') && runtime.hasBuilding(s, 'rally')
  });
  runtime.PICK_IMAGES[FEAST] = runtime.CARD_IMAGES.tavern || runtime.BUILDING_IMAGES.tavern || runtime.PICK_IMAGES.all_damage || runtime.PICK_IMAGES.production;
  const oldRallyWaveBuffsV4947 = runtime.rallyWaveBuffs;
  runtime.rallyWaveBuffs = function (c, entries) {
    const out = oldRallyWaveBuffsV4947(c, entries);
    if (runtime.hasLeg(c, FEAST)) {
      const pair = tavernRallyPair(c);
      if (pair) {
        const mult = tavernDamageMult(c, pair.tavern);
        for (const e of entries) {
          if (e.permanentTavern && runtime.tavernPermanentMult35(c, e) >= 1 + (mult - 1 + .1 * runtime.countNormal(c, 'tavern_damage')) * .5) continue;
          e.permanentTavern = true;
          e.tavernBaseBonus = mult - 1;
          e.tavernBuffScale = .5;
          e.permanentTavernMult = runtime.tavernPermanentMult35(c, e);
          e.firstMult = (mult + .1 * runtime.countNormal(c, 'tavern_damage')) / e.permanentTavernMult;
          e.firstHits = runtime.buildingOf(c, 'tavern').length * (runtime.hasBranch(c, 'tavern', 'bottoms_up') ? 4 : 2);
        }
      }
    }
    return out;
  };
  const oldStatsForV4947 = runtime.statsFor;
  runtime.statsFor = function (c, entry) {
    const out = oldStatsForV4947(c, entry);
    if (entry?.permanentTavern && entry?.permanentTavernMult) {
      const correction = runtime.tavernPermanentMult35(c, entry) / 2.5;
      out.dmg *= correction;
      out.buildingDamage *= correction;
    }
    return out;
  };
  const oldReleaseUnitV4947 = runtime.releaseUnit;
  runtime.releaseUnit = function (c, entry) {
    const u = oldReleaseUnitV4947(c, entry);
    if (u && entry?.permanentTavernMult) {
      u.permanentTavernMult = entry.permanentTavernMult;
      u.tavernBaseBonus = entry.tavernBaseBonus;
      u.tavernBuffScale = entry.tavernBuffScale;
    }
    return u;
  };
  const oldKillUnitV4947 = runtime.killUnit;
  runtime.killUnit = function (target, combatDeath = true) {
    const c = target ? runtime.cityForSide(target.side) : null,
      mult = target?.permanentTavernMult || 0,
      before = c?.garrison?.length || 0,
      key = target?.key;
    const out = oldKillUnitV4947(target, combatDeath);
    if (mult && c?.garrison?.length > before) {
      for (let i = c.garrison.length - 1; i >= before; i--) {
        const e = c.garrison[i];
        if (e?.key === key && e.hospitalSaved && e.permanentTavern) {
          e.permanentTavernMult = mult;
          break;
        }
      }
    }
    return out;
  };
  const oldRowsV4947 = runtime.buildingEffectRows;
  runtime.buildingEffectRows = function (c, b) {
    const rows = oldRowsV4947(c, b) || [];
    if ((b.type === 'tavern' || b.type === 'rally') && runtime.hasLeg(c, FEAST)) {
      const pair = tavernRallyPair(c),
        active = !!pair && (pair.tavern.id === b.id || pair.rally.id === b.id);
      rows.push(['Hadjárati lakoma', active ? 'AKTÍV · minden támadás' : 'INAKTÍV · tedd őket egymás mellé']);
    }
    return rows;
  };
  if (typeof runtime.scoreAiChoiceV17 === 'function') {
    const oldScoreV4947 = runtime.scoreAiChoiceV17;
    runtime.scoreAiChoiceV17 = function (o) {
      let s = oldScoreV4947(o);
      if (o?.kind === 'legendary' && o.id === FEAST) s += tavernRallyPair(runtime.E) ? 9 : 5;
      return s;
    };
  }
  const brandSmall = document.querySelector('.brand small');
  if (brandSmall) brandSmall.textContent = 'V4.9.47 · P2P 1V1';
  if (runtime.MP?.lobby) {
    const ver = runtime.MP.lobby.querySelector('.menuVersion');
    if (ver) ver.textContent = 'V4.9.47 · P2P';
  }
  document.title = 'Roadlords V4.9.47 – Hadjárati lakoma';
  window.__ROADLORDS_VERSION__ = '4.9.47-campaign-feast';
}
