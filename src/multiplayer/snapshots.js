import { assetUrl } from '../assets/urls.js';
import { unitIsElite } from '../data/unit-ranks.js';
export function initializeMultiplayerSnapshots(runtime) {
  const MP_SNAPSHOT_MIN_MS = 120;
  const MP_MAX_BUFFERED_BYTES = 512 * 1024;
  const MP_BUFFER_LOW_BYTES = 128 * 1024;
  let mpLastSnapshotAtV4974 = 0;
  let mpSentSnapshotsV4974 = 0;
  let mpSkippedSnapshotsV4974 = 0;
  let mpLastSnapshotBytesV4974 = 0;
  let mpMaxBufferedV4974 = 0;
  const round1V4974 = v => Math.round((Number(v) || 0) * 10) / 10;
  function packUnitV4974(u) {
    let flags = 0;
    if (u.alive) flags |= 1;
    if (u.veteran) flags |= 2;
    if (u.phalanx) flags |= 4;
    if (u.permanentTavern) flags |= 8;
    if ((u.blessingTime || 0) > 0) flags |= 16;
    if ((u.stunTime || 0) > 0) flags |= 32;
    if (u.chargeReady) flags |= 64;
    if (u.spearVolleyReady) flags |= 128;
    if (u.lightningReady) flags |= 256;
    if (u.hospitalSaved) flags |= 512;
    if (unitIsElite(u)) flags |= 1024;
    return [u.id, u.side === 'player' ? 0 : 1, u.key, round1V4974(u.lane), round1V4974(u.offset), round1V4974(u.hp), round1V4974(u.maxHp), round1V4974(u.shield), round1V4974(u.tempShield), flags, Math.max(0, Math.floor(Number(u.firstHitsRemaining) || 0)), u.alchemyEffect || '', Array.isArray(u.alchemyEffects) ? u.alchemyEffects : []];
  }
  function unpackUnitV4974(a) {
    const flags = Number(a?.[9]) || 0;
    return {
      id: a?.[0],
      side: a?.[1] === 0 ? 'player' : 'enemy',
      key: a?.[2],
      lane: Number(a?.[3]) || 0,
      offset: Number(a?.[4]) || 0,
      hp: Number(a?.[5]) || 0,
      maxHp: Math.max(1, Number(a?.[6]) || 1),
      shield: Number(a?.[7]) || 0,
      tempShield: Number(a?.[8]) || 0,
      alive: !!(flags & 1),
      veteran: !!(flags & 2),
      eliteVisual: !!(flags & 1024),
      phalanx: !!(flags & 4),
      permanentTavern: !!(flags & 8),
      blessingTime: flags & 16 ? 1 : 0,
      stunTime: flags & 32 ? 1 : 0,
      chargeReady: !!(flags & 64),
      spearVolleyReady: !!(flags & 128),
      lightningReady: !!(flags & 256),
      hospitalSaved: !!(flags & 512),
      firstHitsRemaining: Number(a?.[10]) || 0,
      alchemyEffect: a?.[11] || null,
      alchemyEffects: Array.isArray(a?.[12]) ? [...a[12]] : [],
      roadAttack: a?.[18] || null,
      roadMoving: !!a?.[19]
    };
  }
  const oldMpApplyUnitTargetsV4974 = runtime.mpApplyUnitTargets;
  runtime.mpApplyUnitTargets = function (packed) {
    const raw = runtime.mpRevive(packed);
    if (Array.isArray(raw) && raw.length && Array.isArray(raw[0])) {
      return oldMpApplyUnitTargetsV4974(raw.map(unpackUnitV4974));
    }
    return oldMpApplyUnitTargetsV4974(packed);
  };
  runtime.mpSendSnapshot = function (force = false) {
    if (runtime.MP.role !== 'host' || !runtime.MP.peer) return false;
    const now = performance.now();
    if (!force && now - mpLastSnapshotAtV4974 < MP_SNAPSHOT_MIN_MS) return false;
    const dc = runtime.MP.conn?.dataChannel;
    const buffered = Math.max(0, Number(dc?.bufferedAmount) || 0);
    mpMaxBufferedV4974 = Math.max(mpMaxBufferedV4974, buffered);
    if (dc) {
      try {
        dc.bufferedAmountLowThreshold = MP_BUFFER_LOW_BYTES;
      } catch (_e) {}
    }
    if (buffered > MP_MAX_BUFFERED_BYTES) {
      mpSkippedSnapshotsV4974++;
      return false;
    }
    const packet = {
      type: 'snapshot',
      guestSeq: runtime.MP.lastGuestSeq,
      player: runtime.mpCitySnapshot(runtime.P),
      enemy: runtime.mpCitySnapshot(runtime.E),
      shared: runtime.mpPack(runtime.mpSharedState()),
      units: runtime.state.units.map(packUnitV4974),
      towers: runtime.mpPack(runtime.towers),
      capitalTowers: runtime.mpPack(runtime.capitalTowers)
    };
    mpLastSnapshotBytesV4974 = JSON.stringify(packet).length;
    mpLastSnapshotAtV4974 = now;
    mpSentSnapshotsV4974++;
    runtime.mpSend(packet);
    return true;
  };
  const oldMpAttachConnectionV4974 = runtime.mpAttachConnection;
  runtime.mpAttachConnection = function (conn) {
    const out = oldMpAttachConnectionV4974(conn);
    conn?.on?.('open', () => {
      const dc = conn?.dataChannel;
      if (dc) {
        try {
          dc.bufferedAmountLowThreshold = MP_BUFFER_LOW_BYTES;
        } catch (_e) {}
      }
    });
    return out;
  };
  window.__ROADLORDS_NET_V4974__ = {
    stats: () => ({
      sentSnapshots: mpSentSnapshotsV4974,
      skippedForBackpressure: mpSkippedSnapshotsV4974,
      lastSnapshotBytes: mpLastSnapshotBytesV4974,
      maxBufferedBytes: mpMaxBufferedV4974,
      currentBufferedBytes: Math.max(0, Number(runtime.MP.conn?.dataChannel?.bufferedAmount) || 0),
      snapshotMinMs: MP_SNAPSHOT_MIN_MS
    }),
    estimatedSnapshotBytes: () => JSON.stringify({
      type: 'snapshot',
      guestSeq: runtime.MP.lastGuestSeq,
      player: runtime.mpCitySnapshot(runtime.P),
      enemy: runtime.mpCitySnapshot(runtime.E),
      shared: runtime.mpPack(runtime.mpSharedState()),
      units: runtime.state.units.map(packUnitV4974),
      towers: runtime.mpPack(runtime.towers),
      capitalTowers: runtime.mpPack(runtime.capitalTowers)
    }).length
  };
}
