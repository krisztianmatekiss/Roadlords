// Match-stable tie breaking among similarly useful choices. Forecasts reuse the
// same seed and never consume combat/draft RNG or invent a fixed build script.
export function aiPreference(c,key){
  let hash=c.aiDecisionSeed||17;
  for(const ch of String(key))hash=Math.imul(hash^ch.charCodeAt(0),16777619);
  return (hash>>>0)/4294967296;
}
export function rankAiAlternatives(c,ranked,key,margin=2){
  if(ranked.length<2)return ranked;
  const best=ranked[0].score,close=ranked.filter(p=>best-p.score<=margin),rest=ranked.filter(p=>best-p.score>margin);
  close.sort((a,b)=>aiPreference(c,key(b))-aiPreference(c,key(a))||b.score-a.score);
  return [...close,...rest];
}
