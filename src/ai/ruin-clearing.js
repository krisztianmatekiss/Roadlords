import { assetUrl } from '../assets/urls.js';
export function initializeAiRuinClearing(runtime) {
  runtime.aiClearBlockingRuin = function (preferType = null) {
    if (!preferType || !runtime.E.unlocked.has(preferType)) return false;
    const plan = runtime.v4918BlockingRuinPlan(preferType);
    if (!plan) return false;
    const affordable = plan.ruins.filter(([r, c]) => runtime.canPay(runtime.E, runtime.terrainClearPrice(runtime.E, runtime.terrainAt(runtime.E, r, c).type)));
    if (!affordable.length) return false;
    let chosen = affordable[0];
    if (affordable.length > 1) {
      chosen = [...affordable].sort((a, b) => Math.abs(a[0] - runtime.CENTER.row) + Math.abs(a[1] - runtime.CENTER.col) - (Math.abs(b[0] - runtime.CENTER.row) + Math.abs(b[1] - runtime.CENTER.col)))[0];
    }
    return runtime.clearTerrain(runtime.E, chosen[0], chosen[1], true);
  };
  runtime.v4918AiMakeRoomFor = runtime.aiMakeRoomFor;
  runtime.aiMakeRoomFor = function (type) {
    if (!type) return false;
    if (runtime.findCell(runtime.E, type)) return false;
    if (runtime.aiClearBlockingRuin(type)) return true;
    return runtime.v4918AiMakeRoomFor(type);
  };
}
