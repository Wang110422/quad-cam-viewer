import { CameraData } from "@/data/cameras";
import { Maximize2, Users, CircleAlert } from "lucide-react";
import CameraTile from "./CameraTile";
import { useCameraSync } from "@/contexts/CameraSyncContext";

interface CameraGridProps {
  cameras: CameraData[];
  selectedId: number | null;
  onSelect: (id: number) => void;
}

const CameraGrid = ({ cameras, selectedId, onSelect }: CameraGridProps) => {
  const { getState } = useCameraSync();

  return (
    <div className="grid grid-cols-2 gap-4">
      {cameras.map((cam) => {
        const syncState = getState(cam.id);
        const isEnded = syncState?.isEnded ?? false;

        return (
        <div
          key={cam.id}
          className={`relative rounded-xl overflow-hidden border-2 transition-all group ${
            selectedId === cam.id
              ? "border-primary shadow-[0_0_20px_hsl(var(--primary)/0.3)]"
              : "border-border hover:border-primary/50"
          }`}
        >
          {/*
            Mỗi tile có loading 5s + buffer skeleton + canvas overlay RIÊNG.
            Hiệu ứng vẽ của camera này không ảnh hưởng tới camera khác.
          */}
          <CameraTile
            camera={cam}
            size="small"
            onClick={() => onSelect(cam.id)}
          />

          {/* Overlay top */}
          <div className="pointer-events-none absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-3 py-2 bg-gradient-to-b from-black/70 to-transparent">
            <div className="flex items-center gap-2">
              <span
                className={`w-2 h-2 rounded-full ${
                  isEnded ? "bg-warning" : "bg-success animate-pulse"
                }`}
              />
              <span className="text-sm font-medium text-white">{cam.name}</span>
            </div>
            <Maximize2 className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>

          {/* Overlay bottom */}
          <div className="pointer-events-none absolute bottom-0 left-0 right-0 z-20 flex items-center justify-between px-3 py-2 bg-gradient-to-t from-black/70 to-transparent">
            <span className="text-sm text-white">Lớp {cam.className}</span>
            <div className="flex items-center gap-3 text-sm text-white">
              <div className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5" />
                {cam.students}
              </div>
              {isEnded && (
                <div className="flex items-center gap-1">
                  <CircleAlert className="h-3.5 w-3.5" />
                  Kết thúc
                </div>
              )}
            </div>
          </div>
        </div>
      );})}
    </div>
  );
};

export default CameraGrid;
