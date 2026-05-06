import { createContext, useContext, useRef, useState, useCallback, ReactNode } from "react";
import { violationsApi } from "@/api";

/**
 * State đồng bộ giữa camera lớn (Detail - master) và camera nhỏ (Grid - slave)
 * cho từng cameraId.
 */
export interface CameraSyncState {
  videoSrc: string;
  loadingUntil: number;
  playTick: number;
  pauseTick: number;
  replayTick: number;
  seekTick: number;
  seekTime: number;
  /** Master báo đã ended để slave hiện overlay & dừng. */
  endedTick: number;
  /** Master broadcast currentTime để slave bám theo (heartbeat). */
  currentTime: number;
  /** Tăng mỗi khi master heartbeat — slave lắng nghe để chỉnh nếu drift. */
  heartbeatTick: number;
  /** Đang ở trạng thái ended (sau khi video phát hết). */
  isEnded: boolean;
  /** Master đang phát — slave dùng để tự play lại nếu bị miss lệnh. */
  isPlaying: boolean;
  /** Lượt chạy đầu đã hoàn tất (video đã ended ít nhất 1 lần) → mới cho controls/seek. */
  firstRunDone: boolean;
  /** roomId liên kết để gửi violation lên BE. */
  roomId: number | null;
}

/** Một vi phạm đang theo dõi (>= 5s liên tục). */
interface PendingViolation {
  studentId: string | number;
  behavior: string;
  startTime: number;       // giây video
  lastSeenTime: number;
  frames: { frameId: number; behavior: string; confidence: number }[];
  lastFrameId: number;
}

/** Khoảng thời gian (giây) tối thiểu để coi là vi phạm cần ghi log. */
const VIOLATION_THRESHOLD_SEC = 5;
/** Khoảng gap tối đa cho phép giữa 2 frame liên tục (giây). */
const VIOLATION_GAP_SEC = 0.8;

interface CameraSyncContextValue {
  getState: (id: number) => CameraSyncState | undefined;
  ensureCamera: (id: number, defaultVideoSrc: string, initialEnded?: boolean, roomId?: number | null) => void;
  version: number;
  changeVideo: (id: number, newSrc: string) => void;
  emitPlay: (id: number) => void;
  emitPause: (id: number) => void;
  emitReplay: (id: number) => void;
  emitSeek: (id: number, time: number) => void;
  emitEnded: (id: number) => void;
  emitHeartbeat: (id: number, time: number) => void;
  /**
   * Ghi nhận kết quả AI mỗi frame để phát hiện vi phạm liên tục >5s.
   * Chỉ master mới gọi để tránh trùng lặp.
   */
  recordAiFrame: (
    id: number,
    frameId: number,
    videoTime: number,
    detections: { id: string | number; action?: string; confidence?: number }[],
  ) => void;
}

const CameraSyncContext = createContext<CameraSyncContextValue | null>(null);

const isViolationAction = (action?: string) => {
  if (!action) return false;
  const a = String(action).toUpperCase();
  // Hành động "bình thường" — phần còn lại coi như vi phạm
  if (a.includes("NORMAL") || a.includes("SITTING") || a.includes("WRITING")) return false;
  return true;
};

