import { assetUrl } from '../assets/urls.js';
export function initializeCoreCities(runtime) {
  runtime.P = runtime.makeCity(false);
  runtime.E = runtime.makeCity(true);
  runtime.MATCH_RUIN_COUNT = 10 + Math.floor(Math.random() * 6);
  runtime.generateTerrain(runtime.P, runtime.MATCH_RUIN_COUNT);
  runtime.generateTerrain(runtime.E, runtime.MATCH_RUIN_COUNT);
  runtime.PICK_BASE_SECONDS = 12;
  runtime.PICK_GROWTH = 1.035;
  runtime.state = {
    time: 0,
    running: false,
    ended: false,
    speed: 1,
    nextPick: runtime.PICK_BASE_SECONDS,
    timedPickCount: 0,
    startChoices: 4,
    pendingChoices: [],
    modal: false,
    units: [],
    unitSerial: 1,
    selectedBuild: null,
    selectedBuilding: null,
    buildRotation: 0,
    category: 'all',
    renderTick: 0,
    choiceContext: null,
    banMode: false
  };
}
