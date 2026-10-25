import { installOrcSiegeArt, paintedOrcSiege, orcSiegeVariant, drawWargRider, drawOrcRam, drawWargShot } from './orc-siege-figures.js';
import { installOrcMysticsArt, paintedOrcMystic, drawOrcMystic, drawShamanShot } from './orc-mystic-figures.js';
import { installOrcRaidersArt, paintedOrcRaider, orcRaiderVariant, drawOrcRaider, drawGoblinShot } from './orc-raider-figures.js';
import { installHumanCastersArt, paintedCaster, casterHealingPose, drawHumanCaster, drawCasterShot } from './human-caster-figures.js';
import { installArcherArt, paintedArcher, drawArcher, drawArcherShot } from './archer-figure.js';
import { REFINED_UNITS, refinedLegs, refinedBody, refinedHead, refinedShield, refinedArm, refinedWeapon } from './refined-figures.js';
import { drawStatusEffects, drawMagicShot, shotKind } from './battle-effects.js';
import { unitIsElite } from '../data/unit-ranks.js';
import { installSkeletonArt, paintedSkeleton, drawSkeleton } from './skeleton-figure.js';
import { installHumanInfantryArt, paintedHumanInfantry, drawHumanInfantry } from './human-infantry-figures.js';
import { installCatapultArt, paintedCatapult, drawCatapult, drawCatapultShot } from './catapult-figure.js';
import { installKnightArt, paintedKnight, drawKnight } from './knight-figure.js';
import { installOrcWarriorArt, paintedOrcWarrior, drawOrcWarrior } from './orc-warrior-figure.js';
// Articulated battle figures follow the original roster's armor, equipment and colors.
// Vector poses are rasterized on demand; regular frames draw cached sprites only.
const TAU = Math.PI * 2;
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const mix = (a, b, t) => a + (b - a) * t;
export const FIGURES = Object.freeze({
  swordsman: { weapon: 'sword', shield: true, armor: true },
  spearman: { weapon: 'spear', shield: false, armor: true },
  archer: { weapon: 'bow', hood: true },
  knight: { weapon: 'spear', shield: true, armor: true, mount: 'horse' },
  priest: { weapon: 'cross', robe: '#d4cbb0' },
  mage: { weapon: 'staff', robe: '#65527d', hat: true },
  catapult: { machine: 'catapult' },
  orc_warrior: { weapon: 'axe', shield: true, orc: true, armor: true },
  orc_berserker: { weapon: 'axe', dual: true, orc: true, bare: true },
  orc_goblin: { weapon: 'sling', orc: true, size: .78, hood: true },
  orc_shaman: { weapon: 'staff', orc: true, robe: '#544b3b', skull: true },
  orc_warg: { weapon: 'spear', orc: true, mount: 'warg' },
  orc_troll: { weapon: 'club', orc: true, size: 1.32, bare: true },
  orc_ram: { machine: 'ram', orc: true },
  und_skeleton: { undead:'skeleton', weapon:'sword', size:.95 },
  und_skeleton_archer: { undead:'skeleton', weapon:'bow', size:.95 },
  und_zombie: { undead:'zombie', weapon:'fist', size:1.05 },
  und_ghost: { undead:'ghost', weapon:'claw', robe:'#447f75' },
  und_necromancer: { undead:'necro', weapon:'staff', robe:'#3f4b51' },
  und_vampire: { undead:'vampire', weapon:'sword', robe:'#6c3449' },
  und_lich: { undead:'lich', weapon:'staff', robe:'#414865' },
});

