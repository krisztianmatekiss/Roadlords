// Rank presentation is shared by every faction; stat bonuses keep their own rules.
export const unitIsElite = (u) => !!(u?.veteran || u?.undElite || u?.eliteVisual || u?.warEliteMult > 1);
