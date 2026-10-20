import { assetUrl } from '../assets/urls.js';
export function initializeUiCatalogDetails(runtime) {
  runtime.buildingUpgradeDetails = function (c, type) {
    const from = runtime.levelOf(c, type),
      to = runtime.upgradeTargetLevel(c, type),
      d = runtime.BUILDINGS[type];
    if (from === 3) {
      if (runtime.V4_SIMPLE_L4.has(type)) {
        const labels = {
          lumber: 'Alaptermelés: <b>3 → 6 Fa/mp</b>',
          stonecutter: 'Alaptermelés: <b>3 → 6 Kő/mp</b>',
          farm: 'Alaptermelés: <b>3 → 6 Élelem/mp</b>',
          warehouse: 'Kapacitás: <b>+600 → +1500 / nyersanyag</b>',
          house: 'Úti sereglimit: <b>+20 → +40</b>'
        };
        return `Minden jelenlegi és későbbi ${d.name} L4 lesz.<span class="upgradeDeltaV497">${labels[type] || ''}</span>`;
      }
      return 'Megnyitja a két választható L4 specializációt.';
    }
    const lines = [];
    if (d.unit) {
      lines.push(runtime.upgradeArrowV497('Gyártási idő', runtime.fmtUpgradeNumberV497(runtime.previewTrainingTime(c, type, from), 1), runtime.fmtUpgradeNumberV497(runtime.previewTrainingTime(c, type, to), 1), ' mp'));
    } else if (['lumber', 'stonecutter', 'farm'].includes(type)) {
      const unit = type === 'lumber' ? 'Fa' : type === 'stonecutter' ? 'Kő' : 'Élelem';
      lines.push(`Termelés: <b>${runtime.fmtUpgradeNumberV497(runtime.v4LevelValue(from, [1, 2, 3, 6]))} → ${runtime.fmtUpgradeNumberV497(runtime.v4LevelValue(to, [1, 2, 3, 6]))} ${unit}/mp</b>`);
    } else if (type === 'warehouse') {
      lines.push(runtime.upgradeArrowV497('Kapacitás', `+${runtime.v4LevelValue(from, [150, 300, 600, 1500])}`, `+${runtime.v4LevelValue(to, [150, 300, 600, 1500])}`, ' / nyersanyag'));
    } else if (type === 'house') {
      lines.push(runtime.upgradeArrowV497('Úti sereglimit', `+${runtime.v4LevelValue(from, [10, 15, 20, 40])}`, `+${runtime.v4LevelValue(to, [10, 15, 20, 40])}`));
    } else if (type === 'keep') {
      lines.push(runtime.upgradeArrowV497('Alaptermelés', `+${runtime.v4LevelValue(from, [1, 2, 4, 8])}`, `+${runtime.v4LevelValue(to, [1, 2, 4, 8])}`, ' /mp'));
      lines.push(runtime.upgradeArrowV497('Tároló', runtime.v4LevelValue(from, [200, 200, 400, 800]), runtime.v4LevelValue(to, [200, 200, 400, 800]), ' / nyersanyag'));
      lines.push(runtime.upgradeArrowV497('Főváros HP', runtime.v4LevelValue(from, [20000, 40000, 80000, 160000]), runtime.v4LevelValue(to, [20000, 40000, 80000, 160000])));
      lines.push(runtime.upgradeArrowV497('Úti sereglimit', runtime.v4LevelValue(from, [50, 100, 200, 400]), runtime.v4LevelValue(to, [50, 100, 200, 400])));
      lines.push(runtime.upgradeArrowV497('Kapukiengedés', runtime.v4LevelValue(from, [5, 10, 20, 40]), runtime.v4LevelValue(to, [5, 10, 20, 40]), ' egység/mp'));
    } else if (type === 'guildhouse') {
      lines.push(runtime.upgradeArrowV497('Termelési bónusz', `+${Math.round(runtime.v4LevelValue(from, [.25, .5, .75, .75]) * 100)}%`, `+${Math.round(runtime.v4LevelValue(to, [.25, .5, .75, .75]) * 100)}%`));
    } else if (type === 'market') {
      lines.push(runtime.upgradeArrowV497('Kereskedelmi tempó', runtime.marketRate(from), runtime.marketRate(to), ' /mp'));
      lines.push(runtime.upgradeArrowV497('Hatékonyság', Math.round(runtime.marketEfficiency(from) * 100), Math.round(runtime.marketEfficiency(to) * 100), '%'));
    } else if (type === 'townhall') {
      lines.push(runtime.upgradeArrowV497('Lakóházbónusz', `+${Math.round((runtime.v4LevelValue(from, [1.5, 1.75, 2, 2]) - 1) * 100)}%`, `+${Math.round((runtime.v4LevelValue(to, [1.5, 1.75, 2, 2]) - 1) * 100)}%`));
    } else if (type === 'rally') {
      lines.push(runtime.upgradeArrowV497('Saját tartalék', runtime.v4LevelValue(from, [15, 25, 40, 40]), runtime.v4LevelValue(to, [15, 25, 40, 40])));
      lines.push(runtime.upgradeArrowV497('Mozgási bónusz', `+${Math.round((runtime.v4LevelValue(from, [1.3, 1.45, 1.6, 1.6]) - 1) * 100)}%`, `+${Math.round((runtime.v4LevelValue(to, [1.3, 1.45, 1.6, 1.6]) - 1) * 100)}%`));
    } else if (type === 'tavern') {
      lines.push(runtime.upgradeArrowV497('Első 2 támadás', `+${Math.round((runtime.v4LevelValue(from, [1.5, 2, 2.5, 2.5]) - 1) * 100)}%`, `+${Math.round((runtime.v4LevelValue(to, [1.5, 2, 2.5, 2.5]) - 1) * 100)}%`, ' sebzés'));
    } else if (type === 'guardhouse') {
      lines.push(runtime.upgradeArrowV497('Kapacitás', `+${runtime.v4LevelValue(from, [20, 30, 45, 80])}`, `+${runtime.v4LevelValue(to, [20, 30, 45, 80])}`));
    } else if (type === 'armorsmith') {
      lines.push(runtime.upgradeArrowV497('Kezdőpajzs', runtime.v4LevelValue(from, [30, 45, 60, 60]), runtime.v4LevelValue(to, [30, 45, 60, 60]), '% max HP'));
    } else if (type === 'hospital') {
      lines.push(runtime.upgradeArrowV497('Mentési esély', runtime.v4LevelValue(from, [20, 30, 40, 40]), runtime.v4LevelValue(to, [20, 30, 40, 40]), '%'));
    } else if (type === 'alchemist') {
      lines.push(runtime.upgradeArrowV497('Aktív főzetek állítható súlya', from === 1 ? 'fix 25' : from === 2 ? '25–50' : '25–75', to === 2 ? '25–50' : '25–75'));
      lines.push('A súlyokból számolt esély függ a teljes recepttől.');
    } else if (type === 'library') {
      lines.push(runtime.upgradeArrowV497('Ingyen újrasorsolás / pick', Math.min(3, from), Math.min(3, to)));
    } else if (type === 'mastersguild') {
      lines.push(runtime.upgradeArrowV497('Ingyen épületfejlesztés', runtime.v4LevelValue(from, [300, 240, 180]), runtime.v4LevelValue(to, [300, 240, 180]), ' mp-enként'));
      lines.push('Már megépített épülettípust fejleszt, legfeljebb L3-ig.');
    } else if (type === 'warcenter') {
      const i1 = Math.min(2, Math.max(0, from - 1)),
        i2 = Math.min(2, Math.max(0, to - 1));
      const massCost = [15, 20, 25],
        massSpeed = [20, 30, 40],
        ecoCost = [15, 20, 25],
        ecoTime = [20, 25, 30],
        elite = [15, 20, 25],
        elitePen = [20, 25, 30];
      lines.push(`Tömegtermelés: <b>+${massSpeed[i1]}% → +${massSpeed[i2]}% gyártás</b> · költség +${massCost[i1]}% → +${massCost[i2]}%`);
      lines.push(`Takarékos: <b>−${ecoCost[i1]}% → −${ecoCost[i2]}% költség</b> · idő +${ecoTime[i1]}% → +${ecoTime[i2]}%`);
      lines.push(`Elit: <b>+${elite[i1]}% → +${elite[i2]}% HP és sebzés</b> · költség/idő +${elitePen[i1]}% → +${elitePen[i2]}%`);
    }
    return `Minden jelenlegi és későbbi ${d.name} L${to} lesz.${lines.length ? `<span class="upgradeDeltaV497">${lines.join('<br>')}</span>` : ''}`;
  };
  runtime.BUILD_CARD_SHORT_DESC_V41004 = {
    keep: 'A birodalom központja. Alaptermelést, tárolót, fővárosi HP-t, sereglimitet és kapukiengedést ad.',
    lumber: 'Fát termel. Erdő mellett a termelése megduplázódik.',
    stonecutter: 'Követ termel. Kőfejtő mellett a termelése megduplázódik.',
    farm: 'Élelmet termel. Termékeny talajon a termelése megduplázódik.',
    warehouse: 'Növeli minden nyersanyag tárolókapacitását.',
    barracks: 'Kardost gyárt.',
    archery: 'Íjászt gyárt.',
    spearhall: 'Lándzsást gyárt. Lovasság és nehéz egységek ellen kiemelkedően erős.',
    stable: 'Lovagot gyárt. Gyors, páncélozott közelharci egység.',
    temple: 'Papokat gyárt. A Pap támad és sérült szövetségeseket gyógyít.',
    siegeworks: 'Katapultot gyárt. Épületek ellen teljes sebzést okoz.',
    magetower: 'Mágust gyárt. Tűzgolyója területi sebzést okoz.',
    guildhouse: 'A 2 mezőn belüli Favágók, Kővágók és Farmok termelését növeli.',
    market: 'Folyamatosan egy kijelölt nyersanyagot vált át egy másikra. Az útvonal bármikor módosítható.',
    builders: 'Csökkenti minden épület Fa- és Kőköltségét.',
    townhall: 'A legfeljebb 2 mezőre álló Lakóházak sereglimit-bónuszát növeli.',
    rally: 'A közeli katonai termelők egységeit külön tartalékba gyűjti. Kiengedéskor mozgási bónuszt kapnak az első támadásig.',
    tavern: 'A főkapun vagy a Gyülekezőtérből kiengedett egységek első 2 támadását erősíti.',
    guardhouse: 'Csak városfalhoz, Gyülekezőtérhez vagy bekötött Őrházhoz kapcsolható. Növeli a kapcsolt tartalék kapacitását.',
    house: 'Növeli az úton harcoló sereged maximális létszámát.',
    warcenter: 'Három globális haditermelési irány közül választhatsz, és bármikor válthatsz közöttük.',
    armorsmith: 'A közeli katonai termelőkből érkező egységek kezdőpajzsot kapnak.',
    hospital: 'Az elesett egységek egy részét egyszer visszajuttatja a főhelyőrségbe fél HP-n. Tele helyőrségnél inaktív.',
    library: 'Minden választásnál ingyenes újrasorsolásokat ad. Ezek csak az aktuális választásra érvényesek.',
    mastersguild: 'Időközönként ingyenesen fejleszt egy már megépített épülettípust, legfeljebb L3-ig.',
    academy: 'A szomszédos katonai termelők egységeit nyersanyagból vásárolható sebzés-, HP- és támadásisebesség-fejlesztésekkel erősíti.',
    merc_tent: 'Három zsoldoscsapat közül bérelhetsz. A választott sor a következő ajánlatok erejét is befolyásolja, és automata mód is használható.',
    alchemist: 'A szomszédos katonai termelőkből érkező egységeknek véletlenszerű főzetbónuszt ad.'
  };
  runtime.renderBuildList = function () {
    const list = runtime.$('#buildList'),
      entries = [...runtime.P.unlocked].filter(k => k !== 'keep' && runtime.BUILDINGS[k]).filter(k => runtime.state.category === 'all' || runtime.BUILDINGS[k].category === runtime.state.category);
    list.innerHTML = entries.map(k => {
      const d = runtime.BUILDINGS[k],
        locked = runtime.isUniqueBuilding(runtime.P, k) && runtime.hasBuilding(runtime.P, k),
        price = runtime.buildPrice(runtime.P, k),
        wood = Math.ceil(price.wood || 0),
        stone = Math.ceil(price.stone || 0),
        woodMissing = wood > 0 && runtime.P.resources.wood + 1e-9 < wood,
        stoneMissing = stone > 0 && runtime.P.resources.stone + 1e-9 < stone;
      return `<div class="buildSlot" data-k="${k}"><div class="buildSlotBadges"></div><button class="buildcard gamecard compactPickCard ${runtime.state.selectedBuild === k ? 'selected' : ''} ${locked ? 'locked' : ''}" data-frame="${d.category || 'support'}" data-k="${k}" ${locked ? 'disabled' : ''} title="${d.name} — ${runtime.buildCardShortDescV41004(k)}"><span class="cardname">${d.name}</span><span class="cardart card-media">${runtime.cardBuildingImageTag(k, 'cardBuildingImage')}${runtime.buildCardFootprintV41004(k)}${runtime.buildCardCooldownV41004(runtime.P, k)}${runtime.buildCardUnitCostV41004(runtime.P, k)}</span>${runtime.isUniqueBuilding(runtime.P, k) ? '<span class="uniquechip">EGYEDI</span>' : ''}<span class="cardinfo"><p class="carddesc">${runtime.buildCardShortDescV41004(k)}</p></span><span class="cardcosts"><span class="woodcost ${woodMissing ? 'unaffordable' : 'affordable'}" data-cost-resource="wood" data-cost-amount="${wood}">${runtime.resourceIconTag('wood')} ${wood || '—'}</span><span class="stonecost ${stoneMissing ? 'unaffordable' : 'affordable'}" data-cost-resource="stone" data-cost-amount="${stone}">${runtime.resourceIconTag('stone')} ${stone || '—'}</span></span></button></div>`;
    }).join('');
    runtime.$$('#buildList .buildcard').forEach(b => b.onclick = () => {
      const k = b.dataset.k;
      runtime.state.selectedBuilding = null;
      runtime.state.lastPlacementHover = null;
      if (runtime.state.selectedBuild === k) runtime.state.selectedBuild = null;else {
        runtime.state.selectedBuild = k;
        runtime.state.buildRotation = runtime.rotationOptions(k)[0];
      }
      runtime.clearPlacementPreview();
      runtime.renderStatic();
    });
    const hint = runtime.$('#placementHint');
    if (runtime.state.selectedBuild) {
      const rotatable = runtime.rotationOptions(runtime.state.selectedBuild).length > 1;
      hint.innerHTML = `<span>${runtime.BUILDINGS[runtime.state.selectedBuild].name} · ${runtime.footprintText(runtime.state.selectedBuild, runtime.state.buildRotation)} · Kattints a lerakáshoz · az egér alatti mező körül forog</span>${rotatable ? '<button id="rotatePlacement" class="placementRotate" type="button">↻ FORGATÁS (jobb klikk)</button>' : ''}`;
      hint.classList.add('show');
      runtime.$('#rotatePlacement')?.addEventListener('click', e => {
        e.stopPropagation();
        runtime.rotateSelectedBuild();
      });
    } else {
      hint.classList.remove('show');
      hint.innerHTML = '';
    }
  };
  runtime.dynamicPickStates = function (c) {
    const states = [];
    if (runtime.hasLeg(c, 'last_line')) {
      const stacks = Math.floor(c.lostTowers || 0),
        bonus = stacks * 25;
      states.push({
        icon: '🔥',
        value: `${stacks}×`,
        kind: 'stack',
        title: `Utolsó védvonal: ${stacks}/3 stack · +${bonus}% egység HP és sebzés`
      });
    }
    if (runtime.hasLeg(c, 'double_choice')) {
      const progress = (c.nonLegendaryPicks || 0) % 3;
      states.push({
        icon: '✌️',
        value: `${progress}/3`,
        kind: 'stack',
        title: `Kettős választás: ${progress}/3 nem legendás választás · minden harmadiknál két fejlesztést vihetsz el`
      });
    }
    if (runtime.hasLeg(c, 'full_garrison_economy')) {
      const active = c.garrisonCap > 0 && runtime.reserveCount(c) >= c.garrisonCap;
      states.push({
        icon: '🏦',
        value: active ? '×2' : '—',
        kind: active ? 'active' : 'inactive',
        title: active ? 'Teltház aktív: a megtelt helyőrség miatt ×2 nyersanyagtermelés' : 'Teltház inaktív: töltsd meg a helyőrséget a ×2 nyersanyagtermeléshez'
      });
    }
    return states;
  };
  runtime.renderRelics = function () {
    const rows = [];
    for (const [id, n] of Object.entries(runtime.P.normal)) {
      const r = runtime.NORMAL.find(x => x.id === id);
      if (r) rows.push(`<div class="relicitem"><b>${r.icon} ${r.name} ×${n}</b>${r.description}</div>`);
    }
    for (const id of runtime.P.legends) {
      const r = runtime.LEGENDARY.find(x => x.id === id);
      if (!r) continue;
      if (id === 'overproduction') {
        const stacks = Math.floor(runtime.P.overflowStacks || 0),
          progress = Math.floor(runtime.P.overflowProgress || 0);
        rows.push(`<div class="relicitem legendary"><b>${r.icon} ${r.name} (+${stacks}% sebzés)</b>${r.description}<span class="relicProgressV497">Haladás: <b>${progress} / 500</b> a következő +1%-hoz.</span></div>`);
      } else rows.push(`<div class="relicitem legendary"><b>${r.icon} ${r.name}</b>${r.description}</div>`);
    }
    runtime.$('#relicList').innerHTML = rows.join('') || '<div class="relicitem"><b>Még nincs ereklyéd.</b>Az első négy választás csak épületfeloldás.</div>';
  };
  runtime.v496UpdateHudForQol = runtime.updateHud;
  runtime.updateHud = function () {
    runtime.v496UpdateHudForQol();
    runtime.updateBuildAffordabilityV497();
  };
  runtime.renderStatic();
  runtime.updateBuildAffordabilityV497();
}
