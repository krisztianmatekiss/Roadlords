import manifest from '../data/human-map-art.json';
import { cityAtlasView,loadCityAtlasViews } from './city-atlas-views.js';

export function initializeHumanMapArtwork(R) {
  let city = null;
  R.loadHumanMapArt = () => R.humanMapArtReady ||= loadCityAtlasViews(R,manifest,'human');
  const renderCity = R.renderCity;
  R.renderCity = (container, current, interactive) => {
    const previous = city;city = current;
    try { return renderCity(container,current,interactive); }
    finally { city = previous; }
  };
  const sprite = R.buildingSpriteHTML;
  R.buildingSpriteHTML = (type, rotation = 0, bounds = null) => {
    const art = manifest.sprites[type];
    if (!art || (city || R.P).race !== 'human') return sprite(type,rotation,bounds);
    return cityAtlasView(R,manifest,type,rotation,'humanMap');
  };
  window.__ROADLORDS_HUMAN_MAP__ = manifest;
}
