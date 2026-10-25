import { UNDEAD_EXPANSION } from './undead-expansion.js';
import { rangedRange } from './ranged-balance.js';
import { UNDEAD_PLAN_BUILDINGS, UNDEAD_PLAN_UPGRADES } from './undead-plan.js';
import { UNDEAD_TRAINING, trainingPrice } from './unit-balance.js';
import { UNDEAD_BUILDING_COPY, UNDEAD_UPGRADE_COPY } from './undead-copy.js';
export const UNDEAD_RACE = 'undead';
export const UNDEAD_NAME = 'Élőhalottak';
export const UNDEAD_START = ['und_well', 'und_crypt', 'und_graveyard'];
const aiRoles = {
  skeleton: 'swordsman',
  skeleton_archer: 'archer',
  zombie: 'swordsman',
  ghost: 'swordsman',
  necromancer: 'mage',
  vampire: 'knight',
  lich: 'mage',
};
export const UNDEAD_UNITS = {
  und_skeleton: {
    name: 'Csontváz',
    hp: 85,
    damage: 10,
    cooldown: 1,
    speed: 42,
    range: 30,
    train: 5,
    souls: 8,
    cat: 'infantry',
    tags: ['melee'],
    icon: '💀',
    description:
      '25% ellenállás távolsági fegyverekkel szemben.',
  },
  und_skeleton_archer: {
    name: 'Csontváz Íjász',
    producerHint: 'Temető',
    hp: 85,
    damage: 8,
    cooldown: 1.25,
    speed: 40,
    range: rangedRange(130),
    train: 5,
    souls: 8,
    cat: 'infantry',
    tags: ['ranged'],
    icon: '🏹',
    description:
      'Távolsági Csontváz, 25% ellenállással a távolsági fegyverek ellen.',
  },
  und_zombie: {
    name: 'Zombi',
    hp: 280,
    damage: 12,
    cooldown: 1.8,
    speed: 26,
    range: 30,
    train: 8,
    souls: 16,
    cat: 'infantry',
    tags: ['melee'],
    icon: '🧟',
    description: 'Harci halálakor a 30-as körzetében álló ellenségek 4 méregpontot kapnak.',
  },
  und_ghost: {
    name: 'Szellem',
    hp: 75,
    damage: 8,
    cooldown: 1.4,
    speed: 46,
    range: 30,
    train: 6,
    souls: 11,
    cat: 'infantry',
    tags: ['melee'],
    icon: '👻',
    description:
      '40% eséllyel kitér a támadások és a területi találatok elől is. Sikeres kitéréskor a támadás állapothatásai sem érik.',
  },
  und_necromancer: {
    name: 'Nekromanta',
    hp: 100,
    damage: 5,
    cooldown: 2,
    speed: 36,
    range: rangedRange(120),
    train: 14,
    souls: 40,
    cat: 'magic',
    tags: ['ranged'],
    damageType: 'magic',
    icon: '🪄',
    description:
      '15 másodpercenként 3 Csontvázat idéz 10 másodpercre. Az idézett egységek nem foglalnak sereghelyet.',
  },
  und_vampire: {
    name: 'Vámpír',
    hp: 300,
    damage: 45,
    cooldown: 1.25,
    speed: 50,
    range: 30,
    train: 16,
    souls: 45,
    cat: 'infantry',
    tags: ['melee'],
    icon: '🧛',
    description:
      'Az okozott tényleges sebzés 30%-ából gyógyul.',
  },
  und_lich: {
    name: 'Lich',
    hp: 180,
    damage: 5,
    cooldown: 5,
    speed: 32,
    range: rangedRange(140),
    train: 18,
    souls: 60,
    cat: 'magic',
    tags: ['ranged'],
    damageType: 'magic',
    icon: '☠️',
    description:
      '5 másodpercenként új ellenségre kapcsolódó sugár: kezdetben 5 sebzés/mp, kapcsolatonként másodpercenként +2 sebzés/mp. A kapcsolat a célpont haláláig tart; a tényleges sebzés 100%-ából gyógyul.',
  },
};
for (const [key, u] of Object.entries(UNDEAD_UNITS)) {
  u.aiRole = aiRoles[key.replace('und_', '')];
  u.souls = trainingPrice({ wood: u.souls }).wood;
}
// Prices, upkeep and missing training times are initial balance values, not workbook values.
const economics = {
  keep: [0, 0],
  und_well: [35, 0.5],
  und_crypt: [45, 0.3],
  und_graveyard: [40, 0.35],
  und_morgue: [65, 0.55],
  und_ghost_spawner: [60, 0.5],
  und_necro_spawner: [140, 1],
  und_vampire_castle: [200, 1.2],
  und_lich_spawner: [220, 1.4],
  und_dark_tower: [75, 0.75],
  und_soul_harvester: [80, 0.5],
  und_soul_bank: [150, 1.2],
  und_soul_anchor: [95, 0.8],
  und_soul_burner: [45, 0.6],
  und_bone_forge: [90, 0.7],
  und_plague_chamber: [115, 1],
  und_soul_overdrive: [160, 1.4],
  und_corrupted_hatchery: [100, 0.8],
  und_rebirth_tomb: [180, 1.6],
  und_garden_of_dead: [200, 1.5],
};
const producers = UNDEAD_TRAINING;
const branchIds = {
  keep: ['death_squad', 'dead_realm'],
  und_graveyard: ['elite_skeletons', 'double_summon'],
  und_morgue: ['epidemic', 'dismantling'],
  und_ghost_spawner: ['phasewalker', 'revenant'],
  und_necro_spawner: ['eternal_army', 'skeleton_swarm'],
  und_vampire_castle: ['blood_brotherhood', 'blood_hunt'],
  und_lich_spawner: ['endless_hunger', 'wither_bond'],
  und_garden_of_dead: ['raise_vampire', 'raise_lich'],
};
const names = {
  und_ghost_spawner: 'Fantomkapu',
  und_necro_spawner: 'Nekromanták szentélye',
  und_lich_spawner: 'Lichtorony',
};
export const UNDEAD_BUILDINGS = Object.fromEntries(
  UNDEAD_PLAN_BUILDINGS.map((row, index) => {
    const key = row.A === 'und_capital' ? 'keep' : row.A;
    const shape = row.D.startsWith('L alak')
      ? [
          [0, 0],
          [1, 0],
          [1, 1],
        ]
      : Array.from({ length: Number(row.D[2]) }, (_, r) =>
          Array.from({ length: Number(row.D[0]) }, (_, c) => [r, c]),
        ).flat();
    const copy = UNDEAD_BUILDING_COPY[key],
      [souls, upkeep] = economics[key],
      producer = producers[key];
    const levels = producer
        ? producer[1].map((time) => `${UNDEAD_UNITS[producer[0]].name} képzése ${String(time).replace('.', ',')} mp-enként.`)
        : copy.levels;
    const branches = row.J
      ? branchIds[key].map((id, i) => ({
          id,
          name:
            key === 'und_garden_of_dead'
              ? i
                ? 'Lichkert'
                : 'Vámpírkert'
              : (i ? row.J : row.I).split(':')[0],
          icon: '☠',
          description: copy.branches[i],
        }))
      : [];
    return [
      key,
      {
        name: names[key] || row.B,
        icon:
          key === 'keep'
            ? '🏰'
            : producer
              ? UNDEAD_UNITS[producer[0]].icon
              : row.C === 'Gazdaság'
                ? '🔮'
                : row.C === 'Védelem'
                  ? '🗼'
                  : '⚰️',
        category: producer
          ? 'military'
          : row.C === 'Gazdaság'
            ? 'economy'
            : row.C === 'Védelem' || key === 'keep'
              ? 'defense'
              : 'support',
        shape,
        unique: row.E !== 'Nem',
        souls,
        upkeep,
        unit: producer?.[0],
        times: producer?.[1],
        levels,
        branches,
        atlas: index,
        description: copy.description,
        race: 'undead',
        sourceId: row.A,
      },
    ];
  }),
);
export const UNDEAD_UPGRADES = UNDEAD_PLAN_UPGRADES.map((row) => ({
  id: row.A,
  name: /^(HP|Sebzés) \+10%$/.test(row.D) ? row.C + ' · ' + row.D.replace('HP', 'Életerő') : row.D,
  description: UNDEAD_UPGRADE_COPY[row.A] || `${row.C}: +10% ${row.A.endsWith('_hp') ? 'maximális életerő' : 'sebzés'}.`,
  scope: row.C,
  kind: row.B === 'Common' ? 'normal' : 'legendary',
  icon: '☠',
  race: 'undead',
}));
UNDEAD_UPGRADES.push(...UNDEAD_EXPANSION);
export const UNDEAD_RULES = Object.freeze({
  startingSouls: 140,
  technicalSummonLimit: 1500,
  capitalHp: [2000, 4000, 8000, 16000],
  capitalIncome: [3, 6, 12, 24],
  armyCapacity: [50, 100, 200, 400],
  gateRate: [5, 10, 20, 40],
});
