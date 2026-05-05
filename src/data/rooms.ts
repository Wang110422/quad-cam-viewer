// Legacy types — dùng lại bởi RoomsPage / StatisticsPage / ReportsPage.
// Dữ liệu thật đến từ src/data/roomsStore.ts (gọi roomsApi qua axios).

export type RoomStatusType = "live" | "ended" | "upcoming";

export interface RoomData {
  id: number;
  name: string;          // tên camera (nếu có) hoặc tên phòng
  room: string;          // tên phòng — VD "Phòng 101"
  className: string;
  students: number;
  present: number;
  absent: number;
  floor: string;
  building: string;
  supervisor: string;
  status: string;        // label hiển thị (vi-VN)
  statusType?: "live" | "ended";
  startTime: string;     // hiển thị dạng vi-VN
  endTime: string;
  startTimeIso: string;  // ISO gốc, dùng cho form sửa phòng
  endTimeIso: string;
  image: string;
  video: string;
  notes?: string;
  roomStatus: RoomStatusType;
}

export const statusOrder: Record<RoomStatusType, number> = { live: 0, ended: 1, upcoming: 2 };

// Snapshot tĩnh không còn dùng — giữ export để các import cũ không vỡ.
export const rooms: RoomData[] = [];
