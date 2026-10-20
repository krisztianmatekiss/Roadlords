// Production fixture server. It mounts exactly the subpath used by repository Pages sites.
const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const base=path.resolve('dist'),port=Number(process.env.ROADLORDS_TEST_PORT||4173),prefix='/Roadlords/';
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml','.jpg':'image/jpeg','.map':'application/json','.txt':'text/plain; charset=utf-8'};
http.createServer((req,res)=>{
 let route;try{route=decodeURIComponent(new URL(req.url,'http://local.test').pathname)}catch{res.writeHead(400).end();return;}
 if(route==='/Roadlords'){res.writeHead(301,{Location:prefix}).end();return;}
 if(!route.startsWith(prefix)){res.writeHead(404).end();return;}
 const file=path.resolve(base,route.slice(prefix.length)||'index.html');
 if(file!==base&&!file.startsWith(base+path.sep)){res.writeHead(403).end();return;}
 fs.stat(file,(error,stat)=>{if(error||!stat.isFile()){res.writeHead(404).end();return;}
   res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream','Content-Length':stat.size,'X-Roadlords-Fixture':'production-subpath'});
   if(req.method==='HEAD'){res.end();return;}fs.createReadStream(file).pipe(res);
 });
}).listen(port,'127.0.0.1',()=>console.log('Production Pages-path fixture ready.'));
