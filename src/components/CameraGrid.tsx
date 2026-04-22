import { CameraData } from "@/data/cameras";
import { Maximize2, Users, Clock3, CircleAlert } from "lucide-react";

interface CameraGridProps {
  cameras: CameraData[];
  selectedId: number | null;
  onSelect: (id: number) => void;
}

const CameraGrid = ({ cameras, selectedId, onSelect }: CameraGridProps) => {
  return (
    <div className="grid grid-cols-2 gap-4">
      {cameras.map((cam) => (
        <button
          key={cam.id}
          onClick={() => onSelect(cam.id)}
          className={`relative rounded-xl overflow-hidden border-2 transition-all group ${
            selectedId === cam.id
              ? "border-primary shadow-[0_0_20px_hsl(var(--primary)/0.3)]"
              : "border-border hover:border-primary/50"
          }`}
        >
          {cam.statusType === "ended" ? (
            <div className="flex aspect-video w-full items-center justify-center bg-card">
              <div className="flex flex-col items-center gap-3 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                  <Clock3 className="h-7 w-7 text-muted-foreground" />
                </div>
                <div>
                  <div className="text-base font-semibold text-foreground">Phòng thi đã kết thúc</div>
                  <div className="text-sm text-muted-foreground">{cam.room} • {cam.endTime}</div>
                </div>
              </div>
            </div>
          ) : (
            <video
              src={cam.video}
              poster={cam.image}
              className="w-full aspect-video object-cover"
              autoPlay
              muted
              loop
              playsInline
            />
          )}
          {/* Overlay top */}
          <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-3 py-2 bg-gradient-to-b from-black/70 to-transparent">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${cam.statusType === "ended" ? "bg-warning" : "bg-success animate-pulse"}`} />
              <span className="text-sm font-medium text-foreground">{cam.name}</span>
            </div>
            <Maximize2 className="w-4 h-4 text-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          {/* Overlay bottom */}
          <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-3 py-2 bg-gradient-to-t from-black/70 to-transparent">
            <span className="text-sm text-foreground">Lớp {cam.className}</span>
            <div className="flex items-center gap-3 text-sm text-foreground">
              <div className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5" />
                {cam.students}
              </div>
              {cam.statusType === "ended" && (
                <div className="flex items-center gap-1 text-warning-foreground/90">
                  <CircleAlert className="h-3.5 w-3.5" />
                  Kết thúc
                </div>
              )}
            </div>
          </div>
        </button>
      ))}
    </div>
  );
};

export default CameraGrid;
