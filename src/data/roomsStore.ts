import { useEffect, useState } from "react";
import { roomsApi } from "@/api";
import { camerasApi } from "@/api/cameras.api";
import { mockCameras } from "@/data/mock/cameras.mock";
import type { Camera, Room, RoomStatus } from "@/types/models";

/**
 * View-model giữ tương thích với UI cũ. Khi backend thay đổi schema,
 * chỉ cần sửa hàm `toRoomData` bên dưới.
 */
export interface RoomData {
  id: number;
  name: string;          // tên camera (nếu có) hoặc tên phòng
  room: string;          // tên phòng — "Phòng 101"
  className: string;
  students: number;
  present: number;
  absent: number;
  floor: string;
  building: string;
  supervisor: string;
  status: string;        // label hiển thị
  statusType?: "live" | "ended";
  startTime: string;     // hiển thị dạng vi-VN
  endTime: string;
  image: string;
  video: string;
  notes?: string;
  roomStatus: RoomStatus;
}

export type RoomStatusType = RoomStatus;

const formatVN = (iso: string) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
  }).format(d);
};

const statusLabel: Record<RoomStatus, string> = {
  live: "Đang hoạt động",
  ended: "Đã kết thúc",
  upcoming: "Chưa diễn ra",
};

export const statusOrder: Record<RoomStatus, number> = { live: 0, ended: 1, upcoming: 2 };

const toRoomData = (room: Room, cam?: Camera): RoomData => ({
  id: room.id,
  name: cam?.name ?? room.name,
  room: room.name,
  className: room.class_name,
  students: room.total_students,
  present: room.present,
  absent: room.absent,
  floor: room.floor,
  building: room.building,
  supervisor: room.supervisor,
  status: statusLabel[room.status],
  statusType: room.status === "ended" ? "ended" : "live",
  startTime: formatVN(room.startTime),
  endTime: formatVN(room.endTime),
  image: "",
  video: cam?.video ?? "",
  notes: cam?.note,
  roomStatus: room.status,
});

let store: RoomData[] = [];
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

const refresh = async () => {
  const [rooms, cams] = await Promise.all([roomsApi.list(), camerasApi.list()]);
  const camById = new Map(cams.map((c) => [c.room_id, c]));
  store = rooms.map((r) => toRoomData(r, camById.get(r.id)));
  emit();
};

// Initial fetch
refresh().catch((err) => console.error("Failed to load rooms", err));

export const getRooms = () => store;

export const addRoom = async (data: Partial<RoomData> & { roomStatus: RoomStatus }) => {
  // Convert vi-VN datetime back if needed; the form đã dùng datetime-local nên giữ nguyên ISO khi gọi API.
  const created = await roomsApi.create({
    name: data.room ?? "Phòng mới",
    class_name: data.className ?? "",
    floor: data.floor ?? "",
    building: data.building ?? "",
    total_students: data.students ?? 0,
    present: data.present ?? 0,
    absent: data.absent ?? 0,
    status: data.roomStatus,
    startTime: data.startTime ?? new Date().toISOString(),
    endTime: data.endTime ?? new Date().toISOString(),
    cam_id: null,
    supervisor: data.supervisor ?? "",
  });
  store = [...store, toRoomData(created)];
  emit();
  return created;
};

export const updateRoom = async (id: number, patch: Partial<RoomData>) => {
  // Optimistic local patch
  store = store.map((r) => (r.id === id ? { ...r, ...patch } : r));
  emit();
  // Best-effort sync (mapping minimal fields)
  try {
    await roomsApi.update(id, {
      ...(patch.room && { name: patch.room }),
      ...(patch.className && { class_name: patch.className }),
      ...(patch.present !== undefined && { present: patch.present }),
      ...(patch.absent !== undefined && { absent: patch.absent }),
      ...(patch.roomStatus && { status: patch.roomStatus }),
    });
  } catch (err) {
    console.error("updateRoom failed", err);
  }
};

export const removeRoom = async (id: number) => {
  store = store.filter((r) => r.id !== id);
  emit();
  try {
    await roomsApi.remove(id);
  } catch (err) {
    console.error("removeRoom failed", err);
  }
};

export const useRoomsStore = (): RoomData[] => {
  const [, setTick] = useState(0);
  useEffect(() => {
    const fn = () => setTick((t) => t + 1);
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  }, []);
  return store;
};

// Re-export để các trang import từ đây nếu cần
export { mockCameras };
