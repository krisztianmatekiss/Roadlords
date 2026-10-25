export const APP = Object.freeze({
  version: '4.47.1',
  label: 'V4.47.1 · ÉLŐHALOTTAK',
  title: 'Roadlords – Élőhalott egységek',
  repository: 'krisztianmatekiss/Roadlords',
  musicRoot: 'https://raw.githubusercontent.com/krisztianmatekiss/roadlords-music/main/',
});
export function applyAppIdentity() {
  document.title = APP.title;
  window.__ROADLORDS_VERSION__ = APP.version;
  document.querySelectorAll('.menuVersion,.brand small').forEach(el => { el.textContent = APP.label; });
}
