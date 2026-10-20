import { assetUrl } from '../assets/urls.js';
export function initializeCombatAdvancedRules(runtime) {
  runtime.v45Svg = svg => 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  runtime.BUILDINGS.armorsmith = {
    name: 'Páncélkovács',
    icon: '🛡️',
    category: 'support',
    shape: [[0, 0], [1, 0], [1, 1]],
    unique: true,
    description: 'A vele közvetlenül szomszédos katonai termelőkből érkező egységek maximális HP-juk egy részével megegyező kezdőpajzsot kapnak.',
    cost: runtime.C(70, 90)
  };
  runtime.BUILDINGS.hospital = {
    name: 'Hadi kórház',
    icon: '✚',
    category: 'support',
    shape: [[0, 0], [0, 1], [1, 0]],
    unique: true,
    description: 'Az elesett saját egységek egy részét visszajuttatja a főhelyőrségbe. Tele helyőrségnél teljesen inaktív.',
    cost: runtime.C(90, 70)
  };
  for (const type of ['armorsmith', 'hospital']) if (!runtime.UNLOCKABLE.includes(type)) runtime.UNLOCKABLE.push(type);
  runtime.V4_BRANCHES.warcenter = [{
    id: 'optimized_economy',
    name: 'Optimalizált hadigazdaság',
    icon: '⚙',
    description: 'A kiválasztott haditermelési irány előnye megmarad, a hátránya megszűnik.'
  }, {
    id: 'total_war',
    name: 'Totális háború',
    icon: '☠',
    description: 'A kiválasztott haditermelési irány előnye és hátránya is megduplázódik.'
  }];
  runtime.V4_BRANCHES.armorsmith = [{
    id: 'heavy_armor',
    name: 'Nehézpáncél',
    icon: '🛡',
    description: 'A támogatott egységek 100% maximális HP-nak megfelelő pajzzsal indulnak, de 15%-kal lassabban mozognak.'
  }, {
    id: 'spiked_armor',
    name: 'Szöges vértezet',
    icon: '✹',
    description: 'A támogatott egységek 60% pajzzsal indulnak, és a pajzs által felfogott közelharci sebzés 30%-át visszaadják.'
  }];
  runtime.V4_BRANCHES.hospital = [{
    id: 'mass_rescue',
    name: 'Tömeges mentés',
    icon: '✚',
    description: '60% eséllyel menti meg az elesett egységet, amely 50% HP-val kerül vissza a főhelyőrségbe.'
  }, {
    id: 'full_recovery',
    name: 'Teljes felépülés',
    icon: '❤',
    description: '40% eséllyel menti meg az elesett egységet, amely teljes HP-val kerül vissza a főhelyőrségbe.'
  }];
  Object.assign(runtime.BUILDINGS.warcenter, {
    description: 'Globális haditermelési irányt állít be minden katonai termelőhöz. Az irány 30 másodpercenként váltható.'
  });
  runtime.BUILDING_IMAGE_META.armorsmith = {
    w: 2,
    h: 2
  };
  runtime.BUILDING_IMAGE_META.hospital = {
    w: 2,
    h: 2
  };
  runtime.BUILDING_IMAGES.armorsmith = runtime.v45Svg(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><defs><filter id="s"><feDropShadow dx="0" dy="7" stdDeviation="6" flood-opacity=".55"/></filter><linearGradient id="r" x2="0" y2="1"><stop stop-color="#7d8790"/><stop offset="1" stop-color="#39444a"/></linearGradient></defs><g filter="url(#s)"><ellipse cx="111" cy="215" rx="91" ry="22" fill="#14231b"/><path d="M25 91h92v119H25z" fill="#684a32" stroke="#241a14" stroke-width="7"/><path d="M26 91 70 47l48 44z" fill="#912f25" stroke="#271914" stroke-width="7"/><path d="M111 132h118v78H111z" fill="#806043" stroke="#291e16" stroke-width="7"/><path d="m110 132 55-47 65 47z" fill="#a43a2a" stroke="#291e16" stroke-width="7"/><rect x="48" y="121" width="35" height="54" rx="3" fill="#201d1a"/><path d="M54 177h25l-4 25H58z" fill="#ff9c3c"/><path d="M139 151h61v41h-61z" fill="#202a2f" stroke="#d1b56b" stroke-width="5"/><path d="M170 143c25 7 33 21 31 42-3 25-19 37-31 43-13-6-29-18-32-43-2-21 7-35 32-42z" fill="url(#r)" stroke="#d8dfe1" stroke-width="5"/><path d="M155 183h30M170 164v43" stroke="#e6c878" stroke-width="6"/></g></svg>`);
  runtime.CARD_IMAGES.armorsmith = runtime.v45Svg(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 360"><defs><linearGradient id="b" x2="0" y2="1"><stop stop-color="#263d35"/><stop offset="1" stop-color="#101b17"/></linearGradient><linearGradient id="m" x2="0" y2="1"><stop stop-color="#aeb7bc"/><stop offset="1" stop-color="#465159"/></linearGradient><filter id="s"><feDropShadow dx="0" dy="12" stdDeviation="11" flood-opacity=".7"/></filter></defs><rect width="512" height="360" fill="url(#b)"/><g filter="url(#s)"><path d="M74 159h164v139H74z" fill="#77543a" stroke="#251b15" stroke-width="10"/><path d="m58 163 93-91 103 91z" fill="#9c3528" stroke="#251b15" stroke-width="10"/><path d="M226 198h219v100H226z" fill="#8a6545" stroke="#251b15" stroke-width="10"/><path d="m216 200 103-83 137 83z" fill="#ad3e2e" stroke="#251b15" stroke-width="10"/><path d="M114 203h64v83h-64z" fill="#241e1a"/><path d="M127 259h39l-7 37h-25z" fill="#ff9b3e"/><path d="M286 215h106v62H286z" fill="#202a2f" stroke="#d6bd75" stroke-width="7"/><path d="M337 164c48 11 65 38 60 76-5 42-34 63-60 75-25-12-54-33-59-75-5-38 12-65 59-76z" fill="url(#m)" stroke="#e8edef" stroke-width="8"/><path d="M308 239h59M337 203v76" stroke="#e6c978" stroke-width="10"/></g></svg>`);
  runtime.BUILDING_IMAGES.hospital = runtime.v45Svg(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><defs><filter id="s"><feDropShadow dx="0" dy="7" stdDeviation="6" flood-opacity=".55"/></filter></defs><g filter="url(#s)"><ellipse cx="119" cy="216" rx="100" ry="23" fill="#14231b"/><path d="M25 96h207v83H25z" fill="#d9d0b9" stroke="#332c25" stroke-width="7"/><path d="M25 96 72 55l48 41zm96 0 53-45 59 45z" fill="#7c322d" stroke="#33231f" stroke-width="7"/><path d="M25 175h105v38H25z" fill="#c7bca4" stroke="#332c25" stroke-width="7"/><path d="M51 119h43v57H51z" fill="#5c4336"/><path d="M158 119h43v39h-43z" fill="#88bdc4" stroke="#fff0c7" stroke-width="5"/><circle cx="124" cy="112" r="29" fill="#f3ead2" stroke="#473a31" stroke-width="5"/><path d="M124 93v38M105 112h38" stroke="#b93c3c" stroke-width="11"/><path d="M143 180h74v27h-74z" fill="#efe7d3" stroke="#473a31" stroke-width="5"/><path d="M153 193h54" stroke="#bb3b3b" stroke-width="8"/></g></svg>`);
  runtime.CARD_IMAGES.hospital = runtime.v45Svg(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 360"><defs><linearGradient id="b" x2="0" y2="1"><stop stop-color="#30473d"/><stop offset="1" stop-color="#111c18"/></linearGradient><filter id="s"><feDropShadow dx="0" dy="12" stdDeviation="11" flood-opacity=".7"/></filter></defs><rect width="512" height="360" fill="url(#b)"/><g filter="url(#s)"><path d="M55 171h402v126H55z" fill="#d9d0b9" stroke="#352d26" stroke-width="10"/><path d="m50 174 99-91 103 91zm204 0 99-94 109 94z" fill="#82342e" stroke="#35241f" stroke-width="10"/><path d="M111 215h76v82h-76z" fill="#5d4437"/><path d="M326 216h76v55h-76z" fill="#86bbc3" stroke="#fff0c9" stroke-width="8"/><circle cx="255" cy="169" r="58" fill="#f4ead4" stroke="#493b31" stroke-width="8"/><path d="M255 130v78M216 169h78" stroke="#bc3c3c" stroke-width="19"/><path d="M292 280h135v35H292z" fill="#f2ead7" stroke="#493b31" stroke-width="7"/><path d="M311 297h97" stroke="#bc3c3c" stroke-width="11"/></g></svg>`);
  runtime.BUILDING_IMAGES.armorsmith = assetUrl("art/image-ccf70706248564df.webp");
  runtime.CARD_IMAGES.armorsmith = assetUrl("art/image-24643872b156b703.webp");
  runtime.BUILDING_IMAGES.hospital = assetUrl("art/image-3316e38b8fdce6cb.webp");
  runtime.CARD_IMAGES.hospital = assetUrl("art/image-64c1d78d51eb0c7d.webp");
}
