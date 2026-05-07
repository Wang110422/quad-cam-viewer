import { useCallback, useEffect, useState } from "react";
import type { CameraData } from "@/data/cameras";
import AppSidebar from "@/components/AppSidebar";
import CameraGrid from "@/components/CameraGrid";
import CameraDetail from "@/components/CameraDetail";
import CameraFormDialog, { type CameraFormValues } from "@/components/CameraFormDialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Calendar, Clock, Bell, Plus } from "lucide-react";
import { CameraSyncProvider } from "@/contexts/CameraSyncContext";
import { useRoomsStore, setRoomStatus, getRawRooms } from "@/data/roomsStore";
import { camerasApi } from "@/api";
import { socketService } from "@/services/socketServices";

const Index = () => {
  const { toast } = useToast();
  const rooms = useRoomsStore();
  const [cameraList, setCameraList] = useState<CameraData[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<number | null>(null);
  const [isCreateDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingCamera, setEditingCamera] = useState<CameraData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // BACKEND CALL: GET /cameras — load + ghép thông tin từ rooms.
  const fetchCameras = useCallback(async () => {
    try {
      const cams = await camerasApi.list();
      const raw = getRawRooms();
      const mapped: CameraData[] = cams.map((c) => {
        const room = raw.find((r) => r.id === c.room_id);
        return {
          id: c.id,
          name: c.name,
          roomId: c.room_id,
          room: room?.name ?? "",
          className: room?.class_name ?? "",
          students: room?.total_students ?? 0,
          present: room?.present ?? 0,
          absent: room?.absent ?? 0,
          floor: room?.floor ?? "",
          building: room?.building ?? "",
          supervisor: room?.supervisor ?? "",
          startTime: room?.startTime ?? "",
          endTime: room?.endTime ?? "",
          image: "",
          video: c.video,
          notes: c.note,
        };
      });
      setCameraList(mapped);
    } catch (err) {
      console.error("Failed to load cameras", err);
    }
  }, []);

  useEffect(() => {
    fetchCameras();
  }, [fetchCameras]);

  /** Hiện overlay "Đang khởi tạo AI" 5s và emit video sang backend AI. */
  const runAiInit = (videoName: string, camId: number) => {
    setIsProcessing(true);
    socketService.emitVideo(videoName, camId);
    setTimeout(() => setIsProcessing(false), 5000);
  };

  const selectedCamera = cameraList.find((c) => c.id === selectedCameraId) || null;

  const handleVideoEnded = (cameraId: number) => {
    // Khi video phát hết -> phòng tương ứng chuyển status "ended"
    const cam = cameraList.find((c) => c.id === cameraId);
    if (cam) setRoomStatus(cam.roomId, "ended");
  };

  const buildCameraPayload = (values: CameraFormValues, video: string): Omit<CameraData, "id"> | null => {
    const room = rooms.find((r) => r.id === values.roomId);
    if (!room) return null;
    return {
      name: values.name.trim(),
      roomId: room.id,
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
      image: "",
      video,
      notes: values.notes.trim(),
    };
  };

  const handleAddCamera = async (values: CameraFormValues) => {
    if (!values.roomId) return;
    const videoUrl = values.videoFile ? URL.createObjectURL(values.videoFile) : "";

    try {
      // BACKEND CALL: POST /cameras
      const created = await camerasApi.create({
        name: values.name.trim(),
        room_id: values.roomId,
        note: values.notes.trim(),
        video: videoUrl,
      });

      // Optionally upload file thật:
      // if (values.videoFile) await camerasApi.uploadVideo(created.id, values.videoFile);

      const payload = buildCameraPayload(values, videoUrl);
      if (!payload) return;
      const newCam: CameraData = { ...payload, id: created.id };

      setSelectedCameraId(created.id);
      setCreateDialogOpen(false);
      toast({ title: "Đã thêm camera", description: `${newCam.name} đã được thêm.` });

      // Nghiệp vụ trạng thái phòng: phòng có camera -> "live"
      await setRoomStatus(values.roomId, "live");

      // Khởi tạo AI: emit video qua socket + hiển thị overlay 5s
      runAiInit(values.videoFile?.name ?? newCam.name, created.id);

      // Refresh dữ liệu sau khi thêm
      await fetchCameras();
    } catch (err) {
      console.error(err);
      toast({ title: "Không thể tạo camera" });
    }
  };

  const handleEditCamera = async (values: CameraFormValues) => {
    if (!editingCamera || !values.roomId) return;
    const room = rooms.find((r) => r.id === values.roomId);
    if (!room) return;

    const previousRoomId = editingCamera.roomId;
    const previousRoomStatus = rooms.find((r) => r.id === previousRoomId)?.roomStatus;
    const newVideo = values.videoFile ? URL.createObjectURL(values.videoFile) : editingCamera.video;

    try {
      // BACKEND CALL: PATCH /cameras/:id
      await camerasApi.update(editingCamera.id, {
        name: values.name.trim(),
        room_id: room.id,
        note: values.notes.trim(),
        video: newVideo,
      });

      // Nếu camera chuyển sang phòng KHÁC mà phòng cũ đang "ended" -> phòng cũ về "upcoming"
      if (previousRoomId !== room.id && previousRoomStatus === "ended") {
        await setRoomStatus(previousRoomId, "upcoming");
      }
      // Phòng mới có camera -> "live"
      await setRoomStatus(room.id, "live");

      setEditingCamera(null);
      toast({ title: "Đã cập nhật camera" });

      // Nếu có thay video thì khởi tạo lại AI
      if (values.videoFile) {
        runAiInit(values.videoFile.name, editingCamera.id);
      }

      // Refresh dữ liệu sau khi sửa
      await fetchCameras();
    } catch (err) {
      console.error(err);
      toast({ title: "Không thể cập nhật camera" });
    }
  };

  const handleDeleteRoom = async (cameraId: number) => {
    const cam = cameraList.find((c) => c.id === cameraId);
    try {
      // BACKEND CALL: DELETE /cameras/:id
      await camerasApi.remove(cameraId);
      setCameraList((prev) => prev.filter((c) => c.id !== cameraId));
      if (selectedCameraId === cameraId) setSelectedCameraId(null);
      // Phòng mất camera -> về "upcoming"
      if (cam) await setRoomStatus(cam.roomId, "upcoming");
      toast({ title: "Đã xóa camera" });
      await fetchCameras();
    } catch (err) {
      console.error(err);
      toast({ title: "Không thể xóa camera" });
    }
  };

  const handleExportRoom = (camera: CameraData) => {
    const linked = rooms.find((r) => r.id === camera.roomId);
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
      ["Trạng thái phòng", linked?.status ?? ""],
      ["Ghi chú", camera.notes ?? ""],
    ];
    const escape = (t: string) => t.replace(/"/g, '""');
    const csv = rows.map(([l, v]) => `"${escape(l)}","${escape(v)}"`).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${(camera.room || "camera").toLowerCase().replace(/\s+/g, "-")}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    toast({ title: "Đã xuất file" });
  };

  const editingRoomId = editingCamera?.roomId ?? null;

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
