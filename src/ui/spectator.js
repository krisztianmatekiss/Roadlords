export function installSpectatorMode(R) {
  R.spectator={active:false,left:'human',right:'orc'};
  const originalTowers=structuredClone(R.towers);
  let leftSignature='';
  function refresh(){
    if(!R.spectator.active)return;
    // Player actions normally redraw this grid. The left AI has no such UI
    // action, so update it on the HUD cadence, only when its layout changes.
    const signature=R.cityVisualSignature(R.P);
    if(signature!==leftSignature){R.renderCity(R.$('#playerGrid'),R.P,true);leftSignature=signature;}
  }
  function nextPick(){R.state.nextPick=Math.max(.001,Math.min(R.P._aiPickDue,R.E._aiPickDue)-R.state.time);}
  R.aiGrantPick=(c,source='timer')=>{
    if(c===R.E)return R.grantEnemyPick(source);
    const pending=R.state.pendingChoices,starters=R.state.startChoices;
    let choice;
    R.state.pendingChoices=[source];R.state.startChoices=source==='start'?4:0;
    try{choice=R.choiceContextForPlayer();}finally{R.state.pendingChoices=pending;R.state.startChoices=starters;}
    const options=R.aiChooseOptions(choice.opts,{source,tier:choice.tier,subtype:choice.subtype,city:c});
    if(!options.length)return;
    R.applyChoice(c,options[0],!['masters_guild_choice','capital_studies_choice'].includes(source));R.aiRememberChoice(options[0],c);
    if(choice.doubleTake&&options[1]){R.applyChoice(c,options[1],false);R.aiRememberChoice(options[1],c);}
  };
  const queue=R.queueChoice;
  R.queueChoice=(source='timer')=>R.spectator.active?R.aiGrantPick(R.P,source):queue(source);
  const timed=R.timedPick;
  R.timedPick=()=>{
    if(!R.spectator.active)return timed();
    for(const c of [R.P,R.E])if(c._aiPickDue<=R.state.time+.001){
      R.aiGrantPick(c,'timer');c._aiTimedPicks++;
      c._aiPickDue=R.state.time+R.PICK_BASE_SECONDS*Math.pow(R.PICK_GROWTH,c._aiTimedPicks)/(R.hasBranch(c,'keep','empire')?2:1);
    }
    R.state.timedPickCount=Math.max(R.P._aiTimedPicks,R.E._aiTimedPicks);nextPick();
  };
  const apply=R.applyChoice;
  R.applyChoice=(c,o,...args)=>{
    const empire=R.hasBranch(c,'keep','empire'),out=apply(c,o,...args);
    if(R.spectator.active&&!empire&&R.hasBranch(c,'keep','empire')&&c._aiPickDue!=null){c._aiPickDue=R.state.time+(c._aiPickDue-R.state.time)/2;nextPick();}
    return out;
  };
  R.startSpectator=({left='human',right='orc'}={})=>{
    if(!R.FACTIONS[left]||!R.FACTIONS[right])throw new RangeError('Ismeretlen nép');
    R.state.running=false;R.MP.conn?.close();R.MP.peerClient?.destroy();clearInterval(R.MP.snapshotTimer);
    Object.assign(R.MP,{enabled:false,role:'solo',started:true,peer:false,guestChoicePending:false});
    Object.assign(R.spectator,{active:true,left,right});
    leftSignature='';
    Object.assign(R.state,{time:0,units:[],unitSerial:1,ended:false,modal:false,pregame:false,startChoices:0,pendingChoices:[],choiceContext:null,roadTest:false,speed:1,timedPickCount:0,nextPick:R.PICK_BASE_SECONDS,selectedBuild:null,selectedBuilding:null,selectedTowerId:null,banMode:false});
    Object.assign(R.ROAD,{test:false,paused:false,clock:0,pending:[],dead:[],result:'',camera:0,zoom:1});
    R.ROAD.metrics={steps:0,damage:0,attacks:0,tickMs:0,renderMs:0,fps:0};R.acc=0;
    for(const [c,race]of [[R.P,left],[R.E,right]]){
      R.roadResetCity(c,race);R.generateTerrain(c,12);R.recomputeCity(c,false);
      c.gateMode='closed';c.autoReleasing=false;c.aiThink=0;c._aiTimedPicks=0;c._aiPickDue=R.PICK_BASE_SECONDS;
    }
    R.towers.forEach((t,i)=>Object.assign(t,structuredClone(originalTowers[i])));
    R.roadReindex();R.roadRefreshFrontiers();
    for(const id of ['choiceOverlay','pickReminder','endOverlay','relicOverlay'])R.$('#'+id)?.classList.add('hidden');
    R.$('#pregameSetup')?.classList.remove('show');R.MP.lobby.style.display='none';R.MP.status.style.display='none';
    document.body.classList.remove('road-test','pregame-active','roadlords-menu-open');document.body.classList.add('spectator-mode');
    R.$('#pauseBtn').classList.remove('on');R.$('#pauseBtn').textContent='Ⅱ';R.$('#speedBtn').textContent='1×';
    for(let n=0;n<4;n++)for(const c of [R.P,R.E])R.aiGrantPick(c,'start');
    R.state.running=true;R.roadWar.scrollLeft=0;R.renderStatic();R.updateHud();R.roadResize();refresh();
    R.message('AI vs AI · A/D: pályamozgatás · F: front · Szóköz: szünet',4);
  };
  const update=R.updateHud;R.updateHud=(...args)=>{const out=update(...args);refresh();return out;};
  const finish=R.finish;R.finish=win=>{const out=finish(win);if(R.spectator.active){R.$('#endTitle').textContent=(win?'Bal':'Jobb')+' oldali AI győzelme';refresh();}return out;};
  const restart=R.$('#restartBtn').onclick;R.$('#restartBtn').onclick=e=>R.spectator.active?R.startSpectator(R.spectator):restart?.(e);
  const place=R.tryPlace;R.tryPlace=(...args)=>R.spectator.active?false:place(...args);
  const setGate=R.setGate;R.setGate=(...args)=>R.spectator.active?undefined:setGate(...args);
  const demolish=R.demolish,mutate=R.aiMutate;let aiMutation=0;
  R.aiMutate=action=>{aiMutation++;try{return mutate(action);}finally{aiMutation--;}};
  R.demolish=(...args)=>R.spectator.active&&!aiMutation?false:demolish(...args);
  document.addEventListener('keydown',e=>{
    if(!R.spectator.active||e.target.closest('input,select,textarea'))return;
    if(e.code==='Space'){e.preventDefault();e.stopImmediatePropagation();R.$('#pauseBtn').click();return;}
    if(/^Digit|^Numpad/.test(e.code)||['KeyQ','KeyW','KeyE','KeyR','KeyG','Delete','Backspace'].includes(e.code)){e.preventDefault();e.stopImmediatePropagation();}
  },true);
  const test=R.roadStartTest;R.roadStartTest=(...args)=>{R.spectator.active=false;document.body.classList.remove('spectator-mode');return test(...args);};
  window.__ROADLORDS_ROAD__.startTest=R.roadStartTest;
  R.stopSpectator=()=>{
    if(!R.spectator.active)return;
    R.spectator.active=false;document.body.classList.remove('spectator-mode');
    Object.assign(R.state,{running:false,time:0,ended:false,modal:false,pregame:false,startChoices:4,startPickTimer:0,pendingChoices:[],choiceContext:null,units:[],unitSerial:1,timedPickCount:0,nextPick:R.PICK_BASE_SECONDS,selectedBuild:null,selectedBuilding:null});
    R.MP.started=false;R.MP.role=null;R.acc=0;
    Object.assign(R.ROAD,{test:false,paused:false,clock:0,pending:[],dead:[],result:''});
    for(const c of [R.P,R.E]){R.roadResetCity(c,c.race);R.generateTerrain(c,12);R.recomputeCity(c,false);}
    R.towers.forEach((t,i)=>Object.assign(t,structuredClone(originalTowers[i])));R.roadReindex();R.roadRefreshFrontiers();
    R.$('#endOverlay').classList.add('hidden');R.renderStatic();R.updateHud();
  };
  document.addEventListener('click',e=>{if(e.target.closest('#mpSolo,#mpOpenMulti,#mpCreateRoom,#mpJoinRoom'))R.stopSpectator();},true);
  for(const key of ['mpCreateRoom','mpJoinRoom','mpStartSolo']){
    const original=R[key];R[key]=(...args)=>{R.stopSpectator();return original(...args);};
  }
}
