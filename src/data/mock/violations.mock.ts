import type { Violation } from "@/types/models";
import classroom1 from "@/assets/classroom1.jpg";
import classroom2 from "@/assets/classroom2.jpg";
import classroom3 from "@/assets/classroom3.jpg";
import classroomVideo1 from "@/assets/videos/classroom1.mp4";
import classroomVideo2 from "@/assets/videos/classroom2.mp4";
import classroomVideo3 from "@/assets/videos/classroom3.mp4";

export const mockViolations: Violation[] = [
  {
    id: 1,
    studentId: "SV001",
    studentName: "Nguyễn Minh Khang",
    room_id: 1,
    time: "2025-05-24T08:12:00",
    reason: "Sử dụng tài liệu",
    image: classroom1,
    videoUrl: classroomVideo1,
    frameLogs: [
      { frameId: 60, behavior: "Cúi nhìn xuống bàn", confidence: 0.78 },
      { frameId: 120, behavior: "Lấy tài liệu từ ngăn bàn", confidence: 0.91 },
      { frameId: 180, behavior: "Đọc tài liệu trái phép", confidence: 0.95 },
      { frameId: 240, behavior: "Cất giấu tài liệu", confidence: 0.88 },
    ],
    videoLogs: [
      { videoId: 1, behavior: "Sử dụng tài liệu", startTime: 2, endTime: 8 },
    ],
  },
  {
    id: 2,
    studentId: "SV014",
    studentName: "Trần Hà My",
    room_id: 1,
    time: "2025-05-24T08:45:00",
    reason: "Trao đổi bài",
    image: classroom2,
    videoUrl: classroomVideo2,
    frameLogs: [
      { frameId: 30, behavior: "Quay đầu sang bên", confidence: 0.82 },
      { frameId: 90, behavior: "Thì thầm với bạn", confidence: 0.86 },
      { frameId: 150, behavior: "Trao đổi giấy tờ", confidence: 0.93 },
    ],
    videoLogs: [
      { videoId: 2, behavior: "Trao đổi bài", startTime: 1, endTime: 6 },
    ],
  },
  {
    id: 3,
    studentId: "SV021",
    studentName: "Lê Quốc Bảo",
    room_id: 3,
    time: "2025-05-24T09:05:00",
    reason: "Sử dụng điện thoại",
    image: classroom3,
    videoUrl: classroomVideo3,
    frameLogs: [
      { frameId: 0, behavior: "Tay cho vào túi", confidence: 0.74 },
      { frameId: 60, behavior: "Lấy điện thoại ra", confidence: 0.96 },
      { frameId: 120, behavior: "Sử dụng điện thoại", confidence: 0.97 },
    ],
    videoLogs: [
      { videoId: 3, behavior: "Sử dụng điện thoại", startTime: 0, endTime: 5 },
    ],
  },
];
