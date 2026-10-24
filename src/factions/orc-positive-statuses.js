import { assetUrl } from '../assets/urls.js';
import { ORC_EXPANSION } from '../data/orc-expansion.js';
export function initializeFactionsOrcPositiveStatuses(runtime) {
  const O = window.__ROADLORDS_ORCS__;
  const defs = {
    veteran: ['Veterán', '★', '#f3d577', '+50% életerő és sebzés. Minden faj egysége lehet veterán.'],
    elite: ['Elit', '◆', '#f3d577', 'Tartósan megerősített egység, arany rangjelzéssel.'],
    power: ['Erő', '⚔', '#8be6a6', '+20% sebzés. Azonos állapotokból csak a legerősebb hat.'],
    haste: ['Fürgeség', '»', '#8be6a6', '+20% támadási sebesség.'],
    stride: ['Lendület', '➜', '#8be6a6', '+20% mozgási sebesség.'],
    vitality: ['Életerő', '♥', '#8be6a6', '+20% maximális életerő.'],
    resistance: ['Ellenállás', '◆', '#8be6a6', '20%-kal kevesebb kapott sebzés.'],
    regen: ['Regeneráció', '✚', '#8be6a6', 'Másodpercenként az értékével gyógyít, majd 1-gyel csökken. Összeadódik.'],
    weakness: ['Gyengeség', '⚔', '#ef9696', '−20% kiosztott sebzés.'],
    atrophy: ['Sorvadás', '♥', '#ef9696', '−20% maximális életerő.'],
    exhaustion: ['Kimerültség', '»', '#ef9696', '−25% támadási sebesség.'],
    vulnerability: ['Sebezhetőség', '◆', '#ef9696', '+20% kapott sebzés.'],
    blindness: ['Vakság', '⊘', '#ef9696', '25% eséllyel elhibázza a támadást.'],
    bleed: ['Vérzés', '♦', '#ef9696', 'Másodpercenként az értékével sebez, majd 1-gyel csökken. Összeadódik.'],
    poison: ['Mérgezés', '☠', '#ef9696', 'Másodpercenként az értékével sebez, majd 1-gyel csökken. Nem ölhet. −30% kapott gyógyítás.'],
    burn: ['Égés', '♨', '#ef9696', 'Az Égés teljes értékét 4 másodperc alatt sebzi. Az új Égés hozzáadódik a megmaradt sebzéshez, és újraindítja a 4 másodpercet.'],
    freeze: ['Fagyasztás', '❄', '#9fd9ff', '1,5 másodperc bénítás, utána 3 másodpercig −50% mozgási és támadási sebesség.'],
    stun: ['Kábítás', '✦', '#ef9696', 'Nem mozoghat, támadhat vagy varázsolhat.'],
    slow: ['Lassítás', '↓', '#ef9696', 'Csökkentett mozgási sebesség; a mértékét a képesség határozza meg.'],
    blessing: ['Áldás', '☀', '#8be6a6', 'Ideiglenesen javítja az egység harci értékeit.'],
    shield: ['Pajzs', '⬡', '#8be6a6', 'A pajzs felfogja a sebzést, amíg el nem fogy.']
  };
  const oldDraw = runtime.drawUnit;
  runtime.drawUnit = function (u) {
    oldDraw(u);
    if (!u.alive) return;
    const items = runtime.MP.enabled && runtime.MP.role === 'guest' ? u.syncedStatusBadges || [] : runtime.unitStatusBadges(u);
    if (!items.length) return;
    const p = runtime.pointAt(u.lane, u.offset || 0),
      r = runtime.unitDrawRadius(u.key),
      cols = Math.min(4, items.length);
    runtime.ctx.save();
    runtime.ctx.textAlign = 'center';
    runtime.ctx.textBaseline = 'middle';
    for (let i = 0; i < items.length; i++) {
      const [k, n] = items[i],
        d = defs[k];
      if (!d) continue;
      const x = p.x + (i % 4 - (cols - 1) / 2) * 15,
        y = p.y - r - 14 - Math.floor(i / 4) * 16;
      runtime.ctx.fillStyle = '#101914';
      runtime.ctx.strokeStyle = d[2];
      runtime.ctx.lineWidth = 1;
      runtime.ctx.beginPath();
      runtime.ctx.roundRect(x - 6.5, y - 6.5, 13, 13, 3);
      runtime.ctx.fill();
      runtime.ctx.stroke();
      runtime.ctx.fillStyle = d[2];
      runtime.ctx.font = 'bold 11px "Segoe UI Symbol",sans-serif';
      runtime.ctx.fillText(d[1], x, y);
      if (n > 0) {
        runtime.ctx.font = 'bold 8px sans-serif';
        runtime.ctx.strokeStyle = '#07100b';
        runtime.ctx.lineWidth = 3;
        runtime.ctx.strokeText(String(n), x + 6, y + 6);
        runtime.ctx.fillStyle = '#fff';
        runtime.ctx.fillText(String(n), x + 6, y + 6);
      }
    }
    runtime.ctx.restore();
  };
  runtime.applyBurn = function (t, damage) {
    t.burnDps = ((t.burnDps || 0) * Math.max(0, t.burnTime || 0) + Math.max(0, damage)) / 4;
    t.burnTime = 4;
  };
  const stationary = u => u.key !== 'orc_warg' && (u.tags?.includes('ranged') || ['catapult', 'priest', 'mage', 'orc_shaman', 'orc_goblin'].includes(u.key));
  const oldLane = runtime.setBattleLane;
  runtime.setBattleLane = function (u, lane) {
    if (lane !== u.lane) u.movedStep = runtime.state.combatStep;
    return oldLane(u, lane);
  };
  const oldAttack = runtime.attackUnit;
  runtime.attackUnit = function (u, t, opts = {}) {
    if (stationary(u)) {
      if (runtime.state.combatStep && u.movedStep === runtime.state.combatStep) return;
      u.stationaryShotStep = runtime.state.combatStep;
    }
    return oldAttack(u, t, opts);
  };
  const oldStructure = runtime.attackStructure;
  runtime.attackStructure = function (u, t) {
    if (stationary(u)) {
      if (runtime.state.combatStep && u.movedStep === runtime.state.combatStep) return;
      u.stationaryShotStep = runtime.state.combatStep;
    }
    return oldStructure(u, t);
  };
  const oldPriest = runtime.priestAction;
  runtime.priestAction = function (u, allies) {
    const acted = oldPriest(u, allies);
    if (acted) u.stationaryShotStep = runtime.state.combatStep;
    return acted;
  };
  function lifeStealRate(c, key) {
    if (!O.isOrc(c)) return 0;
    return ORC_EXPANSION.lifesteal * runtime.countNormal(c, 'orc_lifesteal') + (key === 'orc_berserker' && runtime.countNormal(c, 'orc_leech') ? .03 + .02 * runtime.countNormal(c, 'orc_leech') : 0) + ((c.orcSupport?.lifestealUntil || 0) > runtime.state.time ? .25 : 0) + (runtime.hasBranch(c, 'orc_overseer', 'blood_horde') && c.buildings.some(b => b.type === 'orc_overseer' && !b.inactive) ? .08 : 0);
  }
  const oldStats = runtime.statsFor;
  runtime.statsFor = function (c, e) {
    const s = oldStats(c, e);
    s.lifeSteal = lifeStealRate(c, e.key);
    return s;
  };
  const oldStatsHTML = runtime.unitStatsHTML;
  runtime.unitStatsHTML = function (c, key) {
    const html = oldStatsHTML(c, key),
      rate = lifeStealRate(c, key);
    return html.replace('<div class="unitgrid">', '<div class="unitgrid"><div class="unitstat"><span>Életlopás</span><b>' + Math.round(rate * 100) + '%</b></div>');
  };
  runtime.BUILDINGS.alchemist.description = 'A szomszédos katonai termelők új egységeinek véletlen pozitív állapotot ad. A főzetek hatása állandó; a Regeneráció másodpercenként 1-gyel fogy. Azonos állapotok nem adódnak össze, kivéve a Regenerációt.';
  window.__ROADLORDS_STATUSES__ = {
    defs,
    badges: runtime.unitStatusBadges,
    lifeStealRate,
    draw: u => runtime.drawUnit(u),
    burn: (u, n) => runtime.applyBurn(u, n)
  };
}
