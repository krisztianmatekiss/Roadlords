const {chromium}=require('playwright');
const assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox','--disable-dev-shm-usage']});
 const report={checks:[],errors:[]};
 try{
  const page=await browser.newPage({viewport:{width:1600,height:1000}});
  await page.route('https://**/*',r=>r.abort());page.on('pageerror',e=>report.errors.push(e.message));
  await page.goto(process.env.ROADLORDS_TEST_URL||'http://127.0.0.1:4173/Roadlords/');
  await page.waitForFunction(()=>!!window.__ROADLORDS_RUNTIME__);
  const results=await page.evaluate(()=>{
   const R=__ROADLORDS_RUNTIME__,checks=[],near=(a,b)=>Math.abs(a-b)<1e-6;
   const check=(name,ok,details)=>{checks.push({name,ok:!!ok,details});};
   R.state.running=false;R.MP.enabled=false;
   function reset(race='undead',enemy='human'){
    R.roadResetCity(R.P,race);R.roadResetCity(R.E,enemy);
    R.state.units=[];R.state.unitSerial=1;R.state.ended=false;R.state.modal=false;R.state.pregame=false;R.state.startChoices=0;R.state.pendingChoices=[];R.state.nextPick=99999;R.state.combatStep++;
    R.ROAD.pending=[];R.ROAD.dead=[];R.ROAD.clock=20;R.ROAD.test=false;
    for(const c of [R.P,R.E]){c.buildings=c.buildings.filter(b=>b.type==='keep');c.buildings[0].level=1;c.normal={};c.legends=new Set();c.l4Branches={};c.levels={};c.garrison=[];c.releaseQueue=[];c.rallyReserve=[];c.terrain.fill(null);c.unlocked=new Set(['keep']);c.resources=R.C(100000,100000,100000);c.undRevision=(c.undRevision||0)+1;R.recomputeCity(c,false);c.resources=R.C(100000,100000,100000);c.garrisonCap=1000;c.armyCap=1000;c.gateMode='closed';}
    for(const t of R.towers)t.alive=false;R.roadRefreshFrontiers();R.roadReindex();return R.P;
   }
   function building(c,type,level=1,row=3,col=3){const b={id:type+'-'+c.buildings.length,type,level,row,col,rotation:0,progress:0};c.buildings.push(b);c.levels[type]=level;c.unlocked.add(type);c.undRevision=(c.undRevision||0)+1;return b;}
   function branch(c,type,id){c.levels[type]=4;c.l4Branches[type]=id;for(const b of c.buildings)if(b.type===type)b.level=4;}
   function unit(c,key,lane=4500,extra={}){const u=R.releaseUnit(c,R.makeEntry(c,key,extra));u.lane=lane;u.offset=0;u.cooldown=99;R.roadReindex();return u;}
   const random=Math.random;
   try{
    let c=reset();
    check('Deleted buildings cannot appear in any faction unlock pool',['human','orc','undead'].every(race=>{R.roadResetCity(R.P,race);return R.buildingUnlockPool(R.P).every(o=>!['hospital','towercommand','alchemist','academy','orc_altar','und_soul_harvester'].includes(o.id));}));
    c=reset();check('The new elite legendary has no capital or producer prerequisite',R.eligibleLegendary(c).some(o=>o.id==='und_elite_birth'));
    const base=R.statsFor(c,{key:'und_vampire'}),elite=R.statsFor(c,{key:'und_vampire',veteran:true,undElite:true});
    check('Vampires have 600 base HP; both legacy elite flags apply the 50-percent bonus only once',base.hp===600&&elite.hp===900&&elite.dmg===base.dmg*1.5,{base,elite});
    branch(c,'keep','elite_dominion');c.legends.add('und_elite_birth');
    Math.random=()=>.65;const produced=R.makeEntry(c,'und_zombie',{producerMade:true}),notSummoned=R.makeEntry(c,'und_zombie',{undSummoned:true});
    Math.random=()=>.15;const summoned=R.makeEntry(c,'und_skeleton',{undSummoned:true}),reborn=R.makeEntry(c,'und_skeleton',{undReborn:true});
    Math.random=()=>.75;const failed=R.makeEntry(c,'und_zombie',{producerMade:true});
    check('Capital and independent legendary yield 70 percent for producers and 20 percent for summons/rebirth',produced.veteran&&!notSummoned.veteran&&summoned.veteran&&reborn.veteran&&!failed.veteran);
    c.legends.clear();Math.random=()=>.15;check('The capital alone does not make summoned units elite',!R.makeEntry(c,'und_skeleton',{undSummoned:true}).veteran);
    c.l4Branches={};c.legends.add('und_elite_birth');check('The legendary works on its own',R.makeEntry(c,'und_skeleton').veteran);
    Math.random=()=>.99;const marked=unit(c,'und_skeleton',4500,{veteran:true,undElite:true});check('An elite unit has exactly one rank badge',R.unitStatusBadges(marked).filter(([k])=>k==='elite'||k==='veteran').length===1);
    check('The status encyclopedia exposes only one Elite state',Object.values(__ROADLORDS_STATUSES__.defs).filter(d=>d[0]==='Elit').length===1);
    c=reset();const well=building(c,'und_well');const upkeep=R.undEconomy(c).totalUpkeep;branch(c,'keep','elite_dominion');c.undRevision++;check('The elite capital doubles actual continuous upkeep',near(R.undEconomy(c).totalUpkeep,upkeep*2));
    c=reset();const hall=building(c,'und_corrupted_hatchery',1,3,3),lich=building(c,'und_lich_spawner',1,3,5),grave=building(c,'und_graveyard',1,2,3);
    const normalTime=R.previewTrainingTime(c,'und_lich_spawner',1);
    check('Hatchery accelerates nearby elites but never a Graveyard',near(R.trainingTime(c,lich),normalTime/1.4)&&near(R.trainingTime(c,grave),R.previewTrainingTime(c,'und_graveyard',1)));
    Math.random=()=>.1;const cost=R.unitCost(c,'und_lich').wood,before=c.resources.wood;R.normalSpawn(c,lich);const born=c.garrison.at(-1)||c.releaseQueue.at(-1);
    check('Hatchery replaces a trained Lich with a full-health Skeleton at the original price',born?.key==='und_skeleton'&&near(before-c.resources.wood,cost)&&born.undSpawnHp===1,{born,cost,paid:before-c.resources.wood});
    Math.random=()=>.99;
    c=reset();c.normal.und_territory=2;check('Territory grows in metres before L4',R.territoryBoundary()===R.PATH_LENGTH/2+240);
    branch(c,'keep','dead_realm');check('Territorial L4 doubles expansion',R.territoryBoundary()===R.PATH_LENGTH/2+480);
    R.E.race='undead';R.E.normal.und_territory=1;check('Both sides share one consistent boundary',R.territoryBoundary()===R.PATH_LENGTH/2+360&&!R.isOwnHalf({side:'enemy',lane:R.PATH_LENGTH/2+100}));
    c=reset();building(c,'und_dark_tower',1);building(c,'und_dark_tower',1,5,5);const first=unit(R.E,'swordsman',1000),second=unit(R.E,'swordsman',1010);first.hp=.01;second.hp=second.maxHp=100;R.updateBattle(1);
    check('A later Dark Tower retargets when an earlier one kills its victim',!first.alive&&second.hp<100,{first:first.hp,second:second.hp});
    c=reset();building(c,'und_dark_tower',3);const targets=[1000,1010,1020,1030].map(x=>{const u=unit(R.E,'swordsman',x);u.hp=u.maxHp=100;return u;});R.updateBattle(1);
    check('L3 Dark Tower damages exactly three distinct targets',targets.filter(u=>u.hp<100).length===3,targets.map(u=>u.hp));
    c=reset('orc');building(c,'orc_arena',4,3,3);const war=building(c,'orc_war',1,3,5);Math.random=()=>.59;check('L4 Arena gives 60-percent elite births',R.makeEntry(c,'orc_warrior',{originBuildingId:war.id}).veteran);
    building(c,'orc_arena',4,2,5);Math.random=()=>.61;check('Multiple Arenas do not stack or roll twice',!R.makeEntry(c,'orc_warrior',{originBuildingId:war.id}).veteran);
    c=reset('orc');const overseer=building(c,'orc_overseer',4,3,3),producer=building(c,'orc_war',1,3,5);branch(c,'orc_overseer','ruthless');c.orcHasteSettings={[overseer.id]:1};const fast=R.orcHasteProfile(c,producer);producer.progress=.5;c.orcHasteSettings[overseer.id]=0;
    check('Overseer slider locks paired speed and HP throughout a training cycle',near(fast.time,.2)&&near(fast.hp,.25)&&R.orcHasteProfile(c,producer)===fast);
    producer.progress=0;check('A subsequent training cycle uses the changed setting',near(R.orcHasteProfile(c,producer).time,.6)&&near(R.orcHasteProfile(c,producer).hp,.8));
    c=reset('orc');building(c,'orc_hut',4);R.recomputeCity(c,false);check('L4 Hut adds 75 army and 75 garrison slots',c.armyCap===125&&c.garrisonCap===105,{army:c.armyCap,garrison:c.garrisonCap});
    branch(c,'keep','orc_command');R.recomputeCity(c,false);check('Orc command capital doubles HP and total garrison',c.maxHp===320000&&c.garrisonCap===210&&R.orcGateBonuses(c),{hp:c.maxHp,garrison:c.garrisonCap});
    c=reset('orc');const totem=building(c,'orc_totem',1);for(let i=0;i<300;i++){const victim=unit(R.E,'swordsman');victim.hp=0;R.killUnit(victim,true);}check('Totem counts 300 enemy deaths for one reward',c.orcSupport.totemRewards===1&&c.orcSupport.totemProgress===0,c.orcSupport);
    const own=unit(c,'orc_warrior');own.hp=0;R.killUnit(own,true);check('Totem no longer counts own deaths',c.orcSupport.totemProgress===0);
    check('Totem rewards use normal rarity rather than forcing legendary',R.rollPickTier(c,'orc_totem').tier!=='legendary');
    c=reset('human');const tavern=building(c,'tavern',4,3,3),barracks=building(c,'barracks',1,3,4);let e={key:'swordsman'};R.applyTavernOriginBuff(c,barracks,e);check('Local L4 Tavern grants six attacks with 150-percent bonus',e.firstHits===6&&e.firstMult===2.5,e);
    building(c,'townhall',1,3,1);e={key:'swordsman'};R.applyTavernOriginBuff(c,barracks,e);check('Townhall doubles Tavern damage, not its attack count',e.firstHits===6&&e.firstMult===4,e);
    R.normalSpawn(c,barracks);const trained=c.garrison[0];R.waveBuffs(c,[trained]);const fighter=R.releaseUnit(c,trained),opening=Array.from({length:7},()=>R.consumeOpeningAttack(fighter));
    check('A real paid recruit retains its local Tavern buff through gate release and consumes exactly six empowered attacks',opening.slice(0,6).every(n=>n===4)&&opening[6]===1,opening);
    const outside=building(c,'barracks',1,8,8);e={key:'swordsman'};R.applyTavernOriginBuff(c,outside,e);R.waveBuffs(c,[e]);check('Opening a gate does not give Tavern buffs to unrelated producers',!e.firstHits,e);
    c=reset('human');const b=building(c,'barracks',4,3,3);branch(c,'barracks','cavalry_barracks');const without=R.trainingTime(c,b);building(c,'stable',1,3,4);const withStable=R.trainingTime(c,b);
    check('Cavalry Barracks require an adjacent Stable and use 30-percent lower training speed',R.effectiveUnitKey(c,b)==='knight'&&withStable>without,{without,withStable});
    c=reset('human');const market=building(c,'market',1,3,3);R.recomputeCity(c,false);check('L1 automatic Market grants 50-percent total storage',c.caps.wood===300);
    c.resources=R.C(c.caps.wood,0,0);R.convertMarketOverflow(c,R.C(20,0,0));check('Overflow is converted once at L1 two-to-one ratio',near(c.resources.stone+c.resources.food,10));
    market.level=4;c.levels.market=4;R.recomputeCity(c,false);c.resources=R.C(c.caps.wood,0,0);R.convertMarketOverflow(c,R.C(20,0,0));check('L4 Market grants triple storage and converts one-to-two',c.caps.wood===600&&near(c.resources.stone+c.resources.food,40));
    c=reset('human');c.normal.spear_range=15;const spear=unit(c,'spearman'),enemy=unit(R.E,'swordsman',4510);spear.hp=spear.maxHp=100;R.applyDirectHit(enemy,spear,40,{fx:false});check('Spearman common reduces melee damage by at most 75 percent',near(spear.hp,90),spear.hp);
    branch(c,'spearhall','bulwark');check('Bulwark doubles HP without legacy Pike Wall stats',R.statsFor(c,{key:'spearman'}).hp===180&&R.statsFor(c,{key:'spearman'}).range===45);
    c=reset('human');const smith=building(c,'armorsmith',4,3,3),forgeTarget=building(c,'barracks',1,3,4);branch(c,'armorsmith','heavy_armor');building(c,'townhall',4,0,0);let armored={key:'swordsman'};R.applyArmorSmithEntry(c,forgeTarget,armored);
    check('Citywide Townhall doubles armour shield and its movement drawback',armored.armorShieldPct===2&&near(armored.armorMoveMult,.7),armored);
    const library=building(c,'library',3,5,5);c.levels.library=3;R.state.pendingChoices=['timed'];const choice=R.choiceContextForPlayer();check('Townhall repeats Library free rerolls at the same choice',choice.freeRerolls===6,choice.freeRerolls);R.state.pendingChoices=[];
    const masters=building(c,'mastersguild',3,6,6);const sum=()=>c.buildings.reduce((n,b)=>n+b.level,0);c.mastersGuildProgress=179.999;const previous=sum();R.state.running=true;R.tick(.01);R.state.running=false;
    check('Townhall repeats two Masters Guild upgrades at one unchanged interval',sum()-previous===2&&c.mastersGuildProgress<1,{levels:sum()-previous,progress:c.mastersGuildProgress});
    R.roadReindex();R.renderStatic();R.renderBattle(.01);
    return checks;
   }finally{Math.random=random;}
  });
  report.checks=results;for(const result of results){console.log(result.ok?'PASS':'FAIL',result.name,result.ok?'':JSON.stringify(result.details));}
  assert(results.every(r=>r.ok),'Faction redesign checks failed');assert.equal(report.errors.length,0,report.errors.join('\n'));
 }finally{fs.mkdirSync('artifacts',{recursive:true});fs.writeFileSync('artifacts/faction-redesign.json',JSON.stringify(report,null,2));await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
