import { assetUrl } from '../assets/urls.js';
import { ROAD_LENGTH } from './measurements.js';
export function initializeWorldBattlefield(runtime) {
  runtime.canvas = runtime.$('#battlefield');
  runtime.ctx = runtime.canvas.getContext('2d', {
    alpha: false
  });
  runtime.pathPoints = [];
  runtime.pathPoints.push({
    x: 0,
    y: 350
  });
  runtime.pathLineTo(70, 350, 10);
  runtime.pathCubicTo(110, 350, 140, 360, 140, 400, 16);
  runtime.pathLineTo(140, 490, 18);
  runtime.pathCubicTo(140, 570, 190, 600, 250, 600, 24);
  runtime.pathCubicTo(310, 600, 360, 570, 360, 490, 24);
  runtime.pathLineTo(360, 190, 28);
  runtime.pathCubicTo(360, 110, 410, 80, 470, 80, 24);
  runtime.pathCubicTo(530, 80, 580, 110, 580, 190, 24);
  runtime.pathLineTo(580, 490, 28);
  runtime.pathCubicTo(580, 570, 630, 600, 690, 600, 24);
  runtime.pathCubicTo(750, 600, 800, 570, 800, 490, 24);
  runtime.pathLineTo(800, 190, 28);
  runtime.pathCubicTo(800, 110, 850, 80, 910, 80, 24);
  runtime.pathCubicTo(970, 80, 1020, 110, 1020, 190, 24);
  runtime.pathLineTo(1020, 285, 14);
  runtime.pathCubicTo(1020, 330, 1060, 350, 1120, 350, 18);
  runtime.pathLineTo(1200, 350, 12);
  runtime.cumulative = [0];
  for (let i = 1; i < runtime.pathPoints.length; i++) runtime.cumulative.push(runtime.cumulative[i - 1] + Math.hypot(runtime.pathPoints[i].x - runtime.pathPoints[i - 1].x, runtime.pathPoints[i].y - runtime.pathPoints[i - 1].y));
  runtime.PATH_LENGTH = ROAD_LENGTH;
  runtime.towers = [runtime.tower('p3', 'player', 3, .108, 4800), runtime.tower('p2', 'player', 2, .233, 3600), runtime.tower('p1', 'player', 1, .368, 2800), runtime.gateTower('pg-top', 'player', .018, -57), runtime.gateTower('pg-bottom', 'player', .018, 40), runtime.gateTower('eg-top', 'enemy', .982, -57), runtime.gateTower('eg-bottom', 'enemy', .982, 40), runtime.tower('e1', 'enemy', 1, .632, 2800), runtime.tower('e2', 'enemy', 2, .767, 3600), runtime.tower('e3', 'enemy', 3, .892, 4800)];
  runtime.capitalTowers = [{
    id: 'player-gate',
    side: 'player',
    lane: 0,
    cooldown: 0,
    capital: true
  }, {
    id: 'enemy-gate',
    side: 'enemy',
    lane: runtime.PATH_LENGTH,
    cooldown: 0,
    capital: true
  }];
}
