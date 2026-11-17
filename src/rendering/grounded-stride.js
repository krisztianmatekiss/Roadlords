// Feet stay flat through the planted half of the stride; only the returning
// foot rises. Shorter, near-extended leg chains avoid a permanent squat and
// keep the two knees bending toward travel rather than splaying outwards.
export function groundedStride(pelvis,phase,walking,{hipWidth,spread,stride,lift,ankleY,upper,lower}){
  const wave=walking?Math.sin(phase):0,travel=walking?Math.cos(phase):0;
  const hips=[[pelvis[0]-hipWidth,pelvis[1]],[pelvis[0]+hipWidth,pelvis[1]]];
  const feet=[[-1,-travel],[1,travel]].map(([side,swing])=>[
    pelvis[0]+side*(spread+wave*stride),ankleY-Math.max(0,swing)**2*lift,
  ]);
  const knees=hips.map((hip,i)=>{
    const foot=feet[i],dx=foot[0]-hip[0],dy=foot[1]-hip[1],distance=Math.max(.001,Math.hypot(dx,dy));
    const reach=Math.min(distance,upper+lower-.001),along=(upper*upper-lower*lower+reach*reach)/(2*reach);
    const bend=Math.sqrt(Math.max(0,upper*upper-along*along));
    return[hip[0]+dx/distance*along+dy/distance*bend,hip[1]+dy/distance*along-dx/distance*bend];
  });
  return{hips,feet,knees,legLengths:[upper,lower]};
}
