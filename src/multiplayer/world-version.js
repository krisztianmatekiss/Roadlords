// Coordinates are mirrored locally, so peers must agree on the road length.
export function installWorldVersion(R) {
  const send=R.mpSend,handle=R.mpHandle;
  R.mpSend=data=>send(data?.type==='hello'?{...data,pathLength:R.PATH_LENGTH,gameRules:2}:data);
  R.mpHandle=data=>{
    if(data?.type==='hello'&&(data.pathLength??4800)!==R.PATH_LENGTH){
      const message='Eltérő pályaverzió. Mindkét játékos frissítse a játékot: Ctrl+F5.';
      R.mpLobbyError(message);R.mpSetStatus(message,'error');R.MP.conn?.close();return;
    }
    if(data?.type==='hello'&&data.gameRules!==2){
      const message='Eltérő játékverzió. Mindkét játékos frissítse a játékot: Ctrl+F5.';
      R.mpLobbyError(message);R.mpSetStatus(message,'error');R.MP.conn?.close();return;
    }
    return handle(data);
  };
  Object.assign(window.__ROADLORDS__,{mpSend:R.mpSend,mpHandle:R.mpHandle});
  window.__ROADLORDS_ROAD__.handle=R.mpHandle;
}