export const CameraSyncProvider = ({ children }: { children: ReactNode }) => {
  const statesRef = useRef<Map<number, CameraSyncState>>(new Map());
  // Buffer vi phạm đang tracking theo cameraId → studentId → PendingViolation
  const pendingRef = useRef<Map<number, Map<string | number, PendingViolation>>>(new Map());
  const [version, setVersion] = useState(0);
  const bump = useCallback(() => setVersion((v) => v + 1), []);

  const ensureCamera = useCallback(
    (id: number, defaultVideoSrc: string, initialEnded = false, roomId: number | null = null) => {
      if (!statesRef.current.has(id)) {
        statesRef.current.set(id, {
          videoSrc: defaultVideoSrc,
          loadingUntil: 0,
          playTick: 0,
          pauseTick: 0,
          replayTick: 0,
          seekTick: 0,
          seekTime: 0,
          endedTick: 0,
          currentTime: 0,
          heartbeatTick: 0,
          isEnded: initialEnded,
          isPlaying: false,
          firstRunDone: initialEnded,
          roomId,
        });
        pendingRef.current.set(id, new Map());
      } else if (roomId != null) {
        const cur = statesRef.current.get(id)!;
        if (cur.roomId !== roomId) statesRef.current.set(id, { ...cur, roomId });
      }
    },
    [],
  );

  const getState = useCallback((id: number) => statesRef.current.get(id), []);

  const update = useCallback((id: number, patch: Partial<CameraSyncState>, silent = false) => {
    const cur = statesRef.current.get(id);
    if (!cur) return;
    statesRef.current.set(id, { ...cur, ...patch });
    if (!silent) bump();
  }, [bump]);

  const changeVideo = useCallback((id: number, newSrc: string) => {
    const cur = statesRef.current.get(id);
    if (!cur) return;
    update(id, {
      videoSrc: newSrc,
      loadingUntil: Date.now() + 5000,
      pauseTick: cur.pauseTick + 1,
      isEnded: false,
      isPlaying: false,
      currentTime: 0,
      firstRunDone: false, // video mới → reset, lượt chạy đầu lại không cho seek
    });
    pendingRef.current.set(id, new Map());
    setTimeout(() => {
      const s = statesRef.current.get(id);
      if (!s) return;
      statesRef.current.set(id, {
        ...s,
        loadingUntil: 0,
        replayTick: s.replayTick + 1,
        isPlaying: true,
      });
      bump();
    }, 5000);
  }, [update, bump]);

  const emitPlay = useCallback((id: number) => {
    const cur = statesRef.current.get(id);
    if (!cur) return;
    update(id, { playTick: cur.playTick + 1, isEnded: false, isPlaying: true });
  }, [update]);

  const emitPause = useCallback((id: number) => {
    const cur = statesRef.current.get(id);
    if (!cur) return;
    update(id, { pauseTick: cur.pauseTick + 1, isPlaying: false });
  }, [update]);

  const emitReplay = useCallback((id: number) => {
    const cur = statesRef.current.get(id);
    if (!cur) return;
    update(id, {
      replayTick: cur.replayTick + 1,
      isEnded: false,
      isPlaying: true,
      currentTime: 0,
      loadingUntil: 0,
    });
  }, [update]);

  const emitSeek = useCallback((id: number, time: number) => {
    const cur = statesRef.current.get(id);
    if (!cur) return;
    update(id, { seekTick: cur.seekTick + 1, seekTime: time, currentTime: time });
  }, [update]);

  const emitEnded = useCallback((id: number) => {
    const cur = statesRef.current.get(id);
    if (!cur) return;
    update(id, {
      endedTick: cur.endedTick + 1,
      isEnded: true,
      isPlaying: false,
      firstRunDone: true, // Lượt chạy đầu xong → mới cho phép seek/controls
    });
    // Flush các vi phạm còn pending khi video kết thúc
    const pendings = pendingRef.current.get(id);
    if (pendings) {
      pendings.forEach((p) => flushViolation(id, cur.roomId, p));
      pendings.clear();
    }
  }, [update]);

  const emitHeartbeat = useCallback((id: number, time: number) => {
    const cur = statesRef.current.get(id);
    if (!cur) return;
    statesRef.current.set(id, { ...cur, currentTime: time, heartbeatTick: cur.heartbeatTick + 1 });
    bump();
  }, [bump]);

  /**
   * Khi 1 vi phạm kết thúc (gap quá lớn hoặc video ended) và đủ >=5s:
   *   BACKEND CALL: POST /violations
   *   Body khớp với Violation: { studentId, room_id, time, reason, frameLogs, videoLogs, ... }
   */
  const flushViolation = (cameraId: number, roomId: number | null, p: PendingViolation) => {
    const duration = p.lastSeenTime - p.startTime;
    if (duration < VIOLATION_THRESHOLD_SEC) return;
    if (roomId == null) return;
    const payload = {
      studentId: String(p.studentId),
      studentName: `Student ${p.studentId}`,
      room_id: roomId,
      time: new Date().toISOString(),
      reason: p.behavior,
      image: "",
      videoUrl: "",
      frameLogs: p.frames,
      videoLogs: [
        {
          videoId: Date.now(),
          behavior: p.behavior,
          startTime: p.startTime,
          endTime: p.lastSeenTime,
        },
      ],
    };
    violationsApi.create(payload).catch((err) => {
      console.error("Failed to log violation", err);
    });
  };

  const recordAiFrame: CameraSyncContextValue["recordAiFrame"] = useCallback(
    (id, frameId, videoTime, detections) => {
      const cur = statesRef.current.get(id);
      if (!cur) return;
      let pendings = pendingRef.current.get(id);
      if (!pendings) {
        pendings = new Map();
        pendingRef.current.set(id, pendings);
      }

      const seenThisFrame = new Set<string | number>();

      for (const det of detections) {
        if (!isViolationAction(det.action)) continue;
        seenThisFrame.add(det.id);
        const exist = pendings.get(det.id);
        if (!exist) {
          pendings.set(det.id, {
            studentId: det.id,
            behavior: det.action || "UNKNOWN",
            startTime: videoTime,
            lastSeenTime: videoTime,
            frames: [
              { frameId, behavior: det.action || "UNKNOWN", confidence: det.confidence ?? 1 },
            ],
            lastFrameId: frameId,
          });
        } else {
          // Nếu khoảng gap quá lớn → coi như hành vi cũ kết thúc, flush rồi bắt đầu mới
          if (videoTime - exist.lastSeenTime > VIOLATION_GAP_SEC) {
            flushViolation(id, cur.roomId, exist);
            pendings.set(det.id, {
              studentId: det.id,
              behavior: det.action || "UNKNOWN",
              startTime: videoTime,
              lastSeenTime: videoTime,
              frames: [
                { frameId, behavior: det.action || "UNKNOWN", confidence: det.confidence ?? 1 },
              ],
              lastFrameId: frameId,
            });
          } else {
            exist.lastSeenTime = videoTime;
            exist.lastFrameId = frameId;
            exist.frames.push({
              frameId,
              behavior: det.action || exist.behavior,
              confidence: det.confidence ?? 1,
            });
          }
        }
      }

      // Đối tượng không còn xuất hiện đủ lâu → flush
      pendings.forEach((p, key) => {
        if (!seenThisFrame.has(key) && videoTime - p.lastSeenTime > VIOLATION_GAP_SEC) {
          flushViolation(id, cur.roomId, p);
          pendings!.delete(key);
        }
      });
    },
    [],
  );

  const value: CameraSyncContextValue = {
    getState,
    ensureCamera,
    version,
    changeVideo,
    emitPlay,
    emitPause,
    emitReplay,
    emitSeek,
    emitEnded,
    emitHeartbeat,
    recordAiFrame,
  };

  return <CameraSyncContext.Provider value={value}>{children}</CameraSyncContext.Provider>;
};

export const useCameraSync = () => {
  const ctx = useContext(CameraSyncContext);
  if (!ctx) throw new Error("useCameraSync must be used within CameraSyncProvider");
  return ctx;
};

