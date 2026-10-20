import { assetUrl } from '../assets/urls.js';
export function initializeUiReadableSummary(runtime) {
  const DISPLAY_LABEL = {
    'LEGYÁRTOTT EGYSÉG': 'Legyártott egység',
    'MEGÖLT EGYSÉG': 'Megölt egység',
    'ELVESZTETT EGYSÉG': 'Elvesztett egység',
    'ÉPÍTETT ÉPÜLET': 'Épített épület',
    'LEBONTOTT ÉPÜLET': 'Lebontott épület',
    'LEDÖNTÖTT ÚTTORONY': 'Ledöntött úttorony',
    'MAX. PÁLYASEREG': 'Max. pályasereg',
    'MAX. HELYŐRSÉG': 'Max. helyőrség',
    'VÁLASZTÁSOK': 'Választások',
    'COMMON / LEGENDARY': 'Common / Legendary',
    'ÉPÜLETFEJLESZTÉS': 'Épületfejlesztés',
    'ÖSSZES FEJLESZTÉSPICK': 'Összes fejlesztéspick',
    'MEGTERMELT NYERSI': 'Megtermelt nyersanyag',
    'ELKÖLTÖTT NYERSI': 'Elköltött nyersanyag',
    'FELOLDOTT ÉPÜLET': 'Feloldott épület',
    'FŐVÁROS HP': 'Főváros HP'
  };
  const MAIN_ORDER = ['LEGYÁRTOTT EGYSÉG', 'MEGÖLT EGYSÉG', 'ELVESZTETT EGYSÉG', 'ÉPÍTETT ÉPÜLET', 'MAX. PÁLYASEREG', 'VÁLASZTÁSOK', 'COMMON / LEGENDARY', 'MEGTERMELT NYERSI', 'ELKÖLTÖTT NYERSI', 'FŐVÁROS HP'];
  const MORE_ORDER = Object.keys(DISPLAY_LABEL).filter(k => !MAIN_ORDER.includes(k));
  const esc4995 = s => String(s ?? '').replace(/[&<>"']/g, ch => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[ch]);
  function readPanel4995(panel) {
    const stats = {};
    panel.querySelectorAll('.endCompareStat').forEach(el => {
      const label = el.querySelector('span')?.textContent?.trim();
      const value = el.querySelector('b')?.textContent?.trim();
      if (label) stats[label] = value || '0';
    });
    const badge = panel.querySelector('.endResultBadge');
    return {
      label: panel.querySelector('.endPlayerName small')?.textContent?.trim() || 'JÁTÉKOS',
      title: panel.querySelector('.endPlayerName b')?.textContent?.trim() || '',
      result: badge?.textContent?.trim() || '',
      win: badge?.classList.contains('win') || false,
      stats,
      sections: [...panel.querySelectorAll('.endSection')].map(x => x.outerHTML).join('')
    };
  }
  function rebuildEndV4995() {
    const modal = document.querySelector('#endOverlay .end'),
      box = document.querySelector('#endStats');
    if (!modal || !box || box.classList.contains('endCompareV4995')) return;
    const panels = [...box.querySelectorAll('.endPlayerPanel')];
    if (panels.length < 2) return;
    const a = readPanel4995(panels[0]),
      b = readPanel4995(panels[1]);
    modal.classList.add('v4995ReadableEnd');
    const rowHtml = key => `<div class="endVsRowV4995"><b class="endVsValueV4995 left">${esc4995(a.stats[key] ?? '0')}</b><span class="endVsLabelV4995">${esc4995(DISPLAY_LABEL[key])}</span><b class="endVsValueV4995 right">${esc4995(b.stats[key] ?? '0')}</b></div>`;
    const rows = MAIN_ORDER.map(rowHtml).join(''),
      moreRows = MORE_ORDER.map(rowHtml).join('');
    box.className = 'endStats endCompareV4995';
    box.innerHTML = `<section class="endVsPanelV4995">
      <div class="endVsHeadV4995">
        <div class="endSideV4995"><div class="who"><small>${esc4995(a.label)}</small><b>${esc4995(a.title)}</b></div><span class="miniBadge ${a.win ? 'win' : 'loss'}">${esc4995(a.result)}</span></div>
        <div class="endVsCenterV4995">MECCSÖSSZEHASONLÍTÁS</div>
        <div class="endSideV4995 right"><span class="miniBadge ${b.win ? 'win' : 'loss'}">${esc4995(b.result)}</span><div class="who"><small>${esc4995(b.label)}</small><b>${esc4995(b.title)}</b></div></div>
      </div>
      <div class="endVsTableV4995">${rows}</div>
      <details class="endDetailsV4995"><summary>További statisztika · egységek · épületek · fejlesztések</summary><div class="endMoreCompareV4995">${moreRows}</div><div class="endDetailColsV4995"><div class="endDetailSideV4995"><h4>${esc4995(a.label)}</h4>${a.sections}</div><div class="endDetailSideV4995"><h4>${esc4995(b.label)}</h4>${b.sections}</div></div></details>
    </section>`;
  }
  const oldFinishV4995 = runtime.finish;
  runtime.finish = function (win) {
    const out = oldFinishV4995(win);
    rebuildEndV4995();
    return out;
  };
  if (typeof runtime.mpShowEnd === 'function') {
    const oldMpShowEndV4995 = runtime.mpShowEnd;
    runtime.mpShowEnd = function () {
      const out = oldMpShowEndV4995();
      rebuildEndV4995();
      return out;
    };
  }
  if (window.__ROADLORDS_MATCH_STATS__?.renderMatchSummary) {
    const oldRenderSummaryV4995 = window.__ROADLORDS_MATCH_STATS__.renderMatchSummary;
    window.__ROADLORDS_MATCH_STATS__.renderMatchSummary = function (...args) {
      const out = oldRenderSummaryV4995(...args);
      rebuildEndV4995();
      return out;
    };
  }
  const oldPreviewPlacementV4995 = runtime.previewPlacement;
  runtime.previewPlacement = function (row, col) {
    const out = oldPreviewPlacementV4995(row, col);
    if (runtime.state.selectedBuild === 'stable' && !runtime.hasBranch(runtime.P, 'barracks', 'cavalry_barracks')) {
      document.querySelectorAll('#playerGrid .effectRangeCell.placementRange').forEach(x => x.remove());
    }
    return out;
  };
  window.__ROADLORDS_V4995__ = {
    rebuildEnd: rebuildEndV4995,
    stablePreviewUsesSynergy: () => runtime.hasBranch(runtime.P, 'barracks', 'cavalry_barracks')
  };
}
