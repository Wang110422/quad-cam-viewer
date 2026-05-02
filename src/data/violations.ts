import classroom1 from "@/assets/classroom1.jpg";
import classroom2 from "@/assets/classroom2.jpg";
import classroom3 from "@/assets/classroom3.jpg";

export interface Violation {
  id: number;
  studentId: string;
  studentName: string;
  className: string;
  room: string;
  floor: string;
  building: string;
  time: string; // ISO
  reason: string;
  image: string;
}

export const violations: Violation[] = [
  { id: 1, studentId: "SV001", studentName: "Nguyễn Minh Khang", className: "12A1", room: "Phòng 101", floor: "Tầng 1", building: "Nhà A", time: "2025-05-24T08:12:00", reason: "Sử dụng tài liệu", image: classroom1 },
  { id: 2, studentId: "SV014", studentName: "Trần Hà My", className: "12A1", room: "Phòng 101", floor: "Tầng 1", building: "Nhà A", time: "2025-05-24T08:45:00", reason: "Trao đổi bài", image: classroom2 },
  { id: 3, studentId: "SV021", studentName: "Lê Quốc Bảo", className: "12A3", room: "Phòng 103", floor: "Tầng 1", building: "Nhà A", time: "2025-05-24T09:05:00", reason: "Sử dụng điện thoại", image: classroom3 },
];
