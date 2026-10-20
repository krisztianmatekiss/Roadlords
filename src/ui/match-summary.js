import { assetUrl } from '../assets/urls.js';
export function initializeUiMatchSummary(runtime) {
  const style = document.createElement('style');
  style.textContent = "@import url(\"" + (assetUrl("styles/features/ui-match-summary-19.css") + "\");");
  document.head.appendChild(style);
  const tooltip = document.createElement('div');
  tooltip.className = 'endUpgradeTooltip';
  document.body.appendChild(tooltip);
  const esc = s => String(s ?? '').replace(/[&<>\"']/g, ch => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '\"': '&quot;',
    "'": '&#39;'
  })[ch]);
  const strip = s => String(s ?? '').replace(/<br\s*\/?>/gi, ' · ').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
  const unitNames = () => Object.fromEntries(Object.entries(runtime.UNITS).map(([k, v]) => [k, v.name]));
  const unitIcons = () => Object.fromEntries(Object.entries(runtime.UNITS).map(([k, v]) => [k, v.icon]));
  const buildingNames = () => Object.fromEntries(Object.entries(runtime.BUILDINGS).map(([k, v]) => [k, v.name]));
  const buildingIcons = () => Object.fromEntries(Object.entries(runtime.BUILDINGS).map(([k, v]) => [k, v.icon]));
  const resTotal = x => Math.round(runtime.RES.reduce((sum, r) => sum + (x?.[r] || 0), 0));
  const emptyStatsV4945 = () => ({
    builtTotal: 0,
    builtByType: {},
    demolishedTotal: 0,
    demolishedByType: {},
    unitProducedTotal: 0,
    unitProducedByType: {},
    unitDeathsTotal: 0,
    unitDeathsByType: {},
    unitKillsTotal: 0,
    unitKillsByType: {},
    towerKills: 0,
    buildingUnlocks: 0,
    buildingUpgrades: 0,
    commonPicks: 0,
    legendaryPicks: 0,
    resourcesProduced: runtime.C(),
    resourcesSpent: runtime.C(),
    maxField: 0,
    maxGarrison: 0
  });
  const statsOfV4944 = c => {
    const base = c._matchStats || (window.__ROADLORDS_MATCH_STATS__?.statsOf ? window.__ROADLORDS_MATCH_STATS__.statsOf(c) : emptyStatsV4945());
    const remote = c._remoteDecisionStats;
    if (!remote) return base;
    const merged = {
      ...base
    };
    for (const key of ['builtTotal', 'demolishedTotal', 'buildingUnlocks', 'buildingUpgrades', 'commonPicks', 'legendaryPicks']) if (remote[key] != null) merged[key] = remote[key];
    for (const key of ['builtByType', 'demolishedByType']) if (remote[key]) merged[key] = {
      ...remote[key]
    };
    merged.resourcesSpent = runtime.C();
    for (const r of runtime.RES) merged.resourcesSpent[r] = (base.resourcesSpent?.[r] || 0) + (remote.resourcesSpent?.[r] || 0);
    return merged;
  };
  function chips(obj, names, icons = {}) {
    const rows = Object.entries(obj || {}).filter(([, v]) => Number(v) > 0).sort((a, b) => b[1] - a[1]);
    return rows.length ? rows.map(([k, v]) => `<span class="endChip">${esc(icons[k] || '')} ${esc(names[k] || k)} <b>×${Math.round(v)}</b></span>`).join('') : '<span class="endEmpty">Nincs adat</span>';
  }
  function ownedUpgrades(c) {
    const out = [];
    for (const [id, count] of Object.entries(c.normal || {})) {
      if (!count) continue;
      const d = runtime.NORMAL.find(x => x.id === id);
      out.push({
        kind: 'common',
        name: d?.name || id,
        desc: strip(d?.description || 'Gyakori fejlesztés.'),
        count
      });
    }
    for (const id of c.legends || []) {
      const d = runtime.LEGENDARY.find(x => x.id === id);
      out.push({
        kind: 'legendary',
        name: d?.name || id,
        desc: strip(d?.description || 'Legendás fejlesztés.'),
        count: 1
      });
    }
    for (const [type, rawLevel] of Object.entries(c.levels || {})) {
      const d = runtime.BUILDINGS[type],
        level = Math.max(1, Number(rawLevel) || 1);
      if (!d || level < 2) continue;
      for (let lv = 2; lv <= Math.min(3, level); lv++) {
        out.push({
          kind: 'building',
          name: `${d.name} ${lv === 2 ? 'II' : 'III'}`,
          desc: `${d.name}: az egész épülettípus technológiai szintje L${lv}. ${strip(d.description || '')}`,
          count: 1
        });
      }
      if (level >= 4) {
        const branchId = runtime.branchOf(c, type),
          branch = (runtime.V4_BRANCHES[type] || []).find(x => x.id === branchId);
        if (branch) out.push({
          kind: 'building',
          name: `${d.name} · ${branch.name}`,
          desc: strip(branch.description || d.description || ''),
          count: 1
        });
      }
    }
    return out;
  }
  function upgradeHtml(c) {
    const rows = ownedUpgrades(c);
    if (!rows.length) return '<span class="endEmpty">Nem szerzett fejlesztést.</span>';
    const order = {
      legendary: 0,
      building: 1,
      common: 2
    };
    rows.sort((a, b) => order[a.kind] - order[b.kind] || a.name.localeCompare(b.name, 'hu'));
    return rows.map(u => `<span class="endUpgrade ${u.kind}" data-upgrade-name="${esc(u.name)}" data-upgrade-desc="${esc(u.desc)}">${u.kind === 'legendary' ? '★ ' : u.kind === 'building' ? '⌂ ' : ''}${esc(u.name)}${u.count > 1 ? ` <span class="stack">×${u.count}</span>` : ''}</span>`).join('');
  }
  function playerPanel(c, label, result) {
    const st = statsOfV4944(c),
      taken = (st.commonPicks || 0) + (st.legendaryPicks || 0) + (st.buildingUpgrades || 0);
    const uNames = unitNames(),
      uIcons = unitIcons(),
      bNames = buildingNames(),
      bIcons = buildingIcons();
    const produced = chips(st.unitProducedByType, uNames, uIcons),
      kills = chips(st.unitKillsByType, uNames, uIcons),
      builds = chips(st.builtByType, bNames, bIcons);
    return `<section class="endPlayerPanel">
      <div class="endPlayerHead"><div class="endPlayerName"><small>${esc(label)}</small><b>${result ? 'Győztes sereg' : 'Elesett sereg'}</b></div><span class="endResultBadge ${result ? 'win' : 'loss'}">${result ? 'GYŐZELEM' : 'VERESÉG'}</span></div>
      <div class="endPlayerBody">
        <div class="endCompareGrid">
          <div class="endCompareStat"><span>LEGYÁRTOTT EGYSÉG</span><b>${st.unitProducedTotal || 0}</b></div>
          <div class="endCompareStat"><span>MEGÖLT EGYSÉG</span><b>${st.unitKillsTotal || 0}</b></div>
          <div class="endCompareStat"><span>ELVESZTETT EGYSÉG</span><b>${st.unitDeathsTotal || 0}</b></div>
          <div class="endCompareStat"><span>ÉPÍTETT ÉPÜLET</span><b>${st.builtTotal || 0}</b></div>
          <div class="endCompareStat"><span>LEBONTOTT ÉPÜLET</span><b>${st.demolishedTotal || 0}</b></div>
          <div class="endCompareStat"><span>LEDÖNTÖTT ÚTTORONY</span><b>${st.towerKills || 0}</b></div>
          <div class="endCompareStat"><span>MAX. PÁLYASEREG</span><b>${st.maxField || 0}</b></div>
          <div class="endCompareStat"><span>MAX. HELYŐRSÉG</span><b>${st.maxGarrison || 0}</b></div>
          <div class="endCompareStat"><span>VÁLASZTÁSOK</span><b>${c.pickCount || 0}</b></div>
          <div class="endCompareStat"><span>COMMON / LEGENDARY</span><b>${st.commonPicks || 0} / ${st.legendaryPicks || 0}</b></div>
          <div class="endCompareStat"><span>ÉPÜLETFEJLESZTÉS</span><b>${st.buildingUpgrades || 0}</b></div>
          <div class="endCompareStat"><span>ÖSSZES FEJLESZTÉSPICK</span><b>${taken}</b></div>
          <div class="endCompareStat"><span>MEGTERMELT NYERSI</span><b>${resTotal(st.resourcesProduced)}</b></div>
          <div class="endCompareStat"><span>ELKÖLTÖTT NYERSI</span><b>${resTotal(st.resourcesSpent)}</b></div>
          <div class="endCompareStat"><span>FELOLDOTT ÉPÜLET</span><b>${st.buildingUnlocks || 0}</b></div>
          <div class="endCompareStat"><span>FŐVÁROS HP</span><b>${Math.max(0, Math.ceil(c.hp || 0))}</b></div>
        </div>
        <div class="endSection"><h3>⚔ Legyártott egységek</h3><div class="endChipRows">${produced}</div></div>
        <div class="endSection"><h3>☠ Ölések egységtípusonként</h3><div class="endChipRows">${kills}</div></div>
        <div class="endSection"><h3>🏗 Felépített épületek</h3><div class="endChipRows">${builds}</div></div>
        <div class="endSection"><h3>✦ Fejlesztések <small>VIDD RÁ AZ EGERET A LEÍRÁSHOZ</small></h3><div class="endUpgrades">${upgradeHtml(c)}</div></div>
      </div>
    </section>`;
  }
  function renderDualMatchSummary(win) {
    const playerWin = !!win;
    runtime.$('#endIcon').textContent = playerWin ? '♛' : '☠';
    runtime.$('#endTitle').textContent = playerWin ? 'Győzelem!' : 'Vereség';
    runtime.$('#endText').textContent = `Meccsidő: ${runtime.fmt(runtime.state.time)} · mindkét fél teljes statisztikája`;
    let box = runtime.$('#endStats');
    if (!box) {
      box = document.createElement('div');
      box.id = 'endStats';
      runtime.$('#restartBtn').before(box);
    }
    box.className = 'endStats dualSummary';
    const inMulti = typeof runtime.MP !== 'undefined' && runtime.MP.enabled && runtime.MP.role && runtime.MP.role !== 'solo';
    const playerLabel = inMulti ? runtime.MP.playerName || 'JÁTÉKOS' : 'TE';
    const enemyLabel = inMulti ? runtime.MP.opponentName || 'ELLENFÉL' : 'AI';
    box.innerHTML = playerPanel(runtime.P, playerLabel, playerWin) + playerPanel(runtime.E, enemyLabel, !playerWin);
  }
  function showTooltip(el, x, y) {
    if (!el) return;
    tooltip.innerHTML = `<b>${esc(el.dataset.upgradeName || 'Fejlesztés')}</b><span>${esc(el.dataset.upgradeDesc || '')}</span>`;
    tooltip.style.display = 'block';
    const pad = 14,
      rect = tooltip.getBoundingClientRect();
    let left = x + 14,
      top = y + 14;
    if (left + rect.width > innerWidth - pad) left = x - rect.width - 14;
    if (top + rect.height > innerHeight - pad) top = y - rect.height - 14;
    tooltip.style.left = Math.max(pad, left) + 'px';
    tooltip.style.top = Math.max(pad, top) + 'px';
  }
  document.addEventListener('mousemove', e => {
    const el = e.target.closest?.('.endUpgrade[data-upgrade-desc]');
    if (el) showTooltip(el, e.clientX, e.clientY);else tooltip.style.display = 'none';
  }, true);
  document.addEventListener('mouseleave', () => tooltip.style.display = 'none', true);
  runtime.finish = function (win) {
    if (runtime.state.ended) return;
    runtime.state.ended = true;
    runtime.state.running = false;
    runtime.state.modal = true;
    renderDualMatchSummary(!!win);
    runtime.$('#endOverlay').classList.remove('hidden');
  };
  if (typeof runtime.mpShowEnd === 'function') runtime.mpShowEnd = function () {
    if (!runtime.state.ended) return;
    renderDualMatchSummary(runtime.P.hp > 0 && runtime.E.hp <= 0);
    runtime.$('#endOverlay').classList.remove('hidden');
  };
  if (window.__ROADLORDS_MATCH_STATS__) window.__ROADLORDS_MATCH_STATS__.renderMatchSummary = renderDualMatchSummary;
  const brandSmall = document.querySelector('.brand small');
  if (brandSmall) brandSmall.textContent = 'V4.11.18 · P2P 1V1';
  if (typeof runtime.MP !== 'undefined' && runtime.MP?.lobby) {
    const ver = runtime.MP.lobby.querySelector('.menuVersion');
    if (ver) ver.textContent = 'V4.11.18 · P2P';
  }
  document.title = 'Roadlords V4.9.44 – Kétoldalas meccsösszesítő';
  window.__ROADLORDS_VERSION__ = '4.9.44-dual-end-stats';
}
