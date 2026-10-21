// Material and equipment layers for the established humanoid rig. These painters
// contain no animation clock, facing, joint angles or combat state of their own.
const TAU = Math.PI * 2;
export const REFINED_UNITS = new Set(['swordsman', 'orc_warrior']);
const STEEL = '#899fae', PALE = '#e2edf0', IRON = '#3b4b52', GOLD = '#caa66a';
const SKIN = '#799454', HIDE = '#564334', EDGE = '#172328';
function tint(hex, amount) {
  const n = parseInt(hex.slice(1), 16), target = amount > 0 ? 248 : 12;
  return '#' + [n >> 16 & 255, n >> 8 & 255, n & 255].map(v => Math.round(v + (target - v) * Math.abs(amount)).toString(16).padStart(2, '0')).join('');
}
function metal(g, color, x = -8, y = -28, xx = 9, yy = -8) {
  const fill = g.createLinearGradient(x, y, xx, yy);
  for (const [at, c] of [[0,tint(color,.5)],[.23,tint(color,.2)],[.44,color],[.7,tint(color,-.34)],[1,tint(color,-.55)]]) fill.addColorStop(at,c);
  return fill;
}
function shape(g, points, fill, stroke = EDGE, width = .65) {
  g.beginPath(); points.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.closePath();
  g.fillStyle=fill;g.fill();if(stroke){g.strokeStyle=stroke;g.lineWidth=width;g.lineJoin='round';g.stroke();}
}
function line(g,x,y,xx,yy,color,width=.7) {
  g.beginPath();g.moveTo(x,y);g.lineTo(xx,yy);g.strokeStyle=color;g.lineWidth=width;g.lineCap='round';g.stroke();
}
function oval(g,x,y,rx,ry,fill,stroke) {
  g.beginPath();g.ellipse(x,y,rx,ry,0,0,TAU);g.fillStyle=fill;g.fill();
  if(stroke){g.strokeStyle=stroke;g.lineWidth=.55;g.stroke();}
}
function rivet(g,x,y) {oval(g,x,y,.55,.55,GOLD);oval(g,x-.12,y-.16,.18,.18,'#fff1bd');}
function strap(g,x,y,xx,yy) {line(g,x,y,xx,yy,'#2e2824',2.3);line(g,x-.25,y,xx-.25,yy,'#9e7950',1);}
function plate(g,x,y,xx,yy,width,color) {
  const dx=xx-x,dy=yy-y,len=Math.hypot(dx,dy);
  g.save();g.translate(x,y);g.rotate(Math.atan2(dy,dx)-Math.PI/2);
  shape(g,[[-width*.5,0],[width*.45,-.3],[width*.6,len*.7],[width*.3,len],[-width*.5,len*.9]],metal(g,color,-width,0,width,len));
  line(g,-width*.34,.8,-width*.33,len*.8,tint(color,.65),.55);g.restore();
}
export function refinedLegs(g,orc,stride) {
  // Hip and ankle locations are exactly the original rig's endpoints.
  for(const [hip,foot,front] of [[[-3,-12],[-5-stride,-2],false],[[4,-12],[5+stride,0],true]]) {
    const knee=[hip[0]*.48+foot[0]*.52, -7];
    line(g,...hip,...knee,orc?'#39362c':'#303b43',front?4.8:4.2);
    plate(g,knee[0],knee[1],foot[0],foot[1]-1,orc?3.7:3.4,orc?'#6f6550':front?STEEL:'#637582');
    oval(g,knee[0],knee[1],2.3,1.9,metal(g,orc?'#897b5e':STEEL,knee[0]-2,-9,knee[0]+2,-5),EDGE);
    g.save();g.translate(...foot);
    shape(g,[[-3,-2.2],[1.8,-2.7],[4.8,-.7],[5.5,1],[-3.5,1]],metal(g,orc?HIDE:IRON,-3,-3,5,1));
    line(g,-3,1,5.3,1,'#151c1d',.9);
    if(orc){line(g,-1,-2,-1,.1,'#c3aa76',.7);line(g,1,-2,1,.2,'#c3aa76',.7);}
    else{line(g,-2,-1.8,2.5,-.8,PALE,.55);line(g,.5,-1.9,1.2,.1,'#405363',.6);}
    g.restore();
  }
}
export function refinedBody(g,orc,color,p) {
  const cloth=metal(g,color),steel=metal(g,STEEL);
  if(!orc) {
    // Team surcoat remains readable around the neutral steel breastplate.
    shape(g,[[-6,-27],[-11,-21],[-11.5,-7+p.walk],[-6,-8],[-3,-24]],metal(g,tint(color,-.25)));
    shape(g,[[-7,-26],[5,-28],[9,-15],[6,-8],[-7,-8],[-9,-17]],cloth);
    for(const x of [-4,1,5])shape(g,[[x,-13],[x+3,-13],[x+3.4,-5],[x,-6]],cloth);
    shape(g,[[-6.5,-25.5],[1,-28],[6,-25],[7,-18],[3,-13],[-5.5,-14],[-8,-20]],steel);
    shape(g,[[-5,-24.5],[-1,-26],[0,-15],[-5,-15]],metal(g,'#b6c8d0'),null);
    line(g,0,-25.5,1,-16,'#e1eaeb',.6);line(g,1,-16,5.5,-21,'#334850',.6);
    for(const y of [-13,-11]){shape(g,[[-6,y],[5.8,y-1],[6,y+1],[-6.5,y+2]],metal(g,STEEL));line(g,-5,y,5,y-1,'#cfdbdc',.5);}
    strap(g,-5,-26,5,-12);rivet(g,-4.5,-25);rivet(g,4,-13);
    for(const [x,y] of [[-5,-26],[6,-25]]) {
      shape(g,[[x-4,y-1],[x-2,y-3],[x+3,y-2],[x+4,y+1],[x+2,y+3],[x-3,y+2]],steel);
      line(g,x-3,y-1,x+2,y-2,PALE,.7);line(g,x-3,y+1,x+3,y+1,'#536875',.7);rivet(g,x+2,y);
    }
  } else {
    shape(g,[[-9,-26],[-2,-29],[6,-28],[10,-23],[8,-11],[3,-7],[-7,-8],[-10,-17]],metal(g,SKIN));
    shape(g,[[-8,-23],[-3,-25],[0,-21],[-1,-16],[-7,-16]],metal(g,'#91a964'),null);
    line(g,-6,-17,5,-18,'#425d38',.8);line(g,1,-23,1,-13,'#4b663b',.8);
    // Fur and bone shoulder silhouette, separate from the colored cloth.
    shape(g,[[-10,-26],[-8,-30],[-5,-28],[-2,-30],[0,-28],[4,-29],[8,-27],[11,-23],[8,-22],[6,-24],[3,-23],[-1,-26],[-5,-23],[-7,-25],[-10,-23]],metal(g,'#73634c'));
    shape(g,[[3,-28],[8,-28],[11,-24],[9,-20],[3,-22]],metal(g,IRON));
    for(const [x,y] of [[4,-28],[8,-27],[10,-24]])shape(g,[[x-1,y+1],[x,y-5],[x+1.3,y+.7]],metal(g,'#d5cba8',x-1,y-5,x+2,y));
    strap(g,-7,-26,6,-12);strap(g,5,-27,-6,-11);
    for(let i=0;i<3;i++)rivet(g,-5+i*3,-24+i*3);
    shape(g,[[-7,-11],[7,-12],[8,-6],[3,-4],[-2,-6],[-7,-5]],metal(g,HIDE));
    shape(g,[[-4,-10],[4,-10],[5,-3],[2,-5],[-.5,-3],[-4,-5]],cloth);
    line(g,-3,-9,-2,-5,tint(color,.45),.6);line(g,3,-9,3.5,-5,tint(color,-.45),.7);
  }
  line(g,-7,-10.5,7,-11,'#231d18',2.2);line(g,-6,-11,6,-11.4,'#a5804e',.65);
  shape(g,[[-.8,-12.4],[2.1,-12.4],[2.1,-9.6],[-.8,-9.6]],GOLD);shape(g,[[0,-11.7],[1.4,-11.7],[1.4,-10.3],[0,-10.3]],'#4b3929',null);
}
export function refinedHead(g,orc,color) {
  if(orc) {
    shape(g,[[-4,-34],[-10,-37],[-8,-31],[-4,-30]],metal(g,SKIN));
    shape(g,[[5,-34],[12,-36],[8,-29],[5,-30]],metal(g,SKIN));
    line(g,-8,-35,-6,-32,'#435b38',.7);oval(g,-7.5,-32,.7,1.2,GOLD);
    shape(g,[[-4,-37],[1,-39],[6,-36],[7,-32],[10,-30],[8,-27],[3,-25],[-3,-27],[-6,-32]],metal(g,SKIN,-6,-38,8,-26));
    shape(g,[[-4,-36],[1,-37],[5,-35],[4,-32],[-2,-32]],metal(g,'#a2b875',-4,-37,5,-32),null);
    line(g,1,-33.7,6,-33.8,'#273c2c',1.3);line(g,3.5,-33.6,5.4,-33.6,'#f1c270',.65);
    shape(g,[[5,-33],[9,-30],[5.7,-29.5]],'#8ea65e',null);
    line(g,1,-28.7,7.8,-29,'#2b3b26',1.4);
    for(const [x,y] of [[2,-27.9],[6,-28.2]])shape(g,[[x-1,y],[x-.7,y-3.5],[x+.8,y+.2]],metal(g,'#e5dcc1',x-1,y-3,x+1,y));
    line(g,-2,-31,-.5,-29,'#c3ca88',.6);
    shape(g,[[-5,-36],[-4,-40],[-1,-38],[0,-42],[3,-40],[5,-37],[2,-36]],metal(g,'#272c29'),EDGE);
    line(g,-3,-38,0,-39,'#606754',.7);
  } else {
    oval(g,1,-32.5,5.2,6.2,metal(g,'#c3a587',-3,-37,7,-27),EDGE);
    shape(g,[[-5,-33],[-4,-38],[-1,-40],[3,-40],[7,-36],[7,-31],[4,-29],[2,-31],[-3,-30]],metal(g,STEEL,-5,-40,7,-29));
    shape(g,[[-3,-37],[-1,-39],[1,-39],[1,-33],[-4,-32]],metal(g,'#d0dde1',-4,-39,2,-32),null);
    shape(g,[[1,-34],[6.8,-34],[7.2,-32.5],[1,-32.1]],'#17292f');
    line(g,2,-32.7,5.7,-32.9,'#bda68b',.55);
    shape(g,[[5.8,-32],[8.4,-30.2],[5.7,-29.8]],'#caae8a');
    line(g,2,-28.5,5.8,-28.6,'#584739',.6);
    shape(g,[[-3.5,-31],[-.8,-31],[0,-27.5],[-2.5,-28]],metal(g,STEEL));
    line(g,-2,-39.2,1,-40.1,PALE,.8);line(g,1,-39.8,1.5,-34.5,GOLD,.85);
    shape(g,[[-1.5,-40],[-1,-43],[1,-45],[4,-43],[3,-40]],metal(g,color,-2,-45,4,-40));
    line(g,-.2,-42.4,1,-44,tint(color,.55),.7);rivet(g,-2,-30);
  }
}
export function refinedShield(g,orc,color) {
  const rim=orc?'#a7936a':GOLD;
  const edge=orc?[[-5,-9],[3,-10],[7,-5],[7,3],[3,9],[-4,8],[-8,2],[-8,-4]]:[[-6,-9],[1,-10],[6,-7],[6,3],[1,11],[-5,6],[-7,-2]];
  shape(g,edge,metal(g,rim,-8,-10,7,11));
  g.save();g.scale(.77,.79);shape(g,edge,metal(g,color,-7,-10,6,11));g.restore();
  if(orc) {
    for(const x of [-4,-1,2,4])line(g,x,-6,x,5,tint(color,-.45),.5);
    line(g,-4,-4,4,3,'#423c2d',1.4);line(g,-4,3,4,-4,'#423c2d',1.4);
    for(const [x,y] of [[-5,-6],[3,-7],[4,4],[-3,5]])rivet(g,x,y);
    oval(g,-.5,-.5,2.4,2.6,metal(g,'#89928a',-3,-3,2,2),EDGE);
    shape(g,[[-1.4,-1],[-.5,-4],[1,1]],'#ded9b8');
  } else {
    // Small gold falcon/chevron reads at normal play size without a text label.
    shape(g,[[-4,-4],[-1,-2],[.2,-5],[1.5,-2],[4,-4],[2,0],[.8,.5],[.2,5],[-.5,.5],[-2,0]],metal(g,'#e7c886',-4,-5,4,5),null);
    line(g,-5,-6,-4,3,'#e2c68c',.65);rivet(g,-4,-6);rivet(g,3,-5);rivet(g,-2,5);
  }
}
export function refinedArm(g,orc,color,handX,handY) {
  line(g,5,-25,handX-2,handY,orc?SKIN:tint(color,-.15),orc?4.8:4);
  if(orc){line(g,7,-24,handX-3,handY-1,'#aac07c',.85);plate(g,handX-4,handY-.5,handX-1,handY,3.8,HIDE);line(g,handX-3,handY-1.5,handX-3,handY+1,'#c0a877',.65);}
  else {plate(g,6,-24,handX-3,handY,3.4,STEEL);oval(g,handX-4,handY-.3,1.8,1.9,metal(g,STEEL,handX-6,handY-2,handX-2,handY+1),EDGE);}
  line(g,handX-2,handY,handX,handY,orc?HIDE:STEEL,2.8);
}
export function refinedWeapon(g,kind) {
  if(kind==='sword') {
    shape(g,[[-2,-1.7],[17,-1.6],[24,0],[17,1.6],[-2,1.7]],metal(g,'#acbec6',0,-2,0,2),EDGE,.55);
    shape(g,[[0,-1.05],[17,-1],[23.6,0],[0,.1]],'#e1ebeb',null);
    line(g,1,.2,19,.1,'#5c798b',.45);line(g,2,-1.1,17,-1.05,'#fff8e1',.45);
    shape(g,[[-3,-4.3],[-1.3,-3.7],[-1,3.7],[-3,4.3],[-3.8,2.8],[-2.9,1],[-2.9,-1],[-3.8,-2.8]],metal(g,GOLD,-4,-4,-1,4));
    line(g,-7,0,-3,0,'#392e25',2.5);for(const x of [-6.5,-5.3,-4.1])line(g,x,-.7,x+.35,.7,'#a78456',.5);oval(g,-7.5,0,1.3,1.5,metal(g,GOLD,-9,-1,-6,1),EDGE);
  } else {
    line(g,-7,0,20,0,'#2f2821',3.5);line(g,-6,-.7,19,-.7,'#ac8051',.85);
    for(const x of [-5,-2,1])line(g,x,-1.2,x+.5,1.2,'#d1b88b',.75);
    shape(g,[[13,-2],[12,-10],[18,-11],[24,-8],[25,-3],[21,2],[15,2]],metal(g,'#71858b',12,-10,25,2));
    shape(g,[[19,-10],[24,-8],[25,-3],[21,2],[20,.5],[23,-4],[22,-7]],metal(g,'#d9e3dd',19,-10,25,2),null);
    shape(g,[[14,-2],[10,-7],[13,-9],[16,-4]],'#53636a');line(g,16,-8,20,-5,'#354951',.7);rivet(g,16,-2);
  }
}
