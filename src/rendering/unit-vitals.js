// Both layers use maximum HP as their common scale. Shield damage therefore
// shortens the blue upper layer without changing the red HP underneath.
export function drawUnitVitals(g, u, top, width = 24, poisonDamage = 0) {
  if (!u?.alive) return;
  const max = Math.max(1,u.maxHp), shield = Math.max(0,u.shield || 0)+Math.max(0,u.tempShield || 0);
  const x = -width/2, hpY = top;
  g.fillStyle = '#171b1a';g.fillRect(x-1,hpY-1,width+2,4);
  g.fillStyle = '#e65050';g.fillRect(x,hpY,width*Math.max(0,Math.min(1,u.hp/max)),2);
  const poisoned = Math.max(0,Math.min(u.hp-1,poisonDamage));
  if (poisoned > 0) {
    g.fillStyle = '#a4ed65';
    g.fillRect(x+width*Math.max(0,u.hp-poisoned)/max,hpY,width*poisoned/max,2);
  }
  if (shield > 0) {
    g.fillStyle = '#13232c';g.fillRect(x-1,hpY-5,width+2,4);
    g.fillStyle = '#66cbff';g.fillRect(x,hpY-4,width*Math.min(1,shield/max),2);
  }
}
