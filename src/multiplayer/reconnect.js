import { assetUrl } from '../assets/urls.js';
export function initializeMultiplayerReconnect(runtime) {
  const RECONNECT_GRACE_MS = 30000;
  const RECONNECT_RETRY_MS = 1500;
  const HEARTBEAT_MS = 2000;
  const HEARTBEAT_TIMEOUT_MS = 10000;
  runtime.MP.reconnectV4975 = runtime.MP.reconnectV4975 || {
    active: false,
    expired: false,
    deadline: 0,
    reason: '',
    resumeRunning: false,
    retryTimer: null,
    countdownTimer: null,
    heartbeatTimer: null,
    lastRx: Date.now(),
    lastDialAt: 0,
    lastStateRx: Date.now(),
    stateRequestedAt: 0,
    stateError: null,
    stateRecovering: false
  };
  const R = runtime.MP.reconnectV4975;
  const style = document.createElement('style');
  style.textContent = "@import url(\"" + (assetUrl("styles/features/multiplayer-reconnect-35.css") + "\");");
  document.head.appendChild(style);
  const overlay = document.createElement('div');
  overlay.className = 'mpReconnectV4975';
  overlay.innerHTML = `<section class="mpReconnectCardV4975"><div class="netIcon">⌁</div><b>Kapcsolat helyreállítása…</b><p>A meccs megmarad. Automatikusan próbálunk visszacsatlakozni.</p><small></small><button type="button">ÚJRAPRÓBÁLÁS</button></section>`;
  document.body.appendChild(overlay);
  const card = overlay.querySelector('.mpReconnectCardV4975'),
    title = card.querySelector('b'),
    desc = card.querySelector('p'),
    small = card.querySelector('small'),
    retryBtn = card.querySelector('button');
  function clearTimer(name) {
    if (R[name]) {
      clearInterval(R[name]);
      clearTimeout(R[name]);
      R[name] = null;
    }
  }
  function clearRetryTimers() {
    clearTimer('retryTimer');
    clearTimer('countdownTimer');
  }
  function showReconnect() {
    overlay.classList.add('show');
    card.classList.toggle('expired', !!R.expired);
  }
  function hideReconnect() {
    overlay.classList.remove('show');
    card.classList.remove('expired');
  }
  function reconnectSeconds() {
    return Math.max(0, Math.ceil((R.deadline - Date.now()) / 1000));
  }
  function updateReconnectUI() {
    if (!R.active && !R.expired) return;
    showReconnect();
    if (R.expired) {
      title.textContent = 'A kapcsolat megszakadt';
      desc.textContent = 'A meccs állapota megmaradt. Próbáljatok újracsatlakozni, nem kell új szobát kezdeni.';
      small.textContent = `Szoba: ${runtime.MP.room || '—'}`;
      return;
    }
    title.textContent = 'Kapcsolat helyreállítása…';
    desc.textContent = 'A meccset ideiglenesen megállítottuk. Automatikusan próbálunk visszacsatlakozni.';
    small.textContent = `Még ${reconnectSeconds()} mp · Szoba: ${runtime.MP.room || '—'}`;
  }
  function ensurePeerSignaling() {
    const peer = runtime.MP.peerClient;
    if (!peer || peer.destroyed) return false;
    if (peer.disconnected && typeof peer.reconnect === 'function') {
      try {
        peer.reconnect();
      } catch (_e) {}
    }
    return !!peer.open;
  }
  function stopHeartbeat() {
    clearTimer('heartbeatTimer');
  }
  function startHeartbeat(conn) {
    stopHeartbeat();
    R.lastRx = Date.now();
    R.lastStateRx = Date.now();
    R.stateRequestedAt = 0;
    R.heartbeatTimer = setInterval(() => {
      if (runtime.MP.conn !== conn || !conn?.open) return;
      const now = Date.now();
      if (runtime.MP.role === 'guest' && runtime.MP.started && now - R.lastStateRx > 2500) {
        if (!R.stateRecovering) {
          R.stateRecovering = true;
          runtime.mpSetStatus('Állapotszinkronizálás…', 'wait');
        }
        if (!R.stateRequestedAt || now - R.stateRequestedAt >= 2000) {
          R.stateRequestedAt = now;
          try {
            conn.send({
              type: 'state_request_v41128'
            });
          } catch (_e) {}
        }
        if (now - R.lastStateRx > 10000) {
          try {
            conn.close();
          } catch (_e) {}
          ;
          return;
        }
      }
      if (now - R.lastRx > HEARTBEAT_TIMEOUT_MS) {
        try {
          conn.close();
        } catch (_e) {}
        ;
        return;
      }
      try {
        conn.send({
          type: 'net_ping_v4975',
          t: now
        });
      } catch (_e) {}
    }, HEARTBEAT_MS);
  }
  function expireReconnect() {
    if (!R.active) return;
    R.active = false;
    R.expired = true;
    clearRetryTimers();
    stopHeartbeat();
    runtime.MP.connected = false;
    runtime.MP.peer = false;
    runtime.state.running = false;
    updateReconnectUI();
    runtime.mpSetStatus?.('Kapcsolat megszakadt · a meccs megmaradt, újrapróbálható', 'bad');
  }
  function dialGuest() {
    if (!R.active || runtime.MP.role !== 'guest' || Date.now() >= R.deadline) return;
    let peer = runtime.MP.peerClient;
    if (!peer || peer.destroyed) {
      if (typeof Peer !== 'function') return;
      peer = runtime.MP.peerClient = new Peer();
      runtime.mpPeerErrors(peer);
      peer.on('open', () => {
        if (R.active) dialGuest();
      });
      return;
    }
    ensurePeerSignaling();
    if (!peer.open) return;
    if (runtime.MP.conn?.open) return;
    const now = Date.now();
    if (now - R.lastDialAt < RECONNECT_RETRY_MS - 100) return;
    R.lastDialAt = now;
    try {
      if (runtime.MP.conn && !runtime.MP.conn.open) runtime.MP.conn.close();
    } catch (_e) {}
    try {
      const conn = peer.connect(`roadlords-${String(runtime.MP.room || '').toLowerCase()}`, {
        reliable: true,
        serialization: 'binary'
      });
      runtime.mpAttachConnection(conn);
    } catch (_e) {}
  }
  function beginReconnect(reason = 'Kapcsolati hiba', preserveResume = false) {
    if (!runtime.MP.enabled || !runtime.MP.started || !['host', 'guest'].includes(runtime.MP.role)) return;
    if (!R.active) {
      const previousResume = R.resumeRunning;
      R.active = true;
      R.expired = false;
      R.reason = reason;
      R.deadline = Date.now() + RECONNECT_GRACE_MS;
      R.resumeRunning = preserveResume ? previousResume : !!runtime.state.running;
      runtime.state.running = false;
    }
    clearRetryTimers();
    stopHeartbeat();
    runtime.MP.connected = false;
    runtime.MP.peer = false;
    updateReconnectUI();
    runtime.mpSetStatus?.('Kapcsolat megszakadt · újracsatlakozás…', 'wait');
    R.countdownTimer = setInterval(() => {
      if (!R.active) return;
      if (Date.now() >= R.deadline) {
        expireReconnect();
        return;
      }
      updateReconnectUI();
    }, 250);
    R.retryTimer = setInterval(() => {
      if (!R.active) return;
      if (Date.now() >= R.deadline) {
        expireReconnect();
        return;
      }
      ensurePeerSignaling();
      if (runtime.MP.role === 'guest') dialGuest();
    }, RECONNECT_RETRY_MS);
    ensurePeerSignaling();
    if (runtime.MP.role === 'guest') dialGuest();
  }
  function finishReconnectUI() {
    R.active = false;
    R.expired = false;
    clearRetryTimers();
    hideReconnect();
    runtime.mpSetStatus?.(`Szoba ${runtime.MP.room} · kapcsolat helyreállt`, 'ok');
    runtime.toast('Kapcsolat helyreállt.');
  }
  retryBtn.onclick = () => {
    if (!runtime.MP.started || !runtime.MP.room) return;
    R.active = false;
    beginReconnect('Kézi újracsatlakozás', true);
  };
  runtime.mpPeerErrors = function (peer) {
    peer.on('error', error => {
      if (runtime.MP.started && ['host', 'guest'].includes(runtime.MP.role)) {
        console.warn('P2P átmeneti hiba', error?.type || error);
        if (!runtime.MP.conn?.open) beginReconnect(error?.type || 'P2P hiba');
        return;
      }
      const msg = error?.type === 'unavailable-id' ? 'Ez a szobakód éppen foglalt. Próbáld újra.' : error?.type === 'peer-unavailable' ? 'Nem található ilyen szoba. Ellenőrizd a kódot.' : 'Nem sikerült kapcsolódni. Próbáljátok újra.';
      runtime.mpLobbyError(msg);
      runtime.mpSetStatus(msg, 'bad');
    });
    peer.on?.('disconnected', () => {
      if (runtime.MP.started && !runtime.MP.conn?.open) beginReconnect('Jelzőkapcsolat megszakadt');else ensurePeerSignaling();
    });
  };
  runtime.mpAttachConnection = function (conn) {
    const previous = runtime.MP.conn;
    if (runtime.MP.started && runtime.MP.role === 'host' && previous !== conn && !R.active && !R.expired) beginReconnect('Ellenfél újracsatlakozik');
    if (previous?.open && previous !== conn) {
      if (runtime.MP.started && runtime.MP.role === 'host') {
        runtime.MP.conn = conn;
        try {
          previous.close();
        } catch (_e) {}
      } else {
        try {
          conn.close();
        } catch (_e) {}
        ;
        return;
      }
    } else runtime.MP.conn = conn;
    conn.on('data', data => {
      if (runtime.MP.conn !== conn) return;
      R.lastRx = Date.now();
      try {
        if (data?.type === 'state_request_v41128' && runtime.MP.role === 'host') {
          runtime.mpSendSnapshot(true);
          return;
        }
        if (data?.type === 'net_ping_v4975') {
          try {
            conn.send({
              type: 'net_pong_v4975',
              t: data.t
            });
          } catch (_e) {}
          ;
          return;
        }
        if (data?.type === 'net_pong_v4975') return;
        if (data?.type === 'reconnect_ready_v4975' && runtime.MP.role === 'host') {
          if (R.active || R.expired) {
            R.expired = false;
            runtime.MP.connected = true;
            runtime.MP.peer = true;
            runtime.mpSendSnapshot(true);
            runtime.state.running = !!R.resumeRunning && !runtime.state.ended;
            runtime.mpSend({
              type: 'reconnect_resume_v4975',
              running: !!runtime.state.running
            });
            runtime.mpSendSnapshot(true);
            finishReconnectUI();
            startHeartbeat(conn);
          }
          return;
        }
        if (data?.type === 'reconnect_resume_v4975' && runtime.MP.role === 'guest') {
          runtime.state.running = !!data.running;
          finishReconnectUI();
          startHeartbeat(conn);
          return;
        }
        runtime.mpHandle(data);
        if (data?.type === 'snapshot' && runtime.MP.role === 'guest') {
          R.lastStateRx = Date.now();
          R.stateError = null;
          R.stateRequestedAt = 0;
          if (R.stateRecovering) {
            R.stateRecovering = false;
            runtime.mpSetStatus(`Szoba ${runtime.MP.room} · állapot helyreállt`, 'ok');
          }
        }
      } catch (error) {
        R.stateError = String(error?.message || error);
        console.error('P2P üzenethiba', error);
      }
    });
    conn.on('open', () => {
      if (runtime.MP.conn !== conn) return;
      runtime.MP.connected = true;
      runtime.MP.peer = true;
      R.lastRx = Date.now();
      if (runtime.MP.status) runtime.MP.status.style.display = 'flex';
      if (runtime.MP.lobby) runtime.MP.lobby.style.display = 'none';
      const recovering = !!(R.active || R.expired);
      runtime.mpSetStatus?.(recovering ? 'Kapcsolat létrejött · állapot szinkronizálása…' : `Szoba ${runtime.MP.room} · mindkét játékos bent`, recovering ? 'wait' : 'ok');
      if (!recovering && !runtime.MP.started) runtime.mpBeginPregame();
      runtime.mpSend({
        type: 'hello',
        role: runtime.MP.role
      });
      if (runtime.MP.role === 'host') {
        clearInterval(runtime.MP.snapshotTimer);
        runtime.MP.snapshotTimer = setInterval(runtime.mpSendSnapshot, 120);
        if (!recovering) {
          runtime.mpSendSnapshot(true);
          startHeartbeat(conn);
        }
      } else if (recovering) {
        queueMicrotask(() => {
          try {
            runtime.mpSendStrategy(true);
          } catch (_e) {}
          ;
          try {
            conn.send({
              type: 'reconnect_ready_v4975'
            });
          } catch (_e) {}
        });
      } else startHeartbeat(conn);
    });
    conn.on('close', () => {
      if (runtime.MP.conn !== conn) return;
      stopHeartbeat();
      runtime.MP.connected = false;
      runtime.MP.peer = false;
      if (runtime.MP.started) beginReconnect('Adatkapcsolat megszakadt');else runtime.mpSetStatus?.('A kapcsolat megszakadt. Próbáljatok újra.', 'bad');
    });
    conn.on('error', error => {
      if (runtime.MP.conn !== conn) return;
      console.warn('P2P adatkapcsolati hiba', error);
      setTimeout(() => {
        if (runtime.MP.conn === conn && !conn.open && runtime.MP.started) beginReconnect('Adatkapcsolati hiba');
      }, 350);
    });
  };
  window.__ROADLORDS_RECONNECT_V4975__ = {
    status: () => ({
      active: R.active,
      expired: R.expired,
      secondsLeft: R.active ? reconnectSeconds() : 0,
      role: runtime.MP.role,
      room: runtime.MP.room,
      connected: !!runtime.MP.connected,
      peer: !!runtime.MP.peer,
      started: !!runtime.MP.started,
      stateAgeMs: Date.now() - R.lastStateRx,
      stateError: R.stateError,
      stateRecovering: !!R.stateRecovering
    }),
    forceGrace: () => beginReconnect('QA teszt')
  };
}
