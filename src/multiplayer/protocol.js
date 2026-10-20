import { assetUrl } from '../assets/urls.js';
export function register(runtime) {
  runtime.mpPack = function mpPack(value) {
    return JSON.parse(JSON.stringify(value, (key, item) => item instanceof Set ? {
      $set: [...item]
    } : item instanceof Map ? {
      $map: [...item]
    } : item));
  };
  runtime.mpRevive = function mpRevive(value) {
    if (!value || typeof value !== 'object') return value;
    if (Array.isArray(value)) return value.map(runtime.mpRevive);
    if (Object.keys(value).length === 1 && Array.isArray(value.$set)) return new Set(value.$set.map(runtime.mpRevive));
    if (Object.keys(value).length === 1 && Array.isArray(value.$map)) return new Map(value.$map.map(([k, v]) => [runtime.mpRevive(k), runtime.mpRevive(v)]));
    const out = {};
    for (const [k, v] of Object.entries(value)) out[k] = runtime.mpRevive(v);
    return out;
  };
  runtime.mpSend = function mpSend(data) {
    if (runtime.MP.conn?.open) runtime.MP.conn.send(data);
  };
  runtime.mpStrategy = function mpStrategy(c) {
    const out = {};
    for (const key of runtime.MP_STRATEGY_KEYS) if (key in c) out[key] = c[key];
    return runtime.mpPack(out);
  };
  runtime.mpAssignFields = function mpAssignFields(target, packed) {
    const source = runtime.mpRevive(packed);
    for (const [key, value] of Object.entries(source)) target[key] = value;
  };
  runtime.mpStrategySignature = function mpStrategySignature(data) {
    return JSON.stringify(data);
  };
  runtime.mpSendStrategy = function mpSendStrategy(force = false) {
    if (!runtime.MP.enabled || runtime.MP.role !== 'guest' || runtime.MP.applying) return;
    const data = runtime.mpStrategy(runtime.P),
      signature = runtime.mpStrategySignature(data);
    if (!force && signature === runtime.MP.lastStrategySignature) return;
    runtime.MP.lastStrategySignature = signature;
    const seq = ++runtime.MP.strategySeq;
    runtime.MP.pendingStrategy = {
      seq,
      data
    };
    runtime.mpSend({
      type: 'strategy',
      seq,
      data
    });
  };
  runtime.mpApplyGuestStrategy = function mpApplyGuestStrategy(data, seq) {
    if (runtime.MP.role !== 'host') return;
    const oldGate = runtime.E.gateMode,
      oldRally = runtime.E.rallyMode;
    runtime.mpAssignFields(runtime.E, data);
    runtime.E.isEnemy = true;
    if (runtime.E.gateMode !== oldGate) {
      if (runtime.E.gateMode === 'open') runtime.openWave(runtime.E);else if (runtime.E.gateMode === 'auto' && runtime.E.autoReleasing) runtime.openWave(runtime.E);
    }
    if (runtime.E.rallyMode === 'open' && oldRally !== 'open') runtime.releaseRally(runtime.E);
    runtime.recomputeCity(runtime.E, true);
    runtime.refreshExistingUnitsForCity(runtime.E);
    runtime.refreshTowerHpFor(runtime.E, 'enemy', true);
    runtime.MP.lastGuestSeq = Math.max(runtime.MP.lastGuestSeq, Number(seq) || 0);
    runtime.mpSendSnapshot();
  };
  runtime.mpCitySnapshot = function mpCitySnapshot(c) {
    return runtime.mpPack(c);
  };
  runtime.mpSharedState = function mpSharedState() {
    const out = {};
    for (const key of ['time', 'running', 'ended', 'speed', 'nextPick', 'timedPickCount', 'unitSerial', 'suddenDeath', 'suddenDeathStarted', 'startPickTimer']) if (key in runtime.state) out[key] = runtime.state[key];
    return out;
  };
  runtime.mpSendSnapshot = function mpSendSnapshot() {
    if (runtime.MP.role !== 'host' || !runtime.MP.peer) return;
    runtime.mpSend({
      type: 'snapshot',
      guestSeq: runtime.MP.lastGuestSeq,
      player: runtime.mpCitySnapshot(runtime.P),
      enemy: runtime.mpCitySnapshot(runtime.E),
      shared: runtime.mpPack(runtime.mpSharedState()),
      units: runtime.mpPack(runtime.state.units),
      towers: runtime.mpPack(runtime.towers),
      capitalTowers: runtime.mpPack(runtime.capitalTowers)
    });
  };
  runtime.mpMirrorSide = function mpMirrorSide(side) {
    return side === 'player' ? 'enemy' : side === 'enemy' ? 'player' : side;
  };
  runtime.mpMirrorUnit = function mpMirrorUnit(unit) {
    const out = runtime.mpRevive(unit);
    out.side = runtime.mpMirrorSide(out.side);
    out.lane = runtime.PATH_LENGTH - out.lane;
    out.offset = -(out.offset || 0);
    return out;
  };
  runtime.mpMirrorTower = function mpMirrorTower(tower) {
    const out = runtime.mpRevive(tower);
    out.side = runtime.mpMirrorSide(out.side);
    out.lane = runtime.PATH_LENGTH - out.lane;
    return out;
  };
  runtime.mpReplaceCity = function mpReplaceCity(target, packed, isEnemy) {
    const source = runtime.mpRevive(packed);
    for (const [key, value] of Object.entries(source)) target[key] = value;
    target.isEnemy = isEnemy;
  };
  runtime.mpApplyUnitTargets = function mpApplyUnitTargets(packed) {
    const targets = runtime.mpRevive(packed).map(runtime.mpMirrorUnit),
      current = new Map(runtime.state.units.map(u => [u.id, u])),
      next = [];
    runtime.MP.unitTargets = new Map();
    for (const target of targets) {
      runtime.MP.unitTargets.set(target.id, target);
      const unit = current.get(target.id);
      if (!unit) {
        next.push(target);
        continue;
      }
      const lane = unit.lane,
        offset = unit.offset,
        hp = unit.hp,
        shield = unit.shield,
        tempShield = unit.tempShield;
      Object.assign(unit, target);
      unit.lane = lane;
      unit.offset = offset;
      unit.hp = hp;
      unit.shield = shield;
      unit.tempShield = tempShield;
      next.push(unit);
    }
    runtime.state.units = next;
  };
  runtime.mpShowEnd = function mpShowEnd() {
    if (!runtime.state.ended) return;
    const win = runtime.P.hp > 0 && runtime.E.hp <= 0;
    runtime.$('#endIcon').textContent = win ? '♛' : '☠';
    runtime.$('#endTitle').textContent = win ? 'Győzelem!' : 'A fővárosod elesett';
    runtime.$('#endText').textContent = `Idő: ${runtime.fmt(runtime.state.time)} · Saját választások: ${runtime.P.pickCount} · Ellenfél választásai: ${runtime.E.pickCount}`;
    runtime.$('#endOverlay').classList.remove('hidden');
  };
  runtime.mpUiCitySignature = function mpUiCitySignature(c) {
    return JSON.stringify({
      terrain: (c.terrain || []).map(t => t?.type || null),
      buildings: c.buildings.map(b => ({
        id: b.id,
        type: b.type,
        level: b.level,
        row: b.row,
        col: b.col,
        rotation: b.rotation || 0,
        inactive: !!b.inactive
      })),
      unlocked: [...(c.unlocked || [])].sort(),
      levels: c.levels || {},
      branches: c.l4Branches || {},
      warMode: c.warMode || '',
      rallyMode: c.rallyMode || '',
      marketRoutes: c.marketRoutes || []
    });
  };
  runtime.mpUiSignature = function mpUiSignature() {
    return runtime.mpUiCitySignature(runtime.P) + '§' + runtime.mpUiCitySignature(runtime.E);
  };
  runtime.mpApplySnapshot = function mpApplySnapshot(data) {
    if (runtime.MP.role !== 'guest') return;
    const beforeUi = runtime.mpUiSignature();
    runtime.MP.applying = true;
    try {
      runtime.mpReplaceCity(runtime.P, data.enemy, false);
      runtime.mpReplaceCity(runtime.E, data.player, true);
      const ack = Number(data.guestSeq) || 0;
      if (runtime.MP.pendingStrategy && ack < runtime.MP.pendingStrategy.seq) runtime.mpAssignFields(runtime.P, runtime.MP.pendingStrategy.data);else if (runtime.MP.pendingStrategy && ack >= runtime.MP.pendingStrategy.seq) runtime.MP.pendingStrategy = null;
      runtime.mpApplyUnitTargets(data.units);
      const shared = runtime.mpRevive(data.shared);
      for (const [key, value] of Object.entries(shared)) runtime.state[key] = value;
      runtime.towers.splice(0, runtime.towers.length, ...runtime.mpRevive(data.towers).map(runtime.mpMirrorTower));
      runtime.capitalTowers.splice(0, runtime.capitalTowers.length, ...runtime.mpRevive(data.capitalTowers).map(runtime.mpMirrorTower));
      runtime.MP.lastStrategySignature = runtime.mpStrategySignature(runtime.mpStrategy(runtime.P));
      runtime.MP.applying = false;
      if (beforeUi !== runtime.mpUiSignature()) runtime.renderStatic();
      runtime.updateHud();
      runtime.updateProgress();
      runtime.drawGate();
      runtime.mpShowEnd();
    } finally {
      runtime.MP.applying = false;
    }
  };
  runtime.mpSetStatus = function mpSetStatus(text, tone = 'wait') {
    if (!runtime.MP.status) return;
    runtime.MP.status.querySelector('.mpText').textContent = text;
    runtime.MP.status.dataset.tone = tone;
  };
  runtime.mpInstallPanel = function mpInstallPanel() {
    const style = document.createElement('style');
    style.textContent = "@import url(\"" + (assetUrl("styles/features/multiplayer-protocol-1.css") + "\");");
    document.head.appendChild(style);
    const panel = document.createElement('div');
    panel.className = 'mpStatus';
    panel.innerHTML = '<span class="mpDot"></span><span class="mpText">P2P kapcsolat</span><button type="button">KÓD MÁSOLÁSA</button>';
    document.body.appendChild(panel);
    runtime.MP.status = panel;
    panel.querySelector('button').onclick = () => runtime.mpCopyCode();
    const lobby = document.createElement('div');
    lobby.className = 'mpLobby';
    lobby.innerHTML = `<section class="mpLobbyCard"><header class="menuBrand"><h2>ROADLORDS</h2><div class="menuStartHint">KATTINTS AZ INDÍTÁSHOZ</div></header><div class="mpLobbyGrid"><div class="menuMain"><button id="mpSolo" class="menuButton primary" type="button">EGYJÁTÉKOS</button><button id="mpOpenMulti" class="menuButton" type="button">TÖBBJÁTÉKOS</button></div><div class="menuMulti"><button id="mpCreateRoom" class="menuButton primary" type="button">SZOBA LÉTREHOZÁSA</button><div class="joinPane"><input id="mpJoinCode" maxlength="5" placeholder="SZOBAKÓD"><button id="mpJoinRoom" type="button">CSATLAKOZÁS</button></div><button id="mpMenuBack" class="menuButton menuBack" type="button">VISSZA</button></div></div><div class="mpRoomWait"><small>SZOBÁD KÓDJA</small><b class="mpRoomCode">-----</b><button id="mpCopyRoom" type="button">KÓD MÁSOLÁSA</button><small class="mpWaitText">VÁRAKOZÁS A MÁSODIK JÁTÉKOSRA…</small></div><div class="mpLobbyError"></div><footer class="menuVersion">V4.9.7 · P2P</footer></section>`;
    document.body.appendChild(lobby);
    runtime.MP.lobby = lobby;
    const menuMain = lobby.querySelector('.menuMain'),
      menuMulti = lobby.querySelector('.menuMulti');
    lobby.classList.add('intro-pending');
    const revealIntro = () => {
      if (!lobby.classList.contains('intro-pending')) return;
      lobby.classList.remove('intro-pending');
      lobby.classList.add('intro-revealing');
      setTimeout(() => {
        lobby.classList.remove('intro-revealing');
        lobby.classList.add('intro-ready');
      }, 850);
    };
    lobby.addEventListener('click', e => {
      if (lobby.classList.contains('intro-pending')) {
        e.preventDefault();
        revealIntro();
        return;
      }
    }, true);
    lobby.addEventListener('keydown', e => {
      if (!lobby.classList.contains('intro-pending')) return;
      if (e.key === 'Enter' || e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        revealIntro();
      }
    });
    lobby.tabIndex = 0;
    setTimeout(() => lobby.focus({
      preventScroll: true
    }), 0);
    lobby.querySelector('#mpOpenMulti').onclick = () => {
      menuMain.style.display = 'none';
      menuMulti.style.display = 'grid';
      runtime.mpLobbyError('');
      lobby.querySelector('#mpJoinCode').focus();
    };
    lobby.querySelector('#mpMenuBack').onclick = () => {
      menuMulti.style.display = 'none';
      menuMain.style.display = 'grid';
      runtime.mpLobbyError('');
    };
    lobby.querySelector('#mpCreateRoom').onclick = runtime.mpCreateRoom;
    lobby.querySelector('#mpJoinRoom').onclick = () => runtime.mpJoinRoom(lobby.querySelector('#mpJoinCode').value);
    lobby.querySelector('#mpJoinCode').onkeydown = e => {
      if (e.key === 'Enter') runtime.mpJoinRoom(e.currentTarget.value);
    };
    lobby.querySelector('#mpCopyRoom').onclick = () => runtime.mpCopyCode();
    lobby.querySelector('#mpSolo').onclick = runtime.mpStartSolo;
  };
  runtime.mpCopyCode = function mpCopyCode() {
    const code = runtime.MP.room || '';
    if (!code) return;
    try {
      navigator.clipboard?.writeText(code);
      runtime.mpSetStatus(`Szoba ${code} · kód kimásolva`, runtime.MP.peer ? 'ok' : 'wait');
    } catch {
      prompt('Másold ki a szobakódot:', code);
    }
  };
  runtime.mpLobbyError = function mpLobbyError(text) {
    const el = runtime.MP.lobby?.querySelector('.mpLobbyError');
    if (el) el.textContent = text;
  };
  runtime.mpRandomCode = function mpRandomCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    return Array.from({
      length: 5
    }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  };
  runtime.mpStartMatch = function mpStartMatch() {
    if (runtime.MP.started) return;
    runtime.mpHandle({
      type: 'start'
    });
    runtime.mpSend({
      type: 'start'
    });
  };
  runtime.mpHandle = function mpHandle(data) {
    if (data.type === 'ready') {
      runtime.MP.opponentReady = true;
      runtime.mpSetStatus(`Szoba ${runtime.MP.room} · az ellenfél elkészült`, 'ok');
      if (runtime.MP.role === 'host' && runtime.MP.readySent) runtime.mpStartMatch();
    } else if (data.type === 'start') {
      runtime.MP.started = true;
      runtime.MP.guestChoicePending = false;
      runtime.state.running = true;
      runtime.state.modal = false;
      runtime.state.choiceContext = null;
      runtime.state.banMode = false;
      runtime.state.startChoices = 4;
      runtime.state.startPickTimer = 0;
      runtime.state.nextPick = runtime.PICK_BASE_SECONDS;
      runtime.$('#choiceOverlay').classList.add('hidden');
      runtime.$('#pickReminder').classList.add('hidden');
      runtime.$('#pauseBtn').classList.remove('on');
      runtime.$('#pauseBtn').textContent = 'Ⅱ';
      runtime.mpSetStatus(`Szoba ${runtime.MP.room} · kezdő épületválasztások`, 'ok');
    } else if (data.type === 'snapshot') runtime.mpApplySnapshot(data);else if (data.type === 'strategy') runtime.mpApplyGuestStrategy(data.data, data.seq);else if (data.type === 'event' && runtime.MP.role === 'guest' && data.event === 'choice') {
      const source = data.source || 'timer';
      runtime.queueChoice(source);
      runtime.mpSetStatus(source === 'start' ? 'Kezdő épületválasztás · a csata vár rád' : 'Válassz fejlesztést · a csata vár rád', 'wait');
    } else if (data.type === 'choice_done' && runtime.MP.role === 'host') {
      runtime.MP.guestChoicePending = false;
      runtime.mpSetStatus(`Szoba ${runtime.MP.room} · GAZDA`, 'ok');
      if (runtime.state.startChoices === 0) {
        if (runtime.state.pendingChoices.length && !runtime.state.modal) runtime.showChoice();
        const deferred = runtime.MP.deferredGuestChoices?.shift();
        if (deferred) {
          runtime.MP.guestChoicePending = true;
          runtime.mpSend({
            type: 'event',
            event: 'choice',
            source: deferred.source,
            forceNormal: deferred.forceNormal
          });
          runtime.mpSetStatus('Az ellenfél várakozó fejlesztést választ…', 'wait');
        }
      }
    } else if (data.type === 'error') {
      runtime.mpSetStatus(data.message || 'Kapcsolati hiba.', 'bad');
    }
  };
  runtime.mpAttachConnection = function mpAttachConnection(conn) {
    if (runtime.MP.conn?.open) {
      conn.close();
      return;
    }
    runtime.MP.conn = conn;
    conn.on('data', data => {
      try {
        runtime.mpHandle(data);
      } catch (error) {
        console.error('P2P üzenethiba', error);
      }
    });
    conn.on('open', () => {
      runtime.MP.connected = true;
      runtime.MP.peer = true;
      runtime.MP.status.style.display = 'flex';
      runtime.MP.lobby.style.display = 'none';
      runtime.mpSetStatus(`Szoba ${runtime.MP.room} · mindkét játékos bent`, 'ok');
      runtime.mpSend({
        type: 'hello',
        role: runtime.MP.role
      });
      if (runtime.MP.role === 'host') {
        clearInterval(runtime.MP.snapshotTimer);
        runtime.MP.snapshotTimer = setInterval(runtime.mpSendSnapshot, 80);
        runtime.mpSendSnapshot();
      }
    });
    conn.on('close', () => {
      runtime.MP.connected = false;
      runtime.MP.peer = false;
      runtime.MP.started = false;
      runtime.mpSetStatus('A másik játékos kilépett. Frissítsétek az oldalt.', 'bad');
    });
    conn.on('error', () => runtime.mpSetStatus('A P2P kapcsolat megszakadt.', 'bad'));
  };
  runtime.mpPeerErrors = function mpPeerErrors(peer) {
    peer.on('error', error => {
      const msg = error?.type === 'unavailable-id' ? 'Ez a szobakód éppen foglalt. Próbáld újra.' : error?.type === 'peer-unavailable' ? 'Nem található ilyen szoba. Ellenőrizd a kódot.' : 'Nem sikerült kapcsolódni. Próbáljátok újra.';
      runtime.mpLobbyError(msg);
      runtime.mpSetStatus(msg, 'bad');
    });
  };
  runtime.mpCreateRoom = function mpCreateRoom() {
    if (typeof Peer !== 'function') {
      runtime.mpLobbyError('A kapcsolódási könyvtár nem töltődött be. Ellenőrizd az internetet.');
      return;
    }
    runtime.MP.room = runtime.mpRandomCode();
    runtime.MP.role = 'host';
    runtime.mpLobbyError('');
    const wait = runtime.MP.lobby.querySelector('.mpRoomWait');
    wait.style.display = 'block';
    runtime.MP.lobby.querySelector('.mpRoomCode').textContent = runtime.MP.room;
    runtime.MP.lobby.querySelector('.mpWaitText').textContent = 'Várakozás a másik játékosra…';
    runtime.MP.lobby.querySelector('.mpLobbyGrid').style.display = 'none';
    runtime.MP.peerClient = new Peer(`roadlords-${runtime.MP.room.toLowerCase()}`);
    runtime.mpPeerErrors(runtime.MP.peerClient);
    runtime.MP.peerClient.on('open', () => {
      runtime.MP.connected = true;
      runtime.MP.status.style.display = 'flex';
      runtime.mpSetStatus(`Szoba ${runtime.MP.room} · várakozás az ellenfélre`, 'wait');
    });
    runtime.MP.peerClient.on('connection', runtime.mpAttachConnection);
  };
  runtime.mpJoinRoom = function mpJoinRoom(raw) {
    const code = String(raw || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 5);
    if (code.length !== 5) {
      runtime.mpLobbyError('Ötjegyű szobakódot írj be.');
      return;
    }
    if (typeof Peer !== 'function') {
      runtime.mpLobbyError('A kapcsolódási könyvtár nem töltődött be. Ellenőrizd az internetet.');
      return;
    }
    runtime.MP.room = code;
    runtime.MP.role = 'guest';
    runtime.mpLobbyError('Kapcsolódás…');
    runtime.MP.peerClient = new Peer();
    runtime.mpPeerErrors(runtime.MP.peerClient);
    runtime.MP.peerClient.on('open', () => {
      const conn = runtime.MP.peerClient.connect(`roadlords-${code.toLowerCase()}`, {
        reliable: true,
        serialization: 'binary'
      });
      runtime.mpAttachConnection(conn);
    });
  };
  runtime.mpStartSolo = function mpStartSolo() {
    runtime.MP.enabled = false;
    runtime.MP.role = 'solo';
    runtime.MP.started = true;
    runtime.MP.lobby.style.display = 'none';
    runtime.MP.status.style.display = 'none';
    runtime.mpGrantEnemyStarterPicks();
    runtime.renderStatic();
    runtime.message('Egyjátékos mód · az AI kezdőépületei elkészültek.');
  };
  runtime.mpConnect = function mpConnect() {
    runtime.mpInstallPanel();
    if (typeof Peer !== 'function') runtime.mpLobbyError('A PeerJS nem töltődött be. Internetkapcsolat szükséges az összekapcsolódáshoz.');
  };
  runtime.mpInterpolateUnits = function mpInterpolateUnits(dt) {
    if (!runtime.MP.enabled || runtime.MP.role !== 'guest' || !runtime.MP.unitTargets.size) return;
    const blend = 1 - Math.pow(.035, Math.max(0, Number(dt) || 0));
    for (const unit of runtime.state.units) {
      const target = runtime.MP.unitTargets.get(unit.id);
      if (!target) continue;
      for (const key of ['lane', 'offset', 'hp', 'shield', 'tempShield']) {
        const value = target[key];
        if (!Number.isFinite(value)) continue;
        unit[key] = Number.isFinite(unit[key]) ? unit[key] + (value - unit[key]) * blend : value;
      }
    }
  };
}
