import { assetUrl } from '../assets/urls.js';
export function initializeRenderingOrcMapArtwork(runtime) {
  const art = {
      "orc_war": assetUrl("art/orc-war-bc9136b39cc27493.webp"),
      "orc_work": assetUrl("art/orc-work-35604cd9700edfa7.webp"),
      "orc_hunt": assetUrl("art/orc-hunt-b75cfe8d93d58b80.webp"),
      "orc_hut": assetUrl("art/orc-hut-3d79ba782362ed42.webp"),
      "orc_arena": assetUrl("art/orc-arena-4d06fe3c687f6b33.webp"),
      "orc_overseer": assetUrl("art/orc-overseer-f781fb3cdea1b64f.webp"),
      "orc_altar": assetUrl("art/orc-altar-f9c7a2a550dcf772.webp"),
      "orc_totem": assetUrl("art/orc-totem-13bbd43ce93c5d9b.webp"),
      "orc_shaman": assetUrl("art/orc-shaman-0e58c808f97192ec.webp"),
      "orc_warg": assetUrl("art/orc-warg-f838c361f01c5db2.webp"),
      "orc_gob": assetUrl("art/orc-gob-2ff6a8e483c4af6c.webp"),
      "orc_bers": assetUrl("art/orc-bers-86e4d0c18002de85.webp"),
      "orc_troll": assetUrl("art/orc-troll-553919d8a4bd17fd.webp"),
      "orc_ram": assetUrl("art/orc-ram-d5cec9f29b4a804f.webp"),
      "orc_slave": assetUrl("art/orc-slave-613c078962dc2bdb.webp"),
      "orc_raider": assetUrl("art/orc-raider-915ca7bdd3e1382c.webp"),
      "orc_tunnel": assetUrl("art/orc-tunnel-56d940196335052d.webp")
    },
    metrics = {
      "orc_war": [72, 72, 1165, 1021, 1254, 1254],
      "orc_work": [34, 17, 1712, 837, 1774, 887],
      "orc_hunt": [17, 18, 1225, 1172, 1254, 1254],
      "orc_hut": [15, 9, 1224, 1224, 1254, 1254],
      "orc_arena": [8, 5, 1238, 1204, 1254, 1254],
      "orc_overseer": [1, 16, 1773, 857, 1774, 887],
      "orc_altar": [14, 4, 1226, 1204, 1254, 1254],
      "orc_totem": [7, 5, 1240, 1235, 1254, 1254],
      "orc_shaman": [6, 8, 1763, 815, 1774, 887],
      "orc_warg": [15, 10, 1746, 855, 1774, 887],
      "orc_gob": [52, 35, 1153, 1156, 1254, 1254],
      "orc_bers": [19, 36, 1728, 801, 1774, 887],
      "orc_troll": [10, 5, 1235, 1241, 1254, 1254],
      "orc_ram": [11, 15, 1756, 862, 1774, 887],
      "orc_slave": [42, 23, 1208, 1155, 1254, 1254],
      "orc_raider": [18, 17, 1218, 1220, 1254, 1254],
      "orc_tunnel": [46, 7, 1196, 1214, 1254, 1254]
    };
  Object.assign(runtime.BUILDING_IMAGES, art);
  window.__ROADLORDS_ORC_ART__ = {
    version: 2,
    keys: Object.keys(art)
  };
  window.__ROADLORDS_ORC_MAP_METRICS__ = metrics;
  const previous = runtime.buildingSpriteHTML;
  runtime.buildingSpriteHTML = function (type, rotation = 0, bounds = null) {
    const m = metrics[type];
    if (!m) return previous(type, rotation, bounds);
    const base = runtime.shapeBounds(type, 0),
      box = bounds || runtime.shapeBounds(type, rotation),
      deg = (rotation % 4 + 4) % 4 * 90;
    const [x, y, w, h, iw, ih] = m,
      scale = .96;
    const imageStyle = `position:absolute;left:${(2 - scale * x / w * 100).toFixed(4)}%;top:${(2 - scale * y / h * 100).toFixed(4)}%;width:${(scale * iw / w * 100).toFixed(4)}%;height:${(scale * ih / h * 100).toFixed(4)}%;object-fit:fill;transform:none`;
    return `<span class="bspriteWrap orcMapSprite"><span class="orcMapPlane" style="position:absolute;left:50%;top:50%;width:${base.w / box.w * 100}%;height:${base.h / box.h * 100}%;transform:translate(-50%,-50%) rotate(${deg}deg);transform-origin:center center"><img class="bsprite" src="${runtime.BUILDING_IMAGES[type]}" alt="" draggable="false" style="${imageStyle}"></span></span>`;
  };
}
