import { cardImageSource } from '../assets/card-loading.js';
import manifest from '../data/upgrade-art-manifest.json';
import { assetUrl } from '../assets/urls.js';
import { EXTRA_RELICS } from '../campaign/definitions.js';

// Reuse existing illustrations until these two new cards receive dedicated art.
const sceneFor = id => manifest.scenes[({und_elite_birth:'und_first_guard',und_territory:'und_home_march'})[id]||id];

export const commonFrameUrl = race => assetUrl(race==='human' ? manifest.sources['human-frame'].file : race==='orc' ? 'cards/orc/upgrades/orc_as.webp' : manifest.sources['common-frame'].file);
export const relicArtReference = id => EXTRA_RELICS.find(d=>d.id===id)?.art||id;
export function upgradeScene(R, id, kind, race) {
  if(kind==='relic'){const def=R.RELICS.find(d=>d.id===id);race=def.relicRace;id=relicArtReference(id);kind='legendary';}
  const humanBuilding=race==='human'&&['building','building_upgrade','building_branch'].includes(kind);
  const undeadBuilding=race==='undead'&&['building','building_upgrade','building_branch'].includes(kind);
  const sceneId=undeadBuilding?`undead-building:${id}`:race==='human'?`human-${humanBuilding?'building':kind}:${id}`:id;
  const scene=sceneFor(sceneId);
  if (scene && (race==='human' || undeadBuilding || kind!=='building' && kind!=='unit')) {
    const source=manifest.sources[scene.source],w=source.width/source.columns,h=source.height/source.rows;
    // A nested SVG viewport selects a tile without modifying the generated original.
    const [x,y,viewWidth,viewHeight]=scene.rect || [(scene.index%source.columns)*w,Math.floor(scene.index/source.columns)*h,w,h];
    return `<svg class="cardScene" data-upgrade-art="${sceneId}" viewBox="${x} ${y} ${viewWidth} ${viewHeight}" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><image ${cardImageSource(assetUrl(source.file),'href')} width="${source.width}" height="${source.height}"/></svg>`;
  }
  const key=kind==='unit'?id:race==='undead'&&kind==='normal'?R.PICK_UNIT_IMAGES[id]:null;
  return key ? `<span class="cardScene unitCardScene" data-unit-art="${key}">${R.unitImageTag(key,'cardPortraitArt')}</span>` : '';
}
export const hasUpgradeScene = id => !!sceneFor(id);
