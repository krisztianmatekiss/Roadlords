// Reuse the original counter/portrait nodes so normal play and multiplayer keep
// updating the same UI. Nothing is cloned and no second game state is created.
export function installBattleLayout(R) {
  const dock=document.createElement('section');dock.id='armyDock';dock.setAttribute('aria-label','Helyőrség és sereg');
  const switcher=document.createElement('div');switcher.className='armyDockTabs';
  switcher.innerHTML='<button type="button" data-army-view="player" aria-pressed="true">Saját</button><button type="button" data-army-view="enemy" aria-pressed="false">Ellenfél</button>';
  dock.appendChild(switcher);
  const teams=[];
  for(const [index,side] of ['player','enemy'].entries()) {
    const zone=R.roadWorld.querySelectorAll('.cityzone')[index],head=zone.querySelector('.cityhead'),foot=zone.querySelector('.cityfoot'),frame=zone.querySelector('.cityframe');
    zone.dataset.side=side;
    const pane=document.createElement('div');pane.className='armyDockTeam';pane.dataset.side=side;pane.hidden=index===1;
    const reserve=document.createElement('section');reserve.className='armyDockGroup reserveGroup';
    const army=document.createElement('section');army.className='armyDockGroup fieldGroup';
    reserve.innerHTML='<small>HELYŐRSÉG</small>';army.innerHTML='<small>SEREG</small>';
    reserve.append(foot.querySelector('.stack'),foot.querySelector('.reservemix'));
    const bar=foot.querySelector('.bar');if(bar)reserve.appendChild(bar);
    const oldArmy=head.querySelector('.cityarmy');army.append(oldArmy.querySelector('b'),oldArmy.querySelector('.unitmix'));oldArmy.remove();
    pane.append(reserve,army);dock.appendChild(pane);teams.push(pane);
    const identity=document.createElement('div');identity.className='capitalIdentity';
    const title=document.createElement('small');title.textContent=index?'ELLENSÉGES VÁROS':'SAJÁT VÁROS';identity.appendChild(title);
    const name=R.$(index?'#enemyNameTag':'#playerNameTag');if(name)identity.appendChild(name);
    const health=document.createElement('div');health.className='capitalHealth';health.setAttribute('role','progressbar');health.setAttribute('aria-label',index?'Ellenséges főváros életereje':'Saját főváros életereje');
    health.innerHTML='<div class="capitalHealthTrack"><i></i></div><div class="capitalHealthText"></div>';
    const hp=head.querySelector('.cityhp');health.querySelector('.capitalHealthText').appendChild(hp);
    frame.append(identity,health);
  }
  switcher.querySelectorAll('button').forEach(button=>button.onclick=()=>{
    teams.forEach(pane=>pane.hidden=pane.dataset.side!==button.dataset.armyView);
    switcher.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
  });
  dock.appendChild(R.roadHud);
  R.$('#app').insertBefore(dock,R.$('.command'));
  R.updateBattleDock=function updateBattleDock(){
    for(const [index,side] of ['player','enemy'].entries()){
      const city=index?R.E:R.P,zone=R.roadWorld.querySelector(`.cityzone[data-side="${side}"]`),health=zone.querySelector('.capitalHealth');
      const percent=R.clamp(city.hp/Math.max(1,city.maxHp),0,1);
      health.querySelector('i').style.width=percent*100+'%';
      health.setAttribute('aria-valuemin','0');health.setAttribute('aria-valuemax',String(city.maxHp));health.setAttribute('aria-valuenow',String(Math.ceil(city.hp)));
      R.$(index?'#enemyHp':'#playerHp').textContent=Math.ceil(city.hp);
      const units=R.state.units.filter(u=>u.alive&&u.side===side);
      R.$(index?'#enemyArmy':'#playerArmy').textContent=`${R.fieldUnitCount(city)} / ${city.armyCap}`;
      R.$(index?'#enemyGarrison':'#garrisonCount').textContent=`${R.reserveCount(city)} / ${city.garrisonCap}`;
      R.updateUnitMix(index?'enemyArmyMix':'playerArmyMix',units);
      R.updateUnitMix(index?'enemyGarrisonMix':'playerGarrisonMix',[...city.garrison,...city.releaseQueue]);
    }
  };
  R.updateBattleDock();
}
