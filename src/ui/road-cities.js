// Cities and their status share the existing battlefield area, without new app rows.
export function installRoadCities(R) {
  const roster = document.createElement('section');
  roster.id = 'roadRoster';
  roster.setAttribute('aria-label', 'Helyőrség és sereg');
  roster.innerHTML = '<nav class="roadRosterSides" aria-label="Megjelenített csapat"><button type="button" data-side="player" aria-pressed="true">Saját</button><button type="button" data-side="enemy" aria-pressed="false">Ellenfél</button></nav>';
  const health = [];
  for (const side of ['player', 'enemy']) {
    const own = side === 'player', city = R.$(own ? '#playerGrid' : '#enemyGrid').closest('.cityzone');
    const frame = city.querySelector('.cityframe');
    const group = document.createElement('div');
    group.className = 'roadRosterTeam'; group.dataset.side = side; group.hidden = !own;
    for (const [label, countId, mixId] of [
      ['HELYŐRSÉG', own ? 'garrisonCount' : 'enemyGarrison', own ? 'playerGarrisonMix' : 'enemyGarrisonMix'],
      ['SEREG', own ? 'playerArmy' : 'enemyArmy', own ? 'playerArmyMix' : 'enemyArmyMix']
    ]) {
      const section = document.createElement('div'); section.className = 'roadRosterGroup';
      const heading = document.createElement('div'); heading.className = 'roadRosterHeading';
      const title = document.createElement('span'); title.textContent = label;
      heading.append(title, R.$('#' + countId)); section.append(heading, R.$('#' + mixId)); group.append(section);
    }
    roster.append(group);

    const name = document.createElement('div'); name.className = 'roadCityName';
    const fallback = document.createElement('span'); fallback.className = 'roadSoloName'; fallback.textContent = own ? 'Saját város' : 'Ellenséges város';
    name.append(fallback, R.$(own ? '#playerNameTag' : '#enemyNameTag'));
    const bar = document.createElement('div'); bar.className = 'roadCapitalHealth';
    bar.setAttribute('role', 'progressbar'); bar.setAttribute('aria-label', own ? 'Saját főváros életereje' : 'Ellenséges főváros életereje'); bar.setAttribute('aria-valuemin', '0');
    bar.innerHTML = '<div class="roadCapitalTrack"><i></i></div><span class="roadCapitalLabel"></span>';
    const max = document.createElement('span'); max.className = 'roadCapitalMax';
    bar.querySelector('.roadCapitalLabel').append(R.$(own ? '#playerHp' : '#enemyHp'), ' / ', max, ' HP');
    frame.append(name, bar); health.push({side, bar, max, fill: bar.querySelector('i')});
  }
  R.$('#app').append(roster);
  for (const button of roster.querySelectorAll('[data-side]')) if (button.tagName === 'BUTTON') button.onclick = () => {
    for (const team of roster.querySelectorAll('.roadRosterTeam')) team.hidden = team.dataset.side !== button.dataset.side;
    for (const tab of roster.querySelectorAll('button')) tab.setAttribute('aria-pressed', String(tab === button));
  };
  // Keep visual hints enabled; render/reset paths may still invoke the old hook.
  R.v490InstallToggle = () => {
    R.state.visualHints = true;
    document.querySelectorAll('.visualHintsToggle').forEach(button => button.remove());
  };
  R.v490InstallToggle();
  R.roadUpdateCityHud = () => {
    for (const {side, bar, max, fill} of health) {
      const c = R.cityForSide(side), hp = Math.max(0, Math.ceil(c.hp));
      bar.setAttribute('aria-valuenow', hp); bar.setAttribute('aria-valuemax', Math.ceil(c.maxHp));
      max.textContent = Math.ceil(c.maxHp);
      fill.style.width = `${R.clamp(c.hp / Math.max(1, c.maxHp), 0, 1) * 100}%`;
      fill.style.backgroundColor = R.unitTeamFill({side});
      const own = side === 'player', units = R.state.units.filter(u => u.alive && u.side === side);
      R.$(own ? '#playerArmy' : '#enemyArmy').textContent = `${R.ROAD.test ? units.length : R.fieldUnitCount(c)}/${R.ROAD.test ? R.ROAD.testCount : c.armyCap}`;
      R.$(own ? '#garrisonCount' : '#enemyGarrison').textContent = `${R.reserveCount(c)}/${c.garrisonCap}`;
      R.updateUnitMix(own ? 'playerArmyMix' : 'enemyArmyMix', units);
      R.updateUnitMix(own ? 'playerGarrisonMix' : 'enemyGarrisonMix', [...c.garrison, ...c.releaseQueue]);
    }
  };
  const updateHud = R.updateHud;
  R.updateHud = function (...args) {
    const out = updateHud(...args);
    R.roadUpdateCityHud();
    return out;
  };
  R.roadLayoutCities = () => {
    const old = R.ROAD.city, scroll = R.roadWar.scrollLeft;
    const oldEnd = R.roadWorld.offsetWidth - (R.ROAD.layoutWidth || R.roadWar.clientWidth);
    R.ROAD.layoutWidth = R.roadWar.clientWidth;
    // The dirt-road walls are at 49 and 551 in the 600-high terrain tile.
    const side = Math.round(R.ROAD.h * 502 / 600), top = R.ROAD.h * 49 / 600;
    R.ROAD.city = side;
    R.roadWorld.style.setProperty('--road-city-size', `${side}px`);
    R.roadWorld.style.setProperty('--road-city-top', `${top}px`);
    R.roadWorld.style.width = `${R.PATH_LENGTH + side * 2}px`;
    if (scroll > 1 && side !== old) R.roadWar.scrollLeft = oldEnd > 0 && scroll >= oldEnd - 2
      ? R.roadWorld.offsetWidth : scroll + side - old;
    R.roadPositionPinnedCity?.();
    const bounds = R.roadWar.getBoundingClientRect(), green = R.ROAD.h * 49 / 600;
    R.roadNoticeBottom = bounds.top + R.ROAD.h - green;
    R.$('#app').style.setProperty('--road-notice-anchor', `${R.roadNoticeBottom - 10}px`);
    roster.style.left = `${bounds.left + bounds.width / 2}px`;
    const rosterHeight = Math.max(18, Math.min(82, green - 6));
    roster.style.top = `${bounds.top + R.ROAD.h - green + (green - rosterHeight) / 2}px`;
    roster.style.height = `${rosterHeight}px`;
    roster.classList.toggle('roadRosterCompact', green < 44);
    R.ROAD.gateExits = null;
  };
}
