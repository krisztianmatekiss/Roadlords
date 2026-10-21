// Match the real gate opening, including responsive layout and battlefield zoom.
// Geometry is shared by a release wave and refreshed only when its size changes.
export function gateExitOffset(R, u) {
  const stamp = `${R.ROAD.w}:${R.ROAD.h}:${R.ROAD.zoom}:${innerWidth}:${innerHeight}`;
  if (R.ROAD.gateExits?.stamp !== stamp) R.ROAD.gateExits = {stamp};
  let opening = R.ROAD.gateExits[u.side];
  if (!opening) {
    const gate = R.$(u.side === 'player' ? '#playerGate' : '#enemyGate').getBoundingClientRect();
    const war = R.roadWar.getBoundingClientRect(), scale = R.ROAD.h / 600 * R.ROAD.zoom;
    opening = {
      center: (gate.top + gate.height / 2 - war.top - R.ROAD.h / 2) / scale,
      half: gate.height / scale / 2
    };
    R.ROAD.gateExits[u.side] = opening;
  }
  // Feet sit below the body's center. Leave room for the tallest mounted figure.
  const min = Math.max(-R.ROAD.half, opening.center - opening.half + 64);
  const max = Math.min(R.ROAD.half, opening.center + opening.half - 8);
  const center = min <= max ? (min + max) / 2 : opening.center;
  const spread = Math.max(0, (max - min) / 2 - 4);
  return center + ((u.id - 1) % 5 / 2 - 1) * spread;
}
