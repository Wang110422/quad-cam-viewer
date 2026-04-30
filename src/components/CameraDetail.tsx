import { type ComponentType, useEffect, useRef, useState } from "react";
import { CameraData } from "@/data/cameras";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  CameraIcon,
  AlertTriangle,
  Users,
  CheckCircle,
  UserX,
  Flag,
  FileDown,
  Pencil,
  Trash2,
  Clock3,
} from "lucide-react";
import { socketService } from "@/services/socketServices";
import SKELETON_CONNECTIONS from "@/const/skeleton_collections";

interface CameraDetailProps {
  camera: CameraData;
  onClose: () => void;
  onDelete: (id: number) => void;
  onEdit: (camera: CameraData) => void;
  onExport: (camera: CameraData) => void;
  onVideoEnded: (id: number) => void;
}

const CameraDetail = ({
  camera,
  onClose,
  onDelete,
  onEdit,
  onExport,
  onVideoEnded,
}: CameraDetailProps) => {
  const isEnded = camera.statusType === "ended";

  // Refs riêng biệt cho TỪNG camera instance (mỗi lần mở camera khác sẽ tạo lại)
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const requestRef = useRef<number | null>(null);
  const isLooping = useRef(false);
  const aiResultsBuffer = useRef<Map<number, any[]>>(new Map());

  // States nội bộ – tách biệt theo từng camera (component remount khi camera.id đổi nhờ key ở cha)
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [hasEndedOnce, setHasEndedOnce] = useState(false);
  const [showReplayOverlay, setShowReplayOverlay] = useState(true);

  // Reset toàn bộ state/refs khi đổi camera
  useEffect(() => {
    aiResultsBuffer.current = new Map();
    isLooping.current = false;
    setIsInitialLoading(true);
    setHasEndedOnce(false);
    setShowReplayOverlay(true);

    const socket = socketService.connect();

    const handleConnect = () => {
      console.log(`✅ Socket connected (cam ${camera.id}):`, socket.id);
    };

    const handleDataBox = (data: { timestamp: string | number; results: any[] }) => {
      const ts = Number(parseFloat(String(data.timestamp)).toFixed(1));
      aiResultsBuffer.current.set(ts, data.results);
    };

    socket.on("connect", handleConnect);
    socket.on("data_box", handleDataBox);

    // Đợi 5s cho AI khởi động
    const startTimer = setTimeout(() => {
      setIsInitialLoading(false);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.play().catch((err) => console.log("Autoplay blocked:", err));
        }
      }, 100);
    }, 5000);

    return () => {
      clearTimeout(startTimer);
      socket.off("connect", handleConnect);
      socket.off("data_box", handleDataBox);
      socketService.disconnect();
      isLooping.current = false;
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [camera.id]);

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

    results.forEach((item: any) => {
      const [x1, y1, x2, y2] = item.box;
      const isNormal = String(item.action || "").includes("NORMAL");
      const color = isNormal ? "#22c55e" : "#ef4444";

      // Bounding box
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.strokeRect(x1 * scaleX, y1 * scaleY, (x2 - x1) * scaleX, (y2 - y1) * scaleY);

      // Label
      const label = `ID ${item.id}: ${item.action}`;
      ctx.font = "16px Arial";
      const textWidth = ctx.measureText(label).width;
      ctx.fillStyle = color;
      ctx.fillRect(x1 * scaleX, y1 * scaleY - 25, textWidth + 10, 20);
      ctx.fillStyle = "white";
      ctx.fillText(label, x1 * scaleX + 5, y1 * scaleY - 10);

      // Skeleton
      if (item.keypoints && item.conf) {
        ctx.lineWidth = 2;
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
            ctx.arc(kpt[0] * scaleX, kpt[1] * scaleY, 3, 0, 2 * Math.PI);
            ctx.fillStyle = "white";
            ctx.fill();
          }
        });
      }
    });
  };

  const handleReplay = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play();
    }
    setShowReplayOverlay(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <button
          onClick={onClose}
          className="flex items-center gap-1 text-sm text-primary hover:underline"
        >
          <ArrowLeft className="w-4 h-4" /> Thu nhỏ
        </button>
        <h2 className="text-lg font-bold text-foreground">{camera.name}</h2>
      </div>

      <div className="flex gap-4 xl:flex-row flex-col">
        <div className="flex-1 rounded-xl overflow-hidden border border-border relative bg-black">
          {/* Loading overlay */}
          {isInitialLoading && (
            <div className="absolute inset-0 z-30 flex items-center justify-center bg-background/80 backdrop-blur-sm">
              <div className="flex flex-col items-center gap-3 text-foreground">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                <span className="text-sm font-medium">
                  Đang khởi tạo AI Model (5s)...
                </span>
              </div>
            </div>
          )}

          {/* Replay overlay khi video đã kết thúc */}
          {showReplayOverlay && hasEndedOnce && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-background/80 backdrop-blur-sm">
              <div className="flex flex-col items-center gap-4 text-center px-6">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                  <Clock3 className="h-8 w-8 text-muted-foreground" />
                </div>
                <div>
                  <div className="text-xl font-semibold text-foreground">
                    Phòng thi đã kết thúc
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Bạn có thể xem lại video và tua tự do
                  </div>
                </div>
                <button
                  onClick={handleReplay}
                  className="mt-2 rounded-full bg-primary px-6 py-2 font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  Xem lại từ đầu
                </button>
              </div>
            </div>
          )}

          {/* Video + canvas overlay */}
          <div className="relative w-full aspect-video">
            <video
              ref={videoRef}
              src={camera.video}
              poster={camera.image}
              className="absolute inset-0 w-full h-full object-cover"
              controls
              muted
              playsInline
              onPlay={() => {
                isLooping.current = true;
                drawLoop();
              }}
              onPause={() => {
                isLooping.current = false;
              }}
              onEnded={() => {
                setHasEndedOnce(true);
                setShowReplayOverlay(true);
                isLooping.current = false;
                onVideoEnded(camera.id);
              }}
            />
            <canvas
              ref={canvasRef}
              className="pointer-events-none absolute inset-0 w-full h-full"
            />
          </div>

          <div className="absolute top-4 left-4 z-10 flex items-center gap-2 rounded-full bg-background/90 px-3 py-1 text-sm font-medium text-foreground backdrop-blur-sm">
            <span
              className={`h-2 w-2 rounded-full ${
                isEnded || hasEndedOnce
                  ? "bg-warning"
                  : "bg-destructive animate-pulse"
              }`}
            />
            {isEnded || hasEndedOnce ? "ENDED" : "LIVE"}
          </div>
          <div className="absolute bottom-16 right-4 z-10 rounded-md bg-background/75 px-3 py-1 text-sm text-foreground shadow-sm backdrop-blur-sm">
            {camera.endTime}
          </div>
        </div>

        <div className="w-full xl:w-[420px] shrink-0 flex flex-col gap-4">
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h3 className="font-semibold text-foreground">Thông tin camera</h3>
                <p className="text-sm text-muted-foreground">
                  Chi tiết lớp, phòng thi và thời gian giám sát.
                </p>
              </div>
              <span
                className={`rounded-full px-2 py-1 text-xs font-medium ${
                  isEnded
                    ? "bg-warning/15 text-warning"
                    : "bg-success/15 text-success"
                }`}
              >
                {camera.status}
              </span>
            </div>
            <div className="space-y-2 text-sm">
              {[
                ["Tên camera", camera.name],
                ["Tên lớp", camera.className],
                ["Số học sinh", String(camera.students)],
                ["Phòng thi", camera.room],
                ["Tầng", camera.floor],
                ["Tòa nhà", camera.building],
                ["Giám thị", camera.supervisor],
                ["Thời gian bắt đầu", camera.startTime],
                ["Thời gian kết thúc", camera.endTime],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between">
                  <span className="text-muted-foreground">{label}</span>
                  <span className="text-foreground font-medium">{value}</span>
                </div>
              ))}
              {camera.notes && (
                <div className="rounded-lg bg-accent/60 p-3 text-sm text-muted-foreground">
                  {camera.notes}
                </div>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-4">
            <h3 className="font-semibold text-foreground mb-3">Thống kê</h3>
            <div className="grid grid-cols-2 gap-3">
              <StatCard icon={Users} label="Tổng số học sinh" value={camera.students} color="primary" />
              <StatCard icon={CheckCircle} label="Có mặt" value={camera.present} color="success" />
              <StatCard icon={UserX} label="Vắng mặt" value={camera.absent} color="warning" />
              <StatCard icon={Flag} label="Sự kiện" value={isEnded || hasEndedOnce ? 1 : 0} color="destructive" />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <Button className="justify-start" onClick={() => onEdit(camera)}>
              <Pencil className="w-4 h-4" /> Sửa thông tin
            </Button>
            <Button variant="outline" className="justify-start" onClick={() => onExport(camera)}>
              <FileDown className="w-4 h-4" /> Xuất file
            </Button>
            <Button variant="destructive" className="justify-start" onClick={() => onDelete(camera.id)}>
              <Trash2 className="w-4 h-4" /> Xóa camera
            </Button>
            <Button variant="secondary" className="justify-start" disabled>
              <CameraIcon className="w-4 h-4" /> Theo dõi trực tiếp
            </Button>
          </div>

          <div className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
            <div className="mb-2 flex items-center gap-2 text-foreground font-medium">
              <AlertTriangle className="h-4 w-4 text-warning" /> Trạng thái giám sát
            </div>
            {isEnded || hasEndedOnce
              ? "Video camera đã phát hết, hệ thống đánh dấu phòng thi này là đã kết thúc."
              : "Camera đang phát video giám sát. Khi video kết thúc, phòng thi sẽ tự động chuyển trạng thái hoàn tất."}
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: number;
  color: string;
}) => {
  const colorMap: Record<string, string> = {
    primary: "bg-primary/15 text-primary",
    success: "bg-[hsl(142_76%_36%/0.15)] text-[hsl(142,76%,36%)]",
    warning: "bg-[hsl(38_92%_50%/0.15)] text-[hsl(38,92%,50%)]",
    destructive: "bg-destructive/15 text-destructive",
  };

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-accent/50">
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${colorMap[color]}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div>
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="text-xl font-bold text-foreground">{value}</div>
      </div>
    </div>
  );
};

export default CameraDetail;
