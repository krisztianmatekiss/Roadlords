const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox','--disable-dev-shm-usage']});
 const report={checks:[],errors:[]};
 try{
  const p=await browser.newPage({viewport:{width:1600,height:1000}});await p.route('https://**/*',r=>r.abort());p.on('pageerror',e=>report.errors.push(e.message));
  await p.goto(process.env.ROADLORDS_TEST_URL||'http://127.0.0.1:4173/Roadlords/');await p.waitForFunction(()=>window.__ROADLORDS_RUNTIME__?.undUpdateDarkTowers);
  report.checks=await p.evaluate(()=>{
   const R=__ROADLORDS_RUNTIME__,O=__ROADLORDS_ORCS__,checks=[],near=(a,b)=>Math.abs(a-b)<1e-7;
   const check=(name,ok,details)=>checks.push({name,ok:!!ok,details});
   function reset(race='human'){
    R.MP.enabled=false;R.ROAD.test=false;R.state.running=false;R.state.time=0;R.state.units=[];R.state.ended=R.state.pregame=R.state.modal=false;R.state.startChoices=0;R.state.combatStep++;R.battleSearch=null;
    R.ROAD.clock=20;R.ROAD.pending=[];R.ROAD.dead=[];R.spectator.active=false;
    R.roadResetCity(R.P,race);R.roadResetCity(R.E,'human');
    for(const c of [R.P,R.E]){c.terrain.fill(null);c.unlocked=new Set(R.aiFactionBuildings(c));c.resources=R.C(1e6,1e6,1e6);c.armyCap=c.garrisonCap=1000;}
    for(const t of [...R.towers,...R.capitalTowers])t.alive=false;R.roadRefreshFrontiers();return R.P;
   }
   function unit(c,key,lane=350,offset=0,extra={}){const u=R.releaseUnit(c,R.makeEntry(c,key,extra));if(!u)throw Error('Cannot create '+key);u.lane=lane;u.offset=offset;u.cooldown=99;R.roadReindex();return u;}
   function put(c,type,level=1,row=0,col=0){const b=R.placeBuilding(c,type,row,col,0);if(!b.ok)throw Error(type+': '+b.reason);R.setBuildingLevel(c,type,level);return b.building;}
   function hit(u,t){R.attackUnit(u,t);const pending=R.ROAD.pending.filter(x=>x.u===u);R.ROAD.clock=Math.max(...pending.map(x=>x.a.hit))+.001;R.roadImpacts();}
   const random=Math.random;
   try{
    Math.random=()=>.99;
    let c=reset('undead');
    check('Approved HP values are the actual unupgraded faction stats',R.statsFor(c,{key:'und_necromancer'}).hp===280&&R.statsFor(c,{key:'und_lich'}).hp===380&&R.statsFor(c,{key:'und_ghost'}).hp===70);
    c=reset('orc');check('Orc and Human damage and HP changes reach the real stat chain',R.statsFor(c,{key:'orc_berserker'}).hp===220&&R.statsFor(c,{key:'orc_shaman'}).hp===170&&R.statsFor(c,{key:'orc_goblin'}).dmg===3&&R.statsFor(R.E,{key:'archer'}).dmg===5.5);
    const base=R.statsFor(c,{key:'orc_goblin'});c.legends.add('orc_gob_bow');const bow=R.statsFor(c,{key:'orc_goblin'});
    check('Goblin bow uses +20% damage, +40% range and 15% lower attack speed',near(bow.dmg/base.dmg,1.2)&&near(bow.range/base.range,1.4)&&near(base.cooldown/bow.cooldown,.85),{base,bow});
    const troll=unit(c,'orc_troll');troll.hp=troll.maxHp/2;c.normal.orc_troll_regen=2;const health=troll.hp;R.updateUnitStatuses(troll,2);
    check('Troll regeneration scales with actual maximum HP and common stacks',near(troll.hp-health,troll.maxHp*.02));
    c=reset('orc');const queued=R.makeEntry(c,'orc_troll');c.garrison.push(queued);put(c,'orc_troll',3);R.applyChoice(c,{kind:'building_branch',id:'orc_troll',branch:'breeding'});const small=unit(c,'orc_troll');
    check('Breeding updates existing queues, new field units and reserves to two slots',R.orcArmyWeight(queued)===2&&R.orcArmyWeight(small)===2&&R.orcReserveWeight(queued,c)===2&&near(small.maxHp,1600));
    c.armyCap=1;R.state.units=[];c.garrison=[];c.releaseQueue=[R.makeEntry(c,'orc_troll'),R.makeEntry(c,'orc_troll')];c.gateMode='open';R.releaseQueues(1);
    check('A small Troll can use the last free place, then locks further arrivals',R.fieldUnitCount(c)===2&&c.releaseQueue.length===1);
    R.state.units=[];c.garrison=[];c.releaseQueue=[];c.armyCap=3;c.garrisonCap=0;c.levels.orc_gob=4;c.l4Branches.orc_gob='swarm';unit(c,'orc_goblin');const trollProducer=R.buildingOf(c,'orc_troll')[0],smallRoom=R.productionRoomFor(c,trollProducer);
    c.l4Branches.orc_troll='earthshaker';c.armyCap=5;
    check('Half-slot Goblins cannot turn a half-free place into another small or full Troll',smallRoom===1&&R.productionRoomFor(c,trollProducer)===1);
    const retired=['orc_blessing','orc_curse_master','orc_inherit','orc_dispel','marking_arrow','gen_graveyard_capacity'];
    check('Removed cards cannot enter the catalog or be directly applied',retired.every(id=>![...R.NORMAL,...R.LEGENDARY].some(o=>o.id===id)&&R.applyChoice(c,{kind:'legendary',id})===false));
    c=reset('undead');check('Corrupted Hatchery is absent from definitions, drafts and AI',!R.BUILDINGS.und_corrupted_hatchery&&!__ROADLORDS_UNDEAD__.buildings.und_corrupted_hatchery&&!R.buildingUnlockPool(c).some(o=>o.id==='und_corrupted_hatchery')&&!R.aiFactionBuildings(c).includes('und_corrupted_hatchery'));
    const caster=unit(c,'und_necromancer'),normalGhost=R.statsFor(c,{key:'und_ghost'});c.normal.necro_common_summon_stats=2;c.legends.add('necro_leg_spirits');caster.undSummonClock=100;R.updateBattle(.01);
    const summoned=R.state.units.filter(u=>u.key==='und_ghost'&&u.undSummonerId===caster.id);
    check('Real Necromancer Spirit summons receive both HP and damage from Empowered Summoning',summoned.length===4&&summoned.every(u=>near(u.maxHp,normalGhost.hp*1.2)&&near(u.damage,normalGhost.dmg*1.2)));
    c=reset();let a=unit(c,'swordsman'),b=unit(R.E,'swordsman',370);b.hp=b.maxHp=1000;const start=b.hp;hit(a,b);const plain=start-b.hp;O.applyCurse(b,'curse',4);const was=b.hp;hit(a,b);
    check('The normal Curse increases real incoming attack damage by 25%',near(was-b.hp,plain*1.25));
    O.applyCurse(a,'curse',4);const wasBoth=b.hp;hit(a,b);
    check('Cursed attackers deal 25% less damage independently of the target Curse',near(wasBoth-b.hp,plain*.75*1.25));
    const hp=b.maxHp;O.applyCurse(b,'curse',2,2);R.updateUnitStatuses(b,1);O.applyCurse(b,'curse',4,1);
    check('Normal reapplication cannot downgrade a still-active empowered Curse',R.orcCursePower(b,'curse')===2&&b.maxHp===hp&&R.orcAttackSpeedMult13(b)===1);
    R.updateUnitStatuses(b,1.1);check('Curse strength falls back without stacking, then completely expires',R.orcCursePower(b,'curse')===1);R.updateUnitStatuses(b,5);check('Expired Curse leaves no HP change or hidden penalty',R.orcCursePower(b,'curse')===0&&b.maxHp===hp);
    c=reset('orc');c.levels.orc_shaman=4;c.l4Branches.orc_shaman='double_curse';a=unit(c,'orc_shaman');const targets=[unit(R.E,'swordsman',390),unit(R.E,'swordsman',400),unit(R.E,'swordsman',410)];targets.forEach(t=>{t.hp=t.maxHp=1000;});a.firstHitsRemaining=2;a.firstMult=2;
    R.attackUnit(a,targets[0]);const shots=R.ROAD.pending.length;check('Two-target Shaman queues two real projectiles without early damage or curses',shots===2&&targets.every(t=>t.hp===1000&&!R.orcCursePower(t,'curse')));
    R.ROAD.clock=Math.max(...R.ROAD.pending.map(p=>p.a.hit))+.001;R.roadImpacts();
    check('Both Shaman targets take full damage and Curse while one opening charge is consumed',near(targets[0].hp,984)&&near(targets[1].hp,984)&&targets[2].hp===1000&&targets.slice(0,2).every(t=>R.orcCursePower(t,'curse')===1)&&a.firstHitsRemaining===1&&a.attackCount===1,targets.map(t=>({hp:t.hp,curse:t.orcCurses})));
    c=reset('orc');R.E.race='undead';c.levels.orc_shaman=4;c.l4Branches.orc_shaman='double_curse';a=unit(c,'orc_shaman');b=unit(R.E,'und_ghost',390);const ordinary=unit(R.E,'swordsman',400);const ghostHp=b.hp,ordinaryHp=ordinary.hp;
    Math.random=()=>0;hit(a,b);Math.random=()=>.99;
    check('Two-target attacks resolve dodge separately without cursing the evading Ghost',b.hp===ghostHp&&!R.orcCursePower(b,'curse')&&ordinary.hp<ordinaryHp&&R.orcCursePower(ordinary,'curse')===1);
    c=reset('orc');c.levels.orc_shaman=4;c.l4Branches.orc_shaman='strong_curses';a=unit(c,'orc_shaman');b=unit(R.E,'swordsman',390);hit(a,b);const beforeStrong=b.hp;R.damageUnit(b,10,'magic');
    check('The other Shaman L4 applies the empowered 50% incoming-damage penalty',R.orcCursePower(b,'curse')===2&&near(beforeStrong-b.hp,15));
    c=reset('orc');c.legends.add('orc_curse_spread');b=unit(R.E,'swordsman',370);const survivor=unit(R.E,'swordsman',380);O.applyCurse(b,'curse',3,2);b.orcBleed=9;b.orcPoison=8;R.applyBurn(b,20);R.killUnit(b,true);
    check('Curse Spread transfers only Curse, preserving strength and time',R.orcCursePower(survivor,'curse')===2&&survivor.orcCurses.curse===3&&!survivor.orcBleed&&!survivor.orcPoison&&!survivor.burnTime&&!survivor.stunTime);
    c=reset();c.levels.temple=4;c.l4Branches.temple='war_priests';a=unit(c,'priest');b=unit(c,'swordsman',360);b.hp=1;R.priestAction(a,[b]);
    check('War Priests retain their real temporary bonuses without positive status badges',b.blessingTime===5&&!R.unitStatusBadges(b).some(([k])=>['power','haste','blessing','shield','regen'].includes(k)));
    c.legends.add('holy_retribution');const retaliationTarget=unit(R.E,'swordsman',370);O.applyCurse(a,'curse',4);const healedBefore=b.hp,enemyBefore=retaliationTarget.hp;R.priestAction(a,[b]);
    check('Curse reduces Holy Retribution damage without reducing priest healing',near(b.hp-healedBefore,a.heal)&&near(enemyBefore-retaliationTarget.hp,a.heal*.75));
    b.shield=50;b.tempShield=25;O.applyCurse(b,'curse',4);b.orcPoison=5;b.orcBleed=2;b.burnTime=2;b.slowTime=2;b.slowMult=.5;b.stunTime=1;
    check('Status badges contain exactly the six agreed negative types',R.unitStatusBadges(b).map(([k])=>k).sort().join()===['bleed','burn','curse','poison','slow','stun'].sort().join());
    const fills=[],g=R.ctx,fill=g.fillRect;g.fillRect=function(...args){if(['#e65050','#66cbff'].includes(this.fillStyle))fills.push({color:this.fillStyle,args});return fill.apply(this,args);};
    try{R.ROAD.camera=0;R.roadDrawUnit(b);}finally{g.fillRect=fill;}
    const red=fills.find(f=>f.color==='#e65050'),blue=fills.find(f=>f.color==='#66cbff');
    check('The real figure renderer draws blue shield above red HP',red&&blue&&blue.args[1]<red.args[1]&&blue.args[0]===red.args[0],fills);
    c=reset('undead');put(c,'und_dark_tower');b=unit(R.E,'swordsman',1000);b.hp=b.maxHp=1000;const losses=[];
    for(let n=0;n<3;n++){const before=b.hp;R.undUpdateDarkTowers(1);losses.push(before-b.hp);}
    check('Dark Tower damage ramps as 1, 2, 3 on the same target',losses.join()==='1,2,3',losses);
    b.lane=R.PATH_LENGTH-100;const fresh=unit(R.E,'swordsman',1100);fresh.hp=fresh.maxHp=1000;R.undUpdateDarkTowers(1);
    check('Leaving own territory releases the old beam and a new target starts at one damage',fresh.hp===999&&b.hp===994);
    c=reset('undead');const tower=put(c,'und_dark_tower',3);const enemies=[0,1,2,3].map(n=>unit(R.E,'swordsman',1000+n*30));enemies.forEach(u=>u.hp=u.maxHp=1000);R.undUpdateDarkTowers(1);R.undUpdateDarkTowers(1);
    check('Tower levels control distinct beam slots and each beam has an independent age',enemies.map(u=>u.hp).join()==='997,997,997,1000'&&tower.undTowerBeams.length===3);
    enemies[0].alive=false;R.undUpdateDarkTowers(1);check('Replacing one target resets only its own beam',enemies[1].hp===994&&enemies[2].hp===994&&enemies[3].hp===999);
    const packet=R.mpRevive(R.mpCitySnapshot(c)),snapshot=JSON.stringify(tower.undTowerBeams),healths=enemies.map(u=>u.hp);R.MP.enabled=true;R.MP.role='guest';R.undUpdateDarkTowers(5);R.MP.enabled=false;
    check('Normal city snapshots include beam ages; guests cannot simulate extra damage',packet.buildings.find(x=>x.type==='und_dark_tower').undTowerBeams.length===3&&JSON.stringify(tower.undTowerBeams)===snapshot&&enemies.every((u,n)=>u.hp===healths[n])&&R.gameRulesVersion===23);
    tower.inactive=true;const stopped=enemies.map(u=>u.hp);R.undUpdateDarkTowers(2);check('Unfunded towers stop damage and discard their old beam ages',!tower.undTowerBeams.length&&enemies.every((u,n)=>u.hp===stopped[n]));
    tower.inactive=false;c.levels.keep=4;c.l4Branches.keep='dead_realm';R.undUpdateDarkTowers(1);check('The existing own-territory capital bonus doubles the new beam damage',near(stopped[1]-enemies[1].hp,2));
    c=reset('orc');c.levels.orc_shaman=4;c.l4Branches.orc_shaman='double_curse';a=unit(c,'orc_shaman');b=unit(R.E,'swordsman',390);unit(R.E,'swordsman',410);R.attackUnit(a,b);
    const sent=[];R.MP.enabled=true;R.MP.role='host';R.MP.peer={};R.MP.conn={open:true,send:packet=>sent.push(packet)};R.mpSendSnapshot(true);R.MP.enabled=false;
    const actual=R.mpRevive(sent.find(packet=>packet.type==='snapshot'));
    check('Multiplayer sends the living Shaman secondary projectile alongside its primary attack',actual?.flyingShots?.length===1&&actual.flyingShots[0].id===a.id);
   }catch(error){checks.push({name:'Scenario completed without exceptions',ok:false,details:error.stack});}finally{Math.random=random;}
   return checks;
  });
  for(const c of report.checks){console.log(c.ok?'PASS':'FAIL',c.name);if(!c.ok)console.log(JSON.stringify(c.details));}
  assert(report.checks.every(c=>c.ok),'Status/faction refinement checks failed');assert.equal(report.errors.length,0,'No runtime errors');
 }finally{fs.mkdirSync('artifacts',{recursive:true});fs.writeFileSync('artifacts/status-refinement.json',JSON.stringify(report,null,2));await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
