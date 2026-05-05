// Legacy types & empty list — UI cũ vẫn import từ đây.
// Data thật do backend cung cấp qua src/api/cameras.api.ts.
// Trang /pages/Index.tsx tự fetch danh sách camera khi mount (xem TODO comment ở đó).

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
  // KHÔNG có status — trạng thái thuộc về Room.
  startTime: string;
  endTime: string;
  image: string;
  video: string;
  notes?: string;
  /** room_id để FE biết camera thuộc phòng nào (đồng bộ trạng thái phòng) */
  roomId: number;
}

// Khởi tạo rỗng — backend sẽ trả về dữ liệu khi gọi camerasApi.list().
export const cameras: CameraData[] = [];
