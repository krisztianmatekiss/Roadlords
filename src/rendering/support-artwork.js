import { assetUrl } from '../assets/urls.js';
export function initializeRenderingSupportArtwork(runtime) {
  const MASTERS = 'mastersguild',
    ACADEMY = 'academy',
    MERC = 'merc_tent';
  const ART = {
    mastersBuild: assetUrl("art/mastersBuild-864794f9d54c8ab2.png"),
    mastersCard: assetUrl("art/mastersCard-21a475cd0366bebd.webp"),
    academyBuild: assetUrl("art/academyBuild-661fe8f717ac5dd3.webp"),
    academyCard: assetUrl("art/academyCard-d02fe17307e8dc3e.webp"),
    mercBuild: assetUrl("art/mercBuild-6e96cad38ea8cd5a.webp"),
    mercCard: assetUrl("art/mercCard-69f75499e3002ad9.webp")
  };
  if (runtime.BUILDINGS[MASTERS]) {
    runtime.BUILDING_IMAGES[MASTERS] = ART.mastersBuild;
    runtime.CARD_IMAGES[MASTERS] = ART.mastersCard;
    runtime.PICK_IMAGES[MASTERS] = ART.mastersCard;
    runtime.BUILDING_IMAGE_META[MASTERS] = {
      w: 2,
      h: 2
    };
    runtime.BUILDINGS[MASTERS].shape = [[0, 0], [1, 0], [1, 1]];
  }
  if (runtime.BUILDINGS[ACADEMY]) {
    runtime.BUILDING_IMAGES[ACADEMY] = ART.academyBuild;
    runtime.CARD_IMAGES[ACADEMY] = ART.academyCard;
    runtime.PICK_IMAGES[ACADEMY] = ART.academyCard;
    runtime.BUILDING_IMAGE_META[ACADEMY] = {
      w: 2,
      h: 2
    };
    runtime.BUILDINGS[ACADEMY].shape = [[0, 0], [0, 1], [1, 0], [1, 1]];
  }
  if (runtime.BUILDINGS[MERC]) {
    runtime.BUILDING_IMAGES[MERC] = ART.mercBuild;
    runtime.CARD_IMAGES[MERC] = ART.mercCard;
    runtime.PICK_IMAGES[MERC] = ART.mercCard;
    runtime.BUILDING_IMAGE_META[MERC] = {
      w: 2,
      h: 2
    };
    runtime.BUILDINGS[MERC].shape = [[0, 0], [0, 1], [1, 0], [1, 1]];
  }
  Object.assign(runtime.PICK_IMAGES, {
    building_discount: runtime.PICK_IMAGES.full_blueprints,
    merc_cost: ART.mercCard,
    merc_cd: runtime.PICK_IMAGES.spawn_speed,
    merc_power: runtime.PICK_IMAGES.mono_veteran,
    merc_size: runtime.PICK_IMAGES.double_assault
  });
  const brandSmall = document.querySelector('.brand small');
  if (brandSmall) brandSmall.textContent = 'V4.9.57 · P2P 1V1';
  if (runtime.MP?.lobby) {
    const ver = runtime.MP.lobby.querySelector('.menuVersion');
    if (ver) ver.textContent = 'V4.9.57 · P2P';
  }
  document.title = 'Roadlords V4.9.57 – Új épületgrafikák';
  window.__ROADLORDS_VERSION__ = '4.9.57-new-building-art';
}
