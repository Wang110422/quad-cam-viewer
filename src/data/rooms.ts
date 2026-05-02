import { cameras, type CameraData } from "@/data/cameras";

export type RoomStatusType = "live" | "ended" | "upcoming";

export interface RoomData extends CameraData {
  roomStatus: RoomStatusType;
}

const extra: RoomData[] = [
  {
    id: 101,
    name: "CAM 05 - Phòng 201",
    room: "Phòng 201",
    className: "12B1",
    students: 30,
    present: 0,
    absent: 0,
    floor: "Tầng 2",
    building: "Nhà A",
    supervisor: "Hoàng Văn E",
    status: "Chưa diễn ra",
    statusType: "live",
    startTime: "24/05/2025 13:30",
    endTime: "24/05/2025 16:30",
    image: cameras[0].image,
    video: "",
    roomStatus: "upcoming",
  },
  {
    id: 102,
    name: "CAM 06 - Phòng 202",
    room: "Phòng 202",
    className: "12B2",
    students: 28,
    present: 0,
    absent: 0,
    floor: "Tầng 2",
    building: "Nhà A",
    supervisor: "Đỗ Thị F",
    status: "Đã kết thúc",
    statusType: "ended",
    startTime: "24/05/2025 06:30",
    endTime: "24/05/2025 09:00",
    image: cameras[1].image,
    video: "",
    roomStatus: "ended",
  },
];

export const rooms: RoomData[] = [
  ...cameras.map<RoomData>((c) => ({ ...c, roomStatus: "live" })),
  ...extra,
];

export const statusOrder: Record<RoomStatusType, number> = { live: 0, ended: 1, upcoming: 2 };
