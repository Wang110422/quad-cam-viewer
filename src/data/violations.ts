import classroom1 from "@/assets/classroom1.jpg";
import classroom2 from "@/assets/classroom2.jpg";
import classroom3 from "@/assets/classroom3.jpg";
import classroomVideo1 from "@/assets/videos/classroom1.mp4";
import classroomVideo2 from "@/assets/videos/classroom2.mp4";
import classroomVideo3 from "@/assets/videos/classroom3.mp4";

export interface FrameLog {
  frame: number;
  timestamp: string; // mm:ss
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
  time: string; // ISO of incident
  reason: string;
  image: string;
  videoUrl: string;
  videoStart: number; // seconds
  videoEnd: number;
  frameLogs: FrameLog[];
}

export const violations: Violation[] = [
  {
    id: 1,
    studentId: "SV001",
    studentName: "Nguyễn Minh Khang",
    className: "12A1",
    room: "Phòng 101",
    floor: "Tầng 1",
    building: "Nhà A",
    time: "2025-05-24T08:12:00",
    reason: "Sử dụng tài liệu",
    image: classroom1,
    videoUrl: classroomVideo1,
    videoStart: 2,
    videoEnd: 8,
    frameLogs: [
      { frame: 60, timestamp: "00:02", behavior: "Cúi nhìn xuống bàn", confidence: 0.78 },
      { frame: 120, timestamp: "00:04", behavior: "Lấy tài liệu từ ngăn bàn", confidence: 0.91 },
      { frame: 180, timestamp: "00:06", behavior: "Đọc tài liệu trái phép", confidence: 0.95 },
      { frame: 240, timestamp: "00:08", behavior: "Cất giấu tài liệu", confidence: 0.88 },
    ],
  },
  {
    id: 2,
    studentId: "SV014",
    studentName: "Trần Hà My",
    className: "12A1",
    room: "Phòng 101",
    floor: "Tầng 1",
    building: "Nhà A",
    time: "2025-05-24T08:45:00",
    reason: "Trao đổi bài",
    image: classroom2,
    videoUrl: classroomVideo2,
    videoStart: 1,
    videoEnd: 6,
    frameLogs: [
      { frame: 30, timestamp: "00:01", behavior: "Quay đầu sang bên", confidence: 0.82 },
      { frame: 90, timestamp: "00:03", behavior: "Thì thầm với bạn", confidence: 0.86 },
      { frame: 150, timestamp: "00:05", behavior: "Trao đổi giấy tờ", confidence: 0.93 },
    ],
  },
  {
    id: 3,
    studentId: "SV021",
    studentName: "Lê Quốc Bảo",
    className: "12A3",
    room: "Phòng 103",
    floor: "Tầng 1",
    building: "Nhà A",
    time: "2025-05-24T09:05:00",
    reason: "Sử dụng điện thoại",
    image: classroom3,
    videoUrl: classroomVideo3,
    videoStart: 0,
    videoEnd: 5,
    frameLogs: [
      { frame: 0, timestamp: "00:00", behavior: "Tay cho vào túi", confidence: 0.74 },
      { frame: 60, timestamp: "00:02", behavior: "Lấy điện thoại ra", confidence: 0.96 },
      { frame: 120, timestamp: "00:04", behavior: "Sử dụng điện thoại", confidence: 0.97 },
    ],
  },
];
