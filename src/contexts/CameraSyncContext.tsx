import { createContext, useContext, useRef, useState, useCallback, ReactNode } from "react";

/**
 * State đồng bộ giữa camera lớn (Detail - master) và camera nhỏ (Grid - slave)
 * cho từng cameraId.
 *
 * - videoSrc: nguồn video hiện tại của camera (có thể đổi qua nút "Thay đổi")
 * - loadingUntil: timestamp (ms) – nếu > Date.now() thì cả master & slave đang loading
 * - playToken / pauseToken / replayToken / seekTime: các "lệnh" mà master emit;
 *   slave dùng useEffect để theo dõi và thực thi tương ứng trên video element của mình.
 */
export interface CameraSyncState {
  videoSrc: string;
  loadingUntil: number; // 0 = không loading
  playTick: number;     // tăng mỗi lần master ra lệnh play
  pauseTick: number;    // tăng mỗi lần master pause
  replayTick: number;   // tăng mỗi lần master replay (currentTime=0 + play)
  seekTick: number;     // tăng mỗi lần master seek
  seekTime: number;     // currentTime tương ứng với seekTick
}

interface CameraSyncContextValue {
  getState: (id: number) => CameraSyncState | undefined;
  ensureCamera: (id: number, defaultVideoSrc: string) => void;
  /** Tăng phiên bản state để consumer re-render. */
  version: number;
  /** Đặt video mới + bắt đầu loading 5s đồng thời cho master & slave. */
  changeVideo: (id: number, newSrc: string) => void;
  emitPlay: (id: number) => void;
  emitPause: (id: number) => void;
  emitReplay: (id: number) => void;
  emitSeek: (id: number, time: number) => void;
}

const CameraSyncContext = createContext<CameraSyncContextValue | null>(null);

export const CameraSyncProvider = ({ children }: { children: ReactNode }) => {
  const statesRef = useRef<Map<number, CameraSyncState>>(new Map());
  const [version, setVersion] = useState(0);
  const bump = useCallback(() => setVersion((v) => v + 1), []);

  const ensureCamera = useCallback((id: number, defaultVideoSrc: string) => {
    if (!statesRef.current.has(id)) {
      statesRef.current.set(id, {
        videoSrc: defaultVideoSrc,
        loadingUntil: 0,
        playTick: 0,
        pauseTick: 0,
        replayTick: 0,
        seekTick: 0,
        seekTime: 0,
      });
      bump();
    }
  }, [bump]);

  const getState = useCallback((id: number) => statesRef.current.get(id), []);

  const update = useCallback((id: number, patch: Partial<CameraSyncState>) => {
    const cur = statesRef.current.get(id);
    if (!cur) return;
    statesRef.current.set(id, { ...cur, ...patch });
    bump();
  }, [bump]);

  const changeVideo = useCallback((id: number, newSrc: string) => {
    const cur = statesRef.current.get(id);
    if (!cur) return;
    update(id, {
      videoSrc: newSrc,
      loadingUntil: Date.now() + 5000,
      // reset các tick để slave không phát video cũ
      playTick: cur.playTick,
      pauseTick: cur.pauseTick + 1, // ép pause ngay
    });
    // Sau 5s, tự động phát
    setTimeout(() => {
      const s = statesRef.current.get(id);
      if (!s) return;
      statesRef.current.set(id, {
        ...s,
        loadingUntil: 0,
        playTick: s.playTick + 1,
      });
      bump();
    }, 5000);
  }, [update, bump]);

  const emitPlay = useCallback((id: number) => {
    const cur = statesRef.current.get(id);
    if (!cur) return;
    update(id, { playTick: cur.playTick + 1 });
  }, [update]);

  const emitPause = useCallback((id: number) => {
    const cur = statesRef.current.get(id);
    if (!cur) return;
    update(id, { pauseTick: cur.pauseTick + 1 });
  }, [update]);

  const emitReplay = useCallback((id: number) => {
    const cur = statesRef.current.get(id);
    if (!cur) return;
    update(id, { replayTick: cur.replayTick + 1 });
  }, [update]);

  const emitSeek = useCallback((id: number, time: number) => {
    const cur = statesRef.current.get(id);
    if (!cur) return;
    update(id, { seekTick: cur.seekTick + 1, seekTime: time });
  }, [update]);

  const value: CameraSyncContextValue = {
    getState,
    ensureCamera,
    version,
    changeVideo,
    emitPlay,
    emitPause,
    emitReplay,
    emitSeek,
  };

  return <CameraSyncContext.Provider value={value}>{children}</CameraSyncContext.Provider>;
};

export const useCameraSync = () => {
  const ctx = useContext(CameraSyncContext);
  if (!ctx) throw new Error("useCameraSync must be used within CameraSyncProvider");
  return ctx;
};
