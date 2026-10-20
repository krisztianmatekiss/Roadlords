import { assetUrl } from '../assets/urls.js';
export function initializeRenderingOrcEmblems(runtime) {
  const svg = (body, w = 96, h = 96) => 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}"><defs><linearGradient id="b" x2="0" y2="1"><stop stop-color="#34513b"/><stop offset="1" stop-color="#101c16"/></linearGradient></defs>${body}</svg>`);
  const face = (skin = '#78944b', ears = true) => `${ears ? '<path d="M29 35 12 25 21 53H75L84 25 67 35" fill="' + skin + '" stroke="#182819" stroke-width="3"/>' : ''}<path d="M27 31Q48 18 69 31L66 68Q48 88 30 68Z" fill="${skin}" stroke="#182819" stroke-width="3"/><path d="m31 43 11 3m12 0 11-3" stroke="#131c14" stroke-width="5"/><path d="M36 62Q48 69 60 62" fill="none" stroke="#253320" stroke-width="4"/><path d="m35 68 3-13 5 15m10 0 5-15 3 13" fill="#eee3b9"/>`;
  const axe = '<path d="m22 79 48-64" stroke="#a47a45" stroke-width="7"/><path d="m53 19 13-8 17 18-3 16-12-3-4-12Z" fill="#bdc9c0" stroke="#273d32" stroke-width="3"/>';
  const portraits = {
    orc_warrior: face() + '<path d="M25 37 30 19 48 10 67 19 72 37 48 29Z" fill="#8c9691" stroke="#25342b" stroke-width="3"/>' + axe,
    orc_berserker: face('#8a9b51') + '<path d="m36 20 12-15 12 15-8-4-4 12-4-12Z" fill="#b64e33"/><path d="M30 50 42 54M54 54 66 50" stroke="#a7352c" stroke-width="4"/>' + axe + '<path d="m16 26 11 4-4 18-14-3Z" fill="#c5c6b0"/>',
    orc_goblin: face('#90a852') + '<path d="M20 31 36 12 65 19 76 32 49 25Z" fill="#77532d"/><path d="M75 38Q97 59 75 84M75 38V84" fill="none" stroke="#d1b575" stroke-width="3"/><path d="m67 62 24-2-5-4" fill="none" stroke="#dadfc9" stroke-width="2"/>',
    orc_warg: '<path d="m20 15 25 15h8l23-15-3 32 6 16-31 25L17 63l6-16Z" fill="#8c9891" stroke="#1b2b26" stroke-width="4"/><path d="m27 44 15 5-13 6m40-11-15 5 13 6" fill="#e6b84a"/><path d="m36 61 12-9 12 9-12 11Z" fill="#1c2b25"/><path d="m32 69 6 11 4-7m12 0 4 7 6-11" fill="#ede4c9"/>',
    orc_shaman: '<path d="M13 82 18 35 48 8 77 35 83 82Z" fill="#584568" stroke="#201e29" stroke-width="4"/>' + face('#638476') + '<path d="M18 37 48 16 78 37 59 30 48 39 37 30Z" fill="#735b87"/><circle cx="76" cy="70" r="12" fill="#b2c8a2" stroke="#4c7160" stroke-width="3"/><path d="m72 70 4-5 4 5-4 6Z" fill="#4c345c"/>',
    orc_ram: '<path d="M15 70V38L48 20 81 38V70Z" fill="#795637" stroke="#231e17" stroke-width="4"/><path d="m10 39 38-25 38 25" fill="none" stroke="#b19b6a" stroke-width="7"/><path d="M10 55H84" stroke="#422e20" stroke-width="17"/><path d="M74 43 91 48V64L74 69Z" fill="#9ba39a"/><circle cx="27" cy="77" r="10" fill="#252c25" stroke="#a49871" stroke-width="4"/><circle cx="69" cy="77" r="10" fill="#252c25" stroke="#a49871" stroke-width="4"/>',
    orc_troll: face('#708c78', false) + '<path d="M21 39 25 17 35 23 43 7 51 21 68 13 76 39" fill="#42574a" stroke="#23352c" stroke-width="3"/><path d="m30 67 3-18 8 23m14 0 8-23 3 18" fill="#ece6c9"/><path d="M22 77 10 84V94H86V84L74 77" fill="#80633f"/>'
  };
  for (const [k, art] of Object.entries(portraits)) runtime.UNIT_IMAGES[k] = svg('<rect width="96" height="96" rx="10" fill="url(#b)"/>' + art);
  Object.assign(runtime.PICK_UNIT_IMAGES, {
    orc_bers_rage: 'orc_berserker',
    orc_gob_bow: 'orc_goblin',
    orc_bleed: 'orc_warrior',
    orc_leech: 'orc_berserker',
    orc_double: 'orc_goblin',
    orc_spear_crit: 'orc_warg',
    orc_curse_duration: 'orc_shaman',
    orc_troll_regen: 'orc_troll'
  });
  const labels = {
    orc_work: 'FA / KŐ',
    orc_hunt: 'VADÁSZ',
    orc_hut: 'KUNYHÓ',
    orc_arena: 'ARÉNA',
    orc_overseer: 'HAJCSÁR',
    orc_altar: 'OLTÁR',
    orc_totem: 'TOTEM',
    orc_slave: 'TÁBOR',
    orc_raider: 'FOSZTÓ',
    orc_tunnel: 'ALAGÚT'
  };
  for (const [k, d] of Object.entries(runtime.BUILDINGS).filter(([, d]) => d.race === 'orc')) {
    const shape = d.shape,
      w = (Math.max(...shape.map(v => v[1])) + 1) * 64,
      h = (Math.max(...shape.map(v => v[0])) + 1) * 64,
      s = Math.min(w, h),
      art = d.unit ? portraits[d.unit] : null;
    const body = `<rect x="3" y="3" width="${w - 6}" height="${h - 6}" rx="9" fill="#1d3023" stroke="#85734d" stroke-width="4"/><path d="M8 ${h * .3} ${w / 2} 8 ${w - 8} ${h * .3}V${h - 8}H8Z" fill="#62513a" stroke="#a88d58" stroke-width="3"/><path d="M${w * .3} 12V${h - 12}M${w * .7} 12V${h - 12}" stroke="#2e3125" stroke-width="4"/>` + (art ? `<g transform="translate(${(w - s * .75) / 2} ${(h - s * .75) / 2}) scale(${s * .75 / 96})">${art}</g>` : `<circle cx="${w / 2}" cy="${h / 2}" r="${s * .25}" fill="#243c2b" stroke="#c2a56b" stroke-width="2"/><text x="${w / 2}" y="${h / 2 + 4}" text-anchor="middle" fill="#f0d9a3" font-family="sans-serif" font-weight="bold" font-size="${Math.min(12, s * .14)}">${labels[k] || 'ORK'}</text>`);
    runtime.BUILDING_IMAGES[k] = svg(body, w, h);
    runtime.CARD_IMAGES[k] = runtime.BUILDING_IMAGES[k];
    runtime.PICK_IMAGES[k] = runtime.CARD_IMAGES[k];
  }
  for (const item of [...runtime.NORMAL, ...runtime.LEGENDARY].filter(x => x.race === 'orc')) if (!runtime.PICK_UNIT_IMAGES[item.id] && !runtime.PICK_IMAGES[item.id]) runtime.PICK_IMAGES[item.id] = svg('<rect width="96" height="96" rx="12" fill="url(#b)"/><path d="M48 10 77 24 73 66 48 86 23 66 19 24Z" fill="#795c35" stroke="#d6ba77" stroke-width="4"/><path d="m48 26 7 15 17 2-13 12 3 17-14-8-14 8 3-17-13-12 17-2Z" fill="#d8c17d"/>');
}