export function figurePose(u, clock, dead = false) {
  if (dead) return { state: 'death', frame: Math.min(5, Math.floor(clamp((clock - u.death) / .6) * 6)) };
  const a = u.roadAttack;
  if (a && clock >= a.start && clock < a.end) {
    const strikeAt = a.launch, windEnd = Math.max(a.start + .01, strikeAt - .085);
    let frame;
    if (clock < windEnd) frame = Math.min(3, Math.floor(clamp((clock - a.start) / (windEnd - a.start)) * 4));
    else if (clock < strikeAt) frame = 4 + Math.min(2, Math.floor(clamp((clock - windEnd) / (strikeAt - windEnd)) * 3));
    else frame = 7 + Math.min(4, Math.floor(clamp((clock - strikeAt) / (a.recovery || .24)) * 5));
    return { state: 'attack', frame, contact: clock >= a.hit };
  }
  if (u.roadMoving) return { state: 'walk', frame: Math.floor(((u.roadWalk ?? clock * 8) + u.id * .73) / TAU * 8) % 8 };
  return { state: 'idle', frame: 0 };
}
function figureFacing(u,pose){
  // Only a current attack may override travel direction; expired attacks cannot.
  if(pose.state==='attack')return u.roadAttack.to>=u.lane?1:-1;
  return u.roadFace||(u.side==='enemy'?-1:1);
}
function phase(pose) {
  const n = pose.frame;
  return {
    walk: pose.state === 'walk' ? Math.sin(n / 8 * TAU) : 0,
    wheel: pose.state === 'walk' ? n / 8 * TAU : 0,
    wind: pose.state === 'attack' ? n < 4 ? (n + 1) / 4 : 1 : 0,
    strike: pose.state === 'attack' ? n < 4 ? 0 : n < 7 ? (n - 3) / 3 : 1 : 0,
    recovery: pose.state === 'attack' && n >= 7 ? (n - 6) / 5 : 0,
    death: pose.state === 'death' ? (n + 1) / 6 : 0,
  };
}
function ellipse(g, x, y, rx, ry, color) {
  g.fillStyle = color; g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, TAU); g.fill();
}
function line(g, x, y, xx, yy, color, width = 1) {
  g.strokeStyle = color; g.lineWidth = width; g.lineCap = 'round'; g.beginPath(); g.moveTo(x, y); g.lineTo(xx, yy); g.stroke();
}
function poly(g, points, fill, stroke = '#252b25', width = .8) {
  g.beginPath(); points.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.closePath();
  g.fillStyle = fill; g.fill(); if (stroke) { g.strokeStyle = stroke; g.lineWidth = width; g.stroke(); }
}
function tint(hex, amount) {
  const n = parseInt(hex.slice(1), 16);
  const channels = [n >> 16 & 255, n >> 8 & 255, n & 255];
  return '#' + channels.map(v => Math.round(mix(v, amount > 0 ? 240 : 16, Math.abs(amount))).toString(16).padStart(2, '0')).join('');
}
function material(g, color) {
  const gradient = g.createLinearGradient(-8, -34, 12, -9);
  gradient.addColorStop(0, tint(color, .22)); gradient.addColorStop(.4, color); gradient.addColorStop(1, tint(color, -.4));
  return gradient;
}
function wheel(g, x, y, rotation, size = 5.5) {
  ellipse(g, x, y, size, size * .85, '#282b26'); ellipse(g, x, y, size - 1.2, (size - 1.2) * .85, '#987448');
  for (let i = 0; i < 4; i++) { const a = rotation + i * Math.PI / 2; line(g, x, y, x + Math.cos(a) * (size - 1), y + Math.sin(a) * (size - 1) * .85, '#4d3c2c', 1.2); }
  ellipse(g, x, y, 1.5, 1.4, '#c2b58a');
}
function weapon(g, kind, x, y, angle, color, p, refined = false) {
  g.save(); g.translate(x, y); g.rotate(angle);
  if(refined){refinedWeapon(g,kind);g.restore();return;}
  if (kind === 'sword') {
    poly(g, [[-2,-1.5],[18,-1.1],[24,0],[18,1.4],[-2,1.6]], '#c3cec8', '#3d4945', .7);
    line(g, 0, -.5, 19, -.4, '#f6f2d8', .7); line(g, -2,-4,-2,4,'#c4a667',1.7); line(g,-7,0,-3,0,'#685039',2.4);
  } else if (kind === 'spear') {
    line(g,-17,0,28,0,'#4e3828',2.5); line(g,-17,-.6,28,-.6,'#a38554',.7);
    poly(g,[[27,-2.3],[36,0],[27,2.3],[29,0]],'#d9dfcf');
    poly(g,[[22,1],[27,1],[24,8],[21,6]],color,null);
  } else if (kind === 'axe' || kind === 'club') {
    line(g,-6,0,19,0,'#4e3627',3); line(g,-4,-.7,18,-.7,'#a8834e',.8);
    if (kind === 'axe') { poly(g,[[13,-2],[13,-9],[22,-8],[24,-3],[20,1],[14,2]],'#929f95'); line(g,22,-8,24,-3,'#e1e3ca',1); }
    else { poly(g,[[12,-4],[26,-5],[29,1],[25,5],[13,4]],'#756448'); for (let i=0;i<3;i++)poly(g,[[15+i*4,-4],[17+i*4,-8],[18+i*4,-4]],'#b1b6a3'); }
  } else if (kind === 'bow') {
    g.rotate(-.6); g.strokeStyle='#ad8b53';g.lineWidth=2;g.beginPath();g.arc(-2,0,12,-1.3,1.3);g.stroke();
    const pull = p.wind * (1-p.strike) * 7;
    line(g,1,-11,-6-pull,0,'#e4d4ab',.7);line(g,-6-pull,0,1,11,'#e4d4ab',.7);
    if (p.strike < 1) { line(g,-15-pull,0,13-pull,0,'#d2bc80',1);poly(g,[[12-pull,-1.5],[17-pull,0],[12-pull,1.5]],'#cfd6bd'); }
  } else if (kind === 'sling') {
    const a = (p.wind * 4 - p.strike * 5) * (1 - p.recovery);
    line(g,0,0,Math.cos(a)*12,Math.sin(a)*12,'#a38a5f',1);ellipse(g,Math.cos(a)*12,Math.sin(a)*12,2.4,2,'#a5afa0');
  } else {
    g.rotate(-1.2);line(g,-13,0,17,0,'#6d4f34',2.5);line(g,-11,-.7,16,-.7,'#b29865',.7);
    if (kind === 'cross') {line(g,14,-5,14,5,'#e1d3a0',2);line(g,10,0,20,0,'#f4e9bd',2);}
    else { ellipse(g,19,0,5,5,'#26392f');ellipse(g,19,0,3.5,3.5,color);ellipse(g,20,-1,1.5,1.5,'#e7f3ba'); }
  }
  g.restore();
}
function machine(g, style, color, p) {
  const kick = (p.strike * 4 - p.wind) * (1 - p.recovery);
  if (style.machine === 'catapult') {
    line(g,-20,-12,18,-12,'#3e3024',6);poly(g,[[-13,-11],[-5,-33],[4,-11]],'#997648');
    line(g,-5,-31,-5,-11,'#c2a575',2);g.save();g.translate(-5,-25);g.rotate(-.35+(-p.wind*.9+p.strike*1.7)*(1-p.recovery));
    line(g,-15,0,19,0,'#513e2a',4);line(g,-14,-1,18,-1,'#b59862',1.1);poly(g,[[15,-4],[23,-3],[23,3],[16,3]],'#6a5135');
    if(p.strike<1)ellipse(g,20,-2,4,3.6,'#858c7b');g.restore();
    poly(g,[[-3,-20],[6,-19],[6,-11],[1,-13],[-3,-12]],color);wheel(g,-13,-4,p.wheel);wheel(g,14,-4,p.wheel);
  } else {
    poly(g,[[-26,-18],[-18,-34],[18,-34],[27,-18]],'#50452e');poly(g,[[-25,-19],[-17,-32],[17,-32],[25,-19]],color);
    for(const x of [-17,16])line(g,x,-20,x,-8,'#ae8650',3);
    line(g,-25+kick,-15,25+kick,-15,'#503b27',7);line(g,-23+kick,-17,24+kick,-17,'#a17f50',2);
    poly(g,[[22+kick,-20],[29+kick,-18],[30+kick,-12],[22+kick,-10]],'#8c978c');
    for(const x of [-16,17])wheel(g,x,-3,p.wheel,5);
  }
}
function mount(g, style, color, p) {
  const wolf = style.mount === 'warg', coat = wolf ? '#5b6256' : '#70503c';
  for(let i=0;i<4;i++){const x=i<2?-14:12, stride=p.walk*(i%2?1:-1)*5;line(g,x,-14,x+stride,0,i%2?coat:'#3b3c32',3.3);ellipse(g,x+stride,0,3,1.7,'#2e302a');}
  ellipse(g,-2,-19,22,11,material(g,coat));poly(g,[[-12,-27],[8,-29],[14,-17],[5,-10],[-15,-12]],material(g,color));
  for(let i=0;i<3;i++)line(g,-10+i*5,-23,-7+i*5,-14,tint(color,-.35),.7);
  line(g,-11,-25,6,-26,'#c4a15f',1.2);poly(g,[[10,-20],[14,-38],[20,-39],[27,-30],[22,-25],[17,-23]],wolf?'#737c68':'#8c6549');
  poly(g,[[16,-37],[15,-44],[20,-39]],wolf?'#4a5147':'#4a382d');ellipse(g,24,-30,8,4,coat);
  if(wolf)poly(g,[[25,-29],[31,-28],[27,-25]],'#dbd6b0');ellipse(g,22,-34,1.2,1.2,'#d9d09c');line(g,-21,-21,-28,-13+p.walk*3,coat,3);
  line(g,12,-30,7,-18,'#342b23',1.2);
  if(wolf){for(let i=0;i<4;i++)poly(g,[[9+i*2,-28],[13+i*2,-33],[12+i*2,-25]],'#474f42',null);}
  else {line(g,14,-36,12,-26,'#3f3529',2.5);line(g,21,-31,27,-30,'#b89e6a',.8);}
}
function undeadFigure(g,style,color,p,elite=false) {
  const bone=style.undead==='skeleton',ghost=style.undead==='ghost',vampire=style.undead==='vampire',caster=['necro','lich'].includes(style.undead);
  const skin=bone||style.undead==='lich'?'#d4d6bd':vampire?'#bdc6b6':ghost?'#88d9bd':'#81936e',stride=p.walk*4,thrust=(p.strike*4-p.wind*2)*(1-p.recovery);
  g.save();if(ghost)g.globalAlpha=.72;
  g.translate(thrust,-Math.abs(p.walk)*.7);
  if(!ghost){
    for(const [x,dx] of [[-4,-stride],[4,stride]]){line(g,x,-13,x+dx,-6,skin,bone?2:4);line(g,x+dx,-6,x+dx*1.4,0,skin,bone?2:4);ellipse(g,x+dx,-6,1.5,1.5,'#b7c3a7');line(g,x+dx*1.4,0,x+dx*1.4+4,0,bone?'#dedac3':'#384535',2.4);}
  }
  if(style.robe){
    poly(g,[[-6,-29],[6,-29],[11,-3],[5,0],[1,-4],[-4,0],[-10,-3]],material(g,style.robe));
    poly(g,[[-2,-28],[3,-28],[5,-4],[0,-6]],material(g,color));
    if(ghost){line(g,-7,-10,-12,1,'#89d9ba',1);line(g,5,-9,11,0,'#b5f4d6',1);}
  }else if(bone){
    line(g,0,-27,0,-11,skin,2.6);for(let i=0;i<4;i++){line(g,-5+i*.3,-25+i*3,4-i*.2,-24+i*3,skin,1.7);}poly(g,[[-5,-14],[4,-14],[6,-9],[-1,-7],[-6,-10]],skin);
    poly(g,[[-6,-28],[5,-27],[3,-21],[-7,-23]],color);line(g,-7,-22,-9,-16,color,2);
  }else{poly(g,[[-7,-28],[6,-28],[9,-11],[-6,-9]],material(g,'#5b6b4e'));poly(g,[[-6,-25],[4,-26],[6,-18],[-5,-17]],material(g,color));line(g,-4,-15,5,-12,'#9ca087',1);}
  const armX=11+p.strike*4*(1-p.recovery),armY=-21-p.wind*3;
  line(g,-5,-26,-10,-16,skin,bone?2:3.3);line(g,5,-26,armX,armY,skin,bone?2:3.5);
  if(vampire){poly(g,[[-6,-29],[-14,-33],[-12,-3],[-4,-9]],material(g,'#6b3045'));poly(g,[[6,-29],[14,-34],[11,-4],[5,-10]],material(g,color));}
  ellipse(g,0,-34,5.5,6.2,material(g,skin));
  if(caster){poly(g,[[-7,-32],[-6,-40],[0,-44],[7,-39],[7,-31],[3,-35],[0,-39],[-3,-35]],style.robe);if(style.undead==='lich'){poly(g,[[-6,-39],[-8,-46],[-3,-42],[0,-48],[3,-42],[8,-46],[6,-39]],'#a6a378');}}
  ellipse(g,-1,-34,1.6,1.5,'#182c25');ellipse(g,3,-34,1.5,1.5,'#182c25');line(g,-2,-34,0,-34,'#a6ffd0',.9);line(g,2,-34,4,-34,'#a6ffd0',.9);
  if(bone||style.undead==='lich'){poly(g,[[0,-32],[-1,-29],[2,-29]],'#455b48');line(g,-3,-28,4,-28,'#65735b',1);for(let i=0;i<3;i++)line(g,-1+i*2,-30,-1+i*2,-27,'#d8d6b9',.8);}
  if(vampire){poly(g,[[-2,-29],[-1,-25],[0,-29]],'#f2e9d6');poly(g,[[2,-29],[3,-25],[4,-29]],'#f2e9d6');line(g,-4,-38,4,-38,'#343a35',2);}
  if(style.weapon==='fist'||style.weapon==='claw'){ellipse(g,armX+2,armY,2.5,2.7,skin);if(ghost)for(let i=0;i<3;i++)line(g,armX+2,armY-2+i*2,armX+7,armY-3+i*2,'#c4ffe4',.8);}
  else weapon(g,style.weapon,armX,armY,style.weapon==='sword'?mix(-1.8,.5,p.strike):-.1,style.weapon==='staff'?'#77f2b2':color,p);
  if(elite){line(g,-5,-26,5,-26,'#ffe098',1.8);line(g,-5,-26,4,-15,'#d6ac4f',2);}
  g.restore();return {stride,body:[thrust,0],weapon:[armX,armY,0]};
}
function humanoid(g, style, color, p, refined = false, elite = false) {
  if(style.undead)return undeadFigure(g,style,color,p,elite);
  const skin=style.orc?'#859453':'#b8a07c', armor=style.orc?'#807b65':'#a4b0a7';
  const metal=material(g,armor),cloth=material(g,color),hide=material(g,skin);
  if(style.mount){mount(g,style,color,p);g.translate(-1,-23);g.scale(.88,.88);}
  const stride=p.walk*(style.mount?1.7:4);
  if(refined)refinedLegs(g,style.orc,stride);else{
  line(g,-3,-12,-5-stride,-2,'#3d4238',4);line(g,4,-12,5+stride,0,style.orc?'#6d7651':'#626b5d',4);
  ellipse(g,-5-stride,-1,4,2.1,'#42382a');ellipse(g,6+stride,0,4.4,2.2,'#59452f');
  line(g,-6-stride,-3,-2-stride,-3,'#9b8458',.8);line(g,4+stride,-2,8+stride,-2,'#b19969',.8);
  if(style.armor){ellipse(g,-4,-9,2.6,3.2,metal);ellipse(g,5,-9,2.6,3.2,metal);}
  }
  const bob=Math.abs(p.walk)*.85, thrust=(p.strike*4-p.wind*1.8)*(1-p.recovery);
  g.translate(thrust,-bob);
  if(refined)refinedBody(g,style.orc,color,p);else{
  if(style.robe){poly(g,[[-6,-27],[5,-28],[10,-3],[2,-1],[-9,-3]],material(g,style.robe));line(g,-4,-19,-6,-5,tint(style.robe,.3),.8);line(g,3,-18,6,-4,tint(style.robe,-.4),1);}
  else poly(g,[[-7,-26],[5,-28],[9,-12],[4,-6],[-7,-7],[-9,-16]],style.bare?hide:style.orc?material(g,'#5e5139'):cloth);
  if(style.bare){line(g,-5,-20,5,-20,'#56603c',.8);line(g,0,-20,0,-12,'#617044',.7);}
  else {poly(g,[[-5,-25],[3,-26],[5,-13],[-4,-12]],cloth,null);line(g,-3,-23,-2,-15,tint(color,.4),.6);line(g,2,-24,3,-14,tint(color,-.4),.8);}
  if(style.orc&&!style.robe){line(g,-6,-24,6,-12,'#4b3827',2.4);for(let i=0;i<3;i++)ellipse(g,-4+i*3,-22+i*3,.6,.6,'#c0aa70');}
  if(!style.orc&&!style.bare){line(g,-4,-26,3,-12,'#7a603c',1.8);line(g,-4,-26,3,-12,'#c3a56a',.5);}
  line(g,-7,-11,7,-11,'#493729',2);ellipse(g,1,-11,1.5,1.7,'#c7ab67');
  if(style.weapon!=='spear'||style.mount)line(g,-4,-26,-9,-15,skin,4.5);
  if(style.armor){ellipse(g,-5,-26,4.6,3.1,metal);ellipse(g,6,-25,4.8,3.2,metal);line(g,-7,-28,-2,-28,'#d9d8b8',.8);if(style.orc)poly(g,[[6,-27],[8,-33],[10,-26]],'#cfbea0');}
  }
  if(refined)refinedHead(g,style.orc,color);else{
  ellipse(g,1,-33,6,6.5,hide);
  ellipse(g,3,-29,3.4,2,'#756b49');line(g,3,-34,6,-34,'#30362d',1);poly(g,[[6,-33],[9,-30],[5,-30]],skin,null);
  line(g,2,-28,5,-28,'#443f2e',.7);
  if(style.orc){poly(g,[[-4,-34],[-10,-37],[-7,-30]],skin);poly(g,[[5,-34],[12,-36],[8,-29]],skin);line(g,2,-31,7,-31,'#30362b',1.5);poly(g,[[5,-28],[6,-32],[8,-28]],'#dfd5b1');}
  if(style.armor&&!style.orc){poly(g,[[-5,-33],[-3,-39],[3,-40],[7,-35],[7,-29],[-4,-29]],armor);poly(g,[[-3,-38],[0,-39],[1,-32],[-4,-32]],'#cdd4c3',null);line(g,1,-32,7,-32,'#323c36',1.8);line(g,1,-40,2,-34,'#c7ac69',1.3);poly(g,[[-2,-40],[-1,-43],[3,-42],[4,-39]],color);}
  else if(style.hat){poly(g,[[-8,-37],[-3,-39],[0,-52],[5,-40],[10,-37]],style.robe);line(g,-3,-39,5,-40,'#c5ab67',1.2);}
  else if(style.hood){poly(g,[[-6,-32],[-5,-39],[1,-42],[7,-38],[8,-31],[4,-33],[1,-37],[-2,-34]],style.orc?'#4b5738':color);}
  else if(style.skull){ellipse(g,1,-35,7,6,'#b9b38b');ellipse(g,-1,-35,1.5,1.5,'#313a2b');ellipse(g,4,-35,1.5,1.5,'#313a2b');poly(g,[[-5,-39],[-10,-44],[-8,-35]],'#c6bea1');poly(g,[[7,-39],[12,-44],[10,-34]],'#c6bea1');}
  else if(style.orc)poly(g,[[-5,-37],[-2,-42],[4,-40],[7,-36]],'#463d2c');
  else {line(g,-4,-38,4,-38,'#6c624c',2.5);line(g,1,-28,4,-26,'#c4ba9a',2);}
  }
  const shieldAngle=-.16-p.wind*.15*(1-p.strike);
  if(elite){
    line(g,-7,-27,-2,-27,'#ffe29a',2.2);line(g,4,-27,9,-26,'#ffe29a',2.2);
    line(g,-4,-25,4,-14,'#d7ad4b',2);line(g,-5,-38,5,-38,'#e7c36b',1.5);
  }
  if(style.shield){g.save();g.translate(-8,-19);g.rotate(shieldAngle);if(refined)refinedShield(g,style.orc,color);else{ellipse(g,0,0,7,10,style.orc?'#443a29':'#b59b61');ellipse(g,0,-.3,5.5,8.1,color);line(g,0,-6,0,6,'#dbc48c',1.1);line(g,-3,-1,3,-1,'#dbc48c',1.1);ellipse(g,0,-1,1.6,1.6,armor);}g.restore();}
  let angle=mix(-.75,-2.05,p.wind);angle=mix(angle,.42,p.strike);angle=mix(angle,-.75,p.recovery);
  if(['spear','bow','cross','staff','sling'].includes(style.weapon))angle=style.weapon==='spear'?-.12-p.wind*.16*(1-p.strike):-.15;
  if(style.weapon==='staff'||style.weapon==='cross')angle-=p.wind*.45*(1-p.strike);
  const handX=10+p.strike*3*(1-p.recovery),handY=-21-p.wind*3*(1-p.strike);
  if(refined)refinedArm(g,style.orc,color,handX,handY);else{line(g,5,-25,handX-2,handY,style.bare?skin:color,4);line(g,handX-2,handY,handX,handY,armor,2.6);}
  weapon(g,style.weapon,handX,handY,angle,color,p,refined);ellipse(g,handX-2,handY,1.8,1.8,skin);
  if(style.weapon==='spear'&&!style.mount){line(g,-5,-25,-5,-20,armor,3);line(g,-5,-20,handX-9,handY+1,armor,2.5);ellipse(g,handX-9,handY+1,1.5,1.5,skin);}
  if(style.dual)weapon(g,'axe',-9,-20,-2.5+ p.strike*.9,color,p);
  return {stride,body:[thrust,-bob],shield:style.shield?[-8,-19,shieldAngle]:null,weapon:[handX,handY,angle]};
}
function sprite(R, u, pose) {
  const elite=unitIsElite(u);
  const skeleton=paintedSkeleton(R,u),orc=paintedOrcWarrior(R,u),knight=paintedKnight(R,u),catapult=paintedCatapult(R,u),human=paintedHumanInfantry(R,u),archer=paintedArcher(R,u),caster=paintedCaster(R,u),raider=paintedOrcRaider(R,u),mystic=paintedOrcMystic(R,u),siege=paintedOrcSiege(R,u),painted=siege||mystic||raider||caster||archer||skeleton||orc||knight||catapult||human;
  const variant=raider?orcRaiderVariant(R,u):siege?orcSiegeVariant(u,pose):'';
  const kind=caster?shotKind(R,u):'',healKey=caster&&Number.isInteger(pose.healFrame)?':healing:'+pose.healFrame:'';
  const color=R.unitTeamFill(u),refined=R.ROAD.figureStyle==='refined'&&REFINED_UNITS.has(u.key),key=`figure:${u.key}:${color}:${pose.state}:${pose.frame}${refined?":refined":""}${skeleton?':painted-skeleton':orc?':painted-orc':knight?':painted-knight':catapult?':painted-catapult':human?':painted-human':archer?':painted-archer':caster?':painted-caster:'+kind:raider?':painted-raider:'+variant:mystic?':painted-mystic':siege?':painted-siege:'+variant:''}${elite?":elite":""}${healKey}`;
  let canvas=R.ROAD.sprites.get(key);if(canvas)return canvas;
  const style=FIGURES[u.key];if(!style)return null;
  canvas=document.createElement('canvas');canvas.width=canvas.height=mystic&&u.key==='orc_troll'?384:mystic||siege?320:knight||catapult||human||archer||caster||raider||mystic?256:refined||painted?192:128;
  const bounds=siege?(u.key==='orc_warg'?[-68,-86,148,148]:[-60,-70,136,136]):mystic?(u.key==='orc_troll'?[-112,-144,240,240]:[-82,-116,168,168]):raider?[-48,-80,112,112]:human||archer||caster?[-44,-76,112,112]:catapult?[-54,-78,112,112]:knight?[-54,-84,124,124]:orc?[-46,-70,92,92]:[-40,-66,80,80];canvas.figureBounds=bounds;
  const g=canvas.getContext('2d'),p=phase(pose),resolution=canvas.width/bounds[2];g.translate(-bounds[0]*resolution,-bounds[1]*resolution);g.scale(resolution,resolution);
  ellipse(g,1,2,style.mount||style.machine?18:style.size>1?15:10,3.5,'#18251e66');
  if(p.death&&!painted){g.translate(p.death*4,-(1-p.death)*23);g.scale(1,1-p.death*.55);g.rotate(p.death*1.48);g.translate(0,23);}
  g.save();g.scale(style.size||1,style.size||1);
  if(siege)canvas.figureRig=u.key==='orc_warg'?drawWargRider(g,R,color,p,elite,pose,variant):drawOrcRam(g,R,color,p,elite,pose);
  else if(catapult)canvas.figureRig=drawCatapult(g,R,color,p,elite,pose);
  else if(style.machine){machine(g,style,color,p);if(elite){line(g,-16,-18,16,-18,'#ebc66f',2.5);poly(g,[[-4,-26],[4,-26],[4,-21],[0,-18],[-4,-21]],'#d8ad50');}}
  else canvas.figureRig=mystic?drawOrcMystic(g,R,color,p,elite,pose,u.key):raider?drawOrcRaider(g,R,color,p,elite,pose,u.key,variant):caster?drawHumanCaster(g,R,color,p,elite,pose,u.key,kind):archer?drawArcher(g,R,color,p,elite,pose):human?drawHumanInfantry(g,R,color,p,elite,pose.state==='walk',u.key):skeleton?drawSkeleton(g,R,color,p,elite,pose.state==='walk'):orc?drawOrcWarrior(g,R,color,p,elite,pose.state==='walk'):knight?drawKnight(g,R,color,p,elite,pose.state==='walk'):humanoid(g,style,color,p,refined,elite);g.restore();
  if(R.ROAD.sprites.size>=768)R.ROAD.sprites.delete(R.ROAD.sprites.keys().next().value);
  R.ROAD.sprites.set(key,canvas);return canvas;
}

