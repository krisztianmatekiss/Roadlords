import { assetUrl } from '../assets/urls.js';
export function initializeDataBuildingDefinitions(runtime) {
  runtime.BUILDINGS = {
    keep: {
      name: 'Főépület',
      icon: '🏰',
      category: 'support',
      unique: true,
      shape: [[0, 0], [0, 1], [1, 0], [1, 1]],
      description: 'Minden nyersanyagból 1-et termel másodpercenként. 100 alaptárolót, 20000 HP-t, 50-es úti sereglimitet és 5 egység/mp kapukiengedést ad.',
      cost: runtime.C()
    },
    lumber: {
      name: 'Favágó',
      icon: '🪓',
      category: 'economy',
      shape: [[0, 0]],
      description: '1 Fát termel másodpercenként. Erdő mellett a termelése megduplázódik.',
      cost: runtime.C(25)
    },
    stonecutter: {
      name: 'Kővágó',
      icon: '⛏️',
      category: 'economy',
      shape: [[0, 0]],
      description: '1 Követ termel másodpercenként. Kőfejtő mellett a termelése megduplázódik.',
      cost: runtime.C(25)
    },
    farm: {
      name: 'Farm',
      icon: '🌾',
      category: 'economy',
      shape: [[0, 0]],
      description: '1 Élelmet termel másodpercenként. Termékeny talajon a termelése megduplázódik.',
      cost: runtime.C(25)
    },
    warehouse: {
      name: 'Raktár',
      icon: '📦',
      category: 'economy',
      shape: [[0, 0], [0, 1]],
      description: '+150 tárolókapacitást ad minden nyersanyaghoz.',
      cost: runtime.C(20, 10)
    },
    barracks: {
      name: 'Kaszárnya',
      icon: '⚔️',
      category: 'military',
      shape: [[0, 0]],
      unit: 'swordsman',
      description: 'Kardost gyárt.',
      cost: runtime.C(30, 20)
    },
    archery: {
      name: 'Íjásztelep',
      icon: '🏹',
      category: 'military',
      shape: [[0, 0]],
      unit: 'archer',
      description: 'Íjászt gyárt.',
      cost: runtime.C(45, 30)
    },
    spearhall: {
      name: 'Lándzsás őrség',
      icon: '🔱',
      category: 'military',
      shape: [[0, 0]],
      unit: 'spearman',
      description: 'Lándzsást gyárt. Lovasság és nehéz egységek ellen +150% sebzést okoz.',
      cost: runtime.C(40, 35)
    },
    stable: {
      name: 'Istálló',
      icon: '🐴',
      category: 'military',
      shape: [[0, 0], [0, 1]],
      unit: 'knight',
      description: 'Lovagot gyárt. A Lovag gyors, páncélozott közelharci egység.',
      cost: runtime.C(60, 60)
    },
    temple: {
      name: 'Templom',
      icon: '⛪',
      category: 'military',
      shape: [[0, 0], [0, 1]],
      unit: 'priest',
      description: 'Papokat gyárt. A Pap minden 3. támadási ciklusban gyógyít.',
      cost: runtime.C(65, 70)
    },
    siegeworks: {
      name: 'Ostromműhely',
      icon: '🏗️',
      category: 'military',
      shape: [[0, 0], [1, 0], [1, 1]],
      unit: 'catapult',
      description: 'Katapultot gyárt. Épület ellen teljes sebzés. L alakú, 3 mezőt foglal.',
      cost: runtime.C(80, 100)
    },
    magetower: {
      name: 'Mágustorony',
      icon: '🔮',
      category: 'military',
      shape: [[0, 0], [0, 1], [1, 0], [1, 1]],
      unit: 'mage',
      unique: true,
      description: 'Mágust gyárt. Tűzgolyója területi sebzést okoz.',
      cost: runtime.C(70, 120)
    },
    guildhouse: {
      name: 'Céhház',
      icon: '🏛️',
      category: 'economy',
      shape: [[0, 0], [0, 1]],
      unique: true,
      description: '50% készlet alatt az adott nyersanyag termelése +25%.',
      cost: runtime.C(50, 50)
    },
    market: {
      name: 'Piac',
      icon: '🏪',
      category: 'economy',
      shape: [[0, 0], [0, 1], [1, 0], [1, 1]],
      unique: true,
      description: 'A túltermelés 50%-át a legkevésbé telt másik nyersanyaggá alakítja.',
      cost: runtime.C(60, 40)
    },
    builders: {
      name: 'Építőmesterek Csarnoka',
      icon: '📐',
      category: 'economy',
      shape: [[0, 0], [0, 1]],
      unique: true,
      description: 'Minden épület Fa- és Kőköltségét 15%-kal csökkenti.',
      cost: runtime.C(70, 70)
    },
    townhall: {
      name: 'Városháza',
      icon: '🏛️',
      category: 'support',
      shape: [[0, 0], [0, 1], [1, 0], [1, 1]],
      unique: true,
      description: 'Különböző épülettípusonként +3% termelést és gyártási sebességet ad, legfeljebb 10 típusig.',
      cost: runtime.C(80, 100)
    },
    rally: {
      name: 'Gyülekezőtér',
      icon: '🚩',
      category: 'support',
      shape: [[0, 0], [0, 1], [1, 0], [1, 1]],
      unique: true,
      description: 'Kapunyitáskor a bent lévő sereg 10 mp-re +50% mozgási és +25% támadási sebességet kap.',
      cost: runtime.C(60, 50)
    },
    tavern: {
      name: 'Kocsma',
      icon: '🍺',
      category: 'support',
      shape: [[0, 0]],
      unique: true,
      description: 'Kapunyitáskor a bent lévő sereg első 2 támadása +50% sebzést kap.',
      cost: runtime.C(50, 25)
    },
    guardhouse: {
      name: 'Őrház',
      icon: '🛡️',
      category: 'support',
      shape: [[0, 0]],
      description: '+20 helyőrség-kapacitást ad.',
      cost: runtime.C(40, 60)
    },
    house: {
      name: 'Lakóház',
      icon: '🏘️',
      category: 'support',
      shape: [[0, 0]],
      description: '+10 maximális sereglimitet ad az úton harcoló egységeknek.',
      cost: runtime.C(30, 15)
    }
  };
  runtime.HOUSE_TOP_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><defs><filter id="s"><feDropShadow dx="0" dy="8" stdDeviation="7" flood-opacity=".55"/></filter></defs><g filter="url(#s)"><ellipse cx="128" cy="216" rx="91" ry="22" fill="#18271d"/><path d="M49 111 128 50l79 61-13 91H62z" fill="#bd8a4f" stroke="#2a2017" stroke-width="8"/><path d="m37 116 91-78 91 78-21 21-70-58-70 58z" fill="#a63f2b" stroke="#2a2017" stroke-width="8"/><path d="M108 143h40v67h-40z" fill="#503526"/><path d="M72 142h27v29H72zm85 0h27v29h-27z" fill="#7cc2cf" stroke="#eee0aa" stroke-width="5"/><path d="M173 56h24v52h-24z" fill="#6f5340" stroke="#2a2017" stroke-width="7"/><circle cx="90" cy="205" r="20" fill="#4d843c"/><circle cx="174" cy="207" r="17" fill="#568c42"/></g></svg>`;
  runtime.HOUSE_CARD_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 360"><defs><linearGradient id="g" x2="0" y2="1"><stop stop-color="#274b37"/><stop offset="1" stop-color="#10251b"/></linearGradient><filter id="s"><feDropShadow dx="0" dy="12" stdDeviation="12" flood-opacity=".7"/></filter></defs><rect width="512" height="360" fill="url(#g)"/><g filter="url(#s)"><ellipse cx="260" cy="309" rx="177" ry="25" fill="#0a1710"/><path d="M101 173h300v126H101z" fill="#b07b45" stroke="#38261a" stroke-width="9"/><path d="m72 181 82-95 104 70 97-83 91 108-34 20-60-72-92 79-101-68-57 65z" fill="#ae432c" stroke="#38261a" stroke-width="10"/><path d="M226 212h65v87h-65z" fill="#503326"/><path d="M132 210h55v47h-55zm195 0h54v47h-54z" fill="#72b5c4" stroke="#f0dda3" stroke-width="7"/><path d="M360 78h31v83h-31z" fill="#71523a" stroke="#38261a" stroke-width="8"/><circle cx="104" cy="280" r="31" fill="#4b833e"/><circle cx="410" cy="283" r="27" fill="#568b42"/></g></svg>`;
  runtime.BUILDING_IMAGES.house = assetUrl("art/image-e0986b8ee71fbe47.webp");
  runtime.CARD_IMAGES.house = assetUrl("art/image-d2f05ffb06a9a4f6.webp");
  runtime.BUILDING_IMAGE_META.house = {
    w: 1,
    h: 1
  };
  runtime.BASIC = ['lumber', 'stonecutter', 'farm', 'warehouse', 'barracks'];
  runtime.UNLOCKABLE = Object.keys(runtime.BUILDINGS).filter(k => k !== 'keep' && !runtime.BASIC.includes(k));
}
