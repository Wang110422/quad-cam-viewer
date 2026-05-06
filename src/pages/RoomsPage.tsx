import { useMemo, useState } from "react";
import { statusOrder, type RoomStatusType, type RoomData } from "@/data/rooms";
import { useRoomsStore, addRoom, removeRoom, updateRoom } from "@/data/roomsStore";
import AppSidebar from "@/components/AppSidebar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building2, DoorOpen, Eye, Pencil, Plus, Trash2, Users } from "lucide-react";
import RoomFormDialog, { type RoomFormValues } from "@/components/RoomFormDialog";
import { useToast } from "@/components/ui/use-toast";

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
  const rooms = useRoomsStore();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<RoomData | null>(null);

  const sorted = useMemo(
    () => [...rooms].sort((a, b) => statusOrder[a.roomStatus] - statusOrder[b.roomStatus]),
    [rooms],
  );

  const handleAdd = async (v: RoomFormValues) => {
    try {
      await addRoom({
        room: v.room,
        className: v.className,
        students: v.students,
        present: v.present,
        absent: v.absent,
        floor: v.floor,
        building: v.building,
        supervisor: v.supervisor,
        startTime: v.startTime, // ISO từ datetime-local
        endTime: v.endTime,
        roomStatus: "upcoming",
      });
      setOpen(false);
      toast({ title: "Đã thêm phòng thi", description: `${v.room} đã được thêm.` });
    } catch {
      toast({ title: "Không thể thêm phòng thi" });
    }
  };

  const handleEdit = async (v: RoomFormValues) => {
    if (!editing) return;
    try {
      await updateRoom(editing.id, {
        room: v.room,
        className: v.className,
        students: v.students,
        present: v.present,
        absent: v.absent,
        floor: v.floor,
        building: v.building,
        supervisor: v.supervisor,
        startTimeIso: v.startTime,
        endTimeIso: v.endTime,
      });
      setEditing(null);
      toast({ title: "Đã cập nhật phòng thi", description: v.room });
    } catch {
      toast({ title: "Không thể cập nhật phòng thi" });
    }
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <AppSidebar activeKey="rooms" />
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <h1 className="text-xl font-bold text-foreground">Quản lý phòng thi</h1>
            <p className="text-sm text-muted-foreground">Danh sách các phòng thi và trạng thái hoạt động</p>
          </div>
          <Button onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" /> Thêm phòng thi
          </Button>
        </header>
        <div className="flex-1 overflow-auto p-6 space-y-3">
          {sorted.length === 0 && (
            <div className="text-sm text-muted-foreground italic">Chưa có phòng thi.</div>
          )}
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
                <Button variant="ghost" size="icon" onClick={() => setEditing(r)}>
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:text-destructive"
                  disabled={r.roomStatus === "live"}
                  title={r.roomStatus === "live" ? "Không thể xóa phòng đang diễn ra" : "Xóa phòng thi"}
                  onClick={async () => {
                    if (r.roomStatus === "live") {
                      toast({ title: "Không thể xóa", description: "Phòng thi đang diễn ra." });
                      return;
                    }
                    if (!confirm(`Xóa ${r.room}?`)) return;
                    try {
                      await removeRoom(r.id);
                      toast({ title: "Đã xóa phòng thi", description: r.room });
                    } catch (err) {
                      toast({ title: "Không thể xóa", description: (err as Error).message });
                    }
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </main>

      <RoomFormDialog
        open={open}
        onOpenChange={setOpen}
        onSubmit={handleAdd}
        title="Thêm phòng thi"
        description="Phòng mới sẽ ở trạng thái 'Chưa diễn ra' cho đến khi gắn camera."
        submitLabel="Tạo phòng thi"
      />

      <RoomFormDialog
        open={Boolean(editing)}
        onOpenChange={(o) => !o && setEditing(null)}
        onSubmit={handleEdit}
        title="Sửa phòng thi"
        description="Cập nhật thông tin phòng thi."
        submitLabel="Lưu thay đổi"
        initialValues={
          editing
            ? {
                room: editing.room,
                className: editing.className,
                students: editing.students,
                present: editing.present,
                absent: editing.absent,
                floor: editing.floor,
                building: editing.building,
                supervisor: editing.supervisor,
                // Convert ISO -> datetime-local "YYYY-MM-DDTHH:mm"
                startTime: editing.startTimeIso?.slice(0, 16) ?? "",
                endTime: editing.endTimeIso?.slice(0, 16) ?? "",
              }
            : undefined
        }
      />
    </div>
  );
};

export default RoomsPage;
