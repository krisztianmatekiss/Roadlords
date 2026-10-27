export const APP = Object.freeze({
  version: '4.54.1',
  label: 'V4.54.1 · GOBLIN ÉS AI GAZDASÁG',
  title: 'Roadlords – Goblin és AI gazdaság',
  repository: 'krisztianmatekiss/Roadlords',
  musicRoot: 'https://raw.githubusercontent.com/krisztianmatekiss/roadlords-music/main/',
});
export function applyAppIdentity() {
  document.title = APP.title;
  window.__ROADLORDS_VERSION__ = APP.version;
  document.querySelectorAll('.menuVersion,.brand small').forEach(el => { el.textContent = APP.label; });
}
