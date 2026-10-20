(async()=>{
 const response=await fetch('http://127.0.0.1:8000/',{signal:AbortSignal.timeout(2000)});
 if(!response.ok)throw Error('HTTP readiness failed');
 const html=await response.text();
 const modulePath=html.match(/<script[^>]*type="module"[^>]*src="([^"]+)"/);
 if(!html.includes('Roadlords')||!modulePath||!modulePath[1].includes('assets/'))throw Error('Production entry missing');
 const bundle=await fetch(new URL(modulePath[1],'http://127.0.0.1:8000/'),{signal:AbortSignal.timeout(2000)});
 if(!bundle.ok||!String(bundle.headers.get('content-type')).includes('javascript'))throw Error('Production bundle unavailable');
 await bundle.body.cancel();
})().catch(()=>{process.exitCode=1;});
