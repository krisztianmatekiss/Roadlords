import { assetUrl } from '../assets/urls.js';
export function initializeProgressionEarlyGame(runtime) {
  if (!runtime.NORMAL.some(x => x.id === 'building_discount')) {
    runtime.NORMAL.push({
      id: 'building_discount',
      icon: '🧱',
      name: 'Takarékos építkezés',
      description: 'Minden épület nyersanyagköltsége 10%-kal csökken. Legfeljebb ötször halmozható, összesen −50%-ig.',
      eligible: s => runtime.countNormal(s, 'building_discount') < 5
    });
  }
  runtime.v498AdjustedCost = runtime.adjustedCost;
  runtime.adjustedCost = function (c, base) {
    const old = runtime.v498AdjustedCost(c, base),
      discount = Math.min(.5, .10 * runtime.countNormal(c, 'building_discount'));
    return runtime.C((old.wood || 0) * (1 - discount), (old.stone || 0) * (1 - discount), (old.food || 0) * (1 - discount));
  };
  runtime.v498ScoreAiChoice = runtime.scoreAiChoice;
  runtime.scoreAiChoice = function (o) {
    const score = runtime.v498ScoreAiChoice(o);
    return o?.kind === 'normal' && o.id === 'building_discount' ? score + 4 : score;
  };
  runtime.v498ApplyChoice = runtime.applyChoice;
  runtime.applyChoice = function (c, o, countEvent = true) {
    const out = runtime.v498ApplyChoice(c, o, countEvent);
    if (o?.kind === 'normal' && o.id === 'building_discount' && (c.normal.building_discount || 0) > 5) c.normal.building_discount = 5;
    return out;
  };
  runtime.v498ArmedPeople = runtime.LEGENDARY.find(x => x.id === 'arm_the_people');
  if (runtime.v498ArmedPeople) {
    runtime.v498ArmedPeople.name = 'Felfegyverzett polgárság';
    runtime.v498ArmedPeople.description = 'Minden egyes Favágó, Kővágó és Farm 30 másodpercenként 1 ingyenes Kardost állít ki a normál termelése mellett.';
  }
  runtime.updateCivilianMilitia = function (c, dt) {
    if (!runtime.hasLeg(c, 'arm_the_people')) return;
    for (const b of c.buildings.filter(x => ['lumber', 'stonecutter', 'farm'].includes(x.type))) {
      b.militiaProgress = (b.militiaProgress || 0) + dt;
      while (b.militiaProgress >= 40) {
        if (!runtime.spawnFreeKey(c, 'swordsman')) break;
        b.militiaProgress -= 40;
      }
    }
  };
}
