export const APP = Object.freeze({
  version: '4.58.6',
  label: 'V4.58.6 · SÍRSZIGETEK ÉS ROTHADÁS',
  title: 'Roadlords – Fajok és területek',
  repository: 'krisztianmatekiss/Roadlords',
  musicRoot: 'https://raw.githubusercontent.com/krisztianmatekiss/roadlords-music/main/',
});
export function applyAppIdentity() {
  document.title = APP.title;
  window.__ROADLORDS_VERSION__ = APP.version;
  document.querySelectorAll('.menuVersion,.brand small').forEach(el => { el.textContent = APP.label; });
}
