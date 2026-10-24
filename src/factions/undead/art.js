import { assetUrl } from '../../assets/urls.js';
import { UNDEAD_BUILDINGS as D, UNDEAD_UNITS as U, UNDEAD_UPGRADES } from '../../data/undead.js';
import { isUndead } from './foundation.js';
import manifest from '../../data/undead-card-manifest.json';
const svg = (body) =>
  'data:image/svg+xml;charset=utf-8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128"><defs><radialGradient id="bg"><stop stop-color="#214839"/><stop offset="1" stop-color="#071713"/></radialGradient><linearGradient id="bone" x2="0" y2="1"><stop stop-color="#e7e6cd"/><stop offset="1" stop-color="#909b87"/></linearGradient></defs>${body}</svg>`,
  );
export function initializeUndeadArt(R) {
  const cityArt = manifest.city_artwork;
  let artCity = null;
  R.SOUL_IMAGE = svg(
    '<circle cx="64" cy="64" r="59" fill="url(#bg)"/><path d="M64 9 100 57 64 119 28 57Z" fill="#1d876d" stroke="#83f5c8" stroke-width="3"/><path d="M64 20 86 58 64 105 43 58Z" fill="#91f8cc"/><path d="M64 20v85L43 58Z" fill="#39c8a1"/>',
  );
  for (const [key, u] of Object.entries(U)) {
    const ghost = key === 'und_ghost',
      zombie = key === 'und_zombie',
      vampire = key === 'und_vampire',
      mage = ['und_necromancer', 'und_lich'].includes(key);
    const cloak = vampire ? '#643b55' : mage ? '#3e4566' : ghost ? '#3b9a86' : '#344a3d';
    const head = zombie ? '#829677' : vampire ? '#b6c6b2' : 'url(#bone)';
    R.UNIT_IMAGES[key] = svg(
      `<circle cx="64" cy="64" r="61" fill="url(#bg)" stroke="#5eb795" stroke-width="2"/><path d="M21 119 31 83 49 71h30l18 12 12 36Z" fill="${cloak}" stroke="#161e22" stroke-width="3"/><path d="M43 85 64 108 85 85 79 120H48Z" fill="#63b89a" opacity=".6"/><path d="M40 28 50 17h28l13 14-5 34-14 14H55L40 64Z" fill="${head}" stroke="#263d35" stroke-width="3"/><path d="m46 42 15 1-4 10-10-2m22-7 15-2-1 10-10 2" fill="#0a2d24"/><path d="m49 45 7 1-3 4m20-3 7-2-2 5" stroke="#a2ffce" stroke-width="3"/><path d="m63 53-5 9h12Z" fill="#234639"/><path d="M52 68h24m-19-4v10m7-10v10m7-10v10" stroke="#526353" stroke-width="2"/>${mage ? '<path d="m33 30 6-17 26-9 25 14 7 20-16-10-17-9-18 8Z" fill="#253b3c" stroke="#77b396" stroke-width="2"/><path d="M99 61v62" stroke="#7d7561" stroke-width="6"/><circle cx="99" cy="58" r="9" fill="#74f0be"/>' : ''}${vampire ? '<path d="m52 66 5 12 2-11m13 0 3 11 3-12" fill="#faf7df"/><path d="m27 90 6-28 17 22m29 0 18-22 5 29" fill="#8b3b5d"/>' : ''}${ghost ? '<path d="M25 101q-14 23 3 20m66-17q27 10 11 19" fill="none" stroke="#8efbcb" stroke-width="3" opacity=".7"/>' : ''}${key === 'und_skeleton_archer' ? '<path d="M105 80q25 18 0 41l6-20Z" fill="none" stroke="#c3a771" stroke-width="4"/>' : ''}`,
    );
  }
  const portraits = assetUrl('art/undead/units-atlas.png');
  const unitImage = R.unitImageTag;
  const portraitKeys=Object.keys(U);
  R.unitImageTag=(key,cls='unitPortrait')=>{
    const index=portraitKeys.indexOf(key);
    if(index<0)return unitImage(key,cls);
    // Viewports share one decoded atlas. The generated original stays intact.
    const x=index%4*384,y=Math.floor(index/4)*512;
    return `<svg class="${cls} undeadUnitPortrait" data-unit-portrait="${key}" viewBox="${x} ${y} 384 512" preserveAspectRatio="xMidYMin slice" role="img" aria-label="${U[key].name}"><image href="${portraits}" width="1536" height="1024"/></svg>`;
  };
  const image = (type, cls, rotation = 0) => {
    const turn=((rotation%4)+4)%4, variant=cityArt.variants[turn];
    const [x,y,w,h]=variant.rects[D[type].atlas];
    const clip=`und-city-${type}-${turn}`;
    // Nested viewports clip neighbouring sprites even when the plot is wide.
    return `<svg class="${cls} undeadBuildingArt" data-undead-building="${type}" data-art-rotation="${turn}" viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="${D[type].name}"><svg width="${w}" height="${h}" viewBox="${x} ${y} ${w} ${h}" overflow="hidden"><defs><clipPath id="${clip}"><path d="${variant.clips[D[type].atlas]}"/></clipPath></defs><image href="${assetUrl(variant.file)}" width="${variant.width}" height="${variant.height}" clip-path="url(#${clip})"/></svg></svg>`;
  };
  R.undBuildingImage = image;
  const renderCity = R.renderCity;
  R.renderCity = (container, c, ...args) => {
    const previous = artCity,
      capital = R.BUILDINGS.keep;
    artCity = c;
    if (isUndead(c)) R.BUILDINGS.keep = { ...capital, ...D.keep, cost: R.C() };
    try {
      return renderCity(container, c, ...args);
    } finally {
      artCity = previous;
      R.BUILDINGS.keep = capital;
    }
  };
  const sprite = R.buildingSpriteHTML;
  R.buildingSpriteHTML = (type, rotation = 0, bounds = null) => {
    if (!D[type] || (type === 'keep' && !isUndead(artCity || R.P))) return sprite(type, rotation, bounds);
    return `<span class="bspriteWrap undMapSprite"><span class="undMapPlane">${image(type, '', rotation)}</span></span>`;
  };
  for (const method of ['cardBuildingImageTag', 'buildingImageTag']) {
    const previous = R[method];
    R[method] = (type, cls = 'cardBuildingImage', race = null) =>
      D[type] && (type !== 'keep' || (race ? race === 'undead' : isUndead(artCity || R.P)))
        ? image(type, cls)
        : previous(type, cls, race);
  }
  for (const o of UNDEAD_UPGRADES)
    R.PICK_IMAGES[o.id] = R.PICK_UNIT_IMAGES[o.id] ? R.UNIT_IMAGES[R.PICK_UNIT_IMAGES[o.id]] : R.SOUL_IMAGE;
  window.__ROADLORDS_UNDEAD__.soulImage = R.SOUL_IMAGE;
}
