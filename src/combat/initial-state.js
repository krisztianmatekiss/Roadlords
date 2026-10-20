import { assetUrl } from '../assets/urls.js';
export function initializeCombatInitialState(runtime) {
  runtime.PRIEST_BASE_HEAL_CD = 4.2;
  runtime.PRIEST_HEAL_RANGE = 150;
  runtime.updateTowers = undefined;
  runtime.battleSearch = null;
  runtime.BATTLE_BUCKET_SIZE = 128;
  runtime.particles = [];
}
