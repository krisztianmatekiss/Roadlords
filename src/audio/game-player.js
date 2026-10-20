import { APP } from '../config/app.js';
import { assetUrl } from '../assets/urls.js';
import catalog from './catalog.json';
export function installGameMusic() {
  const menuApi = window.__ROADLORDS_MENU_MUSIC__;
  const lobby = document.querySelector('.mpLobby');
  if (!menuApi || !lobby) return;

  const RAW_ROOT = APP.musicRoot;
  const DEFAULT_FACTION = 'human';
  const CACHE_PREFIX = 'roadlords_ingame_music_tracks_v2_';
  const AUDIO_EXT = /\.(mp3|ogg|opus|m4a|wav)$/i;
  const normalizeFaction = value => String(value || DEFAULT_FACTION).trim().toLowerCase().replace(/[^a-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '') || DEFAULT_FACTION;
  const detectFaction = () => {
    let value = '';
    try {
      value = window.__ROADLORDS_MUSIC_FACTION__ || window.__ROADLORDS_PLAYER_FACTION__ || window.__ROADLORDS_PLAYER_RACE__ || typeof P !== 'undefined' && (P.faction || P.race || P.civilization || P.civ) || typeof state !== 'undefined' && (state.playerFaction || state.playerRace || state.faction || state.race);
    } catch (_) {}
    return normalizeFaction(value || DEFAULT_FACTION);
  };
  const cacheKey = faction => CACHE_PREFIX + normalizeFaction(faction);
  const clamp01 = v => Math.max(0, Math.min(1, Number(v) || 0));
  const gameAudio = document.createElement('audio');
  gameAudio.id = 'roadlordsGameMusic';
  gameAudio.preload = 'metadata';
  gameAudio.loop = false;
  gameAudio.playsInline = true;
  document.body.appendChild(gameAudio);
  const gameMusic = {
    faction: detectFaction(),
    tracks: [],
    bag: [],
    recent: [],
    current: null,
    loading: true,
    fadeToken: 0,
    pausedByVisibility: false
  };
  const isMenuVisible = () => {
    const cs = getComputedStyle(lobby);
    return cs.display !== 'none' && cs.visibility !== 'hidden' && !lobby.classList.contains('hidden');
  };
  const isGameActive = () => !isMenuVisible();
  const encodePath = path => String(path).split('/').map(encodeURIComponent).join('/');
  const rawUrl = path => RAW_ROOT + encodePath(path);
  const niceName = path => String(path).split('/').pop().replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').trim();
  const syncVolume = () => {
    gameAudio.volume = menuApi.state.enabled ? clamp01(menuApi.state.volume) : 0;
  };
  const updateStatus = () => {
    document.querySelectorAll('.rlGameMusicStatus').forEach(el => {
      if (gameMusic.loading) el.textContent = 'Játékzenék keresése…';else if (!gameMusic.tracks.length) el.textContent = 'Nincs elérhető játékzene';else el.textContent = `${gameMusic.tracks.length} ${gameMusic.faction.toUpperCase()} játékzene · shuffle · S = következő`;
    });
  };
  function setTracks(paths, faction = gameMusic.faction) {
    faction = normalizeFaction(faction);
    const prefix = `${faction}/`;
    const clean = [...new Set((paths || []).filter(p => AUDIO_EXT.test(p) && String(p).toLowerCase().startsWith(prefix.toLowerCase())))].map(path => ({
      path,
      name: niceName(path),
      url: rawUrl(path)
    }));
    const changed = faction !== gameMusic.faction || JSON.stringify(clean.map(x => x.path)) !== JSON.stringify(gameMusic.tracks.map(x => x.path));
    gameMusic.faction = faction;
    gameMusic.tracks = clean;
    if (changed) {
      gameMusic.bag = [];
      gameMusic.recent = [];
      gameMusic.current = null;
      gameAudio.pause();
      gameAudio.removeAttribute('src');
      gameAudio.load();
    }
    gameMusic.loading = false;
    updateStatus();
    if (isGameActive() && menuApi.state.enabled && gameAudio.paused && !gameMusic.current) playNext('tracks-loaded');
  }
  function loadCache(faction = gameMusic.faction) {
    try {
      const data = JSON.parse(localStorage.getItem(cacheKey(faction)) || 'null');
      if (Array.isArray(data) && data.length) setTracks(data, faction);
    } catch (_) {}
  }
  async function refreshTracks(faction = detectFaction()) {
    faction = normalizeFaction(faction);
    gameMusic.loading = true;
    updateStatus();
    try {
      const allPaths = catalog.tracks.filter(path => AUDIO_EXT.test(path));
      const prefix = `${faction}/`.toLowerCase();
      const factionPaths = allPaths.filter(path => String(path).toLowerCase().startsWith(prefix));
      setTracks(factionPaths, faction);
      try {
        localStorage.setItem(cacheKey(faction), JSON.stringify(factionPaths));
      } catch (_) {}
    } catch (err) {
      gameMusic.loading = false;
      updateStatus();
      console.warn(`Roadlords ${faction} játékzene-lista nem tölthető:`, err);
    }
  }
  function switchFaction(faction) {
    faction = normalizeFaction(faction);
    if (faction === gameMusic.faction && gameMusic.tracks.length) return false;
    window.__ROADLORDS_MUSIC_FACTION__ = faction;
    gameMusic.faction = faction;
    gameMusic.tracks = [];
    gameMusic.bag = [];
    gameMusic.recent = [];
    gameMusic.current = null;
    gameMusic.loading = true;
    gameAudio.pause();
    gameAudio.removeAttribute('src');
    gameAudio.load();
    loadCache(faction);
    refreshTracks(faction);
    updateStatus();
    return true;
  }
  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }
  function refillBag() {
    gameMusic.bag = shuffle(gameMusic.tracks.slice());
    const last = gameMusic.recent.at(-1);
    if (last && gameMusic.bag.length > 1 && gameMusic.bag[0].path === last) {
      const j = gameMusic.bag.findIndex((x, i) => i > 0 && x.path !== last);
      if (j > 0) [gameMusic.bag[0], gameMusic.bag[j]] = [gameMusic.bag[j], gameMusic.bag[0]];
    }
  }
  function chooseNext() {
    if (!gameMusic.tracks.length) return null;
    if (!gameMusic.bag.length) refillBag();
    let next = gameMusic.bag.shift() || null;
    const last = gameMusic.recent.at(-1);
    if (next && last && next.path === last && gameMusic.tracks.length > 1) {
      const alt = gameMusic.bag.findIndex(x => x.path !== last);
      if (alt >= 0) {
        const replacement = gameMusic.bag.splice(alt, 1)[0];
        gameMusic.bag.unshift(next);
        next = replacement;
      } else {
        refillBag();
        next = gameMusic.bag.shift() || next;
      }
    }
    return next;
  }
  function fadeTo(target, duration = 350, onDone) {
    const token = ++gameMusic.fadeToken,
      start = gameAudio.volume,
      end = clamp01(target),
      t0 = performance.now();
    const step = now => {
      if (token !== gameMusic.fadeToken) return;
      const t = Math.min(1, (now - t0) / Math.max(1, duration));
      gameAudio.volume = start + (end - start) * t;
      if (t < 1) requestAnimationFrame(step);else onDone?.();
    };
    requestAnimationFrame(step);
  }
  async function playTrack(track) {
    if (!track || !menuApi.state.enabled || !isGameActive() || document.hidden) return false;
    ++gameMusic.fadeToken;
    gameMusic.current = track;
    gameAudio.src = track.url;
    gameAudio.currentTime = 0;
    gameAudio.volume = 0;
    try {
      await gameAudio.play();
      fadeTo(menuApi.state.volume, 520);
      return true;
    } catch (err) {
      console.warn(`Roadlords játékzene nem indult: ${track.name}`, err);
      gameMusic.recent.push(track.path);
      if (gameMusic.recent.length > 2) gameMusic.recent.shift();
      gameMusic.current = null;
      setTimeout(() => {
        if (isGameActive()) playNext('play-failed');
      }, 250);
      return false;
    }
  }
  function playNext(reason = 'next') {
    if (!menuApi.state.enabled || !isGameActive() || document.hidden || !gameMusic.tracks.length) return false;
    const previous = gameMusic.current;
    if (previous) {
      gameMusic.recent.push(previous.path);
      if (gameMusic.recent.length > 2) gameMusic.recent.shift();
    }
    const next = chooseNext();
    if (!next) return false;
    gameAudio.pause();
    gameMusic.current = null;
    playTrack(next);
    return true;
  }
  function stopGameMusic(reset = false) {
    ++gameMusic.fadeToken;
    if (!gameAudio.paused) {
      const targetAudio = gameAudio;
      fadeTo(0, 320, () => targetAudio.pause());
    }
    if (reset) {
      gameMusic.current = null;
      gameMusic.bag = [];
      gameMusic.recent = [];
      gameAudio.removeAttribute('src');
      gameAudio.load();
    }
  }
  function reconcileGameMusic() {
    const detectedFaction = detectFaction();
    if (detectedFaction !== gameMusic.faction) {
      switchFaction(detectedFaction);
      return;
    }
    syncVolume();
    if (!menuApi.state.enabled || !isGameActive() || document.hidden) {
      if (!gameAudio.paused) gameAudio.pause();
      return;
    }
    if (!gameMusic.tracks.length) return;
    if (gameAudio.paused) {
      if (gameMusic.current && gameAudio.src) {
        gameAudio.play().then(() => syncVolume()).catch(() => playNext('resume-failed'));
      } else playNext('reconcile');
    }
  }
  function skip() {
    if (!isGameActive() || !menuApi.state.enabled || !gameMusic.tracks.length) return false;
    return playNext('manual-skip');
  }
  gameAudio.addEventListener('ended', () => playNext('ended'));
  gameAudio.addEventListener('error', () => {
    if (isGameActive() && menuApi.state.enabled && gameMusic.current) {
      const failed = gameMusic.current;
      console.warn(`Roadlords játékzene betöltési hiba: ${failed.name}`);
      gameMusic.recent.push(failed.path);
      if (gameMusic.recent.length > 2) gameMusic.recent.shift();
      gameMusic.current = null;
      setTimeout(() => playNext('audio-error'), 180);
    }
  });
  const oldReconcile = menuApi.reconcile;
  menuApi.reconcile = function () {
    const r = oldReconcile();
    reconcileGameMusic();
    return r;
  };
  const obs = new MutationObserver(() => setTimeout(reconcileGameMusic, 60));
  obs.observe(lobby, {
    attributes: true,
    attributeFilter: ['style', 'class']
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      if (!gameAudio.paused) {
        gameMusic.pausedByVisibility = true;
        gameAudio.pause();
      }
    } else {
      const should = gameMusic.pausedByVisibility;
      gameMusic.pausedByVisibility = false;
      if (should || isGameActive()) reconcileGameMusic();
    }
  });
  window.addEventListener('focus', reconcileGameMusic);
  document.addEventListener('keydown', e => {
    if (e.defaultPrevented || e.repeat || e.ctrlKey || e.altKey || e.metaKey) return;
    if (String(e.key).toLowerCase() !== 's') return;
    if (e.target?.closest?.('input,textarea,select,[contenteditable="true"]')) return;
    if (!isGameActive()) return;
    if (skip()) {
      e.preventDefault();
      e.stopImmediatePropagation();
    }
  }, true);
  const sound = document.querySelector('#rlSettingsPanel .rlSoundSection');
  if (sound) {
    const title = sound.querySelector('.rlSoundRow b');
    if (title) title.textContent = 'ZENE';
    const sub = sound.querySelector('.rlSoundRow small');
    if (sub) sub.textContent = 'Menü + fajspecifikus játékzene · online stream';
    const note = sound.querySelector('.rlSettingsNote');
    if (note) note.innerHTML = 'A zene internetkapcsolatot igényel. <span class="rlGameMusicStatus">Játékzenék keresése…</span>';
  }
  const hotkeys = document.querySelector('#rlSettingsPanel .rlHotkeys');
  if (hotkeys && !hotkeys.querySelector('[data-hotkey="music-skip"]')) {
    const row = document.createElement('div');
    row.className = 'rlHotkeyRow';
    row.dataset.hotkey = 'music-skip';
    row.innerHTML = '<span class="rlHotkeyKeys"><kbd class="rlKey">S</kbd></span><span class="rlHotkeyText">Aktuális játékzene átugrása / következő szám.</span>';
    hotkeys.appendChild(row);
  }
  loadCache(gameMusic.faction);
  refreshTracks(gameMusic.faction);
  updateStatus();
  queueMicrotask(reconcileGameMusic);
  window.__ROADLORDS_GAME_MUSIC__ = {
    audio: gameAudio,
    state: gameMusic,
    skip,
    refresh: refreshTracks,
    setFaction: switchFaction,
    reconcile: reconcileGameMusic,
    getFaction: () => gameMusic.faction,
    getTracks: () => gameMusic.tracks.slice()
  };
  const menuVer = document.querySelector('.menuVersion');
  if (menuVer) menuVer.textContent = 'V4.9.93 · P2P';
  document.title = 'Roadlords V4.9.93 – Faction music ready';
  window.__ROADLORDS_VERSION__ = '4.9.93-faction-music-ready';
}
