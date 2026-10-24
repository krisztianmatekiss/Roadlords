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
 const tests=process.argv.slice(2);if(!tests.length)tests.push('tests/catapult-figure.cjs','tests/knight-figure.cjs','tests/orc-warrior-figure.cjs','tests/skeleton-figure.cjs','tests/orc-expansion-and-traits.cjs','tests/road-measurements.cjs','tests/undead-art-and-copy.cjs','tests/card-identity.cjs','tests/game-usability.cjs','tests/build-card-deck.cjs','tests/troll-capacity.cjs','tests/card-copy-clarity.cjs','tests/cards-and-effects.cjs','tests/unit-balance.cjs','tests/interface-layout.cjs','tests/undead-faction.cjs','tests/undead-interface.cjs','tests/undead-multiplayer.cjs','tests/resource-budget.cjs','tests/balance-changes.cjs','tests/ai-city-planning.cjs','tests/upgrade-copy.cjs','tests/minimap-and-footprints.cjs','tests/city-layout.cjs','tests/gate-and-scale.cjs','tests/road-navigation.cjs','tests/passage-and-art.cjs','tests/refactor-parity.cjs','tests/battle-flow.cjs','tests/browser.cjs','tests/multiplayer.cjs','tests/multiplayer-rtc.cjs');
 for(const file of tests){
  let tail='';
  const code=await new Promise((resolve,reject)=>{
   const p=spawn(process.execPath,[file],{stdio:['inherit','pipe','pipe'],env:{...process.env,ROADLORDS_TEST_URL:baseURL}});
   for(const [stream,destination] of [[p.stdout,process.stdout],[p.stderr,process.stderr]])stream.on('data',chunk=>{destination.write(chunk);tail=(tail+chunk.toString()).slice(-6000);});
   p.on('error',reject);p.on('close',resolve);
  });
  if(code!==0){
   if(process.env.GITHUB_ACTIONS){const escape=s=>s.replaceAll('%','%25').replaceAll('\r','%0D').replaceAll('\n','%0A');console.error(`::error title=Roadlords test failure::${escape(file+' exited '+code+'\n'+tail)}`);}
   process.exitCode=code||1;break;
  }
 }
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(()=>server?.kill());
