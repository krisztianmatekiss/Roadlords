const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox','--disable-dev-shm-usage']});
 try{
  const p=await browser.newPage({viewport:{width:1800,height:1200}}),errors=[];await p.route('https://**/*',r=>r.abort());p.on('pageerror',e=>errors.push(e.message));
  await p.goto(process.env.ROADLORDS_TEST_URL||'http://127.0.0.1:4173/Roadlords/');
  const result=await p.evaluate(async()=>{
   const R=__ROADLORDS_RUNTIME__;
   await Promise.all(['HumanInfantry','Archer','Knight','Catapult','HumanCasters','OrcWarrior','OrcRaiders','OrcMystics','OrcSiege','Undead','Skeleton'].map(n=>R['load'+n+'Art']()));
   R.roadStartTest(42,{count:100,roster:'orcs-humans'});R.roadPause();R.ROAD.test=false;R.ROAD.figureStyle='painted';R.ROAD.lowDetail=false;
   const Q=R.ROAD,units=[],gallery=[],bad=[];
   const factions={human:['swordsman','spearman','archer','knight','priest','catapult','mage'],orc:['orc_warrior','orc_berserker','orc_goblin','orc_shaman','orc_warg','orc_troll','orc_ram'],undead:['und_skeleton','und_skeleton_archer','und_zombie','und_ghost','und_necromancer','und_vampire','und_lich']};
   const pairs=rig=>rig.arms?Object.entries(rig.arms):rig.reinsArm?[['weapon',rig.arm],['reins',rig.reinsArm]]:rig.shoulders?rig.shoulders.map((shoulder,i)=>[String(i),{shoulder,elbow:rig.elbows[i],wrist:(rig.wrists||rig.hands)[i]}]):[];
   const distance=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
   for(const[race,keys]of Object.entries(factions)){
    R.roadResetCity(R.P,race);R.recomputeCity(R.P,false);R.state.units=[];
    const canvas=document.createElement('canvas');canvas.width=1800;canvas.height=keys.length*270+70;const g=canvas.getContext('2d');g.fillStyle='#172e25';g.fillRect(0,0,canvas.width,canvas.height);g.font='22px Georgia';g.fillStyle='#ead4a5';g.fillText(race+' · idle / walk / wind-up / contact / recovery / mirrored contact',20,30);
    for(const[row,key]of keys.entries()){
     const u=R.releaseUnit(R.P,{key}),variants=key==='orc_berserker'?['far','near']:key==='orc_warg'?['melee','throw']:key==='orc_goblin'?['sling','bow']:['base'];
     let painted=0,arms=0,poses=0,minAngle=Math.PI;const baseline=new Map();
     for(const variant of variants){
      if(key==='orc_goblin'){if(variant==='bow')R.P.legends.add('orc_gob_bow');else R.P.legends.delete('orc_gob_bow');}
      const states=[['idle',1],['walk',8],['attack',12],['death',6],...(key==='priest'?[['heal',6]]:[]),...(['und_necromancer','und_lich'].includes(key)?[['summon',6]]:[]),...(key==='und_lich'?[['channel',8]]:[])];
      for(const[state,count]of states)for(let frame=0;frame<count;frame++){
       Q.clock=10;Q.sprites.clear();const actor={...u,lane:Q.camera+400,offset:0,roadFace:1,roadMoving:state==='walk',roadWalk:(frame+.1)/8*Math.PI*2-u.id*.73,roadAttacks:variant==='near'?1:0,roadAttack:null,death:10-(frame+.1)/6*.6};
       if(state==='attack'){actor.roadAttack={start:9,launch:10,hit:10,end:10.4,recovery:.4,to:actor.lane+35,orcSpear:variant==='throw'};Q.clock=frame<4?9+(frame+.1)/4*.915:frame<7?9.915+(frame-4+.1)/3*.085:10+(frame-7+.1)/5*.4;}
       if(state==='heal'){actor.roadHeal={start:10-(frame+.1)*.1,end:10.6-(frame+.1)*.1};}
       if(state==='channel'){actor.undBeams=[{}];Q.clock=10+frame*.2;}
       if(state==='summon')actor.roadUndSummon={start:10-(frame+.1)/6*.75,end:10+(6-frame-.1)/6*.75};
       R.roadDrawUnit(actor,state==='death');const sprite=[...Q.sprites.values()][0],rig=sprite?.figureRig;
       if(!rig?.painted){bad.push({key,state,frame,variant,reason:'missing approved model'});continue;}painted++;poses++;
       for(const[side,a]of pairs(rig)){
        if(![a.shoulder,a.elbow,a.wrist].every(v=>Array.isArray(v)&&v.every(Number.isFinite))){bad.push({key,state,frame,variant,reason:'invalid arm chain',side});continue;}
        const lengths=[distance(a.shoulder,a.elbow),distance(a.elbow,a.wrist)],id=variant+':'+side;baseline.has(id)||baseline.set(id,lengths);
        if(lengths.some((n,i)=>Math.abs(n-baseline.get(id)[i])>1e-4))bad.push({key,state,frame,variant,side,reason:'stretching arm',lengths,baseline:baseline.get(id)});
        const d=distance(a.shoulder,a.wrist),angle=Math.acos(Math.max(-1,Math.min(1,(lengths[0]**2+lengths[1]**2-d*d)/(2*lengths[0]*lengths[1]))));minAngle=Math.min(minAngle,angle);arms++;
        if(state!=='death'&&angle<.25)bad.push({key,state,frame,variant,side,reason:'folded inside elbow',angle});
       }
       const columns=variant===variants[0]?(state==='idle'?[0]:state==='walk'&&frame===2?[1]:state==='attack'&&frame===3?[2]:state==='attack'&&frame===6?[3,5]:state==='attack'&&frame===9?[4]:[]):[];
       for(const col of columns){const b=sprite.figureBounds,x=150+col*300,y=325+row*270,scale=3.1;g.fillStyle='#ead4a5';g.font='17px Georgia';g.fillText(key,15+col*300,y-235);g.save();g.translate(x,y);if(col===5)g.scale(-1,1);g.drawImage(sprite,b[0]*scale,b[1]*scale,b[2]*scale,b[3]*scale);g.restore();}
      }
     }
     units.push({key,painted,poses,arms,minAngle});
    }gallery.push({race,png:canvas.toDataURL()});
   }return{units,gallery,bad};
  });
  fs.mkdirSync('artifacts',{recursive:true});for(const row of result.gallery)fs.writeFileSync('artifacts/anatomy-'+row.race+'.png',Buffer.from(row.png.split(',')[1],'base64'));delete result.gallery;
  fs.writeFileSync('artifacts/unit-anatomy.json',JSON.stringify({...result,errors},null,2));
  assert.equal(result.units.length,21);assert(result.units.every(u=>u.painted>=27));assert(!result.bad.length,JSON.stringify(result.bad.slice(0,6))); assert.deepEqual(errors,[]);
  console.log('PASS All 21 approved models render complete idle, walking, attack and death sequences, with all weapon variants');
  console.log('PASS Every segmented arm retains its bone lengths and avoids collapsed elbows, including healing and summoning poses');
  console.log('PASS Mirrored contact galleries cover all factions; no browser errors');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
