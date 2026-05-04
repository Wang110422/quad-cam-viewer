import type { Camera } from "@/types/models";
import classroomVideo1 from "@/assets/videos/classroom1.mp4";
import classroomVideo2 from "@/assets/videos/classroom2.mp4";
import classroomVideo3 from "@/assets/videos/classroom3.mp4";
import classroomVideo4 from "@/assets/videos/classroom4.mp4";

export const mockCameras: Camera[] = [
  { id: 1, name: "CAM 01 - Phòng 101", room_id: 1, note: "Camera chính hướng về toàn bộ lớp.", video: classroomVideo1 },
  { id: 2, name: "CAM 02 - Phòng 102", room_id: 2, note: "Giám thị theo dõi khu vực giữa lớp.", video: classroomVideo2 },
  { id: 3, name: "CAM 03 - Phòng 103", room_id: 3, note: "Theo dõi dãy bàn phía cửa sổ.", video: classroomVideo3 },
  { id: 4, name: "CAM 04 - Phòng 104", room_id: 4, note: "Ưu tiên giám sát bàn đầu và cuối lớp.", video: classroomVideo4 },
];
