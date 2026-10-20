export const APP = Object.freeze({
  version: '4.17.1',
  label: 'V4.17.1 · TESZTEK ÉS MENETIRÁNY',
  title: 'Roadlords – Tesztek és menetirány',
  repository: 'krisztianmatekiss/Roadlords',
  musicRoot: 'https://raw.githubusercontent.com/krisztianmatekiss/roadlords-music/main/',
});
export function applyAppIdentity() {
  document.title = APP.title;
  window.__ROADLORDS_VERSION__ = APP.version;
  document.querySelectorAll('.menuVersion,.brand small').forEach(el => { el.textContent = APP.label; });
}
