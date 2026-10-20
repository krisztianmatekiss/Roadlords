import { assetUrl } from '../assets/urls.js';
export function initializeRenderingGuildArtwork(runtime) {
  const MASTERS = 'mastersguild';
  if (!runtime.BUILDINGS[MASTERS]) return;
  runtime.BUILDING_IMAGES[MASTERS] = runtime.v45Svg(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><defs><filter id="s"><feDropShadow dx="0" dy="7" stdDeviation="6" flood-opacity=".55"/></filter><linearGradient id="r" x2="0" y2="1"><stop stop-color="#8d9698"/><stop offset="1" stop-color="#465356"/></linearGradient></defs><g filter="url(#s)"><ellipse cx="111" cy="215" rx="91" ry="22" fill="#14231b"/><path d="M25 91h92v119H25z" fill="#684a32" stroke="#241a14" stroke-width="7"/><path d="M26 91 70 47l48 44z" fill="#376b70" stroke="#1f2c2c" stroke-width="7"/><path d="M111 132h118v78H111z" fill="#806043" stroke="#291e16" stroke-width="7"/><path d="m110 132 55-47 65 47z" fill="#4b8588" stroke="#223031" stroke-width="7"/><rect x="48" y="121" width="35" height="54" rx="3" fill="#201d1a"/><path d="M54 177h25l-4 25H58z" fill="#ffb04c"/><path d="M139 151h61v41h-61z" fill="#273235" stroke="#d1b56b" stroke-width="5"/><path d="M170 143c25 7 33 21 31 42-3 25-19 37-31 43-13-6-29-18-32-43-2-21 7-35 32-42z" fill="url(#r)" stroke="#d8dfe1" stroke-width="5"/><path d="M151 180h38M158 166l24 31M182 166l-24 31" stroke="#e6c878" stroke-width="6" stroke-linecap="round"/></g></svg>`);
  runtime.CARD_IMAGES[MASTERS] = runtime.v45Svg(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 360"><defs><linearGradient id="b" x2="0" y2="1"><stop stop-color="#263d35"/><stop offset="1" stop-color="#101b17"/></linearGradient><linearGradient id="m" x2="0" y2="1"><stop stop-color="#aeb7bc"/><stop offset="1" stop-color="#465159"/></linearGradient><filter id="s"><feDropShadow dx="0" dy="12" stdDeviation="11" flood-opacity=".7"/></filter></defs><rect width="512" height="360" fill="url(#b)"/><g filter="url(#s)"><path d="M74 159h164v139H74z" fill="#77543a" stroke="#251b15" stroke-width="10"/><path d="m58 163 93-91 103 91z" fill="#376b70" stroke="#1f2c2c" stroke-width="10"/><path d="M226 198h219v100H226z" fill="#8a6545" stroke="#251b15" stroke-width="10"/><path d="m216 200 103-83 137 83z" fill="#4b8588" stroke="#223031" stroke-width="10"/><path d="M114 203h64v83h-64z" fill="#241e1a"/><path d="M127 259h39l-7 37h-25z" fill="#ffad48"/><path d="M286 215h106v62H286z" fill="#273235" stroke="#d6bd75" stroke-width="7"/><path d="M337 164c48 11 65 38 60 76-5 42-34 63-60 75-25-12-54-33-59-75-5-38 12-65 59-76z" fill="url(#m)" stroke="#e8edef" stroke-width="8"/><path d="M300 238h74M314 209l47 62M361 209l-47 62" stroke="#e6c978" stroke-width="10" stroke-linecap="round"/></g></svg>`);
  runtime.BUILDING_IMAGE_META[MASTERS] = {
    w: 2,
    h: 2
  };
  runtime.BUILDINGS[MASTERS].shape = [[0, 0], [1, 0], [1, 1]];
  const brandSmall = document.querySelector('.brand small');
  if (brandSmall) brandSmall.textContent = 'V4.9.46 · P2P 1V1';
  if (runtime.MP?.lobby) {
    const ver = runtime.MP.lobby.querySelector('.menuVersion');
    if (ver) ver.textContent = 'V4.9.46 · P2P';
  }
  document.title = 'Roadlords V4.9.46 – Mesterek Céhe L-alakú grafika';
  window.__ROADLORDS_VERSION__ = '4.9.46-masters-guild-l-shape-art';
}
