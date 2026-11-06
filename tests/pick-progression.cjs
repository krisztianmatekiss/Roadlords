const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox','--disable-dev-shm-usage']});const report={checks:[],errors:[]};
 const check=(name,ok)=>{assert(ok,name);report.checks.push(name);console.log('PASS',name);};
 try{
  const p=await browser.newPage();await p.route('https://**/*',r=>r.abort());p.on('pageerror',e=>report.errors.push(e.message));await p.goto(process.env.ROADLORDS_TEST_URL||'http://127.0.0.1:4173/Roadlords/');await p.waitForFunction(()=>window.__ROADLORDS_RUNTIME__);
  check('Four starter building offers and ancient rewards do not advance legendary drought',await p.evaluate(()=>{
   const R=__ROADLORDS_RUNTIME__,c=R.P;c.legendaryDrought=0;
   for(let n=0;n<4;n++)if(R.rollPickTier(c,'start').tier!=='rare')return false;
   return R.rollPickTier(c,'ancient').tier==='common'&&c.legendaryDrought===0;
  }));
  check('Exactly nineteen misses force the twentieth offer, including ordinary bonus offers',await p.evaluate(()=>{
   const R=__ROADLORDS_RUNTIME__,c=R.P,random=Math.random;c.legendaryDrought=0;Math.random=()=>.999;
   try{for(let n=1;n<=19;n++){if(R.rollPickTier(c,n%2?'timer':'tower').tier==='legendary'||c.legendaryDrought!==n)return false;}
    return R.rollPickTier(c,'timer').tier==='legendary'&&c.legendaryDrought===0;
   }finally{Math.random=random;}
  }));
  check('A random legendary offer resets drought, even if no card is taken',await p.evaluate(()=>{
   const R=__ROADLORDS_RUNTIME__,c=R.P,random=Math.random;c.legendaryDrought=14;Math.random=()=>0;
   try{return R.rollPickTier(c,'timer').tier==='legendary'&&c.legendaryDrought===0;}finally{Math.random=random;}
  }));
  const distribution=await p.evaluate(()=>{
   const R=__ROADLORDS_RUNTIME__,c=R.P,random=Math.random;let rng=417;Math.random=()=>((rng=(Math.imul(rng,1664525)+1013904223)>>>0)/4294967296);
   const run=(time,wide)=>{R.state.time=time;c.legends=new Set(wide?['wide_choice']:[]);const counts={rare:0,common:0,legendary:0};for(let n=0;n<12000;n++){c.legendaryDrought=0;counts[R.rollPickTier(c,'timer').tier]++;}return Object.fromEntries(Object.entries(counts).map(([k,v])=>[k,v/12000]));};
   try{return {early:run(479.999,false),late:run(480,false),wide:run(10,true)};}finally{Math.random=random;}
  });report.distribution=distribution;
  for(const [phase,wanted]of Object.entries({early:{rare:.5,common:.45,legendary:.05},late:{rare:.25,common:.7,legendary:.05},wide:{rare:.5,common:.4,legendary:.1}}))check(phase+': measured rarity distribution matches the configured probabilities',Object.keys(wanted).every(k=>Math.abs(distribution[phase][k]-wanted[k])<.015));
  check('No pick-progression browser errors',report.errors.length===0);
 }finally{fs.mkdirSync('artifacts',{recursive:true});fs.writeFileSync('artifacts/pick-progression.json',JSON.stringify(report,null,2));await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
