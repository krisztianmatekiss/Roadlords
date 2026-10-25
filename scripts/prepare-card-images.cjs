// Web delivery encoding only: lossless WebP, unchanged size, unchanged originals.
const fs=require('node:fs/promises'),path=require('node:path'),crypto=require('node:crypto'),sharp=require('sharp');
(async()=>{
 const atlas=JSON.parse(await fs.readFile('src/data/upgrade-art-manifest.json','utf8'));
 const files=new Set(Object.values(atlas.sources).map(s=>s.file).filter(s=>s.endsWith('.png')));
 async function collect(dir){for(const e of await fs.readdir('public/'+dir,{withFileTypes:true})){const p=dir+'/'+e.name;if(e.isDirectory())await collect(p);else if(p.endsWith('.png'))files.add(p)}}
 await collect('cards');await fs.mkdir('public/web-images',{recursive:true});const images={};let originalBytes=0,webBytes=0;
 for(const source of [...files].sort()){
  const bytes=await fs.readFile('public/'+source),sha=crypto.createHash('sha256').update(bytes).digest('hex'),file='web-images/'+sha.slice(0,20)+'.webp';
  try{await fs.access('public/'+file)}catch{await sharp(bytes).webp({lossless:true,effort:4}).toFile('public/'+file)}
  const web=await fs.readFile('public/'+file),meta=await sharp(web).metadata();
  if(web.length>=bytes.length)continue;
  images[source]={file,sourceSha256:sha,sha256:crypto.createHash('sha256').update(web).digest('hex'),width:meta.width,height:meta.height,originalBytes:bytes.length,webBytes:web.length};
  originalBytes+=bytes.length;webBytes+=web.length;
 }
 await fs.writeFile('src/data/web-card-images.json',JSON.stringify(images,null,2)+'\n');
 console.log(JSON.stringify({files:Object.keys(images).length,originalMB:(originalBytes/1e6).toFixed(2),webMB:(webBytes/1e6).toFixed(2),savedPercent:Math.round((1-webBytes/originalBytes)*100)}));
})().catch(e=>{console.error(e);process.exitCode=1});
