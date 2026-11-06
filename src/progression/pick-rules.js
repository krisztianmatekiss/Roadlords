// Shared by solo, AI and both multiplayer peers. The guarantee counts offers,
// never rerolls; starter picks and dedicated common rewards bypass the roll.
export const PICK_RULES = Object.freeze({
  earlyUntil: 8 * 60,
  earlyBuildingChance: .50,
  buildingChance: .25,
  legendaryChance: .05,
  wideLegendaryChance: .10,
  guaranteedOffer: 20,
});
