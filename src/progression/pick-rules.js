// Shared by solo, AI and both multiplayer peers. The guarantee counts offers,
// never rerolls; starter picks and dedicated common rewards bypass the roll.
export const PICK_RULES = Object.freeze({
  earlyUntil: 8 * 60,
  earlyBuildingChance: .50,
  buildingChance: .25,
  legendaryChance: .05,
  wideLegendaryChance: .10,
  guaranteedOffer: 20,
  unlockPreference: .35,
});

export function rareSubtypeForCounts(unlock,upgrade,count,wanted) {
  const first=wanted==='unlock'?unlock:upgrade,other=wanted==='unlock'?upgrade:unlock;
  if(first>=Math.min(count,4))return wanted;
  if(other>=Math.min(count,4))return wanted==='unlock'?'upgrade':'unlock';
  return first>=other?wanted:wanted==='unlock'?'upgrade':'unlock';
}
