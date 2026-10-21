export const APP = Object.freeze({
  version: '4.20.2',
  label: 'V4.20.2 · MINITÉRKÉP ÉS ÉPÜLETMEZŐK',
  title: 'Roadlords – Minitérkép és épületmezők',
  repository: 'krisztianmatekiss/Roadlords',
  musicRoot: 'https://raw.githubusercontent.com/krisztianmatekiss/roadlords-music/main/',
});
export function applyAppIdentity() {
  document.title = APP.title;
  window.__ROADLORDS_VERSION__ = APP.version;
  document.querySelectorAll('.menuVersion,.brand small').forEach(el => { el.textContent = APP.label; });
}
