import { assetUrl } from '../assets/urls.js';
export function initializeCombatTimedRegeneration(runtime) {
  const oldStatus = runtime.updateUnitStatuses;
  runtime.updateUnitStatuses = function (u, dt) {
    if (u?.alive && u.orcRegenBlessingTime > 0) {
      const elapsed = Math.min(dt, u.orcRegenBlessingTime);
      u.orcRegenBlessingTime = Math.max(0, u.orcRegenBlessingTime - dt);
      runtime.healUnit(u, elapsed);
    }
    return oldStatus(u, dt);
  };
  const descriptions = {
    orc_last_blood: 'A Harcos halálakor sebzése kétszeresét okozza a közelharci hatótávján belüli ellenfeleknek. Alaphatótáv: 30.',
    orc_transfusion: 'Az életlopásból megmaradó felesleges gyógyítás 30%-át a legközelebbi, legfeljebb 80 távolságra lévő sérült szövetséges kapja.',
    orc_siege_loot: 'Minden lerombolt ellenséges toronyért egy saját épülettípust fejleszthetsz egy szinttel, legfeljebb a 4. szintig. Minden példánya fejlődik. A korábbi toronyrombolásokért is jár.',
    orc_hunt: 'Ellenség megölésekor a Warglovas azonnal újabb lándzsát dob. A Lándzsazáporral együtt is csak egy új dobás jár ugyanazért az ölésért.'
  };
  for (const item of runtime.LEGENDARY) if (descriptions[item.id]) item.description = descriptions[item.id];
  const blessing = runtime.NORMAL.find(x => x.id === 'orc_blessing');
  if (blessing) blessing.description = 'Az új egységek +2,5 százalékpont eséllyel kapnak véletlen pozitív állapotot 40 másodpercre. Regeneráció esetén: 1 HP/mp, összesen legfeljebb 40 HP.';
  window.__ROADLORDS_STATUSES__.defs.regen[3] = 'Másodpercenként az értékével gyógyít, majd 1-gyel csökken. Összeadódik.';
  Object.assign(window.__ROADLORDS__, {
    updateUnitStatuses: runtime.updateUnitStatuses,
    productionRoomFor: runtime.productionRoomFor,
    orcReserveWeight: runtime.orcReserveWeight
  });
}
