import { assetUrl } from '../assets/urls.js';
export function initializeCoreInitialState(runtime) {
  runtime.$ = s => document.querySelector(s);
  runtime.$$ = s => [...document.querySelectorAll(s)];
  runtime.clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  runtime.shuffle = a => {
    a = [...a];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };
  runtime.pick = a => a[Math.floor(Math.random() * a.length)];
  runtime.C = (wood = 0, stone = 0, food = 0) => ({
    wood,
    stone,
    food
  });
  runtime.RES = ['wood', 'stone', 'food'];
  runtime.aiDecisionCache = null;
  runtime.RICON = {
    wood: '🪵',
    stone: '🪨',
    food: '🌾'
  };
  runtime.GRID = 10;
  runtime.CENTER = {
    row: 4,
    col: 4
  };
  runtime.FIELD_UNIT_CAP = 200;
  runtime.TERRAIN = {
    forest: {
      name: 'Erdő',
      icon: '🌲',
      image: assetUrl("art/terrain/chronicle/forest.webp"),
      blocked: true,
      tip: 'A mellette álló Favágó termelése ×2.'
    },
    quarry: {
      name: 'Kőlelőhely',
      icon: '🪨',
      image: assetUrl("art/terrain/chronicle/quarry.webp"),
      blocked: true,
      tip: 'A mellette álló Kővágó termelése ×2.'
    },
    fertile: {
      name: 'Termékeny föld',
      icon: '🌾',
      image: assetUrl("art/terrain/chronicle/fertile.webp"),
      blocked: false,
      tip: 'Az erre épített Farm termelése ×2.'
    },
    foundation: {
      name: 'Régi alapozás',
      icon: '🧱',
      image: assetUrl("art/terrain/chronicle/foundation.webp"),
      blocked: false,
      tip: 'Az erre épített épület Fa- és Kőköltsége 50%-kal alacsonyabb. Egyszer használatos.'
    },
    ruin: {
      name: 'Rom',
      icon: '🪵',
      image: assetUrl("art/terrain/chronicle/ruin.webp"),
      blocked: true,
      clear: runtime.C(25, 25),
      tip: 'Eltakarítás: 25 Fa + 25 Kő.'
    },
    ancient: {
      name: 'Ősi rom',
      icon: '🏺',
      image: assetUrl("art/terrain/chronicle/ancient.webp"),
      blocked: true,
      clear: runtime.C(100, 100),
      tip: 'Eltakarítás: 100 Fa + 100 Kő. Jutalom: +1 Normal pick.'
    }
  };
  runtime.POSITIVE_TERRAIN_POINTS = {
    forest: 4,
    quarry: 4,
    fertile: 1,
    foundation: 4,
    ancient: 4
  };
  runtime.POSITIVE_TERRAIN_MAX = {
    forest: 3,
    quarry: 3,
    fertile: 8,
    foundation: 2,
    ancient: 2
  };
  runtime.POSITIVE_TERRAIN_BUDGET = 28;
  runtime.fmt = s => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
  runtime.costText = c => runtime.RES.filter(r => (c[r] || 0) > 0).map(r => `${runtime.RICON[r]} ${Math.ceil(c[r])}`).join('  ') || 'Ingyenes';
}
