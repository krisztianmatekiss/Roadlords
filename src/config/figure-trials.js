// The two current full-faction graphics trials share the real combat rules.
export const MIXED_FIGURE_TRIALS = Object.freeze({
  'orcs-humans': {id:'roadOrcsHumansMenu',label:'ORKOK vs EMBEREK · 100 vs 100',races:['orc','human']},
  'undead-orcs': {id:'roadUndeadOrcsMenu',label:'ÉLŐHALOTTAK vs ORKOK · 100 vs 100',races:['undead','orc']},
});
export const isMixedFigureTrial = roster => Object.hasOwn(MIXED_FIGURE_TRIALS,roster);
export function loadMixedFigureTrialArt(R,roster){
  const races=MIXED_FIGURE_TRIALS[roster].races;
  const loaders={human:['loadHumanInfantryArt','loadArcherArt','loadKnightArt','loadCatapultArt','loadHumanCastersArt'],orc:['loadOrcWarriorArt','loadOrcRaidersArt','loadOrcMysticsArt','loadOrcSiegeArt'],undead:['loadUndeadArt','loadSkeletonArt','loadArcherArt']};
  return Promise.all([...new Set(races.flatMap(r=>loaders[r]))].map(name=>R[name]()));
}
