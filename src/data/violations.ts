// Legacy shim — UI cũ vẫn import { violations, type Violation } từ đây.
// Map từ mock + thêm các field UI cũ kỳ vọng (room/className/floor/building/videoStart/videoEnd/frame.timestamp).
import { mockViolations } from "@/data/mock/violations.mock";
import { mockRooms } from "@/data/mock/rooms.mock";

export interface FrameLog {
  frame: number;          // alias của frameId (giữ tương thích)
  timestamp: string;      // mm:ss derived từ frameId / 30fps
  behavior: string;
  confidence: number;
}

export interface Violation {
  id: number;
  studentId: string;
  studentName: string;
  className: string;
  room: string;
  floor: string;
  building: string;
  time: string;
  reason: string;
  image: string;
  videoUrl: string;
  videoStart: number;
  videoEnd: number;
  frameLogs: FrameLog[];
}

const fmtTs = (frameId: number) => {
  const totalSec = Math.floor(frameId / 30);
  const m = String(Math.floor(totalSec / 60)).padStart(2, "0");
  const s = String(totalSec % 60).padStart(2, "0");
  return `${m}:${s}`;
};

export const violations: Violation[] = mockViolations.map((v) => {
  const room = mockRooms.find((r) => r.id === v.room_id);
  const firstClip = v.videoLogs[0];
  return {
    id: v.id,
    studentId: v.studentId,
    studentName: v.studentName,
    className: room?.class_name ?? "",
    room: room?.name ?? "",
    floor: room?.floor ?? "",
    building: room?.building ?? "",
    time: v.time,
    reason: v.reason,
    image: v.image,
    videoUrl: v.videoUrl,
    videoStart: firstClip?.startTime ?? 0,
    videoEnd: firstClip?.endTime ?? 0,
    frameLogs: v.frameLogs.map((f) => ({
      frame: f.frameId,
      timestamp: fmtTs(f.frameId),
      behavior: f.behavior,
      confidence: f.confidence,
    })),
  };
});
