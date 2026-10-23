import { assetUrl } from '../assets/urls.js';
export function initializeUiChoiceCards(runtime) {
  function v4997ShortDesc(type) {
    const d = runtime.BUILDINGS[type];
    if (!d) return '';
    return d.description || '';
  }
  function v4997ChoiceDetails(c, type) {
    const d = runtime.BUILDINGS[type];
    if (!d) return '';
    if (c.race === 'undead') return runtime.buildingChoiceDetails(c, type);
    if (d.unit) {
      const u = runtime.UNITS[d.unit];
      return '';
    }
    if (type === 'lumber') return 'Termelés: <b>Fa</b>';
    if (type === 'stonecutter') return 'Termelés: <b>Kő</b>';
    if (type === 'farm') return 'Termelés: <b>Élelem</b>';
    return '';
  }
  function v4997FootprintHTML(type) {
    const shape = (runtime.BUILDINGS[type]?.shape || [[0, 0]]).map(([r, c]) => [Number(r) || 0, Number(c) || 0]);
    const maxR = Math.max(0, ...shape.map(x => x[0])),
      maxC = Math.max(0, ...shape.map(x => x[1]));
    const set = new Set(shape.map(([r, c]) => `${r}:${c}`));
    const cells = [];
    for (let r = 0; r <= maxR; r++) for (let c = 0; c <= maxC; c++) cells.push(`<i class="${set.has(`${r}:${c}`) ? 'on' : 'off'}"></i>`);
    return `<span class="pickFootprint" style="--fp-cols:${maxC + 1};--fp-rows:${maxR + 1}" aria-hidden="true">${cells.join('')}</span>`;
  }
  function v4997UnitCostHTML(c, type) {
    const d = runtime.BUILDINGS[type];
    if (!d?.unit) return '';
    const co = runtime.unitCost(c, d.unit),
      parts = runtime.RES.filter(r => (co[r] || 0) > 0).map(r => `<span>${runtime.resourceIconTag(r, true)}<b>${Math.round(co[r])}</b></span>`);
    return parts.length ? `<span class="pickUnitCost" aria-label="Egységköltség">${parts.join('')}</span>` : '';
  }
  function v41000CooldownHTML(c, type) {
    const d = runtime.BUILDINGS[type];
    if (!d?.unit) return '';
    const t = runtime.previewTrainingTime(c, type, runtime.levelOf(c, type));
    if (!Number.isFinite(t)) return '';
    const clock = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 7.2v5.1l3.7 2.2" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    return `<span class="pickCD" aria-label="Gyártási idő"><span class="cdClock">${clock}</span><b>${t.toFixed(1)} s</b></span>`;
  }
  runtime.makeBuildingChoice = function (c, k) {
    const d = runtime.BUILDINGS[k];
    return {
      kind: 'building',
      id: k,
      icon: d.icon,
      name: d.name,
      description: v4997ShortDesc(k),
      details: v4997ChoiceDetails(c, k)
    };
  };
  runtime.renderChoice = function (opts, kicker, title, desc, legendary) {
    runtime.$('#choiceKicker').textContent = kicker;
    runtime.$('#choiceTitle').textContent = title;
    runtime.$('#choiceDesc').textContent = '';
    const list = runtime.$('#choiceList');
    list.classList.toggle('banmode', runtime.state.banMode);
    list.classList.toggle('five', opts.length === 5);
    list.classList.toggle('six', opts.length === 6);
    list.innerHTML = opts.map((o, i) => {
      const buildingKind = ['building', 'building_upgrade', 'building_branch'].includes(o.kind),
        unlock = o.kind === 'building',
        d = buildingKind ? runtime.BUILDINGS[o.id] : null,
        price = unlock ? runtime.buildPrice(runtime.P, o.id) : null;
      const label = unlock ? 'ÚJ ÉPÜLET' : o.kind === 'building_branch' ? 'L4 SPECIALIZÁCIÓ' : o.kind === 'building_upgrade' ? 'ÉPÜLETFEJLESZTÉS' : o.kind === 'normal' ? 'HALMOZHATÓ FEJLESZTÉS' : 'LEGENDÁS EREKLYE';
      const art = buildingKind ? runtime.cardBuildingImageTag(o.id, 'choiceBuildingImage') : runtime.choiceUnitArt(o);
      const overlays = buildingKind ? `${v4997FootprintHTML(o.id)}${v41000CooldownHTML(runtime.P, o.id)}${v4997UnitCostHTML(runtime.P, o.id)}` : '';
      const footer = unlock ? `<span class="woodcost">${runtime.resourceIconTag('wood', true)}${Math.ceil(price.wood || 0) || '—'}</span><span class="stonecost">${runtime.resourceIconTag('stone', true)}${Math.ceil(price.stone || 0) || '—'}</span>` : o.kind === 'building_branch' ? '<span class="levelup branchTag">L3 → L4 · VÁLASZTOTT ÁG</span>' : o.kind === 'building_upgrade' ? `<span class="levelup">L${runtime.levelOf(runtime.P, o.id)} → L${runtime.upgradeTargetLevel(runtime.P, o.id)}</span>` : `<span class="picktag">${o.kind === 'legendary' ? 'LEGENDÁS' : 'PASSZÍV'}${o.kind === 'normal' && runtime.P.normal[o.id] ? ` · ×${runtime.P.normal[o.id]}` : ''}</span>`;
      const branch = o.kind === 'building_branch' ? (runtime.V4_BRANCHES[o.id] || []).find(x => x.id === o.branch) : null;
      const description = unlock ? v4997ShortDesc(o.id) : o.kind === 'building_upgrade' ? '' : branch?.description || o.description;
      const details = unlock ? v4997ChoiceDetails(runtime.P, o.id) : o.kind === 'building_upgrade' ? runtime.buildingUpgradeDetails(runtime.P, o.id).replace(/^Minden[^<]*(?=<span|<br>)/, '').replace(/^<br>/, '') : o.details;
      return `<button class="choice gamecard ${o.kind === 'legendary' || legendary ? 'legendary' : ''} ${o.kind === 'normal' ? 'normalopt' : ''} ${buildingKind ? 'buildingchoice' : ''} ${unlock ? 'buildingunlock' : ''}" data-frame="${unlock ? d?.category || 'support' : o.kind === 'legendary' || legendary ? 'legendary' : 'common'}" data-i="${i}">${label ? `<span class="ctype">${label}</span>` : ''}<h3>${o.name}</h3><span class="choiceArt card-media">${art}${overlays}</span><span class="choiceBody"><p>${description || ''}</p>${details ? `<span class="choicemeta">${details}</span>` : ''}</span><span class="choiceFooter">${footer}</span></button>`;
    }).join('');
    runtime.$$('#choiceList .choice').forEach(b => b.onclick = () => {
      const i = +b.dataset.i;
      if (runtime.state.banMode) runtime.banChoiceAt(i);else runtime.choose(opts[i], i);
    });
    runtime.updateChoiceTools();
  };
  if (runtime.state.choiceContext && runtime.state.modal) runtime.renderChoiceContext();
  const style = document.createElement('style');
  style.id = 'v4997-pick-ui-cleanup';
  style.textContent = "@import url(\"" + (assetUrl("styles/features/ui-choice-cards-42.css") + "\");");
  document.head.appendChild(style);
  if (runtime.state.choiceContext && runtime.state.modal) runtime.renderChoiceContext();
  window.__ROADLORDS_VERSION__ = '4.9.97-pick-ui-cleanup';
}
