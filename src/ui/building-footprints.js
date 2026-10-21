// Ground markings are separate from the art and its team/hover filters.
const SVG = 'http://www.w3.org/2000/svg';

// Trace only exposed cell edges, then join collinear edges. Internal grid gaps
// become part of the building's ground; concave corners keep their empty cells.
function outline(cells) {
  const occupied = new Set(cells.map(([r, c]) => `${c},${r}`)), edges = new Map();
  const add = (x, y, dx, dy) => edges.set(`${x},${y}`, [x + dx, y + dy]);
  for (const [r, c] of cells) {
    if (!occupied.has(`${c},${r - 1}`)) add(c, r, 1, 0);
    if (!occupied.has(`${c + 1},${r}`)) add(c + 1, r, 0, 1);
    if (!occupied.has(`${c},${r + 1}`)) add(c + 1, r + 1, -1, 0);
    if (!occupied.has(`${c - 1},${r}`)) add(c, r + 1, 0, -1);
  }
  const contours = [];
  while (edges.size) {
    const start = edges.keys().next().value, points = [];
    let key = start;
    do {
      points.push(key.split(',').map(Number));
      const next = edges.get(key); edges.delete(key);
      key = next.join(',');
    } while (key !== start);
    contours.push(points.filter((p, i) => {
      const prev = points[(i + points.length - 1) % points.length], next = points[(i + 1) % points.length];
      return (p[0] - prev[0]) * (next[1] - p[1]) !== (p[1] - prev[1]) * (next[0] - p[0]);
    }));
  }
  return contours;
}

export function installBuildingFootprints(R) {
  const renderCity = R.renderCity, rendered = new WeakMap(), observed = new WeakSet();
  function layout(grid) {
    const style = getComputedStyle(grid), rect = grid.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const gapX = parseFloat(style.columnGap) || 0, gapY = parseFloat(style.rowGap) || 0;
    const cellW = (rect.width - gapX * (R.GRID - 1)) / R.GRID;
    const cellH = (rect.height - gapY * (R.GRID - 1)) / R.GRID;
    for (const mark of grid.querySelectorAll('.buildingFootprint')) {
      const {w, h, contours} = mark.footprint;
      const width = cellW * w + gapX * (w - 1), height = cellH * h + gapY * (h - 1);
      mark.setAttribute('viewBox', `0 0 ${width} ${height}`);
      // Stroke center is 4px inward, leaving its outer edge 3px inside.
      const path = contours.map(points => points.map(([x, y], i) => {
        const prev = points[(i + points.length - 1) % points.length], next = points[(i + 1) % points.length];
        const a = prev[0] === x ? prev : [x, y], b = next[0] === x ? next : [x, y];
        const down = b[1] > a[1];
        const aX = prev[1] === y ? prev[0] : x, bX = next[1] === y ? next[0] : x;
        const right = bX > aX;
        return `${i ? 'L' : 'M'}${x * (cellW + gapX) + (down ? -gapX - 4 : 4)} ${y * (cellH + gapY) + (right ? 4 : -gapY - 4)}`;
      }).join(' ') + ' Z').join(' ');
      mark.firstChild.setAttribute('d', path);
    }
  }
  const observer = new ResizeObserver(entries => entries.forEach(e => layout(e.target)));
  R.roadLayoutFootprints = () => R.$$('#playerGrid,#enemyGrid').forEach(layout);
  R.renderCity = function (container, city, interactive) {
    const out = renderCity(container, city, interactive);
    const first = container.querySelector('.building');
    // Enemy-city rendering can be cached by the original renderer.
    if (first && rendered.get(container) === first) return out;
    rendered.set(container, first);
    container.querySelectorAll('.buildingFootprint').forEach(el => el.remove());
    const ground = document.createDocumentFragment();
    for (const b of city.buildings) {
      const bounds = R.shapeBounds(b.type, b.rotation || 0), mark = document.createElementNS(SVG, 'svg');
      mark.setAttribute('class', `buildingFootprint ${R.BUILDINGS[b.type].category}`);
      mark.dataset.id = b.id;
      mark.style.gridRow = `${b.row + 1} / span ${bounds.h}`;
      mark.style.gridColumn = `${b.col + 1} / span ${bounds.w}`;
      mark.setAttribute('aria-hidden', 'true'); mark.setAttribute('focusable', 'false');
      mark.setAttribute('preserveAspectRatio', 'none');
      mark.footprint = {w: bounds.w, h: bounds.h, contours: outline(bounds.cells)};
      mark.append(document.createElementNS(SVG, 'path')); ground.append(mark);
    }
    container.append(ground);
    layout(container);
    if (container.isConnected && !observed.has(container)) { observer.observe(container); observed.add(container); }
    return out;
  };
}
