// ============================================================================
// Domain models — khớp 1-1 với backend API
// ============================================================================

export type RoomStatus = "live" | "ended" | "upcoming";

/**
 * Room (phòng thi)
 *
 * BACKEND ENDPOINTS (gợi ý):
 *   GET    /rooms                 -> Room[]
 *   GET    /rooms/:id             -> Room (kèm violations? tuỳ)
 *   POST   /rooms                 -> Room  (body: Omit<Room, "id" | "violations">)
 *   PATCH  /rooms/:id             -> Room  (body: Partial<Room>)
 *   DELETE /rooms/:id             -> 204
 *   GET    /rooms/:id/violations  -> Violation[]
 *
 * Quan hệ:
 *   Room (1) — (1) Camera     qua cam_id
 *   Room (1) — (N) Violation  qua Violation.room_id
 */
export interface Room {
  id: number;
  name: string;            // VD: "Phòng 101"
  class_name: string;      // VD: "12A1"
  floor: string;           // VD: "Tầng 1"
  building: string;        // VD: "Nhà A"
  total_students: number;
  present: number;
  absent: number;
  status: RoomStatus;      // mặc định "upcoming" khi tạo mới
  startTime: string;       // ISO 8601
  endTime: string;         // ISO 8601
  cam_id: number | null;   // FK → Camera.id (1-1) — null khi chưa có cam
  supervisor: string;      // tên giám thị (rút gọn cho hiển thị)
  // Quan hệ 1-nhiều — backend có thể trả kèm hoặc fetch riêng:
  violations?: Violation[];
}

/**
 * Camera — KHÔNG có status. Trạng thái nằm trên Room.
 *
 * BACKEND ENDPOINTS (gợi ý):
 *   GET    /cameras               -> Camera[]   (BE nên hydrate `room` để FE đỡ join)
 *   GET    /cameras/:id           -> Camera
 *   POST   /cameras               -> Camera     (body: Omit<Camera, "id" | "room">)
 *   PATCH  /cameras/:id           -> Camera
 *   DELETE /cameras/:id           -> 204
 *   POST   /cameras/:id/video     -> { url }    (multipart/form-data field "video")
 */
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

/**
 * Violation (vi phạm)
 *
 * BACKEND ENDPOINTS (gợi ý):
 *   GET    /violations?room_id=   -> Violation[]
 *   GET    /violations/:id        -> Violation
 *   POST   /violations            -> Violation
 *   DELETE /violations/:id        -> 204
 *   GET    /violations/:id/frames -> FrameLog[]
 *   GET    /violations/:id/videos -> VideoLog[]
 */
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

/**
 * Supervisor (giám thị)
 *
 * BACKEND ENDPOINTS (gợi ý):
 *   GET    /supervisors           -> Supervisor[]
 *   POST   /supervisors           -> Supervisor
 *   DELETE /supervisors/:id       -> 204
 */
export interface Supervisor {
  id: number;
  name: string;
  email: string;
  phone: string;
  gender: "Nam" | "Nữ";
  dob: string;
  address: string;
  department: string;
  assignedRoom: string | null; // tên phòng VD "Phòng 101"
}
