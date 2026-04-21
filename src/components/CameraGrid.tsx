import { CameraData } from "@/data/cameras";
import { Maximize2, Users } from "lucide-react";

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
          <img
            src={cam.image}
            alt={cam.name}
            className="w-full aspect-video object-cover"
          />
          {/* Overlay top */}
          <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-3 py-2 bg-gradient-to-b from-black/70 to-transparent">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[hsl(var(--success))] animate-pulse" />
              <span className="text-sm font-medium text-foreground">{cam.name}</span>
            </div>
            <Maximize2 className="w-4 h-4 text-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          {/* Overlay bottom */}
          <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-3 py-2 bg-gradient-to-t from-black/70 to-transparent">
            <span className="text-sm text-foreground">Lớp {cam.className}</span>
            <div className="flex items-center gap-1 text-sm text-foreground">
              <Users className="w-3.5 h-3.5" />
              {cam.students}
            </div>
          </div>
        </button>
      ))}
    </div>
  );
};

export default CameraGrid;
