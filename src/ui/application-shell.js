import { installGameMusic } from "../audio/game-player.js";
import { installMenuMusic } from "../audio/menu-player.js";
import { assetUrl } from '../assets/urls.js';
import { createCodexCards } from './codex-cards.js';
export function installApplicationShell(game) {
  (() => {
    const styleV4968 = document.createElement('style');
    styleV4968.textContent = "@import url(\"" + (assetUrl("styles/shell/01.css") + "\");");
    document.head.appendChild(styleV4968);
    const brandSmall = document.querySelector('.brand small');
    if (brandSmall) brandSmall.textContent = 'V4.9.68 · P2P 1V1';
    const menuVerV4968 = document.querySelector('.menuVersion');
    if (menuVerV4968) menuVerV4968.textContent = 'V4.9.68 · P2P';
    document.title = 'Roadlords V4.9.68 – Topbar layout fix';
    window.__ROADLORDS_VERSION__ = '4.9.68-topbar-layout-fix';
  })();
  (() => {
    const styleV4969 = document.createElement('style');
    styleV4969.textContent = "@import url(\"" + (assetUrl("styles/shell/02.css") + "\");");
    document.head.appendChild(styleV4969);
    function syncMenuHudV4969() {
      const lobby = typeof MP !== 'undefined' && MP?.lobby ? MP.lobby : document.querySelector('.mpLobby');
      const menuOpen = !!(lobby && getComputedStyle(lobby).display !== 'none');
      document.body.classList.toggle('roadlords-menu-open', menuOpen);
    }
    const lobbyV4969 = typeof MP !== 'undefined' && MP?.lobby ? MP.lobby : document.querySelector('.mpLobby');
    if (lobbyV4969) {
      const observerV4969 = new MutationObserver(syncMenuHudV4969);
      observerV4969.observe(lobbyV4969, {
        attributes: true,
        attributeFilter: ['style', 'class']
      });
    }
    syncMenuHudV4969();
    requestAnimationFrame(syncMenuHudV4969);
    const brandSmall = document.querySelector('.brand small');
    if (brandSmall) brandSmall.textContent = 'V4.9.69 · P2P 1V1';
    const menuVerV4969 = document.querySelector('.menuVersion');
    if (menuVerV4969) menuVerV4969.textContent = 'V4.9.69 · P2P';
    document.title = 'Roadlords V4.9.69 – Menu HUD visibility fix';
    window.__ROADLORDS_VERSION__ = '4.9.69-menu-hud-visibility-fix';
  })();
  (() => {
    const styleV4970 = document.createElement('style');
    styleV4970.textContent = "@import url(\"" + (assetUrl("styles/shell/03.css") + "\");");
    document.head.appendChild(styleV4970);
    // Percentage sizing and persistence are owned by version-and-scaling.js.
    const brandSmall = document.querySelector('.brand small');
    if (brandSmall) brandSmall.textContent = 'V4.9.70 · P2P 1V1';
    const menuVerV4970 = document.querySelector('.menuVersion');
    if (menuVerV4970) menuVerV4970.textContent = 'V4.9.70 · P2P';
    document.title = 'Roadlords V4.9.70 – Readable UI';
    window.__ROADLORDS_VERSION__ = '4.9.70-readable-ui';
  })();
  (() => {
    const brandSmall = document.querySelector('.brand small');
    if (brandSmall) brandSmall.textContent = 'V4.9.71 · P2P 1V1';
    const menuVer = document.querySelector('.menuVersion');
    if (menuVer) menuVer.textContent = 'V4.9.71 · P2P';
    document.title = 'Roadlords V4.9.71 – Multiplayer sync + közös gyorsítás';
    window.__ROADLORDS_VERSION__ = '4.9.71-multiplayer-sync-speed-consent';
  })();
  (() => {
    const brandSmall = document.querySelector('.brand small');
    if (brandSmall) brandSmall.textContent = 'V4.9.72 · P2P 1V1';
    const menuVer = document.querySelector('.menuVersion');
    if (menuVer) menuVer.textContent = 'V4.9.72 · P2P';
    document.title = 'Roadlords V4.9.72 – Pick szöveg + toast + hotkey QA';
    window.__ROADLORDS_VERSION__ = '4.9.72-pick-text-toast-hotkey-qa';
  })();
  (() => {
    const brandSmall = document.querySelector('.brand small');
    if (brandSmall) brandSmall.textContent = 'V4.9.73 · P2P 1V1';
    const menuVer = document.querySelector('.menuVersion');
    if (menuVer) menuVer.textContent = 'V4.9.73 · P2P';
    document.title = 'Roadlords V4.9.73 – Informatív épületszint-pickek';
    window.__ROADLORDS_VERSION__ = '4.9.73-upgrade-descriptions';
  })();
  (() => {
    const brandSmall = document.querySelector('.brand small');
    if (brandSmall) brandSmall.textContent = 'V4.9.74 · P2P 1V1';
    const menuVer = document.querySelector('.menuVersion');
    if (menuVer) menuVer.textContent = 'V4.9.74 · P2P';
    document.title = 'Roadlords V4.9.74 – Multiplayer kapcsolat-stabilitás';
    window.__ROADLORDS_VERSION__ = '4.9.74-multiplayer-connection-stability';
  })();
  (() => {
    const brandSmall = document.querySelector('.brand small');
    if (brandSmall) brandSmall.textContent = 'V4.9.75 · P2P 1V1';
    const menuVer = document.querySelector('.menuVersion');
    if (menuVer) menuVer.textContent = 'V4.9.75 · P2P';
    document.title = 'Roadlords V4.9.75 – Multiplayer reconnect grace';
    window.__ROADLORDS_VERSION__ = '4.9.75-multiplayer-reconnect-grace';
  })();
  (() => {
    window.aiUnitPickIds = function (key) {
      const common = {
        swordsman: ['swordsman_dmg', 'swordsman_hp', 'sword_as'],
        spearman: ['spear_dmg', 'spear_hp', 'spear_range'],
        archer: ['archer_dmg', 'archer_hp', 'archer_range'],
        knight: ['knight_dmg', 'knight_hp', 'knight_move'],
        catapult: ['catapult_dmg', 'catapult_hp', 'cat_build'],
        mage: ['mage_dmg', 'mage_hp', 'mage_aoe'],
        priest: ['priest_dmg', 'priest_hp']
      };
      return common[key] || [];
    };
    const brandSmall = document.querySelector('.brand small');
    if (brandSmall) brandSmall.textContent = 'V4.9.76 · P2P 1V1';
    const menuVer = document.querySelector('.menuVersion');
    if (menuVer) menuVer.textContent = 'V4.9.76 · P2P';
    document.title = 'Roadlords V4.9.76 – AI pick ID fix';
    window.__ROADLORDS_VERSION__ = '4.9.76-ai-pick-id-fix';
  })();
  (() => {
    const brandSmall = document.querySelector('.brand small');
    if (brandSmall) brandSmall.textContent = 'V4.9.77 · P2P 1V1';
    const menuVer = document.querySelector('.menuVersion');
    if (menuVer) menuVer.textContent = 'V4.9.77 · P2P';
    document.title = 'Roadlords V4.9.77 – Dinamikus AI nyitás';
    window.__ROADLORDS_VERSION__ = '4.9.77-dynamic-ai-opening';
  })();
  (() => {
    const brandSmall = document.querySelector('.brand small');
    if (brandSmall) brandSmall.textContent = 'V4.9.78 · P2P 1V1';
    const menuVer = document.querySelector('.menuVersion');
    if (menuVer) menuVer.textContent = 'V4.9.78 · P2P';
    document.title = 'Roadlords V4.9.78 – Építkezést értő AI';
    window.__ROADLORDS_VERSION__ = '4.9.78-construction-aware-ai';
  })();
  (() => {
    const brandSmall = document.querySelector('.brand small');
    if (brandSmall) brandSmall.textContent = 'V4.9.79 · P2P 1V1';
    const menuVer = document.querySelector('.menuVersion');
    if (menuVer) menuVer.textContent = 'V4.9.79 · P2P';
    document.title = 'Roadlords V4.9.79 – AI saját haditerv és adaptáció';
    window.__ROADLORDS_VERSION__ = '4.9.79-ai-own-plan-adaptation';
  })();
  (() => {
    const brandSmall = document.querySelector('.brand small');
    if (brandSmall) brandSmall.textContent = 'V4.9.88 · P2P 1V1';
    const menuVer = document.querySelector('.menuVersion');
    if (menuVer) menuVer.textContent = 'V4.9.88 · P2P';
    document.title = 'Roadlords V4.9.88 – AI planner final QA';
    window.__ROADLORDS_VERSION__ = '4.9.88-ai-planner-final-qa';
  })();
  (() => {
    const R = window.__ROADLORDS__ || {};
    const X = window.__ROADLORDS_LEXICON_BRIDGE__ || {};
    const {
      BUILDINGS = {},
      UNITS = {},
      NORMAL = [],
      LEGENDARY = [],
      V4_BRANCHES = {},
      PICK_UNIT_IMAGES = {},
      PICK_IMAGES = {}
    } = R;
    const {
      makeCity,
      buildingUpgradeDetails,
      footprintText,
      costText,
      buildPrice,
      C,
      cardBuildingImageTag,
      unitImageTag,
      resourceIconTag,
      buildCardFootprintV41004
    } = X;
    if (!makeCity || !buildingUpgradeDetails || !footprintText || !costText || !C) return;
    const lobby = document.querySelector('.mpLobby');
    if (!lobby) return;
    const mainCard = lobby.querySelector('.mpLobbyCard');
    const menuMain = lobby.querySelector('.menuMain');
    if (!mainCard || !menuMain) return;
    const style = document.createElement('style');
    style.textContent = "@import url(\"" + (assetUrl("styles/shell/04.css") + "\");");
    document.head.appendChild(style);
    function makePanel(cls, title) {
      const panel = document.createElement('section');
      panel.className = `rlMenuPanel ${cls}`;
      panel.innerHTML = `<div class="rlMenuPanelCard ${cls === 'rlSettingsPanel' ? 'rlSettingsCard' : ''}"><header class="rlPanelHead"><h2>${title}</h2><button class="rlPanelBack" type="button">VISSZA</button></header><div class="rlPanelBody"></div></div>`;
      lobby.appendChild(panel);
      panel.querySelector('.rlPanelBack').onclick = () => closePanel(panel);
      return panel;
    }
    function openPanel(panel) {
      lobby.querySelectorAll('.rlMenuPanel').forEach(x => x.classList.remove('show'));
      panel.classList.add('show');
    }
    function closePanel(panel) {
      panel?.classList.remove('show');
    }
    const settings = makePanel('rlSettingsPanel', 'BEÁLLÍTÁSOK');
    const codex = makePanel('rlCodexPanel', 'LEXIKON');
    const settingsBtn = document.createElement('button');
    settingsBtn.id = 'rlOpenSettings';
    settingsBtn.className = 'menuButton rlMenuExtraBtn';
    settingsBtn.type = 'button';
    settingsBtn.textContent = 'BEÁLLÍTÁSOK';
    const codexBtn = document.createElement('button');
    codexBtn.id = 'rlOpenCodex';
    codexBtn.className = 'menuButton rlMenuExtraBtn';
    codexBtn.type = 'button';
    codexBtn.textContent = 'LEXIKON';
    menuMain.append(settingsBtn, codexBtn);
    settingsBtn.onclick = () => openPanel(settings);
    codexBtn.onclick = () => {
      renderCodex();
      openPanel(codex);
    };
    const settingsBody = settings.querySelector('.rlPanelBody');
    settingsBody.innerHTML = `<section class="rlSection"><h3 class="rlSectionTitle">MEGJELENÍTÉS</h3><div class="rlScaleHome"></div><div class="rlSettingsNote">A felületméret a gombok, szövegek és kártyák méretét állítja. A böngésző megjegyzi a választásodat. Az automatikus mód az ablak méretéhez igazodik.</div></section><section class="rlSection"><h3 class="rlSectionTitle">GYORSGOMBOK</h3><div class="rlHotkeys"></div></section>`;
    const hotkeys = [[['Q'], 'Mind építési fül'], [['W'], 'Gazdaság fül'], [['E'], 'Hadsereg fül'], [['R'], 'Támogatás fül'], [['1–9'], 'Az adott látható építőkártya kiválasztása'], [['SHIFT'], 'Folyamatos építés ugyanabból az épületből'], [['JOBB KLIKK'], 'Épület forgatása lerakás közben'], [['ESC'], 'Építés megszakítása / utolsó épületablak bezárása'], [['T'], 'Játéksebesség váltása. Multiban a gyorsításhoz mindkét játékos jóváhagyása kell.'], [['SPACE'], 'Szünet / folytatás, csak egyjátékos módban.']];
    settingsBody.querySelector('.rlHotkeys').innerHTML = hotkeys.map(([keys, desc]) => `<div class="rlHotkeyRow"><span class="rlHotkeyKeys">${keys.map(k => `<kbd class="rlKey">${k}</kbd>`).join('')}</span><span class="rlHotkeyText">${desc}</span></div>`).join('');
    const codexBody = codex.querySelector('.rlPanelBody');
    codexBody.innerHTML = `<div class="rlCodexTools"><div class="rlCodexTabs"><button class="rlCodexTab active" data-tab="buildings" type="button">ÉPÜLETEK</button><button class="rlCodexTab" data-tab="units" type="button">EGYSÉGEK</button><button class="rlCodexTab" data-tab="common" type="button">GYAKORI</button><button class="rlCodexTab" data-tab="legendary" type="button">LEGENDÁS</button><button class="rlCodexTab" data-tab="statuses" type="button">ÁLLAPOTOK</button></div><input class="rlCodexSearch" type="search" placeholder="Keresés név vagy leírás alapján…" autocomplete="off"></div><div class="rlCodexCount"></div><div class="rlCodexGrid"></div>`;
    const search = codexBody.querySelector('.rlCodexSearch');
    const grid = codexBody.querySelector('.rlCodexGrid');
    const cards = createCodexCards(game);
    grid.addEventListener('click', event => {
      const button = event.target.closest('[data-codex-level]');
      if (!button) return;
      cards.selectLevel(button.closest('[data-codex-building]'), button.dataset.codexLevel);
      renderCodex();
    });
    const countEl = codexBody.querySelector('.rlCodexCount');
    let codexTab = 'buildings',
      codexRace = 'human';
    const raceBar = document.createElement('div');
    raceBar.className = 'orcRaceBar';
    raceBar.innerHTML = '<label class="raceField">FAJ<select id="codexRace"><option value="human">Emberek</option><option value="orc">Orkok</option><option value="undead">Élőhalottak</option></select></label><span class="orcNote"></span>';
    codexBody.prepend(raceBar);
    raceBar.querySelector('select').onchange = e => {
      codexRace = e.target.value;
      renderCodex();
    };
    const raceMatches = (d, k) => window.__ROADLORDS_FACTIONS__.matches(codexRace,d,k);
    const esc = s => String(s ?? '').replace(/[&<>"']/g, ch => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    })[ch]);
    const plain = s => String(s ?? '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    const matches = (name, desc, extra = '') => {
      const q = search.value.trim().toLocaleLowerCase('hu-HU');
      if (!q) return true;
      return `${plain(name)} ${plain(desc)} ${plain(extra)}`.toLocaleLowerCase('hu-HU').includes(q);
    };
    const categoryName = cat => ({
      economy: 'Gazdaság',
      military: 'Hadsereg',
      support: 'Támogatás',
      defense: 'Védelem'
    })[cat] || cat || 'Egyéb';
    const catName = cat => ({
      infantry: 'Gyalogság',
      cavalry: 'Lovasság',
      magic: 'Mágikus',
      siege: 'Ostrom'
    })[cat] || cat || '';
    function buildingCard(type, d) { return cards.building(type, codexRace); }
    function unitCard(key, u) { return cards.unit(key, u, codexRace); }
    function commonCard(item) { return cards.upgrade(item, 'normal', codexRace); }
    function legendaryCard(item) { return cards.upgrade(item, 'legendary', codexRace); }
    function renderCodex() {
      let rows = [];
      if (codexTab === 'statuses') {
        const defs = window.__ROADLORDS_STATUSES__.defs;
        grid.innerHTML = Object.entries(defs).filter(([k, d]) => matches(d[0], d[3])).map(([k, d]) => `<article class="rlCodexCard"><header class="rlCodexCardHead"><span class="rlCodexIcon" style="color:${d[2]}">${d[1]}</span><div class="rlCodexTitle"><h3>${d[0]}</h3></div></header><div class="rlCodexContent"><p>${d[3]}</p></div></article>`).join('');
        countEl.textContent = 'Közös állapotok · minden faj';
        raceBar.querySelector('.orcNote').textContent = '';
        return;
      }
      if (codexTab === 'buildings') rows = Object.entries(BUILDINGS).map(([k,d])=>[k,codexRace==='undead'&&k==='keep'?window.__ROADLORDS_UNDEAD__.buildings.keep:d]).filter(([k, d]) => raceMatches(d, k)).filter(([k, d]) => matches(d.name, d.description, `${categoryName(d.category)} ${k}`)).map(([k, d]) => buildingCard(k, d));else if (codexTab === 'units') rows = Object.entries(UNITS).filter(([k, u]) => raceMatches(u, k)).filter(([k, u]) => matches(u.name, '', `${catName(u.cat)} ${(u.tags || []).join(' ')} ${k}`)).map(([k, u]) => unitCard(k, u));else if (codexTab === 'common') rows = NORMAL.filter(x => raceMatches(x, x.id)).filter(x => matches(x.name, x.description, x.id)).map(commonCard);else rows = LEGENDARY.filter(x => raceMatches(x, x.id)).filter(x => matches(x.name, x.description, x.id)).map(legendaryCard);
      grid.innerHTML = rows.join('') || '<div class="rlCodexEmpty">Nincs találat.</div>';
      const total = (codexTab === 'buildings' ? Object.entries(BUILDINGS) : codexTab === 'units' ? Object.entries(UNITS) : (codexTab === 'common' ? NORMAL : LEGENDARY).map(x => [x.id, x])).filter(([k, d]) => raceMatches(d, k)).length;
      raceBar.querySelector('.orcNote').textContent = codexRace === 'undead' ? '7 egységváltozat · 20 épület · 24 gyakori és 13 legendás fejlesztés' : codexRace === 'orc' ? '7 egység · 19 épület · 30 gyakori és 26 legendás fejlesztés' : '';
      countEl.textContent = `${rows.length} / ${total} bejegyzés`;
    }
    codexBody.querySelectorAll('.rlCodexTab').forEach(btn => btn.onclick = () => {
      codexTab = btn.dataset.tab;
      codexBody.querySelectorAll('.rlCodexTab').forEach(x => x.classList.toggle('active', x === btn));
      renderCodex();
    });
    search.addEventListener('input', renderCodex);
    document.addEventListener('keydown', e => {
      if (e.key !== 'Escape') return;
      const shown = [...lobby.querySelectorAll('.rlMenuPanel.show')].pop();
      if (shown) {
        e.preventDefault();
        e.stopImmediatePropagation();
        closePanel(shown);
      }
    }, true);
    renderCodex();
    const brandSmall = document.querySelector('.brand small');
    if (brandSmall) brandSmall.textContent = 'V4.9.89 · P2P 1V1';
    const menuVer = document.querySelector('.menuVersion');
    if (menuVer) menuVer.textContent = 'V4.9.89 · P2P';
    document.title = 'Roadlords V4.9.89 – Beállítások + Lexikon';
    window.__ROADLORDS_VERSION__ = '4.9.89-settings-codex';
  })();
  installMenuMusic();
  (() => {
    const lobby = document.querySelector('.mpLobby');
    const gameState = window.__ROADLORDS__?.state;
    const settingsPanel = document.querySelector('.rlSettingsPanel');
    const codexPanel = document.querySelector('.rlCodexPanel');
    if (!lobby || !settingsPanel || !codexPanel || !gameState) return;
    settingsPanel.id = 'rlSettingsPanel';
    codexPanel.id = 'rlCodexPanel';
    for (const panel of [settingsPanel, codexPanel]) {
      if (panel.parentElement !== document.body) document.body.appendChild(panel);
    }
    const style = document.createElement('style');
    style.textContent = "@import url(\"" + (assetUrl("styles/shell/06.css") + "\");");
    document.head.appendChild(style);
    const musicApi = window.__ROADLORDS_MENU_MUSIC__;
    const settingsBody = settingsPanel.querySelector('.rlPanelBody');
    if (settingsBody && musicApi && !settingsBody.querySelector('.rlSoundSection')) {
      const sound = document.createElement('section');
      sound.className = 'rlSection rlSoundSection';
      sound.innerHTML = `<h3 class="rlSectionTitle">HANG</h3>
      <div class="rlSoundRow"><div><b>MENÜZENE</b><small>Fortified City · online stream</small></div><button type="button" class="rlMusicToggle"></button></div>
      <div class="rlSoundRow"><div><b>ZENE HANGERŐ</b><small class="rlMusicVolumeLabel"></small></div><input class="rlMusicVolume" type="range" min="0" max="100" step="1"></div>
      <div class="rlSettingsNote">A menüzene internetkapcsolatot igényel. A hangerőt és a ki/be állapotot a böngésző megjegyzi.</div>`;
      const displaySection = settingsBody.querySelector('.rlSection');
      if (displaySection) displaySection.insertAdjacentElement('afterend', sound);else settingsBody.prepend(sound);
      const toggle = sound.querySelector('.rlMusicToggle');
      const range = sound.querySelector('.rlMusicVolume');
      const label = sound.querySelector('.rlMusicVolumeLabel');
      const clamp = v => Math.max(0, Math.min(1, Number(v) || 0));
      const render = () => {
        const st = musicApi.state;
        toggle.textContent = st.enabled ? 'BEKAPCSOLVA' : 'KIKAPCSOLVA';
        toggle.classList.toggle('off', !st.enabled);
        range.value = String(Math.round(st.volume * 100));
        label.textContent = `${Math.round(st.volume * 100)}%`;
      };
      toggle.onclick = () => {
        musicApi.state.enabled = !musicApi.state.enabled;
        try {
          localStorage.setItem('roadlords_music_enabled', musicApi.state.enabled ? '1' : '0');
        } catch (_) {}
        render();
        musicApi.reconcile();
      };
      range.oninput = () => {
        musicApi.state.volume = clamp(Number(range.value) / 100);
        try {
          localStorage.setItem('roadlords_music_volume', String(musicApi.state.volume));
        } catch (_) {}
        render();
        musicApi.audio.volume = clamp(musicApi.state.volume * musicApi.state.gain);
        musicApi.reconcile();
      };
      render();
    }
    const brand = document.querySelector('.topbar .brand');
    if (brand) {
      brand.classList.add('rlGameMenuBrand');
      brand.innerHTML = `<button id="rlGameMenuButton" class="rlGameMenuButton" type="button" title="Játék menü"><span class="rlBurger">☰</span><span>MENÜ</span></button>`;
    }
    const gameMenu = document.createElement('section');
    gameMenu.id = 'rlIngameMenu';
    gameMenu.className = 'rlIngameMenu';
    gameMenu.innerHTML = `<div class="rlIngameMenuCard">
    <header class="rlIngameMenuHead"><h2>MENÜ</h2><div class="rlIngameMenuMode"></div></header>
    <div class="rlIngameMenuButtons">
      <button class="rlIngameMenuBtn primary" data-action="resume" type="button">FOLYTATÁS</button>
      <button class="rlIngameMenuBtn" data-action="settings" type="button">BEÁLLÍTÁSOK</button>
      <button class="rlIngameMenuBtn" data-action="codex" type="button">LEXIKON</button>
      <button class="rlIngameMenuBtn danger" data-action="main" type="button">FŐMENÜ</button>
    </div>
    <div class="rlIngameMenuNote"></div>
    <div class="rlIngameMenuVersion">V4.9.91 · P2P 1V1</div>
  </div>`;
    document.body.appendChild(gameMenu);
    const modeEl = gameMenu.querySelector('.rlIngameMenuMode');
    const noteEl = gameMenu.querySelector('.rlIngameMenuNote');
    let resumeSoloOnClose = false;
    let leaveArmed = false,
      leaveTimer = 0;
    const mainBtn = gameMenu.querySelector('[data-action="main"]');
    const isSolo = () => !document.body.classList.contains('roadlords-multi-active');
    function syncPauseButton() {
      const p = document.querySelector('#pauseBtn');
      if (!p) return;
      p.classList.toggle('on', !gameState.running);
      p.textContent = gameState.running ? 'Ⅱ' : '▶';
    }
    function resetLeave() {
      leaveArmed = false;
      clearTimeout(leaveTimer);
      mainBtn.textContent = 'FŐMENÜ';
    }
    function openGameMenu() {
      if (getComputedStyle(lobby).display !== 'none') return;
      resetLeave();
      const solo = isSolo();
      resumeSoloOnClose = !!(solo && gameState.running && !gameState.ended);
      if (resumeSoloOnClose) {
        gameState.running = false;
        syncPauseButton();
      }
      modeEl.textContent = solo ? 'EGYJÁTÉKOS' : 'TÖBBJÁTÉKOS';
      noteEl.textContent = solo ? 'A játék a menü alatt szünetel.' : 'Multiplayerben a meccs a menü alatt is tovább fut.';
      gameMenu.classList.add('show');
    }
    function closeGameMenu() {
      gameMenu.classList.remove('show');
      resetLeave();
      if (resumeSoloOnClose && isSolo() && !gameState.ended && !gameState.modal) {
        gameState.running = true;
        syncPauseButton();
      }
      resumeSoloOnClose = false;
    }
    function openGlobalPanel(panel) {
      document.querySelectorAll('.rlMenuPanel.show').forEach(x => x.classList.remove('show'));
      panel.classList.add('show');
      if (panel === codexPanel) {
        const active = panel.querySelector('.rlCodexTab.active');
        active?.click();
      }
    }
    document.querySelector('#rlGameMenuButton')?.addEventListener('click', openGameMenu);
    gameMenu.querySelector('[data-action="resume"]').onclick = closeGameMenu;
    gameMenu.querySelector('[data-action="settings"]').onclick = () => openGlobalPanel(settingsPanel);
    gameMenu.querySelector('[data-action="codex"]').onclick = () => openGlobalPanel(codexPanel);
    mainBtn.onclick = () => {
      if (!leaveArmed) {
        leaveArmed = true;
        mainBtn.textContent = 'BIZTOSAN KILÉPSZ?';
        noteEl.textContent = 'Még egy kattintás: a jelenlegi meccs megszakad és visszatérsz a főmenübe.';
        leaveTimer = setTimeout(() => {
          resetLeave();
          noteEl.textContent = isSolo() ? 'A játék a menü alatt szünetel.' : 'Multiplayerben a meccs a menü alatt is tovább fut.';
        }, 4500);
        return;
      }
      location.reload();
    };
    document.addEventListener('keydown', e => {
      if (e.key !== 'Escape') return;
      const shown = [...document.querySelectorAll('.rlMenuPanel.show')].pop();
      if (shown) {
        e.preventDefault();
        e.stopImmediatePropagation();
        shown.classList.remove('show');
        return;
      }
      if (gameMenu.classList.contains('show')) {
        e.preventDefault();
        e.stopImmediatePropagation();
        closeGameMenu();
      }
    }, true);
    gameMenu.addEventListener('click', e => {
      if (e.target === gameMenu) e.stopPropagation();
    });
    const mainSettings = document.querySelector('#rlOpenSettings');
    const mainCodex = document.querySelector('#rlOpenCodex');
    if (mainSettings) mainSettings.onclick = () => openGlobalPanel(settingsPanel);
    if (mainCodex) mainCodex.onclick = () => openGlobalPanel(codexPanel);
    const menuVer = document.querySelector('.menuVersion');
    if (menuVer) menuVer.textContent = 'V4.9.91 · P2P';
    document.title = 'Roadlords V4.9.91 – In-game menü + zene beállítás';
    window.__ROADLORDS_VERSION__ = '4.9.91-ingame-menu-settings';
    window.__ROADLORDS_INGAME_MENU__ = {
      open: openGameMenu,
      close: closeGameMenu,
      element: gameMenu
    };
  })();
  installGameMusic();
  (() => {
    const brandSmall = document.querySelector('.brand small');
    if (brandSmall) brandSmall.textContent = 'V4.9.94 · P2P 1V1';
    const menuVer = document.querySelector('.menuVersion');
    if (menuVer) menuVer.textContent = 'V4.9.94 · P2P';
    document.title = 'Roadlords V4.9.94 – Zsoldoshálózat + kompakt meccsvége';
    window.__ROADLORDS_VERSION__ = '4.9.94-mercenary-network-compact-end';
  })();
  (() => {
    const style = document.createElement('style');
    style.textContent = "@import url(\"" + (assetUrl("styles/shell/07.css") + "\");");
    document.head.appendChild(style);
    const brandSmall = document.querySelector('.brand small');
    if (brandSmall) brandSmall.textContent = 'V4.9.95 · P2P 1V1';
    const menuVer = document.querySelector('.menuVersion');
    if (menuVer) menuVer.textContent = 'V4.9.95 · P2P';
    document.title = 'Roadlords V4.9.95 – Olvasható UI + lovarda preview fix';
    window.__ROADLORDS_VERSION__ = '4.9.95-readable-ui-stable-preview';
  })();
}
