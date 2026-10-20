import { assetUrl } from '../assets/urls.js';
export function initializeCityHighKeep(runtime) {
  const HIGH_KEEP = 'high_keep';
  const KEEP_BRANCH_SOURCE = 'high_keep_branch';
  const highKeepDef = {
    id: HIGH_KEEP,
    icon: '🏰',
    name: 'Magasvár',
    description: 'A Főépület azonnal +1 technológiai szintet kap, és mostantól csak 1×1 mezőt foglal. A grafika a korábbi helyének bal felső mezőjére zsugorodik. Ha ezzel éri el az L4-et, azonnal választanod kell a két L4 specializáció közül.',
    eligible: s => runtime.hasBuilding(s, 'keep') && runtime.levelOf(s, 'keep') < 4
  };
  if (!runtime.LEGENDARY.some(x => x.id === HIGH_KEEP)) runtime.LEGENDARY.push(highKeepDef);
  runtime.PICK_IMAGES[HIGH_KEEP] = runtime.CARD_IMAGES.keep || runtime.BUILDING_IMAGES.keep || runtime.PICK_IMAGES.building_hp || runtime.PICK_IMAGES.all_hp;
  function compactKeep(c) {
    const keep = runtime.buildingOf(c, 'keep')[0];
    if (!keep) return null;
    keep.compactKeep = true;
    return keep;
  }
  function isCompactKeepBuilding(b) {
    return !!(b && b.type === 'keep' && b.compactKeep);
  }
  const oldBuildingCellsV4954 = runtime.buildingCells;
  runtime.buildingCells = function (b) {
    if (isCompactKeepBuilding(b)) return [[b.row, b.col]];
    return oldBuildingCellsV4954(b);
  };
  const oldCityVisualSignatureV4954 = runtime.cityVisualSignature;
  runtime.cityVisualSignature = function (c) {
    return oldCityVisualSignatureV4954(c) + '§compactKeep:' + (runtime.buildingOf(c, 'keep')[0]?.compactKeep ? 1 : 0);
  };
  const oldRenderCityV4954 = runtime.renderCity;
  runtime.renderCity = function (container, c, interactive) {
    const out = oldRenderCityV4954(container, c, interactive);
    const keep = runtime.buildingOf(c, 'keep')[0];
    if (keep?.compactKeep && container) {
      const el = container.querySelector(`.building[data-id="${keep.id}"]`);
      if (el) {
        el.style.gridRow = `${keep.row + 1} / span 1`;
        el.style.gridColumn = `${keep.col + 1} / span 1`;
        el.classList.add('compactKeepVisual');
        const img = el.querySelector('.bsprite');
        if (img && !img.closest('.orcMapPlane')) {
          img.style.width = '100%';
          img.style.height = '100%';
        }
      }
    }
    return out;
  };
  const style = document.createElement('style');
  style.textContent = "@import url(\"" + (assetUrl("styles/features/city-high-keep-25.css") + "\");");
  document.head.appendChild(style);
  function queueKeepBranchChoice() {
    if (runtime.state.pendingChoices.includes(KEEP_BRANCH_SOURCE) || runtime.state.choiceContext?.source === KEEP_BRANCH_SOURCE) return;
    if (runtime.state.startChoices > 0) runtime.state.pendingChoices.unshift(KEEP_BRANCH_SOURCE);else runtime.state.pendingChoices.splice(Math.min(1, runtime.state.pendingChoices.length), 0, KEEP_BRANCH_SOURCE);
  }
  function chooseAiKeepBranch(c) {
    const opts = runtime.V4_BRANCHES.keep || [];
    if (!opts.length) return;
    let branch = null;
    if ((c.hp || 0) < (c.maxHp || 1) * .65) branch = opts.find(x => x.id === 'warcapital') || null;
    branch = branch || opts[Math.floor(Math.random() * opts.length)];
    if (branch) runtime.setBuildingLevel(c, 'keep', 4, branch.id);
  }
  const oldApplyChoiceV4954 = runtime.applyChoice;
  runtime.applyChoice = function (c, o, countEvent = true) {
    const isHigh = o?.kind === 'legendary' && o.id === HIGH_KEEP;
    const before = isHigh ? runtime.levelOf(c, 'keep') : 0;
    const out = oldApplyChoiceV4954(c, o, countEvent);
    if (isHigh) {
      const keep = compactKeep(c);
      const target = Math.min(4, before + 1);
      if (keep && target > before) {
        if (target === 4) {
          runtime.setBuildingLevel(c, 'keep', 4, null);
          if (c === runtime.P) queueKeepBranchChoice();else chooseAiKeepBranch(c);
        } else runtime.setBuildingLevel(c, 'keep', target);
      }
      runtime.recomputeCity(c, true);
      if (c === runtime.P) {
        runtime.toast(`Magasvár · Főépület L${runtime.levelOf(c, 'keep')} · helyigény 1×1.`);
        runtime.renderStatic();
      }
    }
    return out;
  };
  const oldChoiceContextV4954 = runtime.choiceContextForPlayer;
  runtime.choiceContextForPlayer = function () {
    const source = runtime.state.startChoices > 0 ? 'start' : runtime.state.pendingChoices[0];
    if (source === KEEP_BRANCH_SOURCE) {
      const opts = (runtime.V4_BRANCHES.keep || []).map(x => ({
        kind: 'building_branch',
        id: 'keep',
        branch: x.id,
        level: 4,
        icon: x.icon,
        name: x.name,
        description: x.description,
        details: 'Főépület · L4 specializáció'
      }));
      return {
        source: KEEP_BRANCH_SOURCE,
        tier: 'rare',
        subtype: 'upgrade',
        legendary: false,
        doubleTake: false,
        remaining: 1,
        kicker: 'MAGASVÁR · L4 SPECIALIZÁCIÓ',
        title: 'Válaszd ki a Főépület végső ágát',
        desc: 'A Magasvár L4-re emelte a Főépületet. Ez a választás nem kerül külön pickbe.',
        opts,
        freeRerolls: 0,
        freeRerollsMax: 0
      };
    }
    return oldChoiceContextV4954();
  };
  const oldRenderChoiceContextV4954 = runtime.renderChoiceContext;
  runtime.renderChoiceContext = function () {
    const overlay = runtime.$('#choiceOverlay');
    overlay?.classList.toggle('highKeepBranchChoice', runtime.state.choiceContext?.source === KEEP_BRANCH_SOURCE);
    return oldRenderChoiceContextV4954();
  };
  const oldUpdateChoiceToolsV4954 = runtime.updateChoiceTools;
  runtime.updateChoiceTools = function () {
    const out = oldUpdateChoiceToolsV4954();
    if (runtime.state.choiceContext?.source === KEEP_BRANCH_SOURCE) {
      const r = runtime.$('#rerollChoice'),
        b = runtime.$('#banChoice'),
        s = runtime.$('#skipChoice');
      if (r) r.disabled = true;
      if (b) b.disabled = true;
      if (s) s.disabled = true;
    }
    return out;
  };
  const oldChooseV4954 = runtime.choose;
  runtime.choose = function (o, index = -1) {
    if (runtime.state.choiceContext?.source === KEEP_BRANCH_SOURCE) {
      if (!o || o.kind !== 'building_branch' || o.id !== 'keep') return;
      runtime.setBuildingLevel(runtime.P, 'keep', 4, o.branch);
      if (o.branch === 'empire') runtime.state.nextPick = Math.max(1, runtime.state.nextPick / 2);
      runtime.toast(`Főépület L4 · ${o.name}`);
      runtime.finalizeChoiceEvent();
      return;
    }
    return oldChooseV4954(o, index);
  };
  const oldFinalizeChoiceEventV4954 = runtime.finalizeChoiceEvent;
  runtime.finalizeChoiceEvent = function () {
    const special = runtime.state.choiceContext?.source === KEEP_BRANCH_SOURCE;
    const out = oldFinalizeChoiceEventV4954();
    if (special) runtime.$('#choiceOverlay')?.classList.remove('highKeepBranchChoice');
    return out;
  };
  if (typeof runtime.mpHandle === 'function') {
    const oldMpHandleV4954 = runtime.mpHandle;
    runtime.mpHandle = function (data) {
      if (data?.type === 'high_keep_branch_choice' && runtime.MP.role === 'host') {
        runtime.MP.guestChoicePending = true;
        runtime.mpSetStatus('Az ellenfél Magasvár L4 specializációt választ…', 'wait');
        return;
      }
      return oldMpHandleV4954(data);
    };
  }
  const oldShowChoiceV4954 = runtime.showChoice;
  runtime.showChoice = function () {
    const out = oldShowChoiceV4954();
    if (runtime.state.choiceContext?.source === KEEP_BRANCH_SOURCE && runtime.MP?.enabled && runtime.MP.role === 'guest') runtime.mpSend({
      type: 'high_keep_branch_choice'
    });
    return out;
  };
  const oldRenderInspectorV4954 = runtime.renderInspector;
  runtime.renderInspector = function () {
    const out = oldRenderInspectorV4954();
    const b = runtime.getBuilding(runtime.P, runtime.state.selectedBuilding) || runtime.getBuilding(runtime.E, runtime.state.selectedBuilding);
    if (b?.type === 'keep' && b.compactKeep) {
      const small = runtime.$('#inspector .ihead small');
      if (small) small.textContent = small.textContent.replace(/2×2\s*·\s*4 mező/g, '1×1 · 1 mező');
    }
    return out;
  };
  const oldRowsV4954 = runtime.buildingEffectRows;
  runtime.buildingEffectRows = function (c, b) {
    const rows = oldRowsV4954(c, b) || [];
    if (b.type === 'keep' && b.compactKeep) rows.unshift(['Helyigény', '1×1 · Magasvár']);
    return rows;
  };
  for (const c of [runtime.P, runtime.E]) if (runtime.hasLeg(c, HIGH_KEEP)) compactKeep(c);
  const brandSmall = document.querySelector('.brand small');
  if (brandSmall) brandSmall.textContent = 'V4.9.54 · P2P 1V1';
  if (runtime.MP?.lobby) {
    const ver = runtime.MP.lobby.querySelector('.menuVersion');
    if (ver) ver.textContent = 'V4.9.54 · P2P';
  }
  document.title = 'Roadlords V4.9.54 – Magasvár';
  window.__ROADLORDS_VERSION__ = '4.9.54-high-keep';
  window.__ROADLORDS_V4954__ = {
    HIGH_KEEP,
    compactKeep
  };
}
