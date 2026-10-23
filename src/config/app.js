export const APP = Object.freeze({
  version: '4.29.3',
  label: 'V4.29.3 · OLVASHATÓBB KÁRTYÁK',
  title: 'Roadlords – Olvashatóbb kártyák',
  repository: 'krisztianmatekiss/Roadlords',
  musicRoot: 'https://raw.githubusercontent.com/krisztianmatekiss/roadlords-music/main/',
});
export function applyAppIdentity() {
  document.title = APP.title;
  window.__ROADLORDS_VERSION__ = APP.version;
  document.querySelectorAll('.menuVersion,.brand small').forEach(el => { el.textContent = APP.label; });
}
