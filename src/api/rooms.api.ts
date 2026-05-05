import { apiClient } from "./client";
import type { Room, Violation } from "@/types/models";

/**
 * Rooms API — gọi axios thuần, không có mock.
 *
 * Hợp đồng dữ liệu mong đợi từ backend xem trong src/types/models.ts (Room).
 */
export const roomsApi = {
  /**
   * GET /rooms
   * Backend trả về toàn bộ phòng thi.
   * Response: Room[]
   * Lưu ý: nên trả luôn `cam_id` để FE có thể join với /cameras.
   */
  list: async (): Promise<Room[]> => {
    const { data } = await apiClient.get<Room[]>("/rooms");
    return data;
  },

  /**
   * GET /rooms/:id
   * Lấy chi tiết một phòng thi theo id.
   * Response: Room  (có thể kèm `violations` đã hydrate)
   */
  get: async (id: number): Promise<Room> => {
    const { data } = await apiClient.get<Room>(`/rooms/${id}`);
    return data;
  },

  /**
   * GET /rooms/:id/violations
   * Quan hệ 1-N: trả về toàn bộ vi phạm thuộc phòng này.
   * Response: Violation[]
   */
  listViolations: async (roomId: number): Promise<Violation[]> => {
    const { data } = await apiClient.get<Violation[]>(`/rooms/${roomId}/violations`);
    return data;
  },

  /**
   * POST /rooms
   * Tạo phòng mới. FE luôn gửi status="upcoming" cho phòng vừa tạo.
   * Body: Omit<Room, "id" | "violations">
   * Response: Room (đã có id)
   */
  create: async (payload: Omit<Room, "id" | "violations">): Promise<Room> => {
    const { data } = await apiClient.post<Room>("/rooms", payload);
    return data;
  },

  /**
   * PATCH /rooms/:id
   * Cập nhật một phần thông tin phòng. FE dùng cho cả "sửa phòng" và
   * "đổi trạng thái" (live/ended/upcoming) khi camera được gắn / video phát hết.
   * Body: Partial<Room>
   * Response: Room
   */
  update: async (id: number, patch: Partial<Room>): Promise<Room> => {
    const { data } = await apiClient.patch<Room>(`/rooms/${id}`, patch);
    return data;
  },

  /**
   * DELETE /rooms/:id
   * Xóa phòng. Backend nên xử lý cascade hoặc trả 409 nếu phòng còn camera/violation.
   */
  remove: async (id: number): Promise<void> => {
    await apiClient.delete(`/rooms/${id}`);
  },
};
