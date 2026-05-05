// Legacy types — UI cũ import { violations, type Violation } từ đây.
// Data thật do backend cung cấp qua src/api/violations.api.ts.

export interface FrameLog {
  frame: number;          // alias của frameId
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

// Trang nào cần data thật phải gọi violationsApi.list() và map sang shape này.
export const violations: Violation[] = [];
