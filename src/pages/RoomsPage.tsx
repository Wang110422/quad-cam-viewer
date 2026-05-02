import { rooms, statusOrder, type RoomStatusType } from "@/data/rooms";
import AppSidebar from "@/components/AppSidebar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, DoorOpen, Eye, Users } from "lucide-react";
import { useMemo } from "react";

const statusLabel: Record<RoomStatusType, string> = {
  live: "Đang diễn ra",
  ended: "Đã kết thúc",
  upcoming: "Chưa diễn ra",
};

const dotClass: Record<RoomStatusType, string> = {
  live: "bg-emerald-500",
  ended: "bg-yellow-500",
  upcoming: "bg-white border border-border",
};

const RoomsPage = () => {
  const sorted = useMemo(
    () => [...rooms].sort((a, b) => statusOrder[a.roomStatus] - statusOrder[b.roomStatus]),
    [],
  );

  return (
    <div className="flex h-screen overflow-hidden">
      <AppSidebar activeKey="rooms" />
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <h1 className="text-xl font-bold text-foreground">Quản lý phòng thi</h1>
            <p className="text-sm text-muted-foreground">Danh sách các phòng thi và trạng thái hoạt động</p>
          </div>
        </header>
        <div className="flex-1 overflow-auto p-6 space-y-3">
          {sorted.map((r) => (
            <Card key={r.id} className="p-4 flex flex-wrap items-center gap-4">
              <span className={`w-3 h-3 rounded-full shrink-0 ${dotClass[r.roomStatus]}`} />
              <div className="min-w-[180px]">
                <div className="font-semibold text-foreground flex items-center gap-2">
                  <DoorOpen className="w-4 h-4 text-muted-foreground" />
                  {r.room}
                </div>
                <div className="text-xs text-muted-foreground">Lớp {r.className}</div>
              </div>
              <div className="text-sm text-muted-foreground flex items-center gap-1.5">
                <Building2 className="w-4 h-4" /> {r.building} • {r.floor}
              </div>
              <div className="text-sm text-muted-foreground flex items-center gap-1.5">
                <Eye className="w-4 h-4" /> {r.supervisor}
              </div>
              <div className="text-sm text-muted-foreground">
                {r.startTime} → {r.endTime}
              </div>
              <div className="ml-auto flex items-center gap-3">
                {r.roomStatus === "live" ? (
                  <div className="text-sm flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <span className="text-emerald-600 font-medium">{r.present} có mặt</span>
                    <span className="text-muted-foreground">·</span>
                    <span className="text-destructive font-medium">{r.absent} vắng</span>
                  </div>
                ) : r.roomStatus === "ended" ? (
                  <div className="text-sm text-muted-foreground">SS: {r.students}</div>
                ) : (
                  <div className="text-sm text-muted-foreground italic">—</div>
                )}
                <Badge variant="outline">{statusLabel[r.roomStatus]}</Badge>
              </div>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
};

export default RoomsPage;
