import { useEffect, useRef, useState } from "react";
import { CameraData } from "@/data/cameras";
import { socketService } from "@/services/socketServices";
import SKELETON_CONNECTIONS from "@/const/skeleton_collections";
import { Clock3 } from "lucide-react";
import { useCameraSync } from "@/contexts/CameraSyncContext";

interface CameraTileProps {
  camera: CameraData;
  size?: "small" | "large";
  showControls?: boolean;
  onEnded?: (id: number) => void;
  onClick?: () => void;
  className?: string;
}

const CameraTile = ({
  camera,
  size = "small",
  showControls = false,
  onEnded,
  onClick,
  className = "",
}: CameraTileProps) => {
  const initiallyEnded = camera.statusType === "ended";
  const isMaster = size === "large";

  const {
    getState,
    ensureCamera,
    version,
    emitPlay,
    emitPause,
    emitSeek,
    emitEnded,
    emitHeartbeat,
  } = useCameraSync();

  ensureCamera(camera.id, camera.video);
  const syncState = getState(camera.id);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const requestRef = useRef<number | null>(null);
  const isLooping = useRef(false);
  const aiResultsBuffer = useRef<Map<number, any[]>>(new Map());

  const ignoreNextEvent = useRef(false);

  const lastPlayTick = useRef(syncState?.playTick ?? 0);
  const lastPauseTick = useRef(syncState?.pauseTick ?? 0);
  const lastReplayTick = useRef(syncState?.replayTick ?? 0);
  const lastSeekTick = useRef(syncState?.seekTick ?? 0);
  const lastEndedTick = useRef(syncState?.endedTick ?? 0);

  // Heartbeat interval ref (chỉ master)
  const heartbeatRef = useRef<number | null>(null);

  // Đếm ngược loading overlay
  const [now, setNow] = useState(Date.now());
  const isLoading =
    !!syncState && syncState.loadingUntil > 0 && syncState.loadingUntil > now;

  useEffect(() => {
    if (!syncState || syncState.loadingUntil <= 0) return;
    const interval = setInterval(() => setNow(Date.now()), 200);
    return () => clearInterval(interval);
  }, [syncState?.loadingUntil]);

  // Pause video trong khi loading
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (isLoading) {
      ignoreNextEvent.current = true;
      v.pause();
    }
  }, [isLoading]);

  // Socket connect
  useEffect(() => {
    if (initiallyEnded) return;
    const socket = socketService.connect();
    const handleDataBox = (data: { timestamp: string | number; results: any[] }) => {
      const ts = Number(parseFloat(String(data.timestamp)).toFixed(1));
      aiResultsBuffer.current.set(ts, data.results);
    };
    socket.on("data_box", handleDataBox);
    return () => {
      socket.off("data_box", handleDataBox);
      socketService.release();
      isLooping.current = false;
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [initiallyEnded, camera.id]);

  // Reset buffer khi videoSrc đổi
  useEffect(() => {
    aiResultsBuffer.current = new Map();
  }, [syncState?.videoSrc]);

  // ====== SLAVE: lắng nghe lệnh từ master ======
  useEffect(() => {
    if (isMaster || !syncState) return;
    const v = videoRef.current;
    if (!v) return;

    // Replay: về 0 + play
    if (syncState.replayTick !== lastReplayTick.current) {
      lastReplayTick.current = syncState.replayTick;
      ignoreNextEvent.current = true;
      v.currentTime = 0;
      v.play().catch(() => {});
    }
    // Seek
    if (syncState.seekTick !== lastSeekTick.current) {
      lastSeekTick.current = syncState.seekTick;
      ignoreNextEvent.current = true;
      if (Math.abs(v.currentTime - syncState.seekTime) > 0.3) {
        v.currentTime = syncState.seekTime;
      }
    }
    // Pause
    if (syncState.pauseTick !== lastPauseTick.current) {
      lastPauseTick.current = syncState.pauseTick;
      ignoreNextEvent.current = true;
      v.pause();
    }
    // Play
    if (syncState.playTick !== lastPlayTick.current) {
      lastPlayTick.current = syncState.playTick;
      ignoreNextEvent.current = true;
      v.play().catch(() => {});
    }
    // Ended: master ended → slave dừng tại frame cuối
    if (syncState.endedTick !== lastEndedTick.current) {
      lastEndedTick.current = syncState.endedTick;
      ignoreNextEvent.current = true;
      v.pause();
    }
  }, [version, isMaster, syncState]);

  // ====== SLAVE: heartbeat sync currentTime để tránh drift ======
  useEffect(() => {
    if (isMaster || !syncState) return;
    const v = videoRef.current;
    if (!v) return;
    const target = syncState.currentTime;
    // Chỉ sync khi drift > 0.5s và đang play (tránh giật khi đang pause)
    if (!v.paused && Math.abs(v.currentTime - target) > 0.5) {
      ignoreNextEvent.current = true;
      v.currentTime = target;
    }
  }, [syncState?.heartbeatTick, isMaster]);

  // ====== MASTER: phát heartbeat định kỳ ======
  useEffect(() => {
    if (!isMaster) return;
    heartbeatRef.current = window.setInterval(() => {
      const v = videoRef.current;
      if (!v || v.paused || v.ended) return;
      emitHeartbeat(camera.id, v.currentTime);
    }, 500);
    return () => {
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
    };
  }, [isMaster, camera.id, emitHeartbeat]);

  const drawLoop = () => {
    if (!isLooping.current) return;
    requestRef.current = requestAnimationFrame(drawLoop);

    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.paused || video.ended) return;

    if (canvas.width !== video.videoWidth) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const currentTime = Number(video.currentTime.toFixed(1));
    const results = aiResultsBuffer.current.get(currentTime);
    if (!results || !Array.isArray(results)) return;

    const scaleX = canvas.width / 1920;
    const scaleY = canvas.height / 1080;

    const boxLineWidth = isMaster ? 2 : 1.5;
    const skeletonLineWidth = isMaster ? 2 : 1.5;
    const fontSize = isMaster ? 16 : 11;
    const labelHeight = isMaster ? 20 : 14;
    const dotRadius = isMaster ? 3 : 2;

    results.forEach((item: any) => {
      const [x1, y1, x2, y2] = item.box;
      const isNormal = String(item.action || "").includes("NORMAL");
      const color = isNormal ? "#22c55e" : "#ef4444";

      ctx.strokeStyle = color;
      ctx.lineWidth = boxLineWidth;
      ctx.strokeRect(x1 * scaleX, y1 * scaleY, (x2 - x1) * scaleX, (y2 - y1) * scaleY);

      const label = `ID ${item.id}: ${item.action}`;
      ctx.font = `${fontSize}px Arial`;
      const textWidth = ctx.measureText(label).width;
      ctx.fillStyle = color;
      ctx.fillRect(x1 * scaleX, y1 * scaleY - labelHeight - 2, textWidth + 8, labelHeight);
      ctx.fillStyle = "white";
      ctx.fillText(label, x1 * scaleX + 4, y1 * scaleY - 6);

      if (item.keypoints && item.conf) {
        ctx.lineWidth = skeletonLineWidth;
        ctx.strokeStyle = color;
        SKELETON_CONNECTIONS.forEach(([s, e]) => {
          if (item.conf[s] > 0.2 && item.conf[e] > 0.2) {
            const a = item.keypoints[s];
            const b = item.keypoints[e];
            ctx.beginPath();
            ctx.moveTo(a[0] * scaleX, a[1] * scaleY);
            ctx.lineTo(b[0] * scaleX, b[1] * scaleY);
            ctx.stroke();
          }
        });
        item.keypoints.forEach((kpt: number[], i: number) => {
          if (item.conf[i] > 0.2) {
            ctx.beginPath();
            ctx.arc(kpt[0] * scaleX, kpt[1] * scaleY, dotRadius, 0, 2 * Math.PI);
            ctx.fillStyle = "white";
            ctx.fill();
          }
        });
      }
    });
  };

  // Phòng thi đã kết thúc theo data (statusType: ended)
  if (initiallyEnded && !isMaster) {
    return (
      <div
        onClick={onClick}
        className={`relative cursor-pointer flex aspect-video w-full items-center justify-center bg-card ${className}`}
      >
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
            <Clock3 className="h-7 w-7 text-muted-foreground" />
          </div>
          <div>
            <div className="text-base font-semibold text-foreground">Phòng thi đã kết thúc</div>
            <div className="text-sm text-muted-foreground">{camera.room} • {camera.endTime}</div>
          </div>
        </div>
      </div>
    );
  }

  const Wrapper: any = onClick ? "button" : "div";
  const videoSrc = syncState?.videoSrc ?? camera.video;
  const showEndedOverlaySmall = !isMaster && syncState?.isEnded;

  return (
    <Wrapper
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={`relative block w-full bg-black overflow-hidden ${className}`}
    >
      {/* Loading 5s overlay */}
      {isLoading && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-2 text-foreground">
            <div
              className={`animate-spin rounded-full border-primary border-t-transparent ${
                isMaster ? "h-10 w-10 border-4" : "h-6 w-6 border-2"
              }`}
            />
            <span className={`font-medium ${isMaster ? "text-sm" : "text-xs"}`}>
              {isMaster ? "Đang khởi tạo AI Model (5s)..." : "Đang khởi tạo AI..."}
            </span>
          </div>
        </div>
      )}

      {/* Overlay ENDED dành cho slave – đồng bộ khi master phát hết */}
      {showEndedOverlaySmall && !isLoading && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/70 backdrop-blur-sm pointer-events-none">
          <div className="flex flex-col items-center gap-2 text-center text-white px-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-warning/30">
              <Clock3 className="h-5 w-5 text-white" />
            </div>
            <div className="text-xs font-semibold">Phòng thi đã kết thúc</div>
          </div>
        </div>
      )}

      <div className="relative w-full aspect-video">
        <video
          ref={videoRef}
          src={videoSrc}
          poster={camera.image}
          className="absolute inset-0 w-full h-full object-cover"
          muted
          playsInline
          // Master autoPlay; slave KHÔNG autoPlay – chỉ play theo lệnh master
          autoPlay={isMaster && !isLoading}
          // Cả 2 đều KHÔNG loop – để onEnded chạy đúng và đồng bộ ended
          loop={false}
          controls={showControls && isMaster}
          onPlay={() => {
            isLooping.current = true;
            drawLoop();
            if (isMaster && !ignoreNextEvent.current) emitPlay(camera.id);
            ignoreNextEvent.current = false;
          }}
          onPause={() => {
            isLooping.current = false;
            if (isMaster && !ignoreNextEvent.current) {
              const v = videoRef.current;
              if (v && !v.ended) emitPause(camera.id);
            }
            ignoreNextEvent.current = false;
          }}
          onSeeked={() => {
            const v = videoRef.current;
            if (isMaster && v && !ignoreNextEvent.current) {
              emitSeek(camera.id, v.currentTime);
            }
            ignoreNextEvent.current = false;
          }}
          onEnded={() => {
            isLooping.current = false;
            if (isMaster) {
              emitEnded(camera.id);
              onEnded?.(camera.id);
            }
          }}
        />
        <canvas
          ref={canvasRef}
          className="pointer-events-none absolute inset-0 w-full h-full z-10"
        />
      </div>

      {!isMaster && (
        <div className="pointer-events-none absolute top-2 left-2 z-20 flex items-center gap-1.5 rounded-full bg-background/80 px-2 py-0.5 text-xs font-medium text-foreground backdrop-blur-sm">
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              syncState?.isEnded ? "bg-warning" : "bg-destructive animate-pulse"
            }`}
          />
          {syncState?.isEnded ? "ENDED" : "LIVE"}
        </div>
      )}
    </Wrapper>
  );
};

export default CameraTile;

export const useCameraCommands = () => {
  const { emitReplay, changeVideo } = useCameraSync();
  return { emitReplay, changeVideo };
};
