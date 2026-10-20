// A small deterministic terrain tile is reused while scrolling. No per-frame noise generation.
export function drawBattleGround(R) {
  if (!R.ROAD.ground) {
    const tile = document.createElement('canvas'); tile.width = 512; tile.height = 600;
    const g = tile.getContext('2d'); let seed = 7319;
    const random = () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296);
    g.fillStyle = '#354332'; g.fillRect(0, 0, 512, 600);
    for (let i = 0; i < 650; i++) {
      g.fillStyle = ['#43523a', '#536044', '#2d3c2e', '#66704b'][i % 4];
      g.globalAlpha = .45; g.beginPath(); g.ellipse(random()*512, random()*600, 2+random()*9, 1+random()*3, 0, 0, Math.PI*2); g.fill();
    }
    g.globalAlpha = 1;
    const soil = g.createLinearGradient(0, 52, 0, 548);
    soil.addColorStop(0, '#736449'); soil.addColorStop(.15, '#99815b'); soil.addColorStop(.5, '#aa9268'); soil.addColorStop(.86, '#97805b'); soil.addColorStop(1, '#736449');
    g.fillStyle = '#4d4a33'; g.fillRect(0, 49, 512, 502); g.fillStyle = soil; g.fillRect(0, 54, 512, 492);
    for (let i = 0; i < 1500; i++) {
      const x = random()*512, y = 57+random()*486;
      g.globalAlpha = .09+random()*.15;g.fillStyle = i%2 ? '#e3ca91' : '#493e2e';
      g.beginPath(); g.ellipse(x,y,.5+random()*4,.3+random()*1.3,0,0,Math.PI*2);g.fill();
    }
    g.globalAlpha = .25;
    for (const y of [148, 165, 430, 447]) { g.strokeStyle = '#62563b'; g.lineWidth = 1.5; g.beginPath();g.moveTo(0,y);g.bezierCurveTo(170,y+3,340,y-3,512,y);g.stroke(); }
    g.globalAlpha = 1;
    R.ROAD.ground = tile;
  }
  const g = R.ctx, zoom = R.ROAD.zoom || 1, width = R.ROAD.w / zoom;
  g.fillStyle = '#354332';g.fillRect(0,0,R.ROAD.w,R.ROAD.h);
  g.save();g.translate(0,R.ROAD.h/2);g.scale(zoom,R.ROAD.h/600*zoom);
  for (let x = Math.floor(R.ROAD.camera/512)*512; x < R.ROAD.camera+width; x += 512) g.drawImage(R.ROAD.ground,x-R.ROAD.camera,-300);
  g.restore();
}
