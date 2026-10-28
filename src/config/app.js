export const APP = Object.freeze({
  version: '4.55.0',
  label: 'V4.55.0 · TÖMEGHARC ÉS CÉLZÁS',
  title: 'Roadlords – Tömegharc és célzás',
  repository: 'krisztianmatekiss/Roadlords',
  musicRoot: 'https://raw.githubusercontent.com/krisztianmatekiss/roadlords-music/main/',
});
export function applyAppIdentity() {
  document.title = APP.title;
  window.__ROADLORDS_VERSION__ = APP.version;
  document.querySelectorAll('.menuVersion,.brand small').forEach(el => { el.textContent = APP.label; });
}
