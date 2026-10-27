import { rangedRange } from './ranged-balance.js';
import { assetUrl } from '../assets/urls.js';
import { trainingPrice } from './unit-balance.js';
import { MOVEMENT_BALANCE } from './movement-balance.js';
export function initializeDataUnitDefinitions(runtime) {
  runtime.UNITS = {
    swordsman: {
      name: 'Kardos',
      icon: '🗡️',
      battleIcon: '⚔',
      cat: 'infantry',
      tags: ['melee'],
      hp: 100,
      damage: 12,
      cooldown: 1,
      range: 30,
      speed: 42,
      train: 5,
      cost: runtime.C(0, 5, 6),
      damageType: 'physical'
    },
    spearman: {
      name: 'Lándzsás',
      icon: '🔱',
      battleIcon: '🔱',
      cat: 'infantry',
      tags: ['melee'],
      hp: 90,
      damage: 10,
      cooldown: 1.1,
      range: 45,
      speed: 40,
      train: 5,
      cost: runtime.C(5, 0, 6),
      damageType: 'physical'
    },
    archer: {
      name: 'Íjász',
      icon: '🏹',
      battleIcon: '➶',
      cat: 'infantry',
      tags: ['ranged'],
      hp: 55,
      damage: 8,
      cooldown: 1.2,
      range: rangedRange(150),
      speed: 42,
      train: 6,
      cost: runtime.C(7, 0, 6),
      damageType: 'physical'
    },
    knight: {
      name: 'Lovag',
      icon: '🐎',
      battleIcon: '♞',
      cat: 'cavalry',
      tags: ['melee', 'armored'],
      hp: 240,
      damage: 30,
      cooldown: 1.25,
      range: 32,
      speed: MOVEMENT_BALANCE.knight,
      train: 9,
      cost: runtime.C(0, 16, 15),
      damageType: 'physical'
    },
    priest: {
      name: 'Pap',
      icon: '✦',
      battleIcon: '✚',
      cat: 'magic',
      tags: ['ranged', 'support'],
      hp: 90,
      damage: 6,
      heal: 30,
      cooldown: 1.4,
      range: rangedRange(120),
      speed: 38,
      train: 9,
      cost: runtime.C(10, 10, 12),
      damageType: 'magic'
    },
    catapult: {
      name: 'Katapult',
      icon: '🪨',
      battleIcon: '●',
      cat: 'siege',
      tags: ['ranged', 'heavy'],
      hp: 220,
      damage: 12,
      buildingDamage: 65,
      cooldown: 2.4,
      range: rangedRange(400),
      speed: 24,
      train: 12,
      cost: runtime.C(26, 21, 9),
      damageType: 'physical'
    },
    mage: {
      name: 'Mágus',
      icon: '🔮',
      battleIcon: '✦',
      cat: 'magic',
      tags: ['ranged'],
      hp: 75,
      damage: 24,
      cooldown: 1.7,
      range: rangedRange(150),
      speed: 36,
      train: 12,
      cost: runtime.C(16, 16, 12),
      damageType: 'magic',
      aoe: 62
    }
  };
  for (const unit of Object.values(runtime.UNITS)) unit.cost = trainingPrice(unit.cost);
}
