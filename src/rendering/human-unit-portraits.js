import manifest from '../data/upgrade-art-manifest.json';
import portraits from '../data/human-unit-portraits.json';
import { cardImageSource } from '../assets/card-loading.js';
import { assetUrl } from '../assets/urls.js';

export function installHumanUnitPortraits(R) {
  const previous=R.unitImageTag,source=manifest.sources['human-unit-portraits'];
  R.unitImageTag=(key,cls='unitPortrait')=>{
    const rect=portraits[key];
    if(!rect)return previous(key,cls);
    const align=key==='catapult'?'xMidYMid slice':'xMidYMin slice';
    return `<svg class="${cls} humanUnitPortrait" data-human-unit-portrait="${key}" viewBox="${rect.join(' ')}" preserveAspectRatio="${align}" style="background:#4b4837" role="img" aria-label="${R.UNITS[key].name}"><svg x="${rect[0]}" y="${rect[1]}" width="${rect[2]}" height="${rect[3]}" viewBox="${rect.join(' ')}" overflow="hidden"><image ${cardImageSource(assetUrl(source.file),'href')} width="${source.width}" height="${source.height}"/></svg></svg>`;
  };
}
