import { assetUrl } from '../assets/urls.js';
export function initializeRenderingOrcUnitArtwork(runtime) {
  const shared = {
      "keep_card": assetUrl("art/keep-card-e99076dec274e516.webp"),
      "warehouse_map": assetUrl("art/warehouse-map-56a46807fc084ff4.webp"),
      "keep_map": assetUrl("art/keep-map-f29aa58d7eb3e3f4.webp"),
      "warehouse_card": assetUrl("art/warehouse-card-c996cf340d956ce2.webp")
    },
    metrics = {
      "warehouse": [21, 22, 1732, 793, 1774, 887],
      "keep": [9, 5, 1237, 1226, 1254, 1254]
    },
    units = {
      "orc_warrior": assetUrl("art/orc-warrior-f292123f9dc5117b.webp"),
      "orc_berserker": assetUrl("art/orc-berserker-2e4697111084e1ff.webp"),
      "orc_goblin": assetUrl("art/orc-goblin-cf82f169b54bbe5b.webp"),
      "orc_shaman": assetUrl("art/orc-shaman-58deb975519425eb.webp"),
      "orc_warg": assetUrl("art/orc-warg-f15fd6dec2f14145.webp"),
      "orc_troll": assetUrl("art/orc-troll-f45ff70a696148d6.webp"),
      "orc_ram": assetUrl("art/orc-ram-80838b8165868c19.webp")
    };
  Object.assign(runtime.UNIT_IMAGES, units);
  window.__ROADLORDS_ORC_SHARED_ART__ = {
    shared,
    metrics
  };
  window.__ROADLORDS_ORC_UNIT_ART__ = {
    keys: Object.keys(units)
  };
  let artCity = null;
  const isOrc = c => window.__ROADLORDS_ORCS__.isOrc(c);
  const previousCity = runtime.renderCity;
  runtime.renderCity = function (container, c, ...args) {
    const saved = artCity;
    artCity = c;
    try {
      return previousCity(container, c, ...args);
    } finally {
      artCity = saved;
    }
  };
  const previousSprite = runtime.buildingSpriteHTML;
  runtime.buildingSpriteHTML = function (type, rotation = 0, bounds = null) {
    const src = shared[type + '_map'];
    if (!src || !isOrc(artCity || runtime.P)) return previousSprite(type, rotation, bounds);
    const [x, y, w, h, iw, ih] = metrics[type],
      base = runtime.shapeBounds(type, 0),
      box = bounds || runtime.shapeBounds(type, rotation),
      deg = (rotation % 4 + 4) % 4 * 90;
    const style = `position:absolute;left:${(2 - .96 * x / w * 100).toFixed(4)}%;top:${(2 - .96 * y / h * 100).toFixed(4)}%;width:${(.96 * iw / w * 100).toFixed(4)}%;height:${(.96 * ih / h * 100).toFixed(4)}%;object-fit:fill;transform:none`;
    return `<span class="bspriteWrap orcSharedMapSprite"><span class="orcMapPlane" style="position:absolute;left:50%;top:50%;width:${base.w / box.w * 100}%;height:${base.h / box.h * 100}%;transform:translate(-50%,-50%) rotate(${deg}deg);transform-origin:center center"><img class="bsprite" src="${src}" alt="" draggable="false" style="${style}"></span></span>`;
  };
  const previousCard = runtime.cardBuildingImageTag;
  runtime.cardBuildingImageTag = function (type, cls = 'cardBuildingImage', race = null) {
    const src = shared[type + '_card'],
      orc = race ? race === 'orc' : isOrc(artCity || runtime.P);
    return src && orc ? `<img class="${cls}" src="${src}" alt="${type === 'keep' ? 'Ork főépület' : 'Ork raktár'}" draggable="false">` : previousCard(type, cls);
  };
  const previousImage = runtime.buildingImageTag;
  runtime.buildingImageTag = function (type, cls) {
    return shared[type + '_card'] && isOrc(artCity || runtime.P) ? runtime.cardBuildingImageTag(type, cls) : previousImage(type, cls);
  };
}
