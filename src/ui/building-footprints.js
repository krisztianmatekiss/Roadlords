// Ground markings are separate from the art and its team/hover filters.
export function installBuildingFootprints(R) {
  const renderCity = R.renderCity, rendered = new WeakMap();
  R.renderCity = function (container, city, interactive) {
    const out = renderCity(container, city, interactive);
    const first = container.querySelector('.building');
    // Enemy-city rendering can be cached by the original renderer.
    if (first && rendered.get(container) === first) return out;
    rendered.set(container, first);
    container.querySelectorAll('.buildingFootprint').forEach(el => el.remove());
    const ground = document.createDocumentFragment();
    for (const b of city.buildings) {
      for (const [row, col] of R.buildingCells(b)) {
        const cell = document.createElement('div');
        cell.className = `buildingFootprint ${R.BUILDINGS[b.type].category}`;
        cell.dataset.id = b.id;
        cell.dataset.r = row; cell.dataset.c = col;
        cell.style.gridRow = row + 1; cell.style.gridColumn = col + 1;
        cell.setAttribute('aria-hidden', 'true');
        ground.append(cell);
      }
    }
    container.append(ground);
    return out;
  };
}