export function installBattleFigures(R) {
  installSkeletonArt(R);
  installOrcWarriorArt(R);
  installKnightArt(R);
  installCatapultArt(R);
  installHumanInfantryArt(R);
  installArcherArt(R);
  installHumanCastersArt(R);
  installOrcRaidersArt(R);
  installOrcMysticsArt(R);
  installOrcSiegeArt(R);
  R.battleFigurePose=(u,clock,dead=false)=>casterHealingPose(u,figurePose(u,clock,dead),clock);
  R.roadDrawUnit=function drawFigure(u,dead=false) {
    const p=R.pointAt(u.lane,u.offset||0),zoom=R.ROAD.zoom||1;
    if(p.x < -90||p.x>R.ROAD.w+90)return;
    const age=dead?R.ROAD.clock-u.death:0,pose=R.battleFigurePose(u,R.ROAD.clock,dead),image=sprite(R,u,pose);
    if(!image)return;
    const detail=!R.ROAD.lowDetail;
    const g=R.ctx,scale=R.ROAD.h/600*zoom,style=FIGURES[u.key],r=style.mount||style.machine?18:style.size>1?15:10;
    g.save();g.translate(p.x,p.y);g.scale(scale,scale);g.globalAlpha=dead?clamp(1-Math.max(0,age-1.2)/1.3)*.75:1;
    if(!dead&&detail){g.strokeStyle=R.unitTeamFill(u);g.globalAlpha=.5;g.lineWidth=1;g.beginPath();g.ellipse(0,2,r,3.5,0,0,TAU);g.stroke();g.globalAlpha=1;}
    g.save();g.scale(figureFacing(u,pose),1);
    const hurt=dead?0:clamp(1-(R.ROAD.clock-(u.roadHurtAt??-99))/.16);g.translate(-Math.sin(hurt*Math.PI)*1.5,0);
    g.drawImage(image,...image.figureBounds);g.restore();
    if(!dead){
      if((detail||hurt>.4)&&u.hp<u.maxHp*.98){const top=paintedOrcSiege(R,u)?(u.key==='orc_warg'?-65:-45):paintedOrcMystic(R,u)?(u.key==='orc_troll'?-72:-60):paintedKnight(R,u)?-61:paintedCaster(R,u)?-59:-51;g.fillStyle='#14251a';g.fillRect(-10,top,21,3);g.fillStyle=R.unitTeamFill(u);g.fillRect(-9,top+1,19*clamp(u.hp/u.maxHp),1.8);}
      drawStatusEffects(R,g,u,detail,r,p.x,p.y,scale);
      if(hurt>.1){g.strokeStyle='#f7e0a1';g.lineWidth=1;line(g,8,-23,13,-27,'#ffe5a8',1);line(g,9,-19,15,-18,'#ffe5a8',1);}
    }
    g.restore();
  };
  R.roadDrawShots=function drawShots() {
    const g=R.ctx;
    for(const u of R.state.units){
      const a=u.roadAttack;if(!u.alive||!a?.ranged||R.ROAD.clock<a.launch||R.ROAD.clock>=a.hit)continue;
      const t=clamp((R.ROAD.clock-a.launch)/(a.hit-a.launch||.1));
      if(drawCatapultShot(R,u,a,t)||drawArcherShot(R,u,a,t)||drawCasterShot(R,u,a,t)||drawGoblinShot(R,u,a,t)||drawShamanShot(R,u,a,t)||drawWargShot(R,u,a,t))continue;
      const from=R.pointAt(a.lane,a.offset),to=R.pointAt(a.to,a.toOffset),rock=a.key==='catapult'||a.key==='orc_goblin',magic=R.UNITS[a.key]?.damageType==='magic';
      const x=mix(from.x,to.x,t),y=mix(from.y,to.y,t)-19*(R.ROAD.h/600)*(R.ROAD.zoom||1)-(rock?Math.sin(t*Math.PI)*(a.key==='catapult'?65:18):0);
      if(x< -25||x>R.ROAD.w+25)continue;
      g.save();g.translate(x,y);g.rotate(Math.atan2(to.y-from.y,to.x-from.x));
      if(drawMagicShot(g,a.effect||shotKind(R,u),R.ROAD.h/600*(R.ROAD.zoom||1),R.ROAD.clock)){}
      else if(magic){g.globalAlpha=.25;ellipse(g,-5,0,12,5,R.unitTeamFill(u));g.globalAlpha=1;ellipse(g,0,0,4,4,'#d9e7a6');ellipse(g,1,-1,2,2,'#fff5d5');}
      else if(rock){ellipse(g,0,0,a.key==='catapult'?4:2.5,a.key==='catapult'?3.7:2,'#b2b7a1');}
      else{line(g,-10,0,4,0,'#cebd8c',1.3);poly(g,[[3,-1.8],[8,0],[3,1.8]],'#e1e4cc',null);}
      g.restore();
    }
  };
}
