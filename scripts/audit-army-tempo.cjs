const {chromium}=require('playwright'),fs=require('node:fs');
const URL=process.env.ROADLORDS_TEST_URL||'http://127.0.0.1:4173/Roadlords/';
(async()=>{const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox','--disable-dev-shm-usage']});
try{const page=await browser.newPage();await page.route('https://**/*',r=>r.abort());await page.goto(URL);await page.waitForFunction(()=>!!window.__ROADLORDS_RUNTIME__);
const report=await page.evaluate(()=>{
 const R=__ROADLORDS_RUNTIME__,Q=R.ROAD;R.state.running=false;R.state.pregame=false;Q.test=true;Q.paused=true;R.MP.enabled=false;
 const reset=race=>{R.state.units=[];Q.pending=[];Q.dead=[];Q.clock=0;R.state.time=0;for(const c of [R.P,R.E]){R.roadResetCity(c,race);c.normal={};c.legends=new Set();c.levels={};c.l4Branches={};}for(const t of R.towers)t.alive=false;R.roadRefreshFrontiers();};
 const profiles=[];for(const [key,d]of Object.entries(R.UNITS)){reset(d.race||'human');const type=key==='und_skeleton_archer'?'und_graveyard':Object.keys(R.BUILDINGS).find(t=>R.BUILDINGS[t].unit===key),s=R.statsFor(R.P,{key});profiles.push({key,name:d.name,race:d.race||'human',speed:s.speed/10,damage:s.dmg,cooldown:s.cooldown,range:s.range/10,cost:R.unitCost(R.P,key),training:[1,2,3].map(l=>R.previewTrainingTime(R.P,type,l)),cells:R.BUILDINGS[type].shape.length});}
 const cases=[['human','archer',20,'swordsman',31,'swordsman',8],['human','mage',6,'swordsman',32,'swordsman',8],['orc','orc_goblin',40,'orc_warrior',30,'orc_warrior',10],['orc','orc_goblin',40,'orc_warg',12,'orc_warrior',10],['undead','und_skeleton_archer',20,'und_skeleton',30,'und_skeleton',10],['undead','und_lich',3,'und_vampire',5,'und_skeleton',6]];
 const samples=[];for(const [race,key,n,other,m,guard,guards]of cases)for(const mirror of [false,true])for(const seed of [11,73]){
  reset(race);const random=Math.random;let rng=seed;Math.random=()=>((rng=(Math.imul(rng,1664525)+1013904223)>>>0)/4294967296);
  const left=mirror?R.E:R.P,right=mirror?R.P:R.E;if(key==='orc_goblin')left.legends.add('orc_gob_bow');
  try{for(const [c,k,count]of [[left,key,n],[left,guard,guards],[right,other,m]])for(let i=0;i<count;i++){const u=R.releaseUnit(c,{key:k}),dir=c===R.P?-1:1,front=k===guard||c===right;u.lane=4800+dir*((front?180:260)+Math.floor(i/8)*24);u.offset=u.roadHomeOffset=((i%8)-3.5)*28;u.cooldown=0;}
   let seconds=0;for(let i=0;i<1800;i++){R.updateBattle(.05);seconds+=.05;R.state.time=Q.clock;const a=R.state.units.some(u=>u.alive&&u.side===R.sideForCity(left)),b=R.state.units.some(u=>u.alive&&u.side===R.sideForCity(right));if((!a||!b)&&!Q.pending.some(p=>p.a.ranged&&p.t.alive))break;}
   samples.push({key,other,mirror,seed,seconds:+seconds.toFixed(2),ranged:R.state.units.filter(u=>u.alive&&u.side===R.sideForCity(left)).length,melee:R.state.units.filter(u=>u.alive&&u.side===R.sideForCity(right)).length});
  }finally{Math.random=random;}
 }
 return {version:__ROADLORDS_VERSION__,profiles,samples,limits:['Controlled unupgraded cohorts, except Goblin Bow; no economy, towers or reinforcement.','Prices are shown by resource; equal combined resource totals do not make different resource mixes economically equivalent.','Two seeds and mirrored sides are diagnostic samples, not faction win rates.']};
});fs.mkdirSync('artifacts',{recursive:true});const path=`artifacts/army-tempo-${process.env.TEMPO_LABEL||'current'}.json`;fs.writeFileSync(path,JSON.stringify(report,null,2));for(const key of [...new Set(report.samples.map(s=>s.key+':'+s.other))])console.log(key,report.samples.filter(s=>s.key+':'+s.other===key).map(s=>`${s.ranged}/${s.melee}`).join(' '));console.log('Saved',path);
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1});
