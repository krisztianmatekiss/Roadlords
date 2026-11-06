// Actual recruitment, projectiles, casualties, towers and capital damage.
// The opponent uses a fixed, paid construction policy, not an oracle or free
// army. This is a repeatable regression benchmark, not a human win-rate claim.
const {chromium}=require('playwright'),fs=require('node:fs'),http=require('node:http'),path=require('node:path');
const URL=process.env.ROADLORDS_TEST_URL||'http://127.0.0.1:4173/Roadlords/';
const before=process.env.ROADLORDS_BASELINE_DIST;
let baselineServer;
(async()=>{
 if(before){baselineServer=http.createServer((req,res)=>{
  const file=path.resolve(before,decodeURIComponent(new global.URL(req.url,'http://test').pathname).replace(/^\/Roadlords\//,'')||'index.html');
  if(!file.startsWith(path.resolve(before)+path.sep)){res.writeHead(404).end();return;}
  fs.readFile(file.endsWith(path.sep)?file+'index.html':file,(e,data)=>{if(e){res.writeHead(404).end();return;}
   res.setHeader('Content-Type',file.endsWith('.js')?'application/javascript':file.endsWith('.css')?'text/css':file.endsWith('.html')?'text/html':'application/octet-stream');res.end(data);});
 }).listen(4174,'127.0.0.1');await new Promise(r=>baselineServer.once('listening',r));}
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox','--disable-dev-shm-usage']});
 const report={scope:'Ten-minute real combat against a fixed paid opponent; AI/pick patch comparison, not human win rate.',cases:[],errors:[]};
 try{
  const versions=before?[['before','http://127.0.0.1:4174/Roadlords/'],['after',URL]]:[['after',URL]];
  for(const [version,url]of versions)for(const race of ['human','orc','undead'])for(const seed of [42,137]){
   const p=await browser.newPage();await p.route('https://**/*',r=>r.abort());p.on('pageerror',e=>report.errors.push(e.message));await p.goto(url);await p.waitForFunction(()=>window.__ROADLORDS_RUNTIME__);
   const result=await p.evaluate(({race,seed})=>{
    const R=__ROADLORDS_RUNTIME__,random=Math.random;let rng=seed;
    Math.random=()=>((rng=(Math.imul(rng,1664525)+1013904223)>>>0)/4294967296);
    R.MP.enabled=false;R.ROAD.test=false;R.ROAD.paused=false;R.state.running=true;R.state.modal=false;R.state.pregame=false;R.state.ended=false;R.state.startChoices=0;R.state.time=0;R.state.units=[];R.state.pendingChoices=[];R.ROAD.pending=[];R.ROAD.dead=[];R.ROAD.clock=0;R.aiDecisionCache=null;
    R.roadResetCity(R.P,'human');R.roadResetCity(R.E,race);R.generateTerrain(R.P,12);R.generateTerrain(R.E,12);R.recomputeCity(R.P,false);R.recomputeCity(R.E,false);
    for(const t of R.towers){t.alive=true;t.hp=t.maxHp;t.sdActive=false;}
    const player=R.P,enemy=R.E,rows=[],planning=[],towerEvents=[],choiceTimes=[];
    const autoPlayerPick=source=>{
     const roll=R.rollPickTier(player,source),opts=R.makeChoiceOptions(player,source,roll.tier,roll.subtype);
     const rank=o=>o.kind==='building'?['archery','stable','armorsmith','magetower','house','market'].includes(o.id)?20:5:
      o.kind==='building_upgrade'||o.kind==='building_branch'?R.buildingOf(player,o.id).length*10+(['lumber','stonecutter','farm','keep'].includes(o.id)?20:0):
      ['production','frugal_training','spawn_speed','all_damage','archer_dmg','knight_dmg'].includes(o.id)?30:10;
     opts.sort((a,b)=>rank(b)-rank(a));if(opts[0])R.applyChoice(player,opts[0]);
    };
    const queue=R.queueChoice;R.queueChoice=autoPlayerPick;
    for(let n=0;n<4;n++){autoPlayerPick('start');R.grantEnemyPick('start');}
    const construct=type=>{if(!player.unlocked.has(type)||R.isUniqueBuilding(player,type)&&R.hasBuilding(player,type))return false;const cell=R.findCell(player,type);return !!cell&&R.canPay(player,R.placementPrice(player,type,...cell))&&!!R.placeBuilding(player,type,...cell)?.ok;};
    const opponent=()=>{
     const flow=R.resourceFlowRates(player),sp=R.activeSpawners(player).length;
     const targets={wood:4+sp*.6,stone:2+sp*.4,food:1+sp*.8},sources={wood:'lumber',stone:'stonecutter',food:'farm'};
     const needs=R.RES.map(r=>({r,gap:Math.max(targets[r],flow.use[r]*1.2+.4)-flow.gain[r]})).sort((a,b)=>b.gap-a.gap);
     for(const n of needs)if(n.gap>.3&&construct(sources[n.r]))return;
     const committed=R.fieldUnitCount(player)+R.reserveCount(player);
     if(committed>player.armyCap*.7&&construct('house'))return;
     if(R.RES.some(r=>player.resources[r]>player.caps[r]*.85)&&R.buildingOf(player,'warehouse').length<4&&construct('warehouse'))return;
     if(sp<Math.min(14,1+Math.floor(R.state.time/50)))for(const type of ['archery','stable','barracks','magetower'].sort((a,b)=>R.buildingOf(player,a).length-R.buildingOf(player,b).length))if(construct(type))return;
     if(sp>=4&&!R.hasBuilding(player,'armorsmith'))construct('armorsmith');
    };
    let picks=0,untilPick=R.PICK_BASE_SECONDS,lastSecond=-1;
    try{
     for(let step=1;step<=6000&&!R.state.ended;step++){
      const dt=.1,t=step*dt;R.state.time=t;untilPick-=dt;
      if(untilPick<=0){choiceTimes.push(t);autoPlayerPick('timer');R.grantEnemyPick('timer');picks++;untilPick+=R.PICK_BASE_SECONDS*Math.pow(R.PICK_GROWTH,picks);}
      R.produceResources(player,dt);R.produceResources(enemy,dt);R.updateSpawners(player,dt);R.updateSpawners(enemy,dt);
      if(Math.floor(t)!==lastSecond){lastSecond=Math.floor(t);opponent();if(R.reserveCount(player)>=10){R.releaseRally(player);R.openWave(player);player.gateMode='open';}}
      const start=performance.now();R.enemyBuildAI(dt);const elapsed=performance.now()-start;if(elapsed>.15)planning.push(elapsed);
      R.enemyGateAI();R.releaseQueues(dt);R.garrisonFire(dt);R.updateBattle(dt);R.updateSuddenDeath(dt);
      for(const tower of R.towers)if(!tower.alive&&!towerEvents.some(e=>e.id===tower.id))towerEvents.push({id:tower.id,side:tower.side,time:t});
      if(step%600===0)rows.push({t,ownHp:enemy.hp,opponentHp:player.hp,army:R.fieldUnitCount(enemy),opponentArmy:R.fieldUnitCount(player),military:R.activeSpawners(enemy).length});
     }
    }finally{Math.random=random;R.queueChoice=queue;R.state.running=false;}
    planning.sort((a,b)=>a-b);
    return {race,seed,time:R.state.time,result:enemy.hp<=0?'loss':player.hp<=0?'win':'unfinished',hp:{ai:enemy.hp/enemy.maxHp,opponent:player.hp/player.maxHp},towerEvents,
     military:R.activeSpawners(enemy).length,buildings:enemy.buildings.length,legends:[...enemy.legends],rows,
     planningMs:{p50:planning[Math.floor(planning.length*.5)]||0,p95:planning[Math.floor(planning.length*.95)]||0,max:planning.at(-1)||0},runtimeError:R.state.lastRuntimeErrorV4965||null};
   },{race,seed});
   report.cases.push({version,...result});console.log(JSON.stringify({version,race,seed,result:result.result,time:result.time,hp:result.hp,towers:result.towerEvents.length,planning:result.planningMs}));
   fs.mkdirSync('artifacts',{recursive:true});fs.writeFileSync('artifacts/ai-battle-audit.json',JSON.stringify(report,null,2));await p.close();
  }
  if(report.errors.length||report.cases.some(c=>c.runtimeError))throw Error('AI combat audit encountered a runtime error');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(()=>baselineServer?.close());
