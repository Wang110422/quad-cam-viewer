import { useMemo, useState } from "react";
import { cameras, type CameraData } from "@/data/cameras";
import AppSidebar from "@/components/AppSidebar";
import CameraGrid from "@/components/CameraGrid";
import CameraDetail from "@/components/CameraDetail";
import CameraFormDialog, { type CameraFormValues } from "@/components/CameraFormDialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Calendar, Clock, Bell, Plus } from "lucide-react";
import { CameraSyncProvider } from "@/contexts/CameraSyncContext";
import { useRoomsStore } from "@/data/roomsStore";

const Index = () => {
  const { toast } = useToast();
  const rooms = useRoomsStore();
  const [cameraList, setCameraList] = useState<CameraData[]>(cameras);
  const [selectedCameraId, setSelectedCameraId] = useState<number | null>(null);
  const [isCreateDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingCamera, setEditingCamera] = useState<CameraData | null>(null);

  const selectedCamera = cameraList.find((c) => c.id === selectedCameraId) || null;
  const nextCameraId = useMemo(() => Math.max(0, ...cameraList.map((c) => c.id)) + 1, [cameraList]);

  const handleVideoEnded = (cameraId: number) => {
    setCameraList((prev) =>
      prev.map((c) => (c.id === cameraId ? { ...c, status: "Phòng thi đã kết thúc", statusType: "ended" } : c)),
    );
  };

  const buildCameraFromRoom = (id: number, values: CameraFormValues): CameraData | null => {
    const room = rooms.find((r) => r.id === values.roomId);
    if (!room) return null;
    const fallbackImage = cameraList[0]?.image ?? room.image ?? "";
    return {
      id,
      name: values.name.trim(),
      room: room.room,
      className: room.className,
      students: room.students,
      present: room.present,
      absent: room.absent,
      floor: room.floor,
      building: room.building,
      supervisor: room.supervisor,
      status: "Đang hoạt động",
      statusType: "live",
      startTime: room.startTime,
      endTime: room.endTime,
      image: fallbackImage,
      video: values.videoFile ? URL.createObjectURL(values.videoFile) : "",
      notes: values.notes.trim(),
    };
  };

  const handleAddCamera = (values: CameraFormValues) => {
    const next = buildCameraFromRoom(nextCameraId, values);
    if (!next) return;
    setCameraList((prev) => [...prev, next]);
    setSelectedCameraId(next.id);
    setCreateDialogOpen(false);
    toast({ title: "Đã thêm camera", description: `${next.name} đã được thêm.` });
  };

  const handleEditCamera = (values: CameraFormValues) => {
    if (!editingCamera) return;
    const room = rooms.find((r) => r.id === values.roomId);
    if (!room) return;
    setCameraList((prev) =>
      prev.map((c) => {
        if (c.id !== editingCamera.id) return c;
        const nextVideo = values.videoFile ? URL.createObjectURL(values.videoFile) : c.video;
        return {
          ...c,
          name: values.name.trim(),
          room: room.room,
          className: room.className,
          students: room.students,
          present: room.present,
          absent: room.absent,
          floor: room.floor,
          building: room.building,
          supervisor: room.supervisor,
          startTime: room.startTime,
          endTime: room.endTime,
          notes: values.notes.trim(),
          video: nextVideo,
        };
      }),
    );
    setEditingCamera(null);
    toast({ title: "Đã cập nhật camera" });
  };

  const handleDeleteRoom = (cameraId: number) => {
    setCameraList((prev) => prev.filter((c) => c.id !== cameraId));
    if (selectedCameraId === cameraId) setSelectedCameraId(null);
    toast({ title: "Đã xóa camera" });
  };

  const handleExportRoom = (camera: CameraData) => {
    const rows = [
      ["Tên camera", camera.name],
      ["Lớp", camera.className],
      ["Phòng thi", camera.room],
      ["Số sinh viên", String(camera.students)],
      ["Có mặt", String(camera.present)],
      ["Vắng mặt", String(camera.absent)],
      ["Giám thị", camera.supervisor],
      ["Tầng", camera.floor],
      ["Tòa nhà", camera.building],
      ["Bắt đầu", camera.startTime],
      ["Kết thúc", camera.endTime],
      ["Trạng thái", camera.status],
      ["Ghi chú", camera.notes ?? ""],
    ];
    const escape = (t: string) => t.replace(/"/g, '""');
    const csv = rows.map(([l, v]) => `"${escape(l)}","${escape(v)}"`).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${camera.room.toLowerCase().replace(/\s+/g, "-")}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    toast({ title: "Đã xuất file" });
  };

  const editingRoomId = editingCamera
    ? rooms.find((r) => r.room === editingCamera.room)?.id ?? null
    : null;

  return (
    <CameraSyncProvider>
      <div className="flex h-screen overflow-hidden">
        <AppSidebar />
        <main className="flex-1 flex flex-col overflow-hidden">
          <header className="flex items-center justify-between px-6 py-4 border-b border-border">
            <div>
              <h1 className="text-xl font-bold text-foreground">Giám sát camera</h1>
              <p className="text-sm text-muted-foreground">Theo dõi các phòng thi đang hoạt động</p>
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

          <div className="flex-1 overflow-auto p-6 space-y-6">
            <section className="flex items-start justify-between gap-4 rounded-xl border border-border bg-card p-5">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Danh sách camera</h2>
                <p className="text-sm text-muted-foreground">
                  Thêm camera bằng cách chọn phòng thi đã có; tầng, nhà, ngày, sĩ số, giám thị sẽ tự lấy theo phòng.
                </p>
              </div>
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="h-4 w-4" /> Thêm cam
              </Button>
            </section>

            <CameraGrid cameras={cameraList} selectedId={selectedCameraId} onSelect={setSelectedCameraId} />
            {selectedCamera && (
              <CameraDetail
                key={selectedCamera.id}
                camera={selectedCamera}
                onClose={() => setSelectedCameraId(null)}
                onDelete={handleDeleteRoom}
                onEdit={setEditingCamera}
                onExport={handleExportRoom}
                onVideoEnded={handleVideoEnded}
              />
            )}
          </div>
        </main>

        <CameraFormDialog
          open={isCreateDialogOpen}
          onOpenChange={setCreateDialogOpen}
          onSubmit={handleAddCamera}
          title="Thêm camera"
          description="Chọn phòng thi từ danh sách và tải video camera."
          submitLabel="Tạo camera"
          requireVideo
        />

        <CameraFormDialog
          open={Boolean(editingCamera)}
          onOpenChange={(open) => !open && setEditingCamera(null)}
          onSubmit={handleEditCamera}
          title="Sửa camera"
          description="Cập nhật phòng thi liên kết hoặc thay video camera."
          submitLabel="Lưu thay đổi"
          initialValues={
            editingCamera
              ? { name: editingCamera.name, roomId: editingRoomId, notes: editingCamera.notes ?? "" }
              : undefined
          }
        />
      </div>
    </CameraSyncProvider>
  );
};

export default Index;
