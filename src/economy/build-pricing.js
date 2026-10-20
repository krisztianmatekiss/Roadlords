import { assetUrl } from '../assets/urls.js';
export function initializeEconomyBuildPricing(runtime) {
  runtime.adjustedCost = runtime.v498AdjustedCost;
  runtime.buildPrice = function (c, type) {
    return runtime.v4915ApplyBuildingDiscount(c, runtime.v4915UndiscountedBuildPrice(c, type));
  };
  runtime.placementPrice = function (c, type, row, col, rotation = 0) {
    let base = runtime.v4915UndiscountedBuildPrice(c, type);
    const hasFoundation = runtime.placementFoundationCells(c, type, row, col, rotation).length > 0;
    if (hasFoundation) base = runtime.C(runtime.cleanCostStep(base.wood * .5), runtime.cleanCostStep(base.stone * .5), runtime.cleanCostStep(base.food * .5));
    return runtime.v4915ApplyBuildingDiscount(c, base);
  };
}
