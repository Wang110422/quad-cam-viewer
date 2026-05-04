// Legacy shim — đọc qua mock; production sẽ thay bằng API.
import { mockRooms } from "@/data/mock/rooms.mock";
import { cameras, type CameraData } from "@/data/cameras";

export type RoomStatusType = "live" | "ended" | "upcoming";

export interface RoomData extends CameraData {
  roomStatus: RoomStatusType;
}

const formatVN = (iso: string) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? iso
    : new Intl.DateTimeFormat("vi-VN", {
        day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
      }).format(d);
};

export const rooms: RoomData[] = mockRooms.map((r) => {
  const cam = cameras.find((c) => c.room === r.name);
  return {
    id: r.id,
    name: cam?.name ?? r.name,
    room: r.name,
    className: r.class_name,
    students: r.total_students,
    present: r.present,
    absent: r.absent,
    floor: r.floor,
    building: r.building,
    supervisor: r.supervisor,
    status: r.status === "ended" ? "Đã kết thúc" : r.status === "upcoming" ? "Chưa diễn ra" : "Đang hoạt động",
    statusType: r.status === "ended" ? "ended" : "live",
    startTime: formatVN(r.startTime),
    endTime: formatVN(r.endTime),
    image: cam?.image ?? "",
    video: cam?.video ?? "",
    notes: cam?.notes,
    roomStatus: r.status,
  };
});

export const statusOrder: Record<RoomStatusType, number> = { live: 0, ended: 1, upcoming: 2 };
