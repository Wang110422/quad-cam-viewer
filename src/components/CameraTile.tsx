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

type AiResult = {
  id: string | number;
  action?: string;
  box: [number, number, number, number];
  keypoints?: number[][];
  conf?: number[];
};

const CameraTile = ({
  camera,
  size = "small",
  showControls = false,
  onEnded,
  onClick,
  className = "",
}: CameraTileProps) => {
  const initiallyEnded = false; // Camera không có status — trạng thái lấy từ Room.
  const isMaster = size === "large";

  const { getState, ensureCamera, version, emitPlay, emitPause, emitSeek, emitEnded, emitHeartbeat } = useCameraSync();

  ensureCamera(camera.id, camera.video, initiallyEnded);
  const syncState = getState(camera.id);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const requestRef = useRef<number | null>(null);
  const isLooping = useRef(false);
  const aiResultsBuffer = useRef<Map<number, AiResult[]>>(new Map());

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
  const loadingUntil = syncState?.loadingUntil ?? 0;
  const isLoading = loadingUntil > 0 && loadingUntil > now;

  useEffect(() => {
    if (loadingUntil <= 0) return;
    const interval = setInterval(() => setNow(Date.now()), 200);
    return () => clearInterval(interval);
  }, [loadingUntil]);

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
    const handleDataBox = (data: { timestamp: string | number; results: AiResult[] }) => {
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

  // ====== MASTER/SLAVE: lắng nghe lệnh chung từ context ======
  useEffect(() => {
    if (!syncState) return;
    const v = videoRef.current;
    if (!v) return;

    if (isLoading) return;

    // Master chỉ nhận lệnh replay/changeVideo từ nút ngoài; play/pause/seek còn lại do chính controls xử lý.
    if (syncState.replayTick !== lastReplayTick.current) {
      lastReplayTick.current = syncState.replayTick;
      ignoreNextEvent.current = true;
      v.currentTime = 0;
      v.play().catch(() => {});
    }
    if (isMaster) return;

    // Slave mirror đầy đủ play/pause/seek/ended từ master.
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
    // Ended: slave dừng tại frame cuối, master bỏ qua vì chính nó phát event ended
    if (!isMaster && syncState.endedTick !== lastEndedTick.current) {
      lastEndedTick.current = syncState.endedTick;
      ignoreNextEvent.current = true;
      v.pause();
    }
  }, [version, isMaster, syncState, isLoading]);

  // ====== SLAVE: heartbeat sync currentTime để tránh drift ======
  useEffect(() => {
    if (isMaster || !syncState) return;
    const v = videoRef.current;
    if (!v) return;
    const target = syncState.currentTime;
    // Sync nếu lệch thời gian; nếu master đang phát mà slave bị pause thì play lại.
    if (Math.abs(v.currentTime - target) > 0.25) {
      ignoreNextEvent.current = true;
      v.currentTime = target;
    }
    if (syncState.isPlaying && v.paused && !syncState.isEnded && !isLoading) {
      ignoreNextEvent.current = true;
      v.play().catch(() => {});
    }
  }, [syncState, isMaster, isLoading]);

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

    results.forEach((item) => {
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

  const videoSrc = syncState?.videoSrc ?? camera.video;
  const showEndedOverlaySmall = !isMaster && syncState?.isEnded;

  return (
    <div
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={(event) => {
        if (!onClick || (event.key !== "Enter" && event.key !== " ")) return;
        event.preventDefault();
        onClick();
      }}
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
          onLoadedMetadata={() => {
            const v = videoRef.current;
            if (!v || isLoading) return;
            if (!isMaster && syncState) {
              v.currentTime = syncState.isEnded ? Math.max(0, v.duration - 0.05) : syncState.currentTime;
            }
          }}
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
    </div>
  );
};

export default CameraTile;
