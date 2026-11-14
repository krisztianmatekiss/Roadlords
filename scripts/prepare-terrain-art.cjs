// Normalize the six generated map objects into equally padded square tiles.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),sharp=require('sharp');
const root='public/art/terrain/chronicle',keys=['forest','quarry','fertile','foundation','ruin','ancient'];
(async()=>{
 const source=path.join(root,'source.png'),{data,info}=await sharp(source).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 const cellW=info.width/3,cellH=info.height/2,manifest={source:'art/terrain/chronicle/source.png',sha256:crypto.createHash('sha256').update(fs.readFileSync(source)).digest('hex'),icons:{}};
 for(const [i,key]of keys.entries()){
  const left=i%3*cellW,top=Math.floor(i/3)*cellH;let x0=cellW,y0=cellH,x1=0,y1=0;
  for(let y=0;y<cellH;y++)for(let x=0;x<cellW;x++)if(data[((top+y)*info.width+left+x)*4+3]>=128){x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y);}
  x0=Math.max(0,x0-4);y0=Math.max(0,y0-4);x1=Math.min(cellW-1,x1+4);y1=Math.min(cellH-1,y1+4);
  const crop={left:left+x0,top:top+y0,width:x1-x0+1,height:y1-y0+1},file=`art/terrain/chronicle/${key}.webp`;
  await sharp(source).extract(crop).resize(224,224,{fit:'contain',background:'#0000'}).extend({top:16,bottom:16,left:16,right:16,background:'#0000'}).webp({quality:92,alphaQuality:100}).toFile('public/'+file);
  manifest.icons[key]={file,crop,width:256,height:256,padding:16,sha256:crypto.createHash('sha256').update(fs.readFileSync('public/'+file)).digest('hex')};
 }
 fs.writeFileSync('src/data/terrain-art.json',JSON.stringify(manifest,null,2)+'\n');
})().catch(error=>{console.error(error);process.exitCode=1});
