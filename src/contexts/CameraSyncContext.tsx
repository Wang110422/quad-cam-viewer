import { createContext, useContext, useRef, useState, useCallback, ReactNode } from "react";

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
}

interface CameraSyncContextValue {
  getState: (id: number) => CameraSyncState | undefined;
  ensureCamera: (id: number, defaultVideoSrc: string, initialEnded?: boolean) => void;
  version: number;
  changeVideo: (id: number, newSrc: string) => void;
  emitPlay: (id: number) => void;
  emitPause: (id: number) => void;
  emitReplay: (id: number) => void;
  emitSeek: (id: number, time: number) => void;
  emitEnded: (id: number) => void;
  emitHeartbeat: (id: number, time: number) => void;
}

const CameraSyncContext = createContext<CameraSyncContextValue | null>(null);

export const CameraSyncProvider = ({ children }: { children: ReactNode }) => {
  const statesRef = useRef<Map<number, CameraSyncState>>(new Map());
  const [version, setVersion] = useState(0);
  const bump = useCallback(() => setVersion((v) => v + 1), []);

  const ensureCamera = useCallback((id: number, defaultVideoSrc: string, initialEnded = false) => {
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
      });
    }
  }, []);

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
    });
    setTimeout(() => {
      const s = statesRef.current.get(id);
      if (!s) return;
      statesRef.current.set(id, {
        ...s,
        loadingUntil: 0,
        replayTick: s.replayTick + 1, // cả master & slave reset về 0 + play
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
    update(id, { replayTick: cur.replayTick + 1, isEnded: false, isPlaying: true, currentTime: 0, loadingUntil: 0 });
  }, [update]);

  const emitSeek = useCallback((id: number, time: number) => {
    const cur = statesRef.current.get(id);
    if (!cur) return;
    update(id, { seekTick: cur.seekTick + 1, seekTime: time, currentTime: time });
  }, [update]);

  const emitEnded = useCallback((id: number) => {
    const cur = statesRef.current.get(id);
    if (!cur) return;
    update(id, { endedTick: cur.endedTick + 1, isEnded: true, isPlaying: false });
  }, [update]);

  // Heartbeat: bump version để slave bám currentTime thật của master.
  const emitHeartbeat = useCallback((id: number, time: number) => {
    const cur = statesRef.current.get(id);
    if (!cur) return;
    statesRef.current.set(id, { ...cur, currentTime: time, heartbeatTick: cur.heartbeatTick + 1 });
    bump();
  }, [bump]);

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
  };

  return <CameraSyncContext.Provider value={value}>{children}</CameraSyncContext.Provider>;
};

export const useCameraSync = () => {
  const ctx = useContext(CameraSyncContext);
  if (!ctx) throw new Error("useCameraSync must be used within CameraSyncProvider");
  return ctx;
};
