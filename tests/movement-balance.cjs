const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
const URL=process.env.ROADLORDS_TEST_URL||'http://127.0.0.1:4173/Roadlords/';
(async()=>{const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox','--disable-dev-shm-usage']});const report={checks:[],errors:[]},near=(a,b)=>Math.abs(a-b)<1e-7,check=(name,ok)=>{assert(ok,name);report.checks.push(name);console.log('PASS',name)};
try{
 const p=await browser.newPage();await p.route('https://**/*',r=>r.abort());p.on('pageerror',e=>report.errors.push(e.message));await p.goto(URL);await p.waitForFunction(()=>window.__ROADLORDS_RUNTIME__);
 report.profile=await p.evaluate(()=>{const R=__ROADLORDS_RUNTIME__;R.state.running=false;R.state.modal=false;R.state.pregame=false;R.ROAD.test=false;R.ROAD.paused=true;const profile=[];
  for(const [key,def]of Object.entries(R.UNITS))for(const side of ['player','enemy']){
   R.roadResetCity(R.P,def.race||'human');R.roadResetCity(R.E,def.race||'human');for(const c of [R.P,R.E]){c.normal={};c.legends=new Set();c.l4Branches={};c.levels={};}R.state.units=[];for(const t of R.towers)t.alive=false;R.roadRefreshFrontiers();
   const c=side==='player'?R.P:R.E,u=R.releaseUnit(c,R.makeEntry(c,key));u.lane=side==='player'?2000:7000;u.offset=0;u.roadHomeOffset=0;u.roadAttack=null;u.roadSeek=null;u.speedBuffTime=0;R.roadReindex();const start=u.lane,speed=R.effectiveMoveSpeed(u,c);R.roadAdvance(u,[],1);
   profile.push({key,name:def.name,side,base:def.speed,effective:speed,distance:Math.abs(u.lane-start)});
  }return profile;});
 check('All 21 unit types move their displayed base distance in a real one-second movement step, on both sides',report.profile.length===42&&report.profile.every(u=>near(u.base,u.effective)&&near(u.distance,u.base)));
 const base=Object.fromEntries(report.profile.map(u=>[u.key,u.base]));
 check('Cavalry retains its accepted speed while every non-cavalry unit receives 25%' ,base.knight===147&&base.orc_warg===136&&base.orc_goblin===70);
 const unchanged={swordsman:42,spearman:40,archer:42,priest:38,catapult:24,mage:36,orc_warrior:34,orc_berserker:42,orc_shaman:38,orc_ram:20,orc_troll:26,und_skeleton:42,und_skeleton_archer:40,und_zombie:26,und_ghost:46,und_necromancer:36,und_vampire:50,und_lich:32};
 check('The eighteen remaining units gain exactly 25% movement speed',Object.entries(unchanged).every(([k,v])=>near(base[k],v*1.25)));
 const result=await p.evaluate(()=>{const R=__ROADLORDS_RUNTIME__,out={};R.roadResetCity(R.P,'human');R.roadResetCity(R.E,'orc');R.state.units=[];for(const t of R.towers)t.alive=false;R.roadRefreshFrontiers();
  const unit=(c,key,lane)=>{const u=R.releaseUnit(c,R.makeEntry(c,key));u.lane=lane;u.offset=0;u.roadHomeOffset=0;return u;};
  const knight=unit(R.P,'knight',4000),block=unit(R.E,'orc_warrior',4200),far=unit(R.E,'orc_goblin',4700);knight.roadSeek=far;knight.roadSeekAt=R.ROAD.clock+10;R.roadReindex();R.roadAdvance(knight,[block,far],2);out.sweep=knight.lane<=block.lane-24.9&&knight.lane>4000;
  knight.slowTime=5;knight.slowMult=.5;out.slow=R.effectiveMoveSpeed(knight,R.P);knight.stunTime=1;out.stun=R.effectiveMoveSpeed(knight,R.P);knight.stunTime=knight.slowTime=0;
  R.P.normal.knight_move=2;R.refreshExistingUnitsForCity(R.P);out.upgraded=R.effectiveMoveSpeed(knight,R.P);out.preview=R.upgradeCopyPreview(R.P,{...R.NORMAL.find(o=>o.id==='knight_move'),kind:'normal'});
  R.MP.enabled=true;R.MP.role='host';R.MP.peer={};let packet;const send=R.mpSend;R.mpSend=data=>packet=data;R.mpSendSnapshot(true);R.mpSend=send;R.MP.role='guest';R.mpApplySnapshot(packet);const mirrored=R.state.units.find(u=>u.key==='knight');out.mirrored={side:mirrored.side,speed:R.effectiveMoveSpeed(mirrored,R.E)};R.MP.enabled=false;R.MP.role=null;return out;});report.combat=result;
 check('A fast cavalry step cannot tunnel through a non-target enemy body',result.sweep);
 check('Slows and stuns still affect cavalry and upgrades scale the new base',near(result.slow,73.5)&&result.stun===0&&near(result.upgraded,191.1));
 check('Movement previews use the new m/s values',result.preview.rows.some(r=>r.before==='19,11 m/s'&&r.after==='21,32 m/s'));
 check('Actual authoritative snapshots mirror cavalry at the same upgraded speed',result.mirrored.side==='enemy'&&near(result.mirrored.speed,191.1));
 check('No movement or multiplayer runtime errors',report.errors.length===0);
}finally{fs.mkdirSync('artifacts',{recursive:true});fs.writeFileSync('artifacts/movement-balance.json',JSON.stringify(report,null,2));await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
