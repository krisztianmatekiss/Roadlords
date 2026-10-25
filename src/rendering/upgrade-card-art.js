import manifest from '../data/upgrade-art-manifest.json';
import { assetUrl } from '../assets/urls.js';

export const commonFrameUrl = race => assetUrl(race==='orc' ? 'cards/orc/upgrades/orc_as.webp' : manifest.sources['common-frame'].file);
export function upgradeScene(R, id, kind, race) {
  const humanBuilding=race==='human'&&['building','building_upgrade','building_branch'].includes(kind);
  const scene=manifest.scenes[humanBuilding?'human-building:'+id:id];
  if (scene && (humanBuilding || kind!=='building' && kind!=='unit')) {
    const source=manifest.sources[scene.source],w=source.width/source.columns,h=source.height/source.rows;
    // A nested SVG viewport selects a tile without modifying the generated original.
    const x=(scene.index%source.columns)*w,y=Math.floor(scene.index/source.columns)*h;
    return `<svg class="cardScene" data-upgrade-art="${humanBuilding?'human-building:'+id:id}" viewBox="${x} ${y} ${w} ${h}" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><image href="${assetUrl(source.file)}" width="${source.width}" height="${source.height}"/></svg>`;
  }
  const key=kind==='unit'?id:race==='undead'&&kind==='normal'?R.PICK_UNIT_IMAGES[id]:null;
  return key ? `<span class="cardScene unitCardScene" data-unit-art="${key}">${R.unitImageTag(key,'cardPortraitArt')}</span>` : '';
}
export const hasUpgradeScene = id => !!manifest.scenes[id];
