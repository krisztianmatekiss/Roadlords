const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
const URL=process.env.ROADLORDS_TEST_URL||'http://127.0.0.1:4173/Roadlords/';
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox','--disable-dev-shm-usage']});
 const report={checks:[],errors:[]},check=(name,ok)=>{assert(ok,name);report.checks.push(name);console.log('PASS',name)};fs.mkdirSync('artifacts',{recursive:true});
 try{
  const context=await browser.newContext({viewport:{width:1600,height:1000}});await context.route('https://**/*',r=>r.abort());const page=await context.newPage();page.on('pageerror',e=>report.errors.push(e.message));await page.goto(URL);await page.waitForFunction(()=>!!window.__ROADLORDS_RUNTIME__);
  check('Main menu keeps the battle atlases lazy',await page.evaluate(()=>!performance.getEntriesByType('resource').some(r=>r.name.includes('heroes-parts'))));
  await page.locator('.menuBrand').click();await page.waitForTimeout(900);await page.locator('#mpSolo').click();await page.locator('#soloRace').selectOption('human');await page.locator('#aiRace').selectOption('orc');await page.locator('#raceContinue').click();await page.waitForFunction(()=>__ROADLORDS_RUNTIME__.state.pregame);
  check('Real solo setup decodes both faction models before showing the battlefield',await page.evaluate(()=>{const R=__ROADLORDS_RUNTIME__;return !R.ROAD.test&&R.humanInfantryTexture?.naturalWidth>0&&R.orcWarriorTexture?.naturalWidth>0&&R.humanCastersTexture?.naturalWidth>0&&R.orcSiegeTexture?.naturalWidth>0&&!R.undeadCastersTexture}));
  await page.locator('#pregameReady').click();await page.waitForFunction(()=>!!__ROADLORDS_RUNTIME__.state.choiceContext);await page.evaluate(()=>{__ROADLORDS_RUNTIME__.state.running=false});
  await page.evaluate(()=>__ROADLORDS_RUNTIME__.loadProductionBattleArt(['undead']));
  const models=await page.evaluate(()=>{const R=__ROADLORDS_RUNTIME__,Q=R.ROAD;R.state.running=false;R.state.modal=false;R.state.pregame=false;Q.test=false;Q.clock=10;const out={};for(const race of ['human','orc','undead']){R.roadResetCity(R.P,race);for(const key of Object.keys(R.UNITS).filter(k=>R.factionUnitMatches(race,R.UNITS[k]))){Q.sprites.clear();const u=R.releaseUnit(R.P,{key});u.lane=Q.camera+350;u.offset=0;u.roadMoving=false;R.roadDrawUnit(u);const sprite=[...Q.sprites.values()].at(-1);out[key]={painted:sprite?.figureRig?.painted,style:sprite?.figureRig?.style,range:u.range};}}R.state.units=[];return out;});report.models=models;
  check('All 21 units use painted models in a normal game, outside diagnostics',Object.keys(models).length===21&&Object.values(models).every(m=>m.painted));
  const ranges={archer:300,priest:240,catapult:800,mage:300,orc_goblin:230,orc_shaman:300,und_skeleton_archer:260,und_necromancer:240,und_lich:280};
  check('All nine ranged base ranges are doubled',Object.entries(ranges).every(([key,n])=>models[key].range===n));
  check('Melee ranges stay suited to their original weapons',models.swordsman.range===30&&models.spearman.range===45&&models.knight.range===32&&models.orc_troll.range===30&&models.und_ghost.range===30);
  const combat=await page.evaluate(keys=>{
   const R=__ROADLORDS_RUNTIME__,Q=R.ROAD,reset=(race='human')=>{R.roadResetCity(R.P,race);R.roadResetCity(R.E,'human');R.P.normal={};R.P.legends=new Set();R.P.levels={};R.P.l4Branches={};R.state.units=[];R.battleSearch=null;R.state.running=false;R.state.modal=false;R.state.pregame=false;Q.pending=[];Q.dead=[];Q.clock=20;R.state.combatStep=(R.state.combatStep||0)+1;},out=[];
   for(const key of keys){reset(R.UNITS[key].race||'human');const u=R.releaseUnit(R.P,{key}),v=R.releaseUnit(R.E,{key:'swordsman'});u.lane=4500;u.offset=0;u.cooldown=0;v.lane=4500+u.range*.9;v.offset=0;v.hp=v.maxHp=10000;v.shield=v.tempShield=0;R.roadReindex();const selected=R.preferredTarget(u,[v])===v;
    for(let i=0;i<90;i++){R.roadAdvance(u,[v],1/30);R.roadReindex();}const separation=R.roadDistance(u,v),r=u.range;R.state.combatStep++;R.attackUnit(u,v);const a=u.roadAttack;if(!a)throw Error('No attack for '+key);Q.clock=a.hit-.001;R.roadImpacts();const early=v.hp===10000;Q.clock=a.hit+.001;R.roadImpacts();if(key==='und_lich')R.updateBattle(.1);const hp=v.hp;R.roadImpacts();out.push({key,selected,separation,range:r,early,damage:10000-hp,once:v.hp===hp});
   }
   reset();const priest=R.releaseUnit(R.P,{key:'priest'}),ally=R.releaseUnit(R.P,{key:'swordsman'});priest.lane=4500;ally.lane=4720;priest.offset=ally.offset=0;ally.hp=10;R.roadReindex();const healed=R.priestAction(priest,[priest,ally])&&ally.hp>10&&priest.roadHeal&&priest.healRange===300;
   reset('orc');const warg=R.releaseUnit(R.P,{key:'orc_warg'}),v=R.releaseUnit(R.E,{key:'swordsman'});warg.lane=4500;warg.offset=0;warg.cooldown=0;v.lane=4700;v.offset=0;v.hp=v.maxHp=10000;v.shield=v.tempShield=0;R.roadReindex();R.orcBeforeCombat13(warg,[v],0);const a=warg.roadAttack;let thrown=false;if(a){Q.clock=a.hit+.001;R.roadImpacts();thrown=a.orcSpear&&a.ranged&&v.hp===9940&&!warg.orcSpearReady;}
   reset();R.P.levels.spearhall=4;R.P.l4Branches.spearhall='spear_rain';const spear=R.releaseUnit(R.P,{key:'spearman'}),target=R.releaseUnit(R.E,{key:'swordsman'});spear.lane=4500;spear.offset=0;target.lane=4840;target.offset=0;R.roadReindex();const volley=spear.spearVolleyReady&&R.preferredTarget(spear,[target])===target;
   reset();R.P.levels.archery=4;R.P.l4Branches.archery='longbowmen';const longbow=R.statsFor(R.P,{key:'archer'}).range;return {attacks:out,healed:!!healed,thrown,volley,longbow};
  },Object.keys(ranges));report.combat=combat;
  check('All ranged types acquire and hit targets beyond their old range',combat.attacks.every(a=>a.selected&&a.early&&a.damage>0&&a.once&&a.separation>a.range*.5));
  check('Ranged steering holds a visibly longer firing distance',combat.attacks.every(a=>a.separation>=a.range*.85));
  check('Priest healing reaches the front at 30 metres with its normal healing animation',combat.healed);
  check('Warg throws at 20 metres and the upgraded Spearman acquires at 34 metres',combat.thrown&&combat.volley);
  check('Longbow additive range scales consistently to 45 metres',combat.longbow===450);
  const guest=await context.newPage();guest.on('pageerror',e=>report.errors.push(e.message));await guest.goto(URL);await guest.waitForFunction(()=>!!window.__ROADLORDS_RUNTIME__);
  await page.evaluate(()=>{const R=__ROADLORDS_RUNTIME__;R.roadStartTest(42,{count:100,roster:'undead-orcs'});R.roadPause();R.ROAD.test=false;R.MP.enabled=true;R.MP.role='host';R.MP.peer=true;R.MP.started=true;window.packets=[];R.MP.conn={open:true,dataChannel:{bufferedAmount:0},send:data=>packets.push(JSON.parse(JSON.stringify(data)))};R.mpSendSnapshot(true)});
  const packet=await page.evaluate(()=>packets.findLast(p=>p.type==='snapshot'));
  await guest.evaluate(async packet=>{const R=__ROADLORDS_RUNTIME__;await R.loadProductionBattleArt(['undead','orc']);R.ROAD.test=false;R.MP.enabled=true;R.MP.role='guest';R.MP.started=true;R.MP.pendingStrategy=null;R.mpHandle(packet)},packet);
  const guestState=await guest.evaluate(()=>{const R=__ROADLORDS_RUNTIME__,Q=R.ROAD;const types=R.state.units.filter((u,i,a)=>a.findIndex(v=>v.key===u.key)===i);return {count:R.state.units.length,models:types.map(u=>{Q.sprites.clear();const actor={...u,lane:Q.camera+350,offset:0,roadMoving:false,roadAttack:null,undBeams:[]};R.roadDrawUnit(actor);return {key:u.key,painted:[...Q.sprites.values()].at(-1)?.figureRig?.painted,range:R.statsFor(R.cityForSide(u.side),{key:u.key}).range,base:R.UNITS[u.key].range}})}});report.guest=guestState;
  check('Multiplayer guest retains the doubled ranges and new models after real snapshot mirroring',guestState.count===200&&guestState.models.length===14&&guestState.models.every(m=>m.painted&&m.range===m.base));
  await page.evaluate(()=>{
   const R=__ROADLORDS_RUNTIME__;R.MP.conn=null;R.MP.peer=null;R.roadStartTest(42,{count:100,roster:'orcs-humans'});R.roadPause();R.ROAD.test=false;R.ROAD.clock=R.state.time=10;
   const priest=R.state.units.find(u=>u.key==='priest'),ally=R.state.units.find(u=>u.side===priest.side&&u.key==='swordsman');priest.lane=4500;priest.offset=0;ally.lane=4700;ally.offset=0;ally.hp=10;R.roadReindex();R.priestAction(priest,[priest,ally]);
   R.MP.enabled=true;R.MP.role='host';R.MP.peer=true;R.MP.started=true;window.packets=[];R.MP.conn={open:true,dataChannel:{bufferedAmount:0},send:data=>packets.push(JSON.parse(JSON.stringify(data)))};R.mpSendSnapshot(true);
  });
  const healPacket=await page.evaluate(()=>packets.findLast(p=>p.type==='snapshot'));
  await guest.evaluate(async packet=>{const R=__ROADLORDS_RUNTIME__;await R.loadProductionBattleArt(['human']);R.MP.pendingStrategy=null;R.mpHandle(packet);R.ROAD.clock=R.state.time;R.mpHandle(packet)},healPacket);
  check('Real healing pose and its target effect survive mirroring without duplicate particles',await guest.evaluate(()=>{const R=__ROADLORDS_RUNTIME__,u=R.state.units.find(u=>u.key==='priest'&&u.roadHeal);return !!u&&R.battleFigurePose(u,R.ROAD.clock).healFrame===0&&R.casterHeals.length===1&&R.casterHeals[0].target.id===u.roadHeal.targetId}));
  check('Guest reconstructs a resolved Troll ground impact once',await guest.evaluate(()=>{const R=__ROADLORDS_RUNTIME__,Q=R.ROAD,u=R.state.units.find(u=>u.key==='orc_troll');u.lane=Q.camera+350;u.offset=0;u.roadAttack={start:Q.clock-.4,hit:Q.clock-.01,launch:Q.clock-.1,end:Q.clock+.2,lane:u.lane,offset:0,to:u.lane+25,toOffset:0,ranged:false,resolved:true,radius:55};R.roadEffects.impacts=[];R.roadEffects.seen.clear();R.roadDrawEffects();R.roadDrawEffects();return R.roadEffects.impacts.filter(f=>f.kind==='slam').length===1}));
  const visual=await page.evaluate(()=>{const R=__ROADLORDS_RUNTIME__;return R.mpFactionUnitPayload({key:'und_necromancer',roadUndSummon:{start:R.ROAD.clock,end:R.ROAD.clock+.75}})});
  check('Active summoning poses share the existing optional multiplayer metadata',!!visual.roadUndSummon&&visual.roadUndSummon.end>visual.roadUndSummon.start);
  const version=await guest.evaluate(()=>{const R=__ROADLORDS_RUNTIME__,sent=[];let closed=false;R.MP.conn={open:true,send:data=>sent.push(data),close:()=>closed=true};R.mpSend({type:'hello'});R.mpHandle({type:'hello',pathLength:R.PATH_LENGTH,gameRules:2,factionProtocol:2,race:'orc'});return {rules:sent[0].gameRules,closed}});
  check('Multiplayer prevents mixing the old and new range rules',version.rules===4&&version.closed);
  check('No runtime errors in production rendering or combat',report.errors.length===0);
 }finally{fs.writeFileSync('artifacts/production-figures-and-range.json',JSON.stringify(report,null,2));await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
