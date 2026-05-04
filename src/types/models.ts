// ============================================================================
// Domain models — khớp 1-1 với backend API
// ============================================================================

export type RoomStatus = "live" | "ended" | "upcoming";

/** Room (phòng thi) */
export interface Room {
  id: number;
  name: string;            // VD: "Phòng 101"
  class_name: string;      // VD: "12A1"
  floor: string;           // VD: "Tầng 1"
  building: string;        // VD: "Nhà A"
  total_students: number;
  present: number;
  absent: number;
  status: RoomStatus;
  startTime: string;       // ISO string
  endTime: string;         // ISO string
  cam_id: number | null;   // FK → Camera.id (1-1)
  supervisor: string;      // tên giám thị (rút gọn cho hiển thị)
  // Quan hệ 1-nhiều:
  violations?: Violation[];
}

/** Camera */
export interface Camera {
  id: number;
  name: string;
  room_id: number;         // FK → Room.id (1-1)
  note: string;
  video: string;           // url video
  // Hydrated client-side từ Room (không gửi khi POST):
  room?: Room;
}

/** FrameLog — một mốc frame trong vi phạm */
export interface FrameLog {
  frameId: number;
  behavior: string;
  confidence: number;      // 0..1
}

/** VideoLog — một đoạn video trong vi phạm */
export interface VideoLog {
  videoId: number;
  behavior: string;
  startTime: number;       // giây
  endTime: number;         // giây
}

/** Violation (vi phạm) */
export interface Violation {
  id: number;
  studentId: string;
  studentName: string;
  room_id: number;         // FK → Room.id (nhiều - 1)
  time: string;            // ISO
  reason: string;
  image: string;
  videoUrl: string;
  frameLogs: FrameLog[];
  videoLogs: VideoLog[];
  // Hydrated:
  room?: Room;
}
