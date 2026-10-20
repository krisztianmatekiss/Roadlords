import { assetUrl } from '../assets/urls.js';
export function initializeMultiplayerInitialState(runtime) {
  runtime.v472Style = document.createElement('style');
  runtime.v472Style.textContent = `.plot.terrain:hover{transform:none!important}`;
  document.head.appendChild(runtime.v472Style);
  runtime.v472RenderCity = runtime.renderCity;
  runtime.renderCity = function (container, c, interactive) {
    if (!interactive) {
      const signature = runtime.cityVisualSignature(c);
      if (container.dataset.cityVisualSignature === signature) return;
      container.dataset.cityVisualSignature = signature;
    }
    return runtime.v472RenderCity(container, c, interactive);
  };
  runtime.$('.brand small').textContent = 'V4.11.18 · P2P 1V1';
  runtime.MP = {
    enabled: true,
    room: '',
    role: null,
    peerClient: null,
    conn: null,
    connected: false,
    peer: false,
    started: false,
    readySent: false,
    opponentReady: false,
    applying: false,
    lastStrategySignature: '',
    strategySeq: 0,
    pendingStrategy: null,
    lastGuestSeq: 0,
    guestChoicePending: false,
    unitTargets: new Map(),
    snapshotTimer: null,
    status: null,
    lobby: null
  };
  runtime.MP_STRATEGY_KEYS = ['resources', 'buildings', 'terrain', 'unlocked', 'levels', 'l4Branches', 'normal', 'legends', 'serial', 'gateMode', 'autoReleasing', 'rallyMode', 'warMode', 'warModeChangedAt', 'marketRoutes', 'marketSwitchAt', 'rerolls', 'bans', 'banned', 'pickCount', 'nonLegendaryPicks', 'lastPick', 'legendaryDrought'];
  runtime.mpGrantEnemyStarterPicks = runtime.grantEnemyStarterPicks;
  runtime.grantEnemyStarterPicks = function () {
    if (runtime.MP.enabled) return;
    return runtime.mpGrantEnemyStarterPicks();
  };
  runtime.mpGrantEnemyPick = runtime.grantEnemyPick;
  runtime.grantEnemyPick = function (source = 'timer', forceNormal = false) {
    if (!runtime.MP.enabled) return runtime.mpGrantEnemyPick(source, forceNormal);
    if (runtime.MP.role === 'host') {
      if (runtime.state.startChoices > 0) {
        (runtime.MP.deferredGuestChoices || (runtime.MP.deferredGuestChoices = [])).push({
          source,
          forceNormal
        });
        return;
      }
      runtime.MP.guestChoicePending = true;
      runtime.mpSend({
        type: 'event',
        event: 'choice',
        source,
        forceNormal
      });
      runtime.mpSetStatus('Az ellenfél fejlesztést választ…', 'wait');
    }
  };
  runtime.mpEnemyBuildAI = runtime.enemyBuildAI;
  runtime.enemyBuildAI = function (dt) {
    if (runtime.MP.enabled) return;
    return runtime.mpEnemyBuildAI(dt);
  };
  runtime.mpEnemyGateAI = runtime.enemyGateAI;
  runtime.enemyGateAI = function () {
    if (runtime.MP.enabled) return;
    return runtime.mpEnemyGateAI();
  };
  runtime.mpEnemyWarMode = runtime.updateEnemyWarModeV45;
  runtime.updateEnemyWarModeV45 = function () {
    if (runtime.MP.enabled) return;
    return runtime.mpEnemyWarMode();
  };
  runtime.mpTick = runtime.tick;
  runtime.tick = function (dt) {
    if (runtime.MP.enabled && (runtime.MP.role === 'guest' || !runtime.MP.started || runtime.MP.guestChoicePending)) return;
    return runtime.mpTick(dt);
  };
  runtime.mpApplyChoice = runtime.applyChoice;
  runtime.applyChoice = function (c, o, countEvent = true) {
    const result = runtime.mpApplyChoice(c, o, countEvent);
    if (runtime.MP.enabled && runtime.MP.role === 'guest' && c === runtime.P) queueMicrotask(() => runtime.mpSendStrategy(true));
    return result;
  };
  runtime.mpFinalizeChoiceEvent = runtime.finalizeChoiceEvent;
  runtime.finalizeChoiceEvent = function () {
    const wasStart = runtime.state.startChoices > 0,
      result = runtime.mpFinalizeChoiceEvent();
    if (runtime.MP.enabled && runtime.MP.role === 'guest') {
      runtime.mpSendStrategy(true);
      if (!wasStart) runtime.mpSend({
        type: 'choice_done'
      });
    }
    return result;
  };
  runtime.mpPlaceBuilding = runtime.placeBuilding;
  runtime.placeBuilding = function (c, type, row, col, rotation = 0) {
    const result = runtime.mpPlaceBuilding(c, type, row, col, rotation);
    if (result?.ok && runtime.MP.enabled && runtime.MP.role === 'guest' && c === runtime.P) queueMicrotask(() => runtime.mpSendStrategy(true));
    return result;
  };
  runtime.mpDemolish = runtime.demolish;
  runtime.demolish = function (c, id) {
    const result = runtime.mpDemolish(c, id);
    if (result && runtime.MP.enabled && runtime.MP.role === 'guest' && c === runtime.P) queueMicrotask(() => runtime.mpSendStrategy(true));
    return result;
  };
  runtime.mpSetGate = runtime.setGate;
  runtime.setGate = function (mode) {
    const result = runtime.mpSetGate(mode);
    if (runtime.MP.enabled && runtime.MP.role === 'guest') queueMicrotask(() => runtime.mpSendStrategy(true));
    return result;
  };
}
