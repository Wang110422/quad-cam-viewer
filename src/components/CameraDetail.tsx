import { CameraData } from "@/data/cameras";
import {
  ArrowLeft,
  Pause,
  Volume2,
  CameraIcon,
  Maximize,
  LayoutGrid,
  RotateCcw,
  AlertTriangle,
  Users,
  CheckCircle,
  UserX,
  Flag,
} from "lucide-react";

interface CameraDetailProps {
  camera: CameraData;
  onClose: () => void;
}

const CameraDetail = ({ camera, onClose }: CameraDetailProps) => {
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

      <div className="flex gap-4">
        <div className="flex-1 rounded-xl overflow-hidden border border-border relative">
          <img
            src={camera.image}
            alt={camera.name}
            className="w-full aspect-video object-cover"
          />
          <div className="absolute top-4 left-4 flex items-center gap-2 bg-destructive/90 text-destructive-foreground px-3 py-1 rounded-full text-sm font-medium">
            <span className="w-2 h-2 rounded-full bg-destructive-foreground animate-pulse" />
            LIVE
          </div>
          <div className="absolute bottom-12 right-4 text-sm text-foreground/80">
            24/05/2025 09:15:30
          </div>
          <div className="absolute bottom-0 left-0 right-0 flex items-center justify-center gap-6 py-3 bg-black/60">
            {[Pause, Volume2, CameraIcon, Maximize, LayoutGrid].map(
              (Icon, i) => (
                <button
                  key={i}
                  className="p-2 text-foreground/80 hover:text-foreground transition-colors"
                >
                  <Icon className="w-5 h-5" />
                </button>
              )
            )}
          </div>
        </div>

        <div className="w-[420px] shrink-0 flex flex-col gap-4">
          <div className="rounded-xl border border-border bg-card p-4">
            <h3 className="font-semibold text-foreground mb-3">Thông tin camera</h3>
            <div className="space-y-2 text-sm">
              {[
                ["Tên camera", camera.name],
                ["Tên lớp", camera.className],
                ["Số học sinh", String(camera.students)],
                ["Phòng thi", camera.room],
                ["Tầng", camera.floor],
                ["Tòa nhà", camera.building],
                ["Giám thị", camera.supervisor],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between">
                  <span className="text-muted-foreground">{label}</span>
                  <span className="text-foreground font-medium">{value}</span>
                </div>
              ))}
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Trạng thái</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-[hsl(142_76%_36%/0.15)] text-[hsl(142,76%,36%)] font-medium">
                  {camera.status}
                </span>
              </div>
              {[
                ["Thời gian bắt đầu", camera.startTime],
                ["Thời gian kết thúc", camera.endTime],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between">
                  <span className="text-muted-foreground">{label}</span>
                  <span className="text-foreground font-medium">{value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-4">
            <h3 className="font-semibold text-foreground mb-3">Thống kê</h3>
            <div className="grid grid-cols-2 gap-3">
              <StatCard icon={Users} label="Tổng số học sinh" value={camera.students} color="primary" />
              <StatCard icon={CheckCircle} label="Có mặt" value={camera.present} color="success" />
              <StatCard icon={UserX} label="Vắng mặt" value={camera.absent} color="warning" />
              <StatCard icon={Flag} label="Sự kiện" value={0} color="destructive" />
            </div>
          </div>

          <div className="flex gap-2">
            <button className="flex-1 flex items-center justify-center gap-2 bg-primary text-primary-foreground py-2.5 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity">
              <RotateCcw className="w-4 h-4" /> Xem lại
            </button>
            <button className="flex-1 flex items-center justify-center gap-2 border border-border text-foreground py-2.5 rounded-lg text-sm font-medium hover:bg-accent transition-colors">
              <CameraIcon className="w-4 h-4" /> Chụp ảnh
            </button>
            <button className="flex-1 flex items-center justify-center gap-2 bg-destructive text-destructive-foreground py-2.5 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity">
              <AlertTriangle className="w-4 h-4" /> Báo cáo
            </button>
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
  icon: React.ComponentType<{ className?: string }>;
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
