const HAMMER = '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="m7 25 12-14 4 4L11 29Z" fill="#a47741" stroke="#e8ce94" stroke-width="1.5"/><path d="m13 7 6-5 10 9-6 6-5-5-4 2-4-4Z" fill="#c3d0d3" stroke="#f4e6b8" stroke-width="1.5"/></svg>';

export function installDemolitionTool(R) {
  const button = document.createElement('button');
  button.id = 'demolitionTool';
  button.type = 'button';
  button.innerHTML = HAMMER;
  button.setAttribute('aria-label', 'Bontókalapács');
  button.setAttribute('aria-pressed', 'false');
  button.title = 'Bontókalapács · saját épületre kattintva bontás · Esc / jobb klikk: letesz';
  document.body.append(button);
  let city = R.P, target = null;
  const blocked = () => R.state.modal || R.state.ended || R.ROAD.test ||
    document.body.classList.contains('roadlords-menu-open') || document.body.classList.contains('pregame-active');
  function highlight(id = null) {
    if (id === target) return;
    target = id;
    R.$$('#playerGrid .demolitionTarget').forEach(el => el.classList.remove('demolitionTarget'));
    if (id) R.$$('#playerGrid [data-id]').filter(el => el.dataset.id === id).forEach(el => el.classList.add('demolitionTarget'));
  }
  function setActive(active) {
    R.state.demolishMode = !!active && !blocked();
    button.setAttribute('aria-pressed', String(R.state.demolishMode));
    document.body.classList.toggle('demolishing', R.state.demolishMode);
    highlight();
    if (R.state.demolishMode) {
      R.state.selectedBuild = null;
      R.state.selectedBuilding = null;
      R.state.selectedTowerId = null;
      R.clearPlacementPreview();
      R.renderBuildList();
    }
  }
  button.onclick = () => setActive(!R.state.demolishMode);
  document.addEventListener('click', event => {
    if (!R.state.demolishMode || !event.target.closest('#playerGrid')) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    if (blocked()) { setActive(false); return; }
    const id = event.target.closest('[data-id]')?.dataset.id;
    const b = id && R.getBuilding(R.P, id);
    if (!b) return;
    if (b.type === 'keep') { R.toast('A főépület nem bontható.'); return; }
    const name = (R.buildingDefinition?.(R.P,b.type) || R.BUILDINGS[b.type]).name;
    if (R.demolish(R.P, b.id)) {
      highlight();
      R.state.selectedBuilding = null;
      R.renderStatic();
      R.toast(`${name} lebontva · 50% visszatérítés.`);
    }
  }, true);
  document.addEventListener('pointermove', event => {
    if (!R.state.demolishMode) return;
    const hit = event.target.closest('#playerGrid [data-id]');
    const b = hit && R.getBuilding(R.P, hit.dataset.id);
    highlight(b && b.type !== 'keep' ? b.id : null);
  }, {passive:true});
  document.addEventListener('pointerdown', event => {
    if (R.state.demolishMode && event.target.closest('#buildList')) setActive(false);
  }, true);
  document.addEventListener('contextmenu', event => {
    if (!R.state.demolishMode) return;
    event.preventDefault(); event.stopImmediatePropagation(); setActive(false);
  }, true);
  window.addEventListener('keydown', event => {
    if (event.key !== 'Escape' || !R.state.demolishMode) return;
    event.preventDefault(); event.stopImmediatePropagation(); setActive(false);
  }, true);
  window.addEventListener('blur', () => setActive(false));
  for (const method of ['renderBuildList','updateHud']) {
    const previous = R[method];
    R[method] = (...args) => {
      if (R.state.demolishMode && (blocked() || R.state.selectedBuild || city !== R.P)) setActive(false);
      city = R.P;
      return previous(...args);
    };
  }
}
