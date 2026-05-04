// Legacy shim — UI cũ vẫn import từ đây.
// Dữ liệu thật giờ đến từ src/api/* (mock hoặc backend qua axios).
import { mockCameras } from "@/data/mock/cameras.mock";
import { mockRooms } from "@/data/mock/rooms.mock";
import classroom1 from "@/assets/classroom1.jpg";
import classroom2 from "@/assets/classroom2.jpg";
import classroom3 from "@/assets/classroom3.jpg";
import classroom4 from "@/assets/classroom4.jpg";

export interface CameraData {
  id: number;
  name: string;
  room: string;
  className: string;
  students: number;
  present: number;
  absent: number;
  floor: string;
  building: string;
  supervisor: string;
  status: string;
  statusType?: "live" | "ended";
  startTime: string;
  endTime: string;
  image: string;
  video: string;
  notes?: string;
}

const images = [classroom1, classroom2, classroom3, classroom4];

const formatVN = (iso: string) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? iso
    : new Intl.DateTimeFormat("vi-VN", {
        day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
      }).format(d);
};

export const cameras: CameraData[] = mockCameras.map((cam, i) => {
  const room = mockRooms.find((r) => r.id === cam.room_id)!;
  return {
    id: cam.id,
    name: cam.name,
    room: room.name,
    className: room.class_name,
    students: room.total_students,
    present: room.present,
    absent: room.absent,
    floor: room.floor,
    building: room.building,
    supervisor: room.supervisor,
    status: room.status === "ended" ? "Đã kết thúc" : "Đang hoạt động",
    statusType: room.status === "ended" ? "ended" : "live",
    startTime: formatVN(room.startTime),
    endTime: formatVN(room.endTime),
    image: images[i % images.length],
    video: cam.video,
    notes: cam.note,
  };
});
