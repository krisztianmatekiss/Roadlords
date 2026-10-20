const {spawn}=require('node:child_process');
const fs=require('node:fs');
const baseURL=process.env.ROADLORDS_TEST_URL||'http://127.0.0.1:4173/Roadlords/';
let server;
async function reachable(){try{const r=await fetch(baseURL);await r.body.cancel();return r.ok&&r.headers.get('X-Roadlords-Fixture')==='production-subpath';}catch{return false;}}
(async()=>{
 if(!fs.existsSync('dist/index.html'))throw Error('Run npm run build before testing the production site.');
 if(!await reachable()){
  server=spawn(process.execPath,['scripts/serve-dist.cjs'],{stdio:'ignore'});
  for(let i=0;i<30&&!await reachable();i++)await new Promise(r=>setTimeout(r,100));
  if(!await reachable())throw Error('Production test server did not start; port 4173 may already be occupied.');
 }
 const tests=process.argv.slice(2);if(!tests.length)tests.push('tests/refactor-parity.cjs','tests/browser.cjs','tests/multiplayer.cjs','tests/multiplayer-rtc.cjs');
 for(const file of tests){const code=await new Promise((resolve,reject)=>{const p=spawn(process.execPath,[file],{stdio:'inherit',env:{...process.env,ROADLORDS_TEST_URL:baseURL}});p.on('error',reject);p.on('exit',resolve);});if(code!==0){process.exitCode=code||1;break;}}
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(()=>server?.kill());
