export const GAME_SPEEDS = Object.freeze([1, 2, 3]);
export const nextGameSpeed = speed => GAME_SPEEDS[(GAME_SPEEDS.indexOf(speed) + 1) % GAME_SPEEDS.length];
