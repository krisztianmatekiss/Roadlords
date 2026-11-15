// Preserve generated sheets and register independently drawn upright views.
const fs=require('node:fs/promises'),sharp=require('sharp'),crypto=require('node:crypto');
const human='src/data/human-map-art.json',orc='src/data/orc-map-art.json',undead='src/data/undead-map-art.json';
const entry=(type,rotation=0,race='orc')=>({type,rotation,race});
const pairs=types=>types.flatMap(type=>[entry(type),entry(type,1)]);
const sheets={
 'undead-core':{file:'art/undead/map-chronicle-core.png',cols:4,rows:3,entries:['keep','und_well','und_graveyard','und_ghost_spawner','und_necro_spawner','und_vampire_castle','und_lich_spawner','und_dark_tower','und_soul_bank','und_soul_anchor','und_rebirth_tomb','und_otherworld_portal'].map(type=>entry(type,0,'undead'))},
 'undead-directions':{file:'art/undead/map-chronicle-directions.png',cols:4,rows:3,entries:['und_crypt','und_morgue','und_bone_forge','und_plague_chamber'].flatMap(type=>[0,1].map(r=>entry(type,r,'undead'))).concat([0,1,2,3].map(r=>entry('und_garden_of_dead',r,'undead')))},
 'undead-border':{file:'art/undead/map-chronicle-border.png',cols:1,rows:1,entries:[entry('und_border_obelisk',0,'undead')]},
 'human-turns':{file:'art/human/map-chronicle-turns.png',cols:4,rows:3,entries:['siegeworks','armorsmith','mastersguild'].flatMap(type=>[0,1,2,3].map(r=>entry(type,r,'human')))},
 'orc-core':{file:'art/orc/map-chronicle-core.png',cols:4,rows:3,entries:['keep','orc_hunt','orc_hut','orc_gob','orc_arena','orc_troll','orc_totem','orc_slave','orc_raider','orc_tunnel'].map(type=>entry(type)).concat(pairs(['warehouse']))},
 'orc-training':{file:'art/orc/map-chronicle-training.png',cols:4,rows:3,entries:pairs(['orc_work','orc_war','orc_bers','orc_overseer','orc_warg','orc_shaman'])},
 'city-directions':{file:'art/chronicle/city-directions.png',cols:3,rows:2,entries:['warehouse','stable','temple','guildhouse'].map(type=>entry(type,1,'human')).concat(pairs(['orc_ram']))},
};
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
(async()=>{
 const [name,input]=process.argv.slice(2),cfg=sheets[name];if(!cfg||!input)throw Error('Usage: register-city-views.cjs '+Object.keys(sheets).join('|')+' generated.png');
 const file=cfg.file,webFile=file.replace(/\.png$/,'.webp');await fs.mkdir('public/'+file.slice(0,file.lastIndexOf('/')),{recursive:true});await fs.copyFile(input,'public/'+file);
 const bytes=await fs.readFile('public/'+file),{data,info}=await sharp(bytes).ensureAlpha().raw().toBuffer({resolveWithObject:true});let clear=0;
 for(let i=3;i<data.length;i+=4)clear+=data[i]===0;if(clear/(info.width*info.height)<.2)throw Error('Sheet has no clean transparent background');
 const cuts=(counts,n)=>{const out=[0];for(let i=1;i<n;i++){const target=counts.length*i/n,radius=counts.length/n*.35;let best=Math.round(target),score=Infinity;for(let p=Math.floor(target-radius);p<=Math.ceil(target+radius);p++){const v=counts[p]+Math.abs(p-target)/counts.length;if(v<score){score=v;best=p;}}out.push(best);}out.push(counts.length);return out;};
 const rowCounts=Array(info.height).fill(0);for(let y=0;y<info.height;y++)for(let x=0;x<info.width;x++)if(data[(y*info.width+x)*4+3]>32)rowCounts[y]++;
 const ys=cuts(rowCounts,cfg.rows),rowXs=Array.from({length:cfg.rows},(_,row)=>{const counts=Array(info.width).fill(0);for(let y=ys[row];y<ys[row+1];y++)for(let x=0;x<info.width;x++)if(data[(y*info.width+x)*4+3]>32)counts[x]++;return cuts(counts,cfg.cols);});
 await sharp(bytes).webp({lossless:true,effort:4}).toFile('public/'+webFile);const web=await fs.readFile('public/'+webFile),source={file,webFile,width:info.width,height:info.height,sha256:hash(bytes),webSha256:hash(web),originalBytes:bytes.length,webBytes:web.length};
 const manifests={};
 for(const [i,item]of cfg.entries.entries()){
  const path={human,orc,undead}[item.race];if(!manifests[path]){try{manifests[path]=JSON.parse(await fs.readFile(path,'utf8'));}catch{manifests[path]={version:1,sources:{},sprites:{}};}}
  const m=manifests[path];m.sources[name]=source;
  const row=Math.floor(i/cfg.cols),col=i%cfg.cols,xs=rowXs[row];let x0=info.width,y0=info.height,x1=0,y1=0;
  for(let y=ys[row];y<ys[row+1];y++)for(let x=xs[col];x<xs[col+1];x++)if(data[(y*info.width+x)*4+3]>32){x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x+1);y1=Math.max(y1,y+1);}
  if(x1-x0<25||y1-y0<25)throw Error('Empty sprite '+item.type+':'+item.rotation);
  x0=Math.max(xs[col],x0-5);y0=Math.max(ys[row],y0-5);x1=Math.min(xs[col+1],x1+5);y1=Math.min(ys[row+1],y1+5);
  const view={source:name,rect:[x0,y0,x1-x0,y1-y0]},art=m.sprites[item.type]||{};
  m.sprites[item.type]={...art,...(item.rotation===0?view:{}),style:'chronicle',views:{...art.views,[item.rotation]:view}};
 }
 for(const [path,m]of Object.entries(manifests))await fs.writeFile(path,JSON.stringify(m,null,2)+'\n');console.log(JSON.stringify({name,views:cfg.entries.length,webBytes:web.length,rowXs,ys}));
})().catch(error=>{console.error(error);process.exitCode=1;});
