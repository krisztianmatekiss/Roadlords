import { assetUrl } from '../assets/urls.js';
export function initializeCombatPriestHealing(runtime) {
  runtime.UNITS.priest.healCooldown = runtime.PRIEST_BASE_HEAL_CD;
  runtime.UNITS.priest.healRange = runtime.PRIEST_HEAL_RANGE;
  for (const x of runtime.LEGENDARY.filter(x => x.id === 'sacred_vow')) {
    x.name = 'Szent fogadalom';
    x.description = 'A Pap többé nem támad. Gyógyítóereje +50%, a gyógyítás cooldownja 30%-kal rövidebb, és minden gyógyítás ideiglenes Shieldet ad a célpontnak.';
  }
  for (const x of runtime.LEGENDARY.filter(x => x.id === 'holy_wave')) {
    x.name = 'Szent pajzs';
    x.description = 'A Pap minden gyógyítása a célpont maximális életerejének 25%-ával megegyező, 5 másodperces pajzsot is ad.';
  }
  for (const x of runtime.LEGENDARY.filter(x => x.id === 'holy_retribution')) {
    x.description = 'A Pap minden gyógyítása a gyógyított célpont körül a gyógyítás értékével megegyező Magic sebzést oszt ki az ellenségeknek.';
  }
  const priestHealCommon = runtime.NORMAL.find(x => x.id === 'priest_heal');
  if (priestHealCommon) priestHealCommon.description = 'A Pap gyógyítóereje +15%. A külön gyógyítási cooldown minden Papnál önállóan ketyeg.';
  const magicTraining = runtime.NORMAL.find(x => x.id === 'mag_training');
  if (magicTraining) magicTraining.description = 'A Pap és a Mágus +8% sebzést és +8% maximális HP-t kap. A Pap gyógyítóereje is +8%.';
  if (runtime.V4_BRANCHES.temple) {
    const high = runtime.V4_BRANCHES.temple.find(x => x.id === 'high_priests');
    if (high) high.description = 'A Pap minden gyógyításakor legfeljebb négy közeli sérült szövetségest gyógyít teljes értékkel.';
    const war = runtime.V4_BRANCHES.temple.find(x => x.id === 'war_priests');
    if (war) war.description = 'A Pap által gyógyított célpont 5 másodpercre +100% sebzést és +50% támadási sebességet kap.';
  }
  const v4942StatsFor = runtime.statsFor;
  runtime.statsFor = function (c, entry) {
    const out = v4942StatsFor(c, entry);
    if (entry?.key === 'priest') {
      out.healCooldown = runtime.PRIEST_BASE_HEAL_CD * (runtime.hasLeg(c, 'sacred_vow') ? .70 : 1);
      out.healRange = runtime.PRIEST_HEAL_RANGE;
    }
    return out;
  };
  const v4942ReleaseUnit = runtime.releaseUnit;
  runtime.releaseUnit = function (c, entry) {
    const u = v4942ReleaseUnit(c, entry);
    if (u?.key === 'priest') {
      const st = runtime.statsFor(c, entry);
      u.healCooldownTime = st.healCooldown || runtime.PRIEST_BASE_HEAL_CD;
      u.healCooldown = Math.random() * .35;
      u.healRange = st.healRange || runtime.PRIEST_HEAL_RANGE;
    }
    return u;
  };
  if (window.__ROADLORDS__) {
    Object.assign(window.__ROADLORDS__, {
      statsFor: runtime.statsFor,
      releaseUnit: runtime.releaseUnit,
      refreshExistingUnitsForCity: runtime.refreshExistingUnitsForCity,
      priestAction: runtime.priestAction,
      updateBattle: runtime.updateBattle
    });
  }
  if (runtime.MP?.lobby) {
    const ver = runtime.MP.lobby.querySelector('.menuVersion');
    if (ver) ver.textContent = 'V4.9.42 · P2P';
  }
  window.__ROADLORDS_VERSION__ = '4.9.42-priest-dual-cooldown';
}
