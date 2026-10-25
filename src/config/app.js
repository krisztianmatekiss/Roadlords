export const APP = Object.freeze({
  version: '4.44.0',
  label: 'V4.44.0 · DÜHÖNGŐ ÉS GOBLIN',
  title: 'Roadlords – Dühöngő és Goblin',
  repository: 'krisztianmatekiss/Roadlords',
  musicRoot: 'https://raw.githubusercontent.com/krisztianmatekiss/roadlords-music/main/',
});
export function applyAppIdentity() {
  document.title = APP.title;
  window.__ROADLORDS_VERSION__ = APP.version;
  document.querySelectorAll('.menuVersion,.brand small').forEach(el => { el.textContent = APP.label; });
}
