import { useState } from "react";
import { cameras } from "@/data/cameras";
import AppSidebar from "@/components/AppSidebar";
import CameraGrid from "@/components/CameraGrid";
import CameraDetail from "@/components/CameraDetail";
import { Calendar, Clock, Bell } from "lucide-react";

const Index = () => {
  const [selectedCameraId, setSelectedCameraId] = useState<number | null>(null);
  const selectedCamera = cameras.find((c) => c.id === selectedCameraId) || null;

  return (
    <div className="flex h-screen overflow-hidden">
      <AppSidebar />
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <h1 className="text-xl font-bold text-foreground">Giám sát camera</h1>
            <p className="text-sm text-muted-foreground">
              Theo dõi các phòng thi đang hoạt động
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="w-4 h-4" />
              <span>24/05/2025</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span>09:15:30</span>
            </div>
            <button className="relative p-2 rounded-lg hover:bg-accent transition-colors">
              <Bell className="w-5 h-5 text-muted-foreground" />
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-destructive text-destructive-foreground text-[10px] flex items-center justify-center font-bold">
                3
              </span>
            </button>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6 space-y-6">
          <CameraGrid
            cameras={cameras}
            selectedId={selectedCameraId}
            onSelect={setSelectedCameraId}
          />
          {selectedCamera && (
            <CameraDetail
              camera={selectedCamera}
              onClose={() => setSelectedCameraId(null)}
            />
          )}
        </div>
      </main>
    </div>
  );
};

export default Index;
