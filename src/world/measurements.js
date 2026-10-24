// Display scale only. Combat, movement and saved coordinates keep their values.
export const WORLD_UNITS_PER_METRE = 10;
export const ROAD_LENGTH = 9600;
export const toMetres = value => Number(value) / WORLD_UNITS_PER_METRE;
const number = value => (Math.sign(value)*Math.round((Math.abs(value)+1e-9)*100)/100).toLocaleString('hu-HU', {maximumFractionDigits:2});
export const formatMetres = value => `${number(toMetres(value))} m`;
export const formatSpeed = value => `${number(toMetres(value))} m/s`;
const amount = value => Number(value.replace('−','-').replace(',','.'));
const signedMetres = value => `${value.startsWith('+')?'+':''}${formatMetres(amount(value))}`;

// Battle distances in authored prose; city-grid cells and percentages stay intact.
// Explicit SI suffixes are excluded so repeated rendering never converts twice.
export function metricDescription(text) {
  return String(text ?? '')
    .replace(/(Hatótáv|Területi sugár|Alaphatótáv)(:\s*)([+−-]?\d+(?:[,.]\d+)?)(?!\d|[,.]\d|\s*m\b|\s*mező|\s*%)/giu, (_m,label,space,n)=>label+space+signedMetres(n))
    .replace(/([+−-]?\d+(?:[,.]\d+)?)\s+megtett távolságonként/giu, (_m,n)=>`${signedMetres(n)} megtétele után`)
    .replace(/([+−-]?\d+(?:[,.]\d+)?)\s+távolságon belül/giu, (_m,n)=>`${signedMetres(n)}-en belül`)
    .replace(/([+−-]?\d+(?:[,.]\d+)?)\s+távolságra/giu, (_m,n)=>`${signedMetres(n)}-re`)
    .replace(/([+−-]?\d+(?:[,.]\d+)?)-(?:as|es) körzet/giu, (_m,n)=>`${signedMetres(n)}-es körzet`)
    .replace(/([+−-]?\d+(?:[,.]\d+)?)\s+(hatótáv(?:ból|on)?|útegység)(?!\p{L})/giu, (_m,n,unit)=>`${signedMetres(n)}${unit==='útegység'?'':` ${unit}`}`);
}
