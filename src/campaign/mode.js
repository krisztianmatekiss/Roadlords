import { CAMPAIGN_SAVE_KEY, campaignRandom, campaignEncounters, newCampaignRun, readCampaignRun } from './definitions.js';
import { installCampaignRewards } from './rewards.js';
import { createCampaignPanel } from '../ui/campaign-panel.js';

function withSeed(seed,action) {
  const old=Math.random;Math.random=campaignRandom(seed);
  try{return action();}finally{Math.random=old;}
}

export function installCampaign(R) {
  const C=R.campaign={active:false,run:null,loading:false,message:'',applyingPermanent:false,battleCards:[],rewardType:null,rewardSelection:[]};
  const initialTowers=structuredClone(R.towers),initialCapitalTowers=structuredClone(R.capitalTowers);
  installCampaignRewards(R,C);
  const save=()=>{
    try{localStorage.setItem(CAMPAIGN_SAVE_KEY,JSON.stringify(C.run));C.message='Kampány elmentve.';return true;}
    catch{C.message='A böngésző nem engedte a mentést. Ebben az ablakban tovább játszhatsz.';return false;}
  };
  try{
    const raw=localStorage.getItem(CAMPAIGN_SAVE_KEY);C.run=readCampaignRun(raw,C.catalog);
    if(C.run?.migrated)C.message='A korábbi kampány ereklyéi permanens legendás fejlesztésekké alakultak.';
    if(raw&&!C.run)C.message='A korábbi kampánymentés nem olvasható. Indíthatsz újat.';
  }catch{C.message='Ebben a böngészőben a mentés nem elérhető.';}
  C.encounter=()=>{
    const e=campaignEncounters(C.run.seed)[C.run.stage];
    if(e.level===4&&!e.branch)e.branch=R.V4_BRANCHES[e.building]?.[0]?.id||null;
    return e;
  };
  C.startingAdvantages=e=>{
    const out=[];
    if(e.boss)out.push('L3 Nekropolisz','L4 Lélekkút');
    if(e.level)out.push(`L${e.level} ${R.BUILDINGS[e.building].name}${e.level===4&&e.branch?' · '+(R.V4_BRANCHES[e.building]?.find(b=>b.id===e.branch)?.name||''):''}`);
    out.push(...e.legendaries.map(id=>{const d=R.upgradeCatalog.definition(id,'legendary');return `${d.name}: ${d.description}`;}));
    return out.length?out:['Normál kezdőváros, extra előny nélkül.'];
  };
  C.newRun=race=>{
    if(C.loading)return false;
    C.run=newCampaignRun(race,Math.floor(Math.random()*0x100000000),C.catalog[race].basics);C.rewardType=null;C.rewardSelection=[];save();view.render();return true;
  };
  C.open=()=>{R.stopSpectator?.();view.show();};
  C.returnToMenu=()=>{save();try{sessionStorage.setItem('roadlords:return-to-menu','1');}catch{}location.reload();};
  function put(c,type,level,branch=null) {
    const terrain=c.terrain,stock=c.resources;c.terrain=Array(R.GRID*R.GRID).fill(null);c.resources=R.C(1e6,1e6,1e6);c.unlocked.add(type);
    let b;
    try{
      const cell=R.findCell(c,type);if(!cell)throw Error('Nincs hely a kezdőépületnek: '+type);
      const out=R.placeBuilding(c,type,...cell);if(!out.ok)throw Error('Nem építhető: '+type);b=out.building;
      R.setBuildingLevel(c,type,level,branch);b.campaignProtected=true;
    }finally{c.terrain=terrain;c.resources=stock;}
    for(const [row,col]of R.cityBuildingCells(c,b))c.terrain[R.idx(row,col)]=null;
    return b;
  }
  function resetMatch(entry) {
    R.MP.conn?.close();R.MP.peerClient?.destroy();clearInterval(R.MP.snapshotTimer);
    Object.assign(R.MP,{enabled:false,role:'solo',started:false,readySent:false,opponentReady:false,peer:false,guestChoicePending:false,deferredGuestChoices:[]});
    R.spectator.active=false;document.body.classList.remove('spectator-mode','road-test','pregame-active');
    Object.assign(R.state,{running:false,time:0,ended:false,modal:false,pregame:false,startChoices:4,startPickTimer:0,pendingChoices:[],choiceContext:null,units:[],unitSerial:1,speed:1,timedPickCount:0,nextPick:R.PICK_BASE_SECONDS,selectedBuild:null,selectedBuilding:null,selectedTowerId:null,buildRotation:0,category:'all',banMode:false,roadTest:false});
    R.state.combatStep=(R.state.combatStep||0)+1;R.aiDecisionCache=null;R.battleSearch=null;R.acc=0;R.uiAcc=0;
    Object.assign(R.ROAD,{test:false,testRoster:null,testCount:0,initial:null,paused:false,clock:0,pending:[],dead:[],result:'',camera:0,zoom:1,figureStyle:'painted',spritePixels:0});
    R.ROAD.sprites.clear();R.ROAD.metrics={steps:0,damage:0,attacks:0,tickMs:0,renderMs:0,fps:0};
    for(const key of ['projectiles','particles','casterHeals'])if(Array.isArray(R[key]))R[key].length=0;
    if(R.roadEffects){R.roadEffects.impacts=[];R.roadEffects.seen?.clear();}
    for(const [list,snapshot]of [[R.towers,initialTowers],[R.capitalTowers,initialCapitalTowers]])list.forEach((t,i)=>{for(const key of Object.keys(t))delete t[key];Object.assign(t,structuredClone(snapshot[i]));});
    withSeed(entry.seed,()=>{
      for(const [c,race]of [[R.P,C.run.race],[R.E,entry.race]]){R.roadResetCity(c,race);R.generateTerrain(c,12);c.aiDecisionSeed=Math.floor(Math.random()*0x100000000);R.recomputeCity(c,false);}
      if(entry.boss){R.setBuildingLevel(R.E,'keep',3);put(R.E,'und_well',4);}
      if(entry.level)put(R.E,entry.building,entry.level,entry.branch);
      C.startingCity(R.P);
      C.battleCards=[];
      C.applyPermanent(R.P,C.run.permanent);C.applyPermanent(R.E,entry.legendaries.map(id=>({id,kind:'legendary',count:1})));
    });
    for(const c of [R.P,R.E]){c._matchStats=null;R.recomputeCity(c,true);}
    R.cancelEnemyPickReveal?.();
    R.closeBuildCardPreview?.();R.clearPlacementPreview?.();
    R.state.openBuildingInspectors=[];R.state.buildingInspectorPos={};R.state.buildingInspectorZ={};
    R.$('#inspector').classList.remove('show');R.$('#rlIngameMenu')?.classList.remove('show');
    for(const id of ['choiceOverlay','pickReminder','endOverlay','relicOverlay'])R.$('#'+id)?.classList.add('hidden');
    for(const panel of R.$$('.rlMenuPanel.show'))panel.classList.remove('show');
    R.MP.lobby.style.display='none';R.MP.status.style.display='none';
    R.$('#pauseBtn').classList.add('on');R.$('#pauseBtn').textContent='▶';R.$('#speedBtn').textContent='1×';
    R.roadReindex();R.roadRefreshFrontiers();R.roadWar.scrollLeft=0;R.renderStatic();R.updateHud();R.roadResize();
    window.__ROADLORDS_PREGAME__.setPregame(true);
  }
  C.startBattle=async()=>{
    if(C.loading||!C.run||!['ready','battle','defeated'].includes(C.run.status)||R.MP.enabled&&R.MP.started)return false;
    C.loading=true;view.render();const entry=C.encounter();
    try{
      const ready=await R.loadProductionBattleArt([C.run.race,entry.race]);
      if(!ready){C.message='Az egységképek nem töltődtek be. Próbáld újra.';return false;}
      C.active=true;resetMatch(entry);C.run.status='battle';save();view.hide();return true;
    }catch(error){C.message='A harc előkészítése nem sikerült. Próbáld újra.';R.state.running=false;console.error(error);return false;}
    finally{C.loading=false;if(view.visible())view.render();}
  };
  const finish=R.finish;
  R.finish=win=>{
    if(!C.active)return finish(win);
    if(R.state.ended||C.run.status!=='battle')return;
    finish(win);
    if(win){
      C.run.results.push({time:R.state.time});
      if(C.run.stage===4)C.run.status='complete';else{
        C.run.loot={unlocked:[...R.P.unlocked],cards:structuredClone(C.battleCards)};
        C.rewardType=null;C.rewardSelection=[];C.run.status='reward';
      }
    }else C.run.status='defeated';
    save();R.$('#restartBtn').textContent='Vissza a kampányhoz';view.show();
  };
  const restart=R.$('#restartBtn').onclick;
  R.$('#restartBtn').onclick=e=>C.active?view.show():restart?.(e);
  const update=R.updateHud;
  R.updateHud=(...args)=>{
    const out=update(...args);
    const label=R.$('#timer')?.closest('.datum')?.querySelector('small'),text=C.active?`KAMPÁNY ${C.run.stage+1}/5`:'IDŐ';
    if(label&&label.textContent!==text)label.textContent=text;
    if(C.active){
      if(R.state.pregame){R.$('#pregameRefreshRight').disabled=true;R.$('#pregameRefreshRight').title='A kampányellenfél kezdővárosa rögzített.';R.$('#pregameReadyText').textContent=`${C.run.stage+1}/5 · ${C.encounter().name} · ✓ INDÍTÁS`;}
    }
    return out;
  };
  R.$('#pregameRefreshRight').addEventListener('click',event=>{if(C.active){event.preventDefault();event.stopImmediatePropagation();}},true);
  const spectator=R.startSpectator;
  R.startSpectator=(...args)=>{C.active=false;view.hide();return spectator(...args);};
  const diagnostic=R.roadStartTest;
  R.roadStartTest=(...args)=>{C.active=false;view.hide();return diagnostic(...args);};
  window.__ROADLORDS_ROAD__.startTest=R.roadStartTest;
  const view=createCampaignPanel(R,C);C.view=view;C.save=save;
  const quick=R.$('#mpSolo');quick.textContent='GYORS JÁTÉK';
  const campaign=document.createElement('button');campaign.id='campaignBtn';campaign.className='menuButton primary';campaign.type='button';campaign.textContent='KAMPÁNY';quick.before(campaign);campaign.onclick=C.open;
}
