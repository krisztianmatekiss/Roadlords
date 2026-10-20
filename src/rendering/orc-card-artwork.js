import { assetUrl } from '../assets/urls.js';
export function initializeRenderingOrcCardArtwork(runtime) {
  const art = {
    "orc_war": assetUrl("art/orc-war-005c305d9d485e51.webp"),
    "orc_work": assetUrl("art/orc-work-a6ef23a9e8d45c77.webp"),
    "orc_hunt": assetUrl("art/orc-hunt-0f92b8392b8d882b.webp"),
    "orc_hut": assetUrl("art/orc-hut-9515beebf300f5b7.webp"),
    "orc_arena": assetUrl("art/orc-arena-9f0479f6d79b7bc8.webp"),
    "orc_overseer": assetUrl("art/orc-overseer-a8eb0767bc593f2e.webp"),
    "orc_altar": assetUrl("art/orc-altar-97a955674a873090.webp"),
    "orc_totem": assetUrl("art/orc-totem-405f81d44a16b6ef.webp"),
    "orc_shaman": assetUrl("art/orc-shaman-0180280ef4c6119c.webp"),
    "orc_warg": assetUrl("art/orc-warg-fbd4557132237fd1.webp"),
    "orc_gob": assetUrl("art/orc-gob-f28e50a89a053b7c.webp"),
    "orc_bers": assetUrl("art/orc-bers-84376948ee8cd0e5.webp"),
    "orc_troll": assetUrl("art/orc-troll-336fb1704d6ff2f9.webp"),
    "orc_ram": assetUrl("art/orc-ram-25c4e57cde32f909.webp"),
    "orc_slave": assetUrl("art/orc-slave-bbd5318bd40eea00.webp"),
    "orc_raider": assetUrl("art/orc-raider-0ac1ef3edeba4c9f.webp"),
    "orc_tunnel": assetUrl("art/orc-tunnel-ee8cf1dde8e31849.webp")
  };
  for (const [key, src] of Object.entries(art)) {
    runtime.CARD_IMAGES[key] = src;
    runtime.PICK_IMAGES[key] = src;
  }
  window.__ROADLORDS_ORC_CARD_ART__ = {
    version: 1,
    keys: Object.keys(art)
  };
}
