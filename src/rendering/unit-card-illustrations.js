import manifest from '../data/upgrade-art-manifest.json';
import illustrations from '../data/unit-card-illustrations.json';
import { cardImageSource } from '../assets/card-loading.js';
import { assetUrl } from '../assets/urls.js';

// Unit cards reuse their faction's approved upgrade paintings, including the
// exact equipment and character design. The battle sprite renderer is separate.
export function installUnitCardIllustrations(R) {
  const previous=R.unitImageTag;
  R.unitImageTag=(key,cls='unitPortrait')=>{
    const art=illustrations[key];
    if(!art)return previous(key,cls);
    const scene=art.scene && manifest.scenes[art.scene];
    const source=scene ? manifest.sources[scene.source] : art;
    const rect=scene?.rect || art.rect,reference=art.scene || art.reference;
    const human=R.UNITS[key].race !== 'orc';
    const align=human?'xMidYMid slice':'xMidYMin slice';
    return `<svg class="${cls} unitCardIllustration ${human?'humanUnitPortrait':'orcUnitIllustration'}" data-unit-card-art="${key}" data-card-reference="${reference}" ${human?`data-human-unit-portrait="${key}"`:''} viewBox="${rect.join(' ')}" preserveAspectRatio="${align}" role="img" aria-label="${R.UNITS[key].name}"><svg x="${rect[0]}" y="${rect[1]}" width="${rect[2]}" height="${rect[3]}" viewBox="${rect.join(' ')}" overflow="hidden"><image ${cardImageSource(assetUrl(source.file),'href')} width="${source.width}" height="${source.height}"/></svg></svg>`;
  };
}
