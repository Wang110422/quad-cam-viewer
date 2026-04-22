import classroom1 from "@/assets/classroom1.jpg";
import classroom2 from "@/assets/classroom2.jpg";
import classroom3 from "@/assets/classroom3.jpg";
import classroom4 from "@/assets/classroom4.jpg";
import classroomVideo1 from "@/assets/videos/classroom1.mp4";
import classroomVideo2 from "@/assets/videos/classroom2.mp4";
import classroomVideo3 from "@/assets/videos/classroom3.mp4";
import classroomVideo4 from "@/assets/videos/classroom4.mp4";

export interface CameraData {
  id: number;
  name: string;
  room: string;
  className: string;
  students: number;
  present: number;
  absent: number;
  floor: string;
  building: string;
  supervisor: string;
  status: string;
  statusType?: "live" | "ended";
  startTime: string;
  endTime: string;
  image: string;
  video: string;
  notes?: string;
}

export const cameras: CameraData[] = [
  {
    id: 1,
    name: "CAM 01 - Phòng 101",
    room: "Phòng 101",
    className: "12A1",
    students: 30,
    present: 30,
    absent: 0,
    floor: "Tầng 1",
    building: "Nhà A",
    supervisor: "Nguyễn Văn A",
    status: "Đang hoạt động",
    statusType: "live",
    startTime: "24/05/2025 07:30",
    endTime: "24/05/2025 10:30",
    image: classroom1,
    video: classroomVideo1,
    notes: "Phòng thi khối A, camera chính hướng về toàn bộ lớp.",
  },
  {
    id: 2,
    name: "CAM 02 - Phòng 102",
    room: "Phòng 102",
    className: "12A2",
    students: 28,
    present: 28,
    absent: 0,
    floor: "Tầng 1",
    building: "Nhà A",
    supervisor: "Trần Thị B",
    status: "Đang hoạt động",
    statusType: "live",
    startTime: "24/05/2025 07:30",
    endTime: "24/05/2025 10:30",
    image: classroom2,
    video: classroomVideo2,
    notes: "Phòng thi có giám thị phụ trách theo dõi khu vực giữa lớp.",
  },
  {
    id: 3,
    name: "CAM 03 - Phòng 103",
    room: "Phòng 103",
    className: "12A3",
    students: 29,
    present: 29,
    absent: 0,
    floor: "Tầng 1",
    building: "Nhà A",
    supervisor: "Lê Văn C",
    status: "Đang hoạt động",
    statusType: "live",
    startTime: "24/05/2025 07:30",
    endTime: "24/05/2025 10:30",
    image: classroom3,
    video: classroomVideo3,
    notes: "Camera phục vụ theo dõi dãy bàn phía cửa sổ.",
  },
  {
    id: 4,
    name: "CAM 04 - Phòng 104",
    room: "Phòng 104",
    className: "12A4",
    students: 27,
    present: 27,
    absent: 0,
    floor: "Tầng 1",
    building: "Nhà B",
    supervisor: "Phạm Thị D",
    status: "Đang hoạt động",
    statusType: "live",
    startTime: "24/05/2025 07:30",
    endTime: "24/05/2025 10:30",
    image: classroom4,
    video: classroomVideo4,
    notes: "Phòng thi khu B, ưu tiên giám sát bàn đầu và cuối lớp.",
  },
];
