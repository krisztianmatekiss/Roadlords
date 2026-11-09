// Shared by first load, race changes, spectator resets and multiplayer setup.
export const STARTING_RESOURCES = Object.freeze({
  human: Object.freeze({wood:110,stone:20,food:10}),
  orc: Object.freeze({wood:90,stone:20,food:10}),
});
export const startingResources = race => ({...(STARTING_RESOURCES[race]||STARTING_RESOURCES.human)});
