const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox','--disable-dev-shm-usage']});
 const report={checks:[],errors:[]};
 try{
 const context=await browser.newContext({viewport:{width:1920,height:1080}});await context.route('https://**/*',r=>r.abort());
 const page=await context.newPage();page.on('pageerror',e=>report.errors.push(e.message));
 await page.goto(process.env.ROADLORDS_TEST_URL||'http://127.0.0.1:4173/Roadlords/');await page.waitForFunction(()=>window.__ROADLORDS_RUNTIME__);
 report.checks=await page.evaluate(()=>{
 const R=__ROADLORDS_RUNTIME__,out=[],near=(a,b)=>Math.abs(a-b)<1e-6;
 const check=(name,ok,details)=>out.push({name,ok:!!ok,details});
 function reset(enemy='human'){
 R.MP.enabled=false;R.ROAD.test=false;R.state.running=false;R.state.modal=false;R.state.ended=false;R.state.time=100;R.ROAD.clock=100;
 R.roadResetCity(R.P,'undead');R.roadResetCity(R.E,enemy);R.state.units=[];R.ROAD.dead=[];R.ROAD.pending=[];
 for(const c of [R.P,R.E]){c.buildings=c.buildings.filter(b=>b.type==='keep');c.normal={};c.legends=new Set();c.l4Branches={};c.levels={};c.resources=R.C(100000,100000,100000);c.releaseQueue=[];c.undRevision=(c.undRevision||0)+1;}
 for(const t of R.towers)t.alive=false;R.roadReindex();R.roadRefreshFrontiers();return R.P;
 }
 function add(c,type,level=1,row=0,col=0){const b={id:'test-'+type+'-'+c.buildings.length,type,level,row,col,rotation:0,progress:0};c.buildings.push(b);c.undRevision++;return b;}
 function unit(c,key,lane=4800,offset=0){const u=R.releaseUnit(c,{key});u.lane=lane;u.roadPrev=lane;u.offset=offset;u.cooldown=999;u.stunTime=0;u.shield=u.tempShield=0;R.roadReindex();return u;}
 function hit(a,b){a.stunTime=0;R.roadRealAttack(a,b);}
 let c=reset();R.roadResetCity(c,'undead');check('Undead opening has 280 Souls and the well costs 220 for a full 2×2 plot',c.resources.wood===280&&R.buildPrice(c,'und_well').wood===220&&R.cityBuildingCells(c,{type:'und_well',row:0,col:0,rotation:0}).length===4);
 c=reset();const well=add(c,'und_well');check('New well has four times old production and upkeep',R.productionRates(c).wood===7&&R.undEconomy(c).upkeep.get(well.id)===2);
 c.legends.add('und_compact_wells');R.recomputeCity(c,true);check('Compact wells halve income/upkeep and footprint, preserving price',R.cityBuildingCells(c,well).length===1&&R.productionRates(c).wood===5&&R.undEconomy(c).upkeep.get(well.id)===1&&R.buildPrice(c,'und_well').wood===220);
 check('Compact footprint remains scoped to its own city',R.cityBuildingCells(R.E,{...well}).length===4);
 check('Compact well card copy matches actual production and upkeep while the base Lexicon stays unmodified',R.cardBuildingCopy.metrics('undead','und_well',1,c).description==='+2 Lélek/mp.'&&R.cardBuildingCopy.metrics('undead','und_well',1).description==='+4 Lélek/mp.');
 c=reset('undead');R.E.terrain.fill(null);R.E.legends.add('und_compact_wells');
 for(let row=0;row<R.GRID;row++)for(let col=0;col<R.GRID;col++)if(row||col)R.E.buildings.push({id:`filler-${row}-${col}`,type:'und_border_obelisk',row,col,rotation:0,level:1,inactive:true});
 check('Undead AI finds a compact enemy-city Well plot independently of the player legendary',R.findCell(R.E,'und_well')?.slice(0,2).join(',')==='0,0');R.E.legends.delete('und_compact_wells');c.legends.add('und_compact_wells');check('A player-only compact Well cannot make the AI select an illegal 1×1 plot',R.findCell(R.E,'und_well')===null);
 c=reset('undead');c.legends.add('vampire_leg_infection');R.E.legends=new Set(['und_rise_skeleton','und_rise_archer']);c.legends.add('und_raise_enemy');add(R.E,'und_rebirth_tomb',4);add(c,'und_garden_of_dead',4);
 let a=unit(c,'und_vampire',4500),b=unit(R.E,'und_zombie',4520);b.hp=1;const random=Math.random;Math.random=()=>0;hit(a,b);Math.random=random;
 let born=R.state.units.filter(u=>u.alive&&u!==a&&u.side==='player');check('Vampire infection creates exactly one 25%-HP Vampire and suppresses conflicting revivals',!b.alive&&born.length===1&&born[0].key==='und_vampire'&&near(born[0].hp,born[0].maxHp*.25)&&!R.E.undeadState.freeQueue.length&&R.E.releaseQueue.length===0,{born:born.map(u=>[u.key,u.hp,u.maxHp]),enemyQueued:R.E.releaseQueue.length});
 b=unit(R.E,'und_skeleton',4540);b.hp=1;hit(born[0],b);check('Infected offspring spread infection again',R.state.units.filter(u=>u.alive&&u.side==='player'&&u.key==='und_vampire').length===3);
 c=reset();c.legends.add('vampire_leg_infection');a=unit(c,'und_vampire');a.temporary=11;a.undNoArmySlot=true;b=unit(R.E,'swordsman',4820);b.hp=1;hit(a,b);born=R.state.units.find(u=>u.alive&&u!==a&&u.side==='player');check('Temporary infections cannot become permanent armies',born?.temporary===11&&born.undNoArmySlot);
 c=reset();a=unit(c,'und_vampire');b=unit(R.E,'swordsman',4820);const speed=R.effectiveMoveSpeed(a,c);c.legends.add('vampire_leg_night_predator');const hp=a.hp;hit(b,a);R.damageUnit(a,1e6,'magic');a.orcPoison=5;R.updateUnitStatuses(a,1);check('Night predator blocks attacks, direct damage and poison before attacking, and grants 20% speed',a.alive&&a.hp===hp&&near(R.effectiveMoveSpeed(a,c),speed*1.2));
 a.stunTime=2;R.roadRealAttack(a,b);check('A cancelled or stunned attack does not consume night protection',R.undNightProtected(a));a.stunTime=0;hit(a,b);R.damageUnit(a,10,'magic');check('An executed first attack ends protection permanently',a.undNightSpent&&!R.undNightProtected(a)&&a.hp<a.maxHp);
 c=reset();c.legends.add('vampire_leg_night_predator');a=unit(c,'und_vampire',9500);const capital=R.targetStructure('player');R.roadRealStructure(a,capital);check('Attacking a capital also consumes night protection',a.undNightSpent&&!R.undNightProtected(a));
 c=reset();c.legends.add('und_wandering_plague');a=unit(R.E,'swordsman',4800);b=unit(R.E,'spearman',4820);let far=unit(R.E,'priest',5000);a.orcPoison=17;a.orcPoisonClock=.3;a.hp=0;R.killUnit(a,true);check('Plague transfers every remaining stack to the nearest living enemy',b.orcPoison===17&&near(b.orcPoisonClock,.3)&&!far.orcPoison);
 b.hp=0;R.killUnit(b,true);check('Plague chains onward without creating extra stacks',far.orcPoison===17);let temp=unit(R.E,'swordsman',5001);temp.orcPoison=20;temp.hp=0;R.killUnit(temp,false);check('Summon expiry does not transfer poison',far.orcPoison===17);
 c=reset();c.legends.add('ghost_leg_shadow_leap');a=unit(c,'und_ghost',4800);b=unit(R.E,'swordsman',4820);b.roadFace=-1;Math.random=()=>0;hit(b,a);Math.random=random;const ready=a.undShadowReadyAt;R.updateBattle(0);check('A true Ghost dodge teleports behind the attacker and queues a real counterattack',ready===108&&a.lane>b.lane&&R.ROAD.pending.some(p=>p.u===a&&p.t===b),{ready,lane:a.lane,enemy:b.lane,pending:R.ROAD.pending.length});
 const pending=R.ROAD.pending.length;Math.random=()=>0;hit(b,a);Math.random=random;R.updateBattle(0);check('Shadow leap has an eight-second cooldown instead of triggering continuously',a.undShadowReadyAt===ready&&R.ROAD.pending.length===pending);
 const counter=R.ROAD.pending.find(p=>p.u===a),counterHp=b.hp;R.ROAD.clock=counter.a.hit+.001;R.roadImpacts();const afterCounter=b.hp;R.roadImpacts();check('The shadow counter resolves one real animated impact without duplicate damage',afterCounter<counterHp&&b.hp===afterCounter);
 c=reset();c.legends=new Set(['ghost_leg_shadow_leap','und_first_guard']);a=unit(c,'und_ghost');b=unit(R.E,'swordsman',4820);Math.random=()=>0;hit(b,a);Math.random=random;R.updateBattle(0);check('First-hit ward is not a Ghost dodge and does not trigger shadow leap',!a.undShadowReadyAt&&!R.ROAD.pending.length);
 c=reset();c.normal.und_territory=1;add(c,'und_border_obelisk');check('Territory combines 12m common plus 5m per building, then applies 5% amplification',near(R.undTerritoryAdvance(c),178.5));add(c,'und_border_obelisk');check('Multiple border stones stack both flat and percentage growth',near(R.undTerritoryAdvance(c),242));c.l4Branches.keep='dead_realm';check('Necropolis territorial branch doubles growth without losing new amplification',near(R.undTerritoryAdvance(c),484));
 c=reset();c.legends.add('und_grave_islands');add(c,'und_border_obelisk');a=unit(c,'und_zombie',5300);a.hp=0;R.killUnit(a,true);check('Territory amplification also scales grave-island radius',R.isOwnHalf({side:'player',lane:5383,offset:0})&&!R.isOwnHalf({side:'player',lane:5385,offset:0}));
 c=reset();check('Soul Rift is absent from definitions, choices and AI plans',!R.BUILDINGS.und_soul_rift&&!R.UNLOCKABLE.includes('und_soul_rift')&&!R.aiStrategyAnchors(c).some(p=>p.anchor.id==='und_soul_rift'));
 c=reset();let portal=add(c,'und_otherworld_portal');c.undPortalEnabled=true;R.recomputeCity(c,true);a=R.releaseUnit(c,{key:'und_skeleton'});check('Enabled portal relocates gate troops to own boundary',a.lane===R.territoryBoundary());a=R.undSpawn(c,'und_skeleton',1000,55);check('Field summons preserve their chosen point instead of using the portal',a.lane===1000&&a.offset===55);
 R.produceResources(c,30);check('Portal upkeep escalates after 30 cumulative active seconds',near(R.undEconomy(c).upkeep.get(portal.id),4));c.undPortalEnabled=false;R.produceResources(c,30);check('Disabled portal pauses its clock, costs nothing and restores gate release',c.undeadState.portalUptime===30&&R.undEconomy(c).upkeep.get(portal.id)===0&&R.releaseUnit(c,{key:'und_skeleton'}).lane<R.PATH_LENGTH/4);
 c.undPortalEnabled=true;check('Re-enabling does not reset escalating upkeep',R.undEconomy(c).upkeep.get(portal.id)===4);
 let tower=R.towers.find(t=>t.id==='e1');tower.alive=true;tower.hp=tower.maxHp;R.roadRefreshFrontiers();a=R.releaseUnit(c,{key:'und_skeleton'});check('The portal cannot bypass a live enemy road tower',a.lane<tower.lane);
 c=reset();portal=add(c,'und_otherworld_portal');c.undPortalEnabled=true;c.resources.wood=0;c.undeadState.portalUptime=900;R.produceResources(c,.1);check('Unfunded portal switches off automatically',!c.undPortalEnabled);
 c=reset();check('Soul Blade is retired from definitions, unlocks and the choice pool',!R.BUILDINGS.und_soul_blade&&!R.UNLOCKABLE.includes('und_soul_blade')&&!R.buildingUnlockPool(c).some(o=>o.id==='und_soul_blade'));
 for(const type of ['und_border_obelisk','und_otherworld_portal'])check(type+' has card art and a description',R.cardBuildingImageTag(type).includes('data-undead-building')&&!!R.BUILDINGS[type].description);
 check('All five legendary cards are registered once with their own art', ['vampire_leg_infection','ghost_leg_shadow_leap','vampire_leg_night_predator','und_wandering_plague','und_compact_wells'].every(id=>R.LEGENDARY.filter(o=>o.id===id).length===1));
 return out;
 });
 const packet=await page.evaluate(()=>{
 const R=__ROADLORDS_RUNTIME__;R.MP.enabled=false;R.roadResetCity(R.P,'undead');R.roadResetCity(R.E,'undead');R.state.units=[];R.state.running=false;R.state.time=100;
 for(const c of [R.P,R.E]){c.buildings=c.buildings.filter(b=>b.type==='keep');c.resources=R.C(10000,0,0);c.legends.add('und_compact_wells');c.unlocked.add('und_otherworld_portal');c.buildings.push({id:'portal-'+R.sideForCity(c),type:'und_otherworld_portal',level:1,row:0,col:3,rotation:0,progress:0});c.undPortalEnabled=true;c.undeadState.portalUptime=61;R.recomputeCity(c,true);}
 const u=R.undSpawn(R.P,'und_vampire',1000,25,{undSummoned:true,undNoArmySlot:true,undLifetime:15});u.undNightSpent=true;u.undShadowReadyAt=108;R.undConvergenceFx(R.P,'rift',1000,25);
 R.MP.enabled=true;R.MP.role='host';R.MP.peer=true;R.MP.started=true;const sent=[];R.MP.conn={open:true,dataChannel:{bufferedAmount:0},send:p=>sent.push(JSON.parse(JSON.stringify(p))),close:()=>{}};R.mpSendSnapshot(true);return sent.findLast(p=>p.type==='snapshot');
 });
 const guest=await context.newPage();guest.on('pageerror',e=>report.errors.push(e.message));await guest.goto(process.env.ROADLORDS_TEST_URL||'http://127.0.0.1:4173/Roadlords/');await guest.waitForFunction(()=>window.__ROADLORDS_RUNTIME__);
 const sync=await guest.evaluate(packet=>{const R=__ROADLORDS_RUNTIME__;R.MP.enabled=true;R.MP.role='guest';R.MP.started=true;R.MP.pendingStrategy=null;R.mpApplySnapshot(packet);const u=R.state.units.find(u=>u.key==='und_vampire');return {portal:R.P.undPortalEnabled,uptime:R.P.undeadState.portalUptime,unit:{side:u.side,lane:u.lane,offset:u.offset,night:u.undNightSpent,ready:u.undShadowReadyAt,temp:u.temporary},strategy:R.mpStrategy(R.P)};},packet);
 report.checks.push({name:'Real multiplayer snapshots mirror portals, temporary lifetimes and spent ability states',ok:sync.portal&&sync.uptime===61&&sync.unit.side==='enemy'&&sync.unit.lane===8600&&sync.unit.offset===-25&&sync.unit.night&&sync.unit.ready===108&&sync.unit.temp===15,details:sync.unit});
 const strategy=sync.strategy;strategy.undPortalEnabled=false;
 const hostSafe=await page.evaluate(data=>{const R=__ROADLORDS_RUNTIME__;R.mpApplyGuestStrategy(data,42);return !R.E.undPortalEnabled&&R.E.undeadState.portalUptime===61;},strategy);
 report.checks.push({name:'Guest can switch its portal but cannot reset host escalating upkeep',ok:hostSafe});
 await guest.close();
 for(const c of report.checks)console.log((c.ok?'PASS ':'FAIL ')+c.name+(c.ok?'':' '+JSON.stringify(c.details)));
 assert(report.checks.every(c=>c.ok),'Convergence integration assertions');assert.equal(report.errors.length,0,report.errors.join('\n'));
 }finally{fs.mkdirSync('artifacts',{recursive:true});fs.writeFileSync('artifacts/undead-convergence.json',JSON.stringify(report,null,2));await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
