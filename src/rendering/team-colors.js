import { assetUrl } from '../assets/urls.js';
export function initializeRenderingTeamColors(runtime) {
  const palette = [['blue', 'Kék', '#397fc1'], ['red', 'Piros', '#c74949'], ['green', 'Zöld', '#398b59'], ['purple', 'Lila', '#8a5bbc'], ['orange', 'Narancs', '#d17a32'], ['cyan', 'Türkiz', '#2c9fa7'], ['pink', 'Rózsaszín', '#c25991'], ['gold', 'Arany', '#b39a32']];
  const valid = k => palette.some(p => p[0] === k),
    safe = (k, f = 'blue') => valid(k) ? k : f;
  runtime.P.unitColor = 'blue';
  runtime.E.unitColor = 'red';
  const color = c => palette.find(p => p[0] === safe(c.unitColor, c === runtime.E ? 'red' : 'blue'))[2];
  const keys = ['swordsman', 'spearman', 'archer', 'knight', 'priest', 'mage', 'catapult', 'orc_warrior', 'orc_berserker', 'orc_goblin', 'orc_shaman', 'orc_warg', 'orc_troll', 'orc_ram'];
  const centers = [[136, 236, 122], [386, 236, 122], [636, 236, 122], [886, 236, 122], [1136, 236, 122], [1386, 236, 122], [1636, 236, 122], [136, 662, 122], [386, 662, 122], [636, 662, 122], [886, 662, 122], [1136, 662, 122], [1386, 662, 122], [1636, 662, 122]];
  const atlas = new Image(),
    sprites = new Map();
  let loaded = false;
  let ready;
  function load() {
    if (ready) return ready;
    atlas.src = assetUrl("art/image-b8c02ed059e88a53.png");
    ready = atlas.decode().then(() => { loaded = true; return true; }, () => {ready = null; return false;});
    return ready;
  }
  const inkCache = new Map();
  function pencilInk(i) {
    if (inkCache.has(i)) return inkCache.get(i);
    const ink = document.createElement('canvas');
    ink.width = ink.height = 128;
    const g = ink.getContext('2d'),
      [x, y, r] = centers[i];
    g.drawImage(atlas, x - r, y - r, 2 * r, 2 * r, 4, 4, 120, 120);
    const source = g.getImageData(0, 0, 128, 128),
      out = g.createImageData(128, 128),
      a = new Float32Array(128 * 128);
    for (let p = 0; p < a.length; p++) {
      const j = p * 4,
        lum = (source.data[j] * .2126 + source.data[j + 1] * .7152 + source.data[j + 2] * .0722) / 255;
      a[p] = Math.max(0, Math.min(1, (1 - lum - .055) * 3.4)) * source.data[j + 3] / 255;
    }
    for (let y = 0; y < 128; y++) for (let x = 0; x < 128; x++) {
      let strength = a[y * 128 + x];
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const xx = x + dx,
          yy = y + dy;
        if (xx < 0 || xx >= 128 || yy < 0 || yy >= 128) continue;
        strength = Math.max(strength, a[yy * 128 + xx] * (dx && dy ? .65 : .85));
      }
      const j = (y * 128 + x) * 4;
      out.data[j] = 20;
      out.data[j + 1] = 23;
      out.data[j + 2] = 21;
      out.data[j + 3] = Math.round(strength * 255);
    }
    g.putImageData(out, 0, 0);
    inkCache.set(i, ink);
    return ink;
  }
  function sprite(key, hex) {
    const id = key + hex;
    if (sprites.has(id)) return sprites.get(id);
    const i = keys.indexOf(key);
    if (i < 0) return null;
    if (!loaded) { load(); return null; }
    const out = document.createElement('canvas');
    out.width = out.height = 128;
    const g = out.getContext('2d');
    g.save();
    g.beginPath();
    g.arc(64, 64, 60, 0, Math.PI * 2);
    g.clip();
    g.fillStyle = hex;
    g.fillRect(0, 0, 128, 128);
    g.fillStyle = 'rgba(255,255,255,.60)';
    g.fillRect(0, 0, 128, 128);
    g.drawImage(pencilInk(i), 0, 0);
    g.restore();
    sprites.set(id, out);
    return out;
  }
  function draw(g, u, r) {
    const s = sprite(u.key, color(u.side === 'enemy' ? runtime.E : runtime.P));
    if (!s) return false;
    g.save();
    g.shadowBlur = 0;
    g.drawImage(s, -r, -r, 2 * r, 2 * r);
    g.restore();
    return true;
  }
  if (!runtime.MP_STRATEGY_KEYS.includes('unitColor')) runtime.MP_STRATEGY_KEYS.push('unitColor');
  function different(k) {
    return palette.find(p => p[0] !== k)[0];
  }
  function resolve() {
    runtime.P.unitColor = safe(runtime.P.unitColor);
    runtime.E.unitColor = safe(runtime.E.unitColor, 'red');
    if (runtime.P.unitColor === runtime.E.unitColor) runtime.E.unitColor = different(runtime.P.unitColor);
  }
  const originalSend = runtime.mpSend;
  runtime.mpSend = function (d) {
    if (d?.type === 'hello') d = {
      ...d,
      unitColor: runtime.P.unitColor
    };
    return originalSend(d);
  };
  function sync() {
    if (runtime.MP.enabled && runtime.MP.role === 'host') {
      resolve();
      runtime.mpSend({
        type: 'unit_colors_v41310',
        self: runtime.E.unitColor,
        enemy: runtime.P.unitColor
      });
    }
  }
  const originalHandle = runtime.mpHandle;
  runtime.mpHandle = function (d) {
    if (d?.type === 'unit_colors_v41310' && runtime.MP.role === 'guest') {
      runtime.P.unitColor = safe(d.self);
      runtime.E.unitColor = safe(d.enemy, 'red');
      runtime.MP.unitColorConfirmed = true;
      refresh();
      return;
    }
    if (d?.type === 'own_unit_color_v41310' && runtime.MP.role === 'host') {
      runtime.E.unitColor = safe(d.color, runtime.E.unitColor);
      sync();
      runtime.mpSendSnapshot(true);
      refresh();
      return;
    }
    if (d?.type === 'hello') {
      runtime.E.unitColor = safe(d.unitColor, 'red');
      if (runtime.MP.role === 'host') resolve();else if (runtime.P.unitColor === runtime.E.unitColor) runtime.P.unitColor = different(runtime.E.unitColor);
    }
    const out = originalHandle(d);
    if (d?.type === 'hello') {
      sync();
      refresh();
    }
    return out;
  };
  const oldApply = runtime.mpApplyGuestStrategy;
  runtime.mpApplyGuestStrategy = function (d, seq) {
    if (d && runtime.MP.role === 'host') {
      d = {
        ...d,
        unitColor: safe(d.unitColor, runtime.E.unitColor)
      };
      if (d.unitColor === runtime.P.unitColor) d.unitColor = different(runtime.P.unitColor);
    }
    const out = oldApply(d, seq);
    if (runtime.MP.role === 'host') {
      sync();
      refresh();
    }
    return out;
  };
  const oldReplace = runtime.mpReplaceCity;
  runtime.mpReplaceCity = function (target, packed, enemy) {
    const local = target === runtime.P && !runtime.MP.started && !runtime.MP.unitColorConfirmed ? runtime.P.unitColor : null;
    const out = oldReplace(target, packed, enemy);
    target.unitColor = safe(local || target.unitColor, enemy ? 'red' : 'blue');
    refresh();
    return out;
  };
  const oldSig = runtime.mpUiCitySignature;
  runtime.mpUiCitySignature = c => oldSig(c) + '|unitColor:' + c.unitColor;
  const controls = [];
  let active = null;
  const style = document.createElement('style');
  style.textContent = "@import url(\"" + (assetUrl("styles/features/rendering-team-colors-41.css") + "\");");
  document.head.appendChild(style);
  const popup = document.createElement('div');
  popup.id = 'unitColorPalette';
  popup.hidden = true;
  popup.setAttribute('role', 'dialog');
  popup.setAttribute('aria-label', 'Egységek színe');
  popup.innerHTML = '<strong>Egységek színe</strong><div class="unitColorOptions"></div><div class="unitColorCaption">Csak az egységekre hat.</div>';
  document.body.appendChild(popup);
  for (const [id, name, hex] of palette) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'unitColorOption';
    btn.style.background = hex;
    btn.dataset.color = id;
    btn.title = name;
    btn.setAttribute('aria-label', name);
    btn.onclick = () => {
      const item = active;
      if (!item) return;
      item.city.unitColor = id;
      if (!runtime.MP.enabled || runtime.MP.role === 'solo') {
        if (runtime.P.unitColor === runtime.E.unitColor) (item.city === runtime.P ? runtime.E : runtime.P).unitColor = different(id);
      } else if (runtime.MP.connected) {
        if (runtime.MP.role === 'guest') runtime.mpSend({
          type: 'own_unit_color_v41310',
          color: id
        });else {
          sync();
          runtime.mpSendSnapshot(true);
        }
      }
      refresh();
      close(true);
    };
    popup.querySelector('.unitColorOptions').appendChild(btn);
  }
  function close(focus = false) {
    popup.hidden = true;
    if (active) {
      active.button.setAttribute('aria-expanded', 'false');
      if (focus) active.button.focus();
    }
    active = null;
  }
  function refresh() {
    for (const {
      city,
      button
    } of controls) {
      const item = palette.find(p => p[0] === safe(city.unitColor, city === runtime.E ? 'red' : 'blue'));
      button.style.background = item[2];
      button.title = 'Egységszín: ' + item[1];
      button.setAttribute('aria-label', 'Egységszín: ' + item[1]);
    }
    if (active) for (const b of popup.querySelectorAll('[data-color]')) {
      const yes = b.dataset.color === active.city.unitColor;
      b.textContent = yes ? '✓' : '';
      b.setAttribute('aria-pressed', String(yes));
    }
  }
  function add(select, city) {
    if (!select) return;
    const parent = select.parentElement;
    if (parent.tagName === 'LABEL') parent.htmlFor = select.id;
    const row = document.createElement('div');
    row.className = 'unitColorRaceRow';
    select.before(row);
    row.appendChild(select);
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'unitColorSwatch';
    button.setAttribute('aria-haspopup', 'dialog');
    button.setAttribute('aria-expanded', 'false');
    button.setAttribute('aria-controls', 'unitColorPalette');
    row.appendChild(button);
    const item = {
      city,
      button
    };
    controls.push(item);
    button.onclick = e => {
      e.preventDefault();
      e.stopPropagation();
      if (active === item) {
        close();
        return;
      }
      close();
      active = item;
      popup.hidden = false;
      button.setAttribute('aria-expanded', 'true');
      refresh();
      const r = button.getBoundingClientRect();
      popup.style.left = Math.max(8, Math.min(innerWidth - 264, r.right - 240)) + 'px';
      popup.style.top = Math.max(8, Math.min(innerHeight - popup.offsetHeight - 8, r.bottom + 8)) + 'px';
      popup.querySelector('[aria-pressed="true"]')?.focus();
    };
  }
  add(document.querySelector('#soloRace'), runtime.P);
  add(document.querySelector('#aiRace'), runtime.E);
  add(document.querySelector('#mpRace'), runtime.P);
  refresh();
  document.addEventListener('pointerdown', e => {
    if (active && !popup.contains(e.target) && !active.button.contains(e.target)) close();
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && active) {
      e.preventDefault();
      close(true);
    }
  });
  window.addEventListener('resize', () => close());
  window.__ROADLORDS_UNIT_COLORS__ = {
    palette,
    keys,
    get ready() { return load(); },
    sprite,
    draw,
    colorFor: side => color(side === 'enemy' ? runtime.E : runtime.P),
    refresh,
    resolve,
    get cached() {
      return sprites.size;
    }
  };
}
