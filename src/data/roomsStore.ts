import { useEffect, useState } from "react";
import { roomsApi, camerasApi } from "@/api";
import type { Camera, Room, RoomStatus } from "@/types/models";
import type { RoomData, RoomStatusType } from "@/data/rooms";

export type { RoomData, RoomStatusType } from "@/data/rooms";
export { statusOrder } from "@/data/rooms";

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
  startTimeIso: room.startTime,
  endTimeIso: room.endTime,
  image: "",
  video: cam?.video ?? "",
  notes: cam?.note,
  roomStatus: room.status,
});

let store: RoomData[] = [];
let rawRooms: Room[] = [];
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

/**
 * BACKEND CALL: GET /rooms + GET /cameras
 * Tải lại toàn bộ danh sách phòng + camera, ghép thành view-model UI dùng.
 */
const refresh = async () => {
  const [roomsRes, cams] = await Promise.all([roomsApi.list(), camerasApi.list()]);
  rawRooms = roomsRes;
  const camById = new Map(cams.map((c) => [c.room_id, c]));
  store = roomsRes.map((r) => toRoomData(r, camById.get(r.id)));
  emit();
};

// Initial fetch
refresh().catch((err) => console.error("Failed to load rooms", err));

export const getRooms = () => store;
export const getRawRooms = () => rawRooms;

/**
 * Tạo phòng thi mới.
 * BACKEND CALL: POST /rooms { ... status: "upcoming" }
 * Theo nghiệp vụ: phòng mới luôn ở trạng thái "upcoming".
 */
export const addRoom = async (
  data: Omit<RoomData, "id" | "status" | "statusType" | "startTime" | "endTime" | "image" | "video" | "notes" | "name" | "room" | "startTimeIso" | "endTimeIso"> & {
    room: string;
    startTime: string; // ISO từ datetime-local
    endTime: string;
  },
) => {
  const created = await roomsApi.create({
    name: data.room,
    class_name: data.className,
    floor: data.floor,
    building: data.building,
    total_students: data.students,
    present: data.present,
    absent: data.absent,
    status: "upcoming", // mặc định khi tạo
    startTime: data.startTime,
    endTime: data.endTime,
    cam_id: null,
    supervisor: data.supervisor,
  });
  rawRooms = [...rawRooms, created];
  store = [...store, toRoomData(created)];
  emit();
  return created;
};

/**
 * Cập nhật phòng (sửa thông tin hoặc đổi status).
 * BACKEND CALL: PATCH /rooms/:id
 */
export const updateRoom = async (id: number, patch: Partial<RoomData> & { roomStatus?: RoomStatusType }) => {
  // Build payload đúng schema BE
  const payload: Partial<Room> = {
    ...(patch.room !== undefined && { name: patch.room }),
    ...(patch.className !== undefined && { class_name: patch.className }),
    ...(patch.floor !== undefined && { floor: patch.floor }),
    ...(patch.building !== undefined && { building: patch.building }),
    ...(patch.students !== undefined && { total_students: patch.students }),
    ...(patch.present !== undefined && { present: patch.present }),
    ...(patch.absent !== undefined && { absent: patch.absent }),
    ...(patch.supervisor !== undefined && { supervisor: patch.supervisor }),
    ...(patch.startTimeIso !== undefined && { startTime: patch.startTimeIso }),
    ...(patch.endTimeIso !== undefined && { endTime: patch.endTimeIso }),
    ...(patch.roomStatus && { status: patch.roomStatus }),
  };
  try {
    const updated = await roomsApi.update(id, payload);
    rawRooms = rawRooms.map((r) => (r.id === id ? updated : r));
    // Re-derive view-model giữ camera link
    await refresh();
  } catch (err) {
    console.error("updateRoom failed", err);
    throw err;
  }
};

/** BACKEND CALL: PATCH /rooms/:id chỉ đổi status (không refetch full list). */
export const setRoomStatus = async (id: number, status: RoomStatusType) => {
  try {
    await roomsApi.update(id, { status });
    rawRooms = rawRooms.map((r) => (r.id === id ? { ...r, status } : r));
    store = store.map((r) =>
      r.id === id
        ? {
            ...r,
            roomStatus: status,
            status: statusLabel[status],
            statusType: status === "ended" ? "ended" : "live",
          }
        : r,
    );
    emit();
  } catch (err) {
    console.error("setRoomStatus failed", err);
  }
};

/**
 * BACKEND CALL: DELETE /rooms/:id
 * Nghiệp vụ: KHÔNG xóa phòng đang diễn ra (status === "live").
 */
export const removeRoom = async (id: number) => {
  const target = rawRooms.find((r) => r.id === id);
  if (target?.status === "live") {
    throw new Error("Không thể xóa phòng thi đang diễn ra");
  }
  store = store.filter((r) => r.id !== id);
  rawRooms = rawRooms.filter((r) => r.id !== id);
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
