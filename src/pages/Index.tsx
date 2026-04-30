import { useMemo, useState } from "react";
import { cameras, type CameraData } from "@/data/cameras";
import AppSidebar from "@/components/AppSidebar";
import CameraGrid from "@/components/CameraGrid";
import CameraDetail from "@/components/CameraDetail";
import RoomFormDialog, { type RoomFormValues } from "@/components/RoomFormDialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Calendar, Clock, Bell, Plus } from "lucide-react";
import { CameraSyncProvider } from "@/contexts/CameraSyncContext";

const formatDateTime = (value: string) => {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const toEditableDateTime = (value: string) => {
  const parts = value.match(/(\d{2})\/(\d{2})\/(\d{4})\s(\d{2}):(\d{2})/);
  if (!parts) return value;
  const [, day, month, year, hour, minute] = parts;
  return `${year}-${month}-${day}T${hour}:${minute}`;
};

const createCameraFromForm = (id: number, values: RoomFormValues, fallbackImage: string): CameraData => ({
  id,
  name: values.name.trim(),
  room: values.room.trim(),
  className: values.className.trim(),
  students: values.students,
  present: values.present,
  absent: values.absent,
  floor: values.floor.trim(),
  building: values.building.trim(),
  supervisor: values.supervisor.trim(),
  status: "Đang hoạt động",
  statusType: "live",
  startTime: formatDateTime(values.startTime),
  endTime: formatDateTime(values.endTime),
  image: fallbackImage,
  video: values.videoFile ? URL.createObjectURL(values.videoFile) : "",
  notes: values.notes.trim(),
});

const Index = () => {
  const { toast } = useToast();
  const [cameraList, setCameraList] = useState<CameraData[]>(cameras);
  const [selectedCameraId, setSelectedCameraId] = useState<number | null>(null);
  const [isCreateDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingCamera, setEditingCamera] = useState<CameraData | null>(null);

  const selectedCamera = cameraList.find((c) => c.id === selectedCameraId) || null;
  const nextCameraId = useMemo(() => Math.max(0, ...cameraList.map((camera) => camera.id)) + 1, [cameraList]);

  const handleVideoEnded = (cameraId: number) => {
    setCameraList((prev) =>
      prev.map((camera) =>
        camera.id === cameraId
          ? { ...camera, status: "Phòng thi đã kết thúc", statusType: "ended" }
          : camera,
      ),
    );
  };

  const handleAddRoom = (values: RoomFormValues) => {
    const fallbackImage = cameraList[0]?.image ?? "";
    const nextCamera = createCameraFromForm(nextCameraId, values, fallbackImage);

    setCameraList((prev) => [...prev, nextCamera]);
    setSelectedCameraId(nextCamera.id);
    setCreateDialogOpen(false);
    toast({ title: "Đã thêm phòng thi", description: `${nextCamera.room} đã được thêm vào danh sách camera.` });
  };

  const handleEditRoom = (values: RoomFormValues) => {
    if (!editingCamera) return;

    setCameraList((prev) =>
      prev.map((camera) => {
        if (camera.id !== editingCamera.id) return camera;

        const nextVideo = values.videoFile ? URL.createObjectURL(values.videoFile) : camera.video;

        return {
          ...camera,
          name: values.name.trim(),
          room: values.room.trim(),
          className: values.className.trim(),
          students: values.students,
          present: values.present,
          absent: values.absent,
          floor: values.floor.trim(),
          building: values.building.trim(),
          supervisor: values.supervisor.trim(),
          startTime: formatDateTime(values.startTime),
          endTime: formatDateTime(values.endTime),
          notes: values.notes.trim(),
          video: nextVideo,
          status: camera.statusType === "ended" ? "Phòng thi đã kết thúc" : "Đang hoạt động",
        };
      }),
    );

    setEditingCamera(null);
    toast({ title: "Đã cập nhật camera", description: "Thông tin phòng thi đã được chỉnh sửa." });
  };

  const handleDeleteRoom = (cameraId: number) => {
    setCameraList((prev) => prev.filter((camera) => camera.id !== cameraId));
    if (selectedCameraId === cameraId) setSelectedCameraId(null);
    toast({ title: "Đã xóa camera", description: "Camera đã được xóa khỏi danh sách giám sát." });
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

    const escapeCsv = (text: string) => text.replace(/"/g, '""');
    const csv = rows.map(([label, value]) => `"${escapeCsv(label)}","${escapeCsv(value)}"`).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${camera.room.toLowerCase().replace(/\s+/g, "-")}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);

    toast({ title: "Đã xuất file", description: `Tệp thông tin của ${camera.room} đã được tải xuống.` });
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <AppSidebar />
      <main className="flex-1 flex flex-col overflow-hidden">
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

        <div className="flex-1 overflow-auto p-6 space-y-6">
          <section className="flex items-start justify-between gap-4 rounded-xl border border-border bg-card p-5">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Danh sách phòng thi</h2>
              <p className="text-sm text-muted-foreground">Quản lý video camera, theo dõi trạng thái và cập nhật nhanh thông tin phòng thi.</p>
            </div>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="h-4 w-4" /> Thêm phòng
            </Button>
          </section>

          <CameraGrid
            cameras={cameraList}
            selectedId={selectedCameraId}
            onSelect={setSelectedCameraId}
          />
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

      <RoomFormDialog
        open={isCreateDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSubmit={handleAddRoom}
        title="Thêm phòng thi"
        description="Điền thông tin phòng thi và tải video camera để hiển thị trong lưới giám sát."
        submitLabel="Tạo phòng"
        requireVideo
      />

      <RoomFormDialog
        open={Boolean(editingCamera)}
        onOpenChange={(open) => !open && setEditingCamera(null)}
        onSubmit={handleEditRoom}
        title="Sửa thông tin camera"
        description="Cập nhật lớp, phòng thi, thời gian hoặc thay video camera khi cần."
        submitLabel="Lưu thay đổi"
        initialValues={editingCamera ? {
          name: editingCamera.name,
          room: editingCamera.room,
          className: editingCamera.className,
          students: editingCamera.students,
          present: editingCamera.present,
          absent: editingCamera.absent,
          floor: editingCamera.floor,
          building: editingCamera.building,
          supervisor: editingCamera.supervisor,
          startTime: toEditableDateTime(editingCamera.startTime),
          endTime: toEditableDateTime(editingCamera.endTime),
          notes: editingCamera.notes ?? "",
        } : undefined}
      />
    </div>
  );
};

export default Index;
