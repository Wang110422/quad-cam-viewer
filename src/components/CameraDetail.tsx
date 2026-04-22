import { type ComponentType } from "react";
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

interface CameraDetailProps {
  camera: CameraData;
  onClose: () => void;
  onDelete: (id: number) => void;
  onEdit: (camera: CameraData) => void;
  onExport: (camera: CameraData) => void;
  onVideoEnded: (id: number) => void;
}

const CameraDetail = ({ camera, onClose, onDelete, onEdit, onExport, onVideoEnded }: CameraDetailProps) => {
  const isEnded = camera.statusType === "ended";

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <button onClick={onClose} className="flex items-center gap-1 text-sm text-primary hover:underline">
          <ArrowLeft className="w-4 h-4" /> Thu nhỏ
        </button>
        <h2 className="text-lg font-bold text-foreground">{camera.name}</h2>
      </div>

      <div className="flex gap-4 xl:flex-row flex-col">
        <div className="flex-1 rounded-xl overflow-hidden border border-border relative">
          {isEnded ? (
            <div className="flex aspect-video w-full items-center justify-center bg-card">
              <div className="flex flex-col items-center gap-4 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                  <Clock3 className="h-8 w-8 text-muted-foreground" />
                </div>
                <div>
                  <div className="text-xl font-semibold text-foreground">Phòng thi đã kết thúc</div>
                  <div className="text-sm text-muted-foreground">Video đã phát hết • {camera.endTime}</div>
                </div>
              </div>
            </div>
          ) : (
            <video
              src={camera.video}
              poster={camera.image}
              className="w-full aspect-video object-cover"
              controls
              autoPlay
              muted
              playsInline
              onEnded={() => onVideoEnded(camera.id)}
            />
          )}
          <div className="absolute top-4 left-4 flex items-center gap-2 rounded-full bg-background/90 px-3 py-1 text-sm font-medium text-foreground backdrop-blur-sm">
            <span className={`h-2 w-2 rounded-full ${isEnded ? "bg-warning" : "bg-destructive animate-pulse"}`} />
            {isEnded ? "ENDED" : "LIVE"}
          </div>
          <div className="absolute bottom-4 right-4 rounded-md bg-background/75 px-3 py-1 text-sm text-foreground shadow-sm backdrop-blur-sm">
            {camera.endTime}
          </div>
        </div>

        <div className="w-full xl:w-[420px] shrink-0 flex flex-col gap-4">
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h3 className="font-semibold text-foreground">Thông tin camera</h3>
                <p className="text-sm text-muted-foreground">Chi tiết lớp, phòng thi và thời gian giám sát.</p>
              </div>
              <span className={`rounded-full px-2 py-1 text-xs font-medium ${isEnded ? "bg-warning/15 text-warning" : "bg-success/15 text-success"}`}>
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
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between">
                  <span className="text-muted-foreground">{label}</span>
                  <span className="text-foreground font-medium">{value}</span>
                </div>
              ))}
              {[
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
              <StatCard icon={Flag} label="Sự kiện" value={isEnded ? 1 : 0} color="destructive" />
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
            {isEnded
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
