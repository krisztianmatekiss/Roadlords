import { formatMetres } from '../world/measurements.js';

export function drawRoadScale(R) {
  const g=R.ctx, y=R.ROAD.h*551/600+4, step=500;
  const first=Math.max(0,Math.ceil(R.ROAD.camera/step)*step);
  const end=Math.min(R.PATH_LENGTH,R.ROAD.camera+R.ROAD.w/R.ROAD.zoom);
  g.save();g.font='600 11px system-ui';g.textAlign='center';g.textBaseline='top';
  const mark=lane=>{const x=R.pointAt(lane).x;if(x<0||x>R.ROAD.w)return;
    g.strokeStyle='#e8ddb0aa';g.lineWidth=1;g.beginPath();g.moveTo(x,y);g.lineTo(x,y+5);g.stroke();
    const text=formatMetres(lane),w=g.measureText(text).width;
    const left=Math.max(1,Math.min(x-w/2-3,R.ROAD.w-w-7));
    g.fillStyle='#101c14d9';g.fillRect(left,y+5,w+6,15);g.fillStyle='#eee3bb';g.fillText(text,left+w/2+3,y+6);
  };
  for(let lane=first;lane<=end;lane+=step)mark(lane);
  if(end===R.PATH_LENGTH&&R.PATH_LENGTH%step)mark(R.PATH_LENGTH);
  g.restore();
}
