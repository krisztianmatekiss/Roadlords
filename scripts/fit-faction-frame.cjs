// Import an approved painting into the existing card's measured writing panels.
// This is a one-time asset preparation step; no slices run in the browser.
const fs = require('node:fs/promises');
const sharp = require('sharp');

const layouts = {
  orc: {
    y: [0, 42, 194, 227, 851, 898, 1390, 1418, 1493, 1536],
    header: [0, 162, 864, 1024],
    body: [0, 80, 940, 1024],
  },
  undead: {
    y: [0, 46, 149, 194, 871, 929, 1394, 1431, 1495, 1536],
    header: [0, 153, 874, 1024],
    body: [0, 80, 942, 1024],
  },
};
const targetY = [0, 23, 139, 180, 891, 950, 1420, 1445, 1509, 1536];

async function fitFactionFrame(race, source, output) {
  const layout = layouts[race];
  if (!layout) throw Error('Expected orc or undead');
  const bytes = await fs.readFile(source), meta = await sharp(bytes).metadata();
  if (meta.width !== 1024 || meta.height !== 1536) throw Error('Expected a 1024 × 1536 painting');
  const pieces = [];
  for (let row = 0; row < layout.y.length - 1; row++) {
    const sourceX = row < 3 ? layout.header : layout.body;
    const targetX = row < 3 ? [0, 112, 912, 1024] : [0, 66, 958, 1024];
    for (let col = 0; col < sourceX.length - 1; col++) {
      const input = await sharp(bytes).extract({
        left: sourceX[col], top: layout.y[row],
        width: sourceX[col + 1] - sourceX[col], height: layout.y[row + 1] - layout.y[row],
      }).resize(targetX[col + 1] - targetX[col], targetY[row + 1] - targetY[row], {fit:'fill'}).png().toBuffer();
      pieces.push({input, left:targetX[col], top:targetY[row]});
    }
  }
  await sharp({create:{width:1024,height:1536,channels:3,background:'#090b09'}}).composite(pieces).png().toFile(output);
}

if (require.main === module) {
  const [race, source, output] = process.argv.slice(2);
  if (!source || !output) throw Error('Usage: node scripts/fit-faction-frame.cjs <orc|undead> <approved-painting.png> <output.png>');
  fitFactionFrame(race, source, output).catch(error => {console.error(error);process.exitCode=1;});
}
module.exports = {fitFactionFrame};
