// World coordinates per second; the UI converts these to metres per second.
// V4.56: +25% for every non-cavalry unit; mounted units keep their accepted speed.
import { ARMY_TEMPO } from './unit-balance.js';
const PREVIOUS_MOVEMENT = {
  knight: 147,
  orc_warg: 136,
  swordsman:42,spearman:40,archer:42,priest:38,catapult:24,mage:36,
  orc_warrior:34,orc_berserker:42,orc_goblin:56,orc_shaman:38,orc_ram:20,orc_troll:26,
  und_skeleton:42,und_skeleton_archer:40,und_zombie:26,und_ghost:46,
  und_necromancer:36,und_vampire:50,und_lich:32,
};
export const MOVEMENT_BALANCE=Object.freeze(Object.fromEntries(Object.entries(PREVIOUS_MOVEMENT)
  .map(([key,speed])=>[key,speed*(['knight','orc_warg'].includes(key)?1:ARMY_TEMPO.movement)])));
export function installUnitMovementBalance(R){
  for(const [key,speed]of Object.entries(MOVEMENT_BALANCE))R.UNITS[key].speed=speed;
}
