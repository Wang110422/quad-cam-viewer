import { useEffect, useRef, useState } from "react";
import { CameraData } from "@/data/cameras";
import { socketService } from "@/services/socketServices";
import SKELETON_CONNECTIONS from "@/const/skeleton_collections";
import { Clock3 } from "lucide-react";

interface CameraTileProps {
  camera: CameraData;
  /** small = ô grid; large = chế độ detail */
  size?: "small" | "large";
  /** Có hiển thị thanh điều khiển video gốc không (chỉ dành cho large). */
  showControls?: boolean;
  /** Tự động phát khi xong loading. */
  autoPlayAfterLoading?: boolean;
  /** Callback khi video phát hết. */
  onEnded?: (id: number) => void;
  /** Khi click vào tile (dùng cho grid). */
  onClick?: () => void;
  className?: string;
}

/**
 * Component hiển thị 1 luồng camera kèm overlay AI (bounding box + skeleton).
 *
 * Mỗi instance HOÀN TOÀN ĐỘC LẬP:
 *  - Có loading 5s riêng
 *  - Có buffer kết quả AI riêng
 *  - Có canvas overlay + vòng lặp vẽ riêng
 *  - Có video element riêng
 *
 * Nhờ vậy, hiệu ứng skeleton / loading của camera này KHÔNG ảnh hưởng
 * tới camera khác – kể cả khi cùng nghe chung 1 socket.
 */
const CameraTile = ({
  camera,
  size = "small",
  showControls = false,
  autoPlayAfterLoading = true,
  onEnded,
  onClick,
  className = "",
}: CameraTileProps) => {
  const isEnded = camera.statusType === "ended";

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const requestRef = useRef<number | null>(null);
  const isLooping = useRef(false);
  const aiResultsBuffer = useRef<Map<number, any[]>>(new Map());

  const [isInitialLoading, setIsInitialLoading] = useState(!isEnded);
  const [hasEndedOnce, setHasEndedOnce] = useState(false);

  // Reset toàn bộ state/ref khi camera đổi (key ở cha cũng remount,
  // nhưng giữ guard này để chắc chắn).
  useEffect(() => {
    if (isEnded) {
      setIsInitialLoading(false);
      return;
    }

    aiResultsBuffer.current = new Map();
    isLooping.current = false;
    setIsInitialLoading(true);
    setHasEndedOnce(false);

    const socket = socketService.connect();

    const handleDataBox = (data: { timestamp: string | number; results: any[] }) => {
      const ts = Number(parseFloat(String(data.timestamp)).toFixed(1));
      aiResultsBuffer.current.set(ts, data.results);
    };

    socket.on("data_box", handleDataBox);

    // Đợi 5s cho AI khởi động
    const startTimer = setTimeout(() => {
      setIsInitialLoading(false);
      if (autoPlayAfterLoading) {
        setTimeout(() => {
          videoRef.current?.play().catch(() => {});
        }, 100);
      }
    }, 5000);

    return () => {
      clearTimeout(startTimer);
      socket.off("data_box", handleDataBox);
      socketService.release();
      isLooping.current = false;
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [camera.id, isEnded]);

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

    // AI giả định chạy trên frame 1920x1080
    const scaleX = canvas.width / 1920;
    const scaleY = canvas.height / 1080;

    // Đường nét nhỏ hơn cho ô grid để không che hết ảnh
    const boxLineWidth = size === "small" ? 1.5 : 2;
    const skeletonLineWidth = size === "small" ? 1.5 : 2;
    const fontSize = size === "small" ? 11 : 16;
    const labelHeight = size === "small" ? 14 : 20;
    const dotRadius = size === "small" ? 2 : 3;

    results.forEach((item: any) => {
      const [x1, y1, x2, y2] = item.box;
      const isNormal = String(item.action || "").includes("NORMAL");
      const color = isNormal ? "#22c55e" : "#ef4444";

      // Bounding box
      ctx.strokeStyle = color;
      ctx.lineWidth = boxLineWidth;
      ctx.strokeRect(x1 * scaleX, y1 * scaleY, (x2 - x1) * scaleX, (y2 - y1) * scaleY);

      // Label
      const label = `ID ${item.id}: ${item.action}`;
      ctx.font = `${fontSize}px Arial`;
      const textWidth = ctx.measureText(label).width;
      ctx.fillStyle = color;
      ctx.fillRect(x1 * scaleX, y1 * scaleY - labelHeight - 2, textWidth + 8, labelHeight);
      ctx.fillStyle = "white";
      ctx.fillText(label, x1 * scaleX + 4, y1 * scaleY - 6);

      // Skeleton
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

  // ====== UI cho phòng đã kết thúc (chỉ ở size small) ======
  if (isEnded && size === "small") {
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

  return (
    <Wrapper
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={`relative block w-full bg-black overflow-hidden ${className}`}
    >
      {/* Loading overlay (chỉ camera này) */}
      {isInitialLoading && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-2 text-foreground">
            <div
              className={`animate-spin rounded-full border-primary border-t-transparent ${
                size === "small" ? "h-6 w-6 border-2" : "h-10 w-10 border-4"
              }`}
            />
            <span className={`font-medium ${size === "small" ? "text-xs" : "text-sm"}`}>
              {size === "small" ? "Đang khởi tạo AI..." : "Đang khởi tạo AI Model (5s)..."}
            </span>
          </div>
        </div>
      )}

      <div className="relative w-full aspect-video">
        <video
          ref={videoRef}
          src={camera.video}
          poster={camera.image}
          className="absolute inset-0 w-full h-full object-cover"
          muted
          playsInline
          controls={showControls}
          onPlay={() => {
            isLooping.current = true;
            drawLoop();
          }}
          onPause={() => {
            isLooping.current = false;
          }}
          onEnded={() => {
            setHasEndedOnce(true);
            isLooping.current = false;
            onEnded?.(camera.id);
          }}
        />
        <canvas
          ref={canvasRef}
          className="pointer-events-none absolute inset-0 w-full h-full z-10"
        />
      </div>

      {/* Trạng thái Live/Ended ở góc */}
      {size === "small" && (
        <div className="pointer-events-none absolute top-2 left-2 z-20 flex items-center gap-1.5 rounded-full bg-background/80 px-2 py-0.5 text-xs font-medium text-foreground backdrop-blur-sm">
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              hasEndedOnce ? "bg-warning" : "bg-destructive animate-pulse"
            }`}
          />
          {hasEndedOnce ? "ENDED" : "LIVE"}
        </div>
      )}
    </Wrapper>
  );
};

export default CameraTile;
