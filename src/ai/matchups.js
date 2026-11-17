import { UNIT_FEATURES } from './mechanics.js';

const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const tags=(R,u)=>new Set([...(UNIT_FEATURES[u.key]||[]),...(u.tags||R.UNITS[u.key]?.tags||[])]);

// One bounded summary per decision, not a search for every hypothetical soldier.
// Threat shares use combat power: six Knights are not erased by a hundred
// half-slot Goblins when considering a cavalry counter.
export function matchupContext(R,battle,metrics){
  const foes=battle?.foes||[],cells=new Map();
  let power=0,heavy=0,ranged=0,counters=0,speed=0,range=0;
  for(const e of foes){
    const u=e.u,base=R.UNITS[u.key]||{},features=tags(R,u);
    const weight=Math.max(.1,e.power??Math.sqrt(Math.max(1,u.maxHp||base.hp||100)/100)*(u.damage||base.damage||1)/Math.max(.2,u.cooldownTime||base.cooldown||1));
    power+=weight;speed+=(u.speed||base.speed||30)*weight;range+=(u.range||base.range||30)*weight;
    if(['cavalry','siege'].includes(u.cat||base.cat))heavy+=weight;
    if(features.has('ranged'))ranged+=weight;
    if(features.has('counter'))counters+=weight;
    const cell=Math.floor(u.lane/80)+':'+Math.floor(((u.offset||0)+512)/80);cells.set(cell,(cells.get(cell)||0)+1);
  }
  const frontline=Object.entries(metrics.units).some(([key,u])=>u.count>0&&(R.UNITS[key]?.tags||[]).includes('melee'));
  const density=foes.length?[...cells.values()].reduce((n,x)=>n+x*x,0)/foes.length:2;
  return{known:power>0,heavy:heavy/Math.max(.1,power),ranged:ranged/Math.max(.1,power),counters:counters/Math.max(.1,power),
    speed:speed/Math.max(.1,power),range:range/Math.max(.1,power),density,frontline};
}

export function matchupMultiplier(R,key,stats,context={known:false,heavy:0,ranged:0,counters:0,density:2,frontline:false}){
  const features=tags(R,{key}),ranged=features.has('ranged'),cavalry=R.UNITS[key]?.cat==='cavalry';
  let value=1;
  if(ranged){
    // Range buys firing time; screening makes that time usable. Cavalry
    // closes the gap faster, so ranged recruits are not a universal answer.
    const closing=context.known?Math.max(25,context.speed):50;
    const lead=clamp((stats.range-(context.known?context.range:35))/closing/Math.max(.5,stats.cooldown),0,3);
    value*=1.25+lead*.18+(context.frontline?.25:0);
    if(context.known)value*=1-context.heavy*.2;
  }
  if(features.has('counter'))value*=1+context.heavy*.85;
  if(cavalry)value*=1+context.ranged*.3-context.counters*.4;
  if(stats.aoe>0)value*=1+Math.min(1.2,Math.max(0,context.density-1)*stats.aoe/120);
  return clamp(value,.5,6);
}
