// A Troll may use the last free slot, overshooting by at most three.
// Once the destination is full, every further arrival waits as before.
export function fitsUnitRoom(entry, room, weight) {
  return weight <= room + 1e-9 || entry?.key === 'orc_troll' && room >= 1 - 1e-9 && weight <= room + 3 + 1e-9;
}

export function unitRoomCount(entry, room, weight) {
  if (!weight) return room >= -1e-9 ? Infinity : 0;
  return entry?.key === 'orc_troll' && room >= 1 - 1e-9
    ? Math.floor((room + 3 + 1e-9) / weight)
    : Math.floor(Math.max(0, room) / weight);
}
