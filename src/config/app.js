export const APP = Object.freeze({
  version: '4.32.0',
  label: 'V4.32.0 · KÁRTYÁK ÉS ÉLŐHALOTT PORTRÉK',
  title: 'Roadlords – Kártyák és élőhalott portrék',
  repository: 'krisztianmatekiss/Roadlords',
  musicRoot: 'https://raw.githubusercontent.com/krisztianmatekiss/roadlords-music/main/',
});
export function applyAppIdentity() {
  document.title = APP.title;
  window.__ROADLORDS_VERSION__ = APP.version;
  document.querySelectorAll('.menuVersion,.brand small').forEach(el => { el.textContent = APP.label; });
}
