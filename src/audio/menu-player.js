import { APP } from '../config/app.js';
import { assetUrl } from '../assets/urls.js';
export function installMenuMusic() {
  const MUSIC_URL = APP.musicRoot + 'menu/Fortified%20City.mp3';
  const STORAGE_ENABLED = 'roadlords_music_enabled';
  const STORAGE_VOLUME = 'roadlords_music_volume';
  const lobby = document.querySelector('.mpLobby');
  if (!lobby) return;
  const clamp01 = v => Math.max(0, Math.min(1, Number(v) || 0));
  const loadEnabled = () => {
    try {
      const v = localStorage.getItem(STORAGE_ENABLED);
      return v === null ? true : v !== '0';
    } catch (_) {
      return true;
    }
  };
  const loadVolume = () => {
    try {
      const v = localStorage.getItem(STORAGE_VOLUME);
      return v === null ? .38 : clamp01(v);
    } catch (_) {
      return .38;
    }
  };
  const save = (k, v) => {
    try {
      localStorage.setItem(k, String(v));
    } catch (_) {}
  };
  const music = {
    enabled: loadEnabled(),
    volume: loadVolume(),
    gain: 1,
    unlocked: false,
    fadeToken: 0
  };
  const audio = document.createElement('audio');
  audio.id = 'roadlordsMenuMusic';
  audio.src = MUSIC_URL;
  audio.preload = 'metadata';
  audio.loop = true;
  audio.playsInline = true;
  audio.volume = music.enabled ? music.volume : 0;
  document.body.appendChild(audio);
  const menuVisible = () => {
    const cs = getComputedStyle(lobby);
    return cs.display !== 'none' && cs.visibility !== 'hidden' && !lobby.classList.contains('hidden');
  };
  const syncVolume = () => {
    audio.volume = clamp01(music.volume * music.gain);
  };
  function fadeTo(target, duration = 450, onDone) {
    const token = ++music.fadeToken,
      startGain = music.gain,
      start = performance.now();
    const step = now => {
      if (token !== music.fadeToken) return;
      const t = Math.min(1, (now - start) / Math.max(1, duration));
      music.gain = startGain + (target - startGain) * t;
      syncVolume();
      if (t < 1) requestAnimationFrame(step);else onDone?.();
    };
    requestAnimationFrame(step);
  }
  async function startMusic() {
    if (!music.enabled || !menuVisible()) return false;
    music.gain = 0;
    syncVolume();
    try {
      await audio.play();
      music.unlocked = true;
      fadeTo(1, 650);
      return true;
    } catch (_) {
      return false;
    }
  }
  function stopMusic() {
    if (audio.paused) return;
    fadeTo(0, 550, () => {
      audio.pause();
      music.gain = 1;
      syncVolume();
    });
  }
  function reconcileMusic() {
    if (music.enabled && menuVisible()) {
      if (audio.paused) startMusic();else fadeTo(1, 260);
    } else stopMusic();
  }
  const unlock = () => {
    music.unlocked = true;
    reconcileMusic();
  };
  document.addEventListener('pointerdown', unlock, {
    capture: true
  });
  document.addEventListener('keydown', unlock, {
    capture: true
  });
  const obs = new MutationObserver(reconcileMusic);
  obs.observe(lobby, {
    attributes: true,
    attributeFilter: ['style', 'class']
  });
  window.addEventListener('focus', reconcileMusic);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stopMusic();else reconcileMusic();
  });
  const settingsBody = document.querySelector('#rlSettingsPanel .rlPanelBody');
  if (settingsBody) {
    const sound = document.createElement('section');
    sound.className = 'rlSection rlSoundSection';
    sound.innerHTML = `<h3 class="rlSectionTitle">HANG</h3>
      <div class="rlSoundRow"><div><b>MENÜZENE</b><small>Fortified City · online stream</small></div><button type="button" class="rlMusicToggle"></button></div>
      <div class="rlSoundRow"><div><b>ZENE HANGERŐ</b><small class="rlMusicVolumeLabel"></small></div><input class="rlMusicVolume" type="range" min="0" max="100" step="1"></div>
      <div class="rlSettingsNote">A zene internetkapcsolatot igényel. Ha a böngésző tiltja az automatikus hangot, az első kattintás után indul el.</div>`;
    const first = settingsBody.querySelector('.rlSection');
    if (first) first.insertAdjacentElement('afterend', sound);else settingsBody.prepend(sound);
    const style = document.createElement('style');
    style.textContent = "@import url(\"" + (assetUrl("styles/shell/05.css") + "\");");
    document.head.appendChild(style);
    const toggle = sound.querySelector('.rlMusicToggle');
    const range = sound.querySelector('.rlMusicVolume');
    const label = sound.querySelector('.rlMusicVolumeLabel');
    const render = () => {
      toggle.textContent = music.enabled ? 'BEKAPCSOLVA' : 'KIKAPCSOLVA';
      toggle.classList.toggle('off', !music.enabled);
      range.value = String(Math.round(music.volume * 100));
      label.textContent = `${Math.round(music.volume * 100)}%`;
    };
    toggle.onclick = () => {
      music.enabled = !music.enabled;
      save(STORAGE_ENABLED, music.enabled ? '1' : '0');
      render();
      reconcileMusic();
    };
    range.oninput = () => {
      music.volume = clamp01(Number(range.value) / 100);
      save(STORAGE_VOLUME, music.volume);
      render();
      syncVolume();
      if (music.enabled && menuVisible() && audio.paused) startMusic();
    };
    render();
  }
  queueMicrotask(reconcileMusic);
  window.__ROADLORDS_MENU_MUSIC__ = {
    audio,
    url: MUSIC_URL,
    start: startMusic,
    stop: stopMusic,
    reconcile: reconcileMusic,
    state: music
  };
  const brandSmall = document.querySelector('.brand small');
  if (brandSmall) brandSmall.textContent = 'V4.9.90 · P2P 1V1';
  const menuVer = document.querySelector('.menuVersion');
  if (menuVer) menuVer.textContent = 'V4.9.90 · P2P';
  document.title = 'Roadlords V4.9.90 – Online menüzene';
  window.__ROADLORDS_VERSION__ = '4.9.90-online-menu-music';
}
